"use client";

import { InboxOutlined } from "@ant-design/icons";
import type { Session } from "@super-image/utils";
import { Alert, Input, Modal, Typography, Upload } from "antd";
import type { RcFile, UploadFile } from "antd/es/upload/interface";
import { useRouter } from "next/navigation";
import { useCallback, useMemo, useState } from "react";

import { useI18n } from "@/lib/i18n";
import { setPendingToolJob } from "@/lib/tools/pending-tool-job";
import { buildToolPrompt } from "@/lib/tools/registry";
import type { ToolDef } from "@/lib/tools/tool-types";
import { useSessionStore } from "@/stores/session-store";
import { useSettingsStore } from "@/stores/settings-store";

const { Paragraph, Text } = Typography;

interface ToolModalProps {
  tool: ToolDef;
  onClose: () => void;
}

export function ToolModal({ tool, onClose }: ToolModalProps) {
  const { t } = useI18n();
  const router = useRouter();
  const { createSession } = useSessionStore();
  const { providers, activeProviderId } = useSettingsStore();
  const config = providers[activeProviderId];

  const [fileList, setFileList] = useState<UploadFile[]>([]);
  const [supplement, setSupplement] = useState("");
  const [submitting, setSubmitting] = useState(false);

  const files = useMemo<File[]>(
    () => fileList.map((f) => f.originFileObj).filter((f): f is RcFile => Boolean(f)),
    [fileList],
  );
  const canSubmit = files.length >= tool.minImages && !submitting;

  const handleGenerate = useCallback(async () => {
    if (files.length < tool.minImages || submitting) return;
    setSubmitting(true);

    const params = {
      size: config?.defaultParams.size ?? "1024x1024",
      quality: config?.defaultParams.quality ?? "auto",
      n: config?.defaultParams.n ?? 1,
    };
    const prompt = buildToolPrompt(tool, supplement);

    const id = crypto.randomUUID();
    const session: Session = {
      id,
      title: t(tool.nameKey),
      createdAt: Date.now(),
      updatedAt: Date.now(),
      providerId: activeProviderId,
      modelId: config?.defaultModel ?? "gpt-image-2",
    };
    await createSession(session);
    setPendingToolJob(id, { toolId: tool.id, prompt, files, params });
    onClose();
    router.push(`/chat/${id}`);
  }, [files, submitting, tool, config, supplement, activeProviderId, createSession, t, onClose, router]);

  return (
    <Modal
      open
      title={t(tool.nameKey)}
      onCancel={onClose}
      onOk={handleGenerate}
      okText={t("tools.modal.generate")}
      cancelText={t("tools.modal.cancel")}
      okButtonProps={{ disabled: !canSubmit, loading: submitting }}
      width={520}
      destroyOnHidden
    >
      <Paragraph type="secondary" style={{ marginTop: 4 }}>
        {t(tool.descKey)}
      </Paragraph>

      <div style={{ marginBottom: 16 }}>
        <Text strong style={{ display: "block", marginBottom: 8 }}>
          {t("tools.modal.referenceImages")}
        </Text>
        <Upload.Dragger
          multiple
          accept="image/*"
          listType="picture-card"
          fileList={fileList}
          beforeUpload={() => false}
          onChange={({ fileList: list }) => setFileList(list.slice(0, tool.maxImages))}
          maxCount={tool.maxImages}
        >
          <p style={{ margin: 0 }}>
            <InboxOutlined style={{ fontSize: 24, color: "#888" }} />
          </p>
          <p style={{ margin: "4px 0 0", fontSize: 12, color: "#888" }}>
            {t("tools.modal.uploadHint", { min: tool.minImages, max: tool.maxImages })}
          </p>
        </Upload.Dragger>
      </div>

      <div style={{ marginBottom: 16 }}>
        <Text strong style={{ display: "block", marginBottom: 8 }}>
          {t("tools.modal.defaultPrompt")}
        </Text>
        <div
          style={{
            fontSize: 12,
            lineHeight: "20px",
            color: "#595959",
            background: "#fafafa",
            border: "1px solid #e8e8e8",
            borderRadius: 8,
            padding: "8px 12px",
            maxHeight: 140,
            overflowY: "auto",
            whiteSpace: "pre-wrap",
          }}
        >
          {tool.defaultPrompt}
        </div>
      </div>

      {tool.allowSupplement && (
        <div>
          <Text strong style={{ display: "block", marginBottom: 8 }}>
            {t("tools.modal.supplement")}
          </Text>
          <Input.TextArea
            value={supplement}
            onChange={(e) => setSupplement(e.target.value)}
            placeholder={t("tools.modal.supplementPlaceholder")}
            autoSize={{ minRows: 2, maxRows: 5 }}
          />
        </div>
      )}

      {files.length < tool.minImages && (
        <Alert
          type="info"
          showIcon
          style={{ marginTop: 16 }}
          message={t("tools.modal.needImages", { min: tool.minImages })}
        />
      )}
    </Modal>
  );
}
