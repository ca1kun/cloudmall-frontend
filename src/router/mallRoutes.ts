export const mallRoutes = [
  {
    path: 'home',
    name: 'MallHome',
    component: () => import('@/views/mall/home/index.vue'),
    meta: { title: '商城首页', roles: ['CUSTOMER'] },
  },
  {
    path: 'product/:id',
    name: 'MallProductDetail',
    component: () => import('@/views/mall/product/detail.vue'),
    meta: { title: '商品详情', roles: ['CUSTOMER'] },
  },
  {
    path: 'profile',
    name: 'MallProfile',
    component: () => import('@/views/profile/index.vue'),
    meta: { title: '个人中心', roles: ['CUSTOMER'] },
  },
  {
    path: 'cart',
    name: 'MallCart',
    component: () => import('@/views/mall/cart/index.vue'),
    meta: { title: '购物车', roles: ['CUSTOMER'] },
  },
  {
    path: 'order',
    name: 'MallOrderList',
    component: () => import('@/views/mall/order/index.vue'),
    meta: { title: '我的订单', roles: ['CUSTOMER'] },
  },
  {
    path: 'order/:orderId',
    name: 'MallOrderDetail',
    component: () => import('@/views/mall/order/detail.vue'),
    meta: { title: '订单详情', roles: ['CUSTOMER'] },
  },
  {
    path: 'checkout',
    name: 'MallCheckout',
    component: () => import('@/views/mall/order/checkout.vue'),
    meta: { title: '确认订单', roles: ['CUSTOMER'] },
  },
  {
    path: 'pay/confirm',
    name: 'PayConfirm',
    component: () => import('@/views/mall/pay/confirm.vue'),
    meta: { title: '收银台', roles: ['CUSTOMER'] },
  },
  {
    path: 'pay/success',
    name: 'PaySuccess',
    component: () => import('@/views/mall/pay/success.vue'),
    meta: { title: '支付成功', roles: ['CUSTOMER'] },
  },
  {
    path: 'coupon',
    name: 'MallCoupon',
    component: () => import('@/views/mall/coupon/index.vue'),
    meta: { title: '领券中心', roles: ['CUSTOMER'] },
  },
]
