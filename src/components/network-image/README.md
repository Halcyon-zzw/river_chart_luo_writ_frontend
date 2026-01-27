# NetworkImage 组件

解决微信小程序真机环境下，使用 ngrok 时图片加载 404 的问题。

## 问题背景

- 微信小程序 `<image>` 标签无法自定义请求头
- ngrok 免费版要求添加 `ngrok-skip-browser-warning` 请求头
- 真机环境下图片加载会被 ngrok 拦截返回 404

## 解决方案

使用 `uni.downloadFile` API 下载图片到本地临时目录，该 API 支持自定义请求头。

## 功能特性

- ✅ 自动添加 ngrok 跳过警告的请求头
- ✅ 内存缓存（同一 URL 只下载一次）
- ✅ 加载状态显示
- ✅ 错误处理和重试
- ✅ 支持所有 image 组件的 mode 属性
- ✅ 支持自定义宽高

## 使用方法

### 1. 引入组件

```vue
<script setup>
import NetworkImage from '@/components/network-image/network-image.vue'
</script>
```

### 2. 使用组件

#### 基本用法
```vue
<network-image
  :src="imageUrl"
/>
```

#### 完整用法
```vue
<network-image
  :src="imageUrl"
  mode="aspectFill"
  width="200rpx"
  height="200rpx"
/>
```

## Props

| 参数 | 类型 | 默认值 | 说明 |
|------|------|--------|------|
| src | String | - | 必填，图片URL |
| mode | String | 'aspectFill' | 图片裁剪、缩放模式，同 image 组件 |
| width | String | '100%' | 图片宽度 |
| height | String | 'auto' | 图片高度 |

## 替换示例

### 替换前
```vue
<image
  :src="getFullImageUrl(item.url)"
  mode="aspectFill"
  class="gallery-image"
/>
```

### 替换后
```vue
<network-image
  :src="getFullImageUrl(item.url)"
  mode="aspectFill"
  width="100%"
  height="100%"
/>
```

## 需要替换的页面

以下页面使用了网络图片，需要将 `<image>` 替换为 `<network-image>`：

1. **内容列表页** (`src/pages/category/content-list/content-list.vue`)
   - 图片内容的缩略图展示

2. **图片详情页** (`src/pages/content/image-detail/image-detail.vue`)
   - 图片轮播展示

3. **图片预览组件** (`src/components/image-preview/image-preview.vue`)
   - 全屏图片预览

4. **收藏列表页** (`src/pages/tabbar/collection/collection.vue`)
   - 收藏的图片内容展示

5. **最近浏览页** (`src/pages/tabbar/recent/recent.vue`)
   - 浏览历史中的图片展示

6. **图片创建/编辑页** (`src/pages/content/create-image/create-image.vue`)
   - 已上传图片的预览

## 注意事项

1. **仅在需要时使用**
   - 本地图片（如静态资源）不需要使用此组件
   - 只有通过 ngrok 访问的后端图片才需要

2. **性能考虑**
   - 组件内置了内存缓存，同一 URL 只下载一次
   - 但小程序临时文件有容量限制，过多图片可能导致清理

3. **开发环境**
   - 开发者工具和真机都可以使用
   - 电脑端开发时也能正常工作

## 技术实现

```javascript
// 下载图片时添加自定义请求头
uni.downloadFile({
  url: imageUrl,
  header: {
    'ngrok-skip-browser-warning': '1',
    'X-Client-Type': 'RiverChartLuoWrit-MiniProgram',
    'X-Client-Version': '1.0.0'
  },
  success: (res) => {
    // 使用临时文件路径显示图片
    localPath = res.tempFilePath
  }
})
```
