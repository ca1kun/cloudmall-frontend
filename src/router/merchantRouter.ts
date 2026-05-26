export const merchantRouters = [
  {
    path: '/merchant/home',
    name: 'merchant-home',
    component: () => import('@/views/merchant/home/index.vue'),
    meta: {
      icon: 'HomeFilled',
      title: '商家首页',
      roles: ['MERCHANT'],
    },
  },
  {
    path: '/merchant/profile',
    name: 'merchant-profile',
    component: () => import('@/views/profile/index.vue'),
    meta: {
      icon: 'User',
      title: '个人中心',
      roles: ['MERCHANT'],
    },
  },
  {
    path: '/merchant/item',
    name: 'merchant-item',
    redirect: '/merchant/item/product',
    meta: {
      icon: 'Grid',
      title: '商品管理',
      roles: ['MERCHANT'],
    },
    children: [
      {
        path: '/merchant/item/product',
        name: 'merchant-product',
        component: () => import('@/views/merchant/item/product/index.vue'),
        meta: {
          icon: 'Goods',
          title: '商品',
          roles: ['MERCHANT'],
        },
      },
      {
        path: '/merchant/item/category',
        name: 'merchant-category',
        component: () => import('@/views/merchant/item/category/index.vue'),
        meta: {
          icon: 'Folder',
          title: '类别',
          roles: ['MERCHANT'],
        },
      },
    ],
  },
  {
    path: '/merchant/pos',
    name: 'merchant-pos',
    redirect: '/merchant/pos/sale',
    meta: {
      icon: 'Shop',
      title: '订单管理',
      roles: ['MERCHANT'],
    },
    children: [
      {
        path: '/merchant/pos/sale',
        name: 'merchant-sale',
        component: () => import('@/views/merchant/pos/sale/index.vue'),
        meta: {
          icon: 'Sell',
          title: '订单列表',
          roles: ['MERCHANT'],
        },
      },
      {
        path: '/merchant/pos/payment',
        name: 'merchant-payment',
        component: () => import('@/views/merchant/pos/payment/index.vue'),
        meta: {
          icon: 'Wallet',
          title: '收款',
          roles: ['MERCHANT'],
        },
      },
    ],
  },
  {
    path: '/merchant/marketing',
    name: 'merchant-marketing',
    redirect: '/merchant/marketing/coupon',
    meta: {
      icon: 'Present',
      title: '营销管理',
      roles: ['MERCHANT'],
    },
    children: [
      {
        path: '/merchant/marketing/coupon',
        name: 'merchant-coupon',
        component: () => import('@/views/merchant/marketing/coupon/index.vue'),
        meta: {
          icon: 'Ticket',
          title: '优惠券管理',
          roles: ['MERCHANT'],
          couponScope: 'MERCHANT',
        },
      },
    ],
  },
]
