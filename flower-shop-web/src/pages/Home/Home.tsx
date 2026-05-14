import { useEffect, useMemo, useState } from "react";
import { Link } from "react-router-dom";
import { ArrowLeft, ArrowRight, MapPin, Sparkles } from "lucide-react";
import { Button } from "antd";
import { FlowerCard } from "@/components/common/FlowerCard";
import { getBrandStory, getFlowers, getShopInfo, getSiteConfig } from "@/services/api";
import type { BrandStory, Flower, ShopInfo, SiteConfig } from "@/types";

const fallbackHeroSlides = [
  { image: "/home-hero/hero-1.jpg", label: "花艺陈列", note: "适合礼赠与门店展示的花束陈列空间" },
  { image: "/home-hero/hero-2.jpg", label: "门店氛围", note: "更贴近日常选购与预约咨询的现场环境" },
  { image: "/home-hero/hero-3.jpg", label: "工作台面", note: "体现花材处理、组合与细节把控的制作状态" },
  { image: "/home-hero/hero-4.jpg", label: "空间花艺", note: "适合品牌陈设、活动与空间布置的整体表达" },
];

export function Home() {
  const [featured, setFeatured] = useState<Flower[]>([]);
  const [story, setStory] = useState<BrandStory | null>(null);
  const [siteConfig, setSiteConfig] = useState<SiteConfig | null>(null);
  const [shop, setShop] = useState<ShopInfo | null>(null);
  const [activeHero, setActiveHero] = useState(0);

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
    getFlowers({ sortBy: "featured", limit: 4 }).then((result) => setFeatured(result.list));
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

      <section className="mx-auto grid max-w-7xl gap-8 px-4 py-16 sm:px-6 md:grid-cols-3 lg:px-8">
        {(siteConfig?.stats ?? [
          { value: "860+", label: "已服务客户" },
          { value: "320+", label: "花艺作品" },
          { value: "6", label: "主题分类" },
        ]).map((stat) => (
          <div key={stat.label} className="border-l-4 border-forest bg-mint/60 px-6 py-5">
            <p className="text-3xl font-semibold text-forest">{stat.value}</p>
            <p className="mt-1 text-sm text-muted">{stat.label}</p>
          </div>
        ))}
      </section>

      <section className="mx-auto max-w-7xl px-4 pb-16 sm:px-6 lg:px-8">
        <div className="mb-8 flex flex-wrap items-end justify-between gap-4">
          <div>
            <p className="section-eyebrow">Featured Works</p>
            <h2 className="section-title section-title-accent mt-2 text-2xl sm:text-3xl">精选作品</h2>
          </div>
          <Link to="/gallery" className="inline-flex items-center gap-2 text-sm font-semibold text-forest">
            查看全部 <ArrowRight size={16} />
          </Link>
        </div>
        <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
          {featured.map((flower) => (
            <FlowerCard key={flower.id} flower={flower} compact />
          ))}
        </div>
      </section>

      {story && (
        <section className="bg-[#f7fbf7]">
          <div className="mx-auto grid max-w-7xl gap-10 px-4 py-16 sm:px-6 md:grid-cols-[0.95fr_1.05fr] lg:px-8">
            <div className="overflow-hidden rounded-lg">
              <img src={story.images[0]} alt={story.title} className="h-full min-h-80 w-full object-cover" />
            </div>
            <div className="flex flex-col justify-center">
              <p className="section-eyebrow">Brand Story</p>
              <h2 className="section-title section-title-accent mt-3 text-2xl leading-tight sm:text-3xl">{story.title}</h2>
              <p className="mt-4 text-base leading-7 text-muted sm:text-lg sm:leading-8">{story.subtitle}</p>
              <p className="mt-4 leading-8 text-muted">{story.content}</p>
              <p className="mt-6 inline-flex items-center gap-2 text-sm text-forest">
                <MapPin size={16} />
                {shop?.address}
              </p>
            </div>
          </div>
        </section>
      )}
    </>
  );
}
