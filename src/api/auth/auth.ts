import request, { type ApiResult } from '@/utils/request'
import type { AuthResult, LoginDTO } from '@/types/types'

export type { LoginDTO } from '@/types/types'

// 发送验证码
export function sendCodeApi(phone: string) {
  return request.post<{ phone: string }, ApiResult<string>>('/auth/code', { phone })
}

export function loginApi(data: LoginDTO) {
  return request.post<LoginDTO, ApiResult<AuthResult>>('/auth/login', data)
}

/**
 * 退出登录
 */
export function logoutApi() {
  return request.post<never, ApiResult<string>>('/auth/logout')
}
