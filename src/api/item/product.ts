import request, { type ApiResult } from '@/utils/request'
import type { PageResult, Product, ProductQueryParams } from '@/types/types'

// ==========================================
// API 定义 (使用泛型指定返回类型)
// 语法: request.get<请求参数类型, 响应数据类型>(url, config)
// ==========================================

// 根据 SN 获取商品
export const getProdctBySnApi = (sn: string) => {
  return request.get<never, ApiResult<Product>>(`/product/getBySn/${sn}`)
}

// 获取所有商品
export const listAllProduct = () => {
  return request.get<never, ApiResult<Product[]>>('/product/listAll')
}

// 新增商品
export const addProductApi = (product: Product) => {
  return request.post<Product, ApiResult<string>>('/product/add', product)
}

// 更新商品
export const updateProductApi = (product: Product) => {
  return request.put<Product, ApiResult<string>>('/product/update', product)
}

// 根据 ID 获取商品
export const getProdctByIdApi = (id: number) => {
  return request.get<never, ApiResult<Product>>(`/product/${id}`)
}

// 删除商品
export const deleteProductApi = (id: number) => {
  return request.delete<never, ApiResult<string>>(`/product/delete/${id}`)
}

// 分页查询
export const getProductPageApi = (params: ProductQueryParams) => {
  return request.get<never, ApiResult<PageResult<Product>>>('/product/page', { params })
}

// 批量删除
export const deleteProductsByIdsApi = (productIds: number[] | string[]) => {
  const idsString = productIds.join(',')
  return request.delete<never, ApiResult<string>>(`/product/deleteByIds/${idsString}`)
}
