<template>
  <div class="page-shell coupon-page">
    <el-card class="page-card" shadow="never">
      <div class="page-header">
        <div class="page-heading">
          <span class="page-eyebrow">MARKETING CENTER</span>
          <h2 class="page-title">优惠券管理</h2>
          <p class="page-subtitle">创建店铺优惠券，管理库存、有效期与秒杀预热状态。</p>
        </div>
        <div class="page-toolbar">
          <el-button type="primary" :icon="Plus" @click="handleAdd">新增优惠券</el-button>
          <el-button :icon="Refresh" :loading="loading" @click="fetchData">刷新</el-button>
        </div>
      </div>

      <div class="coupon-overview">
        <div class="overview-card">
          <span>优惠券总数</span>
          <strong>{{ pagination.total }}</strong>
          <small>当前店铺券</small>
        </div>
        <div class="overview-card">
          <span>有效券</span>
          <strong>{{ activeCouponCount }}</strong>
          <small>本页可领取或使用</small>
        </div>
        <div class="overview-card">
          <span>本页库存</span>
          <strong>{{ pageStockCount }}</strong>
          <small>剩余可发放数量</small>
        </div>
      </div>

      <el-form :inline="true" :model="queryParams" class="filter-form">
        <el-form-item label="优惠券名称">
          <el-input v-model="queryParams.name" placeholder="输入名称搜索" clearable @keyup.enter="handleSearch" />
        </el-form-item>
        <el-form-item class="filter-actions">
          <el-button type="primary" icon="Search" @click="handleSearch">查询</el-button>
          <el-button icon="Refresh" @click="handleReset">重置</el-button>
        </el-form-item>
      </el-form>

      <el-table :data="tableData" border stripe class="soft-table coupon-table" v-loading="loading" empty-text="暂无优惠券">
        <el-table-column prop="id" label="ID" width="80" align="center">
          <template #default="{ row }">
            <span class="coupon-id">#{{ getCouponId(row) }}</span>
          </template>
        </el-table-column>
        <el-table-column prop="name" label="优惠券" min-width="210">
          <template #default="{ row }">
            <div class="coupon-name-cell">
              <span class="coupon-mark">券</span>
              <div>
                <strong>{{ row.name }}</strong>
                <small>每人限领 {{ row.perLimit || 1 }} 张</small>
              </div>
            </div>
          </template>
        </el-table-column>
        <el-table-column label="优惠规则" min-width="180">
          <template #default="{ row }">
            <div class="discount-rule">
              <strong>¥{{ formatAmount(row.amount) }}</strong>
              <span>{{ row.minPoint > 0 ? `满 ¥${formatAmount(row.minPoint)} 可用` : '无门槛' }}</span>
            </div>
          </template>
        </el-table-column>
        <el-table-column prop="count" label="剩余库存" width="110" align="center">
          <template #default="{ row }">
            <el-tag :type="row.count > 0 ? 'success' : 'danger'" effect="light" round>
              {{ row.count }}
            </el-tag>
          </template>
        </el-table-column>
        <el-table-column label="状态" width="110" align="center">
          <template #default="{ row }">
            <el-tag :type="getCouponStatus(row).type" effect="light">
              {{ getCouponStatus(row).label }}
            </el-tag>
          </template>
        </el-table-column>
        <el-table-column label="有效期" min-width="290">
          <template #default="{ row }">
            <div class="valid-time">
              <div class="time-row">
                <span class="time-label">开始</span>
                <span>{{ formatTime(row.startTime) }}</span>
              </div>
              <div class="time-row">
                <span class="time-label end">结束</span>
                <span>{{ formatTime(row.endTime) }}</span>
              </div>
            </div>
          </template>
        </el-table-column>
        <el-table-column label="操作" width="190" fixed="right" align="center">
          <template #default="{ row }">
            <div class="action-buttons">
              <el-button type="warning" plain size="small" :icon="Lightning"
                :disabled="row.count <= 0 || getCouponStatus(row).key === 'expired'" @click="handlePreheat(row)">
                预热
              </el-button>
              <el-button type="danger" plain size="small" icon="Delete" @click="handleDelete(row)">
                删除
              </el-button>
            </div>
          </template>
        </el-table-column>
      </el-table>

      <div class="pagination">
        <el-pagination v-model:current-page="pagination.pageNum" v-model:page-size="pagination.pageSize"
          :total="pagination.total" :page-sizes="[10, 20, 30, 50]" layout="total, sizes, prev, pager, next, jumper"
          @current-change="fetchData" @size-change="handleSizeChange" />
      </div>
    </el-card>

    <el-dialog v-model="dialogVisible" title="新增优惠券" width="min(600px, 94vw)" class="coupon-dialog"
      :close-on-click-modal="false" destroy-on-close @closed="resetForm">
      <el-form ref="formRef" :model="form" :rules="rules" label-position="top" class="coupon-form">
        <div class="form-grid">
          <el-form-item label="优惠券名称" prop="name" class="form-span">
            <el-input v-model="form.name" maxlength="30" show-word-limit placeholder="例如：满100减10" />
          </el-form-item>
          <el-form-item label="面额" prop="amount">
            <el-input-number v-model="form.amount" :min="1" :precision="2" controls-position="right" />
          </el-form-item>
          <el-form-item label="使用门槛" prop="minPoint">
            <el-input-number v-model="form.minPoint" :min="0" :precision="2" controls-position="right" />
            <span class="form-tip">填写 0 表示无门槛</span>
          </el-form-item>
          <el-form-item label="发行数量" prop="count">
            <el-input-number v-model="form.count" :min="1" :step="10" controls-position="right" />
          </el-form-item>
          <el-form-item label="每人限领" prop="perLimit">
            <el-input-number v-model="form.perLimit" :min="1" :max="form.count" controls-position="right" />
          </el-form-item>
          <el-form-item label="有效期" prop="timeRange" class="form-span">
            <el-date-picker v-model="form.timeRange" type="datetimerange" range-separator="至" start-placeholder="开始时间"
              end-placeholder="结束时间" value-format="YYYY-MM-DD HH:mm:ss" />
          </el-form-item>
        </div>
      </el-form>
      <template #footer>
        <el-button @click="dialogVisible = false">取消</el-button>
        <el-button type="primary" :loading="submitting" @click="submitForm">确定创建</el-button>
      </template>
    </el-dialog>
  </div>
</template>

<script setup lang="ts">
import { computed, onMounted, reactive, ref } from 'vue'
import { ElMessage, ElMessageBox, type FormInstance, type FormRules } from 'element-plus'
import { Lightning, Plus, Refresh } from '@element-plus/icons-vue'
import {
  addCouponApi,
  deleteCouponApi,
  getCouponPageApi,
  preheatCouponApi
} from '@/api/marketing/coupon'
import type { Coupon, CouponForm, CouponQueryParams } from '@/types/types'

type CouponStatus = {
  key: 'pending' | 'active' | 'expired' | 'empty'
  label: string
  type: 'success' | 'warning' | 'info' | 'danger'
}

const createDefaultForm = () => ({
  name: '',
  amount: 10,
  minPoint: 0,
  count: 100,
  perLimit: 1,
  scopeType: 'MERCHANT' as const,
  timeRange: [] as string[]
})

const loading = ref(false)
const submitting = ref(false)
const tableData = ref<Coupon[]>([])
const dialogVisible = ref(false)
const formRef = ref<FormInstance>()
const form = reactive(createDefaultForm())

const queryParams = reactive<CouponQueryParams>({
  pageNum: 1,
  pageSize: 10,
  name: '',
  scopeType: 'MERCHANT'
})

const pagination = reactive({
  pageNum: 1,
  pageSize: 10,
  total: 0
})

const rules: FormRules = {
  name: [
    { required: true, message: '请输入优惠券名称', trigger: 'blur' },
    { min: 2, max: 30, message: '名称长度应为 2 到 30 个字符', trigger: 'blur' }
  ],
  amount: [{ required: true, message: '请输入面额', trigger: 'change' }],
  minPoint: [{ required: true, message: '请输入使用门槛', trigger: 'change' }],
  count: [{ required: true, message: '请输入发行数量', trigger: 'change' }],
  perLimit: [{ required: true, message: '请输入每人限领数量', trigger: 'change' }],
  timeRange: [{ required: true, type: 'array', min: 2, message: '请选择完整有效期', trigger: 'change' }]
}

const activeCouponCount = computed(() =>
  tableData.value.filter(item => getCouponStatus(item).key === 'active').length
)

const pageStockCount = computed(() =>
  tableData.value.reduce((total, item) => total + Number(item.count || 0), 0)
)

const fetchData = async () => {
  loading.value = true
  try {
    queryParams.pageNum = pagination.pageNum
    queryParams.pageSize = pagination.pageSize
    const res = await getCouponPageApi(queryParams)
    if (res.code === 200) {
      tableData.value = res.data.records ?? res.data.list ?? []
      pagination.total = res.data.total ?? 0
    } else {
      ElMessage.error(res.message || '优惠券加载失败')
    }
  } catch {
    ElMessage.error('优惠券加载失败')
  } finally {
    loading.value = false
  }
}

const resetForm = () => {
  Object.assign(form, createDefaultForm())
  formRef.value?.clearValidate()
}

const handleAdd = () => {
  resetForm()
  dialogVisible.value = true
}

const handleSearch = () => {
  pagination.pageNum = 1
  queryParams.name = queryParams.name?.trim() || ''
  fetchData()
}

const handleReset = () => {
  queryParams.name = ''
  pagination.pageNum = 1
  fetchData()
}

const handleSizeChange = () => {
  pagination.pageNum = 1
  fetchData()
}

const submitForm = async () => {
  if (!formRef.value || submitting.value) return

  await formRef.value.validate(async valid => {
    if (!valid) return
    if (form.minPoint > 0 && form.amount >= form.minPoint) {
      ElMessage.warning('优惠面额应小于使用门槛')
      return
    }
    if (form.perLimit > form.count) {
      ElMessage.warning('每人限领数量不能超过发行数量')
      return
    }

    const postData: CouponForm = {
      name: form.name.trim(),
      amount: form.amount,
      minPoint: form.minPoint,
      count: form.count,
      perLimit: form.perLimit,
      scopeType: 'MERCHANT',
      startTime: form.timeRange[0] || '',
      endTime: form.timeRange[1] || ''
    }

    submitting.value = true
    try {
      const res = await addCouponApi(postData)
      if (res.code === 200) {
        ElMessage.success('优惠券创建成功')
        dialogVisible.value = false
        pagination.pageNum = 1
        await fetchData()
      } else {
        ElMessage.error(res.message || '优惠券创建失败')
      }
    } catch {
      ElMessage.error('优惠券创建失败')
    } finally {
      submitting.value = false
    }
  })
}

const handlePreheat = async (row: Coupon) => {
  const couponId = getCouponId(row)
  if (!couponId) {
    ElMessage.error('优惠券 ID 无效')
    return
  }

  try {
    await ElMessageBox.confirm(
      `确定将“${row.name}”的 ${row.count} 张库存加载到 Redis 吗？这会重置当前预热库存。`,
      '预热确认',
      { type: 'warning', confirmButtonText: '确认预热', cancelButtonText: '取消' }
    )
    const res = await preheatCouponApi(couponId)
    if (res.code === 200) {
      ElMessage.success('预热成功，可以开始发放')
    } else {
      ElMessage.error(res.message || '预热失败')
    }
  } catch (error) {
    if (error !== 'cancel' && error !== 'close') {
      ElMessage.error('预热失败')
    }
  }
}

const handleDelete = async (row: Coupon) => {
  const couponId = getCouponId(row)
  if (!couponId) {
    ElMessage.error('优惠券 ID 无效')
    return
  }

  try {
    await ElMessageBox.confirm(
      `确定删除优惠券“${row.name}”吗？删除后不可恢复。`,
      '删除确认',
      { type: 'warning', confirmButtonText: '删除', cancelButtonText: '取消' }
    )
    const res = await deleteCouponApi(couponId)
    if (res.code === 200) {
      ElMessage.success('删除成功')
      if (tableData.value.length === 1 && pagination.pageNum > 1) {
        pagination.pageNum -= 1
      }
      await fetchData()
    } else {
      ElMessage.error(res.message || '删除失败')
    }
  } catch (error) {
    if (error !== 'cancel' && error !== 'close') {
      ElMessage.error('删除失败')
    }
  }
}

const getCouponId = (coupon: Coupon) => coupon.id ?? coupon.couponId

const getCouponStatus = (coupon: Coupon): CouponStatus => {
  if (coupon.count <= 0) {
    return { key: 'empty', label: '已领完', type: 'danger' }
  }

  const now = Date.now()
  const start = parseTime(coupon.startTime)
  const end = parseTime(coupon.endTime)

  if (Number.isFinite(start) && now < start) {
    return { key: 'pending', label: '未开始', type: 'warning' }
  }
  if (Number.isFinite(end) && now > end) {
    return { key: 'expired', label: '已过期', type: 'info' }
  }
  return { key: 'active', label: '进行中', type: 'success' }
}

const formatAmount = (amount: number) => Number(amount || 0).toFixed(2)

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
  const normalized = normalizeTime(time)
  const matched = normalized.match(
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

const formatTime = (time: string) => {
  const normalized = normalizeTime(time)
  if (!normalized) return '-'

  const matched = normalized.match(
    /^(\d{4})-(\d{1,2})-(\d{1,2})[ T](\d{1,2}):(\d{1,2})/
  )
  if (!matched) return normalized

  const [, year = '', month = '', day = '', hour = '', minute = ''] = matched
  const pad = (value: string) => value.padStart(2, '0')
  return `${year}-${pad(month)}-${pad(day)} ${pad(hour)}:${pad(minute)}`
}

onMounted(fetchData)
</script>

<style scoped>
.coupon-page {
  min-height: 100vh;
}

.page-card {
  overflow: hidden;
  border: 1px solid var(--app-border);
  border-radius: 16px;
}

.page-header {
  position: relative;
  overflow: hidden;
  margin: -20px -20px 22px;
  padding: 28px 30px;
  background:
    radial-gradient(circle at 82% 20%, rgb(255 255 255 / 20%) 0, transparent 28%),
    linear-gradient(135deg, #315efb 0%, #5b73f2 52%, #7a5af8 100%);
}

.page-header::after {
  position: absolute;
  right: 16%;
  bottom: -70px;
  width: 180px;
  height: 180px;
  border: 32px solid rgb(255 255 255 / 8%);
  border-radius: 50%;
  content: '';
}

.page-heading,
.page-toolbar {
  position: relative;
  z-index: 1;
}

.page-eyebrow {
  display: block;
  margin-bottom: 5px;
  color: rgb(255 255 255 / 70%);
  font-size: 11px;
  font-weight: 700;
  letter-spacing: 1.8px;
}

.page-title,
.page-subtitle {
  color: #fff;
}

.page-title {
  margin: 0;
}

.page-subtitle {
  margin: 7px 0 0;
  opacity: 0.82;
}

.page-toolbar :deep(.el-button) {
  border-color: rgb(255 255 255 / 35%);
  box-shadow: 0 8px 18px rgb(31 50 130 / 18%);
}

.coupon-overview {
  display: grid;
  grid-template-columns: repeat(3, minmax(0, 1fr));
  gap: 14px;
  margin-bottom: 18px;
}

.overview-card {
  display: grid;
  gap: 5px;
  padding: 18px 20px;
  border: 1px solid var(--app-border);
  border-radius: 12px;
  background: linear-gradient(135deg, var(--app-surface-soft), var(--app-surface));
}

.overview-card span,
.overview-card small {
  color: var(--app-text-muted);
}

.overview-card span {
  font-size: 13px;
  font-weight: 600;
}

.overview-card strong {
  color: var(--el-color-primary);
  font-size: 28px;
  line-height: 1.2;
}

.filter-form {
  display: flex;
  align-items: center;
  gap: 8px;
  margin-bottom: 18px;
  padding: 18px 18px 0;
  border: 1px solid var(--app-border);
  border-radius: 12px;
  background: var(--app-surface-soft);
}

.filter-form :deep(.el-input) {
  width: 240px;
}

.coupon-table {
  overflow: hidden;
  border-radius: 12px;
}

.coupon-id {
  color: var(--app-text-muted);
  font-family: Consolas, monospace;
  font-size: 13px;
}

.coupon-name-cell {
  display: flex;
  align-items: center;
  gap: 12px;
}

.coupon-mark {
  display: inline-flex;
  width: 38px;
  height: 38px;
  flex: 0 0 38px;
  align-items: center;
  justify-content: center;
  border-radius: 11px;
  background: var(--el-color-warning-light-9);
  color: var(--el-color-warning);
  font-weight: 700;
}

.coupon-name-cell div,
.discount-rule {
  display: grid;
  gap: 4px;
}

.coupon-name-cell strong {
  color: var(--app-text);
}

.coupon-name-cell small,
.discount-rule span,
.valid-time {
  color: var(--app-text-muted);
  font-size: 12px;
}

.discount-rule strong {
  color: var(--app-danger);
  font-size: 17px;
}

.valid-time {
  display: grid;
  gap: 7px;
}

.time-row {
  display: flex;
  align-items: center;
  gap: 8px;
  white-space: nowrap;
}

.time-label {
  display: inline-flex;
  height: 22px;
  flex: 0 0 38px;
  align-items: center;
  justify-content: center;
  border-radius: 6px;
  background: var(--el-color-success-light-9);
  color: var(--el-color-success);
  font-size: 11px;
  font-weight: 600;
}

.time-label.end {
  background: var(--el-color-danger-light-9);
  color: var(--el-color-danger);
}

.action-buttons {
  display: flex;
  flex-wrap: nowrap;
  justify-content: center;
  gap: 7px;
  white-space: nowrap;
}

.action-buttons :deep(.el-button + .el-button) {
  margin-left: 0;
}

.pagination {
  display: flex;
  justify-content: flex-end;
  margin-top: 20px;
}

.form-grid {
  display: grid;
  grid-template-columns: repeat(2, minmax(0, 1fr));
  gap: 0 18px;
}

.form-span {
  grid-column: 1 / -1;
}

.coupon-form :deep(.el-input-number),
.coupon-form :deep(.el-date-editor) {
  width: 100%;
}

.form-tip {
  display: block;
  margin-top: 6px;
  color: var(--app-text-muted);
  font-size: 12px;
}

@media (max-width: 768px) {
  .page-header {
    align-items: flex-start;
    flex-direction: column;
    gap: 20px;
    padding: 24px 20px;
  }

  .page-toolbar {
    display: flex;
    width: 100%;
  }

  .page-toolbar :deep(.el-button) {
    flex: 1;
  }

  .coupon-overview {
    grid-template-columns: 1fr;
  }

  .filter-form {
    display: block;
  }

  .filter-form :deep(.el-form-item),
  .filter-form :deep(.el-input) {
    width: 100%;
  }

  .filter-actions :deep(.el-form-item__content) {
    flex-wrap: nowrap;
  }

  .form-grid {
    grid-template-columns: 1fr;
  }

  .form-span {
    grid-column: auto;
  }

  .pagination {
    overflow-x: auto;
    justify-content: flex-start;
    padding-bottom: 4px;
  }
}
</style>
