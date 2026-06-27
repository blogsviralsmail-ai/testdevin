import CrudPage from '../../components/shared/CrudPage';

export default function VendorsPage() {
  return (
    <CrudPage
      title="Vendors"
      subtitle="Manage vendor accounts (Admin only)"
      endpoint="/vendors"
      columns={[
        { key: 'id', label: 'ID' },
        { key: 'title', label: 'Name' },
        { key: 'uid', label: 'UID', render: (v) => <span className="text-xs font-mono">{(v as string)?.substring(0, 12) || '-'}...</span> },
        { key: 'status', label: 'Status', render: (v) => (
          <span className={`px-2 py-1 rounded-full text-xs font-medium ${v === 1 ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'}`}>
            {v === 1 ? 'Active' : 'Inactive'}
          </span>
        )},
        { key: 'created_at', label: 'Created', render: (v) => v ? new Date(v as string).toLocaleDateString() : '-' },
      ]}
      createFields={[
        { key: 'title', label: 'Vendor Name', required: true },
      ]}
    />
  );
}
