# Mars Showcase

## 项目简介
Mars Showcase 是一个基于 Three.js 与 React 的交互式 3D 火星标注系统，支持以下核心能力：
- 程序化渲染可旋转、可缩放的 3D 火星球体
- 在球面任意位置新增/点选标注并记录经纬度
- 右侧卡片编辑标注名称、描述，并管理图片/视频媒体
- 使用 IndexedDB（localForage 封装）持久化存储标注与媒体引用
- 支持 PWA 安装与离线访问基础脚本
- 导出/导入 JSON 数据，实现标注与媒体引用的备份与迁移

## 技术栈
- [React](https://react.dev/) + [TypeScript](https://www.typescriptlang.org/) + [Vite](https://vitejs.dev/)
- [Three.js](https://threejs.org/)（OrbitControls、Raycaster）
- [Tailwind CSS](https://tailwindcss.com/)
- [Zustand](https://github.com/pmndrs/zustand)
- [localForage](https://localforage.github.io/localForage/)
- PWA（`manifest.webmanifest` + 自定义 Service Worker）

## 目录结构
```
mars-showcase/
├─ index.html                # Vite 入口 HTML
├─ manifest.webmanifest      # PWA 清单
├─ vite.config.ts            # Vite 配置
├─ package.json              # 依赖与脚本
├─ tsconfig.json             # TypeScript 配置（严格模式）
├─ postcss.config.cjs        # PostCSS 配置
├─ tailwind.config.cjs       # Tailwind 主题扩展
├─ .gitignore
├─ README.md
├─ public/
│  ├─ icons/.gitkeep         # 预留 PWA 图标目录
│  └─ textures/.gitkeep      # 预留火星贴图目录
└─ src/
   ├─ main.tsx               # React 入口
   ├─ App.tsx                # 布局与 Service Worker 注册
   ├─ styles/index.css       # Tailwind 引导样式
   ├─ three/                 # Three.js 场景/控制/标注计算
   │  ├─ scene.ts
   │  ├─ controls.ts
   │  ├─ mars.ts
   │  ├─ markers.ts
   │  └─ types.ts
   ├─ store/useStore.ts      # Zustand 全局状态与 IndexedDB 操作
   ├─ db/index.ts            # localForage 封装：元数据与 Blob CRUD
   ├─ constants/lines.ts     # 17 条自动线预置名称
   ├─ components/            # UI 组件
   │  ├─ Toolbar.tsx
   │  ├─ Sidebar.tsx
   │  ├─ Canvas3D.tsx
   │  ├─ MarkerCard.tsx
   │  └─ Toast.tsx
   └─ sw.ts                  # 最小可用 Service Worker
```

## 环境与部署
- **Node.js**：建议使用 Node.js 18 或更高版本
- **包管理器**：示例采用 `npm`

```bash
# 安装依赖
npm install

# 本地开发
npm run dev

# 生产构建
npm run build

# 构建结果预览
npm run preview
```

### PWA 安装与离线说明
- 访问构建后的站点后，点击顶部工具栏的“安装 PWA”按钮即可触发安装
- Service Worker 会缓存核心 HTML、manifest 与随后访问的脚本，实现离线访问
- 如需替换图标，请将 PNG/SVG 放入 `public/icons/` 并在 `manifest.webmanifest` 的 `icons` 数组中维护尺寸、类型与 `purpose`，构建时 Vite 会自动复制到输出目录

### 界面结构说明
- **顶部工具栏**：提供“新增标注”“导入”“导出”“重置视角”“安装 PWA”“生成预置标注”等快捷操作
- **左侧 Sidebar**：展示 17 条自动线列表，支持搜索关键字、按是否包含媒体筛选，以及点击条目飞行至标注
- **中间 3D Canvas**：基于 Three.js 渲染的火星球体，支持 OrbitControls 旋转缩放与 Raycaster 点击拾取
- **右侧标注卡片**：展示并编辑选中标注的名称、描述、媒体列表，上传按钮用于选择图片或视频文件并写入 IndexedDB

## 运行与使用
1. **新建标注**：
   - 在 3D 火星表面点击任意位置或使用工具栏“新增标注”，系统会自动计算经纬度并保存
2. **编辑卡片**：
   - 选择任意标注后，右侧卡片支持修改名称、多行描述；失去焦点即自动保存
3. **上传媒体**：
   - 图片/视频通过右侧卡片上传，预览使用 `URL.createObjectURL`，真实数据以 Blob 存储在 IndexedDB
4. **搜索/筛选**：
   - 左侧 Sidebar 支持名称/描述搜索与“仅显示含媒体”筛选
5. **飞行定位**：
   - Sidebar 每个标注提供“飞行”按钮，摄像机将定位到对应经纬度
6. **导出/导入 JSON**：
   - 工具栏提供导出/导入按钮；导出 JSON 仅包含标注元数据与 Blob 引用 id，不包含实际二进制内容

### 占位图片/视频的命名与存放位置
- **火星贴图（JPG）**：请在后续提交中将纹理文件放入 `public/textures/`
  - `mars_albedo.jpg`
  - `mars_normal.jpg`（可选）
  - `mars_roughness.jpg`（可选）
  - 加载方法：在 `src/three/mars.ts` 中的占位注释下，使用 `new TextureLoader().load('/textures/mars_albedo.jpg')` 等 API 将贴图绑定到材质；为确保类型提示，可在文件顶部引入 `TextureLoader`
- **PWA 图标**：存放于 `public/icons/` 目录（当前仅 `.gitkeep` 占位），并在 `manifest.webmanifest` 与 `src/App.tsx` 的 `useEffect` 内注册逻辑中保持路径一致
- **用户上传媒体**：通过应用内上传并持久化到 IndexedDB，仓库不直接包含任何二进制文件

## 17 种自动线预置名称
```ts
["晨曦弧", "赤霞脉", "风暴涡", "极冠弧", "谷地巡航", "碎冰岭", "暮光链", "流沙澜", "朱砂谷", "赤焰带", "玄铁界", "星落痕", "霜露谷", "余烬环", "光晕坡", "暮霭坳", "晨星谷"]
```
首次运行可通过工具栏中的“生成 17 条自动线”按钮，一键随机分布到火星表面。

## 后续可选增强
- 启用火星纹理贴图，提升球面细节
- 使用 React Three Fiber 重构渲染层
- 引入 Workbox 优化缓存策略
- 打包为 Electron 桌面应用
- 集成 File System Access API 管理外部文件

## 许可协议
MIT
