<template>
  <view class="create-category-page">
    <scroll-view class="form-scroll" scroll-y>
      <view class="form-container">
        <!-- 主分类显示 -->
        <view class="form-item">
          <view class="form-label">
            <text class="label-text">所属主分类</text>
            <text v-if="!isEdit" class="required-mark">*</text>
          </view>
          <view
            class="category-display"
            :class="{ disabled: isEdit }"
            @click="selectMainCategory"
          >
            <text class="category-text" :class="{ placeholder: !mainCategoryName }">
              {{ mainCategoryName || '请选择主分类' }}
            </text>
            <text v-if="!isEdit" class="arrow-icon">›</text>
          </view>
        </view>

        <!-- 标题输入 -->
        <view class="form-item">
          <view class="form-label">
            <text class="label-text">标题</text>
            <text class="required-mark">*</text>
          </view>
          <input
            class="form-input"
            v-model="formData.name"
            placeholder="请输入子分类标题"
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
              <image class="cover-image" :src="formData.coverImage" mode="aspectFill"></image>
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

        <!-- 提交按钮 -->
        <view class="submit-container">
          <button class="submit-button" :loading="submitting" @click="handleSubmit">
            {{ submitting ? '提交中...' : (isEdit ? '保存' : '创建子分类') }}
          </button>
        </view>
      </view>
    </scroll-view>

    <!-- 标签选择器 -->
    <tag-selector
      :visible="showTagSelector"
      :selectedTagIds="selectedTagIds"
      @update:visible="showTagSelector = $event"
      @confirm="handleTagConfirm"
      @cancel="handleTagCancel"
    />

    <!-- 主分类选择器 -->
    <main-category-selector
      :visible="showMainCategorySelector"
      :selectedId="formData.mainCategoryId"
      @update:visible="showMainCategorySelector = $event"
      @confirm="handleMainCategoryConfirm"
      @cancel="handleMainCategoryCancel"
    />
  </view>
</template>

<script setup>
import { ref, computed } from 'vue'
import { onLoad, onBackPress } from '@dcloudio/uni-app'
import { categoryApi, tagApi } from '@/api'
import { useCategoryStore } from '@/store/category'
import TagSelector from '@/components/tag-selector/tag-selector.vue'
import MainCategorySelector from '@/components/main-category-selector/main-category-selector.vue'

const categoryStore = useCategoryStore()

// 数据
const subCategoryId = ref('')
const isEdit = ref(false)

// 表单数据
const formData = ref({
  mainCategoryId: '',
  name: '',
  description: '',
  coverImage: ''
})

const mainCategoryName = ref('')
const submitting = ref(false)
const savedSuccessfully = ref(false) // 标记是否成功保存

// 标签相关
const showTagSelector = ref(false)
const selectedTags = ref([])
const selectedTagIds = ref([])

// 主分类选择器相关
const showMainCategorySelector = ref(false)

// 初始数据快照（用于检测修改）
const initialSnapshot = ref({
  mainCategoryId: '',
  name: '',
  description: '',
  coverImage: '',
  tagIds: []
})

// 检测是否有修改
const hasModified = computed(() => {
  // 检查表单字段
  if (formData.value.mainCategoryId !== initialSnapshot.value.mainCategoryId) return true
  if (formData.value.name.trim() !== initialSnapshot.value.name) return true
  if (formData.value.description.trim() !== initialSnapshot.value.description) return true
  if (formData.value.coverImage !== initialSnapshot.value.coverImage) return true

  // 检查标签
  const currentTagIds = selectedTags.value.map(t => t.id).sort().join(',')
  const initialTagIds = initialSnapshot.value.tagIds.sort().join(',')
  if (currentTagIds !== initialTagIds) return true

  return false
})

// 标签函数
const openTagSelector = () => {
  selectedTagIds.value = selectedTags.value.map(tag => tag.id)
  showTagSelector.value = true
}

const handleTagConfirm = (tags) => {
  selectedTags.value = tags
}

const handleTagCancel = () => {
  // 不做任何操作
}

const removeTag = (tag) => {
  const index = selectedTags.value.findIndex(t => t.id === tag.id)
  if (index > -1) {
    selectedTags.value.splice(index, 1)
  }
}

// 页面加载
onLoad((options) => {
  if (options.id) {
    subCategoryId.value = options.id
    isEdit.value = options.mode === 'edit'
    loadSubCategoryDetail()
  } else {
    // 新建模式
    if (options.mainCategoryId) {
      formData.value.mainCategoryId = options.mainCategoryId
      // 从store获取主分类名称
      if (categoryStore.currentMainCategory) {
        mainCategoryName.value = categoryStore.currentMainCategory.name
      }
    }
    // 保存初始空快照
    saveInitialSnapshot()
  }

  // 设置页面标题
  uni.setNavigationBarTitle({
    title: isEdit.value ? '编辑子分类' : '创建子分类'
  })
})

// 拦截返回按钮
onBackPress(() => {
  // 如果已成功保存或正在提交，允许返回
  if (savedSuccessfully.value || submitting.value) {
    return false
  }

  // 如果有未保存的修改，显示确认对话框
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
    return true // 阻止默认返回行为
  }
  return false // 允许返回
})

// 保存初始数据快照
const saveInitialSnapshot = () => {
  initialSnapshot.value = {
    mainCategoryId: formData.value.mainCategoryId,
    name: formData.value.name.trim(),
    description: formData.value.description.trim(),
    coverImage: formData.value.coverImage,
    tagIds: selectedTags.value.map(t => t.id)
  }
}

// 加载子分类详情（编辑模式）
const loadSubCategoryDetail = async () => {
  try {
    const res = await categoryApi.getSubCategoryById(subCategoryId.value)
    const detail = res.data || res

    formData.value.name = detail.name || ''
    formData.value.description = detail.description || ''
    formData.value.coverImage = detail.coverImage || ''
    formData.value.mainCategoryId = detail.mainCategoryId || ''

    // 设置主分类名称
    if (detail.mainCategoryName) {
      mainCategoryName.value = detail.mainCategoryName
    }

    // 处理标签
    if (detail.tagDTOList) {
      selectedTags.value = detail.tagDTOList
    }

    // 保存初始快照
    saveInitialSnapshot()
  } catch (error) {
    console.error('Load sub category detail error:', error)
    uni.showToast({
      title: '加载数据失败',
      icon: 'none'
    })
  }
}

// 选择主分类
const selectMainCategory = () => {
  // 编辑模式下不允许修改主分类
  if (isEdit.value) {
    return
  }
  showMainCategorySelector.value = true
}

// 主分类选择确认
const handleMainCategoryConfirm = (category) => {
  formData.value.mainCategoryId = category.id
  mainCategoryName.value = category.name
}

// 主分类选择取消
const handleMainCategoryCancel = () => {
  // 不做任何操作
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

// 表单验证
const validateForm = () => {
  if (!formData.value.mainCategoryId) {
    uni.showToast({
      title: '请选择主分类',
      icon: 'none'
    })
    return false
  }

  if (!formData.value.name || !formData.value.name.trim()) {
    uni.showToast({
      title: '请输入子分类标题',
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
      coverImageUrl = uploadRes.data?.url || uploadRes.data || ''

      uni.hideLoading()
    } else {
      coverImageUrl = formData.value.coverImage
    }

    const data = {
      mainCategoryId: formData.value.mainCategoryId,
      name: formData.value.name.trim(),
      description: formData.value.description.trim(),
      coverImage: coverImageUrl,
      tagIdList: selectedTags.value.map(t => t.id)
    }

    if (isEdit.value) {
      // 更新子分类
      await categoryApi.updateSubCategory(subCategoryId.value, data)

      uni.showToast({
        title: '保存成功',
        icon: 'success'
      })
    } else {
      // 创建子分类
      await categoryApi.createSubCategory(data)

      uni.showToast({
        title: '创建成功',
        icon: 'success'
      })
    }

    // 标记为成功保存，允许正常返回
    savedSuccessfully.value = true

    // 延迟返回
    setTimeout(() => {
      uni.navigateBack()
    }, 1500)
  } catch (error) {
    console.error('Submit sub category error:', error)
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

/* 分类选择 */
.category-display {
  width: 100%;
  height: 88rpx;
  padding: 0 24rpx;
  background: #ffffff;
  border-radius: 12rpx;
  border: 1rpx solid rgba(0, 0, 0, 0.08);
  display: flex;
  align-items: center;
  justify-content: space-between;
}

.category-display:active {
  background: rgba(0, 196, 179, 0.05);
}

.category-display.disabled {
  background: #f5f5f5;
  cursor: not-allowed;
}

.category-display.disabled:active {
  background: #f5f5f5;
}

.category-text {
  font-size: 28rpx;
  color: #333333;
  flex: 1;
}

.category-text.placeholder {
  color: #cccccc;
}

.arrow-icon {
  font-size: 40rpx;
  color: #cccccc;
  line-height: 1;
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
  min-height: 200rpx;
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
  width: 100%;
  height: 400rpx;
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

/* 提交按钮 */
.submit-container {
  margin-top: 60rpx;
  padding-bottom: 40rpx;
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
</style>
