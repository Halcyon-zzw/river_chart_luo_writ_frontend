import config from '@/utils/config'

// 全局 userInfo 对象，用于存储登录后的用户信息
let globalUserInfo = null

// 设置全局 userInfo（login 成功后调用）
export const setGlobalUserInfo = (userInfo) => {
  globalUserInfo = userInfo
  console.log('[Request] Global userInfo set:', userInfo ? 'Success' : 'Cleared')
}

// 获取全局 userInfo
export const getGlobalUserInfo = () => {
  return globalUserInfo
}

// 请求拦截器
const requestInterceptor = (options) => {
  // 优先从全局对象获取 token（login 后设置）
  let token = globalUserInfo?.token

  // 如果全局对象没有，尝试从 localStorage 读取（兼容小程序刷新后的情况）
  if (!token) {
    try {
      const userStoreData = uni.getStorageSync('user-store')
      if (userStoreData) {
        const storeState = typeof userStoreData === 'string' ? JSON.parse(userStoreData) : userStoreData
        token = storeState.userInfo?.token

        // 同时恢复全局对象
        if (token) {
          globalUserInfo = storeState.userInfo
          console.log('[Request] Token restored from storage')
        }
      }
    } catch (error) {
      console.error('[Request] Get token from storage error:', error)
    }
  }

  // 添加自定义客户端标识请求头
  options.header = {
    ...options.header,
    'X-Client-Type': 'RiverChartLuoWrit-MiniProgram',
    'X-Client-Version': '1.0.0',
    'ngrok-skip-browser-warning': '1'
  }

  // 添加 token 到请求头
  if (token) {
    options.header = {
      ...options.header,
      'Authorization': `Bearer ${token}`
    }
    console.log('[Request] Authorization header added:', `Bearer ${token.substring(0, 20)}...`)
  } else {
    console.warn('[Request] No token available')
  }

  // 显示加载提示
  if (options.showLoading !== false) {
    uni.showLoading({
      title: '加载中...',
      mask: true
    })
  }

  return options
}

// 响应拦截器
const responseInterceptor = (response, options) => {
  // 隐藏加载提示
  if (options.showLoading !== false) {
    uni.hideLoading()
  }

  const { statusCode, data } = response

  // HTTP状态码判断
  if (statusCode !== 200) {
    uni.showToast({
      title: `请求失败: ${statusCode}`,
      icon: 'none',
      duration: 2000
    })
    throw new Error(`HTTP ${statusCode}`)
  }

  // 业务状态码判断（根据后端实际返回结构调整）
  if (data.code !== undefined && data.code !== 200 && data.code !== 0) {
    uni.showToast({
      title: data.message || '操作失败',
      icon: 'none',
      duration: 2000
    })
    throw new Error(data.message || '操作失败')
  }

  return data
}

// 错误处理
const errorHandler = (error, options) => {
  // 隐藏加载提示
  if (options.showLoading !== false) {
    uni.hideLoading()
  }

  console.error('Request error:', error)

  uni.showToast({
    title: error.errMsg || '网络请求失败',
    icon: 'none',
    duration: 2000
  })

  return Promise.reject(error)
}

// 封装请求方法
const request = (options) => {
  // 默认配置
  const defaultOptions = {
    url: '',
    method: 'GET',
    data: {},
    header: {
      'Content-Type': 'application/json'
    },
    timeout: 10000,
    showLoading: true
  }

  // 合并配置
  options = { ...defaultOptions, ...options }

  // 拼接完整URL
  if (!options.url.startsWith('http')) {
    options.url = config.API_BASE_URL + options.url
  }

  // 请求拦截
  options = requestInterceptor(options)

  return new Promise((resolve, reject) => {
    uni.request({
      ...options,
      success: (res) => {
        try {
          const result = responseInterceptor(res, options)
          resolve(result)
        } catch (error) {
          reject(error)
        }
      },
      fail: (err) => {
        errorHandler(err, options)
        reject(err)
      }
    })
  })
}

// 便捷方法
export const http = {
  get(url, data = {}, options = {}) {
    return request({
      url,
      method: 'GET',
      data,
      ...options
    })
  },

  post(url, data = {}, options = {}) {
    return request({
      url,
      method: 'POST',
      data,
      ...options
    })
  },

  put(url, data = {}, options = {}) {
    return request({
      url,
      method: 'PUT',
      data,
      ...options
    })
  },

  delete(url, data = {}, options = {}) {
    return request({
      url,
      method: 'DELETE',
      data,
      ...options
    })
  },

  // 文件上传
  upload(url, filePath, name = 'file', formData = {}, options = {}) {
    return new Promise((resolve, reject) => {
      // 显示加载提示
      if (options.showLoading !== false) {
        uni.showLoading({
          title: '上传中...',
          mask: true
        })
      }

      // 准备请求头，添加自定义客户端标识
      const header = {
        'X-Client-Type': 'RiverChartLuoWrit-MiniProgram',
        'X-Client-Version': '1.0.0',
        'ngrok-skip-browser-warning': '1'
      }

      // 优先从全局对象获取 token
      let token = globalUserInfo?.token

      // 如果全局对象没有，尝试从 localStorage 读取
      if (!token) {
        try {
          const userStoreData = uni.getStorageSync('user-store')
          if (userStoreData) {
            const storeState = typeof userStoreData === 'string' ? JSON.parse(userStoreData) : userStoreData
            token = storeState.userInfo?.token

            // 同时恢复全局对象
            if (token) {
              globalUserInfo = storeState.userInfo
              console.log('[Upload] Token restored from storage')
            }
          }
        } catch (error) {
          console.error('[Upload] Get token from storage error:', error)
        }
      }

      // 添加 token 到请求头
      if (token) {
        header['Authorization'] = `Bearer ${token}`
        console.log('[Upload] Authorization header added:', `Bearer ${token.substring(0, 20)}...`)
      } else {
        console.warn('[Upload] No token available')
      }

      uni.uploadFile({
        url: config.API_BASE_URL + url,
        filePath,
        name,
        formData,
        header,
        success: (res) => {
          if (options.showLoading !== false) {
            uni.hideLoading()
          }

          if (res.statusCode === 200) {
            try {
              const data = JSON.parse(res.data)
              resolve(data)
            } catch (e) {
              resolve(res.data)
            }
          } else {
            uni.showToast({
              title: '上传失败',
              icon: 'none'
            })
            reject(res)
          }
        },
        fail: (err) => {
          if (options.showLoading !== false) {
            uni.hideLoading()
          }
          uni.showToast({
            title: '上传失败',
            icon: 'none'
          })
          reject(err)
        }
      })
    })
  }
}

export default http
