# 辉云易达 OS

辉云易达 OS 是一套面向工业视频资产的本地化管理系统，提供登录验证、视频批量导入、分类元数据维护以及 CSV 导入导出能力，同时支持多端响应式的视频浏览体验。

## 功能亮点

- 🔐 **登录与权限控制**：内置 `hxadmin / hx84556793` 账号，登录状态保存在浏览器 localStorage。
- 📁 **批量导入视频**：通过控制台上传视频文件，系统自动落盘并生成数据记录。
- 📊 **CSV 导入 / 导出**：快速批量更新或备份分类信息，兼容文件名匹配逻辑。
- 🏷️ **丰富分类字段**：覆盖产品类型、灌装线、桶盖、容量、VOC 要求等 20+ 分类维度。
- 🎞️ **多端视频画廊**：首页支持按分类筛选、播放/全屏预览，自适应 PC / 平板 / 手机布局。
- 💾 **持久化存储**：数据写入 `data/videos.json`，重启或刷新后仍可保留。

## 项目结构

```
huixin-vision-os/
├─ package.json
├─ server.js
├─ README.md
├─ data/
│  └─ videos.json
└─ public/
   ├─ index.html
   ├─ login.html
   ├─ dashboard.html
   ├─ css/
   │  ├─ style.css
   │  ├─ dashboard.css
   │  └─ login.css
   ├─ js/
   │  ├─ main.js
   │  ├─ dashboard.js
   │  └─ login.js
   ├─ assets/
   │  └─ icons/
   └─ videos/
```

## 快速开始

1. **安装依赖**

   ```bash
   npm install
   ```

2. **启动服务**

   ```bash
   npm start
   ```

   启动后终端将输出 Local 与 Network 地址，可在同局域网的电脑/平板/手机访问。

3. **默认登录账号**

   - 用户名：`hxadmin`
   - 密码：`hx84556793`

## CSV 模板

导入 CSV 时，请包含以下列：

```
fileName,productType,autoFillingMachine,autoFillingLine,capType,capacity,feedingMethod,explosionProof,fillingMethod,cappingMethod,conveyorMethod,bufferMethod,vocRequirement,barrelSeparation,weighingMethod,capSorting,capPlacing,labelingMethod,palletizingMethod,palletMethod,boxingMethod,otherFunctions
```

- `fileName` 支持填写上传时的原始文件名或服务器保存的文件名。
- 多选字段（如 `weighingMethod`、`labelingMethod` 等）建议使用中文顿号 `、` 分隔多个取值。

## 接口速览

- `POST /api/login`：账号密码校验。
- `GET /api/videos`：获取全部视频及分类信息。
- `POST /api/videos/upload`：批量上传视频文件。
- `PUT /api/videos/:id`：更新单条视频分类信息。
- `POST /api/videos/import-csv`：上传 CSV，按文件名批量更新分类。
- `GET /api/videos/export-csv`：导出当前所有视频的分类信息。
- `GET /api/metadata-fields`：返回可用分类字段（供扩展使用）。

## 开发建议

- 静态页面及脚本位于 `public/` 下，可直接修改并刷新查看效果。
- 如需添加新分类字段，请同时更新 `server.js`、`dashboard.js` 与 `main.js` 中的定义。
- 视频文件保存在 `public/videos` 目录，删除或替换文件后请同步更新数据文件。

## 许可证

本项目采用 MIT License。
