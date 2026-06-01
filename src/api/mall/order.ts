import request, { type ApiResult } from '@/utils/request'
import type {
  CreateOrderResult,
  Order,
  OrderDetail,
  OrderParam,
  OrderQueryParams,
  OrderReturnApplyPayload,
  OrderStatusCount,
  PageResult,
} from '@/types/types'

// 创建订单
export const createOrderApi = (data: OrderParam) => {
  return request.post<OrderParam, ApiResult<CreateOrderResult>>('/order/create', data)
}

// 查询订单列表 (商城)
export const listMallOrdersApi = (params: OrderQueryParams) => {
  return request.get<never, ApiResult<PageResult<Order>>>('/mall/orders/page', { params })
}

// 查询订单详情 (商城)
export const getMallOrderDetailApi = (orderId: number) => {
  return request.get<never, ApiResult<OrderDetail>>(`/mall/orders/${orderId}`)
}

// 订单状态统计 (商城)
export const getMallOrderStatusCountApi = () => {
  return request.get<never, ApiResult<OrderStatusCount[]>>('/mall/orders/status-count')
}

// 申请退货 (商城)
export const applyMallOrderReturnApi = (orderId: number, data: OrderReturnApplyPayload) => {
  return request.post<OrderReturnApplyPayload, ApiResult<void>>(`/mall/orders/${orderId}/return`, data)
}
