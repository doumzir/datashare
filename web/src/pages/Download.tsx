import { useState, useEffect } from 'react';
import { useParams } from 'react-router';
import { apiGetFile } from '../lib/api';
import DownloadCard from '../components/DownloadCard';

interface FileInfo {
  originalName: string;
  size: number;
  mimeType: string;
  expiresAt: string;
  downloadCount: number;
  hasPassword: boolean;
  tags: { name: string }[];
}

export default function Download() {
  const { token } = useParams<{ token: string }>();
  const [file, setFile] = useState<FileInfo | null>(null);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!token) return;
    apiGetFile(token)
      .then(setFile)
      .catch(() => setError('Fichier introuvable ou lien expiré.'))
      .finally(() => setLoading(false));
  }, [token]);

  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center px-4">
      <div className="w-full max-w-md">
        <div className="text-center mb-6">
          <h1 className="text-2xl font-bold text-gray-800">DataShare</h1>
          <p className="text-sm text-gray-500">Téléchargement de fichier</p>
        </div>

        {loading && (
          <div className="bg-white rounded-2xl shadow-md p-8 text-center text-gray-400">
            Chargement...
          </div>
        )}

        {error && (
          <div className="bg-white rounded-2xl shadow-md p-8 text-center">
            <p className="text-red-500 font-medium">Lien invalide ou expiré</p>
            <p className="text-sm text-gray-400 mt-2">{error}</p>
          </div>
        )}

        {file && token && <DownloadCard token={token} file={file} />}
      </div>
    </div>
  );
}
