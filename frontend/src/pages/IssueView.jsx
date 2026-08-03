import { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useRepoStore } from '../store/useRepoStore.js';
import { useContributionStore } from '../store/useContributionStore.js';
import ContributionScore from '../components/ContributionScore.jsx';
import { 
  ArrowLeft, Play, Sparkles, MessageSquare, AlertCircle, 
  Lightbulb, User, Calendar, Tag, HelpCircle
} from 'lucide-react';

export default function IssueView() {
  const { issueId } = useParams();
  const navigate = useNavigate();
  const { issues, currentRepo } = useRepoStore();
  const { startContribution, isLoading: starting } = useContributionStore();
  
  const [issue, setIssue] = useState(null);
  const [error, setError] = useState('');

  useEffect(() => {
    const found = issues.find((i) => i._id === issueId);
    if (found) {
      setIssue(found);
    } else {
      setError('Issue details not loaded in store. Try going back to the repository view.');
    }
  }, [issueId, issues]);

  const handleStartSolver = async () => {
    if (!issue || starting) return;
    setError('');
    try {
      const contributionId = await startContribution(issue.repositoryId, issue._id);
      navigate(`/contribution/${contributionId}`);
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to start AI solver pipeline.');
    }
  };

  if (error && !issue) {
    return (
      <div className="min-h-screen bg-[#0a0e1a] flex flex-col items-center justify-center text-slate-500 gap-3">
        <AlertCircle className="w-8 h-8 text-rose-500" />
        <h2 className="font-semibold text-white">Error Loading Issue</h2>
        <p className="text-sm">{error}</p>
        <button onClick={() => navigate(-1)} className="text-blue-400 text-sm hover:underline flex items-center gap-1">
          <ArrowLeft className="w-3.5 h-3.5" /> Back
        </button>
      </div>
    );
  }

  if (!issue) {
    return (
      <div className="min-h-screen bg-[#0a0e1a] flex flex-col items-center justify-center text-slate-500 gap-3">
        <span className="w-7 h-7 rounded-full border-2 border-slate-700 border-t-blue-500 animate-spin" />
        <p className="text-sm">Loading issue...</p>
      </div>
    );
  }

  const getDifficultyClass = (diff) => {
    if (diff === 'Easy') return 'badge-easy';
    if (diff === 'Hard') return 'badge-hard';
    return 'badge-medium';
  };

  return (
    <div className="min-h-screen bg-[#0a0e1a] text-slate-200 flex flex-col overflow-hidden" style={{ fontFamily: 'Inter, system-ui, sans-serif' }}>

      {/* Header */}
      <header className="border-b border-white/[0.05] px-5 py-3.5 flex items-center gap-3 flex-shrink-0" style={{ background: 'rgba(10, 14, 26, 0.9)', backdropFilter: 'blur(12px)' }}>
        <button
          onClick={() => navigate(-1)}
          className="w-8 h-8 rounded-lg border border-white/[0.08] flex items-center justify-center text-slate-400 hover:text-white hover:bg-white/[0.06] transition-all flex-shrink-0"
        >
          <ArrowLeft className="w-4 h-4" />
        </button>
        <div>
          <p className="text-[11px] text-blue-400 font-medium" style={{ letterSpacing: '0.04em' }}>ISSUE WORKBENCH</p>
          <h1 className="text-sm font-semibold text-white leading-snug">
            #{issue.number}: {issue.title}
          </h1>
        </div>
      </header>

      {/* Content */}
      <main className="flex-1 overflow-y-auto p-5" style={{ background: '#0a0e1a' }}>
        <div className="max-w-6xl mx-auto space-y-5">

          {/* Readiness Score */}
          <ContributionScore score={issue.readinessScore} breakdown={issue.scoreBreakdown} />

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-5 items-start">

            {/* Left: Main content */}
            <div className="lg:col-span-2 space-y-4">

              {/* Start Solver Banner */}
              <div className="relative rounded-xl border border-blue-500/20 overflow-hidden p-5 flex flex-col md:flex-row md:items-center justify-between gap-4" style={{ background: 'linear-gradient(135deg, rgba(37,99,235,0.1) 0%, rgba(17,24,39,0.8) 100%)' }}>
                <div className="absolute top-0 right-0 w-40 h-40 rounded-full pointer-events-none" style={{ background: 'radial-gradient(circle, rgba(59,130,246,0.08) 0%, transparent 70%)' }} />
                <div className="relative">
                  <div className="flex items-center gap-2 mb-1.5">
                    <Sparkles className="w-4 h-4 text-blue-400" />
                    <h3 className="text-sm font-semibold text-white">Autonomous Code Resolver</h3>
                  </div>
                  <p className="text-[12px] text-slate-400 leading-relaxed max-w-xl">
                    Trigger a collaborative run of 7 LangGraph agents. The system will retrieve context from the codebase RAG index, write changes, check compliance, sign off commits, and compose the final PR.
                  </p>
                </div>
                <button
                  onClick={handleStartSolver}
                  disabled={starting}
                  className="btn-primary flex-shrink-0"
                >
                  <Play className="w-3.5 h-3.5 fill-current" />
                  {starting ? 'Initializing...' : 'Start AI Agent'}
                </button>
              </div>

              {error && (
                <div className="text-rose-400 bg-rose-500/8 border border-rose-500/20 rounded-xl p-4 text-[12px] font-mono">
                  Error: {error}
                </div>
              )}

              {/* Issue Description */}
              <div className="glass-panel rounded-xl border border-white/[0.06] overflow-hidden">
                <div className="px-5 py-3.5 border-b border-white/[0.05] flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <AlertCircle className="w-4 h-4 text-blue-400" />
                    <h4 className="text-sm font-semibold text-white">Issue Description</h4>
                  </div>
                  <span className="text-[11px] text-slate-500 font-medium">Markdown source</span>
                </div>
                <div className="p-5 text-[13px] text-slate-300 leading-relaxed whitespace-pre-wrap max-h-[450px] overflow-y-auto">
                  {issue.body || <span className="text-slate-500 italic">No description provided.</span>}
                </div>
              </div>
            </div>

            {/* Right: Sidebar */}
            <div className="space-y-4">

              {/* Properties */}
              <div className="glass-panel rounded-xl border border-white/[0.06] p-4">
                <h4 className="section-label mb-3">Issue Properties</h4>
                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <span className="text-[12px] text-slate-400 flex items-center gap-2">
                      <User className="w-3.5 h-3.5 text-slate-500" /> Author
                    </span>
                    <span className="text-[12px] text-slate-200 font-mono font-medium">@{issue.createdByLogin}</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-[12px] text-slate-400 flex items-center gap-2">
                      <Calendar className="w-3.5 h-3.5 text-slate-500" /> Created
                    </span>
                    <span className="text-[12px] text-slate-200">{new Date(issue.githubCreatedAt).toLocaleDateString()}</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-[12px] text-slate-400 flex items-center gap-2">
                      <MessageSquare className="w-3.5 h-3.5 text-slate-500" /> Comments
                    </span>
                    <span className="text-[12px] text-slate-200 font-semibold">{issue.commentCount}</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-[12px] text-slate-400 flex items-center gap-2">
                      <Tag className="w-3.5 h-3.5 text-slate-500" /> Complexity
                    </span>
                    <span className={getDifficultyClass(issue.difficulty)}>{issue.difficulty}</span>
                  </div>
                </div>
              </div>

              {/* Solver Advice */}
              {issue.advice && (
                <div className="glass-panel rounded-xl border border-white/[0.06] border-t-2 border-t-blue-500/40 p-4">
                  <h4 className="section-label flex items-center gap-1.5 mb-3">
                    <Lightbulb className="w-3.5 h-3.5 text-amber-400" /> Solver Advice
                  </h4>
                  <p className="text-[12px] text-slate-300 leading-relaxed">{issue.advice}</p>
                </div>
              )}

              {/* Key Hints */}
              {issue.hints && issue.hints.length > 0 && (
                <div className="glass-panel rounded-xl border border-white/[0.06] border-t-2 border-t-amber-500/30 p-4">
                  <h4 className="section-label flex items-center gap-1.5 mb-3">
                    <HelpCircle className="w-3.5 h-3.5 text-amber-400" /> Key Hints
                  </h4>
                  <ul className="space-y-2 text-[12px] text-slate-300 leading-relaxed list-decimal pl-4">
                    {issue.hints.map((hint, idx) => (
                      <li key={idx}>{hint}</li>
                    ))}
                  </ul>
                </div>
              )}
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}
