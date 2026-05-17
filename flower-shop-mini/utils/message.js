function showToastMessage(title, icon, duration) {
  wx.showToast({
    title,
    icon,
    duration,
  });
}

function showErrorMessage(message) {
  showToastMessage(message || "操作失败", "none", 2200);
}

function showSuccessMessage(message) {
  showToastMessage(message || "操作成功", "success", 1800);
}

function showRefreshErrorMessage() {
  showErrorMessage("刷新失败");
}

function showLoadMoreErrorMessage() {
  showErrorMessage("加载更多失败");
}

module.exports = {
  showErrorMessage,
  showLoadMoreErrorMessage,
  showRefreshErrorMessage,
  showSuccessMessage,
};
