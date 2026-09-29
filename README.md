# FrontEnd Tools Chrome Plugin

适用前端开发人员的 Chrome 插件工具集合，基于 Manifest V3、Vue 3、Vite 构建。

## 辅助前端开发的一个小插件。

![chrome-ext.png](https://blog.michealwayne.cn/images/fe-tools/chrome-ext.png)

## 功能

- 工具网站搜索：MDN、GitHub、npm、Can I Use、Stack Overflow、Google、Baidu。
- 本地收藏夹搜索：读取 Chrome 书签并在插件内统一检索。
- 拼音搜索：中文工具、书签支持拼音和首字母匹配，可在设置中关闭。
- CSS 属性/Moo-CSS 搜索：查询 CSS 属性、Moo-CSS 变量、方法和类名。
- URL 转二维码：支持二维码生成与图片下载。
- 图片压缩及转 Base64：可选择 JPEG 或 PNG 输出，并查看压缩后尺寸。
- Tailwind 类名转 CSS：支持一组 Tailwind v3 常用类名、自定义值，以及 `sm`/`md`/`lg`/`xl`/`2xl`、`hover`/`focus` 等变体；结果可复制，未识别的类名会单独列出。
- px/rem/vw 换算计算器。
- RGB/HSB/HSL/HEX/CMYK 色值换算。
- 快速翻译。
- 简易 Postman：支持请求头、请求体、认证、环境变量替换、保存请求、cURL 导入导出、请求历史筛选、取消/超时、校验和响应搜索。
- 常用正则查询与测试。
- JSON 格式化与验证。
- SVG 在线编辑器与优化。
- 日期/时间戳转换。
- Linux 命令查询。
- 页面截图：支持整页截图、节点截图并保存。
- 技术栈检测：通过脚本、资源、DOM、全局变量、运行时和 meta 等多种信号，识别常见框架、构建工具和前端库，并展示版本、命中依据和可信度。
- Codex 额度：查看 ChatGPT Codex 的额度窗口、剩余额度和重置时间，支持缓存、自动刷新及低额度/重置通知。
- 工具函数库搜索。
- 中英文切换。

## 技术栈检测范围

当前技术栈检测主要覆盖：

- 框架：Vue、React、Angular、Next.js、Nuxt、Svelte、Preact、SolidJS、Astro、Gatsby、Remix、Alpine.js、Stimulus、Ember、Backbone、jQuery。
- 构建工具：Vite、Webpack。
- 常用库：axios、redux、vue-router、react-router、angular router、vuex、pinia、mobx、zustand、TanStack Query、Apollo Client、RxJS。

检测结果会按 `framework`、`bundler`、`library` 分组，并显示 `high`、`medium`、`low` 可信度及命中依据。

## 设置

- 语言：支持中文、英文切换。
- 拼音搜索：默认开启。关闭后仅保留中文原文、英文、URL 等字面匹配。
- Codex 额度：需要登录 ChatGPT；额度数据仅在本地缓存，并可从工具中打开 Codex 用量页或重置追踪页。

## 安装使用

### 本地构建安装

```sh
pnpm install
pnpm run build
```

构建完成后，在 Chrome 中打开 `chrome://extensions/`：

1. 开启「开发者模式」。
2. 点击「加载已解压的扩展程序」。
3. 选择项目构建产物目录 `dist`。

也可以参考旧版安装说明：[安装>>](https://github.com/MichealWayne/fe-tools/tree/master/chrome-extension)，需要下载目录文件至本地进行离线安装，可参照此[安装教程](https://blog.csdn.net/jbk3311/article/details/103894936)。

## 项目开发

环境要求：

- Node.js 20 及以上。
- 推荐使用 pnpm，仓库已包含 `pnpm-lock.yaml`。

安装依赖：

```sh
pnpm install
```

本地调试：

```sh
pnpm run dev
```

启动成功后，浏览器访问 `http://localhost:8080/` 或终端输出的 Vite 地址。

构建：

```sh
pnpm run build
```

类型检查：

```sh
pnpm run typecheck
```

代码检查：

```sh
pnpm run lint:check
pnpm run lint:fix
```

单元测试：

```sh
pnpm run test
pnpm run test:run
pnpm run test:coverage
```

## 目录结构

```text
public/
  manifest.json              Chrome Manifest V3 配置
  scripts/                   扩展后台、content-script 与公共脚本
src/
  api/                       远程数据接口封装
  assets/                    工具入口图标等静态资源
  components/                工具组件
  extension/                 Chrome 消息类型与 API 客户端
  styles/                    全局样式与设计系统
  utils/                     通用工具、Chrome API、i18n、JSON 格式化等
  views/                     主页面、Moo-CSS、正则、工具函数页面
tests/                       Vitest 单元测试
```

## MileStone

- 2026: Tailwind 转 CSS、Codex 额度监控、Postman 工作区升级、技术栈检测增强、扩展国际化；
- 2025: Manifest V3、页面截图、双语支持；
- 2019: 插件 v1；
