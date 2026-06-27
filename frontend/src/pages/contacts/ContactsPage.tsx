import CrudPage from '../../components/shared/CrudPage';

export default function ContactsPage() {
  return (
    <CrudPage
      title="Contacts"
      subtitle="Manage your WhatsApp contacts"
      endpoint="/contacts"
      columns={[
        { key: 'id', label: 'ID' },
        { key: 'first_name', label: 'First Name' },
        { key: 'last_name', label: 'Last Name' },
        { key: 'wa_id', label: 'WhatsApp ID' },
        { key: 'phone', label: 'Phone' },
        { key: 'email', label: 'Email' },
        { key: 'status', label: 'Status', render: (v) => (
          <span className={`px-2 py-1 rounded-full text-xs font-medium ${v === 1 ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'}`}>
            {v === 1 ? 'Active' : 'Blocked'}
          </span>
        )},
        { key: 'created_at', label: 'Created', render: (v) => v ? new Date(v as string).toLocaleDateString() : '-' },
      ]}
      createFields={[
        { key: 'firstName', label: 'First Name', required: true },
        { key: 'lastName', label: 'Last Name' },
        { key: 'waId', label: 'WhatsApp Number', required: true },
        { key: 'email', label: 'Email', type: 'email' },
        { key: 'phone', label: 'Phone' },
        { key: 'country', label: 'Country' },
      ]}
    />
  );
}
