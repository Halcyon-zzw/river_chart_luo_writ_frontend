<template>
  <view class="image-detail-page">
    <!-- 图片预览区域 -->
    <swiper
      class="image-swiper"
      :indicator-dots="images.length > 1"
      :autoplay="false"
      :circular="true"
      indicator-color="rgba(255, 255, 255, 0.3)"
      indicator-active-color="#00c4b3"
      @change="onSwiperChange"
    >
      <swiper-item v-for="(img, index) in images" :key="index">
        <view class="swiper-item-content">
          <image
            class="preview-image"
            :src="img"
            mode="aspectFit"
            @click="previewImage(index)"
          ></image>
        </view>
      </swiper-item>
    </swiper>

    <!-- 顶部操作栏 -->
    <view class="top-bar">
      <view class="top-left">
        <view class="back-btn" @click="goBack">
          <text class="icon-back">‹</text>
        </view>
      </view>
      <view class="top-right">
        <view class="action-btn" @click="toggleCollect">
          <text class="icon-heart">{{ isCollected ? '❤️' : '🤍' }}</text>
        </view>
        <view class="action-btn" @click="showMoreActions">
          <text class="icon-more">⋯</text>
        </view>
      </view>
    </view>

    <!-- 底部信息栏 -->
    <view class="bottom-info" :class="{ expanded: infoExpanded }">
      <view class="info-header" @click="toggleInfo">
        <view class="info-indicator"></view>
      </view>

      <view class="info-content">
        <!-- 标题 -->
        <text class="content-title">{{ contentDetail.title || '未命名' }}</text>

        <!-- 描述 -->
        <text v-if="contentDetail.description" class="content-desc">
          {{ contentDetail.description }}
        </text>

        <!-- 标签 -->
        <view v-if="contentDetail.tags && contentDetail.tags.length > 0" class="content-tags">
          <text
            v-for="tag in contentDetail.tags"
            :key="tag.id"
            class="tag-item"
          >
            {{ tag.name }}
          </text>
        </view>

        <!-- 元信息 -->
        <view class="content-meta">
          <text class="meta-item">
            <text class="meta-label">创建时间：</text>
            <text class="meta-value">{{ formatTime(contentDetail.createTime) }}</text>
          </text>
          <text v-if="contentDetail.category" class="meta-item">
            <text class="meta-label">分类：</text>
            <text class="meta-value">{{ contentDetail.category }}</text>
          </text>
        </view>

        <!-- 编辑按钮 -->
        <view class="action-buttons">
          <view class="action-button secondary" @click="editContent">
            <text>编辑</text>
          </view>
          <view class="action-button danger" @click="deleteContent">
            <text>删除</text>
          </view>
        </view>
      </view>
    </view>

    <!-- 更多操作弹窗 -->
    <view v-if="showActions" class="actions-mask" @click="hideMoreActions">
      <view class="actions-container" @click.stop>
        <view class="action-item" @click="downloadImage">
          <text class="action-icon">📥</text>
          <text class="action-text">保存到相册</text>
        </view>
        <view class="action-item" @click="shareContent">
          <text class="action-icon">📤</text>
          <text class="action-text">分享</text>
        </view>
        <view class="action-cancel" @click="hideMoreActions">
          <text>取消</text>
        </view>
      </view>
    </view>
  </view>
</template>

<script setup>
import { ref, computed, onMounted } from 'vue'
import { onLoad, onShow } from '@dcloudio/uni-app'
import { useCollectionStore } from '@/store/collection'
import { contentApi } from '@/api'

const collectionStore = useCollectionStore()

// 数据
const contentId = ref('')
const contentDetail = ref({})
const images = ref([])
const currentImageIndex = ref(0)
const infoExpanded = ref(false)
const showActions = ref(false)
let isFirstLoad = true

// 计算属性
const isCollected = computed(() => {
  return collectionStore.isCollected(contentId.value)
})

// 页面加载
onLoad((options) => {
  contentId.value = options.id
})

// 页面显示时刷新
onShow(() => {
  if (isFirstLoad) {
    isFirstLoad = false
    loadContentDetail()
    return
  }
  loadContentDetail()
})

// 加载内容详情
const loadContentDetail = async () => {
  try {
    const res = await contentApi.getContentById(contentId.value)
    contentDetail.value = res.data || res

    // 处理图片URL
    if (contentDetail.value.imageUrl) {
      // 如果是多张图片，后端可能返回逗号分隔的字符串或数组
      if (typeof contentDetail.value.imageUrl === 'string') {
        images.value = contentDetail.value.imageUrl.split(',').filter(url => url.trim())
      } else if (Array.isArray(contentDetail.value.imageUrl)) {
        images.value = contentDetail.value.imageUrl
      } else {
        images.value = [contentDetail.value.imageUrl]
      }
    }
  } catch (error) {
    console.error('Load content detail error:', error)
    uni.showToast({
      title: '加载失败',
      icon: 'none'
    })
  }
}

// Swiper切换
const onSwiperChange = (e) => {
  currentImageIndex.value = e.detail.current
}

// 预览图片
const previewImage = (index) => {
  uni.previewImage({
    urls: images.value,
    current: index
  })
}

// 返回
const goBack = () => {
  uni.navigateBack()
}

// 切换收藏
const toggleCollect = async () => {
  await collectionStore.toggleCollection(contentId.value)
}

// 展开/收起信息
const toggleInfo = () => {
  infoExpanded.value = !infoExpanded.value
}

// 显示更多操作
const showMoreActions = () => {
  showActions.value = true
}

// 隐藏更多操作
const hideMoreActions = () => {
  showActions.value = false
}

// 下载图片
const downloadImage = () => {
  hideMoreActions()

  const currentImage = images.value[currentImageIndex.value]
  if (!currentImage) return

  uni.downloadFile({
    url: currentImage,
    success: (res) => {
      if (res.statusCode === 200) {
        uni.saveImageToPhotosAlbum({
          filePath: res.tempFilePath,
          success: () => {
            uni.showToast({
              title: '已保存到相册',
              icon: 'success'
            })
          },
          fail: () => {
            uni.showToast({
              title: '保存失败',
              icon: 'none'
            })
          }
        })
      }
    },
    fail: () => {
      uni.showToast({
        title: '下载失败',
        icon: 'none'
      })
    }
  })
}

// 分享内容
const shareContent = () => {
  hideMoreActions()
  uni.showToast({
    title: '分享功能开发中',
    icon: 'none'
  })
}

// 编辑内容
const editContent = () => {
  uni.navigateTo({
    url: `/pages/content/create-image/create-image?id=${contentId.value}&mode=edit&subCategoryId=${contentDetail.value.subCategoryId}&mainCategoryId=${contentDetail.value.mainCategoryId}`
  })
}

// 删除内容
const deleteContent = () => {
  uni.showModal({
    title: '确认删除',
    content: '删除后无法恢复，确定要删除吗？',
    success: async (res) => {
      if (res.confirm) {
        try {
          await contentApi.deleteContent(contentId.value)
          uni.showToast({
            title: '删除成功',
            icon: 'success'
          })
          setTimeout(() => {
            uni.navigateBack()
          }, 1500)
        } catch (error) {
          uni.showToast({
            title: '删除失败',
            icon: 'none'
          })
        }
      }
    }
  })
}

// 格式化时间
const formatTime = (time) => {
  if (!time) return ''
  const date = new Date(time)
  return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}-${String(date.getDate()).padStart(2, '0')} ${String(date.getHours()).padStart(2, '0')}:${String(date.getMinutes()).padStart(2, '0')}`
}
</script>

<style scoped>
.image-detail-page {
  width: 100vw;
  height: 100vh;
  background: #000000;
  position: relative;
}

/* 图片轮播 */
.image-swiper {
  width: 100%;
  height: 100%;
}

.swiper-item-content {
  width: 100%;
  height: 100%;
  display: flex;
  align-items: center;
  justify-content: center;
}

.preview-image {
  width: 100%;
  height: 100%;
}

/* 顶部操作栏 */
.top-bar {
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  height: 88rpx;
  padding-top: constant(safe-area-inset-top);
  padding-top: env(safe-area-inset-top);
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding-left: 20rpx;
  padding-right: 20rpx;
  background: linear-gradient(180deg, rgba(0, 0, 0, 0.6) 0%, transparent 100%);
  z-index: 100;
}

.top-left,
.top-right {
  display: flex;
  align-items: center;
  gap: 20rpx;
}

.back-btn,
.action-btn {
  width: 72rpx;
  height: 72rpx;
  background: rgba(0, 0, 0, 0.5);
  backdrop-filter: blur(10rpx);
  border-radius: 36rpx;
  display: flex;
  align-items: center;
  justify-content: center;
}

.icon-back {
  font-size: 56rpx;
  color: #ffffff;
  line-height: 1;
  font-weight: 300;
}

.icon-heart,
.icon-more {
  font-size: 36rpx;
}

/* 底部信息栏 */
.bottom-info {
  position: fixed;
  bottom: 0;
  left: 0;
  right: 0;
  max-height: 60%;
  background: rgba(255, 255, 255, 0.98);
  backdrop-filter: blur(20rpx);
  border-radius: 32rpx 32rpx 0 0;
  transition: transform 0.3s ease;
  transform: translateY(calc(100% - 120rpx));
  z-index: 99;
}

.bottom-info.expanded {
  transform: translateY(0);
}

.info-header {
  height: 80rpx;
  display: flex;
  align-items: center;
  justify-content: center;
  cursor: pointer;
}

.info-indicator {
  width: 80rpx;
  height: 8rpx;
  background: rgba(0, 0, 0, 0.1);
  border-radius: 4rpx;
}

.info-content {
  padding: 0 40rpx 60rpx;
  padding-bottom: calc(60rpx + constant(safe-area-inset-bottom));
  padding-bottom: calc(60rpx + env(safe-area-inset-bottom));
  overflow-y: auto;
  max-height: calc(60vh - 80rpx);
}

.content-title {
  display: block;
  font-size: 40rpx;
  font-weight: 700;
  color: #333333;
  margin-bottom: 20rpx;
}

.content-desc {
  display: block;
  font-size: 28rpx;
  color: #666666;
  line-height: 1.6;
  margin-bottom: 24rpx;
}

.content-tags {
  display: flex;
  flex-wrap: wrap;
  gap: 16rpx;
  margin-bottom: 32rpx;
}

.tag-item {
  padding: 12rpx 24rpx;
  background: rgba(0, 196, 179, 0.15);
  border: 1rpx solid rgba(0, 196, 179, 0.3);
  border-radius: 8rpx;
  font-size: 24rpx;
  color: #00c4b3;
}

.content-meta {
  display: flex;
  flex-direction: column;
  gap: 16rpx;
  margin-bottom: 32rpx;
  padding: 24rpx;
  background: rgba(255, 255, 255, 0.1);
  border-radius: 16rpx;
}

.meta-item {
  font-size: 26rpx;
  color: #666666;
}

.meta-label {
  color: #999999;
}

.meta-value {
  color: #333333;
}

/* 操作按钮 */
.action-buttons {
  display: flex;
  gap: 20rpx;
}

.action-button {
  flex: 1;
  height: 88rpx;
  border-radius: 16rpx;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 30rpx;
  font-weight: 500;
  transition: all 0.2s ease;
}

.action-button.secondary {
  background: rgba(0, 0, 0, 0.08);
  color: #333333;
}

.action-button.secondary:active {
  background: rgba(0, 0, 0, 0.12);
}

.action-button.danger {
  background: rgba(255, 59, 48, 0.15);
  color: #ff3b30;
}

.action-button.danger:active {
  background: rgba(255, 59, 48, 0.25);
}

/* 更多操作弹窗 */
.actions-mask {
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background: rgba(0, 0, 0, 0.6);
  z-index: 999;
  display: flex;
  align-items: flex-end;
}

.actions-container {
  width: 100%;
  background: #ffffff;
  border-radius: 32rpx 32rpx 0 0;
  padding: 40rpx 30rpx;
  padding-bottom: calc(40rpx + constant(safe-area-inset-bottom));
  padding-bottom: calc(40rpx + env(safe-area-inset-bottom));
  animation: slideUp 0.3s ease;
}

@keyframes slideUp {
  from {
    transform: translateY(100%);
  }
  to {
    transform: translateY(0);
  }
}

.action-item {
  display: flex;
  align-items: center;
  padding: 32rpx 30rpx;
  background: rgba(0, 0, 0, 0.03);
  border-radius: 16rpx;
  margin-bottom: 20rpx;
}

.action-item:active {
  background: rgba(0, 0, 0, 0.08);
}

.action-icon {
  font-size: 44rpx;
  margin-right: 24rpx;
}

.action-text {
  font-size: 32rpx;
  color: #333333;
  font-weight: 500;
}

.action-cancel {
  margin-top: 20rpx;
  padding: 28rpx;
  text-align: center;
  background: rgba(0, 0, 0, 0.03);
  border-radius: 16rpx;
  font-size: 32rpx;
  color: #999999;
}

.action-cancel:active {
  background: rgba(0, 0, 0, 0.08);
}
</style>
