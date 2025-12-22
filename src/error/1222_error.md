http://localhost:8080/main-category/page正确返回数据，但是也没没有展示数据。请参考http://localhost:8080/swagger-ui/index.html检查所有使用到的接口，响应结果使用格式时候正确。
{"code":200,"message":"操作成功","traceId":"61b1a04d667845f0","data":{"pageNo":1,"pageNum":1,"pageSize":20,"pageType":null,"pageTypeDesc":null,"totalPage":0,"totalRows":0,"rows":[{"id":4,"name":"测试0925","description":"","thumbnailUrl":null,"tagDTOList":null,"sortOrder":0,"isDeleted":0,"createdTime":"2025-12-22T09:25:21","updatedTime":"2025-12-22T09:25:21"},{"id":3,"name":"测试","description":"","thumbnailUrl":null,"tagDTOList":null,"sortOrder":0,"isDeleted":0,"createdTime":"2025-12-22T09:23:28","updatedTime":"2025-12-22T09:23:28"},{"id":2,"name":"测试分类2","description":"","thumbnailUrl":null,"tagDTOList":null,"sortOrder":0,"isDeleted":0,"createdTime":"2025-12-19T18:17:48","updatedTime":"2025-12-19T18:17:48"},{"id":1,"name":"测试分类","description":"","thumbnailUrl":null,"tagDTOList":null,"sortOrder":0,"isDeleted":0,"createdTime":"2025-12-19T18:17:16","updatedTime":"2025-12-19T18:17:16"}],"rainbow":[]},"timestamp":1766367213267,"success":true}

-----------分界线，上述问题已经处理，请忽略------------------
点击主分类卡片，跳转的逻辑有问题。
请按照下列逻辑重新调整：
点击主分类卡片，跳转到子分类页面。
点击子分类卡片，跳转到内容页面，顶部“图片”、“文本”tab页。子分页页面为空是，点击“创建”直接进入创建子分类页面。

-----------分界线，上述问题已经处理，请忽略------------------
子分类不需要“图片”、“文本”tab
创建子分类后，应该刷新分页页面。（你是一个合格的产品经理了，以后这种低级的交互逻辑请自己优化。）
子分类存在数据时，点击“创建”也直接进入创建子分类页面。

你又做了什么，现在“浏览”页面又不展示数据了。看日志没有调分页接口。请不要再犯这种低级错误。
-----------分界线，上述问题已经处理，请忽略------------------
图片上传接口报错，请对照接口文档检查
你又做了什么，现在“浏览”页面又不展示数据了。看日志没有调分页接口。请不要再犯这种低级错误。已经是第二次出现相同问题了，请后续需要再出现
-----------分界线，上述问题已经处理，请忽略------------------
1、创建图片内容、文本内容时，子分类不需要选择，默认当前分类，且不可编辑。创建接口与接口文档字段不一致，如没有传title，请检查其他接口是否有类似问题。
2、查看接口文档，主分类分页查询、子分类分页查询新增对应的数量字段，请优化。

-----------分界线，上述问题已经处理，请忽略------------------
1、查看接口文档，主分类分页查询、子分类分页查询新增对应的数量字段，如主分类分类新增subCategorySize，子分类分页新增contentSize

-----------分界线，上述问题已经处理，请忽略------------------


现在“浏览”页面又不展示数据了。看日志没有调分页接口。为什么反反复复出现？这到底是什么问题 

