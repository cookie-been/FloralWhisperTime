import { Button, Drawer, Form, Image, Input, InputNumber, Select, Space, Switch, Upload } from "antd";
import type { FormInstance } from "antd";
import type { RcFile } from "antd/es/upload";
import { ImagePlus, SlidersHorizontal, Sparkles, Star } from "lucide-react";
import type { FlowerForm } from "./AdminFlowerTypes";

interface AdminFlowerEditorDrawerProps {
  open: boolean;
  editingName?: string;
  screensLg?: boolean;
  saving: boolean;
  uploading: boolean;
  form: FormInstance<FlowerForm>;
  categoryOptions: { label: string; value: string }[];
  imagePreviewList: string[];
  onClose: () => void;
  onSave: () => void;
  onUpload: (file: RcFile) => boolean | Promise<boolean>;
}

export function AdminFlowerEditorDrawer({
  open,
  editingName,
  screensLg,
  saving,
  uploading,
  form,
  categoryOptions,
  imagePreviewList,
  onClose,
  onSave,
  onUpload,
}: AdminFlowerEditorDrawerProps) {
  const editing = Boolean(editingName);

  return (
    <Drawer
      className="admin-mobile-drawer"
      title={
        <div className="admin-drawer-title">
          <p>{editing ? "编辑作品" : "新增作品"}</p>
          <h3>{editing ? `编辑作品 · ${editingName}` : "新增作品"}</h3>
          <span>{editing ? "在右侧抽屉中集中修改作品信息、图片与展示状态。" : "填写基础资料后即可创建新的前台展示作品。"}</span>
        </div>
      }
      open={open}
      onClose={onClose}
      width={screensLg ? 720 : "100%"}
      destroyOnHidden
      extra={
        <Space wrap className="w-full sm:w-auto">
          <Button onClick={onClose}>取消</Button>
          <Button type="primary" loading={saving} onClick={onSave}>
            保存
          </Button>
        </Space>
      }
    >
      <Form form={form} layout="vertical" className="space-y-6">
        <div className="admin-subpanel px-4 py-4">
          <div className="flex items-center gap-2 text-sm font-semibold text-[#1b281e]">
            <Sparkles size={16} className="text-forest" />
            基本信息
          </div>
          <div className="mt-4 grid gap-x-4 md:grid-cols-2">
            <Form.Item name="id" label="作品 ID" rules={[{ required: true, message: "请输入作品 ID" }]}>
              <Input disabled={editing} placeholder="daily_001" />
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
          </div>
        </div>

        <div className="admin-subpanel px-4 py-4">
          <div className="flex items-center gap-2 text-sm font-semibold text-[#1b281e]">
            <SlidersHorizontal size={16} className="text-forest" />
            展示状态
          </div>
          <div className="mt-4 grid gap-x-4 md:grid-cols-2">
            <Form.Item name="sort" label="排序权重">
              <InputNumber className="w-full" />
            </Form.Item>
            <Form.Item name="featured" label="精选" valuePropName="checked">
              <Switch checkedChildren={<Star size={14} />} unCheckedChildren=" " />
            </Form.Item>
          </div>
        </div>

        <div className="admin-subpanel px-4 py-4">
          <p className="text-sm font-semibold text-[#1b281e]">文案内容</p>
          <div className="mt-4 space-y-1">
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
          </div>
        </div>

        <div className="admin-subpanel px-4 py-4">
          <div className="flex items-center gap-2 text-sm font-semibold text-[#1b281e]">
            <ImagePlus size={16} className="text-forest" />
            图片管理
          </div>
          <div className="mt-4 space-y-4">
            <div>
              <p className="text-xs font-semibold uppercase tracking-[0.18em] text-forest/70">图片预览</p>
              {imagePreviewList.length ? (
                <div className="mt-3 grid grid-cols-2 gap-3 sm:grid-cols-3">
                  {imagePreviewList.map((url) => (
                    <div key={url} className="overflow-hidden rounded-lg border border-black/6 bg-white">
                      <Image src={url} alt="" height={96} className="!h-24 !w-full object-cover" />
                    </div>
                  ))}
                </div>
              ) : (
                <div className="mt-3 rounded-lg border border-dashed border-black/10 bg-white px-4 py-6 text-sm text-muted">还没有图片，先上传或手动填写 URL。</div>
              )}
            </div>

            <Form.Item name="images" label="图片 URL" rules={[{ required: true, message: "请上传图片或填写图片 URL" }]}>
              <Input.TextArea rows={4} placeholder="多个图片 URL 用逗号或换行分隔" />
            </Form.Item>
            <Upload beforeUpload={onUpload} showUploadList={false} accept="image/*">
              <Button loading={uploading}>上传图片并追加 URL</Button>
            </Upload>
          </div>
        </div>
      </Form>
    </Drawer>
  );
}
