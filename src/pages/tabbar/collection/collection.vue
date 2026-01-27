<template>
  <view class="collection-page">
    <!-- 自定义导航栏 -->
    <custom-nav-bar title="收藏" :show-back="false" />

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

    <!-- 搜索框 -->
    <view class="search-container">
      <view class="search-box">
        <text class="search-icon">🔍</text>
        <input
          class="search-input"
          v-model="searchKeyword"
          :placeholder="currentTab === 'image' ? '搜索图片名称' : '搜索文本标题'"
          @confirm="onSearch"
        />
        <text
          v-if="searchKeyword"
          class="clear-icon"
          @click="clearSearch"
        >✕</text>
      </view>
      <view v-if="searchKeyword" class="search-btn" @click="onSearch">
        <text>搜索</text>
      </view>
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
      <!-- 图片列表（华为图库风格） -->
      <view v-if="currentTab === 'image'" class="gallery-container">
        <view
          v-for="item in imageCollections"
          :key="item.id"
          class="gallery-item"
        >
          <!-- 选择框 -->
          <view v-if="selectionMode" class="checkbox-container" @click.stop="toggleSelection(item)">
            <view
              class="checkbox"
              :class="{ checked: selectedIds.includes(item.id) }"
            >
              <text v-if="selectedIds.includes(item.id)" class="checkbox-icon">✓</text>
            </view>
          </view>

          <!-- 标题行 -->
          <view
            class="gallery-title-row"
            :class="{ 'long-pressing': longPressingId === item.id }"
            @touchstart="onImageTouchStart($event, item)"
            @touchend="onImageTouchEnd($event, item)"
            @click="selectionMode ? toggleSelection(item) : goToImageDetailPage(item)"
          >
            <text class="gallery-title">{{ item.title || item.name || '未命名' }}</text>
            <view class="favorite-icon" @click.stop="toggleFavorite(item)">
              <text :class="['heart-icon', { 'favorited': item.isFavorited }]">{{ item.isFavorited ? '❤️' : '🤍' }}</text>
            </view>
          </view>

          <!-- 标签和日期 -->
          <view class="gallery-meta">
            <view v-if="item.tagDTOList && item.tagDTOList.length > 0" class="gallery-tags">
              <text
                v-for="tag in getDisplayTags(item)"
                :key="tag.id"
                class="meta-tag"
              >
                {{ tag.name }}
              </text>
              <!-- 展开按钮 -->
              <view
                v-if="item.tagDTOList && item.tagDTOList.length > 3"
                class="tag-expand-btn"
                @click.stop="toggleTagsExpand(item.id)"
              >
                <text>{{ expandedTags.has(item.id) ? '' : '...' }}</text>
              </view>
            </view>
            <text class="gallery-date">{{ formatTime(item.createTime) }}</text>
          </view>

          <!-- 图片网格 -->
          <view class="image-grid">
            <view
              v-for="(url, index) in getDisplayImages(item)"
              :key="`${item.id}-${index}`"
              class="grid-image-wrapper"
              @click="goToImageDetail(item, index)"
            >
              <!-- 普通图片 -->
              <network-image
                v-if="index < 11"
                class="grid-image"
                :src="getFullImageUrl(url)"
                :key="getFullImageUrl(url)"
                mode="aspectFill"
                width="100%"
                height="100%"
                @error="onImageError"
              />

              <!-- +更多标识 -->
              <view v-if="index === 11 && item.imageUrlList && item.imageUrlList.length > 12" class="more-overlay">
                <text class="more-text">+{{ item.imageUrlList.length - 11 }}</text>
              </view>
            </view>
          </view>
        </view>
      </view>

      <!-- 文本列表 -->
      <view v-else class="note-list">
        <view
          v-for="item in noteCollections"
          :key="item.id"
          class="note-card-wrapper"
        >
          <!-- 选择框 -->
          <view v-if="selectionMode" class="checkbox-container" @click.stop="toggleSelection(item)">
            <view
              class="checkbox"
              :class="{ checked: selectedIds.includes(item.id) }"
            >
              <text v-if="selectedIds.includes(item.id)" class="checkbox-icon">✓</text>
            </view>
          </view>

          <!-- 文本卡片 -->
          <view
            class="note-card"
            :class="{ 'long-pressing': longPressingId === item.id }"
            @touchstart="onNoteTouchStart($event, item)"
            @touchend="onNoteTouchEnd($event, item)"
            @click="selectionMode ? toggleSelection(item) : goToDetail(item)"
          >
            <view class="note-header">
              <text class="note-title">{{ item.title || item.name || '未命名' }}</text>
              <view class="favorite-icon" @click.stop="toggleFavorite(item)">
                <text :class="['heart-icon', { 'favorited': item.isFavorited }]">{{ item.isFavorited ? '❤️' : '🤍' }}</text>
              </view>
            </view>
            <text class="note-preview">{{ getTextPreview(item.noteContent) }}</text>
            <!-- 标签 -->
            <view v-if="item.tagDTOList && item.tagDTOList.length > 0" class="note-tags">
              <text
                v-for="tag in getDisplayTags(item)"
                :key="tag.id"
                class="note-tag"
              >
                {{ tag.name }}
              </text>
              <view
                v-if="item.tagDTOList && item.tagDTOList.length > 3"
                class="tag-expand-btn"
                @click.stop="toggleTagsExpand(item.id)"
              >
                <text>{{ expandedTags.has(item.id) ? '' : '...' }}</text>
              </view>
            </view>
            <view class="note-footer">
              <text class="note-time">{{ formatTime(item.createTime) }}</text>
            </view>
          </view>
        </view>
      </view>

      <!-- 加载状态 -->
      <view v-if="loading" class="loading-container">
        <text class="loading-text">加载中...</text>
      </view>

      <!-- 没有更多 -->
      <view v-if="!loading && !hasMore && collections.length > 0" class="no-more">
        <text class="no-more-text">已展示全部内容</text>
      </view>

      <!-- 空状态 -->
      <view v-if="!loading && collections.length === 0" class="empty-container">
        <text class="empty-text">还没有收藏{{ currentTab === 'image' ? '图片' : '文本' }}内容</text>
        <text class="empty-tip">去浏览页面发现精彩内容吧</text>
      </view>

      <!-- 底部占位 -->
      <view class="bottom-placeholder"></view>
    </scroll-view>

    <!-- 批量操作栏 -->
    <view v-if="selectionMode" class="batch-toolbar">
      <view class="batch-btn cancel" @click="exitSelectionMode">
        <text>取消</text>
      </view>
      <view class="batch-btn delete" @click="batchUncollect">
        <text>取消收藏 ({{ selectedIds.length }})</text>
      </view>
    </view>

    <!-- 图片预览组件 -->
    <image-preview
      v-model:visible="previewVisible"
      :content-list="imageCollections"
      :initial-content-index="previewContentIndex"
      :initial-image-index="previewImageIndex"
      @close="onPreviewClose"
    />
  </view>
</template>

<script setup>
import { ref, computed, watch } from 'vue'
import { onShow } from '@dcloudio/uni-app'
import { useCollectionStore } from '@/store/collection'
import { useUserStore } from '@/store/user'
import { collectionApi, contentApi } from '@/api'
import { getFullImageUrl } from '@/utils/image'
import CustomNavBar from '@/components/custom-nav-bar/custom-nav-bar.vue'
import ImagePreview from '@/components/image-preview/image-preview.vue'
import NetworkImage from '@/components/network-image/network-image.vue'

const collectionStore = useCollectionStore()
const userStore = useUserStore()

// 数据
const currentTab = ref('image')
const collections = ref([])
const loading = ref(false)
const refreshing = ref(false)
const currentPage = ref(1)
const hasMore = ref(true)
const searchKeyword = ref('')

// 批量操作
const selectionMode = ref(false)
const selectedIds = ref([])
const longPressingId = ref(null)
const longPressTriggered = ref(false)

// 标签展开/收起状态
const expandedTags = ref(new Set())

// 图片预览相关
const previewVisible = ref(false)
const previewContentIndex = ref(0)
const previewImageIndex = ref(0)

// Tab配置
const tabs = [
  { type: 'image', label: '图片' },
  { type: 'note', label: '文本' }
]

// 图片收藏列表
const imageCollections = computed(() => {
  return collections.value.filter(item => item.contentType === 'image')
})

// 文本收藏列表
const noteCollections = computed(() => {
  return collections.value.filter(item => item.contentType === 'note')
})

// 切换Tab
const switchTab = (type) => {
  if (currentTab.value === type) return
  currentTab.value = type
  exitSelectionMode()
  loadCollections(true)
}

// 加载收藏列表
const loadCollections = async (refresh = false) => {
  // 未登录时不请求
  if (!userStore.hasLogin) {
    collections.value = []
    return
  }

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
      contentType: currentTab.value,
      pageNum: currentPage.value,
      pageSize: 20
    }

    // 添加搜索参数
    if (searchKeyword.value) {
      params.title = searchKeyword.value
    }

    const res = await collectionApi.getCollectionList(params)

    // 后端返回格式：data.rows
    const list = res.data?.rows || []
    const validList = list.filter(item => item != null)

    // 获取内容详情并添加收藏状态
    const contentPromises = validList.map(async (item) => {
      try {
        const contentRes = await contentApi.getContentById(item.contentId)
        return {
          ...item,
          ...(contentRes.data || contentRes),
          isFavorited: true // 收藏列表中的内容都是已收藏状态
        }
      } catch (error) {
        return {
          ...item,
          isFavorited: true
        }
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

// 获取要显示的图片列表（最多12张：前11张 + 更多标识位）
const getDisplayImages = (item) => {
  if (!item.imageUrlList || item.imageUrlList.length === 0) {
    return []
  }

  // 如果图片数量 <= 11张，全部显示
  if (item.imageUrlList.length <= 11) {
    return item.imageUrlList
  }

  // 如果超过11张，显示前11张 + 一个占位（用于显示"更多"）
  return item.imageUrlList.slice(0, 12)
}

// 获取文本预览
const getTextPreview = (html) => {
  if (!html) return ''
  // 简单移除HTML标签
  return html.replace(/<[^>]+>/g, '').substring(0, 100)
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

// 搜索
const onSearch = () => {
  loadCollections(true)
}

// 清除搜索
const clearSearch = () => {
  searchKeyword.value = ''
  loadCollections(true)
}

// 切换标签展开/收起
const toggleTagsExpand = (contentId) => {
  if (expandedTags.value.has(contentId)) {
    expandedTags.value.delete(contentId)
  } else {
    expandedTags.value.add(contentId)
  }
  // 触发响应式更新
  expandedTags.value = new Set(expandedTags.value)
}

// 获取要展示的标签（前3个或全部）
const getDisplayTags = (content) => {
  const tags = content.tagDTOList || []
  const MAX_DISPLAY = 3

  if (tags.length <= MAX_DISPLAY) {
    return tags
  }

  // 如果已展开，返回所有标签
  if (expandedTags.value.has(content.id)) {
    return tags
  }

  // 未展开，返回前3个
  return tags.slice(0, MAX_DISPLAY)
}

// 跳转到图片详情页
const goToImageDetailPage = (item) => {
  if (selectionMode.value) {
    toggleSelection(item)
    return
  }

  // 跳转到图片详情页
  uni.navigateTo({
    url: `/pages/content/image-detail/image-detail?id=${item.contentId || item.id}`
  })
}

// 打开图片预览
const goToImageDetail = (item, imageIndex) => {
  if (selectionMode.value) {
    toggleSelection(item)
    return
  }

  // 打开图片预览
  const contentIndex = imageCollections.value.findIndex(c => c.id === item.id)
  if (contentIndex !== -1) {
    previewContentIndex.value = contentIndex
    previewImageIndex.value = imageIndex
    previewVisible.value = true
  }
}

// 关闭预览
const onPreviewClose = () => {
  previewVisible.value = false
}

// 跳转详情（文本内容）
const goToDetail = (item) => {
  uni.navigateTo({
    url: `/pages/content/note-detail/note-detail?id=${item.contentId || item.id}`
  })
}

// 切换收藏状态
const toggleFavorite = async (item) => {
  if (item.isFavorited) {
    // 取消收藏
    const result = await collectionStore.removeCollection(item.contentId)
    if (result.success) {
      // 从列表中移除
      collections.value = collections.value.filter(c => c.id !== item.id)
      uni.showToast({
        title: '已取消收藏',
        icon: 'success'
      })
    }
  } else {
    // 重新收藏
    const result = await collectionStore.addCollection(item.contentId)
    if (result.success) {
      item.isFavorited = true
      uni.showToast({
        title: '已收藏',
        icon: 'success'
      })
    }
  }
}

// 图片长按检测
let imageLongPressTimer = null
const onImageTouchStart = (e, item) => {
  if (selectionMode.value) return

  longPressTriggered.value = false

  // 启动长按定时器（0.5秒）
  imageLongPressTimer = setTimeout(() => {
    longPressingId.value = null
    longPressTriggered.value = true
    enterSelectionMode(item.id)
  }, 500)

  longPressingId.value = item.id
}

const onImageTouchEnd = (e, item) => {
  // 清除长按定时器和缩放效果
  if (imageLongPressTimer) {
    clearTimeout(imageLongPressTimer)
    imageLongPressTimer = null
  }
  longPressingId.value = null
}

// 文本长按检测
let noteLongPressTimer = null
const onNoteTouchStart = (e, item) => {
  if (selectionMode.value) return

  longPressTriggered.value = false

  // 启动长按定时器（0.5秒）
  noteLongPressTimer = setTimeout(() => {
    longPressingId.value = null
    longPressTriggered.value = true
    enterSelectionMode(item.id)
  }, 500)

  longPressingId.value = item.id
}

const onNoteTouchEnd = (e, item) => {
  // 清除长按定时器和缩放效果
  if (noteLongPressTimer) {
    clearTimeout(noteLongPressTimer)
    noteLongPressTimer = null
  }
  longPressingId.value = null
}

// 进入选择模式
const enterSelectionMode = (itemId = null) => {
  selectionMode.value = true
  selectedIds.value = itemId ? [itemId] : []
}

// 退出选择模式
const exitSelectionMode = () => {
  selectionMode.value = false
  selectedIds.value = []
}

// 切换选择
const toggleSelection = (item) => {
  if (longPressTriggered.value) {
    longPressTriggered.value = false
    return
  }

  const index = selectedIds.value.indexOf(item.id)
  if (index > -1) {
    selectedIds.value.splice(index, 1)
  } else {
    selectedIds.value.push(item.id)
  }
}

// 批量取消收藏
const batchUncollect = () => {
  if (selectedIds.value.length === 0) {
    uni.showToast({
      title: '请选择要取消收藏的内容',
      icon: 'none'
    })
    return
  }

  uni.showModal({
    title: '确认取消收藏',
    content: `确定要取消收藏选中的 ${selectedIds.value.length} 项内容吗？`,
    success: async (res) => {
      if (res.confirm) {
        try {
          // 批量取消收藏
          const uncollectPromises = selectedIds.value.map(id => {
            const item = collections.value.find(c => c.id === id)
            return collectionStore.removeCollection(item.contentId)
          })

          await Promise.all(uncollectPromises)

          uni.showToast({
            title: '取消收藏成功',
            icon: 'success'
          })

          exitSelectionMode()
          loadCollections(true)
        } catch (error) {
          uni.showToast({
            title: '取消收藏失败',
            icon: 'none'
          })
        }
      }
    }
  })
}

// 图片加载失败处理
const onImageError = (e) => {
  console.error('[收藏页] 图片加载失败:', e)
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

// 页面显示时加载（TabBar页面使用onShow）
onShow(() => {
  loadCollections(true)
})
</script>

<style scoped>
.collection-page {
  height: 100vh;
  background: #f5f5f5;
  display: flex;
  flex-direction: column;
}

/* Tab栏 */
.tab-bar {
  position: sticky;
  top: calc(88rpx + constant(safe-area-inset-top));
  top: calc(88rpx + env(safe-area-inset-top));
  height: 88rpx;
  background: rgba(255, 255, 255, 0.95);
  backdrop-filter: blur(20rpx);
  display: flex;
  align-items: center;
  justify-content: center;
  border-bottom: 1rpx solid rgba(0, 0, 0, 0.08);
  z-index: 99;
}

.tab-item {
  flex: 1;
  text-align: center;
  padding: 20rpx 0;
  position: relative;
  z-index: 2;
}

.tab-text {
  font-size: 30rpx;
  color: #999999;
  font-weight: 500;
  transition: all 0.3s ease;
}

.tab-item.active .tab-text {
  color: #00c4b3;
  font-weight: 600;
  font-size: 32rpx;
}

.tab-indicator {
  position: absolute;
  bottom: 8rpx;
  width: 60rpx;
  height: 6rpx;
  background: linear-gradient(90deg, #00c4b3 0%, #00a99d 100%);
  border-radius: 3rpx;
  transform: translateX(-50%);
  transition: left 0.3s cubic-bezier(0.4, 0, 0.2, 1);
  z-index: 1;
}

/* 搜索容器 */
.search-container {
  position: sticky;
  top: calc(176rpx + constant(safe-area-inset-top));
  top: calc(176rpx + env(safe-area-inset-top));
  background: #f5f5f5;
  padding: 20rpx 30rpx;
  display: flex;
  gap: 20rpx;
  align-items: center;
  z-index: 98;
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

.search-btn {
  height: 70rpx;
  padding: 0 32rpx;
  background: linear-gradient(135deg, #00c4b3 0%, #00a99d 100%);
  border-radius: 35rpx;
  display: flex;
  align-items: center;
  justify-content: center;
  box-shadow: 0 4rpx 16rpx rgba(0, 196, 179, 0.3);
}

.search-btn text {
  font-size: 28rpx;
  color: #ffffff;
  font-weight: 500;
}

.search-btn:active {
  opacity: 0.8;
}

/* 滚动容器 */
.collection-scroll {
  flex: 1;
  background: #f5f5f5;
  overflow-y: auto;
}

/* 华为图库风格 */
.gallery-container {
  padding: 10rpx 30rpx 0;
  min-height: 100%;
}

.gallery-item {
  position: relative;
  margin-bottom: 40rpx;
}

.gallery-title-row {
  padding: 20rpx 0;
  display: flex;
  align-items: center;
  justify-content: space-between;
  cursor: pointer;
}

.gallery-title-row:active {
  opacity: 0.7;
}

/* 长按缩放动画 */
.gallery-title-row.long-pressing {
  transform: scale(0.98);
  transition: transform 0.2s ease;
}

.gallery-title {
  font-size: 32rpx;
  font-weight: 500;
  color: #333333;
  line-height: 1.4;
  flex: 1;
}

/* 标签和日期 */
.gallery-meta {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 16rpx;
  padding: 12rpx 0;
}

.gallery-tags {
  display: flex;
  align-items: center;
  gap: 12rpx;
  flex-wrap: wrap;
  flex: 1;
}

.meta-tag {
  padding: 6rpx 16rpx;
  background: rgba(0, 196, 179, 0.12);
  border: 1rpx solid rgba(0, 196, 179, 0.25);
  border-radius: 6rpx;
  font-size: 22rpx;
  color: #00c4b3;
  white-space: nowrap;
}

.tag-expand-btn {
  padding: 6rpx 12rpx;
  font-size: 20rpx;
  color: #999999;
  cursor: pointer;
}

.tag-expand-btn:active {
  opacity: 0.6;
}

.gallery-date {
  font-size: 22rpx;
  color: #999999;
  white-space: nowrap;
  margin-left: auto;
}

/* 图片网格 */
.image-grid {
  display: grid;
  grid-template-columns: repeat(4, 1fr);
  gap: 4rpx;
}

.grid-image-wrapper {
  position: relative;
  width: 100%;
  padding-bottom: 100%; /* 正方形 */
  overflow: hidden;
  background: #f0f0f0;
  cursor: pointer;
}

.grid-image-wrapper:active {
  opacity: 0.8;
}

.grid-image {
  position: absolute;
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
  display: block;
}

/* +更多遮罩 */
.more-overlay {
  position: absolute;
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
  background: rgba(0, 0, 0, 0.6);
  display: flex;
  align-items: center;
  justify-content: center;
}

.more-text {
  font-size: 32rpx;
  font-weight: 600;
  color: #ffffff;
}

/* 文本列表 */
.note-list {
  padding: 20rpx 30rpx 0;
  min-height: 100%;
}

.note-card-wrapper {
  position: relative;
  margin-bottom: 24rpx;
}

.note-card {
  padding: 32rpx;
  background: #ffffff;
  border-radius: 20rpx;
  box-shadow: 0 4rpx 16rpx rgba(0, 0, 0, 0.08);
  transition: transform 0.3s ease;
}

.note-card:active {
  transform: scale(0.98);
}

/* 长按缩放动画 */
.note-card.long-pressing {
  transform: scale(0.95);
  transition: transform 0.3s ease;
}

.note-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  margin-bottom: 16rpx;
}

.note-title {
  display: block;
  font-size: 32rpx;
  font-weight: 600;
  color: #333333;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
  flex: 1;
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

/* 文本标签 */
.note-tags {
  display: flex;
  align-items: center;
  gap: 12rpx;
  flex-wrap: wrap;
  margin-bottom: 16rpx;
}

.note-tag {
  padding: 6rpx 16rpx;
  background: rgba(0, 196, 179, 0.12);
  border: 1rpx solid rgba(0, 196, 179, 0.25);
  border-radius: 6rpx;
  font-size: 22rpx;
  color: #00c4b3;
  white-space: nowrap;
}

.note-footer {
  display: flex;
  justify-content: flex-end;
}

.note-time {
  font-size: 22rpx;
  color: #cccccc;
}

/* 收藏图标 */
.favorite-icon {
  margin-left: 16rpx;
  display: flex;
  align-items: center;
  justify-content: center;
}

.heart-icon {
  font-size: 36rpx;
  transition: transform 0.2s ease;
}

.heart-icon.favorited {
  color: #ff4444;
}

.heart-icon:active {
  transform: scale(1.2);
}

/* 选择框 */
.checkbox-container {
  position: absolute;
  top: 16rpx;
  left: 16rpx;
  z-index: 10;
}

.checkbox {
  width: 44rpx;
  height: 44rpx;
  border: 2rpx solid rgba(0, 196, 179, 0.8);
  border-radius: 50%;
  background: rgba(255, 255, 255, 0.9);
  display: flex;
  align-items: center;
  justify-content: center;
}

.checkbox.checked {
  background: #00c4b3;
  border-color: #00c4b3;
}

.checkbox-icon {
  font-size: 26rpx;
  color: #ffffff;
  font-weight: 700;
}

/* 批量操作栏 */
.batch-toolbar {
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
  gap: 20rpx;
  padding: 20rpx 30rpx;
  z-index: 100;
}

.batch-btn {
  flex: 1;
  height: 80rpx;
  border-radius: 16rpx;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 30rpx;
  font-weight: 500;
}

.batch-btn.cancel {
  background: rgba(0, 0, 0, 0.08);
  color: #333333;
}

.batch-btn.cancel:active {
  background: rgba(0, 0, 0, 0.12);
}

.batch-btn.delete {
  background: linear-gradient(135deg, #ff4444 0%, #cc0000 100%);
  color: #ffffff;
}

.batch-btn.delete:active {
  opacity: 0.8;
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
  display: flex;
  flex-direction: column;
  align-items: center;
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
  height: calc(120rpx + constant(safe-area-inset-bottom));
  height: calc(120rpx + env(safe-area-inset-bottom));
}
</style>
