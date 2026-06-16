import request, { type ApiResult } from '@/utils/request'
import type { Coupon, CouponForm, CouponQueryParams, PageResult } from '@/types/types'

// 分页查询优惠券列表 (管理员用)
export const getCouponPageApi = (params: CouponQueryParams) => {
  return request.get<never, ApiResult<PageResult<Coupon>>>('/coupon/page', { params })
}

// 新增优惠券
export const addCouponApi = (data: CouponForm) => {
  return request.post<CouponForm, ApiResult<string>>('/coupon/add', data)
}

// 预热优惠券
export const preheatCouponApi = (id: number) => {
  return request.post<never, ApiResult<string>>(`/coupon/preheat/${id}`)
}

// 删除优惠券
export const deleteCouponApi = (id: number) => {
  return request.delete<never, ApiResult<string>>(`/coupon/delete/${id}`)
}
