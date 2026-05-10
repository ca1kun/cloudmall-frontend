<template>
  <div class="dashboard-screen">
    <div class="dashboard-shell">
      <section class="hero-panel">
        <div class="hero-copy">
          <p class="hero-kicker">CloudMall · Overview</p>
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
              <el-tag effect="plain" type="success">Live</el-tag>
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
              <el-tag effect="plain" type="warning">Top</el-tag>
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
              <el-tag effect="plain" type="info">Pie</el-tag>
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
              <el-tag effect="plain" type="primary">Bar</el-tag>
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
              <el-tag effect="plain" type="danger">Now</el-tag>
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
import { Bottom, Top } from '@element-plus/icons-vue'
import { useDashboardScreen } from '@/composables/useDashboardScreen'

const { currentTime, currentDate, metrics, topProducts, recentOrders, trendChartRef, categoryChartRef, channelChartRef } = useDashboardScreen()
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
    radial-gradient(circle at top left, rgba(37, 99, 235, 0.08), transparent 26%),
    radial-gradient(circle at top right, rgba(16, 185, 129, 0.06), transparent 22%),
    linear-gradient(180deg, #ffffff 0%, #f7f9fc 100%);
  box-shadow: var(--app-shadow-md);
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
    linear-gradient(90deg, rgba(37, 99, 235, 0.04) 1px, transparent 1px);
  background-size: 24px 24px;
  mask-image: linear-gradient(180deg, rgba(0, 0, 0, 0.82), transparent 96%);
}

.hero-panel {
  position: relative;
  z-index: 1;
  display: flex;
  justify-content: space-between;
  gap: 18px;
  padding: 20px 22px;
  margin-bottom: 18px;
  border: 1px solid var(--app-border);
  border-radius: 20px;
  background: linear-gradient(135deg, #ffffff 0%, #f8fbff 100%);
  backdrop-filter: blur(8px);
}

.hero-copy {
  flex: 1;
  min-width: 0;
}

.hero-kicker {
  margin: 0 0 8px;
  color: var(--app-primary);
  font-size: 13px;
  letter-spacing: 0.12em;
  text-transform: uppercase;
}

.hero-title {
  margin: 0;
  color: var(--app-text);
  font-size: 30px;
  font-weight: 800;
  letter-spacing: 0.03em;
}

.hero-desc {
  max-width: 760px;
  margin: 10px 0 0;
  color: var(--app-text-muted);
  line-height: 1.7;
}

.hero-clock {
  min-width: 220px;
  padding: 14px 16px;
  border-radius: 16px;
  border: 1px solid var(--app-border);
  background: #ffffff;
  text-align: right;
}

.clock-label {
  color: var(--app-primary);
  font-size: 12px;
  letter-spacing: 0.08em;
}

.clock-value {
  margin-top: 6px;
  color: var(--app-text);
  font-size: 28px;
  font-weight: 700;
}

.clock-meta {
  margin-top: 4px;
  color: var(--app-text-muted);
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
  border: 1px solid var(--app-border);
  border-radius: 18px;
  background: #ffffff;
  box-shadow: var(--app-shadow-sm);
}

.metric-card :deep(.el-card__body),
.panel-card :deep(.el-card__body) {
  color: var(--app-text);
}

.metric-top {
  display: flex;
  align-items: flex-start;
  justify-content: space-between;
  gap: 12px;
}

.metric-label {
  color: var(--app-text-muted);
  font-size: 13px;
}

.metric-value {
  margin-top: 10px;
  color: var(--app-text);
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
  background: linear-gradient(135deg, #93c5fd, #2563eb);
}

.metric-icon.green {
  background: linear-gradient(135deg, #86efac, #059669);
}

.metric-icon.orange {
  background: linear-gradient(135deg, #fde68a, #f97316);
}

.metric-icon.purple {
  background: linear-gradient(135deg, #ddd6fe, #7c3aed);
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
  color: var(--app-success);
}

.metric-trend.down {
  color: var(--app-danger);
}

.metric-subtext {
  color: var(--app-text-muted);
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
  border: 1px solid var(--app-border);
  border-radius: 18px;
  background: #ffffff;
  box-shadow: var(--app-shadow-sm);
}

.panel-card :deep(.el-card__header) {
  border-bottom: 1px solid var(--app-border);
  background: #ffffff;
}

.panel-header {
  display: flex;
  justify-content: space-between;
  align-items: flex-start;
  gap: 12px;
}

.panel-title {
  color: var(--app-text);
  font-size: 16px;
  font-weight: 700;
}

.panel-desc {
  margin-top: 4px;
  color: var(--app-text-muted);
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
  background: #f8fafc;
  color: var(--app-text);
  border-bottom-color: var(--app-border);
}

.rank-table :deep(.el-table__body-wrapper td),
.order-table :deep(.el-table__body-wrapper td) {
  background: #ffffff;
  color: var(--app-text);
  border-bottom-color: rgba(229, 234, 242, 0.85);
}

.rank-table :deep(.el-table__body tr:hover > td),
.order-table :deep(.el-table__body tr:hover > td) {
  background: #f4f8ff;
}

.rank-badge {
  display: inline-flex;
  width: 24px;
  height: 24px;
  border-radius: 999px;
  align-items: center;
  justify-content: center;
  background: var(--app-primary-soft);
  color: var(--app-primary);
  font-size: 12px;
  font-weight: 700;
}

.rank-badge.hot {
  background: #fff1f2;
  color: var(--app-danger);
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
