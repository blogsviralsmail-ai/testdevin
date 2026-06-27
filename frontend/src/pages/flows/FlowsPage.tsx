import CrudPage from '../../components/shared/CrudPage';

export default function FlowsPage() {
  return (
    <CrudPage
      title="WhatsApp Flows"
      subtitle="Meta WhatsApp flows"
      endpoint="/flows"
      columns={[
        { key: 'id', label: 'ID' },
        { key: 'name', label: 'Name' },
        { key: 'wa_flow_id', label: 'Flow ID' },
        { key: 'status', label: 'Status', render: (v) => (
          <span className={`px-2 py-1 rounded-full text-xs font-medium ${v === 1 ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'}`}>
            {v === 1 ? 'Active' : 'Inactive'}
          </span>
        )},
        { key: 'created_at', label: 'Created', render: (v) => v ? new Date(v as string).toLocaleDateString() : '-' },
      ]}
      createFields={[
        { key: 'name', label: 'Flow Name', required: true },
        { key: 'flowJson', label: 'Flow JSON', type: 'textarea', required: true },
      ]}
    />
  );
}
