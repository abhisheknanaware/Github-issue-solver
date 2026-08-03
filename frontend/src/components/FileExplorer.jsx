import { useState, useMemo } from 'react';
import api from '../api/axios.js';
import { Folder, FolderOpen, FileCode, ChevronRight, ChevronDown, Loader2, Sparkles, X } from 'lucide-react';

const buildNestedTree = (flatTree) => {
  const root = { name: 'root', type: 'tree', children: {} };

  flatTree.forEach((node) => {
    const parts = node.path.split('/');
    let current = root;

    parts.forEach((part, idx) => {
      const isLast = idx === parts.length - 1;
      if (!current.children[part]) {
        current.children[part] = {
          name: part,
          path: node.path,
          type: isLast ? node.type : 'tree',
          sha: isLast ? node.sha : null,
          size: isLast ? node.size : null,
          children: {},
        };
      }
      current = current.children[part];
    });
  });

  return root;
};

const TreeNode = ({ node, onFileSelect, depth = 0 }) => {
  const [isOpen, setIsOpen] = useState(depth === 0);
  const isDirectory = node.type === 'tree' || Object.keys(node.children).length > 0;

  if (node.name === 'root') {
    return (
      <div className="space-y-0.5">
        {Object.values(node.children).map((child) => (
          <TreeNode key={child.name} node={child} onFileSelect={onFileSelect} depth={depth + 1} />
        ))}
      </div>
    );
  }

  return (
    <div>
      <div
        onClick={() => {
          if (isDirectory) setIsOpen(!isOpen);
          else onFileSelect(node);
        }}
        className={`flex items-center gap-1.5 py-1.5 px-2 rounded-lg cursor-pointer transition-all select-none group ${
          isDirectory
            ? 'text-slate-300 hover:bg-white/[0.04]'
            : 'text-slate-400 hover:text-slate-200 hover:bg-white/[0.04]'
        }`}
        style={{ paddingLeft: `${8 + depth * 12}px` }}
      >
        {isDirectory ? (
          <>
            <span className="text-slate-600 flex-shrink-0">
              {isOpen ? <ChevronDown className="w-3 h-3" /> : <ChevronRight className="w-3 h-3" />}
            </span>
            {isOpen
              ? <FolderOpen className="w-3.5 h-3.5 text-blue-400 flex-shrink-0" />
              : <Folder className="w-3.5 h-3.5 text-blue-400/70 flex-shrink-0" />
            }
          </>
        ) : (
          <>
            <span className="w-3 flex-shrink-0" />
            <FileCode className="w-3.5 h-3.5 text-slate-500 flex-shrink-0 group-hover:text-slate-400 transition-colors" />
          </>
        )}
        <span className="text-[12px] font-mono truncate">{node.name}</span>
      </div>

      {isDirectory && isOpen && (
        <div>
          {Object.values(node.children).map((child) => (
            <TreeNode key={child.name} node={child} onFileSelect={onFileSelect} depth={depth + 1} />
          ))}
        </div>
      )}
    </div>
  );
};

export default function FileExplorer({ fileTree = [], repoId }) {
  const [selectedFile, setSelectedFile] = useState(null);
  const [fileContent, setFileContent] = useState('');
  const [loadingContent, setLoadingContent] = useState(false);
  const [explanation, setExplanation] = useState('');
  const [loadingExplanation, setLoadingExplanation] = useState(false);

  const nestedTree = useMemo(() => buildNestedTree(fileTree), [fileTree]);

  const handleFileSelect = async (node) => {
    setSelectedFile(node);
    setFileContent('');
    setExplanation('');
    setLoadingContent(true);
    try {
      const res = await api.get(`/github/repos/${repoId}/file`, { params: { path: node.path } });
      setFileContent(res.data.data.content || '');
    } catch (err) {
      setFileContent('// Error: Failed to fetch file contents.');
    } finally {
      setLoadingContent(false);
    }
  };

  const handleExplainFile = async () => {
    if (!selectedFile || !fileContent || loadingExplanation) return;
    setLoadingExplanation(true);
    setExplanation('');
    try {
      const res = await api.post('/rag/explain', { path: selectedFile.path, content: fileContent });
      setExplanation(res.data.data.explanation);
    } catch (err) {
      setExplanation('Error: Failed to generate explanation.');
    } finally {
      setLoadingExplanation(false);
    }
  };

  return (
    <div className="glass-panel rounded-xl overflow-hidden border border-white/[0.06] flex flex-col md:flex-row" style={{ height: '600px' }}>
      
      {/* Tree Sidebar */}
      <div className="w-full md:w-64 border-b md:border-b-0 md:border-r border-white/[0.05] flex flex-col flex-shrink-0" style={{ background: 'rgba(7,11,20,0.5)' }}>
        <div className="px-3 py-3 border-b border-white/[0.05] flex-shrink-0">
          <p className="section-label">Codebase Directory</p>
        </div>
        <div className="flex-1 overflow-y-auto p-2">
          {fileTree.length === 0 ? (
            <div className="text-[12px] text-slate-500 text-center py-8 px-4 leading-relaxed">
              No files indexed yet. Try syncing this repository first.
            </div>
          ) : (
            <TreeNode node={nestedTree} onFileSelect={handleFileSelect} />
          )}
        </div>
      </div>

      {/* File Content + Explanation */}
      <div className="flex-1 flex flex-col overflow-hidden">
        {selectedFile ? (
          <>
            {/* File header */}
            <div className="px-4 py-3 border-b border-white/[0.05] flex items-center justify-between gap-3 flex-shrink-0" style={{ background: 'rgba(17,24,39,0.4)' }}>
              <div className="min-w-0">
                <h4 className="font-mono text-[12px] font-semibold text-white truncate">{selectedFile.path}</h4>
                <p className="text-[11px] text-slate-500 mt-0.5">
                  {selectedFile.size ? `${(selectedFile.size / 1024).toFixed(1)} KB` : 'Unknown size'}
                </p>
              </div>
              <div className="flex items-center gap-2 flex-shrink-0">
                <button
                  onClick={handleExplainFile}
                  disabled={loadingContent || loadingExplanation}
                  className="btn-secondary text-[12px] py-1.5 px-3 disabled:opacity-40"
                >
                  <Sparkles className="w-3.5 h-3.5" />
                  {loadingExplanation ? 'Explaining...' : 'Explain'}
                </button>
                <button
                  onClick={() => { setSelectedFile(null); setExplanation(''); setFileContent(''); }}
                  className="w-7 h-7 rounded-lg flex items-center justify-center text-slate-500 hover:text-slate-200 hover:bg-white/[0.06] transition-all"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>
            </div>

            {/* Content area */}
            <div className="flex-1 flex flex-col lg:flex-row overflow-hidden">
              {/* Code content */}
              <div className={`flex-1 overflow-auto font-mono text-[11px] leading-relaxed ${explanation || loadingExplanation ? 'lg:border-r border-white/[0.05]' : ''}`} style={{ background: 'rgba(7,11,20,0.3)' }}>
                {loadingContent ? (
                  <div className="h-full flex items-center justify-center gap-2.5 text-slate-500">
                    <Loader2 className="w-5 h-5 animate-spin text-blue-400" />
                    <span className="text-sm">Loading file...</span>
                  </div>
                ) : (
                  <pre className="p-4 whitespace-pre text-slate-300" style={{ fontFamily: "'JetBrains Mono', monospace" }}>
                    {fileContent || '// Empty file'}
                  </pre>
                )}
              </div>

              {/* Explanation panel */}
              {(explanation || loadingExplanation) && (
                <div className="lg:w-80 w-full border-t lg:border-t-0 border-white/[0.05] flex flex-col" style={{ background: 'rgba(17,24,39,0.5)' }}>
                  <div className="px-4 py-3 border-b border-white/[0.05] flex items-center gap-1.5 flex-shrink-0">
                    <Sparkles className="w-3.5 h-3.5 text-amber-400" />
                    <span className="section-label">AI Analysis</span>
                  </div>
                  <div className="flex-1 overflow-y-auto p-4">
                    {loadingExplanation ? (
                      <div className="flex flex-col items-center justify-center gap-3 py-8 text-slate-500">
                        <Loader2 className="w-5 h-5 animate-spin text-blue-400" />
                        <p className="text-[12px] text-center leading-relaxed">Analyzing variables, imports, and functions...</p>
                      </div>
                    ) : (
                      <p className="text-[12px] text-slate-300 leading-relaxed whitespace-pre-wrap">{explanation}</p>
                    )}
                  </div>
                </div>
              )}
            </div>
          </>
        ) : (
          <div className="flex-1 flex flex-col items-center justify-center text-center p-10 text-slate-500">
            <FileCode className="w-10 h-10 text-slate-700 mb-3" />
            <h4 className="text-sm font-medium text-slate-400 mb-1.5">No file selected</h4>
            <p className="text-[12px] max-w-xs leading-relaxed">
              Select any file from the directory tree to view its contents and generate an AI explanation.
            </p>
          </div>
        )}
      </div>
    </div>
  );
}
