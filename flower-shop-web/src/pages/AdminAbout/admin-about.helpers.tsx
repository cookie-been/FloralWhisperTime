import { Button, Popconfirm, Space, Tag } from "antd";
import type { ColumnsType } from "antd/es/table";
import type { AboutPageContent, AboutTimelineEntry, TeamMember } from "@/types";

export const emptyAboutPage: AboutPageContent = {
  heroImage: "",
  heroEyebrow: "",
  heroTitle: "",
  heroSubtitle: "",
  storyTitle: "",
  storyContent: "",
};

export const emptyTimeline: AboutTimelineEntry = {
  id: "",
  yearLabel: "",
  content: "",
  sort: 0,
};

export const emptyMember: TeamMember = {
  id: "",
  name: "",
  title: "",
  avatar: "",
  bio: "",
  sort: 0,
};

export function sortTimelineEntries(timeline: AboutTimelineEntry[]) {
  return [...timeline].sort((left, right) => left.sort - right.sort || left.yearLabel.localeCompare(right.yearLabel, "zh-CN"));
}

export function sortTeamMembers(teamMembers: TeamMember[]) {
  return [...teamMembers].sort((left, right) => right.sort - left.sort || left.name.localeCompare(right.name, "zh-CN"));
}

export function buildAdminAboutMetrics(
  timelineCount: number,
  teamMemberCount: number,
  heroImage: string,
  storyContent: string,
) {
  return [
    { label: "时间轴条目", value: timelineCount, note: "建议维持 3-6 条，表达清晰的品牌发展节点" },
    { label: "团队成员", value: teamMemberCount, note: "支持头像、职务与简介维护" },
    { label: "首屏状态", value: heroImage ? "已配置" : "待配置", note: "关于页首图会直接影响第一屏质感" },
    { label: "故事长度", value: `${storyContent.trim().length} 字`, note: "建议控制在 120-300 字之间，方便前台阅读" },
  ];
}

interface TimelineColumnsOptions {
  deletedFilter: "active" | "deleted";
  onEdit: (record: AboutTimelineEntry) => void;
  onDelete: (id: string) => void;
  onRestore: (id: string) => void;
}

export function buildTimelineColumns({
  deletedFilter,
  onEdit,
  onDelete,
  onRestore,
}: TimelineColumnsOptions): ColumnsType<AboutTimelineEntry> {
  return [
    {
      title: "年份",
      dataIndex: "yearLabel",
      width: 120,
      render: (value: string) => <Tag color="green">{value}</Tag>,
    },
    {
      title: "内容",
      dataIndex: "content",
      render: (value: string) => <p className="m-0 leading-7 text-[#33463a]">{value}</p>,
    },
    {
      title: "排序",
      dataIndex: "sort",
      width: 100,
    },
    {
      title: "操作",
      key: "actions",
      width: 180,
      render: (_value, record) => (
        <Space>
          {deletedFilter === "active" ? (
            <>
              <Button className="admin-action-button" size="small" onClick={() => onEdit(record)}>
                编辑
              </Button>
              <Popconfirm title="确认删除这条时间轴记录？" okText="删除" cancelText="取消" onConfirm={() => onDelete(record.id)}>
                <Button className="admin-action-button" size="small" danger>
                  删除
                </Button>
              </Popconfirm>
            </>
          ) : (
            <Button className="admin-action-button" size="small" type="primary" onClick={() => onRestore(record.id)}>
              恢复
            </Button>
          )}
        </Space>
      ),
    },
  ];
}

interface MemberColumnsOptions {
  deletedFilter: "active" | "deleted";
  onEdit: (record: TeamMember) => void;
  onDelete: (id: string) => void;
  onRestore: (id: string) => void;
}

export function buildMemberColumns({
  deletedFilter,
  onEdit,
  onDelete,
  onRestore,
}: MemberColumnsOptions): ColumnsType<TeamMember> {
  return [
    {
      title: "头像",
      dataIndex: "avatar",
      width: 92,
      render: (avatar: string, record) =>
        avatar ? (
          <img src={avatar} alt={record.name} className="h-14 w-14 rounded-lg object-cover" />
        ) : (
          <div className="h-14 w-14 rounded-lg bg-[#f1ede8]" />
        ),
    },
    {
      title: "成员信息",
      key: "member",
      render: (_value, record) => (
        <div>
          <p className="m-0 font-semibold text-[#1b281e]">{record.name}</p>
          <p className="mt-1 text-sm text-muted">{record.title}</p>
          <p className="admin-cell-note line-clamp-3">{record.bio || "暂无成员简介"}</p>
        </div>
      ),
    },
    {
      title: "排序",
      dataIndex: "sort",
      width: 100,
    },
    {
      title: "操作",
      key: "actions",
      width: 190,
      render: (_value, record) => (
        <Space>
          {deletedFilter === "active" ? (
            <>
              <Button className="admin-action-button" size="small" onClick={() => onEdit(record)}>
                编辑
              </Button>
              <Popconfirm title="确认删除这位团队成员？" okText="删除" cancelText="取消" onConfirm={() => onDelete(record.id)}>
                <Button className="admin-action-button" size="small" danger>
                  删除
                </Button>
              </Popconfirm>
            </>
          ) : (
            <Button className="admin-action-button" size="small" type="primary" onClick={() => onRestore(record.id)}>
              恢复
            </Button>
          )}
        </Space>
      ),
    },
  ];
}
