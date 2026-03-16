/**
 * @module ReportJobStatus
 * @description Report generation job status and download.
 */
import { Card, Progress, Button, Space, message, Spin, Result } from "antd";
import { DownloadOutlined } from "@ant-design/icons";

export default function ReportJobStatus({ jobId, status, progress, onDownload, loading }) {
  if (!jobId) return null;

  const isCompleted = status === "completed";
  const isFailed = status === "failed";

  return (
    <Card title="Report Generation Status" className="bg-white shadow border border-gray-100">
      {isFailed ? (
        <Result status="error" title="Generation Failed" subTitle="Please try again later" />
      ) : (
        <div className="space-y-4">
          <Spin spinning={!isCompleted && !isFailed}>
            <Progress
              percent={progress || 0}
              status={isCompleted ? "success" : isFailed ? "exception" : "active"}
              format={(percent) => percent + "%"}
            />
            <p className="mt-4 text-center font-medium">{status.toUpperCase()}</p>

            {isCompleted && (
              <Space className="mt-4 flex justify-center w-full">
                <Button type="primary" icon={<DownloadOutlined />} loading={loading} onClick={onDownload}>
                  Download Report
                </Button>
              </Space>
            )}
          </Spin>
        </div>
      )}
    </Card>
  );
}
