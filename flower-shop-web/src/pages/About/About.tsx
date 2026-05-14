import { useEffect, useState } from "react";
import { Timeline } from "antd";
import { getBrandStory, getShopInfo, getTeamMembers } from "@/services/api";
import type { BrandStory, ShopInfo, TeamMember } from "@/types";

export function About() {
  const [story, setStory] = useState<BrandStory | null>(null);
  const [team, setTeam] = useState<TeamMember[]>([]);
  const [shop, setShop] = useState<ShopInfo | null>(null);

  useEffect(() => {
    getBrandStory().then(setStory);
    getTeamMembers().then(setTeam);
    getShopInfo().then(setShop);
  }, []);

  return (
    <section>
      {story && (
        <div className="relative min-h-[420px] bg-cover bg-center" style={{ backgroundImage: `url(${story.images[1]})` }}>
          <div className="absolute inset-0 bg-gradient-to-r from-black/60 to-black/10" />
          <div className="relative mx-auto flex min-h-[420px] max-w-7xl items-center px-4 sm:px-6 lg:px-8">
            <div className="max-w-2xl text-white">
              <p className="section-eyebrow text-white">About Floral Whisper Time</p>
              <h1 className="section-title mt-3 text-4xl text-white">{story.title}</h1>
              <p className="mt-4 text-lg leading-8 text-white/88">{story.subtitle}</p>
            </div>
          </div>
        </div>
      )}

      <div className="mx-auto grid max-w-7xl gap-10 px-4 py-16 sm:px-6 lg:grid-cols-[0.9fr_1.1fr] lg:px-8">
        <div>
          <p className="section-eyebrow">Story</p>
          <h2 className="section-title section-title-accent mt-2 text-3xl">品牌故事</h2>
          <p className="mt-4 leading-8 text-muted">{story?.content}</p>
          <div className="mt-8 rounded-lg bg-mint p-6 text-sm leading-7 text-muted">
            <p className="font-semibold text-ink">{shop?.name}</p>
            <p className="mt-2">{shop?.address}</p>
            <p>电话：{shop?.phone}</p>
            <p>微信：{shop?.wechat}</p>
          </div>
        </div>
        <Timeline
          mode="left"
          items={[
            { label: "2021", children: "花语时光第一间工作室成立，专注日常花礼。" },
            { label: "2023", children: "开始承接婚礼、展陈与品牌活动花艺设计。" },
            { label: "2026", children: "升级双端展示系统，统一展示作品与门店信息。" },
          ]}
        />
      </div>

      <div className="bg-[#f7fbf7]">
        <div className="mx-auto max-w-7xl px-4 py-16 sm:px-6 lg:px-8">
          <p className="section-eyebrow">Team</p>
          <h2 className="section-title section-title-accent mt-2 text-3xl">花艺师团队</h2>
          <div className="mt-8 grid gap-6 md:grid-cols-2">
            {team.map((member) => (
              <article key={member.id} className="grid gap-5 rounded-lg bg-white p-5 shadow-soft sm:grid-cols-[140px_1fr]">
                <img src={member.avatar} alt={member.name} className="aspect-square w-full rounded-md object-cover" />
                <div>
                  <h3 className="text-xl font-semibold">{member.name}</h3>
                  <p className="mt-1 text-sm font-medium text-forest">{member.title}</p>
                  <p className="mt-4 leading-7 text-muted">{member.bio}</p>
                </div>
              </article>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}
