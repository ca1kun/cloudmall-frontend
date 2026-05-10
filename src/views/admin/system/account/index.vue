<template>
  <div class="app-container page-shell system-account-page">
    <el-card class="page-card" shadow="never">
      <div class="page-header">
        <div>
          <h2 class="page-title">{{ pageTitle }}</h2>
          <p class="page-subtitle">{{ pageSubtitle }}</p>
        </div>
        <div class="page-toolbar">
          <el-button type="primary" icon="Plus" @click="handleAdd">新增{{ accountLabel }}</el-button>
          <el-button icon="Refresh" @click="handleReset">重置筛选</el-button>
        </div>
      </div>

      <el-form :inline="true" :model="queryParams" class="search-form">
        <el-form-item label="用户名">
          <el-input v-model="queryParams.userName" clearable placeholder="请输入用户名" />
        </el-form-item>
        <el-form-item label="昵称">
          <el-input v-model="queryParams.nickName" clearable placeholder="请输入昵称" />
        </el-form-item>
        <el-form-item label="手机号">
          <el-input v-model="queryParams.phone" clearable placeholder="请输入手机号" />
        </el-form-item>
        <el-form-item label="状态">
          <el-select v-model="queryParams.status" clearable placeholder="全部状态" style="width: 140px">
            <el-option label="启用" :value="1" />
            <el-option label="停用" :value="0" />
          </el-select>
        </el-form-item>
        <el-form-item>
          <el-button type="primary" icon="Search" @click="handleSearch">查询</el-button>
        </el-form-item>
      </el-form>

      <el-table v-loading="loading" :data="accountList" border stripe class="admin-table soft-table">
        <el-table-column prop="id" label="ID" width="90" align="center" />
        <el-table-column prop="userName" label="用户名" min-width="150" />
        <el-table-column prop="nickName" label="昵称" min-width="150" />
        <el-table-column prop="phone" label="手机号" min-width="140" />
        <el-table-column prop="email" label="邮箱" min-width="180" />
        <el-table-column prop="status" label="状态" width="110" align="center">
          <template #default="scope">
            <el-tag v-if="Number(scope.row.status) === 1" type="success">启用</el-tag>
            <el-tag v-else type="info">停用</el-tag>
          </template>
        </el-table-column>
        <el-table-column prop="createTime" label="创建时间" min-width="180" />
        <el-table-column label="操作" width="240" fixed="right" align="center">
          <template #default="scope">
            <el-button link type="primary" icon="Edit" @click="handleEdit(scope.row)">编辑</el-button>
            <el-button link type="warning" icon="Key" @click="handleResetPassword(scope.row)">重置密码</el-button>
            <el-button link type="danger" icon="Delete" @click="handleDelete(scope.row)">删除</el-button>
          </template>
        </el-table-column>
      </el-table>

      <div class="pagination-wrap">
        <el-pagination
          v-model:current-page="queryParams.pageNum"
          v-model:page-size="queryParams.pageSize"
          :page-sizes="[10, 20, 50, 100]"
          :total="total"
          layout="total, sizes, prev, pager, next, jumper"
          @size-change="handleSizeChange"
          @current-change="handleCurrentChange"
        />
      </div>
    </el-card>

    <el-dialog v-model="formVisible" :title="dialogTitle" width="560px" destroy-on-close>
      <el-form ref="formRef" :model="formModel" :rules="formRules" label-width="100px">
        <el-form-item label="用户名" prop="userName">
          <el-input v-model="formModel.userName" placeholder="请输入用户名" />
        </el-form-item>
        <el-form-item label="昵称" prop="nickName">
          <el-input v-model="formModel.nickName" placeholder="请输入昵称" />
        </el-form-item>
        <el-form-item label="手机号" prop="phone">
          <el-input v-model="formModel.phone" placeholder="请输入手机号" />
        </el-form-item>
        <el-form-item label="邮箱" prop="email">
          <el-input v-model="formModel.email" placeholder="请输入邮箱" />
        </el-form-item>
        <el-form-item v-if="!isEditMode" label="初始密码" prop="password">
          <el-input v-model="formModel.password" type="password" show-password placeholder="请输入初始密码" />
        </el-form-item>
        <el-form-item label="状态" prop="status">
          <el-select v-model="formModel.status" placeholder="请选择状态">
            <el-option label="启用" :value="1" />
            <el-option label="停用" :value="0" />
          </el-select>
        </el-form-item>
        <el-form-item label="备注" prop="remark">
          <el-input v-model="formModel.remark" type="textarea" :rows="3" placeholder="请输入备注" />
        </el-form-item>
      </el-form>
      <template #footer>
        <el-button @click="formVisible = false">取消</el-button>
        <el-button type="primary" :loading="submitLoading" @click="handleSubmit">确定</el-button>
      </template>
    </el-dialog>

    <el-dialog v-model="passwordVisible" title="重置密码" width="420px" destroy-on-close>
      <el-form ref="passwordFormRef" :model="passwordForm" :rules="passwordRules" label-width="100px">
        <el-form-item label="新密码" prop="password">
          <el-input v-model="passwordForm.password" type="password" show-password placeholder="请输入新密码" />
        </el-form-item>
      </el-form>
      <template #footer>
        <el-button @click="passwordVisible = false">取消</el-button>
        <el-button type="primary" :loading="passwordLoading" @click="handlePasswordSubmit">确定</el-button>
      </template>
    </el-dialog>
  </div>
</template>

<script lang="ts" setup>
import { computed, nextTick, onMounted, reactive, ref } from 'vue'
import { useRoute } from 'vue-router'
import { ElMessage, ElMessageBox } from 'element-plus'
import {
  addAccount,
  deleteAccount,
  getAccountById,
  getAccountPage,
  resetAccountPassword,
  updateAccount,
  type AccountType,
} from '@/api/system/account'
import type { ManagedAccount, ManagedAccountForm, ManagedAccountQueryParams } from '@/types/types'

const route = useRoute()
const accountType = computed<AccountType>(() => ((route.meta as { accountType?: AccountType }).accountType ?? 'merchant'))
const accountLabel = computed(() => (accountType.value === 'merchant' ? '商家' : '顾客'))
const pageTitle = computed(() => `${accountLabel.value}管理`)
const pageSubtitle = computed(() => `维护${accountLabel.value}账号、基础资料、密码与状态。`)

const loading = ref(false)
const submitLoading = ref(false)
const passwordLoading = ref(false)
const accountList = ref<ManagedAccount[]>([])
const total = ref(0)
const formVisible = ref(false)
const passwordVisible = ref(false)
const formRef = ref()
const passwordFormRef = ref()
const isEditMode = ref(false)
const dialogTitle = ref('新增账号')

const queryParams = reactive<ManagedAccountQueryParams>({
  pageNum: 1,
  pageSize: 10,
  userName: '',
  nickName: '',
  phone: '',
  status: '',
})

const formModel = reactive<ManagedAccountForm>({
  id: undefined,
  userName: '',
  nickName: '',
  phone: '',
  email: '',
  password: '',
  status: 1,
  remark: '',
})

const passwordForm = reactive<{ id?: number; password: string }>({
  id: undefined,
  password: '',
})

const formRules = {
  userName: [
    { required: true, message: '请输入用户名', trigger: 'blur' },
    { min: 3, max: 30, message: '用户名长度在 3 到 30 个字符', trigger: 'blur' },
  ],
  nickName: [{ required: true, message: '请输入昵称', trigger: 'blur' }],
  phone: [
    { required: true, message: '请输入手机号', trigger: 'blur' },
    { pattern: /^1[3-9]\d{9}$/, message: '手机号格式不正确', trigger: 'blur' },
  ],
  email: [
    { required: true, message: '请输入邮箱', trigger: 'blur' },
    { type: 'email', message: '邮箱格式不正确', trigger: 'blur' },
  ],
  password: [
    {
      validator: (_rule: unknown, value: string, callback: (error?: Error) => void) => {
        if (isEditMode.value) {
          callback()
          return
        }
        if (!value) {
          callback(new Error('请输入初始密码'))
          return
        }
        if (value.length < 6) {
          callback(new Error('密码长度不能少于 6 位'))
          return
        }
        callback()
      },
      trigger: 'blur',
    },
  ],
  status: [{ required: true, message: '请选择状态', trigger: 'change' }],
  remark: [{ max: 200, message: '备注不能超过 200 个字符', trigger: 'blur' }],
}

const passwordRules = {
  password: [
    { required: true, message: '请输入新密码', trigger: 'blur' },
    { min: 6, message: '密码长度不能少于 6 位', trigger: 'blur' },
  ],
}

function resetFormModel() {
  formModel.id = undefined
  formModel.userName = ''
  formModel.nickName = ''
  formModel.phone = ''
  formModel.email = ''
  formModel.password = ''
  formModel.status = 1
  formModel.remark = ''
}

function extractPageData(response: any) {
  const data = response?.data ?? response
  return { list: data?.list ?? data?.records ?? [], total: data?.total ?? data?.count ?? 0 }
}

async function loadList() {
  loading.value = true
  try {
    const response = await getAccountPage(accountType.value, { ...queryParams })
    const pageData = extractPageData(response)
    accountList.value = pageData.list
    total.value = pageData.total
  } catch (error) {
    ElMessage.error('数据加载失败')
  } finally {
    loading.value = false
  }
}

function handleSearch() {
  queryParams.pageNum = 1
  loadList()
}

function handleReset() {
  queryParams.pageNum = 1
  queryParams.pageSize = 10
  queryParams.userName = ''
  queryParams.nickName = ''
  queryParams.phone = ''
  queryParams.status = ''
  loadList()
}

function handleSizeChange(pageSize: number) {
  queryParams.pageSize = pageSize
  loadList()
}

function handleCurrentChange(pageNum: number) {
  queryParams.pageNum = pageNum
  loadList()
}

function handleAdd() {
  isEditMode.value = false
  dialogTitle.value = `新增${accountLabel.value}`
  resetFormModel()
  formVisible.value = true
  nextTick(() => formRef.value?.clearValidate())
}

async function handleEdit(row: ManagedAccount) {
  if (!row.id) {
    ElMessage.warning('缺少账号编号')
    return
  }
  isEditMode.value = true
  dialogTitle.value = `编辑${accountLabel.value}`
  try {
    const response = await getAccountById(accountType.value, row.id)
    const data = response.data ?? row
    formModel.id = data.id
    formModel.userName = data.userName
    formModel.nickName = data.nickName
    formModel.phone = data.phone || ''
    formModel.email = data.email || ''
    formModel.password = ''
    formModel.status = typeof data.status === 'number' ? data.status : Number(data.status ?? 1)
    formModel.remark = data.remark || ''
    formVisible.value = true
    nextTick(() => formRef.value?.clearValidate())
  } catch (error) {
    ElMessage.error(`获取${accountLabel.value}信息失败`)
  }
}

async function handleSubmit() {
  if (!formRef.value) return
  await formRef.value.validate(async (valid: boolean) => {
    if (!valid) return
    submitLoading.value = true
    try {
      const payload: ManagedAccountForm = {
        id: formModel.id,
        userName: formModel.userName.trim(),
        nickName: formModel.nickName.trim(),
        phone: formModel.phone.trim(),
        email: formModel.email.trim(),
        password: isEditMode.value ? undefined : formModel.password?.trim(),
        status: Number(formModel.status),
        remark: formModel.remark.trim(),
      }
      if (isEditMode.value) {
        await updateAccount(accountType.value, payload)
        ElMessage.success('编辑成功')
      } else {
        await addAccount(accountType.value, payload)
        ElMessage.success('新增成功')
      }
      formVisible.value = false
      await loadList()
    } catch (error: any) {
      ElMessage.error(error?.message || '操作失败')
    } finally {
      submitLoading.value = false
    }
  })
}

async function handleDelete(row: ManagedAccount) {
  if (!row.id) {
    ElMessage.warning('缺少账号编号')
    return
  }
  try {
    await ElMessageBox.confirm(`确定要删除${accountLabel.value}「${row.userName}」吗？`, '提示', { type: 'warning' })
    await deleteAccount(accountType.value, row.id)
    ElMessage.success('删除成功')
    await loadList()
  } catch (error) {}
}

function handleResetPassword(row: ManagedAccount) {
  if (!row.id) {
    ElMessage.warning('缺少账号编号')
    return
  }
  passwordForm.id = row.id
  passwordForm.password = ''
  passwordVisible.value = true
  nextTick(() => passwordFormRef.value?.clearValidate())
}

async function handlePasswordSubmit() {
  if (!passwordFormRef.value || !passwordForm.id) return
  await passwordFormRef.value.validate(async (valid: boolean) => {
    if (!valid) return
    passwordLoading.value = true
    try {
      await resetAccountPassword(accountType.value, passwordForm.id!, passwordForm.password)
      ElMessage.success('密码已重置')
      passwordVisible.value = false
    } catch (error: any) {
      ElMessage.error(error?.message || '重置失败')
    } finally {
      passwordLoading.value = false
    }
  })
}

onMounted(() => {
  loadList()
})
</script>

<style scoped>
.system-account-page {
  min-height: 100%;
}

.page-card {
  border: none;
  border-radius: 18px;
  box-shadow: var(--app-shadow-sm);
  background: linear-gradient(180deg, #ffffff 0%, #fbfcff 100%);
}

.search-form {
  padding: 16px 16px 4px;
  margin-bottom: 14px;
  border: 1px solid var(--app-border);
  border-radius: 14px;
  background: #fff;
}

.admin-table {
  border-radius: 14px;
  overflow: hidden;
}

.pagination-wrap {
  display: flex;
  justify-content: flex-end;
  padding: 18px 4px 2px;
}

:deep(.el-form--inline .el-form-item) {
  margin-right: 14px;
  margin-bottom: 12px;
}

:deep(.el-dialog__body) {
  padding-top: 12px;
}

:deep(.el-table) {
  --el-table-header-bg-color: #f8fafc;
  --el-table-row-hover-bg-color: #f6f9ff;
}
</style>
