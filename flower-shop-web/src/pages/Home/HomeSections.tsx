import { Link } from "react-router-dom";
import { ArrowRight, Flower2, MapPin, Sparkles, Store } from "lucide-react";
import { FlowerCard } from "@/components/common/FlowerCard";
import type { BrandStory, Category, Flower, ShopInfo, SiteStat } from "@/types";

const statIcons = [Sparkles, Flower2, Store, MapPin];
function PlaceholderCard({ className = "", height = "h-48" }: { className?: string; height?: string }) {
  return (
    <div className={`surface-card overflow-hidden p-5 sm:p-6 ${className}`}>
      <div className={`animate-pulse rounded-lg bg-black/5 ${height}`} />
    </div>
  );
}

export function HomeStatsSection({ stats, loading }: { stats: SiteStat[]; loading: boolean }) {
  return (
    <section className="site-shell-section relative z-10 -mt-6 sm:-mt-10">
      <div className="grid gap-3 sm:gap-4 md:grid-cols-3 lg:gap-6">
        {loading
          ? Array.from({ length: 3 }).map((_, index) => <PlaceholderCard key={index} className="border-none" height="h-36" />)
          : stats.map((stat, index) => {
              const Icon = statIcons[index % statIcons.length];
              return (
                <article
                  key={`${stat.label}-${index}`}
                  className="surface-card border-none bg-[linear-gradient(180deg,rgba(255,255,255,0.96),rgba(247,243,236,0.96))] p-5 shadow-[0_18px_40px_rgba(29,44,33,0.08)] sm:p-6"
                >
                  <div className="flex items-start justify-between gap-3 sm:gap-4">
                    <div>
                      <p className="text-xs font-semibold uppercase tracking-[0.18em] text-[#58725f]">{stat.label}</p>
                      <p className="mt-2 text-[1.75rem] font-semibold text-forest sm:mt-3 sm:text-3xl">{stat.value}</p>
                    </div>
                    <div className="flex h-11 w-11 items-center justify-center rounded-full bg-mint text-forest">
                      <Icon size={18} />
                    </div>
                  </div>
                </article>
              );
            })}
      </div>
    </section>
  );
}

export function HomeFeaturedSection({
  featuredPrimary,
  featuredSecondary,
  loading,
}: {
  featuredPrimary: Flower | null;
  featuredSecondary: Flower[];
  loading: boolean;
}) {
  return (
    <section className="site-shell-section site-shell-block pb-16 pt-14 sm:pt-16">
      <div className="mb-8 flex flex-wrap items-end justify-between gap-4">
        <div>
          <p className="section-eyebrow">精选作品</p>
          <h2 className="section-title section-title-accent mt-2 text-2xl sm:text-3xl">精选作品</h2>
          <p className="site-shell-copy mt-3 max-w-2xl text-sm sm:text-base">
            首页保留一组更完整的精选作品视图，覆盖礼赠、婚礼、空间陈设等主要场景，方便快速判断整体风格。
          </p>
        </div>
        <Link to="/gallery" className="inline-flex items-center gap-2 text-sm font-semibold text-forest">
          查看全部 <ArrowRight size={16} />
        </Link>
      </div>

      {loading ? (
        <div className="grid gap-6 xl:grid-cols-[1.08fr_0.92fr]">
          <PlaceholderCard height="h-[420px]" />
          <div className="grid gap-6 sm:grid-cols-2">
            {Array.from({ length: 4 }).map((_, index) => (
              <PlaceholderCard key={index} height="h-[320px]" />
            ))}
          </div>
        </div>
      ) : featuredPrimary ? (
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
                  className="h-full w-full object-cover transition duration-500 group-hover:scale-[1.03]"
                  loading="lazy"
                />
              </div>
              <div className="site-shell-card flex flex-col justify-between sm:p-8">
                <div>
                  <p className="section-eyebrow">主推作品</p>
                  <h3 className="mt-3 text-2xl font-semibold text-ink sm:text-3xl">{featuredPrimary.name}</h3>
                  <p className="site-shell-copy mt-4 text-base">{featuredPrimary.description}</p>
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
  );
}

export function HomeServiceScenesSection({ categories, loading }: { categories: Category[]; loading: boolean }) {
  const visibleCategories = categories.filter((category) => category.id !== "all").slice(0, 6);

  return (
    <section className="site-shell-section pb-16">
      <div className="mb-8 flex flex-wrap items-end justify-between gap-4">
        <div className="max-w-2xl">
          <p className="section-eyebrow">服务场景</p>
          <h2 className="section-title section-title-accent mt-2 text-2xl sm:text-3xl">服务场景</h2>
          <p className="site-shell-copy mt-3 text-sm sm:text-base">
            用更明确的分类入口，把婚礼、日常赠礼、开业和空间定制等常用浏览路径提前放到首页，减少访客进入画廊后的筛选成本。
          </p>
        </div>
        <Link to="/gallery" className="inline-flex items-center gap-2 text-sm font-semibold text-forest">
          浏览全部分类 <ArrowRight size={16} />
        </Link>
      </div>

      {loading ? (
        <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
          {Array.from({ length: 6 }).map((_, index) => (
            <PlaceholderCard key={index} height="h-44" />
          ))}
        </div>
      ) : visibleCategories.length ? (
        <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
          {visibleCategories.map((category) => (
            <Link
              key={category.id}
              to={`/gallery?category=${category.id}`}
              className="surface-card group p-5 transition duration-300 hover:-translate-y-1 hover:border-[#d9e5d7] hover:bg-[#f8fbf7]"
            >
              <div className="flex items-start justify-between gap-4">
                <div>
                  <p className="text-xs font-semibold uppercase tracking-[0.18em] text-[#58725f]">主题分类</p>
                  <h3 className="mt-3 text-xl font-semibold text-ink">{category.name}</h3>
                </div>
                <span className="flex h-10 w-10 items-center justify-center rounded-full bg-mint text-forest transition group-hover:bg-white">
                  <ArrowRight size={16} />
                </span>
              </div>
              <p className="site-shell-copy mt-4 text-sm">{category.description || "进入该主题查看更完整的花艺作品与场景内容。"}</p>
            </Link>
          ))}
        </div>
      ) : null}
    </section>
  );
}

export function HomeBrandStorySection({
  story,
  shop,
  loading,
}: {
  story: BrandStory | null;
  shop: ShopInfo | null;
  loading: boolean;
}) {
  return (
    <section className="bg-[#f7fbf7]">
      <div className="site-shell-section site-shell-block">
        <div className="mb-8 flex flex-wrap items-end justify-between gap-4">
          <div className="max-w-2xl">
            <p className="section-eyebrow">品牌故事</p>
            <h2 className="section-title section-title-accent mt-2 text-2xl sm:text-3xl">品牌故事</h2>
            <p className="site-shell-copy mt-3 text-sm sm:text-base">
              把品牌气质、服务方式和到店感受压缩进首页一屏，让访问者在浏览作品之外，也能快速理解这家店的表达方式。
            </p>
          </div>
          <Link to="/about" className="inline-flex items-center gap-2 text-sm font-semibold text-forest">
            查看完整介绍 <ArrowRight size={16} />
          </Link>
        </div>

        {loading ? (
          <PlaceholderCard height="h-[560px]" />
        ) : story ? (
          <div className="surface-card overflow-hidden">
            <div className="grid lg:grid-cols-[1.02fr_0.98fr]">
              <div className="grid gap-3 bg-[#eef4ed] p-3 sm:p-4">
                <div className="overflow-hidden rounded-lg">
                  <img
                    src={story.images[0] || "/home-hero/hero-1.jpg"}
                    alt={story.title || "品牌故事"}
                    className="aspect-[4/4.6] w-full object-cover sm:aspect-[4/4.2] lg:min-h-[520px]"
                  />
                </div>
                {story.images[1] ? (
                  <div className="grid grid-cols-2 gap-3">
                    <div className="overflow-hidden rounded-lg">
                      <img src={story.images[1]} alt={`${story.title} 场景图`} className="aspect-[4/3] w-full object-cover" />
                    </div>
                    <div className="rounded-lg border border-black/6 bg-white/78 p-4 sm:p-5">
                      <p className="text-xs font-semibold uppercase tracking-[0.18em] text-[#58725f]">品牌气质</p>
                      <p className="mt-3 text-lg font-semibold text-ink">自然、克制、适合长期被记住</p>
                      <p className="site-shell-copy mt-3 text-sm">
                        以稳定的花材审美、礼赠场景理解和空间氛围组织，呈现更适合现代城市生活的花艺表达。
                      </p>
                    </div>
                  </div>
                ) : null}
              </div>

              <div className="site-shell-card flex flex-col justify-between sm:p-8 lg:p-10">
                <div>
                  <p className="section-eyebrow">品牌叙事</p>
                  <h3 className="section-title section-title-accent mt-3 text-2xl leading-tight sm:text-3xl">{story.title}</h3>
                  {story.subtitle ? <p className="site-shell-copy mt-4 text-base sm:text-lg">{story.subtitle}</p> : null}
                  <p className="site-shell-copy mt-5">{story.content}</p>
                </div>

                <div className="mt-10 grid gap-4 border-t border-black/6 pt-6 sm:grid-cols-3">
                  <div className="rounded-lg bg-[#f8fbf7] p-4">
                    <p className="text-xs font-semibold uppercase tracking-[0.18em] text-[#58725f]">服务方式</p>
                    <p className="site-shell-copy mt-3 text-sm">门店零售、场景花礼、婚礼与空间陈设同步提供。</p>
                  </div>
                  <div className="rounded-lg bg-[#f8fbf7] p-4">
                    <p className="text-xs font-semibold uppercase tracking-[0.18em] text-[#58725f]">到店体验</p>
                    <p className="site-shell-copy mt-3 text-sm">更强调现场沟通、花材观察和场景适配，而不是模板式套装推荐。</p>
                  </div>
                  <div className="rounded-lg bg-[#f8fbf7] p-4">
                    <p className="text-xs font-semibold uppercase tracking-[0.18em] text-[#58725f]">门店信息</p>
                    <p className="site-shell-copy mt-3 inline-flex items-start gap-2 text-sm">
                      <MapPin size={16} className="mt-1 shrink-0 text-forest" />
                      <span>{shop?.address || "地址信息待完善"}</span>
                    </p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        ) : (
          <PlaceholderCard height="h-[560px]" />
        )}
      </div>
    </section>
  );
}
