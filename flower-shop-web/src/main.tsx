import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import { RouterProvider } from "react-router-dom";
import { ConfigProvider } from "antd";
import zhCN from "antd/locale/zh_CN";
import { router } from "./router";
import "./styles.css";

createRoot(document.getElementById("root")!).render(
  <StrictMode>
    <ConfigProvider
      locale={zhCN}
      theme={{
        token: {
          colorPrimary: "#2E7D32",
          colorBgLayout: "#f6f3ee",
          colorBgContainer: "#ffffff",
          borderRadius: 8,
          fontFamily: "PingFang SC, Microsoft YaHei, Helvetica Neue, Arial, sans-serif",
        },
      }}
    >
      <RouterProvider router={router} />
    </ConfigProvider>
  </StrictMode>,
);
