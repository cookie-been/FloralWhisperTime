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
