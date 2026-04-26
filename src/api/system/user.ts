import request from '@/utils/request'
import type { ApiResult } from '@/utils/request'
import type { LoginUser, PageResult, SuperAdmin, SuperAdminForm, SuperAdminQueryParams } from '@/types/types'

export function login(data: LoginUser) {
  return request({
    url: '/user/login',
    method: 'post',
    data: data,
  })
}

export function info() {
  return request({
    url: '/user/info',
    method: 'get',
  })
}

export function getSuperAdminPage(params: SuperAdminQueryParams) {
  return request<any, ApiResult<PageResult<SuperAdmin>>>({
    url: '/system/admin/page',
    method: 'get',
    params,
  })
}

export function getSuperAdminById(adminId: number) {
  return request<any, ApiResult<SuperAdmin>>({
    url: `/system/admin/${adminId}`,
    method: 'get',
  })
}

export function addSuperAdmin(data: SuperAdminForm) {
  return request<any, ApiResult<string>>({
    url: '/system/admin',
    method: 'post',
    data,
  })
}

export function updateSuperAdmin(data: SuperAdminForm) {
  return request<any, ApiResult<string>>({
    url: '/system/admin',
    method: 'put',
    data,
  })
}

export function deleteSuperAdmin(adminId: number) {
  return request<any, ApiResult<string>>({
    url: `/system/admin/${adminId}`,
    method: 'delete',
  })
}

export function resetSuperAdminPassword(adminId: number, password: string) {
  return request<any, ApiResult<string>>({
    url: `/system/admin/${adminId}/password`,
    method: 'put',
    data: { password },
  })
}
