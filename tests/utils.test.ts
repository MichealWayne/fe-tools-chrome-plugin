import { describe, it, expect, vi, beforeEach } from 'vitest';

// 简单的工具函数测试
describe('Utils Functions', () => {
  beforeEach(() => {
    // 重置 window.location mock
    Object.defineProperty(window, 'location', {
      value: {
        search: '',
        href: 'http://localhost:3000',
      },
      writable: true,
    });
  });

  describe('getUrlParam', () => {
    // Mock getUrlParam function for testing
    const getUrlParam = (key: string, options?: { defaultValue?: string }) => {
      const urlParams = new URLSearchParams(window.location.search);
      const value = urlParams.get(key);
      return value || options?.defaultValue || null;
    };

    it('should return parameter value from URL', () => {
      window.location.search = '?name=test&age=25';

      expect(getUrlParam('name')).toBe('test');
      expect(getUrlParam('age')).toBe('25');
    });

    it('should return null for non-existent parameter', () => {
      window.location.search = '?name=test';

      expect(getUrlParam('age')).toBeNull();
    });

    it('should return default value when parameter not found', () => {
      window.location.search = '?name=test';

      expect(getUrlParam('age', { defaultValue: '0' })).toBe('0');
    });

    it('should handle empty search string', () => {
      window.location.search = '';

      expect(getUrlParam('name')).toBeNull();
      expect(getUrlParam('name', { defaultValue: 'default' })).toBe('default');
    });
  });

  describe('Color Utils', () => {
    // Mock color conversion functions
    const hexToRgb = (hex: string) => {
      const result = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex);
      return result
        ? {
            r: parseInt(result[1], 16),
            g: parseInt(result[2], 16),
            b: parseInt(result[3], 16),
          }
        : null;
    };

    const rgbToHex = (r: number, g: number, b: number) => {
      return (
        '#' +
        [r, g, b]
          .map(x => {
            const hex = x.toString(16);
            return hex.length === 1 ? '0' + hex : hex;
          })
          .join('')
      );
    };

    it('should convert hex to rgb', () => {
      expect(hexToRgb('#ff0000')).toEqual({ r: 255, g: 0, b: 0 });
      expect(hexToRgb('#00ff00')).toEqual({ r: 0, g: 255, b: 0 });
      expect(hexToRgb('#0000ff')).toEqual({ r: 0, g: 0, b: 255 });
    });

    it('should convert rgb to hex', () => {
      expect(rgbToHex(255, 0, 0)).toBe('#ff0000');
      expect(rgbToHex(0, 255, 0)).toBe('#00ff00');
      expect(rgbToHex(0, 0, 255)).toBe('#0000ff');
    });

    it('should handle invalid hex values', () => {
      expect(hexToRgb('invalid')).toBeNull();
      expect(hexToRgb('')).toBeNull();
    });
  });

  describe('JSON Utils', () => {
    const formatJson = (jsonString: string, indent: number = 2) => {
      try {
        const parsed = JSON.parse(jsonString);
        return JSON.stringify(parsed, null, indent);
      } catch (error) {
        throw new Error('Invalid JSON');
      }
    };

    const validateJson = (jsonString: string) => {
      try {
        JSON.parse(jsonString);
        return { isValid: true, error: null };
      } catch (error) {
        return {
          isValid: false,
          error: error instanceof Error ? error.message : 'Unknown error',
        };
      }
    };

    it('should format valid JSON', () => {
      const input = '{"name":"test","age":25}';
      const expected = '{\n  "name": "test",\n  "age": 25\n}';

      expect(formatJson(input)).toBe(expected);
    });

    it('should validate JSON correctly', () => {
      expect(validateJson('{"name":"test"}')).toEqual({ isValid: true, error: null });
      expect(validateJson('invalid json')).toEqual({
        isValid: false,
        error: expect.any(String),
      });
    });

    it('should handle empty JSON', () => {
      expect(validateJson('{}')).toEqual({ isValid: true, error: null });
      expect(formatJson('{}')).toBe('{}');
    });
  });

  describe('Date Utils', () => {
    const formatTimestamp = (timestamp: number) => {
      return new Date(timestamp).toISOString();
    };

    const getCurrentTimestamp = () => {
      return Date.now();
    };

    it('should format timestamp correctly', () => {
      const timestamp = 1609459200000; // 2021-01-01 00:00:00 UTC
      expect(formatTimestamp(timestamp)).toBe('2021-01-01T00:00:00.000Z');
    });

    it('should get current timestamp', () => {
      const now = getCurrentTimestamp();
      expect(typeof now).toBe('number');
      expect(now).toBeGreaterThan(0);
    });
  });
});
