# 数据字典

本文档基于当前 `flower-shop-backend-java` 的 Flyway 迁移与实体结构整理，面向开发、实施、售后和二次维护人员。

## 1. 说明

当前数据库以 MySQL 为主，核心特点：

- 业务数据存储在 MySQL
- 结构变更通过 Flyway 管理
- 部分模块已支持逻辑删除
- 后台关键写操作有操作日志与恢复链路

## 2. 核心业务表

### 2.1 `categories`

用途：

- 存储作品分类

核心字段：

- `id`：分类标识
- `name`：分类名称
- `icon`：图标
- `description`：分类说明
- `sort`：排序

### 2.2 `flowers`

用途：

- 存储作品主表

核心字段：

- `id`：作品 ID
- `name`：作品名称
- `category_id`：分类 ID
- `price`：价格
- `description`：描述
- `meaning`：寓意
- `featured`：是否精选
- `sort`：排序
- `created_at`：创建时间
- `deleted`：逻辑删除标记

说明：

- 当前作品删除采用逻辑删除
- 后台支持恢复

### 2.3 `flower_images`

用途：

- 存储作品图片列表

核心字段：

- `id`
- `flower_id`
- `image_url`
- `sort`

### 2.4 `flower_materials`

用途：

- 存储作品花材列表

核心字段：

- `id`
- `flower_id`
- `material`
- `sort`

### 2.5 `flower_tags`

用途：

- 存储作品标签

核心字段：

- `id`
- `flower_id`
- `tag`
- `sort`

## 3. 站点与内容表

### 3.1 `site_config`

用途：

- 存储站点动态配置单例

内容范围包括：

- 首页品牌文案
- 首页按钮文案
- 首页轮播图
- 品牌 Logo
- 登录页轮播图
- 联系页图片
- 前台页面展示文案
- 后台一级页面展示文案

说明：

- 当前属于核心单例配置表
- 后台站点配置页面主要写入此表

### 3.2 `shop_info`

用途：

- 存储门店基础信息

核心字段：

- `id`
- `name`
- `phone`
- `wechat`
- `address`
- `latitude`
- `longitude`

### 3.3 `shop_hours`

用途：

- 存储每周营业时间

核心字段：

- `id`
- `weekday`
- `open_time`
- `close_time`
- `off`

### 3.4 `brand_story`

用途：

- 存储品牌故事主内容

核心字段：

- `id`
- `title`
- `subtitle`
- `content`

### 3.5 `brand_story_images`

用途：

- 存储品牌故事配图

核心字段：

- `id`
- `image_url`
- `sort`

### 3.6 `about_page`

用途：

- 存储 About 页面主内容

核心字段：

- `id`
- `hero_image`
- `hero_eyebrow`
- `hero_title`
- `hero_subtitle`
- `story_title`
- `story_content`

### 3.7 `about_timeline_entries`

用途：

- 存储 About 时间轴条目

核心字段：

- `id`
- `year_label`
- `content`
- `sort`
- `deleted`

说明：

- 当前支持逻辑删除与恢复

### 3.8 `team_members`

用途：

- 存储团队成员信息

核心字段：

- `id`
- `name`
- `title`
- `avatar`
- `bio`
- `sort`
- `deleted`

说明：

- 当前支持逻辑删除与恢复

## 4. 留言与线索表

### 4.1 `contacts`

用途：

- 存储前台留言数据

核心字段：

- `id`
- `name`
- `phone`
- `message`
- `created_at`
- `read_at`
- `deleted`

说明：

- 当前支持逻辑删除与恢复
- `read_at` 用于区分已读 / 未读

## 5. 后台安全与 AI 表

### 5.1 `admin_security_state`

用途：

- 存储管理员安全状态单例

核心字段：

- `id`
- `username`
- `password_hash`
- `require_password_change`
- `password_changed_at`

说明：

- 改密后后台实际以此表状态为准
- 不应只依赖 `.env` 中的 `ADMIN_PASSWORD`

### 5.2 `ai_settings`

用途：

- 存储 AI 配置单例

核心字段：

- `id`
- `enabled`
- `provider`
- `api_key`
- `model`
- `base_url`
- `generate_path`
- 文本建议相关字段

说明：

- 后台 AI 生图配置页面主要维护此表
- 明文密钥不应在前端直接回显

## 6. 审计与运维表

### 6.1 `operation_logs`

用途：

- 存储后台写操作、登录、恢复等审计日志

核心字段：

- `id`
- `module`
- `action`
- `target_type`
- `target_id`
- `operator_name`
- `request_summary`
- `before_snapshot`
- `after_snapshot`
- `success`
- `error_message`
- `ip_address`
- `user_agent`
- `restored_from_log_id`
- `restorable`
- `created_at`

说明：

- 用于后台审计与误操作恢复
- 支持按日志详情查看恢复链路

### 6.2 `admin_ops_tasks`

用途：

- 存储运维中心触发的任务记录

核心字段：

- `id`
- `task_type`
- `task_label`
- `status`
- `trigger_source`
- `operator_name`
- `request_payload`
- `result_summary`
- `log_excerpt`
- `error_message`
- `started_at`
- `finished_at`
- `created_at`
- `updated_at`

说明：

- 当前主要记录备份和巡检任务

## 7. 历史与兼容表

### 7.1 `site_config_stats`

用途：

- 早期站点统计配置相关结构

说明：

- 当前首页统计数据已改为按真实作品数据计算
- 这类历史结构如仍保留，应视为兼容层，不再作为主要运营配置入口

## 8. 逻辑删除表汇总

当前已使用 `deleted` 字段的表：

- `flowers`
- `contacts`
- `about_timeline_entries`
- `team_members`

建议：

- 二次开发时不要把这些表重新改回物理删除
- 后台筛选、恢复和日志恢复都依赖这层结构

## 9. 关键关联关系

主要关联关系如下：

- `flowers` 1 -> N `flower_images`
- `flowers` 1 -> N `flower_materials`
- `flowers` 1 -> N `flower_tags`
- `flowers.category_id` -> `categories.id`

内容配置侧主要以单例表为主：

- `site_config`
- `shop_info`
- `brand_story`
- `about_page`
- `ai_settings`
- `admin_security_state`

## 10. 运维建议

对数据库相关维护，建议遵循：

1. 正式环境结构变更必须通过 Flyway
2. 不直接手工改核心业务数据作为常规操作
3. 优先通过后台、配置导入导出、操作日志恢复处理内容问题
4. 删除类问题优先走逻辑删除恢复
5. 升级前一定先备份数据库和上传目录

## 11. 建议配合阅读

- [系统架构](../architecture.md)
- [接口文档](../api.md)
- [升级说明](../upgrade-guide.md)
- [售后排障手册](../support-troubleshooting-manual.md)
