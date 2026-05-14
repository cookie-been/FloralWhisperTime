import { useEffect, useMemo, useState } from "react";
import { Empty, Input, Select, Segmented } from "antd";
import { FlowerCard } from "@/components/common/FlowerCard";
import { getCategories, getFlowers } from "@/services/api";
import type { Category, Flower, FlowerQuery } from "@/types";

export function Gallery() {
  const [categories, setCategories] = useState<Category[]>([]);
  const [flowers, setFlowers] = useState<Flower[]>([]);
  const [query, setQuery] = useState<FlowerQuery>({ categoryId: "all", sortBy: "featured", page: 1, limit: 40 });

  useEffect(() => {
    getCategories().then(setCategories);
  }, []);

  useEffect(() => {
    getFlowers(query).then((result) => setFlowers(result.list));
  }, [query]);

  const categoryOptions = useMemo(() => categories.map((item) => ({ label: item.name, value: item.id })), [categories]);

  return (
    <section className="mx-auto max-w-7xl px-4 py-12 sm:px-6 lg:px-8">
      <div className="mb-8">
        <p className="section-eyebrow">Gallery</p>
        <h1 className="section-title section-title-accent mt-2 text-4xl text-ink">作品画廊</h1>
        <p className="mt-3 max-w-2xl leading-7 text-muted">按分类、关键词和排序浏览花语时光的花束与空间花艺作品。</p>
      </div>

      <div className="mb-8 grid gap-4 rounded-lg bg-[#f7fbf7] p-4 md:grid-cols-[1fr_220px]">
        <div className="overflow-x-auto">
          <Segmented
            options={categoryOptions}
            value={query.categoryId}
            onChange={(value) => setQuery((prev) => ({ ...prev, categoryId: String(value), page: 1 }))}
          />
        </div>
        <Select
          value={query.sortBy}
          onChange={(value) => setQuery((prev) => ({ ...prev, sortBy: value }))}
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

      {flowers.length > 0 ? (
        <div className="grid gap-6 sm:grid-cols-2 md:grid-cols-3 xl:grid-cols-4">
          {flowers.map((flower) => (
            <FlowerCard key={flower.id} flower={flower} />
          ))}
        </div>
      ) : (
        <div className="rounded-lg bg-[#f7fbf7] py-16">
          <Empty description="没有找到匹配的花束作品" />
        </div>
      )}
    </section>
  );
}
