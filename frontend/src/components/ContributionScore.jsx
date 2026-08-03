import { 
  Award, BarChart3, Tag, Clock, MessageSquare, FileText, Code, 
  Sparkles
} from 'lucide-react';

export default function ContributionScore({ score = 0, breakdown = {} }) {
  const getColors = (val) => {
    if (val >= 75) return { 
      text: 'text-emerald-400', 
      bar: 'bg-emerald-500',
      barGradient: 'from-emerald-500 to-teal-400',
      ring: '#10b981',
      badge: 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20',
      label: 'Easy Fix',
      bg: 'rgba(16,185,129,0.06)',
      border: 'rgba(16,185,129,0.15)',
    };
    if (val >= 45) return { 
      text: 'text-amber-400', 
      bar: 'bg-amber-500',
      barGradient: 'from-amber-500 to-orange-400',
      ring: '#f59e0b',
      badge: 'bg-amber-500/10 text-amber-400 border-amber-500/20',
      label: 'Moderate Fix',
      bg: 'rgba(245,158,11,0.06)',
      border: 'rgba(245,158,11,0.15)',
    };
    return { 
      text: 'text-rose-400', 
      bar: 'bg-rose-500',
      barGradient: 'from-rose-500 to-red-400',
      ring: '#ef4444',
      badge: 'bg-rose-500/10 text-rose-400 border-rose-500/20',
      label: 'Complex Fix',
      bg: 'rgba(239,68,68,0.06)',
      border: 'rgba(239,68,68,0.15)',
    };
  };

  const colors = getColors(score);

  const size = 100;
  const strokeWidth = 7;
  const radius = (size - strokeWidth) / 2;
  const circumference = radius * 2 * Math.PI;
  const strokeDashoffset = circumference - (score / 100) * circumference;

  const metrics = [
    { label: 'Label Clarity', value: breakdown.labelClarity ?? 50, desc: 'Beginner-friendly classification', icon: Tag },
    { label: 'Issue Age', value: breakdown.issueAge ?? 50, desc: 'How recently it was created', icon: Clock },
    { label: 'Comment Count', value: breakdown.commentCount ?? 50, desc: 'Low comments = clearer scope', icon: MessageSquare },
    { label: 'Body Clarity', value: breakdown.bodyClarity ?? 50, desc: 'Richness of the description', icon: FileText },
    { label: 'File Complexity', value: breakdown.fileComplexity ?? 50, desc: 'Scope of required changes', icon: Code },
  ];

  return (
    <div className="glass-panel rounded-xl border border-white/[0.06] p-5 flex flex-col md:flex-row gap-5 items-start">
      
      {/* Score Gauge */}
      <div className="w-full md:w-44 rounded-xl p-5 flex flex-col items-center text-center flex-shrink-0" style={{ background: colors.bg, border: `1px solid ${colors.border}` }}>
        
        {/* SVG Gauge */}
        <div className="relative flex items-center justify-center mb-3">
          <svg className="transform -rotate-90" width={size} height={size}>
            <circle
              cx={size / 2} cy={size / 2} r={radius}
              stroke="rgba(255,255,255,0.06)"
              strokeWidth={strokeWidth}
              fill="transparent"
            />
            <circle
              cx={size / 2} cy={size / 2} r={radius}
              className="transition-all duration-1000 ease-out"
              stroke={colors.ring}
              strokeWidth={strokeWidth}
              fill="transparent"
              strokeDasharray={circumference}
              strokeDashoffset={strokeDashoffset}
              strokeLinecap="round"
            />
          </svg>
          <div className="absolute flex flex-col items-center">
            <span className="text-3xl font-bold text-white">{score}</span>
            <span className="text-[10px] text-slate-500 font-medium">/ 100</span>
          </div>
        </div>

        <p className="text-[11px] text-slate-500 font-medium mb-2">Triage Readiness</p>
        <span className={`text-[11px] font-semibold px-2.5 py-1 rounded-lg border ${colors.badge}`}>
          {colors.label}
        </span>
      </div>

      {/* Metrics */}
      <div className="flex-1 w-full">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-2">
            <BarChart3 className="w-4 h-4 text-blue-400" />
            <h4 className="text-sm font-semibold text-white">Triage Analysis</h4>
          </div>
          <span className="text-[11px] text-slate-500 font-medium">Ready Indicators</span>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          {metrics.map((m) => {
            const mColors = getColors(m.value);
            const MetricIcon = m.icon;
            return (
              <div key={m.label} className="group/metric space-y-1.5">
                <div className="flex items-center justify-between">
                  <span className="text-[12px] text-slate-300 font-medium flex items-center gap-1.5 group-hover/metric:text-white transition-colors">
                    <MetricIcon className="w-3.5 h-3.5 text-slate-500 group-hover/metric:text-blue-400 transition-colors" />
                    {m.label}
                  </span>
                  <span className={`text-[12px] font-semibold ${mColors.text}`}>{m.value}%</span>
                </div>
                <div className="w-full bg-white/[0.05] h-1.5 rounded-full overflow-hidden">
                  <div
                    className={`h-full rounded-full bg-gradient-to-r ${mColors.barGradient} transition-all duration-700`}
                    style={{ width: `${m.value}%` }}
                  />
                </div>
                <p className="text-[11px] text-slate-500 leading-tight">{m.desc}</p>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
