import { useEffect, useMemo, useState } from "react";
import { Empty, Spin, Timeline, message } from "antd";
import { getAboutPage, getAboutTimeline, getShopInfo, getTeamMembers } from "@/services/api";
import type { AboutPageContent, AboutTimelineEntry, ShopInfo, TeamMember } from "@/types";

export function About() {
  const [aboutPage, setAboutPage] = useState<AboutPageContent | null>(null);
  const [timeline, setTimeline] = useState<AboutTimelineEntry[]>([]);
  const [team, setTeam] = useState<TeamMember[]>([]);
  const [shop, setShop] = useState<ShopInfo | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    Promise.all([getAboutPage(), getAboutTimeline(), getTeamMembers(), getShopInfo()])
      .then(([page, timelineEntries, members, shopInfo]) => {
        setAboutPage(page);
        setTimeline(timelineEntries);
        setTeam(members);
        setShop(shopInfo);
      })
      .catch((error) => message.error(error instanceof Error ? error.message : "关于页加载失败"))
      .finally(() => setLoading(false));
  }, []);

  const timelineItems = useMemo(
    () =>
      [...timeline]
        .sort((left, right) => left.sort - right.sort || left.yearLabel.localeCompare(right.yearLabel, "zh-CN"))
        .map((item) => ({
          label: item.yearLabel,
          children: item.content,
        })),
    [timeline],
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
      <div className="relative min-h-[460px] bg-cover bg-center sm:min-h-[520px]" style={{ backgroundImage: `url(${aboutPage.heroImage})` }}>
        <div className="absolute inset-0 bg-[linear-gradient(90deg,rgba(15,26,18,0.72),rgba(15,26,18,0.12))]" />
        <div className="relative mx-auto flex min-h-[460px] max-w-7xl items-center px-4 sm:min-h-[520px] sm:px-6 lg:px-8">
          <div className="max-w-3xl text-white">
            <p className="section-eyebrow text-white">{aboutPage.heroEyebrow}</p>
            <h1 className="section-title mt-3 text-3xl text-white sm:text-4xl lg:text-5xl">{aboutPage.heroTitle}</h1>
            <p className="mt-4 text-base leading-7 text-white/88 sm:mt-5 sm:text-lg sm:leading-8">{aboutPage.heroSubtitle}</p>
          </div>
        </div>
      </div>

      <div className="mx-auto grid max-w-7xl gap-12 px-4 py-16 sm:px-6 xl:grid-cols-[0.96fr_1.04fr] lg:px-8">
        <div>
          <p className="section-eyebrow">Story</p>
          <h2 className="section-title section-title-accent mt-2 text-2xl sm:text-3xl">{aboutPage.storyTitle}</h2>
          <p className="mt-5 whitespace-pre-line leading-8 text-muted">{aboutPage.storyContent}</p>

          <div className="surface-card mt-8 p-6 text-sm leading-7 text-muted">
            <p className="font-semibold text-ink">{shop?.name || "花语时光"}</p>
            <p className="mt-3">{shop?.address || "地址信息待完善"}</p>
            <p className="mt-1">电话：{shop?.phone || "待完善"}</p>
            <p className="mt-1">微信：{shop?.wechat || "待完善"}</p>
          </div>
        </div>

        <div className="surface-card p-6 sm:p-8">
          <p className="section-eyebrow">Timeline</p>
          <h2 className="section-title section-title-accent mt-2 text-2xl sm:text-3xl">发展历程</h2>
          <div className="mt-8">
            {timelineItems.length ? (
              <Timeline mode="left" items={timelineItems} />
            ) : (
              <Empty description="时间轴内容正在整理中" />
            )}
          </div>
        </div>
      </div>

      <div className="bg-[#f2f6f1]">
        <div className="mx-auto max-w-7xl px-4 py-16 sm:px-6 lg:px-8">
          <div className="flex flex-wrap items-end justify-between gap-4">
            <div className="max-w-2xl">
              <p className="section-eyebrow !text-[#456451]">Team</p>
              <h2 className="section-title section-title-accent mt-2 text-2xl !text-[#1f2d24] sm:text-3xl">花艺师团队</h2>
              <p className="mt-3 text-sm leading-7 text-muted">团队成员、职务与简介均由后台统一维护，用于表达品牌方法和实际服务能力。</p>
            </div>
          </div>
          <div className="mt-8 grid gap-6 md:grid-cols-2 xl:grid-cols-3">
            {team.map((member) => (
              <article key={member.id} className="surface-card overflow-hidden">
                <img src={member.avatar} alt={member.name} className="aspect-[4/4.2] w-full object-cover" />
                <div className="p-5">
                  <h3 className="text-xl font-semibold">{member.name}</h3>
                  <p className="mt-1 text-sm font-medium text-forest">{member.title}</p>
                  <p className="mt-4 leading-7 text-muted">{member.bio || "暂无成员简介"}</p>
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
