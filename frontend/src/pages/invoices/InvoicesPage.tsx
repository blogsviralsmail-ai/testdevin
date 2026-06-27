import CrudPage from '../../components/shared/CrudPage';

export default function InvoicesPage() {
  return (
    <CrudPage
      title="Invoices"
      subtitle="Subscription payment history"
      endpoint="/invoices"
      columns={[
        { key: 'id', label: 'ID' },
        { key: 'plan_name', label: 'Plan' },
        { key: 'amount', label: 'Amount', render: (v) => v ? `$${v}` : '-' },
        { key: 'payment_gateway', label: 'Gateway' },
        { key: 'status', label: 'Status', render: (v) => (
          <span className={`px-2 py-1 rounded-full text-xs font-medium ${v === 'paid' ? 'bg-green-100 text-green-700' : v === 'pending' ? 'bg-yellow-100 text-yellow-700' : 'bg-red-100 text-red-700'}`}>
            {(v as string) || 'pending'}
          </span>
        )},
        { key: 'created_at', label: 'Date', render: (v) => v ? new Date(v as string).toLocaleDateString() : '-' },
      ]}
      canCreate={false}
      canDelete={false}
      searchable={false}
    />
  );
}
