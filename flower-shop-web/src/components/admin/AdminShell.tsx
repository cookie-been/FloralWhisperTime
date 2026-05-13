import { Button, message } from "antd";
import { ArrowUpRight, LogOut } from "lucide-react";
import { NavLink, Outlet, useLocation, useNavigate } from "react-router-dom";
import { clearAdminToken } from "@/services/api";
import { adminNavItems, adminPageMeta, adminPublicLink } from "./adminMeta";

function resolveMeta(pathname: string) {
  return adminPageMeta[pathname as keyof typeof adminPageMeta] ?? adminPageMeta["/admin"];
}

export function AdminShell() {
  const location = useLocation();
  const navigate = useNavigate();
  const meta = resolveMeta(location.pathname);

  const logout = () => {
    clearAdminToken();
    message.success("已退出管理后台");
    navigate("/admin/login", { replace: true });
  };

  return (
    <div className="min-h-screen bg-[#f6f3ee] text-ink">
      <div className="mx-auto grid min-h-screen max-w-[1600px] lg:grid-cols-[272px_minmax(0,1fr)]">
        <aside className="admin-sidebar flex min-h-full flex-col border-r border-white/10 px-5 py-6">
          <div>
            <p className="text-xs font-semibold uppercase tracking-[0.24em] text-white/65">Floral Whisper</p>
            <div className="mt-4 rounded-lg border border-white/10 bg-white/8 px-4 py-4">
              <h1 className="text-lg font-semibold text-white">花语时光后台</h1>
              <p className="mt-2 text-sm leading-6 text-white/70">从作品、首页与门店内容三个层面维护品牌展示。</p>
            </div>
          </div>

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

          <div className="mt-auto space-y-3 pt-8">
            <NavLink
              to={adminPublicLink.path}
              className="flex items-center justify-between rounded-lg border border-white/16 bg-white/10 px-4 py-3 text-sm font-medium text-white transition hover:border-white/28 hover:bg-white/16"
            >
              <span>{adminPublicLink.label}</span>
              <ArrowUpRight size={16} />
            </NavLink>
            <Button block size="large" icon={<LogOut size={16} />} onClick={logout} className="border-white/18 bg-white/10 !text-white hover:!border-white/28 hover:!bg-white/16">
              退出登录
            </Button>
          </div>
        </aside>

        <div className="min-w-0">
          <header className="sticky top-0 z-20 border-b border-black/5 bg-[#f6f3ee]/92 backdrop-blur">
            <div className="flex flex-wrap items-end justify-between gap-4 px-5 py-5 sm:px-8">
              <div>
                <p className="text-xs font-semibold uppercase tracking-[0.24em] text-forest/70">{meta.eyebrow}</p>
                <h2 className="mt-2 text-3xl font-semibold text-[#1b281e]">{meta.title}</h2>
                <p className="mt-2 text-sm leading-6 text-muted">{meta.description}</p>
              </div>
            </div>
          </header>

          <main className="px-5 py-6 sm:px-8 sm:py-8">
            <Outlet />
          </main>
        </div>
      </div>
    </div>
  );
}
