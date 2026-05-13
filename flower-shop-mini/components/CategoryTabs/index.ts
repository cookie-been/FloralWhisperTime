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
      this.triggerEvent("change", { id: event.currentTarget.dataset.id });
    },
  },
});
