import http from './request'

// 分类相关API
export const categoryApi = {
  // ========== 主分类 ==========
  // 分页查询主分类列表
  getMainCategories(params) {
    return http.post('/main-category/page', params)
  },

  // 获取主分类详情
  getMainCategoryById(id) {
    return http.get(`/main-category/${id}`)
  },

  // 创建主分类
  createMainCategory(data) {
    return http.post('/main-category/create', data)
  },

  // 更新主分类
  updateMainCategory(id, data) {
    return http.put(`/main-category/${id}`, data)
  },

  // 删除主分类
  deleteMainCategory(id) {
    return http.delete(`/main-category/${id}`)
  },

  // 获取主分类关联的标签
  getMainCategoryTags(id) {
    return http.post(`/main-category/${id}/tags`)
  },

  // ========== 子分类 ==========
  // 分页查询子分类列表
  getSubCategories(params) {
    return http.post('/sub-category/page', params)
  },

  // 获取子分类详情
  getSubCategoryById(id) {
    return http.get(`/sub-category/${id}`)
  },

  // 创建子分类
  createSubCategory(data) {
    return http.post('/sub-category/create', data)
  },

  // 更新子分类
  updateSubCategory(id, data) {
    return http.put(`/sub-category/${id}`, data)
  },

  // 删除子分类
  deleteSubCategory(id) {
    return http.delete(`/sub-category/${id}`)
  },

  // 获取子分类关联的标签
  getSubCategoryTags(id) {
    return http.post(`/sub-category/${id}/tags`)
  }
}

export default categoryApi
