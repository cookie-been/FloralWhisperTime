import { useEffect, useMemo, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { Button, Form, Input, InputNumber, message, Modal, Popconfirm, Select, Space, Switch, Table, Tag, Upload } from "antd";
import type { RcFile } from "antd/es/upload";
import {
  clearAdminToken,
  createFlower,
  deleteFlower,
  getCategories,
  getFlowers,
  updateFlower,
  uploadFlowerImage,
} from "@/services/api";
import type { Category, Flower } from "@/types";

type FlowerForm = Omit<Flower, "materials" | "tags" | "images"> & {
  images: string;
  materials: string;
  tags: string;
};

const emptyFlower: FlowerForm = {
  id: "",
  name: "",
  categoryId: "daily",
  images: "",
  price: 0,
  description: "",
  materials: "",
  meaning: "",
  tags: "",
  featured: false,
  sort: 0,
  createdAt: new Date().toISOString(),
};

const splitText = (value: string) =>
  value
    .split(/[,\n，、]/)
    .map((item) => item.trim())
    .filter(Boolean);

const joinText = (value: string[]) => value.join("，");

function toForm(flower: Flower): FlowerForm {
  return {
    ...flower,
    images: joinText(flower.images),
    materials: joinText(flower.materials),
    tags: joinText(flower.tags),
  };
}

function fromForm(values: FlowerForm): Flower {
  return {
    ...values,
    price: Number(values.price),
    sort: Number(values.sort),
    images: splitText(values.images),
    materials: splitText(values.materials),
    tags: splitText(values.tags),
    createdAt: values.createdAt || new Date().toISOString(),
  };
}

export function AdminFlowers() {
  const navigate = useNavigate();
  const [form] = Form.useForm<FlowerForm>();
  const [flowers, setFlowers] = useState<Flower[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [editing, setEditing] = useState<Flower | null>(null);
  const [open, setOpen] = useState(false);
  const [loading, setLoading] = useState(false);

  const categoryOptions = useMemo(
    () => categories.filter((item) => item.id !== "all").map((item) => ({ label: item.name, value: item.id })),
    [categories],
  );

  const load = async () => {
    const [categoryList, flowerResult] = await Promise.all([getCategories(), getFlowers({ limit: 200 })]);
    setCategories(categoryList);
    setFlowers(flowerResult.list);
  };

  useEffect(() => {
    load().catch((error) => message.error(error.message));
  }, []);

  const logout = () => {
    clearAdminToken();
    message.success("已退出管理后台");
    navigate("/admin/login", { replace: true });
  };

  const startCreate = () => {
    setEditing(null);
    form.setFieldsValue({ ...emptyFlower, id: `daily_${Date.now()}` });
    setOpen(true);
  };

  const startEdit = (flower: Flower) => {
    setEditing(flower);
    form.setFieldsValue(toForm(flower));
    setOpen(true);
  };

  const handleUpload = async (file: RcFile) => {
    try {
      const result = await uploadFlowerImage(file);
      const current = form.getFieldValue("images");
      form.setFieldValue("images", [current, result.url].filter(Boolean).join("，"));
      message.success("图片已上传");
    } catch (error) {
      message.error(error instanceof Error ? error.message : "上传失败");
    }
    return false;
  };

  const save = async () => {
    const values = await form.validateFields();
    setLoading(true);
    try {
      const flower = fromForm(values);
      if (editing) await updateFlower(editing.id, flower);
      else await createFlower(flower);
      message.success(editing ? "作品已更新" : "作品已新增");
      setOpen(false);
      await load();
    } catch (error) {
      message.error(error instanceof Error ? error.message : "保存失败");
    } finally {
      setLoading(false);
    }
  };

  const remove = async (id: string) => {
    try {
      await deleteFlower(id);
      message.success("作品已删除");
      await load();
    } catch (error) {
      message.error(error instanceof Error ? error.message : "删除失败");
    }
  };

  return (
    <section className="mx-auto max-w-7xl px-4 py-10 sm:px-6 lg:px-8">
      <div className="mb-6 flex flex-wrap items-end justify-between gap-4">
        <div>
          <p className="text-sm font-semibold text-forest">Admin</p>
          <h1 className="mt-2 text-4xl font-semibold">作品管理</h1>
          <p className="mt-2 text-muted">这里保存到后端 JSON 数据库，Web 前台和小程序会读取同一份数据。</p>
        </div>
        <Space>
          <Link to="/admin/settings">
            <Button>站点配置</Button>
          </Link>
          <Button onClick={logout}>退出登录</Button>
          <Button type="primary" size="large" onClick={startCreate}>
            新增作品
          </Button>
        </Space>
      </div>

      <Table
        rowKey="id"
        dataSource={flowers}
        columns={[
          {
            title: "封面",
            dataIndex: "images",
            width: 96,
            render: (images: string[]) => <img src={images[0]} alt="" className="h-16 w-16 rounded-md object-cover" />,
          },
          { title: "名称", dataIndex: "name" },
          { title: "分类", dataIndex: "categoryId", width: 110 },
          { title: "参考价", dataIndex: "price", width: 100, render: (price: number) => `¥${price}` },
          {
            title: "标签",
            dataIndex: "tags",
            render: (tags: string[]) => (
              <Space size={[4, 4]} wrap>
                {tags.map((tag) => (
                  <Tag key={tag} color="green">
                    {tag}
                  </Tag>
                ))}
              </Space>
            ),
          },
          { title: "精选", dataIndex: "featured", width: 80, render: (featured: boolean) => (featured ? "是" : "否") },
          {
            title: "操作",
            width: 160,
            render: (_: unknown, record: Flower) => (
              <Space>
                <Button size="small" onClick={() => startEdit(record)}>
                  编辑
                </Button>
                <Popconfirm title="确认删除该作品？" onConfirm={() => remove(record.id)}>
                  <Button size="small" danger>
                    删除
                  </Button>
                </Popconfirm>
              </Space>
            ),
          },
        ]}
      />

      <Modal
        title={editing ? "编辑作品" : "新增作品"}
        open={open}
        onCancel={() => setOpen(false)}
        onOk={save}
        confirmLoading={loading}
        width={820}
        destroyOnHidden
      >
        <Form form={form} layout="vertical" className="mt-4">
          <div className="grid gap-x-4 md:grid-cols-2">
            <Form.Item name="id" label="作品 ID" rules={[{ required: true, message: "请输入作品 ID" }]}>
              <Input disabled={Boolean(editing)} placeholder="daily_001" />
            </Form.Item>
            <Form.Item name="name" label="作品名称" rules={[{ required: true, message: "请输入作品名称" }]}>
              <Input placeholder="例如：晨光奶油" />
            </Form.Item>
            <Form.Item name="categoryId" label="分类" rules={[{ required: true }]}>
              <Select options={categoryOptions} />
            </Form.Item>
            <Form.Item name="price" label="参考价">
              <InputNumber className="w-full" min={0} />
            </Form.Item>
            <Form.Item name="sort" label="排序权重">
              <InputNumber className="w-full" />
            </Form.Item>
            <Form.Item name="featured" label="精选" valuePropName="checked">
              <Switch />
            </Form.Item>
          </div>
          <Form.Item name="description" label="设计描述">
            <Input.TextArea rows={3} />
          </Form.Item>
          <Form.Item name="meaning" label="花语寓意">
            <Input.TextArea rows={2} />
          </Form.Item>
          <Form.Item name="materials" label="主要花材">
            <Input placeholder="白玫瑰，绣球，尤加利叶" />
          </Form.Item>
          <Form.Item name="tags" label="标签">
            <Input placeholder="生日，粉色系，温柔" />
          </Form.Item>
          <Form.Item name="images" label="图片 URL" rules={[{ required: true, message: "请上传图片或填写图片 URL" }]}>
            <Input.TextArea rows={3} placeholder="多个图片 URL 用逗号或换行分隔" />
          </Form.Item>
          <Upload beforeUpload={handleUpload} showUploadList={false} accept="image/*">
            <Button>上传图片并追加 URL</Button>
          </Upload>
        </Form>
      </Modal>
    </section>
  );
}
