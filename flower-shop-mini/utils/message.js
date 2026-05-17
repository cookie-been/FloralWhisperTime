function showErrorMessage(message) {
  wx.showToast({
    title: message || "操作失败",
    icon: "none",
    duration: 2200,
  });
}

function showSuccessMessage(message) {
  wx.showToast({
    title: message,
    icon: "success",
    duration: 1800,
  });
}

module.exports = {
  showErrorMessage,
  showSuccessMessage,
};
