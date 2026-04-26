<template>
  <div class="dashboard-screen">
    <div class="dashboard-shell">
      <section class="hero-panel">
        <div class="hero-copy">
          <p class="hero-kicker">CloudMall · ECharts 数据大屏</p>
          <h1 class="hero-title">商城经营总览</h1>
          <p class="hero-desc">
            订单、销售、商品、用户和渠道表现统一汇总，支持实时轮询、趋势洞察和热销分析。
          </p>
        </div>
        <div class="hero-clock">
          <div class="clock-label">当前时间</div>
          <div class="clock-value">{{ currentTime }}</div>
          <div class="clock-meta">{{ currentDate }}</div>
        </div>
      </section>

      <section class="metric-grid">
        <el-card v-for="item in metrics" :key="item.key" class="metric-card" shadow="never">
          <div class="metric-top">
            <div>
              <div class="metric-label">{{ item.label }}</div>
              <div class="metric-value">{{ item.value }}</div>
            </div>
            <div class="metric-icon" :class="item.variant">
              <el-icon :size="20"><component :is="item.icon" /></el-icon>
            </div>
          </div>
          <div class="metric-bottom">
            <span :class="['metric-trend', item.direction]">
              {{ item.trend }}
              <el-icon><component :is="item.direction === 'up' ? Top : Bottom" /></el-icon>
            </span>
            <span class="metric-subtext">{{ item.subtext }}</span>
          </div>
        </el-card>
      </section>

      <section class="panel-grid panel-grid-main">
        <el-card class="panel-card chart-card large-card" shadow="never">
          <template #header>
            <div class="panel-header">
              <div>
                <div class="panel-title">近七日经营趋势</div>
                <div class="panel-desc">销售额、订单数、客单价走势</div>
              </div>
              <el-tag effect="dark" type="success">Live</el-tag>
            </div>
          </template>
          <div ref="trendChartRef" class="chart-box chart-large"></div>
        </el-card>

        <el-card class="panel-card side-card" shadow="never">
          <template #header>
            <div class="panel-header">
              <div>
                <div class="panel-title">热销商品 Top 6</div>
                <div class="panel-desc">按近七日销量排序</div>
              </div>
              <el-tag effect="dark" type="warning">Top</el-tag>
            </div>
          </template>
          <el-table :data="topProducts" class="rank-table" :show-header="false" size="small">
            <el-table-column label="排名" width="54" align="center">
              <template #default="scope">
                <span class="rank-badge" :class="{ hot: scope.$index < 3 }">{{ scope.$index + 1 }}</span>
              </template>
            </el-table-column>
            <el-table-column prop="name" label="商品" />
            <el-table-column prop="count" label="销量" width="64" align="right" />
          </el-table>
        </el-card>
      </section>

      <section class="panel-grid panel-grid-bottom">
        <el-card class="panel-card chart-card" shadow="never">
          <template #header>
            <div class="panel-header">
              <div>
                <div class="panel-title">品类销售占比</div>
                <div class="panel-desc">不同品类销售结构分布</div>
              </div>
              <el-tag effect="dark" type="info">Pie</el-tag>
            </div>
          </template>
          <div ref="categoryChartRef" class="chart-box chart-medium"></div>
        </el-card>

        <el-card class="panel-card chart-card" shadow="never">
          <template #header>
            <div class="panel-header">
              <div>
                <div class="panel-title">热销渠道表现</div>
                <div class="panel-desc">不同渠道成交订单分布</div>
              </div>
              <el-tag effect="dark" type="primary">Bar</el-tag>
            </div>
          </template>
          <div ref="channelChartRef" class="chart-box chart-medium"></div>
        </el-card>

        <el-card class="panel-card table-card" shadow="never">
          <template #header>
            <div class="panel-header">
              <div>
                <div class="panel-title">最新订单</div>
                <div class="panel-desc">实时刷新最近成交记录</div>
              </div>
              <el-tag effect="dark" type="danger">Now</el-tag>
            </div>
          </template>
          <el-table :data="recentOrders" class="order-table" size="small">
            <el-table-column prop="orderNo" label="订单号" min-width="130" />
            <el-table-column prop="customer" label="客户" min-width="88" />
            <el-table-column prop="amount" label="金额" width="92" align="right" />
            <el-table-column prop="status" label="状态" width="86" align="center">
              <template #default="scope">
                <el-tag :type="scope.row.statusType" effect="dark" size="small">{{ scope.row.status }}</el-tag>
              </template>
            </el-table-column>
          </el-table>
        </el-card>
      </section>
    </div>
  </div>
</template>

<script setup lang="ts">
import { computed, nextTick, onActivated, onMounted, onUnmounted, ref, type Component } from 'vue'
import * as echarts from 'echarts'
import { Top, Bottom, TrendCharts, ShoppingBag, UserFilled, GoodsFilled } from '@element-plus/icons-vue'

type MetricVariant = 'blue' | 'green' | 'orange' | 'purple'
type MetricDirection = 'up' | 'down'

interface MetricCard {
  key: string
  label: string
  value: string
  trend: string
  subtext: string
  direction: MetricDirection
  icon: Component
  variant: MetricVariant
}

interface ProductRank {
  name: string
  count: number
}

interface RecentOrder {
  orderNo: string
  customer: string
  amount: string
  status: string
  statusType: 'success' | 'warning' | 'info' | 'danger'
}

interface CategoryShare {
  name: string
  value: number
}

const currentTime = ref('')
const currentDate = ref('')
let timeTimer: number | undefined

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

const trendDays = ['周一', '周二', '周三', '周四', '周五', '周六', '周日']
const trendSales = [98, 132, 121, 156, 184, 210, 198]
const trendOrders = [62, 74, 58, 81, 92, 108, 96]
const trendAverage = [1590, 1780, 1710, 1835, 1890, 1945, 1908]

const trendChartRef = ref<HTMLElement | null>(null)
const categoryChartRef = ref<HTMLElement | null>(null)
const channelChartRef = ref<HTMLElement | null>(null)

let trendChart: echarts.ECharts | null = null
let categoryChart: echarts.ECharts | null = null
let channelChart: echarts.ECharts | null = null
let resizeHandler: (() => void) | undefined

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
</script>

<style scoped>
.dashboard-screen {
  min-height: 100%;
  padding: 0;
}

.dashboard-shell {
  position: relative;
  min-height: calc(100vh - 104px);
  padding: 18px;
  border-radius: 24px;
  overflow: hidden;
  background:
    radial-gradient(circle at top left, rgba(56, 189, 248, 0.22), transparent 30%),
    radial-gradient(circle at top right, rgba(34, 197, 94, 0.18), transparent 26%),
    linear-gradient(180deg, #0f172a 0%, #111827 42%, #0b1220 100%);
  box-shadow: 0 20px 50px rgba(15, 23, 42, 0.18);
}

.dashboard-shell::before,
.dashboard-shell::after {
  content: '';
  position: absolute;
  inset: 0;
  pointer-events: none;
}

.dashboard-shell::before {
  background-image: linear-gradient(rgba(255, 255, 255, 0.03) 1px, transparent 1px),
    linear-gradient(90deg, rgba(255, 255, 255, 0.03) 1px, transparent 1px);
  background-size: 24px 24px;
  mask-image: linear-gradient(180deg, rgba(0, 0, 0, 0.9), transparent 95%);
}

.hero-panel {
  position: relative;
  z-index: 1;
  display: flex;
  justify-content: space-between;
  gap: 18px;
  padding: 20px 22px;
  margin-bottom: 18px;
  border: 1px solid rgba(148, 163, 184, 0.18);
  border-radius: 20px;
  background: linear-gradient(135deg, rgba(15, 23, 42, 0.78), rgba(30, 41, 59, 0.62));
  backdrop-filter: blur(10px);
}

.hero-copy {
  flex: 1;
  min-width: 0;
}

.hero-kicker {
  margin: 0 0 8px;
  color: #7dd3fc;
  font-size: 13px;
  letter-spacing: 0.12em;
  text-transform: uppercase;
}

.hero-title {
  margin: 0;
  color: #f8fafc;
  font-size: 30px;
  font-weight: 800;
  letter-spacing: 0.03em;
}

.hero-desc {
  max-width: 760px;
  margin: 10px 0 0;
  color: #cbd5e1;
  line-height: 1.7;
}

.hero-clock {
  min-width: 220px;
  padding: 14px 16px;
  border-radius: 16px;
  border: 1px solid rgba(125, 211, 252, 0.18);
  background: rgba(15, 23, 42, 0.75);
  text-align: right;
}

.clock-label {
  color: #7dd3fc;
  font-size: 12px;
  letter-spacing: 0.08em;
}

.clock-value {
  margin-top: 6px;
  color: #f8fafc;
  font-size: 28px;
  font-weight: 700;
}

.clock-meta {
  margin-top: 4px;
  color: #94a3b8;
  font-size: 12px;
}

.metric-grid {
  position: relative;
  z-index: 1;
  display: grid;
  grid-template-columns: repeat(4, minmax(0, 1fr));
  gap: 14px;
  margin-bottom: 18px;
}

.metric-card {
  border: 1px solid rgba(148, 163, 184, 0.18);
  border-radius: 18px;
  background: linear-gradient(180deg, rgba(15, 23, 42, 0.9), rgba(17, 24, 39, 0.82));
  box-shadow: 0 12px 32px rgba(15, 23, 42, 0.18);
}

.metric-card :deep(.el-card__body),
.panel-card :deep(.el-card__body) {
  color: #e2e8f0;
}

.metric-top {
  display: flex;
  align-items: flex-start;
  justify-content: space-between;
  gap: 12px;
}

.metric-label {
  color: #94a3b8;
  font-size: 13px;
}

.metric-value {
  margin-top: 10px;
  color: #f8fafc;
  font-size: 28px;
  font-weight: 800;
  letter-spacing: 0.02em;
}

.metric-icon {
  display: grid;
  place-items: center;
  width: 46px;
  height: 46px;
  border-radius: 14px;
  color: #fff;
}

.metric-icon.blue {
  background: linear-gradient(135deg, #38bdf8, #2563eb);
}

.metric-icon.green {
  background: linear-gradient(135deg, #34d399, #059669);
}

.metric-icon.orange {
  background: linear-gradient(135deg, #fbbf24, #f97316);
}

.metric-icon.purple {
  background: linear-gradient(135deg, #c084fc, #7c3aed);
}

.metric-bottom {
  margin-top: 16px;
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 12px;
  font-size: 12px;
}

.metric-trend {
  display: inline-flex;
  align-items: center;
  gap: 4px;
  font-weight: 700;
}

.metric-trend.up {
  color: #34d399;
}

.metric-trend.down {
  color: #fca5a5;
}

.metric-subtext {
  color: #94a3b8;
}

.panel-grid {
  position: relative;
  z-index: 1;
  display: grid;
  gap: 14px;
}

.panel-grid-main {
  grid-template-columns: 2.1fr 1fr;
  margin-bottom: 14px;
}

.panel-grid-bottom {
  grid-template-columns: 1fr 1fr 1.2fr;
}

.panel-card {
  border: 1px solid rgba(148, 163, 184, 0.18);
  border-radius: 18px;
  background: linear-gradient(180deg, rgba(15, 23, 42, 0.84), rgba(15, 23, 42, 0.72));
  box-shadow: 0 12px 32px rgba(15, 23, 42, 0.16);
}

.panel-card :deep(.el-card__header) {
  border-bottom: 1px solid rgba(148, 163, 184, 0.16);
  background: rgba(15, 23, 42, 0.65);
}

.panel-header {
  display: flex;
  justify-content: space-between;
  align-items: flex-start;
  gap: 12px;
}

.panel-title {
  color: #f8fafc;
  font-size: 16px;
  font-weight: 700;
}

.panel-desc {
  margin-top: 4px;
  color: #94a3b8;
  font-size: 12px;
}

.chart-box {
  width: 100%;
}

.chart-large {
  height: 380px;
}

.chart-medium {
  height: 310px;
}

.large-card {
  min-width: 0;
}

.side-card,
.table-card {
  min-width: 0;
}

.rank-table,
.order-table {
  background: transparent;
}

.rank-table :deep(.el-table__inner-wrapper),
.order-table :deep(.el-table__inner-wrapper) {
  background: transparent;
}

.rank-table :deep(.el-table__header-wrapper th),
.order-table :deep(.el-table__header-wrapper th) {
  background: rgba(15, 23, 42, 0.85);
  color: #cbd5e1;
  border-bottom-color: rgba(148, 163, 184, 0.18);
}

.rank-table :deep(.el-table__body-wrapper td),
.order-table :deep(.el-table__body-wrapper td) {
  background: rgba(15, 23, 42, 0.55);
  color: #e2e8f0;
  border-bottom-color: rgba(148, 163, 184, 0.12);
}

.rank-table :deep(.el-table__body tr:hover > td),
.order-table :deep(.el-table__body tr:hover > td) {
  background: rgba(37, 99, 235, 0.12);
}

.rank-badge {
  display: inline-flex;
  width: 24px;
  height: 24px;
  border-radius: 999px;
  align-items: center;
  justify-content: center;
  background: rgba(59, 130, 246, 0.18);
  color: #93c5fd;
  font-size: 12px;
  font-weight: 700;
}

.rank-badge.hot {
  background: rgba(239, 68, 68, 0.2);
  color: #fca5a5;
}

@media (max-width: 1280px) {
  .metric-grid,
  .panel-grid-main,
  .panel-grid-bottom {
    grid-template-columns: 1fr 1fr;
  }

  .panel-grid-bottom > :last-child {
    grid-column: 1 / -1;
  }
}

@media (max-width: 960px) {
  .hero-panel {
    flex-direction: column;
  }

  .metric-grid,
  .panel-grid-main,
  .panel-grid-bottom {
    grid-template-columns: 1fr;
  }

  .dashboard-shell {
    padding: 14px;
  }
}
</style>
