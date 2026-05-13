import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { ArrowRight, MapPin, Sparkles } from "lucide-react";
import { Button } from "antd";
import { FlowerCard } from "@/components/common/FlowerCard";
import { getBrandStory, getFlowers, getShopInfo, getSiteConfig } from "@/services/api";
import type { BrandStory, Flower, ShopInfo, SiteConfig } from "@/types";

export function Home() {
  const [featured, setFeatured] = useState<Flower[]>([]);
  const [story, setStory] = useState<BrandStory | null>(null);
  const [siteConfig, setSiteConfig] = useState<SiteConfig | null>(null);
  const [shop, setShop] = useState<ShopInfo | null>(null);

  useEffect(() => {
    getFlowers({ sortBy: "featured", limit: 4 }).then((result) => setFeatured(result.list));
    getBrandStory().then(setStory);
    getSiteConfig().then(setSiteConfig);
    getShopInfo().then(setShop);
  }, []);

  return (
    <>
      <section
        className="flex min-h-[calc(100vh-64px)] items-center bg-cover bg-center"
        style={{
          backgroundImage: `linear-gradient(90deg, rgba(16, 38, 22, 0.62), rgba(16, 38, 22, 0.1)), url("${siteConfig?.heroImage ?? "https://picsum.photos/seed/floral-hero/1920/1080"}")`,
        }}
      >
        <div className="mx-auto w-full max-w-7xl px-4 py-16 sm:px-6 lg:px-8">
          <div className="max-w-2xl text-white">
            <div className="inline-flex items-center gap-2 rounded-full bg-white/16 px-4 py-2 text-sm backdrop-blur">
              <Sparkles size={16} />
              {siteConfig?.heroEyebrow ?? "清新文艺 · 自然温暖"}
            </div>
            <h1 className="mt-6 text-5xl font-semibold leading-tight sm:text-6xl">{siteConfig?.heroTitle ?? "花语时光"}</h1>
            <p className="mt-5 max-w-xl text-lg leading-8 text-white/88">
              {siteConfig?.heroDescription ?? "用季节花材和克制色彩，制作适合婚礼、日常赠礼与空间陈列的鲜花作品。"}
            </p>
            <div className="mt-8 flex flex-wrap gap-4">
              <Link to="/gallery">
                <Button size="large" type="primary">
                  {siteConfig?.primaryCtaText ?? "浏览作品"} <ArrowRight size={16} />
                </Button>
              </Link>
              <Link to="/contact">
                <Button size="large" ghost>
                  {siteConfig?.secondaryCtaText ?? "联系门店"}
                </Button>
              </Link>
            </div>
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
            <p className="text-sm font-semibold text-forest">Featured Works</p>
            <h2 className="mt-2 text-3xl font-semibold text-ink">精选作品</h2>
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
              <p className="text-sm font-semibold text-forest">Brand Story</p>
              <h2 className="mt-3 text-3xl font-semibold leading-tight">{story.title}</h2>
              <p className="mt-4 text-lg leading-8 text-muted">{story.subtitle}</p>
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
