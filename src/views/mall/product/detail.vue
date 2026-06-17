<template>
  <div class="product-detail-page" v-loading="loading">
    <div v-if="product" class="detail-shell">
      <div class="hero-card">
        <div class="media-panel">
          <img :src="product.imageUrl || fallbackImage" :alt="product.productName" class="hero-image" />
        </div>

        <div class="info-panel">
          <div class="crumb">商城商品 / {{ product.category?.categoryName || '商品详情' }}</div>
          <h1 class="title">{{ product.productName }}</h1>
          <p class="subtitle">{{ product.productDescription || '暂无商品描述' }}</p>

          <div class="price-box">
            <span class="price-label">到手价</span>
            <span class="price-value">￥{{ formatPrice(product.price) }}</span>
          </div>

          <div class="meta-grid">
            <div class="meta-item">
              <span class="meta-key">商品编号</span>
              <span class="meta-val">{{ product.productSn || '-' }}</span>
            </div>
            <div class="meta-item">
              <span class="meta-key">库存</span>
              <span class="meta-val">{{ product.stock ?? '-' }}</span>
            </div>
            <div class="meta-item">
              <span class="meta-key">分类</span>
              <span class="meta-val">{{ product.category?.categoryName || '-' }}</span>
            </div>
          </div>

          <div class="action-bar">
            <el-input-number v-model="quantity" :min="1" :max="99" />
            <el-button type="primary" size="large" round @click="addToCartNow">
              加入购物车
            </el-button>
            <el-button plain size="large" round @click="goBack">
              返回商城
            </el-button>
          </div>

          <div v-if="product.detailUrl" class="extra-link">
            <a :href="product.detailUrl" target="_blank" rel="noopener noreferrer">查看原始详情链接</a>
          </div>
        </div>
      </div>
    </div>

    <el-empty v-else-if="!loading" description="未找到该商品" />
  </div>
</template>

<script setup lang="ts">
import { onMounted, ref } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { ElMessage } from 'element-plus'
import { getProdctByIdApi } from '@/api/item/product'
import { addCartApi } from '@/api/mall/cart'
import { useCartStore } from '@/stores/cart'
import type { Product } from '@/types/types'

const route = useRoute()
const router = useRouter()
const cartStore = useCartStore()
const loading = ref(false)
const quantity = ref(1)
const product = ref<Product | null>(null)
const fallbackImage = 'https://cube.elemecdn.com/e/fd/0fc7d20532fdaf769a25683617711png.png'

async function loadProduct() {
  const id = Number(route.params.id)
  if (!id) return
  loading.value = true
  try {
    const res = await getProdctByIdApi(id)
    if (res.code === 200) {
      product.value = res.data
    } else {
      product.value = null
    }
  } finally {
    loading.value = false
  }
}

async function addToCartNow() {
  if (!product.value?.productId) return
  const res = await addCartApi({
    productId: product.value.productId,
    quantity: quantity.value,
  })
  if (res.code === 200) {
    ElMessage.success('已加入购物车')
    cartStore.updateCount()
  }
}

function goBack() {
  router.push('/mall/home')
}

function formatPrice(price: number | string) {
  return Number(price).toFixed(2)
}

onMounted(() => {
  loadProduct()
})
</script>

<style scoped>
.product-detail-page {
  min-height: calc(100vh - 120px);
  padding: 24px 0 40px;
}

.detail-shell {
  max-width: 1180px;
  margin: 0 auto;
}

.hero-card {
  display: grid;
  grid-template-columns: 1fr 1.1fr;
  gap: 28px;
  padding: 28px;
  border-radius: 28px;
  background:
    radial-gradient(circle at top left, rgba(255, 122, 24, 0.12), transparent 28%),
    linear-gradient(180deg, #fffaf4 0%, #ffffff 42%);
  box-shadow: 0 24px 60px rgba(20, 20, 43, 0.08);
}

.media-panel {
  padding: 22px;
  border-radius: 24px;
  background: #fff;
  border: 1px solid #f2ebe6;
}

.hero-image {
  width: 100%;
  aspect-ratio: 1 / 1;
  object-fit: cover;
  border-radius: 20px;
}

.info-panel {
  display: flex;
  flex-direction: column;
}

.crumb {
  font-size: 12px;
  color: #8a8f99;
}

.title {
  margin: 10px 0 12px;
  font-size: 30px;
  line-height: 1.25;
  color: #1f2329;
}

.subtitle {
  margin: 0;
  font-size: 15px;
  line-height: 1.8;
  color: #5f6570;
}

.price-box {
  margin-top: 24px;
  padding: 18px 20px;
  border-radius: 20px;
  background: linear-gradient(135deg, #fff0e7, #fff7f2);
}

.price-label {
  display: block;
  font-size: 12px;
  color: #9d6548;
}

.price-value {
  margin-top: 6px;
  display: block;
  font-size: 34px;
  font-weight: 800;
  color: #ff5a36;
}

.meta-grid {
  margin-top: 24px;
  display: grid;
  grid-template-columns: repeat(3, 1fr);
  gap: 14px;
}

.meta-item {
  padding: 14px 16px;
  border-radius: 18px;
  background: #fff;
  border: 1px solid #f2ebe6;
}

.meta-key {
  display: block;
  font-size: 12px;
  color: #8a8f99;
}

.meta-val {
  display: block;
  margin-top: 6px;
  font-size: 14px;
  font-weight: 700;
  color: #1f2329;
}

.action-bar {
  margin-top: 28px;
  display: flex;
  align-items: center;
  gap: 14px;
}

.extra-link {
  margin-top: 20px;
}

.extra-link a {
  color: #ff6b3d;
  text-decoration: none;
  font-size: 13px;
}

@media (max-width: 900px) {
  .hero-card {
    grid-template-columns: 1fr;
    padding: 18px;
  }

  .meta-grid {
    grid-template-columns: 1fr;
  }

  .action-bar {
    flex-wrap: wrap;
  }
}
</style>
