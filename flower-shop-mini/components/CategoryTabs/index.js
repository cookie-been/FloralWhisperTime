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
    handleChange(event) {
      const nextCategoryId = event.currentTarget.dataset.id;
      if (!nextCategoryId) {
        return;
      }
      this.triggerEvent("change", { id: nextCategoryId });
    },
  },
});
