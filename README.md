# FrontEnd Tools Chrome Plugin

适用前端开发人员的 Chrome 插件工具集合，基于 Manifest V3、Vue 3、Vite 构建。

当前版本：**1.8.0** · [English](README.en.md) · [更新记录](CHANGELOG.md)

[下载最新版](https://github.com/MichealWayne/fe-tools-chrome-plugin/releases/latest/download/fe-tools-chrome-extension.zip) · [安装与更新说明](docs/installation.md) · [历史版本](https://github.com/MichealWayne/fe-tools-chrome-plugin/releases)

下载安装包后即可加载，无需安装 Node.js 或自行构建。下载入口在首个包含上述附件的正式 Release 发布后生效；草稿版本仅供维护者验证，尚未公开提供下载。

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

检测结果会按 `framework`、`bundler`、`library` 分组，并显示 `high`、`medium`、`low` 可信度、命中依据、版本来源和版本冲突；可复制摘要或 JSON 报告。框架还包括 AngularJS。

仅检测目标标签页的主框架，不递归扫描 iframe。界面会区分 DOM/隔离环境与页面运行时的探测覆盖情况；未命中或版本未知不代表页面没有使用该技术。报告会移除 URL 中的认证信息、查询参数和片段，分享前仍应检查路径和其他内容。

## 新版工具操作

- 网页右键菜单：生成当前 URL 的二维码、打开有道翻译、检测当前页面技术栈，或启动整页/节点截图。二维码和技术栈检测使用独立工具页。
- 截图：节点选择在页面内继续执行，弹窗关闭后仍可完成，并打开预览页；整页右键截图使用后台任务标签页，完成后切换到结果页。截图期间请保持目标页面可见。Chrome 内置页等受限页面无法使用；整页截图最多 40 段、2500 万像素，超限会提示错误。
- 二维码：支持 320/480/640px 放大扫码预览和独立扫码页。编辑内容后需重新生成，再放大或下载，避免使用旧二维码。
- 图片与 SVG：压缩工具支持原图/结果对比、文件体积和节省比例；图片、截图和 SVG 共用缩放和平移预览，SVG 可切换预览背景。
- JSON：支持严格 JSON 文件导入（最大 2 MiB）、结果下载、输入/输出文本搜索及错误定位。错误定位依赖浏览器解析器提供的位置；搜索为字面匹配，最多显示 10000 个匹配项。
- JSON、SVG、Tailwind：切换工具时保留当前弹窗内的文本草稿；关闭弹窗后清空，不跨窗口或持久化保存，单份草稿最多 2097152 个字符。
- 色值与日期：支持常见不透明 CSS 输入，如 `#abc`、`rgb(255, 0, 0)`、`hsl(0, 100%, 50%)`，暂不支持 alpha 透明度；日期转换支持逐项复制和秒/毫秒单位提示。

## 扩展权限与数据

扩展声明了所有 HTTP(S) 站点访问权限，用于跨站请求、页面探测和截图。书签权限用于本地搜索，存储用于设置、请求数据和额度缓存；闹钟/通知用于 Codex 额度监控，下载用于保存结果，右键菜单与脚本权限用于页面工具。

二维码、JSON、SVG、色值和图片转换在本地执行；翻译、API 请求、远程参考数据与 Codex 额度查询需要联网。分享报告、请求或截图前请检查其中的敏感信息。

## 设置

- 语言：支持中文、英文切换。
- 拼音搜索：默认开启。关闭后仅保留中文原文、英文、URL 等字面匹配。
- Codex 额度：需要登录 ChatGPT；额度数据仅在本地缓存，并可从工具中打开 Codex 用量页或重置追踪页。

## 安装使用

### 下载已构建安装包（推荐）

1. [下载最新版安装包](https://github.com/MichealWayne/fe-tools-chrome-plugin/releases/latest/download/fe-tools-chrome-extension.zip)，或在 [Releases](https://github.com/MichealWayne/fe-tools-chrome-plugin/releases) 中选择 `fe-tools-chrome-extension.zip`。
2. 解压到准备长期保留的目录，不要选择 GitHub 自动生成的 `Source code` 源码包。
3. 在 Chrome 地址栏输入 `chrome://extensions/`，开启「开发者模式」。
4. 点击「加载已解压的扩展程序」，选择直接包含 `manifest.json` 的目录。
5. 将插件固定到工具栏。安装目录需要保留，更新需手动下载新版并重新加载。

详细步骤、校验方法及常见问题见 [安装与更新说明](docs/installation.md)。

### 从源码构建（开发者）

```sh
pnpm install --frozen-lockfile
pnpm run build
```

构建完成后，在 Chrome 中打开 `chrome://extensions/`：

1. 开启「开发者模式」。
2. 点击「加载已解压的扩展程序」。
3. 选择项目构建产物目录 `dist`。

## 项目开发

环境要求：

- Node.js 20 及以上。
- 使用 pnpm（CI 使用 pnpm 9），仓库已包含 `pnpm-lock.yaml`。

安装依赖：

```sh
pnpm install --frozen-lockfile
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

发布前执行完整检查：

```sh
pnpm run typecheck
pnpm run check:version
pnpm run lint:check
pnpm run test:run
pnpm run build
pnpm run package:extension
```

修改版本时须同步更新 `package.json` 与 `public/manifest.json`。开发服务器仅用于界面调试；书签、右键菜单、截图、通知和 service worker 生命周期需要加载 `dist/` 后在 Chrome 中验证。更新构建后应在扩展管理页重新加载插件，必要时刷新目标网页。

`package:extension` 在构建后检查版本和运行资源，并将 ZIP 与 SHA256 校验文件写入 `release-artifacts/`。本地需有 `zip` 命令；该目录及 `dist/` 均不提交。

PR 和合并到 `master` 后会运行检查并保留 14 天构建产物；仅 `master` 的推送可为未发布版本创建 Draft Release。已有正式版和完整草稿保持不变，维护者测试附件后再手动发布。详见 [维护者发布流程](docs/releasing.md)。

## 目录结构

```text
public/
  manifest.json              Chrome Manifest V3 配置
  scripts/                   扩展后台、content-script 与公共脚本
src/
  api/                       远程数据接口封装
  assets/                    工具入口图标等静态资源
  components/                工具组件
  composables/               复制反馈、当前弹窗文本草稿等组合式逻辑
  extension/                 Chrome 消息类型与 API 客户端
  styles/                    全局样式与设计系统
  utils/                     通用工具、Chrome API、i18n、JSON 格式化等
  views/                     主页面、Moo-CSS、正则、工具函数页面
tests/                       Vitest 单元测试
scripts/release/             安装包校验、打包与 Draft Release 创建逻辑
docs/                        中英文安装说明及维护者发布流程
openspec/changes/            发布分发规格与变更记录
```

## MileStone

- 2026: 右键截图与独立工具页、结果预览和 JSON 工作台、技术栈报告、Tailwind 转 CSS、Codex 额度监控、Postman 工作区升级、扩展国际化；
- 2025: Manifest V3、页面截图、双语支持；
- 2019: 插件 v1；
