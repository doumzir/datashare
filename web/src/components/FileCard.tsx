import { useState } from 'react';
import { apiDeleteFile } from '../lib/api';

interface Tag {
  name: string;
}

interface FileData {
  id: string;
  token: string;
  originalName: string;
  size: number;
  mimeType: string;
  expiresAt: string;
  createdAt: string;
  downloadCount: number;
  tags: Tag[];
}

interface FileCardProps {
  file: FileData;
  onDeleted: (id: string) => void;
}

function formatBytes(bytes: number): string {
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(0)} Ko`;
  return `${(bytes / 1024 / 1024).toFixed(2)} Mo`;
}

function isExpiringSoon(expiresAt: string): boolean {
  const diff = new Date(expiresAt).getTime() - Date.now();
  return diff < 24 * 60 * 60 * 1000;
}

export default function FileCard({ file, onDeleted }: FileCardProps) {
  const [deleting, setDeleting] = useState(false);
  const [confirm, setConfirm] = useState(false);

  const shareUrl = `${window.location.origin}/download/${file.token}`;

  async function handleDelete() {
    setDeleting(true);
    try {
      await apiDeleteFile(file.id);
      onDeleted(file.id);
    } catch {
      setDeleting(false);
      setConfirm(false);
    }
  }

  return (
    <div className="bg-white rounded-xl border border-gray-200 p-4 space-y-3">
      <div className="flex items-start justify-between gap-2">
        <div className="min-w-0">
          <p className="font-medium text-gray-800 truncate">{file.originalName}</p>
          <p className="text-xs text-gray-400">{formatBytes(file.size)} — {file.mimeType}</p>
        </div>
        <span
          className={`text-xs px-2 py-0.5 rounded-full flex-shrink-0 ${
            isExpiringSoon(file.expiresAt)
              ? 'bg-red-100 text-red-700'
              : 'bg-green-100 text-green-700'
          }`}
        >
          {isExpiringSoon(file.expiresAt) ? 'Expire bientôt' : 'Actif'}
        </span>
      </div>

      <div className="text-xs text-gray-500 space-y-0.5">
        <p>Expire : {new Date(file.expiresAt).toLocaleDateString('fr-FR')}</p>
        <p>Téléchargements : {file.downloadCount}</p>
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

      <div className="flex items-center gap-2 pt-1">
        <input
          readOnly
          value={shareUrl}
          className="flex-1 text-xs border border-gray-200 rounded px-2 py-1 bg-gray-50 text-gray-600 truncate"
          onClick={(e) => (e.target as HTMLInputElement).select()}
        />
        <button
          onClick={() => navigator.clipboard.writeText(shareUrl)}
          className="text-xs text-blue-600 hover:underline flex-shrink-0"
        >
          Copier
        </button>
      </div>

      {!confirm ? (
        <button
          onClick={() => setConfirm(true)}
          className="w-full text-sm text-red-600 border border-red-200 rounded-lg py-1.5 hover:bg-red-50 transition-colors"
        >
          Supprimer
        </button>
      ) : (
        <div className="flex gap-2">
          <button
            onClick={handleDelete}
            disabled={deleting}
            className="flex-1 text-sm bg-red-600 text-white rounded-lg py-1.5 hover:bg-red-700 disabled:opacity-50"
          >
            {deleting ? '...' : 'Confirmer'}
          </button>
          <button
            onClick={() => setConfirm(false)}
            className="flex-1 text-sm border border-gray-300 rounded-lg py-1.5 hover:bg-gray-50"
          >
            Annuler
          </button>
        </div>
      )}
    </div>
  );
}
