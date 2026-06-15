# 地理纵深

一张可点击的世界地图：点开任何一个地方，它从平面符号展开成一个有纵深、有来历的真实对象。

## 本地运行

**前提条件：** Node.js 18+

```bash
git clone <仓库地址>
cd Geography
npm install
npm run dev
```

浏览器访问 `http://localhost:5173` 即可使用，**开箱即用、无需任何 Key**。

## 在应用内配置

点击左上角 **⚙** 打开设置面板，可配置两类内容：

### AI 助手（可选）

填入你自己的 AI 接口地址 + API Key，即可为地图上任意点位生成知识卡片。支持 DeepSeek、OpenAI 及任何兼容 OpenAI 接口协议的服务。

> **CORS 提示：** 遇到跨域错误时，可将接口地址改为 `/ai-proxy`——Vite 开发服务器已内置代理转发（默认目标为 DeepSeek；如需切换，以 `AI_PROXY_TARGET=https://api.openai.com npm run dev` 启动）。

### 地图样式（可选）

无需任何 Key，默认即可使用以下免费样式：

| 样式 | 来源 |
|------|------|
| Liberty / Bright / Positron / Dark | OpenFreeMap（矢量） |
| 卫星影像 | ESRI World Imagery（光栅，含署名） |

若想使用 **MapTiler 专业样式**（卫星混合 / 户外地形 / 街道 / 纯卫星），在 [maptiler.com](https://maptiler.com) 免费注册后将 Key 填入设置面板即可解锁。点击任一样式立即预览；取消不保存。

**所有 Key 均只存在你本机浏览器的 `localStorage` 中，绝不上传任何服务器，各人用各人的。**

## 功能一览

- 点击地图任意位置 → 右侧弹出知识卡面板
- 彩色钉子 = 精选地点（含人工整理的地质/地理内容）
- 其他位置由 AI 按地理坐标推测生成（需配置 Key），自动标注"未核对"
- 左上角 ✏ 笔记 可随时保存感兴趣的内容到本地
- 钉子颜色按地貌类型区分（火山/板块、冰川、喀斯特、流水…）

## 内容说明

内容文件在 `/content`，代码不生成也不修改它们：

- `/content/locations/*.yaml` — 地点脚本（首批 13 个，状态均为起草/待核对）
- `/content/processes/*.md` — 过程库（~80 个地质/地理机制模块）

所有内容条目带 `状态` 字段（`起草 / 待核对 / 已核对`），非"已核对"项在卡片上有标记。
