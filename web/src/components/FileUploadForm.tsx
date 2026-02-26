import { useState, useRef } from 'react';
import TagInput from './TagInput';
import { apiUpload } from '../lib/api';

interface UploadResult {
  token: string;
  originalName: string;
}

interface FileUploadFormProps {
  onSuccess: (result: UploadResult) => void;
}

export default function FileUploadForm({ onSuccess }: FileUploadFormProps) {
  const [file, setFile] = useState<File | null>(null);
  const [expiresIn, setExpiresIn] = useState('7');
  const [password, setPassword] = useState('');
  const [tags, setTags] = useState<string[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [dragOver, setDragOver] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!file) return;
    setError('');
    setLoading(true);
    try {
      const formData = new FormData();
      formData.append('file', file);
      formData.append('expiresIn', expiresIn);
      if (password) formData.append('password', password);
      if (tags.length > 0) formData.append('tags', tags.join(','));
      const result = await apiUpload(formData);
      onSuccess(result);
    } catch (err: unknown) {
      const msg =
        err && typeof err === 'object' && 'message' in err
          ? String((err as { message: unknown }).message)
          : "Erreur lors de l'envoi";
      setError(msg);
    } finally {
      setLoading(false);
    }
  }

  function handleDrop(e: React.DragEvent) {
    e.preventDefault();
    setDragOver(false);
    const dropped = e.dataTransfer.files[0];
    if (dropped) setFile(dropped);
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      {error && (
        <p className="text-sm text-red-600 bg-red-50 border border-red-200 rounded-lg p-3">
          {error}
        </p>
      )}

      <div
        onDragOver={(e) => { e.preventDefault(); setDragOver(true); }}
        onDragLeave={() => setDragOver(false)}
        onDrop={handleDrop}
        onClick={() => inputRef.current?.click()}
        className={`border-2 border-dashed rounded-xl p-8 text-center cursor-pointer transition-colors ${
          dragOver ? 'border-blue-400 bg-blue-50' : 'border-gray-300 hover:border-blue-300'
        }`}
      >
        <input
          ref={inputRef}
          type="file"
          className="hidden"
          onChange={(e) => setFile(e.target.files?.[0] ?? null)}
        />
        {file ? (
          <div>
            <p className="font-medium text-gray-800">{file.name}</p>
            <p className="text-sm text-gray-500">{(file.size / 1024 / 1024).toFixed(2)} Mo</p>
          </div>
        ) : (
          <div>
            <p className="text-gray-500">Glissez un fichier ici ou cliquez pour sélectionner</p>
            <p className="text-xs text-gray-400 mt-1">Max 1 Go — .exe, .bat, .sh, .ps1, .cmd, .msi interdits</p>
          </div>
        )}
      </div>

      <div className="grid grid-cols-2 gap-4">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Expiration
          </label>
          <select
            value={expiresIn}
            onChange={(e) => setExpiresIn(e.target.value)}
            className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
          >
            {[1, 2, 3, 4, 5, 6, 7].map((d) => (
              <option key={d} value={String(d)}>
                {d} jour{d > 1 ? 's' : ''}
              </option>
            ))}
          </select>
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Mot de passe <span className="text-gray-400">(optionnel)</span>
          </label>
          <input
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            minLength={6}
            placeholder="••••••"
            className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
        </div>
      </div>

      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">
          Tags <span className="text-gray-400">(optionnel)</span>
        </label>
        <TagInput tags={tags} onChange={setTags} />
      </div>

      <button
        type="submit"
        disabled={!file || loading}
        className="w-full bg-blue-600 text-white rounded-lg py-2.5 text-sm font-medium hover:bg-blue-700 disabled:opacity-50 transition-colors"
      >
        {loading ? 'Envoi en cours...' : 'Envoyer le fichier'}
      </button>
    </form>
  );
}
