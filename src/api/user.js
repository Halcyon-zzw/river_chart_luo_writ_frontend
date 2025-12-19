import http from './request'

// 用户相关API
export const userApi = {
  // 用户登录（获取用户ID）
  login(data) {
    return http.post('/user/login', data)
  },

  // 创建用户
  create(data) {
    return http.post('/user/create', data)
  },

  // 获取用户详情
  getById(id) {
    return http.get(`/user/${id}`)
  },

  // 更新用户信息
  update(id, data) {
    return http.put(`/user/${id}`, data)
  },

  // 删除用户
  delete(id) {
    return http.delete(`/user/${id}`)
  }
}

export default userApi
