import http from './request'

// 标签相关API
export const tagApi = {
  // 查询标签列表
  queryTags(params) {
    return http.get('/tag/query', params)
  },

  // 获取标签详情
  getTagById(id) {
    return http.get(`/tag/${id}`)
  },

  // 创建标签
  createTag(data) {
    return http.post('/tag/create', data)
  },

  // 更新标签
  updateTag(id, data) {
    return http.put(`/tag/${id}`, data)
  },

  // 删除标签
  deleteTag(id) {
    return http.delete(`/tag/${id}`)
  },

  // ========== 内容标签关联 ==========
  // 创建内容标签关联
  createContentTag(data) {
    return http.post('/content-tag/create', data)
  },

  // 删除内容标签关联
  deleteContentTag(id) {
    return http.delete(`/content-tag/${id}`)
  }
}

export default tagApi
