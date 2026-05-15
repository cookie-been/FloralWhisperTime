import { useEffect, useMemo, useRef, useState } from "react";
import { Button, Empty, Input, Pagination, Select, Segmented } from "antd";
import { Search } from "lucide-react";
import { useSearchParams } from "react-router-dom";
import { FlowerCard } from "@/components/common/FlowerCard";
import { getCategories, getFlowers, isAbortError } from "@/services/api";
import type { Category, Flower, FlowerQuery } from "@/types";

export function Gallery() {
  const [searchParams, setSearchParams] = useSearchParams();
  const initialCategory = searchParams.get("category") ?? "all";
  const [categories, setCategories] = useState<Category[]>([]);
  const [flowers, setFlowers] = useState<Flower[]>([]);
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState(false);
  const [query, setQuery] = useState<FlowerQuery>({ categoryId: initialCategory, sortBy: "featured", page: 1, limit: 24 });
  const [keywordInput, setKeywordInput] = useState(searchParams.get("keyword") ?? "");
  const requestControllerRef = useRef<AbortController | null>(null);
  const currentPage = query.page ?? 1;
  const pageSize = query.limit ?? 24;
  const totalPages = Math.max(1, Math.ceil(total / pageSize));

  useEffect(() => {
    getCategories().then(setCategories).catch(() => undefined);
  }, []);

  useEffect(() => {
    const category = searchParams.get("category") ?? "all";
    const keyword = searchParams.get("keyword") ?? "";
    setKeywordInput(keyword);
    setQuery((prev) =>
      prev.categoryId === category && (prev.keyword ?? "") === keyword
        ? prev
        : { ...prev, categoryId: category, keyword: keyword || undefined, page: 1 },
    );
  }, [searchParams]);

  useEffect(() => {
    requestControllerRef.current?.abort();
    const controller = new AbortController();
    requestControllerRef.current = controller;
    setLoading(true);
    setLoadError(false);

    getFlowers(query, { signal: controller.signal })
      .then((result) => {
        setFlowers(result.list);
        setTotal(result.total);
      })
      .catch((error) => {
        if (isAbortError(error)) return;
        setFlowers([]);
        setTotal(0);
        setLoadError(true);
      })
      .finally(() => {
        if (requestControllerRef.current === controller) {
          requestControllerRef.current = null;
          setLoading(false);
        }
      });

    return () => {
      controller.abort();
    };
  }, [query]);

  const categoryOptions = useMemo(
    () => (categories.length ? categories.map((item) => ({ label: item.name, value: item.id })) : [{ label: "全部分类", value: "all" }]),
    [categories],
  );
  const updateCategory = (value: string) => {
    setQuery((prev) => ({ ...prev, categoryId: value, page: 1 }));
    const next = new URLSearchParams(searchParams);
    if (value === "all") next.delete("category");
    else next.set("category", value);
    setSearchParams(next, { replace: true });
  };

  const submitKeyword = () => {
    const trimmed = keywordInput.trim();
    setQuery((prev) => ({ ...prev, keyword: trimmed || undefined, page: 1 }));
    const next = new URLSearchParams(searchParams);
    if (trimmed) next.set("keyword", trimmed);
    else next.delete("keyword");
    setSearchParams(next, { replace: true });
  };

  return (
    <section className="min-h-screen bg-[#f4f1eb]">
      <div className="border-b border-black/6 bg-[#f8f5ef]">
        <div className="mx-auto w-full max-w-[1680px] px-4 py-7 sm:px-6 sm:py-10 lg:px-10">
          <div className="grid gap-6 xl:grid-cols-[0.9fr_1.1fr] xl:items-end">
            <div>
              <p className="section-eyebrow">作品浏览</p>
              <h1 className="section-title section-title-accent mt-2 text-3xl text-ink sm:text-4xl lg:text-5xl">作品画廊</h1>
              <p className="mt-3 max-w-2xl leading-7 text-muted">按分类、关键词和排序浏览花语时光的花束与空间花艺作品，直接查看更完整的作品面貌与氛围。</p>
            </div>
            <div className="grid gap-3 rounded-lg border border-black/6 bg-white/72 p-3.5 backdrop-blur sm:gap-4 sm:p-4 md:grid-cols-[minmax(0,1fr)_220px]">
              <Select
                className="md:hidden"
                value={query.categoryId}
                onChange={updateCategory}
                options={categoryOptions}
              />
              <div className="hidden overflow-x-auto md:block">
                <Segmented
                  block
                  options={categoryOptions}
                  value={query.categoryId}
                  onChange={(value) => updateCategory(String(value))}
                />
              </div>
              <Select
                value={query.sortBy}
                onChange={(value) => setQuery((prev) => ({ ...prev, sortBy: value, page: 1 }))}
                options={[
                  { label: "精选优先", value: "featured" },
                  { label: "最新作品", value: "latest" },
                  { label: "价格从低到高", value: "price_asc" },
                  { label: "价格从高到低", value: "price_desc" },
                ]}
              />
              <div className="gallery-search md:col-span-2">
                <Input
                  allowClear
                  value={keywordInput}
                  placeholder="搜索花束、花材或标签"
                  onChange={(event) => setKeywordInput(event.target.value)}
                  onPressEnter={submitKeyword}
                />
                <Button
                  type="primary"
                  className="gallery-search-button"
                  aria-label="搜索作品"
                  onClick={submitKeyword}
                  icon={<Search size={16} />}
                />
              </div>
            </div>
          </div>
        </div>
      </div>

      <div className="mx-auto w-full max-w-[1680px] px-4 py-7 sm:px-6 sm:py-8 lg:px-10">
        <div className="mb-6 flex flex-col gap-2 sm:flex-row sm:flex-wrap sm:items-center sm:justify-between sm:gap-3">
          <p className="text-sm font-medium text-muted">共展示 {total} 件作品，当前第 {currentPage} / {totalPages} 页</p>
          <p className="text-sm text-muted">当前排序：{query.sortBy === "featured" ? "精选优先" : query.sortBy === "latest" ? "最新作品" : query.sortBy === "price_asc" ? "价格从低到高" : "价格从高到低"}</p>
        </div>

        {loading ? (
          <div className="rounded-lg border border-black/6 bg-white/72 py-20 text-center text-muted">正在加载作品...</div>
        ) : loadError ? (
          <div className="rounded-lg border border-black/6 bg-white/72 py-20">
            <Empty description="作品列表加载失败，请稍后刷新重试" />
          </div>
        ) : flowers.length > 0 ? (
          <>
            <div className="grid gap-4 sm:grid-cols-2 sm:gap-5 xl:grid-cols-3 2xl:grid-cols-4">
              {flowers.map((flower) => (
                <FlowerCard key={flower.id} flower={flower} />
              ))}
            </div>
            <div className="mt-8 flex flex-col items-center gap-3 sm:mt-10">
              <p className="text-center text-sm leading-6 text-muted">本页展示 {flowers.length} 件作品，可继续翻页浏览完整画廊。</p>
              <Pagination
                className="gallery-pagination"
                size="small"
                responsive
                current={currentPage}
                pageSize={pageSize}
                total={total}
                showSizeChanger={false}
                onChange={(page) => setQuery((prev) => ({ ...prev, page }))}
              />
            </div>
          </>
        ) : (
          <div className="rounded-lg border border-black/6 bg-white/72 py-20">
            <Empty description="没有找到匹配的花束作品" />
          </div>
        )}
      </div>
    </section>
  );
}
