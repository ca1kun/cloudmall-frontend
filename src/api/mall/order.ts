import request, { type ApiResult } from '@/utils/request'
import type { CreateOrderResult, OrderParam } from '@/types/types'

// 创建订单
export const createOrderApi = (data: OrderParam) => {
  return request.post<OrderParam, ApiResult<CreateOrderResult>>('/order/create', data)
}
