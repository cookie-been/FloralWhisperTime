Component({
  properties: {
    images: {
      type: Array,
      value: [],
    },
  },
  methods: {
    preview(event) {
      wx.previewImage({
        urls: this.data.images,
        current: event.currentTarget.dataset.current,
      });
    },
  },
});
