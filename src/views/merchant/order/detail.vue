<template>
  <div class="app-container page-shell">
    <el-card class="page-card" shadow="never" v-loading="loading">
      <template #header>
        <div class="page-header">
          <div>
            <h2 class="page-title">订单详情</h2>
            <p class="page-subtitle">订单号 {{ orderDetail?.order.orderNo || '-' }}</p>
          </div>
          <el-button @click="router.back()">返回</el-button>
        </div>
      </template>

      <el-descriptions title="订单信息" :column="3" border>
        <el-descriptions-item label="订单状态">
          <el-tag v-if="orderDetail" :type="orderStatusTagType[orderDetail.order.status]">
            {{ orderStatusLabels[orderDetail.order.status] }}
          </el-tag>
        </el-descriptions-item>
        <el-descriptions-item label="下单时间">{{ orderDetail?.order.createTime || '-' }}</el-descriptions-item>
        <el-descriptions-item label="订单金额">{{ orderDetail?.order.totalAmount || 0 }}</el-descriptions-item>
        <el-descriptions-item label="实付金额">{{ orderDetail?.order.payAmount || 0 }}</el-descriptions-item>
        <el-descriptions-item label="买家">{{ orderDetail?.order.buyerName || '-' }}</el-descriptions-item>
        <el-descriptions-item label="买家手机号">{{ orderDetail?.order.buyerPhone || '-' }}</el-descriptions-item>
        <el-descriptions-item label="收货人">{{ orderDetail?.order.receiverName || '-' }}</el-descriptions-item>
        <el-descriptions-item label="联系电话">{{ orderDetail?.order.receiverPhone || '-' }}</el-descriptions-item>
        <el-descriptions-item label="收货地址" :span="3">
          {{ orderDetail?.order.receiverAddress || '-' }}
        </el-descriptions-item>
      </el-descriptions>

      <!-- 退货处理区域（仅退款中状态） -->
      <template v-if="orderDetail?.order.status === 'REFUNDING'">
        <el-divider />
        <el-card shadow="never" class="return-card">
          <template #header>
            <span>退货审核</span>
          </template>
          <el-descriptions :column="2" border>
            <el-descriptions-item label="退货原因">{{ orderDetail?.order.refundReason || '-' }}</el-descriptions-item>
            <el-descriptions-item label="申请时间">{{ orderDetail?.order.refundApplyTime || '-' }}</el-descriptions-item>
          </el-descriptions>
          <el-form
            ref="auditFormRef"
            :model="auditForm"
            :rules="auditRules"
            label-width="80px"
            class="audit-form"
          >
            <el-form-item label="审核备注" prop="remark">
              <el-input
                v-model="auditForm.remark"
                type="textarea"
                :rows="3"
                placeholder="请输入审核备注（选填）"
                maxlength="200"
                show-word-limit
              />
            </el-form-item>
            <el-form-item>
              <el-button type="success" :loading="auditing" @click="handleAudit(true)">
                同意退货
              </el-button>
              <el-button type="danger" :loading="auditing" @click="handleAudit(false)">
                拒绝退货
              </el-button>
            </el-form-item>
          </el-form>
        </el-card>
      </template>

      <!-- 退货结果展示（已退款/退货被拒状态） -->
      <template v-if="showReturnResult">
        <el-divider />
        <el-descriptions title="退货信息" :column="2" border class="return-info">
          <el-descriptions-item label="退货原因">{{ orderDetail?.order.refundReason || '-' }}</el-descriptions-item>
          <el-descriptions-item label="申请时间">{{ orderDetail?.order.refundApplyTime || '-' }}</el-descriptions-item>
          <el-descriptions-item v-if="orderDetail?.order.refundRemark" label="审核备注" :span="2">
            {{ orderDetail.order.refundRemark }}
          </el-descriptions-item>
          <el-descriptions-item v-if="orderDetail?.order.refundAuditTime" label="处理时间">
            {{ orderDetail.order.refundAuditTime }}
          </el-descriptions-item>
        </el-descriptions>
      </template>

      <el-divider />

      <el-card shadow="never" class="items-card">
        <template #header>
          <span>商品明细</span>
        </template>
        <el-table :data="orderDetail?.items || []" border>
          <el-table-column prop="productName" label="商品名称" min-width="200" />
          <el-table-column prop="price" label="单价" width="120" />
          <el-table-column prop="quantity" label="数量" width="120" />
          <el-table-column prop="subtotal" label="小计" width="140" />
        </el-table>
      </el-card>
    </el-card>
  </div>
</template>

<script setup lang="ts">
import { computed, onMounted, reactive, ref } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { getMerchantOrderDetailApi, auditMerchantOrderReturnApi } from '@/api/merchant/order'
import { orderStatusLabels, orderStatusTagType } from '@/utils/order'
import type { OrderDetail } from '@/types/types'
import { ElMessage, ElMessageBox, type FormInstance, type FormRules } from 'element-plus'

const route = useRoute()
const router = useRouter()
const loading = ref(false)
const orderDetail = ref<OrderDetail | null>(null)

// 已退货相关状态（展示退货结果）
const showReturnResult = computed(() => {
  const status = orderDetail.value?.order.status
  return status && ['REFUNDED', 'RETURN_REJECTED'].includes(status)
})

// 退货审核
const auditing = ref(false)
const auditFormRef = ref<FormInstance>()
const auditForm = reactive({
  remark: '',
})

const auditRules: FormRules = {
  remark: [
    { max: 200, message: '备注最多200个字', trigger: 'blur' },
  ],
}

const handleAudit = async (approved: boolean) => {
  const action = approved ? '同意退货' : '拒绝退货'
  try {
    await ElMessageBox.confirm(
      `确认${action}？此操作不可撤销。`,
      '操作确认',
      {
        confirmButtonText: action,
        cancelButtonText: '取消',
        type: approved ? 'success' : 'warning',
      },
    )
  } catch {
    return // 用户取消
  }

  const orderId = Number(route.params.orderId)
  if (!orderId) return

  auditing.value = true
  try {
    await auditMerchantOrderReturnApi(orderId, {
      approved,
      remark: auditForm.remark,
    })
    ElMessage.success(`${action}成功`)
    // 刷新订单详情
    await fetchDetail()
  } catch (error) {
    ElMessage.error(`${action}失败`)
  } finally {
    auditing.value = false
  }
}

const fetchDetail = async () => {
  const orderId = Number(route.params.orderId)
  if (!orderId) {
    ElMessage.error('订单参数错误')
    return
  }

  loading.value = true
  try {
    const res = await getMerchantOrderDetailApi(orderId)
    orderDetail.value = res.data
  } catch (error) {
    ElMessage.error('订单详情加载失败')
  } finally {
    loading.value = false
  }
}

onMounted(() => {
  fetchDetail()
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
  align-items: center;
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

.items-card {
  border-radius: 14px;
}

.return-card {
  border-radius: 14px;
  border: 1px solid var(--el-color-warning-light-5);
}

.audit-form {
  margin-top: 16px;
}

.return-info {
  margin-top: 4px;
}
</style>
