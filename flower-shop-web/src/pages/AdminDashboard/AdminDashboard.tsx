import { Button, Empty, Progress, Spin, Tag, message } from "antd";
import { ArrowRight, Flower2, Image as ImageIcon, MapPin, Sparkles, Star } from "lucide-react";
import { Link } from "react-router-dom";
import { useEffect, useMemo, useState } from "react";
import { getDashboardData } from "@/services/api";
import type { BrandStory, Category, Flower, ShopInfo, SiteConfig } from "@/types";

interface DashboardData {
  flowers: Flower[];
  categories: Category[];
  siteConfig: SiteConfig;
  shopInfo: ShopInfo;
  brandStory: BrandStory;
}

function formatDate(value?: string) {
  if (!value) return "暂无";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "暂无";
  return new Intl.DateTimeFormat("zh-CN", { month: "numeric", day: "numeric" }).format(date);
}

export function AdminDashboard() {
  const [data, setData] = useState<DashboardData | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    getDashboardData()
      .then(setData)
      .catch((error) => message.error(error instanceof Error ? error.message : "概览加载失败"))
      .finally(() => setLoading(false));
  }, []);

  const summary = useMemo(() => {
    if (!data) return null;

    const categoryCount = data.categories.filter((item) => item.id !== "all").length;
    const featuredCount = data.flowers.filter((item) => item.featured).length;
    const latestFlower = [...data.flowers].sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())[0];
    const attentionFlowers = data.flowers
      .filter((item) => !item.featured)
      .sort((a, b) => b.sort - a.sort)
      .slice(0, 4);
    const recentFlowers = [...data.flowers]
      .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())
      .slice(0, 4);
    const categoryDistribution = data.categories
      .filter((item) => item.id !== "all")
      .map((category) => ({
        id: category.id,
        name: category.name,
        count: data.flowers.filter((flower) => flower.categoryId === category.id).length,
      }))
      .sort((a, b) => b.count - a.count);
    const featuredRate = data.flowers.length ? Math.round((featuredCount / data.flowers.length) * 100) : 0;

    return {
      categoryCount,
      featuredCount,
      latestFlower,
      attentionFlowers,
      recentFlowers,
      categoryDistribution,
      featuredRate,
    };
  }, [data]);

  if (loading) {
    return (
      <div className="flex min-h-[50vh] items-center justify-center">
        <Spin size="large" />
      </div>
    );
  }

  if (!data || !summary) {
    return (
      <div className="rounded-lg bg-white px-6 py-14 shadow-soft">
        <Empty description="暂时无法加载后台概览" />
      </div>
    );
  }

  const stats = [
    { label: "作品总数", value: data.flowers.length, icon: Flower2, note: "当前已发布到前台的全部作品" },
    { label: "精选作品", value: summary.featuredCount, icon: Star, note: "首页与重点展示中更容易被看见" },
    { label: "作品分类", value: summary.categoryCount, icon: Sparkles, note: "用于前台筛选与内容组织" },
    { label: "最近上新", value: formatDate(summary.latestFlower?.createdAt), icon: ImageIcon, note: summary.latestFlower?.name ?? "尚未发现作品记录" },
  ];

  return (
    <div className="space-y-6">
      <section className="grid gap-4 xl:grid-cols-2 2xl:grid-cols-4">
        {stats.map((item) => {
          const Icon = item.icon;
          return (
            <div key={item.label} className="admin-panel p-5">
              <div className="flex items-start justify-between gap-4">
                <div>
                  <p className="text-sm font-medium text-muted">{item.label}</p>
                  <p className="mt-3 text-3xl font-semibold text-[#1b281e]">{item.value}</p>
                  <p className="mt-2 text-sm leading-6 text-muted">{item.note}</p>
                </div>
                <span className="flex h-11 w-11 items-center justify-center rounded-lg bg-[#edf4eb] text-forest">
                  <Icon size={18} />
                </span>
              </div>
            </div>
          );
        })}
      </section>

      <section className="grid gap-6 xl:grid-cols-[0.88fr_1.12fr]">
        <div className="admin-panel p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-xs font-semibold uppercase tracking-[0.24em] text-forest/70">Charts</p>
              <h3 className="mt-2 text-xl font-semibold text-[#1b281e]">精选占比</h3>
            </div>
            <Tag color={summary.featuredRate >= 40 ? "green" : "gold"}>{summary.featuredRate}%</Tag>
          </div>

          <div className="mt-6 flex items-center justify-center">
            <Progress
              type="dashboard"
              percent={summary.featuredRate}
              strokeColor="#2E7D32"
              trailColor="#e7e0d7"
              size={220}
              format={(percent) => (
                <div className="text-center">
                  <div className="text-3xl font-semibold text-[#1b281e]">{percent}%</div>
                  <div className="mt-1 text-sm text-muted">作品处于精选状态</div>
                </div>
              )}
            />
          </div>

          <div className="mt-4 grid gap-3 sm:grid-cols-2">
            <div className="rounded-lg bg-[#fbfaf8] px-4 py-4">
              <p className="text-sm font-medium text-muted">精选作品</p>
              <p className="mt-2 text-2xl font-semibold text-[#1b281e]">{summary.featuredCount}</p>
            </div>
            <div className="rounded-lg bg-[#fbfaf8] px-4 py-4">
              <p className="text-sm font-medium text-muted">普通作品</p>
              <p className="mt-2 text-2xl font-semibold text-[#1b281e]">{data.flowers.length - summary.featuredCount}</p>
            </div>
          </div>
        </div>

        <div className="admin-panel p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-xs font-semibold uppercase tracking-[0.24em] text-forest/70">Charts</p>
              <h3 className="mt-2 text-xl font-semibold text-[#1b281e]">分类分布</h3>
            </div>
            <span className="text-sm text-muted">{summary.categoryCount} 个分类</span>
          </div>

          <div className="mt-6 space-y-4">
            {summary.categoryDistribution.map((item) => {
              const percent = data.flowers.length ? Math.round((item.count / data.flowers.length) * 100) : 0;
              return (
                <div key={item.id}>
                  <div className="mb-2 flex items-center justify-between gap-3">
                    <p className="text-sm font-semibold text-[#1b281e]">{item.name}</p>
                    <p className="text-sm text-muted">{item.count} 件</p>
                  </div>
                  <Progress percent={percent} showInfo={false} strokeColor="#6AA96B" trailColor="#ebe4da" />
                </div>
              );
            })}
          </div>
        </div>
      </section>

      <section className="grid gap-6 xl:grid-cols-[1.35fr_0.95fr]">
        <div className="admin-panel overflow-hidden p-0">
          <div className="grid min-h-[320px] md:grid-cols-[1.05fr_0.95fr]">
            <div className="flex flex-col justify-between px-6 py-6">
              <div>
                <p className="text-xs font-semibold uppercase tracking-[0.24em] text-forest/70">Hero Preview</p>
                <h3 className="mt-3 text-3xl font-semibold leading-tight text-[#1b281e]">{data.siteConfig.heroTitle}</h3>
                <p className="mt-3 text-sm leading-7 text-muted">{data.siteConfig.heroDescription}</p>
              </div>
              <div className="mt-6 flex flex-wrap gap-3">
                <Link to="/admin/flowers">
                  <Button type="primary" size="large">
                    新增作品
                  </Button>
                </Link>
                <Link to="/admin/settings">
                  <Button size="large">编辑首页内容</Button>
                </Link>
              </div>
            </div>
            <div className="relative min-h-[240px] bg-[#f1ece5]">
              {data.siteConfig.heroImage ? (
                <img src={data.siteConfig.heroImage} alt="" className="h-full w-full object-cover" />
              ) : (
                <div className="flex h-full items-center justify-center text-muted">暂无首页主视觉</div>
              )}
            </div>
          </div>
        </div>

        <div className="admin-panel p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-xs font-semibold uppercase tracking-[0.24em] text-forest/70">Quick Access</p>
              <h3 className="mt-2 text-xl font-semibold text-[#1b281e]">快速入口</h3>
            </div>
            <ArrowRight size={18} className="text-forest" />
          </div>
          <div className="mt-5 space-y-3">
            <Link to="/admin/flowers" className="admin-action-card flex items-center justify-between">
              <div>
                <p className="text-sm font-semibold text-[#1b281e]">进入作品管理</p>
                <p className="mt-1 text-sm text-muted">查看封面、排序与精选状态</p>
              </div>
              <ArrowRight size={18} className="text-forest" />
            </Link>
            <Link to="/admin/settings" className="admin-action-card flex items-center justify-between">
              <div>
                <p className="text-sm font-semibold text-[#1b281e]">进入站点配置</p>
                <p className="mt-1 text-sm text-muted">更新首页文案、联系信息与故事内容</p>
              </div>
              <ArrowRight size={18} className="text-forest" />
            </Link>
            <div className="rounded-lg bg-[#f8f4ef] px-4 py-4">
              <p className="text-sm font-semibold text-[#1b281e]">{data.siteConfig.brandName}</p>
              <p className="mt-1 text-sm text-muted">{data.shopInfo.phone} · {data.shopInfo.address}</p>
            </div>
          </div>
        </div>
      </section>

      <section className="grid gap-6 xl:grid-cols-[1.1fr_0.9fr]">
        <div className="admin-panel p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-xs font-semibold uppercase tracking-[0.24em] text-forest/70">Flowers</p>
              <h3 className="mt-2 text-xl font-semibold text-[#1b281e]">作品状态</h3>
            </div>
            <Link to="/admin/flowers" className="text-sm font-medium text-forest">
              查看全部
            </Link>
          </div>

          <div className="mt-5 grid gap-5 lg:grid-cols-2">
            <div>
              <p className="text-sm font-semibold text-[#1b281e]">最近上新</p>
              <div className="mt-3 space-y-3">
                {summary.recentFlowers.map((flower) => (
                  <div key={flower.id} className="rounded-lg border border-black/6 bg-[#fbfaf8] px-4 py-3">
                    <div className="flex items-center justify-between gap-3">
                      <p className="text-sm font-semibold text-[#1b281e]">{flower.name}</p>
                      {flower.featured ? <Tag color="green">精选</Tag> : <Tag>普通</Tag>}
                    </div>
                    <p className="mt-1 text-sm text-muted">{flower.categoryId} · {formatDate(flower.createdAt)}</p>
                  </div>
                ))}
              </div>
            </div>

            <div>
              <p className="text-sm font-semibold text-[#1b281e]">可补充精选的作品</p>
              <div className="mt-3 space-y-3">
                {summary.attentionFlowers.map((flower) => (
                  <div key={flower.id} className="rounded-lg border border-black/6 bg-[#fbfaf8] px-4 py-3">
                    <p className="text-sm font-semibold text-[#1b281e]">{flower.name}</p>
                    <p className="mt-1 text-sm text-muted">排序 {flower.sort} · 标签 {flower.tags.slice(0, 2).join(" / ") || "暂无"}</p>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>

        <div className="admin-panel p-6">
          <div>
            <p className="text-xs font-semibold uppercase tracking-[0.24em] text-forest/70">Content</p>
            <h3 className="mt-2 text-xl font-semibold text-[#1b281e]">站点内容摘要</h3>
          </div>

          <div className="mt-5 space-y-4">
            <div className="rounded-lg border border-black/6 bg-[#fbfaf8] px-4 py-4">
              <p className="text-xs font-semibold uppercase tracking-[0.16em] text-forest/70">Brand</p>
              <p className="mt-2 text-base font-semibold text-[#1b281e]">{data.siteConfig.brandName}</p>
              <p className="mt-1 text-sm text-muted">{data.siteConfig.heroEyebrow}</p>
            </div>
            <div className="rounded-lg border border-black/6 bg-[#fbfaf8] px-4 py-4">
              <p className="text-xs font-semibold uppercase tracking-[0.16em] text-forest/70">Contact</p>
              <p className="mt-2 flex items-start gap-2 text-sm text-muted">
                <MapPin size={16} className="mt-0.5 text-forest" />
                <span>{data.shopInfo.address}</span>
              </p>
              <p className="mt-2 text-sm text-muted">{data.shopInfo.phone}</p>
            </div>
            <div className="rounded-lg border border-black/6 bg-[#fbfaf8] px-4 py-4">
              <p className="text-xs font-semibold uppercase tracking-[0.16em] text-forest/70">Story</p>
              <p className="mt-2 text-base font-semibold text-[#1b281e]">{data.brandStory.title}</p>
              <p className="mt-2 text-sm leading-6 text-muted">{data.brandStory.content.slice(0, 90)}...</p>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
}
