<template>
  <view class="create-note-page">
    <!-- 表单区域 -->
    <scroll-view class="content-scroll" scroll-y>
      <!-- 标题输入 -->
      <view class="title-section">
        <input
          class="title-input"
          v-model="formData.name"
          placeholder="请输入标题"
          placeholder-class="input-placeholder"
          :maxlength="100"
        />
      </view>

      <!-- 富文本编辑器 -->
      <view class="editor-section">
        <editor
          id="editor"
          class="editor"
          :placeholder="'开始输入内容...'"
          @ready="onEditorReady"
          @input="onEditorInput"
        ></editor>
      </view>

      <!-- 其他表单项 -->
      <view class="form-section">
        <!-- 描述 -->
        <view class="form-item">
          <text class="form-label">简介</text>
          <textarea
            class="form-textarea"
            v-model="formData.description"
            placeholder="请输入简介（可选）"
            placeholder-class="input-placeholder"
            :maxlength="200"
          />
        </view>

        <!-- 分类选择 -->
        <view class="form-item">
          <text class="form-label">子分类</text>
          <view class="form-selector" @click="selectSubCategory">
            <text class="selector-text" :class="{ placeholder: !selectedSubCategory }">
              {{ selectedSubCategory?.name || '请选择子分类（必填）' }}
            </text>
            <text class="selector-arrow">›</text>
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

    <!-- 编辑器工具栏 -->
    <view class="toolbar">
      <scroll-view class="toolbar-scroll" scroll-x>
        <view class="toolbar-content">
          <view class="tool-btn" @click="format('bold')">
            <text class="tool-icon">B</text>
          </view>
          <view class="tool-btn" @click="format('italic')">
            <text class="tool-icon italic">I</text>
          </view>
          <view class="tool-btn" @click="format('underline')">
            <text class="tool-icon underline">U</text>
          </view>
          <view class="tool-divider"></view>
          <view class="tool-btn" @click="format('header', { name: 'H1', value: 'H1' })">
            <text class="tool-text">H1</text>
          </view>
          <view class="tool-btn" @click="format('header', { name: 'H2', value: 'H2' })">
            <text class="tool-text">H2</text>
          </view>
          <view class="tool-divider"></view>
          <view class="tool-btn" @click="insertImage">
            <text class="tool-icon">🖼</text>
          </view>
          <view class="tool-btn" @click="insertDivider">
            <text class="tool-icon">━</text>
          </view>
        </view>
      </scroll-view>

      <view class="toolbar-actions">
        <view class="action-btn cancel" @click="cancel">
          <text>取消</text>
        </view>
        <view class="action-btn submit" @click="submit">
          <text>{{ isEdit ? '保存' : '发布' }}</text>
        </view>
      </view>
    </view>
  </view>
</template>

<script setup>
import { ref, reactive } from 'vue'
import { onLoad } from '@dcloudio/uni-app'
import { contentApi } from '@/api'
import config from '@/utils/config'

// 数据
const contentId = ref('')
const isEdit = ref(false)
const editorCtx = ref(null)
const selectedSubCategory = ref(null)
const selectedTags = ref([])

const formData = reactive({
  name: '',
  description: '',
  noteContent: '',
  subCategoryId: '',
  mainCategoryId: ''
})

// 页面加载
onLoad((options) => {
  if (options.id) {
    contentId.value = options.id
    isEdit.value = options.mode === 'edit'
    setTimeout(() => {
      loadContentDetail()
    }, 500) // 等待编辑器初始化
  }

  if (options.subCategoryId) {
    formData.subCategoryId = options.subCategoryId
  }

  if (options.mainCategoryId) {
    formData.mainCategoryId = options.mainCategoryId
  }
})

// 编辑器就绪
const onEditorReady = () => {
  uni.createSelectorQuery()
    .select('#editor')
    .context((res) => {
      editorCtx.value = res.context
    })
    .exec()
}

// 编辑器输入
const onEditorInput = (e) => {
  // 实时更新内容（可选）
  console.log('Editor input:', e.detail.html)
}

// 加载内容详情（编辑模式）
const loadContentDetail = async () => {
  try {
    const res = await contentApi.getContentById(contentId.value)
    const detail = res.data || res

    formData.name = detail.name
    formData.description = detail.description
    formData.subCategoryId = detail.subCategoryId
    formData.mainCategoryId = detail.mainCategoryId

    // 设置编辑器内容
    if (editorCtx.value && detail.noteContent) {
      editorCtx.value.setContents({
        html: detail.noteContent
      })
    }

    // 处理标签
    if (detail.tags) {
      selectedTags.value = detail.tags
    }
  } catch (error) {
    console.error('Load content detail error:', error)
  }
}

// 格式化文本
const format = (name, value) => {
  if (!editorCtx.value) return

  if (name === 'header') {
    editorCtx.value.format('header', value.value)
  } else {
    editorCtx.value.format(name)
  }
}

// 插入图片
const insertImage = () => {
  uni.chooseImage({
    count: 1,
    success: (res) => {
      const tempFilePath = res.tempFilePaths[0]

      // 上传图片
      uni.uploadFile({
        url: config.API_BASE_URL + '/content/upload-images',
        filePath: tempFilePath,
        name: 'file',
        success: (uploadRes) => {
          if (uploadRes.statusCode === 200) {
            const data = JSON.parse(uploadRes.data)
            const imageUrl = data.data?.url || data.url

            if (editorCtx.value) {
              editorCtx.value.insertImage({
                src: imageUrl,
                alt: '图片',
                width: '100%'
              })
            }
          }
        }
      })
    }
  })
}

// 插入分隔线
const insertDivider = () => {
  if (!editorCtx.value) return
  editorCtx.value.insertDivider()
}

// 选择子分类
const selectSubCategory = () => {
  uni.showToast({
    title: '子分类选择功能开发中',
    icon: 'none'
  })
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

  // 获取编辑器内容
  if (editorCtx.value) {
    editorCtx.value.getContents({
      success: async (res) => {
        if (!res.html || res.html.trim() === '<p><br></p>') {
          uni.showToast({
            title: '请输入内容',
            icon: 'none'
          })
          return
        }

        try {
          uni.showLoading({
            title: '处理中...',
            mask: true
          })

          // 提交数据
          const data = {
            ...formData,
            contentType: 'note',
            noteContent: res.html,
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
              title: '发布成功',
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
    })
  }
}
</script>

<style scoped>
.create-note-page {
  height: 100vh;
  background: #121212;
  display: flex;
  flex-direction: column;
}

/* 滚动区域 */
.content-scroll {
  flex: 1;
  overflow-y: auto;
}

/* 标题区域 */
.title-section {
  padding: 30rpx 40rpx;
  border-bottom: 1rpx solid rgba(255, 255, 255, 0.05);
}

.title-input {
  font-size: 44rpx;
  font-weight: 700;
  color: #ffffff;
  line-height: 1.4;
}

.input-placeholder {
  color: rgba(255, 255, 255, 0.3);
}

/* 编辑器区域 */
.editor-section {
  min-height: 400rpx;
}

.editor {
  min-height: 400rpx;
  padding: 30rpx 40rpx;
  font-size: 30rpx;
  line-height: 1.8;
  color: rgba(255, 255, 255, 0.85);
}

/* 表单区域 */
.form-section {
  padding: 20rpx 40rpx;
}

.form-item {
  margin-bottom: 40rpx;
}

.form-label {
  display: block;
  font-size: 28rpx;
  color: rgba(255, 255, 255, 0.9);
  margin-bottom: 20rpx;
  font-weight: 500;
}

.form-textarea {
  width: 100%;
  padding: 24rpx 28rpx;
  background: rgba(255, 255, 255, 0.05);
  border: 1rpx solid rgba(255, 255, 255, 0.1);
  border-radius: 12rpx;
  font-size: 28rpx;
  color: #ffffff;
  min-height: 150rpx;
}

.form-selector {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 24rpx 28rpx;
  background: rgba(255, 255, 255, 0.05);
  border: 1rpx solid rgba(255, 255, 255, 0.1);
  border-radius: 12rpx;
}

.selector-text {
  font-size: 28rpx;
  color: #ffffff;
}

.selector-text.placeholder {
  color: rgba(255, 255, 255, 0.3);
}

.selector-arrow {
  font-size: 48rpx;
  color: rgba(255, 255, 255, 0.3);
  font-weight: 200;
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
  background: rgba(255, 255, 255, 0.05);
  border: 1rpx dashed rgba(255, 255, 255, 0.2);
  border-radius: 8rpx;
  font-size: 24rpx;
  color: rgba(255, 255, 255, 0.5);
}

/* 底部占位 */
.bottom-placeholder {
  height: 200rpx;
}

/* 工具栏 */
.toolbar {
  position: fixed;
  bottom: 0;
  left: 0;
  right: 0;
  background: rgba(26, 26, 26, 0.98);
  backdrop-filter: blur(20rpx);
  border-top: 1rpx solid rgba(255, 255, 255, 0.05);
  padding-bottom: constant(safe-area-inset-bottom);
  padding-bottom: env(safe-area-inset-bottom);
  z-index: 100;
}

.toolbar-scroll {
  height: 100rpx;
  white-space: nowrap;
}

.toolbar-content {
  display: inline-flex;
  align-items: center;
  padding: 0 20rpx;
  gap: 8rpx;
}

.tool-btn {
  min-width: 72rpx;
  height: 72rpx;
  display: flex;
  align-items: center;
  justify-content: center;
  background: rgba(255, 255, 255, 0.05);
  border-radius: 12rpx;
  transition: all 0.2s ease;
}

.tool-btn:active {
  background: rgba(255, 255, 255, 0.1);
}

.tool-icon {
  font-size: 32rpx;
  font-weight: 700;
  color: rgba(255, 255, 255, 0.8);
}

.tool-icon.italic {
  font-style: italic;
}

.tool-icon.underline {
  text-decoration: underline;
}

.tool-text {
  font-size: 24rpx;
  font-weight: 600;
  color: rgba(255, 255, 255, 0.8);
  padding: 0 12rpx;
}

.tool-divider {
  width: 1rpx;
  height: 48rpx;
  background: rgba(255, 255, 255, 0.1);
  margin: 0 8rpx;
}

.toolbar-actions {
  display: flex;
  gap: 20rpx;
  padding: 20rpx 30rpx;
}

.action-btn {
  flex: 1;
  height: 80rpx;
  border-radius: 16rpx;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 30rpx;
  font-weight: 500;
}

.action-btn.cancel {
  background: rgba(255, 255, 255, 0.1);
  color: #ffffff;
}

.action-btn.cancel:active {
  background: rgba(255, 255, 255, 0.15);
}

.action-btn.submit {
  background: linear-gradient(135deg, #00c4b3 0%, #00a99d 100%);
  color: #ffffff;
}

.action-btn.submit:active {
  opacity: 0.8;
}
</style>
