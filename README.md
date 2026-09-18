<div align="center">

# 🎨 SkiaBoard

### 跟着画，一起画，人人会画画

**开源免费的全民简笔画学练平台** — 支持多人实时协作、分龄教材体系、学练模式、徽章成就、朋友圈分享

[![Stars](https://img.shields.io/github/stars/shixingya/skia_board?style=social&label=Star)](https://github.com/shixingya/skia_board)
[![Forks](https://img.shields.io/github/forks/shixingya/skia_board?style=social&label=Fork)](https://github.com/shixingya/skia_board)
[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](https://opensource.org/licenses/MIT)
[![PRs Welcome](https://img.shields.io/badge/PRs-welcome-brightgreen.svg)](#贡献教程)
[![Issues](https://img.shields.io/github/issues/shixingya/skia_board)](https://github.com/shixingya/skia_board/issues)
[![Repo Size](https://img.shields.io/github/repo-size/shixingya/skia_board)]()
[![Last Commit](https://img.shields.io/github/last-commit/shixingya/skia_board)]()

[在线体验](https://shixingya.github.io/skia_board/) · [功能特性](#-核心特性) · [界面预览](#-界面预览) · [教程贡献](#-贡献你的教程) · [路线图](#-路线图)

<p align="center">
  <img src="docs/screenshots/home.jpg" alt="SkiaBoard 课程大厅" width="720" />
</p>

</div>

---

## ✨ 核心特性

| 功能 | 说明 |
|------|------|
| 📖 **学+练模式** | 左侧分步教程指引，右侧画布跟练，支持描红底稿（透明度可调） |
| 👶 **分龄教材** | 幼儿园 / 小学 / 中学 / 成人 四个学段，内置 **432 篇**分龄教程（每学段 100+ 篇） |
| 🏆 **徽章成就** | 16 枚趣味徽章 + 画坛称号体系，连续打卡、深夜画画、色彩大师等激励 |
| 📸 **朋友圈分享** | 一键生成竖版分享卡片（作品+新徽章+称号+成长数据+趣味文案），发朋友圈晒徽章 |
| 🎨 **专业画板** | 画笔/钢笔/形状/文字/布尔运算/图层/对齐/撤销重做，Figma 级体验 |
| 📱 **全端适配** | 手机/平板/电脑自适应：双指捏合缩放、平移手、底部工具栏、属性抽屉、课程搜索筛选 |
| 👥 **多人协作** | （开发中）基于 Yjs CRDT 的实时协作，支持课堂房间 |
| 📦 **零依赖部署** | 纯前端 HTML+JS，下载即用，无需构建，无需后端 |

---

## 🖼️ 界面预览

| 课程大厅（分龄课程） | 学练模式（描红底稿） |
|:---:|:---:|
| <img src="docs/screenshots/home.jpg" alt="课程大厅" width="420" /> | <img src="docs/screenshots/tutorial.jpg" alt="学练模式" width="420" /> |

| 完成弹窗（撒花 ✨ + 称号 + 徽章） | 徽章面板（16 枚徽章 + 称号卡） |
|:---:|:---:|
| <img src="docs/screenshots/completion.jpg" alt="完成弹窗" width="420" /> | <img src="docs/screenshots/badges.jpg" alt="徽章面板" width="420" /> |

| 朋友圈分享卡片（竖版 750×1200，画完即可晒） |
|:---:|
| <img src="docs/screenshots/share-card.jpg" alt="朋友圈分享卡" width="300" /> |

---

## 🎯 分龄教材体系

| 学段 | 年龄 | 篇数 | 内容方向 | 示例教程 |
|------|------|------|----------|----------|
| 🧒 **幼儿园** | 3-6岁 | **123** | 涂鸦启蒙、形状认知、涂色 | ☀️ 太阳公公、🍎 红苹果 |
| 👦 **小学** | 7-12岁 | **101** | 分步教学、创意组合、手抄报 | 🐟 小鱼游游、🏠 小房子 |
| 🧑‍🎓 **中学** | 13-18岁 | **102** | 素描基础、透视原理、漫画技法 | 📦 立方体透视、👁️ Q版眼睛 |
| 👨‍💼 **成人** | 18岁+ | **106** | 解压禅绕、手账简笔、视觉笔记 | 🌀 禅绕曼陀罗、☕ 手账咖啡杯 |

> **共 432 篇教程**。教程由 `gen_lessons.py` 生成器统一编译为 `lessons.js`，课程大厅内支持按学段筛选、关键词搜索与进度统计。

---

## 🚀 快速开始

### 方式一：在线体验

直接访问 👉 **[shixingya.github.io/skia_board](https://shixingya.github.io/skia_board/)**

### 方式二：本地运行（零依赖）

```bash
# 克隆仓库
git clone https://github.com/shixingya/skia_board.git
cd skia_board

# 直接用浏览器打开
# Windows: start index.html
# macOS: open index.html
# Linux: xdg-open index.html
```

或用任意静态服务器：
```bash
python -m http.server 8080
# 然后访问 http://localhost:8080
```

### 方式三：GitHub Pages 部署

Fork 本仓库 → Settings → Pages → 选择 main 分支根目录 → 完成！

---

## 📖 学练模式使用指南

1. **选择教程**：在课程大厅按学段选择想学习的简笔画
2. **跟着画**：画布上会显示半透明参考底稿，用画笔在上面描红
3. **切换步骤**：点击"下一步"查看后续步骤，底稿自动更新
4. **调整底稿**：拖动透明度滑块，或点击"隐藏底稿"自由创作
5. **完成练习**：点"完成"解锁徽章，生成朋友圈分享图

---

## 📱 移动端 & 平板适配

针对手机/平板触控场景做了专门优化：

- **双指捏合缩放 + 双指平移**：画布支持双指手势缩放与平移（单指仍为绘画/选择），无需像桌面端那样依赖 Ctrl+滚轮
- **自适应布局**：窄屏（≤600px）下工具栏自动变为**底部横向滑动条**，属性面板改为**右侧抽屉**（点画布右上角 ⚙ 呼出），学练指引改为**底部抽屉**，不再挤压画布
- **更大触控目标**：工具栏按钮在手机上放大到 44px，符合移动端可点击标准
- **平移手工具 ✋**：工具栏新增「平移手」，**单指即可拖动画布平移**（桌面快捷键 `H`），缩放后浏览画面更顺手，画布右侧还常驻✋快捷入口
- **双击缩放**：触屏**双击画布**即可快速放大/缩小（以手指位置为中心），双指捏合同样支持
- **快捷操作条**：手机上画布右侧悬浮**撤销 / 重做 / 清空 / 平移**快捷按钮，拇指即可点按，不再依赖顶部小按钮
- **学练抽屉可收起**：底部学练指引抽屉可一键**收起/展开**（拖拽把手 + 顶栏「📖 指引」按钮），收起后自动浮现悬浮「下一步」按钮继续推进度，避免遮挡画布
- **课程大厅增强**：新增**搜索框**（按标题/简介/表情关键词）、**学段筛选标签**（含各学段教程数）、**进度统计卡片**（总篇数/已完成/学段数）
- **平板（≤768px）**：面板收窄、顶栏自动换行，保持横屏作画效率

> 在手机浏览器直接访问 **[shixingya.github.io/skia_board](https://shixingya.github.io/skia_board/)** 即可体验。

---

## 🏆 徽章成就系统

完成教程和画作可解锁徽章，集齐全部徽章成为「绘画大师」！

| 徽章 | 解锁条件 | 稀有度 |
|------|----------|--------|
| 🌱 初次落笔 | 完成第一幅画作 | 普通 |
| 📚 勤学小将 | 完成 5 篇教程 | 普通 |
| 🔥 三日坚持 | 连续 3 天练习 | 稀有 |
| ⭐ 十课达人 | 完成 10 篇教程 | 稀有 |
| 🎨 色彩大师 | 一幅画用 5 种以上颜色 | 稀有 |
| 🦉 夜猫子 | 深夜 23 点后完成画作 | 稀有 |
| 🌟 分享达人 | 累计分享作品 5 次 | 稀有 |
| 🎁 徽章收藏家 | 解锁 5 枚不同徽章 | 稀有 |
| 🚀 进步神速 | 一天完成 3 篇教程 | 史诗 |
| 📣 传播使者 | 分享到朋友圈 | 史诗 |
| 🌈 彩虹制造机 | 一幅画用 7 种以上颜色 | 史诗 |
| ✍️ 高产画家 | 一天完成 5 幅画作 | 史诗 |
| 🎓 中学毕业 | 完成中学全部课程 | 史诗 |
| 🏆 小小画家 | 完成幼儿园全部课程 | 史诗 |
| 🌈 全面发展 | 四个学段各完成 1 篇 | 传说 |
| 👑 绘画大师 | 解锁全部徽章 | 传说 |

### 👑 称号体系

解锁徽章数量决定你的画坛称号，随收集进度自动晋级：

| 称号 | 需要徽章 | | 称号 | 需要徽章 |
|------|----------|-|------|----------|
| 🖍️ 绘画萌新 | 0-2 枚 | | 🖌️ 创意画师 | 9-11 枚 |
| ✏️ 涂鸦新秀 | 3-5 枚 | | 🏅 画坛高手 | 12-14 枚 |
| 🎨 绘画能手 | 6-8 枚 | | 👑 绘画大师 | 15 枚 |

---

## 📸 朋友圈分享

完成画作后点击「📸 分享」，自动生成精美竖版分享卡片：

- 🎨 你的作品展示
- 💬 趣味宣传文案（每次分享不同，自带传播钩子）
- 🏆 新徽章大图展示（放射光芒 + 稀有度）
- 👑 当前称号 + 徽章收集进度条
- 📊 成长数据（画作 / 连续天数 / 完成教程 / 分享）
- 🔗 二维码 + GitHub 地址

**长按保存图片 → 发朋友圈 → 邀请好友一起学画画！**

---

## 📝 贡献你的教程

**这是本项目最欢迎的贡献方式！** 每添加一篇教程 = 一次有意义的 Fork + PR。

### 教程格式

教程定义在 `lessons.js` 中，每篇教程结构如下：

```javascript
{
  id: 'your-lesson-id',       // 唯一标识
  title: '教程名称',
  ageGroup: 'kindergarten',   // kindergarten | primary | middle | adult
  ageLabel: '幼儿园',
  difficulty: 1,              // 1-5
  duration: 3,                // 预计分钟数
  emoji: '🌟',
  description: '教程简介',
  steps: [
    {
      hint: '第1步：画一个圆形',
      draw: (ctx) => {        // 在 400x400 坐标系中绘制参考图
        ctx.beginPath();
        ctx.arc(200, 200, 80, 0, Math.PI * 2);
        ctx.fillStyle = '#FFD93D';
        ctx.fill();
      }
    },
    // ... 更多步骤
  ],
  finalDraw: (ctx) => { /* 完成图 */ }
}
```

### 贡献步骤

1. Fork 本仓库
2. 在 `lessons.js` 的 `lessons` 数组中添加你的教程
3. 提交 PR，标题格式：`feat(lesson): 添加教程 - 教程名`
4. 合并后你的教程将出现在课程大厅中！

> 💡 **不会写代码也能贡献**：在 Issue 中提交教程的步骤描述和参考图片，维护者会帮你转换成代码格式。

---

## 🛠️ 技术栈

| 层级 | 技术 | 说明 |
|------|------|------|
| 渲染 | HTML5 Canvas 2D | 三层画布架构（main / reference / overlay / interaction） |
| 前端 | 原生 JavaScript | 无框架、无构建、零依赖 |
| 样式 | 原生 CSS | 暗色主题，CSS 变量驱动，响应式媒体查询适配移动端 |
| 交互 | Touch / Pointer 事件 | 单指绘画/平移 + 双指捏合缩放 + 双击缩放 |
| 存储 | localStorage | 徽章、学习进度本地持久化 |
| 协作（开发中） | Yjs + WebSocket | CRDT 实时同步 |

### 项目结构

```
skia_board/
├── index.html      # 主页面（课程大厅 + 画板 + 学练面板，含移动端适配）
├── app.js          # 核心画板引擎（SkiaBoard 类，含触控手势）
├── lessons.js      # 内置简笔画教程库（由 gen_lessons.py 自动生成）
├── gen_lessons.py  # 教程库生成器（432 篇教程的源数据 + 编译脚本）
├── badges.js       # 徽章成就系统
├── share.js        # 朋友圈分享图生成
├── learn.js        # 学练模式控制器（含课程搜索/筛选/计数）
└── README.md
```

---

## 🗺️ 路线图

### ✅ 已完成
- [x] 专业画板核心（画笔/形状/文字/布尔运算/图层）
- [x] 学练模式（分步指引 + 描红底稿）
- [x] 分龄教材库（4 学段 × 100+ 篇，共 432 篇教程，由 `gen_lessons.py` 生成）
- [x] 徽章成就系统（16枚徽章 + 画坛称号体系）
- [x] 朋友圈分享图生成（作品+新徽章+称号+趣味文案）
- [x] 课程大厅首页（搜索 + 学段筛选 + 进度统计）
- [x] 移动端/平板适配（双指缩放、底部工具栏、面板抽屉）
- [x] 移动端交互增强（平移手工具、双击缩放、快捷操作条、学练抽屉收起 + 悬浮下一步）

### 🔨 进行中
- [ ] 多人实时协作（Yjs + WebSocket）
- [ ] 更多社区教程（已内置 432 篇，持续扩充）
- [ ] 儿童模式 UI（大按钮、贴纸库）

### 📋 计划中
- [ ] 真实二维码分享（扫码直达 GitHub Pages）
- [ ] 作品保存与作品集
- [ ] 教师版（课堂管理、作业批改）
- [ ] AI 辅助绘画（草图转线稿）
- [ ] 多语言支持

---

## 🤝 参与贡献

欢迎各种形式的贡献：

- 🎨 **贡献教程** — 最受欢迎！见[贡献教程](#-贡献你的教程)
- 🐛 **提交 Bug** — [新建 Issue](https://github.com/shixingya/skia_board/issues)
- 💡 **功能建议** — 讨论新功能和改进方向
- 🔧 **代码贡献** — 修复 Bug、实现新功能
- 📖 **文档改进** — 完善 README 和使用说明

---

## 📄 License

[MIT License](LICENSE) — 完全开源免费，可自由使用、修改、商用。

---

<div align="center">

**如果这个项目对你有帮助，请点个 ⭐ Star 支持一下！**

Made with ❤️ for everyone who loves drawing

</div>
