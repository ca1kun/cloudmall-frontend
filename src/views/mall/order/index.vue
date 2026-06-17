<template>
  <div class="page-shell">
    <el-card class="page-card" shadow="never">
      <template #header>
        <div class="page-header">
          <div>
            <h2 class="page-title">我的订单</h2>
            <p class="page-subtitle">查看订单数量与状态，跟踪每笔订单进度。</p>
          </div>
        </div>
      </template>

      <div class="status-grid">
        <el-card
          v-for="item in statusCards"
          :key="item.status"
          class="status-card"
          shadow="never"
          :class="{ active: filters.status === item.status }"
          @click="handleStatusPick(item.status)"
        >
          <div class="status-title">{{ item.label }}</div>
          <div class="status-count">{{ item.count }}</div>
        </el-card>
      </div>

      <el-form class="filter-form" :inline="true" :model="filters">
        <el-form-item label="订单号">
          <el-input v-model="filters.orderNo" placeholder="输入订单号" clearable />
        </el-form-item>
        <el-form-item label="状态">
          <el-select v-model="filters.status" placeholder="全部" clearable style="width: 180px;">
            <el-option
              v-for="option in statusOptions"
              :key="option.value"
              :label="option.label"
              :value="option.value"
            />
          </el-select>
        </el-form-item>
        <el-form-item label="下单时间">
          <el-date-picker
            v-model="filters.timeRange"
            type="datetimerange"
            value-format="YYYY-MM-DD HH:mm:ss"
            range-separator="至"
            start-placeholder="开始时间"
            end-placeholder="结束时间"
          />
        </el-form-item>
        <el-form-item>
          <el-button type="primary" @click="handleSearch">查询</el-button>
          <el-button @click="handleReset">重置</el-button>
        </el-form-item>
      </el-form>

      <el-table :data="orderList" v-loading="loading" border>
        <el-table-column prop="orderNo" label="订单号" min-width="160" />
        <el-table-column prop="createTime" label="下单时间" min-width="160" />
        <el-table-column prop="totalQuantity" label="件数" width="100" />
        <el-table-column prop="payAmount" label="实付金额" width="140" />
        <el-table-column label="状态" width="120">
          <template #default="{ row }">
            <el-tag :type="getOrderStatusTagType(row.status)">
              {{ getOrderStatusLabel(row.status) }}
            </el-tag>
          </template>
        </el-table-column>
        <el-table-column label="操作" width="140">
          <template #default="{ row }">
            <el-button link type="primary" @click="goDetail(row.orderId)">查看详情</el-button>
          </template>
        </el-table-column>
      </el-table>

      <div class="pager">
        <el-pagination
          v-model:current-page="pagination.pageNum"
          v-model:page-size="pagination.pageSize"
          :total="pagination.total"
          :page-sizes="[10, 20, 30, 50]"
          layout="total, sizes, prev, pager, next, jumper"
          @current-change="handlePageChange"
          @size-change="handleSizeChange"
        />
      </div>
    </el-card>
  </div>
</template>

<script setup lang="ts">
import { computed, onMounted, reactive, ref } from 'vue'
import { ElMessage } from 'element-plus'
import { listMallOrdersApi, getMallOrderStatusCountApi } from '@/api/mall/order'
import type { Order, OrderQueryParams, OrderStatus, OrderStatusCount } from '@/types/types'
import { orderStatusLabels, orderStatusTagType } from '@/utils/order'
import { useRouter } from 'vue-router'

const router = useRouter()
const loading = ref(false)
const orderList = ref<Order[]>([])
const statusCounts = ref<OrderStatusCount[]>([])

const filters = reactive({
  orderNo: '',
  status: '' as OrderStatus | '',
  timeRange: [] as string[] | [],
})

const pagination = reactive({
  pageNum: 1,
  pageSize: 10,
  total: 0,
})

const statusOptions = computed(() => {
  return (Object.keys(orderStatusLabels) as OrderStatus[]).map(status => ({
    value: status,
    label: orderStatusLabels[status],
  }))
})

const statusCards = computed(() => {
  const map = statusCounts.value.reduce<Record<string, number>>((result, item) => {
    result[item.status] = item.count
    return result
  }, {})

  const cards = (Object.keys(orderStatusLabels) as OrderStatus[]).map(status => ({
    status,
    label: orderStatusLabels[status],
    count: map[status] ?? 0,
  }))

  return [
    { status: '' as OrderStatus | '', label: '全部订单', count: map.ALL ?? cards.reduce((sum, item) => sum + item.count, 0) },
    ...cards,
  ]
})

const getOrderStatusLabel = (status: OrderStatus) => orderStatusLabels[status]

const getOrderStatusTagType = (status: OrderStatus) => orderStatusTagType[status]

const fetchStatusCounts = async () => {
  try {
    const res = await getMallOrderStatusCountApi()
    statusCounts.value = res.data || []
  } catch (error) {
    statusCounts.value = []
  }
}

const fetchOrders = async () => {
  loading.value = true
  try {
    const params: OrderQueryParams = {
      pageNum: pagination.pageNum,
      pageSize: pagination.pageSize,
    }

    if (filters.orderNo.trim()) {
      params.orderNo = filters.orderNo.trim()
    }

    if (filters.status) {
      params.status = filters.status
    }

    if (Array.isArray(filters.timeRange) && filters.timeRange.length === 2) {
      params.startTime = filters.timeRange[0]
      params.endTime = filters.timeRange[1]
    }

    const res = await listMallOrdersApi(params)
    const payload = res.data || { list: [], total: 0 }
    orderList.value = payload.records || payload.list || []
    pagination.total = payload.total || 0
  } catch (error) {
    ElMessage.error('订单加载失败')
  } finally {
    loading.value = false
  }
}

const handleSearch = () => {
  pagination.pageNum = 1
  fetchOrders()
}

const handleReset = () => {
  filters.orderNo = ''
  filters.status = ''
  filters.timeRange = []
  pagination.pageNum = 1
  fetchOrders()
}

const handlePageChange = (page: number) => {
  pagination.pageNum = page
  fetchOrders()
}

const handleSizeChange = (size: number) => {
  pagination.pageSize = size
  pagination.pageNum = 1
  fetchOrders()
}

const handleStatusPick = (status: OrderStatus | '') => {
  filters.status = status
  pagination.pageNum = 1
  fetchOrders()
}

const goDetail = (orderId: number) => {
  router.push(`/mall/order/${orderId}`)
}

onMounted(() => {
  fetchStatusCounts()
  fetchOrders()
})
</script>

<style scoped>
.page-shell {
  padding: 10px 0;
}

.page-card {
  border-radius: 16px;
}

.page-header {
  display: flex;
  justify-content: space-between;
  align-items: flex-start;
  gap: 16px;
}

.page-title {
  font-size: 22px;
  color: var(--app-text);
  font-weight: 700;
}

.page-subtitle {
  margin-top: 6px;
  color: var(--app-text-muted);
  font-size: 14px;
}

.status-grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(140px, 1fr));
  gap: 12px;
  margin-bottom: 18px;
}

.status-card {
  cursor: pointer;
  border-radius: 12px;
  border: 1px solid var(--app-border);
  transition: transform 0.2s ease, box-shadow 0.2s ease;
}

.status-card.active {
  border-color: var(--app-primary);
  box-shadow: 0 10px 24px rgba(63, 86, 240, 0.18);
}

.status-card:hover {
  transform: translateY(-2px);
}

.status-title {
  color: var(--app-text-muted);
  font-size: 13px;
}

.status-count {
  margin-top: 8px;
  font-size: 24px;
  color: var(--app-text);
  font-weight: 700;
}

.filter-form {
  margin-bottom: 12px;
}

.pager {
  display: flex;
  justify-content: flex-end;
  margin-top: 16px;
}
</style>
