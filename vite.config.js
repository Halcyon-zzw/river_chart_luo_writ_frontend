import { defineConfig } from 'vite'
import uni from '@dcloudio/vite-plugin-uni'

// https://vitejs.dev/config/
export default defineConfig(({ mode }) => {
  const isProduction = mode === 'production'

  return {
    plugins: [
      uni(),
    ],
    build: {
      // 生产环境启用代码压缩，开发环境禁用
      minify: isProduction ? 'esbuild' : false,
      // 开发环境生成 sourcemap 便于调试，生产环境禁用
      sourcemap: !isProduction,
      // esbuild 压缩选项（生产环境）
      esbuildOptions: isProduction ? {
        drop: ['console', 'debugger'], // 移除 console 和 debugger
      } : {}
    }
  }
})
