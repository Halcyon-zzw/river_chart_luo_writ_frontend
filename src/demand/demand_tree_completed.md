-----------分界线，上述需求已经处理，请忽略------------------

✅ 已处理 - 2025-12-25

需求1：主分类、子分类、内容相关的创建页面、编辑页面，在用户存在操作的情况下，用户退出编辑或创建应该提示用户可能会丢失操作。
   状态：已确认所有创建/编辑页面都已实现退出确认功能
   - 主分类：src/pages/category/create-main-category/create-main-category.vue:158-178
   - 子分类：src/pages/category/create-sub-category/create-sub-category.vue:206-227
   - 笔记：src/pages/content/create-note/create-note.vue:210-230
   - 图片：src/pages/content/create-image/create-image.vue:202-223

需求2：子分类编辑页面，所属主分类没有展示，应该自动加载
   状态：已实现
   - 编辑模式下自动加载并只读展示所属主分类名称
   - 实现位置：src/pages/category/create-sub-category/create-sub-category.vue:252-254

需求3：创建子分类中，所属主分类可以点击，点击展示目前有的分类（通过主分类分页接口），并支持搜索
   状态：已实现
   - 新增组件：src/components/main-category-selector/main-category-selector.vue（支持分页、搜索）
   - 集成位置：src/pages/category/create-sub-category/create-sub-category.vue
   - 创建模式：可点击选择主分类
   - 编辑模式：只读展示，禁用点击

-----------分界线，上述需求已经处理，请忽略------------------

✅ 已处理 - 2025-12-26
需求1：子分类编辑页面，所属主分类没有展示，应该展示主分类名，通过主分类id查询主分类名称
   状态：已实现
   - 如果后端返回了 mainCategoryName，直接使用
   - 如果没有返回，通过 mainCategoryId 调用 getMainCategoryById 接口查询主分类名称
   - 实现位置：src/pages/category/create-sub-category/create-sub-category.vue:269-282

需求2：新增子分类过程中，因为可以重新选择了主分类，所以创建完子分类应该调整到选择的主分类下的子分类列表
   状态：已实现
   - 创建成功后使用 redirectTo 跳转到所选主分类的子分类列表页
   - 编辑成功后保持 navigateBack 返回上一页
   - 实现位置：src/pages/category/create-sub-category/create-sub-category.vue:399-433

-----------分界线，上述需求已经处理，请忽略------------------

✅ 已处理 - 2025-12-26

需求：修复退出确认功能在微信小程序中不生效的问题

**问题根源：**
- `onBackPress` 生命周期在微信小程序中不支持（微信小程序平台限制）
- `onBackPress` 仅支持：App、H5、支付宝小程序，不支持微信小程序

**解决方案：**
使用自定义导航栏 + 自定义返回按钮实现跨平台兼容的退出确认

**实现内容：**
1. 创建自定义导航栏组件：src/components/custom-nav-bar/custom-nav-bar.vue
   - 支持自定义标题
   - 支持退出确认配置（needConfirm 属性）
   - 自动适配不同平台的状态栏高度
   - 兼容微信小程序和 App

2. 修改 pages.json 配置：
   - 主分类创建/编辑页面：navigationStyle: "custom"
   - 子分类创建/编辑页面：navigationStyle: "custom"
   - 笔记创建/编辑页面：navigationStyle: "custom"
   - 图片创建/编辑页面：navigationStyle: "custom"

3. 集成自定义导航栏到所有创建/编辑页面：
   - src/pages/category/create-main-category/create-main-category.vue
   - src/pages/category/create-sub-category/create-sub-category.vue
   - src/pages/content/create-note/create-note.vue
   - src/pages/content/create-image/create-image.vue

4. 移除不再需要的代码：
   - 删除 onBackPress 生命周期（所有页面）
   - 删除 uni.setNavigationBarTitle 调用（改由自定义导航栏处理）

**效果：**
- ✅ 微信小程序：完全支持退出确认
- ✅ App：完全支持退出确认
- ✅ 跨平台兼容

**参考资料：**
- [uni-app onBackPress 小程序 解决方案](https://blog.csdn.net/FUFCY/article/details/124927048)
- [uniapp onBackPress失效时的代替品](https://blog.csdn.net/weixin_44696269/article/details/132530484)
- [uniapp 之 onBackPress 在微信小程序中不生效的问题](https://blog.csdn.net/YZRHANYU/article/details/128141806)

参考资料使用的onUnload，为什么实现使用自定义导航栏？

-----------分界线，上述需求已经处理，请忽略------------------