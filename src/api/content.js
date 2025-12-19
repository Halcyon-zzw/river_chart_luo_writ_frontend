import http from './request'

// 内容相关API
export const contentApi = {
  // 分页查询内容列表
  getContentList(params) {
    return http.get('/content/page', params)
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

  // 批量上传图片
  uploadImages(files) {
    return http.post('/content/upload-images', files, {
      header: {
        'Content-Type': 'multipart/form-data'
      }
    })
  },

  // 获取内容关联的标签
  getContentTags(id) {
    return http.get(`/content/${id}/tags`)
  }
}

export default contentApi
