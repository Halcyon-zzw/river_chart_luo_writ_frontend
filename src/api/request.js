import config from '@/utils/config'
import storage from '@/utils/storage'

// 请求拦截器
const requestInterceptor = (options) => {
  // 添加token（如果后续需要）
  const token = storage.get(config.STORAGE_KEYS.TOKEN)
  if (token) {
    options.header = {
      ...options.header,
      'Authorization': `Bearer ${token}`
    }
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

      uni.uploadFile({
        url: config.API_BASE_URL + url,
        filePath,
        name,
        formData,
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
