import CrudPage from '../../components/shared/CrudPage';

export default function TemplatesPage() {
  return (
    <CrudPage
      title="Templates"
      subtitle="WhatsApp message templates"
      endpoint="/whatsapp/templates"
      columns={[
        { key: 'id', label: 'ID' },
        { key: 'template_name', label: 'Name' },
        { key: 'language', label: 'Language' },
        { key: 'category', label: 'Category' },
        { key: 'status', label: 'Status', render: (v) => (
          <span className={`px-2 py-1 rounded-full text-xs font-medium ${v === 'APPROVED' ? 'bg-green-100 text-green-700' : v === 'PENDING' ? 'bg-yellow-100 text-yellow-700' : 'bg-red-100 text-red-700'}`}>
            {(v as string) || 'unknown'}
          </span>
        )},
        { key: 'created_at', label: 'Created', render: (v) => v ? new Date(v as string).toLocaleDateString() : '-' },
      ]}
      canCreate={false}
      searchable={true}
    />
  );
}
