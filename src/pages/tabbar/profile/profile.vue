<template>
  <view class="profile-page">
    <!-- 自定义导航栏 -->
    <view class="custom-navbar">
      <view class="navbar-title">我的</view>
    </view>

    <scroll-view class="profile-scroll" scroll-y>
      <!-- 用户信息卡片 -->
      <view class="user-card">
        <view class="user-avatar">
          <image
            v-if="userInfo?.avatar"
            class="avatar-img"
            :src="getFullImageUrl(userInfo.avatar)"
            mode="aspectFill"
          ></image>
          <view v-else class="avatar-placeholder">
            <text class="avatar-text">{{ userInfo?.nickname?.[0] || '用' }}</text>
          </view>
        </view>
        <text class="user-nickname">{{ userInfo?.nickname || '未设置昵称' }}</text>
        <text class="user-id">ID: {{ userInfo?.id || userId }}</text>
      </view>

      <!-- 功能列表 -->
      <view class="menu-section">
        <view class="menu-item" @click="goToSettings">
          <view class="menu-left">
            <text class="menu-icon">⚙️</text>
            <text class="menu-text">设置</text>
          </view>
          <text class="menu-arrow">›</text>
        </view>

        <view class="menu-item" @click="clearCache">
          <view class="menu-left">
            <text class="menu-icon">🗑️</text>
            <text class="menu-text">清理缓存</text>
          </view>
          <view class="menu-right">
            <text class="menu-info">{{ cacheSize }}</text>
            <text class="menu-arrow">›</text>
          </view>
        </view>

        <view class="menu-item" @click="showAbout">
          <view class="menu-left">
            <text class="menu-icon">ℹ️</text>
            <text class="menu-text">关于我们</text>
          </view>
          <text class="menu-arrow">›</text>
        </view>
      </view>

      <!-- 退出登录 -->
      <view class="logout-section">
        <view class="logout-btn" @click="handleLogout">
          <text class="logout-text">退出登录</text>
        </view>
      </view>

      <!-- 版本信息 -->
      <view class="version-info">
        <text class="version-text">河图洛书 v{{ appVersion }}</text>
      </view>

      <!-- 底部占位 -->
      <view class="bottom-placeholder"></view>
    </scroll-view>
  </view>
</template>

<script setup>
import { ref, computed, onMounted } from 'vue'
import { useUserStore } from '@/store/user'
import { getFullImageUrl } from '@/utils/image'
import config from '@/utils/config'

const userStore = useUserStore()

// 数据
const appVersion = config.VERSION
const cacheSize = ref('0 MB')

// 计算属性
const userInfo = computed(() => userStore.userInfo)
const userId = computed(() => userStore.userId)

// 获取缓存大小
const getCacheSize = () => {
  // 这里简化处理，实际应该计算真实缓存大小
  cacheSize.value = '0 MB'
}

// 跳转设置
const goToSettings = () => {
  uni.showToast({
    title: '设置功能开发中',
    icon: 'none'
  })
}

// 清理缓存
const clearCache = () => {
  uni.showModal({
    title: '清理缓存',
    content: '确定要清理缓存吗？',
    success: (res) => {
      if (res.confirm) {
        uni.showToast({
          title: '缓存已清理',
          icon: 'success'
        })
        cacheSize.value = '0 MB'
      }
    }
  })
}

// 关于我们
const showAbout = () => {
  uni.showModal({
    title: '关于我们',
    content: `河图洛书 - 沉浸式内容管理工具\n\n版本：v${appVersion}\n开发团队：河图洛书团队`,
    showCancel: false
  })
}

// 退出登录
const handleLogout = () => {
  uni.showModal({
    title: '提示',
    content: '确定要退出登录吗？',
    success: (res) => {
      if (res.confirm) {
        userStore.logout()
      }
    }
  })
}

// 页面加载
onMounted(() => {
  getCacheSize()
})
</script>

<style scoped>
.profile-page {
  min-height: 100vh;
  background: #f5f5f5;
}

/* 自定义导航栏 */
.custom-navbar {
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  height: 88rpx;
  padding-top: constant(safe-area-inset-top);
  padding-top: env(safe-area-inset-top);
  background: rgba(255, 255, 255, 0.95);
  backdrop-filter: blur(20rpx);
  -webkit-backdrop-filter: blur(20rpx);
  z-index: 999;
  display: flex;
  align-items: center;
  justify-content: center;
  border-bottom: 1rpx solid rgba(0, 0, 0, 0.08);
}

.navbar-title {
  font-size: 36rpx;
  font-weight: 600;
  color: #333333;
  letter-spacing: 2rpx;
}

/* 滚动容器 */
.profile-scroll {
  height: 100vh;
  padding-top: calc(88rpx + constant(safe-area-inset-top));
  padding-top: calc(88rpx + env(safe-area-inset-top));
}

/* 用户信息卡片 */
.user-card {
  margin: 40rpx 30rpx;
  padding: 60rpx 40rpx;
  background: linear-gradient(135deg, rgba(0, 196, 179, 0.08) 0%, rgba(102, 126, 234, 0.08) 100%);
  border-radius: 24rpx;
  display: flex;
  flex-direction: column;
  align-items: center;
  border: 1rpx solid rgba(0, 0, 0, 0.08);
}

.user-avatar {
  width: 160rpx;
  height: 160rpx;
  margin-bottom: 24rpx;
}

.avatar-img {
  width: 100%;
  height: 100%;
  border-radius: 80rpx;
}

.avatar-placeholder {
  width: 100%;
  height: 100%;
  border-radius: 80rpx;
  background: linear-gradient(135deg, #00c4b3 0%, #667eea 100%);
  display: flex;
  align-items: center;
  justify-content: center;
}

.avatar-text {
  font-size: 64rpx;
  font-weight: 600;
  color: #ffffff;
}

.user-nickname {
  font-size: 36rpx;
  font-weight: 600;
  color: #333333;
  margin-bottom: 12rpx;
}

.user-id {
  font-size: 24rpx;
  color: #999999;
}

/* 功能列表 */
.menu-section {
  margin: 20rpx 30rpx;
  background: #ffffff;
  border-radius: 20rpx;
  overflow: hidden;
}

.menu-item {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 36rpx 30rpx;
  border-bottom: 1rpx solid rgba(0, 0, 0, 0.08);
  transition: background 0.2s ease;
}

.menu-item:last-child {
  border-bottom: none;
}

.menu-item:active {
  background: rgba(0, 0, 0, 0.03);
}

.menu-left {
  display: flex;
  align-items: center;
}

.menu-icon {
  font-size: 40rpx;
  margin-right: 20rpx;
}

.menu-text {
  font-size: 30rpx;
  color: #333333;
}

.menu-right {
  display: flex;
  align-items: center;
}

.menu-info {
  font-size: 26rpx;
  color: #999999;
  margin-right: 12rpx;
}

.menu-arrow {
  font-size: 48rpx;
  color: #cccccc;
  font-weight: 300;
  line-height: 1;
}

/* 退出登录 */
.logout-section {
  margin: 40rpx 30rpx;
}

.logout-btn {
  padding: 32rpx;
  background: rgba(255, 59, 48, 0.1);
  border: 1rpx solid rgba(255, 59, 48, 0.3);
  border-radius: 16rpx;
  text-align: center;
  transition: all 0.2s ease;
}

.logout-btn:active {
  background: rgba(255, 59, 48, 0.2);
}

.logout-text {
  font-size: 30rpx;
  color: #ff3b30;
  font-weight: 500;
}

/* 版本信息 */
.version-info {
  padding: 40rpx;
  text-align: center;
}

.version-text {
  font-size: 24rpx;
  color: #cccccc;
}

/* 底部占位 */
.bottom-placeholder {
  height: 120rpx;
}
</style>
