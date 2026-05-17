import { lazy, Suspense, useEffect, useMemo, useRef, useState } from "react";
import {
  Button,
  Empty,
  Form,
  Grid,
  Input,
  Popconfirm,
  Select,
  Space,
  Spin,
  Table,
  Tag,
  Upload,
  message,
} from "antd";
import type { ColumnsType } from "antd/es/table";
import type { RcFile } from "antd/es/upload";
import { ArrowDown, ArrowUp, Plus, Search, Sparkles } from "lucide-react";
import { useSearchParams } from "react-router-dom";
import {
  createFlower,
  deleteFlower,
  getAdminAiSettings,
  listAllAdminFlowers,
  generateAdminAiFlowerSuggestion,
  generateAdminAiImage,
  getCategories,
  isAbortError,
  restoreFlower,
  updateFlower,
  uploadFlowerImage,
} from "@/services/api";
import type { AiSettings, Category, Flower } from "@/types";
import {
  emptyAiSuggestion,
  emptyFlower,
  fromForm,
  shouldIgnoreRowClick,
  splitText,
  toAiSuggestionForm,
  toForm,
  truncateText,
  type AiSuggestionForm,
  type DeletedFilter,
  type FeaturedFilter,
  type FlowerForm,
  type GeneratedAiImageResult,
} from "./AdminFlowerTypes";
import {
  buildFlowerBatchMutationSummary,
  buildFlowerCategoryMap,
  buildFlowerCategoryOptions,
  buildFlowerFilterSummary,
  buildFlowerMetrics,
  buildSelectedFlowers,
  filterFlowers,
  hasFlowerActiveFilters,
  sortFlowers,
} from "./flower-list.helpers";
import { omitSelectedRowKeys } from "@/utils/admin-table";

const AdminFlowerAiDrawerLazy = lazy(() =>
  import("./AdminFlowerAiDrawer").then((module) => ({ default: module.AdminFlowerAiDrawer })),
);
const AdminFlowerEditorDrawerLazy = lazy(() =>
  import("./AdminFlowerEditorDrawer").then((module) => ({ default: module.AdminFlowerEditorDrawer })),
);

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
  const [deletedFilter, setDeletedFilter] = useState<DeletedFilter>(searchParams.get("deleted") === "deleted" ? "deleted" : "active");
  const [aiDialogOpen, setAiDialogOpen] = useState(false);
  const [aiPrompt, setAiPrompt] = useState("");
  const [aiReferenceFiles, setAiReferenceFiles] = useState<RcFile[]>([]);
  const [aiGenerating, setAiGenerating] = useState(false);
  const [aiSuggesting, setAiSuggesting] = useState(false);
  const [generatedAiImage, setGeneratedAiImage] = useState<GeneratedAiImageResult | null>(null);
  const [aiSettings, setAiSettings] = useState<AiSettings | null>(null);
  const requestControllerRef = useRef<AbortController | null>(null);
  const initialFeatured = searchParams.get("featured");
  const [featuredFilter, setFeaturedFilter] = useState<FeaturedFilter>(
    initialFeatured === "featured" || initialFeatured === "normal" ? initialFeatured : "all",
  );

  const watchedImages = Form.useWatch("images", form) ?? "";

  const categoryMap = useMemo(() => buildFlowerCategoryMap(categories), [categories]);

  const categoryOptions = useMemo(() => buildFlowerCategoryOptions(categories), [categories]);

  const imagePreviewList = useMemo(() => splitText(watchedImages), [watchedImages]);
  const hasActiveFilters = hasFlowerActiveFilters({ search, selectedCategory, featuredFilter, deletedFilter });

  const filteredFlowers = useMemo(
    () => filterFlowers(flowers, { search, selectedCategory, featuredFilter }),
    [featuredFilter, flowers, search, selectedCategory],
  );

  const metrics = useMemo(
    () => buildFlowerMetrics(flowers, filteredFlowers, deletedFilter, categoryOptions.length),
    [categoryOptions.length, deletedFilter, filteredFlowers, flowers],
  );

  const filterSummary = useMemo(
    () => buildFlowerFilterSummary({ search, selectedCategory, featuredFilter, deletedFilter, categoryMap }),
    [categoryMap, deletedFilter, featuredFilter, search, selectedCategory],
  );

  const featuredCount = useMemo(() => filteredFlowers.filter((item) => item.featured).length, [filteredFlowers]);
  const sortedFlowers = useMemo(() => sortFlowers(filteredFlowers), [filteredFlowers]);

  const load = async () => {
    requestControllerRef.current?.abort();
    const controller = new AbortController();
    requestControllerRef.current = controller;
    setLoading(true);
    try {
      const [categoryList, allFlowers, adminAiSettings] = await Promise.all([
        getCategories({ signal: controller.signal }),
        listAllAdminFlowers({ sortBy: "featured", deleted: deletedFilter }, { signal: controller.signal }),
        getAdminAiSettings({ signal: controller.signal }),
      ]);
      setCategories(categoryList);
      setFlowers(allFlowers);
      setAiSettings(adminAiSettings);
    } catch (error) {
      if (isAbortError(error)) return;
      message.error(error instanceof Error ? error.message : "加载失败");
    } finally {
      if (requestControllerRef.current === controller) {
        requestControllerRef.current = null;
        setLoading(false);
      }
    }
  };

  useEffect(() => {
    load().catch(() => undefined);
    return () => {
      requestControllerRef.current?.abort();
    };
  }, [deletedFilter]);

  useEffect(() => {
    const next = new URLSearchParams();
    if (search.trim()) next.set("keyword", search.trim());
    if (selectedCategory !== "all") next.set("category", selectedCategory);
    if (featuredFilter !== "all") next.set("featured", featuredFilter);
    if (deletedFilter !== "active") next.set("deleted", deletedFilter);
    setSearchParams(next, { replace: true });
  }, [deletedFilter, featuredFilter, search, selectedCategory, setSearchParams]);

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
    setDeletedFilter("active");
  };

  const selectedFlowers = useMemo(
    () => buildSelectedFlowers(filteredFlowers, selectedRowKeys),
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
      setSelectedRowKeys((current) => omitSelectedRowKeys(current, [id]));
      if (editing?.id === id) closeDrawer();
      await load();
    } catch (error) {
      message.error(error instanceof Error ? error.message : "删除失败");
    } finally {
      setSaving(false);
    }
  };

  const restore = async (id: string) => {
    if (saving) return;
    setSaving(true);
    try {
      await restoreFlower(id);
      message.success("作品已恢复");
      setSelectedRowKeys((current) => omitSelectedRowKeys(current, [id]));
      if (editing?.id === id) closeDrawer();
      await load();
    } catch (error) {
      message.error(error instanceof Error ? error.message : "恢复失败");
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

  const removeBatch = async () => {
    if (!selectedFlowers.length || saving) return;

    const deletingIds = new Set(selectedFlowers.map((flower) => flower.id));
    setSaving(true);
    try {
      const results = await Promise.allSettled(selectedFlowers.map((flower) => deleteFlower(flower.id)));
      const { succeededIds, failedCount } = buildFlowerBatchMutationSummary(selectedFlowers, results);

      if (succeededIds.length) {
        setSelectedRowKeys((current) => omitSelectedRowKeys(current, succeededIds));
      }
      if (editing?.id && deletingIds.has(editing.id) && succeededIds.includes(editing.id)) {
        closeDrawer();
      }

      await load();

      if (failedCount === 0) {
        message.success(`已批量删除 ${succeededIds.length} 个作品`);
        return;
      }

      if (succeededIds.length) {
        message.warning(`已删除 ${succeededIds.length} 个作品，另有 ${failedCount} 个删除失败`);
        return;
      }

      message.error("批量删除失败");
    } catch (error) {
      message.error(error instanceof Error ? error.message : "批量删除失败");
    } finally {
      setSaving(false);
    }
  };

  const restoreBatch = async () => {
    if (!selectedFlowers.length || saving) return;

    const restoringIds = new Set(selectedFlowers.map((flower) => flower.id));
    setSaving(true);
    try {
      const results = await Promise.allSettled(selectedFlowers.map((flower) => restoreFlower(flower.id)));
      const { succeededIds, failedCount } = buildFlowerBatchMutationSummary(selectedFlowers, results);

      if (succeededIds.length) {
        setSelectedRowKeys((current) => omitSelectedRowKeys(current, succeededIds));
      }
      if (editing?.id && restoringIds.has(editing.id) && succeededIds.includes(editing.id)) {
        closeDrawer();
      }

      await load();

      if (failedCount === 0) {
        message.success(`已批量恢复 ${succeededIds.length} 个作品`);
        return;
      }

      if (succeededIds.length) {
        message.warning(`已恢复 ${succeededIds.length} 个作品，另有 ${failedCount} 个恢复失败`);
        return;
      }

      message.error("批量恢复失败");
    } catch (error) {
      message.error(error instanceof Error ? error.message : "批量恢复失败");
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
          <p className="mt-1 text-xs text-muted">
            {categoryMap.get(record.categoryId) ?? "未分类"} · 花材 {record.materials.length} 项 · 标签 {record.tags.length} 个
          </p>
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
            {deletedFilter === "active" ? (
              <>
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
              </>
            ) : (
              <Button
                size="small"
                type="primary"
                className="admin-action-button"
                onClick={(event) => {
                  event.stopPropagation();
                  void restore(record.id);
                }}
              >
                恢复
              </Button>
            )}
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
            <h3 className="admin-section-title mt-2 text-xl">{deletedFilter === "deleted" ? "作品回收站" : "作品工作台"}</h3>
            <p className="admin-shell-copy mt-2 text-sm">
              {deletedFilter === "deleted" ? "这里显示已逻辑删除的作品，可按需恢复回正常列表。" : "先筛选，再打开右侧抽屉集中编辑。保存后列表会直接刷新，不打断浏览。"}
            </p>
          </div>
          {deletedFilter === "active" ? (
            <Space wrap className="w-full justify-end sm:w-auto">
              <Button size="large" icon={<Sparkles size={16} />} onClick={() => setAiDialogOpen(true)} block={!screens.sm}>
                AI生成作品
              </Button>
              <Button type="primary" size="large" icon={<Plus size={16} />} onClick={startCreate} block={!screens.sm}>
                新增作品
              </Button>
            </Space>
          ) : null}
        </div>

        <div className="mt-5">
          <p className="admin-filter-caption">筛选条件</p>
        </div>
        <div className="admin-quick-filters">
          <Button type={deletedFilter === "active" ? "primary" : "default"} onClick={() => setDeletedFilter("active")}>
            正常数据
          </Button>
          <Button type={deletedFilter === "deleted" ? "primary" : "default"} onClick={() => setDeletedFilter("deleted")}>
            已删除
          </Button>
          <Button type={featuredFilter === "featured" ? "primary" : "default"} onClick={() => setFeaturedFilter("featured")}>
            精选优先
          </Button>
          <Button type={featuredFilter === "normal" ? "primary" : "default"} onClick={() => setFeaturedFilter("normal")}>
            只看普通
          </Button>
          <Button
            type={!search.trim() && selectedCategory === "all" && featuredFilter === "all" && deletedFilter === "active" ? "primary" : "default"}
            onClick={resetFilters}
          >
            查看全部
          </Button>
        </div>
        <div className="admin-filter-grid sm:grid-cols-2 xl:grid-cols-[minmax(0,1.3fr)_220px_220px]">
          <Input
            className="min-w-0 sm:col-span-2 xl:col-span-1"
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
              <span>可直接批量调整精选状态或删除，减少逐条进入编辑的重复操作。</span>
            </div>
            <Space wrap>
              {deletedFilter === "active" ? (
                <>
                  <Button type="primary" loading={saving} onClick={() => updateFeaturedBatch(true)}>
                    批量设为精选
                  </Button>
                  <Button loading={saving} onClick={() => updateFeaturedBatch(false)}>
                    批量取消精选
                  </Button>
                  <Popconfirm
                    title={`确认删除选中的 ${selectedFlowers.length} 个作品？`}
                    description="删除后可通过操作日志恢复结构化数据，但图片文件仍建议以备份为准。"
                    okText="确认删除"
                    cancelText="取消"
                    okButtonProps={{ danger: true }}
                    onConfirm={() => void removeBatch()}
                  >
                    <Button danger loading={saving}>
                      批量删除
                    </Button>
                  </Popconfirm>
                </>
              ) : (
                <Button type="primary" loading={saving} onClick={() => void restoreBatch()}>
                  批量恢复
                </Button>
              )}
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
                if (deletedFilter !== "active") return;
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

      {(aiDialogOpen || drawerOpen) ? (
        <Suspense
          fallback={
            <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/12 backdrop-blur-[1px]">
              <div className="rounded-xl bg-white px-6 py-5 shadow-lg">
                <Spin size="large" />
              </div>
            </div>
          }
        >
          {aiDialogOpen ? (
            <AdminFlowerAiDrawerLazy
              open={aiDialogOpen}
              screensLg={screens.lg}
              prompt={aiPrompt}
              onPromptChange={setAiPrompt}
              referenceFiles={aiReferenceFiles}
              onBeforeUpload={handleAiReferenceBeforeUpload}
              onRemoveReferenceFile={removeAiReferenceFile}
              generating={aiGenerating}
              suggesting={aiSuggesting}
              generatedImage={generatedAiImage}
              aiSettings={aiSettings}
              categoryOptions={categoryOptions}
              suggestionForm={aiSuggestionForm}
              onClose={resetAiDialog}
              onGenerate={() => void runAiGeneration()}
              onGenerateSuggestion={() => void runAiSuggestion()}
              onUseGeneratedImage={() => void useGeneratedImageForCreate()}
            />
          ) : null}
          {drawerOpen ? (
            <AdminFlowerEditorDrawerLazy
              open={drawerOpen}
              editingName={editing?.name}
              screensLg={screens.lg}
              saving={saving}
              uploading={uploading}
              form={form}
              categoryOptions={categoryOptions}
              imagePreviewList={imagePreviewList}
              onClose={closeDrawer}
              onSave={() => void save()}
              onUpload={handleUpload}
            />
          ) : null}
        </Suspense>
      ) : null}
    </div>
  );
}
