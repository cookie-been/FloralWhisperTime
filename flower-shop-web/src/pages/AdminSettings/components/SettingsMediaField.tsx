import { Button, Form, Input, Upload } from "antd";
import type { RcFile } from "antd/es/upload";
import type { SettingsImageFieldName } from "../AdminSettings";

type SettingsMediaFieldProps = {
  name: SettingsImageFieldName;
  label: string;
  placeholder: string;
  buttonText: string;
  accept?: string;
  uploadHandler: (file: RcFile) => boolean | Promise<boolean>;
  helperText?: string;
  buttonLoading?: boolean;
};

export function SettingsMediaField({
  name,
  label,
  placeholder,
  buttonText,
  accept = "image/*",
  uploadHandler,
  helperText,
  buttonLoading = false,
}: SettingsMediaFieldProps) {
  return (
    <Form.Item label={label}>
      <div className="space-y-3">
        <Form.Item name={name} noStyle>
          <Input placeholder={placeholder} />
        </Form.Item>
        <Upload beforeUpload={uploadHandler} showUploadList={false} accept={accept}>
          <Button loading={buttonLoading}>{buttonText}</Button>
        </Upload>
        {helperText ? <p className="text-xs leading-5 text-muted">{helperText}</p> : null}
      </div>
    </Form.Item>
  );
}
