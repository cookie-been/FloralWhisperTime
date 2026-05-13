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
      this.triggerEvent("change", { id: event.currentTarget.dataset.id });
    },
  },
});
