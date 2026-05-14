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
          colorPrimaryHover: "#3B8F42",
          colorPrimaryActive: "#276C2B",
          colorBgLayout: "#f6f3ee",
          colorBgContainer: "#ffffff",
          borderRadius: 8,
          fontFamily: "PingFang SC, Microsoft YaHei, Helvetica Neue, Arial, sans-serif",
        },
        components: {
          Button: {
            controlHeightLG: 44,
            fontWeight: 600,
            primaryShadow: "0 12px 28px rgba(46, 125, 50, 0.18)",
            defaultBorderColor: "#d8d1c5",
            defaultBg: "#fcfaf7",
            defaultHoverBg: "#f7f2eb",
            defaultHoverBorderColor: "#cfc4b4",
            defaultHoverColor: "#243127",
          },
          Input: {
            activeBorderColor: "#6a8f73",
            hoverBorderColor: "#96ae99",
            colorBorder: "#d9d0c2",
            colorBgContainer: "#fcfaf7",
          },
          InputNumber: {
            activeBorderColor: "#6a8f73",
            hoverBorderColor: "#96ae99",
            colorBorder: "#d9d0c2",
            colorBgContainer: "#fcfaf7",
          },
          Select: {
            activeBorderColor: "#6a8f73",
            hoverBorderColor: "#96ae99",
            colorBorder: "#d9d0c2",
            colorBgContainer: "#fcfaf7",
            optionSelectedBg: "#edf4eb",
          },
          Table: {
            headerBg: "#f4efe7",
            headerColor: "#2b3b30",
            headerSplitColor: "#e5ddd1",
            borderColor: "#ece3d7",
            rowHoverBg: "#faf6f0",
          },
          Segmented: {
            trackBg: "#efe8dd",
            itemSelectedBg: "#ffffff",
            itemSelectedColor: "#243127",
          },
        },
      }}
    >
      <RouterProvider router={router} />
    </ConfigProvider>
  </StrictMode>,
);
