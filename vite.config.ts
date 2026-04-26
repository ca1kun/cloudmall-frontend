import { fileURLToPath, URL } from 'node:url'

import { defineConfig } from 'vite'
import vue from '@vitejs/plugin-vue'
import { viteMockServe } from 'vite-plugin-mock'
import vueDevTools from 'vite-plugin-vue-devtools'
import { tr } from 'element-plus/es/locales.mjs'

// https://vite.dev/config/
export default defineConfig({
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
  },  server: {
    port: 5174, // 前端开发端口
    proxy: {
      // 🌟 统一代理：所有以 /api 开头的请求，全部发给网关 (8080)
      '/api': {
        target: 'http://http://8.163.24.216',
        changeOrigin: true,
      }
    }
  }
})
