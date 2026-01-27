<template>
  <page-meta :page-style="'overflow: hidden;'"></page-meta>
  <view class="create-category-page">
    <!-- 自定义导航栏 -->
    <custom-nav-bar
      :title="isEdit ? '编辑主分类' : '创建主分类'"
      :needConfirm="hasModified && !savedSuccessfully && !submitting"
      confirmText="您有未保存的修改，确定要离开吗？"
    />

    <scroll-view class="form-scroll" scroll-y>
      <view class="form-container">
        <!-- 标题输入 -->
        <view class="form-item">
          <view class="form-label">
            <text class="label-text">标题</text>
            <text class="required-mark">*</text>
          </view>
          <input
            class="form-input"
            v-model="formData.name"
            placeholder="请输入主分类标题"
            maxlength="50"
          />
        </view>

        <!-- 描述输入 -->
        <view class="form-item">
          <view class="form-label">
            <text class="label-text">描述</text>
          </view>
          <textarea
            class="form-textarea"
            v-model="formData.description"
            placeholder="请输入分类描述（选填）"
            maxlength="200"
            :show-confirm-bar="false"
          ></textarea>
        </view>

        <!-- 封面图上传 -->
        <view class="form-item">
          <view class="form-label">
            <text class="label-text">封面图</text>
          </view>
          <view class="cover-upload">
            <view v-if="formData.coverImage" class="cover-preview" @click="previewCover">
              <image
                class="cover-image"
                :src="getFullImageUrl(formData.coverImage)"
                :key="getFullImageUrl(formData.coverImage)"
                mode="aspectFill"
                @error="onImageError"
              ></image>
              <view class="cover-remove" @click.stop="removeCover">
                <text class="remove-icon">×</text>
              </view>
            </view>
            <view v-else class="cover-placeholder" @click="selectCover">
              <text class="upload-icon">+</text>
              <text class="upload-text">上传封面</text>
            </view>
          </view>
        </view>

        <!-- 标签选择 -->
        <view class="form-item">
          <view class="form-label">
            <text class="label-text">标签</text>
          </view>
          <view class="tags-container">
            <view
              v-for="tag in selectedTags"
              :key="tag.id"
              class="selected-tag"
            >
              <text class="tag-text">{{ tag.name }}</text>
              <text class="tag-close" @click="removeTag(tag)">✕</text>
            </view>
            <view class="add-tag-button" @click="openTagSelector">
              <text>+ 添加标签</text>
            </view>
          </view>
        </view>

        <!-- 底部占位 -->
        <view class="bottom-placeholder"></view>
      </view>
    </scroll-view>

    <!-- 提交按钮（固定在底部） -->
    <view class="submit-container-fixed">
      <button class="submit-button" :loading="submitting" @click="handleSubmit">
        {{ submitting ? '提交中...' : (isEdit ? '保存' : '创建分类') }}
      </button>
    </view>

    <!-- 标签选择器 -->
    <tag-selector
      :visible="showTagSelector"
      :selectedTagIds="selectedTagIds"
      @update:visible="showTagSelector = $event"
      @confirm="handleTagConfirm"
      @cancel="handleTagCancel"
    />
  </view>
</template>

<script setup>
import { ref, computed } from 'vue'
import { onLoad, onBackPress } from '@dcloudio/uni-app'
import { categoryApi, tagApi } from '@/api'
import { getFullImageUrl } from '@/utils/image'
import TagSelector from '@/components/tag-selector/tag-selector.vue'
import CustomNavBar from '@/components/custom-nav-bar/custom-nav-bar.vue'

// 数据
const categoryId = ref('')
const isEdit = ref(false)

// 表单数据
const formData = ref({
  name: '',
  description: '',
  coverImage: ''
})

const submitting = ref(false)
const savedSuccessfully = ref(false) // 标记是否成功保存

// 标签相关
const showTagSelector = ref(false)
const selectedTags = ref([])
const selectedTagIds = ref([])

// 初始数据快照（用于检测修改）
const initialSnapshot = ref({
  name: '',
  description: '',
  coverImage: '',
  tagIds: []
})

// 检测是否有修改
const hasModified = computed(() => {
  // 检查表单字段
  if (formData.value.name.trim() !== initialSnapshot.value.name) return true
  if (formData.value.description.trim() !== initialSnapshot.value.description) return true
  if (formData.value.coverImage !== initialSnapshot.value.coverImage) return true

  // 检查标签
  const currentTagIds = selectedTags.value.map(t => t.id).sort().join(',')
  const initialTagIds = initialSnapshot.value.tagIds.sort().join(',')
  if (currentTagIds !== initialTagIds) return true

  return false
})

// 页面加载
onLoad((options) => {
  if (options.id) {
    categoryId.value = options.id
    isEdit.value = options.mode === 'edit'
    loadCategoryDetail()
  } else {
    // 新建模式，保存初始空快照
    saveInitialSnapshot()
  }
})

// App 平台支持物理返回键拦截
// #ifdef APP-PLUS
onBackPress(() => {
  if (savedSuccessfully.value || submitting.value) {
    return false
  }
  if (hasModified.value) {
    uni.showModal({
      title: '提示',
      content: '您有未保存的修改，确定要离开吗？',
      success: (res) => {
        if (res.confirm) {
          uni.navigateBack()
        }
      }
    })
    return true
  }
  return false
})
// #endif

// 保存初始数据快照
const saveInitialSnapshot = () => {
  initialSnapshot.value = {
    name: formData.value.name.trim(),
    description: formData.value.description.trim(),
    coverImage: formData.value.coverImage,
    tagIds: selectedTags.value.map(t => t.id)
  }
}

// 加载分类详情（编辑模式）
const loadCategoryDetail = async () => {
  try {
    const res = await categoryApi.getMainCategoryById(categoryId.value)
    const detail = res.data || res

    formData.value.name = detail.name || ''
    formData.value.description = detail.description || ''
    formData.value.coverImage = detail.thumbnailUrl || detail.coverImage || ''

    // 处理标签
    if (detail.tagDTOList) {
      selectedTags.value = detail.tagDTOList
    }

    // 保存初始快照
    saveInitialSnapshot()
  } catch (error) {
    console.error('Load category detail error:', error)
    uni.showToast({
      title: '加载数据失败',
      icon: 'none'
    })
  }
}

// 选择封面图
const selectCover = () => {
  uni.chooseImage({
    count: 1,
    sizeType: ['compressed'],
    sourceType: ['album', 'camera'],
    success: (res) => {
      formData.value.coverImage = res.tempFilePaths[0]
    }
  })
}

// 预览封面图
const previewCover = () => {
  uni.previewImage({
    urls: [formData.value.coverImage],
    current: formData.value.coverImage
  })
}

// 移除封面图
const removeCover = () => {
  formData.value.coverImage = ''
}

// 图片加载错误处理
const onImageError = (e) => {
  console.error('[主分类封面] 图片加载失败:', e)
}

// 打开标签选择器
const openTagSelector = () => {
  selectedTagIds.value = selectedTags.value.map(tag => tag.id)
  showTagSelector.value = true
}

// 确认标签选择
const handleTagConfirm = (tags) => {
  selectedTags.value = tags
}

// 取消标签选择
const handleTagCancel = () => {
  // 不做任何操作
}

// 移除标签
const removeTag = (tag) => {
  const index = selectedTags.value.findIndex(t => t.id === tag.id)
  if (index > -1) {
    selectedTags.value.splice(index, 1)
  }
}

// 表单验证
const validateForm = () => {
  if (!formData.value.name || !formData.value.name.trim()) {
    uni.showToast({
      title: '请输入分类标题',
      icon: 'none'
    })
    return false
  }
  return true
}

// 提交表单
const handleSubmit = async () => {
  if (!validateForm()) return
  if (submitting.value) return

  submitting.value = true

  try {
    let coverImageUrl = ''

    // 如果有封面图且是本地路径，先上传
    if (formData.value.coverImage && !formData.value.coverImage.startsWith('http')) {
      uni.showLoading({
        title: '上传图片中...',
        mask: true
      })

      const uploadRes = await categoryApi.uploadCoverImage(formData.value.coverImage)
      // API 返回 ResultListString 格式：data 是字符串数组
      if (Array.isArray(uploadRes.data) && uploadRes.data.length > 0) {
        coverImageUrl = uploadRes.data[0]
      } else if (typeof uploadRes.data === 'string') {
        coverImageUrl = uploadRes.data
      }

      uni.hideLoading()
    } else {
      coverImageUrl = formData.value.coverImage
    }

    const data = {
      name: formData.value.name.trim(),
      description: formData.value.description.trim(),
      thumbnailUrl: coverImageUrl,
      tagIdList: selectedTags.value.map(t => t.id)
    }

    if (isEdit.value) {
      // 更新主分类
      await categoryApi.updateMainCategory(categoryId.value, data)

      uni.showToast({
        title: '保存成功',
        icon: 'success'
      })
    } else {
      // 创建主分类
      await categoryApi.createMainCategory(data)

      uni.showToast({
        title: '创建成功',
        icon: 'success'
      })
    }

    // 标记为成功保存，允许正常返回
    savedSuccessfully.value = true

    // 延迟返回，让用户看到成功提示
    setTimeout(() => {
      uni.navigateBack()
    }, 1500)
  } catch (error) {
    console.error('Submit main category error:', error)
    uni.showToast({
      title: error.message || (isEdit.value ? '保存失败，请重试' : '创建失败，请重试'),
      icon: 'none'
    })
  } finally {
    submitting.value = false
  }
}
</script>

<style scoped>
.create-category-page {
  min-height: 100vh;
  background: #f5f5f5;
}

.form-scroll {
  height: 100vh;
  box-sizing: border-box;
}

.form-container {
  padding: 30rpx;
}

/* 表单项 */
.form-item {
  margin-bottom: 40rpx;
}

.form-label {
  display: flex;
  align-items: center;
  margin-bottom: 20rpx;
}

.label-text {
  font-size: 28rpx;
  color: #333333;
  font-weight: 500;
}

.required-mark {
  font-size: 28rpx;
  color: #ff4d4f;
  margin-left: 8rpx;
}

/* 输入框 */
.form-input {
  width: 100%;
  height: 88rpx;
  padding: 0 24rpx;
  background: #ffffff;
  border-radius: 12rpx;
  border: 1rpx solid rgba(0, 0, 0, 0.08);
  font-size: 28rpx;
  color: #333333;
}

.form-input:focus {
  border-color: #00c4b3;
}

/* 文本域 */
.form-textarea {
  width: 100%;
  min-height: 120rpx;
  padding: 24rpx;
  background: #ffffff;
  border-radius: 12rpx;
  border: 1rpx solid rgba(0, 0, 0, 0.08);
  font-size: 28rpx;
  color: #333333;
  line-height: 1.6;
}

.form-textarea:focus {
  border-color: #00c4b3;
}

/* 封面上传 */
.cover-upload {
  width: 100%;
}

.cover-preview {
  position: relative;
  width: 300rpx;
  height: 300rpx;
  border-radius: 12rpx;
  overflow: hidden;
}

.cover-image {
  width: 100%;
  height: 100%;
}

.cover-remove {
  position: absolute;
  top: 20rpx;
  right: 20rpx;
  width: 56rpx;
  height: 56rpx;
  background: rgba(0, 0, 0, 0.6);
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
}

.remove-icon {
  font-size: 48rpx;
  color: #ffffff;
  line-height: 1;
  font-weight: 300;
}

.cover-placeholder {
  width: 100%;
  height: 400rpx;
  background: #ffffff;
  border: 2rpx dashed rgba(0, 0, 0, 0.15);
  border-radius: 12rpx;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  transition: all 0.3s ease;
}

.cover-placeholder:active {
  background: rgba(0, 196, 179, 0.05);
  border-color: #00c4b3;
}

.upload-icon {
  font-size: 80rpx;
  color: #cccccc;
  line-height: 1;
  margin-bottom: 20rpx;
}

.upload-text {
  font-size: 26rpx;
  color: #999999;
}

/* 标签容器 */
.tags-container {
  display: flex;
  flex-wrap: wrap;
  gap: 16rpx;
  padding: 24rpx;
  background: #ffffff;
  border-radius: 12rpx;
  border: 1rpx solid rgba(0, 0, 0, 0.08);
  min-height: 88rpx;
  align-items: center;
}

.selected-tag {
  display: flex;
  align-items: center;
  gap: 8rpx;
  padding: 10rpx 16rpx;
  background: #00c4b3;
  border-radius: 8rpx;
  position: relative;
}

.tag-text {
  font-size: 24rpx;
  color: #ffffff;
}

.tag-close {
  font-size: 28rpx;
  color: #ffffff;
  opacity: 0.9;
  font-weight: 700;
  line-height: 1;
}

.add-tag-button {
  padding: 10rpx 16rpx;
  background: rgba(0, 196, 179, 0.1);
  border: 1rpx dashed #00c4b3;
  border-radius: 8rpx;
  font-size: 24rpx;
  color: #00c4b3;
}

.add-tag-button:active {
  background: rgba(0, 196, 179, 0.2);
}

/* 底部占位（为固定按钮留出空间） */
.bottom-placeholder {
  height: 120rpx;
}

/* 提交按钮固定容器 */
.submit-container-fixed {
  position: fixed;
  bottom: 0;
  left: 0;
  right: 0;
  padding: 20rpx 30rpx;
  padding-bottom: calc(20rpx + constant(safe-area-inset-bottom));
  padding-bottom: calc(20rpx + env(safe-area-inset-bottom));
  background: #ffffff;
  border-top: 1rpx solid rgba(0, 0, 0, 0.08);
  z-index: 100;
}

.submit-button {
  width: 100%;
  height: 96rpx;
  background: linear-gradient(135deg, #00c4b3 0%, #00a99d 100%);
  border-radius: 48rpx;
  border: none;
  font-size: 32rpx;
  color: #ffffff;
  font-weight: 600;
  display: flex;
  align-items: center;
  justify-content: center;
  box-shadow: 0 8rpx 24rpx rgba(0, 196, 179, 0.3);
}

.submit-button:active {
  opacity: 0.9;
  transform: scale(0.98);
}

.submit-button[loading] {
  opacity: 0.7;
}
</style>
