import request, { type ApiResult } from '@/utils/request'
import type { CartItem } from '@/types/types'

// 获取购物车列表
export const getCartListApi = () => {
  return request.get<never, ApiResult<CartItem[]>>('/cart/list')
}

// 添加/修改购物车
// 注意：后端逻辑是“累加”，传入 1 代表数量+1，传入 -1 代表数量-1
export const addCartApi = (data: { productId: number; quantity: number }) => {
  return request.post<{ productId: number; quantity: number }, ApiResult<string>>('/cart/add', data)
}

// 删除购物车商品
export const deleteCartApi = (productId: number) => {
  return request.delete<never, ApiResult<string>>(`/cart/delete/${productId}`)
}
