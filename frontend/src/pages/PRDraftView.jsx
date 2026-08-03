import { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useContributionStore } from '../store/useContributionStore.js';
import api from '../api/axios.js';
import PRDraftEditor from '../components/PRDraftEditor.jsx';
import CodeDiffViewer from '../components/CodeDiffViewer.jsx';
import { ArrowLeft, GitPullRequest, Code, FileText, CheckCircle, ExternalLink, Loader2 } from 'lucide-react';

export default function PRDraftView() {
  const { id: contributionId } = useParams();
  const navigate = useNavigate();
  const { currentContribution, currentDraft, fetchContribution, isLoading } = useContributionStore();
  const [submitting, setSubmitting] = useState(false);
  const [submittedPrDetails, setSubmittedPrDetails] = useState(null);
  const [error, setError] = useState('');

  useEffect(() => {
    fetchContribution(contributionId);
  }, [contributionId, fetchContribution]);

  const handleSubmitPR = async (formData) => {
    setSubmitting(true);
    setError('');
    try {
      await api.post('/github/submit-pr', { contributionId });
      await fetchContribution(contributionId);
      setSubmittedPrDetails({
        prUrl: currentDraft?.prUrl || `https://github.com/${currentContribution?.repositoryId?.fullName}/pulls`,
      });
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to submit PR to GitHub. Check if branch or repository has write access restrictions.');
    } finally {
      setSubmitting(false);
    }
  };

  if (isLoading && !currentDraft) {
    return (
      <div className="min-h-screen bg-[#0a0e1a] flex flex-col items-center justify-center text-slate-500 gap-3">
        <span className="w-7 h-7 rounded-full border-2 border-slate-700 border-t-blue-500 animate-spin" />
        <p className="text-sm">Loading PR draft...</p>
      </div>
    );
  }

  if (!currentDraft) {
    return (
      <div className="min-h-screen bg-[#0a0e1a] flex flex-col items-center justify-center text-slate-500 gap-3">
        <Loader2 className="w-7 h-7 text-rose-500 animate-spin" />
        <h2 className="font-semibold text-white">Draft Not Yet Ready</h2>
        <p className="text-sm">Generating logs — try refreshing if the pipeline has finished.</p>
        <button onClick={() => navigate(-1)} className="text-blue-400 text-sm hover:underline flex items-center gap-1 mt-1">
          <ArrowLeft className="w-3.5 h-3.5" /> Back
        </button>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#0a0e1a] text-slate-200 flex flex-col overflow-hidden" style={{ fontFamily: 'Inter, system-ui, sans-serif' }}>
      
      {/* Header */}
      <header className="border-b border-white/[0.05] px-5 py-3.5 flex items-center gap-3 flex-shrink-0" style={{ background: 'rgba(10, 14, 26, 0.9)', backdropFilter: 'blur(12px)' }}>
        <button
          onClick={() => navigate(`/contribution/${contributionId}`)}
          className="w-8 h-8 rounded-lg border border-white/[0.08] flex items-center justify-center text-slate-400 hover:text-white hover:bg-white/[0.06] transition-all"
        >
          <ArrowLeft className="w-4 h-4" />
        </button>
        <div>
          <p className="text-[11px] text-emerald-400 font-medium" style={{ letterSpacing: '0.04em' }}>PR RELEASE CANDIDATE</p>
          <h1 className="text-sm font-semibold text-white">Review & Publish Solution</h1>
        </div>
      </header>

      {/* Content */}
      <main className="flex-1 overflow-y-auto p-5" style={{ background: '#0a0e1a' }}>
        <div className="max-w-4xl mx-auto space-y-5">

          {/* Success Banner */}
          {(submittedPrDetails || currentDraft.status === 'submitted') && (
            <div className="rounded-xl border border-emerald-500/20 p-5 flex items-start gap-4" style={{ background: 'rgba(16,185,129,0.06)' }}>
              <div className="w-10 h-10 bg-emerald-500/15 border border-emerald-500/20 rounded-xl flex items-center justify-center flex-shrink-0">
                <CheckCircle className="w-5 h-5 text-emerald-400" />
              </div>
              <div>
                <h3 className="font-semibold text-white mb-0.5">Pull Request Submitted!</h3>
                <p className="text-[12px] text-slate-400">Your changes have been synced and the pull request is now live on GitHub.</p>
                <a
                  href={submittedPrDetails?.prUrl || currentDraft.prUrl}
                  target="_blank"
                  rel="noreferrer"
                  className="inline-flex items-center gap-1.5 text-[12px] text-emerald-400 hover:text-emerald-300 font-medium mt-2 hover:underline"
                >
                  View on GitHub <ExternalLink className="w-3.5 h-3.5" />
                </a>
              </div>
            </div>
          )}

          {/* Error message */}
          {error && (
            <div className="bg-rose-500/8 border border-rose-500/20 rounded-xl p-4 text-[12px] font-mono text-rose-400">
              Error: {error}
            </div>
          )}

          {/* PR Composer */}
          <PRDraftEditor
            initialTitle={currentDraft.title}
            initialBody={currentDraft.body}
            initialLabels={currentDraft.labels}
            onSubmit={handleSubmitPR}
            loading={submitting}
          />

          {/* Code Diffs */}
          <div>
            <div className="flex items-center gap-2 mb-3">
              <Code className="w-4 h-4 text-blue-400" />
              <h2 className="text-sm font-semibold text-white">Proposed Code Changes</h2>
            </div>
            <CodeDiffViewer diffs={currentDraft.codeDiffs} />
          </div>

          {/* Generated Tests */}
          {currentDraft.testFiles && currentDraft.testFiles.length > 0 && (
            <div>
              <div className="flex items-center gap-2 mb-3">
                <FileText className="w-4 h-4 text-blue-400" />
                <h2 className="text-sm font-semibold text-white">Generated Test Files</h2>
              </div>
              <div className="space-y-3">
                {currentDraft.testFiles.map((file, idx) => (
                  <div key={idx} className="terminal-window overflow-hidden">
                    {/* Terminal tab bar */}
                    <div className="px-4 py-2.5 border-b border-white/[0.07] flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <div className="flex gap-1">
                          <div className="w-2.5 h-2.5 rounded-full bg-rose-500/60" />
                          <div className="w-2.5 h-2.5 rounded-full bg-amber-500/60" />
                          <div className="w-2.5 h-2.5 rounded-full bg-emerald-500/60" />
                        </div>
                        <span className="font-mono text-[12px] text-blue-300 font-medium ml-2">{file.filePath}</span>
                      </div>
                      <span className="text-[10px] bg-white/[0.05] border border-white/[0.08] px-2 py-0.5 rounded-md text-slate-400 font-medium">
                        {file.testFramework || 'jest'}
                      </span>
                    </div>
                    <pre className="p-4 overflow-auto font-mono text-[11px] text-slate-300 leading-relaxed max-h-[320px]" style={{ fontFamily: "'JetBrains Mono', monospace" }}>
                      <code>{file.content}</code>
                    </pre>
                  </div>
                ))}
              </div>
            </div>
          )}

        </div>
      </main>
    </div>
  );
}
