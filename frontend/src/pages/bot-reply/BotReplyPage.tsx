import CrudPage from '../../components/shared/CrudPage';

export default function BotReplyPage() {
  return (
    <CrudPage
      title="Bot Reply"
      subtitle="Auto-reply rules for incoming messages"
      endpoint="/bot-replies"
      columns={[
        { key: 'id', label: 'ID' },
        { key: 'name', label: 'Name' },
        { key: 'keyword', label: 'Keyword' },
        { key: 'match_type', label: 'Match Type', render: (v) => (
          <span className="px-2 py-1 bg-blue-50 text-blue-700 rounded text-xs">{(v as string) || 'exact'}</span>
        )},
        { key: 'reply_type', label: 'Reply Type' },
        { key: 'trigger_count', label: 'Triggers' },
        { key: 'status', label: 'Status', render: (v) => (
          <span className={`px-2 py-1 rounded-full text-xs font-medium ${v === 1 ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'}`}>
            {v === 1 ? 'Active' : 'Inactive'}
          </span>
        )},
      ]}
      createFields={[
        { key: 'name', label: 'Rule Name', required: true },
        { key: 'keyword', label: 'Keyword', required: true },
        { key: 'matchType', label: 'Match Type', type: 'select', options: [{ value: 'exact', label: 'Exact' }, { value: 'contains', label: 'Contains' }, { value: 'startsWith', label: 'Starts With' }] },
        { key: 'replyMessage', label: 'Reply Message', type: 'textarea', required: true },
        { key: 'replyType', label: 'Reply Type', type: 'select', options: [{ value: 'text', label: 'Text' }, { value: 'template', label: 'Template' }, { value: 'media', label: 'Media' }] },
      ]}
    />
  );
}
