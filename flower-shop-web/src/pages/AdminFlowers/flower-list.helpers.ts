import type { Category, Flower } from "@/types";
import { buildBatchMutationSummary, buildSelectedTableRows } from "@/utils/admin-table";
import type { DeletedFilter, FeaturedFilter } from "./AdminFlowerTypes";

interface FlowerFilterState {
  search: string;
  selectedCategory: string;
  featuredFilter: FeaturedFilter;
  deletedFilter: DeletedFilter;
}

export function hasFlowerActiveFilters(state: FlowerFilterState) {
  return (
    Boolean(state.search.trim()) ||
    state.selectedCategory !== "all" ||
    state.featuredFilter !== "all" ||
    state.deletedFilter !== "active"
  );
}

export function buildFlowerCategoryMap(categories: Category[]) {
  return new Map(categories.filter((item) => item.id !== "all").map((item) => [item.id, item.name]));
}

export function buildFlowerCategoryOptions(categories: Category[]) {
  return categories
    .filter((item) => item.id !== "all")
    .map((item) => ({ label: item.name, value: item.id }));
}

export function filterFlowers(flowers: Flower[], state: Omit<FlowerFilterState, "deletedFilter">) {
  const keyword = state.search.trim().toLowerCase();

  return flowers.filter((flower) => {
    const matchesKeyword =
      !keyword ||
      [flower.code, flower.name, flower.description, flower.meaning, flower.tags.join(" "), flower.materials.join(" ")]
        .join(" ")
        .toLowerCase()
        .includes(keyword);
    const matchesCategory = state.selectedCategory === "all" || flower.categoryId === state.selectedCategory;
    const matchesFeatured =
      state.featuredFilter === "all" || (state.featuredFilter === "featured" ? flower.featured : !flower.featured);

    return matchesKeyword && matchesCategory && matchesFeatured;
  });
}

export function buildFlowerFilterSummary(state: Omit<FlowerFilterState, "deletedFilter"> & {
  deletedFilter: DeletedFilter;
  categoryMap: Map<string, string>;
}) {
  const parts: string[] = [];
  if (state.deletedFilter === "deleted") parts.push("已删除数据");
  if (state.search.trim()) parts.push(`关键词“${state.search.trim()}”`);
  if (state.selectedCategory !== "all") {
    parts.push(`分类“${state.categoryMap.get(state.selectedCategory) ?? state.selectedCategory}”`);
  }
  if (state.featuredFilter === "featured") parts.push("仅看精选");
  if (state.featuredFilter === "normal") parts.push("仅看普通");
  return parts;
}

export function buildFlowerMetrics(
  flowers: Flower[],
  filteredFlowers: Flower[],
  deletedFilter: DeletedFilter,
  categoryOptionCount: number,
) {
  return [
    {
      label: deletedFilter === "deleted" ? "已删除作品" : "全部作品",
      value: flowers.length,
      note: deletedFilter === "deleted" ? "当前回收站中的作品数量" : "当前后端数据中的总作品数",
    },
    { label: "当前筛选结果", value: filteredFlowers.length, note: "列表中此刻可见的作品数量" },
    { label: "精选作品", value: flowers.filter((item) => item.featured).length, note: "会更容易在前台重点区域出现" },
    { label: "分类数量", value: categoryOptionCount, note: "用于前台筛选与后台内容组织" },
  ];
}

export function sortFlowers(flowers: Flower[]) {
  return [...flowers].sort((left, right) => right.sort - left.sort || left.name.localeCompare(right.name, "zh-CN"));
}

export function buildSelectedFlowers(list: Flower[], selectedRowKeys: string[]) {
  return buildSelectedTableRows(list, selectedRowKeys);
}

export function buildFlowerBatchMutationSummary(
  list: Flower[],
  results: PromiseSettledResult<unknown>[],
) {
  return buildBatchMutationSummary(list, results);
}
