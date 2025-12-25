<template>
  <view v-if="visible" class="tag-selector-mask" @click="handleCancel">
    <view class="tag-selector-container" @click.stop>
      <!-- 头部 -->
      <view class="selector-header">
        <text class="header-title">选择标签</text>
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
            placeholder="搜索标签"
            @input="onSearchInput"
          />
          <text v-if="searchKeyword" class="clear-icon" @click="clearSearch">✕</text>
        </view>
      </view>

      <!-- 已选择的标签列表 -->
      <view v-if="selectedTags.length > 0" class="selected-tags-container">
        <text class="section-title">已选择 ({{ selectedTags.length }})</text>
        <view class="selected-tags">
          <view
            v-for="tag in selectedTags"
            :key="tag.id"
            class="selected-tag-item"
          >
            <text class="tag-name">{{ tag.name }}</text>
            <text class="remove-icon" @click="removeTag(tag)">✕</text>
          </view>
        </view>
      </view>

      <!-- 可选标签列表 -->
      <view class="tags-container">
        <text class="section-title">所有标签</text>
        <scroll-view class="tags-scroll" scroll-y>
          <view class="tags-list">
            <view
              v-for="tag in filteredTags"
              :key="tag.id"
              class="tag-item"
              :class="{ selected: isSelected(tag) }"
              @click="toggleTag(tag)"
            >
              <view class="tag-checkbox">
                <text v-if="isSelected(tag)" class="checkbox-icon">✓</text>
              </view>
              <text class="tag-name">{{ tag.name }}</text>
            </view>

            <!-- 加载中 -->
            <view v-if="loading" class="loading-text">加载中...</view>

            <!-- 空状态 -->
            <view v-if="!loading && filteredTags.length === 0" class="empty-text">
              {{ searchKeyword ? '未找到相关标签' : '暂无标签' }}
            </view>
          </view>
        </scroll-view>
      </view>

      <!-- 底部按钮 -->
      <view class="selector-footer">
        <view class="footer-btn new-tag-btn" @click="handleNewTag">
          <text>+ 新增标签</text>
        </view>
        <view class="footer-actions">
          <view class="action-btn cancel-btn" @click="handleCancel">
            <text>取消</text>
          </view>
          <view class="action-btn confirm-btn" @click="handleConfirm">
            <text>确定</text>
          </view>
        </view>
      </view>
    </view>

    <!-- 新增标签输入框 -->
    <view v-if="showNewTagInput" class="new-tag-modal" @click="showNewTagInput = false">
      <view class="new-tag-content" @click.stop>
        <text class="modal-title">新增标签</text>
        <input
          class="new-tag-input"
          v-model="newTagName"
          placeholder="请输入标签名称"
          :focus="showNewTagInput"
        />
        <view class="modal-actions">
          <view class="modal-btn cancel" @click="showNewTagInput = false">
            <text>取消</text>
          </view>
          <view class="modal-btn confirm" @click="createNewTag">
            <text>确定</text>
          </view>
        </view>
      </view>
    </view>
  </view>
</template>

<script setup>
import { ref, computed, watch } from 'vue'
import { tagApi } from '@/api'

// Props
const props = defineProps({
  visible: {
    type: Boolean,
    default: false
  },
  selectedTagIds: {
    type: Array,
    default: () => []
  }
})

// Emits
const emit = defineEmits(['update:visible', 'confirm', 'cancel'])

// 数据
const searchKeyword = ref('')
const allTags = ref([])
const selectedTags = ref([])
const loading = ref(false)
const showNewTagInput = ref(false)
const newTagName = ref('')

// 监听弹窗显示
watch(() => props.visible, (val) => {
  if (val) {
    loadTags()
    initSelectedTags()
  } else {
    searchKeyword.value = ''
    showNewTagInput.value = false
    newTagName.value = ''
  }
})

// 监听已选标签ID变化
watch(() => props.selectedTagIds, () => {
  if (props.visible) {
    initSelectedTags()
  }
}, { deep: true })

// 初始化已选标签
const initSelectedTags = () => {
  if (props.selectedTagIds.length > 0 && allTags.value.length > 0) {
    selectedTags.value = allTags.value.filter(tag =>
      props.selectedTagIds.includes(tag.id)
    )
  } else {
    selectedTags.value = []
  }
}

// 过滤后的标签列表
const filteredTags = computed(() => {
  if (!searchKeyword.value) {
    return allTags.value
  }
  return allTags.value.filter(tag =>
    tag.name.toLowerCase().includes(searchKeyword.value.toLowerCase())
  )
})

// 加载标签列表
const loadTags = async () => {
  loading.value = true
  try {
    const res = await tagApi.getTags({
      name: ''
    })
    allTags.value = res.data || []
    initSelectedTags()
  } catch (error) {
    console.error('Load tags error:', error)
    uni.showToast({
      title: '加载标签失败',
      icon: 'none'
    })
  } finally {
    loading.value = false
  }
}

// 搜索输入
const onSearchInput = () => {
  // 实时搜索已在computed中处理
}

// 清除搜索
const clearSearch = () => {
  searchKeyword.value = ''
}

// 判断是否已选择
const isSelected = (tag) => {
  return selectedTags.value.some(t => t.id === tag.id)
}

// 切换标签选择
const toggleTag = (tag) => {
  const index = selectedTags.value.findIndex(t => t.id === tag.id)
  if (index > -1) {
    selectedTags.value.splice(index, 1)
  } else {
    selectedTags.value.push(tag)
  }
}

// 移除标签
const removeTag = (tag) => {
  const index = selectedTags.value.findIndex(t => t.id === tag.id)
  if (index > -1) {
    selectedTags.value.splice(index, 1)
  }
}

// 新增标签
const handleNewTag = () => {
  showNewTagInput.value = true
  newTagName.value = ''
}

// 创建新标签
const createNewTag = async () => {
  if (!newTagName.value.trim()) {
    uni.showToast({
      title: '请输入标签名称',
      icon: 'none'
    })
    return
  }

  try {
    const res = await tagApi.createTag({
      name: newTagName.value.trim()
    })

    uni.showToast({
      title: '创建成功',
      icon: 'success'
    })

    // 重新加载标签列表
    await loadTags()

    // 自动选中新创建的标签
    const newTag = allTags.value.find(t => t.name === newTagName.value.trim())
    if (newTag && !isSelected(newTag)) {
      selectedTags.value.push(newTag)
    }

    showNewTagInput.value = false
    newTagName.value = ''
  } catch (error) {
    console.error('Create tag error:', error)
    uni.showToast({
      title: '创建失败',
      icon: 'none'
    })
  }
}

// 确认
const handleConfirm = () => {
  emit('confirm', selectedTags.value)
  emit('update:visible', false)
}

// 取消
const handleCancel = () => {
  emit('cancel')
  emit('update:visible', false)
}
</script>

<style scoped>
.tag-selector-mask {
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

.tag-selector-container {
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

/* 已选标签 */
.selected-tags-container {
  padding: 0 30rpx 20rpx;
  border-bottom: 1rpx solid rgba(0, 0, 0, 0.08);
}

.section-title {
  font-size: 24rpx;
  color: #999999;
  margin-bottom: 16rpx;
  display: block;
}

.selected-tags {
  display: flex;
  flex-wrap: wrap;
  gap: 12rpx;
}

.selected-tag-item {
  display: flex;
  align-items: center;
  padding: 10rpx 16rpx;
  background: #00c4b3;
  border-radius: 8rpx;
  gap: 8rpx;
}

.selected-tag-item .tag-name {
  font-size: 24rpx;
  color: #ffffff;
}

.selected-tag-item .remove-icon {
  font-size: 28rpx;
  color: #ffffff;
  opacity: 0.8;
}

/* 标签列表 */
.tags-container {
  flex: 1;
  padding: 20rpx 30rpx 0;
  overflow: hidden;
  display: flex;
  flex-direction: column;
}

.tags-scroll {
  flex: 1;
  max-height: 500rpx;
}

.tags-list {
  display: flex;
  flex-direction: column;
  gap: 16rpx;
  padding-bottom: 20rpx;
}

.tag-item {
  display: flex;
  align-items: center;
  padding: 24rpx 20rpx;
  background: #f5f5f5;
  border-radius: 12rpx;
  gap: 16rpx;
  transition: background 0.2s ease;
}

.tag-item:active {
  background: #e8e8e8;
}

.tag-item.selected {
  background: rgba(0, 196, 179, 0.15);
}

.tag-checkbox {
  width: 36rpx;
  height: 36rpx;
  border: 2rpx solid #00c4b3;
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  background: #ffffff;
}

.tag-item.selected .tag-checkbox {
  background: #00c4b3;
}

.checkbox-icon {
  font-size: 24rpx;
  color: #ffffff;
  font-weight: 700;
}

.tag-item .tag-name {
  font-size: 28rpx;
  color: #333333;
  flex: 1;
}

.loading-text,
.empty-text {
  text-align: center;
  padding: 60rpx 0;
  font-size: 28rpx;
  color: #999999;
}

/* 底部按钮 */
.selector-footer {
  padding: 20rpx 30rpx;
  padding-bottom: calc(20rpx + constant(safe-area-inset-bottom));
  padding-bottom: calc(20rpx + env(safe-area-inset-bottom));
  border-top: 1rpx solid rgba(0, 0, 0, 0.08);
  display: flex;
  flex-direction: column;
  gap: 16rpx;
}

.new-tag-btn {
  width: 100%;
  height: 80rpx;
  background: rgba(0, 196, 179, 0.1);
  border: 1rpx dashed #00c4b3;
  border-radius: 12rpx;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 28rpx;
  color: #00c4b3;
}

.new-tag-btn:active {
  background: rgba(0, 196, 179, 0.2);
}

.footer-actions {
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

/* 新增标签弹窗 */
.new-tag-modal {
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background: rgba(0, 0, 0, 0.6);
  z-index: 10000;
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 60rpx;
}

.new-tag-content {
  width: 100%;
  background: #ffffff;
  border-radius: 24rpx;
  padding: 40rpx;
}

.modal-title {
  display: block;
  font-size: 32rpx;
  font-weight: 600;
  color: #333333;
  margin-bottom: 32rpx;
  text-align: center;
}

.new-tag-input {
  width: 100%;
  height: 80rpx;
  background: #f5f5f5;
  border-radius: 12rpx;
  padding: 0 24rpx;
  font-size: 28rpx;
  color: #333333;
  margin-bottom: 32rpx;
}

.modal-actions {
  display: flex;
  gap: 16rpx;
}

.modal-btn {
  flex: 1;
  height: 80rpx;
  border-radius: 12rpx;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 30rpx;
  font-weight: 500;
}

.modal-btn.cancel {
  background: rgba(0, 0, 0, 0.08);
  color: #333333;
}

.modal-btn.cancel:active {
  background: rgba(0, 0, 0, 0.12);
}

.modal-btn.confirm {
  background: linear-gradient(135deg, #00c4b3 0%, #00a99d 100%);
  color: #ffffff;
}

.modal-btn.confirm:active {
  opacity: 0.8;
}
</style>
