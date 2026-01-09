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
终端使用命令开启：
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

**API 文档：**
- 在线文档：https://github.com/Halcyon-zzw/river_chart_luo_writ/blob/feat_browse/docs/river_chart_luo_writ.json
- 本地文档：`src/demand/river_chart_luo_writ.json`（OpenAPI 3.0 格式）

**API 模块：** `src/api/`
- `request.js` - HTTP 封装，包含拦截器（token、loading、错误处理）
- `category.js` - 主分类/子分类 CRUD
- `content.js` - 图片/笔记内容 CRUD
- `tag.js` - 标签管理
- `collection.js` - 用户收藏
- `user.js` - 认证

**搜索/分页接口：**
```javascript
// 主分类分页 - POST /main-category/page
{
  pageNum: 1,
  pageSize: 20,
  name: '搜索关键词'  // 可选，支持模糊搜索
}

// 子分类分页 - POST /sub-category/page
{
  pageNum: 1,
  pageSize: 20,
  mainCategoryId: 123,  // 必填
  name: '搜索关键词'     // 可选
}

// 内容分页 - POST /content/page
{
  pageNum: 1,
  pageSize: 20,
  subCategoryId: 456,    // 必填
  contentType: 'note',   // 可选：'image' 或 'note'
  title: '搜索关键词'     // 可选，搜索标题
}

// 标签查询 - GET /tag/query?name=xxx
// 支持模糊搜索标签名称
```

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
- **编辑图标规范**：使用笔头向左的图标（通过 CSS transform: scaleX(-1) 实现水平翻转）
- **动态滑动距离**：根据显示的操作按钮数量动态计算滑动距离
  ```javascript
  // 每个按钮宽度为 100rpx
  const buttonCount = 2  // 编辑 + 删除
  const swipeDistance = -buttonCount * 100  // -200rpx

  // 在 onTouchEnd 中应用
  if (swipeX.value < -80) {
    swipeX.value = swipeDistance
  }
  ```
  如果只有1个按钮（如仅删除），则 `swipeDistance = -100rpx`；如果有3个按钮，则 `-300rpx`。

**长按批量操作：**
- 长按（>500ms）进入选择模式
- 显示复选框和底部工具栏
- 只有数量为 0 的项目可以被选中删除
- 点击取消按钮退出

**内容类型标签：**
内容列表页有图片/笔记标签。查询参数：`contentType: 'image' | 'note'`

**标签管理：**
所有列表页（主分类、子分类、内容）和创建/编辑页都支持标签功能：

1. **列表页标签删除**：
   - 长按标签进入删除模式，标签右上角显示 ✕
   - 点击 ✕ 删除标签关联
   - 再次长按任意标签退出删除模式

2. **创建/编辑页标签操作**：
   - 标签右上角默认显示 ✕（无需长按）
   - 点击"+ 添加标签"打开标签选择器
   - 标签选择器支持：搜索、多选、创建新标签
   - 编辑模式下确认选择后立即调用批量关联 API

3. **批量关联 API**：
   ```javascript
   // 主分类
   await tagApi.batchLinkMainCategory({
     mainCategoryId: id,
     tagIds: [1, 2, 3]
   })

   // 子分类
   await tagApi.batchLinkSubCategory({
     subCategoryId: id,
     tagIds: [1, 2, 3]
   })

   // 内容
   await tagApi.batchLinkContent({
     contentId: id,
     tagIds: [1, 2, 3]
   })
   ```

4. **标签选择器组件**（`/src/components/tag-selector/tag-selector.vue`）：
   - Props: `visible`（显示/隐藏）、`selectedTagIds`（已选标签 ID 数组）
   - Events: `update:visible`、`confirm`（确认选择，返回标签对象数组）、`cancel`
   - 功能：搜索标签、创建新标签、多选、显示已选标签并支持删除

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

// 示例：编辑主分类
url: `/pages/category/create-main-category/create-main-category?id=${id}&mode=edit`

// 示例：编辑子分类
url: `/pages/category/create-sub-category/create-sub-category?id=${id}&mode=edit&mainCategoryId=${mainId}`

// 示例：编辑内容
url: `/pages/content/create-note/create-note?id=${id}&mode=edit&subCategoryId=${subId}`
```

**编辑模式支持**：
- 使用 `mode=edit` 查询参数区分创建和编辑模式
- 所有创建页面（create-main-category、create-sub-category、create-note、create-image）都支持编辑模式
- 编辑模式下：
  - 页面标题自动更新为"编辑XXX"
  - 提交按钮文本显示"保存"而非"创建"
  - onLoad 时自动加载现有数据填充表单
  - 标签选择确认后立即调用批量关联 API（而不是等到提交时）
  - 提交时调用 update API 而非 create API

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
