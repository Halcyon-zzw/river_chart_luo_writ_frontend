/**
 * TabBar 图标配置
 * 集中管理 TabBar 图标路径，方便切换主题和维护
 */

export const tabbarIcons = {
  // 最近
  recent: {
    normal: '/static/tabbar/recent.png',
    active: '/static/tabbar/recent-active.png',
    text: '最近'
  },
  // 浏览
  browse: {
    normal: '/static/tabbar/browse.png',
    active: '/static/tabbar/browse-active.png',
    text: '浏览'
  },
  // 收藏
  collection: {
    normal: '/static/tabbar/collection.png',
    active: '/static/tabbar/collection-active.png',
    text: '收藏'
  },
  // 我的
  profile: {
    normal: '/static/tabbar/profile.png',
    active: '/static/tabbar/profile-active.png',
    text: '我的'
  }
}

/**
 * 获取 TabBar 配置
 * @param {string} theme - 主题名称，默认 'default'
 * @returns {Array} TabBar 配置数组
 */
export function getTabBarConfig(theme = 'default') {
  const basePath = theme === 'default' ? '/static/tabbar' : `/static/tabbar/${theme}`

  return [
    {
      pagePath: 'pages/tabbar/recent/recent',
      iconPath: tabbarIcons.recent.normal,
      selectedIconPath: tabbarIcons.recent.active,
      text: tabbarIcons.recent.text
    },
    {
      pagePath: 'pages/tabbar/browse/browse',
      iconPath: tabbarIcons.browse.normal,
      selectedIconPath: tabbarIcons.browse.active,
      text: tabbarIcons.browse.text
    },
    {
      pagePath: 'pages/tabbar/collection/collection',
      iconPath: tabbarIcons.collection.normal,
      selectedIconPath: tabbarIcons.collection.active,
      text: tabbarIcons.collection.text
    },
    {
      pagePath: 'pages/tabbar/profile/profile',
      iconPath: tabbarIcons.profile.normal,
      selectedIconPath: tabbarIcons.profile.active,
      text: tabbarIcons.profile.text
    }
  ]
}

export default tabbarIcons
