<template>
  <view class="login-page">
    <view class="login-container">
      <!-- Logo区域 -->
      <view class="logo-section">
        <text class="app-name">河图洛书</text>
        <text class="app-desc">沉浸式内容管理工具</text>
      </view>

      <!-- 登录卡片 -->
      <view class="login-card">
        <text class="login-title">欢迎使用</text>

        <!-- 登录按钮 -->
        <view class="login-btn" @click="handleLogin">
          <text class="login-btn-text">{{ loading ? '登录中...' : '点击登录' }}</text>
        </view>

        <!-- 提示信息 -->
        <view v-if="errorMessage" class="error-message">
          <text class="error-text">{{ errorMessage }}</text>
        </view>
      </view>

      <!-- 底部版本信息 -->
      <view class="version-info">
        <text class="version-text">v{{ appVersion }}</text>
      </view>
    </view>
  </view>
</template>

<script setup>
import { ref } from 'vue'
import { useUserStore } from '@/store/user'
import config from '@/utils/config'

const userStore = useUserStore()
const appVersion = config.VERSION

// 数据
const loading = ref(false)
const errorMessage = ref('')

// 登录处理
const handleLogin = async () => {
  if (loading.value) return

  loading.value = true
  errorMessage.value = ''

  try {
    console.log('[Login] Starting login...')
    const result = await userStore.login()

    if (result.success) {
      console.log('[Login] Login success, userId:', result.userId)
      uni.showToast({
        title: '登录成功',
        icon: 'success',
        duration: 1500
      })

      // 延迟跳转到首页
      setTimeout(() => {
        uni.reLaunch({
          url: '/pages/tabbar/browse/browse'
        })
      }, 1500)
    } else {
      console.error('[Login] Login failed:', result.error)
      errorMessage.value = '登录失败，请重试'
      loading.value = false
    }
  } catch (error) {
    console.error('[Login] Login error:', error)
    errorMessage.value = '网络异常，请检查网络连接'
    loading.value = false
  }
}
</script>

<style scoped>
.login-page {
  min-height: 100vh;
  background: linear-gradient(135deg, #00c4b3 0%, #00a99d 100%);
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 60rpx 40rpx;
}

.login-container {
  width: 100%;
  max-width: 600rpx;
  display: flex;
  flex-direction: column;
  align-items: center;
}

/* Logo区域 */
.logo-section {
  margin-bottom: 80rpx;
  text-align: center;
}

.app-name {
  display: block;
  font-size: 64rpx;
  font-weight: 700;
  color: #ffffff;
  letter-spacing: 8rpx;
  margin-bottom: 20rpx;
  text-shadow: 0 4rpx 12rpx rgba(0, 0, 0, 0.15);
}

.app-desc {
  display: block;
  font-size: 28rpx;
  color: rgba(255, 255, 255, 0.9);
  letter-spacing: 4rpx;
}

/* 登录卡片 */
.login-card {
  width: 100%;
  background: #ffffff;
  border-radius: 32rpx;
  padding: 60rpx 40rpx;
  box-shadow: 0 8rpx 32rpx rgba(0, 0, 0, 0.15);
  display: flex;
  flex-direction: column;
  align-items: center;
}

.login-title {
  font-size: 40rpx;
  font-weight: 600;
  color: #333333;
  margin-bottom: 60rpx;
}

/* 登录按钮 */
.login-btn {
  width: 100%;
  height: 96rpx;
  background: linear-gradient(90deg, #00c4b3 0%, #00a99d 100%);
  border-radius: 48rpx;
  display: flex;
  align-items: center;
  justify-content: center;
  box-shadow: 0 4rpx 16rpx rgba(0, 196, 179, 0.3);
  transition: all 0.3s;
}

.login-btn:active {
  opacity: 0.8;
  transform: scale(0.98);
}

.login-btn-text {
  font-size: 32rpx;
  color: #ffffff;
  font-weight: 600;
  letter-spacing: 2rpx;
}

/* 错误信息 */
.error-message {
  width: 100%;
  margin-top: 30rpx;
  padding: 20rpx;
  background: rgba(255, 68, 68, 0.1);
  border-radius: 16rpx;
  text-align: center;
}

.error-text {
  font-size: 24rpx;
  color: #ff4444;
}

/* 版本信息 */
.version-info {
  margin-top: 80rpx;
  text-align: center;
}

.version-text {
  font-size: 24rpx;
  color: rgba(255, 255, 255, 0.7);
  letter-spacing: 2rpx;
}
</style>
