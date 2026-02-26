import { useState, useEffect } from 'react';
import { useNavigate, Link } from 'react-router';
import { apiGetMyFiles } from '../lib/api';
import { useAuth } from '../hooks/useAuth';
import FileCard from '../components/FileCard';

interface FileData {
  id: string;
  token: string;
  originalName: string;
  size: number;
  mimeType: string;
  expiresAt: string;
  createdAt: string;
  downloadCount: number;
  tags: { name: string }[];
}

export default function Dashboard() {
  const navigate = useNavigate();
  const { user, logout } = useAuth();
  const [files, setFiles] = useState<FileData[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeTag, setActiveTag] = useState('');

  useEffect(() => {
    apiGetMyFiles(activeTag || undefined)
      .then(setFiles)
      .catch(() => setFiles([]))
      .finally(() => setLoading(false));
  }, [activeTag]);

  function handleDeleted(id: string) {
    setFiles((prev) => prev.filter((f) => f.id !== id));
  }

  function handleLogout() {
    logout();
    navigate('/login');
  }

  const allTags = [...new Set(files.flatMap((f) => f.tags.map((t) => t.name)))];

  return (
    <div className="min-h-screen bg-gray-50">
      <header className="bg-white border-b border-gray-200 px-6 py-4 flex items-center justify-between">
        <div>
          <h1 className="text-lg font-semibold text-gray-800">DataShare</h1>
          <p className="text-xs text-gray-500">{user?.email}</p>
        </div>
        <div className="flex items-center gap-3">
          <Link
            to="/"
            className="text-sm bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition-colors"
          >
            Envoyer un fichier
          </Link>
          <button
            onClick={handleLogout}
            className="text-sm text-gray-500 hover:text-gray-800"
          >
            Déconnexion
          </button>
        </div>
      </header>

      <main className="max-w-4xl mx-auto px-4 py-8">
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-xl font-bold text-gray-800">
            Mes fichiers <span className="text-gray-400 font-normal">({files.length})</span>
          </h2>
        </div>

        {allTags.length > 0 && (
          <div className="flex flex-wrap gap-2 mb-6">
            <button
              onClick={() => setActiveTag('')}
              className={`text-xs px-3 py-1 rounded-full border transition-colors ${
                activeTag === '' ? 'bg-blue-600 text-white border-blue-600' : 'border-gray-300 text-gray-600 hover:border-blue-400'
              }`}
            >
              Tous
            </button>
            {allTags.map((tag) => (
              <button
                key={tag}
                onClick={() => setActiveTag(tag)}
                className={`text-xs px-3 py-1 rounded-full border transition-colors ${
                  activeTag === tag ? 'bg-blue-600 text-white border-blue-600' : 'border-gray-300 text-gray-600 hover:border-blue-400'
                }`}
              >
                {tag}
              </button>
            ))}
          </div>
        )}

        {loading ? (
          <p className="text-gray-400 text-center py-12">Chargement...</p>
        ) : files.length === 0 ? (
          <div className="text-center py-12">
            <p className="text-gray-400 mb-4">Aucun fichier{activeTag ? ` avec le tag "${activeTag}"` : ''}</p>
            <Link to="/" className="text-blue-600 hover:underline text-sm">
              Envoyer votre premier fichier
            </Link>
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {files.map((file) => (
              <FileCard key={file.id} file={file} onDeleted={handleDeleted} />
            ))}
          </div>
        )}
      </main>
    </div>
  );
}
