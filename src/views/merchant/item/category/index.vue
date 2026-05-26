<template>
    <div class="app-container page-shell">
        <el-card class="page-card" shadow="never">
            <div class="page-header">
                <div>
                    <h2 class="page-title">类别管理</h2>
                    <p class="page-subtitle">维护商品分类结构，保持层级清晰、录入高效。</p>
                </div>
                <div class="page-toolbar">
                    <el-button type="primary" icon="Plus" @click="handleAdd">新增类别</el-button>
                    <el-button v-if="categoryList.length > 0" icon="Download" @click="handleExport">导出</el-button>
                </div>
            </div>

            <el-table :data="categoryList" class="soft-table category-table" border stripe>
                <el-table-column prop="categoryId" label="类别ID" align="center" width="180" />
                <el-table-column prop="parentId" label="上级ID" align="center" width="180" />
                <el-table-column prop="categoryName" label="类别名称" align="center" />
                <el-table-column label="操作" align="center" width="180">
                    <template #default="scope">
                        <el-button link type="primary" icon="Edit" size="small" @click="handleUpdate(scope.row)">修改</el-button>
                        <el-button link type="danger" icon="Delete" size="small" @click="handleDelete(scope.row)">删除</el-button>
                    </template>
                </el-table-column>
            </el-table>
        </el-card>

        <el-dialog v-model="dialogOpen" :title="title" width="500" @close="resetForm">
            <category-form v-if="dialogOpen" :category-id="categoryId" @success="getCategoryList"
                @close="dialogOpen = false" />
        </el-dialog>
    </div>
</template>

<script setup lang="ts">
import { ElMessage, ElMessageBox } from 'element-plus'
import { ref } from 'vue'
import { onMounted } from 'vue'
import CategoryForm from '@/components/CategoryForm.vue'
import { listCategory } from '@/api/item/category'
import { deleteCategoryApi } from '@/api/item/category'
import type { Category } from '@/types/types'

onMounted(() => {
    getCategoryList()
})

const categoryList = ref<Category[]>([])

function resetForm() {
    categoryId.value = 0
}

const dialogOpen = ref(false)
const title = ref("")

const categoryId = ref(0)

function getCategoryList() {
    listCategory().then(res => {
        categoryList.value = res.data
    })
}

function handleAdd() {
    categoryId.value = 0
    dialogOpen.value = true
    title.value = "新增类别"
}

function handleUpdate(row: Category) {
    categoryId.value = row.categoryId ?? 0
    dialogOpen.value = true
    title.value = "修改类别"
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
        .catch(() => { })
}

function handleExport() {
    ElMessage({ type: 'info', message: '导出数据', })
}

</script>

<style scoped>
.category-table {
    margin-top: 4px;
}

.category-table :deep(.el-table__inner-wrapper) {
    border-radius: 16px;
    overflow: hidden;
}

@media (max-width: 768px) {
    .page-header {
        flex-direction: column;
    }

    .page-toolbar {
        width: 100%;
    }
}
</style>
