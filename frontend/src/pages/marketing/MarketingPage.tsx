import CrudPage from '../../components/shared/CrudPage';

export default function MarketingPage() {
  return (
    <CrudPage
      title="Marketing Campaigns"
      subtitle="Drip campaigns and automated follow-ups"
      endpoint="/marketing/drip-campaigns"
      columns={[
        { key: 'id', label: 'ID' },
        { key: 'name', label: 'Name' },
        { key: 'status', label: 'Status', render: (v) => (
          <span className={`px-2 py-1 rounded-full text-xs font-medium ${v === 1 ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'}`}>
            {v === 1 ? 'Active' : 'Inactive'}
          </span>
        )},
        { key: 'created_at', label: 'Created', render: (v) => v ? new Date(v as string).toLocaleDateString() : '-' },
      ]}
      createFields={[
        { key: 'name', label: 'Campaign Name', required: true },
        { key: 'steps', label: 'Steps (JSON)', type: 'textarea' },
      ]}
    />
  );
}
