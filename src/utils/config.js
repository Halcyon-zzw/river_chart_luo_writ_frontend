// 全局配置文件
export const config = {
  // 应用版本号
  VERSION: '1.0.0',

  // API基础地址
  API_BASE_URL: 'http://localhost:8080',

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
