import { useEffect, useMemo, useState } from "react";
import { Empty, Spin, Timeline, message } from "antd";
import { getAboutPage, getAboutTimeline, getShopInfo, getSiteConfig, getTeamMembers } from "@/services/api";
import type { AboutPageContent, AboutTimelineEntry, ShopInfo, SiteConfig, TeamMember } from "@/types";
import { buildAboutContent, buildAboutTimelineItems, shouldShowAboutLoadError } from "./about.helpers";

export function About() {
  const [isMobile, setIsMobile] = useState(() => (typeof window !== "undefined" ? window.innerWidth < 768 : false));
  const [aboutPage, setAboutPage] = useState<AboutPageContent | null>(null);
  const [timeline, setTimeline] = useState<AboutTimelineEntry[]>([]);
  const [team, setTeam] = useState<TeamMember[]>([]);
  const [shop, setShop] = useState<ShopInfo | null>(null);
  const [siteConfig, setSiteConfig] = useState<SiteConfig | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let active = true;

    Promise.allSettled([getAboutPage(), getAboutTimeline(), getTeamMembers(), getShopInfo(), getSiteConfig()])
      .then(([pageResult, timelineResult, teamResult, shopResult, siteConfigResult]) => {
        if (!active) return;

        if (pageResult.status === "fulfilled") setAboutPage(pageResult.value);
        if (timelineResult.status === "fulfilled") setTimeline(timelineResult.value);
        if (teamResult.status === "fulfilled") setTeam(teamResult.value);
        if (shopResult.status === "fulfilled") setShop(shopResult.value);
        if (siteConfigResult.status === "fulfilled") setSiteConfig(siteConfigResult.value);

        if (shouldShowAboutLoadError([pageResult, timelineResult, teamResult, shopResult, siteConfigResult])) {
          message.error("关于页加载失败");
        }
      })
      .finally(() => {
        if (active) setLoading(false);
      });

    return () => {
      active = false;
    };
  }, []);

  useEffect(() => {
    if (typeof window === "undefined") return undefined;
    const update = () => setIsMobile(window.innerWidth < 768);
    update();
    window.addEventListener("resize", update);
    return () => window.removeEventListener("resize", update);
  }, []);

  const timelineItems = useMemo(() => buildAboutTimelineItems(timeline), [timeline]);
  const { heroImage, heroEyebrow, heroTitle, heroSubtitle, storyTitle, storyContent } = useMemo(
    () => buildAboutContent(aboutPage),
    [aboutPage],
  );

  if (loading) {
    return (
      <div className="flex min-h-[60vh] items-center justify-center">
        <Spin size="large" />
      </div>
    );
  }

  if (!aboutPage) {
    return (
      <div className="mx-auto flex min-h-[60vh] max-w-5xl items-center justify-center px-4">
        <div className="surface-card w-full py-16">
          <Empty description="暂时无法加载关于页内容" />
        </div>
      </div>
    );
  }

  return (
    <section>
      <div className="relative min-h-[380px] bg-cover bg-center sm:min-h-[520px]" style={{ backgroundImage: `url(${heroImage})` }}>
        <div className="absolute inset-0 bg-[linear-gradient(90deg,rgba(15,26,18,0.72),rgba(15,26,18,0.12))]" />
        <div className="relative mx-auto flex min-h-[380px] max-w-7xl items-center px-4 sm:min-h-[520px] sm:px-6 lg:px-8">
          <div className="max-w-3xl text-white">
            <p className="section-eyebrow text-white">{heroEyebrow}</p>
            <h1 className="section-title mt-3 text-[2rem] text-white sm:text-4xl lg:text-5xl">{heroTitle}</h1>
            <p className="mt-4 text-base leading-7 text-white/88 sm:mt-5 sm:text-lg sm:leading-8">{heroSubtitle}</p>
          </div>
        </div>
      </div>

      <div className="site-shell-section site-shell-block grid gap-10 xl:grid-cols-[0.96fr_1.04fr] xl:gap-12">
        <div>
          <p className="section-eyebrow">{siteConfig?.aboutStorySectionEyebrow || "品牌故事"}</p>
          <h2 className="section-title section-title-accent mt-2 text-2xl sm:text-3xl">{storyTitle}</h2>
          <p className="site-shell-copy mt-5 whitespace-pre-line">{storyContent}</p>

          <div className="surface-card site-shell-card mt-8 text-sm text-muted">
            <p className="font-semibold text-ink">{shop?.name || "花语时光"}</p>
            <p className="mt-3">{shop?.address || "地址信息待完善"}</p>
            <p className="mt-1">电话：{shop?.phone || "待完善"}</p>
            <p className="mt-1">微信：{shop?.wechat || "待完善"}</p>
          </div>
        </div>

        <div className="surface-card site-shell-card sm:p-8">
          <p className="section-eyebrow">{siteConfig?.aboutTimelineSectionEyebrow || "发展历程"}</p>
          <h2 className="section-title section-title-accent mt-2 text-2xl sm:text-3xl">{siteConfig?.aboutTimelineSectionTitle || "发展历程"}</h2>
          <div className="mt-8">
            {timelineItems.length ? (
              <Timeline mode={isMobile ? "left" : timelineItems.length > 3 ? "alternate" : "left"} items={timelineItems} />
            ) : (
              <Empty description="时间轴内容正在整理中" />
            )}
          </div>
        </div>
      </div>

      <div className="bg-[#f2f6f1]">
        <div className="site-shell-section site-shell-block">
          <div className="flex flex-wrap items-end justify-between gap-4">
            <div className="max-w-2xl">
              <p className="section-eyebrow !text-[#456451]">{siteConfig?.aboutTeamSectionEyebrow || "团队成员"}</p>
              <h2 className="section-title section-title-accent mt-2 text-2xl !text-[#1f2d24] sm:text-3xl">{siteConfig?.aboutTeamSectionTitle || "花艺师团队"}</h2>
              <p className="site-shell-copy mt-3 text-sm">{siteConfig?.aboutTeamSectionIntro || "团队成员、职务与简介均由后台统一维护，用于表达品牌方法和实际服务能力。"}</p>
            </div>
          </div>
          <div className="mt-8 grid gap-6 md:grid-cols-2 xl:grid-cols-3">
            {team.map((member) => (
              <article key={member.id} className="surface-card overflow-hidden">
                <img src={member.avatar} alt={member.name} className="aspect-[4/4.2] w-full object-cover" />
                <div className="p-5">
                  <h3 className="text-xl font-semibold">{member.name}</h3>
                  <p className="mt-1 text-sm font-medium text-forest">{member.title}</p>
                  <p className="site-shell-copy mt-4">{member.bio || "暂无成员简介"}</p>
                </div>
              </article>
            ))}
          </div>

          {!team.length ? (
            <div className="surface-card mt-8 py-16">
              <Empty description="团队成员内容正在整理中" />
            </div>
          ) : null}
        </div>
      </div>
    </section>
  );
}
