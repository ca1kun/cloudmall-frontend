<template>
  <div class="app-container page-shell coupon-page">
    <el-card class="page-card" shadow="never">
      <div class="page-header">
        <div>
          <h2 class="page-title">营销管理</h2>
          <p class="page-subtitle">创建并管理店铺优惠券，支持预热与库存控制。</p>
        </div>
        <div class="page-toolbar">
          <el-tag effect="plain" type="info">当前范围：商家店铺券</el-tag>
          <el-button type="primary" icon="Plus" @click="handleAdd">新增优惠券</el-button>
          <el-button icon="Refresh" @click="fetchData">刷新</el-button>
        </div>
      </div>

      <el-table :data="tableData" border class="soft-table coupon-table" v-loading="loading">
        <el-table-column prop="id" label="ID" width="80" />
        <el-table-column prop="name" label="名称" min-width="180" />
        <el-table-column prop="scopeType" label="适用范围" width="130" align="center">
          <template #default="{ row }">
            <el-tag :type="row.scopeType === 'MERCHANT' ? 'warning' : 'success'" effect="plain" size="small">
              {{ getScopeTag(row.scopeType) }}
            </el-tag>
          </template>
        </el-table-column>
        <el-table-column prop="amount" label="面额" width="100">
          <template #default="{ row }">¥{{ row.amount }}</template>
        </el-table-column>
        <el-table-column prop="minPoint" label="门槛" width="120">
          <template #default="{ row }">满 {{ row.minPoint }}</template>
        </el-table-column>
        <el-table-column prop="count" label="库存" width="100" />
        <el-table-column label="有效期" width="320">
          <template #default="{ row }">
            {{ formatTime(row.startTime) }} ~ {{ formatTime(row.endTime) }}
          </template>
        </el-table-column>
        <el-table-column label="操作" width="200" fixed="right">
          <template #default="{ row }">
            <el-button type="warning" size="small" icon="Lightning" @click="handlePreheat(row)">预热</el-button>
            <el-button type="danger" size="small" link>删除</el-button>
          </template>
        </el-table-column>
      </el-table>
    </el-card>

    <el-dialog v-model="dialogVisible" title="新增优惠券" width="520px" destroy-on-close>
      <el-form ref="formRef" :model="form" :rules="rules" label-width="100px">
        <el-form-item label="优惠券名称" prop="name">
          <el-input v-model="form.name" placeholder="例如：满100减10" />
        </el-form-item>
        <el-form-item label="适用范围">
          <el-input model-value="商家店铺券" disabled />
        </el-form-item>
        <el-form-item label="面额" prop="amount">
          <el-input-number v-model="form.amount" :min="1" :precision="2" />
        </el-form-item>
        <el-form-item label="使用门槛" prop="minPoint">
          <el-input-number v-model="form.minPoint" :min="0" :precision="2" />
          <span style="margin-left: 10px; font-size: 12px; color: #999;">0表示无门槛</span>
        </el-form-item>
        <el-form-item label="发行数量" prop="count">
          <el-input-number v-model="form.count" :min="1" :step="10" />
        </el-form-item>
        <el-form-item label="每人限领" prop="perLimit">
          <el-input-number v-model="form.perLimit" :min="1" />
        </el-form-item>
        <el-form-item label="有效期" prop="timeRange">
          <el-date-picker
            v-model="form.timeRange"
            type="datetimerange"
            range-separator="至"
            start-placeholder="开始时间"
            end-placeholder="结束时间"
            value-format="YYYY-MM-DD HH:mm:ss"
          />
        </el-form-item>
      </el-form>
      <template #footer>
        <el-button @click="dialogVisible = false">取消</el-button>
        <el-button type="primary" @click="submitForm">确定</el-button>
      </template>
    </el-dialog>
  </div>
</template>

<script setup lang="ts">
import { onMounted, reactive, ref } from 'vue'
import { getCouponPageApi, addCouponApi, preheatCouponApi } from '@/api/marketing/coupon'
import { ElMessage, ElMessageBox } from 'element-plus'
import { Plus, Refresh, Lightning } from '@element-plus/icons-vue'
import type { Coupon, CouponForm } from '@/types/types'

const loading = ref(false)
const tableData = ref<Coupon[]>([])
const dialogVisible = ref(false)
const formRef = ref()

const form = reactive<Omit<CouponForm, 'startTime' | 'endTime'> & { timeRange: string[] }>({
  name: '',
  amount: 10,
  minPoint: 0,
  count: 100,
  perLimit: 1,
  scopeType: 'MERCHANT',
  timeRange: [] as string[],
})

const rules = {
  name: [{ required: true, message: '请输入名称', trigger: 'blur' }],
  amount: [{ required: true, message: '请输入面额', trigger: 'blur' }],
  count: [{ required: true, message: '请输入数量', trigger: 'blur' }],
  timeRange: [{ required: true, message: '请选择时间范围', trigger: 'change' }]
}

const fetchData = async () => {
  loading.value = true
  const res = await getCouponPageApi({ scopeType: 'MERCHANT' })
  if (res.code === 200) {
    tableData.value = res.data.records ?? res.data.list ?? []
  }
  loading.value = false
}

const handleAdd = () => {
  form.scopeType = 'MERCHANT'
  dialogVisible.value = true
}

const submitForm = async () => {
  if (!formRef.value) return
  await formRef.value.validate(async (valid: boolean) => {
    if (valid) {
      const postData: CouponForm = {
        name: form.name,
        amount: form.amount,
        minPoint: form.minPoint,
        count: form.count,
        perLimit: form.perLimit,
        scopeType: 'MERCHANT',
        startTime: form.timeRange?.[0] || '',
        endTime: form.timeRange?.[1] || ''
      }
      const res = await addCouponApi(postData)
      if (res.code === 200) {
        ElMessage.success('添加成功')
        dialogVisible.value = false
        fetchData()
      }
    }
  })
}

const handlePreheat = (row: Coupon) => {
  if (!row.id) return
  const couponId = row.id
  ElMessageBox.confirm(
    `确定要将【${row.name}】的库存加载到 Redis 吗？\n注意：这会重置当前券的预热状态！`,
    '预热确认',
    { type: 'warning' }
  ).then(async () => {
    const res = await preheatCouponApi(couponId)
    if (res.code === 200) {
      ElMessage.success('预热成功！可以开始秒杀了')
    }
  })
}

const getScopeTag = (scopeType?: 'MALL' | 'MERCHANT') => {
  return scopeType === 'MERCHANT' ? '商家店铺券' : '全商城券'
}

const formatTime = (time: string) => {
  return time ? time.replace('T', ' ') : ''
}

onMounted(() => {
  fetchData()
})
</script>

<style scoped>
.header-actions {
  display: flex;
  gap: 10px;
}

.coupon-page {
  min-height: 100%;
}

.coupon-table {
  margin-top: 2px;
}
</style>
