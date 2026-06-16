<template>
  <div class="mall-home">
    <!-- 1. 顶部轮播图区 -->
    <div class="carousel-section">
      <el-carousel :interval="5000" height="340px" indicator-position="outside">
        <el-carousel-item v-for="item in bannerList" :key="item.id">
          <div class="banner-item" :style="{ backgroundImage: `url(${item.img})` }" @click="handleBannerClick(item)">
            <div class="banner-overlay">
              <div class="banner-text">
                <span class="banner-kicker">CloudMall Select</span>
                <h3>{{ item.title }}</h3>
                <p>{{ item.subTitle }}</p>
              </div>
            </div>
          </div>
        </el-carousel-item>
      </el-carousel>
    </div>

    <!-- 2. 吸顶筛选栏 -->
    <div class="sticky-filter-wrapper">
      <div class="filter-bar">
        <div class="filter-left">
          <span class="filter-label">品类筛选</span>
          <el-cascader
            v-model="selectedCategory"
            :options="categoryTree"
            :props="cascaderProps"
            placeholder="全部商品"
            clearable
            @change="handleCategoryChange"
            class="custom-cascader"
          />
        </div>
        <div class="filter-right">
          <el-tag v-if="total > 0" type="info" effect="plain" round class="total-tag">
            共 {{ total }} 件商品
          </el-tag>
        </div>
      </div>
    </div>

    <!-- 3. 商品列表展示区 (无限滚动) -->
    <div
      class="product-container"
      v-infinite-scroll="loadMore"
      :infinite-scroll-disabled="disabled"
      :infinite-scroll-distance="30"
    >
      <div class="list-title-box">
        <div>
          <span class="section-kicker">精选商品</span>
          <h3 class="section-title">猜你喜欢</h3>
        </div>
        <span class="section-subtitle">为你挑选近期热门好物</span>
      </div>

      <el-row :gutter="20">
        <el-col
          v-for="item in productList"
          :key="item.productId"
          :xs="12" :sm="8" :md="6" :lg="6" :xl="4"
          class="col-mb"
        >
          <el-card :body-style="{ padding: '0px' }" class="product-card" shadow="hover">
            <!-- 图片区域：强制正方形，防止拉伸 -->
            <div class="image-wrapper">
              <el-image :src="item.imageUrl || defaultImg" fit="cover" lazy class="product-image">
                <template #placeholder>
                  <div class="image-slot">加载中...</div>
                </template>
              </el-image>
            </div>

            <!-- 信息区域 -->
            <div class="product-info">
              <div class="product-name" :title="item.productName">{{ item.productName }}</div>
              <div class="product-desc" :title="item.productDescription">{{ item.productDescription || '品质好物' }}</div>
              <div class="product-bottom">
                <div class="price-box">
                  <span class="currency">¥</span>
                  <span class="price-val">{{ item.price }}</span>
                </div>
                <el-button type="primary" icon="ShoppingCart" circle class="add-btn" @click="addToCart(item)" />
              </div>
            </div>
          </el-card>
        </el-col>
      </el-row>

      <!-- 4. 加载状态 -->
      <div class="load-status">
        <div v-if="loading" class="loading-box">
          <el-icon class="is-loading"><Loading /></el-icon>
          <span>努力加载中...</span>
        </div>
        <p v-else-if="noMore" class="no-more-text">—— 到底啦，看看别的吧 ——</p>
      </div>

      <el-empty v-if="!loading && productList.length === 0" description="该分类下暂无商品" />
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, reactive, computed, onMounted } from 'vue'
import { getProductPageApi } from '@/api/item/product'
import { useCartStore } from '@/stores/cart'
import { addCartApi } from '@/api/mall/cart'
import { ElMessage } from 'element-plus'
import { ShoppingCart, Loading } from '@element-plus/icons-vue'
import { listCategory } from '@/api/item/category'

// --- 数据状态 ---
const loading = ref(false)
const productList = ref<any[]>([])
const total = ref(0)
const defaultImg = 'https://cube.elemecdn.com/e/fd/0fc7d20532fdaf769a25683617711png.png'
const cartStore = useCartStore()

// --- 分类筛选 ---
const categoryTree = ref<any[]>([])
const selectedCategory = ref<any>(null)
const cascaderProps = {
  value: 'categoryId',
  label: 'categoryName',
  children: 'children',
  checkStrictly: true,
  emitPath: false
}

const queryParams = reactive({
  pageNum: 1,
  pageSize: 12,
  categoryId: null as number | null
})

// --- 逻辑：加载分类 ---
const initCategory = async () => {
  const res = await listCategory() as any
  if (res.code === 200) {
    categoryTree.value = listToTree(res.data)
  }
}

const listToTree = (list: any[]) => {
  const map: any = {}, tree: any[] = []
  list.forEach(item => map[item.categoryId] = { ...item, children: [] })
  list.forEach(item => {
    const node = map[item.categoryId]
    if (item.parentId === 0) tree.push(node)
    else if (map[item.parentId]) map[item.parentId].children.push(node)
  })
  const clean = (nodes: any[]) => {
    nodes.forEach(n => {
      if (!n.children || n.children.length === 0) delete n.children
      else clean(n.children)
    })
  }
  clean(tree)
  return tree
}

// --- 逻辑：加载商品 ---
const noMore = computed(() => total.value > 0 && productList.value.length >= total.value)
const disabled = computed(() => loading.value || noMore.value)

const loadData = async () => {
  if (loading.value) return
  loading.value = true
  try {
    const res = await getProductPageApi(queryParams) as any
    if (res.code === 200) {
      const newRecords = res.data.list || []
      productList.value.push(...newRecords)
      total.value = res.data.total
    }
  } finally {
    loading.value = false
  }
}

const loadMore = () => {
  if (!disabled.value) {
    queryParams.pageNum++
    loadData()
  }
}

const handleCategoryChange = (val: any) => {
  queryParams.categoryId = val || null
  queryParams.pageNum = 1
  productList.value = []
  total.value = 0
  loadData()
}

const addToCart = async (item: any) => {
  const res = await addCartApi({ productId: item.productId, quantity: 1 }) as any
  if (res.code === 200) {
    ElMessage.success(`已加入购物车`)
    cartStore.updateCount()
  }
}

const bannerList = [
  { id: 1, title: '智能数码 旗舰首发', subTitle: '小米14 Pro 现货抢购中', img: 'https://images.unsplash.com/photo-1519389950473-47ba0277781c?q=80&w=1200' },
  { id: 2, title: '极简办公 悦享生活', subTitle: '高端机械键盘 满300减50', img: 'https://images.unsplash.com/photo-1556228453-efd6c1ff04f6?q=80&w=1200' },
  { id: 3, title: '品质文具 助力考研', subTitle: '得力考研文具套装热销中', img: 'https://images.pexels.com/photos/437037/pexels-photo-437037.jpeg?auto=compress&cs=tinysrgb&w=1200' }
]

const handleBannerClick = (item: any) => {
  console.log('点击海报:', item.title)
}

onMounted(() => {
  loadData()
  initCategory()
})
</script>

<style scoped>
.mall-home {
  background:
    linear-gradient(180deg, rgba(64, 158, 255, 0.08), transparent 280px),
    var(--app-bg);
  min-height: 100vh;
  padding-bottom: 48px;
}

/* 1. 轮播图美化 */
.carousel-section {
  padding: 28px 20px 18px;
  max-width: 1240px;
  margin: 0 auto;
}
.banner-item {
  width: 100%;
  height: 100%;
  background-size: cover;
  background-position: center;
  border-radius: 18px;
  position: relative;
  overflow: hidden;
  cursor: pointer;
  box-shadow: 0 20px 44px rgba(15, 23, 42, 0.16);
}
.banner-overlay {
  position: absolute;
  inset: 0;
  background: linear-gradient(90deg, rgba(15, 23, 42, 0.72), rgba(15, 23, 42, 0.2) 56%, rgba(15, 23, 42, 0.08));
  display: flex;
  align-items: flex-end;
  padding: 36px;
}
.banner-kicker {
  display: inline-block;
  margin-bottom: 10px;
  color: rgba(255,255,255,0.78);
  font-size: 13px;
  font-weight: 700;
  letter-spacing: 0;
}
.banner-text h3 { color: #fff; font-size: 34px; margin: 0; font-weight: 800; }
.banner-text p { color: rgba(255,255,255,0.82); margin: 10px 0 0; font-size: 16px; }

.carousel-section :deep(.el-carousel__button) {
  width: 22px;
  height: 4px;
  border-radius: 999px;
}

/* 2. 筛选栏 - 吸顶效果 */
.sticky-filter-wrapper {
  background: color-mix(in srgb, var(--app-surface) 92%, transparent);
  backdrop-filter: blur(12px);
  position: sticky;
  top: 64px; /* 假设你的 navbar 高度是 64px */
  z-index: 999;
  border-top: 1px solid var(--app-border);
  border-bottom: 1px solid var(--app-border);
  margin-bottom: 28px;
}
.filter-bar {
  max-width: 1200px;
  margin: 0 auto;
  padding: 14px 20px;
  display: flex;
  justify-content: space-between;
  align-items: center;
}
.filter-left { display: flex; align-items: center; }
.filter-label {
  font-size: 15px; font-weight: 700; color: var(--app-text); margin-right: 20px;
}
.custom-cascader { width: 280px; }

.custom-cascader :deep(.el-input__wrapper) {
  background: var(--app-surface);
  box-shadow: 0 0 0 1px var(--app-border) inset;
  border-radius: 12px;
}

.custom-cascader :deep(.el-input__inner) {
  color: var(--app-text);
}

.custom-cascader :deep(.el-input__inner::placeholder) {
  color: var(--app-text-muted);
}

.custom-cascader :deep(.el-input__suffix-inner),
.custom-cascader :deep(.el-icon) {
  color: var(--app-text-muted);
}

.total-tag {
  border-color: var(--app-border);
  color: var(--app-text);
  background: var(--app-surface-soft);
}

/* 3. 商品网格 */
.product-container {
  max-width: 1200px;
  margin: 0 auto;
  padding: 0 20px;
}
.list-title-box {
  margin-bottom: 22px;
  display: flex;
  align-items: flex-end;
  justify-content: space-between;
  gap: 16px;
}
.section-kicker {
  display: block;
  margin-bottom: 4px;
  color: var(--app-primary);
  font-size: 13px;
  font-weight: 700;
}
.section-title { font-size: 24px; font-weight: 800; color: var(--app-text); margin: 0; }
.section-subtitle { color: var(--app-text-muted); font-size: 14px; }

.product-card {
  overflow: hidden;
  border: 1px solid var(--app-border);
  border-radius: 12px;
  transition: transform 0.22s ease, box-shadow 0.22s ease, border-color 0.22s ease;
  background: var(--app-surface);
}
.product-card:hover {
  transform: translateY(-6px);
  border-color: color-mix(in srgb, var(--app-primary) 44%, var(--app-border));
  box-shadow: var(--app-shadow-md) !important;
}

.image-wrapper {
  width: 100%; aspect-ratio: 1/1; overflow: hidden; background: var(--app-surface-soft);
}
.product-image { width: 100%; height: 100%; transition: transform 0.5s; }
.product-card:hover .product-image { transform: scale(1.08); }

.product-info { padding: 16px; }
.product-name {
  font-size: 16px; font-weight: 700; color: var(--app-text); height: 22px;
  overflow: hidden; text-overflow: ellipsis; white-space: nowrap; margin-bottom: 8px;
}
.product-desc {
  font-size: 13px; color: var(--app-text-muted); height: 18px;
  overflow: hidden; text-overflow: ellipsis; white-space: nowrap; margin-bottom: 15px;
}

.product-bottom { display: flex; justify-content: space-between; align-items: center; }
.price-box { color: var(--app-danger); }
.currency { font-size: 14px; font-weight: bold; }
.price-val { font-size: 24px; font-weight: 800; font-family: 'Helvetica Neue'; }

.add-btn {
  box-shadow: var(--app-shadow-sm);
  transition: transform 0.2s ease;
}

.add-btn:hover {
  transform: scale(1.06);
}

.col-mb { margin-bottom: 25px; }

/* 4. 加载状态 */
.load-status { padding: 40px 0; text-align: center; }
.loading-box { color: var(--app-primary); display: flex; align-items: center; justify-content: center; gap: 8px; }
.no-more-text { color: var(--app-text-muted); font-size: 14px; opacity: 0.6; }

.image-slot {
  display: flex; justify-content: center; align-items: center;
  width: 100%; height: 100%; background: var(--app-surface-muted); color: var(--app-text-muted);
}

@media (max-width: 768px) {
  .carousel-section {
    padding: 18px 14px 10px;
  }

  .banner-overlay {
    padding: 24px;
  }

  .banner-text h3 {
    font-size: 26px;
  }

  .filter-bar,
  .filter-left,
  .list-title-box {
    align-items: stretch;
    flex-direction: column;
  }

  .custom-cascader {
    width: 100%;
  }
}
</style>
