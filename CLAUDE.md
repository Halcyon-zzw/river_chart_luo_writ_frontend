# CLAUDE.md

本文件为 Claude Code (claude.ai/code) 提供在此代码库中工作的指导。

## 项目概述

这是一个基于 uni-app 的微信小程序"河图洛书" - 一个用于组织图片和笔记的内容管理应用，支持分层分类和标签功能。

**技术栈：**
- uni-app 3.x (Vue 3 + Vite)
- Pinia 状态管理（带持久化）
- 微信小程序为主要目标平台

## 构建和开发命令

### 开发环境
```bash
# 微信小程序（主要平台）
npm run dev:mp-weixin

# 文件变更时自动重新构建（使用 nodemon）
npx nodemon

# H5 开发
npm run dev:h5
```

### 生产构建
```bash
# 微信小程序
npm run build:mp-weixin

# 构建输出：dist/build/mp-weixin/
# 将此目录导入微信开发者工具
```

### 其他平台
使用 `dev:mp-{platform}` 或 `build:mp-{platform}` 构建其他小程序平台（支付宝、百度、QQ 等）

## 架构设计

### 页面层级与导航流程

应用采用 3 级分类系统：

```
TabBar 页面（4 个标签）
├── Browse（主分类列表）- 主入口
│   └── Sub-list（子分类列表）
│       └── Content-list（内容列表）
│           ├── Image-detail（图片详情）
│           └── Note-detail（笔记详情）
├── Recent（最近访问）
├── Collection（收藏）
└── Profile（个人中心）
```

**导航模式：**
1. **主分类** (`tabbar/browse/browse.vue`) - 根级分类，显示子分类数量
2. **子分类** (`category/sub-list/sub-list.vue`) - 主分类下的子分类，显示内容数量
3. **内容列表** (`category/content-list/content-list.vue`) - 按子分类和内容类型筛选的图片和笔记
4. **详情页** (`content/image-detail/` 或 `content/note-detail/`) - 查看单个内容

### 状态管理（Pinia Stores）

位于 `src/store/`：

- **category.js** - 缓存分类名称用于导航面包屑（mainCategoryName、subCategoryName）
- **collection.js** - 管理用户收藏的内容
- **user.js** - 用户认证和个人资料数据

所有 store 使用 `pinia-plugin-persistedstate` 实现本地存储持久化。

### API 架构

**基础配置：** `src/utils/config.js`
- API_BASE_URL: `http://localhost:8080`
- 默认超时：10 秒（在请求拦截器中配置）

**API 模块：** `src/api/`
- `request.js` - HTTP 封装，包含拦截器（token、loading、错误处理）
- `category.js` - 主分类/子分类 CRUD
- `content.js` - 图片/笔记内容 CRUD
- `tag.js` - 标签管理
- `collection.js` - 用户收藏
- `user.js` - 认证

**关键 API 字段约定：**
后端返回的标签数组字段名为 `tagDTOList`（而不是 `tags`）。务必使用：
```javascript
item.tagDTOList  // 正确
item.tags        // 错误 - 不会工作
```

这适用于 MainCategoryDTO、SubCategoryDTO 和 ContentDTO。

### 交互功能实现

**滑动手势**（左/右）：
所有列表页面（browse、sub-list、content-list）实现滑动显示操作按钮：
- 左滑：显示编辑（蓝色，#007AFF）和删除（红色）按钮
- 右滑或点击其他地方：隐藏按钮
- 触摸处理器：`onTouchStart`、`onTouchMove`、`onTouchEnd`
- 状态：`swipeId`（当前滑动的项）、`swipeX`（平移距离）

**长按批量操作：**
- 长按（>500ms）进入选择模式
- 显示复选框和底部工具栏
- 只有数量为 0 的项目可以被选中删除
- 点击取消按钮退出

**内容类型标签：**
内容列表页有图片/笔记标签。查询参数：`contentType: 'image' | 'note'`

## 重要约定

### 字段命名
- 分类：`mainCategoryId`、`subCategoryId`
- 内容类型：`'image'` 或 `'note'`（来自 CONTENT_TYPE 配置）
- 计数：`subCategorySize`、`contentSize`（不是 `count`）
- 标签：始终使用 `tagDTOList` 数组，每个标签有 `{id, name, color}`

### 导航参数
页面间导航时，始终传递必要的 ID 和名称：
```javascript
// 示例：浏览 -> 子分类列表
uni.navigateTo({
  url: `/pages/category/sub-list/sub-list?mainCategoryId=${id}&mainCategoryName=${name}`
})

// 示例：编辑内容
url: `/pages/content/create-note/create-note?id=${id}&mode=edit&subCategoryId=${subId}`
```

使用 `mode=edit` 查询参数区分创建和编辑模式。

### 时间显示格式
��有时间戳使用：`YYYY-MM-DD HH:mm` 格式
```javascript
const date = new Date(time)
return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}-${String(date.getDate()).padStart(2, '0')} ${String(date.getHours()).padStart(2, '0')}:${String(date.getMinutes()).padStart(2, '0')}`
```

## 需求文档

功能请求和 bug 在 `src/demand/1223.md` 中以问答格式跟踪。该文件还包含后端 API 规范 `src/demand/river_chart_luo_writ.json`（OpenAPI 3.0 格式）。

**实现功能时：**
1. 检查 `1223.md` 了解上下文和之前的讨论
2. 参考 API 规范获取正确的字段名和数据结构
3. 用"已处理"标记更新需求文件

## UI 组件和样式

**富文本编辑器：**
- 使用 `mp-html` 库渲染笔记中的 HTML 内容
- 使用 uni-app 的编辑器组件进行所见即所得编辑

**图片处理：**
- 多图上传（每个内容最多 9 张图片）
- Swiper 组件实现图片轮播
- 使用 `uni.previewImage` 预览图片

**配色方案：**
- 主色：`#00c4b3`（青色）
- 删除/危险：`#ff4444`
- 编辑：`#007AFF`（蓝色）
- 背景：`#f5f5f5`

**间距：**
- 使用 `rpx` 单位（响应式像素）
- 标准卡片圆角：`20rpx` 或 `24rpx`
- 内边距：页面边距使用 `30rpx`

## 常见模式

### 分页
```javascript
const currentPage = ref(1)
const hasMore = ref(true)

// 加载函数
const loadData = async (refresh = false) => {
  if (refresh) currentPage.value = 1
  const res = await api.getData({
    pageNum: currentPage.value,
    pageSize: 20
  })
  // 处理响应...
  if (res.data.rows.length < 20) hasMore.value = false
}
```

### 删除确认
删除前始终显示确认弹窗：
```javascript
uni.showModal({
  title: '确认删除',
  content: `确定要删除"${item.name}"吗？`,
  success: async (res) => {
    if (res.confirm) {
      // 删除逻辑
    }
  }
})
```

### 分类/内容计数验证
只允许在计数为 0 时删除：
```javascript
if (category.subCategorySize > 0) {
  uni.showToast({
    title: '该分类下还有子分类，无法删除',
    icon: 'none'
  })
  return
}
```

## 后端集成说明

- 后端运行在 `http://localhost:8080`
- 所有响应都包装在 `Result<T>` 中，包含 `code`、`message`、`data`、`success` 字段
- 认证使用 Authorization header 中的 Bearer token
- 文件上传通过单独的端点 `/file/upload` 处理
- Swagger 文档可在后端 URL 访问（需求文档中有引用）

## 微信小程序特性

- 使用 `uni.` API 而不是 web API（如 `uni.navigateTo` 而不是 `router.push`）
- 不支持 `@dblclick` - 使用带计时器的触摸事件检测双击
- 某些组件不支持 `@longpress` - 使用 `onTouchEnd` 时间检查实现
- 可滚动内容需要使用 `<scroll-view>`
- TabBar 配置在 `pages.json` 中
