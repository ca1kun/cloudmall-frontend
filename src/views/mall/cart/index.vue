<template>
    <div class="cart-container">
        <el-card>
            <template #header>
                <div class="card-header">
                    <span>🛒 我的购物车</span>
                    <el-button type="text" @click="fetchCart">刷新</el-button>
                </div>
            </template>

            <!-- 购物车列表 -->
            <el-table :data="cartList" style="width: 100%" v-loading="loading">
                <el-table-column label="商品信息" width="400">
                    <template #default="{ row }">
                        <div style="display: flex; align-items: center;">
                            <el-image :src="row.productPic" style="width: 80px; height: 80px; border-radius: 4px;"
                                fit="cover" />
                            <span style="margin-left: 15px; font-weight: bold;">{{ row.productName }}</span>
                        </div>
                    </template>
                </el-table-column>

                <el-table-column label="单价" width="180">
                    <template #default="{ row }">
                        <!-- 1. 显示最新价格 -->
                        <div style="color: #303133; font-weight: bold;">
                            ¥ {{ row.currentPrice }}
                        </div>

                        <!-- 2. 降价提醒 -->
                        <div v-if="row.currentPrice < row.price"
                            style="font-size: 12px; color: #67C23A; margin-top: 4px;">
                            <el-icon>
                                <CaretBottom />
                            </el-icon>
                            比加入时降了 ¥{{ (row.price - row.currentPrice).toFixed(2) }}
                        </div>

                        <!-- 3. 涨价提醒 (可选) -->
                        <div v-else-if="row.currentPrice > row.price"
                            style="font-size: 12px; color: #F56C6C; margin-top: 4px;">
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
                        <span style="font-weight: bold;">¥ {{ (row.price * row.quantity).toFixed(2) }}</span>
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
                <el-button type="primary" size="large" @click="goToCheckout" :disabled="cartList.length === 0">
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
    padding: 20px;
    max-width: 1200px;
    margin: 0 auto;
}

.cart-footer {
    margin-top: 20px;
    display: flex;
    justify-content: flex-end;
    align-items: center;
    border-top: 1px solid #eee;
    padding-top: 20px;
}

.total {
    margin-right: 20px;
    font-size: 16px;
}

.price {
    color: #f56c6c;
    font-size: 24px;
    font-weight: bold;
}
</style>
