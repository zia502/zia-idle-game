// vitest.config.js
import { defineConfig } from 'vitest/config';

export default defineConfig({
  test: {
    environment: 'jsdom', // 使用 JSDOM 环境
    setupFiles: ['./test/setup.js'], // 加载我们的设置文件
    globals: true, // 确保 Vitest 全局 API 可用
  },
});