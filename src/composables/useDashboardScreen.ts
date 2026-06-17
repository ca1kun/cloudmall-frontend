import { computed, nextTick, onActivated, onMounted, onUnmounted, ref } from 'vue'
import * as echarts from 'echarts'
import { Bottom, GoodsFilled, ShoppingBag, Top, TrendCharts, UserFilled } from '@element-plus/icons-vue'
import { getDashboardOverviewApi } from '@/api/merchant/dashboard'
import type {
  MetricCard as ApiMetricCard,
  TopProductItem,
  RecentOrderItem,
  CategoryShareItem,
} from '@/types/types'

// ==================== 展示层类型（含图标/配色） ====================

export type MetricVariant = 'blue' | 'green' | 'orange' | 'purple'
export type MetricDirection = 'up' | 'down'

export interface MetricCard {
  key: string
  label: string
  value: string
  trend: string
  subtext: string
  direction: MetricDirection
  icon: any
  variant: MetricVariant
}

export interface ProductRank {
  name: string
  count: number
}

export interface RecentOrder {
  orderNo: string
  customer: string
  amount: string
  status: string
  statusType: 'success' | 'warning' | 'info' | 'danger'
}

// ==================== 指标卡片映射配置 ====================

const METRIC_CONFIG: { key: string; icon: any; variant: MetricVariant }[] = [
  { key: 'sales', icon: TrendCharts, variant: 'blue' },
  { key: 'orders', icon: ShoppingBag, variant: 'green' },
  { key: 'activeUsers', icon: UserFilled, variant: 'orange' },
  { key: 'goodsCount', icon: GoodsFilled, variant: 'purple' },
]

function mapMetricCard(key: string, raw: ApiMetricCard): MetricCard {
  const cfg = METRIC_CONFIG.find((c) => c.key === key)!
  return {
    key,
    label: raw.label,
    value: raw.valueText,
    trend: raw.trendText,
    subtext: raw.subtext,
    direction: raw.direction,
    icon: cfg.icon,
    variant: cfg.variant,
  }
}

// ==================== composable ====================

export function useDashboardScreen() {
  const currentTime = ref('')
  const currentDate = ref('')
  const loading = ref(false)

  const trendChartRef = ref<HTMLElement | null>(null)
  const categoryChartRef = ref<HTMLElement | null>(null)
  const channelChartRef = ref<HTMLElement | null>(null)

  // 响应式数据
  const metrics = ref<MetricCard[]>([])
  const topProducts = ref<ProductRank[]>([])
  const recentOrders = ref<RecentOrder[]>([])

  // 图表原始数据
  const trendData = ref({ days: [] as string[], sales: [] as number[], orders: [] as number[], averageOrderValue: [] as number[] })
  const categoryData = ref<CategoryShareItem[]>([])
  const channelData = ref({ channels: [] as string[], orders: [] as number[] })

  let timeTimer: number | undefined
  let trendChart: echarts.ECharts | null = null
  let categoryChart: echarts.ECharts | null = null
  let channelChart: echarts.ECharts | null = null
  let resizeHandler: (() => void) | undefined

  // --- 时钟 ---
  const updateClock = () => {
    const now = new Date()
    currentTime.value = now.toLocaleTimeString('zh-CN', { hour12: false })
    currentDate.value = now.toLocaleDateString('zh-CN', {
      year: 'numeric',
      month: '2-digit',
      day: '2-digit',
      weekday: 'long',
    })
  }

  // --- 数据加载 ---
  const fetchData = async () => {
    loading.value = true
    try {
      const res = await getDashboardOverviewApi({ trendDays: 7, topLimit: 10, recentLimit: 5 })
      const d = res.data

      // 指标卡片
      metrics.value = [
        mapMetricCard('sales', d.metrics.sales),
        mapMetricCard('orders', d.metrics.orders),
        mapMetricCard('activeUsers', d.metrics.activeUsers),
        mapMetricCard('goodsCount', d.metrics.goodsCount),
      ]

      // 趋势图
      trendData.value = d.trend

      // 品类占比
      categoryData.value = d.categoryShare.data

      // 渠道订单
      channelData.value = d.channelOrders

      // 热销商品
      topProducts.value = d.topProducts.list.map((item: TopProductItem) => ({
        name: item.name,
        count: item.count,
      }))

      // 最新订单
      recentOrders.value = d.recentOrders.list.map((item: RecentOrderItem) => ({
        orderNo: item.orderNo,
        customer: item.customer,
        amount: item.amountText,
        status: item.statusText,
        statusType: item.statusType,
      }))
    } catch (error) {
      console.error('获取大屏数据失败', error)
    } finally {
      loading.value = false
    }
  }

  // --- 图表配置 ---
  const trendOption = computed<echarts.EChartsOption>(() => ({
    tooltip: { trigger: 'axis' },
    legend: {
      top: 12,
      right: 16,
      textStyle: { color: '#cbd5e1' },
    },
    grid: { left: 18, right: 18, top: 56, bottom: 18, containLabel: true },
    xAxis: {
      type: 'category',
      boundaryGap: false,
      data: trendData.value.days,
      axisLine: { lineStyle: { color: 'rgba(148, 163, 184, 0.45)' } },
      axisLabel: { color: '#cbd5e1' },
    },
    yAxis: [
      {
        type: 'value',
        axisLabel: { color: '#cbd5e1' },
        splitLine: { lineStyle: { color: 'rgba(148, 163, 184, 0.18)' } },
      },
      {
        type: 'value',
        axisLabel: { color: '#cbd5e1' },
        splitLine: { show: false },
      },
    ],
    series: [
      {
        name: '销售额',
        type: 'line',
        smooth: true,
        data: trendData.value.sales,
        lineStyle: { width: 3, color: '#38bdf8' },
        itemStyle: { color: '#38bdf8' },
        symbolSize: 8,
        areaStyle: {
          color: new echarts.graphic.LinearGradient(0, 0, 0, 1, [
            { offset: 0, color: 'rgba(56, 189, 248, 0.45)' },
            { offset: 1, color: 'rgba(56, 189, 248, 0.02)' },
          ]),
        },
      },
      {
        name: '订单数',
        type: 'line',
        smooth: true,
        data: trendData.value.orders,
        yAxisIndex: 1,
        lineStyle: { width: 3, color: '#22c55e' },
        itemStyle: { color: '#22c55e' },
        symbolSize: 7,
      },
      {
        name: '客单价',
        type: 'line',
        smooth: true,
        data: trendData.value.averageOrderValue,
        yAxisIndex: 0,
        lineStyle: { width: 3, color: '#f59e0b', type: 'dashed' },
        itemStyle: { color: '#f59e0b' },
        symbolSize: 7,
      },
    ],
  }))

  const categoryOption = computed<echarts.EChartsOption>(() => ({
    tooltip: { trigger: 'item' },
    legend: {
      bottom: 8,
      textStyle: { color: '#cbd5e1' },
    },
    series: [
      {
        name: '品类占比',
        type: 'pie',
        radius: ['42%', '70%'],
        center: ['50%', '48%'],
        avoidLabelOverlap: true,
        itemStyle: {
          borderRadius: 10,
          borderColor: '#0b1220',
          borderWidth: 2,
        },
        label: {
          color: '#e2e8f0',
          formatter: '{b}\n{d}%',
        },
        labelLine: { lineStyle: { color: '#64748b' } },
        data: categoryData.value,
      },
    ],
  }))

  const channelOption = computed<echarts.EChartsOption>(() => ({
    tooltip: { trigger: 'axis' },
    grid: { left: 18, right: 18, top: 24, bottom: 24, containLabel: true },
    xAxis: {
      type: 'value',
      axisLabel: { color: '#cbd5e1' },
      splitLine: { lineStyle: { color: 'rgba(148, 163, 184, 0.18)' } },
    },
    yAxis: {
      type: 'category',
      data: channelData.value.channels,
      axisLabel: { color: '#cbd5e1' },
    },
    series: [
      {
        name: '订单量',
        type: 'bar',
        barWidth: 18,
        data: channelData.value.orders,
        itemStyle: {
          borderRadius: [0, 8, 8, 0],
          color: new echarts.graphic.LinearGradient(1, 0, 0, 0, [
            { offset: 0, color: '#60a5fa' },
            { offset: 1, color: '#2563eb' },
          ]),
        },
      },
    ],
  }))

  // --- 图表初始化/更新 ---
  const initCharts = () => {
    if (trendChartRef.value) {
      trendChart?.dispose()
      trendChart = echarts.init(trendChartRef.value)
      trendChart.setOption(trendOption.value)
    }

    if (categoryChartRef.value) {
      categoryChart?.dispose()
      categoryChart = echarts.init(categoryChartRef.value)
      categoryChart.setOption(categoryOption.value)
    }

    if (channelChartRef.value) {
      channelChart?.dispose()
      channelChart = echarts.init(channelChartRef.value)
      channelChart.setOption(channelOption.value)
    }
  }

  const updateCharts = () => {
    if (trendChart) trendChart.setOption(trendOption.value)
    if (categoryChart) categoryChart.setOption(categoryOption.value)
    if (channelChart) channelChart.setOption(channelOption.value)
  }

  const handleResize = () => {
    trendChart?.resize()
    categoryChart?.resize()
    channelChart?.resize()
  }

  const startClock = () => {
    updateClock()
    timeTimer = window.setInterval(updateClock, 1000)
  }

  onMounted(async () => {
    startClock()
    await fetchData()
    await nextTick()
    initCharts()
    resizeHandler = () => handleResize()
    window.addEventListener('resize', resizeHandler)
  })

  onActivated(() => {
    nextTick(() => {
      handleResize()
    })
  })

  onUnmounted(() => {
    if (timeTimer) {
      window.clearInterval(timeTimer)
    }
    if (resizeHandler) {
      window.removeEventListener('resize', resizeHandler)
    }
    trendChart?.dispose()
    categoryChart?.dispose()
    channelChart?.dispose()
    trendChart = null
    categoryChart = null
    channelChart = null
  })

  return {
    currentTime,
    currentDate,
    loading,
    metrics,
    topProducts,
    recentOrders,
    trendChartRef,
    categoryChartRef,
    channelChartRef,
  }
}
