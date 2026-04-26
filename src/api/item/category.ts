import request, { type ApiResult } from '@/utils/request'
import type { Category } from '@/types/types'

export const listCategory = () => {
  return request.get<never, ApiResult<Category[]>>('/category/listAll')
}

export function getCategoryById(categoryId: number) {
  return request.get<never, ApiResult<Category>>('/category/' + categoryId)
}

// 删除类别
export function deleteCategoryApi(id: number) {
  return request.delete<never, ApiResult<string>>(`/category/delete/${id}`)
}

// 新增类别
export function addCategoryApi(data: Category) {
  return request.post<Category, ApiResult<string>>('/category/add', data)
}

// 修改类别
export function updateCategoryApi(data: Category) {
  return request.put<Category, ApiResult<string>>('/category/update', data)
}
