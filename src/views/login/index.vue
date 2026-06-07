<template>
  <main
    class="login-page"
    :class="sceneClasses"
    :style="sceneStyle"
    @mousemove="handleMouseMove"
  >
    <section class="character-panel" aria-hidden="true">
      <div class="brand">
        <span class="brand-mark">
          <el-icon :size="22"><Shop /></el-icon>
        </span>
        <span>SCAU 商城</span>
      </div>

      <div class="panel-copy">
        <p class="eyebrow">WELCOME BACK</p>
        <h1>让每一次登录<br />都有一点回应。</h1>
        <p>微服务分布式电商平台</p>
      </div>

      <div class="characters-wrapper">
        <div class="characters-scene">
          <div class="character char-purple">
            <div class="eyes purple-eyes">
              <span class="eyeball"><i class="pupil"></i></span>
              <span class="eyeball"><i class="pupil"></i></span>
            </div>
          </div>

          <div class="character char-black">
            <div class="eyes black-eyes">
              <span class="eyeball"><i class="pupil"></i></span>
              <span class="eyeball"><i class="pupil"></i></span>
            </div>
          </div>

          <div class="character char-orange">
            <div class="eyes orange-eyes">
              <i class="bare-pupil"></i>
              <i class="bare-pupil"></i>
            </div>
            <div class="orange-mouth"></div>
          </div>

          <div class="character char-yellow">
            <div class="eyes yellow-eyes">
              <i class="bare-pupil"></i>
              <i class="bare-pupil"></i>
            </div>
            <div class="yellow-mouth"></div>
          </div>
        </div>
      </div>

      <div class="panel-footer">
        <span>SCAU MIS</span>
        <span>安全 · 高效 · 智能</span>
      </div>
    </section>

    <section class="form-panel">
      <div class="login-box">
        <div class="login-header">
          <div class="sparkle">
            <span></span>
            <span></span>
          </div>
          <h2>欢迎回来</h2>
          <p>请选择登录方式并输入账号信息</p>
        </div>

        <el-tabs v-model="activeTab" class="login-tabs" stretch @tab-change="handleTabChange">
          <el-tab-pane label="验证码登录" name="sms">
            <el-form
              ref="smsFormRef"
              :model="smsForm"
              :rules="smsRules"
              class="login-form"
              label-position="top"
            >
              <el-form-item label="手机号" prop="phone">
                <el-input
                  v-model="smsForm.phone"
                  placeholder="请输入手机号"
                  :prefix-icon="Iphone"
                  size="large"
                  @focus="setTyping(true)"
                  @blur="setTyping(false)"
                  @keyup.enter="handleLogin"
                />
              </el-form-item>
              <el-form-item label="验证码" prop="code">
                <div class="code-wrapper">
                  <el-input
                    v-model="smsForm.code"
                    placeholder="请输入验证码"
                    :prefix-icon="Message"
                    size="large"
                    @focus="setTyping(true)"
                    @blur="setTyping(false)"
                    @keyup.enter="handleLogin"
                  />
                  <el-button
                    type="primary"
                    plain
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

          <el-tab-pane label="密码登录" name="account">
            <el-form
              ref="accountFormRef"
              :model="accountForm"
              :rules="accountRules"
              class="login-form"
              label-position="top"
            >
              <el-form-item label="账号" prop="username">
                <el-input
                  v-model="accountForm.username"
                  placeholder="用户名 / 手机号"
                  :prefix-icon="User"
                  size="large"
                  @focus="setTyping(true)"
                  @blur="setTyping(false)"
                  @keyup.enter="handleLogin"
                />
              </el-form-item>
              <el-form-item label="密码" prop="password">
                <el-input
                  v-model="accountForm.password"
                  :type="showPassword ? 'text' : 'password'"
                  placeholder="请输入密码"
                  :prefix-icon="Lock"
                  size="large"
                  @focus="handlePasswordFocus"
                  @blur="handlePasswordBlur"
                  @keyup.enter="handleLogin"
                >
                  <template #suffix>
                    <button
                      class="password-toggle"
                      type="button"
                      :aria-label="showPassword ? '隐藏密码' : '显示密码'"
                      @mousedown.prevent
                      @click="showPassword = !showPassword"
                    >
                      <el-icon :size="18">
                        <Hide v-if="showPassword" />
                        <View v-else />
                      </el-icon>
                    </button>
                  </template>
                </el-input>
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
          <span>{{ activeTab === 'sms' ? '登录 / 自动注册' : '登 录' }}</span>
          <span class="button-arrow">→</span>
        </el-button>

        <div class="login-footer">
          <span>登录即代表你同意平台服务条款与隐私政策</span>
        </div>
      </div>
    </section>
  </main>
</template>

<script setup lang="ts">
import { computed, onBeforeUnmount, reactive, ref } from 'vue'
import { useRouter } from 'vue-router'
import type { FormInstance, FormRules, TabsPaneContext } from 'element-plus'
import { ElMessage } from 'element-plus'
import { Hide, Iphone, Lock, Message, Shop, User, View } from '@element-plus/icons-vue'
import { sendCodeApi } from '@/api/auth/auth'
import { useUserStore } from '@/stores/user'
import { getRoleHomePath } from '@/utils/role'

const router = useRouter()
const userStore = useUserStore()

const activeTab = ref<'sms' | 'account'>('sms')
const loading = ref(false)
const isTyping = ref(false)
const isPasswordFocused = ref(false)
const showPassword = ref(false)
const isLoginError = ref(false)
const mouseX = ref(0)
const mouseY = ref(0)

const isCounting = ref(false)
const count = ref(60)
let countdownTimer: ReturnType<typeof setInterval> | undefined
let errorTimer: ReturnType<typeof setTimeout> | undefined
let errorFrame: number | undefined

const smsForm = reactive({ phone: '', code: '' })
const accountForm = reactive({ username: '', password: '' })
const smsFormRef = ref<FormInstance>()
const accountFormRef = ref<FormInstance>()

const smsRules: FormRules<typeof smsForm> = {
  phone: [
    { required: true, message: '请输入手机号', trigger: 'blur' },
    { pattern: /^1[3-9]\d{9}$/, message: '手机号格式不正确', trigger: 'blur' }
  ],
  code: [{ required: true, message: '请输入验证码', trigger: 'blur' }]
}

const accountRules: FormRules<typeof accountForm> = {
  username: [{ required: true, message: '请输入账号', trigger: 'blur' }],
  password: [{ required: true, message: '请输入密码', trigger: 'blur' }]
}

const isPasswordVisible = computed(
  () => activeTab.value === 'account' && showPassword.value && accountForm.password.length > 0
)

const sceneClasses = computed(() => ({
  'is-typing': isTyping.value,
  'is-password-away':
    activeTab.value === 'account' && isPasswordFocused.value && !showPassword.value,
  'is-password-visible': isPasswordVisible.value,
  'is-login-error': isLoginError.value
}))

const sceneStyle = computed(() => {
  if (typeof window === 'undefined') return {}

  const x = Math.max(-7, Math.min(7, (mouseX.value - window.innerWidth * 0.25) / 80))
  const y = Math.max(-5, Math.min(5, (mouseY.value - window.innerHeight * 0.55) / 80))

  return {
    '--look-x': `${x}px`,
    '--look-y': `${y}px`,
    '--body-skew': `${Math.max(-4, Math.min(4, -x / 1.8))}deg`
  }
})

const handleMouseMove = (event: MouseEvent) => {
  if (isTyping.value || isLoginError.value) return
  mouseX.value = event.clientX
  mouseY.value = event.clientY
}

const setTyping = (value: boolean) => {
  isTyping.value = value
}

const handlePasswordFocus = () => {
  isPasswordFocused.value = true
  isTyping.value = false
}

const handlePasswordBlur = () => {
  isPasswordFocused.value = false
}

const handleTabChange = (_name: string | number, _context?: TabsPaneContext) => {
  isTyping.value = false
  isPasswordFocused.value = false
  isLoginError.value = false
}

const triggerLoginError = () => {
  if (errorTimer) clearTimeout(errorTimer)
  if (errorFrame) cancelAnimationFrame(errorFrame)

  isLoginError.value = false
  errorFrame = requestAnimationFrame(() => {
    isLoginError.value = true
    errorFrame = undefined
  })

  errorTimer = setTimeout(() => {
    isLoginError.value = false
    errorTimer = undefined
  }, 2500)
}

const handleSendCode = async () => {
  try {
    await smsFormRef.value?.validateField('phone')
    await sendCodeApi(smsForm.phone)
    ElMessage.success('验证码已发送，请查看控制台')

    isCounting.value = true
    count.value = 60
    if (countdownTimer) clearInterval(countdownTimer)
    countdownTimer = setInterval(() => {
      count.value -= 1
      if (count.value <= 0) {
        clearInterval(countdownTimer)
        countdownTimer = undefined
        isCounting.value = false
      }
    }, 1000)
  } catch {
    triggerLoginError()
  }
}

const handleLogin = async () => {
  const isSms = activeTab.value === 'sms'
  const formRef = isSms ? smsFormRef.value : accountFormRef.value
  if (!formRef || loading.value) return

  try {
    await formRef.validate()
  } catch {
    triggerLoginError()
    return
  }

  loading.value = true
  try {
    await userStore.login({
      loginType: isSms ? 'sms' : 'account',
      ...(isSms ? smsForm : accountForm)
    })
    ElMessage.success('登录成功')
    await router.push(getRoleHomePath(userStore.role))
  } catch {
    triggerLoginError()
  } finally {
    loading.value = false
  }
}

onBeforeUnmount(() => {
  if (countdownTimer) clearInterval(countdownTimer)
  if (errorTimer) clearTimeout(errorTimer)
  if (errorFrame) cancelAnimationFrame(errorFrame)
})
</script>

<style scoped>
.login-page {
  --ink: #17233b;
  --primary: #3157d5;
  --look-x: 0px;
  --look-y: 0px;
  --body-skew: 0deg;
  display: grid;
  grid-template-columns: minmax(480px, 1.05fr) minmax(480px, 0.95fr);
  width: 100%;
  min-height: 100vh;
  overflow: hidden;
  background: #f8faff;
  color: var(--ink);
}

.character-panel {
  position: relative;
  display: flex;
  flex-direction: column;
  min-width: 0;
  padding: 38px 48px 28px;
  overflow: hidden;
  background:
    radial-gradient(circle at 72% 18%, rgba(255, 255, 255, 0.7), transparent 30%),
    linear-gradient(145deg, #dce5ff 0%, #cedaf9 52%, #becdec 100%);
}

.character-panel::before,
.character-panel::after {
  position: absolute;
  content: "";
  border-radius: 50%;
  filter: blur(2px);
  pointer-events: none;
}

.character-panel::before {
  top: 12%;
  right: -100px;
  width: 330px;
  height: 330px;
  background: rgba(120, 143, 211, 0.18);
}

.character-panel::after {
  bottom: 2%;
  left: -100px;
  width: 360px;
  height: 360px;
  background: rgba(255, 255, 255, 0.22);
}

.brand,
.panel-copy,
.characters-wrapper,
.panel-footer {
  position: relative;
  z-index: 2;
}

.brand {
  display: flex;
  align-items: center;
  gap: 11px;
  font-size: 17px;
  font-weight: 700;
  letter-spacing: 0.02em;
}

.brand-mark {
  display: grid;
  width: 38px;
  height: 38px;
  place-items: center;
  color: white;
  border-radius: 12px;
  background: rgba(49, 87, 213, 0.9);
  box-shadow: 0 10px 24px rgba(49, 87, 213, 0.22);
}

.panel-copy {
  margin-top: clamp(46px, 8vh, 92px);
}

.panel-copy .eyebrow {
  margin: 0 0 16px;
  color: #526ba9;
  font-size: 12px;
  font-weight: 700;
  letter-spacing: 0.2em;
}

.panel-copy h1 {
  margin: 0;
  color: #26385f;
  font-size: clamp(34px, 3.5vw, 54px);
  line-height: 1.15;
  letter-spacing: -0.04em;
}

.panel-copy > p:last-child {
  margin: 16px 0 0;
  color: #64769e;
  font-size: 15px;
}

.characters-wrapper {
  display: flex;
  flex: 1;
  align-items: flex-end;
  justify-content: center;
  min-height: 330px;
}

.characters-scene {
  position: relative;
  width: 470px;
  height: 350px;
  transform-origin: bottom center;
}

.character {
  position: absolute;
  bottom: 0;
  transform: skewX(var(--body-skew));
  transform-origin: bottom center;
  transition: transform 0.65s ease, height 0.65s ease;
}

.char-purple {
  left: 60px;
  z-index: 1;
  width: 168px;
  height: 340px;
  border-radius: 14px 14px 0 0;
  background: linear-gradient(180deg, #6c4df4, #5b37df);
  box-shadow: inset -16px 0 30px rgba(57, 26, 163, 0.12);
}

.char-black {
  left: 220px;
  z-index: 2;
  width: 115px;
  height: 270px;
  border-radius: 10px 10px 0 0;
  background: linear-gradient(180deg, #303440, #20232b);
}

.char-orange {
  left: 0;
  z-index: 3;
  width: 230px;
  height: 182px;
  border-radius: 115px 115px 0 0;
  background: linear-gradient(150deg, #ffaf82, #ff8c62);
}

.char-yellow {
  left: 292px;
  z-index: 4;
  width: 136px;
  height: 210px;
  border-radius: 68px 68px 0 0;
  background: linear-gradient(160deg, #f5e66e, #dfca42);
}

.eyes {
  position: absolute;
  display: flex;
  transition: left 0.65s ease, top 0.65s ease, transform 0.65s ease;
}

.purple-eyes {
  top: calc(38px + var(--look-y));
  left: calc(44px + var(--look-x));
  gap: 28px;
}

.black-eyes {
  top: calc(31px + var(--look-y));
  left: calc(26px + var(--look-x));
  gap: 20px;
}

.orange-eyes {
  top: calc(86px + var(--look-y));
  left: calc(82px + var(--look-x));
  gap: 28px;
}

.yellow-eyes {
  top: calc(39px + var(--look-y));
  left: calc(51px + var(--look-x));
  gap: 20px;
}

.eyeball {
  display: grid;
  width: 18px;
  height: 18px;
  place-items: center;
  overflow: hidden;
  border-radius: 50%;
  background: white;
  animation: blink 5.2s infinite;
}

.black-eyes .eyeball {
  width: 16px;
  height: 16px;
  animation-delay: 1.4s;
}

.pupil,
.bare-pupil {
  display: block;
  width: 7px;
  height: 7px;
  border-radius: 50%;
  background: #252832;
  transform: translate(calc(var(--look-x) * 0.35), calc(var(--look-y) * 0.35));
  transition: transform 0.2s ease-out;
}

.bare-pupil {
  width: 12px;
  height: 12px;
}

.yellow-mouth {
  position: absolute;
  top: calc(87px + var(--look-y));
  left: calc(40px + var(--look-x));
  width: 50px;
  height: 4px;
  border-radius: 4px;
  background: #2d3039;
  transition: all 0.65s ease;
}

.orange-mouth {
  position: absolute;
  top: 124px;
  left: 98px;
  width: 28px;
  height: 14px;
  border: 3px solid #2d3039;
  border-top: 0;
  border-radius: 0 0 14px 14px;
  opacity: 0;
  transition: opacity 0.25s ease;
}

.is-typing .char-purple {
  height: 375px;
  transform: skewX(-10deg) translateX(34px);
}

.is-typing .char-black {
  transform: skewX(9deg) translateX(18px);
}

.is-typing .purple-eyes {
  top: 62px;
  left: 55px;
}

.is-typing .black-eyes {
  top: 14px;
  left: 32px;
}

.is-password-away .char-purple {
  height: 380px;
  transform: skewX(-13deg) translateX(-18px);
}

.is-password-away .char-black {
  transform: skewX(11deg) translateX(-10px);
}

.is-password-away .purple-eyes,
.is-password-visible .purple-eyes {
  top: 25px;
  left: 20px;
}

.is-password-away .black-eyes,
.is-password-visible .black-eyes {
  top: 20px;
  left: 10px;
}

.is-password-away .orange-eyes,
.is-password-visible .orange-eyes {
  top: 75px;
  left: 50px;
}

.is-password-away .yellow-eyes,
.is-password-visible .yellow-eyes {
  top: 30px;
  left: 20px;
}

.is-password-away .yellow-mouth,
.is-password-visible .yellow-mouth {
  top: 78px;
  left: 15px;
}

.is-password-away .pupil,
.is-password-away .bare-pupil {
  transform: translate(-5px, -4px);
}

.is-password-visible .pupil,
.is-password-visible .bare-pupil {
  transform: translate(-3px, 4px);
  animation: peek 1.5s ease-in-out infinite;
}

.is-login-error .character {
  transform: skewX(-3deg);
}

.is-login-error .eyes,
.is-login-error .yellow-mouth,
.is-login-error .orange-mouth {
  animation: shake-head 0.8s 0.25s cubic-bezier(0.36, 0.07, 0.19, 0.97) both;
}

.is-login-error .eyes {
  transform: translate(-10px, 10px);
}

.is-login-error .pupil,
.is-login-error .bare-pupil {
  transform: translate(-3px, 4px);
}

.is-login-error .yellow-mouth {
  top: 92px;
  left: 30px;
  transform: rotate(-8deg);
}

.is-login-error .orange-mouth {
  opacity: 1;
}

.panel-footer {
  display: flex;
  justify-content: space-between;
  padding-top: 18px;
  color: rgba(49, 67, 105, 0.65);
  font-size: 12px;
}

.form-panel {
  position: relative;
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 48px;
  background:
    radial-gradient(circle at 85% 15%, rgba(49, 87, 213, 0.06), transparent 27%),
    #ffffff;
}

.login-box {
  width: min(100%, 420px);
  animation: card-rise 0.7s ease-out;
}

.login-header {
  margin-bottom: 30px;
  text-align: center;
}

.sparkle {
  position: relative;
  width: 34px;
  height: 34px;
  margin: 0 auto 18px;
  transform: rotate(45deg);
}

.sparkle span {
  position: absolute;
  background: var(--ink);
  border-radius: 99px;
}

.sparkle span:first-child {
  top: 15px;
  left: 2px;
  width: 30px;
  height: 4px;
}

.sparkle span:last-child {
  top: 2px;
  left: 15px;
  width: 4px;
  height: 30px;
}

.login-header h2 {
  margin: 0;
  color: var(--ink);
  font-size: 30px;
  font-weight: 750;
  letter-spacing: -0.04em;
}

.login-header p {
  margin: 8px 0 0;
  color: #8a94a7;
  font-size: 14px;
}

.login-tabs {
  margin-bottom: 24px;
}

.login-tabs :deep(.el-tabs__nav-wrap::after) {
  height: 1px;
  background: #e8ecf4;
}

.login-tabs :deep(.el-tabs__active-bar) {
  height: 3px;
  border-radius: 3px;
  background: var(--primary);
}

.login-tabs :deep(.el-tabs__item) {
  height: 44px;
  color: #8993a6;
  font-weight: 600;
}

.login-tabs :deep(.el-tabs__item.is-active) {
  color: var(--primary);
}

.login-form :deep(.el-form-item) {
  margin-bottom: 20px;
}

.login-form :deep(.el-form-item__label) {
  height: auto;
  margin-bottom: 7px;
  color: #3b465a;
  font-size: 13px;
  font-weight: 600;
  line-height: 1.4;
}

.login-form :deep(.el-input__wrapper) {
  min-height: 48px;
  padding: 0 14px;
  border: 1px solid #e1e6ef;
  border-radius: 12px;
  background: #f8f9fc;
  box-shadow: none;
  transition: border-color 0.2s, background 0.2s, box-shadow 0.2s;
}

.login-form :deep(.el-input__wrapper.is-focus) {
  border-color: #7088df;
  background: #fff;
  box-shadow: 0 0 0 3px rgba(49, 87, 213, 0.09);
}

.login-form :deep(.el-form-item.is-error .el-input__wrapper) {
  border-color: #e45b68;
}

.code-wrapper {
  display: flex;
  gap: 12px;
  width: 100%;
}

.code-btn {
  width: 122px;
  height: 48px;
  border-radius: 12px;
}

.password-toggle {
  display: grid;
  padding: 4px;
  color: #7b8496;
  border: 0;
  background: transparent;
  cursor: pointer;
  place-items: center;
}

.login-btn {
  display: flex;
  width: 100%;
  height: 50px;
  align-items: center;
  justify-content: center;
  gap: 10px;
  margin-top: 2px;
  border: 0;
  border-radius: 25px;
  background: var(--ink);
  box-shadow: 0 14px 30px rgba(23, 35, 59, 0.2);
  font-size: 15px;
  font-weight: 650;
  transition: transform 0.2s, background 0.2s, box-shadow 0.2s;
}

.login-btn:hover,
.login-btn:focus {
  background: var(--primary);
  box-shadow: 0 16px 34px rgba(49, 87, 213, 0.25);
  transform: translateY(-2px);
}

.button-arrow {
  font-size: 19px;
  transition: transform 0.2s;
}

.login-btn:hover .button-arrow {
  transform: translateX(4px);
}

.login-footer {
  margin-top: 26px;
  color: #a1a9b8;
  font-size: 12px;
  text-align: center;
}

@keyframes blink {
  0%, 45%, 48%, 100% { transform: scaleY(1); }
  46%, 47% { transform: scaleY(0.1); }
}

@keyframes peek {
  0%, 100% { transform: translate(-4px, -3px); }
  50% { transform: translate(4px, 4px); }
}

@keyframes shake-head {
  0%, 100% { translate: 0 0; }
  15% { translate: -8px 0; }
  30% { translate: 7px 0; }
  45% { translate: -5px 0; }
  60% { translate: 4px 0; }
  75% { translate: -2px 0; }
}

@keyframes card-rise {
  from { opacity: 0; transform: translateY(18px); }
  to { opacity: 1; transform: translateY(0); }
}

@media (max-width: 1050px) {
  .login-page {
    grid-template-columns: minmax(400px, 0.9fr) minmax(460px, 1.1fr);
  }

  .character-panel {
    padding-inline: 32px;
  }

  .characters-scene {
    transform: scale(0.82);
  }
}

@media (max-width: 820px) {
  .login-page {
    display: block;
    min-height: 100dvh;
    overflow-y: auto;
  }

  .character-panel {
    display: none;
  }

  .form-panel {
    min-height: 100dvh;
    padding: 32px 22px;
  }
}

@media (max-width: 480px) {
  .form-panel {
    align-items: flex-start;
    padding-top: 10vh;
  }

  .login-header h2 {
    font-size: 27px;
  }

  .code-wrapper {
    gap: 8px;
  }

  .code-btn {
    width: 108px;
    padding-inline: 10px;
  }
}

@media (prefers-reduced-motion: reduce) {
  *,
  *::before,
  *::after {
    animation-duration: 0.01ms !important;
    animation-iteration-count: 1 !important;
    scroll-behavior: auto !important;
  }
}
</style>
