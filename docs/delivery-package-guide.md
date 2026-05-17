# 交付包目录说明

本文档用于说明正式商业交付时，建议如何组织源码包、发布包、文档包与素材包，方便客户、实施与售后统一理解。

## 1. 推荐交付方式

建议把交付内容分成 4 类：

1. 源码包
2. 发布包
3. 文档包
4. 素材包

这样做的好处是：

- 客户更容易理解每个包的用途
- 部署与运维资料不会和源码混在一起
- 售后和二开接手更清晰

## 2. 源码包

适合：

- 客户自有技术团队接手
- 后续需要持续二次开发
- 需要审阅完整代码

建议包含：

- `flower-shop-backend-java/`
- `flower-shop-web/`
- `flower-shop-mini/`
- `shared/`
- `ops/`
- `docs/`
- `logo/`
- 根目录脚本与配置模板

建议命名：

```text
FloralWhisperTime-source-v1.0.0.zip
```

## 3. 发布包

适合：

- 客户服务器不方便拉 Git
- 只需要部署，不直接看源码
- 由实施或售后执行安装、升级和回滚

建议使用系统已有 release 包方式生成。

建议包含：

- `docker-compose.release.yml`
- 后端镜像 tar
- Web 镜像 tar
- release 安装、升级、回滚、巡检脚本
- `.env.production.example`
- `RELEASE_NOTES.md`
- `DELIVERY_CHECKLIST.md`

建议命名：

```text
FloralWhisperTime-release-v1.0.0.tar.gz
```

## 4. 文档包

适合：

- 单独交给客户阅读
- 给实施、售后、运维留档
- 做交付签收附件

建议包含：

- 客户交付快速开始
- 安装手册
- 部署前后巡检清单
- 后台操作手册
- 售后排障手册
- 运维 SOP 手册
- 客户验收清单
- 商业交付说明
- 版本发布说明

建议命名：

```text
FloralWhisperTime-docs-v1.0.0.zip
```

## 5. 素材包

适合：

- 客户需替换正式图片与品牌内容
- 设计、运营和实施协同

建议包含：

- 品牌 Logo
- 首页轮播图
- 登录页轮播图
- 联系页图片
- 品牌故事配图
- About 页首图
- 团队成员头像

建议命名：

```text
FloralWhisperTime-assets-v1.0.0.zip
```

## 6. 推荐交付目录结构

建议最终交付时整理成：

```text
delivery/
  source/
    FloralWhisperTime-source-v1.0.0.zip
  release/
    FloralWhisperTime-release-v1.0.0.tar.gz
  docs/
    FloralWhisperTime-docs-v1.0.0.zip
  assets/
    FloralWhisperTime-assets-v1.0.0.zip
  records/
    acceptance-checklist.pdf
    release-notes.pdf
```

## 7. 最低交付建议

如果客户不需要源码，最低建议至少交付：

- 发布包
- 文档包
- 素材包
- 账号与环境配置说明

如果客户需要二开，建议额外交付：

- 源码包
- 数据字典
- 接口文档
- 接口调用示例

## 8. 交付时建议额外附带的信息

建议在交付邮件、消息或交付单中额外注明：

- 当前版本号
- 当前 git 提交号
- 当前部署方式
- 默认访问地址
- 默认管理员初始化方式
- 是否启用 AI
- 是否为干净数据库交付

## 9. 常见误区

### 9.1 只给源码不给文档

不建议。商业交付时，文档和源码同样重要。

### 9.2 只给发布包不说明配置

不建议。至少要同时给环境变量模板和安装说明。

### 9.3 素材散落在聊天记录里

不建议。最好统一打包，便于后续查找和替换。

## 10. 建议配合阅读

- [最终交付清单模板](./templates/final-delivery-checklist-template.md)
- [客户验收清单](./customer-acceptance-checklist.md)
- [商业交付说明](./commercial-delivery.md)
