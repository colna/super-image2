"use client";

import { ExclamationCircleOutlined } from "@ant-design/icons";
import { Alert, Button, Space } from "antd";

interface ErrorStateProps {
  message: string;
  onRetry?: () => void;
}

export function ErrorState({ message, onRetry }: ErrorStateProps) {
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
              Retry
            </Button>
          </Space>
        ) : undefined
      }
    />
  );
}
