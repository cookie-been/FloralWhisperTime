import cors from "cors";
import express from "express";
import fs from "node:fs/promises";
import crypto from "node:crypto";
import path from "node:path";
import { fileURLToPath } from "node:url";
import multer from "multer";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const dataFile = path.join(__dirname, "data", "db.json");
const uploadsDir = path.join(__dirname, "uploads");
const port = Number(process.env.PORT ?? 3001);
const publicBaseUrl = process.env.PUBLIC_BASE_URL ?? `http://localhost:${port}`;
const adminUsername = process.env.ADMIN_USERNAME ?? "admin";
const adminPassword = process.env.ADMIN_PASSWORD ?? "Floral@2026";
const authSecret = process.env.ADMIN_AUTH_SECRET ?? "floral-whisper-time-dev-secret";

const app = express();
app.use(cors());
app.use(express.json({ limit: "2mb" }));
app.use("/uploads", express.static(uploadsDir));

const storage = multer.diskStorage({
  destination: uploadsDir,
  filename: (_req, file, cb) => {
    const ext = path.extname(file.originalname) || ".jpg";
    cb(null, `${Date.now()}-${Math.round(Math.random() * 1e9)}${ext}`);
  },
});

const upload = multer({
  storage,
  limits: { fileSize: 5 * 1024 * 1024 },
  fileFilter: (_req, file, cb) => {
    cb(null, file.mimetype.startsWith("image/"));
  },
});

function createToken(username) {
  const signature = crypto.createHmac("sha256", authSecret).update(username).digest("hex");
  return Buffer.from(`${username}:${signature}`).toString("base64url");
}

function verifyToken(token) {
  if (!token) return false;
  try {
    const decoded = Buffer.from(token, "base64url").toString("utf-8");
    const [username, signature] = decoded.split(":");
    return username === adminUsername && signature === crypto.createHmac("sha256", authSecret).update(username).digest("hex");
  } catch {
    return false;
  }
}

function requireAdmin(req, res, next) {
  const authHeader = req.headers.authorization ?? "";
  const token = authHeader.startsWith("Bearer ") ? authHeader.slice(7) : "";
  if (!verifyToken(token)) {
    return res.status(401).json({ message: "请先登录管理后台" });
  }
  next();
}

async function readDb() {
  const raw = await fs.readFile(dataFile, "utf-8");
  return JSON.parse(raw);
}

async function writeDb(db) {
  await fs.writeFile(dataFile, `${JSON.stringify(db, null, 2)}\n`, "utf-8");
}

function sortFlowers(list, sortBy) {
  return [...list].sort((a, b) => {
    if (sortBy === "latest") return Date.parse(b.createdAt) - Date.parse(a.createdAt);
    if (sortBy === "price_asc") return a.price - b.price;
    if (sortBy === "price_desc") return b.price - a.price;
    if (sortBy === "featured") return Number(b.featured) - Number(a.featured) || b.sort - a.sort;
    return b.sort - a.sort;
  });
}

function normalizeArray(value) {
  if (Array.isArray(value)) return value.map(String).map((item) => item.trim()).filter(Boolean);
  if (typeof value === "string") {
    return value
      .split(/[,\n，、]/)
      .map((item) => item.trim())
      .filter(Boolean);
  }
  return [];
}

function normalizeFlower(body, existing = {}) {
  const name = String(body.name ?? existing.name ?? "").trim();
  const categoryId = String(body.categoryId ?? existing.categoryId ?? "").trim();
  if (!name || !categoryId) {
    const error = new Error("花束名称和分类不能为空");
    error.status = 400;
    throw error;
  }

  return {
    id: String(body.id ?? existing.id ?? `${categoryId}_${Date.now()}`).trim(),
    name,
    categoryId,
    images: normalizeArray(body.images ?? existing.images),
    price: Number(body.price ?? existing.price ?? 0),
    description: String(body.description ?? existing.description ?? "").trim(),
    materials: normalizeArray(body.materials ?? existing.materials),
    meaning: String(body.meaning ?? existing.meaning ?? "").trim(),
    tags: normalizeArray(body.tags ?? existing.tags),
    featured: Boolean(body.featured ?? existing.featured ?? false),
    sort: Number(body.sort ?? existing.sort ?? 0),
    createdAt: String(body.createdAt ?? existing.createdAt ?? new Date().toISOString()),
  };
}

function getDefaultSiteConfig(db) {
  return {
    brandName: db.shopInfo?.name ?? "花语时光",
    heroEyebrow: "清新文艺 · 自然温暖",
    heroTitle: db.shopInfo?.name ?? "花语时光",
    heroDescription: "用季节花材和克制色彩，制作适合婚礼、日常赠礼与空间陈列的鲜花作品。",
    heroImage: "https://picsum.photos/seed/floral-hero/1920/1080",
    primaryCtaText: "浏览作品",
    secondaryCtaText: "联系门店",
    stats: [
      { value: "860+", label: "已服务客户" },
      { value: "320+", label: "花艺作品" },
      { value: "6", label: "主题分类" },
    ],
    contactIntro: "欢迎预约花束、婚礼花艺、商业空间花艺和节日定制服务。",
    businessHoursText: "周一至周五 09:30-21:00，周末 10:00-21:30",
    footerDescription: "纯展示型鲜花店窗口，展示婚礼、日常花礼、开业花篮、节气花束与定制花艺。",
  };
}

function getSiteConfig(db) {
  return { ...getDefaultSiteConfig(db), ...(db.siteConfig ?? {}) };
}

function normalizeSiteConfig(body, db) {
  const current = getSiteConfig(db);
  return {
    brandName: String(body.brandName ?? current.brandName).trim(),
    heroEyebrow: String(body.heroEyebrow ?? current.heroEyebrow).trim(),
    heroTitle: String(body.heroTitle ?? current.heroTitle).trim(),
    heroDescription: String(body.heroDescription ?? current.heroDescription).trim(),
    heroImage: String(body.heroImage ?? current.heroImage).trim(),
    primaryCtaText: String(body.primaryCtaText ?? current.primaryCtaText).trim(),
    secondaryCtaText: String(body.secondaryCtaText ?? current.secondaryCtaText).trim(),
    stats: Array.isArray(body.stats)
      ? body.stats.map((item) => ({ value: String(item.value ?? "").trim(), label: String(item.label ?? "").trim() })).filter((item) => item.value && item.label)
      : current.stats,
    contactIntro: String(body.contactIntro ?? current.contactIntro).trim(),
    businessHoursText: String(body.businessHoursText ?? current.businessHoursText).trim(),
    footerDescription: String(body.footerDescription ?? current.footerDescription).trim(),
  };
}

app.get("/api/health", (_req, res) => {
  res.json({ ok: true, service: "flower-shop-backend" });
});

app.post("/api/admin/login", (req, res) => {
  const { username, password } = req.body;
  if (username !== adminUsername || password !== adminPassword) {
    return res.status(401).json({ message: "账号或密码错误" });
  }
  res.json({ token: createToken(username), username });
});

app.get("/api/admin/me", requireAdmin, (_req, res) => {
  res.json({ username: adminUsername });
});

app.get("/api/site-config", async (_req, res) => {
  const db = await readDb();
  res.json(getSiteConfig(db));
});

app.put("/api/site-config", requireAdmin, async (req, res) => {
  const db = await readDb();
  const siteConfig = normalizeSiteConfig(req.body, db);
  db.siteConfig = siteConfig;
  db.shopInfo = {
    ...db.shopInfo,
    name: siteConfig.brandName,
    phone: String(req.body.phone ?? db.shopInfo.phone ?? "").trim(),
    wechat: String(req.body.wechat ?? db.shopInfo.wechat ?? "").trim(),
    address: String(req.body.address ?? db.shopInfo.address ?? "").trim(),
    latitude: Number(req.body.latitude ?? db.shopInfo.latitude ?? 0),
    longitude: Number(req.body.longitude ?? db.shopInfo.longitude ?? 0),
  };
  db.brandStory = {
    ...db.brandStory,
    title: String(req.body.storyTitle ?? db.brandStory.title ?? "").trim(),
    subtitle: String(req.body.storySubtitle ?? db.brandStory.subtitle ?? "").trim(),
    content: String(req.body.storyContent ?? db.brandStory.content ?? "").trim(),
    images: normalizeArray(req.body.storyImages ?? db.brandStory.images),
  };
  await writeDb(db);
  res.json({ siteConfig: getSiteConfig(db), shopInfo: db.shopInfo, brandStory: db.brandStory });
});

app.get("/api/flowers", async (req, res) => {
  const db = await readDb();
  const { categoryId, tag, keyword, sortBy } = req.query;
  const page = Number(req.query.page ?? 1);
  const limit = Number(req.query.limit ?? 20);
  const normalizedKeyword = String(keyword ?? "").trim().toLowerCase();

  let list = db.flowers.filter((flower) => {
    const categoryMatched = !categoryId || categoryId === "all" || flower.categoryId === categoryId;
    const tagMatched = !tag || flower.tags.includes(String(tag));
    const keywordMatched =
      !normalizedKeyword ||
      [flower.name, flower.description, flower.meaning, ...flower.materials, ...flower.tags]
        .join(" ")
        .toLowerCase()
        .includes(normalizedKeyword);
    return categoryMatched && tagMatched && keywordMatched;
  });

  list = sortFlowers(list, sortBy);
  const start = (page - 1) * limit;
  res.json({ list: list.slice(start, start + limit), total: list.length, page, limit });
});

app.get("/api/flowers/:id", async (req, res) => {
  const db = await readDb();
  const flower = db.flowers.find((item) => item.id === req.params.id);
  if (!flower) return res.status(404).json({ message: "作品不存在" });
  res.json(flower);
});

app.get("/api/flowers/:id/related", async (req, res) => {
  const db = await readDb();
  const flower = db.flowers.find((item) => item.id === req.params.id);
  if (!flower) return res.status(404).json({ message: "作品不存在" });
  const limit = Number(req.query.limit ?? 3);
  const related = sortFlowers(
    db.flowers.filter(
      (item) =>
        item.id !== flower.id && (item.categoryId === flower.categoryId || item.tags.some((tag) => flower.tags.includes(tag))),
    ),
  ).slice(0, limit);
  res.json(related);
});

app.post("/api/flowers", requireAdmin, async (req, res, next) => {
  try {
    const db = await readDb();
    const flower = normalizeFlower(req.body);
    if (db.flowers.some((item) => item.id === flower.id)) {
      return res.status(409).json({ message: "作品 ID 已存在" });
    }
    db.flowers.unshift(flower);
    await writeDb(db);
    res.status(201).json(flower);
  } catch (error) {
    next(error);
  }
});

app.put("/api/flowers/:id", requireAdmin, async (req, res, next) => {
  try {
    const db = await readDb();
    const index = db.flowers.findIndex((item) => item.id === req.params.id);
    if (index === -1) return res.status(404).json({ message: "作品不存在" });
    const flower = normalizeFlower({ ...req.body, id: req.params.id }, db.flowers[index]);
    db.flowers[index] = flower;
    await writeDb(db);
    res.json(flower);
  } catch (error) {
    next(error);
  }
});

app.delete("/api/flowers/:id", requireAdmin, async (req, res) => {
  const db = await readDb();
  const nextFlowers = db.flowers.filter((item) => item.id !== req.params.id);
  if (nextFlowers.length === db.flowers.length) return res.status(404).json({ message: "作品不存在" });
  db.flowers = nextFlowers;
  await writeDb(db);
  res.status(204).end();
});

app.post("/api/uploads", requireAdmin, upload.single("file"), (req, res) => {
  if (!req.file) return res.status(400).json({ message: "请选择图片文件" });
  const uploadPath = `/uploads/${req.file.filename}`;
  res.status(201).json({ url: publicBaseUrl ? `${publicBaseUrl}${uploadPath}` : uploadPath });
});

app.get("/api/categories", async (_req, res) => {
  const db = await readDb();
  res.json([...db.categories].sort((a, b) => b.sort - a.sort));
});

app.get("/api/shop-info", async (_req, res) => {
  const db = await readDb();
  res.json(db.shopInfo);
});

app.get("/api/brand-story", async (_req, res) => {
  const db = await readDb();
  res.json(db.brandStory);
});

app.get("/api/team", async (_req, res) => {
  const db = await readDb();
  res.json(db.teamMembers);
});

app.post("/api/contact", async (req, res) => {
  const { name, phone, message } = req.body;
  if (!String(name ?? "").trim() || !String(phone ?? "").trim() || !String(message ?? "").trim()) {
    return res.status(400).json({ message: "请完整填写姓名、电话和留言内容" });
  }
  const db = await readDb();
  db.contacts.push({ id: `contact_${Date.now()}`, name, phone, message, createdAt: new Date().toISOString() });
  await writeDb(db);
  res.status(201).json({ success: true });
});

app.use((error, _req, res, _next) => {
  res.status(error.status ?? 500).json({ message: error.message ?? "服务器错误" });
});

await fs.mkdir(uploadsDir, { recursive: true });
app.listen(port, () => {
  console.log(`Flower shop backend listening on ${publicBaseUrl}`);
  console.log(`Admin login: ${adminUsername} / ${adminPassword}`);
});
