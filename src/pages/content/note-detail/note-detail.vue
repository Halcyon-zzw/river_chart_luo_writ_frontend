<template>
  <view class="note-detail-page">
    <!-- 自定义导航栏 -->
    <custom-nav-bar title="笔记详情" />

    <scroll-view class="note-scroll" scroll-y>
      <!-- 标题 -->
      <view class="note-header">
        <text class="note-title">{{ contentDetail.title || '未命名笔记' }}</text>

        <!-- 元信息 -->
        <view class="note-meta">
          <text class="meta-text">{{ formatTime(contentDetail.createTime) }}</text>
          <text v-if="contentDetail.category" class="meta-text">{{ contentDetail.category }}</text>
        </view>

        <!-- 描述 -->
        <text v-if="contentDetail.description" class="note-description">
          {{ contentDetail.description }}
        </text>

        <!-- 标签 -->
        <view v-if="contentDetail.tagDTOList && contentDetail.tagDTOList.length > 0" class="note-tags">
          <text
            v-for="tag in contentDetail.tagDTOList"
            :key="tag.id"
            class="tag-item"
          >
            {{ tag.name }}
          </text>
        </view>
      </view>

      <!-- 富文本内容 -->
      <view class="note-content" @tap="handleContentTap">
        <rich-text :nodes="contentDetail.noteContent || ''"></rich-text>
      </view>

      <!-- 底部占位 -->
      <view class="bottom-placeholder"></view>
    </scroll-view>

    <!-- 底部操作栏 -->
    <view class="bottom-toolbar">
      <view class="toolbar-item" @click="toggleCollect">
        <text class="toolbar-icon">{{ isCollected ? '❤️' : '🤍' }}</text>
        <text class="toolbar-text">{{ isCollected ? '已收藏' : '收藏' }}</text>
      </view>

      <view class="toolbar-item" @click="editContent">
        <text class="toolbar-icon">✏️</text>
        <text class="toolbar-text">编辑</text>
      </view>

      <view class="toolbar-item" @click="shareContent">
        <text class="toolbar-icon">📤</text>
        <text class="toolbar-text">分享</text>
      </view>

      <view class="toolbar-item" @click="deleteContent">
        <text class="toolbar-icon">🗑️</text>
        <text class="toolbar-text">删除</text>
      </view>
    </view>
  </view>
</template>

<script setup>
import { ref, computed } from 'vue'
import { onLoad, onShow } from '@dcloudio/uni-app'
import { useCollectionStore } from '@/store/collection'
import { contentApi } from '@/api'
import CustomNavBar from '@/components/custom-nav-bar/custom-nav-bar.vue'

const collectionStore = useCollectionStore()

// 数据
const contentId = ref('')
const contentDetail = ref({})
let isFirstLoad = true
let lastTapTime = 0

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
  } catch (error) {
    console.error('Load content detail error:', error)
    uni.showToast({
      title: '加载失败',
      icon: 'none'
    })
  }
}

// 切换收藏
const toggleCollect = async () => {
  await collectionStore.toggleCollection(contentId.value)
}

// 处理内容区域点击（双击检测）
const handleContentTap = () => {
  const currentTime = Date.now()
  const timeDiff = currentTime - lastTapTime

  if (timeDiff < 300) {
    // 双击
    editContent()
  }

  lastTapTime = currentTime
}

// 编辑内容
const editContent = () => {
  uni.navigateTo({
    url: `/pages/content/create-note/create-note?id=${contentId.value}&mode=edit&subCategoryId=${contentDetail.value.subCategoryId}&mainCategoryId=${contentDetail.value.mainCategoryId}`
  })
}

// 分享内容
const shareContent = () => {
  uni.showToast({
    title: '分享功能开发中',
    icon: 'none'
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
.note-detail-page {
  min-height: 100vh;
  background: #f5f5f5;
  display: flex;
  flex-direction: column;
}

/* 滚动容器 */
.note-scroll {
  flex: 1;
  padding-bottom: calc(120rpx + constant(safe-area-inset-bottom));
  padding-bottom: calc(120rpx + env(safe-area-inset-bottom));
}

/* 笔记头部 */
.note-header {
  padding: 40rpx 40rpx 30rpx;
  border-bottom: 1rpx solid rgba(0, 0, 0, 0.08);
}

.note-title {
  display: block;
  font-size: 48rpx;
  font-weight: 700;
  color: #333333;
  line-height: 1.4;
  margin-bottom: 24rpx;
}

.note-meta {
  display: flex;
  gap: 24rpx;
  margin-bottom: 20rpx;
}

.meta-text {
  font-size: 24rpx;
  color: #999999;
}

.note-description {
  display: block;
  font-size: 28rpx;
  color: #666666;
  line-height: 1.6;
  margin-top: 20rpx;
  margin-bottom: 20rpx;
}

.note-tags {
  display: flex;
  flex-wrap: wrap;
  gap: 16rpx;
}

.tag-item {
  padding: 10rpx 20rpx;
  background: rgba(0, 196, 179, 0.15);
  border: 1rpx solid rgba(0, 196, 179, 0.3);
  border-radius: 8rpx;
  font-size: 22rpx;
  color: #00c4b3;
}

/* 富文本内容 */
.note-content {
  padding: 40rpx;
  font-size: 30rpx;
  line-height: 1.8;
  color: #333333;
}

/* 底部占位 */
.bottom-placeholder {
  height: 160rpx;
}

/* 底部工具栏 */
.bottom-toolbar {
  position: fixed;
  bottom: 0;
  left: 0;
  right: 0;
  height: 120rpx;
  padding-bottom: constant(safe-area-inset-bottom);
  padding-bottom: env(safe-area-inset-bottom);
  background: rgba(255, 255, 255, 0.98);
  backdrop-filter: blur(20rpx);
  border-top: 1rpx solid rgba(0, 0, 0, 0.08);
  display: flex;
  align-items: center;
  justify-content: space-around;
  z-index: 100;
}

.toolbar-item {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 8rpx;
  padding: 16rpx 24rpx;
  transition: all 0.2s ease;
}

.toolbar-item:active {
  opacity: 0.6;
}

.toolbar-icon {
  font-size: 40rpx;
}

.toolbar-text {
  font-size: 22rpx;
  color: #666666;
}
</style>
