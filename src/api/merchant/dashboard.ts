import request, { type ApiResult } from '@/utils/request'
import type {
  DashboardMetrics,
  DashboardTrend,
  DashboardCategoryShare,
  DashboardChannelOrders,
  DashboardTopProducts,
  DashboardRecentOrders,
  DashboardOverview,
} from '@/types/types'

// 核心指标
export function getDashboardMetricsApi() {
  return request.get<never, ApiResult<DashboardMetrics>>('/merchant/dashboard/metrics')
}

// 销售与订单趋势
export function getDashboardTrendApi(days?: number) {
  return request.get<never, ApiResult<DashboardTrend>>('/merchant/dashboard/trend', {
    params: days ? { days } : undefined,
  })
}

// 品类占比
export function getDashboardCategoryShareApi() {
  return request.get<never, ApiResult<DashboardCategoryShare>>('/merchant/dashboard/category-share')
}

// 渠道订单
export function getDashboardChannelOrdersApi(period?: string) {
  return request.get<never, ApiResult<DashboardChannelOrders>>('/merchant/dashboard/channel-orders', {
    params: period ? { period } : undefined,
  })
}

// 热销商品排行
export function getDashboardTopProductsApi(params?: { limit?: number; period?: string }) {
  return request.get<never, ApiResult<DashboardTopProducts>>('/merchant/dashboard/top-products', {
    params,
  })
}

// 最新订单
export function getDashboardRecentOrdersApi(limit?: number) {
  return request.get<never, ApiResult<DashboardRecentOrders>>('/merchant/dashboard/recent-orders', {
    params: limit ? { limit } : undefined,
  })
}

// 大屏聚合接口
export function getDashboardOverviewApi(params?: { trendDays?: number; topLimit?: number; recentLimit?: number }) {
  return request.get<never, ApiResult<DashboardOverview>>('/merchant/dashboard/overview', {
    params,
  })
}
