import { useState } from 'react';
import { MessageSquare, AlertCircle, Calendar, Sparkles, Filter } from 'lucide-react';

export default function IssueList({ issues, onSelect }) {
  const [selectedLabel, setSelectedLabel] = useState('');

  const allLabels = Array.from(
    new Set(issues.flatMap((i) => i.labels || []))
  );

  const filteredIssues = selectedLabel
    ? issues.filter((i) => (i.labels || []).includes(selectedLabel))
    : issues;

  const getDifficultyClass = (diff) => {
    if (diff === 'Easy') return 'badge-easy';
    if (diff === 'Hard') return 'badge-hard';
    return 'badge-medium';
  };

  const getScoreColor = (score) => {
    if (score >= 75) return { bar: 'bg-emerald-500', text: 'text-emerald-400', badge: 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20', label: 'High Readiness' };
    if (score >= 45) return { bar: 'bg-amber-500', text: 'text-amber-400', badge: 'bg-amber-500/10 text-amber-400 border border-amber-500/20', label: 'Moderate' };
    return { bar: 'bg-rose-500', text: 'text-rose-400', badge: 'bg-rose-500/10 text-rose-400 border border-rose-500/20', label: 'Complex' };
  };

  return (
    <div className="glass-panel rounded-xl overflow-hidden border border-white/[0.06]">
      {/* Header */}
      <div className="px-5 py-4 border-b border-white/[0.05] flex items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 mb-0.5">
            <Sparkles className="w-4 h-4 text-blue-400" />
            <h3 className="text-sm font-semibold text-white">Open Issues</h3>
            <span className="text-[11px] bg-white/[0.05] text-slate-400 px-2 py-0.5 rounded-md font-medium">
              {filteredIssues.length}
            </span>
          </div>
          <p className="text-[12px] text-slate-500">Sorted by AI readiness score</p>
        </div>

        {allLabels.length > 0 && (
          <div className="flex items-center gap-2">
            <Filter className="w-3.5 h-3.5 text-slate-500" />
            <select
              value={selectedLabel}
              onChange={(e) => setSelectedLabel(e.target.value)}
              className="bg-white/[0.04] border border-white/[0.08] text-slate-300 text-[12px] rounded-lg px-2.5 py-1.5 focus:outline-none focus:border-blue-500/50 transition-colors"
            >
              <option value="" className="bg-[#0f172a] text-slate-200">All Labels</option>
              {allLabels.map((lbl) => (
                <option key={lbl} value={lbl} className="bg-[#0f172a] text-slate-200">{lbl}</option>
              ))}
            </select>
          </div>
        )}
      </div>

      {filteredIssues.length === 0 ? (
        <div className="py-16 text-center text-slate-500 flex flex-col items-center gap-3">
          <AlertCircle className="w-7 h-7 text-slate-600" />
          <p className="text-sm">No issues match the selected label.</p>
        </div>
      ) : (
        <div className="divide-y divide-white/[0.04]">
          {filteredIssues.map((issue) => {
            const scoreColors = getScoreColor(issue.readinessScore);
            return (
              <div
                key={issue._id}
                onClick={() => onSelect && onSelect(issue)}
                className="px-5 py-4 hover:bg-white/[0.02] transition-colors cursor-pointer flex items-start justify-between gap-4 group"
              >
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-1.5">
                    <span className="text-[12px] text-slate-500 font-mono font-medium">#{issue.number}</span>
                    <h4 className="text-sm font-medium text-slate-200 group-hover:text-blue-300 transition-colors truncate">
                      {issue.title}
                    </h4>
                  </div>

                  <div className="flex flex-wrap items-center gap-3 text-[11px] text-slate-500 mb-2.5">
                    <span className="flex items-center gap-1">
                      <Calendar className="w-3 h-3" />
                      {new Date(issue.githubCreatedAt).toLocaleDateString()}
                    </span>
                    <span className="flex items-center gap-1">
                      <MessageSquare className="w-3 h-3" />
                      {issue.commentCount} comments
                    </span>
                    <span>by @{issue.createdByLogin}</span>
                    <span className={getDifficultyClass(issue.difficulty)}>{issue.difficulty}</span>
                  </div>

                  {issue.labels && issue.labels.length > 0 && (
                    <div className="flex flex-wrap gap-1.5">
                      {issue.labels.map((lbl) => (
                        <span key={lbl} className="text-[11px] text-slate-400 bg-white/[0.04] border border-white/[0.07] px-2 py-0.5 rounded-md">
                          {lbl}
                        </span>
                      ))}
                    </div>
                  )}
                </div>

                {/* Readiness Score */}
                <div className="flex flex-col items-end gap-2 flex-shrink-0">
                  <div className="flex items-center gap-2">
                    <div className="w-20 bg-white/[0.05] h-1.5 rounded-full overflow-hidden hidden sm:block">
                      <div
                        className={`h-full rounded-full ${scoreColors.bar} transition-all duration-700`}
                        style={{ width: `${issue.readinessScore}%` }}
                      />
                    </div>
                    <span className={`text-sm font-semibold ${scoreColors.text}`}>{issue.readinessScore}%</span>
                  </div>
                  <span className={`text-[10px] font-medium px-2 py-0.5 rounded-md ${scoreColors.badge}`}>
                    {scoreColors.label}
                  </span>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
