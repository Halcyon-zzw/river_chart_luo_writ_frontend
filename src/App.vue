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

    // 调用登录接口获取用户ID（暂时不传参数）
    console.log('Calling user login...')
    const result = await userStore.login()

    if (result.success) {
      console.log('User login success:', result.userId)
    } else {
      console.error('User login failed:', result.error)
      // 登录失败跳转到登录页
      uni.reLaunch({
        url: '/pages/login/login'
      })
    }
  } catch (error) {
    console.error('Init user error:', error)
    // 异常情况也跳转到登录页
    uni.reLaunch({
      url: '/pages/login/login'
    })
  }
}
</script>

<style>
/* 全局样式 */
page {
  background-color: #f5f5f5;
  color: #333333;
  font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', 'PingFang SC', 'Hiragino Sans GB',
    'Microsoft YaHei', 'Helvetica Neue', Helvetica, Arial, sans-serif;
}

/* 禁用默认的点击高亮 */
view,
text,
button,
image {
  -webkit-tap-highlight-color: transparent;
}
</style>
