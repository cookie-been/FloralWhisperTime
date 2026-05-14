import { Button, Drawer, Grid, message } from "antd";
import { ArrowUpRight, LogOut, Menu } from "lucide-react";
import { useEffect, useState } from "react";
import { NavLink, Outlet, useLocation, useNavigate } from "react-router-dom";
import { clearAdminToken } from "@/services/api";
import { adminNavItems, adminPageMeta, adminPublicLink } from "./adminMeta";

function resolveMeta(pathname: string) {
  return adminPageMeta[pathname as keyof typeof adminPageMeta] ?? adminPageMeta["/admin"];
}

function AdminNav() {
  return (
    <nav className="mt-8 space-y-2">
      {adminNavItems.map((item) => {
        const Icon = item.icon;
        return (
          <NavLink
            key={item.path}
            to={item.path}
            end={item.path === "/admin"}
            className={({ isActive }) =>
              [
                "admin-nav-item flex items-start gap-3 rounded-lg px-3 py-3 transition",
                isActive
                  ? "border border-white/70 bg-white text-[#1f3d2d] shadow-[0_12px_30px_rgba(0,0,0,0.18)]"
                  : "border border-white/10 bg-white/8 text-white hover:border-white/24 hover:bg-white/14 hover:text-white",
              ].join(" ")
            }
          >
            {({ isActive }) => (
              <>
                <span
                  className={[
                    "mt-0.5 flex h-9 w-9 shrink-0 items-center justify-center rounded-lg",
                    isActive ? "bg-[#eef1e9] text-forest" : "bg-white/14 text-white",
                  ].join(" ")}
                >
                  <Icon size={18} />
                </span>
                <span className="min-w-0">
                  <span className="block text-sm font-semibold">{item.label}</span>
                  <span className={["mt-1 block text-xs leading-5", isActive ? "text-[#58725f]" : "text-white/74"].join(" ")}>
                    {item.description}
                  </span>
                </span>
              </>
            )}
          </NavLink>
        );
      })}
    </nav>
  );
}

export function AdminShell() {
  const location = useLocation();
  const navigate = useNavigate();
  const screens = Grid.useBreakpoint();
  const meta = resolveMeta(location.pathname);
  const [drawerOpen, setDrawerOpen] = useState(false);

  const logout = () => {
    clearAdminToken();
    message.success("已退出管理后台");
    navigate("/admin/login", { replace: true });
  };

  useEffect(() => {
    setDrawerOpen(false);
  }, [location.pathname]);

  return (
    <div className="min-h-screen bg-[#f6f3ee] text-ink">
      <div className="grid min-h-screen w-full lg:grid-cols-[288px_minmax(0,1fr)] 2xl:px-5">
        <aside className="admin-sidebar hidden min-h-full flex-col border-r border-white/10 px-5 py-6 lg:flex">
          <div>
            <p className="text-xs font-semibold uppercase tracking-[0.24em] text-white/65">Floral Whisper</p>
            <div className="mt-4 rounded-lg border border-white/10 bg-white/8 px-4 py-4">
              <h1 className="text-lg font-semibold text-white">花语时光后台</h1>
              <p className="mt-2 text-sm leading-6 text-white/70">从作品、首页与门店内容三个层面维护品牌展示。</p>
            </div>
          </div>
          <AdminNav />
        </aside>

        <div className="min-w-0">
          <header className="sticky top-0 z-20 border-b border-black/5 bg-[#f6f3ee]/92 backdrop-blur">
            <div className="flex flex-wrap items-end justify-between gap-4 px-5 py-4 sm:px-8 sm:py-5">
              <div>
                <p className="section-eyebrow">{meta.eyebrow}</p>
                <h2 className="admin-section-title mt-2 text-3xl">{meta.title}</h2>
                <p className="mt-2 text-sm leading-6 text-muted">{meta.description}</p>
              </div>
              <div className="flex items-center gap-2">
                {screens.lg ? (
                  <>
                    <NavLink to={adminPublicLink.path}>
                      <Button size="large" icon={<ArrowUpRight size={16} />}>
                        {adminPublicLink.label}
                      </Button>
                    </NavLink>
                    <Button size="large" icon={<LogOut size={16} />} onClick={logout}>
                      退出登录
                    </Button>
                  </>
                ) : (
                  <Button size="large" icon={<Menu size={16} />} onClick={() => setDrawerOpen(true)}>
                    菜单
                  </Button>
                )}
              </div>
            </div>
          </header>

          <main className="px-5 py-6 sm:px-8 sm:py-8">
            <Outlet />
          </main>
        </div>
      </div>

      <Drawer
        placement="left"
        open={drawerOpen}
        onClose={() => setDrawerOpen(false)}
        width={320}
        title={
          <div className="admin-drawer-title">
            <p>Navigation</p>
            <h3>后台导航</h3>
            <span>在移动端快速切换总览、作品、配置与留言管理。</span>
          </div>
        }
        className="admin-mobile-drawer lg:hidden"
      >
        <div className="flex h-full flex-col">
          <div className="admin-subpanel px-4 py-4">
            <p className="text-sm font-semibold text-[#1b281e]">花语时光后台</p>
            <p className="mt-2 text-sm leading-6 text-muted">移动端以抽屉方式浏览后台导航与操作入口。</p>
          </div>

          <div className="admin-mobile-nav mt-5">
            <nav className="space-y-2">
              {adminNavItems.map((item) => {
                const Icon = item.icon;
                return (
                  <NavLink
                    key={item.path}
                    to={item.path}
                    end={item.path === "/admin"}
                    className={({ isActive }) =>
                      [
                        "flex items-start gap-3 rounded-lg border px-3 py-3 transition",
                        isActive
                          ? "border-[#d2dfd1] bg-[#eef5ed] text-[#1f3d2d]"
                          : "border-black/6 bg-white text-[#1b281e] hover:border-[#d9e5d7] hover:bg-[#f8fbf7]",
                      ].join(" ")
                    }
                  >
                    {({ isActive }) => (
                      <>
                        <span
                          className={[
                            "mt-0.5 flex h-9 w-9 shrink-0 items-center justify-center rounded-lg",
                            isActive ? "bg-white text-forest" : "bg-[#f4f1eb] text-forest",
                          ].join(" ")}
                        >
                          <Icon size={18} />
                        </span>
                        <span className="min-w-0">
                          <span className="block text-sm font-semibold">{item.label}</span>
                          <span className={["mt-1 block text-xs leading-5", isActive ? "text-[#58725f]" : "text-muted"].join(" ")}>
                            {item.description}
                          </span>
                        </span>
                      </>
                    )}
                  </NavLink>
                );
              })}
            </nav>
          </div>

          <div className="mt-auto space-y-3 pt-8">
            <NavLink to={adminPublicLink.path}>
              <Button block size="large" icon={<ArrowUpRight size={16} />}>
                {adminPublicLink.label}
              </Button>
            </NavLink>
            <Button block size="large" icon={<LogOut size={16} />} onClick={logout}>
              退出登录
            </Button>
          </div>
        </div>
      </Drawer>
    </div>
  );
}
