import { useEffect, useMemo, useState } from "react";
import { Empty, Input, Pagination, Select, Segmented } from "antd";
import { FlowerCard } from "@/components/common/FlowerCard";
import { getCategories, getFlowers } from "@/services/api";
import type { Category, Flower, FlowerQuery } from "@/types";

export function Gallery() {
  const [categories, setCategories] = useState<Category[]>([]);
  const [flowers, setFlowers] = useState<Flower[]>([]);
  const [total, setTotal] = useState(0);
  const [query, setQuery] = useState<FlowerQuery>({ categoryId: "all", sortBy: "featured", page: 1, limit: 24 });

  useEffect(() => {
    getCategories().then(setCategories);
  }, []);

  useEffect(() => {
    getFlowers(query).then((result) => {
      setFlowers(result.list);
      setTotal(result.total);
    });
  }, [query]);

  const categoryOptions = useMemo(() => categories.map((item) => ({ label: item.name, value: item.id })), [categories]);

  return (
    <section className="min-h-screen bg-[#f4f1eb]">
      <div className="border-b border-black/6 bg-[#f8f5ef]">
        <div className="mx-auto w-full max-w-[1680px] px-4 py-8 sm:px-6 sm:py-10 lg:px-10">
          <div className="grid gap-6 xl:grid-cols-[0.9fr_1.1fr] xl:items-end">
            <div>
              <p className="section-eyebrow">Gallery</p>
              <h1 className="section-title section-title-accent mt-2 text-3xl text-ink sm:text-4xl lg:text-5xl">作品画廊</h1>
              <p className="mt-3 max-w-2xl leading-7 text-muted">按分类、关键词和排序浏览花语时光的花束与空间花艺作品，直接查看更完整的作品面貌与氛围。</p>
            </div>
            <div className="grid gap-4 rounded-lg border border-black/6 bg-white/72 p-4 backdrop-blur md:grid-cols-[1fr_220px]">
              <div className="overflow-x-auto">
                <Segmented
                  block
                  options={categoryOptions}
                  value={query.categoryId}
                  onChange={(value) => setQuery((prev) => ({ ...prev, categoryId: String(value), page: 1 }))}
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
              <Input.Search
                allowClear
                placeholder="搜索花束、花材或标签"
                className="md:col-span-2"
                onSearch={(keyword) => setQuery((prev) => ({ ...prev, keyword, page: 1 }))}
              />
            </div>
          </div>
        </div>
      </div>

      <div className="mx-auto w-full max-w-[1680px] px-4 py-8 sm:px-6 lg:px-10">
        <div className="mb-6 flex flex-col gap-2 sm:flex-row sm:flex-wrap sm:items-center sm:justify-between sm:gap-3">
          <p className="text-sm font-medium text-muted">共展示 {total} 件作品</p>
          <p className="text-sm text-muted">当前排序：{query.sortBy === "featured" ? "精选优先" : query.sortBy === "latest" ? "最新作品" : query.sortBy === "price_asc" ? "价格从低到高" : "价格从高到低"}</p>
        </div>

        {flowers.length > 0 ? (
          <>
            <div className="grid gap-5 sm:grid-cols-2 xl:grid-cols-3 2xl:grid-cols-4">
              {flowers.map((flower) => (
                <FlowerCard key={flower.id} flower={flower} />
              ))}
            </div>
            <div className="mt-10 flex justify-center">
              <Pagination
                current={query.page ?? 1}
                pageSize={query.limit ?? 24}
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
