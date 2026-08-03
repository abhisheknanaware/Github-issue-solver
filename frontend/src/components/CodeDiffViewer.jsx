import { useState } from 'react';
import { Code, FileText } from 'lucide-react';

export default function CodeDiffViewer({ diffs }) {
  const [activeDiffIdx, setActiveDiffIdx] = useState(0);

  if (!diffs || diffs.length === 0) {
    return (
      <div className="glass-panel rounded-xl border border-white/[0.06] p-8 text-center text-slate-500 text-sm">
        No code changes generated.
      </div>
    );
  }

  const currentDiff = diffs[activeDiffIdx];
  const origLines = (currentDiff.originalCode || '').split('\n');
  const modLines = (currentDiff.modifiedCode || '').split('\n');
  const maxLines = Math.max(origLines.length, modLines.length);

  const alignedDiff = [];
  for (let i = 0; i < maxLines; i++) {
    const orig = origLines[i] !== undefined ? origLines[i] : null;
    const mod = modLines[i] !== undefined ? modLines[i] : null;
    if (orig !== mod) {
      alignedDiff.push({
        orig: { lineNum: orig !== null ? i + 1 : '', content: orig, type: orig !== null ? 'del' : 'empty' },
        mod: { lineNum: mod !== null ? i + 1 : '', content: mod, type: mod !== null ? 'add' : 'empty' },
      });
    } else {
      alignedDiff.push({
        orig: { lineNum: i + 1, content: orig, type: 'normal' },
        mod: { lineNum: i + 1, content: mod, type: 'normal' },
      });
    }
  }

  return (
    <div className="glass-panel rounded-xl overflow-hidden border border-white/[0.06] flex flex-col md:flex-row" style={{ minHeight: '480px' }}>
      
      {/* File list sidebar */}
      <div className="w-full md:w-56 border-b md:border-b-0 md:border-r border-white/[0.05] p-3 flex-shrink-0" style={{ background: 'rgba(7,11,20,0.4)' }}>
        <p className="section-label mb-2.5 px-1">Changed Files</p>
        <div className="space-y-0.5">
          {diffs.map((diff, idx) => (
            <button
              key={idx}
              onClick={() => setActiveDiffIdx(idx)}
              className={`w-full text-left px-3 py-2 rounded-lg text-[12px] font-mono truncate transition-all flex items-center gap-2 ${
                activeDiffIdx === idx
                  ? 'bg-blue-500/10 text-blue-300 border border-blue-500/20'
                  : 'text-slate-400 hover:text-slate-200 hover:bg-white/[0.04]'
              }`}
            >
              <Code className="w-3.5 h-3.5 flex-shrink-0" />
              <span className="truncate">{diff.filePath.split('/').pop()}</span>
            </button>
          ))}
        </div>
      </div>

      {/* Code diff panel */}
      <div className="flex-1 flex flex-col overflow-hidden">
        {/* File header */}
        <div className="px-4 py-3 border-b border-white/[0.05] flex items-center gap-2.5" style={{ background: 'rgba(17,24,39,0.5)' }}>
          <Code className="w-4 h-4 text-blue-400 flex-shrink-0" />
          <div className="min-w-0">
            <h4 className="font-mono text-[12px] font-semibold text-white truncate">{currentDiff.filePath}</h4>
            <p className="text-[11px] text-slate-500 font-medium">{currentDiff.language || 'Code'}</p>
          </div>
        </div>

        {/* Diff columns header */}
        <div className="grid grid-cols-2 gap-0 border-b border-white/[0.05]">
          <div className="px-4 py-2 text-[11px] text-slate-500 font-medium border-r border-white/[0.05]" style={{ background: 'rgba(239,68,68,0.03)' }}>
            ← Original
          </div>
          <div className="px-4 py-2 text-[11px] text-slate-500 font-medium" style={{ background: 'rgba(16,185,129,0.03)' }}>
            Modified →
          </div>
        </div>

        {/* Diff rows */}
        <div className="flex-1 overflow-auto font-mono text-[11px] leading-relaxed">
          {alignedDiff.map((row, idx) => (
            <div key={idx} className="grid grid-cols-2 divide-x divide-white/[0.04] hover:bg-white/[0.01]">
              {/* Original */}
              <div className={`flex items-start min-w-0 ${
                row.orig.type === 'del' ? 'bg-rose-500/8' : ''
              }`}>
                <span className="w-10 flex-shrink-0 text-right pr-3 py-1 text-slate-700 select-none border-r border-white/[0.04]">
                  {row.orig.lineNum}
                </span>
                <pre className={`flex-1 px-3 py-1 whitespace-pre overflow-x-auto ${
                  row.orig.type === 'del' ? 'text-rose-300' : 
                  row.orig.type === 'empty' ? 'opacity-20 select-none' : 'text-slate-400'
                }`}>
                  {row.orig.type === 'del' && <span className="text-rose-500 mr-1 select-none">-</span>}
                  {row.orig.content !== null ? row.orig.content : ' '}
                </pre>
              </div>

              {/* Modified */}
              <div className={`flex items-start min-w-0 ${
                row.mod.type === 'add' ? 'bg-emerald-500/8' : ''
              }`}>
                <span className="w-10 flex-shrink-0 text-right pr-3 py-1 text-slate-700 select-none border-r border-white/[0.04]">
                  {row.mod.lineNum}
                </span>
                <pre className={`flex-1 px-3 py-1 whitespace-pre overflow-x-auto ${
                  row.mod.type === 'add' ? 'text-emerald-300' : 
                  row.mod.type === 'empty' ? 'opacity-20 select-none' : 'text-slate-300'
                }`}>
                  {row.mod.type === 'add' && <span className="text-emerald-500 mr-1 select-none">+</span>}
                  {row.mod.content !== null ? row.mod.content : ' '}
                </pre>
              </div>
            </div>
          ))}
        </div>

        {/* Explanation footer */}
        {currentDiff.explanation && (
          <div className="border-t border-white/[0.05] p-4" style={{ background: 'rgba(17,24,39,0.5)' }}>
            <div className="flex items-center gap-1.5 mb-2">
              <FileText className="w-3.5 h-3.5 text-blue-400" />
              <h5 className="text-[11px] font-semibold text-slate-400">AI Explanation</h5>
            </div>
            <p className="text-[12px] text-slate-300 leading-relaxed bg-white/[0.02] border border-white/[0.06] p-3.5 rounded-lg">
              {currentDiff.explanation}
            </p>
          </div>
        )}
      </div>
    </div>
  );
}
