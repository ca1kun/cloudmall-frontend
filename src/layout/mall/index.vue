<template>
  <div class="mall-layout">
    <!-- 顶部导航栏 -->
    <header class="mall-header">
      <div class="header-logo" @click="router.push('/mall/home')" style="cursor: pointer;">
        SCAU 商城
      </div>

      <div class="header-nav">
        <!-- 1. 新增：领券中心入口 -->
        <el-button link class="nav-item" @click="router.push('/mall/coupon')">
          <el-icon :size="18"><Ticket /></el-icon>
          <span class="nav-label">领券中心</span>
        </el-button>

        <el-button link class="nav-item" @click="router.push('/mall/order')">
          <el-icon :size="18"><List /></el-icon>
          <span class="nav-label">我的订单</span>
        </el-button>

        <!-- 购物车角标 -->
        <el-badge :value="cartCount" :hidden="cartCount === 0" class="nav-item cart-badge">
          <el-button link @click="router.push('/mall/cart')">
            <el-icon :size="18"><ShoppingCart /></el-icon>
            <span class="nav-label">购物车</span>
          </el-button>
        </el-badge>

        <el-switch
          class="theme-switch"
          :model-value="themeStore.theme === 'dark'"
          inline-prompt
          :active-icon="Moon"
          :inactive-icon="Sunny"
          @change="(value: boolean) => themeStore.applyTheme(value ? 'dark' : 'light')"
        />

        <span class="welcome-text">你好，{{ userStore.username }}</span>

        <!-- 下拉菜单：个人中心 & 退出 -->
        <el-dropdown trigger="click">
          <div class="avatar-wrapper">
            <el-avatar :size="32" :src="userStore.avatar" :icon="UserFilled" />
            <span class="avatar-name">{{ userStore.username }}</span>
            <el-icon><CaretBottom /></el-icon>
          </div>
          <template #dropdown>
            <!-- 2. 下拉框修复：统一宽度，去除 router-link -->
            <el-dropdown-menu class="custom-dropdown">
              <el-dropdown-item
                icon="User"
                @click="router.push(getRoleProfilePath(userStore.role))"
              >
                个人中心
              </el-dropdown-item>
              <el-dropdown-item
                icon="SwitchButton"
                divided
                @click="handleLogout"
              >
                退出登录
              </el-dropdown-item>
            </el-dropdown-menu>
          </template>
        </el-dropdown>
      </div>
    </header>

    <!-- 主体区域 -->
    <main class="mall-main">
      <router-view />
    </main>
  </div>
</template>

<script setup lang="ts">
import { onMounted, computed } from 'vue'
import { useUserStore } from '@/stores/user'
import { useCartStore } from '@/stores/cart'
import { useRouter } from 'vue-router'
import { ElMessage, ElMessageBox } from 'element-plus'
// 引入所有需要的图标
import { UserFilled, CaretBottom, ShoppingCart, Ticket, SwitchButton, User, Moon, Sunny, List } from '@element-plus/icons-vue'
import { getRoleProfilePath } from '@/utils/role'
import { useThemeStore } from '@/stores/theme'

const userStore = useUserStore()
const cartStore = useCartStore()
const router = useRouter()
const themeStore = useThemeStore()

// 数量实时监控
const cartCount = computed(() => cartStore.count)

const handleLogout = () => {
  ElMessageBox.confirm('确定要退出登录吗？', '提示', {
    confirmButtonText: '确定',
    cancelButtonText: '取消',
    type: 'warning',
  })
  .then(async () => {
    await userStore.logout()
    cartStore.reset()
    ElMessage.success('退出成功')
    router.replace('/login')
  })
  .catch(() => {})
}

onMounted(() => {
  if (userStore.token) {
    cartStore.updateCount()
  }
})
</script>

<style scoped>
.mall-layout {
  min-height: 100vh;
  background-color: var(--app-bg);
}

.mall-header {
  height: 64px; /* 稍微增高一点 */
  background: var(--app-surface);
  border-bottom: 1px solid var(--app-border);
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 0 30px;
  box-shadow: var(--app-shadow-sm);
  position: sticky;
  top: 0;
  z-index: 1000;
}

.header-logo {
  font-weight: 800;
  font-size: 22px;
  color: var(--app-primary);
  letter-spacing: 1px;
}

.header-nav {
  display: flex;
  align-items: center;
  gap: 20px; /* 使用 gap 代替 margin 更好控制间距 */
}

.nav-item {
  display: flex;
  align-items: center;
}

.nav-label {
  margin-left: 6px;
  font-size: 14px;
}

.welcome-text {
  font-size: 14px;
  color: var(--app-text-muted);
  border-left: 1px solid var(--app-border);
  padding-left: 20px;
  margin-left: 10px;
}

.avatar-wrapper {
  cursor: pointer;
  display: flex;
  align-items: center;
  gap: 6px;
  padding: 4px 8px;
  border-radius: 20px;
  transition: background 0.3s;
}

.avatar-wrapper:hover {
  background: var(--app-surface-muted);
}

.avatar-name {
  font-size: 14px;
  color: var(--app-text);
}

.theme-switch {
  --el-switch-on-color: var(--app-primary);
  --el-switch-off-color: #cbd5f5;
}

.mall-main {
  padding: 20px;
  max-width: 1300px; /* 限制最大宽度，大屏显示更舒服 */
  margin: 0 auto;
}

/* 下拉菜单统一宽度 */
.custom-dropdown {
  width: 150px;
}
</style>
