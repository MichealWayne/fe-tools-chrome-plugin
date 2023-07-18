# FrontEnd Tools Chrome Plugin

适用前端开发人员的 Chrome 插件工具。

> 注意，由于 v1 时隔较久、**目前可运行源码及开发代码在`v2-dev`分支**

## 辅助前端开发的一个小插件。

![chrome-ext.png](https://blog.michealwayne.cn/images/fe-tools/chrome-ext.png)

### 功能：

- 工具网站搜索（`√`）
- 本地收藏夹网站搜索（`√`）
- CSS 属性/Moo-CSS 搜索（`√`）
- url 转二维码及 svg 矢量图（`√`）
- 图片压缩及转 base64（`√`）
- px/rem/vw 换算计算器（`√`）
- rgb/hsb/hex 色值换算（`√`）
- 快速翻译（`√`）
- 简易 Postman（`√`）
- 常用正则查询（`√`）
- **LLM 接入及 Chat 问答机器人**
- **AI 代码 review & 代码生成**
- 工具函数库搜索
- 搜索自定义拓展

### MileStone

- 2023.Q3：GPT/LLM 能力接入、v2；
- 2019: 插件 v1；

[安装>>](https://github.com/MichealWayne/fe-tools/tree/master/chrome-extension)，（需要下载目录文件至本地进行离线安装，可参照此[安装教程](https://blog.csdn.net/jbk3311/article/details/103894936)）

---

## 项目启动

- 环境：Nodejs v14 及以上；

安装依赖：

```sh
npm install
```

本地调试：

```sh
npm run start # 或dev
```

启动成功后，浏览器访问`http://localhost:8080/`

构建：

```sh
npm run build
```
