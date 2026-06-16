<template>
  <div class="success-page">
    <el-card class="success-card" shadow="never">
      <div class="success-icon">
        <el-icon color="var(--app-success)" size="72"><SuccessFilled /></el-icon>
      </div>
      <h2>支付成功！</h2>
      <p>商家正在备货中，订单状态会及时更新。</p>
      <div class="action-row">
        <el-button type="primary" :icon="House" @click="$router.push('/mall/home')">返回商城</el-button>
        <el-button :icon="Tickets" @click="$router.push('/mall/order')">查看订单</el-button>
      </div>
    </el-card>
  </div>
</template>

<script setup lang="ts">
import { House, SuccessFilled, Tickets } from '@element-plus/icons-vue'
</script>

<style scoped>
.success-page {
  min-height: calc(100vh - 120px);
  display: flex;
  justify-content: center;
  align-items: flex-start;
  padding: 72px 20px;
  background:
    linear-gradient(180deg, rgba(103, 194, 58, 0.1), transparent 300px),
    var(--app-bg);
}

.success-card {
  width: min(520px, 100%);
  text-align: center;
  border: 1px solid var(--app-border);
  border-radius: 18px;
  background: var(--app-surface);
  box-shadow: var(--app-shadow-md);
}

.success-card :deep(.el-card__body) {
  padding: 42px 34px;
}

.success-icon {
  width: 104px;
  height: 104px;
  display: flex;
  align-items: center;
  justify-content: center;
  margin: 0 auto 18px;
  border-radius: 50%;
  background: rgba(103, 194, 58, 0.12);
}

h2 {
  margin: 0;
  color: var(--app-text);
  font-size: 26px;
  font-weight: 800;
}

p {
  margin: 12px 0 30px;
  color: var(--app-text-muted);
  font-size: 15px;
}

.action-row {
  display: flex;
  justify-content: center;
  gap: 12px;
}

.action-row :deep(.el-button) {
  min-width: 120px;
  border-radius: 12px;
  font-weight: 700;
}

@media (max-width: 520px) {
  .success-card :deep(.el-card__body) {
    padding: 34px 20px;
  }

  .action-row {
    flex-direction: column;
  }

  .action-row :deep(.el-button) {
    width: 100%;
    margin-left: 0;
  }
}
</style>
