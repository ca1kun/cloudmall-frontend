import request, { type ApiResult } from '@/utils/request'
import type { Address, AddressForm, AddressQueryParams, PageResult } from '@/types/types'

// 查询地址列表
export function listAddressApi(params?: AddressQueryParams) {
  return request.get<never, ApiResult<PageResult<Address>>>('/system/address/list', { params })
}

// 查询地址详情
export function getAddressApi(id: number) {
  return request.get<never, ApiResult<Address>>(`/system/address/${id}`)
}

// 新增地址
export function addAddressApi(data: AddressForm) {
  return request.post<AddressForm, ApiResult<number>>('/system/address', data)
}

// 修改地址
export function updateAddressApi(data: AddressForm) {
  return request.put<AddressForm, ApiResult<void>>('/system/address', data)
}

// 删除地址
export function deleteAddressApi(id: number) {
  return request.delete<never, ApiResult<void>>(`/system/address/${id}`)
}

// 设置默认地址
export function setDefaultAddressApi(id: number) {
  return request.put<never, ApiResult<void>>(`/system/address/${id}/default`)
}
