import CrudPage from '../../components/shared/CrudPage';

export default function FormsPage() {
  return (
    <CrudPage
      title="Forms"
      subtitle="WhatsApp conversational forms"
      endpoint="/forms"
      columns={[
        { key: 'id', label: 'ID' },
        { key: 'title', label: 'Title' },
        { key: 'description', label: 'Description', render: (v) => <span className="max-w-xs truncate block">{(v as string)?.substring(0, 60) || '-'}</span> },
        { key: 'status', label: 'Status', render: (v) => (
          <span className={`px-2 py-1 rounded-full text-xs font-medium ${v === 1 ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'}`}>
            {v === 1 ? 'Active' : 'Inactive'}
          </span>
        )},
        { key: 'created_at', label: 'Created', render: (v) => v ? new Date(v as string).toLocaleDateString() : '-' },
      ]}
      createFields={[
        { key: 'title', label: 'Form Title', required: true },
        { key: 'description', label: 'Description', type: 'textarea' },
        { key: 'confirmationMessage', label: 'Confirmation Message', type: 'textarea' },
      ]}
    />
  );
}
