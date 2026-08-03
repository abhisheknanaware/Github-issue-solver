import { useEffect } from 'react';
import { useRepoStore } from '../store/useRepoStore.js';
import { useAuthStore } from '../store/useAuthStore.js';
import { useContributionStore } from '../store/useContributionStore.js';
import { useNavigate } from 'react-router-dom';
import RepoConnector from '../components/RepoConnector.jsx';
import { 
  Star, GitFork, LogOut, Code, AlertCircle, Database, Github, 
  ArrowRight, LayoutDashboard, CheckCircle2, 
  GitPullRequest, ShieldAlert, Clock, RefreshCw
} from 'lucide-react';

export default function Dashboard() {
  const { user, logout } = useAuthStore();
  const { repos, fetchRepos, isLoading } = useRepoStore();
  const { recentContributions, fetchRecentContributions } = useContributionStore();
  const navigate = useNavigate();

  useEffect(() => {
    fetchRepos();
    fetchRecentContributions();
  }, [fetchRepos, fetchRecentContributions]);

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  const totalRepos = repos.length;
  const totalIssues = repos.reduce((sum, r) => sum + (r.openIssuesCount || 0), 0);
  const indexedRepos = repos.filter(r => r.isIndexed).length;
  const indexPercentage = totalRepos > 0 ? Math.round((indexedRepos / totalRepos) * 100) : 0;

  // Format a relative time string
  const timeAgo = (dateStr) => {
    const diff = Date.now() - new Date(dateStr).getTime();
    const mins = Math.floor(diff / 60000);
    const hours = Math.floor(diff / 3600000);
    const days = Math.floor(diff / 86400000);
    if (mins < 60) return `${mins}m ago`;
    if (hours < 24) return `${hours}h ago`;
    return `${days}d ago`;
  };

  const getStatusLabel = (status, currentStage) => {
    if (status === 'completed') return 'PR Composed';
    if (status === 'failed') return 'Pipeline Failed';
    if (status === 'running') {
      const labels = {
        issueScout: 'Issue Scouting',
        codeAnalysis: 'Code Analysis',
        planner: 'Planning',
        coder: 'Code Generation',
        testGenerator: 'Test Generation',
        documentation: 'Documentation',
        prDraft: 'PR Drafting',
      };
      return labels[currentStage] || 'Running';
    }
    return 'Queued';
  };

  const statCards = [
    {
      label: 'Active Repositories',
      value: totalRepos,
      icon: Database,
      iconColor: 'text-blue-400',
      iconBg: 'bg-blue-500/10',
      accent: 'from-blue-500/10 to-transparent',
    },
    {
      label: 'Open Issues',
      value: totalIssues,
      icon: AlertCircle,
      iconColor: 'text-amber-400',
      iconBg: 'bg-amber-500/10',
      accent: 'from-amber-500/10 to-transparent',
    },
    {
      label: 'Semantic Ingestion',
      value: `${indexPercentage}%`,
      icon: CheckCircle2,
      iconColor: 'text-emerald-400',
      iconBg: 'bg-emerald-500/10',
      accent: 'from-emerald-500/10 to-transparent',
    },
    {
      label: 'Successful PR Runs',
      value: 12,
      icon: GitPullRequest,
      iconColor: 'text-indigo-400',
      iconBg: 'bg-indigo-500/10',
      accent: 'from-indigo-500/10 to-transparent',
    },
  ];

  return (
    <div className="min-h-screen bg-[#0a0e1a] text-slate-200 flex overflow-hidden" style={{ fontFamily: 'Inter, system-ui, sans-serif' }}>

      {/* Sidebar */}
      <aside className="w-60 flex-shrink-0 flex flex-col border-r border-white/[0.05]" style={{ background: 'rgba(10, 14, 26, 0.95)' }}>
        
        {/* Brand */}
        <div className="px-5 py-5 flex items-center gap-3 border-b border-white/[0.04]">
          <div className="w-8 h-8 bg-blue-600 rounded-lg flex items-center justify-center shadow-lg shadow-blue-600/30 flex-shrink-0">
            <Github className="w-4 h-4 text-white" />
          </div>
          <div>
            <div className="text-sm font-semibold text-white flex items-center gap-1.5">
              GitSolver
              <span className="text-[10px] bg-blue-500/15 text-blue-400 px-1.5 py-0.5 rounded font-medium" style={{ letterSpacing: '0.02em' }}>
                OS
              </span>
            </div>
            <p className="text-[11px] text-slate-500 mt-0.5">Developer Console</p>
          </div>
        </div>

        {/* Navigation */}
        <nav className="flex-1 px-3 py-4 space-y-0.5">
          <button className="sidebar-nav-item active">
            <LayoutDashboard className="w-4 h-4 flex-shrink-0" />
            Overview
          </button>
          <button
            onClick={() => fetchRepos()}
            className="sidebar-nav-item"
          >
            <RefreshCw className="w-4 h-4 flex-shrink-0" />
            Sync Workspace
          </button>
        </nav>

        {/* User section */}
        {user && (
          <div className="px-3 py-4 border-t border-white/[0.04]">
            <div className="flex items-center gap-2.5 px-2 py-2 rounded-lg">
              <img
                src={user.avatarUrl}
                alt={user.username}
                className="w-7 h-7 rounded-full ring-1 ring-white/10 flex-shrink-0"
              />
              <div className="flex-1 min-w-0">
                <p className="text-[13px] font-medium text-slate-200 truncate">@{user.username}</p>
                <p className="text-[11px] text-slate-500">Maintainer</p>
              </div>
              <button
                onClick={handleLogout}
                className="w-7 h-7 rounded-md flex items-center justify-center text-slate-500 hover:text-rose-400 hover:bg-rose-500/10 transition-all flex-shrink-0"
                title="Sign Out"
              >
                <LogOut className="w-3.5 h-3.5" />
              </button>
            </div>
          </div>
        )}
      </aside>

      {/* Main Area */}
      <div className="flex-1 flex flex-col overflow-hidden">

        {/* Top Header */}
        <header className="h-14 border-b border-white/[0.05] px-6 flex items-center justify-between flex-shrink-0" style={{ background: 'rgba(10, 14, 26, 0.8)', backdropFilter: 'blur(12px)' }}>
          <div>
            <p className="text-[11px] text-slate-500 font-medium" style={{ letterSpacing: '0.06em' }}>PLATFORM OVERVIEW</p>
            <h1 className="text-sm font-semibold text-white">Autonomous Triage Dashboard</h1>
          </div>
          <div className="flex items-center gap-2 text-[11px] text-emerald-400 font-medium">
            <span className="w-1.5 h-1.5 bg-emerald-400 rounded-full animate-pulse-ring flex-shrink-0" />
            System Online
          </div>
        </header>

        {/* Scrollable Content */}
        <main className="flex-1 overflow-y-auto bg-dot-pattern p-6" style={{ background: '#0a0e1a' }}>
          {/* Subtle radial gradient */}
          <div className="fixed top-0 right-0 w-[600px] h-[600px] pointer-events-none -z-10" style={{ background: 'radial-gradient(ellipse at top right, rgba(59,130,246,0.04) 0%, transparent 70%)' }} />

          <div className="max-w-6xl mx-auto space-y-6">

            {/* Stat Cards */}
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
              {statCards.map((card) => {
                const Icon = card.icon;
                return (
                  <div key={card.label} className="stat-card group">
                    <div className={`absolute inset-0 bg-gradient-to-br ${card.accent} opacity-0 group-hover:opacity-100 transition-opacity rounded-[11px]`} />
                    <div className="relative">
                      <div className="flex items-center justify-between mb-3">
                        <p className="text-[11px] text-slate-400 font-medium">{card.label}</p>
                        <div className={`w-8 h-8 ${card.iconBg} rounded-lg flex items-center justify-center flex-shrink-0`}>
                          <Icon className={`w-4 h-4 ${card.iconColor}`} />
                        </div>
                      </div>
                      <p className="text-2xl font-bold text-white tracking-tight">{card.value}</p>
                    </div>
                  </div>
                );
              })}
            </div>

            {/* Body Grid */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 items-start">

              {/* Left: Repo Connector + Codebase List */}
              <div className="lg:col-span-2 space-y-5">
                <RepoConnector onConnected={(newRepo) => navigate(`/repo/${newRepo._id}`)} />

                {/* Connected Codebases */}
                <div>
                  <div className="flex items-center justify-between mb-3">
                    <div className="flex items-center gap-2">
                      <Database className="w-4 h-4 text-blue-400" />
                      <h2 className="text-sm font-semibold text-white">Connected Codebases</h2>
                    </div>
                    <span className="text-[11px] text-slate-500 bg-white/[0.04] border border-white/[0.06] px-2.5 py-1 rounded-md font-medium">
                      {totalRepos} source{totalRepos !== 1 ? 's' : ''}
                    </span>
                  </div>

                  {isLoading && totalRepos === 0 ? (
                    <div className="glass-panel rounded-xl py-14 flex flex-col items-center justify-center gap-3 text-slate-500">
                      <span className="w-6 h-6 rounded-full border-2 border-slate-700 border-t-blue-500 animate-spin" />
                      <p className="text-sm">Querying codebase records...</p>
                    </div>
                  ) : totalRepos === 0 ? (
                    <div className="glass-panel border-dashed border-2 border-white/[0.06] rounded-xl p-12 text-center flex flex-col items-center gap-3 text-slate-500">
                      <ShieldAlert className="w-8 h-8 text-slate-700" />
                      <div>
                        <h3 className="font-semibold text-slate-300 text-sm mb-1">No connections yet</h3>
                        <p className="text-xs leading-relaxed text-slate-500 max-w-xs">
                          Input a repository URL above to let our RAG agents index code files and resolve open issues.
                        </p>
                      </div>
                    </div>
                  ) : (
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                      {repos.map((repo) => (
                        <div
                          key={repo._id}
                          onClick={() => navigate(`/repo/${repo._id}`)}
                          className="glass-card rounded-xl p-4 cursor-pointer group border-l-2 border-l-blue-500/50"
                        >
                          <div className="flex items-start justify-between gap-2 mb-2">
                            <h3 className="text-sm font-semibold text-white group-hover:text-blue-300 transition-colors font-mono truncate">
                              {repo.owner}/{repo.name}
                            </h3>
                            <span className={`status-badge flex-shrink-0 ${repo.isIndexed ? 'success' : 'pending'}`}>
                              <span className={`w-1.5 h-1.5 rounded-full flex-shrink-0 ${repo.isIndexed ? 'bg-emerald-400 animate-pulse' : 'bg-slate-500'}`} />
                              {repo.isIndexed ? 'Indexed' : 'Syncing'}
                            </span>
                          </div>

                          <p className="text-xs text-slate-400 line-clamp-2 leading-relaxed mb-3">
                            {repo.description || 'No description provided.'}
                          </p>

                          <div className="flex items-center justify-between pt-2.5 border-t border-white/[0.05]">
                            <div className="flex items-center gap-2 text-[11px] text-slate-500">
                              <span className="flex items-center gap-1 font-mono">
                                <Code className="w-3 h-3" />
                                {repo.language || 'Code'}
                              </span>
                              <span className="flex items-center gap-1">
                                <Star className="w-3 h-3 text-amber-400" />
                                {repo.stars}
                              </span>
                              <span className="flex items-center gap-1">
                                <GitFork className="w-3 h-3" />
                                {repo.forks}
                              </span>
                            </div>
                            <span className="text-xs text-blue-400 flex items-center gap-1 group-hover:gap-1.5 transition-all font-medium">
                              Open
                              <ArrowRight className="w-3 h-3" />
                            </span>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              </div>

              {/* Right: Execution Timeline */}
              <div className="space-y-3">
                <div className="flex items-center gap-2 mb-3">
                  <Clock className="w-4 h-4 text-slate-400" />
                  <h2 className="text-sm font-semibold text-white">Execution Timeline</h2>
                </div>

                <div className="glass-panel rounded-xl p-4">
                  {recentContributions.length === 0 ? (
                    <div className="py-8 text-center flex flex-col items-center gap-2 text-slate-600">
                      <GitPullRequest className="w-7 h-7" />
                      <p className="text-[12px] text-slate-500 leading-relaxed">
                        No agent runs yet.<br />Start solving an issue to see activity here.
                      </p>
                    </div>
                  ) : (
                    <div className="space-y-1">
                      {recentContributions.map((c, idx) => {
                        const isLast = idx === recentContributions.length - 1;
                        const dotColor =
                          c.status === 'completed' ? 'bg-emerald-400' :
                          c.status === 'failed'    ? 'bg-rose-400' :
                          c.status === 'running'   ? 'bg-blue-400 animate-pulse' :
                                                     'bg-slate-600';
                        const label = getStatusLabel(c.status, c.currentStage);
                        const repoName = c.repositoryId
                          ? `${c.repositoryId.owner}/${c.repositoryId.name}`
                          : 'Unknown repo';
                        const issueTitle = c.issueId?.title
                          ? `#${c.issueId.number} ${c.issueId.title}`
                          : 'Issue';

                        return (
                          <div
                            key={c._id}
                            className={`relative pl-5 pb-4 cursor-pointer group ${!isLast ? 'border-l border-white/[0.06] ml-[5px]' : 'ml-[5px]'}`}
                            onClick={() => navigate(`/contribution/${c._id}`)}
                          >
                            {/* Status dot */}
                            <div className={`absolute -left-[5px] top-1.5 w-2.5 h-2.5 rounded-full border-2 border-[#0a0e1a] flex-shrink-0 ${dotColor}`} />

                            <div className="group-hover:bg-white/[0.02] rounded-lg transition-all -mx-2 px-2 py-1">
                              <div className="flex items-start justify-between gap-2">
                                <h4 className="text-[13px] font-medium text-slate-200 group-hover:text-white transition-colors leading-snug">
                                  {label}
                                </h4>
                                <span className="text-[11px] text-slate-500 flex-shrink-0 mt-0.5">
                                  {timeAgo(c.updatedAt)}
                                </span>
                              </div>
                              <p className="text-[12px] text-slate-500 mt-0.5 leading-relaxed truncate">
                                {issueTitle}
                              </p>
                              <p className="text-[11px] text-slate-600 font-mono mt-0.5">
                                {repoName}
                              </p>
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  )}
                </div>
              </div>
            </div>
          </div>
        </main>
      </div>
    </div>
  );
}
