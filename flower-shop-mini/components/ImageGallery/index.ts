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
  methods: {
    buildImageList(images: string[]) {
      return Array.isArray(images) ? images.filter(Boolean) : [];
    },
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
  observers: {
    images(images: string[]) {
      this.setData({
        imageList: this.buildImageList(images),
      });
    },
  },
});
