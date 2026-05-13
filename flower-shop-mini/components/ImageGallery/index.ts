Component({
  properties: {
    images: {
      type: Array,
      value: [],
    },
  },
  methods: {
    preview(event: WechatMiniprogram.TouchEvent) {
      wx.previewImage({
        urls: this.data.images as string[],
        current: event.currentTarget.dataset.current,
      });
    },
  },
});
