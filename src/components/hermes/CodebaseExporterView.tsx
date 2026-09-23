import React, { useState } from 'react';
import { 
  FolderTree, 
  FileCode, 
  Download, 
  Copy, 
  Check, 
  Terminal, 
  FileText, 
  ExternalLink,
  Cpu,
  Layers,
  Sparkles,
  BookOpen,
  ArrowRight
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { NATIVE_PROJECT_FILES, downloadProjectZip } from '@/services/nativeCodebase';
import { ProjectFile } from '@/types/hermes';
import { toast } from 'sonner';

export const CodebaseExporterView: React.FC = () => {
  const [selectedFile, setSelectedFile] = useState<ProjectFile>(NATIVE_PROJECT_FILES[0]);
  const [copied, setCopied] = useState(false);
  const [isZipping, setIsZipping] = useState(false);

  const handleCopy = () => {
    navigator.clipboard.writeText(selectedFile.content);
    setCopied(true);
    toast.success(`Copied ${selectedFile.filename} to clipboard`);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleDownload = async () => {
    try {
      setIsZipping(true);
      await downloadProjectZip();
      toast.success('Downloaded hermes-desktop-cpp-rust.zip! Ready to build natively.');
    } catch (err) {
      toast.error('Failed to generate ZIP archive');
    } finally {
      setIsZipping(false);
    }
  };

  const getFileBadgeColor = (lang: ProjectFile['language']) => {
    switch (lang) {
      case 'rust': return 'bg-orange-950/40 text-orange-400 border-orange-800/60';
      case 'cpp': return 'bg-cyan-950/40 text-cyan-300 border-cyan-800/60';
      case 'cmake': return 'bg-emerald-950/40 text-emerald-400 border-emerald-800/60';
      case 'toml': return 'bg-purple-950/40 text-purple-300 border-purple-800/60';
      case 'bash': return 'bg-amber-950/40 text-amber-300 border-amber-800/60';
      default: return 'bg-slate-800 text-slate-300 border-slate-700';
    }
  };

  return (
    <div className="h-full flex flex-col bg-slate-950/60 overflow-hidden">
      {/* Top Banner with Download Button */}
      <div className="p-4 sm:p-5 border-b border-slate-800/80 bg-slate-900/50 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <h2 className="text-base sm:text-lg font-bold text-slate-100 flex items-center gap-2">
              <FolderTree className="w-5 h-5 text-cyan-400" />
              Native C++ & Rust Source Codebase
            </h2>
            <Badge variant="outline" className="text-[10px] font-mono border-cyan-800 bg-cyan-950/40 text-cyan-300">
              10 Compile-Ready Files
            </Badge>
          </div>
          <p className="text-xs text-slate-400 mt-1 max-w-2xl">
            This is the complete, ready-to-compile desktop application repository. It combines a high-concurrency Rust agent supervisor (Tokio) with a C++20 inference engine (llama.cpp) via zero-overhead CXX FFI.
          </p>
        </div>

        <Button
          onClick={handleDownload}
          disabled={isZipping}
          size="sm"
          className="h-9 bg-gradient-to-r from-cyan-500 to-blue-600 hover:from-cyan-400 hover:to-blue-500 text-slate-950 font-bold px-4 text-xs gap-2 shadow-lg shadow-cyan-500/20 shrink-0"
        >
          <Download className="w-4 h-4" />
          <span>{isZipping ? 'Packaging ZIP...' : 'Download Full Project (.zip)'}</span>
        </Button>
      </div>

      {/* Main split: File explorer on left, code viewer on right */}
      <div className="flex-1 flex flex-col md:flex-row overflow-hidden">
        {/* Left: File Tree */}
        <div className="w-full md:w-72 border-r border-slate-800/80 bg-slate-950/80 overflow-y-auto p-3 space-y-1">
          <div className="text-[11px] font-mono text-slate-400 uppercase tracking-wider px-2 py-1 flex items-center justify-between">
            <span>Project Files</span>
            <span>{NATIVE_PROJECT_FILES.length} files</span>
          </div>

          <div className="space-y-1">
            {NATIVE_PROJECT_FILES.map((file) => (
              <button
                key={file.path}
                onClick={() => setSelectedFile(file)}
                className={`w-full text-left px-3 py-2 rounded-lg text-xs font-mono transition-all flex items-center justify-between group ${
                  selectedFile.path === file.path
                    ? 'bg-cyan-950/50 border border-cyan-800/60 text-cyan-200'
                    : 'text-slate-400 hover:text-slate-200 hover:bg-slate-900/60'
                }`}
              >
                <div className="flex items-center gap-2 truncate">
                  <FileCode className={`w-3.5 h-3.5 shrink-0 ${selectedFile.path === file.path ? 'text-cyan-400' : 'text-slate-500 group-hover:text-slate-300'}`} />
                  <span className="truncate">{file.path}</span>
                </div>
                <Badge variant="outline" className={`text-[9px] py-0 px-1 font-mono uppercase shrink-0 ${getFileBadgeColor(file.language)}`}>
                  {file.language}
                </Badge>
              </button>
            ))}
          </div>

          {/* Quick Build Instructions Box */}
          <div className="mt-4 p-3 rounded-lg border border-slate-800 bg-slate-900/60 text-[11px] font-mono text-slate-400 space-y-2">
            <span className="text-slate-300 font-bold flex items-center gap-1.5 font-sans">
              <Terminal className="w-3.5 h-3.5 text-cyan-400" />
              Quick Native Build:
            </span>
            <div className="p-2 rounded bg-black/60 text-cyan-300 overflow-x-auto text-[10px]">
              <code>
                chmod +x build.sh<br/>
                ./build.sh<br/>
                ./target/release/hermes-desktop
              </code>
            </div>
            <p className="text-[10px] text-slate-500 font-sans leading-relaxed">
              Requires GCC/Clang with C++20, CMake 3.22+, and Rust 1.75+.
            </p>
          </div>
        </div>

        {/* Right: Code Inspector */}
        <div className="flex-1 flex flex-col bg-slate-950 overflow-hidden">
          {/* File Header */}
          <div className="px-4 py-2.5 border-b border-slate-800/80 bg-slate-900/60 flex items-center justify-between">
            <div className="flex items-center gap-2 font-mono text-xs">
              <FileCode className="w-4 h-4 text-cyan-400" />
              <span className="font-bold text-slate-200">{selectedFile.path}</span>
              <span className="text-slate-500">•</span>
              <span className="text-slate-400 text-[11px] font-sans hidden sm:inline">{selectedFile.description}</span>
            </div>

            <div className="flex items-center gap-2">
              <Button
                onClick={handleCopy}
                variant="ghost"
                size="sm"
                className="h-7 px-2.5 text-xs text-slate-300 hover:text-slate-100 hover:bg-slate-800 gap-1.5"
              >
                {copied ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
                <span>{copied ? 'Copied' : 'Copy File'}</span>
              </Button>
            </div>
          </div>

          {/* Code Viewer with Line Numbers */}
          <div className="flex-1 overflow-auto p-4 font-mono text-xs text-slate-200 bg-slate-950">
            <div className="flex">
              {/* Line numbers */}
              <div className="select-none text-slate-600 text-right pr-4 border-r border-slate-800/80 leading-6 text-[11px]">
                {selectedFile.content.split('\n').map((_, index) => (
                  <div key={index}>{index + 1}</div>
                ))}
              </div>

              {/* Code content */}
              <pre className="pl-4 leading-6 overflow-x-auto text-[11px] text-slate-200 flex-1">
                <code>{selectedFile.content}</code>
              </pre>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
