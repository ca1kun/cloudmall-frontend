<template>
    <div class="app-container">
        <el-steps :active="step" finish-status="success" align-center>
            <el-step title="MakeNewSale" />
            <el-step title="EnterItem" />
            <el-step title="EndSale" />
            <el-step title="MakePayment" />
        </el-steps>
        <el-divider />
        <el-row :gutter="20">
            <el-col :span="5">
                <el-card>
                    <template #header>
                        <span>商品录入</span>
                    </template>
                    <el-form :model="enterItemForm" label-width="auto">
                        <el-form-item label="商品编码">
                            <el-select v-model="enterItemForm.itemSn" placeholder="请选择商品" filterable>
                                <el-option v-for="item in productOptions" :key="item.productSn"
                                    :label="item.productName" :value="item.productSn" />
                            </el-select>
                        </el-form-item>
                        <el-form-item label="订购数量">
                            <el-input-number v-model="enterItemForm.quantity" :min="1" controls-position="right" />
                        </el-form-item>
                        <el-form-item>
                            <el-button type="primary" size="small" :disabled="step !== 1" @click="handleEnterItem">
                                添加商品
                            </el-button>
                            <el-button type="success" size="small" :disabled="step !== 1 || tableData.length === 0"
                                @click="handleEndSale">
                                结束录入
                            </el-button>
                        </el-form-item>
                    </el-form>
                </el-card>
                <el-divider />
                <el-card>
                    <template #header>
                        <span>订单支付</span>
                    </template>
                    <el-form :model="makePaymentForm" label-width="auto">
                        <el-form-item label="支付方式">
                            <el-select v-model="makePaymentForm.payMethod" :disabled="step !== 3">
                                <el-option label="现金" value="CASH" />
                                <el-option label="支付宝" value="ALIPAY" />
                                <el-option label="微信支付" value="WECHAT_PAY" />
                            </el-select>
                        </el-form-item>
                        <el-form-item label="实收金额">
                            <el-input-number v-model="makePaymentForm.cashTendered" :min="0" :precision="2"
                                controls-position="right" :disabled="step !== 3" style="width: 100%;" />
                        </el-form-item>
                        <el-form-item label="找零">
                            <el-input :value="makePaymentForm.changeDue.toFixed(2)" readonly />
                        </el-form-item>
                        <el-form-item>
                            <el-button type="danger" size="small" :disabled="step !== 3" @click="handleMakePayment">
                                确认支付
                            </el-button>
                        </el-form-item>
                    </el-form>
                </el-card>
            </el-col>

            <el-col :span="19">
                <el-descriptions title="订单信息" :column="3" border>
                    <template #extra>
                        <el-button type="warning" :disabled="step !== 1 || tableData.length === 0"
                            @click="handleHoldOrder">
                            挂起订单
                        </el-button>
                        <el-button type="success" :disabled="!(step === 0 || step === 4)" @click="handleMakeNewSale">
                            开始新销售
                        </el-button>
                    </template>
                    <el-descriptions-item label="会员">{{ customerName }}</el-descriptions-item>
                    <el-descriptions-item label="订单号">{{ sale.saleNo }}</el-descriptions-item>
                    <el-descriptions-item label="总金额">{{ sale.total.toFixed(2) }}</el-descriptions-item>
                    <el-descriptions-item label="总件数">{{ totalQuantity }}</el-descriptions-item>
                    <el-descriptions-item label="状态">{{ sale.status }}</el-descriptions-item>
                </el-descriptions>
                <el-divider />
                <el-card>
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
                        <el-table-column label="操作" align="center">
                            <template #default="scope">
                                <el-button link type="primary" icon="Delete" size="small" :disabled="step !== 1"
                                    @click="handleDelete(scope.row)">删除</el-button>
                            </template>
                        </el-table-column>
                    </el-table>
                    <template #footer>总件数: {{ totalQuantity }}件 ｜ 总金额: {{ totalAmount.toFixed(2) }} 元</template>
                </el-card>
            </el-col>
        </el-row>
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

function handleEndSale() {
    endSale(sale.value.saleId!).then(response => {
        sale.value = response.data
        makePaymentForm.value.cashTendered = sale.value.total
        step.value = 3
    })
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
        }
    })
}

onMounted(() => {
    listAllProduct().then((response: any) => {
        productOptions.value = response.data
    })
})

const tableRowClassName = ({ row, rowIndex }: { row: SaleItem; rowIndex: number }) => {
    row.index = rowIndex + 1
    return (rowIndex % 2 === 0) ? 'warning-row' : 'success-row'
}

</script>

<style scoped>
.el-descriptions {
    margin-top: 20px;
}

.cell-item {
    display: flex;
    align-items: center;
}

.margin-top {
    margin-top: 20px;
}

.el-table .warning-row {
    --el-table-tr-bg-color: var(--el-color-warning-light-9);
}

.el-table .success-row {
    --el-table-tr-bg-color: var(--el-color-success-light-9);
}
</style>
