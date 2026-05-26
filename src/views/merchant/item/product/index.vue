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
import UploadImg from '@/components/Uploading.vue'
import type { Category, Product, ProductQueryParams } from '@/types/types'

const categoryTree = ref<Category[]>([])

const cascaderProps = {
  value: 'categoryId',
  label: 'categoryName',
  children: 'children',
  emitPath: false,
  checkStrictly: false
}

const listToTree = (list: Category[]) => {
  const map: Record<number, Category & { children?: Category[] }> = {}
  const tree: Array<Category & { children?: Category[] }> = []

  list.forEach(item => {
    if (item.categoryId !== undefined) {
      map[item.categoryId] = { ...item, children: [] }
    }
  })

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

const getCategoryList = async () => {
  try {
    const res = await listCategory()
    const data = res.data || res
    if (Array.isArray(data)) {
      categoryTree.value = listToTree(data)
    }
  } catch (e) {
    console.error(e)
  }
}

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

function search() {
  queryParams.value.pageNum = 1
  currentPage.value = 1
  getPageList()
}

function resetQuery() {
  queryParams.value.productName = ''
  queryParams.value.productSn = ''
  queryParams.value.productCategoryId = undefined
  search()
}

async function getPageList() {
  loading.value = true
  try {
    const response = await getProductPageApi(queryParams.value)
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

const addProduct = ref<ProductForm>({
  productId: undefined as number | undefined,
  productName: '',
  productSn: '',
  productDescription: '',
  price: '',
  stock: 0,
  productCategoryId: '',
  imageUrl: '',
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
    { required: true, message: '请上传产品图片', trigger: 'change' }
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

const addPro = () => {
  resetForm()
  formTitle.value = '添加产品'
  dialogFormVisible.value = true
  setTimeout(() => productFormRef.value?.clearValidate(), 0)
}

const edit = async (id: number) => {
  try {
    const res = await getProdctByIdApi(id)
    if (res.code === 200) {
      const data = res.data
      addProduct.value = {
        productId: data.productId,
        productName: data.productName,
        productSn: data.productSn,
        productDescription: data.productDescription || '',
        price: String(data.price),
        stock: data.stock || 0,
        productCategoryId: String(data.productCategoryId),
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

const drawerVisible = ref(false)
const productDetail = ref<Product>()

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
      selectedProducts.value = []
    } finally {
      loadingInstance.close()
    }
  } catch (e) { }
}

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
        <el-table-column prop="productSn" label="编号" width="160" />
        <el-table-column prop="price" label="价格" width="120">
          <template #default="{ row }">¥ {{ row.price }}</template>
        </el-table-column>
        <el-table-column prop="stock" label="库存" width="100" />
        <el-table-column prop="productDescription" label="描述" min-width="160" show-overflow-tooltip />

        <el-table-column label="操作" width="200" fixed="right">
          <template #default="{ row }">
            <el-button link type="primary" icon="View" @click="handleView(row.productId)">查看</el-button>
            <el-button link type="warning" icon="Edit" @click="edit(row.productId)">编辑</el-button>
            <el-button link type="danger" icon="Delete" @click="deleteProduct(row.productId)">删除</el-button>
          </template>
        </el-table-column>
      </el-table>

      <div class="pagination">
        <el-pagination
          background
          layout="prev, pager, next, sizes, total"
          :current-page="currentPage"
          :page-size="pageSize"
          :total="total"
          @size-change="handleSizeChange"
          @current-change="handleCurrentChange"
        />
      </div>
    </el-card>

    <el-dialog v-model="dialogFormVisible" :title="formTitle" width="680px" :close-on-click-modal="false">
      <el-form ref="productFormRef" :model="addProduct" :rules="rules" label-width="100px" class="product-form">
        <el-form-item label="产品名称" prop="productName">
          <el-input v-model="addProduct.productName" placeholder="请输入产品名称" />
        </el-form-item>
        <el-form-item label="产品编号" prop="productSn">
          <el-input v-model="addProduct.productSn" placeholder="请输入产品编号" />
        </el-form-item>
        <el-form-item label="产品价格" prop="price">
          <el-input v-model="addProduct.price" placeholder="请输入价格" />
        </el-form-item>
        <el-form-item label="产品库存" prop="stock">
          <el-input-number v-model="addProduct.stock" :min="0" />
        </el-form-item>
        <el-form-item label="产品分类" prop="productCategoryId">
          <el-cascader
            v-model="addProduct.productCategoryId"
            :options="categoryTree"
            :props="cascaderProps"
            placeholder="请选择分类"
            clearable
          />
        </el-form-item>
        <el-form-item label="产品描述" prop="productDescription">
          <el-input type="textarea" v-model="addProduct.productDescription" />
        </el-form-item>
        <el-form-item label="产品图片" prop="imageUrl">
          <upload-img v-model="addProduct.imageUrl" />
        </el-form-item>
        <el-form-item label="详情图" prop="detailUrl">
          <upload-img v-model="addProduct.detailUrl" />
        </el-form-item>
      </el-form>
      <template #footer>
        <el-button @click="dialogFormVisible = false">取消</el-button>
        <el-button type="primary" @click="save">保存</el-button>
      </template>
    </el-dialog>

    <el-drawer v-model="drawerVisible" title="产品详情" direction="rtl" size="50%" :with-header="true" @close="handleClose">
      <div class="drawer-content" v-if="productDetail">
        <el-descriptions :column="2" border>
          <el-descriptions-item label="产品名称">{{ productDetail.productName }}</el-descriptions-item>
          <el-descriptions-item label="产品编号">{{ productDetail.productSn }}</el-descriptions-item>
          <el-descriptions-item label="产品价格">¥ {{ productDetail.price }}</el-descriptions-item>
          <el-descriptions-item label="库存">{{ productDetail.stock }}</el-descriptions-item>
          <el-descriptions-item label="分类">{{ productDetail.category?.categoryName || '-' }}</el-descriptions-item>
          <el-descriptions-item label="描述">{{ productDetail.productDescription || '-' }}</el-descriptions-item>
        </el-descriptions>
      </div>
    </el-drawer>
  </div>
</template>
