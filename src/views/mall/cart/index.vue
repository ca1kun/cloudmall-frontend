<template>
    <div class="cart-container">
        <el-card class="cart-card" shadow="never">
            <template #header>
                <div class="card-header">
                    <div class="header-title">
                        <span class="title-icon">
                            <el-icon><ShoppingCart /></el-icon>
                        </span>
                        <span>我的购物车</span>
                        <el-tag v-if="cartList.length > 0" effect="plain" round>{{ cartList.length }} 件商品</el-tag>
                    </div>
                    <el-button class="refresh-btn" text :icon="Refresh" @click="fetchCart">刷新</el-button>
                </div>
            </template>

            <!-- 购物车列表 -->
            <el-table :data="cartList" class="cart-table" style="width: 100%" v-loading="loading">
                <el-table-column label="商品信息" width="400">
                    <template #default="{ row }">
                        <div class="cart-item">
                            <el-image :src="row.productPic" class="cart-item-image" fit="cover" />
                            <span class="cart-item-name">{{ row.productName }}</span>
                        </div>
                    </template>
                </el-table-column>

                <el-table-column label="单价" width="180">
                    <template #default="{ row }">
                        <!-- 1. 显示最新价格 -->
                        <div class="price-now">
                            ¥ {{ row.currentPrice }}
                        </div>

                        <!-- 2. 降价提醒 -->
                        <div v-if="row.currentPrice < row.price" class="price-drop">
                            <el-icon>
                                <CaretBottom />
                            </el-icon>
                            比加入时降了 ¥{{ (row.price - row.currentPrice).toFixed(2) }}
                        </div>

                        <!-- 3. 涨价提醒 (可选) -->
                        <div v-else-if="row.currentPrice > row.price" class="price-rise">
                            <el-icon>
                                <CaretTop />
                            </el-icon>
                            比加入时涨了 ¥{{ (row.currentPrice - row.price).toFixed(2) }}
                        </div>
                    </template>
                </el-table-column>

                <el-table-column label="数量" width="200">
                    <template #default="{ row }">
                        <!-- 步进器：直接绑定 row.quantity 会有问题，因为后端是增量更新 -->
                        <!-- 这里简化处理：change 事件触发时，计算差值发送给后端 -->
                        <el-input-number v-model="row.quantity" :min="1" :max="99" size="small"
                            @change="(val: number | undefined, oldVal: number | undefined) => handleQuantityChange(row, val, oldVal)" />
                    </template>
                </el-table-column>

                <el-table-column label="小计">
                    <template #default="{ row }">
                        <span class="subtotal">¥ {{ (row.price * row.quantity).toFixed(2) }}</span>
                    </template>
                </el-table-column>

                <el-table-column label="操作">
                    <template #default="{ row }">
                        <el-button type="danger" link @click="handleDelete(row)">删除</el-button>
                    </template>
                </el-table-column>
            </el-table>

            <!-- 底部结算栏 -->
            <div class="cart-footer">
                <div class="total">
                    总计：<span class="price">¥ {{ totalPrice }}</span>
                </div>
                <el-button class="checkout-btn" type="primary" size="large" :icon="ArrowRight" @click="goToCheckout" :disabled="cartList.length === 0">
                    去结算 ({{ cartList.length }})
                </el-button>
            </div>
        </el-card>
    </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted } from 'vue'
import { useRouter } from 'vue-router'
import { getCartListApi, addCartApi, deleteCartApi } from '@/api/mall/cart'
import { ElMessage, ElMessageBox } from 'element-plus'
import { useCartStore } from '@/stores/cart'
import type { CartItem } from '@/types/types'
import { ArrowRight, Refresh, ShoppingCart } from '@element-plus/icons-vue'

const cartStore = useCartStore()
const router = useRouter()
const loading = ref(false)
const cartList = ref<CartItem[]>([])

// 计算总价
const totalPrice = computed(() => {
    let sum = 0
    cartList.value.forEach(item => {
        // 使用 currentPrice 计算
        const price = item.currentPrice || item.price
        sum += price * item.quantity
    })
    return sum.toFixed(2)
})
// 获取购物车数据
const fetchCart = async () => {
    loading.value = true
    try {
        const res = await getCartListApi()
        if (res.code === 200) {
            cartList.value = res.data || []
        }
    } finally {
        loading.value = false
    }
}

// 修改数量
// val: 新值, oldVal: 旧值
const handleQuantityChange = async (row: CartItem, val: number | undefined, oldVal: number | undefined) => {
    if (val === undefined || oldVal === undefined) return

    // 计算差值 (比如从 1 变成 2，差值是 1；从 5 变成 3，差值是 -2)
    const diff = val - oldVal
    if (diff === 0) return

    try {
        // 调用后端接口
        await addCartApi({
            productId: row.productId,
            quantity: diff
        })
        // 这里的 row.quantity 已经在 v-model 里变了，不需要手动再改
    } catch (error) {
        // 如果失败，回滚前端显示
        row.quantity = oldVal
        ElMessage.error('修改失败')
    }
}

// 删除商品
const handleDelete = (row: CartItem) => {
    ElMessageBox.confirm('确定要移出购物车吗?', '提示', { type: 'warning' })
        .then(async () => {
            await deleteCartApi(row.productId)
            ElMessage.success('删除成功')
            fetchCart() // 刷新列表
            cartStore.updateCount() // 同步到 store
        })
        .catch(() => { })
}

// 去结算
const goToCheckout = () => {
    router.push('/mall/checkout')
}

onMounted(() => {
    fetchCart()
})
</script>

<style scoped>
.cart-container {
    padding: 24px 20px 48px;
    max-width: 1200px;
    margin: 0 auto;
}

.cart-card {
    overflow: hidden;
    border-radius: 16px;
    border: 1px solid var(--app-border);
    background: var(--app-surface);
    box-shadow: var(--app-shadow-md);
}

.cart-card :deep(.el-card__header) {
    border-bottom: 1px solid var(--app-border);
    background:
        linear-gradient(90deg, rgba(64, 158, 255, 0.1), rgba(103, 194, 58, 0.08)),
        var(--app-surface);
}

.card-header {
    display: flex;
    align-items: center;
    justify-content: space-between;
}

.header-title {
    display: inline-flex;
    align-items: center;
    gap: 10px;
    font-size: 18px;
    font-weight: 800;
    color: var(--app-text);
}

.title-icon {
    display: inline-flex;
    align-items: center;
    justify-content: center;
    width: 36px;
    height: 36px;
    border-radius: 12px;
    color: var(--app-primary);
    background: rgba(64, 158, 255, 0.12);
}

.refresh-btn {
    color: var(--app-text-muted);
}

.refresh-btn:hover {
    color: var(--app-primary);
}

.cart-table :deep(.el-table__header-wrapper th) {
    font-weight: 600;
    background: var(--app-surface-muted);
    color: var(--app-text);
    border-bottom-color: var(--app-border);
}

.cart-table :deep(.el-table__row td) {
    padding: 16px 0;
}

.cart-table :deep(.el-table__body tr:hover > td) {
    background: color-mix(in srgb, var(--app-primary) 5%, var(--app-surface));
}

.cart-table :deep(.el-table__inner-wrapper) {
    background: var(--app-surface);
}

.cart-table :deep(.el-table__body-wrapper),
.cart-table :deep(.el-table__header-wrapper) {
    background: var(--app-surface);
}

.cart-table :deep(.el-table__empty-block) {
    background: var(--app-surface);
}

.cart-table :deep(.el-table__empty-text) {
    color: var(--app-text-muted);
}

.cart-table :deep(.el-input-number) {
    background: var(--app-surface);
    border-radius: 10px;
    box-shadow: 0 0 0 1px var(--app-border) inset;
}

.cart-table :deep(.el-input-number__decrease),
.cart-table :deep(.el-input-number__increase) {
    background: var(--app-surface-muted);
    color: var(--app-text);
    border-color: var(--app-border);
}

.cart-table :deep(.el-input-number__decrease:hover),
.cart-table :deep(.el-input-number__increase:hover) {
    background: var(--app-surface-soft);
    color: var(--app-primary);
}

.cart-table :deep(.el-input__wrapper) {
    background: transparent;
    box-shadow: none;
}

.cart-item {
    display: flex;
    align-items: center;
    gap: 14px;
}

.cart-item-image {
    width: 80px;
    height: 80px;
    border-radius: 12px;
    border: 1px solid var(--app-border);
    background: var(--app-surface-muted);
}

.cart-item-name {
    font-weight: 700;
    color: var(--app-text);
    line-height: 1.5;
}

.price-now {
    color: var(--app-text);
    font-weight: 700;
}

.price-drop {
    font-size: 12px;
    color: var(--app-success);
    margin-top: 4px;
}

.price-rise {
    font-size: 12px;
    color: var(--app-danger);
    margin-top: 4px;
}

.subtotal {
    font-weight: 700;
    color: var(--app-text);
}

.cart-footer {
    position: sticky;
    bottom: 0;
    margin: 18px -20px -20px;
    display: flex;
    justify-content: flex-end;
    align-items: center;
    border-top: 1px solid var(--app-border);
    padding: 18px 20px;
    gap: 16px;
    background: color-mix(in srgb, var(--app-surface) 94%, transparent);
    backdrop-filter: blur(10px);
}

.total {
    margin-right: 20px;
    font-size: 16px;
    color: var(--app-text-muted);
}

.price {
    color: var(--app-danger);
    font-size: 24px;
    font-weight: bold;
}

.checkout-btn {
    box-shadow: 0 12px 26px rgba(37, 99, 235, 0.25);
    border-radius: 12px;
    padding: 12px 22px;
    font-weight: 700;
}

@media (max-width: 768px) {
    .cart-container {
        padding: 16px;
    }

    .cart-item-image {
        width: 64px;
        height: 64px;
    }

    .cart-footer {
        flex-direction: column;
        align-items: flex-end;
        margin-left: -16px;
        margin-right: -16px;
    }
}
</style>
