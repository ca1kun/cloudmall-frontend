<template>
  <div class="category-management page-shell">
    <el-card class="page-card" shadow="never">
      <div class="page-header">
        <div class="page-heading">
          <span class="page-eyebrow">CATEGORY CENTER</span>
          <h2 class="page-title">类别管理</h2>
          <p class="page-subtitle">维护商品分类结构，保持层级清晰、录入高效。</p>
        </div>
        <div class="page-toolbar">
          <el-button type="primary" icon="Plus" @click="handleAdd">新增类别</el-button>
          <el-button v-if="categoryList.length > 0" icon="Download" @click="handleExport">导出</el-button>
        </div>
      </div>

      <div class="category-overview">
        <div class="overview-item">
          <span class="overview-label">类别总数</span>
          <strong>{{ categoryList.length }}</strong>
          <span class="overview-note">当前已维护类别</span>
        </div>
        <div class="overview-item">
          <span class="overview-label">顶级类别</span>
          <strong>{{ rootCategoryCount }}</strong>
          <span class="overview-note">上级 ID 为 0</span>
        </div>
        <div class="overview-tip">
          <span>分类提示</span>
          <p>合理规划层级，便于商品录入和前台筛选。</p>
        </div>
      </div>

      <el-table
        v-loading="loading"
        :data="categoryList"
        class="soft-table category-table"
        border
        stripe
        empty-text="暂无类别，点击右上角新增"
      >
        <el-table-column prop="categoryId" label="类别 ID" align="center" width="140">
          <template #default="{ row }">
            <span class="id-badge">#{{ row.categoryId }}</span>
          </template>
        </el-table-column>
        <el-table-column prop="parentId" label="上级类别" align="center" width="180">
          <template #default="{ row }">
            <el-tag :type="row.parentId === 0 ? 'success' : 'info'" effect="light" round>
              {{ row.parentId === 0 ? '顶级类别' : `ID ${row.parentId}` }}
            </el-tag>
          </template>
        </el-table-column>
        <el-table-column prop="categoryName" label="类别名称" min-width="220">
          <template #default="{ row }">
            <div class="category-name-cell">
              <span class="category-icon">{{ row.categoryName?.slice(0, 1) || '类' }}</span>
              <strong>{{ row.categoryName }}</strong>
            </div>
          </template>
        </el-table-column>
        <el-table-column label="操作" align="center" width="210" fixed="right">
          <template #default="{ row }">
            <div class="action-buttons">
              <el-button type="primary" plain icon="Edit" size="small" @click="handleUpdate(row)">修改</el-button>
              <el-button type="danger" plain icon="Delete" size="small" @click="handleDelete(row)">删除</el-button>
            </div>
          </template>
        </el-table-column>
      </el-table>
    </el-card>

    <el-dialog
      v-model="dialogOpen"
      :title="title"
      width="min(520px, 92vw)"
      class="category-dialog"
      :close-on-click-modal="false"
      destroy-on-close
      @closed="resetForm"
    >
      <category-form
        v-if="dialogOpen"
        :category-id="categoryId"
        @success="getCategoryList"
        @close="dialogOpen = false"
      />
    </el-dialog>
  </div>
</template>

<script setup lang="ts">
import { computed, onMounted, ref } from 'vue'
import { ElMessage, ElMessageBox } from 'element-plus'
import CategoryForm from '@/components/CategoryForm.vue'
import { deleteCategoryApi, listCategory } from '@/api/item/category'
import type { Category } from '@/types/types'

const categoryList = ref<Category[]>([])
const loading = ref(false)
const dialogOpen = ref(false)
const title = ref('')
const categoryId = ref(0)

const rootCategoryCount = computed(() => categoryList.value.filter(item => item.parentId === 0).length)

async function getCategoryList() {
  loading.value = true
  try {
    const res = await listCategory()
    categoryList.value = res.data || []
  } catch {
    ElMessage.error('类别数据加载失败')
  } finally {
    loading.value = false
  }
}

function resetForm() {
  categoryId.value = 0
}

function handleAdd() {
  categoryId.value = 0
  title.value = '新增类别'
  dialogOpen.value = true
}

function handleUpdate(row: Category) {
  categoryId.value = row.categoryId ?? 0
  title.value = '修改类别'
  dialogOpen.value = true
}

function handleDelete(row: Category) {
  ElMessageBox.confirm(
    `确定要删除类别 "${row.categoryName}" 吗？`,
    '警告',
    { confirmButtonText: '是', cancelButtonText: '否', type: 'warning' }
  )
    .then(async () => {
      const res = await deleteCategoryApi(row.categoryId ?? 0)
      if (res.code === 200) {
        ElMessage.success('删除成功')
        getCategoryList()
      } else {
        ElMessage.error(res.message || '删除失败')
      }
    })
    .catch(() => {})
}

function handleExport() {
  ElMessage({ type: 'info', message: '导出数据' })
}

onMounted(getCategoryList)
</script>

<style scoped>
.category-management {
  min-height: 100vh;
}

.page-card {
  overflow: hidden;
  border: 1px solid var(--app-border);
  border-radius: 16px;
}

.page-header {
  position: relative;
  overflow: hidden;
  margin: -20px -20px 22px;
  padding: 28px 30px;
  background:
    radial-gradient(circle at 82% 20%, rgb(255 255 255 / 20%) 0, transparent 28%),
    linear-gradient(135deg, #315efb 0%, #5b73f2 52%, #7a5af8 100%);
}

.page-header::after {
  position: absolute;
  right: 16%;
  bottom: -70px;
  width: 180px;
  height: 180px;
  border: 32px solid rgb(255 255 255 / 8%);
  border-radius: 50%;
  content: '';
}

.page-heading,
.page-toolbar {
  position: relative;
  z-index: 1;
}

.page-eyebrow {
  display: block;
  margin-bottom: 5px;
  color: rgb(255 255 255 / 70%);
  font-size: 11px;
  font-weight: 700;
  letter-spacing: 1.8px;
}

.page-title,
.page-subtitle {
  color: #fff;
}

.page-title {
  margin: 0;
}

.page-subtitle {
  margin: 7px 0 0;
  opacity: 0.82;
}

.page-toolbar :deep(.el-button) {
  border-color: rgb(255 255 255 / 35%);
  box-shadow: 0 8px 18px rgb(31 50 130 / 18%);
}

.category-overview {
  display: grid;
  grid-template-columns: 180px 180px minmax(260px, 1fr);
  gap: 14px;
  margin-bottom: 18px;
}

.overview-item,
.overview-tip {
  padding: 18px 20px;
  border: 1px solid var(--app-border);
  border-radius: 12px;
  background: var(--app-surface-soft);
}

.overview-item {
  display: grid;
  gap: 4px;
}

.overview-label,
.overview-note,
.overview-tip p {
  color: var(--app-text-muted);
}

.overview-label,
.overview-tip span {
  font-size: 13px;
  font-weight: 600;
}

.overview-item strong {
  color: var(--el-color-primary);
  font-size: 28px;
  line-height: 1.2;
}

.overview-note {
  font-size: 12px;
}

.overview-tip {
  display: flex;
  flex-direction: column;
  justify-content: center;
  background: linear-gradient(135deg, var(--app-surface-soft), var(--app-surface));
}

.overview-tip span {
  color: var(--app-text);
}

.overview-tip p {
  margin: 7px 0 0;
  line-height: 1.6;
}

.category-table {
  margin-top: 4px;
  overflow: hidden;
  border-radius: 12px;
}

.category-table :deep(.el-table__inner-wrapper) {
  overflow: hidden;
  border-radius: 12px;
}

.id-badge {
  color: var(--app-text-muted);
  font-family: Consolas, monospace;
  font-size: 13px;
}

.category-name-cell {
  display: flex;
  align-items: center;
  gap: 12px;
}

.category-icon {
  display: inline-flex;
  width: 34px;
  height: 34px;
  flex: 0 0 34px;
  align-items: center;
  justify-content: center;
  border-radius: 10px;
  background: var(--el-color-primary-light-9);
  color: var(--el-color-primary);
  font-size: 14px;
  font-weight: 700;
}

.category-name-cell strong {
  color: var(--app-text);
}

.action-buttons {
  display: flex;
  flex-wrap: nowrap;
  justify-content: center;
  gap: 8px;
  white-space: nowrap;
}

.action-buttons :deep(.el-button + .el-button) {
  margin-left: 0;
}

@media (max-width: 768px) {
  .page-header {
    align-items: flex-start;
    flex-direction: column;
    gap: 20px;
    padding: 24px 20px;
  }

  .page-toolbar {
    display: flex;
    width: 100%;
  }

  .page-toolbar :deep(.el-button) {
    flex: 1;
  }

  .category-overview {
    grid-template-columns: 1fr 1fr;
  }

  .overview-tip {
    grid-column: 1 / -1;
  }
}

@media (max-width: 480px) {
  .category-overview {
    grid-template-columns: 1fr;
  }

  .overview-tip {
    grid-column: auto;
  }
}
</style>
