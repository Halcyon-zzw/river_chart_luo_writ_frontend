<template>
  <view class="create-category-page">
    <scroll-view class="form-scroll" scroll-y>
      <view class="form-container">
        <!-- 主分类显示 -->
        <view class="form-item">
          <view class="form-label">
            <text class="label-text">所属主分类</text>
          </view>
          <view class="category-display" @click="selectMainCategory">
            <text class="category-text" :class="{ placeholder: !mainCategoryName }">
              {{ mainCategoryName || '请选择主分类' }}
            </text>
            <text class="arrow-icon">›</text>
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

        <!-- 提交按钮 -->
        <view class="submit-container">
          <button class="submit-button" :loading="submitting" @click="handleSubmit">
            {{ submitting ? '提交中...' : '创建子分类' }}
          </button>
        </view>
      </view>
    </scroll-view>
  </view>
</template>

<script setup>
import { ref } from 'vue'
import { onLoad } from '@dcloudio/uni-app'
import { categoryApi } from '@/api'
import { useCategoryStore } from '@/store/category'

const categoryStore = useCategoryStore()

// 表单数据
const formData = ref({
  mainCategoryId: '',
  name: '',
  description: '',
  coverImage: ''
})

const mainCategoryName = ref('')
const submitting = ref(false)

// 页面加载
onLoad((options) => {
  if (options.mainCategoryId) {
    formData.value.mainCategoryId = options.mainCategoryId
    // 从store获取主分类名称
    if (categoryStore.currentMainCategory) {
      mainCategoryName.value = categoryStore.currentMainCategory.name
    }
  }
})

// 选择主分类
const selectMainCategory = () => {
  uni.showToast({
    title: '选择主分类功能待开发',
    icon: 'none'
  })
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

    await categoryApi.createSubCategory({
      mainCategoryId: formData.value.mainCategoryId,
      name: formData.value.name.trim(),
      description: formData.value.description.trim(),
      coverImage: coverImageUrl
    })

    uni.showToast({
      title: '创建成功',
      icon: 'success'
    })

    // 延迟返回
    setTimeout(() => {
      uni.navigateBack()
    }, 1500)
  } catch (error) {
    console.error('Create sub category error:', error)
    uni.showToast({
      title: error.message || '创建失败，请重试',
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
</style>
