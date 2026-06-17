import { fileURLToPath, URL } from 'node:url'
import { defineConfig, loadEnv } from 'vite'
import vue from '@vitejs/plugin-vue'
import { viteMockServe } from 'vite-plugin-mock'
import vueDevTools from 'vite-plugin-vue-devtools'
import type { IncomingMessage, ServerResponse } from 'node:http'

// https://vite.dev/config/
export default defineConfig(({ mode }) => {
  const env = loadEnv(mode, process.cwd(), 'VITE_')
  const target = env.VITE_BACKEND === 'remote'
    ? 'http://8.138.192.28:8080'
    : 'http://localhost:8080'

  return {
    plugins: [
      vue(),
      vueDevTools(),
      viteMockServe({
        mockPath: 'src/mock',
        enable: false,
      }),
    ],
    resolve: {
      alias: {
        '@': fileURLToPath(new URL('./src', import.meta.url))
      },
    },
    server: {
      port: 5174,
      proxy: {
        // SSE 流式接口 — 必须单独配置，禁用压缩和缓冲
        '/api/ai': {
          target,
          changeOrigin: true,
          // 关闭代理压缩，避免 SSE 事件被缓冲
          configure: (proxy) => {
            proxy.on('proxyRes', (proxyRes: IncomingMessage, _req: IncomingMessage, res: ServerResponse) => {
              // 移除 content-length，强制 chunked 传输
              delete proxyRes.headers['content-length']
              // 禁止 Nginx/CDN 缓冲
              proxyRes.headers['x-accel-buffering'] = 'no'
            })
          },
        },
        // 其他 API 走默认代理
        '/api': {
          //target,
          target: 'http://8.138.192.28:8080',
          changeOrigin: true,
        }
      }
    }
  }
})
