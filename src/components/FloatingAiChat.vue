<template>
  <div class="ai-assistant">
    <transition name="dock-fade">
      <div
        v-if="!visible"
        ref="dockRef"
        :class="['assistant-dock', { 'is-peek': dockHover || dockJustClosed }]"
        @mouseenter="onDockEnter"
        @mouseleave="onDockLeave"
        @click="openPanel"
      >
        <div class="dock-orb">
          <el-icon :size="24"><Service /></el-icon>
        </div>
        <div class="dock-card">
          <div class="dock-title">AI 导购助手</div>
          <div class="dock-subtitle"></div>
        </div>
        <div v-if="unread > 0" class="dock-badge">{{ unread }}</div>
      </div>
    </transition>

    <transition name="panel-rise">
      <section v-if="visible" class="assistant-panel">
        <header class="panel-header">
          <div class="header-brand">
            <div class="brand-orb">
              <el-icon :size="18"><Service /></el-icon>
            </div>
            <div>
              <div class="brand-title">商城 AI 助手</div>
              <div class="brand-status">{{ loading ? '正在分析商品与知识库...' : '可查询商品、订单、优惠券' }}</div>
            </div>
          </div>
          <div class="header-actions">
            <el-button text class="ghost-btn" @click="clearChat">清空</el-button>
            <el-button text class="ghost-btn" @click="closePanel">收起</el-button>
          </div>
        </header>

        <div v-if="messages.length === 0" class="quick-wrap">
          <div class="quick-title">猜你想问</div>
          <div class="quick-prompts">
            <button
              v-for="item in quickPrompts"
              :key="item"
              class="quick-chip"
              @click="fillPrompt(item)"
            >
              {{ item }}
            </button>
          </div>
        </div>

        <main ref="bodyRef" class="panel-body">
          <div class="msg assistant welcome">
            <div class="avatar ai">AI</div>
            <div class="msg-main">
              <div class="bubble">
                你可以直接问我商品推荐、参数对比、优惠券和订单问题。
                <br />
                例如：“2000 元左右推荐一款手机”、“适合学生的笔记本”、“看看当前有哪些券”。
              </div>
            </div>
          </div>

          <div
            v-for="(msg, index) in messages"
            :key="`${msg.role}-${index}`"
            :class="['msg', msg.role]"
          >
            <div :class="['avatar', msg.role === 'user' ? 'user' : 'ai']">
              {{ msg.role === 'user' ? '我' : 'AI' }}
            </div>
            <div class="msg-main">
              <div class="bubble" v-html="renderMarkdown(msg.content)"></div>

              <div v-if="msg.products?.length" class="product-list">
                <div
                  v-for="product in msg.products"
                  :key="product.productId"
                  class="product-card"
                  @click="openProduct(product)"
                >
                  <div class="product-top">
                    <img v-if="product.imageUrl" :src="product.imageUrl" class="product-image" alt="product" />
                    <div class="product-meta">
                      <div class="product-name">{{ product.productName }}</div>
                      <div class="product-price">￥{{ formatPrice(product.price) }}</div>
                      <div class="product-stock">库存 {{ product.stock ?? '-' }}</div>
                    </div>
                  </div>
                  <div v-if="product.reason" class="product-reason">{{ product.reason }}</div>
                  <div class="product-action">点击查看商品详情</div>
                </div>
              </div>

              <div v-if="msg.suggestions?.length" class="suggestions">
                <button
                  v-for="tip in msg.suggestions"
                  :key="tip"
                  class="suggestion-chip"
                  @click="fillPrompt(tip)"
                >
                  {{ tip }}
                </button>
              </div>

              <details v-if="msg.ragDocs?.length" class="rag-box">
                <summary>查看 AI 参考知识</summary>
                <div v-for="doc in msg.ragDocs" :key="doc.docId" class="rag-item">
                  <div class="rag-title">{{ doc.title }}</div>
                  <div class="rag-type">{{ doc.docType }}</div>
                </div>
              </details>
            </div>
          </div>

          <div v-if="loading" class="msg assistant">
            <div class="avatar ai">AI</div>
            <div class="msg-main">
              <div class="bubble typing">
                <span></span><span></span><span></span>
              </div>
            </div>
          </div>
        </main>

        <footer class="panel-footer">
          <div class="input-shell">
            <textarea
              v-model="input"
              class="chat-input"
              rows="2"
              :disabled="loading"
              placeholder="输入你想买的商品、预算或具体需求"
              @keydown.enter.exact.prevent="send"
            />
            <div class="footer-tools">
              <span class="input-tip">Enter 发送</span>
              <el-button
                v-if="loading"
                round
                @click="stopGeneration"
              >
                终止
              </el-button>
              <el-button
                v-else
                type="primary"
                round
                :icon="Promotion"
                :disabled="!input.trim()"
                @click="send"
              >
                发送
              </el-button>
            </div>
          </div>
        </footer>
      </section>
    </transition>
  </div>
</template>

<script setup lang="ts">
import { nextTick, onMounted, ref } from 'vue'
import { Promotion, Service } from '@element-plus/icons-vue'
import { useRouter } from 'vue-router'
import { useUserStore } from '@/stores/user'
import { ElMessage } from 'element-plus'

interface RagDoc {
  docId: string
  docType: string
  title: string
  content: string
}

interface ProductItem {
  productId: number
  productName: string
  price: number | string
  imageUrl?: string
  stock?: number
  reason?: string
}

interface ChatMessage {
  role: 'user' | 'assistant'
  content: string
  products?: ProductItem[]
  ragDocs?: RagDoc[]
  suggestions?: string[]
}

const router = useRouter()
const visible = ref(false)
const loading = ref(false)
const unread = ref(0)
const input = ref('')
const messages = ref<ChatMessage[]>([])
const bodyRef = ref<HTMLElement>()
const dockRef = ref<HTMLElement>()
const userStore = useUserStore()
const dockHover = ref(false)
const dockJustClosed = ref(false)
let autoPeekTimer: ReturnType<typeof setTimeout> | null = null

const quickPrompts = [
  '2000 元左右推荐一款手机',
  '适合学生用的笔记本推荐',
  '帮我看看现在有什么优惠券',
  '拍照好的手机有哪些',
]

const sessionId = `mall-ai-${Date.now()}`
let abortController: AbortController | null = null

function openPanel() {
  visible.value = true
  unread.value = 0
  dockJustClosed.value = false
  if (autoPeekTimer) {
    clearTimeout(autoPeekTimer)
    autoPeekTimer = null
  }
  scrollBottom()
}

function closePanel() {
  visible.value = false
  dockJustClosed.value = true
  if (autoPeekTimer) clearTimeout(autoPeekTimer)
  autoPeekTimer = setTimeout(() => {
    dockJustClosed.value = false
  }, 2000)
}

function onDockEnter() {
  dockHover.value = true
  if (autoPeekTimer) {
    clearTimeout(autoPeekTimer)
    autoPeekTimer = null
  }
}

function onDockLeave() {
  dockHover.value = false
}

function fillPrompt(text: string) {
  input.value = text
}

function stopGeneration() {
  if (abortController) {
    abortController.abort()
    abortController = null
  }
  loading.value = false
}

async function send() {
  const message = input.value.trim()
  if (!message || loading.value) return

  messages.value.push({ role: 'user', content: message })
  input.value = ''
  loading.value = true
  scrollBottom()

  // 先插入一个空的 assistant 消息占位，流式填充
  const assistantIndex = messages.value.length
  messages.value.push({
    role: 'assistant',
    content: '',
    products: [],
    ragDocs: [],
    suggestions: [],
  })
  const assistantMessage = messages.value[assistantIndex]
  if (!assistantMessage) return

  try {
    // SSE 流式请求
    abortController = new AbortController()
    const gatewayBase = window.location.port === '5174' ? 'http://localhost:8080' : ''
    const response = await fetch(`${gatewayBase}/api/ai/assistant/chat/stream`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${userStore.token || ''}`,
      },
      body: JSON.stringify({
        sessionId,
        memberId: Number(userStore.userId) || undefined,
        message,
        scene: 'MALL_FLOATING_CHAT',
      }),
      signal: abortController.signal,
    })

    if (response.status === 401) {
      assistantMessage.content = '登录已过期，请重新登录后再试。'
      return
    }

    if (!response.ok) throw new Error(`SSE connection failed: ${response.status}`)

    const reader = response.body?.getReader()
    if (!reader) throw new Error('No reader')

    const decoder = new TextDecoder()
    let buffer = ''
    let eventType = ''

    while (true) {
      const { done, value } = await reader.read()
      if (done) break

      buffer += decoder.decode(value, { stream: true })
      const lines = buffer.split('\n')
      buffer = lines.pop() || ''

      for (const line of lines) {
        if (line.startsWith('event:')) {
          eventType = line.slice(6).trim()
        } else if (line.startsWith('data:')) {
          const data = line.slice(5).trimStart()
          if (eventType === 'metadata') {
            try {
              const meta = JSON.parse(data)
              if (meta.ragDocs) assistantMessage.ragDocs = meta.ragDocs
              if (meta.data && Array.isArray(meta.data)) assistantMessage.products = meta.data
            } catch { /* ignore parse error */ }
          } else if (eventType === 'done') {
            try {
              const doneData = JSON.parse(data)
              if (doneData.suggestions) assistantMessage.suggestions = doneData.suggestions
            } catch { /* ignore parse error */ }
          } else if (eventType === 'error') {
            // 服务端错误事件
            assistantMessage.content = data || 'AI 服务暂时不可用，请稍后重试。'
          } else {
            // 普通文本 chunk
            assistantMessage.content += data
          }
          eventType = ''
        }
      }
    }

    if (!assistantMessage.content) {
      assistantMessage.content = 'AI 服务连接超时，请检查网络后重试。'
    }

    if (!visible.value) unread.value += 1
  } catch (e: any) {
    // 用户主动终止
    if (e?.name === 'AbortError') {
      if (!assistantMessage.content) {
        assistantMessage.content = '（已终止生成）'
      }
    } else if (!assistantMessage.content) {
      assistantMessage.content = 'AI 助手暂时连接失败，请稍后再试。'
    }
  } finally {
    abortController = null
    loading.value = false
    scrollBottom()
  }
}

function clearChat() {
  messages.value = []
}

function openProduct(product: ProductItem) {
  if (!product.productId) {
    ElMessage.info('当前商品缺少可跳转的详情链接')
    return
  }
  visible.value = false
  router.push(`/mall/product/${product.productId}`)
}

function scrollBottom() {
  nextTick(() => {
    if (bodyRef.value) {
      bodyRef.value.scrollTop = bodyRef.value.scrollHeight
    }
  })
}

function renderMarkdown(text: string) {
  if (!text) return ''
  return text.replace(/\*\*(.+?)\*\*/g, '<strong>$1</strong>').replace(/\n/g, '<br/>')
}

function formatPrice(price: number | string | undefined) {
  if (price === undefined || price === null || price === '') return '-'
  return Number(price).toFixed(2)
}

onMounted(() => {
  scrollBottom()
})
</script>

<style scoped>
.ai-assistant {
  position: fixed;
  right: 24px;
  bottom: 24px;
  z-index: 3000;
}

.assistant-dock {
  position: relative;
  display: flex;
  align-items: center;
  gap: 14px;
  width: 50px;
  height: 50px;
  padding: 0;
  border-radius: 999px;
  background:
    radial-gradient(circle at top left, rgba(255, 255, 255, 0.34), transparent 30%),
    linear-gradient(135deg, #ff7a18, #ff5d5d 45%, #ff2e63);
  color: #fff;
  box-shadow: 0 20px 48px rgba(255, 88, 88, 0.28);
  cursor: pointer;
  overflow: hidden;
  transition: width 0.3s ease, border-radius 0.3s ease, padding 0.3s ease;
}

.assistant-dock.is-peek {
  width: 292px;
  padding: 14px 16px;
  border-radius: 24px;
}

.assistant-dock.is-peek .dock-card {
  opacity: 1;
  max-width: 180px;
}

.assistant-dock .dock-card {
  opacity: 0;
  max-width: 0;
  overflow: hidden;
  transition: opacity 0.25s ease 0.1s, max-width 0.3s ease;
}

.dock-orb {
  width: 50px;
  height: 50px;
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  background: rgba(255, 255, 255, 0.16);
  backdrop-filter: blur(10px);
  flex-shrink: 0;
}

.dock-title {
  font-size: 16px;
  font-weight: 700;
}

.dock-subtitle {
  margin-top: 3px;
  font-size: 12px;
  line-height: 1.45;
  color: rgba(255, 255, 255, 0.88);
}

.dock-badge {
  position: absolute;
  top: 10px;
  right: 12px;
  min-width: 22px;
  height: 22px;
  padding: 0 6px;
  border-radius: 999px;
  background: #fff;
  color: #ff335f;
  font-size: 12px;
  font-weight: 700;
  display: flex;
  align-items: center;
  justify-content: center;
}

.assistant-panel {
  width: 390px;
  height: 640px;
  border-radius: 28px;
  overflow: hidden;
  display: flex;
  flex-direction: column;
  background: linear-gradient(180deg, #fff8ef 0%, #ffffff 22%, #ffffff 100%);
  box-shadow: 0 28px 80px rgba(20, 20, 43, 0.2);
  border: 1px solid rgba(255, 122, 24, 0.14);
}

.panel-header {
  padding: 18px 18px 14px;
  display: flex;
  align-items: center;
  justify-content: space-between;
  background:
    radial-gradient(circle at top left, rgba(255, 255, 255, 0.36), transparent 34%),
    linear-gradient(135deg, #ff7a18, #ff5d5d 48%, #ff2e63);
  color: #fff;
}

.header-brand {
  display: flex;
  align-items: center;
  gap: 12px;
}

.brand-orb {
  width: 42px;
  height: 42px;
  border-radius: 14px;
  display: flex;
  align-items: center;
  justify-content: center;
  background: rgba(255, 255, 255, 0.16);
}

.brand-title {
  font-size: 16px;
  font-weight: 700;
}

.brand-status {
  margin-top: 2px;
  font-size: 12px;
  color: rgba(255, 255, 255, 0.9);
}

.header-actions {
  display: flex;
  gap: 8px;
}

.ghost-btn {
  color: #fff;
}

.quick-wrap {
  padding: 14px 16px 8px;
}

.quick-title {
  margin-bottom: 10px;
  font-size: 12px;
  font-weight: 700;
  color: #8b5f4d;
}

.quick-prompts {
  display: flex;
  gap: 10px;
  overflow-x: auto;
}

.quick-chip,
.suggestion-chip {
  border: none;
  cursor: pointer;
  white-space: nowrap;
}

.quick-chip {
  padding: 9px 12px;
  border-radius: 999px;
  background: #fff3eb;
  color: #ea5b2d;
  font-size: 12px;
  font-weight: 600;
}

.panel-body {
  flex: 1;
  overflow-y: auto;
  padding: 12px 16px 16px;
}

.msg {
  display: flex;
  gap: 10px;
  margin-bottom: 16px;
}

.msg.user {
  flex-direction: row-reverse;
}

.avatar {
  width: 34px;
  height: 34px;
  border-radius: 14px;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 12px;
  font-weight: 700;
  flex-shrink: 0;
}

.avatar.ai {
  background: linear-gradient(135deg, #ffb26b, #ff6a3d);
  color: #fff;
}

.avatar.user {
  background: #1d1d1f;
  color: #fff;
}

.msg-main {
  max-width: 285px;
}

.bubble {
  padding: 12px 14px;
  border-radius: 18px;
  font-size: 13px;
  line-height: 1.65;
  background: #fff;
  color: #2c2e33;
  box-shadow: 0 6px 22px rgba(12, 12, 13, 0.06);
}

.msg.user .bubble {
  background: linear-gradient(135deg, #ff7a18, #ff5d5d);
  color: #fff;
}

.product-list {
  display: flex;
  flex-direction: column;
  gap: 10px;
  margin-top: 10px;
}

.product-card {
  padding: 12px;
  border-radius: 18px;
  background: #fff7f1;
  border: 1px solid #ffe0d2;
  cursor: pointer;
}

.product-top {
  display: flex;
  gap: 12px;
}

.product-image {
  width: 74px;
  height: 74px;
  border-radius: 14px;
  object-fit: cover;
  background: #f5f5f5;
}

.product-meta {
  min-width: 0;
  flex: 1;
}

.product-name {
  font-size: 14px;
  font-weight: 700;
  color: #24262b;
  line-height: 1.4;
}

.product-price {
  margin-top: 6px;
  color: #ff5a36;
  font-size: 16px;
  font-weight: 800;
}

.product-stock {
  margin-top: 6px;
  color: #7b8088;
  font-size: 12px;
}

.product-reason {
  margin-top: 10px;
  color: #5f6570;
  font-size: 12px;
  line-height: 1.6;
}

.product-action {
  margin-top: 10px;
  color: #ea5b2d;
  font-size: 12px;
  font-weight: 700;
}

.suggestions {
  display: flex;
  flex-wrap: wrap;
  gap: 8px;
  margin-top: 10px;
}

.suggestion-chip {
  padding: 7px 11px;
  border-radius: 999px;
  background: #f3f5f7;
  color: #4f5661;
  font-size: 12px;
}

.rag-box {
  margin-top: 10px;
  padding: 10px 12px;
  border-radius: 14px;
  background: #fff;
  border: 1px solid #f1e6dc;
}

.rag-box summary {
  cursor: pointer;
  color: #7a5a48;
  font-size: 12px;
}

.rag-item + .rag-item {
  margin-top: 8px;
}

.rag-title {
  font-size: 12px;
  font-weight: 700;
  color: #30343a;
}

.rag-type {
  margin-top: 2px;
  font-size: 11px;
  color: #8a8f99;
}

.typing {
  display: inline-flex;
  gap: 5px;
  align-items: center;
}

.typing span {
  width: 7px;
  height: 7px;
  border-radius: 50%;
  background: #ff7a18;
  animation: blink 1.2s infinite ease-in-out;
}

.typing span:nth-child(2) {
  animation-delay: 0.15s;
}

.typing span:nth-child(3) {
  animation-delay: 0.3s;
}

.panel-footer {
  padding: 14px 16px 18px;
  background: #fff;
  border-top: 1px solid #f5e6dc;
}

.input-shell {
  padding: 12px;
  border-radius: 20px;
  background: #fff7f1;
  border: 1px solid #ffe6d9;
}

.chat-input {
  width: 100%;
  resize: none;
  border: none;
  outline: none;
  background: transparent;
  font-size: 14px;
  line-height: 1.6;
  color: #2c2e33;
}

.footer-tools {
  margin-top: 10px;
  display: flex;
  align-items: center;
  justify-content: space-between;
}

.input-tip {
  color: #8a8f99;
  font-size: 12px;
}

.dock-fade-enter-active,
.dock-fade-leave-active,
.panel-rise-enter-active,
.panel-rise-leave-active {
  transition: all 0.22s ease;
}

.dock-fade-enter-from,
.dock-fade-leave-to,
.panel-rise-enter-from,
.panel-rise-leave-to {
  opacity: 0;
  transform: translateY(12px);
}

@keyframes blink {
  0%, 80%, 100% {
    transform: scale(0.7);
    opacity: 0.45;
  }

  40% {
    transform: scale(1);
    opacity: 1;
  }
}

@media (max-width: 768px) {
  .ai-assistant {
    right: 12px;
    bottom: 12px;
  }

  .assistant-dock {
    width: 248px;
  }

  .assistant-panel {
    width: min(92vw, 390px);
    height: 72vh;
  }
}
</style>
