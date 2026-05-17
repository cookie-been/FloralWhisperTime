Component({
  properties: {
    items: {
      type: Array,
      value: [],
    },
  },
  data: {
    bannerList: [] as Array<{ id: string; image: string; title: string; desc: string }>,
    fallbackImage: "https://picsum.photos/seed/mini-banner-fallback/900/600",
  },
  observers: {
    items(items: Array<{ id?: string; image?: string; title?: string; desc?: string }>) {
      const fallbackImage = this.data.fallbackImage as string;
      const bannerList = Array.isArray(items)
        ? items.map((item, index) => ({
            id: item?.id || `banner-${index}`,
            image: item?.image || fallbackImage,
            title: item?.title || "花语时光",
            desc: item?.desc || "清新文艺的鲜花展示窗口",
          }))
        : [];
      this.setData({ bannerList });
    },
  },
});
