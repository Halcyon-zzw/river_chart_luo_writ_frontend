import { defineStore } from 'pinia'
import { userApi } from '@/api'
import config from '@/utils/config'
import { setGlobalUserInfo } from '@/api/request'

export const useUserStore = defineStore('user', {
  state: () => ({
    userId: null,
    userInfo: null,
    isLoggedIn: false
  }),

  getters: {
    // 是否已登录
    hasLogin: (state) => state.isLoggedIn && state.userId !== null
  },

  actions: {
    // 用户登录
    async login(loginData = {}) {
      try {
        // 如果没有传入登录数据，尝试微信登录
        if (Object.keys(loginData).length === 0) {
          console.log('[User Store] No login data provided, attempting WeChat login')

          // #ifdef MP-WEIXIN
          try {
            // 获取微信登录code
            console.log('[User Store] Calling uni.login for WeChat')
            const loginRes = await uni.login({
              provider: 'weixin'
            })

            console.log('[User Store] uni.login response:', loginRes)

            // uni.login 返回格式：[err, res] 或直接返回 res（取决于 Promise 包装）
            // 兼容两种格式
            const result = loginRes[1] || loginRes
            const code = result && result.code

            if (code) {
              console.log('[User Store] WeChat login code obtained:', code.substring(0, 10) + '...')

              // 准备登录参数
              const loginParams = {
                code: code
              }

              // 尝试获取用户信息（昵称和头像）
              // 注意：getUserInfo 已废弃，getUserProfile 需要用户点击授权
              // 这里先尝试从缓存获取，如果没有就只传 code
              try {
                const userInfoRes = await uni.getUserInfo()
                const userInfoData = userInfoRes[1] || userInfoRes
                if (userInfoData && userInfoData.userInfo) {
                  loginParams.nickName = userInfoData.userInfo.nickName
                  loginParams.avatarUrl = userInfoData.userInfo.avatarUrl
                  console.log('[User Store] User info obtained:', {
                    nickName: loginParams.nickName,
                    avatarUrl: loginParams.avatarUrl?.substring(0, 50) + '...'
                  })
                }
              } catch (userInfoError) {
                console.log('[User Store] Failed to get user info, will login with code only:', userInfoError.message || userInfoError)
              }

              // 调用微信登录接口（使用 /auth/wechat-login）
              console.log('[User Store] Calling /auth/wechat-login with params:', {
                code: code.substring(0, 10) + '...',
                nickName: loginParams.nickName || '(none)',
                avatarUrl: loginParams.avatarUrl ? loginParams.avatarUrl.substring(0, 50) + '...' : '(none)'
              })
              const res = await userApi.wechatLogin(loginParams)

              // 直接处理微信登录的返回结果
              const userData = res.data || res
              const userId = userData.id || userData.userId
              const token = userData.token

              if (userId && token) {
                this.userId = userId
                this.isLoggedIn = true
                this.userInfo = userData

                // 设置全局 userInfo
                setGlobalUserInfo(userData)

                console.log('[User Store] WeChat login success, userInfo set globally')
                console.log('[User Store] Token:', token.substring(0, 20) + '...')

                return { success: true, userId }
              } else {
                throw new Error('微信登录失败：未获取到用户ID或Token')
              }
            } else {
              console.error('[User Store] No code in login response:', loginRes)
              throw new Error('Failed to get WeChat login code')
            }
          } catch (wxError) {
            console.error('[User Store] WeChat login error:', wxError)
            return { success: false, error: wxError }
          }
          // #endif

          // #ifndef MP-WEIXIN
          // 非微信小程序环境，提示需要登录参数
          throw new Error('请提供登录参数')
          // #endif
        }

        // 使用传入的登录数据（用户名密码登录）
        const res = await userApi.login(loginData)

        // 根据后端实际返回结构调整
        const userData = res.data || res
        const userId = userData.id || userData.userId
        const token = userData.token

        if (userId && token) {
          this.userId = userId
          this.isLoggedIn = true
          // 保存完整的用户信息（包含 token）
          this.userInfo = userData

          // 设置全局 userInfo，供请求拦截器使用
          setGlobalUserInfo(userData)

          console.log('[User Store] Login success, userInfo set globally')
          console.log('[User Store] Token:', token.substring(0, 20) + '...')

          return { success: true, userId }
        } else {
          throw new Error('登录失败：未获取到用户ID或Token')
        }
      } catch (error) {
        console.error('[User Store] Login error:', error)
        return { success: false, error }
      }
    },

    // 获取用户信息
    async getUserInfo() {
      if (!this.userId) return

      try {
        const res = await userApi.getById(this.userId)
        this.userInfo = res.data || res
      } catch (error) {
        console.error('Get user info error:', error)
      }
    },

    // 更新用户信息
    async updateUserInfo(data) {
      if (!this.userId) return

      try {
        const res = await userApi.update(this.userId, data)
        this.userInfo = res.data || res
        return { success: true }
      } catch (error) {
        console.error('Update user info error:', error)
        return { success: false, error }
      }
    },

    // 退出登录
    logout() {
      this.userId = null
      this.userInfo = null
      this.isLoggedIn = false

      // 清除全局 userInfo
      setGlobalUserInfo(null)

      // 清除本地存储
      uni.removeStorageSync(config.STORAGE_KEYS.USER_ID)
      uni.removeStorageSync(config.STORAGE_KEYS.USER_INFO)
      uni.removeStorageSync(config.STORAGE_KEYS.TOKEN)

      console.log('[User Store] Logout, global userInfo cleared')

      // 跳转到登录页
      uni.reLaunch({
        url: '/pages/login/login'
      })
    },

    // 设置用户ID（用于初始化）
    setUserId(userId) {
      this.userId = userId
      this.isLoggedIn = true
    }
  },

  // 持久化配置
  persist: {
    enabled: true,
    strategies: [
      {
        key: 'user-store',
        storage: {
          getItem: (key) => uni.getStorageSync(key),
          setItem: (key, value) => uni.setStorageSync(key, value)
        }
      }
    ]
  }
})

export default useUserStore
