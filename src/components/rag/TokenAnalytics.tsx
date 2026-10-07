import React, { useMemo } from 'react';
import { 
  BarChart, 
  Bar, 
  XAxis, 
  YAxis, 
  Tooltip, 
  ResponsiveContainer, 
  Cell,
  PieChart,
  Pie
} from 'recharts';
import { 
  Hash, 
  Coins, 
  Layers, 
  BarChart3, 
  Scale, 
  TrendingUp, 
  CheckCircle, 
  AlertTriangle 
} from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { RagChunk, RagDocument } from '@/types/rag';

interface TokenAnalyticsProps {
  chunks: RagChunk[];
  documents: RagDocument[];
}

export const TokenAnalytics: React.FC<TokenAnalyticsProps> = ({
  chunks,
  documents
}) => {
  const stats = useMemo(() => {
    if (chunks.length === 0) {
      return {
        totalTokens: 0,
        avgTokens: 0,
        minTokens: 0,
        maxTokens: 0,
        costOpenAiSmall: '0.00000',
        costOpenAiLarge: '0.00000',
        costCohere: '0.00000',
        tokenBuckets: [],
        docDistribution: [],
        uniformityScore: 100
      };
    }

    const tokenCounts = chunks.map(c => c.tokenCount);
    const totalTokens = tokenCounts.reduce((a, b) => a + b, 0);
    const avgTokens = Math.round(totalTokens / chunks.length);
    const minTokens = Math.min(...tokenCounts);
    const maxTokens = Math.max(...tokenCounts);

    // Costs per 1M tokens: text-embedding-3-small ($0.02), text-embedding-3-large ($0.13), Cohere embed v3 ($0.10)
    const costOpenAiSmall = ((totalTokens / 1_000_000) * 0.02).toFixed(5);
    const costOpenAiLarge = ((totalTokens / 1_000_000) * 0.13).toFixed(5);
    const costCohere = ((totalTokens / 1_000_000) * 0.10).toFixed(5);

    // Token buckets for histogram
    const bucketRanges = [
      { label: '< 100', min: 0, max: 100 },
      { label: '100-200', min: 101, max: 200 },
      { label: '200-300', min: 201, max: 300 },
      { label: '300-400', min: 301, max: 400 },
      { label: '400-500', min: 401, max: 500 },
      { label: '500+', min: 501, max: Infinity }
    ];

    const tokenBuckets = bucketRanges.map(b => {
      const count = chunks.filter(c => c.tokenCount >= b.min && c.tokenCount <= b.max).length;
      return {
        range: b.label,
        count,
        percent: Math.round((count / chunks.length) * 100)
      };
    });

    // Per document distribution
    const docDistribution = documents.map(doc => {
      const docChunks = chunks.filter(c => c.documentId === doc.id);
      const docTokens = docChunks.reduce((a, c) => a + c.tokenCount, 0);
      return {
        name: doc.name.length > 18 ? doc.name.slice(0, 16) + '...' : doc.name,
        fullName: doc.name,
        chunks: docChunks.length,
        tokens: docTokens
      };
    });

    // Uniformity standard deviation
    const variance = tokenCounts.reduce((acc, val) => acc + Math.pow(val - avgTokens, 2), 0) / chunks.length;
    const stdDev = Math.sqrt(variance);
    // Score from 0 to 100 (lower stdDev relative to avg is higher uniformity)
    const uniformityScore = Math.max(20, Math.min(99, Math.round(100 - (stdDev / (avgTokens || 1)) * 40)));

    return {
      totalTokens,
      avgTokens,
      minTokens,
      maxTokens,
      costOpenAiSmall,
      costOpenAiLarge,
      costCohere,
      tokenBuckets,
      docDistribution,
      uniformityScore
    };
  }, [chunks, documents]);

  const COLORS = ['#06b6d4', '#6366f1', '#10b981', '#f59e0b', '#ec4899', '#8b5cf6'];

  return (
    <div className="space-y-6">
      {/* KPI Cards Row */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
        <div className="bg-slate-900/60 border border-slate-800 p-4 rounded-xl">
          <div className="flex items-center justify-between text-slate-400 text-xs mb-1">
            <span>Total Tokens</span>
            <Hash className="w-4 h-4 text-cyan-400" />
          </div>
          <div className="text-2xl font-bold font-mono text-cyan-300">
            {stats.totalTokens.toLocaleString()}
          </div>
          <p className="text-[11px] text-slate-500 mt-1">Across {chunks.length} chunks</p>
        </div>

        <div className="bg-slate-900/60 border border-slate-800 p-4 rounded-xl">
          <div className="flex items-center justify-between text-slate-400 text-xs mb-1">
            <span>Avg Chunk Size</span>
            <Scale className="w-4 h-4 text-indigo-400" />
          </div>
          <div className="text-2xl font-bold font-mono text-indigo-300">
            {stats.avgTokens} <span className="text-sm font-normal text-slate-400">tokens</span>
          </div>
          <p className="text-[11px] text-slate-500 mt-1">Min: {stats.minTokens} | Max: {stats.maxTokens}</p>
        </div>

        <div className="bg-slate-900/60 border border-slate-800 p-4 rounded-xl">
          <div className="flex items-center justify-between text-slate-400 text-xs mb-1">
            <span>Chunk Uniformity</span>
            <TrendingUp className="w-4 h-4 text-emerald-400" />
          </div>
          <div className="text-2xl font-bold font-mono text-emerald-300">
            {stats.uniformityScore}%
          </div>
          <p className="text-[11px] text-slate-500 mt-1">
            {stats.uniformityScore > 75 ? 'Balanced chunk distribution' : 'Variable size distribution'}
          </p>
        </div>

        <div className="bg-slate-900/60 border border-slate-800 p-4 rounded-xl">
          <div className="flex items-center justify-between text-slate-400 text-xs mb-1">
            <span>Est. Embedding Cost</span>
            <Coins className="w-4 h-4 text-amber-400" />
          </div>
          <div className="text-2xl font-bold font-mono text-amber-300">
            ${stats.costOpenAiSmall}
          </div>
          <p className="text-[11px] text-slate-500 mt-1">OpenAI text-embedding-3-small</p>
        </div>
      </div>

      {/* Visual Charts Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        {/* Token Distribution Histogram */}
        <div className="bg-slate-900/60 border border-slate-800 p-4 sm:p-5 rounded-2xl">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h3 className="text-sm font-bold text-white flex items-center gap-1.5">
                <BarChart3 className="w-4 h-4 text-cyan-400" />
                Token Distribution Histogram
              </h3>
              <p className="text-xs text-slate-400">Chunk count grouped by token range</p>
            </div>
            <Badge variant="outline" className="text-[10px] font-mono border-cyan-800 text-cyan-300">
              {chunks.length} Total
            </Badge>
          </div>

          <div className="h-64 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={stats.tokenBuckets} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                <XAxis 
                  dataKey="range" 
                  stroke="#64748b" 
                  fontSize={11}
                  tickLine={false}
                />
                <YAxis 
                  stroke="#64748b" 
                  fontSize={11}
                  tickLine={false}
                  allowDecimals={false}
                />
                <Tooltip
                  contentStyle={{ backgroundColor: '#090d16', borderColor: '#334155', borderRadius: '8px', fontSize: '12px' }}
                  labelStyle={{ color: '#e2e8f0', fontWeight: 'bold' }}
                />
                <Bar dataKey="count" name="Chunks" radius={[6, 6, 0, 0]}>
                  {stats.tokenBuckets.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Chunks Per Document Chart */}
        <div className="bg-slate-900/60 border border-slate-800 p-4 sm:p-5 rounded-2xl">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h3 className="text-sm font-bold text-white flex items-center gap-1.5">
                <Layers className="w-4 h-4 text-indigo-400" />
                Chunks & Tokens per Document
              </h3>
              <p className="text-xs text-slate-400">Volume breakdown by ingested file</p>
            </div>
            <Badge variant="outline" className="text-[10px] font-mono border-indigo-800 text-indigo-300">
              {documents.length} Docs
            </Badge>
          </div>

          <div className="h-64 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={stats.docDistribution} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                <XAxis 
                  dataKey="name" 
                  stroke="#64748b" 
                  fontSize={11}
                  tickLine={false}
                />
                <YAxis 
                  stroke="#64748b" 
                  fontSize={11}
                  tickLine={false}
                  allowDecimals={false}
                />
                <Tooltip
                  contentStyle={{ backgroundColor: '#090d16', borderColor: '#334155', borderRadius: '8px', fontSize: '12px' }}
                  labelStyle={{ color: '#e2e8f0', fontWeight: 'bold' }}
                />
                <Bar dataKey="chunks" name="Chunks" fill="#6366f1" radius={[6, 6, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>

      {/* Embedding Provider Cost Breakdown */}
      <div className="bg-slate-900/60 border border-slate-800 p-4 sm:p-5 rounded-2xl">
        <h3 className="text-sm font-bold text-white mb-2 flex items-center gap-2">
          <Coins className="w-4 h-4 text-amber-400" />
          Vector Embedding Provider Cost Comparison
        </h3>
        <p className="text-xs text-slate-400 mb-4">
          Estimated indexing cost based on published API pricing for your {stats.totalTokens.toLocaleString()} tokens:
        </p>

        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 text-xs">
          <div className="p-3 rounded-xl bg-slate-950/80 border border-slate-800/80 space-y-1">
            <div className="flex items-center justify-between">
              <span className="font-semibold text-slate-200">OpenAI Small</span>
              <Badge variant="outline" className="text-[9px] border-emerald-800 text-emerald-300 font-mono">1536 dim</Badge>
            </div>
            <div className="text-lg font-bold font-mono text-emerald-400">${stats.costOpenAiSmall}</div>
            <p className="text-[10px] text-slate-500">$0.02 / 1M tokens (Recommended for RAG)</p>
          </div>

          <div className="p-3 rounded-xl bg-slate-950/80 border border-slate-800/80 space-y-1">
            <div className="flex items-center justify-between">
              <span className="font-semibold text-slate-200">OpenAI Large</span>
              <Badge variant="outline" className="text-[9px] border-cyan-800 text-cyan-300 font-mono">3072 dim</Badge>
            </div>
            <div className="text-lg font-bold font-mono text-cyan-400">${stats.costOpenAiLarge}</div>
            <p className="text-[10px] text-slate-500">$0.13 / 1M tokens (High precision)</p>
          </div>

          <div className="p-3 rounded-xl bg-slate-950/80 border border-slate-800/80 space-y-1">
            <div className="flex items-center justify-between">
              <span className="font-semibold text-slate-200">Cohere Embed v3</span>
              <Badge variant="outline" className="text-[9px] border-indigo-800 text-indigo-300 font-mono">1024 dim</Badge>
            </div>
            <div className="text-lg font-bold font-mono text-indigo-400">${stats.costCohere}</div>
            <p className="text-[10px] text-slate-500">$0.10 / 1M tokens (Multi-lingual)</p>
          </div>
        </div>
      </div>
    </div>
  );
};
