<template>
  <div class="checkout-container">
    <el-card class="checkout-card" shadow="never">
      <template #header>
        <div class="checkout-header">
          <div>
            <h2>确认订单</h2>
            <p>核对收货信息、商品清单与优惠金额</p>
          </div>
          <el-tag effect="plain" round>{{ cartList.length }} 件商品</el-tag>
        </div>
      </template>
      <!-- 1. 收货地址 -->
      <div class="section">
        <div class="section-header">
          <span class="section-icon"><el-icon><Location /></el-icon></span>
          <h3>收货人信息</h3>
        </div>
        <AddressManager
          ref="addressManagerRef"
          v-model="orderForm.addressId"
          @change="handleAddressChange"
        />
      </div>

      <!-- 2. 商品清单 -->
      <div class="section">
        <div class="section-header">
          <span class="section-icon"><el-icon><Goods /></el-icon></span>
          <h3>商品清单</h3>
        </div>
        <el-table :data="cartList" class="checkout-table">
          <el-table-column prop="productName" label="商品名称" min-width="200" />
          <el-table-column prop="price" label="单价" width="120">
            <template #default="{ row }">
              ¥ {{ row.price.toFixed(2) }}
            </template>
          </el-table-column>
          <el-table-column prop="quantity" label="数量" width="120" />
          <el-table-column label="小计" width="120">
            <template #default="{ row }">
              ¥ {{ (row.price * row.quantity).toFixed(2) }}
            </template>
          </el-table-column>
        </el-table>
      </div>

      <!-- 3. 优惠券选择区域 -->
      <div class="section">
        <div class="section-header">
          <span class="section-icon"><el-icon><Ticket /></el-icon></span>
          <h3>优惠券</h3>
        </div>
        <el-select
          v-model="orderForm.couponId"
          placeholder="请选择优惠券"
          clearable
          style="width: 300px"
          @change="handleCouponChange"
        >
          <el-option
            v-for="item in couponList"
            :key="item.id"
            :label="getLabel(item)"
            :value="item.couponId"
            :disabled="!checkCouponAvailable(item)"
          />
        </el-select>

        <div v-if="orderForm.couponId" class="coupon-tip">
          已抵扣: ¥ {{ currentCouponAmount }}
        </div>
      </div>

      <!-- 4. 备注 -->
      <div class="section">
        <div class="section-header">
          <span class="section-icon"><el-icon><EditPen /></el-icon></span>
          <h3>备注信息</h3>
        </div>
        <el-input
          v-model="orderForm.note"
          type="textarea"
          :rows="2"
          maxlength="200"
          show-word-limit
          placeholder="选填：请填写备注信息，如配送时间要求等"
        />
      </div>

      <!-- 5. 底部提交 -->
      <div class="footer-bar">
        <div class="total-wrapper">
          <div class="total-row">
            <span class="label">商品总额:</span>
            <span class="value">¥ {{ goodsTotalPrice.toFixed(2) }}</span>
          </div>
          <div v-if="currentCouponAmount > 0" class="total-row">
            <span class="label discount-label">优惠:</span>
            <span class="value discount-value">- ¥ {{ currentCouponAmount.toFixed(2) }}</span>
          </div>
          <div class="total-row">
            <span class="label">实付金额:</span>
            <span class="real-price">¥ {{ finalPrice }}</span>
          </div>
        </div>

        <el-button
          type="primary"
          size="large"
          :loading="submitting"
          :disabled="orderForm.addressId === 0"
          @click="submitOrder"
        >
          提交订单
        </el-button>
      </div>
    </el-card>
  </div>
</template>

<script setup lang="ts">
import { ref, reactive, computed, onMounted } from 'vue'
import { useRouter } from 'vue-router'
import { getCartListApi } from '@/api/mall/cart'
import { createOrderApi } from '@/api/mall/order'
import { getMyCouponIdsApi } from '@/api/mall/coupon'
import { ElMessage } from 'element-plus'
import AddressManager from '@/components/AddressManager.vue'
import type { Address } from '@/types/types'
import { EditPen, Goods, Location, Ticket } from '@element-plus/icons-vue'

const router = useRouter()
const cartList = ref<any[]>([])
const submitting = ref(false)
const couponList = ref<any[]>([])
const addressManagerRef = ref<InstanceType<typeof AddressManager> | null>(null)

const orderForm = reactive({
  addressId: 0,
  payType: 1,
  note: '',
  couponId: null as number | null,
})

// 计算商品总价
const goodsTotalPrice = computed(() => {
  return cartList.value.reduce((sum, item) => sum + item.price * item.quantity, 0)
})

// 计算当前优惠金额
const currentCouponAmount = computed(() => {
  if (!orderForm.couponId) return 0
  const coupon = couponList.value.find((c) => c.couponId === orderForm.couponId)
  return coupon ? coupon.amount : 0
})

// 计算最终实付
const finalPrice = computed(() => {
  let final = goodsTotalPrice.value - currentCouponAmount.value
  return final > 0 ? final.toFixed(2) : '0.01'
})

// 加载购物车
const fetchCartData = async () => {
  const res = await getCartListApi()
  if (res.code === 200) {
    cartList.value = res.data || []
    if (cartList.value.length === 0) {
      ElMessage.warning('购物车为空，无法下单')
      router.push('/mall/cart')
    }
  }
}

// 加载优惠券
const fetchCoupons = async () => {
  try {
    const res = await getMyCouponIdsApi()
    if (res.code === 200) {
      couponList.value = (res.data || []).filter((item: any) => item.useStatus === 0)
    }
  } catch (e) {
    // 忽略错误，不影响下单
  }
}

// 地址变更回调
const handleAddressChange = (address?: Address) => {
  if (address?.id) {
    orderForm.addressId = address.id
  }
}

// 提交订单
const submitOrder = async () => {
  if (orderForm.addressId === 0) {
    ElMessage.warning('请选择收货地址')
    return
  }

  submitting.value = true
  try {
    const res = await createOrderApi(orderForm)
    if (res.code === 200) {
      ElMessage.success('订单提交成功！')
      router.push({
        path: '/mall/pay/confirm',
        query: {
          orderId: res.data.orderId,
          money: res.data.payAmount || finalPrice.value,
        },
      })
    } else {
      ElMessage.error(res.message || '下单失败')
    }
  } finally {
    submitting.value = false
  }
}

// 辅助函数
const checkCouponAvailable = (item: any) => {
  return goodsTotalPrice.value >= (item.minPoint || 0)
}

const getLabel = (item: any) => {
  let label = `${item.name} (省${item.amount})`
  label += item.minPoint > 0 ? ` [满${item.minPoint}可用]` : ` [无门槛]`
  if (!checkCouponAvailable(item)) {
    label += ' (未满足门槛)'
  }
  return label
}

const handleCouponChange = () => {
  if (orderForm.couponId) {
    const coupon = couponList.value.find((c) => c.couponId === orderForm.couponId)
    if (coupon && !checkCouponAvailable(coupon)) {
      ElMessage.warning('当前金额未满足该优惠券门槛')
      orderForm.couponId = null
    }
  }
}

onMounted(() => {
  fetchCartData()
  fetchCoupons()
})
</script>

<style scoped>
.checkout-container {
  max-width: 1200px;
  margin: 24px auto 48px;
  padding: 0 20px;
}

.checkout-card {
  overflow: hidden;
  border: 1px solid var(--app-border);
  border-radius: 16px;
  background: var(--app-surface);
  box-shadow: var(--app-shadow-md);
}

.checkout-card :deep(.el-card__header) {
  border-bottom: 1px solid var(--app-border);
  background:
    linear-gradient(90deg, rgba(64, 158, 255, 0.1), rgba(103, 194, 58, 0.08)),
    var(--app-surface);
}

.checkout-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 16px;
}

.checkout-header h2 {
  margin: 0;
  color: var(--app-text);
  font-size: 22px;
  font-weight: 800;
}

.checkout-header p {
  margin: 6px 0 0;
  color: var(--app-text-muted);
  font-size: 14px;
}

.section {
  margin-bottom: 22px;
  padding: 20px;
  border: 1px solid var(--app-border);
  border-radius: 14px;
  background: var(--app-surface-soft);
}

.section-header {
  display: flex;
  align-items: center;
  gap: 10px;
  margin-bottom: 12px;
}

.section-icon {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  width: 34px;
  height: 34px;
  border-radius: 10px;
  color: var(--app-primary);
  background: rgba(64, 158, 255, 0.12);
}

h3 {
  font-size: 16px;
  color: var(--app-text);
  margin: 0;
}

.checkout-table {
  border-radius: 12px;
  overflow: hidden;
}

.checkout-table :deep(.el-table__header-wrapper th) {
  background: var(--app-surface-muted);
  color: var(--app-text);
  font-weight: 600;
}

.checkout-table :deep(.el-table__row:hover td) {
  background: color-mix(in srgb, var(--app-primary) 5%, var(--app-surface));
}

:deep(.el-select .el-input__wrapper),
:deep(.el-textarea__inner) {
  border-radius: 12px;
  box-shadow: 0 0 0 1px var(--app-border) inset;
}

.footer-bar {
  display: flex;
  justify-content: flex-end;
  align-items: center;
  gap: 24px;
  margin: 28px -20px -20px;
  border-top: 1px solid var(--app-border);
  padding: 20px;
  background: color-mix(in srgb, var(--app-surface) 94%, transparent);
  backdrop-filter: blur(10px);
}

.total-wrapper {
  text-align: right;
}

.total-row {
  margin-bottom: 8px;
  display: flex;
  justify-content: flex-end;
  align-items: center;
  gap: 12px;
}

.total-wrapper .label {
  color: var(--app-text-muted);
  font-size: 14px;
}

.total-wrapper .value {
  font-weight: bold;
  font-size: 14px;
  color: var(--app-text);
  min-width: 80px;
  text-align: right;
}

.discount-label {
  color: var(--app-text-muted);
}

.discount-value {
  color: var(--app-success);
}

.real-price {
  color: var(--app-danger);
  font-size: 28px;
  font-weight: bold;
  min-width: 120px;
  text-align: right;
}

.coupon-tip {
  margin-top: 10px;
  color: var(--app-danger);
  font-size: 14px;
}

:deep(.el-card__header) {
  color: var(--app-text);
}

@media (max-width: 768px) {
  .checkout-container {
    padding: 0 14px;
  }

  .checkout-header,
  .footer-bar {
    align-items: stretch;
    flex-direction: column;
  }

  .section {
    padding: 16px;
  }

  .total-wrapper {
    width: 100%;
  }
}
</style>
