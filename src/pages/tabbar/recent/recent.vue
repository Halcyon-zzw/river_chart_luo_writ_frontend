<template>
  <view class="recent-page">
    <!-- 自定义导航栏 -->
    <view class="custom-navbar">
      <view class="navbar-title">最近</view>
    </view>

    <!-- Tab切换 -->
    <view class="tab-bar">
      <view
        v-for="tab in tabs"
        :key="tab.type"
        class="tab-item"
        :class="{ active: currentTab === tab.type }"
        @click="switchTab(tab.type)"
      >
        <text class="tab-text">{{ tab.label }}</text>
      </view>
      <view class="tab-indicator" :style="{ left: currentTab === 'image' ? '25%' : '75%' }"></view>
    </view>

    <!-- 搜索和筛选栏 -->
    <view class="search-filter-container">
      <!-- 搜索框 -->
      <view class="search-box">
        <text class="search-icon">🔍</text>
        <input
          class="search-input"
          v-model="searchKeyword"
          :placeholder="currentTab === 'image' ? '搜索图片' : '搜索笔记'"
          @confirm="onSearch"
        />
        <text
          v-if="searchKeyword"
          class="clear-icon"
          @click="clearSearch"
        >✕</text>
      </view>

      <!-- 时间筛选 -->
      <view class="time-filter">
        <picker mode="selector" :range="timeRanges" range-key="label" @change="onTimeRangeChange">
          <view class="filter-btn">
            <text class="filter-text">{{ selectedTimeRange.label }}</text>
            <text class="filter-arrow">▼</text>
          </view>
        </picker>
      </view>
    </view>

    <!-- 操作栏 -->
    <view class="action-bar" v-if="historyList.length > 0">
      <view class="action-left">
        <text class="result-count">共 {{ totalCount }} 条记录</text>
      </view>
      <view class="action-right">
        <view class="clear-all-btn" @click="confirmClearAll">
          <text class="clear-icon">🗑️</text>
          <text class="clear-text">清空</text>
        </view>
      </view>
    </view>

    <!-- 内容列表 -->
    <scroll-view
      class="content-scroll"
      scroll-y
      @scrolltolower="onLoadMore"
      @refresherrefresh="onRefresh"
      refresher-enabled
      :refresher-triggered="refreshing"
    >
      <!-- 图片列表 -->
      <view v-if="currentTab === 'image'" class="image-list">
        <view
          v-for="item in historyList"
          :key="item.id"
          class="image-item"
          @click="goToDetail(item)"
        >
          <image
            class="item-image"
            :src="getFullImageUrl(item.content?.imageUrl)"
            mode="aspectFill"
          ></image>
          <view class="item-info">
            <text class="item-title">{{ item.content?.title || '未命名' }}</text>
            <text class="item-time">{{ formatTime(item.browseTime) }}</text>
          </view>
          <view class="item-delete" @click.stop="deleteSingle(item)">
            <text class="delete-icon">✕</text>
          </view>
        </view>
      </view>

      <!-- 笔记列表 -->
      <view v-else class="note-list">
        <view
          v-for="item in historyList"
          :key="item.id"
          class="note-item"
          @click="goToDetail(item)"
        >
          <view class="item-content">
            <text class="item-title">{{ item.content?.title || '未命名' }}</text>
            <text class="item-time">{{ formatTime(item.browseTime) }}</text>
          </view>
          <view class="item-delete" @click.stop="deleteSingle(item)">
            <text class="delete-icon">✕</text>
          </view>
        </view>
      </view>

      <!-- 加载状态 -->
      <view v-if="loading" class="loading-container">
        <text class="loading-text">加载中...</text>
      </view>

      <!-- 没有更多 -->
      <view v-if="!loading && !hasMore && historyList.length > 0" class="no-more">
        <text class="no-more-text">没有更多了</text>
      </view>

      <!-- 空状态 -->
      <view v-if="!loading && historyList.length === 0" class="empty-container">
        <text class="empty-text">暂无{{ currentTab === 'image' ? '图片' : '笔记' }}浏览记录</text>
      </view>

      <!-- 底部占位 -->
      <view class="bottom-placeholder"></view>
    </scroll-view>
  </view>
</template>

<script setup>
import { ref, computed } from 'vue'
import { onShow } from '@dcloudio/uni-app'
import { browseHistoryApi } from '@/api'
import { useUserStore } from '@/store/user'
import { getFullImageUrl } from '@/utils/image'

const userStore = useUserStore()

// 数据
const currentTab = ref('image')
const historyList = ref([])
const loading = ref(false)
const refreshing = ref(false)
const currentPage = ref(1)
const hasMore = ref(true)
const totalCount = ref(0)
const searchKeyword = ref('')
const selectedTimeRange = ref({ value: 'all', label: '全部' })

// Tab配置
const tabs = [
  { type: 'image', label: '图片' },
  { type: 'note', label: '笔记' }
]

// 时间范围配置
const timeRanges = [
  { value: 'all', label: '全部' },
  { value: 'today', label: '今天' },
  { value: 'yesterday', label: '昨天' },
  { value: 'earlier', label: '更早' }
]

// 计算属性
const userId = computed(() => userStore.userId)

// 页面显示时刷新
onShow(() => {
  loadHistoryList(true)
})

// 切换Tab
const switchTab = (type) => {
  if (currentTab.value === type) return
  currentTab.value = type
  loadHistoryList(true)
}

// 加载浏览历史列表
const loadHistoryList = async (refresh = false) => {
  if (loading.value) return

  if (refresh) {
    currentPage.value = 1
    hasMore.value = true
    refreshing.value = true
  }

  if (!hasMore.value && !refresh) return

  loading.value = true

  try {
    const params = {
      userId: userId.value,
      contentType: currentTab.value,
      pageNum: currentPage.value,
      pageSize: 20
    }

    // 添加搜索参数
    if (searchKeyword.value) {
      params.title = searchKeyword.value
    }

    // 添加时间范围参数
    if (selectedTimeRange.value.value !== 'all') {
      params.timeRange = selectedTimeRange.value.value
    }

    const res = await browseHistoryApi.getBrowseHistoryList(params)

    // 后端返回格式：data.rows
    const list = res.data?.rows || []
    const validList = list.filter(item => item != null)

    if (refresh) {
      historyList.value = validList
    } else {
      historyList.value = [...historyList.value, ...validList]
    }

    // 更新总数
    totalCount.value = res.data?.totalRows || 0

    hasMore.value = validList.length >= 20
  } catch (error) {
    console.error('Load browse history error:', error)
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
  loadHistoryList(true)
}

// 上拉加载更多
const onLoadMore = () => {
  if (!hasMore.value || loading.value) return
  currentPage.value++
  loadHistoryList()
}

// 搜索
const onSearch = () => {
  loadHistoryList(true)
}

// 清除搜索
const clearSearch = () => {
  searchKeyword.value = ''
  loadHistoryList(true)
}

// 时间范围改变
const onTimeRangeChange = (e) => {
  selectedTimeRange.value = timeRanges[e.detail.value]
  loadHistoryList(true)
}

// 跳转详情
const goToDetail = (item) => {
  const content = item.content
  if (!content) return

  const detailPage = content.contentType === 'image'
    ? '/pages/content/image-detail/image-detail'
    : '/pages/content/note-detail/note-detail'

  uni.navigateTo({
    url: `${detailPage}?id=${content.id}`
  })
}

// 删除单条记录
const deleteSingle = (item) => {
  uni.showModal({
    title: '确认删除',
    content: '确定要删除这条浏览记录吗？',
    success: async (res) => {
      if (res.confirm) {
        try {
          await browseHistoryApi.deleteBrowseHistory(item.id)
          uni.showToast({
            title: '删除成功',
            icon: 'success'
          })
          loadHistoryList(true)
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

// 确认清空全部
const confirmClearAll = () => {
  uni.showModal({
    title: '确认清空',
    content: '确定要清空所有浏览记录吗？此操作不可恢复',
    confirmColor: '#ff4444',
    success: async (res) => {
      if (res.confirm) {
        try {
          await browseHistoryApi.clearAllBrowseHistory(userId.value)
          uni.showToast({
            title: '已清空',
            icon: 'success'
          })
          loadHistoryList(true)
        } catch (error) {
          uni.showToast({
            title: '清空失败',
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

  const now = new Date()
  const browseDate = new Date(time)
  const diff = now - browseDate

  // 今天
  if (diff < 24 * 60 * 60 * 1000 && now.getDate() === browseDate.getDate()) {
    const hours = browseDate.getHours()
    const minutes = String(browseDate.getMinutes()).padStart(2, '0')
    return `今天 ${hours}:${minutes}`
  }

  // 昨天
  const yesterday = new Date(now)
  yesterday.setDate(yesterday.getDate() - 1)
  if (browseDate.getDate() === yesterday.getDate() &&
      browseDate.getMonth() === yesterday.getMonth() &&
      browseDate.getFullYear() === yesterday.getFullYear()) {
    const hours = browseDate.getHours()
    const minutes = String(browseDate.getMinutes()).padStart(2, '0')
    return `昨天 ${hours}:${minutes}`
  }

  // 更早
  const year = browseDate.getFullYear()
  const month = String(browseDate.getMonth() + 1).padStart(2, '0')
  const day = String(browseDate.getDate()).padStart(2, '0')
  const hours = String(browseDate.getHours()).padStart(2, '0')
  const minutes = String(browseDate.getMinutes()).padStart(2, '0')

  // 如果是今年，不显示年份
  if (year === now.getFullYear()) {
    return `${month}-${day} ${hours}:${minutes}`
  }

  return `${year}-${month}-${day} ${hours}:${minutes}`
}
</script>

<style scoped>
.recent-page {
  min-height: 100vh;
  background: #f5f5f5;
  display: flex;
  flex-direction: column;
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

/* Tab栏 */
.tab-bar {
  position: relative;
  display: flex;
  background: #ffffff;
  padding: 20rpx 60rpx;
  margin-top: calc(88rpx + constant(safe-area-inset-top));
  margin-top: calc(88rpx + env(safe-area-inset-top));
  border-bottom: 1rpx solid rgba(0, 0, 0, 0.08);
}

.tab-item {
  flex: 1;
  text-align: center;
  padding: 16rpx 0;
  position: relative;
  z-index: 2;
}

.tab-text {
  font-size: 28rpx;
  color: #666666;
  transition: all 0.3s;
}

.tab-item.active .tab-text {
  color: #00c4b3;
  font-weight: 600;
  font-size: 32rpx;
}

.tab-indicator {
  position: absolute;
  bottom: 0;
  width: 50%;
  height: 6rpx;
  background: linear-gradient(90deg, #00c4b3 0%, #00a99d 100%);
  border-radius: 3rpx;
  transition: left 0.3s cubic-bezier(0.4, 0, 0.2, 1);
  transform: translateX(-50%);
}

/* 搜索和筛选栏 */
.search-filter-container {
  background: #f5f5f5;
  padding: 20rpx 30rpx;
  display: flex;
  gap: 20rpx;
  align-items: center;
}

.search-box {
  flex: 1;
  height: 70rpx;
  background: #ffffff;
  border-radius: 35rpx;
  display: flex;
  align-items: center;
  padding: 0 24rpx;
  box-shadow: 0 2rpx 12rpx rgba(0, 0, 0, 0.08);
}

.search-icon {
  font-size: 32rpx;
  margin-right: 16rpx;
}

.search-input {
  flex: 1;
  font-size: 28rpx;
  color: #333333;
}

.clear-icon {
  font-size: 32rpx;
  color: #999999;
  padding: 0 8rpx;
}

.time-filter {
  height: 70rpx;
}

.filter-btn {
  height: 70rpx;
  padding: 0 24rpx;
  background: #ffffff;
  border-radius: 35rpx;
  display: flex;
  align-items: center;
  gap: 8rpx;
  box-shadow: 0 2rpx 12rpx rgba(0, 0, 0, 0.08);
}

.filter-text {
  font-size: 26rpx;
  color: #666666;
}

.filter-arrow {
  font-size: 20rpx;
  color: #999999;
}

/* 操作栏 */
.action-bar {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 16rpx 30rpx;
  background: #f5f5f5;
}

.action-left {
  flex: 1;
}

.result-count {
  font-size: 24rpx;
  color: #999999;
}

.action-right {
  display: flex;
  gap: 20rpx;
}

.clear-all-btn {
  display: flex;
  align-items: center;
  gap: 8rpx;
  padding: 12rpx 24rpx;
  background: rgba(255, 68, 68, 0.1);
  border-radius: 20rpx;
}

.clear-all-btn:active {
  opacity: 0.7;
}

.clear-icon {
  font-size: 28rpx;
}

.clear-text {
  font-size: 24rpx;
  color: #ff4444;
  font-weight: 500;
}

/* 滚动容器 */
.content-scroll {
  flex: 1;
  background: #f5f5f5;
}

/* 图片列表 */
.image-list {
  padding: 20rpx 30rpx;
}

.image-item {
  display: flex;
  align-items: center;
  background: #ffffff;
  border-radius: 16rpx;
  margin-bottom: 20rpx;
  padding: 20rpx;
  box-shadow: 0 2rpx 12rpx rgba(0, 0, 0, 0.06);
  position: relative;
}

.image-item:active {
  opacity: 0.8;
}

.item-image {
  width: 120rpx;
  height: 120rpx;
  border-radius: 12rpx;
  margin-right: 20rpx;
  flex-shrink: 0;
}

.item-info {
  flex: 1;
  display: flex;
  flex-direction: column;
  gap: 12rpx;
  min-width: 0;
}

.item-title {
  font-size: 28rpx;
  color: #333333;
  font-weight: 500;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.item-time {
  font-size: 24rpx;
  color: #999999;
}

.item-delete {
  width: 48rpx;
  height: 48rpx;
  display: flex;
  align-items: center;
  justify-content: center;
  margin-left: 12rpx;
  flex-shrink: 0;
}

.delete-icon {
  font-size: 32rpx;
  color: #ff4444;
  font-weight: 600;
}

/* 笔记列表 */
.note-list {
  padding: 20rpx 30rpx;
}

.note-item {
  display: flex;
  align-items: center;
  background: #ffffff;
  border-radius: 16rpx;
  margin-bottom: 20rpx;
  padding: 24rpx 20rpx;
  box-shadow: 0 2rpx 12rpx rgba(0, 0, 0, 0.06);
}

.note-item:active {
  opacity: 0.8;
}

.item-content {
  flex: 1;
  display: flex;
  flex-direction: column;
  gap: 12rpx;
  min-width: 0;
}

/* 加载状态 */
.loading-container {
  padding: 40rpx 0;
  text-align: center;
}

.loading-text {
  font-size: 28rpx;
  color: #999999;
}

/* 没有更多 */
.no-more {
  padding: 40rpx 0;
  text-align: center;
}

.no-more-text {
  font-size: 24rpx;
  color: #cccccc;
}

/* 空状态 */
.empty-container {
  padding: 200rpx 60rpx;
  text-align: center;
}

.empty-text {
  font-size: 28rpx;
  color: #999999;
}

/* 底部占位 */
.bottom-placeholder {
  height: 100rpx;
}
</style>
