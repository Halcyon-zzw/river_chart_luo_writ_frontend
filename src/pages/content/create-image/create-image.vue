<template>
  <view class="create-image-page">
    <!-- 自定义导航栏 -->
    <custom-nav-bar
      :title="isEdit ? '编辑图片' : '上传图片'"
      :needConfirm="hasModified && !savedSuccessfully && !submitting"
      confirmText="您有未保存的修改，确定要离开吗？"
    />

    <scroll-view class="content-scroll" scroll-y>
      <!-- 图片上传区域 -->
      <view class="collapsible-section">
        <view class="section-header" @click="toggleSection('images')">
          <text class="section-title">图片</text>
          <text class="section-arrow">{{ sectionExpanded.images ? '▼' : '▶' }}</text>
        </view>
        <view v-if="sectionExpanded.images" class="section-content">
          <view class="upload-grid">
            <!-- 已上传的图片 -->
            <view
              v-for="(img, index) in imageList"
              :key="index"
              class="image-item"
              @click="previewImage(index)"
            >
              <image class="upload-image" :src="getFullImageUrl(img.url)" mode="aspectFill"></image>
              <!-- 删除按钮 -->
              <view class="delete-btn" @click.stop="removeImage(index)">
                <text class="delete-icon">✕</text>
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
      </view>

      <!-- 表单区域 -->
      <view class="form-section">
        <!-- 标题 -->
        <view class="collapsible-section">
          <view class="section-header" @click="toggleSection('title')">
            <text class="section-title">标题</text>
            <text class="section-arrow">{{ sectionExpanded.title ? '▼' : '▶' }}</text>
          </view>
          <view v-if="sectionExpanded.title" class="section-content">
            <input
              class="form-input"
              v-model="formData.name"
              placeholder="请输入标题（必填）"
              placeholder-class="input-placeholder"
              :adjust-position="true"
            />
          </view>
        </view>

        <!-- 描述 -->
        <view class="collapsible-section">
          <view class="section-header" @click="toggleSection('description')">
            <text class="section-title">简介</text>
            <text class="section-arrow">{{ sectionExpanded.description ? '▼' : '▶' }}</text>
          </view>
          <view v-if="sectionExpanded.description" class="section-content">
            <textarea
              class="form-textarea"
              v-model="formData.description"
              placeholder="请输入简介（选填）"
              placeholder-class="input-placeholder"
              :maxlength="500"
              :adjust-position="true"
              :show-confirm-bar="false"
            />
          </view>
        </view>

        <!-- 分类显示（不可编辑） -->
        <view class="collapsible-section">
          <view class="section-header" @click="toggleSection('category')">
            <text class="section-title">子分类</text>
            <text class="section-arrow">{{ sectionExpanded.category ? '▼' : '▶' }}</text>
          </view>
          <view v-if="sectionExpanded.category" class="section-content">
            <view class="form-display">
              <text class="display-text">
                {{ selectedSubCategory?.name || '未指定分类' }}
              </text>
            </view>
          </view>
        </view>

        <!-- 标签 -->
        <view class="collapsible-section">
          <view class="section-header" @click="toggleSection('tags')">
            <text class="section-title">标签</text>
            <text class="section-arrow">{{ sectionExpanded.tags ? '▼' : '▶' }}</text>
          </view>
          <view v-if="sectionExpanded.tags" class="section-content">
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
import { ref, reactive, computed } from 'vue'
import { onLoad, onBackPress } from '@dcloudio/uni-app'
import { contentApi, tagApi, categoryApi } from '@/api'
import { useCategoryStore } from '@/store/category'
import config from '@/utils/config'
import { getFullImageUrl } from '@/utils/image'
import TagSelector from '@/components/tag-selector/tag-selector.vue'
import CustomNavBar from '@/components/custom-nav-bar/custom-nav-bar.vue'

// 数据
const contentId = ref('')
const isEdit = ref(false)
const maxImages = config.IMAGE_MAX_COUNT
const imageList = ref([])
const selectedSubCategory = ref(null)
const selectedTags = ref([])
const submitting = ref(false)
const savedSuccessfully = ref(false) // 标记是否成功保存

// 标签相关
const showTagSelector = ref(false)
const selectedTagIds = ref([])

// 折叠状态（默认全部展开，子分类默认折叠）
const sectionExpanded = reactive({
  images: true,
  title: true,
  description: true,
  category: false, // 子分类默认折叠
  tags: true
})

const formData = reactive({
  name: '',
  description: '',
  subCategoryId: '',
  mainCategoryId: ''
})

// 初始数据快照（用于检测修改）
const initialSnapshot = ref({
  name: '',
  description: '',
  imageUrls: [],
  tagIds: []
})

// 检测是否有修改
const hasModified = computed(() => {
  // 检查表单字段
  if (formData.name.trim() !== initialSnapshot.value.name) return true
  if (formData.description.trim() !== initialSnapshot.value.description) return true

  // 检查图片
  const currentImageUrls = imageList.value.map(img => img.url).sort().join(',')
  const initialImageUrls = initialSnapshot.value.imageUrls.sort().join(',')
  if (currentImageUrls !== initialImageUrls) return true

  // 检查标签
  const currentTagIds = selectedTags.value.map(t => t.id).sort().join(',')
  const initialTagIds = initialSnapshot.value.tagIds.sort().join(',')
  if (currentTagIds !== initialTagIds) return true

  return false
})

// 页面加载
onLoad((options) => {
  if (options.id) {
    contentId.value = options.id
    isEdit.value = options.mode === 'edit'
    loadContentDetail()
  } else {
    // 新建模式
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

    // 保存初始空快照
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
    name: formData.name.trim(),
    description: formData.description.trim(),
    imageUrls: imageList.value.map(img => img.url),
    tagIds: selectedTags.value.map(t => t.id)
  }
}

// 加载内容详情（编辑模式）
const loadContentDetail = async () => {
  try {
    const res = await contentApi.getContentById(contentId.value)
    const detail = res.data || res

    formData.name = detail.title || detail.name || ''
    formData.description = detail.description
    formData.subCategoryId = detail.subCategoryId
    formData.mainCategoryId = detail.mainCategoryId

    // 获取子分类信息
    if (detail.subCategoryId) {
      try {
        const subCategoryRes = await categoryApi.getSubCategoryById(detail.subCategoryId)
        selectedSubCategory.value = subCategoryRes.data || subCategoryRes
      } catch (error) {
        console.error('Load sub-category error:', error)
      }
    }

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
    if (detail.tagDTOList && detail.tagDTOList.length > 0) {
      selectedTags.value = detail.tagDTOList
    } else {
      // 如果详情接口没有返回标签，尝试单独获取
      try {
        const tagsRes = await contentApi.getContentTags(contentId.value)
        if (tagsRes.data && Array.isArray(tagsRes.data)) {
          selectedTags.value = tagsRes.data
        }
      } catch (error) {
        console.error('Load content tags error:', error)
        // 标签加载失败不影响主流程
      }
    }

    // 保存初始快照
    saveInitialSnapshot()
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
  selectedTagIds.value = selectedTags.value.map(tag => tag.id)
  showTagSelector.value = true
}

// 标签确认
const handleTagConfirm = (tags) => {
  selectedTags.value = tags
}

// 标签取消
const handleTagCancel = () => {
  // 不做任何操作
}

// 移除标签
const removeTag = (tag) => {
  selectedTags.value = selectedTags.value.filter(t => t.id !== tag.id)
}

// 切换折叠状态
const toggleSection = (section) => {
  sectionExpanded[section] = !sectionExpanded[section]
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
          url: config.API_BASE_URL + '/content/upload-images',
          filePath: img.url,
          name: 'files',
          success: (res) => {
            if (res.statusCode === 200) {
              try {
                const data = JSON.parse(res.data)
                // API返回 ResultListString 格式：{ code, data: ["url1", "url2", ...] }
                // 即使上传单个文件，data也是数组
                let url = ''
                if (Array.isArray(data.data) && data.data.length > 0) {
                  url = data.data[0]
                } else if (typeof data.data === 'string') {
                  url = data.data
                } else if (data.url) {
                  url = data.url
                }

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
  } else {
    uni.navigateBack()
  }
}

// 提交
const submit = async () => {
  if (submitting.value) return

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

  submitting.value = true

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
      tagIdList: selectedTags.value.map(tag => tag.id)
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

    // 标记为成功保存，允许正常返回
    savedSuccessfully.value = true

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
    submitting.value = false
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
  /* 底部留出按钮栏的空间：按钮高度88rpx + 上下padding 48rpx + safe-area */
  padding-bottom: calc(136rpx + constant(safe-area-inset-bottom));
  padding-bottom: calc(136rpx + env(safe-area-inset-bottom));
  box-sizing: border-box;
}

/* 折叠区域 */
.collapsible-section {
  background: #ffffff;
  margin: 20rpx 30rpx;
  border-radius: 12rpx;
  overflow: hidden;
}

.section-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 24rpx 28rpx;
  background: #ffffff;
  cursor: pointer;
}

.section-header:active {
  background: #f9f9f9;
}

.section-title {
  font-size: 28rpx;
  color: #333333;
  font-weight: 500;
}

.section-arrow {
  font-size: 24rpx;
  color: #999999;
  transition: transform 0.3s ease;
}

.section-content {
  padding: 0 28rpx 24rpx 28rpx;
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

/* 删除按钮 */
.delete-btn {
  position: absolute;
  top: 8rpx;
  right: 8rpx;
  width: 48rpx;
  height: 48rpx;
  background: rgba(0, 0, 0, 0.6);
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 10;
}

.delete-icon {
  font-size: 36rpx;
  color: #ffffff;
  line-height: 1;
  font-weight: 300;
}

.delete-btn:active {
  background: rgba(0, 0, 0, 0.8);
  transform: scale(0.95);
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
  padding: 0;
}

.form-input,
.form-textarea {
  width: 100%;
  padding: 24rpx 28rpx;
  background: #f5f5f5;
  border: 1rpx solid rgba(0, 0, 0, 0.08);
  border-radius: 12rpx;
  font-size: 28rpx;
  color: #333333;
  box-sizing: border-box;
}

.form-input {
  height: auto;
  min-height: 80rpx;
  line-height: 1.5;
}

.form-textarea {
  min-height: 150rpx;
  line-height: 1.6;
}

.input-placeholder {
  color: #cccccc;
}

.form-display {
  width: 100%;
  padding: 24rpx 28rpx;
  background: #f5f5f5;
  border: 1rpx solid rgba(0, 0, 0, 0.08);
  border-radius: 12rpx;
  box-sizing: border-box;
}

.display-text {
  font-size: 28rpx;
  color: #666666;
  word-break: break-word;
  white-space: normal;
}

/* 标签容器 */
.tags-container {
  display: flex;
  flex-wrap: wrap;
  gap: 16rpx;
  width: 100%;
}

.tag-chip {
  display: flex;
  align-items: center;
  gap: 12rpx;
  padding: 12rpx 20rpx;
  background: rgba(0, 196, 179, 0.15);
  border: 1rpx solid rgba(0, 196, 179, 0.3);
  border-radius: 8rpx;
  max-width: 100%;
}

.tag-text {
  font-size: 24rpx;
  color: #00c4b3;
  word-break: break-word;
  white-space: normal;
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
