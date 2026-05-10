<script lang="ts" setup>
import { ref, onMounted, reactive } from 'vue'
import {
  addProductApi, getProdctByIdApi, updateProductApi,
  deleteProductApi,
  getProductPageApi,
  deleteProductsByIdsApi
} from '@/api/item/product'
import { listCategory } from '@/api/item/category'
import { ElMessage, ElMessageBox, ElLoading } from 'element-plus'
import '@/css/product.css'
// 假设你的上传组件路径如下，请确保路径正确
import UploadImg from '@/components/Uploading.vue'
import type { Category, PageResult, Product, ProductQueryParams } from '@/types/types'

// ==========================================
// 1. 分类相关逻辑 (Cascader)
// ==========================================
const categoryTree = ref<Category[]>([])

const cascaderProps = {
  value: 'categoryId',
  label: 'categoryName',
  children: 'children',
  emitPath: false, // 只返回选中的那个 ID (最后一级)，不返回数组
  checkStrictly: false // 只能选叶子节点 (符合商品挂在最底层分类的逻辑)
}

// 扁平列表转树形结构
const listToTree = (list: Category[]) => {
  const map: Record<number, Category & { children?: Category[] }> = {}
  const tree: Array<Category & { children?: Category[] }> = []

  // 初始化 Map
  list.forEach(item => {
    if (item.categoryId !== undefined) {
      map[item.categoryId] = { ...item, children: [] }
    }
  })

  // 组装树
  list.forEach(item => {
    if (item.categoryId === undefined) {
      return
    }
    const node = map[item.categoryId]
    if (!node) {
      return
    }
    if (item.parentId === 0) {
      tree.push(node)
    } else {
      const parent = map[item.parentId]
      if (parent) {
        parent.children ??= []
        parent.children.push(node)
      }
    }
  })

  // 递归清理空的 children
  const clean = (nodes: Array<Category & { children?: Category[] }>) => {
    nodes.forEach(node => {
        if (!node.children || node.children.length === 0) {
        delete node.children
      } else {
        clean(node.children)
      }
    })
  }
  clean(tree)
  return tree
}

// 获取分类并转换
const getCategoryList = async () => {
  try {
    const res = await listCategory()
    // 注意：根据你的后端返回结构调整，如果是 res.code === 200，或者 res.data.code
    // 这里假设拦截器处理后 res 或者是 res.data 是数据列表
    // 为了稳妥，你可以先打印 console.log(res) 看看结构
    const data = res.data || res // 兼容处理
    if (Array.isArray(data)) {
      categoryTree.value = listToTree(data)
    }
  } catch (e) {
    console.error(e)
  }
}

// ==========================================
// 2. 产品列表与查询
// ==========================================
const productList = ref<Product[]>([])
const loading = ref(false)
const total = ref(0)
const currentPage = ref(1)
const pageSize = ref(5)

const queryParams = ref<ProductQueryParams>({
  pageNum: 1,
  pageSize: 5,
  productName: '',
  productSn: '',
  productCategoryId: undefined
})

// 搜索
function search() {
  queryParams.value.pageNum = 1
  currentPage.value = 1
  getPageList()
}

// 重置
function resetQuery() {
  queryParams.value.productName = ''
  queryParams.value.productSn = ''
  queryParams.value.productCategoryId = undefined
  search()
}

// 分页加载
async function getPageList() {
  loading.value = true
  try {
    const response = await getProductPageApi(queryParams.value)
    // 根据后端 PageHelper 或 MP 分页结构调整
    // 假设结构是: { list: [], total: 100 }
    const data = response.data || response
    productList.value = (data.list || []) as Product[]
    total.value = data.total || 0
  } catch (error) {
    ElMessage.error('数据加载失败')
  } finally {
    loading.value = false
  }
}

const handleSizeChange = (val: number) => {
  queryParams.value.pageSize = val
  pageSize.value = val
  getPageList()
}

const handleCurrentChange = (val: number) => {
  queryParams.value.pageNum = val
  currentPage.value = val
  getPageList()
}

// ==========================================
// 3. 新增/编辑逻辑
// ==========================================
const dialogFormVisible = ref(false)
const formTitle = ref('')
const productFormRef = ref()

interface ProductForm {
  productId?: number
  productName: string
  productSn: string
  productDescription: string
  price: string
  stock: number
  productCategoryId: string
  imageUrl: string
  detailUrl: string
}

// 表单对象
const addProduct = ref<ProductForm>({
  productId: undefined as number | undefined,
  productName: '',
  productSn: '',
  productDescription: '',
  price: '',
  stock: 0,
  productCategoryId: '', // 级联选择器绑定到这里
  imageUrl: '',          // 上传图片绑定到这里
  detailUrl: ''
})

const rules = {
  productName: [
    { required: true, message: '请输入产品名称', trigger: 'blur' },
    { min: 2, max: 50, message: '长度在 2 到 50 个字符', trigger: 'blur' }
  ],
  productSn: [
    { required: true, message: '请输入产品编号', trigger: 'blur' }
  ],
  price: [
    { required: true, message: '请输入价格', trigger: 'blur' }
  ],
  stock: [
    { required: true, message: '请输入库存', trigger: 'blur' }
  ],
  productCategoryId: [
    { required: true, message: '请选择分类', trigger: 'change' }
  ],
  imageUrl: [
    { required: true, message: '请上传产品图片', trigger: 'change' } // 也可以加个校验
  ]
}

const resetForm = () => {
  addProduct.value = {
    productId: undefined,
    productName: '',
    productSn: '',
    productDescription: '',
    price: '',
    stock: 0,
    productCategoryId: '',
    imageUrl: '',
    detailUrl: ''
  }
}

// 打开新增
const addPro = () => {
  resetForm()
  formTitle.value = '添加产品'
  dialogFormVisible.value = true
  // 清除校验红字
  setTimeout(() => productFormRef.value?.clearValidate(), 0)
}

// 打开编辑
const edit = async (id: number) => {
  try {
    const res = await getProdctByIdApi(id)
    if (res.code === 200) {
      // 填充表单
      const data = res.data
      addProduct.value = {
        productId: data.productId,
        productName: data.productName,
        productSn: data.productSn,
        productDescription: data.productDescription || '',
        price: String(data.price),
        stock: data.stock || 0,
        productCategoryId: String(data.productCategoryId), // 确保类型匹配
        imageUrl: data.imageUrl || '',
        detailUrl: data.detailUrl || ''
      }
      formTitle.value = '编辑产品'
      dialogFormVisible.value = true
    }
  } catch (error) {
    ElMessage.error('获取信息失败')
  }
}

// 提交保存
const save = async () => {
  if (!productFormRef.value) return
  await productFormRef.value.validate(async (valid: boolean) => {
    if (valid) {
      try {
        const payload: Product = {
          productId: addProduct.value.productId,
          productName: addProduct.value.productName,
          productSn: addProduct.value.productSn,
          productDescription: addProduct.value.productDescription,
          price: Number(addProduct.value.price),
          stock: addProduct.value.stock,
          productCategoryId: Number(addProduct.value.productCategoryId),
          imageUrl: addProduct.value.imageUrl,
          detailUrl: addProduct.value.detailUrl,
        }
        if (addProduct.value.productId) {
          await updateProductApi(payload)
          ElMessage.success('编辑成功')
        } else {
          await addProductApi(payload)
          ElMessage.success('添加成功')
        }
        dialogFormVisible.value = false
        getPageList()
      } catch (error: any) {
        ElMessage.error(error.message || '操作失败')
      }
    }
  })
}

// ==========================================
// 4. 查看详情 (Drawer)
// ==========================================
const drawerVisible = ref(false)
const productDetail = ref<Product>() // 换个名字避免混淆

const handleView = async (id: number) => {
  try {
    const res = await getProdctByIdApi(id)
    if (res.code === 200) {
      productDetail.value = {
        ...res.data,
        price: Number(res.data.price),
        stock: res.data.stock ?? 0,
      }
      drawerVisible.value = true
    }
  } catch (e) { }
}

const handleClose = (done: () => void) => {
  done()
}

// ==========================================
// 5. 删除逻辑
// ==========================================
const selectedProducts = ref<Product[]>([])

const handleSelectionChange = (selection: Product[]) => {
  selectedProducts.value = selection
}

const deleteProduct = (id: number) => {
  ElMessageBox.confirm('确认删除该产品？', '提示', { type: 'warning' })
    .then(async () => {
      await deleteProductApi(id)
      ElMessage.success('删除成功')
      getPageList()
    })
    .catch(() => { })
}

const batchDelete = async () => {
  if (selectedProducts.value.length === 0) return

  try {
    await ElMessageBox.confirm(`确定删除选中的 ${selectedProducts.value.length} 项吗？`, '警告', { type: 'warning' })

    const ids = selectedProducts.value.map(p => p.productId).filter((id): id is number => id !== undefined)
    const loadingInstance = ElLoading.service({ text: '删除中...' })

    try {
      await deleteProductsByIdsApi(ids)
      ElMessage.success('批量删除成功')
      getPageList()
      selectedProducts.value = [] // 清空选中
    } finally {
      loadingInstance.close()
    }
  } catch (e) { }
}

// 初始化
onMounted(() => {
  getPageList()
  getCategoryList()
})
</script>

<template>
  <div class="product-management page-shell">
    <el-card class="page-card" shadow="never">
      <div class="page-header">
        <div>
          <h2 class="page-title">产品管理</h2>
          <p class="page-subtitle">统一维护商品信息，控制上架节奏与库存状态。</p>
        </div>
        <div class="page-toolbar">
          <el-button type="primary" icon="Plus" @click="addPro" class="add-btn">添加产品</el-button>
          <el-button type="danger" :disabled="selectedProducts.length === 0" @click="batchDelete" class="batch-delete-btn">
            批量删除
            <span class="badge" v-if="selectedProducts.length > 0">{{ selectedProducts.length }}</span>
          </el-button>
        </div>
      </div>

      <el-form :model="queryParams" ref="queryRef" :inline="true" class="search-form">
        <el-form-item label="名称">
          <el-input v-model="queryParams.productName" placeholder="输入名称" clearable @keyup.enter="search" />
        </el-form-item>
        <el-form-item label="分类">
          <el-cascader v-model="queryParams.productCategoryId" :options="categoryTree"
            :props="{ ...cascaderProps, checkStrictly: true }" placeholder="全部" clearable :show-all-levels="false" />
        </el-form-item>
        <el-form-item>
          <el-button type="primary" icon="Search" @click="search">搜索</el-button>
          <el-button icon="Refresh" @click="resetQuery">重置</el-button>
        </el-form-item>
      </el-form>

      <el-table :data="productList" v-loading="loading" @selection-change="handleSelectionChange" stripe border class="soft-table product-table">
        <el-table-column type="selection" width="55" align="center" />
        <el-table-column prop="productId" label="ID" width="80" align="center" />

        <el-table-column label="图片" width="100" align="center">
          <template #default="{ row }">
            <el-image style="width: 60px; height: 60px; border-radius: 4px;" :src="row.imageUrl"
              :preview-src-list="[row.imageUrl]" fit="cover" preview-teleported />
          </template>
        </el-table-column>

        <el-table-column prop="productName" label="名称" min-width="150" show-overflow-tooltip />
        <el-table-column prop="productSn" label="编号" width="120" />

        <el-table-column label="分类" width="120">
          <template #default="{ row }">
            <el-tag v-if="row.category">{{ row.category.categoryName }}</el-tag>
            <span v-else>-</span>
          </template>
        </el-table-column>

        <el-table-column prop="price" label="价格" width="100" align="center">
          <template #default="{ row }">
            <span style="color: #f56c6c; font-weight: bold;">¥{{ row.price }}</span>
          </template>
        </el-table-column>

        <el-table-column prop="stock" label="库存" width="100" align="center" />

        <el-table-column label="操作" width="200" align="center" fixed="right">
          <template #default="{ row }">
            <el-button link type="primary" @click="handleView(row.productId)">查看</el-button>
            <el-button link type="primary" @click="edit(row.productId)">编辑</el-button>
            <el-button link type="danger" @click="deleteProduct(row.productId)">删除</el-button>
          </template>
        </el-table-column>
      </el-table>

      <div class="pagination-wrap">
        <el-pagination v-model:current-page="currentPage" v-model:page-size="pageSize" :page-sizes="[5, 10, 20]"
          layout="total, sizes, prev, pager, next, jumper" :total="total" @size-change="handleSizeChange"
          @current-change="handleCurrentChange" />
      </div>
    </el-card>

    <!-- 新增/编辑弹窗 -->
    <el-dialog v-model="dialogFormVisible" :title="formTitle" width="600px" :close-on-click-modal="false">
      <el-form :model="addProduct" :rules="rules" ref="productFormRef" label-width="100px">
        <el-form-item label="产品名称" prop="productName">
          <el-input v-model="addProduct.productName" placeholder="请输入" />
        </el-form-item>
        <el-form-item label="产品编号" prop="productSn">
          <el-input v-model="addProduct.productSn" placeholder="请输入" />
        </el-form-item>
        <el-form-item label="分类" prop="productCategoryId">
          <el-cascader v-model="addProduct.productCategoryId" :options="categoryTree" :props="cascaderProps"
            placeholder="请选择" style="width: 100%" clearable />
        </el-form-item>
        <el-form-item label="价格" prop="price">
          <el-input-number v-model="addProduct.price" :precision="2" :min="0" style="width: 100%" />
        </el-form-item>
        <el-form-item label="库存" prop="stock">
          <el-input-number v-model="addProduct.stock" :min="0" style="width: 100%" />
        </el-form-item>
        <el-form-item label="产品图片" prop="imageUrl">
          <!-- ✅ 修复：正确绑定 imageUrl -->
          <upload-img v-model="addProduct.imageUrl" />
        </el-form-item>
        <el-form-item label="描述">
          <el-input v-model="addProduct.productDescription" type="textarea" :rows="3" />
        </el-form-item>
      </el-form>
      <template #footer>
        <el-button @click="dialogFormVisible = false">取消</el-button>
        <el-button type="primary" @click="save">确认</el-button>
      </template>
    </el-dialog>

    <!-- 详情抽屉 -->
    <el-drawer v-model="drawerVisible" title="商品详情" size="40%">
      <div v-if="productDetail" style="padding: 0 20px;">
        <el-image :src="productDetail.imageUrl"
          style="width: 100%; height: 300px; margin-bottom: 20px; border-radius: 8px;" fit="contain" />
        <el-descriptions :column="1" border>
          <el-descriptions-item label="名称">{{ productDetail.productName }}</el-descriptions-item>
          <el-descriptions-item label="编号">{{ productDetail.productSn }}</el-descriptions-item>
          <el-descriptions-item label="价格">¥ {{ productDetail.price }}</el-descriptions-item>
          <el-descriptions-item label="库存">{{ productDetail.stock }}</el-descriptions-item>
          <el-descriptions-item label="分类">
            {{ productDetail.category ? productDetail.category.categoryName : '-' }}
          </el-descriptions-item>
          <el-descriptions-item label="描述">
            {{ productDetail.productDescription }}
          </el-descriptions-item>
        </el-descriptions>
      </div>
    </el-drawer>
  </div>
</template>

<style scoped>
.product-management {
  display: grid;
  gap: 0;
}

.search-form {
  margin: 4px 0 16px;
  padding: 16px;
  border-radius: 16px;
  background: var(--app-surface-soft);
  border: 1px solid var(--app-border);
}

.pagination-wrap {
  margin-top: 18px;
  display: flex;
  justify-content: flex-end;
}

.product-table :deep(.el-image) {
  border-radius: 10px;
}

.product-table :deep(.el-table__inner-wrapper) {
  border-radius: 16px;
  overflow: hidden;
}

@media (max-width: 960px) {
  .page-header {
    flex-direction: column;
  }

  .search-form {
    padding: 12px;
  }
}
</style>
