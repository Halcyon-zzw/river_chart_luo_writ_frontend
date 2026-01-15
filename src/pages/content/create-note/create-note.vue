<template>
  <view class="create-note-page">
    <!-- 自定义导航栏 -->
    <custom-nav-bar
      :title="isEdit ? '编辑笔记' : '创建笔记'"
      :needConfirm="hasModified && !savedSuccessfully && !submitting"
      confirmText="您有未保存的修改，确定要离开吗？"
    />

    <scroll-view
      class="content-scroll"
      scroll-y
      :style="{ height: scrollViewHeight + 'px' }"
    >
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
            :maxlength="100"
            :adjust-position="true"
          />
        </view>
      </view>

      <!-- 内容（富文本编辑器） -->
      <view class="collapsible-section">
        <view class="section-header" @click="toggleSection('content')">
          <text class="section-title">内容</text>
          <text class="section-arrow">{{ sectionExpanded.content ? '▼' : '▶' }}</text>
        </view>
        <view v-show="sectionExpanded.content" class="section-content">
          <view class="editor-container">
            <!-- 格式化工具栏（编辑器顶部，展开时始终显示） -->
            <view class="format-toolbar">
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
            </view>

            <!-- 富文本编辑器 -->
            <editor
              id="editor"
              class="editor"
              :placeholder="'开始输入内容...'"
              @ready="onEditorReady"
              @input="onEditorInput"
            ></editor>
          </view>
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

      <!-- 底部按钮（放在滚动区域内） -->
      <view class="bottom-actions">
        <view class="action-btn cancel" @click="cancel">
          <text>取消</text>
        </view>
        <view class="action-btn submit" @click="submit">
          <text>{{ isEdit ? '保存' : '发布' }}</text>
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
  </view>
</template>

<script setup>
import { ref, reactive, computed, onUnmounted } from 'vue'
import { onLoad, onBackPress } from '@dcloudio/uni-app'
import { contentApi, tagApi, categoryApi } from '@/api'
import { useCategoryStore } from '@/store/category'
import config from '@/utils/config'
import TagSelector from '@/components/tag-selector/tag-selector.vue'
import CustomNavBar from '@/components/custom-nav-bar/custom-nav-bar.vue'

// 数据
const contentId = ref('')
const isEdit = ref(false)
const editorCtx = ref(null)
const selectedSubCategory = ref(null)
const selectedTags = ref([])
const submitting = ref(false)
const savedSuccessfully = ref(false)

// 键盘相关
const windowHeight = ref(0)
const navBarHeight = ref(0) // 导航栏高度（动态计算）
const scrollViewHeight = ref(0)

// 标签相关
const showTagSelector = ref(false)
const selectedTagIds = ref([])

// 折叠状态（默认全部展开，子分类默认展开）
const sectionExpanded = reactive({
  title: true,
  content: true,
  category: true,
  tags: true
})

const formData = reactive({
  name: '',
  noteContent: '',
  subCategoryId: '',
  mainCategoryId: ''
})

// 初始数据快照（用于检测修改）
const initialSnapshot = ref({
  name: '',
  noteContent: '',
  tagIds: []
})

// 检测是否有修改
const hasModified = computed(() => {
  if (formData.name.trim() !== initialSnapshot.value.name) return true
  if (formData.noteContent !== initialSnapshot.value.noteContent) return true

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
  } else {
    // 新建模式
    if (options.subCategoryId) {
      formData.subCategoryId = options.subCategoryId
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

  // 获取窗口高度
  const systemInfo = uni.getSystemInfoSync()
  windowHeight.value = systemInfo.windowHeight

  // 动态计算导航栏高度（状态栏 + 导航栏内容）
  const statusBarHeight = systemInfo.statusBarHeight || 0
  // #ifdef MP-WEIXIN
  const menuButtonInfo = uni.getMenuButtonBoundingClientRect()
  navBarHeight.value = (menuButtonInfo.top - statusBarHeight) * 2 + menuButtonInfo.height + statusBarHeight
  // #endif
  // #ifndef MP-WEIXIN
  navBarHeight.value = 44 // 非微信小程序使用默认值
  // #endif

  // 初始化 scroll-view 高度（窗口高度 - 导航栏高度）
  scrollViewHeight.value = windowHeight.value - navBarHeight.value

  console.log('[初始化] 窗口高度:', windowHeight.value, '导航栏高度:', navBarHeight.value, 'scroll-view高度:', scrollViewHeight.value)

  // 监听键盘高度变化
  uni.onKeyboardHeightChange((res) => {
    console.log('[键盘高度变化]', res.height)

    // 当键盘弹出时，调整 scroll-view 高度 = 窗口高度 - 导航栏高度 - 键盘高度
    // 这样 scroll-view 的底部刚好到达键盘顶部，按钮被键盘自然遮挡
    if (res.height > 0) {
      scrollViewHeight.value = windowHeight.value - navBarHeight.value - res.height
    } else {
      // 键盘收起时恢复原高度
      scrollViewHeight.value = windowHeight.value - navBarHeight.value
    }

    console.log('[调整后] scroll-view高度:', scrollViewHeight.value)
  })
})

// 组件卸载时移除监听器
onUnmounted(() => {
  uni.offKeyboardHeightChange()
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
    noteContent: formData.noteContent,
    tagIds: selectedTags.value.map(t => t.id)
  }
}

// 编辑器就绪
const onEditorReady = () => {
  uni.createSelectorQuery()
    .select('#editor')
    .context((res) => {
      editorCtx.value = res.context
      // 如果是编辑模式，等编辑器准备好后再加载内容
      if (isEdit.value && contentId.value) {
        setTimeout(() => {
          loadContentDetail()
        }, 300)
      }
    })
    .exec()
}

// 编辑器输入
const onEditorInput = (e) => {
  formData.noteContent = e.detail.html || ''
}

// 加载内容详情（编辑模式）
const loadContentDetail = async () => {
  try {
    const res = await contentApi.getContentById(contentId.value)
    const detail = res.data || res

    formData.name = detail.title || detail.name || ''
    formData.noteContent = detail.noteContent || ''
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

    // 设置编辑器内容
    if (editorCtx.value && detail.noteContent) {
      editorCtx.value.setContents({
        html: detail.noteContent
      })
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
      }
    }

    // 保存初始快照
    saveInitialSnapshot()
  } catch (error) {
    console.error('Load content detail error:', error)
    uni.showToast({
      title: '加载失败',
      icon: 'none'
    })
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
    sizeType: ['compressed'],
    sourceType: ['album', 'camera'],
    success: (res) => {
      const tempFilePath = res.tempFilePaths[0]

      uni.showLoading({
        title: '上传中...',
        mask: true
      })

      // 上传图片
      uni.uploadFile({
        url: config.API_BASE_URL + '/content/upload-images',
        filePath: tempFilePath,
        name: 'files',
        success: (uploadRes) => {
          if (uploadRes.statusCode === 200) {
            try {
              const data = JSON.parse(uploadRes.data)
              let imageUrl = ''
              if (Array.isArray(data.data) && data.data.length > 0) {
                imageUrl = data.data[0]
              } else if (typeof data.data === 'string') {
                imageUrl = data.data
              } else if (data.url) {
                imageUrl = data.url
              }

              if (imageUrl && editorCtx.value) {
                editorCtx.value.insertImage({
                  src: config.API_BASE_URL + imageUrl,
                  alt: '图片',
                  width: '100%'
                })
              }
            } catch (e) {
              console.error('Parse upload response error:', e)
              uni.showToast({
                title: '上传失败',
                icon: 'none'
              })
            }
          } else {
            uni.showToast({
              title: '上传失败',
              icon: 'none'
            })
          }
        },
        fail: () => {
          uni.showToast({
            title: '上传失败',
            icon: 'none'
          })
        },
        complete: () => {
          uni.hideLoading()
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

  // 获取编辑器内容
  if (editorCtx.value) {
    editorCtx.value.getContents({
      success: async (res) => {
        const htmlContent = res.html || ''

        // 验证内容不为空
        if (!htmlContent || htmlContent.trim() === '<p><br></p>' || htmlContent.trim() === '') {
          uni.showToast({
            title: '请输入内容',
            icon: 'none'
          })
          submitting.value = false
          return
        }

        try {
          uni.showLoading({
            title: '处理中...',
            mask: true
          })

          // 提交数据
          const data = {
            title: formData.name,
            subCategoryId: formData.subCategoryId,
            mainCategoryId: formData.mainCategoryId,
            contentType: 'note',
            noteContent: htmlContent,
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
      },
      fail: () => {
        uni.showToast({
          title: '获取内容失败',
          icon: 'none'
        })
        submitting.value = false
      }
    })
  } else {
    uni.showToast({
      title: '编辑器未就绪',
      icon: 'none'
    })
    submitting.value = false
  }
}
</script>

<style scoped>
.create-note-page {
  height: 100vh;
  background: #f5f5f5;
}

.content-scroll {
  /* 高度由内联样式动态控制 */
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

/* 表单输入 */
.form-input {
  width: 100%;
  padding: 24rpx 28rpx;
  background: #f5f5f5;
  border: 1rpx solid rgba(0, 0, 0, 0.08);
  border-radius: 12rpx;
  font-size: 28rpx;
  color: #333333;
  box-sizing: border-box;
  min-height: 80rpx;
  line-height: 1.5;
}

.form-textarea {
  width: 100%;
  padding: 24rpx 28rpx;
  background: #f5f5f5;
  border: 1rpx solid rgba(0, 0, 0, 0.08);
  border-radius: 12rpx;
  font-size: 28rpx;
  color: #333333;
  box-sizing: border-box;
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

/* 编辑器容器 */
.editor-container {
  width: 100%;
  background: #f5f5f5;
  border: 1rpx solid rgba(0, 0, 0, 0.08);
  border-radius: 12rpx;
  overflow: hidden;
  box-sizing: border-box;
}

/* 格式化工具栏（编辑器顶部） */
.format-toolbar {
  background: #ffffff;
  border-bottom: 1rpx solid rgba(0, 0, 0, 0.08);
}

.editor {
  min-height: 400rpx;
  padding: 20rpx 28rpx;
  font-size: 28rpx;
  line-height: 1.8;
  color: #333333;
  background: #f5f5f5;
  box-sizing: border-box;
  border: none;
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
  height: 100%;
}

.tool-btn {
  min-width: 72rpx;
  height: 72rpx;
  display: flex;
  align-items: center;
  justify-content: center;
  background: rgba(0, 0, 0, 0.03);
  border-radius: 12rpx;
  transition: all 0.2s ease;
}

.tool-btn:active {
  background: rgba(0, 0, 0, 0.08);
}

.tool-icon {
  font-size: 32rpx;
  font-weight: 700;
  color: #666666;
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
  color: #666666;
  padding: 0 12rpx;
}

.tool-divider {
  width: 1rpx;
  height: 48rpx;
  background: rgba(0, 0, 0, 0.08);
  margin: 0 8rpx;
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
  display: flex;
  gap: 20rpx;
  padding: 24rpx 30rpx;
  padding-bottom: calc(24rpx + constant(safe-area-inset-bottom));
  padding-bottom: calc(24rpx + env(safe-area-inset-bottom));
  background: #ffffff;
  border-top: 1rpx solid rgba(0, 0, 0, 0.08);
  margin: 20rpx 30rpx;
  border-radius: 12rpx;
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
