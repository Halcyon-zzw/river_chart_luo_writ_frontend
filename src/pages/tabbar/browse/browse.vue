<template>
  <view class="browse-page">
    <!-- 自定义导航栏 -->
    <view class="custom-navbar">
      <view class="navbar-title">浏览</view>
    </view>

    <!-- 分类标签 -->
    <view class="category-label-container">
      <text class="category-label">主分类</text>
    </view>

    <!-- 主分类列表 -->
    <scroll-view
      class="category-scroll"
      scroll-y
      @scrolltolower="onLoadMore"
    >
      <view class="category-container">
        <!-- 分类卡片 -->
        <view
          v-for="category in categories"
          :key="category.id"
          class="category-card"
          @click="goToSubCategory(category)"
        >
          <!-- 背景图 -->
          <image
            v-if="category.coverImage"
            class="category-bg"
            :src="category.coverImage"
            mode="aspectFill"
          ></image>
          <view v-else class="category-bg-placeholder"></view>

          <!-- 渐变遮罩 -->
          <view class="category-overlay"></view>

          <!-- 内容 -->
          <view class="category-content">
            <text class="category-name">{{ category.name }}</text>
            <text v-if="category.description" class="category-desc">
              {{ category.description }}
            </text>

            <!-- 标签和数量 -->
            <view class="category-footer">
              <view class="category-tags">
                <text
                  v-for="tag in category.tags?.slice(0, 3)"
                  :key="tag.id"
                  class="tag-item"
                >
                  {{ tag.name }}
                </text>
              </view>
              <text class="category-count">{{ category.contentCount || 0 }} 项</text>
            </view>
          </view>
        </view>

        <!-- 加载状态 -->
        <view v-if="loading" class="loading-container">
          <text class="loading-text">加载中...</text>
        </view>

        <!-- 空状态 -->
        <view v-if="!loading && categories.length === 0" class="empty-container">
          <text class="empty-text">暂无分类</text>
          <text class="empty-tip">点击右下角按钮创建第一个分类</text>
        </view>

        <!-- 底部占位 -->
        <view class="bottom-placeholder"></view>
      </view>
    </scroll-view>

    <!-- 悬浮创建按钮 -->
    <view class="fab-button" @click="createMainCategory">
      <text class="fab-icon">+</text>
    </view>
  </view>
</template>

<script setup>
import { ref, onMounted } from 'vue'
import { useCategoryStore } from '@/store/category'
import { categoryApi } from '@/api'

const categoryStore = useCategoryStore()

// 数据
const categories = ref([])
const loading = ref(false)
const currentPage = ref(1)
const hasMore = ref(true)

// 加载主分类列表
const loadCategories = async (refresh = false) => {
  if (loading.value) return

  if (refresh) {
    currentPage.value = 1
    hasMore.value = true
  }

  if (!hasMore.value) return

  loading.value = true

  try {
    const res = await categoryApi.getMainCategories({
      pageNum: currentPage.value,
      pageSize: 20
    })

    // 确保list是数组
    let list = []
    if (res.data?.records && Array.isArray(res.data.records)) {
      list = res.data.records
    } else if (res.data?.list && Array.isArray(res.data.list)) {
      list = res.data.list
    } else if (Array.isArray(res.data)) {
      list = res.data
    } else if (Array.isArray(res)) {
      list = res
    }

    // 过滤掉null或undefined的元素
    const validList = list.filter(item => item != null)

    if (refresh) {
      categories.value = validList
    } else {
      categories.value = [...categories.value, ...validList]
    }

    // 判断是否还有更多
    hasMore.value = list.length >= 20

    // 存储到 store
    if (refresh) {
      categoryStore.mainCategories = categories.value
    }
  } catch (error) {
    console.error('Load categories error:', error)
    uni.showToast({
      title: '加载失败',
      icon: 'none'
    })
  } finally {
    loading.value = false
  }
}

// 上拉加载更多
const onLoadMore = () => {
  if (!hasMore.value || loading.value) return
  currentPage.value++
  loadCategories()
}

// 进入子分类页面
const goToSubCategory = (category) => {
  categoryStore.setCurrentMainCategory(category)
  uni.navigateTo({
    url: `/pages/category/sub-list/sub-list?mainCategoryId=${category.id}`
  })
}

// 创建主分类
const createMainCategory = () => {
  uni.navigateTo({
    url: '/pages/category/create-main-category/create-main-category'
  })
}

// 页面加载
onMounted(() => {
  loadCategories(true)
})
</script>

<style scoped>
.browse-page {
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

/* 分类标签 */
.category-label-container {
  position: fixed;
  top: calc(88rpx + constant(safe-area-inset-top));
  top: calc(88rpx + env(safe-area-inset-top));
  left: 0;
  right: 0;
  height: 88rpx;
  background: #f5f5f5;
  display: flex;
  align-items: center;
  padding: 0 30rpx;
  z-index: 99;
  border-bottom: 1rpx solid rgba(0, 0, 0, 0.05);
}

.category-label {
  font-size: 28rpx;
  color: #666666;
  font-weight: 500;
}

/* 滚动容器 */
.category-scroll {
  height: 100vh;
  padding-top: calc(176rpx + constant(safe-area-inset-top));
  padding-top: calc(176rpx + env(safe-area-inset-top));
}

.category-container {
  padding: 30rpx 30rpx 0;
}

/* 分类卡片 */
.category-card {
  position: relative;
  height: 360rpx;
  margin-bottom: 30rpx;
  border-radius: 24rpx;
  overflow: hidden;
  box-shadow: 0 8rpx 32rpx rgba(0, 0, 0, 0.3);
  transition: transform 0.3s ease;
}

.category-card:active {
  transform: scale(0.98);
}

.category-bg,
.category-bg-placeholder {
  position: absolute;
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
}

.category-bg-placeholder {
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
}

.category-overlay {
  position: absolute;
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
  background: linear-gradient(180deg, transparent 0%, rgba(0, 0, 0, 0.8) 100%);
}

.category-content {
  position: absolute;
  bottom: 0;
  left: 0;
  right: 0;
  padding: 40rpx 30rpx 30rpx;
  z-index: 1;
}

.category-name {
  display: block;
  font-size: 40rpx;
  font-weight: 700;
  color: #ffffff;
  text-shadow: 0 2rpx 8rpx rgba(0, 0, 0, 0.3);
  margin-bottom: 12rpx;
  letter-spacing: 1rpx;
}

.category-desc {
  display: block;
  font-size: 26rpx;
  color: rgba(255, 255, 255, 0.95);
  text-shadow: 0 1rpx 4rpx rgba(0, 0, 0, 0.3);
  margin-bottom: 20rpx;
  line-height: 1.5;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.category-footer {
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.category-tags {
  display: flex;
  flex-wrap: wrap;
  gap: 12rpx;
  flex: 1;
}

.tag-item {
  padding: 8rpx 16rpx;
  background: rgba(255, 255, 255, 0.25);
  backdrop-filter: blur(10rpx);
  border-radius: 8rpx;
  font-size: 22rpx;
  color: #ffffff;
  text-shadow: 0 1rpx 2rpx rgba(0, 0, 0, 0.2);
}

.category-count {
  font-size: 24rpx;
  color: rgba(255, 255, 255, 0.85);
  text-shadow: 0 1rpx 2rpx rgba(0, 0, 0, 0.2);
  margin-left: 20rpx;
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
  height: 120rpx;
}

/* 悬浮按钮 */
.fab-button {
  position: fixed;
  right: 40rpx;
  bottom: calc(120rpx + constant(safe-area-inset-bottom));
  bottom: calc(120rpx + env(safe-area-inset-bottom));
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

/* 创建菜单 */
.menu-mask {
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background: rgba(0, 0, 0, 0.6);
  z-index: 999;
  display: flex;
  align-items: flex-end;
  justify-content: center;
}

.menu-container {
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

.menu-item {
  display: flex;
  align-items: center;
  padding: 32rpx 30rpx;
  background: rgba(0, 0, 0, 0.03);
  border-radius: 16rpx;
  margin-bottom: 20rpx;
  transition: background 0.2s ease;
}

.menu-item:active {
  background: rgba(0, 0, 0, 0.08);
}

.menu-icon {
  font-size: 44rpx;
  margin-right: 24rpx;
}

.menu-text {
  font-size: 32rpx;
  color: #333333;
  font-weight: 500;
}

.menu-cancel {
  margin-top: 20rpx;
  padding: 28rpx;
  text-align: center;
  background: rgba(0, 0, 0, 0.03);
  border-radius: 16rpx;
  font-size: 32rpx;
  color: #999999;
}

.menu-cancel:active {
  background: rgba(0, 0, 0, 0.08);
}
</style>
