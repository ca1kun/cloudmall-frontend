<template>
  <div class="coupon-page">
    <section class="coupon-hero">
      <div>
        <span class="hero-kicker">COUPON CENTER</span>
        <h1>优惠券中心</h1>
        <p>领取专属优惠，结算时自动选择可用优惠券。</p>
      </div>
      <div class="hero-summary">
        <div>
          <strong>{{ list.length }}</strong>
          <span>可领活动</span>
        </div>
        <div>
          <strong>{{ myList.length }}</strong>
          <span>我的券包</span>
        </div>
      </div>
    </section>

    <el-card class="coupon-shell" shadow="never">
      <el-tabs v-model="activeTab" class="coupon-tabs" @tab-click="handleTabClick">
        <el-tab-pane name="center">
          <template #label>
            <span class="tab-label">领券中心 <em>{{ list.length }}</em></span>
          </template>

          <el-alert class="coupon-alert" title="领取成功后，可在订单结算页选择符合条件的优惠券" type="success" :closable="false" show-icon />

          <div v-loading="centerLoading" class="coupon-grid">
            <article v-for="item in list" :key="getCouponId(item)" class="coupon-card"
              :class="{ disabled: isCouponUnavailable(item) }">
              <div class="coupon-value">
                <div class="amount"><small>¥</small>{{ formatAmount(item.amount) }}</div>
                <span>{{ formatThreshold(item.minPoint) }}</span>
              </div>

              <div class="coupon-content">
                <div class="coupon-heading">
                  <div>
                    <h3 :title="item.name">{{ item.name }}</h3>
                    <span class="scope-tag">商城优惠券</span>
                  </div>
                  <el-tag :type="getCenterStatus(item).type" effect="light" round>
                    {{ getCenterStatus(item).label }}
                  </el-tag>
                </div>

                <div class="coupon-time">
                  <el-icon>
                    <Calendar />
                  </el-icon>
                  <span>{{ formatDateTime(item.startTime) }}</span>
                  <i>至</i>
                  <span>{{ formatDateTime(item.endTime) }}</span>
                </div>

                <div class="coupon-footer">
                  <div class="stock">
                    <el-progress :percentage="calcPercentage(item)" :show-text="false" :stroke-width="6"
                      status="exception" />
                    <span>剩余 {{ item.count }} 张</span>
                  </div>
                  <el-button :type="getBtnType(item)" :loading="loading[getCouponId(item)]"
                    :disabled="isCouponUnavailable(item)" round @click="handleReceive(item)">
                    {{ getBtnText(item) }}
                  </el-button>
                </div>
              </div>
            </article>
          </div>

          <el-empty v-if="!centerLoading && list.length === 0" class="coupon-empty" description="暂无可领取的优惠券" />
        </el-tab-pane>

        <el-tab-pane name="mine">
          <template #label>
            <span class="tab-label">我的优惠券 <em>{{ myList.length }}</em></span>
          </template>

          <div v-loading="mineLoading" class="coupon-grid">
            <article v-for="item in myList" :key="item.id ?? item.couponId" class="coupon-card mine-card"
              :class="{ disabled: getMyStatus(item).key !== 'available' }">
              <div class="coupon-value">
                <div class="amount"><small>¥</small>{{ formatAmount(item.amount) }}</div>
                <span>{{ formatThreshold(item.minPoint) }}</span>
              </div>

              <div class="coupon-content">
                <div class="coupon-heading">
                  <div>
                    <h3 :title="item.name">{{ item.name }}</h3>
                    <span class="scope-tag">已放入券包</span>
                  </div>
                  <el-tag :type="getMyStatus(item).type" effect="light" round>
                    {{ getMyStatus(item).label }}
                  </el-tag>
                </div>

                <div class="coupon-time">
                  <el-icon>
                    <Calendar />
                  </el-icon>
                  <span>{{ formatDateTime(item.startTime) }}</span>
                  <i>至</i>
                  <span>{{ formatDateTime(item.endTime) }}</span>
                </div>

                <div class="coupon-footer mine-footer">
                  <span class="usage-tip">{{ getUsageTip(item) }}</span>
                  <el-button v-if="getMyStatus(item).key === 'available'" type="primary" round
                    @click="router.push('/mall/home')">
                    去使用
                  </el-button>
                </div>
              </div>
            </article>
          </div>

          <el-empty v-if="!mineLoading && myList.length === 0" class="coupon-empty" description="券包还是空的，去领一张吧" />
        </el-tab-pane>
      </el-tabs>
    </el-card>
  </div>
</template>

<script setup lang="ts">
import { onMounted, ref } from 'vue'
import { useRouter } from 'vue-router'
import { Calendar } from '@element-plus/icons-vue'
import { ElMessage, type TabsPaneContext } from 'element-plus'
import { getCouponListApi, getMyCouponIdsApi, receiveCouponApi } from '@/api/mall/coupon'
import { useUserStore } from '@/stores/user'
import type { Coupon, UserCouponRecord } from '@/types/types'

type CouponViewStatus = {
  key: 'pending' | 'active' | 'received' | 'empty' | 'expired' | 'available' | 'used'
  label: string
  type: 'success' | 'warning' | 'info' | 'danger'
}

const router = useRouter()
const userStore = useUserStore()
const activeTab = ref('center')
const list = ref<Coupon[]>([])
const myList = ref<UserCouponRecord[]>([])
const myCouponSet = ref(new Set<number>())
const loading = ref<Record<number, boolean>>({})
const centerLoading = ref(false)
const mineLoading = ref(false)

const getCouponId = (item: Coupon) => item.id ?? item.couponId ?? 0

const normalizeTime = (time: string) => {
  if (!time) return ''
  return time
    .replace('T', ' ')
    .replace(/\.\d+/, '')
    .replace(/Z$/, '')
    .replace(/[+-]\d{2}:\d{2}$/, '')
    .trim()
}

const parseTime = (time: string) => {
  const matched = normalizeTime(time).match(
    /^(\d{4})-(\d{1,2})-(\d{1,2})[ T](\d{1,2}):(\d{1,2})(?::(\d{1,2}))?/
  )
  if (!matched) return Number.NaN

  const [, year, month, day, hour, minute, second = '0'] = matched
  return new Date(
    Number(year),
    Number(month) - 1,
    Number(day),
    Number(hour),
    Number(minute),
    Number(second)
  ).getTime()
}

const formatDateTime = (time: string) => {
  const normalized = normalizeTime(time)
  const matched = normalized.match(
    /^(\d{4})-(\d{1,2})-(\d{1,2})[ T](\d{1,2}):(\d{1,2})/
  )
  if (!matched) return normalized || '-'

  const [, year = '', month = '', day = '', hour = '', minute = ''] = matched
  const pad = (value: string) => value.padStart(2, '0')
  return `${year}.${pad(month)}.${pad(day)} ${pad(hour)}:${pad(minute)}`
}

const formatAmount = (amount: number) => {
  const value = Number(amount || 0)
  return Number.isInteger(value) ? String(value) : value.toFixed(2)
}

const formatThreshold = (minPoint: number) =>
  Number(minPoint) > 0 ? `满 ¥${formatAmount(minPoint)} 可用` : '无门槛'

const calcPercentage = (item: Coupon) => {
  const remaining = Math.max(Number(item.count || 0), 0)
  const estimatedTotal = Math.max(remaining + 10, 1)
  return Math.min(100, Math.round(((estimatedTotal - remaining) / estimatedTotal) * 100))
}

const isReceived = (id: number) => myCouponSet.value.has(id)

const getCenterStatus = (item: Coupon): CouponViewStatus => {
  const couponId = getCouponId(item)
  if (isReceived(couponId)) {
    return { key: 'received', label: '已领取', type: 'info' }
  }
  if (item.count <= 0) {
    return { key: 'empty', label: '已抢光', type: 'danger' }
  }

  const now = Date.now()
  const start = parseTime(item.startTime)
  const end = parseTime(item.endTime)
  if (Number.isFinite(start) && now < start) {
    return { key: 'pending', label: '未开始', type: 'warning' }
  }
  if (Number.isFinite(end) && now > end) {
    return { key: 'expired', label: '已过期', type: 'info' }
  }
  return { key: 'active', label: '领取中', type: 'success' }
}

const getMyStatus = (item: UserCouponRecord): CouponViewStatus => {
  if (item.useStatus === 1) {
    return { key: 'used', label: '已使用', type: 'info' }
  }

  const now = Date.now()
  const start = parseTime(item.startTime)
  const end = parseTime(item.endTime)
  if (Number.isFinite(end) && now > end) {
    return { key: 'expired', label: '已过期', type: 'danger' }
  }
  if (Number.isFinite(start) && now < start) {
    return { key: 'pending', label: '未生效', type: 'warning' }
  }
  return { key: 'available', label: '可使用', type: 'success' }
}

const isCouponUnavailable = (item: Coupon) => getCenterStatus(item).key !== 'active'

const getBtnText = (item: Coupon) => {
  const status = getCenterStatus(item)
  const textMap: Record<CouponViewStatus['key'], string> = {
    active: '立即领取',
    received: '已领取',
    empty: '已抢光',
    pending: '未开始',
    expired: '已过期',
    available: '立即领取',
    used: '已使用'
  }
  return textMap[status.key]
}

const getBtnType = (item: Coupon) => getCenterStatus(item).key === 'active' ? 'danger' : 'info'

const getUsageTip = (item: UserCouponRecord) => {
  const status = getMyStatus(item).key
  if (status === 'used') return '该优惠券已经使用'
  if (status === 'expired') return '该优惠券已超过有效期'
  if (status === 'pending') return `将于 ${formatDateTime(item.startTime)} 生效`
  return formatThreshold(item.minPoint)
}

const fetchReceivedCoupons = async () => {
  if (!userStore.token) {
    myCouponSet.value = new Set()
    return
  }

  const res = await getMyCouponIdsApi()
  if (res.code === 200) {
    myCouponSet.value = new Set((res.data || []).map(item => item.couponId))
  }
}

const fetchList = async () => {
  centerLoading.value = true
  try {
    const res = await getCouponListApi()
    if (res.code === 200) {
      list.value = res.data || []
      await fetchReceivedCoupons()
    } else {
      ElMessage.error(res.message || '优惠券加载失败')
    }
  } catch {
    ElMessage.error('优惠券加载失败')
  } finally {
    centerLoading.value = false
  }
}

const fetchMyList = async () => {
  if (!userStore.token) {
    myList.value = []
    ElMessage.warning('登录后才能查看券包')
    return
  }

  mineLoading.value = true
  try {
    const res = await getMyCouponIdsApi()
    if (res.code === 200) {
      myList.value = res.data || []
      myCouponSet.value = new Set(myList.value.map(item => item.couponId))
    } else {
      ElMessage.error(res.message || '券包加载失败')
    }
  } catch {
    ElMessage.error('券包加载失败')
  } finally {
    mineLoading.value = false
  }
}

const handleReceive = async (item: Coupon) => {
  if (!userStore.token) {
    ElMessage.warning('请先登录后领取')
    router.push('/login')
    return
  }

  const couponId = getCouponId(item)
  if (!couponId || loading.value[couponId]) return

  loading.value[couponId] = true
  try {
    const res = await receiveCouponApi(couponId)
    if (res.code === 200) {
      ElMessage.success('领取成功，已放入券包')
      myCouponSet.value.add(couponId)
      item.count = Math.max(0, item.count - 1)
    } else {
      ElMessage.error(res.message || '领取失败')
    }
  } catch {
    ElMessage.error('领取失败，请稍后重试')
  } finally {
    loading.value[couponId] = false
  }
}

const handleTabClick = (tab: TabsPaneContext) => {
  if (tab.paneName === 'mine') {
    fetchMyList()
  } else {
    fetchList()
  }
}

onMounted(fetchList)
</script>

<style scoped>
.coupon-page {
  width: min(1240px, calc(100% - 40px));
  margin: 24px auto 40px;
}

.coupon-hero {
  position: relative;
  display: flex;
  overflow: hidden;
  min-height: 170px;
  align-items: center;
  justify-content: space-between;
  gap: 30px;
  margin-bottom: 18px;
  padding: 32px 40px;
  border-radius: 22px;
  background:
    radial-gradient(circle at 82% 20%, rgb(255 255 255 / 22%) 0, transparent 25%),
    linear-gradient(135deg, #ff566d 0%, #ff7557 50%, #ff9a4d 100%);
  color: #fff;
  box-shadow: 0 18px 45px rgb(239 68 68 / 18%);
}

.coupon-hero::after {
  position: absolute;
  right: 25%;
  bottom: -90px;
  width: 210px;
  height: 210px;
  border: 38px solid rgb(255 255 255 / 9%);
  border-radius: 50%;
  content: '';
}

.coupon-hero>* {
  position: relative;
  z-index: 1;
}

.hero-kicker {
  font-size: 11px;
  font-weight: 700;
  letter-spacing: 2px;
  opacity: 0.75;
}

.coupon-hero h1 {
  margin: 8px 0;
  font-size: 30px;
}

.coupon-hero p {
  margin: 0;
  opacity: 0.85;
}

.hero-summary {
  display: flex;
  gap: 12px;
}

.hero-summary div {
  display: grid;
  min-width: 110px;
  gap: 4px;
  padding: 15px 18px;
  border: 1px solid rgb(255 255 255 / 22%);
  border-radius: 14px;
  background: rgb(255 255 255 / 12%);
  text-align: center;
  backdrop-filter: blur(8px);
}

.hero-summary strong {
  font-size: 24px;
}

.hero-summary span {
  font-size: 12px;
  opacity: 0.8;
}

.coupon-shell {
  border: 1px solid var(--app-border);
  border-radius: 20px;
  background: linear-gradient(180deg, var(--app-surface), var(--app-surface-soft));
}

.coupon-tabs :deep(.el-tabs__header) {
  margin-bottom: 20px;
}

.coupon-tabs :deep(.el-tabs__item) {
  height: 48px;
  color: var(--app-text-muted);
  font-weight: 600;
}

.coupon-tabs :deep(.el-tabs__item.is-active) {
  color: var(--app-primary);
}

.tab-label em {
  display: inline-flex;
  min-width: 20px;
  height: 20px;
  align-items: center;
  justify-content: center;
  margin-left: 5px;
  padding: 0 6px;
  border-radius: 10px;
  background: var(--app-surface-muted);
  font-size: 11px;
  font-style: normal;
}

.coupon-alert {
  margin-bottom: 20px;
}

.coupon-alert :deep(.el-alert__title) {
  color: var(--app-text);
}

.coupon-grid {
  display: grid;
  min-height: 180px;
  grid-template-columns: repeat(2, minmax(0, 1fr));
  gap: 18px;
}

.coupon-card {
  position: relative;
  display: grid;
  overflow: hidden;
  min-width: 0;
  grid-template-columns: 150px minmax(0, 1fr);
  border: 1px solid var(--app-border);
  border-radius: 16px;
  background: var(--app-surface);
  box-shadow: var(--app-shadow-sm);
  transition: transform 0.2s ease, box-shadow 0.2s ease;
}

.coupon-card::before,
.coupon-card::after {
  position: absolute;
  left: 138px;
  z-index: 2;
  width: 22px;
  height: 22px;
  border: 1px solid var(--app-border);
  border-radius: 50%;
  background: var(--app-surface-soft);
  content: '';
}

.coupon-card::before {
  top: -12px;
}

.coupon-card::after {
  bottom: -12px;
}

.coupon-card:hover {
  transform: translateY(-2px);
  box-shadow: var(--app-shadow-md);
}

.coupon-value {
  display: flex;
  min-height: 180px;
  align-items: center;
  justify-content: center;
  flex-direction: column;
  padding: 20px 14px;
  border-right: 1px dashed rgb(255 255 255 / 60%);
  background: linear-gradient(145deg, #ff5f6d, #ff8a55);
  color: #fff;
  text-align: center;
}

.amount {
  font-size: 38px;
  font-weight: 800;
  line-height: 1;
}

.amount small {
  margin-right: 2px;
  font-size: 17px;
}

.coupon-value>span {
  margin-top: 10px;
  font-size: 12px;
  opacity: 0.9;
}

.coupon-content {
  display: flex;
  min-width: 0;
  flex-direction: column;
  justify-content: space-between;
  gap: 15px;
  padding: 20px;
}

.coupon-heading,
.coupon-footer {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 14px;
}

.coupon-heading>div {
  min-width: 0;
}

.coupon-heading h3 {
  overflow: hidden;
  margin: 0 0 7px;
  color: var(--app-text);
  font-size: 17px;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.scope-tag {
  color: var(--app-text-muted);
  font-size: 12px;
}

.coupon-time {
  display: flex;
  align-items: center;
  gap: 6px;
  color: var(--app-text-muted);
  font-size: 12px;
  white-space: nowrap;
}

.coupon-time i {
  font-style: normal;
  opacity: 0.6;
}

.stock {
  display: grid;
  width: min(180px, 55%);
  gap: 5px;
}

.stock span,
.usage-tip {
  color: var(--app-text-muted);
  font-size: 12px;
}

.coupon-card.disabled {
  box-shadow: none;
  opacity: 0.68;
}

.coupon-card.disabled .coupon-value {
  background: linear-gradient(145deg, #94a3b8, #64748b);
}

.coupon-card.disabled:hover {
  transform: none;
}

.mine-card .coupon-value {
  background: linear-gradient(145deg, #5b73f2, #7c5ce7);
}

.mine-card.disabled .coupon-value {
  background: linear-gradient(145deg, #94a3b8, #64748b);
}

.coupon-empty {
  padding: 30px 0;
}

@media (max-width: 960px) {
  .coupon-grid {
    grid-template-columns: 1fr;
  }
}

@media (max-width: 680px) {
  .coupon-page {
    width: calc(100% - 24px);
    margin-top: 12px;
  }

  .coupon-hero {
    align-items: flex-start;
    flex-direction: column;
    padding: 25px 22px;
  }

  .hero-summary {
    width: 100%;
  }

  .hero-summary div {
    min-width: 0;
    flex: 1;
  }

  .coupon-shell :deep(.el-card__body) {
    padding: 14px;
  }

  .coupon-card {
    grid-template-columns: 105px minmax(0, 1fr);
  }

  .coupon-card::before,
  .coupon-card::after {
    left: 94px;
  }

  .coupon-value {
    min-height: 205px;
  }

  .amount {
    font-size: 30px;
  }

  .coupon-content {
    padding: 16px 14px;
  }

  .coupon-heading,
  .coupon-footer {
    align-items: flex-start;
    flex-direction: column;
  }

  .coupon-time {
    align-items: flex-start;
    flex-wrap: wrap;
    white-space: normal;
  }

  .stock {
    width: 100%;
  }

  .coupon-footer :deep(.el-button) {
    width: 100%;
  }
}
</style>
