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
