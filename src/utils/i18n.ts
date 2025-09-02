// 国际化配置
export const messages = {
  zh: {
    // 主界面
    title: 'FE工具箱',
    language: '语言',
    searchPlaceholder: '请输入关键词或二维码生成地址',

    // 工具模块
    tools: {
      colorPass: '颜色转换',
      dateConverter: '日期转换',
      imageCompressor: '图片压缩',
      jsonCtn: 'JSON工具',
      langTranslator: '语言翻译',
      postMan: 'API测试',
      qrCode: '二维码',
      svgEditor: 'SVG编辑器',
      unitCalculator: '单位换算',
      regexCtn: '正则工具',
      utilsCtn: '实用工具',
      mooCtn: 'Moo工具',
    },

    // 工具描述
    descriptions: {
      colorPass: '颜色格式转换工具',
      dateConverter: '时间戳与日期转换',
      imageCompressor: '在线图片压缩',
      jsonCtn: 'JSON格式化与验证',
      langTranslator: '多语言翻译工具',
      postMan: 'HTTP接口测试',
      qrCode: '二维码生成与解析',
      svgEditor: 'SVG在线编辑器',
      unitCalculator: '长度重量单位换算',
      regexCtn: '正则表达式测试',
      utilsCtn: '常用开发工具集',
      mooCtn: '特色功能工具',
    },

    // QRCode 组件
    qrcode: {
      title: '二维码生成器',
      inputPlaceholder: '请输入地址',
      generate: '更新',
      download: '下载二维码',
      downloadSvg: '下载SVG文件',
      clear: '清空',
      rightClickTip: '右键可保存二维码图片',
      saveImageTip: '*右键选中图片可保存二维码PNG图片',
    },

    // 图片压缩
    imageCompressor: {
      dragTip: '点击图标或拖拽图片至此处',
      formatTip: '(*.jpg/*.png/*.gif格式)',
      resetTip: '点击重置图片',
      compressRatio: '图片压缩比例(0~1, 默认1)',
      backHome: '返回主页',
    },

    // JSON工具
    jsonCtn: {
      title: 'JSON 转换工具',
      description: '为方便将js对象（object）转为可供KAmis编辑器处理的JSON对象。典型场景为ECharts官方配置转换',
      jsObject: 'JavaScript 对象',
      jsonResult: 'JSON 结果',
      backHome: '返回主页',
    },

    // SVG编辑器
    svgEditor: {
      title: 'SVG 编辑器/优化器',
      description: '帮助开发者调整 SVG 属性、减小文件大小，并生成优化后的代码',
      svgInput: 'SVG 输入',
      placeholder: '在此粘贴或输入SVG代码...',
      clearInput: '清空',
      loadExample: '加载示例',
      uploadSvg: '上传 SVG',
      optimize: '优化',
      copy: '复制',
      download: '下载',
      preview: '预览',
      originalSize: '原始大小',
      optimizedSize: '优化后大小',
      compressionRatio: '压缩比',
      backHome: '返回主页',
    },

    // 日期转换
    dateConverter: {
      title: '时间日期转换工具',
      description: '在Unix时间戳、ISO格式、本地时间等格式之间转换，支持时区转换和日期计算',
      inputTime: '输入时间',
      useCurrentTime: '使用当前时间',
    },

    // 单位换算
    unitCalculator: {
      title: 'rem/vw/px换算',
      pxPlaceholder: 'px单位',
      vwPlaceholder: 'vw单位,1rem=10vw',
      remPlaceholder: 'rem单位',
      remRatio: 'rem比例',
      remRatioPlaceholder: 'rem转换比例,默认1rem=75px',
      keepDigits: '保留位数',
      keepDigitsPlaceholder: '保留小数位数,默认2位',
    },

    // PostMan
    postman: {
      title: 'API 测试工具',
      urlPlaceholder: '请输入API地址',
      saveRequest: '保存请求',
      loadRequest: '加载请求',
    },

    // 正则工具
    regex: {
      filter: '筛选',
      test: '测试',
      inputTest: '请输入测试字符串',
      result: '结果',
    },

    // Moo CSS
    mooCss: {
      searchPlaceholder: '请输入模块或样式属性',
    },

    // 工具函数
    utils: {
      searchPlaceholder: '请输入方法名或模块名',
    },

    // 颜色转换
    colorPass: {
      title: '颜色转换工具',
      hexPlaceholder: 'HEX颜色值',
      rgbPlaceholder: 'RGB颜色值',
      hslPlaceholder: 'HSL颜色值',
      backHome: '返回主页',
    },

    // 通用
    common: {
      confirm: '确认',
      cancel: '取消',
      save: '保存',
      reset: '重置',
      copy: '复制',
      paste: '粘贴',
      clear: '清空',
      upload: '上传',
      download: '下载',
      preview: '预览',
      edit: '编辑',
      delete: '删除',
      search: '搜索',
      filter: '筛选',
      sort: '排序',
      refresh: '刷新',
      loading: '加载中...',
      success: '成功',
      error: '错误',
      warning: '警告',
      info: '信息',
      backHome: '返回主页',
    },
  },

  en: {
    // Main interface
    title: 'FE Toolbox',
    language: 'Language',
    searchPlaceholder: 'Enter keywords or QR code generation address',

    // Tool modules
    tools: {
      colorPass: 'Color Converter',
      dateConverter: 'Date Converter',
      imageCompressor: 'Image Compressor',
      jsonCtn: 'JSON Tools',
      langTranslator: 'Language Translator',
      postMan: 'API Tester',
      qrCode: 'QR Code',
      svgEditor: 'SVG Editor',
      unitCalculator: 'Unit Calculator',
      regexCtn: 'Regex Tools',
      utilsCtn: 'Utility Tools',
      mooCtn: 'Moo Tools',
    },

    // Tool descriptions
    descriptions: {
      colorPass: 'Color format conversion tool',
      dateConverter: 'Timestamp and date conversion',
      imageCompressor: 'Online image compression',
      jsonCtn: 'JSON formatting and validation',
      langTranslator: 'Multi-language translation tool',
      postMan: 'HTTP API testing',
      qrCode: 'QR code generation and parsing',
      svgEditor: 'Online SVG editor',
      unitCalculator: 'Length and weight unit conversion',
      regexCtn: 'Regular expression testing',
      utilsCtn: 'Common development tools',
      mooCtn: 'Featured tools',
    },

    // QRCode component
    qrcode: {
      title: 'QR Code Generator',
      inputPlaceholder: 'Enter address',
      generate: 'Update',
      download: 'Download QR Code',
      downloadSvg: 'Download SVG File',
      clear: 'Clear',
      rightClickTip: 'Right click to save QR code image',
      saveImageTip: '*Right click on image to save QR code PNG image',
    },

    // Image Compressor
    imageCompressor: {
      dragTip: 'Click icon or drag image here',
      formatTip: '(*.jpg/*.png/*.gif formats)',
      resetTip: 'Click to reset image',
      compressRatio: 'Image compression ratio (0~1, default 1)',
      backHome: 'Back to Home',
    },

    // JSON Tools
    jsonCtn: {
      title: 'JSON Conversion Tool',
      description: 'Convenient tool to convert JS objects to JSON objects for KAmis editor processing. Typical scenario: ECharts configuration conversion',
      jsObject: 'JavaScript Object',
      jsonResult: 'JSON Result',
      backHome: 'Back to Home',
    },

    // SVG Editor
    svgEditor: {
      title: 'SVG Editor/Optimizer',
      description: 'Help developers adjust SVG attributes, reduce file size, and generate optimized code',
      svgInput: 'SVG Input',
      placeholder: 'Paste or enter SVG code here...',
      clearInput: 'Clear',
      loadExample: 'Load Example',
      uploadSvg: 'Upload SVG',
      optimize: 'Optimize',
      copy: 'Copy',
      download: 'Download',
      preview: 'Preview',
      originalSize: 'Original Size',
      optimizedSize: 'Optimized Size',
      compressionRatio: 'Compression Ratio',
      backHome: 'Back to Home',
    },

    // Date Converter
    dateConverter: {
      title: 'Date Time Conversion Tool',
      description: 'Convert between Unix timestamp, ISO format, local time and other formats, supports timezone conversion and date calculation',
      inputTime: 'Input Time',
      useCurrentTime: 'Use Current Time',
    },

    // Unit Calculator
    unitCalculator: {
      title: 'rem/vw/px Converter',
      pxPlaceholder: 'px unit',
      vwPlaceholder: 'vw unit, 1rem=10vw',
      remPlaceholder: 'rem unit',
      remRatio: 'rem ratio',
      remRatioPlaceholder: 'rem conversion ratio, default 1rem=75px',
      keepDigits: 'decimal places',
      keepDigitsPlaceholder: 'keep decimal places, default 2',
    },

    // PostMan
    postman: {
      title: 'API Testing Tool',
      urlPlaceholder: 'Enter API URL',
      saveRequest: 'Save Request',
      loadRequest: 'Load Request',
    },

    // Regex Tools
    regex: {
      filter: 'Filter',
      test: 'Test',
      inputTest: 'Enter test string',
      result: 'Result',
    },

    // Moo CSS
    mooCss: {
      searchPlaceholder: 'Enter module or style property',
    },

    // Utils
    utils: {
      searchPlaceholder: 'Enter method name or module name',
    },

    // Color Pass
    colorPass: {
      title: 'Color Conversion Tool',
      hexPlaceholder: 'HEX color value',
      rgbPlaceholder: 'RGB color value',
      hslPlaceholder: 'HSL color value',
      backHome: 'Back to Home',
    },

    // Common
    common: {
      confirm: 'Confirm',
      cancel: 'Cancel',
      save: 'Save',
      reset: 'Reset',
      copy: 'Copy',
      paste: 'Paste',
      clear: 'Clear',
      upload: 'Upload',
      download: 'Download',
      preview: 'Preview',
      edit: 'Edit',
      delete: 'Delete',
      search: 'Search',
      filter: 'Filter',
      sort: 'Sort',
      refresh: 'Refresh',
      loading: 'Loading...',
      success: 'Success',
      error: 'Error',
      warning: 'Warning',
      info: 'Info',
      backHome: 'Back to Home',
    },
  },
};

// 语言管理类
export class LanguageManager {
  private currentLang: string;
  private listeners: Array<(lang: string) => void> = [];

  constructor() {
    this.currentLang = this.getStoredLanguage() || 'zh';
  }

  // 获取存储的语言设置
  getStoredLanguage(): string | null {
    return localStorage.getItem('fe-tools-language');
  }

  // 设置语言
  setLanguage(lang: string): void {
    if (messages[lang as keyof typeof messages]) {
      this.currentLang = lang;
      localStorage.setItem('fe-tools-language', lang);
      this.notifyListeners();
    }
  }

  // 获取当前语言
  getCurrentLanguage(): string {
    return this.currentLang;
  }

  // 获取翻译文本
  t(key: string): string {
    const keys = key.split('.');
    let value: any = messages[this.currentLang as keyof typeof messages];

    for (const k of keys) {
      if (value && typeof value === 'object') {
        value = value[k];
      } else {
        return key; // 如果找不到翻译，返回原key
      }
    }

    return value || key;
  }

  // 添加语言变化监听器
  addListener(callback: (lang: string) => void): void {
    this.listeners.push(callback);
  }

  // 移除语言变化监听器
  removeListener(callback: (lang: string) => void): void {
    const index = this.listeners.indexOf(callback);
    if (index > -1) {
      this.listeners.splice(index, 1);
    }
  }

  // 通知所有监听器
  private notifyListeners(): void {
    this.listeners.forEach(callback => callback(this.currentLang));
  }
}

// 创建全局实例
export const langManager = new LanguageManager();