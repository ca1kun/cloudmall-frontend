<template>
  <div class="login-container">
    <div class="login-box">
      <!-- 头部 Logo 或 标题区 -->
      <div class="login-header">
        <div class="logo-circle">
          <el-icon :size="30" color="#fff"><Shop /></el-icon>
        </div>
        <h2 class="title">SCAU 商城系统</h2>
        <p class="subtitle">微服务分布式电商平台</p>
      </div>

      <el-tabs v-model="activeTab" class="login-tabs" stretch>
        <!-- 验证码登录 -->
        <el-tab-pane label="验证码登录" name="sms">
          <el-form ref="smsFormRef" :model="smsForm" :rules="smsRules" class="login-form">
            <el-form-item prop="phone">
              <el-input
                v-model="smsForm.phone"
                placeholder="请输入手机号"
                prefix-icon="Iphone"
                size="large"
                @keyup.enter="handleLogin"
              />
            </el-form-item>
            <el-form-item prop="code">
              <div class="code-wrapper">
                <el-input
                  v-model="smsForm.code"
                  placeholder="验证码"
                  prefix-icon="Message"
                  size="large"
                  @keyup.enter="handleLogin"
                />
                <el-button
                  type="primary"
                  :disabled="isCounting"
                  class="code-btn"
                  @click="handleSendCode"
                >
                  {{ isCounting ? `${count}s` : '获取验证码' }}
                </el-button>
              </div>
            </el-form-item>
          </el-form>
        </el-tab-pane>

        <!-- 密码登录 -->
        <el-tab-pane label="密码登录" name="account">
          <el-form ref="accountFormRef" :model="accountForm" :rules="accountRules" class="login-form">
            <el-form-item prop="username">
              <el-input
                v-model="accountForm.username"
                placeholder="用户名/手机号"
                prefix-icon="User"
                size="large"
                @keyup.enter="handleLogin"
              />
            </el-form-item>
            <el-form-item prop="password">
              <el-input
                v-model="accountForm.password"
                type="password"
                placeholder="请输入密码"
                prefix-icon="Lock"
                show-password
                size="large"
                @keyup.enter="handleLogin"
              />
            </el-form-item>
          </el-form>
        </el-tab-pane>
      </el-tabs>

      <el-button
        type="primary"
        class="login-btn"
        size="large"
        :loading="loading"
        @click="handleLogin"
      >
        {{ activeTab === 'sms' ? '登录 / 自动注册' : '登 录' }}
      </el-button>

      <div class="login-footer">
        <el-divider>
          <span class="footer-text">SCAU MIS v1.0</span>
        </el-divider>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, reactive } from 'vue'
import { useRouter } from 'vue-router'
import { useUserStore } from '@/stores/user'
import { sendCodeApi } from '@/api/auth/auth'
import { ElMessage } from 'element-plus'
import { User, Lock, Iphone, Message, Shop } from '@element-plus/icons-vue'
import { getRoleHomePath } from '@/utils/role'

const router = useRouter()
const userStore = useUserStore()

const activeTab = ref('sms')
const loading = ref(false)

// --- 倒计时逻辑 ---
const isCounting = ref(false)
const count = ref(60)
let timer: any = null

const smsForm = reactive({ phone: '', code: '' })
const accountForm = reactive({ username: '', password: '' })
const smsFormRef = ref()
const accountFormRef = ref()

const smsRules = {
  phone: [
    { required: true, message: '请输入手机号', trigger: 'blur' },
    { pattern: /^1[3-9]\d{9}$/, message: '手机号格式不对', trigger: 'blur' }
  ],
  code: [{ required: true, message: '请输入验证码', trigger: 'blur' }]
}
const accountRules = {
  username: [{ required: true, message: '请输入账号', trigger: 'blur' }],
  password: [{ required: true, message: '请输入密码', trigger: 'blur' }]
}

const handleSendCode = async () => {
  smsFormRef.value.validateField('phone', async (valid: boolean) => {
    if (valid) {
      try {
        await sendCodeApi(smsForm.phone)
        ElMessage.success('验证码已发送，请查看控制台')
        isCounting.value = true
        count.value = 60
        timer = setInterval(() => {
          count.value--
          if (count.value <= 0) {
            clearInterval(timer)
            isCounting.value = false
          }
        }, 1000)
      } catch (error) {}
    }
  })
}

const handleLogin = async () => {
  const isSms = activeTab.value === 'sms'
  const formRef = isSms ? smsFormRef.value : accountFormRef.value
  if (!formRef) return

  await formRef.validate(async (valid: boolean) => {
    if (valid) {
      loading.value = true
      try {
        const loginData = {
          loginType: isSms ? ('sms' as const) : ('account' as const),
          ...(isSms ? smsForm : accountForm)
        }
        await userStore.login(loginData)
        ElMessage.success('登录成功')
        router.push(getRoleHomePath(userStore.role))
      } finally {
        loading.value = false
      }
    }
  })
}
</script>

<style scoped>
.login-container {
  height: 100vh;
  display: flex;
  justify-content: center;
  align-items: center;
  background:
    radial-gradient(1200px 800px at 10% 10%, rgba(37, 99, 235, 0.16), transparent 55%),
    radial-gradient(900px 700px at 90% 20%, rgba(14, 165, 233, 0.14), transparent 52%),
    linear-gradient(180deg, #f8fafc 0%, #eef2f7 100%);
  position: relative;
  overflow: hidden;
}

/* 装饰性的小圆球，增加页面丰富度 */
.login-container::before {
  content: "";
  position: absolute;
  width: 420px;
  height: 420px;
  background: radial-gradient(circle, rgba(37, 99, 235, 0.18), transparent 70%);
  border-radius: 50%;
  top: -140px;
  right: -140px;
  filter: blur(2px);
  animation: float-orb-1 10s ease-in-out infinite;
}

.login-container::after {
  content: "";
  position: absolute;
  width: 360px;
  height: 360px;
  background: radial-gradient(circle, rgba(14, 165, 233, 0.18), transparent 72%);
  border-radius: 50%;
  bottom: -140px;
  left: -120px;
  filter: blur(4px);
  animation: float-orb-2 12s ease-in-out infinite;
}

.login-box {
  width: 420px;
  padding: 40px;
  background: rgba(255, 255, 255, 0.86);
  border: 1px solid rgba(229, 234, 242, 0.9);
  border-radius: 24px;
  box-shadow: 0 30px 90px rgba(15, 23, 42, 0.16);
  backdrop-filter: blur(18px);
  z-index: 10;
  position: relative;
  overflow: hidden;
  animation: card-rise 800ms ease-out;
}

.login-box::before {
  content: "";
  position: absolute;
  inset: 0;
  border-radius: 24px;
  padding: 1px;
  background: linear-gradient(135deg, rgba(37, 99, 235, 0.35), rgba(14, 165, 233, 0.2), rgba(59, 130, 246, 0.35));
  -webkit-mask: linear-gradient(#fff 0 0) content-box, linear-gradient(#fff 0 0);
  -webkit-mask-composite: xor;
  mask-composite: exclude;
  pointer-events: none;
  opacity: 0.7;
  animation: border-glow 6s linear infinite;
}

.login-box::after {
  content: "";
  position: absolute;
  top: -120px;
  left: -120px;
  width: 240px;
  height: 240px;
  background: radial-gradient(circle, rgba(255, 255, 255, 0.8), transparent 70%);
  filter: blur(6px);
  opacity: 0.7;
  animation: light-sweep 9s ease-in-out infinite;
}

.login-header {
  text-align: center;
  margin-bottom: 30px;
}

.logo-circle {
  width: 60px;
  height: 60px;
  background: linear-gradient(135deg, #60a5fa, #2563eb);
  border-radius: 50%;
  display: flex;
  justify-content: center;
  align-items: center;
  margin: 0 auto 15px;
  box-shadow: 0 14px 30px rgba(37, 99, 235, 0.28);
  animation: logo-float 4s ease-in-out infinite;
}

.title {
  font-size: 26px;
  color: var(--app-text);
  font-weight: 700;
  margin: 0;
}

.subtitle {
  font-size: 14px;
  color: var(--app-text-muted);
  margin-top: 8px;
}

.login-tabs {
  margin-bottom: 20px;
}

/* 覆盖 tabs 底部横线样式 */
:deep(.el-tabs__nav-wrap::after) {
  height: 1px;
  background-color: var(--app-border);
}

.code-wrapper {
  display: flex;
  gap: 12px;
  width: 100%;
}

.code-btn {
  width: 120px;
}

.login-btn {
  width: 100%;
  height: 48px;
  font-size: 16px;
  font-weight: 600;
  border-radius: 8px;
  margin-top: 10px;
  letter-spacing: 1px;
  box-shadow: 0 14px 34px rgba(37, 99, 235, 0.26);
  position: relative;
  overflow: hidden;
}

.login-btn::after {
  content: "";
  position: absolute;
  inset: 0;
  background: linear-gradient(120deg, transparent 0%, rgba(255, 255, 255, 0.45) 45%, transparent 90%);
  transform: translateX(-120%);
  animation: btn-shimmer 3.2s ease-in-out infinite;
}

.login-footer {
  margin-top: 30px;
}

.footer-text {
  color: var(--app-text-muted);
  font-size: 12px;
  font-weight: 400;
}

.login-form :deep(.el-input__wrapper) {
  background-color: #f8fafc;
  box-shadow: none !important;
  border: 1px solid var(--app-border);
}

.login-form :deep(.el-input__wrapper.is-focus) {
  border-color: var(--app-primary);
  background-color: #fff;
}

@keyframes float-orb-1 {
  0%, 100% { transform: translate3d(0, 0, 0); }
  50% { transform: translate3d(-18px, 12px, 0); }
}

@keyframes float-orb-2 {
  0%, 100% { transform: translate3d(0, 0, 0); }
  50% { transform: translate3d(22px, -16px, 0); }
}

@keyframes card-rise {
  0% { transform: translateY(14px) scale(0.98); opacity: 0; }
  100% { transform: translateY(0) scale(1); opacity: 1; }
}

@keyframes border-glow {
  0% { opacity: 0.45; }
  50% { opacity: 0.9; }
  100% { opacity: 0.45; }
}

@keyframes light-sweep {
  0%, 100% { transform: translate3d(0, 0, 0); opacity: 0.55; }
  50% { transform: translate3d(240px, 160px, 0); opacity: 0.9; }
}

@keyframes logo-float {
  0%, 100% { transform: translateY(0); }
  50% { transform: translateY(-6px); }
}

@keyframes btn-shimmer {
  0% { transform: translateX(-120%); }
  55% { transform: translateX(120%); }
  100% { transform: translateX(120%); }
}
</style>
