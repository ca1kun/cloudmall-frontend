import { createRouter, createWebHistory, type RouteRecordRaw } from 'vue-router'
import { merchantRouters } from './merchantRouter'
import { mallRoutes } from './mallRoutes'
import { canAccessCurrentRoute, getRoleHomePath, normalizeRole } from '@/utils/role'


const router = createRouter({
  history: createWebHistory(import.meta.env.BASE_URL),
  routes: [
    // -----------------------------------------------------------
    // 1. 登录页 (无需权限)
    // -----------------------------------------------------------
    {
      path: '/login',
      name: 'login',
      component: () => import('@/views/login/index.vue'),
    },

    {
      path: '/',
      redirect: '/mall/home',
    },

    {
      path: '/merchant',
      component: () => import('@/layout/merchant/index.vue'),
      redirect: '/merchant/home',
      meta: { requiresAuth: true, role: 'MERCHANT' },
      children: [
        ...merchantRouters
      ]
    },

    // -----------------------------------------------------------
    // 2. 商城入口 (CUSTOMER)
    // -----------------------------------------------------------
    {
      path: '/mall',
      // 👇【修改这里】指向你新建的 mall 目录下的布局
      component: () => import('@/layout/mall/index.vue'),
      redirect: '/mall/home',
      meta: { requiresAuth: true, role: 'CUSTOMER' },
      children: [
        ...mallRoutes
      ]
    },
    // 404 页面 (可选)
    // {
    //    path: '/:pathMatch(.*)*',
    //    component: () => import('@/views/404.vue')
    // }
  ],
})

// -----------------------------------------------------------
// 路由守卫 (核心逻辑：拦截器)
// -----------------------------------------------------------
router.beforeEach((to, from, next) => {
  const token = localStorage.getItem('token')
  const role = normalizeRole(localStorage.getItem('role'))

  if (token && !role) {
    localStorage.removeItem('token')
    localStorage.removeItem('role')
    if (to.path !== '/login') {
      return next('/login')
    }
  }

  // 1. 如果没有 Token，且去的不是登录页 -> 强制去登录
  if (!token && to.path !== '/login') {
    return next('/login')
  }

  // 2. 如果有 Token
  if (token) {
    // 2.1 如果想去登录页 -> 根据角色踢回首页
    if (to.path === '/login') {
      return next(getRoleHomePath(role))
    }

    if (!canAccessCurrentRoute(role, to)) {
      return next(getRoleHomePath(role))
    }
  }

  // 3. 放行 (死循环通常是因为这行没执行到，或者上面一直 return next(...))
  next()
})

export default router
