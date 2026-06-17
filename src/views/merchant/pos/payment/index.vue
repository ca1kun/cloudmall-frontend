<template>
  <div class="pos-order-page page-shell">
    <el-card class="page-card" shadow="never">
      <div class="page-header">
        <div>
          <span class="page-eyebrow">POS ORDERS</span>
          <h2 class="page-title">POS 订单列表</h2>
          <p class="page-subtitle">查看收银台产生的线下销售订单与支付状态。</p>
        </div>
        <el-button icon="Refresh" :loading="loading" @click="getList">刷新</el-button>
      </div>

    <el-table v-loading="loading" :data="saleList" row-key="saleId" border stripe class="sale-table">
      <el-table-column label="订单ID" prop="saleId" align="center" width="80" />
      <el-table-column label="订单号" prop="saleNo" align="center" />
      <el-table-column label="订单总额" prop="total" align="center">
        <template #default="scope">
          <strong class="amount-text">¥ {{ (scope.row.total || 0).toFixed(2) }}</strong>
        </template>
      </el-table-column>
      <el-table-column label="订单状态" prop="status" align="center">
        <template #default="scope">
          <el-tag :type="statusTagType(scope.row.status)">{{ formatStatus(scope.row.status) }}</el-tag>
        </template>
      </el-table-column>
      <el-table-column label="支付方式" prop="payment.payMethod" align="center">
        <template #default="scope">
          <span>{{ scope.row.payment?.payMethod || '-' }}</span>
        </template>
      </el-table-column>
      <el-table-column label="支付流水号" prop="payment.paymentNo" align="center" width="200">
        <template #default="scope">
          <span>{{ scope.row.payment?.paymentNo || '-' }}</span>
        </template>
      </el-table-column>
      <el-table-column label="操作" align="center" width="220">
        <template #default="scope">
          <div class="action-buttons">
          <el-button type="primary" plain size="small" icon="View" @click="handleView(scope.row)">查看订单</el-button>
          <el-button v-if="scope.row.status === 'reserved'" type="success" plain size="small" @click="handlePay(scope.row)">
            支付订单
          </el-button>
          </div>
        </template>
      </el-table-column>
    </el-table>

    <div class="pagination">
      <el-pagination v-model:current-page="queryParams.pageNum" v-model:page-size="queryParams.pageSize"
        :page-sizes="[10, 20, 50, 100]" :total="total" layout="total, sizes, prev, pager, next, jumper"
        @size-change="getList" @current-change="getList" />
    </div>
    </el-card>

    <el-drawer v-model="drawerVisible" title="订单详情" direction="rtl" size="min(620px, 92vw)" destroy-on-close>
      <div class="drawer-content" v-if="currentSale">
        <h3>订单信息</h3>
        <p><strong>订单号:</strong> {{ currentSale.saleNo }}</p>
        <p><strong>订单总额:</strong> ¥ {{ (currentSale.total || 0).toFixed(2) }}</p>
        <p><strong>状态:</strong> {{ formatStatus(currentSale.status) }}</p>
        <el-divider />
        <h3>商品明细</h3>
        <el-table :data="currentSaleItems" border>
          <el-table-column property="productName" label="商品名称" />
          <el-table-column property="price" label="单价" />
          <el-table-column property="quantity" label="数量" />
        </el-table>
      </div>
      <template #footer>
        <div class="drawer-footer">
          <el-button type="primary" @click="drawerVisible = false">关闭</el-button>
        </div>
      </template>
    </el-drawer>

    <el-dialog v-model="paymentDialogVisible" title="订单支付" width="min(460px, 92vw)" :close-on-click-modal="false">
      <el-form :model="paymentForm" label-width="100px">
        <el-form-item label="订单总额">
          <span>¥ {{ paymentForm.amount.toFixed(2) }}</span>
        </el-form-item>
        <el-form-item label="支付方式" prop="payMethod">
          <el-select v-model="paymentForm.payMethod" placeholder="请选择支付方式">
            <el-option label="现金" value="CASH" />
            <el-option label="支付宝" value="ALIPAY" />
            <el-option label="微信支付" value="WECHAT_PAY" />
          </el-select>
        </el-form-item>
      </el-form>
      <template #footer>
        <el-button @click="paymentDialogVisible = false">取消</el-button>
        <el-button type="primary" @click="submitPayment">确认支付</el-button>
      </template>
    </el-dialog>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted, reactive, onActivated } from 'vue'
import { listSaleByPage, listSaleItemById, addPayment } from '@/api/system/sale'
import type { SaleDTO, SaleQueryParams, PaymentForm } from '@/types/index'
import type { SaleItem } from '@/types/types'
import { ElMessage } from 'element-plus'

const loading = ref(true)
const saleList = ref<SaleDTO[]>([])
const total = ref(0)
const queryParams = reactive<SaleQueryParams>({
  pageNum: 1,
  pageSize: 20,
})

const drawerVisible = ref(false)
const paymentDialogVisible = ref(false)
const currentSale = ref<SaleDTO | null>(null)
const currentSaleItems = ref<SaleItem[]>([])

const paymentForm = reactive<PaymentForm>({
  saleId: 0,
  payMethod: 'CASH',
  amount: 0.00,
})

const getList = async () => {
  loading.value = true
  try {
    const response = await listSaleByPage(queryParams)
    saleList.value = response.data.list
    total.value = response.data.total
  } catch (error) {
    console.error('订单列表加载失败:', error)
    ElMessage.error('POS 订单加载失败')
  } finally {
    loading.value = false
  }
}

const handleView = async (row: SaleDTO) => {
  try {
    currentSale.value = row
    const response = await listSaleItemById(row.saleId)
    currentSaleItems.value = response.data
    drawerVisible.value = true
  } catch {
    ElMessage.error('订单详情加载失败')
  }
}

const handlePay = (row: SaleDTO) => {
  paymentForm.saleId = row.saleId
  paymentForm.amount = row.total
  paymentForm.payMethod = 'CASH'
  paymentDialogVisible.value = true
}

const submitPayment = async () => {
  try {
    await addPayment(paymentForm)
    ElMessage.success('支付成功！')
    paymentDialogVisible.value = false
    await getList()
  } catch (error) {
    console.error('支付失败:', error)
    ElMessage.error('支付操作失败')
  }
}

const formatStatus = (status: string): string => {
  const statusMap: Record<string, string> = {
    completed: '已完成',
    delivered: '已发货',
    paid: '已支付',
    reserved: '已预定',
    cancelled: '已取消',
  }
  return statusMap[status] || '未知'
}

const statusTagType = (status: string) => {
  if (status === 'paid' || status === 'completed' || status === 'delivered') return 'success'
  if (status === 'reserved') return 'warning'
  if (status === 'cancelled') return 'danger'
  return 'info'
}

onMounted(() => {
  getList()
})

onActivated(() => {
  getList()
})
</script>

<style scoped>
.pos-order-page {
  min-height: 100vh;
}

.page-card {
  overflow: hidden;
  border: 1px solid var(--app-border);
  border-radius: 16px;
}

.page-header {
  display: flex;
  align-items: flex-start;
  justify-content: space-between;
  gap: 16px;
  margin-bottom: 22px;
}

.page-eyebrow {
  display: block;
  margin-bottom: 5px;
  color: var(--el-color-primary);
  font-size: 11px;
  font-weight: 700;
  letter-spacing: 1.6px;
}

.page-title {
  font-size: 22px;
  color: var(--app-text);
  margin: 0;
}

.page-subtitle {
  margin: 6px 0 0;
  color: var(--app-text-muted);
  font-size: 13px;
}

.drawer-content {
  padding: 20px;
}

.sale-table {
  overflow: hidden;
  border-radius: 12px;
}

.amount-text {
  color: var(--app-danger);
}

.action-buttons {
  display: flex;
  flex-wrap: nowrap;
  justify-content: center;
  gap: 8px;
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

.drawer-footer {
  padding: 12px 20px;
  text-align: right;
  border-top: 1px solid var(--app-border);
}

@media (max-width: 768px) {
  .page-header {
    align-items: flex-start;
    flex-direction: column;
  }

  .page-header :deep(.el-button) {
    width: 100%;
  }

  .pagination {
    overflow-x: auto;
    justify-content: flex-start;
    padding-bottom: 4px;
  }
}
</style>
