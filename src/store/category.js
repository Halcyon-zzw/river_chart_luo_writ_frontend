import { defineStore } from 'pinia'
import { categoryApi } from '@/api'

export const useCategoryStore = defineStore('category', {
  state: () => ({
    mainCategories: [],
    currentMainCategory: null,
    currentSubCategory: null
  }),

  actions: {
    // 加载主分类列表
    async loadMainCategories(refresh = false) {
      if (this.mainCategories.length > 0 && !refresh) {
        return this.mainCategories
      }

      try {
        const res = await categoryApi.getMainCategories({
          pageNum: 1,
          pageSize: 100 // 加载所有主分类
        })

        // 确保返回数组
        let categories = []
        if (res.data?.records && Array.isArray(res.data.records)) {
          categories = res.data.records
        } else if (res.data?.list && Array.isArray(res.data.list)) {
          categories = res.data.list
        } else if (Array.isArray(res.data)) {
          categories = res.data
        } else if (Array.isArray(res.records)) {
          categories = res.records
        } else if (Array.isArray(res)) {
          categories = res
        }

        this.mainCategories = categories.filter(item => item != null)
        return this.mainCategories
      } catch (error) {
        console.error('Load main categories error:', error)
        return []
      }
    },

    // 设置当前主分类
    setCurrentMainCategory(category) {
      this.currentMainCategory = category
    },

    // 设置当前子分类
    setCurrentSubCategory(category) {
      this.currentSubCategory = category
    },

    // 清空当前分类
    clearCurrentCategories() {
      this.currentMainCategory = null
      this.currentSubCategory = null
    }
  }
})

export default useCategoryStore
