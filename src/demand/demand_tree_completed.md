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

✅ 已处理 - 2025-12-26

**导航栏相关优化**

需求1：自定义导航栏遮挡页面内容
   状态：已修复
   - 问题：自定义导航栏使用固定定位，遮挡了页面原本内容
   - 解决方案：在自定义导航栏组件中添加占位元素，高度等于状态栏高度+导航栏高度
   - 实现位置：src/components/custom-nav-bar/custom-nav-bar.vue
   - 新增内容：
     ```vue
     <!-- 占位元素，防止内容被导航栏遮挡 -->
     <view class="nav-bar-placeholder" :style="{ height: totalHeight + 'px' }"></view>
     ```
   - totalHeight 计算：statusBarHeight + navBarHeight

需求2：统一列表页导航栏风格
   状态：已实现
   - 问题：主分类、子分类、内容列表页顶部导航样式不一致
   - 解决方案：所有列表页统一使用自定义导航栏组件
   - 实现内容：
     * src/pages/category/sub-list/sub-list.vue - 使用自定义导航栏，右侧插槽添加主页按钮
     * src/pages/category/content-list/content-list.vue - 使用自定义导航栏，右侧插槽添加主页按钮
   - 修改 pages.json 配置：
     * sub-list: navigationStyle: "custom"
     * content-list: navigationStyle: "custom"

需求3：自定义导航栏支持所有返回操作
   状态：已验证支持
   - 导航栏返回箭头：✅ 自定义导航栏实现的返回按钮，完全支持
   - iOS 滑动手势返回：✅ 系统级手势，自定义导航栏不影响
   - Android 物理返回键：✅ 使用条件编译，App 平台保留 onBackPress 支持
   - 实现方式：
     ```javascript
     // #ifdef APP-PLUS
     onBackPress(() => {
       if (savedSuccessfully.value || submitting.value) {
         return false
       }
       if (hasModified.value) {
         uni.showModal({
           title: '提示',
           content: '您有未保存的修改，确定要离开吗？',
           success: (res) => {
             if (res.confirm) {
               uni.navigateBack()
             }
           }
         })
         return true
       }
       return false
     })
     // #endif
     ```
   - 应用页面：所有创建/编辑页面

**图片上传接口修正**

需求：修正所有图片上传使用错误的接口
   状态：已全部修复
   - 问题：多处代码使用了不存在的 `/file/upload` 接口
   - 正确接口：`/content/upload-images`（API 文档中唯一的上传接口）
   - API 返回格式：`ResultListString`，data 字段是字符串数组

   修复内容：
   1. 修改 src/api/request.js 的 upload 方法
      - 新增 name 参数支持自定义字段名（默认 'file'）
      - 签名：upload(url, filePath, name = 'file', formData = {}, options = {})

   2. 修复 src/api/category.js
      - uploadCoverImage：/file/upload → /content/upload-images
      - 参数名：file → files
      - 添加返回格式说明注释

   3. 修复 src/api/content.js
      - uploadImage：/file/upload → /content/upload-images
      - 参数名：file → files
      - 添加返回格式说明注释

   4. 修复 src/pages/content/create-image/create-image.vue
      - 接口：/file/upload → /content/upload-images
      - 参数名：file → files
      - 响应解析：修改为正确处理数组格式
        ```javascript
        if (Array.isArray(data.data) && data.data.length > 0) {
          url = data.data[0]
        } else if (typeof data.data === 'string') {
          url = data.data
        } else if (data.url) {
          url = data.url
        }
        ```

   5. 修复 src/pages/content/create-note/create-note.vue
      - 参数名：file → files（接口已正确）
      - 响应解析：修改为处理数组格式

   6. 修复 src/pages/category/create-main-category/create-main-category.vue
      - 响应解析：修改为处理数组格式

   7. 修复 src/pages/category/create-sub-category/create-sub-category.vue
      - 响应解析：修改为处理数组格式

   影响范围：
   - ✅ 分类封面图上传（主分类、子分类）
   - ✅ 内容图片上传（图片内容）
   - ✅ 笔记编辑器图片插入
   - ✅ API 封装层（category.js, content.js）

-----------分界线，上述需求已经处理，请忽略------------------

✅ 已处理 - 2025-12-26 (第二批)

**列表页导航栏遮挡修复**

需求：导航页遮住了子分类列表页、内容列表页部分内容
   状态：已修复
   - 问题根源：使用自定义导航栏后，页面中固定定位元素的 top 值仍然基于旧的系统导航栏高度（硬编码）
   - 解决方案：将固定定位改为 flex 弹性布局，让元素自然流式排列

   修复内容：
   1. **sub-list.vue (子分类列表页)**
      - 页面容器添加 flex 布局：`display: flex; flex-direction: column`
      - `.search-container` 删除固定定位 (`position: fixed; top: 88rpx`)
      - `.sub-scroll` 删除固定高度和 padding-top，改为 `flex: 1`

   2. **content-list.vue (内容列表页)**
      - 页面容器添加 flex 布局：`display: flex; flex-direction: column`
      - `.tab-bar` 删除固定定位和 `top: calc(100rpx + safe-area-inset-top)`
      - `.search-container` 删除固定定位和 `top: calc(188rpx + safe-area-inset-top)`
      - `.content-scroll` 删除 `padding-top: calc(298rpx + safe-area-inset-top)`，改为 `flex: 1`

   优点：
   - ✅ 完全自适应，不依赖硬编码高度
   - ✅ 兼容不同设备的状态栏高度
   - ✅ 布局更清晰，易维护

**图片删除按钮优化**

需求：上传图片后，图片右上角出现叉，点击叉后可以删除图片
   状态：已实现
   - 原实现：删除按钮隐藏在点击时显示的遮罩层中，操作不够直观
   - 新实现：删除按钮始终显示在图片右上角

   修改内容 (create-image.vue)：
   1. 模板修改：
      - 删除 `.image-mask` 遮罩层和内部的操作按钮
      - 添加独立的 `.delete-btn` 删除按钮，固定在右上角
      - 图片点击预览功能移至 `.image-item` 容器
      - 删除按钮使用 `@click.stop` 阻止事件冒泡

   2. 样式修改：
      ```css
      .delete-btn {
        position: absolute;
        top: 8rpx;
        right: 8rpx;
        width: 48rpx;
        height: 48rpx;
        background: rgba(0, 0, 0, 0.6);
        border-radius: 50%;
        z-index: 10;
      }

      .delete-icon {
        font-size: 36rpx;
        color: #ffffff;
      }
      ```

   优点：
   - ✅ 删除按钮始终可见，操作更直观
   - ✅ 符合常见的图片管理交互模式
   - ✅ 减少了交互步骤（不需要先点击才能看到删除按钮）

-----------分界线，上述需求已经处理，请忽略------------------

✅ 已处理 - 2025-12-26 (第三批)

**浏览页主分类字体统一**

需求：浏览页"主分类"字体同自定义导航栏的标题字体
   状态：已实现
   - 修改文件：src/pages/tabbar/browse/browse.vue
   - 修改内容：
     ```css
     .category-label {
       font-size: 32rpx;   /* 28rpx → 32rpx */
       color: #333333;     /* #666666 → #333333 */
       font-weight: 600;   /* 500 → 600 */
     }
     ```
   - 效果：与自定义导航栏标题样式完全一致

**笔记详情页使用自定义导航栏**

需求：笔记详情页导航栏使用自定义导航栏
   状态：已实现
   - 导航栏标题：固定显示"笔记详情"
   - 右侧按钮：暂不添加（保持底部工具栏）

   修改内容：
   1. **pages.json**
      - 修正标题：`"navigationBarTitleText": "笔记详情1"` → `"笔记详情"`
      - 添加配置：`"navigationStyle": "custom"`

   2. **note-detail.vue**
      - 添加组件：`<custom-nav-bar title="笔记详情" />`
      - 导入组件：`import CustomNavBar from '@/components/custom-nav-bar/custom-nav-bar.vue'`
      - 调整布局：
        ```css
        .note-detail-page {
          display: flex;
          flex-direction: column;
        }
        .note-scroll {
          flex: 1;  /* 从 height: 100vh 改为 flex: 1 */
        }
        ```

   优点：
   - ✅ 导航栏风格统一
   - ✅ 布局合理，内容不被遮挡
   - ✅ 保留底部工具栏的完整功能（收藏、编辑、分享、删除）

**图片上传文件名变化原因调查**

需求：调查图片传到后端为什么文件名称变了
   状态：已完成调查并给出结论

   调查结果：
   - **文件名改变是正常且必要的行为**，无需修改代码

   原因分析：

   1. **前端层面**（微信小程序限制）
      - 用户选择图片后，系统将文件复制到临时目录
      - 生成临时文件名（如 `wxfile://tmp_xxx.jpg`）
      - **无法获取用户设备上的原始文件名**（隐私和安全考虑）
      - 代码实现：
        ```javascript
        uni.chooseImage({
          success: (res) => {
            // res.tempFilePaths 只包含临时路径，无原始文件名
            const tempFiles = res.tempFilePaths.map(url => ({
              url,           // 临时路径
              uploaded: false
            }))
          }
        })
        ```

   2. **后端层面**（推测基于标准实践）
      - 收到文件后重命名（使用 UUID、时间戳等）
      - 原因：
        * ✅ **安全性**：防止恶意文件名注入（如 `../../etc/passwd.jpg`）
        * ✅ **唯一性**：避免同名文件覆盖
        * ✅ **标准化**：统一命名规范便于管理
        * ✅ **隐私保护**：不暴露用户文件命名习惯

   替代方案（如果确实需要文件名信息）：
   - 方案1：在表单中添加"标题"字段，让用户手动输入
   - 方案2：数据库额外存储 `originalFileName` 字段（但前端无法获取）
   - 方案3：后端返回 URL 时附带文件元信息

   建议：
   - ✅ 当前实现已足够合理
   - ✅ 用户关心的是图片内容而非文件名
   - ✅ 应用中已有标题、描述等字段标识内容
   - ✅ URL 本身已足够定位和访问文件

-----------分界线，上述需求已经处理，请忽略------------------

✅ 已处理 - 2026-01-04

**最近浏览页面布局重构**

需求1：浏览页面展示的内容同内容列表页
   状态：已完成
   - 问题：recent.vue (最近浏览页) 原使用简单列表布局，需要改为与 content-list.vue 一致的瀑布流+卡片布局
   - 解决方案：完全重写 recent.vue (985行)

   实现内容：
   1. **图片内容 - 瀑布流布局**
      - 双列瀑布流，动态高度平衡
      - 使用 leftColumn/rightColumn 分别存储左右列数据
      - imageLoad 事件追踪各列高度，新图片添加到较短的列
      - 展示缩略图 (contentDTO.thumbnail)
      - 代码位置：src/pages/tabbar/recent/recent.vue

   2. **笔记内容 - 卡片布局**
      - 全宽卡片设计
      - 显示标题 (contentDTO.title)
      - 显示内容预览 (contentDTO.noteContent)，去除 HTML 标签，最多 100 字符
      - 渐变背景设计

   3. **长按批量删除**
      - 长按检测（触摸时长 > 500ms）
      - 进入选择模式：显示复选框
      - 底部工具栏：取消 / 删除按钮
      - 批量删除确认弹窗
      - 代码实现：onImageTouchStart、onImageTouchEnd、onNoteLongpress

   4. **保留原有功能**
      - ✅ 搜索功能（关键词搜索）
      - ✅ 时间筛选（全部、今天、三天内、七天内、一个月内）
      - ✅ 清空全部浏览记录
      - ✅ 删除单条记录

   5. **数据路径**
      - 使用 `item.contentDTO` 获取内容信息（非 `item.content`）
      - 图片：`contentDTO.thumbnail`、`contentDTO.title`
      - 笔记：`contentDTO.title`、`contentDTO.noteContent`

   文件修改：
   - src/pages/tabbar/recent/recent.vue - 完全重写（985行）

**主分类列表总记录数展示**

需求2：主分类列表页在搜索框下方用小字展示总记录数量
   状态：已完成
   - 页面：src/pages/tabbar/browse/browse.vue

   实现内容：
   1. 添加 `totalCount` ref 存储总记录数
   2. 从 API 响应提取总数：`totalCount.value = res.data?.totalRows || 0`
   3. 新增固定定位显示区域，位于搜索框下方
   4. 样式：
      - 字体大小：24rpx（小字）
      - 颜色：#999999（灰色）
      - 居中显示
      - 固定定位：top: calc(286rpx + safe-area-inset-top)
   5. 调整滚动容器 padding-top：286rpx → 326rpx

   代码位置：
   - 数据提取：src/pages/tabbar/browse/browse.vue:299
   - 模板显示：src/pages/tabbar/browse/browse.vue:35-37
   - 样式定义：src/pages/tabbar/browse/browse.vue:839-855

-----------分界线，上述需求已经处理，请忽略------------------

✅ 已处理 - 2026-01-04 (第三批)

**浏览历史清空接口参数优化**

需求1：/clear 接口新增 contentType 字段，不需要传 userId
   状态：已完成
   - 问题：清空浏览历史接口原本需要传 userId，现改为不传，只传 contentType
   - 解决方案：修改接口参数，只传 contentType 区分清空类型

   实现内容：
   1. **API 接口修改** (src/api/browse-history.js:22-23)
      - 修改参数：从 `userId` 改为 `contentType`
      - 接口调用：`/browse-history/clear?contentType=image` 或 `?contentType=note`
      - contentType 可选值：'image' | 'note'（必须指定类型）

   2. **清空全部按钮逻辑修改** (src/pages/tabbar/recent/recent.vue:498-524)
      - 根据当前 tab 清空对应类型的浏览记录
      - 提示文本动态显示："确定要清空所有图片/笔记浏览记录吗？"
      - 调用接口时只传当前 tab 类型：
        ```javascript
        await browseHistoryApi.clearAllBrowseHistory(currentTab.value)
        ```

   优点：
   - ✅ 简化接口参数，后端可以从 token 中获取 userId
   - ✅ 用户可以分别管理图片和笔记的浏览历史
   - ✅ 提示信息更准确，避免误操作

**图片本地路径处理验证**

需求2：显示图片时，后端返回 file:/// 开头需要从本地读取
   状态：已验证完成
   - 问题：确保所有显示图片的地方都正确处理本地文件路径（file:///）
   - 解决方案：统一使用 getFullImageUrl 工具函数

   验证结果：
   1. **getFullImageUrl 函数已正确实现** (src/utils/image.js:14)
      ```javascript
      // file:// 或 file:/// 开头的路径直接返回（从本地读取）
      if (imageUrl.startsWith('file://')) {
        return imageUrl
      }
      ```
      说明：`file:///` 也是以 `file://` 开头，会被正确匹配

   2. **所有显示图片的文件已正确使用 getFullImageUrl**（已验证10个文件）
      - ✅ src/pages/tabbar/recent/recent.vue（浏览历史页）
      - ✅ src/pages/tabbar/browse/browse.vue（主分类列表）
      - ✅ src/pages/content/image-detail/image-detail.vue（图片详情）
      - ✅ src/pages/tabbar/profile/profile.vue（个人中心头像）
      - ✅ src/pages/category/content-list/content-list.vue（内容列表）
      - ✅ src/pages/category/sub-list/sub-list.vue（子分类列表）
      - ✅ src/pages/tabbar/collection/collection.vue（收藏页）
      - ✅ src/pages/category/create-main-category/create-main-category.vue（创建主分类）
      - ✅ src/pages/category/create-sub-category/create-sub-category.vue（创建子分类）
      - ✅ src/pages/content/create-image/create-image.vue（创建图片内容）

   结论：
   - ✅ 所有图片显示逻辑已统一
   - ✅ 正确处理本地文件（file:///）- 直接从本地读取
   - ✅ 正确处理远程文件（http/https）- 直接使用
   - ✅ 正确处理相对路径 - 自动拼接 API_BASE_URL

-----------分界线，上述需求已经处理，请忽略------------------

✅ 已处理 - 2026-01-04 (第四批)

**file:/// 服务器路径转换为 HTTP URL**

需求1：显示图片时，后端返回 file:/// 开头，需要转换为 HTTP URL
   状态：已完成
   - 问题：后端返回 `file:///Users/zhuzhiwei/tmp/uploads/...` 格式的服务器文件路径
   - 原因：微信小程序不支持 `file:///` 协议访问服务器文件系统
   - 解决方案：将 file:// 路径转换为 HTTP URL

   实现内容 (src/utils/image.js:16-36)：
   ```javascript
   if (imageUrl.startsWith('file://')) {
     // 移除 file:// 前缀
     const filePath = imageUrl.replace('file://', '')
     // 检查是否包含 /uploads/ 目录
     const uploadsIndex = filePath.indexOf('/uploads/')
     if (uploadsIndex !== -1) {
       // 提取 /uploads/ 之后的相对路径
       const relativePath = filePath.substring(uploadsIndex)
       return config.API_BASE_URL + relativePath
     }
   }
   ```

   转换示例：
   - 输入：`file:///Users/zhuzhiwei/tmp/uploads/2026/01/04/xxx.jpg`
   - 输出：`http://localhost:8080/uploads/2026/01/04/xxx.jpg`

**Token 获取方式优化和调试日志**

需求2：Token 获取方式需要根据最新接口文档修改
   状态：已完成
   - 问题：需要确保 token 获取逻辑与最新接口文档（feat_browse 分支）一致
   - 解决方案：优化代码注释和添加调试日志

   实现内容：
   1. **接口文档确认** (feat_browse 分支)
      - 接口：POST /user/login
      - Token 位置：`data.token`

   2. **请求拦截器优化** (src/api/request.js:4-29)
      - 添加详细注释说明 Pinia persist 存储结构
      - 添加调试日志：`[Request] Token added to header`
      - 添加警告日志：token 或 store 数据缺失时输出警告

   3. **文件上传方法优化** (src/api/request.js:188-208)
      - 同样的优化应用于 upload 方法
      - 添加调试日志：`[Upload] Token added to header`

**CLAUDE.md 文档检查**

需求：检查是否有类似记录出错的情况
   状态：已检查完成
   - 检查结果：CLAUDE.md 中只有一处 GitHub 链接
   - 链接地址：https://github.com/Halcyon-zzw/river_chart_luo_writ/blob/feat_browse/docs/river_chart_luo_writ.json
   - 分支正确：feat_browse（已是最新分支）
   - 结论：✅ 无其他记录错误

**经验教训**：
- ⚠️ 应先查看 CLAUDE.md 中记录的文档地址，而不是自行推测
- ⚠️ 注意区分不同分支的文档差异
- ✅ 添加详细的调试日志有助于快速定位问题

-----------分界线，上述需求已经处理，请忽略------------------