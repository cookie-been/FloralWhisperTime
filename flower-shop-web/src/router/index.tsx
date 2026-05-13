import { createBrowserRouter } from "react-router-dom";
import { ProtectedAdminRoute } from "@/components/auth/ProtectedAdminRoute";
import { Layout } from "@/components/layout/Layout";
import { AdminFlowers } from "@/pages/AdminFlowers/AdminFlowers";
import { AdminLogin } from "@/pages/AdminLogin/AdminLogin";
import { AdminSettings } from "@/pages/AdminSettings/AdminSettings";
import { About } from "@/pages/About/About";
import { Contact } from "@/pages/Contact/Contact";
import { FlowerDetail } from "@/pages/FlowerDetail/FlowerDetail";
import { Gallery } from "@/pages/Gallery/Gallery";
import { Home } from "@/pages/Home/Home";

export const router = createBrowserRouter([
  {
    path: "/",
    element: <Layout />,
    children: [
      { index: true, element: <Home /> },
      { path: "gallery", element: <Gallery /> },
      { path: "gallery/:id", element: <FlowerDetail /> },
      { path: "about", element: <About /> },
      { path: "contact", element: <Contact /> },
      { path: "admin/login", element: <AdminLogin /> },
      {
        path: "admin",
        element: <ProtectedAdminRoute />,
        children: [
          { path: "flowers", element: <AdminFlowers /> },
          { path: "settings", element: <AdminSettings /> },
        ],
      },
    ],
  },
]);
