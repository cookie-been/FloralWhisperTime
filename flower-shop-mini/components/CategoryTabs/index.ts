Component({
  properties: {
    categories: {
      type: Array,
      value: [],
    },
    activeId: {
      type: String,
      value: "all",
    },
  },
  methods: {
    handleChange(event: WechatMiniprogram.TouchEvent) {
      const nextCategoryId = event.currentTarget.dataset.id as string | undefined;
      if (!nextCategoryId) {
        return;
      }
      this.triggerEvent("change", { id: nextCategoryId });
    },
  },
});
