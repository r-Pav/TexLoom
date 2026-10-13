# TexLoom

> 所见即所得的程序化纹理工作台。纯浏览器端跑,WebGL2 实时渲染,调完一键导出无缝贴图。
>
> A WYSIWYG procedural texture workbench. Runs entirely in the browser on WebGL2, exports seamless textures as PNG.

TexLoom 用 GLSL 片段着色器生成 2D 纹理:底部画廊挑图案、中间画布看实时预览、右侧栏调参数,导出的图是程序当场算出来的,不依赖任何贴图素材。

## 功能

- **516 个图案 / 11 个分类** —— 基元 226、秩序 77、瓦片 64、混沌 35、画框 24、花窗 22、散布 20、渐变 12、遮罩 12、波纹 12、辉光 12(手工图案 + 按族批量生成的图案,id 全局唯一)
- **实时参数调节** —— 每个图案自带参数表(范围 / 步长 / 默认值),拖动即时重绘,改参数不重新编译着色器
- **渐变上色** —— 单色 + 内置渐变预设 + 自定义停靠点(增删 / 改色 / 调位置),外加反相开关
- **动画预览** —— 17 个图案带时序动画,可连续播放,时间轴驱动,循环 4 个周期
- **导出 PNG** —— 256 / 512 / 1024 / 2048 四档分辨率
- **图案检索** —— 按分类筛选 + 关键词搜索
- **一键启动** —— 双击 `TexLoom.bat`:启动器拉起本地服务并开浏览器,关掉浏览器后自动收工

## 技术栈

| 层 | 用了什么 |
|---|---|
| 渲染 | WebGL2 + GLSL ES 3.00(着色器骨架拼装) |
| 框架 | React 19 + TypeScript 5.9 |
| 构建 | Vite 7 |
| 样式 | Tailwind CSS 3.4 + shadcn/ui(Radix UI) |
| 图标 | lucide-react |

## 目录结构

```
src/
  App.tsx                  界面主体(顶栏 / 画布 + 右侧参数栏 / 底部分类筛选与图案画廊)
  lib/texgen/
    engine.ts              TexEngine:WebGL2 渲染 + PNG 导出
    glsl.ts                着色器骨架(顶点 / 片段头 / 核心函数 / main 组装)
    patterns.ts            手工图案定义 + 分类表
    families.ts            图案族(批量生成的图案)
    gradients.ts           渐变预设与默认值
    shapes.ts              形状工具
    thumbs.ts              缩略图渲染
    types.ts               类型定义
  components/ui/           shadcn/ui 组件
launcher.cjs               本地启动器(dev server + 心跳看护)
TexLoom.bat                Windows 一键启动
```

## 启动与运行

### 环境要求

- Node.js 20+(启动器直接调 Node,不需要别的东西)
- 支持 WebGL2 的浏览器(Chrome / Edge / Firefox 现代版本)

### 方式一:一键启动(Windows,推荐)

双击 `TexLoom.bat`,不用敲命令:

1. 先查 Node.js,没装会提示去 nodejs.org
2. 首次运行自动跑 `npm install`(依赖已装则跳过)
3. 最小化窗口起启动器(`node launcher.cjs`),同时轮询等服务就绪,最多等 120 秒
4. 就绪后自动打开浏览器到 `http://localhost:3210/`

停止有两种:

- **关掉浏览器页面** → 页面停发心跳,启动器约 15 秒后自动收掉服务
- **再双击一次 `TexLoom.bat`** → 检测到 3210 端口已被占用,直接杀进程,立即停止

### 方式二:命令行

```bash
npm install
npm run dev        # 开发服务器,默认 http://localhost:3000
npm run build      # 类型检查 + 构建到 dist/
npm run preview    # 本地预览构建产物
```

### 端口说明

| 场景 | 端口 | 谁定的 |
|---|---|---|
| `npm run dev` 直接跑 | 3000 | `vite.config.ts` 的 `server.port` |
| 走 `TexLoom.bat` / 启动器 | 3210 | 启动器用 `npm run dev -- --port 3210` 顶掉默认值 |

3210 同时是一键启动的"实例探测口":`.bat` 靠它判断 TexLoom 是否已经在跑(在跑就当成停止指令)。

### 心跳与自动收工

页面每 3 秒向 `http://localhost:3456/__ping__` 发一次心跳(`App.tsx`);启动器超过 12 秒收不到心跳,就判定"浏览器已关",收掉 dev server。所以正常情况下不用手动停服务。

## 图案是怎么定义的

一个图案 = 一段 `evalPattern(vec2 p, vec2 uv)` 的 GLSL 函数体 + 一张参数表:

```ts
{
  id: 'rings', zh: '同心圆', cat: 'basic',
  params: [{ label: '环数', min: 1, max: 40, step: 1, def: 12 }],
  glsl: `float r = length(uv - 0.5); ...`,
}
```

引擎把它拼进统一的着色器骨架编译,参数经 uniform 传入,所以调参不触发重新编译。

## 许可

MIT License,见 [LICENSE](LICENSE)。
