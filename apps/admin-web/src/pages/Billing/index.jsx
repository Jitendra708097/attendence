/**
 * @module BillingPage
 * @description Subscription plans and invoice management.
 */
import PageHeader from '../../components/common/PageHeader.jsx';
import PlanCard from './PlanCard.jsx';
import InvoiceTable from './InvoiceTable.jsx';
import { useGetCurrentPlanQuery, useGetInvoicesQuery, useDownloadInvoiceQuery } from '../../store/api/billingApi.js';

export default function BillingPage() {
  const { data: planData, isLoading: isPlanLoading } = useGetCurrentPlanQuery();
  const { data: invoiceData, isLoading: isInvoiceLoading } = useGetInvoicesQuery();
  const [downloadInvoice, { isLoading: isDownloading }] = useDownloadInvoiceQuery();

  return (
    <div className="min-h-screen bg-gray-50">
      <PageHeader title="Billing" subtitle="Manage subscription and invoices" />

      <div className="px-6 py-6 max-w-7xl mx-auto">
        <PlanCard
          plan={planData?.plan}
          onUpgrade={() => console.log('Upgrade clicked')}
          loading={isPlanLoading}
        />
      </div>

      <div className="px-6 py-6 max-w-7xl mx-auto">
        <InvoiceTable
          data={invoiceData?.invoices || []}
          loading={isInvoiceLoading}
          onDownload={(id) => downloadInvoice(id)}
        />
      </div>
    </div>
  );
}