import { useState } from 'react';
import { useRepoStore } from '../store/useRepoStore.js';
import { Loader2, Plus, GitBranch, AlertCircle } from 'lucide-react';

export default function RepoConnector({ onConnected }) {
  const [url, setUrl] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const connectRepo = useRepoStore((state) => state.connectRepo);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    let owner = '';
    let repo = '';

    const trimmed = url.trim();
    if (trimmed.startsWith('http') || trimmed.includes('github.com')) {
      try {
        const cleanUrl = trimmed.replace(/\/$/, '');
        const parts = cleanUrl.split('/');
        repo = parts.pop();
        owner = parts.pop();
      } catch (err) {
        setError('Invalid GitHub URL format');
        setLoading(false);
        return;
      }
    } else if (trimmed.includes('/')) {
      const parts = trimmed.split('/');
      owner = parts[0].trim();
      repo = parts[1].trim();
    }

    if (!owner || !repo) {
      setError('Please provide a valid GitHub repository URL or "owner/repo"');
      setLoading(false);
      return;
    }

    try {
      const connected = await connectRepo(owner, repo);
      setUrl('');
      if (onConnected) onConnected(connected);
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to connect repository. Make sure the repository exists and is public.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="glass-panel rounded-xl p-5 border border-white/[0.06]">
      <div className="mb-4">
        <div className="flex items-center gap-2 mb-1">
          <GitBranch className="w-4 h-4 text-blue-400" />
          <h2 className="text-sm font-semibold text-white">Connect Repository</h2>
        </div>
        <p className="text-[12px] text-slate-400 ml-6">
          Input a public GitHub URL or{' '}
          <code className="font-mono text-blue-400 bg-blue-500/10 px-1.5 py-0.5 rounded text-[11px]">owner/repo</code>
          {' '}identifier to begin triaging.
        </p>
      </div>

      <form onSubmit={handleSubmit} className="flex gap-2">
        <input
          type="text"
          placeholder="e.g. github.com/facebook/react"
          value={url}
          onChange={(e) => setUrl(e.target.value)}
          disabled={loading}
          className="input-base flex-1"
        />
        <button
          type="submit"
          disabled={loading || !url}
          className="btn-primary flex-shrink-0"
        >
          {loading ? (
            <>
              <Loader2 className="w-4 h-4 animate-spin" />
              Syncing...
            </>
          ) : (
            <>
              <Plus className="w-4 h-4" />
              Sync Repo
            </>
          )}
        </button>
      </form>

      {error && (
        <div className="mt-3 flex items-start gap-2 text-rose-400 text-[12px] bg-rose-500/8 border border-rose-500/15 rounded-lg p-3">
          <AlertCircle className="w-4 h-4 flex-shrink-0 mt-0.5" />
          <span>{error}</span>
        </div>
      )}
    </div>
  );
}
