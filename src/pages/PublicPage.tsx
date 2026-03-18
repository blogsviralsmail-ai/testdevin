import { useState, useEffect } from 'react';
import { useParams, useLocation } from 'react-router-dom';
import { api } from '../lib/api';

export default function PublicPage() {
  const { slug: paramSlug } = useParams<{ slug: string }>();
  const location = useLocation();
  // Derive slug from URL path if not provided via params (e.g. /about -> about, /contact -> contact)
  const slug = paramSlug || location.pathname.replace(/^\//, '');
  const [page, setPage] = useState<Record<string, unknown> | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (slug) {
      api.getPublicPage(slug).then(setPage).catch(() => setPage(null)).finally(() => setLoading(false));
    } else {
      setLoading(false);
    }
  }, [slug]);

  if (loading) return <div className="min-h-screen flex items-center justify-center"><div className="animate-spin rounded-full h-8 w-8 border-t-2 border-green-600"></div></div>;
  if (!page) return <div className="min-h-screen flex items-center justify-center"><p className="text-gray-500">Page not found</p></div>;

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-4xl mx-auto px-4 py-8">
        <div className="bg-white rounded-2xl shadow-sm p-8">
          <div className="prose max-w-none" dangerouslySetInnerHTML={{ __html: page.content as string }} />
          <div className="mt-8 pt-4 border-t text-center text-xs text-gray-400">
            Last updated: {(page.updated_at as string)?.replace('T', ' ').slice(0, 16) || 'Recently'}
          </div>
        </div>
      </div>
    </div>
  );
}
