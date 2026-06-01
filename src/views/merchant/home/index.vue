<template>
  <div class="merchant-home dashboard-shell">
    <el-card class="hero-card" shadow="never">
      <div class="hero-grid">
        <div class="hero-copy">
          <p class="kicker">CloudMall Merchant</p>
          <h1>商家大屏</h1>
          <p class="subtitle">总览今日运营表现，快速识别销售与订单走势。</p>
        </div>
        <div class="hero-time">
          <div class="time">{{ currentTime }}</div>
          <div class="date">{{ currentDate }}</div>
        </div>
      </div>
    </el-card>

    <div class="metric-grid">
      <el-card
        v-for="item in metrics"
        :key="item.key"
        shadow="never"
        class="metric-card"
        :class="`metric-${item.variant}`"
      >
        <div class="metric-header">
          <div class="metric-icon">
            <el-icon>
              <component :is="item.icon" />
            </el-icon>
          </div>
          <div class="metric-trend" :class="item.direction === 'up' ? 'trend-up' : 'trend-down'">
            <el-icon>
              <component :is="item.direction === 'up' ? Top : Bottom" />
            </el-icon>
            <span>{{ item.trend }}</span>
          </div>
        </div>
        <div class="metric-label">{{ item.label }}</div>
        <div class="metric-value">{{ item.value }}</div>
        <div class="metric-subtext">{{ item.subtext }}</div>
      </el-card>
    </div>

    <div class="content-grid">
      <el-card class="chart-card chart-card--trend" shadow="never">
        <template #header>
          <div class="card-header">
            <div>
              <h3>销售与订单趋势</h3>
              <p>近 7 日销售额、订单数与客单价走势</p>
            </div>
          </div>
        </template>
        <div ref="trendChartRef" class="chart chart--trend"></div>
      </el-card>

      <div class="side-grid">
        <el-card class="chart-card" shadow="never">
          <template #header>
            <div class="card-header">
              <div>
                <h3>品类占比</h3>
                <p>按订单量划分的品类结构</p>
              </div>
            </div>
          </template>
          <div ref="categoryChartRef" class="chart chart--donut"></div>
        </el-card>

        <el-card class="chart-card" shadow="never">
          <template #header>
            <div class="card-header">
              <div>
                <h3>渠道订单</h3>
                <p>本周各渠道订单量对比</p>
              </div>
            </div>
          </template>
          <div ref="channelChartRef" class="chart chart--bar"></div>
        </el-card>
      </div>
    </div>

    <div class="bottom-grid">
      <el-card class="table-card" shadow="never">
        <template #header>
          <div class="card-header">
            <div>
              <h3>热销商品排行</h3>
              <p>销量最高的商品与动销趋势</p>
            </div>
          </div>
        </template>
        <div class="table-wrapper">
          <el-table :data="topProducts" border>
            <el-table-column label="排名" width="70">
              <template #default="{ $index }">
                <span class="rank-index">{{ $index + 1 }}</span>
              </template>
            </el-table-column>
            <el-table-column prop="name" label="商品名称" min-width="180" />
            <el-table-column prop="count" label="销量" width="120" />
          </el-table>
        </div>
      </el-card>

      <el-card class="table-card" shadow="never">
        <template #header>
          <div class="card-header">
            <div>
              <h3>最新订单</h3>
              <p>最近 5 笔订单状态更新</p>
            </div>
          </div>
        </template>
        <div class="table-wrapper">
          <el-table :data="recentOrders" border>
            <el-table-column prop="orderNo" label="订单号" min-width="160" />
            <el-table-column prop="customer" label="客户" width="120" />
            <el-table-column prop="amount" label="金额" width="120" />
            <el-table-column label="状态" width="120">
              <template #default="{ row }">
                <el-tag :type="row.statusType">{{ row.status }}</el-tag>
              </template>
            </el-table-column>
          </el-table>
        </div>
      </el-card>
    </div>
  </div>
</template>

<script setup lang="ts">
import { Bottom, Top } from '@element-plus/icons-vue'
import { useDashboardScreen } from '@/composables/useDashboardScreen'

const {
  currentTime,
  currentDate,
  metrics,
  topProducts,
  recentOrders,
  trendChartRef,
  categoryChartRef,
  channelChartRef,
} = useDashboardScreen()
</script>

<style scoped>
.dashboard-shell {
  display: grid;
  gap: 16px;
}

.hero-card {
  border-radius: 18px;
  border: 1px solid var(--app-border);
  background: linear-gradient(135deg, rgba(15, 118, 110, 0.18), rgba(30, 64, 175, 0.18));
}

.hero-grid {
  display: flex;
  align-items: center;
  justify-content: space-between;
  flex-wrap: wrap;
  gap: 16px;
}

.hero-copy h1 {
  margin: 8px 0 10px;
  color: var(--app-text);
  font-size: 28px;
  font-weight: 800;
}

.subtitle {
  margin: 0;
  color: var(--app-text-muted);
  line-height: 1.6;
}

.kicker {
  text-transform: uppercase;
  letter-spacing: 0.12em;
  font-size: 12px;
  color: var(--app-primary);
}

.hero-time {
  text-align: right;
  min-width: 180px;
}

.hero-time .time {
  font-size: 28px;
  font-weight: 700;
  color: var(--app-text);
}

.hero-time .date {
  margin-top: 4px;
  font-size: 13px;
  color: var(--app-text-muted);
}

.metric-grid {
  display: grid;
  grid-template-columns: repeat(4, minmax(0, 1fr));
  gap: 16px;
}

.metric-card {
  border-radius: 16px;
  border: 1px solid var(--app-border);
  background: var(--app-surface);
}

.metric-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
}

.metric-icon {
  width: 38px;
  height: 38px;
  border-radius: 12px;
  display: flex;
  align-items: center;
  justify-content: center;
  color: #0f172a;
  background: rgba(148, 163, 184, 0.2);
}

.metric-trend {
  display: inline-flex;
  align-items: center;
  gap: 4px;
  font-size: 12px;
  font-weight: 600;
  padding: 4px 8px;
  border-radius: 999px;
  background: rgba(148, 163, 184, 0.12);
}

.trend-up {
  color: #16a34a;
}

.trend-down {
  color: #dc2626;
}

.metric-label {
  margin-top: 12px;
  color: var(--app-text-muted);
  font-size: 14px;
}

.metric-value {
  margin-top: 8px;
  color: var(--app-text);
  font-size: 26px;
  font-weight: 700;
}

.metric-subtext {
  margin-top: 6px;
  color: var(--app-text-muted);
  font-size: 12px;
}

.metric-blue .metric-icon {
  background: rgba(56, 189, 248, 0.2);
  color: #0ea5e9;
}

.metric-green .metric-icon {
  background: rgba(34, 197, 94, 0.2);
  color: #16a34a;
}

.metric-orange .metric-icon {
  background: rgba(249, 115, 22, 0.2);
  color: #ea580c;
}

.metric-purple .metric-icon {
  background: rgba(129, 140, 248, 0.2);
  color: #6366f1;
}

.content-grid {
  display: grid;
  grid-template-columns: minmax(0, 2fr) minmax(0, 1fr);
  gap: 16px;
}

.side-grid {
  display: grid;
  gap: 16px;
}

.chart-card {
  border-radius: 16px;
  border: 1px solid var(--app-border);
}

.chart {
  width: 100%;
  height: 240px;
}

.chart--trend {
  height: 320px;
}

.bottom-grid {
  display: grid;
  grid-template-columns: repeat(2, minmax(0, 1fr));
  gap: 16px;
}

.table-card {
  border-radius: 16px;
  border: 1px solid var(--app-border);
}

.table-wrapper {
  width: 100%;
}

.card-header h3 {
  margin: 0;
  font-size: 16px;
  color: var(--app-text);
}

.card-header p {
  margin: 6px 0 0;
  color: var(--app-text-muted);
  font-size: 12px;
}

.rank-index {
  font-weight: 700;
  color: var(--app-text);
}

@media (max-width: 1200px) {
  .metric-grid {
    grid-template-columns: repeat(2, minmax(0, 1fr));
  }

  .content-grid {
    grid-template-columns: 1fr;
  }
}

@media (max-width: 768px) {
  .metric-grid {
    grid-template-columns: 1fr;
  }

  .bottom-grid {
    grid-template-columns: 1fr;
  }

  .hero-time {
    text-align: left;
  }
}
</style>
