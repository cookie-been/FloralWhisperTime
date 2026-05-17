Component({
  properties: {
    images: {
      type: Array,
      value: [],
    },
  },
  data: {
    fallbackImage: "https://picsum.photos/seed/mini-gallery-fallback/900/1100",
    imageList: [] as string[],
  },
  observers: {
    images(images: string[]) {
      this.setData({
        imageList: Array.isArray(images) ? images.filter(Boolean) : [],
      });
    },
  },
  methods: {
    preview(event: WechatMiniprogram.TouchEvent) {
      const imageList = this.data.imageList as string[];
      if (!imageList.length) {
        return;
      }
      wx.previewImage({
        urls: imageList,
        current: event.currentTarget.dataset.current,
      });
    },
  },
});
