import { getBrandStory, getShopInfo, getSiteConfig, getTeamMembers } from "../../services/api";
import type { BrandStory, ShopInfo, SiteConfig, TeamMember } from "../../types";
import { fallbackText, formatBusinessHours } from "../../utils/format";

Page({
  data: {
    story: { images: [] } as Partial<BrandStory>,
    shop: {} as Partial<ShopInfo>,
    siteConfig: {} as Partial<SiteConfig>,
    teamMemberList: [] as TeamMember[],
    heroImageUrl: "",
    teamAvatarFallback: "https://picsum.photos/seed/mini-team-fallback/300/300",
    storyEyebrowText: "品牌故事",
    teamSectionEyebrowText: "团队成员",
    teamSectionTitleText: "花艺师团队",
    teamSectionIntroText: "团队成员、职务与简介均由后台统一维护，用于表达品牌方法和实际服务能力。",
    storyTitleText: "花语时光",
    storySubtitleText: "以季节花材与真诚表达，服务赠礼、婚礼与空间花艺场景。",
    storyContentText: "我们坚持使用更适合当季的花材组合，让作品在视觉与情绪上都更耐看。",
    shopNameText: "花语时光门店",
    shopAddressText: "暂未提供",
    shopPhoneText: "暂未提供",
    shopWechatText: "暂未提供",
    teamCardList: [] as Array<TeamMember & { avatarUrl: string; bioText: string }>,
    businessHoursText: "",
    isPageLoading: true,
    pageErrorText: "",
  },

  currentPageRequestId: 0,

  onLoad() {
    void this.loadPageData();
  },

  onPullDownRefresh() {
    void this.loadPageData(true);
  },

  async loadPageData(isRefresh = false) {
    this.currentPageRequestId += 1;
    const requestId = this.currentPageRequestId;
    this.setData({
      isPageLoading: !isRefresh,
      pageErrorText: "",
    });
    try {
      const [story, shop, siteConfig, teamMemberList] = await Promise.all([
        getBrandStory(),
        getShopInfo(),
        getSiteConfig(),
        getTeamMembers(),
      ]);
      if (requestId !== this.currentPageRequestId) {
        return;
      }
      this.setData({
        story,
        shop,
        siteConfig,
        teamMemberList,
        heroImageUrl: fallbackText(story.images?.[0], "https://picsum.photos/seed/mini-about-hero/900/600"),
        storyEyebrowText: fallbackText(siteConfig.aboutStorySectionEyebrow, "品牌故事"),
        teamSectionEyebrowText: fallbackText(siteConfig.aboutTeamSectionEyebrow, "团队成员"),
        teamSectionTitleText: fallbackText(siteConfig.aboutTeamSectionTitle, "花艺师团队"),
        teamSectionIntroText: fallbackText(
          siteConfig.aboutTeamSectionIntro,
          "团队成员、职务与简介均由后台统一维护，用于表达品牌方法和实际服务能力。",
        ),
        storyTitleText: fallbackText(story.title, "花语时光"),
        storySubtitleText: fallbackText(story.subtitle, "以季节花材与真诚表达，服务赠礼、婚礼与空间花艺场景。"),
        storyContentText: fallbackText(story.content, "我们坚持使用更适合当季的花材组合，让作品在视觉与情绪上都更耐看。"),
        shopNameText: fallbackText(shop.name, "花语时光门店"),
        shopAddressText: fallbackText(shop.address, "暂未提供"),
        shopPhoneText: fallbackText(shop.phone, "暂未提供"),
        shopWechatText: fallbackText(shop.wechat, "暂未提供"),
        teamCardList: teamMemberList.map((item) => ({
          ...item,
          avatarUrl: fallbackText(item.avatar, "https://picsum.photos/seed/mini-team-fallback/300/300"),
          bioText: fallbackText(item.bio, "专注花艺设计、选材搭配与门店体验。"),
        })),
        businessHoursText: formatBusinessHours(shop.hours),
      });
    } catch (error) {
      if (requestId !== this.currentPageRequestId) {
        return;
      }
      this.setData({
        pageErrorText: error instanceof Error ? error.message : "关于我们页面加载失败，请稍后重试",
      });
    } finally {
      if (requestId !== this.currentPageRequestId) {
        return;
      }
      this.setData({
        isPageLoading: false,
      });
      if (isRefresh) {
        wx.stopPullDownRefresh();
      }
    }
  },

  handleRetry() {
    void this.loadPageData();
  },

  onShareAppMessage() {
    return {
      title: fallbackText(this.data.story.title, "花语时光品牌故事"),
      path: "/pages/about/index",
    };
  },
});
