import { useState } from "react";
import { Button, Form, Input, message } from "antd";
import { Lock, User } from "lucide-react";
import { Navigate, useLocation, useNavigate } from "react-router-dom";
import { getAdminToken, loginAdmin } from "@/services/api";

interface LoginForm {
  username: string;
  password: string;
}

export function AdminLogin() {
  const navigate = useNavigate();
  const location = useLocation();
  const [loading, setLoading] = useState(false);
  const from = (location.state as { from?: string } | null)?.from ?? "/admin/flowers";

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
    <section className="min-h-[calc(100vh-64px)] bg-[#f7fbf7] px-4 py-16">
      <div className="mx-auto max-w-md rounded-lg bg-white p-8 shadow-soft">
        <p className="text-sm font-semibold text-forest">Admin Login</p>
        <h1 className="mt-2 text-3xl font-semibold">管理者登录</h1>
        <p className="mt-3 text-sm leading-6 text-muted">登录后才能新增、编辑、删除作品和上传图片。</p>

        <Form<LoginForm> layout="vertical" className="mt-8" onFinish={onFinish} initialValues={{ username: "admin" }}>
          <Form.Item name="username" label="账号" rules={[{ required: true, message: "请输入账号" }]}>
            <Input size="large" prefix={<User size={16} />} placeholder="admin" />
          </Form.Item>
          <Form.Item name="password" label="密码" rules={[{ required: true, message: "请输入密码" }]}>
            <Input.Password size="large" prefix={<Lock size={16} />} placeholder="请输入管理密码" />
          </Form.Item>
          <Button type="primary" size="large" htmlType="submit" block loading={loading}>
            登录管理后台
          </Button>
        </Form>
      </div>
    </section>
  );
}
