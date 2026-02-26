import { useState } from 'react';
import { apiVerifyPassword, getDownloadUrl } from '../lib/api';

interface FileInfo {
  originalName: string;
  size: number;
  mimeType: string;
  expiresAt: string;
  downloadCount: number;
  hasPassword: boolean;
  tags: { name: string }[];
}

interface DownloadCardProps {
  token: string;
  file: FileInfo;
}

function formatBytes(bytes: number): string {
  if (bytes < 1024) return `${bytes} o`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} Ko`;
  return `${(bytes / 1024 / 1024).toFixed(2)} Mo`;
}

export default function DownloadCard({ token, file }: DownloadCardProps) {
  const [password, setPassword] = useState('');
  const [verified, setVerified] = useState(!file.hasPassword);
  const [error, setError] = useState('');
  const [checking, setChecking] = useState(false);

  async function handleVerify(e: React.FormEvent) {
    e.preventDefault();
    setError('');
    setChecking(true);
    try {
      await apiVerifyPassword(token, password);
      setVerified(true);
    } catch {
      setError('Mot de passe incorrect');
    } finally {
      setChecking(false);
    }
  }

  const downloadUrl = verified
    ? `${getDownloadUrl(token)}${file.hasPassword ? `?password=${encodeURIComponent(password)}` : ''}`
    : '#';

  return (
    <div className="bg-white rounded-2xl shadow-md p-6 space-y-4">
      <div>
        <h2 className="text-xl font-semibold text-gray-800 break-all">{file.originalName}</h2>
        <p className="text-sm text-gray-500 mt-1">
          {formatBytes(file.size)} — {file.mimeType}
        </p>
      </div>

      <div className="text-sm text-gray-500 space-y-1">
        <p>Expire le : <span className="font-medium text-gray-700">{new Date(file.expiresAt).toLocaleDateString('fr-FR')}</span></p>
        <p>Téléchargements : <span className="font-medium text-gray-700">{file.downloadCount}</span></p>
      </div>

      {file.tags.length > 0 && (
        <div className="flex flex-wrap gap-1">
          {file.tags.map((t) => (
            <span key={t.name} className="bg-blue-100 text-blue-700 text-xs px-2 py-0.5 rounded-full">
              {t.name}
            </span>
          ))}
        </div>
      )}

      {!verified && (
        <form onSubmit={handleVerify} className="space-y-2">
          <p className="text-sm font-medium text-gray-700">Ce fichier est protégé par un mot de passe</p>
          {error && <p className="text-sm text-red-600">{error}</p>}
          <div className="flex gap-2">
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
              placeholder="Mot de passe"
              className="flex-1 border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
            <button
              type="submit"
              disabled={checking}
              className="bg-gray-700 text-white px-4 py-2 rounded-lg text-sm hover:bg-gray-800 disabled:opacity-50"
            >
              {checking ? '...' : 'Vérifier'}
            </button>
          </div>
        </form>
      )}

      {verified && (
        <a
          href={downloadUrl}
          className="block w-full text-center bg-blue-600 text-white rounded-lg py-2.5 text-sm font-medium hover:bg-blue-700 transition-colors"
        >
          Télécharger
        </a>
      )}
    </div>
  );
}
