import { useState } from 'react';
import { FileEdit, Eye, Plus, X, GitPullRequest, Loader2 } from 'lucide-react';

export default function PRDraftEditor({ initialTitle, initialBody, initialLabels = [], onSubmit, loading }) {
  const [title, setTitle] = useState(initialTitle || '');
  const [body, setBody] = useState(initialBody || '');
  const [labels, setLabels] = useState(initialLabels || []);
  const [newLabelInput, setNewLabelInput] = useState('');
  const [activeTab, setActiveTab] = useState('edit');

  const handleAddLabel = (e) => {
    e.preventDefault();
    const cleanLabel = newLabelInput.trim();
    if (cleanLabel && !labels.includes(cleanLabel)) {
      setLabels((prev) => [...prev, cleanLabel]);
      setNewLabelInput('');
    }
  };

  const handleRemoveLabel = (labelToRemove) => {
    setLabels((prev) => prev.filter((l) => l !== labelToRemove));
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    if (onSubmit) onSubmit({ title, body, labels });
  };

  return (
    <div className="glass-panel rounded-xl border border-white/[0.06] overflow-hidden">
      {/* Header */}
      <div className="px-5 py-3.5 border-b border-white/[0.05] flex items-center justify-between gap-3" style={{ background: 'rgba(17,24,39,0.5)' }}>
        <div className="flex items-center gap-2">
          <GitPullRequest className="w-4 h-4 text-blue-400" />
          <h3 className="text-sm font-semibold text-white">Pull Request Composer</h3>
        </div>

        {/* Edit / Preview toggle */}
        <div className="flex bg-white/[0.04] border border-white/[0.07] p-0.5 rounded-lg gap-0.5">
          {[
            { id: 'edit', icon: FileEdit, label: 'Edit' },
            { id: 'preview', icon: Eye, label: 'Preview' },
          ].map(tab => {
            const Icon = tab.icon;
            return (
              <button
                key={tab.id}
                type="button"
                onClick={() => setActiveTab(tab.id)}
                className={`flex items-center gap-1.5 px-3 py-1.5 rounded-md text-[12px] font-medium transition-all ${
                  activeTab === tab.id
                    ? 'bg-blue-600 text-white shadow-sm'
                    : 'text-slate-400 hover:text-slate-200'
                }`}
              >
                <Icon className="w-3.5 h-3.5" />
                {tab.label}
              </button>
            );
          })}
        </div>
      </div>

      <form onSubmit={handleSubmit} className="p-5 space-y-4">
        {activeTab === 'edit' ? (
          <div className="space-y-4">
            {/* Title */}
            <div>
              <label className="section-label block mb-1.5">PR Title</label>
              <input
                type="text"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                required
                placeholder="feat: add user authentication flow"
                className="input-base"
              />
            </div>

            {/* Description */}
            <div>
              <label className="section-label block mb-1.5">Description (Markdown)</label>
              <textarea
                value={body}
                onChange={(e) => setBody(e.target.value)}
                required
                rows={10}
                placeholder="## Summary&#10;&#10;Describe what this PR does..."
                className="input-base font-mono resize-y"
                style={{ fontFamily: "'JetBrains Mono', monospace", fontSize: '12px' }}
              />
            </div>

            {/* Labels */}
            <div>
              <label className="section-label block mb-2">Labels</label>
              <div className="flex flex-wrap gap-1.5 mb-2.5">
                {labels.map((lbl) => (
                  <span
                    key={lbl}
                    className="inline-flex items-center gap-1.5 text-[12px] text-slate-300 bg-white/[0.05] border border-white/[0.08] px-2.5 py-1 rounded-md"
                  >
                    {lbl}
                    <button
                      type="button"
                      onClick={() => handleRemoveLabel(lbl)}
                      className="hover:text-rose-400 text-slate-500 transition-colors flex-shrink-0"
                    >
                      <X className="w-3 h-3" />
                    </button>
                  </span>
                ))}
              </div>
              <div className="flex gap-2 max-w-xs">
                <input
                  type="text"
                  placeholder="Add a label..."
                  value={newLabelInput}
                  onChange={(e) => setNewLabelInput(e.target.value)}
                  onKeyDown={(e) => e.key === 'Enter' && handleAddLabel(e)}
                  className="input-base text-[12px] py-2"
                />
                <button
                  type="button"
                  onClick={handleAddLabel}
                  className="btn-secondary px-3 py-2 flex-shrink-0"
                >
                  <Plus className="w-4 h-4" />
                </button>
              </div>
            </div>
          </div>
        ) : (
          <div className="space-y-5">
            {/* Title Preview */}
            <div>
              <p className="section-label mb-1.5">Title</p>
              <h2 className="text-base font-semibold text-white">{title || 'Untitled PR'}</h2>
            </div>

            {/* Body Preview */}
            <div className="border-t border-white/[0.05] pt-4">
              <p className="section-label mb-2">Description</p>
              <div className="bg-white/[0.02] border border-white/[0.06] rounded-xl p-4 text-[13px] text-slate-300 leading-relaxed whitespace-pre-wrap max-h-[350px] overflow-auto font-mono" style={{ fontSize: '12px' }}>
                {body || <span className="italic text-slate-500">No description provided.</span>}
              </div>
            </div>

            {/* Labels Preview */}
            {labels.length > 0 && (
              <div className="border-t border-white/[0.05] pt-4">
                <p className="section-label mb-2">Labels</p>
                <div className="flex flex-wrap gap-1.5">
                  {labels.map((lbl) => (
                    <span
                      key={lbl}
                      className="text-[12px] text-slate-300 bg-white/[0.05] border border-white/[0.08] px-2.5 py-1 rounded-md"
                    >
                      {lbl}
                    </span>
                  ))}
                </div>
              </div>
            )}
          </div>
        )}

        {/* Submit */}
        <div className="border-t border-white/[0.05] pt-4 flex justify-end">
          <button
            type="submit"
            disabled={loading}
            className="btn-primary"
            style={{ background: loading ? 'rgba(5,150,105,0.5)' : '#059669' }}
          >
            {loading ? (
              <>
                <Loader2 className="w-4 h-4 animate-spin" />
                Publishing...
              </>
            ) : (
              <>
                <GitPullRequest className="w-4 h-4" />
                Submit Pull Request
              </>
            )}
          </button>
        </div>
      </form>
    </div>
  );
}
