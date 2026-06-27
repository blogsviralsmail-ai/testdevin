import CrudPage from '../../components/shared/CrudPage';

export default function ProductCatalogPage() {
  return (
    <CrudPage
      title="Product Catalog"
      subtitle="Manage products for WhatsApp Commerce"
      endpoint="/product-catalog"
      columns={[
        { key: 'id', label: 'ID' },
        { key: 'name', label: 'Name' },
        { key: 'price', label: 'Price', render: (v) => v ? `$${v}` : '-' },
        { key: 'category', label: 'Category' },
        { key: 'status', label: 'Status', render: (v) => (
          <span className={`px-2 py-1 rounded-full text-xs font-medium ${v === 1 ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'}`}>
            {v === 1 ? 'Active' : 'Inactive'}
          </span>
        )},
        { key: 'created_at', label: 'Created', render: (v) => v ? new Date(v as string).toLocaleDateString() : '-' },
      ]}
      createFields={[
        { key: 'name', label: 'Product Name', required: true },
        { key: 'description', label: 'Description', type: 'textarea' },
        { key: 'price', label: 'Price', type: 'number', required: true },
        { key: 'category', label: 'Category' },
        { key: 'image_url', label: 'Image URL' },
      ]}
    />
  );
}
