import http from './request'

// 内容相关API
export const contentApi = {
  // 分页查询内容列表（必须传subCategoryId）
  getContentList(params) {
    return http.post('/content/page', params)
  },

  // 获取内容详情
  getContentById(id) {
    return http.get(`/content/${id}`)
  },

  // 创建内容
  createContent(data) {
    return http.post('/content/create', data)
  },

  // 更新内容
  updateContent(id, data) {
    return http.put(`/content/${id}`, data)
  },

  // 删除内容
  deleteContent(id) {
    return http.delete(`/content/${id}`)
  },

  // 上传单个图片（使用统一的上传接口）
  uploadImage(filePath) {
    return http.upload('/file/upload', filePath)
  },

  // 获取内容关联的标签
  getContentTags(id) {
    return http.post(`/content/${id}/tags`)
  }
}

export default contentApi
