<template>
  <view v-if="visible" class="category-selector-mask" @click="handleCancel">
    <view class="category-selector-container" @click.stop>
      <!-- 头部 -->
      <view class="selector-header">
        <text class="header-title">选择主分类</text>
        <view class="close-btn" @click="handleCancel">
          <text>✕</text>
        </view>
      </view>

      <!-- 搜索框 -->
      <view class="search-container">
        <view class="search-box">
          <text class="search-icon">🔍</text>
          <input
            class="search-input"
            v-model="searchKeyword"
            placeholder="搜索主分类"
            @input="onSearchInput"
          />
          <text v-if="searchKeyword" class="clear-icon" @click="clearSearch">✕</text>
        </view>
      </view>

      <!-- 当前选择 -->
      <view v-if="selectedCategory" class="selected-category-container">
        <text class="section-title">当前选择</text>
        <view class="selected-category-item">
          <text class="category-name">{{ selectedCategory.name }}</text>
          <text class="category-info">子分类: {{ selectedCategory.subCategorySize || 0 }}</text>
        </view>
      </view>

      <!-- 主分类列表 -->
      <view class="categories-container">
        <text class="section-title">所有主分类</text>
        <scroll-view
          class="categories-scroll"
          scroll-y
          @scrolltolower="loadMore"
        >
          <view class="categories-list">
            <view
              v-for="category in categories"
              :key="category.id"
              class="category-item"
              :class="{ selected: isSelected(category) }"
              @click="selectCategory(category)"
            >
              <view class="category-radio">
                <view v-if="isSelected(category)" class="radio-dot"></view>
              </view>
              <view class="category-content">
                <text class="category-name">{{ category.name }}</text>
                <text class="category-desc" v-if="category.description">{{ category.description }}</text>
              </view>
              <text class="category-count">{{ category.subCategorySize || 0 }}</text>
            </view>

            <!-- 加载中 -->
            <view v-if="loading" class="loading-text">加载中...</view>

            <!-- 空状态 -->
            <view v-if="!loading && categories.length === 0" class="empty-text">
              {{ searchKeyword ? '未找到相关主分类' : '暂无主分类' }}
            </view>

            <!-- 没有更多 -->
            <view v-if="!loading && !hasMore && categories.length > 0" class="no-more-text">
              没有更多了
            </view>
          </view>
        </scroll-view>
      </view>

      <!-- 底部按钮 -->
      <view class="selector-footer">
        <view class="action-btn cancel-btn" @click="handleCancel">
          <text>取消</text>
        </view>
        <view class="action-btn confirm-btn" @click="handleConfirm">
          <text>确定</text>
        </view>
      </view>
    </view>
  </view>
</template>

<script setup>
import { ref, watch } from 'vue'
import { categoryApi } from '@/api'

// Props
const props = defineProps({
  visible: {
    type: Boolean,
    default: false
  },
  selectedId: {
    type: [String, Number],
    default: ''
  }
})

// Emits
const emit = defineEmits(['update:visible', 'confirm', 'cancel'])

// 数据
const searchKeyword = ref('')
const categories = ref([])
const selectedCategory = ref(null)
const loading = ref(false)
const currentPage = ref(1)
const hasMore = ref(true)
const pageSize = 20

// 监听弹窗显示
watch(() => props.visible, (val) => {
  if (val) {
    resetData()
    loadCategories()
  } else {
    searchKeyword.value = ''
  }
})

// 监听已选ID变化
watch(() => props.selectedId, () => {
  if (props.visible && props.selectedId) {
    initSelectedCategory()
  }
})

// 重置数据
const resetData = () => {
  categories.value = []
  currentPage.value = 1
  hasMore.value = true
  selectedCategory.value = null
  if (props.selectedId) {
    initSelectedCategory()
  }
}

// 初始化已选分类
const initSelectedCategory = () => {
  if (props.selectedId && categories.value.length > 0) {
    const category = categories.value.find(c => c.id === props.selectedId)
    if (category) {
      selectedCategory.value = category
    }
  }
}

// 加载主分类列表
const loadCategories = async (refresh = false) => {
  if (loading.value) return
  if (!refresh && !hasMore.value) return

  loading.value = true

  try {
    if (refresh) {
      currentPage.value = 1
      hasMore.value = true
    }

    const res = await categoryApi.getMainCategories({
      pageNum: currentPage.value,
      pageSize: pageSize,
      name: searchKeyword.value.trim()
    })

    const newCategories = res.data?.rows || res.data || []

    if (refresh) {
      categories.value = newCategories
    } else {
      categories.value = [...categories.value, ...newCategories]
    }

    // 检查是否还有更多数据
    if (newCategories.length < pageSize) {
      hasMore.value = false
    } else {
      currentPage.value++
    }

    // 初始化选中项
    if (props.selectedId) {
      initSelectedCategory()
    }
  } catch (error) {
    console.error('Load categories error:', error)
    uni.showToast({
      title: '加载主分类失败',
      icon: 'none'
    })
  } finally {
    loading.value = false
  }
}

// 加载更多
const loadMore = () => {
  if (!loading.value && hasMore.value) {
    loadCategories()
  }
}

// 搜索输入
const onSearchInput = () => {
  // 延迟搜索，避免频繁请求
  if (searchTimeout) {
    clearTimeout(searchTimeout)
  }
  searchTimeout = setTimeout(() => {
    loadCategories(true)
  }, 500)
}

let searchTimeout = null

// 清除搜索
const clearSearch = () => {
  searchKeyword.value = ''
  loadCategories(true)
}

// 判断是否已选择
const isSelected = (category) => {
  return selectedCategory.value?.id === category.id
}

// 选择分类
const selectCategory = (category) => {
  selectedCategory.value = category
}

// 确认
const handleConfirm = () => {
  if (!selectedCategory.value) {
    uni.showToast({
      title: '请选择主分类',
      icon: 'none'
    })
    return
  }
  emit('confirm', selectedCategory.value)
  emit('update:visible', false)
}

// 取消
const handleCancel = () => {
  emit('cancel')
  emit('update:visible', false)
}
</script>

<style scoped>
.category-selector-mask {
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background: rgba(0, 0, 0, 0.6);
  z-index: 9999;
  display: flex;
  align-items: flex-end;
  justify-content: center;
}

.category-selector-container {
  width: 100%;
  max-height: 80vh;
  background: #ffffff;
  border-radius: 32rpx 32rpx 0 0;
  display: flex;
  flex-direction: column;
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

/* 头部 */
.selector-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 40rpx 30rpx 20rpx;
  border-bottom: 1rpx solid rgba(0, 0, 0, 0.08);
}

.header-title {
  font-size: 36rpx;
  font-weight: 600;
  color: #333333;
}

.close-btn {
  width: 48rpx;
  height: 48rpx;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 36rpx;
  color: #999999;
}

/* 搜索框 */
.search-container {
  padding: 20rpx 30rpx;
}

.search-box {
  height: 70rpx;
  background: #f5f5f5;
  border-radius: 35rpx;
  display: flex;
  align-items: center;
  padding: 0 24rpx;
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

/* 当前选择 */
.selected-category-container {
  padding: 0 30rpx 20rpx;
  border-bottom: 1rpx solid rgba(0, 0, 0, 0.08);
}

.section-title {
  font-size: 24rpx;
  color: #999999;
  margin-bottom: 16rpx;
  display: block;
}

.selected-category-item {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 20rpx 24rpx;
  background: rgba(0, 196, 179, 0.15);
  border-radius: 12rpx;
}

.selected-category-item .category-name {
  font-size: 28rpx;
  color: #00c4b3;
  font-weight: 600;
  flex: 1;
}

.category-info {
  font-size: 24rpx;
  color: #00a99d;
  margin-left: 16rpx;
}

/* 分类列表 */
.categories-container {
  flex: 1;
  padding: 20rpx 30rpx 0;
  overflow: hidden;
  display: flex;
  flex-direction: column;
}

.categories-scroll {
  flex: 1;
  max-height: 500rpx;
}

.categories-list {
  display: flex;
  flex-direction: column;
  gap: 16rpx;
  padding-bottom: 20rpx;
}

.category-item {
  display: flex;
  align-items: center;
  padding: 24rpx 20rpx;
  background: #f5f5f5;
  border-radius: 12rpx;
  gap: 16rpx;
  transition: background 0.2s ease;
}

.category-item:active {
  background: #e8e8e8;
}

.category-item.selected {
  background: rgba(0, 196, 179, 0.15);
}

.category-radio {
  width: 36rpx;
  height: 36rpx;
  border: 2rpx solid #00c4b3;
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  background: #ffffff;
  flex-shrink: 0;
}

.category-item.selected .category-radio {
  background: #ffffff;
}

.radio-dot {
  width: 20rpx;
  height: 20rpx;
  background: #00c4b3;
  border-radius: 50%;
}

.category-content {
  flex: 1;
  display: flex;
  flex-direction: column;
  gap: 8rpx;
}

.category-item .category-name {
  font-size: 28rpx;
  color: #333333;
  font-weight: 500;
}

.category-desc {
  font-size: 24rpx;
  color: #999999;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.category-count {
  font-size: 24rpx;
  color: #00c4b3;
  background: rgba(0, 196, 179, 0.1);
  padding: 6rpx 12rpx;
  border-radius: 8rpx;
  flex-shrink: 0;
}

.loading-text,
.empty-text,
.no-more-text {
  text-align: center;
  padding: 40rpx 0;
  font-size: 26rpx;
  color: #999999;
}

/* 底部按钮 */
.selector-footer {
  padding: 20rpx 30rpx;
  padding-bottom: calc(20rpx + constant(safe-area-inset-bottom));
  padding-bottom: calc(20rpx + env(safe-area-inset-bottom));
  border-top: 1rpx solid rgba(0, 0, 0, 0.08);
  display: flex;
  gap: 16rpx;
}

.action-btn {
  flex: 1;
  height: 88rpx;
  border-radius: 16rpx;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 32rpx;
  font-weight: 500;
}

.cancel-btn {
  background: rgba(0, 0, 0, 0.08);
  color: #333333;
}

.cancel-btn:active {
  background: rgba(0, 0, 0, 0.12);
}

.confirm-btn {
  background: linear-gradient(135deg, #00c4b3 0%, #00a99d 100%);
  color: #ffffff;
}

.confirm-btn:active {
  opacity: 0.8;
}
</style>
