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
      @refresherrefresh="onRefresh"
      refresher-enabled
      :refresher-triggered="refreshing"
    >
      <view class="category-container">
        <!-- 分类卡片 -->\n        <view
          v-for="category in categories"
          :key="category.id"
          class="category-card-wrapper"
        >
          <!-- 滑动容器 -->
          <view
            class="category-card"
            :style="{
              transform: swipeId === category.id ? `translateX(${swipeX}px)` : 'translateX(0)',
              transition: swipeId === category.id && swipeX === -120 ? 'transform 0.3s' : 'none'
            }"
            @touchstart="onTouchStart($event, category)"
            @touchmove="onTouchMove($event, category)"
            @touchend="onTouchEnd($event, category)"
            @click="selectionMode ? toggleSelection(category) : goToSubCategory(category)"
          >
            <!-- 选择框 -->
            <view v-if="selectionMode" class="checkbox-container" @click.stop="toggleSelection(category)">
              <view
                class="checkbox"
                :class="{
                  checked: selectedIds.includes(category.id),
                  disabled: category.subCategorySize > 0
                }"
              >
                <text v-if="selectedIds.includes(category.id)" class="checkbox-icon">✓</text>
              </view>
            </view>

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
              <view class="category-name-row">
                <input
                  v-if="editingId === category.id"
                  class="category-name-input"
                  v-model="editingName"
                  @blur="saveEdit(category)"
                  @click.stop
                  :focus="true"
                />
                <text v-else class="category-name">{{ category.name }}</text>
                <text
                  v-if="!selectionMode"
                  class="edit-icon"
                  @click.stop="startEdit(category)"
                >✎</text>
              </view>

              <view class="category-spacer"></view>

              <view class="category-bottom">
                <text v-if="category.description" class="category-desc">
                  {{ category.description }}
                </text>

                <!-- 标签和数量 -->
                <view class="category-footer">
                  <view class="category-tags">
                    <text
                      v-for="tag in category.tagDTOList?.slice(0, 3)"
                      :key="tag.id"
                      class="tag-item"
                    >
                      {{ tag.name }}
                    </text>
                    <view class="add-tag-btn" @click.stop="addTag(category)">
                      <text>+ 添加标签</text>
                    </view>
                  </view>
                  <text class="category-count">{{ category.subCategorySize || 0 }} 项</text>
                </view>

                <!-- 时间信息 -->
                <view class="category-time">
                  <text class="time-text">创建: {{ formatTime(category.createTime) }}</text>
                  <text class="time-text">修改: {{ formatTime(category.updateTime) }}</text>
                </view>
              </view>
            </view>
          </view>

          <!-- 滑动按钮组 -->
          <view v-if="swipeId === category.id" class="swipe-buttons">
            <!-- 编辑按钮 -->
            <view class="edit-button" @click.stop="handleSwipeEdit(category)">
              <text class="button-text">✎</text>
            </view>
            <!-- 删除按钮 -->
            <view
              class="delete-button"
              :class="{ disabled: category.subCategorySize > 0 }"
              @click.stop="deleteSingle(category)"
            >
              <text class="button-text">删除</text>
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
    <view v-if="!selectionMode" class="fab-button" @click="createMainCategory">
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
import { ref, onMounted } from 'vue'
import { onShow } from '@dcloudio/uni-app'
import { useCategoryStore } from '@/store/category'
import { categoryApi } from '@/api'

const categoryStore = useCategoryStore()

// 数据
const categories = ref([])
const loading = ref(false)
const refreshing = ref(false)
const currentPage = ref(1)
const hasMore = ref(true)
const editingId = ref(null)
const editingName = ref('')

// 滑动和选择模式
const swipeId = ref(null)
const swipeX = ref(0)
const selectionMode = ref(false)
const selectedIds = ref([])

// 加载主分类列表
const loadCategories = async (refresh = false) => {
  if (loading.value) return

  if (refresh) {
    currentPage.value = 1
    hasMore.value = true
    refreshing.value = true
  }

  if (!hasMore.value && !refresh) return

  loading.value = true

  try {
    const res = await categoryApi.getMainCategories({
      pageNum: currentPage.value,
      pageSize: 20
    })

    // 后端返回格式：data.rows
    const list = res.data?.rows || []
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
    refreshing.value = false
  }
}

// 下拉刷新
const onRefresh = () => {
  loadCategories(true)
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

// 开始编辑
const startEdit = (category) => {
  editingId.value = category.id
  editingName.value = category.name
}

// 保存编辑
const saveEdit = async (category) => {
  if (!editingName.value.trim()) {
    uni.showToast({
      title: '名称不能为空',
      icon: 'none'
    })
    editingId.value = null
    return
  }

  if (editingName.value === category.name) {
    editingId.value = null
    return
  }

  try {
    await categoryApi.updateMainCategory(category.id, {
      name: editingName.value
    })
    category.name = editingName.value
    editingId.value = null
    uni.showToast({
      title: '修改成功',
      icon: 'success'
    })
  } catch (error) {
    console.error('Update category error:', error)
    uni.showToast({
      title: '修改失败',
      icon: 'none'
    })
    editingId.value = null
  }
}

// 触摸开始
let touchStartX = 0
let touchStartTime = 0
const onTouchStart = (e, category) => {
  if (selectionMode.value || editingId.value) return

  // 如果点击的不是当前已滑动的卡片，则隐藏之前的删除按钮
  if (swipeId.value && swipeId.value !== category.id) {
    swipeId.value = null
    swipeX.value = 0
  }

  touchStartX = e.touches[0].clientX
  touchStartTime = Date.now()
}

// 触摸移动
const onTouchMove = (e, category) => {
  if (selectionMode.value || editingId.value) return
  const touchX = e.touches[0].clientX
  const deltaX = touchX - touchStartX

  // 左滑显示编辑和删除按钮
  if (deltaX < 0 && deltaX > -250) {
    swipeId.value = category.id
    swipeX.value = deltaX
  }
  // 右滑隐藏按钮
  else if (deltaX > 0 && swipeId.value === category.id) {
    swipeX.value = 0
    swipeId.value = null
  }
}

// 触摸结束
const onTouchEnd = (e, category) => {
  if (selectionMode.value || editingId.value) return

  const touchTime = Date.now() - touchStartTime

  // 长按检测（超过500ms）
  if (touchTime > 500 && Math.abs(swipeX.value) < 10) {
    enterSelectionMode()
    return
  }

  // 滑动检测
  if (swipeX.value < -80) {
    swipeId.value = category.id
    swipeX.value = -200
  } else {
    swipeId.value = null
    swipeX.value = 0
  }
}

// 处理左滑编辑
const handleSwipeEdit = (category) => {
  swipeId.value = null
  swipeX.value = 0
  uni.navigateTo({
    url: `/pages/category/create-main-category/create-main-category?id=${category.id}&mode=edit`
  })
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
const toggleSelection = (category) => {
  if (category.subCategorySize > 0) {
    uni.showToast({
      title: '该分类下还有内容，无法选中',
      icon: 'none'
    })
    return
  }

  const index = selectedIds.value.indexOf(category.id)
  if (index > -1) {
    selectedIds.value.splice(index, 1)
  } else {
    selectedIds.value.push(category.id)
  }
}

// 删除单个分类
const deleteSingle = async (category) => {
  if (category.subCategorySize > 0) {
    uni.showToast({
      title: '该分类下还有内容，无法删除',
      icon: 'none'
    })
    return
  }

  uni.showModal({
    title: '确认删除',
    content: `确定要删除"${category.name}"吗？`,
    success: async (res) => {
      if (res.confirm) {
        try {
          await categoryApi.deleteMainCategory(category.id)
          uni.showToast({
            title: '删除成功',
            icon: 'success'
          })
          loadCategories(true)
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
      title: '请选择要删除的分类',
      icon: 'none'
    })
    return
  }

  uni.showModal({
    title: '确认删除',
    content: `确定要删除选中的 ${selectedIds.value.length} 个分类吗？`,
    success: async (res) => {
      if (res.confirm) {
        try {
          await Promise.all(
            selectedIds.value.map(id => categoryApi.deleteMainCategory(id))
          )
          uni.showToast({
            title: '删除成功',
            icon: 'success'
          })
          exitSelectionMode()
          loadCategories(true)
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

// 添加标签
const addTag = (category) => {
  uni.showToast({
    title: '标签功能开发中',
    icon: 'none'
  })
}

// 页面初始化
onMounted(() => {
  console.log('Browse page mounted')
})

// 页面显示时加载（TabBar页面使用onShow）
onShow(() => {
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
  justify-content: center;
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

/* 分类卡片包装器 */
.category-card-wrapper {
  position: relative;
  margin-bottom: 30rpx;
  overflow: hidden;
}

/* 分类卡片 */
.category-card {
  position: relative;
  height: 400rpx;
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
  top: 0;
  bottom: 0;
  left: 0;
  right: 0;
  padding: 30rpx;
  z-index: 1;
  display: flex;
  flex-direction: column;
}

.category-spacer {
  flex: 1;
}

.category-bottom {
  display: flex;
  flex-direction: column;
  gap: 12rpx;
}

.category-name-row {
  display: flex;
  align-items: center;
  gap: 12rpx;
}

.category-name {
  font-size: 36rpx;
  font-weight: 700;
  color: #ffffff;
  flex: 1;
}

.category-name-input {
  flex: 1;
  font-size: 40rpx;
  font-weight: 700;
  color: #ffffff;
  background: rgba(255, 255, 255, 0.2);
  border: 1rpx solid rgba(255, 255, 255, 0.4);
  border-radius: 8rpx;
  padding: 8rpx 16rpx;
}

.edit-icon {
  font-size: 32rpx;
  color: #ffffff;
  opacity: 1;
  transform: scaleX(-1);
}

.category-desc {
  display: block;
  font-size: 24rpx;
  color: rgba(255, 255, 255, 0.95);
  text-shadow: 0 1rpx 4rpx rgba(0, 0, 0, 0.3);
  margin-bottom: 12rpx;
  line-height: 1.5;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.category-footer {
  display: flex;
  justify-content: space-between;
  align-items: flex-end;
}

.category-tags {
  display: flex;
  flex-wrap: wrap;
  gap: 12rpx;
  flex: 1;
  align-items: center;
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

.add-tag-btn {
  padding: 8rpx 16rpx;
  background: rgba(255, 255, 255, 0.15);
  border: 1rpx dashed rgba(255, 255, 255, 0.5);
  border-radius: 8rpx;
  font-size: 22rpx;
  color: rgba(255, 255, 255, 0.8);
}

.category-count {
  font-size: 24rpx;
  color: rgba(255, 255, 255, 0.85);
  text-shadow: 0 1rpx 2rpx rgba(0, 0, 0, 0.2);
  margin-left: 20rpx;
}

/* 时间信息 */
.category-time {
  display: flex;
  flex-direction: column;
  gap: 6rpx;
  margin-top: 16rpx;
}

.time-text {
  font-size: 20rpx;
  color: rgba(255, 255, 255, 0.7);
  text-shadow: 0 1rpx 2rpx rgba(0, 0, 0, 0.2);
}

/* 选择框 */
.checkbox-container {
  position: absolute;
  top: 20rpx;
  left: 20rpx;
  z-index: 10;
}

.checkbox {
  width: 48rpx;
  height: 48rpx;
  border: 2rpx solid rgba(255, 255, 255, 0.8);
  border-radius: 50%;
  background: rgba(0, 0, 0, 0.3);
  backdrop-filter: blur(10rpx);
  display: flex;
  align-items: center;
  justify-content: center;
}

.checkbox.checked {
  background: #00c4b3;
  border-color: #00c4b3;
}

.checkbox.disabled {
  opacity: 0.4;
  border-color: rgba(255, 255, 255, 0.4);
}

.checkbox-icon {
  font-size: 28rpx;
  color: #ffffff;
  font-weight: 700;
}

/* 滑动按钮组 */
.swipe-buttons {
  position: absolute;
  right: 0;
  top: 0;
  bottom: 0;
  width: 200rpx;
  display: flex;
  border-radius: 0 24rpx 24rpx 0;
  overflow: hidden;
}

/* 编辑按钮 */
.edit-button {
  flex: 1;
  background: #007AFF;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
}

.edit-button:active {
  opacity: 0.8;
}

/* 删除按钮 */
.delete-button {
  flex: 1;
  background: #ff4444;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
}

.delete-button.disabled {
  background: #cccccc;
}

.delete-button:active {
  opacity: 0.8;
}

.button-text {
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
