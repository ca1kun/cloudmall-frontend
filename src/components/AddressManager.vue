<template>
  <div class="address-manager">
    <!-- 地址卡片列表 -->
    <div v-if="addressList.length > 0" class="address-list">
      <div class="address-list-header">
        <span>已保存 {{ addressList.length }} 个收货地址</span>
        <span>点击卡片可选择地址</span>
      </div>
      <div class="address-grid" :class="{ 'is-scrollable': addressList.length > 6 }">
        <article
          v-for="addr in addressList"
          :key="addr.id"
          class="address-card"
          :class="{ active: selectedId === addr.id, default: addr.isDefault === 1 }"
          @click="selectedId = addr.id || 0"
        >
          <div class="card-header">
            <div class="contact-info">
                <span class="name">{{ addr.receiverName }}</span>
                <span class="phone">{{ addr.receiverPhone }}</span>
            </div>
            <el-tag v-if="addr.isDefault === 1" size="small" type="danger" effect="light">
              默认地址
            </el-tag>
          </div>

          <div class="card-body">
            <p class="address-label">收货地址</p>
            <p class="full-address" :title="formatFullAddress(addr)">
              {{ formatFullAddress(addr) }}
            </p>
            <p v-if="addr.zipCode" class="zip">邮政编码：{{ addr.zipCode }}</p>
          </div>

          <div class="card-footer">
            <el-button link type="primary" @click.stop="handleEdit(addr)">编辑</el-button>
            <el-button
              v-if="addr.isDefault !== 1"
              link
              type="primary"
              @click.stop="handleSetDefaultClick(addr)"
            >
              设为默认
            </el-button>
            <el-button link type="danger" @click.stop="handleDeleteClick(addr)">删除</el-button>
          </div>
        </article>
      </div>
    </div>

    <el-empty v-else description="暂无收货地址，请添加新地址" />

    <!-- 新增/编辑地址弹窗 -->
    <el-dialog v-model="dialogVisible" :title="isEdit ? '编辑收货地址' : '新增收货地址'" width="560px" destroy-on-close
      :close-on-click-modal="false">
      <el-form ref="formRef" :model="form" :rules="rules" label-width="90px" class="address-form">
        <el-form-item label="收货人" prop="receiverName">
          <el-input v-model="form.receiverName" placeholder="请输入收货人姓名" maxlength="20" />
        </el-form-item>

        <el-form-item label="手机号" prop="receiverPhone">
          <el-input v-model="form.receiverPhone" placeholder="请输入11位手机号" maxlength="11" />
        </el-form-item>

        <el-form-item label="所在地区" prop="region">
          <el-cascader v-model="regionValue" :options="regionOptions" :props="cascaderProps" placeholder="请选择省 / 市 / 区"
            clearable style="width: 100%" @change="handleRegionChange" />
        </el-form-item>

        <el-form-item label="详细地址" prop="detailAddress">
          <el-input v-model="form.detailAddress" type="textarea" :rows="2" placeholder="请输入街道、楼牌号等详细地址" maxlength="100"
            show-word-limit />
        </el-form-item>

        <el-form-item label="邮政编码" prop="zipCode">
          <el-input v-model="form.zipCode" placeholder="请输入邮政编码（选填）" maxlength="6" />
        </el-form-item>

        <el-form-item label="设为默认">
          <el-switch v-model="defaultSwitch" active-text="是" inactive-text="否" />
        </el-form-item>
      </el-form>

      <template #footer>
        <el-button @click="dialogVisible = false">取消</el-button>
        <el-button type="primary" :loading="submitting" @click="handleSubmit">
          保存
        </el-button>
      </template>
    </el-dialog>

    <!-- 底部操作栏 -->
    <div class="address-actions">
      <el-button type="primary" plain @click="handleAdd">
        <el-icon>
          <Plus />
        </el-icon>
        新增收货地址
      </el-button>
      <el-button v-if="addressList.length > 0" @click="handleManage">
        管理地址
      </el-button>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, reactive, computed, watch, onMounted } from 'vue'
import { ElMessage, ElMessageBox } from 'element-plus'
import type { FormInstance } from 'element-plus'
import { Plus } from '@element-plus/icons-vue'
import type { Address, AddressForm } from '@/types/types'
import {
  listAddressApi,
  addAddressApi,
  updateAddressApi,
  deleteAddressApi,
  setDefaultAddressApi,
} from '@/api/system/address'
import { codeToText, regionData } from 'element-china-area-data'

const props = defineProps<{
  modelValue?: number
}>()

const emit = defineEmits<{
  (e: 'update:modelValue', id: number): void
  (e: 'change', address?: Address): void
}>()

// ==================== 数据 ====================
const addressList = ref<Address[]>([])
const selectedId = ref<number>(props.modelValue || 0)
const dialogVisible = ref(false)
const isEdit = ref(false)
const submitting = ref(false)
type AddressFormModel = AddressForm & {
  id?: number
}

const formRef = ref<FormInstance>()

const form = reactive<AddressFormModel>({
  id: undefined,
  receiverName: '',
  receiverPhone: '',
  province: '',
  city: '',
  district: '',
  detailAddress: '',
  zipCode: '',
  isDefault: 0,
})

const regionValue = ref<string[]>([])
const defaultSwitch = ref(false)

// 省市区数据
const regionOptions = regionData
const cascaderProps = {
  value: 'value',
  label: 'label',
  children: 'children',
}

// ==================== 校验规则 ====================
const rules = {
  receiverName: [
    { required: true, message: '请输入收货人姓名', trigger: 'blur' },
    { min: 2, max: 20, message: '姓名长度2-20个字符', trigger: 'blur' },
  ],
  receiverPhone: [
    { required: true, message: '请输入手机号', trigger: 'blur' },
    { pattern: /^1[3-9]\d{9}$/, message: '请输入正确的11位手机号', trigger: 'blur' },
  ],
  region: [
    {
      required: true,
      validator: (_rule: any, _value: any, callback: any) => {
        if (!form.province || !form.city || !form.district) {
          callback(new Error('请选择完整的省市区'))
        } else {
          callback()
        }
      },
      trigger: 'change',
    },
  ],
  detailAddress: [
    { required: true, message: '请输入详细地址', trigger: 'blur' },
    { min: 5, max: 100, message: '详细地址长度5-100个字符', trigger: 'blur' },
  ],
  zipCode: [
    { pattern: /^\d{6}$/, message: '邮政编码为6位数字', trigger: 'blur' },
  ],
}

// ==================== 计算属性 ====================
const selectedAddress = computed(() => {
  return addressList.value.find((a) => a.id === selectedId.value)
})

const formatRegionName = (value?: string) => {
  if (!value) return ''
  return codeToText[value] || value
}

const formatFullAddress = (address: Address) => {
  const region = [address.province, address.city, address.district]
    .map(formatRegionName)
    .filter(Boolean)
    .join(' ')

  return [region, address.detailAddress].filter(Boolean).join(' ')
}

// 类型守卫
const isStringArray = (value: unknown): value is string[] => {
  return Array.isArray(value) && value.every((item) => typeof item === 'string')
}

// ==================== Watch ====================
watch(selectedId, (val) => {
  emit('update:modelValue', val)
  emit('change', selectedAddress.value)
})

watch(
  () => props.modelValue,
  (val) => {
    if (val !== undefined) selectedId.value = val
  }
)

// ==================== 方法 ====================
const fetchAddressList = async () => {
  try {
    const res = await listAddressApi({ pageNum: 1, pageSize: 50 })
    if (res.code === 200) {
      const list = (res.data?.records || res.data?.list || []) as Address[]
      addressList.value = list
      // 如果没有选中地址，自动选中默认地址
      if (selectedId.value === 0 && list.length > 0) {
        const defaultAddr = list.find((a) => a.isDefault === 1)
        const firstAddr = list[0]

        selectedId.value = defaultAddr?.id ?? firstAddr?.id ?? 0
      }
    }
  } catch (error) {
    console.error('获取地址列表失败', error)
  }
}

const resetForm = () => {
  form.id = undefined
  form.receiverName = ''
  form.receiverPhone = ''
  form.province = ''
  form.city = ''
  form.district = ''
  form.detailAddress = ''
  form.zipCode = ''
  form.isDefault = 0
  regionValue.value = []
  defaultSwitch.value = false
}

const handleAdd = () => {
  resetForm()
  isEdit.value = false
  dialogVisible.value = true
}

const handleEdit = (addr: Address) => {
  isEdit.value = true
  form.id = addr.id
  form.receiverName = addr.receiverName
  form.receiverPhone = addr.receiverPhone
  form.province = addr.province ?? ''
  form.city = addr.city ?? ''
  form.district = addr.district ?? ''
  form.detailAddress = addr.detailAddress
  form.zipCode = addr.zipCode || ''
  form.isDefault = addr.isDefault
  defaultSwitch.value = addr.isDefault === 1

  // 回显省市区
  regionValue.value = [
    addr.province ?? '',
    addr.city ?? '',
    addr.district ?? '',
  ]
  dialogVisible.value = true
}

const handleRegionChange = (value: unknown) => {
  if (isStringArray(value) && value.length === 3) {
    const [province, city, district] = value as [string, string, string]

    form.province = province
    form.city = city
    form.district = district
  } else {
    form.province = ''
    form.city = ''
    form.district = ''
  }

  formRef.value?.validateField?.('region')
}

const handleSubmit = async () => {
  if (!formRef.value) return
  await formRef.value.validate(async (valid: boolean) => {
    if (!valid) {
      ElMessage.warning('请检查表单填写是否正确')
      return
    }

    submitting.value = true
    try {
      form.isDefault = defaultSwitch.value ? 1 : 0
      let res
      if (isEdit.value && form.id) {
        res = await updateAddressApi(form)
      } else {
        res = await addAddressApi(form)
      }

      if (res.code === 200) {
        ElMessage.success(isEdit.value ? '地址修改成功' : '地址添加成功')
        dialogVisible.value = false
        await fetchAddressList()
      } else {
        ElMessage.error(res.message || '操作失败')
      }
    } catch (error) {
      console.error(error)
    } finally {
      submitting.value = false
    }
  })
}

const handleSetDefaultClick = (addr: Address) => {
  if (!addr.id) {
    ElMessage.warning('地址ID不存在，无法设置默认地址')
    return
  }
  handleSetDefault(addr.id)
}

const handleDeleteClick = (addr: Address) => {
  if (!addr.id) {
    ElMessage.warning('地址ID不存在，无法删除')
    return
  }
  handleDelete(addr.id)
}

const handleDelete = async (id: number) => {
  try {
    await ElMessageBox.confirm('确定要删除该收货地址吗？', '提示', {
      confirmButtonText: '确定',
      cancelButtonText: '取消',
      type: 'warning',
    })
    const res = await deleteAddressApi(id)
    if (res.code === 200) {
      ElMessage.success('删除成功')
      if (selectedId.value === id) selectedId.value = 0
      await fetchAddressList()
    } else {
      ElMessage.error(res.message || '删除失败')
    }
  } catch (error) {
    // 用户取消
  }
}

const handleSetDefault = async (id: number) => {
  try {
    const res = await setDefaultAddressApi(id)
    if (res.code === 200) {
      ElMessage.success('默认地址设置成功')
      await fetchAddressList()
    } else {
      ElMessage.error(res.message || '设置失败')
    }
  } catch (error) {
    console.error(error)
  }
}

const handleManage = () => {
  // 可以扩展为跳转到专门的地址管理页面
  ElMessage.info('请使用编辑、设为默认、删除按钮管理地址')
}

// ==================== 暴露方法 ====================
defineExpose({
  refresh: fetchAddressList,
  getSelectedAddress: () => selectedAddress.value,
})

onMounted(() => {
  fetchAddressList()
})
</script>

<style scoped>
.address-manager {
  width: 100%;
}

.address-list {
  margin: 20px 0 24px;
}

.address-list-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 16px;
  margin-bottom: 12px;
  color: var(--app-text-muted);
  font-size: 13px;
}

.address-list-header span:first-child {
  color: var(--app-text);
  font-weight: 600;
}

.address-grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(min(100%, 320px), 1fr));
  gap: 16px;
}

.address-grid.is-scrollable {
  max-height: 590px;
  padding: 2px 8px 12px 2px;
  overflow-y: auto;
  overscroll-behavior: contain;
  scrollbar-color: var(--app-border) transparent;
  scrollbar-width: thin;
}

.address-grid.is-scrollable::-webkit-scrollbar {
  width: 6px;
}

.address-grid.is-scrollable::-webkit-scrollbar-thumb {
  border-radius: 6px;
  background: var(--app-border);
}

.address-card {
  display: flex;
  min-width: 0;
  min-height: 190px;
  flex-direction: column;
  padding: 18px;
  overflow: hidden;
  border: 1px solid var(--app-border);
  border-radius: 16px;
  background: var(--app-surface);
  box-shadow: 0 4px 16px rgba(15, 23, 42, 0.04);
  cursor: pointer;
  position: relative;
  transition:
    border-color 0.2s ease,
    box-shadow 0.2s ease,
    transform 0.2s ease;
}

.address-card:hover {
  border-color: var(--app-primary);
  box-shadow: 0 10px 26px rgba(37, 99, 235, 0.1);
  transform: translateY(-2px);
}

.address-card.active {
  border-color: var(--app-primary);
  background:
    linear-gradient(135deg, rgba(37, 99, 235, 0.07), transparent 55%),
    var(--app-surface);
  box-shadow:
    0 0 0 1px var(--app-primary),
    0 10px 26px rgba(37, 99, 235, 0.1);
}

.address-card.active::after {
  content: '';
  position: absolute;
  top: 14px;
  right: 14px;
  width: 8px;
  height: 8px;
  border: 3px solid var(--app-surface);
  border-radius: 50%;
  background: var(--app-primary);
  box-shadow: 0 0 0 2px var(--app-primary);
}

.card-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 12px;
  min-width: 0;
  margin-bottom: 16px;
  padding-right: 22px;
}

.contact-info {
  display: flex;
  min-width: 0;
  align-items: baseline;
  gap: 10px;
  flex-wrap: wrap;
}

.card-header .name {
  overflow-wrap: anywhere;
  color: var(--app-text);
  font-size: 18px;
  font-weight: 700;
}

.card-header .phone {
  color: var(--app-text-muted);
  font-size: 14px;
  white-space: nowrap;
}

.card-body {
  flex: 1;
  min-width: 0;
}

.address-label {
  margin: 0 0 6px;
  color: var(--app-text-muted);
  font-size: 12px;
  font-weight: 600;
  letter-spacing: 0.04em;
}

.full-address {
  display: -webkit-box;
  min-height: 48px;
  margin: 0;
  overflow: hidden;
  color: var(--app-text);
  font-size: 14px;
  font-weight: 500;
  line-height: 1.7;
  overflow-wrap: anywhere;
  -webkit-box-orient: vertical;
  -webkit-line-clamp: 2;
}

.card-body .zip {
  margin: 10px 0 0;
  color: var(--app-text-muted);
  font-size: 13px;
}

.card-footer {
  display: flex;
  align-items: center;
  gap: 6px;
  margin-top: 14px;
  padding-top: 12px;
  border-top: 1px solid var(--app-border);
}

.card-footer :deep(.el-button) {
  margin-left: 0;
}

.address-actions {
  display: flex;
  flex-wrap: wrap;
  gap: 12px;
  margin-top: 4px;
}

.address-form :deep(.el-input__wrapper),
.address-form :deep(.el-textarea__inner) {
  border-radius: 8px;
}

@media (max-width: 600px) {
  .address-list-header span:last-child {
    display: none;
  }

  .address-grid.is-scrollable {
    max-height: 520px;
  }

  .address-card {
    min-height: 180px;
    padding: 16px;
  }

  .card-header {
    align-items: flex-start;
  }

  .contact-info {
    flex-direction: column;
    gap: 4px;
  }
}
</style>
