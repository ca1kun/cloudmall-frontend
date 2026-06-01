import type { OrderStatus } from '@/types/types'

export const orderStatusLabels: Record<OrderStatus, string> = {
  PENDING_PAYMENT: '待支付',
  PAID: '已支付',
  SHIPPED: '已发货',
  COMPLETED: '已完成',
  CANCELED: '已取消',
  REFUNDING: '退款中',
  REFUNDED: '已退款',
  RETURN_REJECTED: '退货被拒',
}

export const orderStatusTagType: Record<OrderStatus, 'info' | 'success' | 'warning' | 'danger'> = {
  PENDING_PAYMENT: 'warning',
  PAID: 'success',
  SHIPPED: 'info',
  COMPLETED: 'success',
  CANCELED: 'danger',
  REFUNDING: 'warning',
  REFUNDED: 'success',
  RETURN_REJECTED: 'danger',
}
