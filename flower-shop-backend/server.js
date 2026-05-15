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
const tokenLifetimeSeconds = 8 * 60 * 60;
const rateLimitStore = new Map();
const loginFailureStore = new Map();

const app = express();
app.use(cors());
app.use(express.json({ limit: "2mb" }));
app.use("/uploads", express.static(uploadsDir));
app.set("trust proxy", false);

app.use((req, res, next) => {
  res.setHeader("X-Content-Type-Options", "nosniff");
  res.setHeader("X-Frame-Options", "DENY");
  res.setHeader("Referrer-Policy", "strict-origin-when-cross-origin");
  res.setHeader("Cross-Origin-Resource-Policy", "same-site");
  next();
});

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
    cb(null, file.mimetype.startsWith("image/") && /\.(png|jpe?g|webp|gif|bmp|avif|svg)$/i.test(file.originalname));
  },
});

function nowSeconds() {
  return Math.floor(Date.now() / 1000);
}

function getClientIp(req) {
  return req.ip || req.socket?.remoteAddress || "unknown";
}

function logSecurityEvent(event, payload = {}) {
  console.warn(JSON.stringify({ scope: "security", event, time: new Date().toISOString(), ...payload }));
}

function toBase64Url(value) {
  return Buffer.from(value, "utf-8").toString("base64url");
}

function fromBase64Url(value) {
  return Buffer.from(value, "base64url").toString("utf-8");
}

function createSignedTokenPayload(username) {
  return {
    username,
    iat: nowSeconds(),
    exp: nowSeconds() + tokenLifetimeSeconds,
    nonce: crypto.randomBytes(12).toString("hex"),
  };
}

function createToken(username) {
  const payload = createSignedTokenPayload(username);
  const encodedPayload = toBase64Url(JSON.stringify(payload));
  const signature = crypto.createHmac("sha256", authSecret).update(encodedPayload).digest("hex");
  return `${encodedPayload}.${signature}`;
}

function verifyToken(token) {
  if (!token) return { valid: false, reason: "missing" };
  try {
    const [encodedPayload, signature] = String(token).split(".");
    if (!encodedPayload || !signature) return { valid: false, reason: "malformed" };

    const expectedSignature = crypto.createHmac("sha256", authSecret).update(encodedPayload).digest("hex");
    if (!crypto.timingSafeEqual(Buffer.from(signature), Buffer.from(expectedSignature))) {
      return { valid: false, reason: "signature" };
    }

    const payload = JSON.parse(fromBase64Url(encodedPayload));
    if (payload.username !== adminUsername) return { valid: false, reason: "username" };
    if (!Number.isFinite(payload.exp) || payload.exp <= nowSeconds()) return { valid: false, reason: "expired" };
    return { valid: true, payload };
  } catch {
    return { valid: false, reason: "malformed" };
  }
}

function requireAdmin(req, res, next) {
  const authHeader = req.headers.authorization ?? "";
  const token = authHeader.startsWith("Bearer ") ? authHeader.slice(7) : "";
  const result = verifyToken(token);
  if (!result.valid) {
    logSecurityEvent("admin_auth_rejected", { ip: getClientIp(req), reason: result.reason, path: req.path });
    return res.status(401).json({ message: result.reason === "expired" ? "登录状态已过期，请重新登录" : "请先登录管理后台" });
  }
  req.admin = result.payload;
  next();
}

function makeLimiter({ key, windowMs, max, message }) {
  return (req, res, next) => {
    const limiterKey = `${key}:${typeof key === "function" ? key(req) : getClientIp(req)}`;
    const current = Date.now();
    const record = rateLimitStore.get(limiterKey);
    if (!record || record.expiresAt <= current) {
      rateLimitStore.set(limiterKey, { count: 1, expiresAt: current + windowMs });
      return next();
    }

    if (record.count >= max) {
      logSecurityEvent("rate_limit_rejected", { ip: getClientIp(req), path: req.path, key: limiterKey });
      return res.status(429).json({ message });
    }

    record.count += 1;
    next();
  };
}

function getLoginFailureKey(req, username) {
  return `${getClientIp(req)}:${String(username ?? "").trim()}`;
}

function getLoginFailureState(key) {
  const record = loginFailureStore.get(key);
  if (!record) return null;
  if (record.lockedUntil && record.lockedUntil > Date.now()) return record;
  if (record.lockedUntil && record.lockedUntil <= Date.now()) {
    loginFailureStore.delete(key);
    return null;
  }
  return record;
}

function recordLoginFailure(key) {
  const current = loginFailureStore.get(key) ?? { count: 0, lockedUntil: 0 };
  current.count += 1;
  if (current.count >= 5) current.lockedUntil = Date.now() + 15 * 60 * 1000;
  loginFailureStore.set(key, current);
  return current;
}

function resetLoginFailures(key) {
  loginFailureStore.delete(key);
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

function normalizeBoundedString(value, { label, max = 5000, min = 0, allowEmpty = true } = {}) {
  const normalized = String(value ?? "").trim();
  if (!allowEmpty && normalized.length < Math.max(min, 1)) {
    const error = new Error(`${label}不能为空`);
    error.status = 400;
    throw error;
  }
  if (normalized.length < min) {
    const error = new Error(`${label}长度不合法`);
    error.status = 400;
    throw error;
  }
  if (normalized.length > max) {
    const error = new Error(`${label}不能超过 ${max} 个字符`);
    error.status = 400;
    throw error;
  }
  return normalized;
}

function normalizeNumber(value, { label, min = Number.MIN_SAFE_INTEGER, max = Number.MAX_SAFE_INTEGER } = {}) {
  const numeric = Number(value);
  if (!Number.isFinite(numeric) || numeric < min || numeric > max) {
    const error = new Error(`${label}超出允许范围`);
    error.status = 400;
    throw error;
  }
  return numeric;
}

function isValidHttpUrl(value) {
  if (!value) return false;
  try {
    const parsed = new URL(String(value));
    return parsed.protocol === "http:" || parsed.protocol === "https:";
  } catch {
    return false;
  }
}

function normalizeUrlValue(value, label, { allowEmpty = true } = {}) {
  const normalized = String(value ?? "").trim();
  if (!normalized && allowEmpty) return "";
  if (!isValidHttpUrl(normalized) && !normalized.startsWith("/uploads/")) {
    const error = new Error(`${label}格式不正确`);
    error.status = 400;
    throw error;
  }
  return normalized;
}

function normalizeFlower(body, existing = {}) {
  const name = normalizeBoundedString(body.name ?? existing.name, { label: "花束名称", max: 80, allowEmpty: false });
  const categoryId = normalizeBoundedString(body.categoryId ?? existing.categoryId, { label: "分类", max: 40, allowEmpty: false });
  if (!name || !categoryId) {
    const error = new Error("花束名称和分类不能为空");
    error.status = 400;
    throw error;
  }

  const images = normalizeArray(body.images ?? existing.images).map((item) => normalizeUrlValue(item, "图片地址", { allowEmpty: false }));
  const materials = normalizeArray(body.materials ?? existing.materials).map((item) =>
    normalizeBoundedString(item, { label: "花材", max: 60, allowEmpty: false }),
  );
  const tags = normalizeArray(body.tags ?? existing.tags).map((item) =>
    normalizeBoundedString(item, { label: "标签", max: 30, allowEmpty: false }),
  );

  return {
    id: normalizeBoundedString(body.id ?? existing.id ?? `${categoryId}_${Date.now()}`, { label: "作品 ID", max: 80, allowEmpty: false }),
    name,
    categoryId,
    images,
    price: normalizeNumber(body.price ?? existing.price ?? 0, { label: "参考价", min: 0, max: 999999 }),
    description: normalizeBoundedString(body.description ?? existing.description, { label: "设计描述", max: 800 }),
    materials,
    meaning: normalizeBoundedString(body.meaning ?? existing.meaning, { label: "花语寓意", max: 400 }),
    tags,
    featured: Boolean(body.featured ?? existing.featured ?? false),
    sort: normalizeNumber(body.sort ?? existing.sort ?? 0, { label: "排序权重", min: -99999, max: 99999 }),
    createdAt: normalizeBoundedString(body.createdAt ?? existing.createdAt ?? new Date().toISOString(), { label: "创建时间", max: 64, allowEmpty: false }),
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
    brandName: normalizeBoundedString(body.brandName ?? current.brandName, { label: "品牌名称", max: 60 }),
    heroEyebrow: normalizeBoundedString(body.heroEyebrow ?? current.heroEyebrow, { label: "首屏小标语", max: 80 }),
    heroTitle: normalizeBoundedString(body.heroTitle ?? current.heroTitle, { label: "首页主标题", max: 120 }),
    heroDescription: normalizeBoundedString(body.heroDescription ?? current.heroDescription, { label: "首页简介", max: 500 }),
    heroImage: normalizeUrlValue(body.heroImage ?? current.heroImage, "首屏背景图"),
    primaryCtaText: normalizeBoundedString(body.primaryCtaText ?? current.primaryCtaText, { label: "主按钮文字", max: 40 }),
    secondaryCtaText: normalizeBoundedString(body.secondaryCtaText ?? current.secondaryCtaText, { label: "副按钮文字", max: 40 }),
    contactIntro: normalizeBoundedString(body.contactIntro ?? current.contactIntro, { label: "联系简介", max: 240 }),
    businessHoursText: normalizeBoundedString(body.businessHoursText ?? current.businessHoursText, { label: "营业时间文案", max: 120 }),
    footerDescription: normalizeBoundedString(body.footerDescription ?? current.footerDescription, { label: "页脚简介", max: 240 }),
  };
}

const loginRateLimit = makeLimiter({
  key: (req) => getClientIp(req),
  windowMs: 60 * 1000,
  max: 8,
  message: "登录请求过于频繁，请稍后再试",
});

const uploadRateLimit = makeLimiter({
  key: (req) => getClientIp(req),
  windowMs: 60 * 1000,
  max: 10,
  message: "上传过于频繁，请稍后再试",
});

const adminWriteRateLimit = makeLimiter({
  key: (req) => `${getClientIp(req)}:${req.path}`,
  windowMs: 60 * 1000,
  max: 30,
  message: "写入操作过于频繁，请稍后再试",
});

const publicReadRateLimit = makeLimiter({
  key: (req) => getClientIp(req),
  windowMs: 60 * 1000,
  max: 120,
  message: "请求过于频繁，请稍后再试",
});

const contactRateLimit = makeLimiter({
  key: (req) => getClientIp(req),
  windowMs: 10 * 60 * 1000,
  max: 5,
  message: "留言提交过于频繁，请稍后再试",
});

app.get("/api/health", (_req, res) => {
  res.json({ ok: true, service: "flower-shop-backend" });
});

app.post("/api/admin/login", loginRateLimit, (req, res) => {
  const { username, password } = req.body;
  const failureKey = getLoginFailureKey(req, username);
  const failureState = getLoginFailureState(failureKey);
  if (failureState?.lockedUntil && failureState.lockedUntil > Date.now()) {
    logSecurityEvent("login_locked", { ip: getClientIp(req), username: String(username ?? "").trim() });
    return res.status(429).json({ message: "登录尝试过多，请 15 分钟后再试" });
  }
  if (username !== adminUsername || password !== adminPassword) {
    const nextFailure = recordLoginFailure(failureKey);
    logSecurityEvent("login_failure", { ip: getClientIp(req), username: String(username ?? "").trim(), count: nextFailure.count });
    if (nextFailure.lockedUntil && nextFailure.lockedUntil > Date.now()) {
      return res.status(429).json({ message: "登录尝试过多，请 15 分钟后再试" });
    }
    return res.status(401).json({ message: "账号或密码错误" });
  }
  resetLoginFailures(failureKey);
  logSecurityEvent("login_success", { ip: getClientIp(req), username: adminUsername });
  res.json({ token: createToken(username), username });
});

app.get("/api/admin/me", requireAdmin, (_req, res) => {
  res.json({ username: adminUsername });
});

app.get("/api/site-config", publicReadRateLimit, async (_req, res) => {
  const db = await readDb();
  res.json(getSiteConfig(db));
});

app.put("/api/site-config", requireAdmin, adminWriteRateLimit, async (req, res) => {
  const db = await readDb();
  const siteConfig = normalizeSiteConfig(req.body, db);
  db.siteConfig = siteConfig;
  db.shopInfo = {
    ...db.shopInfo,
    name: siteConfig.brandName,
    phone: normalizeBoundedString(req.body.phone ?? db.shopInfo.phone ?? "", { label: "电话", max: 40 }),
    wechat: normalizeBoundedString(req.body.wechat ?? db.shopInfo.wechat ?? "", { label: "微信", max: 60 }),
    address: normalizeBoundedString(req.body.address ?? db.shopInfo.address ?? "", { label: "地址", max: 160 }),
    latitude: normalizeNumber(req.body.latitude ?? db.shopInfo.latitude ?? 0, { label: "纬度", min: -90, max: 90 }),
    longitude: normalizeNumber(req.body.longitude ?? db.shopInfo.longitude ?? 0, { label: "经度", min: -180, max: 180 }),
  };
  db.brandStory = {
    ...db.brandStory,
    title: normalizeBoundedString(req.body.storyTitle ?? db.brandStory.title ?? "", { label: "故事标题", max: 120 }),
    subtitle: normalizeBoundedString(req.body.storySubtitle ?? db.brandStory.subtitle ?? "", { label: "故事副标题", max: 160 }),
    content: normalizeBoundedString(req.body.storyContent ?? db.brandStory.content ?? "", { label: "故事正文", max: 3000 }),
    images: normalizeArray(req.body.storyImages ?? db.brandStory.images).map((item) => normalizeUrlValue(item, "故事图片地址", { allowEmpty: false })),
  };
  await writeDb(db);
  res.json({ siteConfig: getSiteConfig(db), shopInfo: db.shopInfo, brandStory: db.brandStory });
});

app.get("/api/flowers", publicReadRateLimit, async (req, res) => {
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

app.get("/api/flowers/:id", publicReadRateLimit, async (req, res) => {
  const db = await readDb();
  const flower = db.flowers.find((item) => item.id === req.params.id);
  if (!flower) return res.status(404).json({ message: "作品不存在" });
  res.json(flower);
});

app.get("/api/flowers/:id/related", publicReadRateLimit, async (req, res) => {
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

app.post("/api/flowers", requireAdmin, adminWriteRateLimit, async (req, res, next) => {
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

app.put("/api/flowers/:id", requireAdmin, adminWriteRateLimit, async (req, res, next) => {
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

app.delete("/api/flowers/:id", requireAdmin, adminWriteRateLimit, async (req, res) => {
  const db = await readDb();
  const nextFlowers = db.flowers.filter((item) => item.id !== req.params.id);
  if (nextFlowers.length === db.flowers.length) return res.status(404).json({ message: "作品不存在" });
  db.flowers = nextFlowers;
  await writeDb(db);
  res.status(204).end();
});

app.post("/api/uploads", requireAdmin, uploadRateLimit, upload.single("file"), (req, res) => {
  if (!req.file) return res.status(400).json({ message: "请选择图片文件" });
  const uploadPath = `/uploads/${req.file.filename}`;
  res.status(201).json({ url: publicBaseUrl ? `${publicBaseUrl}${uploadPath}` : uploadPath });
});

app.get("/api/categories", publicReadRateLimit, async (_req, res) => {
  const db = await readDb();
  res.json([...db.categories].sort((a, b) => b.sort - a.sort));
});

app.get("/api/shop-info", publicReadRateLimit, async (_req, res) => {
  const db = await readDb();
  res.json(db.shopInfo);
});

app.get("/api/brand-story", publicReadRateLimit, async (_req, res) => {
  const db = await readDb();
  res.json(db.brandStory);
});

app.get("/api/team", publicReadRateLimit, async (_req, res) => {
  const db = await readDb();
  res.json(db.teamMembers);
});

app.post("/api/contact", contactRateLimit, async (req, res) => {
  const name = normalizeBoundedString(req.body.name, { label: "姓名", max: 40, allowEmpty: false });
  const phone = normalizeBoundedString(req.body.phone, { label: "电话", max: 40, allowEmpty: false });
  const messageText = normalizeBoundedString(req.body.message, { label: "留言内容", max: 1000, min: 3, allowEmpty: false });
  const db = await readDb();
  db.contacts.push({ id: `contact_${Date.now()}`, name, phone, message: messageText, createdAt: new Date().toISOString() });
  await writeDb(db);
  res.status(201).json({ success: true });
});

app.use((error, req, res, _next) => {
  if (error instanceof multer.MulterError) {
    logSecurityEvent("upload_rejected", { ip: getClientIp(req), code: error.code });
    return res.status(400).json({ message: "上传文件不符合要求" });
  }
  res.status(error.status ?? 500).json({ message: error.message ?? "服务器错误" });
});

await fs.mkdir(uploadsDir, { recursive: true });
app.listen(port, () => {
  console.log(`Flower shop backend listening on ${publicBaseUrl}`);
  console.log(`Admin login: ${adminUsername} / ${adminPassword}`);
});
