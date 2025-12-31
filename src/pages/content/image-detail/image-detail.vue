<template>
  <view class="image-detail-page">
    <!-- 自定义导航栏 -->
    <custom-nav-bar title="图片详情" />

    <scroll-view class="detail-scroll" scroll-y>
      <!-- 内容信息区 -->
      <view class="content-info">
        <!-- 标题 -->
        <text class="content-title">{{ contentDetail.title || '未命名' }}</text>

        <!-- 标签 -->
        <view class="tags-container">
          <view
            v-for="tag in contentDetail.tagDTOList || []"
            :key="tag.id"
            class="tag-wrapper"
            @longpress="enterTagDeleteMode(tag)"
            @click.stop="handleTagClick"
          >
            <text class="tag-item">{{ tag.name }}</text>
            <text
              v-if="tagDeleteMode"
              class="tag-remove-icon"
              @click.stop="removeTagAssociation(tag)"
            >✕</text>
          </view>

          <!-- 添加标签按钮 -->
          <view class="add-tag-btn" @click="openTagSelector">
            <text>+</text>
          </view>
        </view>

        <!-- 创建时间 -->
        <text class="create-time">{{ formatTime(contentDetail.createTime) }}</text>
      </view>

      <!-- 图片展示区 -->
      <view class="image-container" v-if="firstImage" @click="previewImage">
        <image
          class="detail-image"
          :src="getFullImageUrl(firstImage)"
          mode="aspectFit"
        ></image>
      </view>

      <!-- 底部占位 -->
      <view class="bottom-placeholder"></view>
    </scroll-view>

    <!-- 底部操作栏 -->
    <view class="bottom-toolbar">
      <view class="toolbar-item" @click="shareContent">
        <text class="toolbar-icon">📤</text>
        <text class="toolbar-text">分享</text>
      </view>

      <view class="toolbar-item" @click="toggleCollect">
        <text class="toolbar-icon">{{ isCollected ? '❤️' : '🤍' }}</text>
        <text class="toolbar-text">{{ isCollected ? '已收藏' : '收藏' }}</text>
      </view>

      <view class="toolbar-item" @click="editContent">
        <text class="toolbar-icon">✏️</text>
        <text class="toolbar-text">编辑</text>
      </view>

      <view class="toolbar-item" @click="deleteContent">
        <text class="toolbar-icon">🗑️</text>
        <text class="toolbar-text">删除</text>
      </view>

      <view class="toolbar-item" @click="showMoreMenu">
        <text class="toolbar-icon">⋯</text>
        <text class="toolbar-text">更多</text>
      </view>
    </view>

    <!-- 标签选择器 -->
    <tag-selector
      :visible="showTagSelector"
      :selectedTagIds="selectedTagIds"
      @update:visible="showTagSelector = $event"
      @confirm="handleTagConfirm"
      @cancel="handleTagCancel"
    />

    <!-- 更多操作菜单 -->
    <view v-if="showMoreActions" class="actions-mask" @click="hideMoreMenu">
      <view class="actions-container" @click.stop>
        <view class="action-item" @click="showDetailInfo">
          <text class="action-icon">ℹ️</text>
          <text class="action-text">详情</text>
        </view>
        <view class="action-item" @click="downloadImage">
          <text class="action-icon">📥</text>
          <text class="action-text">保存到相册</text>
        </view>
        <view class="action-cancel" @click="hideMoreMenu">
          <text>取消</text>
        </view>
      </view>
    </view>

    <!-- 详情信息弹窗 -->
    <view v-if="showDetailModal" class="detail-mask" @click="hideDetailInfo">
      <view class="detail-container" @click.stop>
        <view class="detail-header">
          <text class="detail-title">详情信息</text>
          <text class="detail-close" @click="hideDetailInfo">✕</text>
        </view>
        <view class="detail-content">
          <!-- 描述 -->
          <view v-if="contentDetail.description" class="detail-item">
            <text class="detail-label">描述</text>
            <text class="detail-value">{{ contentDetail.description }}</text>
          </view>

          <!-- 分类 -->
          <view v-if="contentDetail.category" class="detail-item">
            <text class="detail-label">分类</text>
            <text class="detail-value">{{ contentDetail.category }}</text>
          </view>

          <!-- 创建时间 -->
          <view class="detail-item">
            <text class="detail-label">创建时间</text>
            <text class="detail-value">{{ formatTime(contentDetail.createTime) }}</text>
          </view>

          <!-- 修改时间 -->
          <view v-if="contentDetail.updateTime" class="detail-item">
            <text class="detail-label">修改时间</text>
            <text class="detail-value">{{ formatTime(contentDetail.updateTime) }}</text>
          </view>
        </view>
      </view>
    </view>
  </view>
</template>

<script setup>
import { ref, computed } from 'vue'
import { onLoad, onShow } from '@dcloudio/uni-app'
import { useCollectionStore } from '@/store/collection'
import { useUserStore } from '@/store/user'
import { contentApi, tagApi, browseHistoryApi } from '@/api'
import { getFullImageUrl } from '@/utils/image'
import CustomNavBar from '@/components/custom-nav-bar/custom-nav-bar.vue'
import TagSelector from '@/components/tag-selector/tag-selector.vue'

const collectionStore = useCollectionStore()
const userStore = useUserStore()

// 数据
const contentId = ref('')
const contentDetail = ref({})
const firstImage = ref('')
const tagDeleteMode = ref(false)
const showMoreActions = ref(false)
const showDetailModal = ref(false)
let isFirstLoad = true

// 标签选择器
const showTagSelector = ref(false)
const selectedTagIds = ref([])

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

    // 处理图片URL - 只取第一张
    if (contentDetail.value.imageUrl) {
      if (typeof contentDetail.value.imageUrl === 'string') {
        const urls = contentDetail.value.imageUrl.split(',').filter(url => url.trim())
        firstImage.value = urls[0] || ''
      } else if (Array.isArray(contentDetail.value.imageUrl)) {
        firstImage.value = contentDetail.value.imageUrl[0] || ''
      } else {
        firstImage.value = contentDetail.value.imageUrl
      }
    }

    // 创建浏览记录
    createBrowseHistory()
  } catch (error) {
    console.error('Load content detail error:', error)
    uni.showToast({
      title: '加载失败',
      icon: 'none'
    })
  }
}

// 创建浏览记录
const createBrowseHistory = async () => {
  try {
    await browseHistoryApi.createBrowseHistory({
      userId: userStore.userId,
      contentId: contentId.value,
      contentType: 'image'
    })
  } catch (error) {
    // 浏览记录创建失败不影响用户使用，静默处理
    console.error('Create browse history error:', error)
  }
}

// 预览图片
const previewImage = () => {
  if (!firstImage.value) return
  uni.previewImage({
    urls: [getFullImageUrl(firstImage.value)],
    current: 0
  })
}

// 切换收藏
const toggleCollect = async () => {
  await collectionStore.toggleCollection(contentId.value)
}

// 进入标签删除模式
const enterTagDeleteMode = (tag) => {
  tagDeleteMode.value = true
}

// 处理标签点击（防止误触发）
const handleTagClick = () => {
  // 点击标签退出删除模式
  if (tagDeleteMode.value) {
    tagDeleteMode.value = false
  }
}

// 删除标签关联
const removeTagAssociation = async (tag) => {
  try {
    // 更新本地数据
    const index = contentDetail.value.tagDTOList.findIndex(t => t.id === tag.id)
    if (index > -1) {
      contentDetail.value.tagDTOList.splice(index, 1)
    }

    // 退出删除模式
    tagDeleteMode.value = false

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

// 打开标签选择器
const openTagSelector = () => {
  selectedTagIds.value = (contentDetail.value.tagDTOList || []).map(tag => tag.id)
  showTagSelector.value = true
}

// 标签确认
const handleTagConfirm = async (tags) => {
  try {
    const tagIds = tags.map(tag => tag.id)

    // 调用批量关联接口
    await tagApi.batchLinkContent({
      contentId: contentId.value,
      tagIds: tagIds
    })

    // 更新本地数据
    contentDetail.value.tagDTOList = tags

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

// 标签取消
const handleTagCancel = () => {
  // 不做任何操作
}

// 分享内容
const shareContent = () => {
  uni.showToast({
    title: '功能暂未开发',
    icon: 'none'
  })
}

// 编辑内容
const editContent = () => {
  uni.navigateTo({
    url: `/pages/content/create-image/create-image?id=${contentId.value}&mode=edit&subCategoryId=${contentDetail.value.subCategoryId}&mainCategoryId=${contentDetail.value.mainCategoryId}`
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

// 显示更多菜单
const showMoreMenu = () => {
  showMoreActions.value = true
}

// 隐藏更多菜单
const hideMoreMenu = () => {
  showMoreActions.value = false
}

// 显示详情信息
const showDetailInfo = () => {
  hideMoreMenu()
  showDetailModal.value = true
}

// 隐藏详情信息
const hideDetailInfo = () => {
  showDetailModal.value = false
}

// 下载图片
const downloadImage = () => {
  hideMoreMenu()

  if (!firstImage.value) return

  const imageUrl = getFullImageUrl(firstImage.value)

  uni.downloadFile({
    url: imageUrl,
    success: (res) => {
      if (res.statusCode === 200) {
        uni.saveImageToPhotosAlbum({
          filePath: res.tempFilePath,
          success: () => {
            uni.showToast({
              title: '已保存到相册',
              icon: 'success'
            })
          },
          fail: () => {
            uni.showToast({
              title: '保存失败',
              icon: 'none'
            })
          }
        })
      }
    },
    fail: () => {
      uni.showToast({
        title: '下载失败',
        icon: 'none'
      })
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
.image-detail-page {
  min-height: 100vh;
  background: #ffffff;
  display: flex;
  flex-direction: column;
}

/* 滚动容器 */
.detail-scroll {
  flex: 1;
  padding-bottom: calc(120rpx + constant(safe-area-inset-bottom));
  padding-bottom: calc(120rpx + env(safe-area-inset-bottom));
}

/* 内容信息区 */
.content-info {
  padding: 30rpx 40rpx;
  background: #ffffff;
}

.content-title {
  display: block;
  font-size: 40rpx;
  font-weight: 700;
  color: #333333;
  line-height: 1.4;
  margin-bottom: 24rpx;
}

/* 标签容器 */
.tags-container {
  display: flex;
  flex-wrap: wrap;
  gap: 16rpx;
  margin-bottom: 20rpx;
  align-items: center;
}

.tag-wrapper {
  position: relative;
  display: flex;
  align-items: center;
}

.tag-item {
  padding: 10rpx 20rpx;
  background: rgba(0, 196, 179, 0.15);
  border: 1rpx solid rgba(0, 196, 179, 0.3);
  border-radius: 8rpx;
  font-size: 24rpx;
  color: #00c4b3;
}

.tag-remove-icon {
  position: absolute;
  top: -8rpx;
  right: -8rpx;
  width: 32rpx;
  height: 32rpx;
  background: #ff4444;
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 20rpx;
  color: #ffffff;
  font-weight: 700;
  box-shadow: 0 2rpx 8rpx rgba(255, 68, 68, 0.4);
}

.add-tag-btn {
  padding: 10rpx 20rpx;
  background: rgba(0, 0, 0, 0.03);
  border: 1rpx dashed rgba(0, 0, 0, 0.1);
  border-radius: 8rpx;
  font-size: 24rpx;
  color: #999999;
  min-width: 60rpx;
  text-align: center;
}

.add-tag-btn:active {
  background: rgba(0, 0, 0, 0.06);
}

/* 创建时间 */
.create-time {
  display: block;
  font-size: 22rpx;
  color: #999999;
}

/* 图片展示区 */
.image-container {
  width: 100%;
  padding: 20rpx;
  display: flex;
  align-items: center;
  justify-content: center;
}

.detail-image {
  width: 100%;
  max-height: 800rpx;
}

/* 底部占位 */
.bottom-placeholder {
  height: 160rpx;
}

/* 底部操作栏 */
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
  gap: 6rpx;
  padding: 12rpx 16rpx;
  transition: all 0.2s ease;
}

.toolbar-item:active {
  opacity: 0.6;
}

.toolbar-icon {
  font-size: 36rpx;
}

.toolbar-text {
  font-size: 20rpx;
  color: #666666;
}

/* 更多操作菜单 */
.actions-mask {
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background: rgba(0, 0, 0, 0.6);
  z-index: 999;
  display: flex;
  align-items: flex-end;
}

.actions-container {
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

.action-item {
  display: flex;
  align-items: center;
  padding: 32rpx 30rpx;
  background: rgba(0, 0, 0, 0.03);
  border-radius: 16rpx;
  margin-bottom: 20rpx;
}

.action-item:active {
  background: rgba(0, 0, 0, 0.08);
}

.action-icon {
  font-size: 44rpx;
  margin-right: 24rpx;
}

.action-text {
  font-size: 32rpx;
  color: #333333;
  font-weight: 500;
}

.action-cancel {
  margin-top: 20rpx;
  padding: 28rpx;
  text-align: center;
  background: rgba(0, 0, 0, 0.03);
  border-radius: 16rpx;
  font-size: 32rpx;
  color: #999999;
}

.action-cancel:active {
  background: rgba(0, 0, 0, 0.08);
}

/* 详情信息弹窗 */
.detail-mask {
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background: rgba(0, 0, 0, 0.6);
  z-index: 999;
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 60rpx;
}

.detail-container {
  width: 100%;
  max-width: 600rpx;
  background: #ffffff;
  border-radius: 24rpx;
  overflow: hidden;
  animation: scaleIn 0.3s ease;
}

@keyframes scaleIn {
  from {
    transform: scale(0.9);
    opacity: 0;
  }
  to {
    transform: scale(1);
    opacity: 1;
  }
}

.detail-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 32rpx 40rpx;
  border-bottom: 1rpx solid rgba(0, 0, 0, 0.08);
}

.detail-title {
  font-size: 32rpx;
  font-weight: 600;
  color: #333333;
}

.detail-close {
  font-size: 48rpx;
  color: #999999;
  line-height: 1;
}

.detail-content {
  padding: 40rpx;
  max-height: 600rpx;
  overflow-y: auto;
}

.detail-item {
  margin-bottom: 32rpx;
  display: flex;
  flex-direction: column;
  gap: 12rpx;
}

.detail-item:last-child {
  margin-bottom: 0;
}

.detail-label {
  font-size: 24rpx;
  color: #999999;
}

.detail-value {
  font-size: 28rpx;
  color: #333333;
  line-height: 1.6;
}
</style>
