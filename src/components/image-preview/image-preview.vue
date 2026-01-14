<template>
  <view v-if="visible" class="preview-container" @touchmove.stop.prevent>
    <!-- 顶部导航栏 -->
    <view class="preview-navbar" :style="{ paddingTop: statusBarHeight + 'px' }">
      <view class="navbar-content" :style="{ height: navBarHeight + 'px' }">
        <view class="navbar-left" @click="handleBack">
          <text class="back-icon">‹</text>
          <text class="back-text">返回</text>
        </view>
        <view class="navbar-title">
          <text>{{ currentContentTitle }}</text>
        </view>
        <view class="navbar-right" @click="handleClose">
          <text class="close-icon">×</text>
        </view>
      </view>
    </view>

    <!-- 图片预览区域 -->
    <swiper
      class="preview-swiper"
      :current="currentIndex"
      @change="onSwiperChange"
      @transition="onSwiperTransition"
      @animationfinish="onAnimationFinish"
    >
      <swiper-item
        v-for="(item, index) in allImages"
        :key="`${item.contentId}-${item.imageIndex}`"
        class="swiper-item"
      >
        <view
          class="image-wrapper"
          @touchstart="onImageTouchStart"
          @touchmove="onImageTouchMove"
          @touchend="onImageTouchEnd"
        >
          <image
            class="preview-image"
            :src="getFullImageUrl(item.url)"
            mode="aspectFit"
            :style="{
              transform: `scale(${item.scale}) translate(${item.translateX}px, ${item.translateY}px)`
            }"
          />
        </view>
      </swiper-item>
    </swiper>

    <!-- 底部位置指示器 -->
    <view class="preview-indicator">
      <text class="indicator-text">{{ currentImagePosition }} / {{ currentContentImagesCount }}</text>
    </view>

    <!-- 图片说明（如果有） -->
    <view v-if="currentImageCaption" class="preview-caption">
      <text class="caption-text">{{ currentImageCaption }}</text>
    </view>
  </view>
</template>

<script setup>
import { ref, computed, watch, onMounted } from 'vue'
import { getFullImageUrl } from '@/utils/image'

const props = defineProps({
  visible: {
    type: Boolean,
    default: false
  },
  contentList: {
    type: Array,
    default: () => []
  },
  initialContentIndex: {
    type: Number,
    default: 0
  },
  initialImageIndex: {
    type: Number,
    default: 0
  }
})

const emit = defineEmits(['update:visible', 'close'])

// 导航栏高度（与 custom-nav-bar 保持一致）
const statusBarHeight = ref(0)
const navBarHeight = ref(44)

// 获取系统信息并计算导航栏高度
onMounted(() => {
  const systemInfo = uni.getSystemInfoSync()
  statusBarHeight.value = systemInfo.statusBarHeight || 0

  // 不同平台的导航栏高度
  // #ifdef MP-WEIXIN
  const menuButtonInfo = uni.getMenuButtonBoundingClientRect()
  navBarHeight.value = (menuButtonInfo.top - statusBarHeight.value) * 2 + menuButtonInfo.height
  // #endif

  // #ifdef APP-PLUS
  navBarHeight.value = 44
  // #endif
})

// 当前索引
const currentIndex = ref(0)

// 展开所有图片为扁平列表
const allImages = computed(() => {
  const images = []
  props.contentList.forEach((content, contentIndex) => {
    if (content.contentType === 'image' && content.imageUrlList && content.imageUrlList.length > 0) {
      content.imageUrlList.forEach((url, imageIndex) => {
        images.push({
          url,
          contentId: content.id,
          contentIndex,
          imageIndex,
          contentTitle: content.title || '未命名',
          caption: content.noteContent || '',
          scale: 1,
          translateX: 0,
          translateY: 0
        })
      })
    }
  })
  return images
})

// 当前内容的图片数量
const currentContentImagesCount = computed(() => {
  if (allImages.value.length === 0) return 0
  const currentImage = allImages.value[currentIndex.value]
  if (!currentImage) return 0

  // 找到当前内容
  const content = props.contentList[currentImage.contentIndex]
  if (!content || !content.imageUrlList) return 0

  return content.imageUrlList.length
})

// 当前图片在当前内容中的位置（1-based）
const currentImagePosition = computed(() => {
  if (allImages.value.length === 0) return 1
  const currentImage = allImages.value[currentIndex.value]
  if (!currentImage) return 1

  // imageIndex 就是该图片在当前内容中的索引
  return currentImage.imageIndex + 1
})

// 当前内容标题
const currentContentTitle = computed(() => {
  if (allImages.value.length === 0) return ''
  return allImages.value[currentIndex.value]?.contentTitle || '未命名'
})

// 当前图片说明
const currentImageCaption = computed(() => {
  if (allImages.value.length === 0) return ''
  return allImages.value[currentIndex.value]?.caption || ''
})

// 初始化索引
watch(() => props.visible, (newVal) => {
  if (newVal) {
    // 计算初始索引
    let targetIndex = 0
    let imageCount = 0

    for (let i = 0; i < props.initialContentIndex; i++) {
      const content = props.contentList[i]
      if (content.contentType === 'image' && content.imageUrlList) {
        imageCount += content.imageUrlList.length
      }
    }

    targetIndex = imageCount + props.initialImageIndex
    currentIndex.value = targetIndex
  }
})

// Swiper 切换事件
const onSwiperChange = (e) => {
  currentIndex.value = e.detail.current
  // 重置缩放
  if (allImages.value[currentIndex.value]) {
    allImages.value[currentIndex.value].scale = 1
    allImages.value[currentIndex.value].translateX = 0
    allImages.value[currentIndex.value].translateY = 0
  }
}

const onSwiperTransition = (e) => {
  // 可以添加过渡动画处理
}

const onAnimationFinish = (e) => {
  // 动画完成处理
}

// 双指缩放相关
const touchPoints = ref([])
const lastScale = ref(1)
const lastTranslate = ref({ x: 0, y: 0 })

const onImageTouchStart = (e) => {
  if (e.touches.length === 2) {
    // 双指触摸，准备缩放
    touchPoints.value = [
      { x: e.touches[0].clientX, y: e.touches[0].clientY },
      { x: e.touches[1].clientX, y: e.touches[1].clientY }
    ]
    const currentImage = allImages.value[currentIndex.value]
    lastScale.value = currentImage.scale
  } else if (e.touches.length === 1) {
    // 单指触摸，准备拖动（仅在放大时）
    const currentImage = allImages.value[currentIndex.value]
    if (currentImage.scale > 1) {
      lastTranslate.value = { x: currentImage.translateX, y: currentImage.translateY }
    }
  }
}

const onImageTouchMove = (e) => {
  if (e.touches.length === 2) {
    // 双指缩放
    const newPoints = [
      { x: e.touches[0].clientX, y: e.touches[0].clientY },
      { x: e.touches[1].clientX, y: e.touches[1].clientY }
    ]

    const oldDistance = Math.sqrt(
      Math.pow(touchPoints.value[1].x - touchPoints.value[0].x, 2) +
      Math.pow(touchPoints.value[1].y - touchPoints.value[0].y, 2)
    )

    const newDistance = Math.sqrt(
      Math.pow(newPoints[1].x - newPoints[0].x, 2) +
      Math.pow(newPoints[1].y - newPoints[0].y, 2)
    )

    const scale = (newDistance / oldDistance) * lastScale.value

    // 限制缩放范围 0.5 - 3
    const currentImage = allImages.value[currentIndex.value]
    currentImage.scale = Math.max(0.5, Math.min(3, scale))
  } else if (e.touches.length === 1) {
    // 单指拖动（仅在放大时）
    const currentImage = allImages.value[currentIndex.value]
    if (currentImage.scale > 1) {
      const touch = e.touches[0]
      const deltaX = touch.clientX - (touchPoints.value[0]?.x || touch.clientX)
      const deltaY = touch.clientY - (touchPoints.value[0]?.y || touch.clientY)

      currentImage.translateX = lastTranslate.value.x + deltaX
      currentImage.translateY = lastTranslate.value.y + deltaY
    }
  }
}

const onImageTouchEnd = (e) => {
  touchPoints.value = []

  // 如果缩放比例接近1，则重置为1
  const currentImage = allImages.value[currentIndex.value]
  if (currentImage && Math.abs(currentImage.scale - 1) < 0.1) {
    currentImage.scale = 1
    currentImage.translateX = 0
    currentImage.translateY = 0
  }
}

// 返回按钮
const handleBack = () => {
  emit('close')
  emit('update:visible', false)
}

// 关闭按钮
const handleClose = () => {
  emit('close')
  emit('update:visible', false)
}
</script>

<style scoped>
.preview-container {
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  z-index: 9999;
  background: #ffffff;
}

/* 顶部导航栏 - 与 custom-nav-bar 保持一致 */
.preview-navbar {
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  background: #ffffff;
  border-bottom: 1rpx solid rgba(0, 0, 0, 0.1);
  z-index: 10000;
}

.navbar-content {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 0 16rpx;
  position: relative;
}

.navbar-left {
  display: flex;
  align-items: center;
  min-width: 120rpx;
  height: 100%;
  z-index: 2;
}

.back-icon {
  font-size: 48rpx;
  font-weight: 300;
  color: #000000;
  line-height: 1;
  margin-right: 4rpx;
}

.back-text {
  font-size: 28rpx;
  color: #000000;
}

.navbar-title {
  position: absolute;
  left: 50%;
  transform: translateX(-50%);
  font-size: 32rpx;
  font-weight: 600;
  color: #000000;
  max-width: 60%;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
  text-align: center;
}

.navbar-right {
  min-width: 120rpx;
  display: flex;
  align-items: center;
  justify-content: flex-end;
  z-index: 2;
}

.close-icon {
  font-size: 48rpx;
  font-weight: 300;
  color: #000000;
  line-height: 1;
}

/* 图片预览区域 */
.preview-swiper {
  width: 100%;
  height: 100vh;
}

.swiper-item {
  display: flex;
  align-items: center;
  justify-content: center;
}

.image-wrapper {
  width: 100%;
  height: 100%;
  display: flex;
  align-items: center;
  justify-content: center;
}

.preview-image {
  max-width: 100%;
  max-height: 100%;
  transition: transform 0.2s ease;
}

/* 底部位置指示器 */
.preview-indicator {
  position: fixed;
  bottom: 200rpx;
  bottom: calc(200rpx + constant(safe-area-inset-bottom));
  bottom: calc(200rpx + env(safe-area-inset-bottom));
  left: 50%;
  transform: translateX(-50%);
  padding: 12rpx 32rpx;
  background: rgba(0, 0, 0, 0.08);
  backdrop-filter: blur(10rpx);
  border-radius: 40rpx;
  z-index: 10000;
}

.indicator-text {
  font-size: 28rpx;
  color: #333333;
  font-weight: 500;
}

/* 图片说明 */
.preview-caption {
  position: fixed;
  bottom: 80rpx;
  bottom: calc(80rpx + constant(safe-area-inset-bottom));
  bottom: calc(80rpx + env(safe-area-inset-bottom));
  left: 30rpx;
  right: 30rpx;
  padding: 20rpx 30rpx;
  background: rgba(0, 0, 0, 0.05);
  backdrop-filter: blur(10rpx);
  border-radius: 16rpx;
  border: 1rpx solid rgba(0, 0, 0, 0.08);
  z-index: 10000;
}

.caption-text {
  font-size: 26rpx;
  color: #666666;
  line-height: 1.6;
  display: -webkit-box;
  -webkit-box-orient: vertical;
  -webkit-line-clamp: 3;
  overflow: hidden;
}
</style>
