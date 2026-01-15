<template>
  <!-- 自定义导航栏 -->
  <view class="custom-nav-bar" :style="{ paddingTop: statusBarHeight + 'px' }">
    <view class="nav-bar-content" :style="{ height: navBarHeight + 'px' }">
      <view v-if="showBack" class="nav-bar-left" @click="handleBack">
        <text class="back-icon">‹</text>
        <text class="back-text">返回</text>
      </view>
      <view class="nav-bar-title">
        <text>{{ title }}</text>
      </view>
      <view class="nav-bar-right">
        <slot name="right"></slot>
      </view>
    </view>
  </view>
  <!-- 占位元素，防止内容被导航栏遮挡 -->
  <view class="nav-bar-placeholder" :style="{ height: totalHeight + 'px' }"></view>
</template>

<script setup>
import { ref, computed, onMounted } from 'vue'

// Props
const props = defineProps({
  title: {
    type: String,
    default: ''
  },
  // 是否显示返回按钮
  showBack: {
    type: Boolean,
    default: true
  },
  // 是否需要确认返回（有未保存的修改）
  needConfirm: {
    type: Boolean,
    default: false
  },
  // 确认提示文本
  confirmText: {
    type: String,
    default: '您有未保存的修改，确定要离开吗？'
  }
})

// Emits
const emit = defineEmits(['back'])

// 数据
const statusBarHeight = ref(0)
const navBarHeight = ref(44)

// 计算导航栏总高度
const totalHeight = computed(() => {
  return statusBarHeight.value + navBarHeight.value
})

// 获取系统信息
onMounted(() => {
  const systemInfo = uni.getSystemInfoSync()
  statusBarHeight.value = systemInfo.statusBarHeight || 0

  // 不同平台的导航栏高度
  // #ifdef MP-WEIXIN
  const menuButtonInfo = uni.getMenuButtonBoundingClientRect()
  navBarHeight.value = (menuButtonInfo.top - statusBarHeight.value) * 2 + menuButtonInfo.height
  // #endif

  // #ifdef APP-PLUS
  navBarHeight.value = 44
  // #endif
})

// 处理返回按钮点击
const handleBack = () => {
  if (props.needConfirm) {
    uni.showModal({
      title: '提示',
      content: props.confirmText,
      success: (res) => {
        if (res.confirm) {
          emit('back')
          uni.navigateBack()
        }
      }
    })
  } else {
    emit('back')
    uni.navigateBack()
  }
}
</script>

<style scoped>
.custom-nav-bar {
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  z-index: 999;
  background: #ffffff;
  border-bottom: 1rpx solid rgba(0, 0, 0, 0.1);
}

.nav-bar-content {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 0 16rpx;
  position: relative;
}

.nav-bar-left {
  display: flex;
  align-items: center;
  min-width: 120rpx;
  height: 100%;
  z-index: 2;
}

.back-icon {
  font-size: 48rpx;
  font-weight: 300;
  color: #000000;
  line-height: 1;
  margin-right: 4rpx;
}

.back-text {
  font-size: 28rpx;
  color: #000000;
}

.nav-bar-title {
  position: absolute;
  left: 50%;
  transform: translateX(-50%);
  font-size: 32rpx;
  font-weight: 600;
  color: #000000;
  max-width: 60%;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
  text-align: center;
}

.nav-bar-right {
  min-width: 120rpx;
  display: flex;
  align-items: center;
  justify-content: flex-end;
  z-index: 2;
}

/* 占位元素 */
.nav-bar-placeholder {
  width: 100%;
  flex-shrink: 0;
}
</style>
