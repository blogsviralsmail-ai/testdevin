import CrudPage from '../../components/shared/CrudPage';

export default function CampaignsPage() {
  return (
    <CrudPage
      title="Campaigns"
      subtitle="Manage your WhatsApp campaigns"
      endpoint="/campaigns"
      columns={[
        { key: 'id', label: 'ID' },
        { key: 'name', label: 'Name' },
        { key: 'status', label: 'Status', render: (v) => (
          <span className={`px-2 py-1 rounded-full text-xs font-medium ${v === 'running' ? 'bg-blue-100 text-blue-700' : v === 'completed' ? 'bg-green-100 text-green-700' : v === 'scheduled' ? 'bg-yellow-100 text-yellow-700' : 'bg-gray-100 text-gray-700'}`}>
            {(v as string) || 'draft'}
          </span>
        )},
        { key: 'total_count', label: 'Total' },
        { key: 'sent_count', label: 'Sent' },
        { key: 'failed_count', label: 'Failed' },
        { key: 'created_at', label: 'Created', render: (v) => v ? new Date(v as string).toLocaleDateString() : '-' },
      ]}
      createFields={[
        { key: 'name', label: 'Campaign Name', required: true },
        { key: 'templateId', label: 'Template ID', type: 'number', required: true },
      ]}
    />
  );
}
