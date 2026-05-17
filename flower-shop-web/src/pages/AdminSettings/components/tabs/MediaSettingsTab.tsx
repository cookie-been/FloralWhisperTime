import { Form } from "antd";
import type { FormInstance } from "antd";
import { ImagePlus } from "lucide-react";
import type { RcFile } from "antd/es/upload";
import type { SettingsForm, SettingsImageFieldName } from "../../AdminSettings";
import { splitListText } from "@/utils/list-text";
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

const scopeBadgeClassName = "inline-flex rounded-full px-2.5 py-0.5 text-[11px] font-semibold";
const miniSyncBadgeClassName = `${scopeBadgeClassName} bg-[#e8f5e9] text-[#2e7d32]`;
const webOnlyBadgeClassName = `${scopeBadgeClassName} bg-[#eef2f7] text-[#52606d]`;
const miniFallbackBadgeClassName = `${scopeBadgeClassName} bg-[#fff4e5] text-[#b26a00]`;

function buildScopedLabel(title: string, badgeText: string, badgeClassName: string) {
  return (
    <span className="flex flex-wrap items-center gap-2">
      <span>{title}</span>
      <span className={badgeClassName}>{badgeText}</span>
    </span>
  );
}

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

  const heroPreviewSlides = splitListText(heroSlidesText);
  const adminLoginPreviewSlides = splitListText(adminLoginSlidesText);
  const contactPreviewImages = splitListText(contactImagesText);
  const storyPreviewImages = splitListText(storyImages);

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
            label={buildScopedLabel("网站 Logo", "Web 前台", webOnlyBadgeClassName)}
            placeholder="可直接粘贴 Logo 图片 URL，或使用上传按钮"
            buttonText="上传 Logo"
            helperText="该资源仅影响 Web 前台站点标识，不会同步到微信小程序。"
            uploadHandler={(file) => onUploadImage(file, "brandLogo", "Logo 已上传")}
            buttonLoading={Boolean(uploading.brandLogo)}
          />
          <SettingsMediaField
            name="heroImage"
            label={buildScopedLabel("首屏背景图", "小程序同步", miniSyncBadgeClassName)}
            placeholder="可直接粘贴图片 URL，或使用上传按钮"
            buttonText="上传图片并回填"
            helperText="当首页轮播图为空时，Web 首页与小程序首页都会回退使用这张主图。"
            uploadHandler={(file) => onUploadImage(file, "heroImage", "首屏背景图已上传")}
            buttonLoading={Boolean(uploading.heroImage)}
          />
        </div>
        <SettingsMediaListField
          name="heroSlidesText"
          label={buildScopedLabel("首页轮播图 URL", "小程序同步", miniSyncBadgeClassName)}
          placeholder="多个 URL 用逗号或换行分隔"
          buttonText="多上传并追加到首页轮播"
          uploadHandler={(files) => onUploadImages(files, "heroSlidesText", `已追加 ${files.length} 张首页轮播图`)}
          buttonLoading={Boolean(uploading.heroSlidesText)}
          helperText="支持一次多张上传，上传成功后会自动追加到当前首页轮播图列表，Web 首页与小程序首页都会优先使用它。"
        />
        <SettingsMediaListField
          name="adminLoginSlidesText"
          label={buildScopedLabel("后台登录轮播图 URL", "仅 Web 后台", webOnlyBadgeClassName)}
          placeholder="多个 URL 用逗号或换行分隔"
          buttonText="多上传并追加到登录轮播"
          uploadHandler={(files) => onUploadImages(files, "adminLoginSlidesText", `已追加 ${files.length} 张后台登录轮播图`)}
          buttonLoading={Boolean(uploading.adminLoginSlidesText)}
          helperText="支持一次多张上传，适合批量维护后台登录页轮播图；该项不会同步到微信小程序。"
        />
        <SettingsMediaListField
          name="contactImagesText"
          label={buildScopedLabel("联系页展示图 URL", "小程序同步", miniSyncBadgeClassName)}
          placeholder="多个 URL 用逗号或换行分隔"
          buttonText="多上传并追加到联系页"
          uploadHandler={(files) => onUploadImages(files, "contactImagesText", `已追加 ${files.length} 张联系页展示图`)}
          buttonLoading={Boolean(uploading.contactImagesText)}
          helperText="支持一次多张上传，上传成功后自动追加到联系页展示图列表，Web 联系页与小程序联系页都会使用。"
        />
        <SettingsMediaListField
          name="storyImages"
          label={buildScopedLabel("故事图片 URL", "仅小程序兜底", miniFallbackBadgeClassName)}
          placeholder="多个 URL 用逗号或换行分隔"
          buttonText="多上传并追加到故事图片"
          uploadHandler={(files) => onUploadImages(files, "storyImages", `已追加 ${files.length} 张故事图片`)}
          buttonLoading={Boolean(uploading.storyImages)}
          helperText="支持一次多张上传，上传成功后自动追加到品牌故事图片列表；当关于页独立主图为空时，小程序关于页会回退使用。"
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
