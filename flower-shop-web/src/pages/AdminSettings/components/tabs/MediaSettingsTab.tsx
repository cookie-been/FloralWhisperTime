import { Form } from "antd";
import type { FormInstance } from "antd";
import { ImagePlus } from "lucide-react";
import type { RcFile } from "antd/es/upload";
import type { SettingsForm, SettingsImageFieldName } from "../../AdminSettings";
import { SettingsMediaListField } from "../SettingsMediaListField";
import { SettingsMediaField } from "../SettingsMediaField";
import { SettingsPreviewPanel } from "../SettingsPreviewPanel";
import { SettingsSection } from "../SettingsSection";

type MediaSettingsTabProps = {
  form: FormInstance<SettingsForm>;
  uploading: Partial<Record<SettingsImageFieldName, boolean>>;
  onUploadImage: (
    file: RcFile,
    field: SettingsImageFieldName,
    successMessage: string,
    mode?: "replace" | "append",
  ) => boolean | Promise<boolean>;
  onUploadImages: (
    files: RcFile[],
    field: Extract<SettingsImageFieldName, "heroSlidesText" | "adminLoginSlidesText" | "contactImagesText" | "storyImages">,
    successMessage: string,
  ) => boolean | Promise<boolean>;
};

const splitText = (value: string) =>
  value
    .split(/[,\n，、]/)
    .map((item) => item.trim())
    .filter(Boolean);

export function MediaSettingsTab({ form, uploading, onUploadImage, onUploadImages }: MediaSettingsTabProps) {
  const brandName = Form.useWatch("brandName", form) ?? "";
  const heroEyebrow = Form.useWatch("heroEyebrow", form) ?? "";
  const heroTitle = Form.useWatch("heroTitle", form) ?? "";
  const heroDescription = Form.useWatch("heroDescription", form) ?? "";
  const heroImage = Form.useWatch("heroImage", form) ?? "";
  const brandLogo = Form.useWatch("brandLogo", form) ?? "";
  const heroSlidesText = Form.useWatch("heroSlidesText", form) ?? "";
  const adminLoginSlidesText = Form.useWatch("adminLoginSlidesText", form) ?? "";
  const contactImagesText = Form.useWatch("contactImagesText", form) ?? "";
  const storyImages = Form.useWatch("storyImages", form) ?? "";

  const heroPreviewSlides = splitText(heroSlidesText);
  const adminLoginPreviewSlides = splitText(adminLoginSlidesText);
  const contactPreviewImages = splitText(contactImagesText);
  const storyPreviewImages = splitText(storyImages);

  return (
    <section className="grid gap-6 xl:grid-cols-[1.05fr_0.95fr]">
      <SettingsSection
        title="媒体资源"
        icon={<ImagePlus size={16} className="text-forest" />}
        description="统一维护首页主图、品牌 Logo 和各页面展示图。标注包含“小程序首页 / 联系页 / 关于页”的资源会被微信小程序同步使用。"
      >
        <div className="grid gap-x-4 md:grid-cols-2">
          <SettingsMediaField
            name="brandLogo"
            label="网站 Logo"
            placeholder="可直接粘贴 Logo 图片 URL，或使用上传按钮"
            buttonText="上传 Logo"
            helperText="该字段只支持明确的图片 URL 字段，避免上传结果误写到其他配置键。"
            uploadHandler={(file) => onUploadImage(file, "brandLogo", "Logo 已上传")}
            buttonLoading={Boolean(uploading.brandLogo)}
          />
          <SettingsMediaField
            name="heroImage"
            label="首屏背景图（Web 与小程序首页）"
            placeholder="可直接粘贴图片 URL，或使用上传按钮"
            buttonText="上传图片并回填"
            uploadHandler={(file) => onUploadImage(file, "heroImage", "首屏背景图已上传")}
            buttonLoading={Boolean(uploading.heroImage)}
          />
        </div>
        <SettingsMediaListField
          name="heroSlidesText"
          label="首页轮播图 URL（Web 与小程序首页）"
          placeholder="多个 URL 用逗号或换行分隔"
          buttonText="多上传并追加到首页轮播"
          uploadHandler={(files) => onUploadImages(files, "heroSlidesText", `已追加 ${files.length} 张首页轮播图`)}
          buttonLoading={Boolean(uploading.heroSlidesText)}
          helperText="支持一次多张上传，上传成功后会自动追加到当前首页轮播图列表。"
        />
        <SettingsMediaListField
          name="adminLoginSlidesText"
          label="后台登录轮播图 URL"
          placeholder="多个 URL 用逗号或换行分隔"
          buttonText="多上传并追加到登录轮播"
          uploadHandler={(files) => onUploadImages(files, "adminLoginSlidesText", `已追加 ${files.length} 张后台登录轮播图`)}
          buttonLoading={Boolean(uploading.adminLoginSlidesText)}
          helperText="支持一次多张上传，适合批量维护后台登录页轮播图。"
        />
        <SettingsMediaListField
          name="contactImagesText"
          label="联系页展示图 URL（Web 与小程序联系页）"
          placeholder="多个 URL 用逗号或换行分隔"
          buttonText="多上传并追加到联系页"
          uploadHandler={(files) => onUploadImages(files, "contactImagesText", `已追加 ${files.length} 张联系页展示图`)}
          buttonLoading={Boolean(uploading.contactImagesText)}
          helperText="支持一次多张上传，上传成功后自动追加到联系页展示图列表。"
        />
        <SettingsMediaListField
          name="storyImages"
          label="故事图片 URL（小程序关于页兜底图）"
          placeholder="多个 URL 用逗号或换行分隔"
          buttonText="多上传并追加到故事图片"
          uploadHandler={(files) => onUploadImages(files, "storyImages", `已追加 ${files.length} 张故事图片`)}
          buttonLoading={Boolean(uploading.storyImages)}
          helperText="支持一次多张上传，上传成功后自动追加到品牌故事图片列表。"
        />
      </SettingsSection>

      <div className="space-y-6">
        <SettingsPreviewPanel title="首屏图片预览">
          <div className="admin-panel overflow-hidden p-0">
            <div className="relative min-h-[240px] bg-[#f1ece5]">
              {heroImage ? (
                <img src={heroImage} alt="" className="h-60 w-full object-cover" />
              ) : (
                <div className="flex h-60 items-center justify-center text-muted">暂无首页主图</div>
              )}
              <div className="absolute inset-0 bg-[linear-gradient(180deg,rgba(15,23,17,0.06),rgba(15,23,17,0.68))]" />
              <div className="absolute inset-x-0 bottom-0 px-5 py-5 text-white">
                <p className="text-xs font-semibold uppercase tracking-[0.2em] text-white/72">{heroEyebrow || "首页标语预览"}</p>
                <p className="mt-2 text-2xl font-semibold">{heroTitle || "首页主标题预览"}</p>
                <p className="mt-2 max-w-md text-sm leading-6 text-white/80">
                  {heroDescription || "这里会展示首页首屏的介绍文案。"}
                </p>
              </div>
            </div>
          </div>
        </SettingsPreviewPanel>

        <SettingsPreviewPanel title="品牌素材预览">
          {brandLogo ? (
            <div className="flex items-center gap-3">
              <img src={brandLogo} alt="Logo 预览" className="h-12 w-12 rounded-xl object-cover shadow-sm" />
              <div>
                <p className="text-sm font-semibold text-[#1b281e]">{brandName || "花语时光"}</p>
                <p className="text-xs text-muted">当前网站 Logo</p>
              </div>
            </div>
          ) : (
            <div className="admin-subpanel px-4 py-8 text-sm text-muted">暂无 Logo 预览</div>
          )}
        </SettingsPreviewPanel>

        <SettingsPreviewPanel title="轮播图预览">
          <div className="grid gap-3 sm:grid-cols-2">
            {heroPreviewSlides.slice(0, 4).map((url) => (
              <div key={`hero-slide-${url}`} className="admin-subpanel overflow-hidden bg-[#f3efe9]">
                <img src={url} alt="" className="h-24 w-full object-cover" />
              </div>
            ))}
            {adminLoginPreviewSlides.slice(0, 4).map((url) => (
              <div key={`admin-slide-${url}`} className="admin-subpanel overflow-hidden bg-[#f3efe9]">
                <img src={url} alt="" className="h-24 w-full object-cover" />
              </div>
            ))}
          </div>
          {!heroPreviewSlides.length && !adminLoginPreviewSlides.length ? (
            <div className="admin-subpanel mt-3 px-4 py-8 text-sm text-muted">暂无首页/登录轮播图预览</div>
          ) : null}
        </SettingsPreviewPanel>

        <SettingsPreviewPanel title="联系页展示图预览">
          {contactPreviewImages.length ? (
            <div className="grid gap-3 sm:grid-cols-2">
              {contactPreviewImages.slice(0, 4).map((url) => (
                <div key={`contact-image-${url}`} className="admin-subpanel overflow-hidden bg-[#f3efe9]">
                  <img src={url} alt="" className="h-24 w-full object-cover" />
                </div>
              ))}
            </div>
          ) : (
            <div className="admin-subpanel px-4 py-8 text-sm text-muted">暂无联系页展示图预览</div>
          )}
        </SettingsPreviewPanel>

        <SettingsPreviewPanel title="故事图片预览">
          {storyPreviewImages.length ? (
            <div className="grid gap-3 sm:grid-cols-2">
              {storyPreviewImages.slice(0, 4).map((url) => (
                <div key={`story-image-${url}`} className="admin-subpanel overflow-hidden bg-[#f3efe9]">
                  <img src={url} alt="" className="h-24 w-full object-cover" />
                </div>
              ))}
            </div>
          ) : (
            <div className="admin-subpanel px-4 py-8 text-sm text-muted">暂无故事图片预览</div>
          )}
        </SettingsPreviewPanel>
      </div>
    </section>
  );
}
