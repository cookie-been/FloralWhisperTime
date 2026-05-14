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
            controlHeight: 40,
            controlHeightSM: 32,
            fontWeight: 600,
            borderColorDisabled: "#d7d2c8",
            defaultBorderColor: "#cfd5c8",
            defaultBg: "#faf6ef",
            defaultHoverBg: "#f5efe6",
            defaultHoverBorderColor: "#a9b6a6",
            defaultHoverColor: "#243127",
            defaultActiveBg: "#efe7db",
            defaultActiveBorderColor: "#90a08f",
            defaultGhostBorderColor: "#d9e3d4",
            defaultGhostColor: "#eff6eb",
            primaryShadow: "0 14px 30px rgba(46, 125, 50, 0.18)",
            dangerShadow: "0 12px 24px rgba(170, 70, 70, 0.14)",
            contentFontSizeSM: 13,
            contentFontSize: 14,
            contentFontSizeLG: 15,
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
