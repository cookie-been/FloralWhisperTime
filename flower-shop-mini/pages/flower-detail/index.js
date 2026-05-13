const { getFlowerById, getRelatedFlowers } = require("../../services/api");

Page({
  data: {
    flower: null,
    related: [],
    materialsText: "",
  },
  async onLoad(options) {
    if (!options.id) return;
    try {
      const flower = await getFlowerById(options.id);
      if (!flower) return;
      const related = await getRelatedFlowers(flower, 4);
      this.setData({
        flower,
        related,
        materialsText: flower.materials.join(" / "),
      });
    } catch (error) {
      wx.showToast({ title: "作品加载失败", icon: "none" });
      console.error(error);
    }
  },
});
