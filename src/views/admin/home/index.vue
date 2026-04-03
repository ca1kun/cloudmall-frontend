<template>
  <div class="dashboard-container">
    <el-row :gutter="16" class="stats-row">
      <el-col :xs="24" :sm="12" :lg="6" v-for="item in cards" :key="item.title">
        <el-card shadow="hover" class="data-card">
          <div class="card-header">
            <span class="card-title">{{ item.title }}</span>
            <el-tag :type="item.type" effect="plain" class="card-tag">{{ item.tag }}</el-tag>
          </div>
          <div class="card-num">{{ item.num }}</div>
          <div class="card-footer">
            <span>较昨日</span>
            <span :class="item.up ? 'up' : 'down'">
              {{ item.rate }}% <el-icon><component :is="item.up ? Top : Bottom" /></el-icon>
            </span>
          </div>
        </el-card>
      </el-col>
    </el-row>

    <el-row :gutter="16" class="panel-row">
      <el-col :xs="24" :lg="16">
        <el-card class="panel-card" shadow="never">
          <template #header>
            <div class="panel-header">
              <span class="panel-title">近七日销售趋势</span>
              <span class="panel-desc">销售额与订单量走势</span>
            </div>
          </template>
          <div ref="chartRef" class="chart-area"></div>
        </el-card>
      </el-col>

      <el-col :xs="24" :lg="8">
        <el-card class="panel-card" shadow="never">
          <template #header>
            <div class="panel-header">
              <span class="panel-title">热销商品 Top 5</span>
              <span class="panel-desc">按近七日销量排序</span>
            </div>
          </template>
          <el-table :data="rankList" style="width: 100%" :show-header="false" class="rank-table">
            <el-table-column label="排名" width="56">
              <template #default="scope">
                <span class="rank-badge" :class="{ hot: scope.$index < 3 }">{{ scope.$index + 1 }}</span>
              </template>
            </el-table-column>
            <el-table-column prop="name" label="商品" />
            <el-table-column prop="count" label="销量" width="80" align="right" />
          </el-table>
        </el-card>
      </el-col>
    </el-row>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted, onUnmounted } from 'vue'
import * as echarts from 'echarts'
import { Top, Bottom } from '@element-plus/icons-vue'

// 1. 卡片数据 (Mock)
const cards = [
  { title: '总销售额', num: '¥ 126,560', tag: '月', type: 'primary', rate: 12.5, up: true },
  { title: '今日订单', num: '35', tag: '日', type: 'success', rate: 8.2, up: true },
  { title: '商品总数', num: '120', tag: '全', type: 'warning', rate: 0.0, up: true },
  { title: '注册用户', num: '58', tag: '人', type: 'danger', rate: 2.1, up: false },
]

// 2. 排行榜数据 (Mock)
const rankList = [
  { name: '小米14 Pro 钛金属版', count: 120 },
  { name: 'iPhone 15 Pro Max', count: 85 },
  { name: '三只松鼠 每日坚果', count: 76 },
  { name: '维达 抽纸 4层', count: 60 },
  { name: '罗技 MX Master 3S', count: 45 },
]

const chartRef = ref<HTMLElement | null>(null)
let myChart: echarts.ECharts | null = null

const initChart = () => {
  if (!chartRef.value) return

  if (myChart) {
    myChart.dispose()
    myChart = null
  }

  myChart = echarts.init(chartRef.value)

  const option = {
    tooltip: { trigger: 'axis' },
    legend: { top: 10, right: 20 },
    grid: { left: '3%', right: '4%', bottom: '4%', containLabel: true },
    xAxis: {
      type: 'category',
      boundaryGap: false,
      data: ['周一', '周二', '周三', '周四', '周五', '周六', '周日'],
      axisLine: { lineStyle: { color: '#d9e1ec' } },
      axisLabel: { color: '#64748b' }
    },
    yAxis: {
      type: 'value',
      splitLine: { lineStyle: { color: '#edf2f7' } },
      axisLabel: { color: '#64748b' }
    },
    series: [
      {
        name: '销售额',
        type: 'line',
        smooth: true,
        data: [820, 932, 901, 934, 1290, 1330, 1320],
        areaStyle: {
          color: new echarts.graphic.LinearGradient(0, 0, 0, 1, [
            { offset: 0, color: 'rgba(37, 99, 235, 0.36)' },
            { offset: 1, color: 'rgba(37, 99, 235, 0.03)' }
          ])
        },
        itemStyle: { color: '#2563eb' },
        lineStyle: { width: 3 }
      },
      {
        name: '订单量',
        type: 'line',
        smooth: true,
        data: [20, 32, 21, 34, 90, 30, 20],
        itemStyle: { color: '#16a34a' },
        lineStyle: { width: 3 }
      }
    ]
  }

  myChart.setOption(option)
}

const handleResize = () => {
  myChart?.resize()
}

onMounted(() => {
  initChart()
  window.addEventListener('resize', handleResize)
})

onUnmounted(() => {
  window.removeEventListener('resize', handleResize)
  if (myChart) {
    myChart.dispose()
    myChart = null
  }
})
</script>

<style scoped>
.dashboard-container {
  padding: 2px;
}

.stats-row {
  margin-bottom: 16px;
}

.panel-row {
  margin-top: 0;
}

.data-card {
  border: 1px solid #e9edf4;
  border-radius: 14px;
  box-shadow: 0 8px 24px rgba(19, 37, 70, 0.05);
}

.data-card :deep(.el-card__body) {
  min-height: 150px;
  display: flex;
  flex-direction: column;
  justify-content: space-between;
}

.card-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.card-title {
  color: #64748b;
  font-size: 13px;
}

.card-tag {
  border-radius: 999px;
}

.card-num {
  font-size: 30px;
  font-weight: 700;
  color: #1f2937;
  letter-spacing: 0.5px;
}

.card-footer {
  font-size: 13px;
  color: #64748b;
  display: flex;
  align-items: center;
}

.up,
.down {
  margin-left: 6px;
  display: inline-flex;
  align-items: center;
  gap: 4px;
  font-weight: 600;
}

.up {
  color: #dc2626;
}

.down {
  color: #16a34a;
}

.panel-card {
  border: 1px solid #e9edf4;
  border-radius: 14px;
  box-shadow: 0 8px 24px rgba(19, 37, 70, 0.05);
}

.panel-card :deep(.el-card__header) {
  border-bottom: 1px solid #eef2f8;
  padding: 14px 18px;
}

.panel-card :deep(.el-card__body) {
  padding: 12px 18px 18px;
}

.panel-header {
  display: flex;
  justify-content: space-between;
  align-items: baseline;
}

.panel-title {
  color: #1f2937;
  font-size: 16px;
  font-weight: 600;
}

.panel-desc {
  color: #94a3b8;
  font-size: 12px;
}

.chart-area {
  height: 350px;
}

.rank-badge {
  display: inline-flex;
  width: 24px;
  height: 24px;
  border-radius: 50%;
  align-items: center;
  justify-content: center;
  background: #eef2ff;
  color: #4f46e5;
  font-size: 12px;
  font-weight: 600;
}

.rank-badge.hot {
  background: #fee2e2;
  color: #dc2626;
}

.rank-table :deep(.el-table__row td) {
  padding: 8px 0;
}
</style>
