// 全局配置文件
export const config = {
  // 应用版本号
  VERSION: '1.1.0',

  // API基础地址
  // 注意：微信小程序真机调试要求HTTPS，且验证SSL证书有效性
  // 开发工具调试：使用本地地址
  // API_BASE_URL: 'http://localhost:8080',
  // API_BASE_URL: 'http://10.10.21.35:8080',
    API_BASE_URL: 'http://10.10.10.176:8080',


  // API_BASE_URL: 'https://10.10.10.176:8443',

  // 真机调试：使用 ngrok 提供的 HTTPS 地址（替换为你的实际地址）
  // API_BASE_URL: 'https://abc123-456-789.ngrok-free.app',  // 👈 修改这里

  // 分页配置
  PAGE_SIZE: 20,

  // 图片配置
  IMAGE_MAX_SIZE: 10 * 1024 * 1024, // 10MB
  IMAGE_MAX_COUNT: 9, // 最多上传9张

  // 本地存储key
  STORAGE_KEYS: {
    USER_ID: 'userId',
    USER_INFO: 'userInfo',
    TOKEN: 'token'
  },

  // 内容类型
  CONTENT_TYPE: {
    IMAGE: 'image',
    NOTE: 'note'
  },

  // Tab栏索引
  TAB_INDEX: {
    RECENT: 0,
    BROWSE: 1,
    COLLECTION: 2,
    PROFILE: 3
  }
}

export default config
