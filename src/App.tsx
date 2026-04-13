/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { useState, useRef, ReactNode, useEffect } from "react";
import { motion, AnimatePresence } from "motion/react";
import { Skull, Scale, AlertTriangle, Target, TrendingDown, Clock, UserCheck, CheckCircle2, XCircle, RefreshCw, Copy, Share2, History } from "lucide-react";
import { analyzeIdea, AnalysisResponse } from "./lib/gemini";
import { supabase } from "./lib/supabase";

export default function App() {
  const [idea, setIdea] = useState("");
  const [mode, setMode] = useState<"BRUTAL" | "BALANCED">("BRUTAL");
  const [loading, setLoading] = useState(false);
  const [analysis, setAnalysis] = useState<AnalysisResponse | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [history, setHistory] = useState<any[]>([]);
  const [showHistory, setShowHistory] = useState(false);
  const resultsRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    fetchHistory();
  }, []);

  const fetchHistory = async () => {
    if (!supabase) return;
    try {
      const { data, error } = await supabase
        .from('audits')
        .select('*')
        .order('created_at', { ascending: false })
        .limit(10);
      
      if (error) throw error;
      setHistory(data || []);
    } catch (err) {
      console.error('Error fetching history:', err);
    }
  };

  const saveAudit = async (idea: string, mode: string, analysis: AnalysisResponse) => {
    if (!supabase) return;
    try {
      const { error } = await supabase
        .from('audits')
        .insert([
          { idea, mode, analysis }
        ]);
      
      if (error) throw error;
      fetchHistory();
    } catch (err) {
      console.error('Error saving audit:', err);
    }
  };

  const handleAnalyze = async () => {
    if (!idea.trim()) return;
    setLoading(true);
    setError(null);
    try {
      const result = await analyzeIdea(idea, mode);
      setAnalysis(result);
      await saveAudit(idea, mode, result);
      setTimeout(() => {
        resultsRef.current?.scrollIntoView({ behavior: "smooth" });
      }, 100);
    } catch (err: any) {
      console.error(err);
      const errorMessage = err.message || "The graveyard is full. An unknown error occurred while auditing your idea.";
      setError(errorMessage);
    } finally {
      setLoading(false);
    }
  };

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text);
  };

  return (
    <div className="min-h-screen flex flex-col items-center p-4 md:p-8 max-w-5xl mx-auto">
      {/* Header */}
      <header className="w-full mb-12 text-center relative">
        <button 
          onClick={() => setShowHistory(!showHistory)}
          className="absolute top-0 right-0 p-2 brutal-border hover:bg-brutal-white hover:text-brutal-black transition-colors"
          title="Audit History"
        >
          <History size={20} />
        </button>

        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          className="inline-block brutal-border bg-brutal-red text-white px-4 py-1 mb-4 font-mono text-sm uppercase tracking-widest"
        >
          Graveyard Data: 500,000+ Failures
        </motion.div>
        <h1 className="font-display text-6xl md:text-8xl font-black uppercase tracking-tighter leading-none mb-4">
          AI Reality<br />Checker
        </h1>
        <p className="font-mono text-brutal-white/60 max-w-xl mx-auto">
          Your job is NOT to validate ideas. It is to find every possible way an idea can fail before you waste a single dollar.
        </p>
      </header>

      {/* History Sidebar/Overlay */}
      <AnimatePresence>
        {showHistory && (
          <motion.div
            initial={{ x: '100%' }}
            animate={{ x: 0 }}
            exit={{ x: '100%' }}
            className="fixed top-0 right-0 h-full w-full md:w-80 bg-brutal-black brutal-border border-r-0 z-50 p-6 overflow-y-auto shadow-2xl"
          >
            <div className="flex justify-between items-center mb-8">
              <h2 className="font-display text-2xl font-bold uppercase">History</h2>
              <button onClick={() => setShowHistory(false)} className="font-mono text-xs hover:text-brutal-red">CLOSE</button>
            </div>
            <div className="space-y-4">
              {!supabase && (
                <div className="p-4 brutal-border border-brutal-red bg-brutal-red/10 text-brutal-red font-mono text-[10px] uppercase leading-tight">
                  Supabase not configured. History is disabled.
                </div>
              )}
              {history.length === 0 ? (
                <p className="font-mono text-xs opacity-30 italic">No bodies in the graveyard yet...</p>
              ) : (
                history.map((item) => (
                  <div 
                    key={item.id} 
                    className="p-4 brutal-border border-brutal-white/20 hover:border-brutal-white cursor-pointer transition-colors"
                    onClick={() => {
                      setAnalysis(item.analysis);
                      setIdea(item.idea);
                      setMode(item.mode);
                      setShowHistory(false);
                      setTimeout(() => resultsRef.current?.scrollIntoView({ behavior: "smooth" }), 100);
                    }}
                  >
                    <div className="flex justify-between items-start mb-2">
                      <span className={`text-[10px] font-mono px-1 ${item.mode === 'BRUTAL' ? 'bg-brutal-red' : 'bg-brutal-yellow text-brutal-black'}`}>
                        {item.mode}
                      </span>
                      <span className="text-[10px] font-mono opacity-30">
                        {new Date(item.created_at).toLocaleDateString()}
                      </span>
                    </div>
                    <p className="font-mono text-xs line-clamp-2 opacity-80">{item.idea}</p>
                    <div className="mt-2 flex items-center gap-1">
                      <span className={`w-2 h-2 rounded-full ${
                        item.analysis.verdict.type === 'KILL IT' ? 'bg-brutal-red' : 
                        item.analysis.verdict.type === 'PIVOT IT' ? 'bg-brutal-yellow' : 'bg-brutal-green'
                      }`} />
                      <span className="text-[10px] font-mono uppercase">{item.analysis.verdict.type}</span>
                    </div>
                  </div>
                ))
              )}
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Input Section */}
      <section className="w-full mb-12 space-y-6">
        <div className="relative">
          <textarea
            value={idea}
            onChange={(e) => setIdea(e.target.value)}
            placeholder="Pitch your 'world-changing' idea here..."
            className="brutal-input min-h-[200px] resize-none"
          />
          <div className="absolute bottom-4 right-4 font-mono text-xs text-brutal-white/30">
            {idea.length} characters
          </div>
        </div>

        <div className="flex flex-col md:flex-row gap-6 items-center justify-between">
          <div className="flex brutal-border p-1 bg-brutal-black">
            <button
              onClick={() => setMode("BRUTAL")}
              className={`flex items-center gap-2 px-6 py-2 font-display font-bold uppercase transition-all ${
                mode === "BRUTAL" ? "bg-brutal-red text-white" : "hover:bg-brutal-white/10"
              }`}
            >
              <Skull size={18} />
              Brutal Mode
            </button>
            <button
              onClick={() => setMode("BALANCED")}
              className={`flex items-center gap-2 px-6 py-2 font-display font-bold uppercase transition-all ${
                mode === "BALANCED" ? "bg-brutal-yellow text-brutal-black" : "hover:bg-brutal-white/10"
              }`}
            >
              <Scale size={18} />
              Balanced Mode
            </button>
          </div>

          <button
            onClick={handleAnalyze}
            disabled={loading || !idea.trim()}
            className="brutal-btn w-full md:w-auto flex items-center justify-center gap-3"
          >
            {loading ? (
              <>
                <RefreshCw className="animate-spin" />
                Analyzing...
              </>
            ) : (
              "Roast My Idea"
            )}
          </button>
        </div>
      </section>

      {error && (
        <motion.div 
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          className="w-full brutal-border border-brutal-red p-6 mb-8 bg-brutal-red/10 flex flex-col items-center gap-4 text-center"
        >
          <div className="flex items-center gap-3 text-brutal-red font-mono font-bold uppercase">
            <AlertTriangle />
            Audit Failed
          </div>
          <p className="font-mono text-sm text-brutal-white/80 max-w-2xl">
            {error}
          </p>
          <button
            onClick={handleAnalyze}
            className="brutal-btn bg-brutal-red text-white border-brutal-red hover:bg-white hover:text-brutal-red"
          >
            Try Again
          </button>
        </motion.div>
      )}

      {/* Results Section */}
      <AnimatePresence>
        {analysis && (
          <motion.div
            ref={resultsRef}
            initial={{ opacity: 0, y: 40 }}
            animate={{ opacity: 1, y: 0 }}
            className="w-full space-y-8 pb-24"
          >
            <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
              <KillShot
                index="01"
                title="The Market Truth"
                tooltip="Who already owns this problem? Exposing the competition you're ignoring."
                content={analysis.marketTruth}
                icon={<Target className="text-brutal-red" />}
              />
              <KillShot
                index="02"
                title="The Customer Lie"
                tooltip="What assumption about your user is fundamentally broken?"
                content={analysis.customerLie}
                icon={<AlertTriangle className="text-brutal-yellow" />}
              />
              <KillShot
                index="03"
                title="The Unit Economics Trap"
                tooltip="Will it cost more to acquire a user than they're worth?"
                content={analysis.unitEconomics}
                icon={<TrendingDown className="text-brutal-red" />}
              />
              <KillShot
                index="04"
                title="The Timing Risk"
                tooltip="Is the market ready, or did you miss the boat?"
                content={analysis.timingRisk}
                icon={<Clock className="text-brutal-white" />}
              />
              <KillShot
                index="05"
                title="The Founder Fit Problem"
                tooltip="Do you actually have the unfair advantage required to win?"
                content={analysis.founderFit}
                icon={<UserCheck className="text-brutal-green" />}
              />
              
              {/* Survival Score Card */}
              <motion.div
                initial={{ opacity: 0, scale: 0.9 }}
                whileInView={{ opacity: 1, scale: 1 }}
                viewport={{ once: true }}
                className="brutal-card flex flex-col items-center justify-center text-center border-brutal-white"
              >
                <span className="font-mono text-xs opacity-50 mb-4">06 / SURVIVAL SCORE</span>
                <div className="relative flex items-center justify-center">
                  <svg className="w-32 h-32 transform -rotate-90">
                    <circle
                      cx="64"
                      cy="64"
                      r="58"
                      stroke="currentColor"
                      strokeWidth="8"
                      fill="transparent"
                      className="text-brutal-white/10"
                    />
                    <motion.circle
                      cx="64"
                      cy="64"
                      r="58"
                      stroke="currentColor"
                      strokeWidth="8"
                      fill="transparent"
                      strokeDasharray="364.4"
                      initial={{ strokeDashoffset: 364.4 }}
                      whileInView={{ strokeDashoffset: 364.4 - (364.4 * analysis.survivalScore) / 100 }}
                      viewport={{ once: true }}
                      transition={{ duration: 1.5, ease: "easeOut" }}
                      className={
                        analysis.survivalScore < 30 ? "text-brutal-red" :
                        analysis.survivalScore < 70 ? "text-brutal-yellow" : "text-brutal-green"
                      }
                    />
                  </svg>
                  <span className="absolute font-display text-4xl font-black">
                    {analysis.survivalScore}%
                  </span>
                </div>
                <p className="mt-4 font-mono text-[10px] uppercase tracking-widest opacity-50">
                  3-Year Survival Probability
                </p>
              </motion.div>

              {/* Verdict Card */}
              <motion.div
                initial={{ opacity: 0, scale: 0.9 }}
                whileInView={{ opacity: 1, scale: 1 }}
                viewport={{ once: true }}
                className={`brutal-card md:col-span-2 flex flex-col justify-between ${
                  analysis.verdict.type === "KILL IT" ? "border-brutal-red" : 
                  analysis.verdict.type === "PIVOT IT" ? "border-brutal-yellow" : "border-brutal-green"
                }`}
              >
                <div>
                  <div className="flex items-center justify-between mb-4">
                    <span className="font-mono text-xs opacity-50">07 / VERDICT</span>
                    {analysis.verdict.type === "KILL IT" ? <XCircle className="text-brutal-red" /> : 
                     analysis.verdict.type === "PIVOT IT" ? <RefreshCw className="text-brutal-yellow" /> : 
                     <CheckCircle2 className="text-brutal-green" />}
                  </div>
                  <h3 className={`font-display text-4xl font-black mb-4 ${
                    analysis.verdict.type === "KILL IT" ? "text-brutal-red" : 
                    analysis.verdict.type === "PIVOT IT" ? "text-brutal-yellow" : "text-brutal-green"
                  }`}>
                    {analysis.verdict.type}
                  </h3>
                  <p className="font-mono text-sm leading-relaxed">
                    {analysis.verdict.content}
                  </p>
                </div>
              </motion.div>
            </div>

            {/* Share Line */}
            <motion.div
              initial={{ opacity: 0 }}
              whileInView={{ opacity: 1 }}
              viewport={{ once: true }}
              className="brutal-card border-dashed border-brutal-white/30 bg-brutal-white/5"
            >
              <div className="flex items-center gap-2 mb-4 text-brutal-white/50 font-mono text-xs uppercase tracking-widest">
                <Share2 size={14} />
                Share Line (Copy to X)
              </div>
              <p className="font-mono text-lg italic mb-6">
                "{analysis.shareLine.split("Go test your own idea")[0].trim()}"
              </p>
              <button
                onClick={() => copyToClipboard(analysis.shareLine)}
                className="flex items-center gap-2 font-mono text-xs uppercase tracking-widest text-brutal-red hover:text-white transition-colors"
              >
                <Copy size={14} />
                Copy Share Text
              </button>
            </motion.div>

            <div className="text-center pt-12">
              <button
                onClick={() => {
                  setAnalysis(null);
                  setIdea("");
                  window.scrollTo({ top: 0, behavior: "smooth" });
                }}
                className="font-mono text-xs uppercase tracking-widest opacity-50 hover:opacity-100 transition-opacity"
              >
                Analyze Another Idea
              </button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Footer */}
      <footer className="mt-auto py-8 w-full border-t border-brutal-white/10 flex flex-col md:flex-row justify-between items-center gap-4 text-brutal-white/30 font-mono text-[10px] uppercase tracking-widest">
        <div>© 2026 AI Reality Checker</div>
        <div className="flex gap-6">
          <span>Pattern Recognition: Active</span>
          <span>Bias: 0%</span>
          <span>Honesty: 100%</span>
        </div>
      </footer>
    </div>
  );
}

function KillShot({ index, title, tooltip, content, icon }: { index: string; title: string; tooltip: string; content: string; icon: ReactNode }) {
  return (
    <motion.div
      initial={{ opacity: 0, x: -20 }}
      whileInView={{ opacity: 1, x: 0 }}
      viewport={{ once: true }}
      className="brutal-card hover:brutal-shadow transition-all group relative"
    >
      <div className="flex items-center justify-between mb-4">
        <span className="font-mono text-xs opacity-50">{index} / KILL SHOT</span>
        <div className="opacity-30 group-hover:opacity-100 transition-opacity">
          {icon}
        </div>
      </div>
      
      <div className="flex items-center gap-3 mb-4">
        <h3 className="font-display text-2xl font-bold uppercase tracking-tight">
          {title}
        </h3>
        <div className="relative group/tooltip">
          <AlertTriangle size={14} className="text-brutal-white/20 cursor-help" />
          <div className="absolute bottom-full left-1/2 -translate-x-1/2 mb-2 w-48 p-2 bg-brutal-white text-brutal-black text-[10px] font-mono uppercase tracking-tighter leading-tight opacity-0 group-hover/tooltip:opacity-100 pointer-events-none transition-opacity z-50 brutal-shadow">
            {tooltip}
          </div>
        </div>
      </div>

      <p className="font-mono text-sm text-brutal-white/80 leading-relaxed">
        {content}
      </p>
    </motion.div>
  );
}
