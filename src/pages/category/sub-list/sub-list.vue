<template>
  <view class="sub-list-page">
    <!-- 分类标签 -->
    <view class="category-label-container">
      <text class="category-label">{{ mainCategoryName }}</text>
    </view>

    <!-- 子分类列表 -->
    <scroll-view
      class="sub-scroll"
      scroll-y
      @scrolltolower="onLoadMore"
      @refresherrefresh="onRefresh"
      refresher-enabled
      :refresher-triggered="refreshing"
    >
      <view class="sub-container">
        <!-- 子分类卡片 -->
        <view
          v-for="subCategory in subCategories"
          :key="subCategory.id"
          class="sub-card"
          @click="goToContentList(subCategory)"
        >
          <!-- 背景图 -->
          <image
            v-if="subCategory.coverImage"
            class="sub-bg"
            :src="subCategory.coverImage"
            mode="aspectFill"
          ></image>
          <view v-else class="sub-bg-placeholder"></view>

          <!-- 渐变遮罩 -->
          <view class="sub-overlay"></view>

          <!-- 内容 -->
          <view class="sub-content">
            <view class="sub-name-row">
              <input
                v-if="editingId === subCategory.id"
                class="sub-name-input"
                v-model="editingName"
                @blur="saveEdit(subCategory)"
                @click.stop
                :focus="true"
              />
              <text v-else class="sub-name">{{ subCategory.name }}</text>
              <text class="edit-icon" @click.stop="startEdit(subCategory)">✎</text>
            </view>
            <text v-if="subCategory.description" class="sub-desc">
              {{ subCategory.description }}
            </text>

            <!-- 底部信息 -->
            <view class="sub-footer">
              <view class="sub-tags">
                <text
                  v-for="tag in subCategory.tags?.slice(0, 2)"
                  :key="tag.id"
                  class="tag-item"
                >
                  {{ tag.name }}
                </text>
              </view>
              <text class="sub-count">{{ subCategory.contentSize || 0 }} 项</text>
            </view>
          </view>
        </view>

        <!-- 加载状态 -->
        <view v-if="loading" class="loading-container">
          <text class="loading-text">加载中...</text>
        </view>

        <!-- 空状态 -->
        <view v-if="!loading && subCategories.length === 0" class="empty-container">
          <text class="empty-text">该分类下暂无子分类</text>
        </view>

        <!-- 底部占位 -->
        <view class="bottom-placeholder"></view>
      </view>
    </scroll-view>

    <!-- 悬浮创建按钮 -->
    <view class="fab-button" @click="createSubCategory">
      <text class="fab-icon">+</text>
    </view>
  </view>
</template>

<script setup>
import { ref, onMounted } from 'vue'
import { onLoad, onShow } from '@dcloudio/uni-app'
import { useCategoryStore } from '@/store/category'
import { categoryApi } from '@/api'

const categoryStore = useCategoryStore()

// 数据
const mainCategoryId = ref('')
const mainCategoryName = ref('子分类')
const subCategories = ref([])
const loading = ref(false)
const refreshing = ref(false)
const currentPage = ref(1)
const hasMore = ref(true)
const editingId = ref(null)
const editingName = ref('')
let isFirstLoad = true

// 页面加载参数
onLoad((options) => {
  mainCategoryId.value = options.mainCategoryId

  // 从store获取主分类名称
  if (categoryStore.currentMainCategory) {
    mainCategoryName.value = categoryStore.currentMainCategory.name || '子分类'
  }
})

// 页面显示时刷新数据
onShow(() => {
  // 首次加载时onLoad已经处理，跳过
  if (isFirstLoad) {
    isFirstLoad = false
    loadSubCategories(true)
    return
  }

  // 从创建页面返回时刷新列表
  loadSubCategories(true)
})

// 加载子分类列表
const loadSubCategories = async (refresh = false) => {
  if (loading.value) return

  if (refresh) {
    currentPage.value = 1
    hasMore.value = true
    refreshing.value = true
  }

  if (!hasMore.value && !refresh) return

  loading.value = true

  try {
    const res = await categoryApi.getSubCategories({
      mainCategoryId: mainCategoryId.value,
      pageNum: currentPage.value,
      pageSize: 20
    })

    // 后端返回格式：data.rows
    const list = res.data?.rows || []

    if (refresh) {
      subCategories.value = list.filter(item => item != null)
    } else {
      subCategories.value = [...subCategories.value, ...list.filter(item => item != null)]
    }

    hasMore.value = list.length >= 20
  } catch (error) {
    console.error('Load sub categories error:', error)
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
  loadSubCategories(true)
}

// 上拉加载更多
const onLoadMore = () => {
  if (!hasMore.value || loading.value) return
  currentPage.value++
  loadSubCategories()
}

// 进入内容列表
const goToContentList = (subCategory) => {
  categoryStore.setCurrentSubCategory(subCategory)
  uni.navigateTo({
    url: `/pages/category/content-list/content-list?subCategoryId=${subCategory.id}`
  })
}

// 创建子分类
const createSubCategory = () => {
  if (!mainCategoryId.value) {
    uni.showToast({
      title: '请先选择主分类',
      icon: 'none'
    })
    return
  }

  uni.navigateTo({
    url: `/pages/category/create-sub-category/create-sub-category?mainCategoryId=${mainCategoryId.value}`
  })
}

// 开始编辑
const startEdit = (subCategory) => {
  editingId.value = subCategory.id
  editingName.value = subCategory.name
}

// 保存编辑
const saveEdit = async (subCategory) => {
  if (!editingName.value.trim()) {
    uni.showToast({
      title: '名称不能为空',
      icon: 'none'
    })
    editingId.value = null
    return
  }

  if (editingName.value === subCategory.name) {
    editingId.value = null
    return
  }

  try {
    await categoryApi.updateSubCategory(subCategory.id, {
      name: editingName.value
    })
    subCategory.name = editingName.value
    editingId.value = null
    uni.showToast({
      title: '修改成功',
      icon: 'success'
    })
  } catch (error) {
    console.error('Update sub-category error:', error)
    uni.showToast({
      title: '修改失败',
      icon: 'none'
    })
    editingId.value = null
  }
}
</script>

<style scoped>
.sub-list-page {
  min-height: 100vh;
  background: #f5f5f5;
}

/* 分类标签 */
.category-label-container {
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  height: 88rpx;
  background: #ffffff;
  display: flex;
  align-items: center;
  padding: 0 30rpx;
  z-index: 99;
  border-bottom: 1rpx solid rgba(0, 0, 0, 0.08);
}

.category-label {
  font-size: 32rpx;
  color: #333333;
  font-weight: 600;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
  max-width: 100%;
}

/* 滚动容器 */
.sub-scroll {
  height: 100vh;
  padding-top: 88rpx;
}

.sub-container {
  padding: 30rpx;
}

/* 子分类卡片 */
.sub-card {
  position: relative;
  height: 300rpx;
  margin-bottom: 30rpx;
  border-radius: 20rpx;
  overflow: hidden;
  box-shadow: 0 6rpx 24rpx rgba(0, 0, 0, 0.25);
  transition: transform 0.3s ease;
}

.sub-card:active {
  transform: scale(0.98);
}

.sub-bg,
.sub-bg-placeholder {
  position: absolute;
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
}

.sub-bg-placeholder {
  background: linear-gradient(135deg, #f093fb 0%, #f5576c 100%);
}

.sub-overlay {
  position: absolute;
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
  background: linear-gradient(180deg, transparent 0%, rgba(0, 0, 0, 0.75) 100%);
}

.sub-content {
  position: absolute;
  bottom: 0;
  left: 0;
  right: 0;
  padding: 30rpx;
  z-index: 1;
}

.sub-name-row {
  display: flex;
  align-items: center;
  gap: 12rpx;
  margin-bottom: 10rpx;
}

.sub-name {
  font-size: 36rpx;
  font-weight: 700;
  color: #ffffff;
  text-shadow: 0 2rpx 4rpx rgba(0, 0, 0, 0.3);
  flex: 1;
}

.sub-name-input {
  flex: 1;
  font-size: 36rpx;
  font-weight: 700;
  color: #ffffff;
  background: rgba(255, 255, 255, 0.2);
  border: 1rpx solid rgba(255, 255, 255, 0.4);
  border-radius: 8rpx;
  padding: 8rpx 16rpx;
}

.edit-icon {
  font-size: 28rpx;
  color: #ffffff;
  opacity: 1;
  transform: scaleX(-1);
}

.sub-desc {
  display: block;
  font-size: 24rpx;
  color: #ffffff;
  margin-bottom: 16rpx;
  line-height: 1.4;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
  text-shadow: 0 1rpx 3rpx rgba(0, 0, 0, 0.3);
}

.sub-footer {
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.sub-tags {
  display: flex;
  gap: 10rpx;
  flex: 1;
}

.tag-item {
  padding: 6rpx 14rpx;
  background: rgba(255, 255, 255, 0.25);
  backdrop-filter: blur(8rpx);
  border-radius: 6rpx;
  font-size: 20rpx;
  color: #ffffff;
}

.sub-count {
  font-size: 22rpx;
  color: rgba(255, 255, 255, 0.7);
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

/* 空状态 */
.empty-container {
  padding: 200rpx 60rpx;
  text-align: center;
}

.empty-text {
  font-size: 32rpx;
  color: #999999;
}

/* 底部占位 */
.bottom-placeholder {
  height: 100rpx;
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
