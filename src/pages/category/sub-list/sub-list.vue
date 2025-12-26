<template>
  <view class="sub-list-page">
    <!-- 自定义导航栏 -->
    <custom-nav-bar :title="mainCategoryName">
      <template #right>
        <view class="home-button" @click="goToHome">
          <text class="home-icon">🏠</text>
        </view>
      </template>
    </custom-nav-bar>

    <!-- 搜索框 -->
    <view class="search-container">
      <view class="search-box">
        <text class="search-icon">🔍</text>
        <input
          class="search-input"
          v-model="searchKeyword"
          placeholder="搜索子分类名称"
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
          class="sub-card-wrapper"
        >
          <!-- 滑动容器 -->
          <view
            class="sub-card"
            :style="{
              transform: swipeId === subCategory.id ? `translateX(${swipeX}px)` : 'translateX(0)',
              transition: swipeId === subCategory.id && swipeX === -120 ? 'transform 0.3s' : 'none'
            }"
            @touchstart="onTouchStart($event, subCategory)"
            @touchmove="onTouchMove($event, subCategory)"
            @touchend="onTouchEnd($event, subCategory)"
            @click="selectionMode ? toggleSelection(subCategory) : goToContentList(subCategory)"
          >
            <!-- 选择框 -->
            <view v-if="selectionMode" class="checkbox-container" @click.stop="toggleSelection(subCategory)">
              <view
                class="checkbox"
                :class="{
                  checked: selectedIds.includes(subCategory.id),
                  disabled: subCategory.contentSize > 0
                }"
              >
                <text v-if="selectedIds.includes(subCategory.id)" class="checkbox-icon">✓</text>
              </view>
            </view>

            <!-- 背景图 -->
            <image
              v-if="subCategory.coverImage"
              class="sub-bg"
              :src="getFullImageUrl(subCategory.coverImage)"
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
                <text
                  v-if="!selectionMode"
                  class="edit-icon"
                  @click.stop="startEdit(subCategory)"
                >✎</text>
              </view>

              <view class="sub-spacer"></view>

              <view class="sub-bottom">
                <text v-if="subCategory.description" class="sub-desc">
                  {{ subCategory.description }}
                </text>

                <!-- 底部信息 -->
                <view class="sub-footer">
                  <view class="sub-tags">
                    <!-- 没有标签时显示添加标签 -->
                    <view
                      v-if="!subCategory.tagDTOList || subCategory.tagDTOList.length === 0"
                      class="add-tag-btn"
                      @click.stop="addTag(subCategory)"
                    >
                      <text>添加标签</text>
                    </view>

                    <!-- 有标签时显示标签列表 -->
                    <template v-else>
                      <view
                        v-for="tag in getDisplayTags(subCategory)"
                        :key="tag.id"
                        class="tag-item-wrapper"
                        @longpress="enterTagDeleteMode(subCategory, tag)"
                        @click.stop="handleTagClick"
                      >
                        <text class="tag-item">
                          {{ tag.name }}
                        </text>
                        <text
                          v-if="tagDeleteMode && currentSubCategory?.id === subCategory.id"
                          class="tag-remove-icon"
                          @click.stop="removeTagAssociation(subCategory, tag)"
                        >✕</text>
                      </view>

                      <!-- 展开/收起按钮 - 只在标签数量>3时显示 -->
                      <view
                        v-if="subCategory.tagDTOList.length > 3"
                        class="tag-expand-btn"
                        @click.stop="toggleTagsExpand(subCategory.id)"
                      >
                        <text>{{ expandedTags.has(subCategory.id) ? '' : '...' }}</text>
                      </view>

                      <!-- 添加标签按钮 -->
                      <view class="add-tag-btn-small" @click.stop="addTag(subCategory)">
                        <text>+</text>
                      </view>
                    </template>
                  </view>
                  <text class="sub-count">{{ subCategory.contentSize || 0 }} 项</text>
                </view>

                <!-- 时间信息 -->
                <view class="sub-time">
                  <text class="time-text">创建: {{ formatTime(subCategory.createTime) }}</text>
                  <text class="time-text">修改: {{ formatTime(subCategory.updateTime) }}</text>
                </view>
              </view>
            </view>
          </view>

          <!-- 滑动按钮组 -->
          <view v-if="swipeId === subCategory.id" class="swipe-buttons">
            <!-- 编辑按钮 -->
            <view class="edit-button" @click.stop="handleSwipeEdit(subCategory)">
              <text class="edit-icon">✎</text>
            </view>
            <!-- 删除按钮 -->
            <view
              class="delete-button"
              :class="{ disabled: subCategory.contentSize > 0 }"
              @click.stop="deleteSingle(subCategory)"
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
        <view v-if="!loading && subCategories.length === 0" class="empty-container">
          <text class="empty-text">该分类下暂无子分类</text>
        </view>

        <!-- 底部占位 -->
        <view class="bottom-placeholder"></view>
      </view>
    </scroll-view>

    <!-- 悬浮创建按钮 -->
    <view v-if="!selectionMode" class="fab-button" @click="createSubCategory">
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

    <!-- 标签选择器 -->
    <tag-selector
      :visible="showTagSelector"
      :selectedTagIds="currentSubCategoryTagIds"
      @update:visible="showTagSelector = $event"
      @confirm="handleTagConfirm"
      @cancel="handleTagCancel"
    />
  </view>
</template>

<script setup>
import { ref, onMounted } from 'vue'
import { onLoad, onShow } from '@dcloudio/uni-app'
import { useCategoryStore } from '@/store/category'
import { categoryApi, tagApi } from '@/api'
import { getFullImageUrl } from '@/utils/image'
import TagSelector from '@/components/tag-selector/tag-selector.vue'

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
const searchKeyword = ref('')
let isFirstLoad = true

// 滑动和选择模式
const swipeId = ref(null)
const swipeX = ref(0)
const selectionMode = ref(false)
const selectedIds = ref([])

// 标签选择器
const showTagSelector = ref(false)
const currentSubCategory = ref(null)
const currentSubCategoryTagIds = ref([])

// 标签删除模式
const tagDeleteMode = ref(false)

// 标签展开状态 - 记录每个分类的标签是否展开
const expandedTags = ref(new Set())

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
    const params = {
      mainCategoryId: mainCategoryId.value,
      pageNum: currentPage.value,
      pageSize: 20
    }

    // 添加搜索参数
    if (searchKeyword.value) {
      params.name = searchKeyword.value
    }

    const res = await categoryApi.getSubCategories(params)

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

// 切换标签展开状态
const toggleTagsExpand = (subCategoryId) => {
  if (expandedTags.value.has(subCategoryId)) {
    expandedTags.value.delete(subCategoryId)
  } else {
    expandedTags.value.add(subCategoryId)
  }
  // 触发响应式更新
  expandedTags.value = new Set(expandedTags.value)
}

// 获取要显示的标签列表
const getDisplayTags = (subCategory) => {
  const tags = subCategory.tagDTOList || []
  const MAX_DISPLAY = 3

  if (tags.length <= MAX_DISPLAY) {
    return tags
  }

  // 如果已展开，返回所有标签
  if (expandedTags.value.has(subCategory.id)) {
    return tags
  }

  // 未展开，只返回前3个
  return tags.slice(0, MAX_DISPLAY)
}

// 触摸开始
let touchStartX = 0
let touchStartTime = 0
const onTouchStart = (e, subCategory) => {
  if (selectionMode.value || editingId.value) return

  // 如果点击的不是当前已滑动的卡片，则隐藏之前的删除按钮
  if (swipeId.value && swipeId.value !== subCategory.id) {
    swipeId.value = null
    swipeX.value = 0
  }

  touchStartX = e.touches[0].clientX
  touchStartTime = Date.now()
}

// 触摸移动
const onTouchMove = (e, subCategory) => {
  if (selectionMode.value || editingId.value) return
  const touchX = e.touches[0].clientX
  const deltaX = touchX - touchStartX

  // 左滑显示编辑和删除按钮
  if (deltaX < 0 && deltaX > -250) {
    swipeId.value = subCategory.id
    swipeX.value = deltaX
  }
  // 右滑隐藏按钮
  else if (deltaX > 0 && swipeId.value === subCategory.id) {
    swipeX.value = 0
    swipeId.value = null
  }
}

// 触摸结束
const onTouchEnd = (e, subCategory) => {
  if (selectionMode.value || editingId.value) return

  const touchTime = Date.now() - touchStartTime

  // 长按检测（超过500ms）
  if (touchTime > 500 && Math.abs(swipeX.value) < 10) {
    enterSelectionMode()
    return
  }

  // 滑动检测
  // 动态计算滑动距离：每个按钮100rpx，当前有2个按钮（编辑+删除）
  const buttonCount = 2
  const swipeDistance = -buttonCount * 100

  if (swipeX.value < -80) {
    swipeId.value = subCategory.id
    swipeX.value = swipeDistance
  } else {
    swipeId.value = null
    swipeX.value = 0
  }
}

// 处理左滑编辑
const handleSwipeEdit = (subCategory) => {
  swipeId.value = null
  swipeX.value = 0
  uni.navigateTo({
    url: `/pages/category/create-sub-category/create-sub-category?id=${subCategory.id}&mode=edit&mainCategoryId=${mainCategoryId.value}`
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
const toggleSelection = (subCategory) => {
  if (subCategory.contentSize > 0) {
    uni.showToast({
      title: '该分类下还有内容，无法选中',
      icon: 'none'
    })
    return
  }

  const index = selectedIds.value.indexOf(subCategory.id)
  if (index > -1) {
    selectedIds.value.splice(index, 1)
  } else {
    selectedIds.value.push(subCategory.id)
  }
}

// 删除单个分类
const deleteSingle = async (subCategory) => {
  if (subCategory.contentSize > 0) {
    uni.showToast({
      title: '该分类下还有内容，无法删除',
      icon: 'none'
    })
    return
  }

  uni.showModal({
    title: '确认删除',
    content: `确定要删除"${subCategory.name}"吗？`,
    success: async (res) => {
      if (res.confirm) {
        try {
          await categoryApi.deleteSubCategory(subCategory.id)
          uni.showToast({
            title: '删除成功',
            icon: 'success'
          })
          loadSubCategories(true)
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
            selectedIds.value.map(id => categoryApi.deleteSubCategory(id))
          )
          uni.showToast({
            title: '删除成功',
            icon: 'success'
          })
          exitSelectionMode()
          loadSubCategories(true)
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
const addTag = (subCategory) => {
  currentSubCategory.value = subCategory
  currentSubCategoryTagIds.value = (subCategory.tagDTOList || []).map(tag => tag.id)
  showTagSelector.value = true
}

// 确认标签选择
const handleTagConfirm = async (selectedTags) => {
  if (!currentSubCategory.value) return

  try {
    const tagIds = selectedTags.map(tag => tag.id)

    // 调用批量关联接口
    await tagApi.batchLinkSubCategory({
      subCategoryId: currentSubCategory.value.id,
      tagIds: tagIds
    })

    // 更新本地数据
    currentSubCategory.value.tagDTOList = selectedTags

    uni.showToast({
      title: '标签更新成功',
      icon: 'success'
    })
  } catch (error) {
    console.error('Update tags error:', error)
    uni.showToast({
      title: '标签更新失败',
      icon: 'none'
    })
  }
}

// 取消标签选择
const handleTagCancel = () => {
  currentSubCategory.value = null
  currentSubCategoryTagIds.value = []
}

// 进入标签删除模式
const enterTagDeleteMode = (subCategory, tag) => {
  currentSubCategory.value = subCategory
  tagDeleteMode.value = true
}

// 处理标签点击（防止误触发）
const handleTagClick = () => {
  // 点击标签不做任何操作，只有长按才进入删除模式
}

// 删除标签关联
const removeTagAssociation = async (subCategory, tag) => {
  try {
    // 更新本地数据
    const index = subCategory.tagDTOList.findIndex(t => t.id === tag.id)
    if (index > -1) {
      subCategory.tagDTOList.splice(index, 1)
    }

    // 退出删除模式
    tagDeleteMode.value = false
    currentSubCategory.value = null

    uni.showToast({
      title: '标签已移除',
      icon: 'success'
    })
  } catch (error) {
    console.error('Remove tag error:', error)
    uni.showToast({
      title: '移除失败',
      icon: 'none'
    })
  }
}

// 搜索处理
const onSearch = () => {
  if (!searchKeyword.value.trim()) {
    uni.showToast({
      title: '请输入搜索关键词',
      icon: 'none'
    })
    return
  }
  loadSubCategories(true)
}

// 清除搜索
const clearSearch = () => {
  searchKeyword.value = ''
  loadSubCategories(true)
}

// 返回首页（主分类列表）
const goToHome = () => {
  uni.switchTab({
    url: '/pages/tabbar/browse/browse'
  })
}
</script>

<style scoped>
.sub-list-page {
  min-height: 100vh;
  background: #f5f5f5;
  display: flex;
  flex-direction: column;
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
  justify-content: flex-start;
  padding: 0 30rpx;
  z-index: 99;
  border-bottom: 1rpx solid rgba(0, 0, 0, 0.08);
}

.category-label {
  font-size: 28rpx;
  color: #666666;
  font-weight: 500;
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
}

.home-button:active {
  background: rgba(0, 196, 179, 0.2);
  transform: scale(0.95);
}

.home-icon {
  font-size: 32rpx;
}

/* 搜索容器 */
.search-container {
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
.sub-scroll {
  flex: 1;
}

.sub-container {
  padding: 30rpx;
}

/* 子分类卡片包装器 */
.sub-card-wrapper {
  position: relative;
  margin-bottom: 30rpx;
  overflow: hidden;
}

/* 子分类卡片 */
.sub-card {
  position: relative;
  height: 340rpx;
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
  top: 0;
  bottom: 0;
  left: 0;
  right: 0;
  padding: 24rpx;
  z-index: 1;
  display: flex;
  flex-direction: column;
}

.sub-spacer {
  flex: 1;
}

.sub-bottom {
  display: flex;
  flex-direction: column;
  gap: 10rpx;
}

.sub-name-row {
  display: flex;
  align-items: center;
  gap: 12rpx;
}

.sub-name {
  font-size: 32rpx;
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
  font-size: 22rpx;
  color: #ffffff;
  margin-bottom: 10rpx;
  line-height: 1.4;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
  text-shadow: 0 1rpx 3rpx rgba(0, 0, 0, 0.3);
}

.sub-footer {
  display: flex;
  justify-content: space-between;
  align-items: flex-end;
}

.sub-tags {
  display: flex;
  gap: 10rpx;
  flex: 1;
  flex-wrap: wrap;
  align-items: center;
}

.tag-item-wrapper {
  position: relative;
  display: flex;
  align-items: center;
}

.tag-item {
  padding: 6rpx 14rpx;
  background: rgba(255, 255, 255, 0.25);
  backdrop-filter: blur(8rpx);
  border-radius: 6rpx;
  font-size: 20rpx;
  color: #ffffff;
}

.tag-remove-icon {
  position: absolute;
  top: -6rpx;
  right: -6rpx;
  width: 26rpx;
  height: 26rpx;
  background: #ff4444;
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 16rpx;
  color: #ffffff;
  font-weight: 700;
  box-shadow: 0 2rpx 8rpx rgba(255, 68, 68, 0.4);
}

.add-tag-btn {
  padding: 6rpx 14rpx;
  background: rgba(255, 255, 255, 0.15);
  border: 1rpx dashed rgba(255, 255, 255, 0.5);
  border-radius: 6rpx;
  font-size: 20rpx;
  color: rgba(255, 255, 255, 0.8);
}

.add-tag-btn-small {
  padding: 6rpx 14rpx;
  background: rgba(255, 255, 255, 0.15);
  border: 1rpx dashed rgba(255, 255, 255, 0.5);
  border-radius: 6rpx;
  font-size: 20rpx;
  color: rgba(255, 255, 255, 0.8);
  min-width: 40rpx;
  text-align: center;
}

.tag-expand-btn {
  padding: 6rpx 14rpx;
  background: rgba(255, 255, 255, 0.15);
  border-radius: 6rpx;
  font-size: 20rpx;
  color: rgba(255, 255, 255, 0.8);
  min-width: 40rpx;
  text-align: center;
}

.tag-expand-btn:active {
  background: rgba(255, 255, 255, 0.25);
}

.sub-count {
  font-size: 22rpx;
  color: rgba(255, 255, 255, 0.7);
  margin-left: 16rpx;
}

/* 时间信息 */
.sub-time {
  display: flex;
  flex-direction: column;
  gap: 6rpx;
  margin-top: 12rpx;
}

.time-text {
  font-size: 18rpx;
  color: rgba(255, 255, 255, 0.6);
  text-shadow: 0 1rpx 2rpx rgba(0, 0, 0, 0.2);
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
  font-size: 26rpx;
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
  border-radius: 0 20rpx 20rpx 0;
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
