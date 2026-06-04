<template>
  <div class="address-manager">
    <!-- 地址卡片列表 -->
    <div v-if="addressList.length > 0" class="address-list">
      <el-radio-group v-model="selectedId" class="address-radio-group">
        <el-row :gutter="16">
          <el-col
            v-for="addr in addressList"
            :key="addr.id"
            :xs="24"
            :sm="12"
            :md="8"
          >
            <div
              class="address-card"
              :class="{ active: selectedId === addr.id, default: addr.isDefault === 1 }"
              @click="selectedId = addr.id || 0"
            >
              <div class="card-header">
                <span class="name">{{ addr.receiverName }}</span>
                <span class="phone">{{ addr.receiverPhone }}</span>
                <el-tag v-if="addr.isDefault === 1" size="small" type="danger" class="default-tag">
                  默认
                </el-tag>
              </div>
              <div class="card-body">
                <p class="region">{{ addr.province }} {{ addr.city }} {{ addr.district }}</p>
                <p class="detail">{{ addr.detailAddress }}</p>
                <p v-if="addr.zipCode" class="zip">邮编: {{ addr.zipCode }}</p>
              </div>
              <div class="card-footer">
                <el-button link type="primary" size="small" @click.stop="handleEdit(addr)">
                  编辑
                </el-button>
                <el-button link type="primary" size="small" @click.stop="handleSetDefault(addr.id!)">
                  设为默认
                </el-button>
                <el-button link type="danger" size="small" @click.stop="handleDelete(addr.id!)">
                  删除
                </el-button>
              </div>
            </div>
          </el-col>
        </el-row>
      </el-radio-group>
    </div>

    <el-empty v-else description="暂无收货地址，请添加新地址" />

    <!-- 新增/编辑地址弹窗 -->
    <el-dialog
      v-model="dialogVisible"
      :title="isEdit ? '编辑收货地址' : '新增收货地址'"
      width="560px"
      destroy-on-close
      :close-on-click-modal="false"
    >
      <el-form
        ref="formRef"
        :model="form"
        :rules="rules"
        label-width="90px"
        class="address-form"
      >
        <el-form-item label="收货人" prop="receiverName">
          <el-input v-model="form.receiverName" placeholder="请输入收货人姓名" maxlength="20" />
        </el-form-item>

        <el-form-item label="手机号" prop="receiverPhone">
          <el-input v-model="form.receiverPhone" placeholder="请输入11位手机号" maxlength="11" />
        </el-form-item>

        <el-form-item label="所在地区" prop="region">
          <el-cascader
            v-model="regionValue"
            :options="regionOptions"
            :props="cascaderProps"
            placeholder="请选择省 / 市 / 区"
            clearable
            style="width: 100%"
            @change="handleRegionChange"
          />
        </el-form-item>

        <el-form-item label="详细地址" prop="detailAddress">
          <el-input
            v-model="form.detailAddress"
            type="textarea"
            :rows="2"
            placeholder="请输入街道、楼牌号等详细地址"
            maxlength="100"
            show-word-limit
          />
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
        <el-icon><Plus /></el-icon>
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
import { Plus } from '@element-plus/icons-vue'
import type { Address, AddressForm } from '@/types/types'
import {
  listAddressApi,
  addAddressApi,
  updateAddressApi,
  deleteAddressApi,
  setDefaultAddressApi,
} from '@/api/system/address'
import { regionData } from 'element-china-area-data'

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
const formRef = ref<any>(null)

const form = reactive<AddressForm>({
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
      const list = res.data?.records || res.data?.list || []
      addressList.value = list
      // 如果没有选中地址，自动选中默认地址
      if (selectedId.value === 0 && list.length > 0) {
        const defaultAddr = list.find((a) => a.isDefault === 1)
        selectedId.value = defaultAddr?.id || list[0].id || 0
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
  form.province = addr.province
  form.city = addr.city
  form.district = addr.district
  form.detailAddress = addr.detailAddress
  form.zipCode = addr.zipCode || ''
  form.isDefault = addr.isDefault
  defaultSwitch.value = addr.isDefault === 1

  // 回显省市区
  regionValue.value = [addr.province, addr.city, addr.district]
  dialogVisible.value = true
}

const handleRegionChange = (value: unknown) => {
  if (isStringArray(value) && value.length === 3) {
    form.province = value[0]
    form.city = value[1]
    form.district = value[2]
  } else {
    form.province = ''
    form.city = ''
    form.district = ''
  }
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
  margin-bottom: 16px;
}

.address-radio-group {
  width: 100%;
}

.address-card {
  border: 2px solid var(--app-border);
  border-radius: 12px;
  padding: 16px;
  margin-bottom: 16px;
  cursor: pointer;
  transition: all 0.2s ease;
  background: var(--app-surface);
  position: relative;
}

.address-card:hover {
  border-color: var(--app-primary);
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.08);
}

.address-card.active {
  border-color: var(--app-primary);
  background: linear-gradient(135deg, var(--app-primary-light, #f0f5ff) 0%, var(--app-surface) 100%);
}

.address-card.default::before {
  content: '';
  position: absolute;
  top: 0;
  right: 0;
  width: 0;
  height: 0;
  border-style: solid;
  border-width: 0 24px 24px 0;
  border-color: transparent var(--el-color-danger) transparent transparent;
}

.card-header {
  display: flex;
  align-items: center;
  gap: 8px;
  margin-bottom: 10px;
}

.card-header .name {
  font-size: 16px;
  font-weight: 600;
  color: var(--app-text);
}

.card-header .phone {
  font-size: 14px;
  color: var(--app-text-muted);
}

.default-tag {
  margin-left: auto;
}

.card-body {
  margin-bottom: 12px;
}

.card-body .region {
  font-size: 14px;
  color: var(--app-text);
  margin-bottom: 4px;
}

.card-body .detail {
  font-size: 13px;
  color: var(--app-text-muted);
  line-height: 1.5;
}

.card-body .zip {
  font-size: 12px;
  color: var(--app-text-muted);
  margin-top: 4px;
}

.card-footer {
  display: flex;
  gap: 12px;
  border-top: 1px solid var(--app-border);
  padding-top: 10px;
}

.address-actions {
  display: flex;
  gap: 12px;
  margin-top: 8px;
}

.address-form :deep(.el-input__wrapper),
.address-form :deep(.el-textarea__inner) {
  border-radius: 8px;
}
</style>
