<template>
  <div class="coupon-container">
    <el-card class="coupon-shell" shadow="never">
      <el-tabs class="coupon-tabs" v-model="activeTab" @tab-click="handleTabClick">

        <!-- Tab 1: 领券中心 -->
        <el-tab-pane label="领券中心" name="center">
          <div class="tip-bar">
            <el-alert class="coupon-alert" title="抢到的优惠券可在结算页使用哦~" type="success" :closable="false" show-icon />
          </div>

          <el-row :gutter="20" class="coupon-grid">
            <el-col :span="6" :xs="24" :sm="12" :md="8" :lg="6" v-for="item in list" :key="item.id">
              <div class="coupon-card" :class="{ 'disabled': isReceived(getCouponId(item)) || item.count <= 0 }">
                <div class="left-part">
                  <div class="amount">¥<span>{{ item.amount }}</span></div>
                  <div class="limit">{{ item.minPoint > 0 ? `满${item.minPoint}可用` : '无门槛' }}</div>
                </div>
                <div class="right-part">
                  <div class="name" :title="item.name">{{ item.name }}</div>
                  <div class="time">{{ formatTime(item.endTime) }} 到期</div>
                  <div class="stock-bar">
                    <el-progress :percentage="calcPercentage(item)" :show-text="false" status="exception" />
                    <span class="stock-text">剩 {{ item.count }} 张</span>
                  </div>
                  <el-button :type="getBtnType(item)" size="small" :loading="loading[getCouponId(item)]"
                    :disabled="isReceived(getCouponId(item)) || item.count <= 0" @click="handleReceive(item)" class="action-btn">
                    {{ getBtnText(item) }}
                  </el-button>
                </div>
              </div>
            </el-col>
          </el-row>
          <el-empty v-if="list.length === 0" class="coupon-empty" description="暂无优惠券活动" />
        </el-tab-pane>

        <!-- Tab 2: 我的优惠券 -->
        <el-tab-pane label="我的优惠券" name="mine">
          <el-row :gutter="20" class="coupon-grid">
            <el-col :span="6" :xs="24" :sm="12" :md="8" :lg="6" v-for="item in myList" :key="item.id">
              <div class="coupon-card" :class="{ 'used': item.useStatus === 1 }">
                <div class="left-part">
                  <div class="amount">¥<span>{{ item.amount }}</span></div>
                  <div class="limit">{{ item.minPoint > 0 ? `满${item.minPoint}可用` : '无门槛' }}</div>
                </div>
                <div class="right-part">
                  <div class="name">{{ item.name }}</div>
                  <div class="time">{{ formatTime(item.endTime) }} 到期</div>

                  <div class="status-tag">
                    <el-tag v-if="item.useStatus === 0" type="success" size="small">未使用</el-tag>
                    <el-tag v-else type="info" size="small">已使用</el-tag>
                  </div>

                  <el-button v-if="item.useStatus === 0" type="primary" link size="small"
                    @click="$router.push('/mall/home')" style="margin-top: 5px;">
                    去使用 >
                  </el-button>
                </div>
              </div>
            </el-col>
          </el-row>
          <el-empty v-if="myList.length === 0" class="coupon-empty" description="您还没有领取优惠券" />
        </el-tab-pane>

      </el-tabs>
    </el-card>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted } from 'vue'
import { getCouponListApi, receiveCouponApi, getMyCouponIdsApi } from '@/api/mall/coupon'
import { ElMessage } from 'element-plus'
import { useUserStore } from '@/stores/user'
import type { Coupon, UserCouponRecord } from '@/types/types'

const userStore = useUserStore()
const activeTab = ref('center')
const list = ref<Coupon[]>([]) // 公共列表
const myList = ref<UserCouponRecord[]>([]) // 我的列表 (详情)
const myCouponSet = ref(new Set<number>()) // 我的领过ID集合
const loading = ref<Record<number, boolean>>({})

const getCouponId = (item: Coupon) => item.id ?? 0

// 计算抢光进度条 (假数据演示，你可以用 totalCount - count)
const calcPercentage = (item: Coupon) => {
  // 假设总数是 100，简单展示个效果
  const total = item.count + 10
  return Math.floor(((total - item.count) / total) * 100)
}

// 判断是否已领取
const isReceived = (id: number) => {
  return myCouponSet.value.has(id)
}

// 按钮状态
const getBtnText = (item: Coupon) => {
  if (isReceived(getCouponId(item))) return '已领取'
  if (item.count <= 0) return '已抢光'
  return '立即领取'
}
const getBtnType = (item: Coupon) => {
  if (isReceived(getCouponId(item)) || item.count <= 0) return 'info'
  return 'danger'
}

// 获取公共列表
const fetchList = async () => {
  const resList = await getCouponListApi()

  if (resList.code === 200) {
    list.value = resList.data || []
  }
  if (userStore.token) {
    const resMy = await getMyCouponIdsApi()
    if (resMy.code === 200) {
      const ids = resMy.data.map(item => item.couponId) // 👈 关键！
      myCouponSet.value = new Set(ids)
    }
  }
}

// 获取我的列表
const fetchMyList = async () => {
  const res = await getMyCouponIdsApi()

  // 👇 1. 打印原始 API 返回的数据
  console.log('原始 API 数据:', res)
  console.log('第一条数据的 useStatus:', res.data?.[0]?.useStatus)

  if (res.code === 200) {
    myList.value = res.data || []

    // 👇 2. 打印赋值后的数据
    console.log('赋值后的 myList:', myList.value)
  }
}

// 领取动作
const handleReceive = async (item: Coupon) => {
  if (!userStore.token) {
    ElMessage.warning('请先登录')
    // router.push('/login')
    return
  }
  const couponId = getCouponId(item)
  if (!couponId) return
  loading.value[couponId] = true
  try {
    const res = await receiveCouponApi(couponId)
    if (res.code === 200) {
      ElMessage.success('领取成功')
      myCouponSet.value.add(couponId) // 标记已领
      item.count-- // 视觉扣减
    } else {
      ElMessage.error(res.message || '领取失败')
    }
  } finally {
    loading.value[couponId] = false
  }
}

// 切换 Tab
const handleTabClick = (tab: any) => {
  if (tab.paneName === 'mine') {
    fetchMyList()
  } else {
    fetchList()
  }
}

// 时间格式化
const formatTime = (timeStr: string) => {
  return timeStr ? timeStr.split(' ')[0] : ''
}

onMounted(() => {
  fetchList()
})
</script>

<style scoped>
.coupon-container {
  padding: 20px;
  max-width: 1200px;
  margin: 0 auto;
}

.coupon-shell {
  border-radius: 20px;
  border: 1px solid var(--app-border);
  background: linear-gradient(180deg, var(--app-surface) 0%, var(--app-surface-soft) 100%);
  box-shadow: var(--app-shadow-md);
}

.coupon-tabs :deep(.el-tabs__nav-wrap::after) {
  background-color: var(--app-border);
}

.coupon-tabs :deep(.el-tabs__item) {
  color: var(--app-text-muted);
  font-weight: 600;
}

.coupon-tabs :deep(.el-tabs__item.is-active) {
  color: var(--app-primary);
}

.coupon-tabs :deep(.el-tabs__active-bar) {
  background-color: var(--app-primary);
}

.coupon-alert :deep(.el-alert__title),
.coupon-alert :deep(.el-alert__description) {
  color: var(--app-text);
}

.coupon-alert :deep(.el-alert__icon) {
  color: var(--app-success);
}

.coupon-alert :deep(.el-alert__content) {
  background: transparent;
}

:deep(.coupon-alert) {
  background: var(--app-surface-soft);
  border: 1px solid var(--app-border);
  box-shadow: none;
}

.coupon-grid {
  margin-top: 20px;
}

.coupon-empty :deep(.el-empty__description) {
  color: var(--app-text-muted);
}

/* 券卡片样式 - 模仿京东/淘宝风格 */
.coupon-card {
  background: linear-gradient(135deg, var(--app-surface-soft) 0%, var(--app-surface) 100%);
  border: 1px solid var(--app-border);
  border-radius: 14px;
  display: flex;
  margin-bottom: 20px;
  position: relative;
  overflow: hidden;
  transition: all 0.3s;
  height: 110px;
}

.coupon-card:hover {
  box-shadow: var(--app-shadow-md);
  transform: translateY(-2px);
}

.left-part {
  width: 90px;
  background: linear-gradient(180deg, #fb7185, #ef4444);
  color: #fff;
  display: flex;
  flex-direction: column;
  justify-content: center;
  align-items: center;
  border-right: 1px dashed rgba(255, 255, 255, 0.7);
}

.amount {
  font-size: 14px;
}

.amount span {
  font-size: 28px;
  font-weight: bold;
}

.limit {
  font-size: 12px;
  margin-top: 2px;
  opacity: 0.9;
}

.right-part {
  flex: 1;
  padding: 12px 16px;
  display: flex;
  flex-direction: column;
  justify-content: space-between;
}

.name {
  font-weight: bold;
  font-size: 15px;
  color: var(--app-text);
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.time {
  font-size: 12px;
  color: var(--app-text-muted);
}

.stock-bar {
  display: flex;
  align-items: center;
  font-size: 12px;
  color: var(--app-warning);
}

.stock-text {
  margin-left: 5px;
}

.action-btn {
  position: absolute;
  right: 10px;
  bottom: 10px;
  border-radius: 12px;
  padding: 5px 14px;
  box-shadow: 0 10px 20px rgba(15, 23, 42, 0.18);
}

/* 禁用状态 */
.coupon-card.disabled .left-part {
  background: var(--app-border-strong);
}

.coupon-card.disabled {
  border-color: var(--app-border);
  cursor: not-allowed;
}

/* 已使用状态 */
.coupon-card.used {
  filter: grayscale(100%);
  opacity: 0.6;
}

.status-tag {
  margin-top: 5px;
}

@media (max-width: 768px) {
  .coupon-container {
    padding: 16px;
  }

  .coupon-card {
    height: auto;
    min-height: 120px;
  }

  .left-part {
    width: 84px;
  }
}
</style>
