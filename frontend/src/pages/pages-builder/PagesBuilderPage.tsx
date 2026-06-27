import CrudPage from '../../components/shared/CrudPage';

export default function PagesBuilderPage() {
  return (
    <CrudPage
      title="Pages"
      subtitle="Manage website pages"
      endpoint="/pages"
      columns={[
        { key: 'id', label: 'ID' },
        { key: 'title', label: 'Title' },
        { key: 'slug', label: 'Slug' },
        { key: 'status', label: 'Status', render: (v) => (
          <span className={`px-2 py-1 rounded-full text-xs font-medium ${v === 1 ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'}`}>
            {v === 1 ? 'Published' : 'Draft'}
          </span>
        )},
        { key: 'created_at', label: 'Created', render: (v) => v ? new Date(v as string).toLocaleDateString() : '-' },
      ]}
      createFields={[
        { key: 'title', label: 'Page Title', required: true },
        { key: 'slug', label: 'Slug' },
        { key: 'content', label: 'Content', type: 'textarea', required: true },
        { key: 'meta_title', label: 'Meta Title' },
        { key: 'meta_description', label: 'Meta Description', type: 'textarea' },
      ]}
    />
  );
}
