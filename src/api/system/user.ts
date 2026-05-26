import request from '@/utils/request'
import type { ApiResult } from '@/utils/request'
import type { AuthResult, LoginUser } from '@/types/types'

export function login(data: LoginUser) {
  return request.post<LoginUser, ApiResult<AuthResult>>('/user/login', data)
}

export function info() {
  return request.get<never, ApiResult<AuthResult>>('/user/info')
}
