<template>
  <view :class="['network-image', height === 'auto' ? 'auto-height-container' : '']" :style="{ width: width, height: height }">
    <!-- 加载中 -->
    <view v-if="loading" class="image-loading">
      <text class="loading-text">加载中...</text>
    </view>

    <!-- 加载失败 -->
    <view v-if="error" class="image-error" @click="retry">
      <text class="error-text">加载失败，点击重试</text>
    </view>

    <!-- 图片显示 - 移除 v-else-if，改为 v-if -->
    <image
      v-if="localPath && !loading && !error"
      :class="['network-image-content', height === 'auto' ? 'auto-height' : '']"
      :src="localPath"
      :mode="mode"
      :style="{
        display: 'block',
        width: '100%',
        minHeight: height === 'auto' ? '300rpx' : 'auto',
        backgroundColor: 'rgba(0, 255, 0, 0.1)'
      }"
      @load="onImageLoad"
      @error="onImageError"
    />

    <!-- 调试信息 -->
    <view v-if="localPath" style="padding: 10rpx; background: yellow; font-size: 20rpx; word-break: break-all;">
      <text>Path: {{ localPath }}</text>
      <text style="display: block;">loading: {{ loading }}</text>
      <text style="display: block;">error: {{ error }}</text>
    </view>
  </view>
</template>

<script setup>
import { ref, watch } from 'vue'

const props = defineProps({
  // 网络图片URL
  src: {
    type: String,
    required: true
  },
  // 图片显示模式
  mode: {
    type: String,
    default: 'aspectFill'
  },
  // 宽度
  width: {
    type: String,
    default: '100%'
  },
  // 高度
  height: {
    type: String,
    default: 'auto'
  }
})

const emit = defineEmits(['error'])

const loading = ref(true)
const error = ref(false)
const localPath = ref('')

// 内存缓存：URL -> 本地路径
const imageCache = new Map()

/**
 * 下载网络图片到本地
 */
const downloadImage = async () => {
  if (!props.src) {
    error.value = true
    loading.value = false
    return
  }

  // 检查缓存
  if (imageCache.has(props.src)) {
    localPath.value = imageCache.get(props.src)
    loading.value = false
    return
  }

  loading.value = true
  error.value = false

  try {
    const downloadTask = uni.downloadFile({
      url: props.src,
      header: {
        'ngrok-skip-browser-warning': '1',
        'X-Client-Type': 'RiverChartLuoWrit-MiniProgram',
        'X-Client-Version': '1.0.0'
      },
      success: (res) => {
        console.log('[NetworkImage] Download response:', JSON.stringify(res))
        console.log('[NetworkImage] Download tempFilePath type:', typeof res.tempFilePath)
        console.log('[NetworkImage] Download tempFilePath value:', res.tempFilePath)
        if (res.statusCode === 200) {
          // 下载成功，保存本地临时路径
          localPath.value = res.tempFilePath
          // 添加到缓存
          imageCache.set(props.src, res.tempFilePath)
          loading.value = false
          console.log('[NetworkImage] Download success:', props.src, '-> ', res.tempFilePath)
          console.log('[NetworkImage] localPath.value set to:', localPath.value)
        } else {
          console.error('[NetworkImage] Download failed:', res.statusCode, props.src, res)
          error.value = true
          loading.value = false
        }
      },
      fail: (err) => {
        console.error('[NetworkImage] Download error:', err, props.src)
        error.value = true
        loading.value = false
      }
    })
  } catch (err) {
    console.error('[NetworkImage] Exception:', err, props.src)
    error.value = true
    loading.value = false
  }
}

/**
 * 图片加载成功处理
 */
const onImageLoad = (e) => {
  console.log('[NetworkImage] Image load success:', localPath.value, 'size:', e.detail.width, 'x', e.detail.height)
}

/**
 * 图片加载失败处理
 */
const onImageError = (e) => {
  console.error('[NetworkImage] Image load error:', e, 'localPath:', localPath.value, 'src:', props.src)
  error.value = true
  loading.value = false
  emit('error', e)
}

/**
 * 重试加载
 */
const retry = () => {
  // 清除缓存
  imageCache.delete(props.src)
  localPath.value = ''
  downloadImage()
}

// 监听 localPath 变化，用于调试
watch(localPath, (newPath, oldPath) => {
  console.log('[NetworkImage] localPath changed from:', oldPath, 'to:', newPath)
  console.log('[NetworkImage] loading:', loading.value, 'error:', error.value)
})

// 监听 height 变化，用于调试
watch(() => props.height, (newHeight) => {
  console.log('[NetworkImage] height prop:', newHeight)
  console.log('[NetworkImage] will add auto-height-container class:', newHeight === 'auto')
})

// 监听 src 变化，immediate: true 会在组件挂载时自动调用
watch(() => props.src, (newSrc) => {
  console.log('[NetworkImage] src changed:', newSrc)
  console.log('[NetworkImage] current height prop:', props.height)
  if (newSrc) {
    downloadImage()
  }
}, { immediate: true })
</script>

<style scoped>
.network-image {
  position: relative;
  overflow: visible; /* 改为 visible，让图片可以显示 */
  background: rgba(255, 0, 0, 0.1); /* 临时调试：红色半透明背景 */
  min-height: 400rpx; /* 增加最小高度，确保图片可见 */
}

.network-image-content {
  width: 100%;
  height: 100%;
  display: block;
  object-fit: contain; /* 确保图片按比例缩放 */
}

/* 当 height prop 不是 auto 时，使用 flex 居中 */
.network-image:not(.auto-height-container) {
  display: flex;
  align-items: center;
  justify-content: center;
}

/* 当高度为auto时，图片高度自适应 */
.network-image.auto-height-container .network-image-content,
.network-image-content.auto-height {
  height: auto !important;
  max-width: 100%;
  vertical-align: top; /* 避免底部空白 */
}

.image-loading {
  display: flex;
  align-items: center;
  justify-content: center;
  width: 100%;
  height: 100%;
  background: #f5f5f5;
}

.loading-text {
  font-size: 24rpx;
  color: #999999;
}

.image-error {
  display: flex;
  align-items: center;
  justify-content: center;
  width: 100%;
  height: 100%;
  background: #f5f5f5;
  cursor: pointer;
}

.error-text {
  font-size: 24rpx;
  color: #ff4444;
}
</style>
