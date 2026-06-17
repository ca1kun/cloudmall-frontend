<template>
    <div class="pay-container">
        <el-card class="box-card" shadow="never">
            <div class="success-icon">
                <el-icon :color="'var(--app-success)'" size="60">
                    <CircleCheckFilled />
                </el-icon>
            </div>
            <h2 class="text-center">订单提交成功！</h2>
            <p class="text-center tip">请在 30 分钟内完成支付，否则订单将自动取消</p>

            <div class="info-list">
                <div class="item">
                    <span>订单编号：</span>
                    <span>{{ orderId }}</span>
                </div>
                <div class="item">
                    <span>支付金额：</span>
                    <span class="price">¥ {{ money }}</span>
                </div>
            </div>

            <div class="btn-group">
                <el-button type="primary" size="large" :icon="CreditCard" :loading="loading" @click="handleAlipay">
                    支付宝支付
                </el-button>
                <!-- 微信支付暂未实现，可以置灰 -->
                <el-button type="success" size="large" :icon="ChatDotRound" disabled> 微信支付 </el-button>
            </div>
        </el-card>
    </div>
</template>

<script setup lang="ts">
import { ref, onMounted } from 'vue'
import { useRoute } from 'vue-router'
import { alipayApi } from '@/api/mall/pay'
import { ChatDotRound, CircleCheckFilled, CreditCard } from '@element-plus/icons-vue'
import { ElMessage } from 'element-plus'

const route = useRoute()
const orderId = ref('')
const money = ref('')
const loading = ref(false)

onMounted(() => {
    // 从 URL 参数获取订单信息
    // 之前的 checkout.vue 跳转时应该写的是：router.push(`/mall/pay/confirm?orderId=${res.data.orderId}&money=${...}`)
    orderId.value = route.query.orderId as string
    money.value = (route.query.money as string) || '0.00'
})

const handleAlipay = async () => {
    loading.value = true
    try {
        // 1. 调用接口，强制转为 any 类型，不再受 TS 类型报错干扰
        const res = await alipayApi(Number(orderId.value)) as any

        console.log('支付接口返回:', res)

        // 2. 直接取 code，不要加 .data
        if (res.code === 200) {
            const formHtml = res.data // 这里直接取 data，就是那个 HTML 字符串

            // 3. 创建容器并提交
            const div = document.createElement('div')
            div.innerHTML = formHtml
            document.body.appendChild(div)

            // 4. 提交表单 (兼容性写法)
            const form = div.querySelector('form')
            if (form) {
                form.submit()
            } else {
                ElMessage.error('无法跳转支付：未找到表单')
            }
        } else {
            // 如果走到这里，说明 res.code 不等于 200
            ElMessage.error(res.message || '发起支付失败')
        }
    } catch (error) {
        console.error(error)
        ElMessage.error('系统错误')
    } finally {
        loading.value = false
    }
}
</script>

<style scoped>
.pay-container {
    display: flex;
    justify-content: center;
    min-height: calc(100vh - 120px);
    padding: 58px 20px;
    background:
        linear-gradient(180deg, rgba(64, 158, 255, 0.08), transparent 320px),
        var(--app-bg);
}

.box-card {
    width: min(520px, 100%);
    overflow: hidden;
    border: 1px solid var(--app-border);
    border-radius: 18px;
    background: var(--app-surface);
    box-shadow: var(--app-shadow-md);
}

.box-card :deep(.el-card__body) {
    padding: 36px;
}

.text-center {
    text-align: center;
}

.success-icon {
    width: 92px;
    height: 92px;
    display: flex;
    align-items: center;
    justify-content: center;
    margin: 0 auto 16px;
    border-radius: 50%;
    background: rgba(103, 194, 58, 0.12);
}

h2 {
    margin: 0;
    color: var(--app-text);
    font-size: 24px;
    font-weight: 800;
}

.tip {
    color: var(--app-text-muted);
    font-size: 14px;
    margin-bottom: 30px;
}

.info-list {
    border: 1px solid var(--app-border);
    border-radius: 14px;
    background: var(--app-surface-soft);
    padding: 18px;
    margin-bottom: 30px;
}

.item {
    display: flex;
    justify-content: space-between;
    gap: 18px;
    padding: 10px 0;
    font-size: 16px;
}

.item + .item {
    border-top: 1px dashed var(--app-border);
}

.item span:first-child {
    color: var(--app-text-muted);
}

.price {
    color: var(--app-danger);
    font-size: 20px;
    font-weight: bold;
}

.btn-group {
    display: flex;
    justify-content: center;
    gap: 12px;
}

.btn-group :deep(.el-button) {
    min-width: 140px;
    border-radius: 12px;
    font-weight: 700;
}

@media (max-width: 560px) {
    .box-card :deep(.el-card__body) {
        padding: 28px 20px;
    }

    .btn-group {
        flex-direction: column;
    }

    .btn-group :deep(.el-button) {
        width: 100%;
        margin-left: 0;
    }
}
</style>
