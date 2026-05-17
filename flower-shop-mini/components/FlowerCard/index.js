Component({
  properties: {
    flower: {
      type: Object,
      value: {},
    },
    showPrice: {
      type: Boolean,
      value: false,
    },
  },
  data: {
    fallbackImage: "https://picsum.photos/seed/mini-flower-fallback/900/1100",
    coverImageUrl: "",
    tagPreviewList: [],
    flowerNameText: "",
    descriptionText: "",
  },
  observers: {
    flower(flower) {
      const fallbackImage = this.data.fallbackImage;
      this.setData({
        coverImageUrl: Array.isArray(flower && flower.images) && flower.images[0] ? flower.images[0] : fallbackImage,
        tagPreviewList: Array.isArray(flower && flower.tags) ? flower.tags.slice(0, 3) : [],
        flowerNameText: (flower && flower.name) || "未命名作品",
        descriptionText: (flower && flower.description) || "暂无作品描述",
      });
    },
  },
  methods: {
    handleTap() {
      const flower = this.data.flower || {};
      if (!flower.id) return;
      wx.navigateTo({
        url: `/pages/flower-detail/index?id=${flower.id}`,
      });
    },
  },
});
