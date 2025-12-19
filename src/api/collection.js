import http from './request'

// 收藏相关API
export const collectionApi = {
  // 分页查询收藏列表
  getCollectionList(params) {
    return http.post('/user-collection/page', params)
  },

  // 获取收藏详情
  getCollectionById(id) {
    return http.get(`/user-collection/${id}`)
  },

  // 添加收藏
  addCollection(data) {
    return http.post('/user-collection/create', data)
  },

  // 更新收藏
  updateCollection(id, data) {
    return http.put(`/user-collection/${id}`, data)
  },

  // 取消收藏
  deleteCollection(id) {
    return http.delete(`/user-collection/${id}`)
  }
}

export default collectionApi
