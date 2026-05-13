import { getFlowerById, getRelatedFlowers } from "../../services/api";

Page({
  data: {
    flower: null,
    related: [],
    materialsText: "",
  },
  async onLoad(options: { id?: string }) {
    if (!options.id) return;
    const flower = await getFlowerById(options.id);
    if (!flower) return;
    const related = await getRelatedFlowers(flower, 4);
    this.setData({
      flower,
      related,
      materialsText: flower.materials.join(" / "),
    });
  },
});
