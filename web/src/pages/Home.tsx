import { useState } from 'react';
import { Link } from 'react-router';
import FileUploadForm from '../components/FileUploadForm';
import { useAuth } from '../hooks/useAuth';

interface UploadResult {
  token: string;
  originalName: string;
}

export default function Home() {
  const { user, logout } = useAuth();
  const [result, setResult] = useState<UploadResult | null>(null);

  const shareUrl = result ? `${window.location.origin}/download/${result.token}` : '';

  return (
    <div className="min-h-screen bg-gray-50">
      <header className="bg-white border-b border-gray-200 px-6 py-4 flex items-center justify-between">
        <h1 className="text-lg font-semibold text-gray-800">DataShare</h1>
        <div className="flex items-center gap-3 text-sm">
          {user ? (
            <>
              <Link to="/dashboard" className="text-gray-600 hover:text-gray-800">
                Mon espace
              </Link>
              <button onClick={logout} className="text-gray-400 hover:text-gray-600">
                Déconnexion
              </button>
            </>
          ) : (
            <>
              <Link to="/login" className="text-gray-600 hover:text-gray-800">Connexion</Link>
              <Link
                to="/register"
                className="bg-blue-600 text-white px-4 py-1.5 rounded-lg hover:bg-blue-700 transition-colors"
              >
                S'inscrire
              </Link>
            </>
          )}
        </div>
      </header>

      <main className="max-w-xl mx-auto px-4 py-12">
        {!result ? (
          <>
            <div className="text-center mb-8">
              <h2 className="text-3xl font-bold text-gray-800">Partagez vos fichiers</h2>
              <p className="text-gray-500 mt-2">
                Simple, sécurisé, temporaire.{' '}
                {!user && (
                  <Link to="/register" className="text-blue-600 hover:underline">
                    Créez un compte
                  </Link>
                )}{' '}
                {!user && 'pour suivre vos envois.'}
              </p>
            </div>
            <div className="bg-white rounded-2xl shadow-md p-6">
              <FileUploadForm onSuccess={setResult} />
            </div>
          </>
        ) : (
          <div className="bg-white rounded-2xl shadow-md p-8 text-center space-y-4">
            <div className="w-12 h-12 bg-green-100 rounded-full flex items-center justify-center mx-auto">
              <span className="text-green-600 text-xl">✓</span>
            </div>
            <h2 className="text-xl font-semibold text-gray-800">Fichier envoyé !</h2>
            <p className="text-sm text-gray-500 break-all">{result.originalName}</p>
            <div className="bg-gray-50 border border-gray-200 rounded-lg p-3">
              <p className="text-xs text-gray-400 mb-1">Lien de partage</p>
              <p className="text-sm font-mono text-blue-600 break-all">{shareUrl}</p>
            </div>
            <button
              onClick={() => navigator.clipboard.writeText(shareUrl)}
              className="w-full bg-blue-600 text-white rounded-lg py-2.5 text-sm font-medium hover:bg-blue-700 transition-colors"
            >
              Copier le lien
            </button>
            <button
              onClick={() => setResult(null)}
              className="w-full text-sm text-gray-500 hover:text-gray-700"
            >
              Envoyer un autre fichier
            </button>
          </div>
        )}
      </main>
    </div>
  );
}
