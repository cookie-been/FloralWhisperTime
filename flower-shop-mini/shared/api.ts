import { brandStory, categories, flowers, shopInfo, teamMembers } from "./data";
import type { AboutTimelineEntry, ContactForm, Flower, FlowerQuery, PaginatedResult } from "./types";

const wait = (ms = 160) => new Promise((resolve) => setTimeout(resolve, ms));

export async function getFlowers(query: FlowerQuery = {}): Promise<PaginatedResult<Flower>> {
  await wait();
  const page = query.page ?? 1;
  const limit = query.limit ?? 20;
  const keyword = query.keyword?.trim().toLowerCase();

  let list = flowers.filter((flower) => {
    const categoryMatched = !query.categoryId || query.categoryId === "all" || flower.categoryId === query.categoryId;
    const tagMatched = !query.tag || flower.tags.includes(query.tag);
    const keywordMatched =
      !keyword ||
      [flower.name, flower.description, flower.meaning, ...flower.materials, ...flower.tags]
        .join(" ")
        .toLowerCase()
        .includes(keyword);

    return categoryMatched && tagMatched && keywordMatched;
  });

  list = [...list].sort((a, b) => {
    if (query.sortBy === "latest") return Date.parse(b.createdAt) - Date.parse(a.createdAt);
    if (query.sortBy === "price_asc") return a.price - b.price;
    if (query.sortBy === "price_desc") return b.price - a.price;
    if (query.sortBy === "featured") return Number(b.featured) - Number(a.featured) || b.sort - a.sort;
    return b.sort - a.sort;
  });

  const start = (page - 1) * limit;
  return {
    list: list.slice(start, start + limit),
    total: list.length,
    page,
    limit,
  };
}

export async function getFlowerById(id: string) {
  await wait();
  return flowers.find((flower) => flower.id === id) ?? null;
}

export async function getRelatedFlowers(flower: Flower, limit = 3) {
  await wait();
  return flowers
    .filter((item) => item.id !== flower.id && (item.categoryId === flower.categoryId || item.tags.some((tag) => flower.tags.includes(tag))))
    .sort((a, b) => b.sort - a.sort)
    .slice(0, limit);
}

export async function getCategories() {
  await wait();
  return [...categories].sort((a, b) => b.sort - a.sort);
}

export async function getShopInfo() {
  await wait();
  return shopInfo;
}

export async function getBrandStory() {
  await wait();
  return brandStory;
}

export async function getTeamMembers() {
  await wait();
  return teamMembers;
}

export async function getAboutTimeline(): Promise<AboutTimelineEntry[]> {
  await wait();
  return [
    {
      id: "timeline-1",
      yearLabel: "2019",
      content: "从季节花材工作室起步，开始为日常赠礼和小型活动提供定制花束。",
      sort: 1,
    },
    {
      id: "timeline-2",
      yearLabel: "2021",
      content: "扩展到婚礼与宴会花艺服务，形成更完整的场景化设计方法。",
      sort: 2,
    },
    {
      id: "timeline-3",
      yearLabel: "2024",
      content: "完善门店展示与线上作品同步，让咨询、到店与交付体验更统一。",
      sort: 3,
    },
  ];
}

export async function submitContact(form: ContactForm) {
  await wait(300);
  if (!form.name.trim() || !form.phone.trim() || !form.message.trim()) {
    throw new Error("请完整填写姓名、电话和留言内容");
  }

  return { success: true };
}
