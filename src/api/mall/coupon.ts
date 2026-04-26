import request, { type ApiResult } from '@/utils/request'
import type { Coupon, UserCouponRecord } from '@/types/types'

// 获取可领取列表
export const getCouponListApi = () => {
  return request.get<never, ApiResult<Coupon[]>>('/coupon/list')
}

// 领取优惠券 (秒杀)
export const receiveCouponApi = (couponId: number) => {
  return request.post<never, ApiResult<string>>(`/coupon/seckill/${couponId}`)
}

// 获取我已领取的优惠券ID列表
export const getMyCouponIdsApi = () => {
  return request.get<never, ApiResult<UserCouponRecord[]>>('/coupon/my/ids')
}
