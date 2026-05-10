<template>
  <div class="merchant-home page-shell">
    <el-card class="hero-card hero-surface" shadow="never">
      <div class="hero-copy">
        <p class="kicker">CloudMall Merchant</p>
        <h1>商家工作台</h1>
        <p>聚焦商品、订单与收款，用更少的视觉噪音把关键动作放前面。</p>
      </div>
    </el-card>

    <el-row :gutter="16" class="metric-row">
      <el-col :xs="24" :sm="12" :md="8">
        <el-card shadow="never" class="metric-card">
          <div class="metric-title">待处理订单</div>
          <div class="metric-value">12</div>
        </el-card>
      </el-col>
      <el-col :xs="24" :sm="12" :md="8">
        <el-card shadow="never" class="metric-card">
          <div class="metric-title">在售商品</div>
          <div class="metric-value">48</div>
        </el-card>
      </el-col>
      <el-col :xs="24" :sm="12" :md="8">
        <el-card shadow="never" class="metric-card">
          <div class="metric-title">今日收款</div>
          <div class="metric-value">¥8,420</div>
        </el-card>
      </el-col>
    </el-row>
  </div>
</template>

<style scoped>
.merchant-home {
  display: grid;
  gap: 16px;
}

.hero-card {
  padding: 2px;
}

.hero-copy h1 {
  margin: 8px 0 10px;
  color: var(--app-text);
  font-size: 28px;
  font-weight: 800;
}

.hero-copy p {
  margin: 0;
  color: var(--app-text-muted);
  line-height: 1.7;
}

.kicker {
  text-transform: uppercase;
  letter-spacing: 0.12em;
  font-size: 12px;
  color: var(--app-primary);
}

.metric-row {
  margin-top: 2px;
}

.metric-card {
  border-radius: 16px;
  border: 1px solid var(--app-border);
  box-shadow: var(--app-shadow-sm);
}

.metric-title {
  color: var(--app-text-muted);
  font-size: 14px;
}

.metric-value {
  margin-top: 10px;
  color: var(--app-text);
  font-size: 28px;
  font-weight: 700;
}
</style>
