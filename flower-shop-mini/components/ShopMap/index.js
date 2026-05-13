Component({
  properties: {
    shop: {
      type: Object,
      value: {},
    },
  },
  observers: {
    shop(shop) {
      if (!shop || !shop.latitude) return;
      this.setData({
        markers: [
          {
            id: 1,
            latitude: shop.latitude,
            longitude: shop.longitude,
            title: shop.name,
          },
        ],
      });
    },
  },
  data: {
    markers: [],
  },
  methods: {
    openLocation() {
      const shop = this.data.shop || {};
      if (!shop.latitude || !shop.longitude) return;
      wx.openLocation({
        latitude: shop.latitude,
        longitude: shop.longitude,
        name: shop.name,
        address: shop.address,
        scale: 16,
      });
    },
  },
});
