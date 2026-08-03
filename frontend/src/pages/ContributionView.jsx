import { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useContributionStore } from '../store/useContributionStore.js';
import AgentPipeline from '../components/AgentPipeline.jsx';
import { ArrowLeft, Loader2, GitPullRequest, AlertTriangle, CheckCircle, Terminal } from 'lucide-react';

export default function ContributionView() {
  const { id: contributionId } = useParams();
  const navigate = useNavigate();
  const { pipelineStages, streamContribution, currentContribution, fetchContribution } = useContributionStore();
  
  const [expandedStageId, setExpandedStageId] = useState('issueScout');
  const [consoleLogs, setConsoleLogs] = useState([]);

  useEffect(() => {
    fetchContribution(contributionId);

    const unsubscribe = streamContribution(contributionId, (stage, output) => {
      setConsoleLogs((prev) => [
        ...prev,
        { time: new Date().toLocaleTimeString(), type: 'success', text: `Completed: ${stage}` },
      ]);
      setExpandedStageId(stage);
    });

    setConsoleLogs([
      { time: new Date().toLocaleTimeString(), type: 'system', text: 'Spawning Python LangGraph subprocess...' },
      { time: new Date().toLocaleTimeString(), type: 'system', text: 'Initializing StateGraph (PipelineState)...' },
    ]);

    return () => { unsubscribe(); };
  }, [contributionId, fetchContribution, streamContribution]);

  const isCompleted = Object.values(pipelineStages).every((s) => s.status === 'completed');
  const isFailed = Object.values(pipelineStages).some((s) => s.status === 'failed');

  const getStatusText = () => {
    if (isCompleted) return 'AI Resolution Run Completed';
    if (isFailed) return 'Pipeline Halted';
    return 'Agents executing...';
  };

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
            <p className="text-[11px] text-blue-400 font-medium" style={{ letterSpacing: '0.04em' }}>AGENT PIPELINE</p>
            <h1 className="text-sm font-semibold text-white">
              Run #{contributionId.substring(18)}
            </h1>
          </div>
        </div>

        {isCompleted && (
          <button
            onClick={() => navigate(`/pr-draft/${contributionId}`)}
            className="btn-primary"
            style={{ background: '#059669' }}
          >
            <GitPullRequest className="w-3.5 h-3.5" />
            View PR Draft
          </button>
        )}
      </header>

      {/* Content */}
      <main className="flex-1 overflow-y-auto p-5" style={{ background: '#0a0e1a' }}>
        <div className="max-w-6xl mx-auto grid grid-cols-1 lg:grid-cols-3 gap-5 items-start">

          {/* Pipeline Stepper */}
          <div className="lg:col-span-2">
            <div className="glass-panel rounded-xl border border-white/[0.06] p-5">
              <div className="flex items-center gap-2.5 mb-5">
                {!isCompleted && !isFailed && <Loader2 className="w-4 h-4 animate-spin text-blue-400" />}
                {isCompleted && <CheckCircle className="w-4 h-4 text-emerald-400" />}
                {isFailed && <AlertTriangle className="w-4 h-4 text-rose-400" />}
                <h2 className="text-sm font-semibold text-white">{getStatusText()}</h2>
              </div>

              <AgentPipeline
                stages={pipelineStages}
                expandedStageId={expandedStageId}
                setExpandedStageId={setExpandedStageId}
              />
            </div>
          </div>

          {/* Console Log */}
          <div className="lg:col-span-1">
            <div className="terminal-window overflow-hidden flex flex-col" style={{ height: '500px' }}>
              {/* Terminal header bar */}
              <div className="px-4 py-3 border-b border-white/[0.07] flex items-center gap-2">
                <div className="flex gap-1.5">
                  <div className="w-2.5 h-2.5 rounded-full bg-rose-500/60" />
                  <div className="w-2.5 h-2.5 rounded-full bg-amber-500/60" />
                  <div className="w-2.5 h-2.5 rounded-full bg-emerald-500/60" />
                </div>
                <div className="flex-1 flex items-center justify-center gap-1.5 text-[11px] text-slate-500">
                  <Terminal className="w-3.5 h-3.5" />
                  <span>Live Agent Console</span>
                </div>
              </div>

              {/* Log output */}
              <div className="flex-1 overflow-y-auto p-3 space-y-2 font-mono text-[11px]">
                {consoleLogs.map((log, lIdx) => {
                  const isSuccess = log.type === 'success';
                  return (
                    <div key={lIdx} className="flex gap-2 items-start">
                      <span className="text-slate-600 flex-shrink-0 select-none">{log.time}</span>
                      <span className={`px-1.5 py-0.5 rounded text-[9px] font-semibold flex-shrink-0 ${
                        isSuccess
                          ? 'bg-emerald-500/10 text-emerald-400'
                          : 'bg-blue-500/10 text-blue-400'
                      }`}>
                        {log.type}
                      </span>
                      <span className={isSuccess ? 'text-slate-200' : 'text-slate-400'}>{log.text}</span>
                    </div>
                  );
                })}

                {!isCompleted && !isFailed && (
                  <div className="flex items-center gap-1.5 text-blue-400 animate-pulse">
                    <span className="w-1.5 h-1.5 rounded-full bg-blue-500" />
                    <span>Waiting for LangGraph states...</span>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}
