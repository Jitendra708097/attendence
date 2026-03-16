/**
 * @module ReportsPage
 * @description Report generation and download.
 */
import { useState } from 'react';
import { Row, Col, message } from 'antd';
import PageHeader from '../../components/common/PageHeader.jsx';
import AttendanceReport from './AttendanceReport.jsx';
import MonthlySummary from './MonthlySummary.jsx';
import ReportJobStatus from './ReportJobStatus.jsx';
import { useGenerateReportMutation, useGetReportJobStatusQuery, useDownloadReportQuery } from '../../store/api/reportApi.js';
import { parseApiError } from '../../utils/errorHandler.js';

export default function ReportsPage() {
  const [jobId, setJobId] = useState(null);
  const [generateReport, { isLoading: isGenerating }] = useGenerateReportMutation();
  const { data: downloadData, isLoading: isDownloading } = useDownloadReportQuery(jobId || '', { skip: !jobId });

  const { data: jobStatus } = useGetReportJobStatusQuery(jobId || '', { skip: !jobId });

  const handleGenerateAttendance = (values) => {
    generateReport(values)
      .then((res) => {
        if (res.data?.jobId) {
          setJobId(res.data.jobId);
          message.success('Report generation started');
        }
      })
      .catch((error) => {
        message.error(parseApiError(error));
      });
  };

  return (
    <div className="space-y-6">
      <PageHeader title="Reports" subtitle="Generate and download reports" />

      <Row gutter={[16, 16]}>
        <Col xs={24} md={12}>
          <AttendanceReport onGenerate={handleGenerateAttendance} loading={isGenerating} />
        </Col>
        <Col xs={24} md={12}>
          <MonthlySummary onGenerate={(values) => console.log(values)} loading={false} />
        </Col>
      </Row>

      {jobId && (
        <ReportJobStatus
          jobId={jobId}
          status={jobStatus?.status || 'pending'}
          progress={jobStatus?.progress || 0}
          onDownload={() => {
            if (downloadData) {
              const link = document.createElement('a');
              link.href = downloadData.url;
              link.download = downloadData.filename || 'report.xlsx';
              link.click();
            }
          }}
          loading={isDownloading}
        />
      )}
    </div>
  );
}
