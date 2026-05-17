Component({
  properties: {
    loading: {
      type: Boolean,
      value: false,
    },
    errorText: {
      type: String,
      value: "",
    },
    emptyText: {
      type: String,
      value: "",
    },
    hasData: {
      type: Boolean,
      value: false,
    },
    loadingText: {
      type: String,
      value: "加载中",
    },
    retryText: {
      type: String,
      value: "重新加载",
    },
  },
  methods: {
    handleRetry() {
      this.triggerEvent("retry");
    },
  },
});
