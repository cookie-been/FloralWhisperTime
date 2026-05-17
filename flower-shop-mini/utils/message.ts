export function showErrorMessage(message: string) {
  wx.showToast({
    title: message || "操作失败",
    icon: "none",
    duration: 2200,
  });
}

export function showSuccessMessage(message: string) {
  wx.showToast({
    title: message,
    icon: "success",
    duration: 1800,
  });
}
