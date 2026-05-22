"use client";

import { ExclamationCircleOutlined } from "@ant-design/icons";
import { Alert, Button, Space } from "antd";

import { useI18n } from "@/lib/i18n";

interface ErrorStateProps {
  message: string;
  onRetry?: () => void;
}

export function ErrorState({ message, onRetry }: ErrorStateProps) {
  const { t } = useI18n();

  return (
    <Alert
      type="error"
      icon={<ExclamationCircleOutlined />}
      showIcon
      message={message}
      description={
        onRetry ? (
          <Space style={{ marginTop: 8 }}>
            <Button size="small" danger onClick={onRetry}>
              {t("error.retry")}
            </Button>
          </Space>
        ) : undefined
      }
    />
  );
}
