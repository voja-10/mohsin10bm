
import React, { useState } from 'react';
import { ChevronLeft, Share2, Info, CheckCircle2, AlertTriangle, AlertCircle, RefreshCcw, ExternalLink, Globe } from 'lucide-react';
import { ProductAnalysis, Ingredient, GroundingSource } from '../types';

interface AnalysisViewProps {
  analysis: ProductAnalysis;
  onBack: () => void;
  onScanAnother: () => void;
}

const AnalysisView: React.FC<AnalysisViewProps> = ({ analysis, onBack, onScanAnother }) => {
  const [filter, setFilter] = useState<'ALL' | 'SAFE' | 'CAUTION' | 'HARMFUL'>('ALL');

  const filteredIngredients = analysis.ingredients.filter(ing => {
    if (filter === 'ALL') return true;
    return ing.status === filter;
  });

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'SAFE': return <CheckCircle2 className="w-4 h-4 text-emerald-400" />;
      case 'CAUTION': return <AlertTriangle className="w-4 h-4 text-amber-400" />;
      case 'HARMFUL': return <AlertCircle className="w-4 h-4 text-rose-400" />;
      default: return null;
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'SAFE': return 'text-emerald-400 border-emerald-400/30 bg-emerald-400/5';
      case 'CAUTION': return 'text-amber-400 border-amber-400/30 bg-amber-400/5';
      case 'HARMFUL': return 'text-rose-400 border-rose-400/30 bg-rose-400/5';
      default: return '';
    }
  };

  const getStatusLabel = (status: string) => {
    switch (status) {
      case 'SAFE': return 'SAFE';
      case 'CAUTION': return 'CAUTION';
      case 'HARMFUL': return 'HARMFUL';
      default: return '';
    }
  };

  return (
    <div className="min-h-screen bg-[#0d1b1a] pb-32">
      {/* Header */}
      <div className="p-6 flex justify-between items-center sticky top-0 bg-[#0d1b1a]/80 backdrop-blur-md z-10">
        <button onClick={onBack} className="p-2 bg-white/5 rounded-full">
          <ChevronLeft className="w-6 h-6 text-emerald-400" />
        </button>
        <h2 className="text-white text-xs font-bold uppercase tracking-widest">Analysis Report</h2>
        <button className="p-2 bg-white/5 rounded-full">
          <Share2 className="w-6 h-6 text-emerald-400" />
        </button>
      </div>

      <div className="px-6 space-y-8">
        {/* Product Hero */}
        <div className="flex flex-col items-center text-center space-y-4">
          <div className="w-48 h-48 bg-white/5 rounded-3xl overflow-hidden flex items-center justify-center border border-white/10 shadow-2xl">
            <img 
              src={`https://picsum.photos/seed/${analysis.name}/300/300`} 
              alt={analysis.name}
              className="w-full h-full object-cover p-4"
            />
          </div>
          <div>
            <p className="text-emerald-400 text-[10px] font-bold uppercase tracking-[0.2em] mb-1">{analysis.brand}</p>
            <h1 className="text-white text-2xl font-bold">{analysis.name}</h1>
            <p className="text-gray-500 text-sm mt-1">AI Verified Ingredients Analysis</p>
          </div>
        </div>

        {/* Safety Score Section */}
        <div className="glass rounded-[2rem] p-8 relative overflow-hidden">
          <div className="absolute -top-12 -right-12 w-32 h-32 bg-emerald-400/10 rounded-full blur-3xl"></div>
          
          <div className="flex flex-col items-center space-y-6">
            <div className="relative w-40 h-40">
              <svg className="w-full h-full transform -rotate-90">
                <circle
                  cx="80" cy="80" r="70"
                  fill="transparent"
                  stroke="currentColor"
                  strokeWidth="8"
                  className="text-white/5"
                />
                <circle
                  cx="80" cy="80" r="70"
                  fill="transparent"
                  stroke="currentColor"
                  strokeWidth="8"
                  strokeDasharray={440}
                  strokeDashoffset={440 - (440 * analysis.safetyScore) / 100}
                  className="text-emerald-400 transition-all duration-1000"
                />
              </svg>
              <div className="absolute inset-0 flex flex-col items-center justify-center">
                <span className="text-5xl font-bold text-white leading-none">{analysis.safetyScore}</span>
                <span className="text-[10px] text-gray-400 uppercase font-bold tracking-widest mt-1">Safety Score</span>
              </div>
            </div>

            <div className="bg-emerald-400/20 px-4 py-2 rounded-full border border-emerald-400/30 flex items-center gap-2">
              <CheckCircle2 className="w-4 h-4 text-emerald-400" />
              <span className="text-emerald-400 text-xs font-bold uppercase tracking-wider">{analysis.ratingText} Rating</span>
            </div>

            <p className="text-gray-300 text-sm text-center leading-relaxed">
              {analysis.analysisSummary}
            </p>
          </div>
        </div>

        {/* AI Skin Analysis */}
        <div className="glass rounded-3xl p-6 border-l-4 border-emerald-400">
          <div className="flex items-center gap-3 mb-3">
            <div className="w-8 h-8 rounded-full bg-emerald-400/20 flex items-center justify-center">
              <Info className="w-4 h-4 text-emerald-400" />
            </div>
            <h3 className="text-emerald-400 text-xs font-bold uppercase tracking-widest">AI Skin Analysis</h3>
          </div>
          <p className="text-gray-200 text-sm leading-relaxed italic">
            {analysis.skinAnalysis}
          </p>
        </div>

        {/* Ingredients Header & Filter */}
        <div className="space-y-4">
          <div className="flex justify-between items-center">
            <h3 className="text-white text-lg font-bold">Ingredient Analysis</h3>
            <span className="bg-white/10 text-emerald-400 px-3 py-1 rounded-full text-xs font-bold">{analysis.ingredients.length} Found</span>
          </div>
          
          <div className="flex gap-2 overflow-x-auto no-scrollbar pb-2">
            {(['ALL', 'SAFE', 'CAUTION', 'HARMFUL'] as const).map((type) => (
              <button
                key={type}
                onClick={() => setFilter(type)}
                className={`px-4 py-2 rounded-full text-[10px] font-bold transition-all whitespace-nowrap ${
                  filter === type 
                    ? 'bg-emerald-400 text-black' 
                    : 'bg-white/5 text-gray-400 border border-white/10'
                }`}
              >
                {type === 'ALL' ? 'All' : `${type.charAt(0) + type.slice(1).toLowerCase()} (${analysis.ingredients.filter(i => i.status === type).length})`}
              </button>
            ))}
          </div>
        </div>

        {/* Ingredient List */}
        <div className="space-y-4">
          {filteredIngredients.map((ing, idx) => (
            <div key={idx} className="glass rounded-2xl p-5 border border-white/5">
              <div className="flex justify-between items-start mb-2">
                <div className="flex items-center gap-3">
                   <div className={`w-2 h-2 rounded-full ${
                     ing.status === 'SAFE' ? 'bg-emerald-400' : 
                     ing.status === 'CAUTION' ? 'bg-amber-400' : 'bg-rose-400'
                   }`} />
                   <h4 className="text-white font-bold text-base">{ing.name}</h4>
                </div>
                <div className={`px-2 py-0.5 rounded border text-[8px] font-bold ${getStatusColor(ing.status)}`}>
                  {getStatusLabel(ing.status)}
                </div>
              </div>
              <p className="text-gray-400 text-xs leading-relaxed">
                <span className="text-emerald-400/70 font-bold uppercase tracking-tighter text-[10px] mr-1">AI:</span>
                {ing.description}
              </p>
            </div>
          ))}
        </div>

        {/* Sources Section */}
        {analysis.sources && analysis.sources.length > 0 && (
          <div className="space-y-4 pb-12">
            <div className="flex items-center gap-2">
              <Globe className="w-5 h-5 text-emerald-400" />
              <h3 className="text-white text-lg font-bold">Sources & Verification</h3>
            </div>
            <div className="space-y-3">
              {analysis.sources.map((source, idx) => (
                <a 
                  key={idx} 
                  href={source.uri} 
                  target="_blank" 
                  rel="noopener noreferrer"
                  className="glass rounded-2xl p-4 flex items-center justify-between border border-white/5 active:scale-[0.98] transition-all hover:bg-emerald-400/5 group"
                >
                  <div className="flex-1 mr-4">
                    <p className="text-white text-sm font-medium line-clamp-1">{source.title}</p>
                    <p className="text-gray-500 text-[10px] truncate">{source.uri}</p>
                  </div>
                  <ExternalLink className="w-4 h-4 text-emerald-400 group-hover:translate-x-0.5 group-hover:-translate-y-0.5 transition-transform" />
                </a>
              ))}
            </div>
            <p className="text-gray-500 text-[10px] italic">
              * Grounded results verified via Google Search real-time data.
            </p>
          </div>
        )}
      </div>

      {/* Floating Action Button */}
      <div className="fixed bottom-0 left-0 right-0 p-6 bg-gradient-to-t from-[#0d1b1a] via-[#0d1b1a] to-transparent">
        <button
          onClick={onScanAnother}
          className="w-full h-16 bg-emerald-400 rounded-2xl flex items-center justify-center gap-3 text-black font-bold uppercase tracking-widest shadow-xl shadow-emerald-500/20 active:scale-[0.98] transition-all"
        >
          <RefreshCcw className="w-5 h-5" />
          Scan Another Product
        </button>
      </div>
    </div>
  );
};

export default AnalysisView;
