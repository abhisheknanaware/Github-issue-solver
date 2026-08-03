import { useState, useRef, useEffect } from 'react';
import api from '../api/axios.js';
import { Send, Bot, User, Loader2, Link, Sparkles, RefreshCw, AlertTriangle } from 'lucide-react';

export default function RepoChat({ repoId, isIndexed = true }) {
  const [messages, setMessages] = useState([
    {
      role: 'assistant',
      content: "Hello! Ask me any questions about this repository's codebase. I'll use semantic RAG context to find relevant code and describe where changes should occur.",
    },
  ]);
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);
  const [reindexing, setReindexing] = useState(false);
  const [reindexDone, setReindexDone] = useState(false);
  const messagesEndRef = useRef(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages, loading]);

  const handleSend = async (e) => {
    e.preventDefault();
    if (!input.trim() || loading) return;

    const queryText = input.trim();
    setInput('');
    setMessages((prev) => [...prev, { role: 'user', content: queryText }]);
    setLoading(true);

    try {
      const res = await api.post('/rag/query', { repoId, query: queryText });
      const { answer, sources } = res.data.data;
      setMessages((prev) => [...prev, { role: 'assistant', content: answer, sourcesUsed: sources || [] }]);
    } catch (err) {
      setMessages((prev) => [
        ...prev,
        { role: 'assistant', content: 'Sorry, I encountered an issue querying the RAG pipeline. Please try again in a moment.' },
      ]);
    } finally {
      setLoading(false);
    }
  };

  const handleReindex = async () => {
    if (reindexing) return;
    setReindexing(true);
    try {
      await api.post(`/rag/index/${repoId}`);
      setReindexDone(true);
      setMessages((prev) => [
        ...prev,
        {
          role: 'assistant',
          content: '🔄 Re-indexing started! This runs in the background and may take a few minutes depending on the repository size. You can ask questions in the meantime — answers will improve as indexing completes.',
        },
      ]);
    } catch (err) {
      setMessages((prev) => [
        ...prev,
        { role: 'assistant', content: 'Failed to trigger re-indexing. Check your API configuration.' },
      ]);
    } finally {
      setReindexing(false);
    }
  };

  return (
    <div className="glass-panel border border-white/[0.06] rounded-xl overflow-hidden flex flex-col" style={{ height: '500px' }}>
      
      {/* Header */}
      <div className="px-4 py-3.5 border-b border-white/[0.05] flex items-center justify-between flex-shrink-0" style={{ background: 'rgba(17,24,39,0.6)' }}>
        <div className="flex items-center gap-2.5">
          <div className="w-7 h-7 bg-blue-500/15 border border-blue-500/25 rounded-lg flex items-center justify-center">
            <Bot className="w-4 h-4 text-blue-400" />
          </div>
          <div>
            <h3 className="text-[13px] font-semibold text-white">Codebase RAG Assistant</h3>
            <p className="text-[11px] text-slate-500">Semantic search context</p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          {/* Re-index button */}
          <button
            onClick={handleReindex}
            disabled={reindexing || reindexDone}
            title={reindexDone ? 'Indexing triggered' : 'Re-index this repository'}
            className={`flex items-center gap-1.5 text-[11px] font-medium px-2.5 py-1.5 rounded-lg border transition-all whitespace-nowrap ${
              reindexDone
                ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20 cursor-default'
                : 'bg-white/[0.04] text-slate-400 border-white/[0.07] hover:text-slate-200 hover:bg-white/[0.08]'
            }`}
          >
            <RefreshCw className={`w-3 h-3 ${reindexing ? 'animate-spin' : ''}`} />
            {reindexing ? 'Indexing...' : reindexDone ? 'Triggered' : 'Re-index'}
          </button>
          <div className="flex items-center gap-1.5 text-[11px] text-blue-400 font-medium bg-blue-500/8 border border-blue-500/15 rounded-full px-2.5 py-1 whitespace-nowrap">
            <Sparkles className="w-3 h-3" />
            GPT-4o
          </div>
        </div>
      </div>

      {/* Not-indexed warning banner */}
      {!isIndexed && !reindexDone && (
        <div className="flex items-center gap-2 px-4 py-2.5 bg-amber-500/8 border-b border-amber-500/15 text-[11px] text-amber-400 flex-shrink-0">
          <AlertTriangle className="w-3.5 h-3.5 flex-shrink-0" />
          <span>Repository not yet indexed. Answers may be limited. Click <strong>Re-index</strong> to start.</span>
        </div>
      )}

      {/* Messages */}
      <div className="flex-1 overflow-y-auto p-4 space-y-3">
        {messages.map((msg, idx) => (
          <div
            key={idx}
            className={`flex gap-2.5 ${msg.role === 'user' ? 'flex-row-reverse' : ''}`}
          >
            {/* Avatar */}
            <div className={`w-7 h-7 rounded-lg flex items-center justify-center flex-shrink-0 mt-0.5 ${
              msg.role === 'user'
                ? 'bg-blue-600/15 border border-blue-500/20 text-blue-400'
                : 'bg-emerald-600/15 border border-emerald-500/20 text-emerald-400'
            }`}>
              {msg.role === 'user' ? <User className="w-3.5 h-3.5" /> : <Bot className="w-3.5 h-3.5" />}
            </div>

            {/* Bubble */}
            <div className={`max-w-[82%] rounded-xl px-4 py-3 text-[12px] leading-relaxed ${
              msg.role === 'user'
                ? 'bg-blue-600/15 border border-blue-500/20 text-blue-100 rounded-tr-sm'
                : 'bg-white/[0.04] border border-white/[0.07] text-slate-200 rounded-tl-sm'
            }`}>
              <p className="whitespace-pre-wrap">{msg.content}</p>

              {msg.sourcesUsed && msg.sourcesUsed.length > 0 && (
                <div className="mt-2.5 pt-2.5 border-t border-white/[0.08]">
                  <p className="text-[10px] text-slate-500 font-medium mb-1.5">Sources used:</p>
                  <div className="flex flex-wrap gap-1">
                    {msg.sourcesUsed.map((src, sIdx) => (
                      <span
                        key={sIdx}
                        className="inline-flex items-center gap-1 font-mono text-[10px] text-blue-400 bg-blue-950/30 border border-blue-900/40 rounded px-1.5 py-0.5"
                      >
                        <Link className="w-2.5 h-2.5" />
                        {src.filePath.split('/').pop()}
                      </span>
                    ))}
                  </div>
                </div>
              )}
            </div>
          </div>
        ))}

        {loading && (
          <div className="flex gap-2.5">
            <div className="w-7 h-7 rounded-lg bg-emerald-600/15 border border-emerald-500/20 text-emerald-400 flex items-center justify-center flex-shrink-0 mt-0.5">
              <Bot className="w-3.5 h-3.5" />
            </div>
            <div className="bg-white/[0.04] border border-white/[0.07] rounded-xl rounded-tl-sm px-4 py-3 flex items-center gap-2 text-[12px] text-slate-400">
              <Loader2 className="w-3.5 h-3.5 animate-spin text-blue-400" />
              Querying codebase...
            </div>
          </div>
        )}

        <div ref={messagesEndRef} />
      </div>

      {/* Input */}
      <form onSubmit={handleSend} className="p-3 border-t border-white/[0.05] flex gap-2 flex-shrink-0" style={{ background: 'rgba(7,11,20,0.6)' }}>
        <input
          type="text"
          placeholder="Ask about the codebase..."
          value={input}
          onChange={(e) => setInput(e.target.value)}
          disabled={loading}
          className="input-base text-[12px] py-2.5"
        />
        <button
          type="submit"
          disabled={loading || !input.trim()}
          className="w-9 h-9 bg-blue-600 hover:bg-blue-500 text-white rounded-lg flex items-center justify-center transition-all disabled:opacity-40 disabled:cursor-not-allowed flex-shrink-0 active:scale-95"
        >
          <Send className="w-3.5 h-3.5" />
        </button>
      </form>
    </div>
  );
}
