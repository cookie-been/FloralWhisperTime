Component({
  properties: {
    items: {
      type: Array,
      value: [],
    },
  },
  data: {
    bannerList: [],
    fallbackImage: "https://picsum.photos/seed/mini-banner-fallback/900/600",
  },
  methods: {
    buildBannerList(items) {
      const fallbackImage = this.data.fallbackImage;
      return Array.isArray(items)
        ? items.map((item, index) => ({
            id: (item && item.id) || `banner-${index}`,
            image: (item && item.image) || fallbackImage,
            title: (item && item.title) || "花语时光",
            desc: (item && item.desc) || "清新文艺的鲜花展示窗口",
          }))
        : [];
    },
  },
  observers: {
    items(items) {
      this.setData({ bannerList: this.buildBannerList(items) });
    },
  },
});
