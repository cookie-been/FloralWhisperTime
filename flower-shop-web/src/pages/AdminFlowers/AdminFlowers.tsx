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
  Select,
  Space,
  Spin,
  Switch,
  Table,
  Tag,
  Upload,
  message,
} from "antd";
import type { ColumnsType } from "antd/es/table";
import type { RcFile } from "antd/es/upload";
import { ImagePlus, Plus, Search, SlidersHorizontal, Sparkles, Star } from "lucide-react";
import { createFlower, deleteFlower, getCategories, getFlowers, updateFlower, uploadFlowerImage } from "@/services/api";
import type { Category, Flower } from "@/types";

type FlowerForm = Omit<Flower, "materials" | "tags" | "images"> & {
  images: string;
  materials: string;
  tags: string;
};

const emptyFlower: FlowerForm = {
  id: "",
  name: "",
  categoryId: "daily",
  images: "",
  price: 0,
  description: "",
  materials: "",
  meaning: "",
  tags: "",
  featured: false,
  sort: 0,
  createdAt: new Date().toISOString(),
};

const splitText = (value: string) =>
  value
    .split(/[,\n，、]/)
    .map((item) => item.trim())
    .filter(Boolean);

const joinText = (value: string[]) => value.join("，");

function toForm(flower: Flower): FlowerForm {
  return {
    ...flower,
    images: joinText(flower.images),
    materials: joinText(flower.materials),
    tags: joinText(flower.tags),
  };
}

function fromForm(values: FlowerForm): Flower {
  return {
    ...values,
    price: Number(values.price),
    sort: Number(values.sort),
    images: splitText(values.images),
    materials: splitText(values.materials),
    tags: splitText(values.tags),
    createdAt: values.createdAt || new Date().toISOString(),
  };
}

function truncateText(value: string, maxLength: number) {
  if (value.length <= maxLength) return value;
  return `${value.slice(0, maxLength).trim()}...`;
}

type FeaturedFilter = "all" | "featured" | "normal";

export function AdminFlowers() {
  const screens = Grid.useBreakpoint();
  const [form] = Form.useForm<FlowerForm>();
  const [flowers, setFlowers] = useState<Flower[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [editing, setEditing] = useState<Flower | null>(null);
  const [drawerOpen, setDrawerOpen] = useState(false);
  const [saving, setSaving] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [selectedCategory, setSelectedCategory] = useState<string>("all");
  const [featuredFilter, setFeaturedFilter] = useState<FeaturedFilter>("all");

  const watchedImages = Form.useWatch("images", form) ?? "";

  const categoryMap = useMemo(
    () => new Map(categories.filter((item) => item.id !== "all").map((item) => [item.id, item.name])),
    [categories],
  );

  const categoryOptions = useMemo(
    () => categories.filter((item) => item.id !== "all").map((item) => ({ label: item.name, value: item.id })),
    [categories],
  );

  const imagePreviewList = useMemo(() => splitText(watchedImages), [watchedImages]);
  const hasActiveFilters = Boolean(search.trim()) || selectedCategory !== "all" || featuredFilter !== "all";

  const filteredFlowers = useMemo(() => {
    const keyword = search.trim().toLowerCase();

    return flowers.filter((flower) => {
      const matchesKeyword =
        !keyword ||
        [flower.name, flower.description, flower.meaning, flower.tags.join(" "), flower.materials.join(" ")]
          .join(" ")
          .toLowerCase()
          .includes(keyword);
      const matchesCategory = selectedCategory === "all" || flower.categoryId === selectedCategory;
      const matchesFeatured =
        featuredFilter === "all" || (featuredFilter === "featured" ? flower.featured : !flower.featured);

      return matchesKeyword && matchesCategory && matchesFeatured;
    });
  }, [featuredFilter, flowers, search, selectedCategory]);

  const metrics = useMemo(
    () => [
      { label: "全部作品", value: flowers.length, note: "当前后端数据中的总作品数" },
      { label: "当前筛选结果", value: filteredFlowers.length, note: "列表中此刻可见的作品数量" },
      { label: "精选作品", value: flowers.filter((item) => item.featured).length, note: "会更容易在前台重点区域出现" },
      { label: "分类数量", value: categoryOptions.length, note: "用于前台筛选与后台内容组织" },
    ],
    [categoryOptions.length, filteredFlowers.length, flowers],
  );

  const filterSummary = useMemo(() => {
    const parts = [];
    if (search.trim()) parts.push(`关键词“${search.trim()}”`);
    if (selectedCategory !== "all") parts.push(`分类“${categoryMap.get(selectedCategory) ?? selectedCategory}”`);
    if (featuredFilter === "featured") parts.push("仅看精选");
    if (featuredFilter === "normal") parts.push("仅看普通");
    return parts;
  }, [categoryMap, featuredFilter, search, selectedCategory]);

  const load = async () => {
    setLoading(true);
    try {
      const [categoryList, flowerResult] = await Promise.all([getCategories(), getFlowers({ limit: 200 })]);
      setCategories(categoryList);
      setFlowers(flowerResult.list);
    } catch (error) {
      message.error(error instanceof Error ? error.message : "加载失败");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    load().catch(() => undefined);
  }, []);

  const startCreate = () => {
    setEditing(null);
    form.setFieldsValue({ ...emptyFlower, id: `daily_${Date.now()}` });
    setDrawerOpen(true);
  };

  const startEdit = (flower: Flower) => {
    setEditing(flower);
    form.setFieldsValue(toForm(flower));
    setDrawerOpen(true);
  };

  const closeDrawer = () => {
    setDrawerOpen(false);
    setEditing(null);
    form.resetFields();
  };

  const resetFilters = () => {
    setSearch("");
    setSelectedCategory("all");
    setFeaturedFilter("all");
  };

  const handleUpload = async (file: RcFile) => {
    if (uploading) return false;
    setUploading(true);
    try {
      const result = await uploadFlowerImage(file);
      const current = form.getFieldValue("images");
      form.setFieldValue("images", [current, result.url].filter(Boolean).join("，"));
      message.success("图片已上传");
    } catch (error) {
      message.error(error instanceof Error ? error.message : "上传失败");
    } finally {
      setUploading(false);
    }
    return false;
  };

  const save = async () => {
    if (saving) return;
    const values = await form.validateFields();
    setSaving(true);
    try {
      const flower = fromForm(values);
      if (editing) await updateFlower(editing.id, flower);
      else await createFlower(flower);
      message.success(editing ? "作品已更新" : "作品已新增");
      closeDrawer();
      await load();
    } catch (error) {
      message.error(error instanceof Error ? error.message : "保存失败");
    } finally {
      setSaving(false);
    }
  };

  const remove = async (id: string) => {
    if (saving) return;
    setSaving(true);
    try {
      await deleteFlower(id);
      message.success("作品已删除");
      if (editing?.id === id) closeDrawer();
      await load();
    } catch (error) {
      message.error(error instanceof Error ? error.message : "删除失败");
    } finally {
      setSaving(false);
    }
  };

  const columns: ColumnsType<Flower> = [
    {
      title: "封面",
      dataIndex: "images",
      width: 88,
      render: (images: string[]) =>
        images[0] ? <img src={images[0]} alt="" className="h-14 w-14 rounded-lg object-cover" /> : <div className="h-14 w-14 rounded-lg bg-[#f1ede8]" />,
    },
    {
      title: "作品",
      dataIndex: "name",
      render: (_: unknown, record) => (
        <div>
          <p className="font-semibold text-[#1b281e]">{record.name}</p>
          <p className="mt-1 text-xs text-muted">{record.id}</p>
          <p className="admin-cell-note line-clamp-2">{truncateText(record.description, 48) || "暂无作品描述"}</p>
        </div>
      ),
    },
    {
      title: "分类",
      dataIndex: "categoryId",
      width: 120,
      render: (categoryId: string) => categoryMap.get(categoryId) ?? categoryId,
    },
    {
      title: "价格",
      dataIndex: "price",
      width: 110,
      render: (price: number) => `¥${price}`,
    },
    {
      title: "标签",
      dataIndex: "tags",
      width: 220,
      render: (tags: string[]) => (
        <Space size={[4, 4]} wrap>
          {tags.slice(0, 3).map((tag) => (
            <Tag key={tag} color="green">
              {tag}
            </Tag>
          ))}
        </Space>
      ),
    },
    {
      title: "状态",
      width: 120,
      render: (_: unknown, record) => (record.featured ? <Tag color="gold">精选</Tag> : <Tag color="default">普通</Tag>),
    },
    {
      title: "排序",
      dataIndex: "sort",
      width: 90,
    },
    {
      title: "操作",
      width: 200,
      render: (_: unknown, record) => (
        <Space>
          <Button size="small" className="admin-action-button" onClick={() => startEdit(record)}>
            编辑
          </Button>
          <Popconfirm title="确认删除该作品？" onConfirm={() => remove(record.id)}>
            <Button size="small" danger className="admin-action-button">
              删除
            </Button>
          </Popconfirm>
        </Space>
      ),
    },
  ];

  return (
    <div className="space-y-6">
      <section className="grid gap-4 xl:grid-cols-4">
        {metrics.map((item) => (
            <div key={item.label} className="admin-stat-card p-5">
            <p className="text-sm font-medium text-muted">{item.label}</p>
            <p className="mt-3 text-3xl font-semibold text-[#1b281e]">{item.value}</p>
            <p className="mt-2 text-sm leading-6 text-muted">{item.note}</p>
          </div>
        ))}
      </section>

      <section className="admin-toolbar p-5">
        <div className="flex flex-wrap items-start justify-between gap-4">
          <div>
            <p className="section-eyebrow">Workspace</p>
            <h3 className="admin-section-title mt-2 text-xl">作品工作台</h3>
            <p className="mt-2 text-sm leading-6 text-muted">先筛选，再打开右侧抽屉集中编辑。保存后列表会直接刷新，不打断浏览。</p>
          </div>
          <Button type="primary" size="large" icon={<Plus size={16} />} onClick={startCreate}>
            新增作品
          </Button>
        </div>

        <div className="mt-5">
          <p className="admin-filter-caption">Filter Controls</p>
        </div>
        <div className="admin-filter-grid lg:grid-cols-[minmax(0,1.3fr)_220px_220px]">
          <Input
            size="large"
            value={search}
            onChange={(event) => setSearch(event.target.value)}
            prefix={<Search size={16} className="text-muted" />}
            placeholder="搜索作品名称、花材、标签或描述"
          />
          <Select size="large" value={selectedCategory} onChange={setSelectedCategory} options={[{ label: "全部分类", value: "all" }, ...categoryOptions]} />
          <Select
            size="large"
            value={featuredFilter}
            onChange={(value) => setFeaturedFilter(value)}
            options={[
              { label: "全部状态", value: "all" },
              { label: "仅看精选", value: "featured" },
              { label: "仅看普通", value: "normal" },
            ]}
          />
        </div>
        <div className="admin-filter-summary">
          <div className="admin-filter-summary-copy">
            <p>当前结果 {filteredFlowers.length} 条</p>
            <span>{hasActiveFilters ? `已应用 ${filterSummary.join(" · ")}` : "当前显示全部作品，可直接进入编辑。"}</span>
          </div>
          {hasActiveFilters ? (
            <Button onClick={resetFilters}>清空筛选</Button>
          ) : null}
        </div>
      </section>

      <section className="admin-panel overflow-hidden p-0">
        {loading ? (
          <div className="flex min-h-[360px] items-center justify-center">
            <Spin size="large" />
          </div>
        ) : filteredFlowers.length ? (
          <Table
            rowKey="id"
            dataSource={filteredFlowers}
            columns={columns}
            pagination={{ pageSize: 8, showSizeChanger: false }}
            rowClassName={() => "cursor-pointer"}
            onRow={(record) => ({ onClick: () => startEdit(record) })}
            scroll={{ x: 1120 }}
          />
        ) : (
          <div className="admin-empty-state">
            <Empty description={null} image={Empty.PRESENTED_IMAGE_SIMPLE} />
            <h4>当前筛选条件下没有作品</h4>
            <p>可以调整关键词、分类或精选状态，也可以直接新增一条作品内容。</p>
          </div>
        )}
      </section>

      <Drawer
        title={
          <div className="admin-drawer-title">
            <p>{editing ? "Editing Flower" : "Create Flower"}</p>
            <h3>{editing ? `编辑作品 · ${editing.name}` : "新增作品"}</h3>
            <span>{editing ? "在右侧抽屉中集中修改作品信息、图片与展示状态。" : "填写基础资料后即可创建新的前台展示作品。"}</span>
          </div>
        }
        open={drawerOpen}
        onClose={closeDrawer}
        width={screens.lg ? 720 : "100%"}
        destroyOnHidden
        extra={
          <Space>
            <Button onClick={closeDrawer}>取消</Button>
            <Button type="primary" loading={saving} onClick={save}>
              保存
            </Button>
          </Space>
        }
      >
        <Form form={form} layout="vertical" className="space-y-6">
          <div className="admin-subpanel px-4 py-4">
            <div className="flex items-center gap-2 text-sm font-semibold text-[#1b281e]">
              <Sparkles size={16} className="text-forest" />
              基本信息
            </div>
            <div className="mt-4 grid gap-x-4 md:grid-cols-2">
              <Form.Item name="id" label="作品 ID" rules={[{ required: true, message: "请输入作品 ID" }]}>
                <Input disabled={Boolean(editing)} placeholder="daily_001" />
              </Form.Item>
              <Form.Item name="name" label="作品名称" rules={[{ required: true, message: "请输入作品名称" }]}>
                <Input placeholder="例如：晨光奶油" />
              </Form.Item>
              <Form.Item name="categoryId" label="分类" rules={[{ required: true }]}>
                <Select options={categoryOptions} />
              </Form.Item>
              <Form.Item name="price" label="参考价">
                <InputNumber className="w-full" min={0} />
              </Form.Item>
            </div>
          </div>

          <div className="admin-subpanel px-4 py-4">
            <div className="flex items-center gap-2 text-sm font-semibold text-[#1b281e]">
              <SlidersHorizontal size={16} className="text-forest" />
              展示状态
            </div>
            <div className="mt-4 grid gap-x-4 md:grid-cols-2">
              <Form.Item name="sort" label="排序权重">
                <InputNumber className="w-full" />
              </Form.Item>
              <Form.Item name="featured" label="精选" valuePropName="checked">
                <Switch checkedChildren={<Star size={14} />} unCheckedChildren=" " />
              </Form.Item>
            </div>
          </div>

          <div className="admin-subpanel px-4 py-4">
            <p className="text-sm font-semibold text-[#1b281e]">文案内容</p>
            <div className="mt-4 space-y-1">
              <Form.Item name="description" label="设计描述">
                <Input.TextArea rows={3} />
              </Form.Item>
              <Form.Item name="meaning" label="花语寓意">
                <Input.TextArea rows={2} />
              </Form.Item>
              <Form.Item name="materials" label="主要花材">
                <Input placeholder="白玫瑰，绣球，尤加利叶" />
              </Form.Item>
              <Form.Item name="tags" label="标签">
                <Input placeholder="生日，粉色系，温柔" />
              </Form.Item>
            </div>
          </div>

          <div className="admin-subpanel px-4 py-4">
            <div className="flex items-center gap-2 text-sm font-semibold text-[#1b281e]">
              <ImagePlus size={16} className="text-forest" />
              图片管理
            </div>
            <div className="mt-4 space-y-4">
              <div>
                <p className="text-xs font-semibold uppercase tracking-[0.18em] text-forest/70">当前图片</p>
                {imagePreviewList.length ? (
                  <div className="mt-3 grid grid-cols-3 gap-3">
                    {imagePreviewList.map((url) => (
                      <div key={url} className="overflow-hidden rounded-lg border border-black/6 bg-white">
                        <Image src={url} alt="" height={96} className="!h-24 !w-full object-cover" />
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="mt-3 rounded-lg border border-dashed border-black/10 bg-white px-4 py-6 text-sm text-muted">还没有图片，先上传或手动填写 URL。</div>
                )}
              </div>

              <Form.Item name="images" label="图片 URL" rules={[{ required: true, message: "请上传图片或填写图片 URL" }]}>
                <Input.TextArea rows={4} placeholder="多个图片 URL 用逗号或换行分隔" />
              </Form.Item>
              <Upload beforeUpload={handleUpload} showUploadList={false} accept="image/*">
                <Button loading={uploading}>上传图片并追加 URL</Button>
              </Upload>
            </div>
          </div>
        </Form>
      </Drawer>
    </div>
  );
}
