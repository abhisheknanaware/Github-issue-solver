import { 
  CheckCircle2, XCircle, AlertCircle, Loader2, PlayCircle, 
  ChevronDown, ChevronUp
} from 'lucide-react';

const STAGE_CONFIGS = [
  { id: 'issueScout', name: 'Issue Scout', desc: 'Evaluates beginner-friendliness and triages complexity' },
  { id: 'codeAnalysis', name: 'Codebase Analysis', desc: 'Identifies relevant files and semantic entrypoints' },
  { id: 'planner', name: 'Plan Generator', desc: 'Formulates a logical step-by-step code plan' },
  { id: 'coder', name: 'Code Generation', desc: 'Generates precise original-to-modified diff blocks' },
  { id: 'testGenerator', name: 'Test Suite Creator', desc: 'Drafts unit and integration tests' },
  { id: 'documentation', name: 'Documentation Writer', desc: 'Generates code comments and README adjustments' },
  { id: 'prDraft', name: 'PR Composer', desc: 'Writes the pull request details and branch naming' },
];

export default function AgentPipeline({ stages, expandedStageId, setExpandedStageId }) {
  
  const getStatusIcon = (status) => {
    switch (status) {
      case 'completed':
        return <CheckCircle2 className="w-5 h-5 text-emerald-400 flex-shrink-0" />;
      case 'failed':
        return <XCircle className="w-5 h-5 text-rose-400 flex-shrink-0" />;
      case 'running':
        return <Loader2 className="w-5 h-5 text-blue-400 animate-spin flex-shrink-0" />;
      default:
        return (
          <div className="w-5 h-5 rounded-full border-2 border-white/[0.12] flex-shrink-0" />
        );
    }
  };

  const getStatusBadge = (status) => {
    switch (status) {
      case 'completed': return 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20';
      case 'failed': return 'bg-rose-500/10 text-rose-400 border border-rose-500/20';
      case 'running': return 'bg-blue-500/10 text-blue-400 border border-blue-500/20';
      default: return 'bg-white/[0.04] text-slate-500 border border-white/[0.07]';
    }
  };

  const getRowBg = (status) => {
    switch (status) {
      case 'completed': return 'border-emerald-500/15 bg-emerald-500/[0.02]';
      case 'failed': return 'border-rose-500/20 bg-rose-500/[0.03]';
      case 'running': return 'border-blue-500/25 bg-blue-500/[0.04]';
      default: return 'border-white/[0.06] bg-transparent';
    }
  };

  return (
    <div className="space-y-2.5">
      {STAGE_CONFIGS.map((stage, idx) => {
        const stageState = stages[stage.id] || { status: 'pending', output: null, error: null };
        const isExpanded = expandedStageId === stage.id;
        const isClickable = stageState.status === 'completed' || stageState.status === 'failed';

        return (
          <div
            key={stage.id}
            className={`border rounded-xl transition-all duration-200 ${getRowBg(stageState.status)}`}
          >
            {/* Stage Header */}
            <div
              onClick={() => isClickable && setExpandedStageId(isExpanded ? null : stage.id)}
              className={`px-4 py-3.5 flex items-center gap-3 select-none ${isClickable ? 'cursor-pointer hover:bg-white/[0.02]' : ''}`}
            >
              {/* Status icon with connector */}
              <div className="relative flex flex-col items-center flex-shrink-0">
                {getStatusIcon(stageState.status)}
                {idx < STAGE_CONFIGS.length - 1 && (
                  <div className={`absolute top-6 w-px h-8 ${
                    stageState.status === 'completed' ? 'bg-emerald-500/25' : 'bg-white/[0.06]'
                  }`} />
                )}
              </div>

              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 mb-0.5">
                  <h4 className="text-[13px] font-semibold text-white">{stage.name}</h4>
                  <span className={`text-[10px] font-medium px-1.5 py-0.5 rounded-md ${getStatusBadge(stageState.status)}`}>
                    {stageState.status}
                  </span>
                </div>
                <p className="text-[12px] text-slate-500">{stage.desc}</p>
              </div>

              {isClickable && (
                <div className="text-slate-500 hover:text-slate-300 transition-colors flex-shrink-0">
                  {isExpanded ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
                </div>
              )}
            </div>

            {/* Expanded Output */}
            {isExpanded && isClickable && (
              <div className="px-4 pb-4 pt-1 border-t border-white/[0.05]">

                {stageState.status === 'failed' && (
                  <div className="flex items-start gap-2.5 bg-rose-500/8 border border-rose-500/20 rounded-lg p-3.5 text-rose-300">
                    <AlertCircle className="w-4 h-4 flex-shrink-0 mt-0.5 text-rose-400" />
                    <div>
                      <h5 className="text-[12px] font-semibold text-rose-300 mb-1">Agent execution fault</h5>
                      <p className="font-mono text-[11px] whitespace-pre-wrap leading-relaxed text-rose-400/80">{stageState.error}</p>
                    </div>
                  </div>
                )}

                {stageState.status === 'completed' && stageState.output && (
                  <div className="text-slate-300 space-y-3 mt-1">

                    {stage.id === 'issueScout' && (
                      <div className="space-y-3">
                        <div className="flex gap-4 bg-white/[0.03] border border-white/[0.07] rounded-lg p-4">
                          <div className="flex flex-col items-center justify-center px-4 bg-emerald-500/8 border border-emerald-500/15 rounded-lg flex-shrink-0 min-w-[90px] text-center">
                            <span className="section-label mb-1">Readiness</span>
                            <span className="text-2xl font-bold text-white">{stageState.output.score}<span className="text-sm text-slate-500">/10</span></span>
                          </div>
                          <div>
                            <p className="section-label mb-1.5">Reasoning</p>
                            <p className="text-[12px] text-slate-300 leading-relaxed">{stageState.output.reasoning}</p>
                          </div>
                        </div>
                        <div>
                          <p className="section-label mb-1.5">Advice</p>
                          <div className="bg-white/[0.03] border border-white/[0.07] rounded-lg p-3.5 text-[12px] text-slate-300 leading-relaxed">{stageState.output.advice}</div>
                        </div>
                      </div>
                    )}

                    {stage.id === 'codeAnalysis' && (
                      <div className="space-y-3">
                        <div>
                          <p className="section-label mb-1.5">Patch Strategy</p>
                          <p className="bg-white/[0.03] border border-white/[0.07] rounded-lg p-3.5 text-[12px] text-slate-300 leading-relaxed">{stageState.output.summary}</p>
                        </div>
                        {stageState.output.relevantFiles?.length > 0 && (
                          <div>
                            <p className="section-label mb-1.5">Target Files</p>
                            <div className="flex flex-wrap gap-1.5">
                              {stageState.output.relevantFiles.map((f) => (
                                <span key={f} className="font-mono text-[11px] text-blue-300 bg-blue-500/8 border border-blue-500/20 px-2 py-1 rounded-md">{f}</span>
                              ))}
                            </div>
                          </div>
                        )}
                      </div>
                    )}

                    {stage.id === 'planner' && (
                      <div>
                        <p className="section-label mb-2">Step Checklist</p>
                        <div className="space-y-2">
                          {stageState.output.map((step, sIdx) => (
                            <div key={sIdx} className="bg-white/[0.03] border border-white/[0.07] rounded-lg p-3.5 flex gap-3">
                              <span className="text-[12px] font-bold text-blue-400 bg-blue-500/10 border border-blue-500/20 w-6 h-6 rounded-md flex items-center justify-center flex-shrink-0 mt-0.5">
                                {step.stepNumber}
                              </span>
                              <div>
                                <h5 className="text-[12px] font-semibold text-white font-mono mb-1">{step.filePath}</h5>
                                <p className="text-[12px] text-slate-400 leading-relaxed">{step.description}</p>
                                <div className="flex gap-2 mt-2">
                                  <span className="text-[10px] text-slate-500 bg-white/[0.04] px-2 py-0.5 rounded font-medium">Action: {step.action}</span>
                                  <span className="text-[10px] text-slate-500 bg-white/[0.04] px-2 py-0.5 rounded font-medium">Est: {step.estimatedLines} lines</span>
                                </div>
                              </div>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}

                    {stage.id === 'coder' && (
                      <div>
                        <p className="section-label mb-2">Generated Patches</p>
                        <div className="space-y-2">
                          {stageState.output.map((diff, dIdx) => (
                            <div key={dIdx} className="terminal-window overflow-hidden">
                              <div className="px-4 py-2.5 border-b border-white/[0.07] flex items-center justify-between">
                                <span className="font-mono text-[12px] text-blue-300 font-medium">{diff.filePath}</span>
                                <span className="text-[10px] text-slate-500 bg-white/[0.05] border border-white/[0.07] px-2 py-0.5 rounded font-medium">Patch</span>
                              </div>
                              <p className="p-4 text-[11px] text-slate-400 leading-relaxed font-mono whitespace-pre-wrap">{diff.explanation}</p>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}

                    {stage.id === 'testGenerator' && (
                      <div>
                        <p className="section-label mb-2">Test Suites</p>
                        <div className="space-y-1.5">
                          {stageState.output.map((test, tIdx) => (
                            <div key={tIdx} className="bg-white/[0.03] border border-white/[0.07] rounded-lg px-4 py-3 flex items-center justify-between">
                              <span className="font-mono text-[12px] text-blue-300 font-medium">{test.filePath}</span>
                              <span className="text-[11px] bg-white/[0.05] text-slate-400 px-2 py-0.5 rounded-md font-medium">{test.testFramework}</span>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}

                    {stage.id === 'documentation' && (
                      <div>
                        <p className="section-label mb-2">Documentation Changes</p>
                        <div className="terminal-window overflow-hidden">
                          <div className="px-4 py-2.5 border-b border-white/[0.07] flex items-center justify-between">
                            <span className="text-[12px] text-slate-400 font-mono">README.md / Source comments</span>
                            <span className="text-[10px] text-emerald-400 font-medium">Docs</span>
                          </div>
                          <div className="text-[11px] text-slate-300 font-mono leading-relaxed whitespace-pre-wrap p-4 max-h-[200px] overflow-y-auto">
                            {stageState.output.readmeSection}
                          </div>
                        </div>
                      </div>
                    )}

                    {stage.id === 'prDraft' && (
                      <div>
                        <p className="section-label mb-2">PR Properties</p>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                          <div className="bg-white/[0.03] border border-white/[0.07] rounded-lg p-3.5">
                            <p className="section-label mb-1">Branch</p>
                            <span className="font-mono text-[12px] text-emerald-400 font-medium">{stageState.output.branchName}</span>
                          </div>
                          <div className="bg-white/[0.03] border border-white/[0.07] rounded-lg p-3.5">
                            <p className="section-label mb-1">PR Title</p>
                            <span className="text-[12px] text-slate-200 font-medium">{stageState.output.title}</span>
                          </div>
                        </div>
                      </div>
                    )}
                  </div>
                )}
              </div>
            )}
          </div>
        );
      })}
    </div>
  );
}
