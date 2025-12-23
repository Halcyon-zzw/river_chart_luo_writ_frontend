<template>
  <view class="content-list-page">
    <!-- 分类标签 -->
    <view class="category-label-container">
      <view class="category-breadcrumb">
        <text class="main-category-name">{{ mainCategoryName }}</text>
        <text class="sub-category-name">{{ subCategoryName }}</text>
      </view>
      <view class="home-button" @click="goToHome">
        <text class="home-icon">🏠</text>
      </view>
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

    <!-- 内容列表 -->
    <scroll-view
      class="content-scroll"
      scroll-y
      @scrolltolower="onLoadMore"
      @refresherrefresh="onRefresh"
      refresher-enabled
      :refresher-triggered="refreshing"
    >
      <!-- 图片瀑布流 -->
      <view v-if="currentTab === 'image'" class="waterfall-container">
        <view class="waterfall-column">
          <view
            v-for="item in leftColumn"
            :key="item.id"
            class="waterfall-item"
            @click="goToDetail(item)"
          >
            <image
              class="waterfall-image"
              :src="item.imageUrl"
              mode="widthFix"
              @load="imageLoad"
            ></image>
            <view class="waterfall-info">
              <text class="waterfall-title">{{ item.name }}</text>
            </view>
          </view>
        </view>

        <view class="waterfall-column">
          <view
            v-for="item in rightColumn"
            :key="item.id"
            class="waterfall-item"
            @click="goToDetail(item)"
          >
            <image
              class="waterfall-image"
              :src="item.imageUrl"
              mode="widthFix"
              @load="imageLoad"
            ></image>
            <view class="waterfall-info">
              <text class="waterfall-title">{{ item.name }}</text>
            </view>
          </view>
        </view>
      </view>

      <!-- 文本列表 -->
      <view v-else class="note-list">
        <view
          v-for="item in noteContents"
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

          <!-- 滑动卡片 -->
          <view
            class="note-card"
            :style="{
              transform: swipeId === item.id ? `translateX(${swipeX}px)` : 'translateX(0)',
              transition: swipeId === item.id && swipeX === -120 ? 'transform 0.3s' : 'none'
            }"
            @touchstart="onTouchStart($event, item)"
            @touchmove="onTouchMove($event, item)"
            @touchend="onTouchEnd($event, item)"
            @click="selectionMode ? toggleSelection(item) : goToDetail(item)"
          >
            <text class="note-title">{{ item.title || item.name }}</text>
            <text class="note-preview">{{ getTextPreview(item.noteContent) }}</text>
            <view class="note-footer">
              <view class="note-tags">
                <text
                  v-for="tag in item.tagDTOList?.slice(0, 3)"
                  :key="tag.id"
                  class="tag-item"
                >
                  {{ tag.name }}
                </text>
              </view>
              <text class="note-time">{{ formatTime(item.createTime) }}</text>
            </view>
          </view>

          <!-- 删除按钮 -->
          <view
            v-if="swipeId === item.id"
            class="delete-button"
            @click.stop="deleteSingle(item)"
          >
            <text class="delete-text">删除</text>
          </view>
        </view>
      </view>

      <!-- 加载状态 -->
      <view v-if="loading" class="loading-container">
        <text class="loading-text">加载中...</text>
      </view>

      <!-- 没有更多 -->
      <view v-if="!loading && !hasMore && contents.length > 0" class="no-more">
        <text class="no-more-text">已展示全部内容</text>
      </view>

      <!-- 空状态 -->
      <view v-if="!loading && contents.length === 0" class="empty-container">
        <text class="empty-text">暂无{{ currentTab === 'image' ? '图片' : '文本' }}内容</text>
        <text class="empty-tip">点击右下角按钮创建</text>
      </view>

      <!-- 底部占位 -->
      <view class="bottom-placeholder"></view>
    </scroll-view>

    <!-- 悬浮创建按钮 -->
    <view v-if="!selectionMode" class="fab-button" @click="createContent">
      <text class="fab-icon">+</text>
    </view>

    <!-- 批量操作栏 -->
    <view v-if="selectionMode" class="batch-toolbar">
      <view class="batch-btn cancel" @click="exitSelectionMode">
        <text>取消</text>
      </view>
      <view class="batch-btn delete" @click="batchDelete">
        <text>删除 ({{ selectedIds.length }})</text>
      </view>
    </view>
  </view>
</template>

<script setup>
import { ref, computed, watch } from 'vue'
import { onLoad, onShow } from '@dcloudio/uni-app'
import { contentApi } from '@/api'
import { useCategoryStore } from '@/store/category'

// 数据
const subCategoryId = ref('')
const mainCategoryName = ref('')
const subCategoryName = ref('')
const currentTab = ref('image')
const contents = ref([])
const loading = ref(false)
const refreshing = ref(false)
const currentPage = ref(1)
const hasMore = ref(true)

// 滑动和选择模式
const swipeId = ref(null)
const swipeX = ref(0)
const selectionMode = ref(false)
const selectedIds = ref([])

// Tab配置
const tabs = [
  { type: 'image', label: '图片' },
  { type: 'note', label: '文本' }
]

// 瀑布流列数据
const leftColumn = ref([])
const rightColumn = ref([])
let leftHeight = 0
let rightHeight = 0
let isFirstLoad = true

// 文本内容
const noteContents = computed(() => {
  return contents.value.filter(item => item.contentType === 'note')
})

// 页面加载
onLoad((options) => {
  subCategoryId.value = options.subCategoryId

  // 从store获取分类名称
  const categoryStore = useCategoryStore()
  if (categoryStore.currentMainCategory) {
    mainCategoryName.value = categoryStore.currentMainCategory.name || ''
  }
  if (categoryStore.currentSubCategory) {
    subCategoryName.value = categoryStore.currentSubCategory.name || ''
  }
})

// 页面显示时刷新
onShow(async () => {
  // 首次加载
  if (isFirstLoad) {
    isFirstLoad = false
    await loadContents(true)

    // 如果图片列表为空，检查是否有文本内容
    if (currentTab.value === 'image' && contents.value.length === 0) {
      currentTab.value = 'note'
      await loadContents(true)
    }
    return
  }

  // 从创建/编辑页面返回时刷新
  loadContents(true)
})

// 监听Tab切换
watch(currentTab, () => {
  loadContents(true)
})

// 加载内容列表
const loadContents = async (refresh = false) => {
  if (loading.value) return

  if (refresh) {
    currentPage.value = 1
    hasMore.value = true
    refreshing.value = true
    if (currentTab.value === 'image') {
      leftColumn.value = []
      rightColumn.value = []
      leftHeight = 0
      rightHeight = 0
    }
  }

  if (!hasMore.value && !refresh) return

  loading.value = true

  try {
    const res = await contentApi.getContentList({
      subCategoryId: subCategoryId.value,
      contentType: currentTab.value,
      pageNum: currentPage.value,
      pageSize: 20
    })

    // 后端返回格式：data.rows
    const list = res.data?.rows || []
    const validList = list.filter(item => item != null)

    if (refresh) {
      contents.value = validList
    } else {
      contents.value = [...contents.value, ...validList]
    }

    // 图片类型需要分配到瀑布流列
    if (currentTab.value === 'image') {
      distributeToWaterfall(validList, refresh)
    }

    hasMore.value = list.length >= 20
  } catch (error) {
    console.error('Load contents error:', error)
    uni.showToast({
      title: '加载失败',
      icon: 'none'
    })
  } finally {
    loading.value = false
    refreshing.value = false
  }
}

// 分配图片到瀑布流
const distributeToWaterfall = (list, refresh) => {
  if (refresh) {
    leftColumn.value = []
    rightColumn.value = []
    leftHeight = 0
    rightHeight = 0
  }

  list.forEach(item => {
    // 简单分配：轮流放到左右列（实际应该根据图片高度）
    if (leftHeight <= rightHeight) {
      leftColumn.value.push(item)
      leftHeight += 1
    } else {
      rightColumn.value.push(item)
      rightHeight += 1
    }
  })
}

// 图片加载完成
const imageLoad = (e) => {
  // 可以在这里根据实际图片高度调整布局
  console.log('Image loaded', e)
}

// 切换Tab
const switchTab = (type) => {
  if (currentTab.value === type) return
  currentTab.value = type
}

// 下拉刷新
const onRefresh = () => {
  loadContents(true)
}

// 上拉加载更多
const onLoadMore = () => {
  if (!hasMore.value || loading.value) return
  currentPage.value++
  loadContents()
}

// 跳转详情
const goToDetail = (item) => {
  const url = item.contentType === 'image'
    ? `/pages/content/image-detail/image-detail?id=${item.id}`
    : `/pages/content/note-detail/note-detail?id=${item.id}`

  uni.navigateTo({ url })
}

// 创建内容
const createContent = () => {
  const url = currentTab.value === 'image'
    ? `/pages/content/create-image/create-image?subCategoryId=${subCategoryId.value}`
    : `/pages/content/create-note/create-note?subCategoryId=${subCategoryId.value}`

  uni.navigateTo({ url })
}

// 获取文本预览
const getTextPreview = (html) => {
  if (!html) return ''
  // 简单移除HTML标签
  return html.replace(/<[^>]+>/g, '').substring(0, 100)
}

// 格式化时间
const formatTime = (time) => {
  if (!time) return ''
  const date = new Date(time)
  return `${date.getMonth() + 1}-${date.getDate()}`
}

// 返回首页（主分类列表）
const goToHome = () => {
  uni.switchTab({
    url: '/pages/tabbar/browse/browse'
  })
}

// 触摸开始
let touchStartX = 0
let touchStartTime = 0
const onTouchStart = (e, item) => {
  if (selectionMode.value) return

  // 如果点击的不是当前已滑动的卡片，则隐藏之前的删除按钮
  if (swipeId.value && swipeId.value !== item.id) {
    swipeId.value = null
    swipeX.value = 0
  }

  touchStartX = e.touches[0].clientX
  touchStartTime = Date.now()
}

// 触摸移动
const onTouchMove = (e, item) => {
  if (selectionMode.value) return
  const touchX = e.touches[0].clientX
  const deltaX = touchX - touchStartX

  // 左滑显示删除按钮
  if (deltaX < 0 && deltaX > -150) {
    swipeId.value = item.id
    swipeX.value = deltaX
  }
  // 右滑隐藏按钮
  else if (deltaX > 0 && swipeId.value === item.id) {
    swipeX.value = 0
    swipeId.value = null
  }
}

// 触摸结束
const onTouchEnd = (e, item) => {
  if (selectionMode.value) return

  const touchTime = Date.now() - touchStartTime

  // 长按检测（超过500ms）
  if (touchTime > 500 && Math.abs(swipeX.value) < 10) {
    enterSelectionMode()
    return
  }

  // 滑动检测
  if (swipeX.value < -60) {
    swipeId.value = item.id
    swipeX.value = -120
  } else {
    swipeId.value = null
    swipeX.value = 0
  }
}

// 进入选择模式
const enterSelectionMode = () => {
  selectionMode.value = true
  selectedIds.value = []
  swipeId.value = null
  swipeX.value = 0
}

// 退出选择模式
const exitSelectionMode = () => {
  selectionMode.value = false
  selectedIds.value = []
}

// 切换选择
const toggleSelection = (item) => {
  const index = selectedIds.value.indexOf(item.id)
  if (index > -1) {
    selectedIds.value.splice(index, 1)
  } else {
    selectedIds.value.push(item.id)
  }
}

// 删除单个内容
const deleteSingle = async (item) => {
  uni.showModal({
    title: '确认删除',
    content: `确定要删除"${item.title || item.name}"吗？`,
    success: async (res) => {
      if (res.confirm) {
        try {
          await contentApi.deleteContent(item.id)
          uni.showToast({
            title: '删除成功',
            icon: 'success'
          })
          loadContents(true)
        } catch (error) {
          uni.showToast({
            title: '删除失败',
            icon: 'none'
          })
        }
      }
    }
  })
  swipeId.value = null
  swipeX.value = 0
}

// 批量删除
const batchDelete = async () => {
  if (selectedIds.value.length === 0) {
    uni.showToast({
      title: '请选择要删除的内容',
      icon: 'none'
    })
    return
  }

  uni.showModal({
    title: '确认删除',
    content: `确定要删除选中的 ${selectedIds.value.length} 项内容吗？`,
    success: async (res) => {
      if (res.confirm) {
        try {
          await Promise.all(
            selectedIds.value.map(id => contentApi.deleteContent(id))
          )
          uni.showToast({
            title: '删除成功',
            icon: 'success'
          })
          exitSelectionMode()
          loadContents(true)
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
</script>

<style scoped>
.content-list-page {
  min-height: 100vh;
  background: #f5f5f5;
}

/* 分类标签 */
.category-label-container {
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  padding: 24rpx 30rpx 20rpx;
  padding-top: calc(24rpx + constant(safe-area-inset-top));
  padding-top: calc(24rpx + env(safe-area-inset-top));
  background: #ffffff;
  z-index: 100;
  border-bottom: 1rpx solid rgba(0, 0, 0, 0.05);
  display: flex;
  align-items: center;
  gap: 20rpx;
}

.category-breadcrumb {
  display: flex;
  flex-direction: column;
  gap: 8rpx;
  flex: 1;
}

.home-button {
  width: 60rpx;
  height: 60rpx;
  display: flex;
  align-items: center;
  justify-content: center;
  border-radius: 50%;
  background: rgba(0, 196, 179, 0.1);
  transition: all 0.2s ease;
  flex-shrink: 0;
}

.home-button:active {
  background: rgba(0, 196, 179, 0.2);
  transform: scale(0.95);
}

.home-icon {
  font-size: 32rpx;
}

.main-category-name {
  font-size: 32rpx;
  color: #333333;
  font-weight: 600;
  line-height: 1.4;
}

.sub-category-name {
  font-size: 24rpx;
  color: #999999;
  font-weight: 400;
  line-height: 1.4;
}

/* Tab栏 */
.tab-bar {
  position: fixed;
  top: calc(100rpx + constant(safe-area-inset-top));
  top: calc(100rpx + env(safe-area-inset-top));
  left: 0;
  right: 0;
  height: 88rpx;
  background: rgba(255, 255, 255, 0.95);
  backdrop-filter: blur(20rpx);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 99;
  border-bottom: 1rpx solid rgba(0, 0, 0, 0.08);
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

/* 滚动容器 */
.content-scroll {
  height: 100vh;
  padding-top: calc(188rpx + constant(safe-area-inset-top));
  padding-top: calc(188rpx + env(safe-area-inset-top));
}

/* 瀑布流 */
.waterfall-container {
  display: flex;
  padding: 20rpx 20rpx 0;
  gap: 20rpx;
}

.waterfall-column {
  flex: 1;
  display: flex;
  flex-direction: column;
}

.waterfall-item {
  margin-bottom: 20rpx;
  border-radius: 16rpx;
  overflow: hidden;
  background: #ffffff;
  box-shadow: 0 4rpx 12rpx rgba(0, 0, 0, 0.08);
  transition: transform 0.3s ease;
}

.waterfall-item:active {
  transform: scale(0.98);
}

.waterfall-image {
  width: 100%;
  display: block;
}

.waterfall-info {
  padding: 20rpx;
}

.waterfall-title {
  display: block;
  font-size: 26rpx;
  color: #333333;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

/* 文本列表 */
.note-list {
  padding: 20rpx 30rpx 0;
}

.note-card-wrapper {
  position: relative;
  margin-bottom: 24rpx;
  overflow: hidden;
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
  justify-content: space-between;
  align-items: center;
}

.note-tags {
  display: flex;
  gap: 12rpx;
  flex: 1;
}

.tag-item {
  padding: 6rpx 14rpx;
  background: rgba(0, 196, 179, 0.15);
  border-radius: 6rpx;
  font-size: 20rpx;
  color: #00c4b3;
}

.note-time {
  font-size: 22rpx;
  color: #cccccc;
  margin-left: 16rpx;
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
}

/* 底部占位 */
.bottom-placeholder {
  height: 150rpx;
}

/* 悬浮按钮 */
.fab-button {
  position: fixed;
  right: 40rpx;
  bottom: calc(40rpx + constant(safe-area-inset-bottom));
  bottom: calc(40rpx + env(safe-area-inset-bottom));
  width: 112rpx;
  height: 112rpx;
  background: linear-gradient(135deg, #00c4b3 0%, #00a99d 100%);
  border-radius: 56rpx;
  display: flex;
  align-items: center;
  justify-content: center;
  box-shadow: 0 8rpx 24rpx rgba(0, 196, 179, 0.4);
  z-index: 100;
  transition: transform 0.3s ease;
}

.fab-button:active {
  transform: scale(0.9);
}

.fab-icon {
  font-size: 60rpx;
  color: #ffffff;
  line-height: 1;
  font-weight: 300;
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

/* 删除按钮 */
.delete-button {
  position: absolute;
  right: 0;
  top: 0;
  bottom: 0;
  width: 120rpx;
  background: #ff4444;
  display: flex;
  align-items: center;
  justify-content: center;
  border-radius: 0 20rpx 20rpx 0;
}

.delete-button:active {
  opacity: 0.8;
}

.delete-text {
  font-size: 28rpx;
  color: #ffffff;
  font-weight: 500;
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
</style>
