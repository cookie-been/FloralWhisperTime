const { brandStory, categories, flowers, shopInfo, teamMembers } = require("./data");

const wait = (ms = 160) => new Promise((resolve) => setTimeout(resolve, ms));

async function getFlowers(query = {}) {
  await wait();
  const page = query.page || 1;
  const limit = query.limit || 20;
  const keyword = query.keyword ? query.keyword.trim().toLowerCase() : "";

  let list = flowers.filter((flower) => {
    const categoryMatched = !query.categoryId || query.categoryId === "all" || flower.categoryId === query.categoryId;
    const tagMatched = !query.tag || flower.tags.includes(query.tag);
    const keywordMatched =
      !keyword ||
      [flower.name, flower.description, flower.meaning].concat(flower.materials, flower.tags).join(" ").toLowerCase().includes(keyword);

    return categoryMatched && tagMatched && keywordMatched;
  });

  list = [...list].sort((leftFlower, rightFlower) => {
    if (query.sortBy === "latest") {
      return Date.parse(rightFlower.createdAt) - Date.parse(leftFlower.createdAt);
    }
    if (query.sortBy === "price_asc") {
      return leftFlower.price - rightFlower.price;
    }
    if (query.sortBy === "price_desc") {
      return rightFlower.price - leftFlower.price;
    }
    if (query.sortBy === "featured") {
      return Number(rightFlower.featured) - Number(leftFlower.featured) || rightFlower.sort - leftFlower.sort;
    }
    return rightFlower.sort - leftFlower.sort;
  });

  const startIndex = (page - 1) * limit;

  return {
    list: list.slice(startIndex, startIndex + limit),
    total: list.length,
    page,
    limit,
  };
}

async function getFlowerById(id) {
  await wait();
  return flowers.find((flower) => flower.id === id) || null;
}

async function getRelatedFlowers(flower, limit = 3) {
  await wait();
  return flowers
    .filter((item) => item.id !== flower.id && (item.categoryId === flower.categoryId || item.tags.some((tag) => flower.tags.includes(tag))))
    .sort((leftFlower, rightFlower) => rightFlower.sort - leftFlower.sort)
    .slice(0, limit);
}

async function getCategories() {
  await wait();
  return [...categories].sort((leftCategory, rightCategory) => rightCategory.sort - leftCategory.sort);
}

async function getShopInfo() {
  await wait();
  return shopInfo;
}

async function getBrandStory() {
  await wait();
  return brandStory;
}

async function getTeamMembers() {
  await wait();
  return teamMembers;
}

async function getAboutTimeline() {
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

async function submitContact(form) {
  await wait(300);
  if (!form.name.trim() || !form.phone.trim() || !form.message.trim()) {
    throw new Error("请完整填写姓名、电话和留言内容");
  }

  return { success: true };
}

module.exports = {
  getAboutTimeline,
  getBrandStory,
  getCategories,
  getFlowerById,
  getFlowers,
  getRelatedFlowers,
  getShopInfo,
  getTeamMembers,
  submitContact,
};
