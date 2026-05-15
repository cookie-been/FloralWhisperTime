import { Button, Drawer, Form, Grid, Input, Modal, message } from "antd";
import { ArrowUpRight, LogOut, Menu } from "lucide-react";
import { useEffect, useState } from "react";
import { NavLink, Outlet, useLocation, useNavigate } from "react-router-dom";
import { changeAdminPassword, clearAdminToken, getAdminSession, getCurrentAdmin } from "@/services/api";
import { adminNavItems, adminPageMeta, adminPublicLink } from "./adminMeta";

const adminRoutePreloaders: Record<string, () => Promise<unknown>> = {
  "/admin": () => import("@/pages/AdminDashboard/AdminDashboard"),
  "/admin/flowers": () => import("@/pages/AdminFlowers/AdminFlowers"),
  "/admin/settings": () => import("@/pages/AdminSettings/AdminSettings"),
  "/admin/ai-settings": () => import("@/pages/AdminAiSettings/AdminAiSettings"),
  "/admin/contacts": () => import("@/pages/AdminContacts/AdminContacts"),
  "/admin/system": () => import("@/pages/AdminSystemStatus/AdminSystemStatus"),
  "/admin/operation-logs": () => import("@/pages/AdminOperationLogs/AdminOperationLogs"),
};

function preloadAdminRoute(path: string) {
  void adminRoutePreloaders[path]?.();
}

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
            onMouseEnter={() => preloadAdminRoute(item.path)}
            onFocus={() => preloadAdminRoute(item.path)}
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
  const [passwordForm] = Form.useForm<{ currentPassword: string; newPassword: string; confirmPassword: string }>();
  const [drawerOpen, setDrawerOpen] = useState(false);
  const [session, setSession] = useState(() => getAdminSession());
  const [changingPassword, setChangingPassword] = useState(false);

  const logout = () => {
    clearAdminToken();
    message.success("已退出管理后台");
    navigate("/admin/login", { replace: true });
  };

  useEffect(() => {
    setDrawerOpen(false);
  }, [location.pathname]);

  useEffect(() => {
    getCurrentAdmin().then(setSession).catch(() => undefined);
  }, []);

  const requirePasswordChange = Boolean(session?.requirePasswordChange);

  const handlePasswordChange = async () => {
    const values = await passwordForm.validateFields();
    setChangingPassword(true);
    try {
      const result = await changeAdminPassword(values.currentPassword, values.newPassword);
      setSession({ username: result.username, requirePasswordChange: result.requirePasswordChange });
      passwordForm.resetFields();
      message.success("管理员密码已更新");
    } catch (error) {
      message.error(error instanceof Error ? error.message : "修改密码失败");
    } finally {
      setChangingPassword(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#f6f3ee] text-ink">
      <div className="grid min-h-screen w-full lg:grid-cols-[288px_minmax(0,1fr)]">
        <aside className="admin-sidebar hidden min-h-full flex-col border-r border-white/10 px-5 py-6 lg:flex">
          <div>
            <p className="text-xs font-semibold uppercase tracking-[0.24em] text-white/65">管理入口</p>
            <div className="mt-4 rounded-lg border border-white/10 bg-white/8 px-4 py-4">
              <div className="flex items-center gap-3">
                <img src="/brand-logo.png" alt="花语时光" className="h-12 w-12 rounded-xl object-cover shadow-[0_12px_24px_rgba(0,0,0,0.2)]" />
                <div>
                  <h1 className="text-lg font-semibold text-white">花语时光后台</h1>
                  <p className="mt-1 text-xs uppercase tracking-[0.2em] text-white/52">Floral Whisper Time</p>
                </div>
              </div>
              <p className="mt-2 text-sm leading-6 text-white/70">从作品、站点内容与 AI 能力三个层面维护品牌展示。</p>
            </div>
          </div>
          <AdminNav />
        </aside>

        <div className="min-w-0">
          <header className="sticky top-0 z-20 border-b border-black/5 bg-[#f6f3ee]/92 backdrop-blur">
            <div className="admin-shell-section flex flex-wrap items-end justify-between gap-4 py-4 sm:px-8 sm:py-5">
              <div>
                <p className="section-eyebrow">{meta.eyebrow}</p>
                <h2 className="admin-section-title mt-2 text-2xl sm:text-3xl">{meta.title}</h2>
                <p className="admin-shell-copy mt-2 text-sm">{meta.description}</p>
              </div>
              <div className="flex items-center gap-2">
                {screens.lg ? (
                  <>
                    <NavLink to={adminPublicLink.path}>
                      <Button size="large" icon={<ArrowUpRight size={16} />} disabled={requirePasswordChange}>
                        {adminPublicLink.label}
                      </Button>
                    </NavLink>
                    <Button size="large" icon={<LogOut size={16} />} onClick={logout}>
                      退出登录
                    </Button>
                  </>
                ) : (
                  <Button size="large" icon={<Menu size={16} />} onClick={() => setDrawerOpen(true)} disabled={requirePasswordChange}>
                    菜单
                  </Button>
                )}
              </div>
            </div>
          </header>

          <main className="admin-shell-section py-6 sm:px-8 sm:py-8">
            <Outlet />
          </main>
        </div>
      </div>

      <Drawer
        placement="left"
        open={drawerOpen}
        onClose={() => setDrawerOpen(false)}
        width={screens.sm ? 320 : "100%"}
        title={
          <div className="admin-drawer-title">
            <p>后台导航</p>
            <h3>后台导航</h3>
            <span>在移动端快速切换总览、作品、配置与留言管理。</span>
          </div>
        }
        className="admin-mobile-drawer lg:hidden"
      >
        <div className="flex h-full flex-col">
          <div className="admin-subpanel px-4 py-4">
            <div className="flex items-center gap-3">
              <img src="/brand-logo.png" alt="花语时光" className="h-11 w-11 rounded-xl object-cover shadow-sm" />
              <div>
                <p className="text-sm font-semibold text-[#1b281e]">花语时光后台</p>
                <p className="mt-1 text-xs uppercase tracking-[0.16em] text-[#6d7e72]">Floral Whisper Time</p>
              </div>
            </div>
            <p className="mt-2 text-sm leading-6 text-muted">移动端以抽屉方式浏览作品、站点、AI 和留言等后台入口。</p>
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
                    onMouseEnter={() => preloadAdminRoute(item.path)}
                    onFocus={() => preloadAdminRoute(item.path)}
                    onClick={(event) => {
                      if (requirePasswordChange) {
                        event.preventDefault();
                      }
                    }}
                    className={({ isActive }) =>
                      [
                        "flex items-start gap-3 rounded-lg border px-3 py-3 transition",
                        requirePasswordChange
                          ? "cursor-not-allowed opacity-60"
                          : "",
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
              <Button block size="large" icon={<ArrowUpRight size={16} />} disabled={requirePasswordChange}>
                {adminPublicLink.label}
              </Button>
            </NavLink>
            <Button block size="large" icon={<LogOut size={16} />} onClick={logout}>
              退出登录
            </Button>
          </div>
        </div>
      </Drawer>

      <Modal
        open={requirePasswordChange}
        closable={false}
        maskClosable={false}
        keyboard={false}
        title="首次登录请先修改管理员密码"
        okText="保存新密码"
        cancelButtonProps={{ style: { display: "none" } }}
        confirmLoading={changingPassword}
        onOk={() => void handlePasswordChange()}
      >
        <p className="mb-4 text-sm leading-6 text-muted">
          当前环境仍在使用初始管理员密码。为保证交付安全，修改完成前将限制后台其他操作。
        </p>
        <Form form={passwordForm} layout="vertical">
          <Form.Item name="currentPassword" label="当前密码" rules={[{ required: true, message: "请输入当前密码" }]}>
            <Input.Password size="large" />
          </Form.Item>
          <Form.Item
            name="newPassword"
            label="新密码"
            rules={[
              { required: true, message: "请输入新密码" },
              { min: 8, message: "新密码至少 8 位" },
            ]}
          >
            <Input.Password size="large" />
          </Form.Item>
          <Form.Item
            name="confirmPassword"
            label="确认新密码"
            dependencies={["newPassword"]}
            rules={[
              { required: true, message: "请再次输入新密码" },
              ({ getFieldValue }) => ({
                validator(_, value) {
                  if (!value || value === getFieldValue("newPassword")) {
                    return Promise.resolve();
                  }
                  return Promise.reject(new Error("两次输入的新密码不一致"));
                },
              }),
            ]}
          >
            <Input.Password size="large" />
          </Form.Item>
        </Form>
      </Modal>
    </div>
  );
}
