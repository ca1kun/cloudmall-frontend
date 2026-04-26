import request from '@/utils/request'
import type { ApiResult } from '@/utils/request'
import type { AuthResult, LoginUser, PageResult, SuperAdmin, SuperAdminForm, SuperAdminQueryParams } from '@/types/types'

export function login(data: LoginUser) {
  return request.post<LoginUser, ApiResult<AuthResult>>('/user/login', data)
}

export function info() {
  return request.get<never, ApiResult<AuthResult>>('/user/info')
}

export function getSuperAdminPage(params: SuperAdminQueryParams) {
  return request.get<never, ApiResult<PageResult<SuperAdmin>>>('/system/admin/page', { params })
}

export function getSuperAdminById(adminId: number) {
  return request.get<never, ApiResult<SuperAdmin>>(`/system/admin/${adminId}`)
}

export function addSuperAdmin(data: SuperAdminForm) {
  return request.post<SuperAdminForm, ApiResult<string>>('/system/admin', data)
}

export function updateSuperAdmin(data: SuperAdminForm) {
  return request.put<SuperAdminForm, ApiResult<string>>('/system/admin', data)
}

export function deleteSuperAdmin(adminId: number) {
  return request.delete<never, ApiResult<string>>(`/system/admin/${adminId}`)
}

export function resetSuperAdminPassword(adminId: number, password: string) {
  return request.put<{ password: string }, ApiResult<string>>(`/system/admin/${adminId}/password`, { password })
}
