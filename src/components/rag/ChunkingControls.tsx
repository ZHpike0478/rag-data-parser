import React from 'react';
import {
  Sliders,
  Layers,
  Scissors,
  ShieldCheck,
  Sparkles,
  HelpCircle,
  Wand2,
  RefreshCw
} from 'lucide-react';
import { Slider } from '@/components/ui/slider';
import { Switch } from '@/components/ui/switch';
import { Label } from '@/components/ui/label';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { 
  Tooltip, 
  TooltipContent, 
  TooltipTrigger 
} from '@/components/ui/tooltip';
import { ChunkingConfig, PreprocessingConfig, ChunkingStrategy } from '@/types/rag';

interface ChunkingControlsProps {
  chunkConfig: ChunkingConfig;
  onUpdateChunkConfig: (config: Partial<ChunkingConfig>) => void;
  prepConfig: PreprocessingConfig;
  onUpdatePrepConfig: (config: Partial<PreprocessingConfig>) => void;
  onRechunk: () => void;
  totalChunks: number;
}

const STRATEGIES: { id: ChunkingStrategy; label: string; desc: string; icon: string }[] = [
  { 
    id: 'recursive', 
    label: 'Recursive Character', 
    desc: 'Hierarchical split on paragraphs, lines, sentences & words (LangChain standard)',
    icon: '⚡'
  },
  { 
    id: 'markdown_header', 
    label: 'Markdown Hierarchy', 
    desc: 'Splits on #, ##, ### headers and builds breadcrumb trails for each chunk',
    icon: '📑'
  },
  { 
    id: 'semantic_sentence', 
    label: 'Sentence Boundary', 
    desc: 'Preserves complete grammatical sentences without cutting mid-thought',
    icon: '💬'
  },
  { 
    id: 'fixed_token', 
    label: 'Sliding Token Window', 
    desc: 'Strict token bounds with sliding overlap for uniform vector density',
    icon: '📏'
  },
  { 
    id: 'tabular_record', 
    label: 'Tabular / Entity Records', 
    desc: 'Optimized for CSV and JSON records with column anchor headers',
    icon: '📊'
  },
  { 
    id: 'code_ast', 
    label: 'Code AST Blocks', 
    desc: 'Splits on functions, classes, and top-level definitions',
    icon: '💻'
  }
];

export const ChunkingControls: React.FC<ChunkingControlsProps> = ({
  chunkConfig,
  onUpdateChunkConfig,
  prepConfig,
  onUpdatePrepConfig,
  onRechunk,
  totalChunks
}) => {
  const overlapPercent = chunkConfig.chunkSize > 0 
    ? Math.round((chunkConfig.chunkOverlap / chunkConfig.chunkSize) * 100) 
    : 0;

  return (
    <div className="bg-slate-900/60 border border-slate-800/80 rounded-2xl p-4 sm:p-5 shadow-xl space-y-6">
      <div className="flex items-center justify-between border-b border-slate-800/80 pb-3">
        <div className="flex items-center gap-2">
          <Sliders className="w-4 h-4 text-cyan-400" />
          <h2 className="text-sm font-semibold text-slate-100">
            RAG Chunking & Preprocessing Pipeline
          </h2>
        </div>
        <Button
          size="sm"
          variant="outline"
          onClick={onRechunk}
          className="text-xs h-7 text-cyan-300 border-cyan-800/50 hover:bg-cyan-950/40"
        >
          <RefreshCw className="w-3 h-3 mr-1" />
          Re-process
        </Button>
      </div>

      {/* 1. Strategy Selector */}
      <div className="space-y-2.5">
        <div className="flex items-center justify-between">
          <Label className="text-xs font-medium text-slate-300 flex items-center gap-1.5">
            <Layers className="w-3.5 h-3.5 text-indigo-400" />
            Chunking Strategy
          </Label>
          <span className="text-[11px] font-mono text-cyan-400 capitalize">
            {chunkConfig.strategy.replace('_', ' ')}
          </span>
        </div>

        <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
          {STRATEGIES.map((s) => (
            <button
              key={s.id}
              onClick={() => {
                onUpdateChunkConfig({ strategy: s.id });
              }}
              className={`p-2.5 rounded-xl border text-left transition-all relative ${
                chunkConfig.strategy === s.id
                  ? 'border-cyan-400 bg-cyan-950/30 text-white shadow-sm shadow-cyan-500/20'
                  : 'border-slate-800 bg-slate-950/40 text-slate-400 hover:border-slate-700 hover:text-slate-200'
              }`}
            >
              <div className="flex items-center gap-1.5 text-xs font-semibold">
                <span>{s.icon}</span>
                <span className="truncate">{s.label}</span>
              </div>
              <p className="text-[10px] text-slate-400 mt-1 line-clamp-2 leading-tight">
                {s.desc}
              </p>
            </button>
          ))}
        </div>
      </div>

      {/* 2. Sliders: Chunk Size & Chunk Overlap */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-5 pt-2">
        {/* Chunk Size */}
        <div className="space-y-2 bg-slate-950/40 border border-slate-800/60 p-3 rounded-xl">
          <div className="flex items-center justify-between">
            <Label className="text-xs font-medium text-slate-300 flex items-center gap-1.5">
              <Scissors className="w-3.5 h-3.5 text-cyan-400" />
              Target Chunk Size
              <Tooltip>
                <TooltipTrigger>
                  <HelpCircle className="w-3 h-3 text-slate-500" />
                </TooltipTrigger>
                <TooltipContent className="text-xs max-w-xs">
                  Target length per chunk in characters (~4 chars = 1 token). Smaller chunks give precise vector matches; larger chunks preserve surrounding context.
                </TooltipContent>
              </Tooltip>
            </Label>
            <span className="text-xs font-mono font-semibold text-cyan-300">
              {chunkConfig.chunkSize} chars <span className="text-slate-500 font-normal">(~{Math.round(chunkConfig.chunkSize / 4)} tokens)</span>
            </span>
          </div>

          <Slider
            value={[chunkConfig.chunkSize]}
            min={150}
            max={2000}
            step={50}
            onValueChange={([val]) => onUpdateChunkConfig({ chunkSize: val })}
            className="py-1"
          />

          <div className="flex items-center gap-1.5 pt-1">
            <span className="text-[10px] text-slate-500">Presets:</span>
            {[300, 600, 1000, 1500].map((preset) => (
              <button
                key={preset}
                onClick={() => onUpdateChunkConfig({ chunkSize: preset })}
                className={`text-[10px] px-2 py-0.5 rounded border transition-colors ${
                  chunkConfig.chunkSize === preset
                    ? 'border-cyan-500/60 bg-cyan-950/60 text-cyan-300'
                    : 'border-slate-800 bg-slate-900 text-slate-400 hover:text-slate-200'
                }`}
              >
                {preset}
              </button>
            ))}
          </div>
        </div>

        {/* Chunk Overlap */}
        <div className="space-y-2 bg-slate-950/40 border border-slate-800/60 p-3 rounded-xl">
          <div className="flex items-center justify-between">
            <Label className="text-xs font-medium text-slate-300 flex items-center gap-1.5">
              <Sparkles className="w-3.5 h-3.5 text-indigo-400" />
              Chunk Overlap
              <Tooltip>
                <TooltipTrigger>
                  <HelpCircle className="w-3 h-3 text-slate-500" />
                </TooltipTrigger>
                <TooltipContent className="text-xs max-w-xs">
                  Carries the last N characters of a chunk into the next chunk. Recommended 10%–20% to prevent sentence fragmentation at boundaries.
                </TooltipContent>
              </Tooltip>
            </Label>
            <span className="text-xs font-mono font-semibold text-indigo-300">
              {chunkConfig.chunkOverlap} chars <span className="text-slate-500 font-normal">({overlapPercent}%)</span>
            </span>
          </div>

          <Slider
            value={[chunkConfig.chunkOverlap]}
            min={0}
            max={Math.min(500, Math.round(chunkConfig.chunkSize * 0.5))}
            step={20}
            onValueChange={([val]) => onUpdateChunkConfig({ chunkOverlap: val })}
            className="py-1"
          />

          <div className="flex items-center gap-1.5 pt-1">
            <span className="text-[10px] text-slate-500">Presets:</span>
            {[0, 60, 120, 200].map((preset) => (
              <button
                key={preset}
                onClick={() => onUpdateChunkConfig({ chunkOverlap: preset })}
                className={`text-[10px] px-2 py-0.5 rounded border transition-colors ${
                  chunkConfig.chunkOverlap === preset
                    ? 'border-indigo-500/60 bg-indigo-950/60 text-indigo-300'
                    : 'border-slate-800 bg-slate-900 text-slate-400 hover:text-slate-200'
                }`}
              >
                {preset}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* 3. Anthropic Contextual Retrieval Prefix */}
      <div className="bg-slate-950/60 border border-cyan-900/30 rounded-xl p-3.5 space-y-2.5">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Wand2 className="w-4 h-4 text-cyan-400" />
            <div>
              <span className="text-xs font-semibold text-slate-200">
                Anthropic Contextual Prefix Injection
              </span>
              <p className="text-[10px] text-slate-400">
                Prepends document title & section hierarchy breadcrumbs to boost retrieval accuracy by +35%
              </p>
            </div>
          </div>
          <Switch
            checked={chunkConfig.addContextualPrefix}
            onCheckedChange={(checked) => onUpdateChunkConfig({ addContextualPrefix: checked })}
          />
        </div>

        {chunkConfig.addContextualPrefix && (
          <div className="pt-2 border-t border-slate-800/80">
            <label className="text-[11px] text-slate-400 block mb-1">
              Prefix Format Template
            </label>
            <Input
              value={chunkConfig.prefixTemplate}
              onChange={(e) => onUpdateChunkConfig({ prefixTemplate: e.target.value })}
              className="bg-slate-900 border-slate-800 text-xs font-mono h-8"
              placeholder="[Document: {docName}{section}]"
            />
            <span className="text-[10px] text-slate-500 mt-1 block">
              Available variables: <code className="text-cyan-400">{"{docName}"}</code>, <code className="text-cyan-400">{"{section}"}</code>
            </span>
          </div>
        )}
      </div>

      {/* 4. Preprocessing & Cleanliness Controls */}
      <div className="space-y-2.5">
        <Label className="text-xs font-semibold text-slate-300 flex items-center gap-1.5">
          <ShieldCheck className="w-3.5 h-3.5 text-emerald-400" />
          Preprocessing & Sanitization Rules
        </Label>

        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-2.5">
          {/* Whitespace */}
          <div className="flex items-center justify-between bg-slate-950/40 border border-slate-800/60 p-2.5 rounded-lg">
            <div className="text-xs">
              <p className="text-slate-200 font-medium">Normalize Spacing</p>
              <p className="text-[10px] text-slate-400">Collapse excess linebreaks</p>
            </div>
            <Switch
              checked={prepConfig.normalizeWhitespace}
              onCheckedChange={(v) => onUpdatePrepConfig({ normalizeWhitespace: v })}
            />
          </div>

          {/* HTML stripping */}
          <div className="flex items-center justify-between bg-slate-950/40 border border-slate-800/60 p-2.5 rounded-lg">
            <div className="text-xs">
              <p className="text-slate-200 font-medium">Strip HTML Tags</p>
              <p className="text-[10px] text-slate-400">Remove &lt;div&gt;, &lt;p&gt; tags</p>
            </div>
            <Switch
              checked={prepConfig.stripHtml}
              onCheckedChange={(v) => onUpdatePrepConfig({ stripHtml: v })}
            />
          </div>

          {/* Hyphenation Fix */}
          <div className="flex items-center justify-between bg-slate-950/40 border border-slate-800/60 p-2.5 rounded-lg">
            <div className="text-xs">
              <p className="text-slate-200 font-medium">Fix PDF Hyphens</p>
              <p className="text-[10px] text-slate-400">Join "infor- \n mation"</p>
            </div>
            <Switch
              checked={prepConfig.fixHyphenation}
              onCheckedChange={(v) => onUpdatePrepConfig({ fixHyphenation: v })}
            />
          </div>

          {/* Remove Boilerplate */}
          <div className="flex items-center justify-between bg-slate-950/40 border border-slate-800/60 p-2.5 rounded-lg">
            <div className="text-xs">
              <p className="text-slate-200 font-medium">Strip Boilerplate</p>
              <p className="text-[10px] text-slate-400">Remove ASCII dividers</p>
            </div>
            <Switch
              checked={prepConfig.removeBoilerplate}
              onCheckedChange={(v) => onUpdatePrepConfig({ removeBoilerplate: v })}
            />
          </div>

          {/* PII Masking */}
          <div className="flex items-center justify-between bg-slate-950/40 border border-slate-800/60 p-2.5 rounded-lg sm:col-span-2">
            <div className="text-xs">
              <div className="flex items-center gap-1.5">
                <p className="text-slate-200 font-medium">Anonymize PII Data</p>
                <span className="text-[9px] bg-amber-500/20 text-amber-300 px-1.5 py-0.2 rounded font-mono">Privacy</span>
              </div>
              <p className="text-[10px] text-slate-400">Redact Emails, Phone #s, IPs, and Credit Cards</p>
            </div>
            <Switch
              checked={prepConfig.maskPII}
              onCheckedChange={(v) => onUpdatePrepConfig({ maskPII: v })}
            />
          </div>
        </div>
      </div>
    </div>
  );
};
