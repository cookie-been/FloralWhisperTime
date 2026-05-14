import { mkdirSync, writeFileSync } from "node:fs";
import { dirname, resolve } from "node:path";
import { fileURLToPath } from "node:url";

const __dirname = dirname(fileURLToPath(import.meta.url));
const repoRoot = resolve(__dirname, "../..");
const outputPath = resolve(repoRoot, "tmp/catalog/catalog-dataset.json");

const categoryConfigs = [
  {
    categoryId: "wedding",
    prefix: "wedding",
    priceStart: 1680,
    priceStep: 72,
    baseDate: new Date("2026-01-12T10:00:00Z"),
    featuredIndices: new Set([0, 1, 2, 3]),
    names: [
      "白纱誓语",
      "香槟晨礼",
      "雾粉花誓",
      "庄园回响",
      "林间约定",
      "月白序曲",
      "风铃礼道",
      "薄暮誓言",
      "晨雾花阶",
      "诗意迎宾",
      "宴庭微光",
      "白羽手捧",
    ],
    descriptions: [
      "以白绿和香槟花材铺开轻盈层次，适合户外婚礼第一视线的纯净表达。",
      "柔雾粉和奶油白组合出克制浪漫，适合誓言区与小型宴会场景。",
      "偏法式结构的婚礼花艺，强调线条舒展与空气感，适合拍照留存。",
      "庄园感枝叶和玫瑰层次并置，让仪式氛围更显完整而温柔。",
      "面向手捧与迎宾区域设计，强调近景细节和整体婚礼色调的统一。",
      "为轻礼服婚礼准备的柔亮花束，适合晨间证婚和自然光环境。",
    ],
    meanings: [
      "象征把承诺安放在柔和而坚定的仪式里。",
      "适合表达安稳、珍视与长久同行的情感。",
      "让婚礼现场保留热烈，也保留克制的优雅。",
      "寓意爱意在时间里缓慢生长，最终落成答案。",
      "适合记录一场带有秩序感和温柔细节的誓约。",
      "把最重要的一天，交给最安静却动人的花语。",
    ],
    materials: [
      ["白玫瑰", "香槟玫瑰", "绣球", "尤加利", "洋桔梗"],
      ["花园玫瑰", "飞燕草", "喷泉草", "尤加利", "蕾丝花"],
      ["奶油玫瑰", "白桔梗", "郁金香", "桉树叶", "满天星"],
      ["雾粉玫瑰", "香雪兰", "蝴蝶兰", "银叶菊", "小苍兰"],
    ],
    tags: [
      ["婚礼", "白绿系", "仪式感", "法式"],
      ["婚礼", "香槟色", "庄园", "户外"],
      ["婚礼", "手捧花", "雾粉", "浪漫"],
      ["婚礼", "迎宾区", "宴会", "高级感"],
    ],
  },
  {
    categoryId: "daily",
    prefix: "daily",
    priceStart: 398,
    priceStep: 16,
    baseDate: new Date("2026-01-22T10:00:00Z"),
    featuredIndices: new Set([0, 1, 2, 3]),
    names: [
      "奶油早安",
      "粉雾来信",
      "午后晴光",
      "柔白陪伴",
      "初甜心意",
      "小满告白",
      "晴窗花礼",
      "暖风留声",
      "轻氧日常",
      "温柔回信",
      "微糖花束",
      "治愈周末",
    ],
    descriptions: [
      "适合生日、探望和日常惊喜的轻盈花束，以柔和色调提升亲近感。",
      "用粉白和奶油色花材呈现低饱和温柔感，不夸张却足够有存在感。",
      "面向办公桌、家居角落与探访场景，保持清新、轻巧和易于陈设。",
      "强调轻礼赠的自然呼吸感，让花束看起来像被认真挑选过一样。",
      "适合表达日常感谢、治愈陪伴与不张扬的喜欢。",
    ],
    meanings: [
      "把一句关心变成可被看见和收藏的温柔。",
      "适合在平凡日子里给人一点明亮回响。",
      "让表达不必用力，也能被清楚接住。",
      "寓意被惦记、被看见和被认真对待。",
      "把轻轻落下的心意，包进一束柔软花礼里。",
    ],
    materials: [
      ["奶油玫瑰", "洋桔梗", "小菊", "银叶菊"],
      ["粉玫瑰", "康乃馨", "尤加利", "洋甘菊"],
      ["白桔梗", "郁金香", "小苍兰", "蕾丝花"],
      ["桃粉玫瑰", "喷泉草", "洋牡丹", "叶上花"],
    ],
    tags: [
      ["生日", "奶油色", "温柔", "日常"],
      ["探望", "粉白系", "治愈", "轻盈"],
      ["告白", "小花束", "温暖", "家居"],
      ["送礼", "日常花礼", "清新", "陪伴"],
    ],
  },
  {
    categoryId: "opening",
    prefix: "opening",
    priceStart: 1268,
    priceStep: 58,
    baseDate: new Date("2026-02-02T10:00:00Z"),
    featuredIndices: new Set([0, 1, 2, 3]),
    names: [
      "开张盛景",
      "鸿彩启程",
      "金枝贺序",
      "前厅迎禧",
      "繁荣序章",
      "瑞色盈门",
      "红金登场",
      "品牌开幕",
      "盛启花礼",
      "晨耀双层",
      "雅贺新章",
      "喜门长青",
    ],
    descriptions: [
      "面向品牌开业和门店揭幕场景，强化红金明亮与体面迎宾的第一印象。",
      "双层结构与跳色花材结合，适合前厅、门头与商业空间庆贺氛围。",
      "在热烈感之外保留干净品牌气质，适合拍照和长期陈列半日到一日。",
      "适合门店、展厅、品牌发布与商务来往场景的正式花礼表达。",
    ],
    meanings: [
      "寓意事业开启、气场舒展与来客盈门。",
      "适合表达开门红、顺势而上和持续生长。",
      "让庆贺不仅热烈，也显得有秩序和品牌感。",
      "把祝贺落成一件得体、明亮、可被记住的作品。",
    ],
    materials: [
      ["向日葵", "红掌", "跳舞兰", "龟背竹", "散尾葵"],
      ["帝王花", "火鹤", "香槟玫瑰", "龙柳", "巴西叶"],
      ["红玫瑰", "金鱼草", "文心兰", "富贵竹", "春羽"],
      ["绣球", "百合", "天堂鸟", "尤加利", "棕榈叶"],
    ],
    tags: [
      ["开业", "商务", "红金系", "双层花篮"],
      ["开张", "品牌活动", "庆贺", "明亮"],
      ["门店", "前厅", "欢迎花艺", "体面"],
      ["展厅", "商务花礼", "喜庆", "品牌感"],
    ],
  },
  {
    categoryId: "seasonal",
    prefix: "seasonal",
    priceStart: 458,
    priceStep: 18,
    baseDate: new Date("2026-02-18T10:00:00Z"),
    featuredIndices: new Set([0, 1, 2, 3]),
    names: [
      "春枝轻信",
      "初夏微澜",
      "仲夏清氧",
      "晚秋深橙",
      "冬日白序",
      "小满青意",
      "霜降留白",
      "谷雨花声",
      "立秋柔枝",
      "大雪静光",
      "惊蛰新芽",
      "清明晨露",
    ],
    descriptions: [
      "依据节令花材和色调组合，保留自然枝叶感与季节气息的流动性。",
      "适合在居家、工作室和轻礼赠场景中表达当下时令的微妙变化。",
      "突出春夏秋冬的温度差与空气感，让花束看起来像从季节里直接取来。",
      "强调轻氧、通透和呼吸感，适合喜欢自然系花材的人群。",
    ],
    meanings: [
      "把季节更替留在一束可被看见的花里。",
      "适合表达当下、变化与生活里的新鲜感。",
      "让节令不只是时间，也成为情绪的载体。",
      "以花材记录一年中最细微但真实的气候变化。",
    ],
    materials: [
      ["郁金香", "风信子", "小苍兰", "蕾丝花"],
      ["向日葵", "白桔梗", "绿铃草", "尤加利"],
      ["大丽花", "南瓜色玫瑰", "喷泉草", "红叶李"],
      ["银柳", "白玫瑰", "松枝", "棉花花"],
    ],
    tags: [
      ["节气", "春日", "自然系", "轻氧"],
      ["夏日", "枝叶感", "通透", "季节"],
      ["秋冬", "暖调", "时令", "清新"],
      ["节令花束", "居家", "自然", "温柔"],
    ],
  },
  {
    categoryId: "custom",
    prefix: "custom",
    priceStart: 2380,
    priceStep: 96,
    baseDate: new Date("2026-03-06T10:00:00Z"),
    featuredIndices: new Set([0, 1, 2, 3]),
    names: [
      "宴庭森叙",
      "橱窗留白",
      "品牌花幕",
      "餐桌回廊",
      "沙龙雾境",
      "空间序列",
      "枝影陈设",
      "展台微光",
      "林感桌景",
      "暮色装置",
      "活动花境",
      "白绿场域",
    ],
    descriptions: [
      "面向餐桌、橱窗、品牌活动和空间陈设，强调结构感与场域氛围的统一。",
      "利用枝叶、线条与花量分配建立沉浸感，适合活动拍照与品牌视觉表达。",
      "整体偏自然系和低饱和风格，适合需要克制高级感的商业空间。",
      "兼顾近景细节和远景轮廓，适合会场、沙龙与展陈类定制花艺。",
    ],
    meanings: [
      "让空间不仅被装饰，更被赋予明确气质。",
      "适合表达品牌调性、场景秩序与沉浸氛围。",
      "把花艺从花束延展为完整的空间语言。",
      "让活动场域在视觉上形成更长久的记忆点。",
    ],
    materials: [
      ["铁线莲", "花园玫瑰", "尤加利", "苔藓", "龙柳"],
      ["大飞燕", "蝴蝶兰", "白掌", "龟背竹", "银叶菊"],
      ["绣球", "洋牡丹", "喷泉草", "香雪兰", "春羽"],
      ["百合", "帝王花", "火鹤", "雪柳", "巴西木叶"],
    ],
    tags: [
      ["定制", "品牌活动", "空间花艺", "陈设"],
      ["宴会", "餐桌花艺", "高级感", "沉浸"],
      ["橱窗", "展陈", "白绿系", "结构感"],
      ["沙龙", "会场", "自然系", "品牌感"],
    ],
  },
  {
    categoryId: "preserved",
    prefix: "preserved",
    priceStart: 688,
    priceStep: 28,
    baseDate: new Date("2026-03-22T10:00:00Z"),
    featuredIndices: new Set([0, 1, 2, 3]),
    names: [
      "月影花盒",
      "长夏纪念",
      "雾粉珍藏",
      "玻璃晨光",
      "相框花语",
      "留白心意",
      "暖金礼匣",
      "薄荷永昼",
      "微光藏花",
      "旧梦礼盒",
      "珍序摆件",
      "时光存信",
    ],
    descriptions: [
      "以永生玫瑰和干燥花材构成长期保存的礼物形态，适合纪念与收藏。",
      "整体偏柔和、精致和可长期陈设，适合礼盒、玻璃罩与相框类表达。",
      "在稳定结构中保留轻柔色彩层次，兼顾送礼体面和居家摆放效果。",
      "适合纪念日、感谢、祝福和收藏型花礼场景。",
    ],
    meanings: [
      "把短暂心意留成更长久的陪伴。",
      "适合承载思念、纪念和不易说出口的感谢。",
      "让礼物在时间里停留得更久一些。",
      "把花最温柔的一面，留在日常可见的位置。",
    ],
    materials: [
      ["永生玫瑰", "兔尾草", "绣球干花", "索拉花"],
      ["永生康乃馨", "满天星", "尤加利果", "棉花花"],
      ["永生玫瑰", "金杖球", "小雏菊干花", "情人草"],
      ["永生绣球", "法式纸花", "苔藓", "保鲜叶材"],
    ],
    tags: [
      ["永生花", "礼盒", "纪念", "收藏"],
      ["玻璃罩", "摆件", "温柔", "长久保存"],
      ["相框花礼", "送礼", "精致", "治愈"],
      ["家居", "永生花系列", "礼物", "柔和"],
    ],
  },
];

function createCreatedAt(baseDate, index) {
  const date = new Date(baseDate);
  date.setUTCDate(date.getUTCDate() + index * 9);
  date.setUTCHours(10 + (index % 6), 0, 0, 0);
  return date.toISOString();
}

function getPrice(config, index) {
  return Math.max(188, config.priceStart - config.priceStep * index);
}

function getSort(index) {
  return 100 - index * 3;
}

function pickFrom(list, index) {
  return list[index % list.length];
}

const catalog = [];

for (const config of categoryConfigs) {
  for (let index = 0; index < 12; index += 1) {
    const itemIndex = index + 1;
    const materialSet = pickFrom(config.materials, index);
    const tagSet = pickFrom(config.tags, index);
    const description = pickFrom(config.descriptions, index);
    const meaning = pickFrom(config.meanings, index);
    const imageCount = ["wedding", "opening", "custom"].includes(config.categoryId) ? 3 : 2;

    catalog.push({
      id: `${config.prefix}_${String(itemIndex).padStart(3, "0")}`,
      name: config.names[index],
      categoryId: config.categoryId,
      images: Array.from({ length: imageCount }, () => ""),
      price: getPrice(config, index),
      description,
      materials: materialSet,
      meaning,
      tags: tagSet,
      featured: config.featuredIndices.has(index),
      sort: getSort(index),
      createdAt: createCreatedAt(config.baseDate, index),
    });
  }
}

mkdirSync(resolve(repoRoot, "tmp/catalog"), { recursive: true });
writeFileSync(outputPath, `${JSON.stringify(catalog, null, 2)}\n`, "utf8");
console.log(`Generated ${catalog.length} catalog items at ${outputPath}`);
