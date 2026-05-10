import request from '@/utils/request'
import type { ApiResult } from '@/utils/request'
import type { ManagedAccount, ManagedAccountForm, ManagedAccountQueryParams, PageResult } from '@/types/types'

export type AccountType = 'merchant' | 'customer'

function prefixPath(type: AccountType) {
  return `/system/${type}`
}

export function getAccountPage(type: AccountType, params: ManagedAccountQueryParams) {
  return request.get<never, ApiResult<PageResult<ManagedAccount>>>(`${prefixPath(type)}/page`, { params })
}

export function getAccountById(type: AccountType, id: number) {
  return request.get<never, ApiResult<ManagedAccount>>(`${prefixPath(type)}/${id}`)
}

export function addAccount(type: AccountType, data: ManagedAccountForm) {
  return request.post<ManagedAccountForm, ApiResult<string>>(prefixPath(type), data)
}

export function updateAccount(type: AccountType, data: ManagedAccountForm) {
  return request.put<ManagedAccountForm, ApiResult<string>>(prefixPath(type), data)
}

export function deleteAccount(type: AccountType, id: number) {
  return request.delete<never, ApiResult<string>>(`${prefixPath(type)}/${id}`)
}

export function resetAccountPassword(type: AccountType, id: number, password: string) {
  return request.put<{ password: string }, ApiResult<string>>(`${prefixPath(type)}/${id}/password`, { password })
}
