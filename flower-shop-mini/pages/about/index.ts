import { getAboutPage, getAboutTimeline, getBrandStory, getShopInfo, getSiteConfig, getTeamMembers } from "../../services/api";
import type { AboutPageContent, AboutTimelineEntry, BrandStory, ShopInfo, SiteConfig, TeamMember } from "../../types";
import { fallbackText, formatBusinessHours } from "../../utils/format";

Page({
  data: {
    aboutPage: {} as Partial<AboutPageContent>,
    timelineList: [] as AboutTimelineEntry[],
    story: { images: [] } as Partial<BrandStory>,
    shop: {} as Partial<ShopInfo>,
    siteConfig: {} as Partial<SiteConfig>,
    teamMemberList: [] as TeamMember[],
    heroImageUrl: "",
    teamAvatarFallback: "https://picsum.photos/seed/mini-team-fallback/300/300",
    pageEyebrowText: "关于我们",
    storyEyebrowText: "品牌故事",
    timelineEyebrowText: "发展历程",
    timelineSectionTitleText: "发展历程",
    teamSectionEyebrowText: "团队成员",
    teamSectionTitleText: "花艺师团队",
    teamSectionIntroText: "团队成员、职务与简介均由后台统一维护，用于表达品牌方法和实际服务能力。",
    pageTitleText: "花语时光",
    pageSubtitleText: "以季节花材与真诚表达，服务赠礼、婚礼与空间花艺场景。",
    storyTitleText: "品牌故事",
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
      const [aboutPage, timelineList, story, shop, siteConfig, teamMemberList] = await Promise.all([
        getAboutPage(),
        getAboutTimeline(),
        getBrandStory(),
        getShopInfo(),
        getSiteConfig(),
        getTeamMembers(),
      ]);
      if (requestId !== this.currentPageRequestId) {
        return;
      }
      this.setData({
        aboutPage,
        timelineList: [...timelineList].sort(
          (left, right) => left.sort - right.sort || left.yearLabel.localeCompare(right.yearLabel, "zh-CN"),
        ),
        story,
        shop,
        siteConfig,
        teamMemberList,
        heroImageUrl: fallbackText(
          aboutPage.heroImage,
          fallbackText(story.images?.[0], "https://picsum.photos/seed/mini-about-hero/900/600"),
        ),
        pageEyebrowText: fallbackText(aboutPage.heroEyebrow, "关于我们"),
        storyEyebrowText: fallbackText(siteConfig.aboutStorySectionEyebrow, "品牌故事"),
        timelineEyebrowText: fallbackText(siteConfig.aboutTimelineSectionEyebrow, "发展历程"),
        timelineSectionTitleText: fallbackText(siteConfig.aboutTimelineSectionTitle, "发展历程"),
        teamSectionEyebrowText: fallbackText(siteConfig.aboutTeamSectionEyebrow, "团队成员"),
        teamSectionTitleText: fallbackText(siteConfig.aboutTeamSectionTitle, "花艺师团队"),
        teamSectionIntroText: fallbackText(
          siteConfig.aboutTeamSectionIntro,
          "团队成员、职务与简介均由后台统一维护，用于表达品牌方法和实际服务能力。",
        ),
        pageTitleText: fallbackText(aboutPage.heroTitle, fallbackText(story.title, "花语时光")),
        pageSubtitleText: fallbackText(
          aboutPage.heroSubtitle,
          fallbackText(story.subtitle, "以季节花材与真诚表达，服务赠礼、婚礼与空间花艺场景。"),
        ),
        storyTitleText: fallbackText(aboutPage.storyTitle, fallbackText(story.title, "品牌故事")),
        storyContentText: fallbackText(
          aboutPage.storyContent,
          fallbackText(story.content, "我们坚持使用更适合当季的花材组合，让作品在视觉与情绪上都更耐看。"),
        ),
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
      title: fallbackText(this.data.pageTitleText, "花语时光品牌故事"),
      path: "/pages/about/index",
    };
  },
});
