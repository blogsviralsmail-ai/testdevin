import CrudPage from '../../components/shared/CrudPage';

export default function PresetMessagesPage() {
  return (
    <CrudPage
      title="Preset Messages"
      subtitle="Quick reply message templates"
      endpoint="/preset-messages"
      columns={[
        { key: 'id', label: 'ID' },
        { key: 'title', label: 'Title' },
        { key: 'message', label: 'Message', render: (v) => (
          <span className="max-w-xs truncate block">{(v as string)?.substring(0, 80) || '-'}</span>
        )},
        { key: 'type', label: 'Type' },
        { key: 'status', label: 'Status', render: (v) => (
          <span className={`px-2 py-1 rounded-full text-xs font-medium ${v === 1 ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'}`}>
            {v === 1 ? 'Active' : 'Inactive'}
          </span>
        )},
      ]}
      createFields={[
        { key: 'title', label: 'Title', required: true },
        { key: 'message', label: 'Message', type: 'textarea', required: true },
        { key: 'type', label: 'Type', type: 'select', options: [{ value: 'text', label: 'Text' }, { value: 'media', label: 'Media' }, { value: 'interactive', label: 'Interactive' }] },
      ]}
      searchable={false}
    />
  );
}
