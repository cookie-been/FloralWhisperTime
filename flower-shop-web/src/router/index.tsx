import type { ReactNode } from "react";
import { lazy, Suspense } from "react";
import { Navigate, createBrowserRouter } from "react-router-dom";
import { Spin } from "antd";
import { AdminShell } from "@/components/admin/AdminShell";
import { ProtectedAdminRoute } from "@/components/auth/ProtectedAdminRoute";
import { Layout } from "@/components/layout/Layout";

const Home = lazy(() => import("@/pages/Home/Home").then((module) => ({ default: module.Home })));
const Gallery = lazy(() => import("@/pages/Gallery/Gallery").then((module) => ({ default: module.Gallery })));
const FlowerDetail = lazy(() => import("@/pages/FlowerDetail/FlowerDetail").then((module) => ({ default: module.FlowerDetail })));
const About = lazy(() => import("@/pages/About/About").then((module) => ({ default: module.About })));
const Contact = lazy(() => import("@/pages/Contact/Contact").then((module) => ({ default: module.Contact })));
const AdminLogin = lazy(() => import("@/pages/AdminLogin/AdminLogin").then((module) => ({ default: module.AdminLogin })));
const AdminDashboard = lazy(() => import("@/pages/AdminDashboard/AdminDashboard").then((module) => ({ default: module.AdminDashboard })));
const AdminFlowers = lazy(() => import("@/pages/AdminFlowers/AdminFlowers").then((module) => ({ default: module.AdminFlowers })));
const AdminSettings = lazy(() => import("@/pages/AdminSettings/AdminSettings").then((module) => ({ default: module.AdminSettings })));
const AdminAiSettings = lazy(() => import("@/pages/AdminAiSettings/AdminAiSettings").then((module) => ({ default: module.AdminAiSettings })));
const AdminSystemStatus = lazy(() => import("@/pages/AdminSystemStatus/AdminSystemStatus").then((module) => ({ default: module.AdminSystemStatus })));
const AdminOperationLogs = lazy(() => import("@/pages/AdminOperationLogs/AdminOperationLogs").then((module) => ({ default: module.AdminOperationLogs })));
const AdminContacts = lazy(() => import("@/pages/AdminContacts/AdminContacts").then((module) => ({ default: module.AdminContacts })));

function RouteFallback() {
  return (
    <div className="flex min-h-[40vh] items-center justify-center">
      <Spin size="large" />
    </div>
  );
}

function withSuspense(element: ReactNode) {
  return <Suspense fallback={<RouteFallback />}>{element}</Suspense>;
}

export const router = createBrowserRouter([
  {
    path: "/",
    element: <Layout />,
    children: [
      { index: true, element: withSuspense(<Home />) },
      { path: "gallery", element: withSuspense(<Gallery />) },
      { path: "gallery/:id", element: withSuspense(<FlowerDetail />) },
      { path: "about", element: withSuspense(<About />) },
      { path: "contact", element: withSuspense(<Contact />) },
    ],
  },
  { path: "/admin/login", element: withSuspense(<AdminLogin />) },
  {
    path: "/admin",
    element: <ProtectedAdminRoute />,
    children: [
      {
        element: <AdminShell />,
        children: [
          { index: true, element: withSuspense(<AdminDashboard />) },
          { path: "flowers", element: withSuspense(<AdminFlowers />) },
          { path: "settings", element: withSuspense(<AdminSettings />) },
          { path: "ai-settings", element: withSuspense(<AdminAiSettings />) },
          { path: "system", element: withSuspense(<AdminSystemStatus />) },
          { path: "operation-logs", element: withSuspense(<AdminOperationLogs />) },
          { path: "about", element: <Navigate to="/admin/settings?tab=about" replace /> },
          { path: "contacts", element: withSuspense(<AdminContacts />) },
        ],
      },
    ],
  },
]);
