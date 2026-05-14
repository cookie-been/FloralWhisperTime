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
import { ArrowDown, ArrowUp, ImagePlus, Plus, Search, SlidersHorizontal, Sparkles, Star } from "lucide-react";
import { useSearchParams } from "react-router-dom";
import {
  createFlower,
  deleteFlower,
  getAdminAiSettings,
  generateAdminAiFlowerSuggestion,
  generateAdminAiImage,
  getCategories,
  getFlowers,
  updateFlower,
  uploadFlowerImage,
  type AdminAiFlowerSuggestion,
} from "@/services/api";
import type { AiSettings, Category, Flower } from "@/types";

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

function shouldIgnoreRowClick(target: EventTarget | null) {
  if (!(target instanceof HTMLElement)) return false;
  return Boolean(target.closest("button, .ant-btn, .ant-checkbox-wrapper, .ant-checkbox, .ant-popover, .ant-popconfirm"));
}

type FeaturedFilter = "all" | "featured" | "normal";

interface GeneratedAiImageResult {
  success: boolean;
  imageUrl: string;
  source: string;
  mode: string;
}

interface AiSuggestionForm {
  name: string;
  categoryId: string;
  description: string;
  materials: string;
  tags: string;
  meaning: string;
}

const emptyAiSuggestion: AiSuggestionForm = {
  name: "",
  categoryId: "",
  description: "",
  materials: "",
  tags: "",
  meaning: "",
};

function toAiSuggestionForm(value: AdminAiFlowerSuggestion): AiSuggestionForm {
  return {
    name: value.name,
    categoryId: value.categoryId,
    description: value.description,
    materials: joinText(value.materials),
    tags: joinText(value.tags),
    meaning: value.meaning,
  };
}

export function AdminFlowers() {
  const [searchParams, setSearchParams] = useSearchParams();
  const screens = Grid.useBreakpoint();
  const [form] = Form.useForm<FlowerForm>();
  const [aiSuggestionForm] = Form.useForm<AiSuggestionForm>();
  const [flowers, setFlowers] = useState<Flower[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [editing, setEditing] = useState<Flower | null>(null);
  const [drawerOpen, setDrawerOpen] = useState(false);
  const [saving, setSaving] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [loading, setLoading] = useState(true);
  const [selectedRowKeys, setSelectedRowKeys] = useState<string[]>([]);
  const [search, setSearch] = useState(searchParams.get("keyword") ?? "");
  const [selectedCategory, setSelectedCategory] = useState<string>(searchParams.get("category") ?? "all");
  const [aiDialogOpen, setAiDialogOpen] = useState(false);
  const [aiPrompt, setAiPrompt] = useState("");
  const [aiReferenceFiles, setAiReferenceFiles] = useState<RcFile[]>([]);
  const [aiGenerating, setAiGenerating] = useState(false);
  const [aiSuggesting, setAiSuggesting] = useState(false);
  const [generatedAiImage, setGeneratedAiImage] = useState<GeneratedAiImageResult | null>(null);
  const [aiSettings, setAiSettings] = useState<AiSettings | null>(null);
  const initialFeatured = searchParams.get("featured");
  const [featuredFilter, setFeaturedFilter] = useState<FeaturedFilter>(
    initialFeatured === "featured" || initialFeatured === "normal" ? initialFeatured : "all",
  );

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

  const featuredCount = useMemo(() => filteredFlowers.filter((item) => item.featured).length, [filteredFlowers]);
  const sortedFlowers = useMemo(
    () => [...filteredFlowers].sort((left, right) => right.sort - left.sort || left.name.localeCompare(right.name, "zh-CN")),
    [filteredFlowers],
  );

  const load = async () => {
    setLoading(true);
    try {
      const [categoryList, flowerResult, adminAiSettings] = await Promise.all([getCategories(), getFlowers({ limit: 200 }), getAdminAiSettings()]);
      setCategories(categoryList);
      setFlowers(flowerResult.list);
      setAiSettings(adminAiSettings);
    } catch (error) {
      message.error(error instanceof Error ? error.message : "加载失败");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    load().catch(() => undefined);
  }, []);

  useEffect(() => {
    const next = new URLSearchParams();
    if (search.trim()) next.set("keyword", search.trim());
    if (selectedCategory !== "all") next.set("category", selectedCategory);
    if (featuredFilter !== "all") next.set("featured", featuredFilter);
    setSearchParams(next, { replace: true });
  }, [featuredFilter, search, selectedCategory, setSearchParams]);

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

  const resetAiDialog = () => {
    setAiDialogOpen(false);
    setAiPrompt("");
    setAiReferenceFiles([]);
    setGeneratedAiImage(null);
    setAiGenerating(false);
    setAiSuggesting(false);
    aiSuggestionForm.setFieldsValue(emptyAiSuggestion);
  };

  const clearSelection = () => setSelectedRowKeys([]);

  const resetFilters = () => {
    setSearch("");
    setSelectedCategory("all");
    setFeaturedFilter("all");
  };

  const selectedFlowers = useMemo(
    () => filteredFlowers.filter((flower) => selectedRowKeys.includes(flower.id)),
    [filteredFlowers, selectedRowKeys],
  );

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

  const handleAiReferenceBeforeUpload = (file: RcFile) => {
    if (!file.type.startsWith("image/")) {
      message.error("参考图仅支持图片文件");
      return Upload.LIST_IGNORE;
    }
    if (file.size > 20 * 1024 * 1024) {
      message.error("参考图单张大小不能超过 20MB");
      return Upload.LIST_IGNORE;
    }
    if (aiReferenceFiles.length >= 3) {
      message.error("参考图最多上传 3 张");
      return Upload.LIST_IGNORE;
    }
    setAiReferenceFiles((current) => [...current, file]);
    return Upload.LIST_IGNORE;
  };

  const removeAiReferenceFile = (file: RcFile) => {
    setAiReferenceFiles((current) => current.filter((item) => item.uid !== file.uid));
  };

  const runAiGeneration = async () => {
    const prompt = aiPrompt.trim();
    if (!prompt) {
      message.error("请输入生成提示词");
      return;
    }
    if (aiGenerating) return;

    setAiGenerating(true);
    try {
      const result = await generateAdminAiImage(prompt, aiReferenceFiles);
      setGeneratedAiImage(result);
      aiSuggestionForm.setFieldsValue(emptyAiSuggestion);
      message.success(result.mode === "image_to_image" ? "参考图生成完成" : "图片生成完成");
    } catch (error) {
      message.error(error instanceof Error ? error.message : "AI 生成失败");
    } finally {
      setAiGenerating(false);
    }
  };

  const runAiSuggestion = async () => {
    const prompt = aiPrompt.trim();
    if (!prompt) {
      message.error("请输入生成提示词");
      return;
    }
    if (!generatedAiImage) {
      message.error("请先生成图片");
      return;
    }
    if (aiSuggesting) return;

    setAiSuggesting(true);
    try {
      const result = await generateAdminAiFlowerSuggestion({
        prompt,
        imageUrl: generatedAiImage.imageUrl,
        mode: generatedAiImage.mode,
      });
      aiSuggestionForm.setFieldsValue(toAiSuggestionForm(result));
      message.success("作品信息建议已生成");
    } catch (error) {
      message.error(error instanceof Error ? error.message : "作品信息建议生成失败");
    } finally {
      setAiSuggesting(false);
    }
  };

  const useGeneratedImageForCreate = async () => {
    if (!generatedAiImage) return;
    const suggestion = await aiSuggestionForm.validateFields().catch(() => aiSuggestionForm.getFieldsValue());
    setEditing(null);
    form.setFieldsValue({
      ...emptyFlower,
      id: `daily_${Date.now()}`,
      name: suggestion.name || "",
      categoryId: suggestion.categoryId || emptyFlower.categoryId,
      images: generatedAiImage.imageUrl,
      description: suggestion.description || "",
      materials: suggestion.materials || "",
      meaning: suggestion.meaning || "",
      tags: suggestion.tags || "",
    });
    setDrawerOpen(true);
    setAiDialogOpen(false);
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
      setSelectedRowKeys((current) => current.filter((item) => item !== id));
      if (editing?.id === id) closeDrawer();
      await load();
    } catch (error) {
      message.error(error instanceof Error ? error.message : "删除失败");
    } finally {
      setSaving(false);
    }
  };

  const updateFeaturedBatch = async (featured: boolean) => {
    if (!selectedFlowers.length || saving) return;
    setSaving(true);
    try {
      await Promise.all(
        selectedFlowers.map((flower) =>
          updateFlower(flower.id, {
            ...flower,
            featured,
          }),
        ),
      );
      message.success(featured ? "已批量设为精选" : "已批量取消精选");
      clearSelection();
      await load();
    } catch (error) {
      message.error(error instanceof Error ? error.message : "批量更新失败");
    } finally {
      setSaving(false);
    }
  };

  const moveFlower = async (record: Flower, direction: "up" | "down") => {
    if (saving) return;
    const index = sortedFlowers.findIndex((item) => item.id === record.id);
    const swapIndex = direction === "up" ? index - 1 : index + 1;
    const target = sortedFlowers[swapIndex];
    if (index < 0 || !target) return;

    setSaving(true);
    try {
      await Promise.all([
        updateFlower(record.id, { ...record, sort: target.sort }),
        updateFlower(target.id, { ...target, sort: record.sort }),
      ]);
      message.success(direction === "up" ? "作品已上移" : "作品已下移");
      await load();
    } catch (error) {
      message.error(error instanceof Error ? error.message : "排序更新失败");
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
      width: 280,
      render: (_: unknown, record) => {
        const index = sortedFlowers.findIndex((item) => item.id === record.id);
        const isFirst = index <= 0;
        const isLast = index === sortedFlowers.length - 1;

        return (
          <Space>
            <Button
              size="small"
              className="admin-action-button"
              icon={<ArrowUp size={14} />}
              disabled={isFirst || saving}
              onClick={(event) => {
                event.stopPropagation();
                void moveFlower(record, "up");
              }}
            >
              上移
            </Button>
            <Button
              size="small"
              className="admin-action-button"
              icon={<ArrowDown size={14} />}
              disabled={isLast || saving}
              onClick={(event) => {
                event.stopPropagation();
                void moveFlower(record, "down");
              }}
            >
              下移
            </Button>
            <Button
              size="small"
              className="admin-action-button"
              onClick={(event) => {
                event.stopPropagation();
                startEdit(record);
              }}
            >
              编辑
            </Button>
            <Popconfirm title="确认删除该作品？" onConfirm={() => remove(record.id)}>
              <Button
                size="small"
                danger
                className="admin-action-button"
                onClick={(event) => {
                  event.stopPropagation();
                }}
              >
                删除
              </Button>
            </Popconfirm>
          </Space>
        );
      },
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

      <section className="admin-toolbar admin-sticky-toolbar p-5">
        <div className="flex flex-wrap items-start justify-between gap-4">
          <div>
            <p className="section-eyebrow">作品工作区</p>
            <h3 className="admin-section-title mt-2 text-xl">作品工作台</h3>
            <p className="mt-2 text-sm leading-6 text-muted">先筛选，再打开右侧抽屉集中编辑。保存后列表会直接刷新，不打断浏览。</p>
          </div>
          <Space wrap className="w-full justify-end sm:w-auto">
            <Button size="large" icon={<Sparkles size={16} />} onClick={() => setAiDialogOpen(true)} block={!screens.sm}>
              AI生成作品
            </Button>
            <Button type="primary" size="large" icon={<Plus size={16} />} onClick={startCreate} block={!screens.sm}>
              新增作品
            </Button>
          </Space>
        </div>

        <div className="mt-5">
          <p className="admin-filter-caption">筛选条件</p>
        </div>
        <div className="admin-quick-filters">
          <Button type={featuredFilter === "featured" ? "primary" : "default"} onClick={() => setFeaturedFilter("featured")}>
            精选优先
          </Button>
          <Button type={featuredFilter === "normal" ? "primary" : "default"} onClick={() => setFeaturedFilter("normal")}>
            只看普通
          </Button>
          <Button type={selectedCategory === "all" ? "primary" : "default"} onClick={resetFilters}>
            查看全部
          </Button>
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
            <span>
              {hasActiveFilters
                ? `已应用 ${filterSummary.join(" · ")}`
                : `当前结果中精选 ${featuredCount} 条，普通 ${filteredFlowers.length - featuredCount} 条。`}
            </span>
          </div>
          {hasActiveFilters ? (
            <Button onClick={resetFilters}>清空筛选</Button>
          ) : null}
        </div>
        {selectedFlowers.length ? (
          <div className="admin-filter-summary">
            <div className="admin-filter-summary-copy">
              <p>已选中 {selectedFlowers.length} 条</p>
              <span>可直接批量调整精选状态，减少逐条进入编辑的重复操作。</span>
            </div>
            <Space wrap>
              <Button type="primary" loading={saving} onClick={() => updateFeaturedBatch(true)}>
                批量设为精选
              </Button>
              <Button loading={saving} onClick={() => updateFeaturedBatch(false)}>
                批量取消精选
              </Button>
              <Button onClick={clearSelection}>取消选择</Button>
            </Space>
          </div>
        ) : null}
      </section>

      <section className="admin-panel overflow-hidden p-0">
        {loading ? (
          <div className="flex min-h-[360px] items-center justify-center">
            <Spin size="large" />
          </div>
        ) : filteredFlowers.length ? (
          <Table
            rowKey="id"
            dataSource={sortedFlowers}
            columns={columns}
            rowSelection={{
              selectedRowKeys,
              onChange: (keys) => setSelectedRowKeys(keys as string[]),
            }}
            pagination={{ pageSize: 8, showSizeChanger: false }}
            rowClassName={() => "cursor-pointer"}
            onRow={(record) => ({
              onClick: (event) => {
                if (shouldIgnoreRowClick(event.target)) return;
                startEdit(record);
              },
            })}
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
        className="admin-mobile-drawer"
        title={
          <div className="admin-drawer-title">
            <p>AI生成作品</p>
            <h3>图片生成工作台</h3>
            <span>输入 prompt，可选上传最多 3 张参考图。生成结果仅用于人工审核后进入新增作品流程。</span>
          </div>
        }
        open={aiDialogOpen}
        onClose={resetAiDialog}
        width={screens.lg ? 760 : "100%"}
        destroyOnHidden
        extra={
          <Space wrap>
            <Button onClick={resetAiDialog}>关闭</Button>
            <Button type="primary" loading={aiGenerating} disabled={!aiPrompt.trim()} onClick={() => void runAiGeneration()}>
              生成
            </Button>
          </Space>
        }
      >
        <div className="space-y-6">
          <div className="admin-subpanel px-4 py-4">
            <div className="flex items-center gap-2 text-sm font-semibold text-[#1b281e]">
              <Sparkles size={16} className="text-forest" />
              生成提示
            </div>
            <p className="mt-2 text-sm leading-6 text-muted">直接输入你希望生成的花艺作品描述。支持只写文本，也支持搭配参考图做以图生图。</p>
            <Input.TextArea
              className="mt-4"
              rows={6}
              value={aiPrompt}
              onChange={(event) => setAiPrompt(event.target.value)}
              placeholder="例如：生成一束现代感白绿色婚礼手捧花，奶油白玫瑰为主，搭配轻盈层次和自然垂坠感，画面干净克制。"
            />
          </div>

          <div className="admin-subpanel px-4 py-4">
            <div className="flex items-center gap-2 text-sm font-semibold text-[#1b281e]">
              <ImagePlus size={16} className="text-forest" />
              参考图
            </div>
            <p className="mt-2 text-sm leading-6 text-muted">可上传 1-3 张参考图参与生成。单张不超过 20MB，仅支持图片文件。</p>
            <div className="mt-4 flex flex-wrap gap-3">
              <Upload
                beforeUpload={handleAiReferenceBeforeUpload}
                onRemove={(file) => {
                  removeAiReferenceFile(file as RcFile);
                  return true;
                }}
                fileList={aiReferenceFiles}
                multiple
                accept="image/*"
                listType="picture-card"
              >
                {aiReferenceFiles.length < 3 ? (
                  <div className="flex flex-col items-center gap-2 text-muted">
                    <ImagePlus size={18} />
                    <span className="text-xs">上传参考图</span>
                  </div>
                ) : null}
              </Upload>
            </div>
          </div>

          <div className="admin-subpanel px-4 py-4">
            <div className="flex items-center gap-2 text-sm font-semibold text-[#1b281e]">
              <Star size={16} className="text-forest" />
              生成结果
            </div>
            {generatedAiImage ? (
              <div className="mt-4 space-y-4">
                <div className="overflow-hidden rounded-lg border border-black/6 bg-white">
                  <Image src={generatedAiImage.imageUrl} alt="AI生成作品" className="w-full object-cover" />
                </div>
                <div className="flex flex-wrap items-center gap-3 text-sm text-muted">
                  <Tag color="green">{generatedAiImage.mode === "image_to_image" ? "以图生图" : "文生图"}</Tag>
                  <span>模型：{generatedAiImage.source}</span>
                </div>
                <Space wrap>
                  <Button loading={aiGenerating} onClick={() => void runAiGeneration()}>
                    重新生成
                  </Button>
                  <Button
                    loading={aiSuggesting}
                    disabled={!generatedAiImage || !aiPrompt.trim() || aiSettings?.enabled === false}
                    onClick={() => void runAiSuggestion()}
                  >
                    生成作品信息
                  </Button>
                  <Button type="primary" onClick={useGeneratedImageForCreate}>
                    用于新建作品
                  </Button>
                </Space>
              </div>
            ) : (
              <div className="mt-4 rounded-lg border border-dashed border-black/10 bg-white px-4 py-6 text-sm text-muted">
                {aiGenerating ? "正在生成图片，请稍候..." : "生成完成后会在这里显示图片结果。"}
              </div>
            )}
          </div>

          <div className="admin-subpanel px-4 py-4">
            <div className="flex items-center gap-2 text-sm font-semibold text-[#1b281e]">
              <Sparkles size={16} className="text-forest" />
              作品信息建议
            </div>
            <p className="mt-2 text-sm leading-6 text-muted">
              先生成图片，再生成作品信息建议。这里的内容可直接修改，点“用于新建作品”时会一并带入新增表单。
            </p>
            <Form form={aiSuggestionForm} layout="vertical" className="mt-4">
              <div className="grid gap-x-4 md:grid-cols-2">
                <Form.Item name="name" label="作品名称">
                  <Input placeholder="例如：晨雾誓约" />
                </Form.Item>
                <Form.Item name="categoryId" label="分类建议">
                  <Select
                    allowClear
                    placeholder="请选择分类"
                    options={categoryOptions}
                  />
                </Form.Item>
              </div>
              <Form.Item name="description" label="设计描述">
                <Input.TextArea rows={3} placeholder="AI 建议的作品描述会显示在这里" />
              </Form.Item>
              <Form.Item name="meaning" label="花语寓意">
                <Input.TextArea rows={2} placeholder="AI 建议的寓意会显示在这里" />
              </Form.Item>
              <div className="grid gap-x-4 md:grid-cols-2">
                <Form.Item name="materials" label="主要花材">
                  <Input placeholder="多个花材用逗号分隔" />
                </Form.Item>
                <Form.Item name="tags" label="标签">
                  <Input placeholder="多个标签用逗号分隔" />
                </Form.Item>
              </div>
            </Form>
            {!generatedAiImage ? (
              <div className="rounded-lg border border-dashed border-black/10 bg-white px-4 py-4 text-sm text-muted">
                生成图片后可在这里生成并调整作品信息建议。
              </div>
            ) : null}
          </div>
        </div>
      </Drawer>

      <Drawer
        title={
          <div className="admin-drawer-title">
            <p>{editing ? "编辑作品" : "新增作品"}</p>
            <h3>{editing ? `编辑作品 · ${editing.name}` : "新增作品"}</h3>
            <span>{editing ? "在右侧抽屉中集中修改作品信息、图片与展示状态。" : "填写基础资料后即可创建新的前台展示作品。"}</span>
          </div>
        }
        open={drawerOpen}
        onClose={closeDrawer}
        width={screens.lg ? 720 : "100%"}
        destroyOnHidden
        extra={
          <Space wrap>
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
                <p className="text-xs font-semibold uppercase tracking-[0.18em] text-forest/70">图片预览</p>
                {imagePreviewList.length ? (
                  <div className="mt-3 grid grid-cols-2 gap-3 sm:grid-cols-3">
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
