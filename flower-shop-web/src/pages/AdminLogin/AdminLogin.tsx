import { useEffect, useState } from "react";
import { Button, Form, Input, message } from "antd";
import { ArrowRight, Flower2, Lock, Sparkles, User } from "lucide-react";
import { Navigate, useLocation, useNavigate } from "react-router-dom";
import { getAdminToken, getSiteConfig, loginAdmin } from "@/services/api";
import type { SiteConfig } from "@/types";

interface LoginForm {
  username: string;
  password: string;
}

export function AdminLogin() {
  const navigate = useNavigate();
  const location = useLocation();
  const [loading, setLoading] = useState(false);
  const [siteConfig, setSiteConfig] = useState<SiteConfig | null>(null);
  const from = (location.state as { from?: string } | null)?.from ?? "/admin";

  useEffect(() => {
    getSiteConfig().then(setSiteConfig).catch(() => undefined);
  }, []);

  if (getAdminToken()) {
    return <Navigate to={from} replace />;
  }

  const onFinish = async (values: LoginForm) => {
    setLoading(true);
    try {
      await loginAdmin(values.username, values.password);
      message.success("登录成功");
      navigate(from, { replace: true });
    } catch (error) {
      message.error(error instanceof Error ? error.message : "登录失败");
    } finally {
      setLoading(false);
    }
  };

  return (
    <section className="min-h-screen bg-[#f2ede6] p-4 md:p-6">
      <div className="mx-auto grid min-h-[calc(100vh-2rem)] max-w-[1480px] overflow-hidden rounded-2xl bg-white shadow-[0_30px_80px_rgba(72,50,34,0.12)] md:min-h-[calc(100vh-3rem)] lg:grid-cols-[1.05fr_0.95fr]">
        <div className="relative overflow-hidden bg-[#203227] px-6 py-8 text-white sm:px-10 sm:py-10">
          <div className="absolute inset-0">
            {siteConfig?.heroImage ? (
              <img src={siteConfig.heroImage} alt="" className="h-full w-full object-cover opacity-28" />
            ) : null}
            <div className="absolute inset-0 bg-[linear-gradient(135deg,rgba(17,31,22,0.92),rgba(40,64,47,0.75))]" />
          </div>

          <div className="relative z-10 flex h-full flex-col">
            <div className="flex items-center gap-3">
              <span className="flex h-11 w-11 items-center justify-center rounded-xl bg-white/12 backdrop-blur">
                <Flower2 size={20} />
              </span>
              <div>
                <p className="text-sm font-semibold uppercase tracking-[0.22em] text-white/70">Floral Whisper</p>
                <p className="mt-1 text-lg font-semibold">{siteConfig?.brandName ?? "花语时光"}</p>
              </div>
            </div>

            <div className="mt-16 max-w-xl">
              <p className="text-sm font-semibold uppercase tracking-[0.24em] text-white/70">Admin Console</p>
              <h1 className="mt-4 text-4xl font-semibold leading-tight sm:text-5xl">
                管理作品、首页叙事与门店展示。
              </h1>
              <p className="mt-5 max-w-lg text-base leading-8 text-white/74">
                进入后台后，你会先看到站点当前状态，再进入作品管理与内容编辑。这一层专门服务于日常运营，不是营销页。
              </p>
            </div>

            <div className="mt-auto grid gap-3 pt-12 sm:grid-cols-3">
              {[
                { label: "运营总览", note: "先看状态再编辑" },
                { label: "作品工作台", note: "列表与抽屉并行操作" },
                { label: "站点配置", note: "首页与品牌内容统一维护" },
              ].map((item) => (
                <div key={item.label} className="rounded-xl border border-white/10 bg-white/8 px-4 py-4 backdrop-blur">
                  <div className="flex items-center gap-2 text-white">
                    <Sparkles size={15} />
                    <p className="text-sm font-semibold">{item.label}</p>
                  </div>
                  <p className="mt-2 text-sm leading-6 text-white/66">{item.note}</p>
                </div>
              ))}
            </div>
          </div>
        </div>

        <div className="flex items-center px-5 py-8 sm:px-10 lg:px-14">
          <div className="mx-auto w-full max-w-md">
            <p className="text-sm font-semibold uppercase tracking-[0.22em] text-forest/70">Sign In</p>
            <h2 className="mt-3 text-3xl font-semibold text-[#1b281e]">管理者登录</h2>
            <p className="mt-3 text-sm leading-7 text-muted">登录后可维护作品、上传图片，并更新首页与品牌故事内容。</p>

            <Form<LoginForm> layout="vertical" className="mt-10" onFinish={onFinish} initialValues={{ username: "admin" }}>
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
          </div>
        </div>
      </div>
    </section>
  );
}
