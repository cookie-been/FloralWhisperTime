import { Button, Drawer } from "antd";
import { Outlet, NavLink } from "react-router-dom";
import { Flower2, MapPin, Menu, Phone } from "lucide-react";
import { useEffect, useState } from "react";
import { getShopInfo, getSiteConfig } from "@/services/api";
import type { ShopInfo, SiteConfig } from "@/types";

const navItems = [
  { path: "/", label: "首页" },
  { path: "/gallery", label: "作品画廊" },
  { path: "/about", label: "关于我们" },
  { path: "/contact", label: "联系我们" },
];

export function Layout() {
  const [shop, setShop] = useState<ShopInfo | null>(null);
  const [siteConfig, setSiteConfig] = useState<SiteConfig | null>(null);
  const [mobileNavOpen, setMobileNavOpen] = useState(false);

  useEffect(() => {
    getShopInfo().then(setShop).catch(() => undefined);
    getSiteConfig().then(setSiteConfig).catch(() => undefined);
  }, []);

  return (
    <div className="min-h-screen bg-white text-ink">
      <header className="sticky top-0 z-50 border-b border-black/5 bg-white/92 backdrop-blur">
        <div className="mx-auto flex h-16 max-w-7xl items-center justify-between px-4 sm:px-6 lg:px-8">
          <NavLink to="/" className="flex items-center gap-2 font-semibold text-forest">
            <span className="flex h-9 w-9 items-center justify-center rounded-full bg-mint">
              <Flower2 size={20} />
            </span>
            <span className="max-w-[11rem] truncate text-base sm:max-w-none sm:text-lg">{siteConfig?.brandName ?? "花语时光"}</span>
          </NavLink>
          <nav className="hidden items-center gap-8 md:flex">
            {navItems.map((item) => (
              <NavLink
                key={item.path}
                to={item.path}
                end={item.path === "/"}
                className={({ isActive }) =>
                  `text-sm transition ${isActive ? "font-semibold text-forest" : "text-muted hover:text-forest"}`
                }
              >
                {item.label}
              </NavLink>
            ))}
          </nav>
          <div className="flex items-center gap-2">
            <NavLink
              to="/contact"
              className="hidden items-center gap-2 rounded-full bg-forest px-4 py-2 text-sm font-medium text-white transition hover:bg-[#256b29] md:inline-flex"
            >
              <Phone size={16} />
              咨询花艺
            </NavLink>
            <Button
              type="text"
              className="inline-flex items-center justify-center md:!hidden"
              icon={<Menu size={18} />}
              aria-label="打开导航菜单"
              onClick={() => setMobileNavOpen(true)}
            />
          </div>
        </div>
      </header>

      <main>
        <Outlet />
      </main>

      <footer className="bg-[#f7fbf7]">
        <div className="mx-auto grid max-w-7xl gap-8 px-4 py-10 sm:px-6 md:grid-cols-[1.2fr_1fr_1fr] lg:px-8">
          <div>
            <div className="flex items-center gap-2 font-semibold text-forest">
              <Flower2 size={20} />
              {siteConfig?.brandName ?? "花语时光"}
            </div>
            <p className="mt-3 max-w-md text-sm leading-7 text-muted">
              {siteConfig?.footerDescription ?? "纯展示型鲜花店窗口，展示婚礼、日常花礼、开业花篮、节气花束与定制花艺。"}
            </p>
          </div>
          <div className="text-sm text-muted">
            <p className="font-semibold text-ink">门店</p>
            <p className="mt-3 flex items-start gap-2">
              <MapPin size={16} className="mt-1 text-forest" />
              {shop?.address ?? "上海市徐汇区衡山路 88 号 1 层"}
            </p>
          </div>
          <div className="text-sm text-muted">
            <p className="font-semibold text-ink">营业时间</p>
            <p className="mt-3">{siteConfig?.businessHoursText ?? "周一至周五 09:30-21:00，周末 10:00-21:30"}</p>
          </div>
        </div>
      </footer>

      <Drawer
        placement="right"
        open={mobileNavOpen}
        onClose={() => setMobileNavOpen(false)}
        width="100%"
        title={siteConfig?.brandName ?? "花语时光"}
        className="md:!hidden"
      >
        <div className="flex h-full flex-col">
          <nav className="space-y-2">
            {navItems.map((item) => (
              <NavLink
                key={item.path}
                to={item.path}
                end={item.path === "/"}
                onClick={() => setMobileNavOpen(false)}
                className={({ isActive }) =>
                  [
                    "flex items-center justify-between rounded-lg border px-4 py-4 text-sm font-medium transition",
                    isActive
                      ? "border-[#cfe0cf] bg-[#eef5ed] text-forest"
                      : "border-black/6 bg-white text-ink hover:border-[#d9e5d7] hover:bg-[#f8fbf7]",
                  ].join(" ")
                }
              >
                {item.label}
              </NavLink>
            ))}
          </nav>
          <div className="mt-auto pt-6">
            <NavLink to="/contact" onClick={() => setMobileNavOpen(false)}>
              <Button type="primary" size="large" block icon={<Phone size={16} />}>
                咨询花艺
              </Button>
            </NavLink>
          </div>
        </div>
      </Drawer>
    </div>
  );
}
