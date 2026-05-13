import { getBrandStory, getShopInfo } from "../../services/api";

Page({
  data: {
    story: { images: [] },
    shop: {},
  },
  async onLoad() {
    const [story, shop] = await Promise.all([getBrandStory(), getShopInfo()]);
    this.setData({ story, shop });
  },
});
