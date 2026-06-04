<template>
  <div class="checkout-container">
    <el-card header="填写并核对订单信息">
      <!-- 1. 收货地址 -->
      <div class="section">
        <div class="section-header">
          <h3>📍 收货人信息</h3>
        </div>
        <AddressManager
          ref="addressManagerRef"
          v-model="orderForm.addressId"
          @change="handleAddressChange"
        />
      </div>

      <!-- 2. 商品清单 -->
      <div class="section">
        <h3>📦 商品清单</h3>
        <el-table :data="cartList" border>
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
        <h3>🎫 优惠券</h3>
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
        <h3>📝 备注信息</h3>
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
  margin: 20px auto;
}

.section {
  margin-bottom: 30px;
}

.section-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 12px;
}

h3 {
  font-size: 16px;
  color: var(--app-text);
  margin: 0;
}

.footer-bar {
  display: flex;
  justify-content: flex-end;
  align-items: center;
  gap: 24px;
  margin-top: 40px;
  border-top: 1px solid var(--app-border);
  padding-top: 24px;
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
  font-size: 18px;
  font-weight: 600;
  color: var(--app-text);
}
</style>
