import { Tag } from "antd";

export function renderAdminSuccessTag(success: boolean) {
  return success ? <Tag color="success">成功</Tag> : <Tag color="error">失败</Tag>;
}

export function renderAdminReadStatusTag(readAt?: string | null) {
  return readAt ? <Tag color="default">已读</Tag> : <Tag color="green">未读</Tag>;
}

export function renderAdminPendingTag() {
  return <Tag color="green">待处理</Tag>;
}

export function renderAdminCurrentViewTag() {
  return <Tag color="processing">当前查看</Tag>;
}

export function renderAdminRestoreRecordTag() {
  return <Tag color="gold">恢复记录</Tag>;
}
