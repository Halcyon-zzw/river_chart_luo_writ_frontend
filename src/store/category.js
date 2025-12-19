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

        this.mainCategories = res.data?.records || res.data || res.records || []
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
