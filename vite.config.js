import { defineConfig } from 'vite'
import uni from '@dcloudio/vite-plugin-uni'

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [
    uni(),
  ],
  build: {
    // 开发时禁用代码压缩，方便调试
    minify: false,
    // 生成 sourcemap
    sourcemap: true
  }
})
