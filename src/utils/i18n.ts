import { ref } from 'vue';

// 国际化配置
export const messages = {
  zh: {
    languageOptions: {
      zh: '中文',
      en: 'English',
    },
    search: {
      qrCodeResult: '生成二维码',
      searchIn: '在{site}中搜索: <strong>{keywords}</strong>',
    },
    errors: {
      fetchLinksFailed: '链接信息获取失败',
    },
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
      pageScreenshot: '页面截图',
      postMan: 'API测试',
      qrCode: '二维码',
      svgEditor: 'SVG编辑器',
      unitCalculator: '单位换算',
      regexCtn: '正则工具',
      utilsCtn: '实用工具',
      mooCtn: 'Moo工具',
      linuxCommand: 'Linux命令',
    },

    // 工具描述
    descriptions: {
      colorPass: '颜色格式转换工具',
      dateConverter: '时间戳与日期转换',
      imageCompressor: '在线图片压缩',
      jsonCtn: 'JSON格式化与验证',
      langTranslator: '多语言翻译工具',
      pageScreenshot: '整页截图并保存',
      postMan: 'HTTP接口测试',
      qrCode: '二维码生成与解析',
      svgEditor: 'SVG在线编辑器',
      unitCalculator: '长度重量单位换算',
      regexCtn: '正则表达式测试',
      utilsCtn: '常用开发工具集',
      mooCtn: '特色功能工具',
      linuxCommand: 'Linux命令查询工具',
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
      messages: {
        convertFailed: '转换失败，请重试',
      },
    },

    // 页面截图
    pageScreenshot: {
      title: '页面截图',
      startCapture: '开始截图',
      selectNode: '选择节点截图',
      capturing: '截图中...',
      selecting: '等待选择...',
      selectingTip: '请在页面上点击需要截图的元素',
      previewTip: '截图预览',
      previewEmptyTitle: '暂无预览',
      previewEmptyDesc: '先开始截图，预览将显示在这里',
      saveToLocal: '保存到本地',
      retake: '重新截图',
      errorCapture: '截图失败，请重试',
      errorUnavailable: '当前页面无法截图',
      errorSelection: '未能选择元素',
    },

    // JSON工具
    jsonCtn: {
      title: 'JSON 转换工具',
      description:
        '为方便将js对象（object）转为可供KAmis编辑器处理的JSON对象。典型场景为ECharts官方配置转换',
      jsObject: 'JavaScript 对象',
      jsonResult: 'JSON 结果',
      inputPlaceholder: '在此输入js对象，如var obj = { a: 1 }',
      outputPlaceholder: '转换后的 JSON 将显示在这里',
      actions: {
        convert: '转换',
        reverse: '反向',
        copyToClipboard: '复制到剪贴板',
        copy: '复制',
        format: '格式 ▼',
        formatDefault: '默认格式',
        formatMinify: '压缩',
        formatIndent2: '缩进 2 空格',
        formatIndent4: '缩进 4 空格',
      },
      tips: {
        title: '使用提示：',
        item1: '支持标准 JavaScript 对象语法',
        item2: '支持 ECharts 配置对象转换',
        item3: '可以包含注释，转换时会自动忽略',
        item4: '反向转换可将 JSON 转回 JavaScript 对象格式',
      },
      messages: {
        parseFailed: '无法解析JavaScript对象',
        convertSuccess: '转换成功！',
        convertFailed: '转换失败：{message}',
        reverseSuccess: '反向转换成功！',
        reverseFailed: '反向转换失败：{message}',
        copySuccess: '已复制到剪贴板！',
        copyFailed: '复制失败，请手动复制',
        formatFailed: '格式化失败：{message}',
      },
      modal: {
        successTitle: '操作成功',
      },
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
      optionsTitle: '优化选项',
      options: {
        removeComments: '移除注释',
        removeEmptyAttrs: '移除空属性',
        removeEmptyText: '移除空文本',
        removeHiddenElems: '移除隐藏元素',
        removeMetadata: '移除元数据',
        removeUnusedNS: '移除未使用的命名空间',
        cleanupIDs: '清理 ID',
        convertColors: '优化颜色值',
        removeViewBox: '保留 viewBox',
      },
      actions: {
        optimizeSvg: '优化 SVG',
        preview: '预览',
        copy: '复制',
        download: '下载',
        close: '关闭',
      },
      outputTitle: '优化后的 SVG',
      outputPlaceholder: '优化后的 SVG 将显示在这里',
      stats: {
        originalSize: '原始大小',
        optimizedSize: '优化后',
        reduction: '减少',
      },
      previewTitle: 'SVG 预览',
      tips: {
        title: '使用提示：',
        item1: '直接输入 SVG 代码或上传 SVG 文件',
        item2: '选择需要的优化选项',
        item3: '点击\"优化 SVG\"按钮生成优化后的代码',
        item4: '使用\"预览\"按钮查看 SVG 效果',
        item5: '优化后可以复制代码或下载 SVG 文件',
      },
      messages: {
        inputRequired: '请输入 SVG 代码',
        parseError: 'SVG 解析错误: {message}',
        optimizeSuccess: 'SVG 优化成功！',
        optimizeFailed: '优化失败：{message}',
        copySuccess: '已复制到剪贴板！',
        copyFailed: '复制失败，请手动复制',
        downloadSuccess: 'SVG 文件已下载！',
      },
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
      inputTypes: {
        timestamp: 'Unix时间戳',
        iso: 'ISO格式',
        local: '本地时间',
        custom: '自定义格式',
      },
      placeholders: {
        timestampSeconds: 'Unix时间戳（秒）',
        iso: 'ISO格式 (YYYY-MM-DDTHH:mm:ss.sssZ)',
        customInput: '输入日期字符串',
        customFormat: '格式 (例如: YYYY-MM-DD HH:mm:ss)',
      },
      units: {
        seconds: '秒',
        milliseconds: '毫秒',
        minutes: '分钟',
        hours: '小时',
        days: '天',
        weeks: '周',
        months: '月',
        years: '年',
      },
      timezoneTitle: '时区设置',
      outputTitle: '转换结果',
      resultLabels: {
        timestampSeconds: 'Unix时间戳（秒）:',
        timestampMilliseconds: 'Unix时间戳（毫秒）:',
        iso: 'ISO格式:',
        local: '本地时间:',
        utc: 'UTC时间:',
        relative: '相对时间:',
        calculationResult: '计算结果:',
      },
      calculator: {
        title: '日期计算',
        label: '添加/减去:',
        add: '添加',
        subtract: '减去',
      },
      tips: {
        title: '使用提示：',
        item1: 'Unix时间戳是从1970年1月1日UTC开始计算的秒数',
        item2: 'ISO格式遵循国际标准，包含时区信息',
        item3: '时区转换会影响显示的本地时间',
        item4: '日期计算可用于计算未来或过去的日期',
      },
      messages: {
        invalidIso: '无效的ISO日期格式',
        invalidDate: '无效的日期格式',
        convertFailed: '转换失败：{message}',
        calculateRequired: '请先输入有效的日期和计算值',
        calculateFailed: '计算失败：{message}',
        copySuccess: '已复制到剪贴板！',
        copyFailed: '复制失败：{message}',
      },
      modal: {
        successTitle: '操作成功',
      },
      timezones: {
        asiaShanghai: '中国标准时间 (UTC+8)',
        asiaTokyo: '日本标准时间 (UTC+9)',
        europeLondon: '英国标准时间 (UTC+0/+1)',
        europeParis: '中欧标准时间 (UTC+1/+2)',
        americaNewYork: '美国东部时间 (UTC-5/-4)',
        americaLosAngeles: '美国太平洋时间 (UTC-8/-7)',
        utc: '协调世界时 (UTC)',
      },
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
      labels: {
        hex: 'HEX',
        rgb: 'RGB',
        hsb: 'HSB',
        hsl: 'HSL',
      },
      hexPlaceholder: 'HEX颜色值',
      rgbPlaceholder: 'RGB颜色值',
      hslPlaceholder: 'HSL颜色值',
      backHome: '返回主页',
      remarks: {
        title: '注：',
        rgb: 'RGB：通过对红(R)、绿(G)、蓝(B)三个颜色通道的变化以及它们相互之间的叠加来得到各式各样的颜色的。',
        hex: 'HEX：16进制颜色码，将对应RGB10进制数转化成16进制。',
        hsb: 'HSB：又称HSV，在HSB模式中，H(hues)表示色相，S(saturation)表示饱和度，B（brightness）表示亮度。',
        hsl: 'HSL：在HSL模式中，H(hues)表示色相，S(saturation)表示饱和度，L(luminance)表示亮度。',
      },
    },

    // Linux命令查询
    linuxCommand: {
      title: 'Linux命令查询工具',
      inputPlaceholder: '请输入Linux命令名称',
      syntax: '语法',
      examples: '示例',
      commonOptions: '常用选项',
      commonCommands: '常用命令',
      noResults: '未找到相关命令',
      viewDetails: '查看详情',
      backHome: '返回主页',
    },

    // PostMan
    postman: {
      title: 'API 测试工具',
      urlPlaceholder: '请输入API地址',
      saveRequest: '保存请求',
      loadRequest: '加载请求',
      actions: {
        send: '发送',
        sending: '请求中...',
        add: '添加',
        remove: '移除',
        clear: '清空',
        copyResponse: '复制响应',
        fullscreen: '全屏',
        exitFullscreen: '退出全屏',
        formatJson: '格式化 JSON',
        addField: '添加字段',
      },
      requestTabs: {
        headers: '请求头',
        body: '请求体',
        auth: '认证',
      },
      responseTabs: {
        body: '响应体',
        headers: '响应头',
        cookies: 'Cookies',
      },
      auth: {
        typeLabel: '认证类型：',
        none: '无认证',
        bearer: 'Bearer Token',
        basic: 'Basic Auth',
        apiKey: 'API Key',
        bearerPlaceholder: '输入 Bearer Token',
        usernamePlaceholder: '用户名',
        passwordPlaceholder: '密码',
        apiKeyNamePlaceholder: 'API Key 名称',
        apiKeyValuePlaceholder: 'API Key 值',
        addToHeader: 'Header',
        addToQuery: 'Query Parameter',
        noAuthInfo: '当前请求不使用任何认证方式',
      },
      headers: {
        title: '请求头',
        add: '添加',
        headerKey: 'Header Key',
        headerValue: 'Header Value',
      },
      body: {
        title: '请求体',
        types: {
          none: 'None',
          json: 'JSON',
          formData: 'Form Data',
          xForm: 'x-www-form-urlencoded',
          raw: 'Raw',
        },
        jsonPlaceholder: '输入 JSON 数据',
        rawPlaceholder: '输入原始数据',
        formKey: 'Key',
        formValue: 'Value',
        jsonFormatError: 'JSON 格式错误',
      },
      history: {
        title: '请求历史',
        empty: '暂无请求历史',
        clearConfirm: '确定要清空所有请求历史吗？',
        justNow: '刚刚',
        minutesAgo: '{minutes}分钟前',
        hoursAgo: '{hours}小时前',
      },
      response: {
        noResponse: '暂无响应数据',
        formatting: '格式化中...',
        noCookies: '没有 Cookies',
      },
      environments: {
        title: '环境变量',
        selectEnv: '选择环境',
        addEnv: '新建环境',
        noEnvSelected: '请选择或创建一个环境',
        envTitle: '{env} 环境变量',
        addVariable: '添加变量',
        variableName: '变量名',
        variableValue: '变量值',
        variableDesc: '描述（可选）',
        export: '导出',
        import: '导入',
        deleteEnv: '删除环境',
        newEnvTitle: '新建环境',
        envNamePlaceholder: '环境名称',
        importTitle: '导入环境变量',
        importPlaceholder: '粘贴 JSON 格式的环境变量数据',
        cancel: '取消',
        confirm: '创建',
        importConfirm: '导入',
        deleteConfirm: '确定要删除环境 \"{env}\" 吗？',
        invalidEnvData: '无效的环境数据格式',
        envExistsConfirm: '环境 \"{env}\" 已存在，是否覆盖？',
        importFailed: '导入失败：{message}',
      },
      request: {
        missingUrl: '请输入请求 URL',
        networkError: '网络错误：无法连接到服务器',
        requestError: '请求错误：{message}',
        unknownError: '未知错误：{message}',
        loadFailed: '加载失败：文件格式错误',
      },
    },

    // 通用
    common: {
      confirm: '确认',
      ok: '确定',
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
      collapse: '收起',
      backHome: '返回主页',
    },
  },

  en: {
    languageOptions: {
      zh: 'Chinese',
      en: 'English',
    },
    search: {
      qrCodeResult: 'Generate QR Code',
      searchIn: 'Search in {site}: <strong>{keywords}</strong>',
    },
    errors: {
      fetchLinksFailed: 'Failed to fetch link information',
    },
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
      pageScreenshot: 'Page Screenshot',
      postMan: 'API Tester',
      qrCode: 'QR Code',
      svgEditor: 'SVG Editor',
      unitCalculator: 'Unit Calculator',
      regexCtn: 'Regex Tools',
      utilsCtn: 'Utility Tools',
      mooCtn: 'Moo Tools',
      linuxCommand: 'Linux Commands',
    },

    // Tool descriptions
    descriptions: {
      colorPass: 'Color format conversion tool',
      dateConverter: 'Timestamp and date conversion',
      imageCompressor: 'Online image compression',
      jsonCtn: 'JSON formatting and validation',
      langTranslator: 'Multi-language translation tool',
      pageScreenshot: 'Full-page capture and save',
      postMan: 'HTTP API testing',
      qrCode: 'QR code generation and parsing',
      svgEditor: 'Online SVG editor',
      unitCalculator: 'Length and weight unit conversion',
      regexCtn: 'Regular expression testing',
      utilsCtn: 'Common development tools',
      mooCtn: 'Featured tools',
      linuxCommand: 'Linux command reference tool',
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
      messages: {
        convertFailed: 'Conversion failed. Please try again.',
      },
    },

    // Page screenshot
    pageScreenshot: {
      title: 'Page Screenshot',
      startCapture: 'Start Capture',
      selectNode: 'Select Node Screenshot',
      capturing: 'Capturing...',
      selecting: 'Waiting for selection...',
      selectingTip: 'Click an element on the page to capture',
      previewTip: 'Preview',
      previewEmptyTitle: 'No preview yet',
      previewEmptyDesc: 'Start a capture to see it here.',
      saveToLocal: 'Save to Local',
      retake: 'Retake',
      errorCapture: 'Capture failed, please retry',
      errorUnavailable: 'Capture is unavailable on this page',
      errorSelection: 'Failed to select element',
    },

    // JSON Tools
    jsonCtn: {
      title: 'JSON Conversion Tool',
      description:
        'Convenient tool to convert JS objects to JSON objects for KAmis editor processing. Typical scenario: ECharts configuration conversion',
      jsObject: 'JavaScript Object',
      jsonResult: 'JSON Result',
      inputPlaceholder: 'Enter JS object here, e.g., var obj = { a: 1 }',
      outputPlaceholder: 'Converted JSON will appear here',
      actions: {
        convert: 'Convert',
        reverse: 'Reverse',
        copyToClipboard: 'Copy to clipboard',
        copy: 'Copy',
        format: 'Format ▼',
        formatDefault: 'Default',
        formatMinify: 'Minify',
        formatIndent2: 'Indent 2 spaces',
        formatIndent4: 'Indent 4 spaces',
      },
      tips: {
        title: 'Tips:',
        item1: 'Supports standard JavaScript object syntax',
        item2: 'Supports ECharts config conversion',
        item3: 'Comments are supported and ignored during conversion',
        item4: 'Reverse converts JSON back to JavaScript object format',
      },
      messages: {
        parseFailed: 'Unable to parse JavaScript object',
        convertSuccess: 'Conversion succeeded!',
        convertFailed: 'Conversion failed: {message}',
        reverseSuccess: 'Reverse conversion succeeded!',
        reverseFailed: 'Reverse conversion failed: {message}',
        copySuccess: 'Copied to clipboard!',
        copyFailed: 'Copy failed. Please copy manually.',
        formatFailed: 'Format failed: {message}',
      },
      modal: {
        successTitle: 'Success',
      },
      backHome: 'Back to Home',
    },

    // SVG Editor
    svgEditor: {
      title: 'SVG Editor/Optimizer',
      description:
        'Help developers adjust SVG attributes, reduce file size, and generate optimized code',
      svgInput: 'SVG Input',
      placeholder: 'Paste or enter SVG code here...',
      clearInput: 'Clear',
      loadExample: 'Load Example',
      uploadSvg: 'Upload SVG',
      optimize: 'Optimize',
      copy: 'Copy',
      download: 'Download',
      preview: 'Preview',
      optionsTitle: 'Optimization Options',
      options: {
        removeComments: 'Remove comments',
        removeEmptyAttrs: 'Remove empty attributes',
        removeEmptyText: 'Remove empty text',
        removeHiddenElems: 'Remove hidden elements',
        removeMetadata: 'Remove metadata',
        removeUnusedNS: 'Remove unused namespaces',
        cleanupIDs: 'Cleanup IDs',
        convertColors: 'Optimize colors',
        removeViewBox: 'Keep viewBox',
      },
      actions: {
        optimizeSvg: 'Optimize SVG',
        preview: 'Preview',
        copy: 'Copy',
        download: 'Download',
        close: 'Close',
      },
      outputTitle: 'Optimized SVG',
      outputPlaceholder: 'Optimized SVG will appear here',
      stats: {
        originalSize: 'Original size',
        optimizedSize: 'Optimized',
        reduction: 'Reduced',
      },
      previewTitle: 'SVG Preview',
      tips: {
        title: 'Tips:',
        item1: 'Paste SVG code or upload an SVG file',
        item2: 'Select optimization options',
        item3: 'Click \"Optimize SVG\" to generate optimized code',
        item4: 'Use \"Preview\" to check SVG rendering',
        item5: 'Copy or download the optimized SVG file',
      },
      messages: {
        inputRequired: 'Please enter SVG code',
        parseError: 'SVG parse error: {message}',
        optimizeSuccess: 'SVG optimized successfully!',
        optimizeFailed: 'Optimization failed: {message}',
        copySuccess: 'Copied to clipboard!',
        copyFailed: 'Copy failed. Please copy manually.',
        downloadSuccess: 'SVG file downloaded!',
      },
      originalSize: 'Original Size',
      optimizedSize: 'Optimized Size',
      compressionRatio: 'Compression Ratio',
      backHome: 'Back to Home',
    },

    // Date Converter
    dateConverter: {
      title: 'Date Time Conversion Tool',
      description:
        'Convert between Unix timestamp, ISO format, local time and other formats, supports timezone conversion and date calculation',
      inputTime: 'Input Time',
      useCurrentTime: 'Use Current Time',
      inputTypes: {
        timestamp: 'Unix Timestamp',
        iso: 'ISO Format',
        local: 'Local Time',
        custom: 'Custom Format',
      },
      placeholders: {
        timestampSeconds: 'Unix timestamp (seconds)',
        iso: 'ISO format (YYYY-MM-DDTHH:mm:ss.sssZ)',
        customInput: 'Enter date string',
        customFormat: 'Format (e.g., YYYY-MM-DD HH:mm:ss)',
      },
      units: {
        seconds: 'Seconds',
        milliseconds: 'Milliseconds',
        minutes: 'Minutes',
        hours: 'Hours',
        days: 'Days',
        weeks: 'Weeks',
        months: 'Months',
        years: 'Years',
      },
      timezoneTitle: 'Timezone',
      outputTitle: 'Results',
      resultLabels: {
        timestampSeconds: 'Unix timestamp (seconds):',
        timestampMilliseconds: 'Unix timestamp (milliseconds):',
        iso: 'ISO format:',
        local: 'Local time:',
        utc: 'UTC time:',
        relative: 'Relative time:',
        calculationResult: 'Calculation result:',
      },
      calculator: {
        title: 'Date Calculator',
        label: 'Add/Subtract:',
        add: 'Add',
        subtract: 'Subtract',
      },
      tips: {
        title: 'Tips:',
        item1: 'Unix timestamp counts seconds since 1970-01-01 UTC',
        item2: 'ISO format follows international standards with timezone info',
        item3: 'Timezone conversion affects local time display',
        item4: 'Date calculator can compute future or past dates',
      },
      messages: {
        invalidIso: 'Invalid ISO date format',
        invalidDate: 'Invalid date format',
        convertFailed: 'Conversion failed: {message}',
        calculateRequired: 'Please enter a valid date and value first',
        calculateFailed: 'Calculation failed: {message}',
        copySuccess: 'Copied to clipboard!',
        copyFailed: 'Copy failed: {message}',
      },
      modal: {
        successTitle: 'Success',
      },
      timezones: {
        asiaShanghai: 'China Standard Time (UTC+8)',
        asiaTokyo: 'Japan Standard Time (UTC+9)',
        europeLondon: 'UK Time (UTC+0/+1)',
        europeParis: 'Central Europe Time (UTC+1/+2)',
        americaNewYork: 'US Eastern Time (UTC-5/-4)',
        americaLosAngeles: 'US Pacific Time (UTC-8/-7)',
        utc: 'Coordinated Universal Time (UTC)',
      },
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
      labels: {
        hex: 'HEX',
        rgb: 'RGB',
        hsb: 'HSB',
        hsl: 'HSL',
      },
      hexPlaceholder: 'HEX color value',
      rgbPlaceholder: 'RGB color value',
      hslPlaceholder: 'HSL color value',
      backHome: 'Back to Home',
      remarks: {
        title: 'Note:',
        rgb: 'RGB: Colors are formed by combining red (R), green (G), and blue (B) channels.',
        hex: 'HEX: 16-bit color code converted from RGB decimal values.',
        hsb: 'HSB (HSV): H is hue, S is saturation, B is brightness.',
        hsl: 'HSL: H is hue, S is saturation, L is luminance.',
      },
    },

    // Linux Command
    linuxCommand: {
      title: 'Linux Command Reference Tool',
      inputPlaceholder: 'Enter Linux command name',
      syntax: 'Syntax',
      examples: 'Examples',
      commonOptions: 'Common Options',
      commonCommands: 'Common Commands',
      noResults: 'No commands found',
      viewDetails: 'View Details',
      backHome: 'Back to Home',
    },

    // PostMan
    postman: {
      title: 'API Testing Tool',
      urlPlaceholder: 'Enter API URL',
      saveRequest: 'Save Request',
      loadRequest: 'Load Request',
      actions: {
        send: 'Send',
        sending: 'Sending...',
        add: 'Add',
        remove: 'Remove',
        clear: 'Clear',
        copyResponse: 'Copy Response',
        fullscreen: 'Fullscreen',
        exitFullscreen: 'Exit Fullscreen',
        formatJson: 'Format JSON',
        addField: 'Add Field',
      },
      requestTabs: {
        headers: 'Headers',
        body: 'Body',
        auth: 'Auth',
      },
      responseTabs: {
        body: 'Response Body',
        headers: 'Response Headers',
        cookies: 'Cookies',
      },
      auth: {
        typeLabel: 'Auth Type:',
        none: 'No Auth',
        bearer: 'Bearer Token',
        basic: 'Basic Auth',
        apiKey: 'API Key',
        bearerPlaceholder: 'Enter Bearer Token',
        usernamePlaceholder: 'Username',
        passwordPlaceholder: 'Password',
        apiKeyNamePlaceholder: 'API Key Name',
        apiKeyValuePlaceholder: 'API Key Value',
        addToHeader: 'Header',
        addToQuery: 'Query Parameter',
        noAuthInfo: 'This request does not use authentication',
      },
      headers: {
        title: 'Headers',
        add: 'Add',
        headerKey: 'Header Key',
        headerValue: 'Header Value',
      },
      body: {
        title: 'Body',
        types: {
          none: 'None',
          json: 'JSON',
          formData: 'Form Data',
          xForm: 'x-www-form-urlencoded',
          raw: 'Raw',
        },
        jsonPlaceholder: 'Enter JSON data',
        rawPlaceholder: 'Enter raw data',
        formKey: 'Key',
        formValue: 'Value',
        jsonFormatError: 'Invalid JSON format',
      },
      history: {
        title: 'Request History',
        empty: 'No request history',
        clearConfirm: 'Clear all request history?',
        justNow: 'Just now',
        minutesAgo: '{minutes} min ago',
        hoursAgo: '{hours} hr ago',
      },
      response: {
        noResponse: 'No response data',
        formatting: 'Formatting...',
        noCookies: 'No Cookies',
      },
      environments: {
        title: 'Environments',
        selectEnv: 'Select Environment',
        addEnv: 'New Environment',
        noEnvSelected: 'Please select or create an environment',
        envTitle: '{env} variables',
        addVariable: 'Add Variable',
        variableName: 'Variable Name',
        variableValue: 'Variable Value',
        variableDesc: 'Description (optional)',
        export: 'Export',
        import: 'Import',
        deleteEnv: 'Delete Environment',
        newEnvTitle: 'New Environment',
        envNamePlaceholder: 'Environment name',
        importTitle: 'Import Environment Variables',
        importPlaceholder: 'Paste JSON environment variable data',
        cancel: 'Cancel',
        confirm: 'Create',
        importConfirm: 'Import',
        deleteConfirm: 'Delete environment \"{env}\"?',
        invalidEnvData: 'Invalid environment data format',
        envExistsConfirm: 'Environment \"{env}\" already exists. Overwrite?',
        importFailed: 'Import failed: {message}',
      },
      request: {
        missingUrl: 'Please enter request URL',
        networkError: 'Network error: unable to reach server',
        requestError: 'Request error: {message}',
        unknownError: 'Unknown error: {message}',
        loadFailed: 'Load failed: invalid file format',
      },
    },

    // Common
    common: {
      confirm: 'Confirm',
      ok: 'OK',
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
      collapse: 'Collapse',
      backHome: 'Back to Home',
    },
  },
};

// 语言管理类
export class LanguageManager {
  private currentLang: string;
  private currentLangRef;
  private listeners: Array<(lang: string) => void> = [];

  constructor() {
    this.currentLang = this.getStoredLanguage() || 'zh';
    this.currentLangRef = ref(this.currentLang);
  }

  // 获取存储的语言设置
  getStoredLanguage(): string | null {
    return localStorage.getItem('fe-tools-language');
  }

  // 设置语言
  setLanguage(lang: string): void {
    if (messages[lang as keyof typeof messages]) {
      this.currentLang = lang;
      this.currentLangRef.value = lang;
      localStorage.setItem('fe-tools-language', lang);
      this.notifyListeners();
    }
  }

  // 获取当前语言
  getCurrentLanguage(): string {
    return this.currentLangRef.value;
  }

  // 获取翻译文本
  t(key: string, params?: Record<string, string | number>): string {
    const keys = key.split('.');
    const currentLang = this.currentLangRef.value;
    let value: any = messages[currentLang as keyof typeof messages];

    for (const k of keys) {
      if (value && typeof value === 'object') {
        value = value[k];
      } else {
        return key; // 如果找不到翻译，返回原key
      }
    }

    if (typeof value !== 'string') {
      return key;
    }

    if (!params) {
      return value || key;
    }

    return value.replace(/\{(\w+)\}/g, (_, name) => String(params[name] ?? `{${name}}`));
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
