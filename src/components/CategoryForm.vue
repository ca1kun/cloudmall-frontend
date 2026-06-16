<template>
  <el-form
    ref="formRef"
    v-loading="detailLoading"
    :model="form"
    :rules="rules"
    label-position="top"
    class="category-form"
  >
    <el-form-item label="上级类别 ID" prop="parentId">
      <el-input-number v-model="form.parentId" :min="0" controls-position="right" />
      <span class="form-tip">填写 0 表示创建顶级类别</span>
    </el-form-item>
    <el-form-item label="类别名称" prop="categoryName">
      <el-input v-model="form.categoryName" placeholder="请输入类别名称" />
    </el-form-item>

    <div class="form-actions">
      <el-button @click="cancel">取消</el-button>
      <el-button type="primary" :loading="loading" @click="submit">确定</el-button>
    </div>
  </el-form>
</template>

<script setup lang="ts">
import { reactive, ref, watch } from 'vue'
import { ElMessage } from 'element-plus'
import { addCategoryApi, getCategoryById, updateCategoryApi } from '@/api/item/category'
import type { Category } from '@/types/types'

const props = defineProps<{
  categoryId: number
}>()

const emit = defineEmits<{
  close: []
  success: []
}>()

const formRef = ref()
const loading = ref(false)
const detailLoading = ref(false)

const form = reactive<Category>({
  categoryId: undefined,
  parentId: 0,
  categoryName: ''
})

const rules = {
  categoryName: [
    { required: true, message: '请输入类别名称', trigger: 'blur' },
    { min: 2, max: 30, message: '类别名称长度应为 2 到 30 个字符', trigger: 'blur' }
  ]
}

watch(
  () => props.categoryId,
  async newId => {
    if (!newId) {
      form.categoryId = undefined
      form.parentId = 0
      form.categoryName = ''
      return
    }

    detailLoading.value = true
    try {
      const res = await getCategoryById(newId)
      if (res.code === 200 && res.data) {
        form.categoryId = res.data.categoryId
        form.parentId = res.data.parentId
        form.categoryName = res.data.categoryName
      } else {
        ElMessage.error(res.message || '类别信息加载失败')
      }
    } catch {
      ElMessage.error('类别信息加载失败')
    } finally {
      detailLoading.value = false
    }
  },
  { immediate: true }
)

const cancel = () => {
  emit('close')
}

const submit = async () => {
  if (!formRef.value) return

  await formRef.value.validate(async (valid: boolean) => {
    if (!valid) return

    loading.value = true
    try {
      const res = form.categoryId
        ? await updateCategoryApi(form)
        : await addCategoryApi(form)

      if (res.code === 200) {
        ElMessage.success(form.categoryId ? '修改成功' : '新增成功')
        emit('success')
        emit('close')
      } else {
        ElMessage.error(res.message || '操作失败')
      }
    } catch {
      ElMessage.error('操作失败，请稍后重试')
    } finally {
      loading.value = false
    }
  })
}
</script>

<style scoped>
.category-form {
  padding: 4px 4px 0;
}

.category-form :deep(.el-input-number),
.category-form :deep(.el-input) {
  width: 100%;
}

.form-tip {
  display: block;
  margin-top: 7px;
  color: var(--app-text-muted);
  font-size: 12px;
  line-height: 1.5;
}

.form-actions {
  display: flex;
  justify-content: flex-end;
  gap: 10px;
  margin-top: 24px;
  padding-top: 18px;
  border-top: 1px solid var(--app-border);
}

.form-actions :deep(.el-button) {
  min-width: 86px;
}

.form-actions :deep(.el-button + .el-button) {
  margin-left: 0;
}
</style>
