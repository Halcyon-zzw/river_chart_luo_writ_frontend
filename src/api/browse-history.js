import http from './request'

// 浏览历史相关API
export const browseHistoryApi = {
  // 分页查询浏览历史
  getBrowseHistoryList(params) {
    return http.post('/browse-history/page', params)
  },

  // 创建浏览记录
  createBrowseHistory(data) {
    return http.post('/browse-history/create', data)
  },

  // 删除单条浏览记录
  deleteBrowseHistory(id) {
    return http.delete(`/browse-history/${id}`)
  },

  // 清空全部浏览记录
  clearAllBrowseHistory(userId) {
    return http.delete('/browse-history/clear', { userId })
  }
}

export default browseHistoryApi
