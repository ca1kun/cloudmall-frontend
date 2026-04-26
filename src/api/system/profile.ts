import request from '@/utils/request'
import type { ApiResult } from '@/utils/request'
import type { PasswordUpdateForm, UserProfile } from '@/types/types'

export function getUserProfile() {
  return request.get<never, ApiResult<UserProfile>>('/system/user/profile')
}

// 修改资料
export function updateUserProfile(data: Partial<UserProfile>) {
  return request.put<Partial<UserProfile>, ApiResult<UserProfile>>('/system/user/profile', data)
}

// 修改密码
export function updateUserPwd(data: PasswordUpdateForm) {
  return request.put<PasswordUpdateForm, ApiResult<string>>('/system/user/profile/password', data)
}
