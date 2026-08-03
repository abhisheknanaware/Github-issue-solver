import { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useRepoStore } from '../store/useRepoStore.js';
import IssueList from '../components/IssueList.jsx';
import FileExplorer from '../components/FileExplorer.jsx';
import RepoChat from '../components/RepoChat.jsx';
import { 
  ArrowLeft, AlertCircle, FileCode, Bot, Database, 
  Star, GitFork, Code
} from 'lucide-react';

export default function RepoView() {
  const { repoId } = useParams();
  const navigate = useNavigate();
  const { currentRepo, issues, fileTree, fetchRepoData, isLoading } = useRepoStore();
  const [activeTab, setActiveTab] = useState('issues');

  useEffect(() => {
    fetchRepoData(repoId);
  }, [repoId, fetchRepoData]);

  if (isLoading && !currentRepo) {
    return (
      <div className="min-h-screen bg-[#0a0e1a] flex flex-col items-center justify-center text-slate-500 gap-3">
        <span className="w-7 h-7 rounded-full border-2 border-slate-700 border-t-blue-500 animate-spin" />
        <p className="text-sm">Loading repository...</p>
      </div>
    );
  }

  if (!currentRepo) {
    return (
      <div className="min-h-screen bg-[#0a0e1a] flex flex-col items-center justify-center text-slate-500 gap-3">
        <AlertCircle className="w-8 h-8 text-rose-500" />
        <h2 className="font-semibold text-white">Repository Not Found</h2>
        <button onClick={() => navigate('/dashboard')} className="text-blue-400 text-sm hover:underline flex items-center gap-1">
          <ArrowLeft className="w-3.5 h-3.5" /> Back to Dashboard
        </button>
      </div>
    );
  }

  const tabs = [
    { id: 'issues', label: `Issues (${issues.length})`, icon: AlertCircle },
    { id: 'files', label: 'Files', icon: FileCode },
    { id: 'chat', label: 'RAG Chat', icon: Bot },
  ];

  return (
    <div className="min-h-screen bg-[#0a0e1a] text-slate-200 flex flex-col overflow-hidden" style={{ fontFamily: 'Inter, system-ui, sans-serif' }}>

      {/* Header */}
      <header className="border-b border-white/[0.05] px-5 py-3.5 flex items-center justify-between flex-shrink-0" style={{ background: 'rgba(10, 14, 26, 0.9)', backdropFilter: 'blur(12px)' }}>
        <div className="flex items-center gap-3">
          <button
            onClick={() => navigate('/dashboard')}
            className="w-8 h-8 rounded-lg border border-white/[0.08] flex items-center justify-center text-slate-400 hover:text-white hover:bg-white/[0.06] transition-all"
          >
            <ArrowLeft className="w-4 h-4" />
          </button>
          <div>
            <div className="flex items-center gap-2">
              <h1 className="text-sm font-semibold text-white font-mono">
                {currentRepo.owner}/{currentRepo.name}
              </h1>
              <span className={`status-badge ${currentRepo.isIndexed ? 'success' : 'pending'}`}>
                <span className={`w-1.5 h-1.5 rounded-full ${currentRepo.isIndexed ? 'bg-emerald-400 animate-pulse' : 'bg-slate-500'}`} />
                {currentRepo.isIndexed ? 'Indexed' : 'Syncing...'}
              </span>
            </div>
            {currentRepo.description && (
              <p className="text-[11px] text-slate-500 mt-0.5 max-w-xl truncate">{currentRepo.description}</p>
            )}
          </div>
        </div>

        <div className="flex items-center gap-2">
          <div className="flex items-center gap-1.5 text-[12px] text-slate-500 bg-white/[0.03] border border-white/[0.05] px-3 py-1.5 rounded-lg">
            <Star className="w-3.5 h-3.5 text-amber-400 fill-current" />
            <span>{currentRepo.stars}</span>
          </div>
          <div className="flex items-center gap-1.5 text-[12px] text-slate-500 bg-white/[0.03] border border-white/[0.05] px-3 py-1.5 rounded-lg">
            <GitFork className="w-3.5 h-3.5" />
            <span>{currentRepo.forks}</span>
          </div>
          <div className="flex items-center gap-1.5 text-[12px] text-slate-500 bg-white/[0.03] border border-white/[0.05] px-3 py-1.5 rounded-lg font-mono text-[11px]">
            {currentRepo.defaultBranch}
          </div>
        </div>
      </header>

      {/* Tab Bar */}
      <div className="border-b border-white/[0.05] px-5 flex-shrink-0" style={{ background: 'rgba(10, 14, 26, 0.6)' }}>
        <div className="flex gap-0">
          {tabs.map(tab => {
            const Icon = tab.icon;
            const isActive = activeTab === tab.id;
            return (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`flex items-center gap-1.5 px-4 py-3 text-[13px] font-medium border-b-2 transition-all cursor-pointer ${
                  isActive
                    ? 'text-blue-400 border-blue-500'
                    : 'text-slate-500 border-transparent hover:text-slate-300 hover:border-white/[0.1]'
                }`}
              >
                <Icon className="w-3.5 h-3.5" />
                {tab.label}
              </button>
            );
          })}
        </div>
      </div>

      {/* Main Content */}
      <main className="flex-1 overflow-y-auto p-5" style={{ background: '#0a0e1a' }}>
        <div className={`mx-auto ${activeTab === 'chat' ? 'max-w-5xl' : 'grid grid-cols-1 lg:grid-cols-3 gap-5 items-start max-w-6xl'}`}>
          
          {/* Main Panel */}
          <div className={activeTab === 'chat' ? '' : 'lg:col-span-2'}>
            {activeTab === 'issues' && (
              <IssueList issues={issues} onSelect={(issue) => navigate(`/issue/${issue._id}`)} />
            )}
            {activeTab === 'files' && (
              <div className="glass-panel rounded-xl border border-white/[0.06] overflow-hidden">
                <div className="px-5 py-4 border-b border-white/[0.05] flex items-center gap-2">
                  <FileCode className="w-4 h-4 text-blue-400" />
                  <div>
                    <h3 className="text-sm font-semibold text-white">Codebase Explorer</h3>
                    <p className="text-[11px] text-slate-500 mt-0.5">Directory tree structure</p>
                  </div>
                </div>
                <div className="p-4">
                  <FileExplorer fileTree={fileTree} repoId={repoId} />
                </div>
              </div>
            )}
            {activeTab === 'chat' && (
              <RepoChat repoId={repoId} isIndexed={currentRepo.isIndexed} />
            )}
          </div>

          {/* Sidebar */}
          {activeTab !== 'chat' && (
            <div className="space-y-4 lg:col-span-1">
              <RepoChat repoId={repoId} isIndexed={currentRepo.isIndexed} />

              <div className="glass-panel rounded-xl border border-white/[0.06] p-4">
                <h4 className="section-label mb-3">System Diagnostics</h4>
                <div className="space-y-2.5">
                  {[
                    { label: 'Clone URL', value: currentRepo.cloneUrl || 'N/A', mono: true, truncate: true },
                    { label: 'Default branch', value: currentRepo.defaultBranch, mono: true },
                    { label: 'Indexed files', value: `${currentRepo.files?.length || 0} files` },
                    { label: 'Last indexed', value: new Date(currentRepo.indexedAt).toLocaleDateString() },
                  ].map(item => (
                    <div key={item.label} className="flex justify-between items-center py-1.5 border-b border-white/[0.04] last:border-0">
                      <span className="text-[12px] text-slate-400">{item.label}</span>
                      <span className={`text-[12px] text-slate-200 font-medium ${item.mono ? 'font-mono' : ''} ${item.truncate ? 'max-w-[55%] truncate' : ''}`}>
                        {item.value}
                      </span>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )}
        </div>
      </main>
    </div>
  );
}
