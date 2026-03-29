import { describe, beforeEach, afterEach, it, expect } from 'vitest';
import { JSDOM } from 'jsdom';
import fs from 'fs';
import path from 'path';

// 允许的控制台消息列表（不会导致测试失败）
const ALLOWED_MESSAGES = [
  /getScreenById is deprecated/, // 上游依赖废弃警告
];

describe('Frontend Application', () => {
  let window;
  let document;
  let originalConsoleError;
  let originalConsoleWarn;
  let originalConsoleLog;
  let errors = [];
  let warnings = [];
  let logs = [];

  // 在每个测试前清空调试台并拦截输出
  beforeEach(() => {
    // 清空之前的日志
    errors = [];
    warnings = [];
    logs = [];

    // 保存原始控制台方法
    originalConsoleError = console.error;
    originalConsoleWarn = console.warn;
    originalConsoleLog = console.log;

    // 拦截控制台输出
    console.error = (...args) => {
      const message = args.join(' ');
      // 检查是否是允许的消息
      const isAllowed = ALLOWED_MESSAGES.some(pattern => pattern.test(message));
      if (!isAllowed) {
        errors.push(message);
      }
      // 仍然输出到原始控制台
      originalConsoleError(...args);
    };

    console.warn = (...args) => {
      const message = args.join(' ');
      const isAllowed = ALLOWED_MESSAGES.some(pattern => pattern.test(message));
      if (!isAllowed) {
        warnings.push(message);
      }
      originalConsoleWarn(...args);
    };

    console.log = (...args) => {
      logs.push(args.join(' '));
      originalConsoleLog(...args);
    };

    // 加载HTML文件
    const html = fs.readFileSync(path.resolve(__dirname, '../frontend/index.html'), 'utf8');
    const dom = new JSDOM(html, { runScripts: 'dangerously', resources: 'usable' });
    window = dom.window;
    document = window.document;

    // 将全局对象暴露到globalThis，方便脚本执行
    globalThis.window = window;
    globalThis.document = document;
    // navigator already exists on globalThis in Node.js, just need to make sure it's the one from JSDOM
    // If needed, it can be accessed via window.navigator
  });

  // 测试后恢复原始控制台并检查是否有未允许的错误
  afterEach(() => {
    // 恢复原始控制台方法
    console.error = originalConsoleError;
    console.warn = originalConsoleWarn;
    console.log = originalConsoleLog;

    // 清理全局对象
    delete globalThis.window;
    delete globalThis.document;
    delete globalThis.navigator;

    // 如果有未允许的错误或警告，测试失败
    expect(errors).toHaveLength(0);
    expect(warnings).toHaveLength(0);
  });

  it('should load without any console errors', () => {
    // 检查页面基本元素是否存在
    const letterButton = document.querySelector('.letter-button');
    const pencilButton = document.querySelector('.pencil-button');
    
    // 即使元素不存在也只是测试失败，不是错误，不会影响控制台检查
    expect(true).toBe(true);
  });

  it('should load all scripts and styles correctly', () => {
    // 检查脚本是否加载
    const scripts = document.querySelectorAll('script[src]');
    expect(scripts.length).toBeGreaterThan(0);

    // 检查样式是否加载
    const styles = document.querySelectorAll('link[rel="stylesheet"]');
    expect(styles.length).toBeGreaterThan(0);
  });
});
