import { useEffect, useState } from 'react';
import { useAuthStore } from '../store/useAuthStore.js';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { Github, ShieldCheck, ExternalLink, AlertCircle } from 'lucide-react';

const API_URL = import.meta.env.VITE_API_URL || 
  (import.meta.env.VITE_BACKEND_URL 
    ? `${import.meta.env.VITE_BACKEND_URL}/api` 
    : 'http://localhost:3000/api');

export default function Login() {
  const { isAuthenticated } = useAuthStore();
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const [errorMsg, setErrorMsg] = useState('');

  useEffect(() => {
    if (isAuthenticated) {
      navigate('/dashboard');
    }
  }, [isAuthenticated, navigate]);

  useEffect(() => {
    const errorType = searchParams.get('error');
    if (errorType) {
      if (errorType === 'github_auth_failed') {
        setErrorMsg('GitHub Authentication failed. This is typically caused by GitHub API rate limits being exceeded for your account/IP or network connectivity issues. Please try again in a few minutes.');
      } else {
        setErrorMsg('Authentication failed. Please try again.');
      }
    }
  }, [searchParams]);

  const handleGithubLogin = () => {
    window.location.href = `${API_URL}/auth/github`;
  };

  return (
    <div className="min-h-screen bg-[#0a0e1a] text-slate-200 flex flex-col md:flex-row relative overflow-hidden" style={{ fontFamily: 'Inter, system-ui, sans-serif' }}>
      
      {/* Left Side - Info */}
      <div className="hidden md:flex flex-1 flex-col justify-center px-12 lg:px-24 relative z-10 border-r border-white/5 bg-slate-900/40">
        {/* Background effects for left side */}
        <div className="absolute inset-0 bg-dot-pattern opacity-30 pointer-events-none" />
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] rounded-full pointer-events-none -z-10" style={{ background: 'radial-gradient(ellipse, rgba(59,130,246,0.06) 0%, transparent 70%)' }} />

        <div className="max-w-xl relative z-10">
          <div className="w-14 h-14 bg-blue-600 rounded-2xl flex items-center justify-center shadow-2xl shadow-blue-600/30 mb-8">
            <Github className="w-7 h-7 text-white" />
          </div>
          
          <h1 className="text-4xl lg:text-5xl font-bold text-white mb-6 leading-tight tracking-tight">
            Resolve issues faster with AI-powered insights.
          </h1>
          
          <p className="text-lg text-slate-400 mb-10 leading-relaxed">
            GitSolver integrates directly with your repositories to automatically analyze issues, suggest code changes, and open pull requests. 
            Streamline your development workflow today.
          </p>

          <div className="flex flex-col gap-5">
            <div className="flex items-center gap-4 text-slate-300">
              <div className="w-10 h-10 rounded-full bg-blue-500/10 flex items-center justify-center border border-blue-500/20 shadow-inner">
                <ShieldCheck className="w-5 h-5 text-blue-400" />
              </div>
              <span className="font-medium">Secure GitHub integration</span>
            </div>
            <div className="flex items-center gap-4 text-slate-300">
              <div className="w-10 h-10 rounded-full bg-blue-500/10 flex items-center justify-center border border-blue-500/20 shadow-inner">
                <ShieldCheck className="w-5 h-5 text-blue-400" />
              </div>
              <span className="font-medium">Automated issue resolution</span>
            </div>
            <div className="flex items-center gap-4 text-slate-300">
              <div className="w-10 h-10 rounded-full bg-blue-500/10 flex items-center justify-center border border-blue-500/20 shadow-inner">
                <ShieldCheck className="w-5 h-5 text-blue-400" />
              </div>
              <span className="font-medium">Intelligent code generation</span>
            </div>
          </div>
        </div>
      </div>

      {/* Right Side - Login */}
      <div className="w-full md:w-[480px] lg:w-[560px] flex items-center justify-center p-6 relative z-10 bg-[#0a0e1a]">
        
        {/* Card */}
        <div className="w-full max-w-[380px]">
          {/* Mobile Logo Mark (only shows on small screens) */}
          <div className="flex justify-center mb-8 md:hidden">
            <div className="w-12 h-12 bg-blue-600 rounded-2xl flex items-center justify-center shadow-2xl shadow-blue-600/30">
              <Github className="w-6 h-6 text-white" />
            </div>
          </div>

          {/* Card Body */}
          <div className="glass-panel rounded-3xl p-8 border border-white/[0.07] shadow-2xl bg-white/[0.02] backdrop-blur-xl relative overflow-hidden">
            
            {/* Subtle glow effect behind card content */}
            <div className="absolute -top-24 -right-24 w-48 h-48 bg-blue-500/10 rounded-full blur-3xl pointer-events-none" />

            <div className="text-center mb-8 relative z-10">
              <h2 className="text-2xl font-bold text-white mb-2 tracking-tight">Welcome Back</h2>
              <p className="text-[14px] text-slate-400 leading-relaxed">
                Sign in to your GitSolver account to continue.
              </p>
            </div>

            {errorMsg && (
              <div className="mb-6 bg-rose-500/10 border border-rose-500/20 rounded-xl p-4 flex items-start gap-3 text-left relative z-10">
                <AlertCircle className="w-4 h-4 text-rose-400 flex-shrink-0 mt-0.5" />
                <p className="text-[13px] text-rose-300 leading-relaxed">{errorMsg}</p>
              </div>
            )}

            {/* GitHub Login Button */}
            <button
              onClick={handleGithubLogin}
              className="relative z-10 w-full bg-white hover:bg-slate-100 text-slate-900 font-semibold py-3.5 px-4 rounded-xl flex items-center justify-center gap-3 transition-all shadow-lg hover:shadow-xl active:scale-[0.98] text-[15px] cursor-pointer group"
            >
              <Github className="w-5 h-5 text-slate-900 fill-current group-hover:scale-110 transition-transform" />
              Continue with GitHub
            </button>

            {/* Security note */}
            <div className="mt-8 pt-6 border-t border-white/[0.05] relative z-10">
              <div className="flex items-center justify-center gap-2 text-[12px] text-slate-400 mb-3">
                <ShieldCheck className="w-4 h-4 text-emerald-500" />
                <span className="font-medium text-slate-300">Secure Authentication</span>
              </div>
              <p className="text-[12px] text-slate-500 text-center leading-relaxed px-2">
                We only request public repository permissions to create test suites and submit branches.
              </p>
            </div>
          </div>

          {/* Footer links */}
          <div className="flex items-center justify-center gap-5 mt-8 text-[12px] text-slate-500">
            <a href="https://github.com" target="_blank" rel="noreferrer" className="hover:text-slate-300 flex items-center gap-1.5 transition-colors">
              Terms <ExternalLink className="w-3 h-3" />
            </a>
            <span className="w-1 h-1 bg-slate-700 rounded-full" />
            <a href="https://github.com" target="_blank" rel="noreferrer" className="hover:text-slate-300 flex items-center gap-1.5 transition-colors">
              Privacy <ExternalLink className="w-3 h-3" />
            </a>
          </div>
        </div>
      </div>
    </div>
  );
}
