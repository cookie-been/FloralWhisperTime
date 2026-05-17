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
    tagPreviewList: [] as string[],
    flowerNameText: "",
    descriptionText: "",
  },
  observers: {
    flower(flower: {
      images?: string[];
      tags?: string[];
      name?: string;
      description?: string;
    }) {
      const fallbackImage = this.data.fallbackImage as string;
      this.setData({
        coverImageUrl: Array.isArray(flower?.images) && flower.images[0] ? flower.images[0] : fallbackImage,
        tagPreviewList: Array.isArray(flower?.tags) ? flower.tags.slice(0, 3) : [],
        flowerNameText: flower?.name || "未命名作品",
        descriptionText: flower?.description || "暂无作品描述",
      });
    },
  },
  methods: {
    handleTap() {
      const flower = this.data.flower as { id?: string };
      if (!flower.id) return;
      wx.navigateTo({
        url: `/pages/flower-detail/index?id=${flower.id}`,
      });
    },
  },
});
