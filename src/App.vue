<script setup>
import { onLaunch, onShow, onHide } from '@dcloudio/uni-app'
import { useUserStore } from '@/store/user'
import { useCollectionStore } from '@/store/collection'

const userStore = useUserStore()
const collectionStore = useCollectionStore()

// 应用启动
onLaunch(async () => {
  console.log('App Launch')

  // 初始化用户登录
  await initUser()

  // 加载收藏列表
  if (userStore.hasLogin) {
    collectionStore.loadCollections()
  }
})

// 应用显示
onShow(() => {
  console.log('App Show')
})

// 应用隐藏
onHide(() => {
  console.log('App Hide')
})

// 初始化用户
const initUser = async () => {
  try {
    // 检查是否已登录
    if (userStore.hasLogin) {
      console.log('User already logged in:', userStore.userId)
      // 刷新用户信息
      await userStore.getUserInfo()
      return
    }

    // 调用登录接口获取用户ID
    console.log('Calling user login...')
    const result = await userStore.login({
      // 可以传入设备信息等参数
      deviceId: getDeviceId()
    })

    if (result.success) {
      console.log('User login success:', result.userId)
    } else {
      console.error('User login failed:', result.error)
      // 登录失败提示
      uni.showToast({
        title: '登录失败，请重试',
        icon: 'none',
        duration: 2000
      })
    }
  } catch (error) {
    console.error('Init user error:', error)
  }
}

// 获取设备ID（简化版，实际可使用更复杂的逻辑）
const getDeviceId = () => {
  let deviceId = uni.getStorageSync('deviceId')
  if (!deviceId) {
    // 生成随机设备ID
    deviceId = 'device_' + Date.now() + '_' + Math.random().toString(36).substr(2, 9)
    uni.setStorageSync('deviceId', deviceId)
  }
  return deviceId
}
</script>

<style>
/* 全局样式 */
page {
  background-color: #121212;
  color: #ffffff;
}

/* 滚动条样式 */
::-webkit-scrollbar {
  width: 0;
  height: 0;
  background: transparent;
}

/* 全局字体 */
* {
  font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', 'PingFang SC', 'Hiragino Sans GB',
    'Microsoft YaHei', 'Helvetica Neue', Helvetica, Arial, sans-serif;
}

/* 禁用默认的点击高亮 */
* {
  -webkit-tap-highlight-color: transparent;
}
</style>
