import { useEffect, useMemo, useState } from "react";
import { Button, Form, Input, message } from "antd";
import { ArrowRight, Lock, User } from "lucide-react";
import { Navigate, useLocation, useNavigate } from "react-router-dom";
import { getAdminSession, getAdminToken, getSiteConfig, loginAdmin } from "@/services/api";
import type { SiteConfig } from "@/types";
import { buildAdminLoginBackgroundSlides, buildAdminLoginCopy } from "./admin-login.helpers";

interface LoginForm {
  username: string;
  password: string;
}

export function AdminLogin() {
  const navigate = useNavigate();
  const location = useLocation();
  const [loading, setLoading] = useState(false);
  const [siteConfig, setSiteConfig] = useState<SiteConfig | null>(null);
  const [activeSlide, setActiveSlide] = useState(0);
  const from = (location.state as { from?: string } | null)?.from ?? "/admin";
  const session = getAdminSession();
  const loginCopy = buildAdminLoginCopy(siteConfig);

  const backgroundSlides = useMemo(() => buildAdminLoginBackgroundSlides(siteConfig), [siteConfig]);

  useEffect(() => {
    getSiteConfig().then(setSiteConfig).catch(() => undefined);
  }, []);

  useEffect(() => {
    if (backgroundSlides.length <= 1) return;

    const timer = window.setInterval(() => {
      setActiveSlide((current) => (current + 1) % backgroundSlides.length);
    }, 4800);

    return () => window.clearInterval(timer);
  }, [backgroundSlides]);

  if (getAdminToken() && session && !session.requirePasswordChange) {
    return <Navigate to={from} replace />;
  }

  const onFinish = async (values: LoginForm) => {
    if (loading) return;
    setLoading(true);
    try {
      const result = await loginAdmin(values.username, values.password);
      message.success(result.requirePasswordChange ? "登录成功，请先修改管理员密码" : "登录成功");
      navigate(from, { replace: true });
    } catch (error) {
      message.error(error instanceof Error ? error.message : "登录失败");
    } finally {
      setLoading(false);
    }
  };

  return (
    <section className="relative min-h-screen w-full overflow-hidden bg-[#233229]">
      <div className="absolute inset-0">
        {backgroundSlides.map((image, index) => (
          <img
            key={image}
            src={image}
            alt=""
            className={`absolute inset-0 h-full w-full object-cover transition-opacity duration-[1600ms] ${
              index === activeSlide ? "opacity-100" : "opacity-0"
            }`}
          />
        ))}
        <div className="absolute inset-0 bg-[linear-gradient(135deg,rgba(23,35,28,0.78),rgba(72,58,44,0.48),rgba(23,35,28,0.82))]" />
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_top,rgba(244,235,223,0.18),transparent_34%),radial-gradient(circle_at_bottom_right,rgba(133,160,138,0.14),transparent_28%)]" />
      </div>

      <div className="relative z-10 flex min-h-screen flex-col px-5 py-6 sm:px-8 sm:py-8 lg:px-12 lg:py-10">
        <div className="flex items-center gap-3 text-white">
          <img src={loginCopy.brandLogo} alt="花语时光" className="h-12 w-12 rounded-2xl border border-white/14 bg-[#f4ede3]/12 object-cover p-1 shadow-[0_12px_24px_rgba(0,0,0,0.16)] backdrop-blur" />
          <div>
            <p className="text-sm font-semibold uppercase tracking-[0.22em] text-white/70">管理入口</p>
            <p className="mt-1 text-lg font-semibold">{loginCopy.brandName}</p>
          </div>
        </div>

        <div className="flex flex-1 items-center justify-center">
          <div className="w-full max-w-md rounded-2xl border border-[#efe2d3]/56 bg-[#f8f3eb]/88 px-6 py-7 shadow-[0_32px_90px_rgba(20,30,24,0.24)] backdrop-blur-md sm:px-9 sm:py-10">
            <div className="mb-8 text-center">
              <p className="text-sm font-semibold uppercase tracking-[0.22em] text-[#536b59]">后台登录</p>
              <h2 className="mt-3 text-2xl font-semibold text-[#243127] sm:text-3xl">管理者登录</h2>
              <p className="mt-3 text-sm leading-7 text-[#66756a]">登录后可维护作品、留言、站点配置、AI 生图参数，并查看系统状态与操作日志。</p>
            </div>

            <Form<LoginForm> layout="vertical" onFinish={onFinish} initialValues={{ username: "admin" }}>
              <Form.Item name="username" label="账号" rules={[{ required: true, message: "请输入账号" }]}>
                <Input size="large" prefix={<User size={16} />} placeholder="admin" />
              </Form.Item>
              <Form.Item name="password" label="密码" rules={[{ required: true, message: "请输入密码" }]}>
                <Input.Password size="large" prefix={<Lock size={16} />} placeholder="请输入管理密码" />
              </Form.Item>
              <Button type="primary" size="large" htmlType="submit" block loading={loading}>
                <span className="inline-flex items-center gap-2">
                  <span>进入后台</span>
                  <ArrowRight size={16} />
                </span>
              </Button>
            </Form>

            {backgroundSlides.length > 1 ? (
              <div className="mt-6 flex items-center justify-center gap-2">
                {backgroundSlides.map((image, index) => (
                  <span
                    key={`${image}-dot`}
                    className={`h-1.5 rounded-full transition-all duration-300 ${
                      index === activeSlide ? "w-8 bg-[#456451]" : "w-2 bg-[#cdbba7]"
                    }`}
                  />
                ))}
              </div>
            ) : null}
          </div>
        </div>
      </div>
    </section>
  );
}
