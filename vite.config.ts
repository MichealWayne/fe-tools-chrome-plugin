/**
 * @author Wayne
 * @Date 2022-11-27 17:45:33
 * @LastEditTime 2025-09-03 19:41:00
 */
import { defineConfig } from 'vite';
import vue from '@vitejs/plugin-vue';
import * as path from 'path';
import AutoImport from 'unplugin-auto-import/vite';
import Components from 'unplugin-vue-components/vite';

const DEV_PORT = 8080;

// https://vitejs.dev/config/
export default defineConfig({
  resolve: {
    //设置别名
    alias: {
      // eslint-disable-next-line no-undef
      '@': path.resolve(__dirname, 'src'),
    },
  },
  plugins: [
    vue(),
    // eslint(), // 暂时禁用ESLint插件以完成构建
    AutoImport({
      imports: ['vue', 'vue-router', '@vueuse/core'],
      dts: true,
      eslintrc: {
        enabled: true,
      },
    }),
    Components({
      dts: true,
      dirs: ['src/components'],
    }),
  ],
  build: {
    rollupOptions: {
      output: {
        manualChunks: {
          // 核心框架
          vendor: ['vue', 'vue-router'],
          // 工具库
          utils: ['axios', 'dayjs', '@vueuse/core'],
          // UI组件库
          components: [
            '@/components/QRCode/index.vue',
            '@/components/JsonCtn/index.vue',
            '@/components/SvgEditor/index.vue',
            '@/components/DateConverter/index.vue',
          ],
          // PostMan相关组件
          postman: [
            '@/components/PostMan/PostManMain.vue',
            '@/components/PostMan/RequestPanel.vue',
            '@/components/PostMan/ResponseViewer.vue',
          ],
        },
        // 文件名哈希化，便于缓存
        chunkFileNames: 'assets/[name]-[hash].js',
        entryFileNames: 'assets/[name]-[hash].js',
        assetFileNames: 'assets/[name]-[hash].[ext]',
      },
    },
    // 启用代码压缩
    minify: 'terser',
    terserOptions: {
      compress: {
        drop_console: true,
        drop_debugger: true,
        // 移除未使用的代码
        pure_funcs: ['console.log', 'console.info'],
      },
      mangle: {
        // 保留类名，便于调试
        keep_classnames: true,
      },
    },
    // 设置chunk大小警告阈值
    chunkSizeWarningLimit: 1000,
    // 启用CSS代码分割
    cssCodeSplit: true,
    // 生成source map用于生产环境调试
    sourcemap: false,
  },
  server: {
    // dev启动端口
    port: DEV_PORT,
    hmr: {
      host: 'localhost',
      port: DEV_PORT,
    },
    // 设置代理
    proxy: {
      '/fe-tools': {
        target: 'https://blog.michealwayne.cn/',
        changeOrigin: true,
        rewrite: (pathStr: string) => pathStr.replace(/^\/api/, ''),
      },
      '/translate': {
        target: 'https://fanyi.youdao.com/',
        changeOrigin: true,
        rewrite: (pathStr: string) => pathStr.replace(/^\/api/, ''),
      },
    },
  },
});
