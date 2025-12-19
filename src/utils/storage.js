// 本地存储工具封装
export const storage = {
  // 设置存储
  set(key, value) {
    try {
      const data = JSON.stringify(value)
      uni.setStorageSync(key, data)
      return true
    } catch (e) {
      console.error('Storage set error:', e)
      return false
    }
  },

  // 获取存储
  get(key, defaultValue = null) {
    try {
      const data = uni.getStorageSync(key)
      return data ? JSON.parse(data) : defaultValue
    } catch (e) {
      console.error('Storage get error:', e)
      return defaultValue
    }
  },

  // 删除存储
  remove(key) {
    try {
      uni.removeStorageSync(key)
      return true
    } catch (e) {
      console.error('Storage remove error:', e)
      return false
    }
  },

  // 清空存储
  clear() {
    try {
      uni.clearStorageSync()
      return true
    } catch (e) {
      console.error('Storage clear error:', e)
      return false
    }
  }
}

export default storage
