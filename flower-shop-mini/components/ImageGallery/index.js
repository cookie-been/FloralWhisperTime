Component({
  properties: {
    images: {
      type: Array,
      value: [],
    },
  },
  data: {
    fallbackImage: "https://picsum.photos/seed/mini-gallery-fallback/900/1100",
    imageList: [],
  },
  methods: {
    buildImageList(images) {
      return Array.isArray(images) ? images.filter(Boolean) : [];
    },
    preview(event) {
      const imageList = this.data.imageList || [];
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
    images(images) {
      this.setData({
        imageList: this.buildImageList(images),
      });
    },
  },
});
