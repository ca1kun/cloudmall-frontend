<template>
    <div class="pos-sale-page page-shell">
        <el-card class="page-card" shadow="never">
            <div class="page-header">
                <div>
                    <span class="page-eyebrow">POS CHECKOUT</span>
                    <h2 class="page-title">收银台</h2>
                    <p class="page-subtitle">录入商品、确认订单并完成线下收款。</p>
                </div>
                <el-button type="success" icon="Plus" :disabled="!(step === 0 || step === 4)" @click="handleMakeNewSale">
                    开始新销售
                </el-button>
            </div>

            <el-steps :active="step" finish-status="success" align-center class="sale-steps">
                <el-step title="创建订单" />
                <el-step title="录入商品" />
                <el-step title="确认订单" />
                <el-step title="完成支付" />
            </el-steps>

            <el-row :gutter="18" class="checkout-layout">
            <el-col :xs="24" :lg="7">
                <el-card class="control-card" shadow="never">
                    <template #header>
                        <div class="card-title">
                            <strong>商品录入</strong>
                            <el-tag :type="step === 1 ? 'success' : 'info'" effect="light">
                                {{ step === 1 ? '录入中' : '等待订单' }}
                            </el-tag>
                        </div>
                    </template>
                    <el-form :model="enterItemForm" label-position="top">
                        <el-form-item label="商品编码">
                            <el-select v-model="enterItemForm.itemSn" placeholder="请选择商品" filterable class="full-control">
                                <el-option v-for="item in productOptions" :key="item.productSn"
                                    :label="item.productName" :value="item.productSn" />
                            </el-select>
                        </el-form-item>
                        <el-form-item label="订购数量">
                            <el-input-number v-model="enterItemForm.quantity" :min="1" controls-position="right"
                                class="full-control" />
                        </el-form-item>
                        <el-form-item class="control-actions">
                            <el-button type="primary" :disabled="step !== 1" @click="handleEnterItem">
                                添加商品
                            </el-button>
                            <el-button type="success" :disabled="step !== 1 || tableData.length === 0"
                                @click="handleEndSale">
                                结束录入
                            </el-button>
                        </el-form-item>
                    </el-form>
                </el-card>
                <el-card class="control-card payment-card" shadow="never">
                    <template #header>
                        <div class="card-title">
                            <strong>订单支付</strong>
                            <span class="payable-amount">应收 ¥{{ sale.total.toFixed(2) }}</span>
                        </div>
                    </template>
                    <el-form :model="makePaymentForm" label-position="top">
                        <el-form-item label="支付方式">
                            <el-select v-model="makePaymentForm.payMethod" :disabled="step !== 3" class="full-control">
                                <el-option label="现金" value="CASH" />
                                <el-option label="支付宝" value="ALIPAY" />
                                <el-option label="微信支付" value="WECHAT_PAY" />
                            </el-select>
                        </el-form-item>
                        <el-form-item label="实收金额">
                            <el-input-number v-model="makePaymentForm.cashTendered" :min="0" :precision="2"
                                controls-position="right" :disabled="step !== 3" class="full-control" />
                        </el-form-item>
                        <el-form-item label="找零">
                            <el-input :value="makePaymentForm.changeDue.toFixed(2)" readonly />
                        </el-form-item>
                        <el-form-item>
                            <el-button type="danger" class="payment-button" :disabled="step !== 3" @click="handleMakePayment">
                                确认支付
                            </el-button>
                        </el-form-item>
                    </el-form>
                </el-card>
            </el-col>

            <el-col :xs="24" :lg="17">
                <el-descriptions title="订单信息" :column="3" border class="sale-summary">
                    <template #extra>
                        <el-button type="warning" :disabled="step !== 1 || tableData.length === 0"
                            @click="handleHoldOrder">
                            挂起订单
                        </el-button>
                    </template>
                    <el-descriptions-item label="会员">{{ customerName }}</el-descriptions-item>
                    <el-descriptions-item label="订单号">{{ sale.saleNo }}</el-descriptions-item>
                    <el-descriptions-item label="总金额">{{ sale.total.toFixed(2) }}</el-descriptions-item>
                    <el-descriptions-item label="总件数">{{ totalQuantity }}</el-descriptions-item>
                    <el-descriptions-item label="状态">{{ sale.status }}</el-descriptions-item>
                </el-descriptions>
                <el-card class="items-card" shadow="never">
                    <template #header>
                        <span>订单明细</span>
                    </template>
                    <el-table :data="tableData" style="width: 100%" :row-class-name="tableRowClassName">
                        <el-table-column prop="index" label="序号" width="80" />
                        <el-table-column prop="itemSn" label="商品编码" />
                        <el-table-column prop="productName" label="商品名称" />
                        <el-table-column prop="price" label="销售价格" />
                        <el-table-column prop="quantity" label="订购数量" width="200">
                            <template #default="scope">
                                <el-input-number size="small" v-model="scope.row.quantity" :disabled="step !== 1"
                                    :min="1" @change="handleChangeQuantity(scope.row)" />
                            </template>
                        </el-table-column>
                        <el-table-column label="操作" align="center" width="110">
                            <template #default="scope">
                                <el-button type="danger" plain icon="Delete" size="small" :disabled="step !== 1"
                                    @click="handleDelete(scope.row)">删除</el-button>
                            </template>
                        </el-table-column>
                    </el-table>
                    <template #footer>
                        <div class="order-total">
                            <span>共 {{ totalQuantity }} 件商品</span>
                            <strong>合计 ¥{{ totalAmount.toFixed(2) }}</strong>
                        </div>
                    </template>
                </el-card>
            </el-col>
        </el-row>
        </el-card>
    </div>
</template>

<script lang="ts" setup>
import { ref, onMounted, watch } from 'vue'
import { ElMessage, ElMessageBox } from 'element-plus'
import {
    enterItem,
    makeNewSale,
    endSale,
    makePayment,
    changeQuantity,
    deleteSaleItem,
    holdCurrentOrder
} from '@/api/system/sale'
import type { Sale, Product, EnterItemForm, SaleItem, MakePaymentForm } from "@/types/types"
import { listAllProduct } from '@/api/item/product'

const step = ref(0)

const totalQuantity = ref(0)
const totalAmount = ref(0.00)
const customerName = ref('guest')
const sale = ref<Sale>({
    saleId: undefined,
    saleNo: '',
    total: 0.00,
    totalQuantity: 0,
    status: '',
})
const productOptions = ref<Product[]>([])
const enterItemForm = ref<EnterItemForm>({ itemSn: '', quantity: 1 })
const tableData = ref<SaleItem[]>([])
const makePaymentForm = ref<MakePaymentForm>({
    payMethod: 'CASH',
    cashTendered: 0.00,
    changeDue: 0.00
})

function handleMakeNewSale() {
    tableData.value = []
    enterItemForm.value = { itemSn: '', quantity: 1 }
    makePaymentForm.value = { payMethod: 'CASH', cashTendered: 0.00, changeDue: 0.00 }
    sale.value = {
        saleId: undefined,
        saleNo: '---',
        total: 0.00,
        totalQuantity: 0,
        status: '正在创建...',
    }
    step.value = 0

    makeNewSale().then(response => {
        sale.value = response.data

        ElMessage.success(`新订单创建成功，订单号: ${sale.value.saleNo}`)

        step.value = 1

    }).catch(error => {
        console.error('创建订单失败:', error)
        ElMessage.error('创建订单失败，请重试')
        sale.value.status = '创建失败'
        step.value = 0
    })
}

async function handleEnterItem() {
    if (!enterItemForm.value.itemSn) {
        ElMessage.error('请选择一个商品')
        return
    }
    try {
        console.log('调用 enterItem，参数:', {
            saleId: sale.value.saleId,
            itemSn: enterItemForm.value.itemSn,
            quantity: enterItemForm.value.quantity,
            saleStatus: sale.value.status
        })
        const response = await enterItem(sale.value.saleId!, enterItemForm.value)
        tableData.value = response.data
        ElMessage.success('商品添加成功')
    } catch (error) {
        console.error('添加商品失败:', error)
    } finally {
        enterItemForm.value.itemSn = ''
        enterItemForm.value.quantity = 1
    }
}

async function handleEndSale() {
    try {
        const response = await endSale(sale.value.saleId!)
        sale.value = response.data
        makePaymentForm.value.cashTendered = sale.value.total
        step.value = 3
    } catch (error) {
        console.error('结束录入失败:', error)
        ElMessage.error('订单确认失败，请重试')
    }
}

async function handleMakePayment() {
    if (makePaymentForm.value.cashTendered < sale.value.total) {
        ElMessage.warning('实收金额不能小于订单总金额')
        return
    }
    try {
        const response = await makePayment(sale.value.saleId!, makePaymentForm.value)
        makePaymentForm.value.changeDue = response.data.changeDue
        ElMessage.success(`支付成功！应找零: ${response.data.changeDue.toFixed(2)} 元`)
        step.value = 4
    } catch (error) {
        console.error('支付请求失败:', error)
    }
}

function handleHoldOrder() {
    ElMessageBox.confirm(
        '您确定要挂起当前订单吗？挂起后将清空收银台。',
        '挂单确认',
        {
            confirmButtonText: '确定挂单',
            cancelButtonText: '取消',
            type: 'warning',
        }
    ).then(async () => {
        try {
            await holdCurrentOrder(sale.value.saleId!)
            ElMessage.success('挂单成功！收银台已清空。')
            handleMakeNewSale()
        } catch (error) {
            console.error("挂单失败:", error)
            ElMessage.error('挂单失败，请重试')
        }
    }).catch(() => {
        ElMessage.info('已取消挂单操作')
    })
}

watch(tableData, (newTableData) => {
    if (newTableData.length > 0) {
        let amount = 0
        let quantity = 0
        newTableData.forEach(item => {
            amount += item.price * item.quantity
            quantity += item.quantity
        })
        totalAmount.value = amount
        totalQuantity.value = quantity
    } else {
        totalAmount.value = 0
        totalQuantity.value = 0
    }
}, { deep: true })

const handleChangeQuantity = async (row: SaleItem) => {
    try {
        const response = await changeQuantity(sale.value.saleId!, row.productId!, row.quantity)
        tableData.value = response.data
        ElMessage.success('数量修改成功')
    } catch (error) {
        console.error('修改数量失败:', error)
        ElMessage.error('数量修改失败')
    }
}

const handleDelete = (row: SaleItem) => {
    ElMessageBox.confirm(`确定删除商品 "${row.productName}" 吗?`, '警告', {
        confirmButtonText: '确定',
        cancelButtonText: '取消',
        type: 'warning',
    }).then(async () => {
        try {
            const response = await deleteSaleItem(sale.value.saleId!, row.productId!)
            tableData.value = response.data
            ElMessage.success('商品已删除')
        } catch (error) {
            console.error('删除失败:', error)
            ElMessage.error('商品删除失败')
        }
    })
}

onMounted(() => {
    listAllProduct()
        .then((response: any) => {
            productOptions.value = response.data
        })
        .catch(() => ElMessage.error('商品列表加载失败'))
})

const tableRowClassName = ({ row, rowIndex }: { row: SaleItem; rowIndex: number }) => {
    row.index = rowIndex + 1
    return (rowIndex % 2 === 0) ? 'warning-row' : 'success-row'
}

</script>

<style scoped>
.pos-sale-page {
    min-height: 100vh;
}

.page-card {
    overflow: hidden;
    border: 1px solid var(--app-border);
    border-radius: 16px;
}

.page-header {
    display: flex;
    gap: 16px;
    align-items: center;
    justify-content: space-between;
    margin-bottom: 24px;
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
    margin: 0;
    color: var(--app-text);
    font-size: 24px;
}

.page-subtitle {
    margin: 7px 0 0;
    color: var(--app-text-muted);
}

.sale-steps {
    margin-bottom: 26px;
    padding: 20px;
    border: 1px solid var(--app-border);
    border-radius: 12px;
    background: var(--app-surface-soft);
}

.checkout-layout {
    align-items: stretch;
}

.control-card,
.items-card {
    border: 1px solid var(--app-border);
    border-radius: 14px;
}

.payment-card,
.items-card {
    margin-top: 18px;
}

.card-title,
.order-total {
    display: flex;
    align-items: center;
    justify-content: space-between;
    gap: 12px;
}

.payable-amount,
.order-total strong {
    color: var(--app-danger);
    font-weight: 700;
}

.full-control {
    width: 100%;
}

.control-actions :deep(.el-form-item__content) {
    display: grid;
    grid-template-columns: 1fr 1fr;
    gap: 10px;
}

.control-actions :deep(.el-button + .el-button) {
    margin-left: 0;
}

.payment-button {
    width: 100%;
}

.sale-summary {
    overflow: hidden;
    border-radius: 12px;
}

.items-card :deep(.el-card__body) {
    padding: 0;
}

.order-total {
    width: 100%;
}

@media (max-width: 1200px) {
    .sale-summary {
        margin-top: 18px;
    }
}

@media (max-width: 768px) {
    .page-header {
        align-items: flex-start;
        flex-direction: column;
    }

    .page-header :deep(.el-button) {
        width: 100%;
    }

    .sale-steps {
        overflow-x: auto;
    }
}
</style>
