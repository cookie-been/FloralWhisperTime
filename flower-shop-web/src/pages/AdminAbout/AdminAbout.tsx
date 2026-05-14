import { useEffect, useMemo, useState } from "react";
import {
  Button,
  Drawer,
  Empty,
  Form,
  Grid,
  Image,
  Input,
  InputNumber,
  Popconfirm,
  Space,
  Spin,
  Table,
  Tag,
  Upload,
  message,
} from "antd";
import type { ColumnsType } from "antd/es/table";
import type { RcFile } from "antd/es/upload";
import { BookOpenText, ImagePlus, Plus, Sparkles } from "lucide-react";
import {
  createAdminAboutTimeline,
  createAdminTeamMember,
  deleteAdminAboutTimeline,
  deleteAdminTeamMember,
  getAdminAboutPage,
  getAdminAboutTimeline,
  getAdminTeamMembers,
  updateAdminAboutPage,
  updateAdminAboutTimeline,
  updateAdminTeamMember,
  uploadFlowerImage,
} from "@/services/api";
import type { AboutPageContent, AboutTimelineEntry, TeamMember } from "@/types";

interface AdminAboutProps {
  embedded?: boolean;
}

type TeamMemberForm = TeamMember;
type TimelineForm = AboutTimelineEntry;

const emptyAboutPage: AboutPageContent = {
  heroImage: "",
  heroEyebrow: "",
  heroTitle: "",
  heroSubtitle: "",
  storyTitle: "",
  storyContent: "",
};

const emptyTimeline: TimelineForm = {
  id: "",
  yearLabel: "",
  content: "",
  sort: 0,
};

const emptyMember: TeamMemberForm = {
  id: "",
  name: "",
  title: "",
  avatar: "",
  bio: "",
  sort: 0,
};

export function AdminAbout({ embedded = false }: AdminAboutProps) {
  const screens = Grid.useBreakpoint();
  const [aboutForm] = Form.useForm<AboutPageContent>();
  const [timelineForm] = Form.useForm<TimelineForm>();
  const [memberForm] = Form.useForm<TeamMemberForm>();
  const [loading, setLoading] = useState(true);
  const [savingAbout, setSavingAbout] = useState(false);
  const [savingTimeline, setSavingTimeline] = useState(false);
  const [savingMember, setSavingMember] = useState(false);
  const [uploadingHero, setUploadingHero] = useState(false);
  const [uploadingAvatar, setUploadingAvatar] = useState(false);
  const [timeline, setTimeline] = useState<AboutTimelineEntry[]>([]);
  const [teamMembers, setTeamMembers] = useState<TeamMember[]>([]);
  const [timelineDrawerOpen, setTimelineDrawerOpen] = useState(false);
  const [memberDrawerOpen, setMemberDrawerOpen] = useState(false);
  const [editingTimeline, setEditingTimeline] = useState<AboutTimelineEntry | null>(null);
  const [editingMember, setEditingMember] = useState<TeamMember | null>(null);

  const heroImage = Form.useWatch("heroImage", aboutForm) ?? "";
  const heroEyebrow = Form.useWatch("heroEyebrow", aboutForm) ?? "";
  const heroTitle = Form.useWatch("heroTitle", aboutForm) ?? "";
  const heroSubtitle = Form.useWatch("heroSubtitle", aboutForm) ?? "";
  const storyTitle = Form.useWatch("storyTitle", aboutForm) ?? "";
  const storyContent = Form.useWatch("storyContent", aboutForm) ?? "";
  const memberAvatar = Form.useWatch("avatar", memberForm) ?? "";

  const sortedTimeline = useMemo(
    () => [...timeline].sort((left, right) => left.sort - right.sort || left.yearLabel.localeCompare(right.yearLabel, "zh-CN")),
    [timeline],
  );
  const sortedMembers = useMemo(
    () => [...teamMembers].sort((left, right) => right.sort - left.sort || left.name.localeCompare(right.name, "zh-CN")),
    [teamMembers],
  );

  const metrics = useMemo(
    () => [
      { label: "时间轴条目", value: timeline.length, note: "建议维持 3-6 条，表达清晰的品牌发展节点" },
      { label: "团队成员", value: teamMembers.length, note: "支持头像、职务与简介维护" },
      { label: "首屏状态", value: heroImage ? "已配置" : "待配置", note: "关于页首图会直接影响第一屏质感" },
      { label: "故事长度", value: `${storyContent.trim().length} 字`, note: "建议控制在 120-300 字之间，方便前台阅读" },
    ],
    [heroImage, storyContent, teamMembers.length, timeline.length],
  );

  const load = async () => {
    setLoading(true);
    try {
      const [aboutPage, aboutTimeline, adminTeamMembers] = await Promise.all([
        getAdminAboutPage(),
        getAdminAboutTimeline(),
        getAdminTeamMembers(),
      ]);
      aboutForm.setFieldsValue(aboutPage);
      setTimeline(aboutTimeline);
      setTeamMembers(adminTeamMembers);
    } catch (error) {
      message.error(error instanceof Error ? error.message : "关于页数据加载失败");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    load().catch(() => undefined);
  }, []);

  const saveAbout = async () => {
    if (savingAbout) return;
    const values = await aboutForm.validateFields();
    setSavingAbout(true);
    try {
      const result = await updateAdminAboutPage(values);
      aboutForm.setFieldsValue(result);
      message.success("关于页内容已保存");
    } catch (error) {
      message.error(error instanceof Error ? error.message : "保存失败");
    } finally {
      setSavingAbout(false);
    }
  };

  const handleHeroUpload = async (file: RcFile) => {
    if (uploadingHero) return false;
    setUploadingHero(true);
    try {
      const result = await uploadFlowerImage(file);
      aboutForm.setFieldValue("heroImage", result.url);
      message.success("关于页首图已上传");
    } catch (error) {
      message.error(error instanceof Error ? error.message : "上传失败");
    } finally {
      setUploadingHero(false);
    }
    return false;
  };

  const handleAvatarUpload = async (file: RcFile) => {
    if (uploadingAvatar) return false;
    setUploadingAvatar(true);
    try {
      const result = await uploadFlowerImage(file);
      memberForm.setFieldValue("avatar", result.url);
      message.success("团队头像已上传");
    } catch (error) {
      message.error(error instanceof Error ? error.message : "上传失败");
    } finally {
      setUploadingAvatar(false);
    }
    return false;
  };

  const openCreateTimeline = () => {
    setEditingTimeline(null);
    timelineForm.setFieldsValue({
      ...emptyTimeline,
      sort: timeline.length,
    });
    setTimelineDrawerOpen(true);
  };

  const openEditTimeline = (record: AboutTimelineEntry) => {
    setEditingTimeline(record);
    timelineForm.setFieldsValue(record);
    setTimelineDrawerOpen(true);
  };

  const closeTimelineDrawer = () => {
    setTimelineDrawerOpen(false);
    setEditingTimeline(null);
    timelineForm.resetFields();
  };

  const saveTimeline = async () => {
    if (savingTimeline) return;
    const values = await timelineForm.validateFields();
    setSavingTimeline(true);
    try {
      if (editingTimeline) {
        await updateAdminAboutTimeline(editingTimeline.id, {
          yearLabel: values.yearLabel,
          content: values.content,
          sort: Number(values.sort),
        });
        message.success("时间轴条目已更新");
      } else {
        await createAdminAboutTimeline({
          id: values.id?.trim() || undefined,
          yearLabel: values.yearLabel,
          content: values.content,
          sort: Number(values.sort),
        });
        message.success("时间轴条目已新增");
      }
      closeTimelineDrawer();
      await load();
    } catch (error) {
      message.error(error instanceof Error ? error.message : "保存失败");
    } finally {
      setSavingTimeline(false);
    }
  };

  const removeTimeline = async (id: string) => {
    try {
      await deleteAdminAboutTimeline(id);
      message.success("时间轴条目已删除");
      await load();
    } catch (error) {
      message.error(error instanceof Error ? error.message : "删除失败");
    }
  };

  const openCreateMember = () => {
    setEditingMember(null);
    memberForm.setFieldsValue({
      ...emptyMember,
      sort: teamMembers.length,
    });
    setMemberDrawerOpen(true);
  };

  const openEditMember = (record: TeamMember) => {
    setEditingMember(record);
    memberForm.setFieldsValue(record);
    setMemberDrawerOpen(true);
  };

  const closeMemberDrawer = () => {
    setMemberDrawerOpen(false);
    setEditingMember(null);
    memberForm.resetFields();
  };

  const saveMember = async () => {
    if (savingMember) return;
    const values = await memberForm.validateFields();
    setSavingMember(true);
    try {
      const payload: TeamMember = {
        id: values.id?.trim() ?? "",
        name: values.name,
        title: values.title,
        avatar: values.avatar,
        bio: values.bio?.trim() ?? "",
        sort: Number(values.sort),
      };
      if (editingMember) {
        await updateAdminTeamMember(editingMember.id, payload);
        message.success("团队成员已更新");
      } else {
        await createAdminTeamMember(payload);
        message.success("团队成员已新增");
      }
      closeMemberDrawer();
      await load();
    } catch (error) {
      message.error(error instanceof Error ? error.message : "保存失败");
    } finally {
      setSavingMember(false);
    }
  };

  const removeMember = async (id: string) => {
    try {
      await deleteAdminTeamMember(id);
      message.success("团队成员已删除");
      await load();
    } catch (error) {
      message.error(error instanceof Error ? error.message : "删除失败");
    }
  };

  const timelineColumns: ColumnsType<AboutTimelineEntry> = [
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
          <Button className="admin-action-button" size="small" onClick={() => openEditTimeline(record)}>
            编辑
          </Button>
          <Popconfirm title="确认删除这条时间轴记录？" okText="删除" cancelText="取消" onConfirm={() => void removeTimeline(record.id)}>
            <Button className="admin-action-button" size="small" danger>
              删除
            </Button>
          </Popconfirm>
        </Space>
      ),
    },
  ];

  const memberColumns: ColumnsType<TeamMember> = [
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
          <Button className="admin-action-button" size="small" onClick={() => openEditMember(record)}>
            编辑
          </Button>
          <Popconfirm title="确认删除这位团队成员？" okText="删除" cancelText="取消" onConfirm={() => void removeMember(record.id)}>
            <Button className="admin-action-button" size="small" danger>
              删除
            </Button>
          </Popconfirm>
        </Space>
      ),
    },
  ];

  if (loading) {
    return (
      <div className="flex min-h-[45vh] items-center justify-center">
        <Spin size="large" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <section className="grid gap-4 xl:grid-cols-2 2xl:grid-cols-4">
        {metrics.map((item) => (
          <div key={item.label} className="admin-stat-card p-5">
            <p className="text-sm font-medium text-muted">{item.label}</p>
            <p className="mt-3 text-3xl font-semibold text-[#1b281e]">{item.value}</p>
            <p className="mt-2 text-sm leading-6 text-muted">{item.note}</p>
          </div>
        ))}
      </section>

      {embedded ? null : (
        <section className="admin-toolbar p-5">
          <div className="flex flex-wrap items-start justify-between gap-4">
            <div>
              <p className="section-eyebrow">关于页工作区</p>
              <h3 className="admin-section-title mt-2 text-xl">关于页内容工作台</h3>
              <p className="mt-2 text-sm leading-6 text-muted">统一维护页首图、标题副标题、品牌故事、发展时间轴和团队成员，前台 About 页面会实时读取这里的数据结构。</p>
            </div>
            <Button type="primary" size="large" loading={savingAbout} onClick={() => void saveAbout()} block={!screens.sm}>
              保存页首与故事
            </Button>
          </div>
        </section>
      )}

      <section className="grid gap-6 xl:grid-cols-[1.12fr_0.88fr]">
        <div className="admin-panel p-5">
          <div className="flex items-center gap-2 text-sm font-semibold text-[#1b281e]">
            <Sparkles size={16} className="text-forest" />
            页首图与品牌故事
          </div>
          <Form form={aboutForm} layout="vertical" className="mt-4">
            <div className="grid gap-x-4 md:grid-cols-2">
              <Form.Item name="heroEyebrow" label="页首小标语" rules={[{ required: true, message: "请输入页首小标语" }]}>
                <Input />
              </Form.Item>
              <Form.Item name="heroTitle" label="页首标题" rules={[{ required: true, message: "请输入页首标题" }]}>
                <Input />
              </Form.Item>
            </div>
            <Form.Item name="heroSubtitle" label="页首副标题" rules={[{ required: true, message: "请输入页首副标题" }]}>
              <Input.TextArea rows={3} />
            </Form.Item>
            <Form.Item label="页首背景图">
              <div className="space-y-3">
                <Form.Item name="heroImage" noStyle rules={[{ required: true, message: "请上传或填写页首背景图" }]}>
                  <Input placeholder="可直接粘贴图片 URL，或使用上传按钮" />
                </Form.Item>
                <Upload beforeUpload={handleHeroUpload} showUploadList={false} accept="image/*">
                  <Button loading={uploadingHero} icon={<ImagePlus size={16} />}>
                    上传背景图
                  </Button>
                </Upload>
              </div>
            </Form.Item>
            <Form.Item name="storyTitle" label="故事标题" rules={[{ required: true, message: "请输入故事标题" }]}>
              <Input />
            </Form.Item>
            <Form.Item name="storyContent" label="故事正文" rules={[{ required: true, message: "请输入故事正文" }]}>
              <Input.TextArea rows={7} />
            </Form.Item>
          </Form>
        </div>

        <div className="space-y-6">
          <div className="admin-panel overflow-hidden p-0">
            <div className="relative min-h-[420px] bg-[#f1ece5]">
              {heroImage ? <img src={heroImage} alt="" className="h-[420px] w-full object-cover" /> : <div className="flex h-[420px] items-center justify-center text-muted">暂无关于页首图</div>}
              <div className="absolute inset-0 bg-[linear-gradient(180deg,rgba(17,27,20,0.12),rgba(17,27,20,0.72))]" />
              <div className="absolute inset-x-0 bottom-0 px-6 py-6 text-white">
                <p className="text-xs font-semibold uppercase tracking-[0.2em] text-white/74">{heroEyebrow || "关于我们页首预览"}</p>
                <p className="mt-3 text-3xl font-semibold leading-tight">{heroTitle || "关于页标题预览"}</p>
                <p className="mt-3 max-w-2xl text-sm leading-7 text-white/84">{heroSubtitle || "这里会展示前台 About 页第一屏的副标题文案。"}</p>
              </div>
            </div>
          </div>

          <div className="admin-panel p-5">
            <div className="flex items-center gap-2 text-sm font-semibold text-[#1b281e]">
              <BookOpenText size={16} className="text-forest" />
              故事预览
            </div>
            <p className="mt-3 text-xl font-semibold text-[#1b281e]">{storyTitle || "品牌故事标题预览"}</p>
            <p className="mt-3 text-sm leading-7 text-muted">{storyContent || "故事正文会在这里展示，方便在保存前检查语气和长度。"} </p>
          </div>
        </div>
      </section>

      <section className="grid gap-6 xl:grid-cols-2">
        <div className="admin-panel overflow-hidden p-0">
          <div className="flex items-center justify-between border-b border-black/6 px-5 py-4">
            <div>
              <p className="section-eyebrow">发展历程</p>
              <h3 className="admin-section-title mt-2 text-xl">发展时间轴</h3>
            </div>
            <Button type="primary" icon={<Plus size={16} />} onClick={openCreateTimeline}>
              新增节点
            </Button>
          </div>
          <Table<AboutTimelineEntry>
            rowKey="id"
            columns={timelineColumns}
            dataSource={sortedTimeline}
            pagination={false}
            locale={{
              emptyText: (
                <div className="admin-empty-state min-h-[220px]">
                  <Empty description={null} image={Empty.PRESENTED_IMAGE_SIMPLE} />
                  <h4>暂无时间轴条目</h4>
                  <p>新增 3 到 6 条关键节点后，前台 About 页面会自动展示完整时间线。</p>
                </div>
              ),
            }}
          />
        </div>

        <div className="admin-panel overflow-hidden p-0">
          <div className="flex items-center justify-between border-b border-black/6 px-5 py-4">
            <div>
              <p className="section-eyebrow">团队信息</p>
              <h3 className="admin-section-title mt-2 text-xl">团队成员</h3>
            </div>
            <Button type="primary" icon={<Plus size={16} />} onClick={openCreateMember}>
              新增成员
            </Button>
          </div>
          <Table<TeamMember>
            rowKey="id"
            columns={memberColumns}
            dataSource={sortedMembers}
            pagination={false}
            locale={{
              emptyText: (
                <div className="admin-empty-state min-h-[220px]">
                  <Empty description={null} image={Empty.PRESENTED_IMAGE_SIMPLE} />
                  <h4>暂无团队成员</h4>
                  <p>建议至少配置 2 到 4 位核心成员，保持 About 页面信息完整。</p>
                </div>
              ),
            }}
          />
        </div>
      </section>

      <Drawer
        title={editingTimeline ? "编辑时间轴节点" : "新增时间轴节点"}
        width={screens.md ? 520 : "100%"}
        open={timelineDrawerOpen}
        onClose={closeTimelineDrawer}
        destroyOnClose
        extra={
          <Space>
            <Button onClick={closeTimelineDrawer}>取消</Button>
            <Button type="primary" loading={savingTimeline} onClick={() => void saveTimeline()}>
              保存
            </Button>
          </Space>
        }
      >
        <Form form={timelineForm} layout="vertical" initialValues={emptyTimeline}>
          <Form.Item name="id" label="节点编号">
            <Input placeholder="可留空，系统会自动生成" disabled={Boolean(editingTimeline)} />
          </Form.Item>
          <Form.Item name="yearLabel" label="年份标签" rules={[{ required: true, message: "请输入年份标签" }]}>
            <Input placeholder="如 2026" />
          </Form.Item>
          <Form.Item name="content" label="节点内容" rules={[{ required: true, message: "请输入节点内容" }]}>
            <Input.TextArea rows={5} />
          </Form.Item>
          <Form.Item name="sort" label="排序值" rules={[{ required: true, message: "请输入排序值" }]}>
            <InputNumber className="w-full" />
          </Form.Item>
        </Form>
      </Drawer>

      <Drawer
        title={editingMember ? "编辑团队成员" : "新增团队成员"}
        width={screens.md ? 560 : "100%"}
        open={memberDrawerOpen}
        onClose={closeMemberDrawer}
        destroyOnClose
        extra={
          <Space>
            <Button onClick={closeMemberDrawer}>取消</Button>
            <Button type="primary" loading={savingMember} onClick={() => void saveMember()}>
              保存
            </Button>
          </Space>
        }
      >
        <Form form={memberForm} layout="vertical" initialValues={emptyMember}>
          <Form.Item name="id" label="成员编号">
            <Input placeholder="可留空，系统会自动生成" disabled={Boolean(editingMember)} />
          </Form.Item>
          <div className="grid gap-x-4 md:grid-cols-2">
            <Form.Item name="name" label="姓名" rules={[{ required: true, message: "请输入姓名" }]}>
              <Input />
            </Form.Item>
            <Form.Item name="title" label="职务" rules={[{ required: true, message: "请输入职务" }]}>
              <Input />
            </Form.Item>
          </div>
          <Form.Item label="头像">
            <div className="space-y-3">
              <Form.Item name="avatar" noStyle rules={[{ required: true, message: "请上传团队成员头像" }]}>
                <Input placeholder="可直接粘贴图片 URL，或使用上传按钮" />
              </Form.Item>
              <Upload beforeUpload={handleAvatarUpload} showUploadList={false} accept="image/*">
                <Button loading={uploadingAvatar} icon={<ImagePlus size={16} />}>
                  上传头像
                </Button>
              </Upload>
            </div>
          </Form.Item>
          {memberAvatar ? (
            <div className="admin-subpanel mb-6 flex items-center gap-4 px-4 py-4">
              <Image src={memberAvatar} alt="" width={88} height={88} className="rounded-lg object-cover" preview={false} />
              <div>
                <p className="m-0 text-sm font-semibold text-[#1b281e]">头像预览</p>
                <p className="mt-2 text-sm leading-6 text-muted">建议使用构图干净、背景统一的成员照片，方便前台团队区保持一致视觉。</p>
              </div>
            </div>
          ) : null}
          <Form.Item name="bio" label="成员简介">
            <Input.TextArea rows={5} />
          </Form.Item>
          <Form.Item name="sort" label="排序值" rules={[{ required: true, message: "请输入排序值" }]}>
            <InputNumber className="w-full" />
          </Form.Item>
        </Form>
      </Drawer>
    </div>
  );
}
