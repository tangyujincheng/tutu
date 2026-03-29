import { describe, beforeEach, afterEach, it, expect } from 'vitest';

// 允许的控制台消息列表（不会导致测试失败）
const ALLOWED_MESSAGES = [
  /getScreenById is deprecated/, // 上游依赖废弃警告
  /DeprecationWarning/, // 通用废弃警告
];

describe('Backend Application', () => {
  let originalConsoleError;
  let originalConsoleWarn;
  let errors = [];
  let warnings = [];

  // 在每个测试前清空调试台并拦截输出
  beforeEach(() => {
    // 清空之前的日志
    errors = [];
    warnings = [];

    // 保存原始控制台方法
    originalConsoleError = console.error;
    originalConsoleWarn = console.warn;

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
  });

  // 测试后恢复原始控制台并检查是否有未允许的错误
  afterEach(() => {
    // 恢复原始控制台方法
    console.error = originalConsoleError;
    console.warn = originalConsoleWarn;

    // 如果有未允许的错误或警告，测试失败
    expect(errors).toHaveLength(0);
    expect(warnings).toHaveLength(0);
  });

  it('should import backend modules without errors', () => {
    // 测试导入各个后端模块
    const cryptoUtils = require('../backend/utils/crypto');
    expect(cryptoUtils).toBeDefined();
    expect(cryptoUtils.encrypt).toBeDefined();
    expect(cryptoUtils.decrypt).toBeDefined();
  });
});
