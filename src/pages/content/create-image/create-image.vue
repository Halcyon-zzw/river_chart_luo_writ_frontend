<template>
  <view class="create-image-page">
    <scroll-view class="content-scroll" scroll-y>
      <!-- 图片上传区域 -->
      <view class="upload-section">
        <view class="upload-grid">
          <!-- 已上传的图片 -->
          <view
            v-for="(img, index) in imageList"
            :key="index"
            class="image-item"
          >
            <image class="upload-image" :src="img.url" mode="aspectFill"></image>
            <view class="image-mask">
              <view class="image-actions">
                <view class="action-icon" @click="previewImage(index)">
                  <text>👁️</text>
                </view>
                <view class="action-icon" @click="removeImage(index)">
                  <text>🗑️</text>
                </view>
              </view>
            </view>
          </view>

          <!-- 添加图片按钮 -->
          <view
            v-if="imageList.length < maxImages"
            class="upload-btn"
            @click="chooseImage"
          >
            <text class="upload-icon">+</text>
            <text class="upload-text">添加图片</text>
            <text class="upload-tip">{{ imageList.length }}/{{ maxImages }}</text>
          </view>
        </view>
      </view>

      <!-- 表单区域 -->
      <view class="form-section">
        <!-- 标题 -->
        <view class="form-item">
          <text class="form-label">标题</text>
          <input
            class="form-input"
            v-model="formData.name"
            placeholder="请输入标题（必填）"
            placeholder-class="input-placeholder"
          />
        </view>

        <!-- 描述 -->
        <view class="form-item">
          <text class="form-label">描述</text>
          <textarea
            class="form-textarea"
            v-model="formData.description"
            placeholder="请输入描述（选填）"
            placeholder-class="input-placeholder"
            :maxlength="500"
            :show-confirm-bar="false"
          />
        </view>

        <!-- 分类显示（不可编辑） -->
        <view class="form-item">
          <text class="form-label">子分类</text>
          <view class="form-display">
            <text class="display-text">
              {{ selectedSubCategory?.name || '未指定分类' }}
            </text>
          </view>
        </view>

        <!-- 标签 -->
        <view class="form-item">
          <text class="form-label">标签</text>
          <view class="tags-container">
            <view
              v-for="tag in selectedTags"
              :key="tag.id"
              class="tag-chip"
              @click="removeTag(tag)"
            >
              <text class="tag-text">{{ tag.name }}</text>
              <text class="tag-close">×</text>
            </view>
            <view class="add-tag-btn" @click="selectTags">
              <text>+ 添加标签</text>
            </view>
          </view>
        </view>
      </view>

      <!-- 底部占位 -->
      <view class="bottom-placeholder"></view>
    </scroll-view>

    <!-- 底部按钮 -->
    <view class="bottom-actions">
      <view class="action-btn cancel" @click="cancel">
        <text>取消</text>
      </view>
      <view class="action-btn submit" @click="submit">
        <text>{{ isEdit ? '保存' : '创建' }}</text>
      </view>
    </view>
  </view>
</template>

<script setup>
import { ref, reactive } from 'vue'
import { onLoad } from '@dcloudio/uni-app'
import { contentApi } from '@/api'
import { useCategoryStore } from '@/store/category'
import config from '@/utils/config'

// 数据
const contentId = ref('')
const isEdit = ref(false)
const maxImages = config.IMAGE_MAX_COUNT
const imageList = ref([])
const selectedSubCategory = ref(null)
const selectedTags = ref([])

const formData = reactive({
  name: '',
  description: '',
  subCategoryId: '',
  mainCategoryId: ''
})

// 页面加载
onLoad((options) => {
  if (options.id) {
    contentId.value = options.id
    isEdit.value = options.mode === 'edit'
    loadContentDetail()
  }

  if (options.subCategoryId) {
    formData.subCategoryId = options.subCategoryId
    // 从store获取子分类信息
    const categoryStore = useCategoryStore()
    if (categoryStore.currentSubCategory) {
      selectedSubCategory.value = categoryStore.currentSubCategory
    }
  }

  if (options.mainCategoryId) {
    formData.mainCategoryId = options.mainCategoryId
  }
})

// 加载内容详情（编辑模式）
const loadContentDetail = async () => {
  try {
    const res = await contentApi.getContentById(contentId.value)
    const detail = res.data || res

    formData.name = detail.title || detail.name || ''
    formData.description = detail.description
    formData.subCategoryId = detail.subCategoryId
    formData.mainCategoryId = detail.mainCategoryId

    // 处理图片
    if (detail.imageUrl) {
      const urls = typeof detail.imageUrl === 'string'
        ? detail.imageUrl.split(',').filter(url => url.trim())
        : Array.isArray(detail.imageUrl)
          ? detail.imageUrl
          : [detail.imageUrl]

      imageList.value = urls.map(url => ({ url, uploaded: true }))
    }

    // 处理标签
    if (detail.tagDTOList) {
      selectedTags.value = detail.tagDTOList
    }
  } catch (error) {
    console.error('Load content detail error:', error)
  }
}

// 选择图片
const chooseImage = () => {
  const remaining = maxImages - imageList.value.length

  uni.chooseImage({
    count: remaining,
    sizeType: ['compressed'],
    sourceType: ['album', 'camera'],
    success: (res) => {
      const tempFiles = res.tempFilePaths.map(url => ({
        url,
        uploaded: false
      }))
      imageList.value = [...imageList.value, ...tempFiles]
    }
  })
}

// 预览图片
const previewImage = (index) => {
  const urls = imageList.value.map(img => img.url)
  uni.previewImage({
    urls,
    current: index
  })
}

// 移除图片
const removeImage = (index) => {
  imageList.value.splice(index, 1)
}

// 选择标签
const selectTags = () => {
  uni.showToast({
    title: '标签选择功能开发中',
    icon: 'none'
  })
}

// 移除标签
const removeTag = (tag) => {
  selectedTags.value = selectedTags.value.filter(t => t.id !== tag.id)
}

// 上传图片
const uploadImages = async () => {
  const toUpload = imageList.value.filter(img => !img.uploaded)

  if (toUpload.length === 0) {
    return imageList.value.map(img => img.url)
  }

  try {
    const uploadPromises = toUpload.map(img => {
      return new Promise((resolve, reject) => {
        uni.uploadFile({
          url: config.API_BASE_URL + '/file/upload',
          filePath: img.url,
          name: 'file',
          success: (res) => {
            if (res.statusCode === 200) {
              try {
                const data = JSON.parse(res.data)
                // 根据后端返回格式解析URL
                const url = data.data?.url || data.data || data.url || ''
                if (url) {
                  resolve(url)
                } else {
                  reject(new Error('上传返回的URL为空'))
                }
              } catch (e) {
                reject(new Error('解析上传结果失败'))
              }
            } else {
              reject(new Error(`上传失败: ${res.statusCode}`))
            }
          },
          fail: (err) => {
            reject(new Error(err.errMsg || '上传失败'))
          }
        })
      })
    })

    const uploadedUrls = await Promise.all(uploadPromises)

    // 更新imageList
    let uploadIndex = 0
    imageList.value = imageList.value.map(img => {
      if (!img.uploaded) {
        return { url: uploadedUrls[uploadIndex++], uploaded: true }
      }
      return img
    })

    return imageList.value.map(img => img.url)
  } catch (error) {
    console.error('Upload images error:', error)
    throw error
  }
}

// 取消
const cancel = () => {
  uni.showModal({
    title: '提示',
    content: '确定要取消吗？未保存的内容将丢失',
    success: (res) => {
      if (res.confirm) {
        uni.navigateBack()
      }
    }
  })
}

// 提交
const submit = async () => {
  // 验证
  if (imageList.value.length === 0) {
    uni.showToast({
      title: '请至少添加一张图片',
      icon: 'none'
    })
    return
  }

  if (!formData.name.trim()) {
    uni.showToast({
      title: '请输入标题',
      icon: 'none'
    })
    return
  }

  if (!formData.subCategoryId) {
    uni.showToast({
      title: '请选择子分类',
      icon: 'none'
    })
    return
  }

  try {
    uni.showLoading({
      title: '处理中...',
      mask: true
    })

    // 上传图片
    const imageUrls = await uploadImages()

    // 提交数据
    const data = {
      title: formData.name,
      description: formData.description,
      subCategoryId: formData.subCategoryId,
      mainCategoryId: formData.mainCategoryId,
      contentType: 'image',
      imageUrl: imageUrls.join(','),
      tagIds: selectedTags.value.map(tag => tag.id)
    }

    if (isEdit.value) {
      await contentApi.updateContent(contentId.value, data)
      uni.showToast({
        title: '保存成功',
        icon: 'success'
      })
    } else {
      await contentApi.createContent(data)
      uni.showToast({
        title: '创建成功',
        icon: 'success'
      })
    }

    setTimeout(() => {
      uni.navigateBack()
    }, 1500)
  } catch (error) {
    console.error('Submit error:', error)
    uni.showToast({
      title: '操作失败',
      icon: 'none'
    })
  } finally {
    uni.hideLoading()
  }
}
</script>

<style scoped>
.create-image-page {
  min-height: 100vh;
  background: #f5f5f5;
  padding-bottom: calc(120rpx + constant(safe-area-inset-bottom));
  padding-bottom: calc(120rpx + env(safe-area-inset-bottom));
}

.content-scroll {
  height: 100vh;
}

/* 上传区域 */
.upload-section {
  padding: 30rpx;
}

.upload-grid {
  display: grid;
  grid-template-columns: repeat(3, 1fr);
  gap: 20rpx;
}

.image-item {
  position: relative;
  width: 100%;
  padding-bottom: 100%;
  border-radius: 16rpx;
  overflow: hidden;
  background: #ffffff;
}

.upload-image {
  position: absolute;
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
}

.image-mask {
  position: absolute;
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
  background: rgba(0, 0, 0, 0.4);
  opacity: 0;
  transition: opacity 0.2s ease;
}

.image-item:active .image-mask {
  opacity: 1;
}

.image-actions {
  position: absolute;
  top: 50%;
  left: 50%;
  transform: translate(-50%, -50%);
  display: flex;
  gap: 20rpx;
}

.action-icon {
  width: 60rpx;
  height: 60rpx;
  background: rgba(255, 255, 255, 0.9);
  border-radius: 30rpx;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 32rpx;
}

.upload-btn {
  position: relative;
  width: 100%;
  padding-bottom: 100%;
  border-radius: 16rpx;
  border: 2rpx dashed rgba(0, 0, 0, 0.1);
  background: rgba(0, 0, 0, 0.02);
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
}

.upload-icon {
  position: absolute;
  top: 35%;
  font-size: 64rpx;
  color: #cccccc;
  font-weight: 200;
}

.upload-text {
  position: absolute;
  top: 55%;
  font-size: 24rpx;
  color: #999999;
}

.upload-tip {
  position: absolute;
  top: 68%;
  font-size: 20rpx;
  color: #cccccc;
}

/* 表单区域 */
.form-section {
  padding: 20rpx 30rpx;
}

.form-item {
  margin-bottom: 40rpx;
}

.form-label {
  display: block;
  font-size: 28rpx;
  color: #333333;
  margin-bottom: 20rpx;
  font-weight: 500;
}

.form-input,
.form-textarea {
  width: 100%;
  padding: 24rpx 28rpx;
  background: #ffffff;
  border: 1rpx solid rgba(0, 0, 0, 0.08);
  border-radius: 12rpx;
  font-size: 28rpx;
  color: #333333;
}

.form-textarea {
  min-height: 200rpx;
}

.input-placeholder {
  color: #cccccc;
}

.form-display {
  padding: 24rpx 28rpx;
  background: #f5f5f5;
  border: 1rpx solid rgba(0, 0, 0, 0.08);
  border-radius: 12rpx;
}

.display-text {
  font-size: 28rpx;
  color: #666666;
}

/* 标签容器 */
.tags-container {
  display: flex;
  flex-wrap: wrap;
  gap: 16rpx;
}

.tag-chip {
  display: flex;
  align-items: center;
  gap: 12rpx;
  padding: 12rpx 20rpx;
  background: rgba(0, 196, 179, 0.15);
  border: 1rpx solid rgba(0, 196, 179, 0.3);
  border-radius: 8rpx;
}

.tag-text {
  font-size: 24rpx;
  color: #00c4b3;
}

.tag-close {
  font-size: 32rpx;
  color: rgba(0, 196, 179, 0.6);
  line-height: 1;
}

.add-tag-btn {
  padding: 12rpx 20rpx;
  background: rgba(0, 0, 0, 0.03);
  border: 1rpx dashed rgba(0, 0, 0, 0.1);
  border-radius: 8rpx;
  font-size: 24rpx;
  color: #999999;
}

/* 底部占位 */
.bottom-placeholder {
  height: 160rpx;
}

/* 底部按钮 */
.bottom-actions {
  position: fixed;
  bottom: 0;
  left: 0;
  right: 0;
  display: flex;
  gap: 20rpx;
  padding: 24rpx 30rpx;
  padding-bottom: calc(24rpx + constant(safe-area-inset-bottom));
  padding-bottom: calc(24rpx + env(safe-area-inset-bottom));
  background: rgba(255, 255, 255, 0.98);
  backdrop-filter: blur(20rpx);
  border-top: 1rpx solid rgba(0, 0, 0, 0.08);
  z-index: 100;
}

.action-btn {
  flex: 1;
  height: 88rpx;
  border-radius: 16rpx;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 30rpx;
  font-weight: 500;
  transition: all 0.2s ease;
}

.action-btn.cancel {
  background: rgba(0, 0, 0, 0.08);
  color: #333333;
}

.action-btn.cancel:active {
  background: rgba(0, 0, 0, 0.12);
}

.action-btn.submit {
  background: linear-gradient(135deg, #00c4b3 0%, #00a99d 100%);
  color: #ffffff;
}

.action-btn.submit:active {
  opacity: 0.8;
}
</style>
