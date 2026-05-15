import { Button, Drawer, Form, Image, Input, Select, Space, Tag, Upload } from "antd";
import type { FormInstance } from "antd";
import type { RcFile } from "antd/es/upload";
import { ImagePlus, Sparkles, Star } from "lucide-react";
import type { AiSettings, Category } from "@/types";
import type { AiSuggestionForm, GeneratedAiImageResult } from "./AdminFlowerTypes";

interface AdminFlowerAiDrawerProps {
  open: boolean;
  screensLg?: boolean;
  prompt: string;
  onPromptChange: (value: string) => void;
  referenceFiles: RcFile[];
  onBeforeUpload: (file: RcFile) => boolean | string;
  onRemoveReferenceFile: (file: RcFile) => void;
  generating: boolean;
  suggesting: boolean;
  generatedImage: GeneratedAiImageResult | null;
  aiSettings: AiSettings | null;
  categoryOptions: { label: string; value: string }[];
  suggestionForm: FormInstance<AiSuggestionForm>;
  onClose: () => void;
  onGenerate: () => void;
  onGenerateSuggestion: () => void;
  onUseGeneratedImage: () => void;
}

export function AdminFlowerAiDrawer({
  open,
  screensLg,
  prompt,
  onPromptChange,
  referenceFiles,
  onBeforeUpload,
  onRemoveReferenceFile,
  generating,
  suggesting,
  generatedImage,
  aiSettings,
  categoryOptions,
  suggestionForm,
  onClose,
  onGenerate,
  onGenerateSuggestion,
  onUseGeneratedImage,
}: AdminFlowerAiDrawerProps) {
  return (
    <Drawer
      className="admin-mobile-drawer"
      title={
        <div className="admin-drawer-title">
          <p>AI生成作品</p>
          <h3>图片生成工作台</h3>
          <span>输入 prompt，可选上传最多 3 张参考图。生成结果仅用于人工审核后进入新增作品流程。</span>
        </div>
      }
      open={open}
      onClose={onClose}
      width={screensLg ? 760 : "100%"}
      destroyOnHidden
      extra={
        <Space wrap>
          <Button onClick={onClose}>关闭</Button>
          <Button type="primary" loading={generating} disabled={!prompt.trim()} onClick={onGenerate}>
            生成
          </Button>
        </Space>
      }
    >
      <div className="space-y-6">
        <div className="admin-subpanel px-4 py-4">
          <div className="flex items-center gap-2 text-sm font-semibold text-[#1b281e]">
            <Sparkles size={16} className="text-forest" />
            生成提示
          </div>
          <p className="mt-2 text-sm leading-6 text-muted">直接输入你希望生成的花艺作品描述。支持只写文本，也支持搭配参考图做以图生图。</p>
          <Input.TextArea
            className="mt-4"
            rows={6}
            value={prompt}
            onChange={(event) => onPromptChange(event.target.value)}
            placeholder="例如：生成一束现代感白绿色婚礼手捧花，奶油白玫瑰为主，搭配轻盈层次和自然垂坠感，画面干净克制。"
          />
        </div>

        <div className="admin-subpanel px-4 py-4">
          <div className="flex items-center gap-2 text-sm font-semibold text-[#1b281e]">
            <ImagePlus size={16} className="text-forest" />
            参考图
          </div>
          <p className="mt-2 text-sm leading-6 text-muted">可上传 1-3 张参考图参与生成。单张不超过 20MB，仅支持图片文件。</p>
          <div className="mt-4 flex flex-wrap gap-3">
            <Upload
              beforeUpload={onBeforeUpload}
              onRemove={(file) => {
                onRemoveReferenceFile(file as RcFile);
                return true;
              }}
              fileList={referenceFiles}
              multiple
              accept="image/*"
              listType="picture-card"
            >
              {referenceFiles.length < 3 ? (
                <div className="flex flex-col items-center gap-2 text-muted">
                  <ImagePlus size={18} />
                  <span className="text-xs">上传参考图</span>
                </div>
              ) : null}
            </Upload>
          </div>
        </div>

        <div className="admin-subpanel px-4 py-4">
          <div className="flex items-center gap-2 text-sm font-semibold text-[#1b281e]">
            <Star size={16} className="text-forest" />
            生成结果
          </div>
          {generatedImage ? (
            <div className="mt-4 space-y-4">
              <div className="overflow-hidden rounded-lg border border-black/6 bg-white">
                <Image src={generatedImage.imageUrl} alt="AI生成作品" className="w-full object-cover" />
              </div>
              <div className="flex flex-wrap items-center gap-3 text-sm text-muted">
                <Tag color="green">{generatedImage.mode === "image_to_image" ? "以图生图" : "文生图"}</Tag>
                <span>模型：{generatedImage.source}</span>
              </div>
              <Space wrap>
                <Button loading={generating} onClick={onGenerate}>
                  重新生成
                </Button>
                <Button
                  loading={suggesting}
                  disabled={!generatedImage || !prompt.trim() || aiSettings?.enabled === false}
                  onClick={onGenerateSuggestion}
                >
                  生成作品信息
                </Button>
                <Button type="primary" onClick={onUseGeneratedImage}>
                  用于新建作品
                </Button>
              </Space>
            </div>
          ) : (
            <div className="mt-4 rounded-lg border border-dashed border-black/10 bg-white px-4 py-6 text-sm text-muted">
              {generating ? "正在生成图片，请稍候..." : "生成完成后会在这里显示图片结果。"}
            </div>
          )}
        </div>

        <div className="admin-subpanel px-4 py-4">
          <div className="flex items-center gap-2 text-sm font-semibold text-[#1b281e]">
            <Sparkles size={16} className="text-forest" />
            作品信息建议
          </div>
          <p className="mt-2 text-sm leading-6 text-muted">
            先生成图片，再生成作品信息建议。这里的内容可直接修改，点“用于新建作品”时会一并带入新增表单。
          </p>
          <Form form={suggestionForm} layout="vertical" className="mt-4">
            <div className="grid gap-x-4 md:grid-cols-2">
              <Form.Item name="name" label="作品名称">
                <Input placeholder="例如：晨雾誓约" />
              </Form.Item>
              <Form.Item name="categoryId" label="分类建议">
                <Select allowClear placeholder="请选择分类" options={categoryOptions} />
              </Form.Item>
            </div>
            <Form.Item name="description" label="设计描述">
              <Input.TextArea rows={3} placeholder="AI 建议的作品描述会显示在这里" />
            </Form.Item>
            <Form.Item name="meaning" label="花语寓意">
              <Input.TextArea rows={2} placeholder="AI 建议的寓意会显示在这里" />
            </Form.Item>
            <div className="grid gap-x-4 md:grid-cols-2">
              <Form.Item name="materials" label="主要花材">
                <Input placeholder="多个花材用逗号分隔" />
              </Form.Item>
              <Form.Item name="tags" label="标签">
                <Input placeholder="多个标签用逗号分隔" />
              </Form.Item>
            </div>
          </Form>
          {!generatedImage ? (
            <div className="rounded-lg border border-dashed border-black/10 bg-white px-4 py-4 text-sm text-muted">
              生成图片后可在这里生成并调整作品信息建议。
            </div>
          ) : null}
        </div>
      </div>
    </Drawer>
  );
}
