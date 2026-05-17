type ToastIcon = "success" | "error" | "loading" | "none";

function showToastMessage(title: string, icon: ToastIcon, duration: number) {
  wx.showToast({
    title,
    icon,
    duration,
  });
}

export function showErrorMessage(message: string) {
  showToastMessage(message || "操作失败", "none", 2200);
}

export function showSuccessMessage(message: string) {
  showToastMessage(message || "操作成功", "success", 1800);
}

export function showRefreshErrorMessage() {
  showErrorMessage("刷新失败");
}

export function showLoadMoreErrorMessage() {
  showErrorMessage("加载更多失败");
}
