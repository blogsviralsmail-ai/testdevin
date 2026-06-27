import CrudPage from '../../components/shared/CrudPage';

export default function BotFlowPage() {
  return (
    <CrudPage
      title="Bot Flow"
      subtitle="Visual conversation flow builder"
      endpoint="/bot-flows"
      columns={[
        { key: 'id', label: 'ID' },
        { key: 'name', label: 'Name' },
        { key: 'trigger_type', label: 'Trigger' },
        { key: 'trigger_value', label: 'Value' },
        { key: 'status', label: 'Status', render: (v) => (
          <span className={`px-2 py-1 rounded-full text-xs font-medium ${v === 1 ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'}`}>
            {v === 1 ? 'Active' : 'Inactive'}
          </span>
        )},
        { key: 'created_at', label: 'Created', render: (v) => v ? new Date(v as string).toLocaleDateString() : '-' },
      ]}
      createFields={[
        { key: 'name', label: 'Flow Name', required: true },
        { key: 'triggerType', label: 'Trigger Type', type: 'select', options: [{ value: 'keyword', label: 'Keyword' }, { value: 'event', label: 'Event' }, { value: 'manual', label: 'Manual' }] },
        { key: 'triggerValue', label: 'Trigger Value' },
      ]}
    />
  );
}
