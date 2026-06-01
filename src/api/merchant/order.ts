import request, { type ApiResult } from '@/utils/request'
import type {
  Order,
  OrderDetail,
  OrderQueryParams,
  OrderReturnAuditPayload,
  OrderStatusCount,
  PageResult,
} from '@/types/types'

// 查询订单列表 (商家)
export const listMerchantOrdersApi = (params: OrderQueryParams) => {
  return request.get<never, ApiResult<PageResult<Order>>>('/merchant/orders/page', { params })
}

// 查询订单详情 (商家)
export const getMerchantOrderDetailApi = (orderId: number) => {
  return request.get<never, ApiResult<OrderDetail>>(`/merchant/orders/${orderId}`)
}

// 订单状态统计 (商家)
export const getMerchantOrderStatusCountApi = () => {
  return request.get<never, ApiResult<OrderStatusCount[]>>('/merchant/orders/status-count')
}

// 审核退货 (商家)
export const auditMerchantOrderReturnApi = (orderId: number, data: OrderReturnAuditPayload) => {
  return request.post<OrderReturnAuditPayload, ApiResult<void>>(`/merchant/orders/${orderId}/return/audit`, data)
}
