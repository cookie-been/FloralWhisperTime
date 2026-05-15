import { Button, Drawer } from "antd";
import { Outlet, NavLink } from "react-router-dom";
import { MapPin, Menu, Phone } from "lucide-react";
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
    Promise.allSettled([getShopInfo(), getSiteConfig()]).then(([shopResult, siteConfigResult]) => {
      if (shopResult.status === "fulfilled") setShop(shopResult.value);
      if (siteConfigResult.status === "fulfilled") setSiteConfig(siteConfigResult.value);
    });
  }, []);

  return (
    <div className="min-h-screen bg-white text-ink">
      <header className="sticky top-0 z-50 border-b border-black/5 bg-white/92 backdrop-blur">
        <div className="site-shell-section flex h-16 items-center justify-between sm:h-[4.25rem]">
          <NavLink to="/" className="flex items-center gap-2 font-semibold text-forest">
            <img src="/brand-logo.png" alt="花语时光" className="h-10 w-10 rounded-xl object-cover shadow-sm" />
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
        <div className="site-shell-section grid gap-7 py-9 sm:py-10 md:grid-cols-[1.2fr_1fr_1fr]">
          <div>
            <div className="flex items-center gap-2 font-semibold text-forest">
              <img src="/brand-logo.png" alt="花语时光" className="h-9 w-9 rounded-xl object-cover shadow-sm" />
              {siteConfig?.brandName ?? "花语时光"}
            </div>
            <p className="site-shell-copy mt-3 max-w-md">
              {siteConfig?.footerDescription ?? "纯展示型鲜花店窗口，展示婚礼、日常花礼、开业花篮、节气花束与定制花艺。"}
            </p>
          </div>
          <div className="site-shell-copy text-sm">
            <p className="font-semibold text-ink">门店</p>
            <p className="mt-3 flex items-start gap-2">
              <MapPin size={16} className="mt-1 text-forest" />
              {shop?.address ?? "上海市徐汇区衡山路 88 号 1 层"}
            </p>
          </div>
          <div className="site-shell-copy text-sm">
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
        className="site-mobile-drawer md:!hidden"
      >
        <div className="flex h-full flex-col">
          <div className="mb-5 rounded-lg border border-black/6 bg-[#f8fbf7] px-4 py-4">
            <p className="text-xs font-semibold uppercase tracking-[0.18em] text-[#58725f]">品牌导航</p>
            <p className="mt-2 text-sm leading-7 text-muted">
              {siteConfig?.footerDescription ?? "查看作品、了解品牌、联系门店与提交咨询。"}
            </p>
          </div>
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
          <div className="mt-auto space-y-4 pt-6">
            <div className="rounded-lg border border-black/6 bg-[#f8fbf7] px-4 py-4 text-sm text-muted">
              <p className="font-semibold text-ink">门店信息</p>
              <p className="mt-2 leading-7">{shop?.address ?? "上海市徐汇区衡山路 88 号 1 层"}</p>
              <p className="mt-1 leading-7">{siteConfig?.businessHoursText ?? "周一至周五 09:30-21:00，周末 10:00-21:30"}</p>
            </div>
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
