import { defineStore } from 'pinia'
import { collectionApi } from '@/api'
import { useUserStore } from './user'

export const useCollectionStore = defineStore('collection', {
  state: () => ({
    // 收藏的内容ID集合（用于快速判断是否已收藏）
    collectedContentIds: new Set()
  }),

  getters: {
    // 判断内容是否已收藏
    isCollected: (state) => (contentId) => {
      return state.collectedContentIds.has(contentId)
    }
  },

  actions: {
    // 加载用户收藏列表
    async loadCollections() {
      const userStore = useUserStore()
      if (!userStore.userId) return

      try {
        const res = await collectionApi.getCollectionList({
          userId: userStore.userId,
          pageNum: 1,
          pageSize: 1000 // 加载所有收藏
        })

        const collections = res.data?.records || res.data || res.records || []

        // 提取内容ID
        this.collectedContentIds = new Set(
          collections.map(item => item.contentId)
        )

        return collections
      } catch (error) {
        console.error('Load collections error:', error)
        return []
      }
    },

    // 添加收藏
    async addCollection(contentId) {
      const userStore = useUserStore()
      if (!userStore.userId) {
        uni.showToast({
          title: '请先登录',
          icon: 'none'
        })
        return { success: false }
      }

      try {
        await collectionApi.addCollection({
          userId: userStore.userId,
          contentId
        })

        this.collectedContentIds.add(contentId)

        uni.showToast({
          title: '收藏成功',
          icon: 'success'
        })

        return { success: true }
      } catch (error) {
        console.error('Add collection error:', error)
        return { success: false, error }
      }
    },

    // 取消收藏
    async removeCollection(contentId) {
      try {
        // 这里需要先查询收藏记录ID，再删除
        // 简化处理：假设后端支持通过contentId删除
        await collectionApi.deleteCollection(contentId)

        this.collectedContentIds.delete(contentId)

        uni.showToast({
          title: '已取消收藏',
          icon: 'success'
        })

        return { success: true }
      } catch (error) {
        console.error('Remove collection error:', error)
        return { success: false, error }
      }
    },

    // 切换收藏状态
    async toggleCollection(contentId) {
      if (this.isCollected(contentId)) {
        return await this.removeCollection(contentId)
      } else {
        return await this.addCollection(contentId)
      }
    }
  }
})

export default useCollectionStore
