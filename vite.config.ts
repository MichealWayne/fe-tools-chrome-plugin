/**
 * @author Wayne
 * @Date 2022-11-27 17:45:33
 * @LastEditTime 2023-07-09 14:12:40
 */
import { defineConfig } from 'vite';
import vue from '@vitejs/plugin-vue';
import * as path from 'path';

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
  plugins: [vue()],
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
