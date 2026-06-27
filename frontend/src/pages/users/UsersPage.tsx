import CrudPage from '../../components/shared/CrudPage';

export default function UsersPage() {
  return (
    <CrudPage
      title="Users"
      subtitle="Manage system users (Admin only)"
      endpoint="/users"
      columns={[
        { key: '_id', label: 'ID' },
        { key: 'first_name', label: 'First Name' },
        { key: 'last_name', label: 'Last Name' },
        { key: 'email', label: 'Email' },
        { key: 'user_roles_id', label: 'Role', render: (v) => (
          <span className={`px-2 py-1 rounded-full text-xs font-medium ${v === 1 ? 'bg-purple-100 text-purple-700' : 'bg-blue-100 text-blue-700'}`}>
            {v === 1 ? 'Super Admin' : 'Vendor User'}
          </span>
        )},
        { key: 'status', label: 'Status', render: (v) => (
          <span className={`px-2 py-1 rounded-full text-xs font-medium ${v === 1 ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'}`}>
            {v === 1 ? 'Active' : 'Inactive'}
          </span>
        )},
        { key: 'created_at', label: 'Created', render: (v) => v ? new Date(v as string).toLocaleDateString() : '-' },
      ]}
      createFields={[
        { key: 'firstName', label: 'First Name', required: true },
        { key: 'lastName', label: 'Last Name', required: true },
        { key: 'email', label: 'Email', type: 'email', required: true },
        { key: 'password', label: 'Password', type: 'password', required: true },
      ]}
    />
  );
}
