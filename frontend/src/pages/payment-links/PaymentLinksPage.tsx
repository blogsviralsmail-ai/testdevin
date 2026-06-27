import CrudPage from '../../components/shared/CrudPage';

export default function PaymentLinksPage() {
  return (
    <CrudPage
      title="Payment Links"
      subtitle="Create and manage payment links"
      endpoint="/payment-links"
      columns={[
        { key: 'id', label: 'ID' },
        { key: 'title', label: 'Title' },
        { key: 'amount', label: 'Amount', render: (v, row) => `${row.currency || 'INR'} ${v}` },
        { key: 'gateway', label: 'Gateway' },
        { key: 'status', label: 'Status', render: (v) => (
          <span className={`px-2 py-1 rounded-full text-xs font-medium ${v === 'active' ? 'bg-green-100 text-green-700' : v === 'paid' ? 'bg-blue-100 text-blue-700' : 'bg-red-100 text-red-700'}`}>
            {(v as string) || 'active'}
          </span>
        )},
        { key: 'created_at', label: 'Created', render: (v) => v ? new Date(v as string).toLocaleDateString() : '-' },
      ]}
      createFields={[
        { key: 'title', label: 'Title', required: true },
        { key: 'amount', label: 'Amount', type: 'number', required: true },
        { key: 'currency', label: 'Currency', type: 'select', options: [{ value: 'INR', label: 'INR' }, { value: 'USD', label: 'USD' }, { value: 'EUR', label: 'EUR' }] },
        { key: 'gateway', label: 'Gateway', type: 'select', options: [{ value: 'razorpay', label: 'Razorpay' }, { value: 'stripe', label: 'Stripe' }, { value: 'paypal', label: 'PayPal' }] },
      ]}
    />
  );
}
