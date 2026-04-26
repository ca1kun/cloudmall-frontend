import { computed, nextTick, onActivated, onMounted, onUnmounted, ref, type Component } from 'vue'
import * as echarts from 'echarts'
import { Bottom, GoodsFilled, ShoppingBag, Top, TrendCharts, UserFilled } from '@element-plus/icons-vue'

export type MetricVariant = 'blue' | 'green' | 'orange' | 'purple'
export type MetricDirection = 'up' | 'down'

export interface MetricCard {
  key: string
  label: string
  value: string
  trend: string
  subtext: string
  direction: MetricDirection
  icon: Component
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

export interface CategoryShare {
  name: string
  value: number
}

const trendDays = ['周一', '周二', '周三', '周四', '周五', '周六', '周日']
const trendSales = [98, 132, 121, 156, 184, 210, 198]
const trendOrders = [62, 74, 58, 81, 92, 108, 96]
const trendAverage = [1590, 1780, 1710, 1835, 1890, 1945, 1908]

const metrics: MetricCard[] = [
  {
    key: 'sales',
    label: '总销售额',
    value: '¥ 1,286,560',
    trend: '+18.4%',
    subtext: '较上周提升 18.4%',
    direction: 'up',
    icon: TrendCharts,
    variant: 'blue',
  },
  {
    key: 'orders',
    label: '今日订单',
    value: '358',
    trend: '+12.8%',
    subtext: '今日实时成交 358 单',
    direction: 'up',
    icon: ShoppingBag,
    variant: 'green',
  },
  {
    key: 'users',
    label: '活跃用户',
    value: '8,920',
    trend: '+6.2%',
    subtext: '近 24h 访问持续增长',
    direction: 'up',
    icon: UserFilled,
    variant: 'orange',
  },
  {
    key: 'goods',
    label: '在售商品',
    value: '1,284',
    trend: '-1.3%',
    subtext: '库存结构保持稳定',
    direction: 'down',
    icon: GoodsFilled,
    variant: 'purple',
  },
]

const topProducts: ProductRank[] = [
  { name: '小米 14 Pro', count: 1260 },
  { name: 'iPhone 15 Pro Max', count: 1098 },
  { name: '华为 Mate 60 Pro', count: 934 },
  { name: '罗技 MX Master 3S', count: 821 },
  { name: '三只松鼠 坚果礼盒', count: 612 },
  { name: '维达 抽纸 4 层', count: 524 },
]

const recentOrders: RecentOrder[] = [
  { orderNo: 'OD202604260001', customer: '张先生', amount: '¥ 1,299', status: '已支付', statusType: 'success' },
  { orderNo: 'OD202604260002', customer: '李女士', amount: '¥ 2,899', status: '待发货', statusType: 'warning' },
  { orderNo: 'OD202604260003', customer: '王同学', amount: '¥ 899', status: '配送中', statusType: 'info' },
  { orderNo: 'OD202604260004', customer: '陈女士', amount: '¥ 4,199', status: '已完成', statusType: 'success' },
  { orderNo: 'OD202604260005', customer: '刘先生', amount: '¥ 499', status: '已取消', statusType: 'danger' },
]

const categoryStats: CategoryShare[] = [
  { name: '手机数码', value: 38 },
  { name: '电脑办公', value: 22 },
  { name: '日用百货', value: 18 },
  { name: '食品饮料', value: 14 },
  { name: '其他', value: 8 },
]

export function useDashboardScreen() {
  const currentTime = ref('')
  const currentDate = ref('')
  const trendChartRef = ref<HTMLElement | null>(null)
  const categoryChartRef = ref<HTMLElement | null>(null)
  const channelChartRef = ref<HTMLElement | null>(null)

  let timeTimer: number | undefined
  let trendChart: echarts.ECharts | null = null
  let categoryChart: echarts.ECharts | null = null
  let channelChart: echarts.ECharts | null = null
  let resizeHandler: (() => void) | undefined

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
      data: trendDays,
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
        data: trendSales,
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
        data: trendOrders,
        yAxisIndex: 1,
        lineStyle: { width: 3, color: '#22c55e' },
        itemStyle: { color: '#22c55e' },
        symbolSize: 7,
      },
      {
        name: '客单价',
        type: 'line',
        smooth: true,
        data: trendAverage,
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
        data: categoryStats,
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
      data: ['小程序', 'APP', 'PC端', '门店', '抖音'],
      axisLabel: { color: '#cbd5e1' },
    },
    series: [
      {
        name: '订单量',
        type: 'bar',
        barWidth: 18,
        data: [320, 268, 214, 180, 132],
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
    metrics,
    topProducts,
    recentOrders,
    trendChartRef,
    categoryChartRef,
    channelChartRef,
  }
}
