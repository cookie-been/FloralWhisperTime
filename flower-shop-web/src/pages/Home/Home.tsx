import { useEffect, useMemo, useState } from "react";
import { Link } from "react-router-dom";
import { ArrowLeft, ArrowRight, Flower2, MapPin, Sparkles, Store } from "lucide-react";
import { Button } from "antd";
import { FlowerCard } from "@/components/common/FlowerCard";
import { getBrandStory, getCategories, getFlowers, getShopInfo, getSiteConfig } from "@/services/api";
import type { BrandStory, Category, Flower, ShopInfo, SiteConfig } from "@/types";

const fallbackHeroSlides = [
  { image: "/home-hero/hero-1.jpg", label: "花艺陈列", note: "适合礼赠与门店展示的花束陈列空间" },
  { image: "/home-hero/hero-2.jpg", label: "门店氛围", note: "更贴近日常选购与预约咨询的现场环境" },
  { image: "/home-hero/hero-3.jpg", label: "工作台面", note: "体现花材处理、组合与细节把控的制作状态" },
  { image: "/home-hero/hero-4.jpg", label: "空间花艺", note: "适合品牌陈设、活动与空间布置的整体表达" },
];

export function Home() {
  const [categories, setCategories] = useState<Category[]>([]);
  const [featured, setFeatured] = useState<Flower[]>([]);
  const [story, setStory] = useState<BrandStory | null>(null);
  const [siteConfig, setSiteConfig] = useState<SiteConfig | null>(null);
  const [shop, setShop] = useState<ShopInfo | null>(null);
  const [activeHero, setActiveHero] = useState(0);
  const featuredPrimary = featured[0] ?? null;
  const featuredSecondary = featured.slice(1, 5);
  const stats = siteConfig?.stats ?? [
    { value: "860+", label: "已服务客户" },
    { value: "320+", label: "花艺作品" },
    { value: "6", label: "主题分类" },
  ];
  const statCards = [
    {
      ...stats[0],
      icon: Sparkles,
      note: "覆盖日常赠礼、节庆表达、活动布置与到店预约等常见场景。",
    },
    {
      ...stats[1],
      icon: Flower2,
      note: "围绕花束、空间陈设和品牌场景持续更新，形成稳定作品库。",
    },
    {
      ...stats[2],
      icon: Store,
      note: shop?.address ? `门店服务范围已覆盖到店咨询与现场选花，地址：${shop.address}` : "门店支持到店咨询、预约定制与线下花材沟通。",
    },
  ];
  const serviceCategories = categories.filter((category) => category.id !== "all").slice(0, 6);

  const heroSlides = useMemo(
    () =>
      [
        siteConfig?.heroImage
          ? {
              image: siteConfig.heroImage,
              label: siteConfig.heroEyebrow || "品牌主视觉",
              note: siteConfig.heroDescription || "以花艺空间、礼赠氛围和门店陈列表达品牌第一印象。",
            }
          : null,
        ...fallbackHeroSlides,
      ].filter((value, index, array): value is { image: string; label: string; note: string } =>
        Boolean(value) && array.findIndex((item) => item?.image === value?.image) === index,
      ),
    [siteConfig?.heroDescription, siteConfig?.heroEyebrow, siteConfig?.heroImage],
  );

  useEffect(() => {
    getCategories().then(setCategories);
    getFlowers({ sortBy: "featured", limit: 5 }).then((result) => setFeatured(result.list));
    getBrandStory().then(setStory);
    getSiteConfig().then(setSiteConfig);
    getShopInfo().then(setShop);
  }, []);

  useEffect(() => {
    if (heroSlides.length <= 1) return undefined;
    const timer = window.setInterval(() => {
      setActiveHero((current) => (current + 1) % heroSlides.length);
    }, 5600);
    return () => window.clearInterval(timer);
  }, [heroSlides.length]);

  const changeHero = (direction: "prev" | "next") => {
    setActiveHero((current) => {
      if (!heroSlides.length) return current;
      return direction === "prev" ? (current - 1 + heroSlides.length) % heroSlides.length : (current + 1) % heroSlides.length;
    });
  };

  return (
    <>
      <section className="relative flex min-h-[calc(100vh-64px)] items-center overflow-hidden bg-[#132018]">
        <div className="absolute inset-0">
          {heroSlides.map((slide, index) => (
            <div
              key={slide.image}
              className={[
                "absolute inset-0 bg-cover bg-center transition-opacity duration-[1600ms]",
                index === activeHero ? "opacity-100" : "opacity-0",
              ].join(" ")}
              style={{
                backgroundImage: `linear-gradient(90deg, rgba(13, 26, 18, 0.72), rgba(13, 26, 18, 0.2)), url("${slide.image}")`,
              }}
            />
          ))}
          <div className="absolute inset-0 bg-[linear-gradient(180deg,rgba(8,18,12,0.18),rgba(8,18,12,0.52))]" />
        </div>

        <div className="relative mx-auto w-full max-w-7xl px-4 py-14 sm:px-6 sm:py-16 lg:px-8">
          <div className="max-w-2xl text-white">
            <div className="inline-flex items-center gap-2 rounded-full bg-white/16 px-3 py-2 text-xs backdrop-blur sm:px-4 sm:text-sm">
              <Sparkles size={16} />
              {siteConfig?.heroEyebrow ?? "清新文艺 · 自然温暖"}
            </div>
            <h1 className="section-title mt-6 text-4xl font-semibold leading-tight text-white sm:text-5xl lg:text-6xl">{siteConfig?.heroTitle ?? "花语时光"}</h1>
            <p className="mt-4 max-w-xl text-base leading-7 text-white/88 sm:mt-5 sm:text-lg sm:leading-8">
              {siteConfig?.heroDescription ?? "用季节花材和克制色彩，制作适合婚礼、日常赠礼与空间陈列的鲜花作品。"}
            </p>
            <div className="mt-8 flex flex-col gap-3 sm:flex-row sm:flex-wrap sm:gap-4">
              <Link to="/gallery" className="w-full sm:w-auto">
                <Button size="large" type="primary" block className="w-full sm:w-auto">
                  {siteConfig?.primaryCtaText ?? "浏览作品"} <ArrowRight size={16} />
                </Button>
              </Link>
              <Link to="/contact" className="w-full sm:w-auto">
                <Button size="large" ghost block className="w-full sm:w-auto">
                  {siteConfig?.secondaryCtaText ?? "联系门店"}
                </Button>
              </Link>
            </div>
            {heroSlides.length > 1 ? (
              <div className="mt-10 flex flex-col items-start gap-4 sm:flex-row sm:flex-wrap sm:items-center">
                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    className="flex h-11 w-11 items-center justify-center rounded-full border border-white/22 bg-white/12 text-white backdrop-blur transition hover:bg-white/18"
                    onClick={() => changeHero("prev")}
                    aria-label="上一张背景图"
                  >
                    <ArrowLeft size={18} />
                  </button>
                  <button
                    type="button"
                    className="flex h-11 w-11 items-center justify-center rounded-full border border-white/22 bg-white/12 text-white backdrop-blur transition hover:bg-white/18"
                    onClick={() => changeHero("next")}
                    aria-label="下一张背景图"
                  >
                    <ArrowRight size={18} />
                  </button>
                </div>
                <div className="flex items-center gap-3">
                  {heroSlides.map((slide, index) => (
                    <button
                      key={slide.image}
                      type="button"
                      className={[
                        "h-2 rounded-full transition-all",
                        index === activeHero ? "w-12 bg-white" : "w-7 bg-white/38 hover:bg-white/62",
                      ].join(" ")}
                      onClick={() => setActiveHero(index)}
                      aria-label={`切换到第 ${index + 1} 张背景图`}
                    />
                  ))}
                </div>
                <div className="min-w-0 text-sm text-white/82">
                  <p className="font-semibold">{heroSlides[activeHero]?.label}</p>
                  <p className="mt-1 max-w-md leading-6 text-white/70">{heroSlides[activeHero]?.note}</p>
                </div>
              </div>
            ) : null}
            {heroSlides.length > 1 ? (
              <div className="mt-6 flex items-center gap-3 text-sm text-white/68">
                <span>{String(activeHero + 1).padStart(2, "0")}</span>
                <span className="h-px w-12 bg-white/24" />
                <span>{String(heroSlides.length).padStart(2, "0")}</span>
              </div>
            ) : null}
          </div>
        </div>
      </section>

      <section className="relative z-10 -mt-8 mx-auto max-w-7xl px-4 sm:-mt-10 sm:px-6 lg:px-8">
        <div className="grid gap-4 md:grid-cols-3 lg:gap-6">
          {statCards.map((stat) => {
            const Icon = stat.icon;
            return (
              <article key={stat.label} className="surface-card border-none bg-[linear-gradient(180deg,rgba(255,255,255,0.96),rgba(247,243,236,0.96))] p-5 shadow-[0_18px_40px_rgba(29,44,33,0.08)] sm:p-6">
                <div className="flex items-start justify-between gap-4">
                  <div>
                    <p className="text-xs font-semibold uppercase tracking-[0.18em] text-[#58725f]">{stat.label}</p>
                    <p className="mt-3 text-3xl font-semibold text-forest">{stat.value}</p>
                  </div>
                  <div className="flex h-11 w-11 items-center justify-center rounded-full bg-mint text-forest">
                    <Icon size={18} />
                  </div>
                </div>
                <p className="mt-4 text-sm leading-7 text-muted">{stat.note}</p>
              </article>
            );
          })}
        </div>
      </section>

      <section className="mx-auto max-w-7xl px-4 pb-16 pt-14 sm:px-6 sm:pt-16 lg:px-8">
        <div className="mb-8 flex flex-wrap items-end justify-between gap-4">
          <div>
            <p className="section-eyebrow">Featured Works</p>
            <h2 className="section-title section-title-accent mt-2 text-2xl sm:text-3xl">精选作品</h2>
            <p className="mt-3 max-w-2xl text-sm leading-7 text-muted sm:text-base">
              首页保留一组更完整的精选作品视图，覆盖礼赠、婚礼、空间陈设等主要场景，方便快速判断整体风格。
            </p>
          </div>
          <Link to="/gallery" className="inline-flex items-center gap-2 text-sm font-semibold text-forest">
            查看全部 <ArrowRight size={16} />
          </Link>
        </div>
        {featuredPrimary ? (
          <div className="grid gap-6 xl:grid-cols-[1.08fr_0.92fr]">
            <Link
              to={`/gallery/${featuredPrimary.id}`}
              className="surface-card group overflow-hidden transition duration-300 hover:-translate-y-1 hover:shadow-[0_18px_36px_rgba(88,69,48,0.12)]"
            >
              <div className="grid min-h-full lg:grid-cols-[1.02fr_0.98fr]">
                <div className="aspect-[4/4.2] overflow-hidden bg-mint lg:aspect-auto lg:min-h-[420px]">
                  <img
                    src={featuredPrimary.images[0]}
                    alt={featuredPrimary.name}
                    className="h-full w-full object-cover transition duration-500 group-hover:scale-105"
                    loading="lazy"
                  />
                </div>
                <div className="flex flex-col justify-between p-6 sm:p-8">
                  <div>
                    <p className="section-eyebrow">Featured Highlight</p>
                    <h3 className="mt-3 text-2xl font-semibold text-ink sm:text-3xl">{featuredPrimary.name}</h3>
                    <p className="mt-4 text-base leading-8 text-muted">{featuredPrimary.description}</p>
                    <div className="mt-5 flex flex-wrap gap-2">
                      {featuredPrimary.tags.slice(0, 4).map((tag) => (
                        <span key={tag} className="rounded-full bg-mint px-3 py-1 text-xs font-semibold text-forest">
                          {tag}
                        </span>
                      ))}
                    </div>
                  </div>
                  <div className="mt-8 flex items-end justify-between gap-4 border-t border-black/6 pt-5">
                    <div>
                      <p className="text-xs font-semibold uppercase tracking-[0.2em] text-[#58725f]">精选推荐</p>
                      <p className="mt-2 text-2xl font-semibold text-forest">¥{featuredPrimary.price}</p>
                    </div>
                    <span className="inline-flex items-center gap-2 text-sm font-semibold text-forest">
                      查看详情 <ArrowRight size={16} />
                    </span>
                  </div>
                </div>
              </div>
            </Link>

            <div className="grid gap-6 sm:grid-cols-2">
              {featuredSecondary.map((flower) => (
                <FlowerCard key={flower.id} flower={flower} compact />
              ))}
            </div>
          </div>
        ) : null}
      </section>

      {serviceCategories.length ? (
        <section className="mx-auto max-w-7xl px-4 pb-16 sm:px-6 lg:px-8">
          <div className="mb-8 flex flex-wrap items-end justify-between gap-4">
            <div className="max-w-2xl">
              <p className="section-eyebrow">Service Scenes</p>
              <h2 className="section-title section-title-accent mt-2 text-2xl sm:text-3xl">服务场景</h2>
              <p className="mt-3 text-sm leading-7 text-muted sm:text-base">
                用更明确的分类入口，把婚礼、日常赠礼、开业和空间定制等常用浏览路径提前放到首页，减少访客进入画廊后的筛选成本。
              </p>
            </div>
            <Link to="/gallery" className="inline-flex items-center gap-2 text-sm font-semibold text-forest">
              浏览全部分类 <ArrowRight size={16} />
            </Link>
          </div>

          <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
            {serviceCategories.map((category) => (
              <Link
                key={category.id}
                to={`/gallery?category=${category.id}`}
                className="surface-card group p-5 transition duration-300 hover:-translate-y-1 hover:border-[#d9e5d7] hover:bg-[#f8fbf7]"
              >
                <div className="flex items-start justify-between gap-4">
                  <div>
                    <p className="text-xs font-semibold uppercase tracking-[0.18em] text-[#58725f]">
                      {String(category.sort).padStart(2, "0")}
                    </p>
                    <h3 className="mt-3 text-xl font-semibold text-ink">{category.name}</h3>
                  </div>
                  <span className="flex h-10 w-10 items-center justify-center rounded-full bg-mint text-forest transition group-hover:bg-white">
                    <ArrowRight size={16} />
                  </span>
                </div>
                <p className="mt-4 text-sm leading-7 text-muted">{category.description || "进入该主题查看更完整的花艺作品与场景内容。"}</p>
              </Link>
            ))}
          </div>
        </section>
      ) : null}

      {story && (
        <section className="bg-[#f7fbf7]">
          <div className="mx-auto max-w-7xl px-4 py-16 sm:px-6 lg:px-8">
            <div className="mb-8 flex flex-wrap items-end justify-between gap-4">
              <div className="max-w-2xl">
                <p className="section-eyebrow">Brand Story</p>
                <h2 className="section-title section-title-accent mt-2 text-2xl sm:text-3xl">品牌故事</h2>
                <p className="mt-3 text-sm leading-7 text-muted sm:text-base">
                  把品牌气质、服务方式和到店感受压缩进首页一屏，让访问者在浏览作品之外，也能快速理解这家店的表达方式。
                </p>
              </div>
              <Link to="/about" className="inline-flex items-center gap-2 text-sm font-semibold text-forest">
                查看完整介绍 <ArrowRight size={16} />
              </Link>
            </div>

            <div className="surface-card overflow-hidden">
              <div className="grid lg:grid-cols-[1.02fr_0.98fr]">
                <div className="grid gap-3 bg-[#eef4ed] p-3 sm:p-4">
                  <div className="overflow-hidden rounded-lg">
                    <img src={story.images[0]} alt={story.title} className="aspect-[4/4.6] w-full object-cover sm:aspect-[4/4.2] lg:min-h-[520px]" />
                  </div>
                  {story.images[1] ? (
                    <div className="grid grid-cols-2 gap-3">
                      <div className="overflow-hidden rounded-lg">
                        <img src={story.images[1]} alt={`${story.title} 场景图`} className="aspect-[4/3] w-full object-cover" />
                      </div>
                      <div className="rounded-lg border border-black/6 bg-white/78 p-4 sm:p-5">
                        <p className="text-xs font-semibold uppercase tracking-[0.18em] text-[#58725f]">品牌气质</p>
                        <p className="mt-3 text-lg font-semibold text-ink">自然、克制、适合长期被记住</p>
                        <p className="mt-3 text-sm leading-7 text-muted">
                          以稳定的花材审美、礼赠场景理解和空间氛围组织，呈现更适合现代城市生活的花艺表达。
                        </p>
                      </div>
                    </div>
                  ) : null}
                </div>

                <div className="flex flex-col justify-between p-6 sm:p-8 lg:p-10">
                  <div>
                    <p className="section-eyebrow">Narrative</p>
                    <h3 className="section-title section-title-accent mt-3 text-2xl leading-tight sm:text-3xl">{story.title}</h3>
                    {story.subtitle ? <p className="mt-4 text-base leading-7 text-muted sm:text-lg sm:leading-8">{story.subtitle}</p> : null}
                    <p className="mt-5 leading-8 text-muted">{story.content}</p>
                  </div>

                  <div className="mt-10 grid gap-4 border-t border-black/6 pt-6 sm:grid-cols-3">
                    <div className="rounded-lg bg-[#f8fbf7] p-4">
                      <p className="text-xs font-semibold uppercase tracking-[0.18em] text-[#58725f]">服务方式</p>
                      <p className="mt-3 text-sm leading-7 text-muted">门店零售、场景花礼、婚礼与空间陈设同步提供。</p>
                    </div>
                    <div className="rounded-lg bg-[#f8fbf7] p-4">
                      <p className="text-xs font-semibold uppercase tracking-[0.18em] text-[#58725f]">到店体验</p>
                      <p className="mt-3 text-sm leading-7 text-muted">更强调现场沟通、花材观察和场景适配，而不是模板式套装推荐。</p>
                    </div>
                    <div className="rounded-lg bg-[#f8fbf7] p-4">
                      <p className="text-xs font-semibold uppercase tracking-[0.18em] text-[#58725f]">门店信息</p>
                      <p className="mt-3 inline-flex items-start gap-2 text-sm leading-7 text-muted">
                        <MapPin size={16} className="mt-1 shrink-0 text-forest" />
                        <span>{shop?.address}</span>
                      </p>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </section>
      )}
    </>
  );
}
