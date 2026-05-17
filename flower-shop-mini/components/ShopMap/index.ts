import { showErrorMessage } from "../../utils/message";

Component({
  properties: {
    shop: {
      type: Object,
      value: {},
    },
  },
  observers: {
    shop(shop) {
      if (!shop?.latitude || !shop?.longitude) {
        this.setData({
          markers: [],
          hasLocation: false,
        });
        return;
      }
      this.setData({
        hasLocation: true,
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
    hasLocation: false,
  },
  methods: {
    openLocation() {
      const shop = this.data.shop as { latitude: number; longitude: number; name: string; address: string };
      if (!shop.latitude || !shop.longitude) {
        showErrorMessage("暂无门店坐标");
        return;
      }
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
