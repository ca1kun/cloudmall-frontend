<template>
  <div class="page-shell">
    <el-card class="page-card" shadow="never" v-loading="loading">
      <template #header>
        <div class="page-header">
          <div>
            <h2 class="page-title">订单详情</h2>
            <p class="page-subtitle">订单号 {{ orderDetail?.order.orderNo || '-' }}</p>
          </div>
          <div class="header-actions">
            <el-button
              v-if="canApplyReturn"
              type="warning"
              @click="showReturnDialog = true"
            >
              申请退货
            </el-button>
            <el-button @click="router.back()">返回</el-button>
          </div>
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
        <el-descriptions-item label="收货人">{{ orderDetail?.order.receiverName || '-' }}</el-descriptions-item>
        <el-descriptions-item label="联系电话">{{ orderDetail?.order.receiverPhone || '-' }}</el-descriptions-item>
        <el-descriptions-item label="收货地址" :span="3">
          {{ orderDetail?.order.receiverAddress || '-' }}
        </el-descriptions-item>
      </el-descriptions>

      <!-- 退货信息展示 -->
      <template v-if="showReturnInfo">
        <el-divider />
        <el-descriptions title="退货信息" :column="2" border class="return-info">
          <el-descriptions-item label="退货原因">{{ orderDetail?.order.refundReason || '-' }}</el-descriptions-item>
          <el-descriptions-item label="申请时间">{{ orderDetail?.order.refundApplyTime || '-' }}</el-descriptions-item>
          <el-descriptions-item v-if="orderDetail?.order.refundRemark" label="商家备注" :span="2">
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

    <!-- 申请退货弹窗 -->
    <el-dialog
      v-model="showReturnDialog"
      title="申请退货"
      width="500px"
      :close-on-click-modal="false"
      destroy-on-close
    >
      <el-form
        ref="returnFormRef"
        :model="returnForm"
        :rules="returnRules"
        label-width="80px"
      >
        <el-form-item label="退货原因" prop="reason">
          <el-input
            v-model="returnForm.reason"
            type="textarea"
            :rows="4"
            placeholder="请描述退货原因（10-200字）"
            maxlength="200"
            show-word-limit
          />
        </el-form-item>
      </el-form>
      <template #footer>
        <el-button @click="showReturnDialog = false">取消</el-button>
        <el-button type="primary" :loading="submittingReturn" @click="submitReturn">
          确认申请
        </el-button>
      </template>
    </el-dialog>
  </div>
</template>

<script setup lang="ts">
import { computed, onMounted, reactive, ref } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { getMallOrderDetailApi, applyMallOrderReturnApi } from '@/api/mall/order'
import { orderStatusLabels, orderStatusTagType } from '@/utils/order'
import type { OrderDetail } from '@/types/types'
import { ElMessage, type FormInstance, type FormRules } from 'element-plus'

const route = useRoute()
const router = useRouter()
const loading = ref(false)
const orderDetail = ref<OrderDetail | null>(null)

// 可申请退货的状态：已支付、已发货、已完成
const returnableStatuses = ['PAID', 'SHIPPED', 'COMPLETED']
// 已退货相关状态（展示退货信息）
const returnRelatedStatuses = ['REFUNDING', 'REFUNDED', 'RETURN_REJECTED']

const canApplyReturn = computed(() => {
  const status = orderDetail.value?.order.status
  return status && returnableStatuses.includes(status)
})

const showReturnInfo = computed(() => {
  const status = orderDetail.value?.order.status
  return status && returnRelatedStatuses.includes(status)
})

// 退货弹窗
const showReturnDialog = ref(false)
const submittingReturn = ref(false)
const returnFormRef = ref<FormInstance>()
const returnForm = reactive({
  reason: '',
})

const returnRules: FormRules = {
  reason: [
    { required: true, message: '请输入退货原因', trigger: 'blur' },
    { min: 10, message: '退货原因至少10个字', trigger: 'blur' },
    { max: 200, message: '退货原因最多200个字', trigger: 'blur' },
  ],
}

const submitReturn = async () => {
  const valid = await returnFormRef.value?.validate().catch(() => false)
  if (!valid) return

  const orderId = Number(route.params.orderId)
  if (!orderId) return

  submittingReturn.value = true
  try {
    await applyMallOrderReturnApi(orderId, { reason: returnForm.reason })
    ElMessage.success('退货申请已提交，请等待商家审核')
    showReturnDialog.value = false
    // 刷新订单详情
    await fetchDetail()
  } catch (error) {
    ElMessage.error('退货申请提交失败')
  } finally {
    submittingReturn.value = false
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
    const res = await getMallOrderDetailApi(orderId)
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

.header-actions {
  display: flex;
  gap: 10px;
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

.return-info {
  margin-top: 4px;
}
</style>
