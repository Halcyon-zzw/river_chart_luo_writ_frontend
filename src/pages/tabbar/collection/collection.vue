<template>
  <view class="collection-page">
    <!-- 自定义导航栏 -->
    <view class="custom-navbar">
      <view class="navbar-title">收藏</view>
    </view>

    <!-- 收藏列表 -->
    <scroll-view
      class="collection-scroll"
      scroll-y
      @scrolltolower="onLoadMore"
      @refresherrefresh="onRefresh"
      refresher-enabled
      :refresher-triggered="refreshing"
    >
      <view class="collection-container">
        <!-- 内容卡片 -->
        <view
          v-for="item in collections"
          :key="item.id"
          class="content-card"
          @click="goToDetail(item)"
        >
          <!-- 图片类型 -->
          <view v-if="item.contentType === 'image'" class="image-card">
            <image
              class="content-image"
              :src="item.imageUrl"
              mode="aspectFill"
            ></image>
            <view class="image-overlay">
              <text class="content-title">{{ item.name }}</text>
            </view>
          </view>

          <!-- 文本类型 -->
          <view v-else class="note-card">
            <text class="note-title">{{ item.name }}</text>
            <text class="note-preview">{{ item.noteContent }}</text>
            <view class="note-footer">
              <text class="note-time">{{ formatTime(item.createTime) }}</text>
            </view>
          </view>

          <!-- 取消收藏按钮 -->
          <view class="uncollect-btn" @click.stop="uncollect(item)">
            <text class="heart-icon">❤️</text>
          </view>
        </view>

        <!-- 加载状态 -->
        <view v-if="loading" class="loading-container">
          <text class="loading-text">加载中...</text>
        </view>

        <!-- 空状态 -->
        <view v-if="!loading && collections.length === 0" class="empty-container">
          <image
            class="empty-icon"
            src="/static/images/empty-collection.png"
            mode="aspectFit"
          ></image>
          <text class="empty-text">还没有收藏内容</text>
          <text class="empty-tip">去浏览页面发现精彩内容吧</text>
        </view>

        <!-- 底部占位 -->
        <view class="bottom-placeholder"></view>
      </view>
    </scroll-view>
  </view>
</template>

<script setup>
import { ref, onMounted } from 'vue'
import { useCollectionStore } from '@/store/collection'
import { useUserStore } from '@/store/user'
import { collectionApi, contentApi } from '@/api'

const collectionStore = useCollectionStore()
const userStore = useUserStore()

// 数据
const collections = ref([])
const loading = ref(false)
const refreshing = ref(false)
const currentPage = ref(1)
const hasMore = ref(true)

// 加载收藏列表
const loadCollections = async (refresh = false) => {
  if (loading.value) return

  if (refresh) {
    currentPage.value = 1
    hasMore.value = true
    refreshing.value = true
  }

  if (!hasMore.value && !refresh) return

  loading.value = true

  try {
    const res = await collectionApi.getCollectionList({
      userId: userStore.userId,
      pageNum: currentPage.value,
      pageSize: 20
    })

    const list = res.data?.records || res.data?.list || res.data || []

    // 获取内容详情
    const contentPromises = list.map(async (item) => {
      try {
        const contentRes = await contentApi.getContentById(item.contentId)
        return {
          ...item,
          ...(contentRes.data || contentRes)
        }
      } catch (error) {
        return item
      }
    })

    const contentsWithDetails = await Promise.all(contentPromises)

    if (refresh) {
      collections.value = contentsWithDetails
    } else {
      collections.value = [...collections.value, ...contentsWithDetails]
    }

    hasMore.value = list.length >= 20
  } catch (error) {
    console.error('Load collections error:', error)
    uni.showToast({
      title: '加载失败',
      icon: 'none'
    })
  } finally {
    loading.value = false
    refreshing.value = false
  }
}

// 下拉刷新
const onRefresh = () => {
  loadCollections(true)
}

// 上拉加载更多
const onLoadMore = () => {
  if (!hasMore.value || loading.value) return
  currentPage.value++
  loadCollections()
}

// 取消收藏
const uncollect = async (item) => {
  uni.showModal({
    title: '提示',
    content: '确定要取消收藏吗？',
    success: async (res) => {
      if (res.confirm) {
        const result = await collectionStore.removeCollection(item.contentId)
        if (result.success) {
          // 从列表中移除
          collections.value = collections.value.filter(c => c.id !== item.id)
        }
      }
    }
  })
}

// 跳转详情
const goToDetail = (item) => {
  const url = item.contentType === 'image'
    ? `/pages/content/image-detail/image-detail?id=${item.contentId}`
    : `/pages/content/note-detail/note-detail?id=${item.contentId}`

  uni.navigateTo({ url })
}

// 格式化时间
const formatTime = (time) => {
  if (!time) return ''
  const date = new Date(time)
  const now = new Date()
  const diff = now - date

  if (diff < 60000) return '刚刚'
  if (diff < 3600000) return `${Math.floor(diff / 60000)}分钟前`
  if (diff < 86400000) return `${Math.floor(diff / 3600000)}小时前`
  if (diff < 604800000) return `${Math.floor(diff / 86400000)}天前`

  return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}-${String(date.getDate()).padStart(2, '0')}`
}

// 页面加载
onMounted(() => {
  loadCollections(true)
})
</script>

<style scoped>
.collection-page {
  min-height: 100vh;
  background: #f5f5f5;
}

/* 自定义导航栏 */
.custom-navbar {
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  height: 88rpx;
  padding-top: constant(safe-area-inset-top);
  padding-top: env(safe-area-inset-top);
  background: rgba(255, 255, 255, 0.95);
  backdrop-filter: blur(20rpx);
  -webkit-backdrop-filter: blur(20rpx);
  z-index: 999;
  display: flex;
  align-items: center;
  justify-content: center;
  border-bottom: 1rpx solid rgba(0, 0, 0, 0.08);
}

.navbar-title {
  font-size: 36rpx;
  font-weight: 600;
  color: #333333;
  letter-spacing: 2rpx;
}

/* 滚动容器 */
.collection-scroll {
  height: 100vh;
  padding-top: calc(88rpx + constant(safe-area-inset-top));
  padding-top: calc(88rpx + env(safe-area-inset-top));
}

.collection-container {
  padding: 30rpx;
}

/* 内容卡片 */
.content-card {
  position: relative;
  margin-bottom: 30rpx;
  border-radius: 20rpx;
  overflow: hidden;
  background: #ffffff;
  box-shadow: 0 4rpx 16rpx rgba(0, 0, 0, 0.08);
  transition: transform 0.3s ease;
}

.content-card:active {
  transform: scale(0.98);
}

/* 图片卡片 */
.image-card {
  position: relative;
  height: 400rpx;
}

.content-image {
  width: 100%;
  height: 100%;
}

.image-overlay {
  position: absolute;
  bottom: 0;
  left: 0;
  right: 0;
  padding: 30rpx;
  background: linear-gradient(transparent, rgba(0, 0, 0, 0.7));
}

.content-title {
  font-size: 32rpx;
  font-weight: 600;
  color: #ffffff;
}

/* 文本卡片 */
.note-card {
  padding: 32rpx;
}

.note-title {
  display: block;
  font-size: 32rpx;
  font-weight: 600;
  color: #333333;
  margin-bottom: 16rpx;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.note-preview {
  display: -webkit-box;
  -webkit-box-orient: vertical;
  -webkit-line-clamp: 3;
  overflow: hidden;
  font-size: 26rpx;
  color: #999999;
  line-height: 1.6;
  margin-bottom: 20rpx;
}

.note-footer {
  display: flex;
  justify-content: flex-end;
}

.note-time {
  font-size: 22rpx;
  color: #cccccc;
}

/* 取消收藏按钮 */
.uncollect-btn {
  position: absolute;
  top: 20rpx;
  right: 20rpx;
  width: 64rpx;
  height: 64rpx;
  background: rgba(0, 0, 0, 0.5);
  backdrop-filter: blur(10rpx);
  border-radius: 32rpx;
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 10;
}

.heart-icon {
  font-size: 36rpx;
}

/* 加载状态 */
.loading-container {
  padding: 40rpx 0;
  text-align: center;
}

.loading-text {
  font-size: 28rpx;
  color: #cccccc;
}

/* 空状态 */
.empty-container {
  padding: 200rpx 60rpx;
  display: flex;
  flex-direction: column;
  align-items: center;
}

.empty-icon {
  width: 240rpx;
  height: 240rpx;
  margin-bottom: 40rpx;
  opacity: 0.6;
}

.empty-text {
  font-size: 32rpx;
  color: #999999;
  margin-bottom: 20rpx;
}

.empty-tip {
  font-size: 24rpx;
  color: #cccccc;
  text-align: center;
}

/* 底部占位 */
.bottom-placeholder {
  height: 120rpx;
}
</style>
