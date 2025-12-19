<template>
  <view class="recent-page">
    <!-- 自定义导航栏 -->
    <view class="custom-navbar">
      <view class="navbar-title">最近</view>
    </view>

    <!-- 占位内容 -->
    <view class="empty-container">
      <image
        class="empty-icon"
        src="/static/images/empty-recent.png"
        mode="aspectFit"
      ></image>
      <text class="empty-text">这里将记录你的浏览足迹</text>
      <text class="empty-tip">即将上线，敬请期待</text>
    </view>
  </view>
</template>

<script setup>
import { ref } from 'vue'

// 页面加载
const onLoad = () => {
  console.log('Recent page loaded')
}

onLoad()
</script>

<style scoped>
.recent-page {
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

/* 空状态容器 */
.empty-container {
  position: absolute;
  top: 50%;
  left: 50%;
  transform: translate(-50%, -50%);
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  padding: 0 60rpx;
}

.empty-icon {
  width: 240rpx;
  height: 240rpx;
  margin-bottom: 40rpx;
  opacity: 0.6;
}

.empty-text {
  font-size: 32rpx;
  color: #666666;
  margin-bottom: 20rpx;
  text-align: center;
  line-height: 1.6;
}

.empty-tip {
  font-size: 24rpx;
  color: #999999;
  text-align: center;
}
</style>
