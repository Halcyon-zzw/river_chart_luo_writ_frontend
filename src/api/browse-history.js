import http from './request'

// 浏览历史相关API
const browseHistoryApi = {
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
  // contentType: 'image' | 'note'
  clearAllBrowseHistory(contentType) {
    return http.delete('/browse-history/clear', { contentType })
  },

  // 获取时间范围类型列表
  listTimeRangeTypeList() {
    return http.get('/browse-history/listTimeRangeTypeList')
  }
}

export { browseHistoryApi }
export default browseHistoryApi
