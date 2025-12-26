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

  // 上传单个图片（使用内容图片上传接口）
  // 注意：返回格式为 ResultListString，data 是字符串数组
  uploadImage(filePath) {
    return http.upload('/content/upload-images', filePath, 'files')
  },

  // 获取内容关联的标签
  getContentTags(id) {
    return http.post(`/content/${id}/tags`)
  }
}

export default contentApi
