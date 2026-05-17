import { Button, Form, Input, Space, Upload } from "antd";
import type { RcFile } from "antd/es/upload";
import type { ReactNode } from "react";

type SettingsMediaListFieldProps = {
  name: string;
  label: ReactNode;
  placeholder: string;
  buttonText: string;
  uploadHandler: (files: RcFile[]) => boolean | Promise<boolean>;
  helperText?: ReactNode;
  buttonLoading?: boolean;
  accept?: string;
};

export function SettingsMediaListField({
  name,
  label,
  placeholder,
  buttonText,
  uploadHandler,
  helperText,
  buttonLoading = false,
  accept = "image/*",
}: SettingsMediaListFieldProps) {
  return (
    <Form.Item name={name} label={label}>
      <div className="space-y-3">
        <Input.TextArea rows={4} placeholder={placeholder} />
        <Space wrap>
          <Upload
            accept={accept}
            showUploadList={false}
            multiple
            beforeUpload={() => Upload.LIST_IGNORE}
            customRequest={() => undefined}
            onChange={({ fileList }) => {
              const files = fileList
                .map((item) => item.originFileObj)
                .filter((file): file is RcFile => Boolean(file));
              if (!files.length) return;
              void uploadHandler(files);
            }}
          >
            <Button loading={buttonLoading}>{buttonText}</Button>
          </Upload>
        </Space>
        {helperText ? <p className="text-xs leading-5 text-muted">{helperText}</p> : null}
      </div>
    </Form.Item>
  );
}
