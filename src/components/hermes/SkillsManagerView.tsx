import React, { useState } from 'react';
import { 
  Wrench, 
  Terminal, 
  Code2, 
  Globe, 
  Database, 
  Play, 
  Plus, 
  Check, 
  Sliders, 
  Clock,
  Sparkles,
  ToggleLeft,
  ToggleRight
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { HermesSkill } from '@/types/hermes';
import { RealAgentService } from '@/services/realAgentService';
import { toast } from 'sonner';

interface SkillsManagerViewProps {
  skills: HermesSkill[];
  onToggleSkill: (skillId: string) => void;
  onAddSkill: (skill: HermesSkill) => void;
}

export const SkillsManagerView: React.FC<SkillsManagerViewProps> = ({
  skills,
  onToggleSkill,
  onAddSkill,
}) => {
  const [testingSkill, setTestingSkill] = useState<HermesSkill | null>(null);
  const [testParamInput, setTestParamInput] = useState<string>('');
  const [testOutput, setTestOutput] = useState<string | null>(null);
  const [isRunningTest, setIsRunningTest] = useState(false);

  // New skill dialog state
  const [isNewSkillOpen, setIsNewSkillOpen] = useState(false);
  const [newSkillName, setNewSkillName] = useState('');
  const [newSkillDesc, setNewSkillDesc] = useState('');
  const [newSkillImpl, setNewSkillImpl] = useState<'Rust' | 'C++'>('Rust');
  const [newSkillCategory, setNewSkillCategory] = useState<'system' | 'code' | 'web' | 'memory'>('system');

  const handleOpenTest = (skill: HermesSkill) => {
    setTestingSkill(skill);
    setTestOutput(null);
    if (skill.id === 'skill-bash') {
      setTestParamInput('uname -a && cargo --version');
    } else if (skill.id === 'skill-file') {
      setTestParamInput('{"action": "list", "path": "./src"}');
    } else if (skill.id === 'skill-cxx') {
      setTestParamInput('Math.hypot(3, 4) * Math.SQRT2 + Math.PI');
    } else if (skill.id === 'skill-web') {
      setTestParamInput('https://en.wikipedia.org/api/rest_v1/page/summary/Rust_(programming_language)');
    } else {
      setTestParamInput('query: "Zeus architecture documentation"');
    }
  };

  const handleExecuteTest = async () => {
    if (!testingSkill) return;
    setIsRunningTest(true);
    setTestOutput(null);

    try {
      let args: Record<string, any> = {};
      try {
        if (testParamInput.trim().startsWith('{')) {
          args = JSON.parse(testParamInput);
        } else {
          args = { command: testParamInput, query: testParamInput, code: testParamInput, url: testParamInput };
        }
      } catch {
        args = { input: testParamInput };
      }

      const res = await RealAgentService.executeRealTool(testingSkill.name, args);
      setIsRunningTest(false);
      setTestOutput(`${res.output}\n\n[Execution Metric: ${res.executionTimeMs}ms • Status: ${res.status.toUpperCase()}]`);
      toast.success(`Executed ${testingSkill.name} with real runtime data`);
    } catch (err: any) {
      setIsRunningTest(false);
      setTestOutput(`Error executing tool: ${err.message}`);
      toast.error('Execution failed');
    }
  };

  const handleCreateSkill = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newSkillName.trim()) return;

    const newSkill: HermesSkill = {
      id: 'skill-custom-' + Date.now(),
      name: newSkillName.toLowerCase().replace(/\s+/g, '_'),
      description: newSkillDesc || 'Custom user-defined tool for Zeus Desktop agent',
      category: newSkillCategory,
      implementedIn: newSkillImpl,
      enabled: true,
      parameters: [
        { name: 'input', type: 'string', description: 'Primary operation argument', required: true }
      ]
    };

    onAddSkill(newSkill);
    setIsNewSkillOpen(false);
    setNewSkillName('');
    setNewSkillDesc('');
    toast.success(`Registered tool '${newSkill.name}' successfully!`);
  };

  const getCategoryIcon = (cat: HermesSkill['category']) => {
    switch (cat) {
      case 'system': return <Terminal className="w-4 h-4 text-orange-400" />;
      case 'code': return <Code2 className="w-4 h-4 text-cyan-400" />;
      case 'web': return <Globe className="w-4 h-4 text-emerald-400" />;
      case 'memory': return <Database className="w-4 h-4 text-purple-400" />;
    }
  };

  return (
    <div className="h-full overflow-y-auto p-4 sm:p-6 space-y-6 bg-slate-950/60">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-slate-800">
        <div>
          <h2 className="text-lg font-bold text-slate-100 flex items-center gap-2">
            <Wrench className="w-5 h-5 text-cyan-400" />
            Zeus Agent Skills & Sandboxed Tools
          </h2>
          <p className="text-xs text-slate-400 mt-0.5">
            Registered tool capabilities available to the Zeus autonomous agent loop via &lt;tool_call&gt; syntax.
          </p>
        </div>

        <Button
          onClick={() => setIsNewSkillOpen(true)}
          size="sm"
          className="h-8 bg-cyan-500 hover:bg-cyan-400 text-slate-950 text-xs font-semibold gap-1.5"
        >
          <Plus className="w-4 h-4" />
          Register Custom Tool
        </Button>
      </div>

      {/* Skills Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {skills.map((skill) => (
          <div
            key={skill.id}
            className={`p-4 rounded-xl border transition-all ${
              skill.enabled 
                ? 'bg-slate-900/90 border-slate-800 hover:border-slate-700' 
                : 'bg-slate-950/40 border-slate-900 opacity-60'
            }`}
          >
            <div className="flex items-start justify-between gap-2">
              <div className="flex items-center gap-2.5">
                <div className="p-2 rounded-lg bg-slate-800/80 border border-slate-700/60">
                  {getCategoryIcon(skill.category)}
                </div>
                <div>
                  <div className="flex items-center gap-2">
                    <span className="font-mono font-bold text-sm text-slate-100">{skill.name}</span>
                    <Badge
                      variant="outline"
                      className={`text-[10px] py-0 px-1.5 font-mono ${
                        skill.implementedIn === 'Rust'
                          ? 'border-orange-500/40 text-orange-400 bg-orange-950/20'
                          : 'border-cyan-500/40 text-cyan-400 bg-cyan-950/20'
                      }`}
                    >
                      {skill.implementedIn}
                    </Badge>
                  </div>
                  <span className="text-[11px] text-slate-400 capitalize">{skill.category} Capability</span>
                </div>
              </div>

              <div className="flex items-center gap-1.5">
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => onToggleSkill(skill.id)}
                  className="h-7 px-2 text-xs text-slate-400 hover:text-slate-200"
                  title={skill.enabled ? 'Disable Tool' : 'Enable Tool'}
                >
                  {skill.enabled ? (
                    <span className="text-emerald-400 font-mono text-[11px] flex items-center gap-1">
                      <Check className="w-3 h-3" /> Enabled
                    </span>
                  ) : (
                    <span className="text-slate-500 font-mono text-[11px]">Disabled</span>
                  )}
                </Button>
              </div>
            </div>

            <p className="text-xs text-slate-300 mt-3 leading-relaxed">
              {skill.description}
            </p>

            {/* Parameters list */}
            <div className="mt-3 pt-3 border-t border-slate-800/80">
              <span className="text-[10px] uppercase font-mono text-slate-500 tracking-wider">Parameters:</span>
              <div className="mt-1 flex flex-wrap gap-1.5">
                {skill.parameters.map((p, idx) => (
                  <span
                    key={idx}
                    className="text-[11px] font-mono px-2 py-0.5 rounded bg-slate-950 border border-slate-800 text-slate-300"
                  >
                    <span className="text-cyan-400">{p.name}</span>: <span className="text-slate-400">{p.type}</span>
                    {p.required && <span className="text-rose-400 ml-0.5">*</span>}
                  </span>
                ))}
              </div>
            </div>

            {/* Test Action */}
            <div className="mt-4 pt-2 flex items-center justify-end">
              <Button
                variant="outline"
                size="sm"
                onClick={() => handleOpenTest(skill)}
                className="h-7 text-xs bg-slate-800/50 hover:bg-slate-800 text-slate-300 border-slate-700 gap-1"
              >
                <Play className="w-3 h-3 text-cyan-400" />
                Test in Sandbox
              </Button>
            </div>
          </div>
        ))}
      </div>

      {/* Tool Test Sandbox Dialog */}
      <Dialog open={!!testingSkill} onOpenChange={(open) => !open && setTestingSkill(null)}>
        <DialogContent className="bg-slate-900 border-slate-800 text-slate-200 max-w-xl">
          <DialogHeader>
            <DialogTitle className="text-sm font-bold flex items-center gap-2 font-mono text-slate-100">
              <Terminal className="w-4 h-4 text-cyan-400" />
              Sandbox Test: {testingSkill?.name}
            </DialogTitle>
            <DialogDescription className="text-xs text-slate-400">
              Dispatches execution directly to the {testingSkill?.implementedIn} runtime environment.
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-3 my-2 text-xs">
            <div>
              <label className="text-[11px] font-medium text-slate-400 block mb-1">
                Invocation Arguments / Input:
              </label>
              <Input
                value={testParamInput}
                onChange={(e) => setTestParamInput(e.target.value)}
                className="bg-slate-950 border-slate-800 text-slate-200 font-mono text-xs"
                placeholder="Enter command or parameter payload..."
              />
            </div>

            {testOutput && (
              <div className="p-3 bg-black/90 rounded-lg border border-slate-800 font-mono text-[11px] text-emerald-300 whitespace-pre-wrap leading-tight max-h-52 overflow-y-auto">
                {testOutput}
              </div>
            )}
          </div>

          <DialogFooter className="flex items-center justify-between sm:justify-between">
            <span className="text-[11px] text-slate-500 font-mono">
              Engine: {testingSkill?.implementedIn} Runtime
            </span>
            <div className="flex gap-2">
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setTestingSkill(null)}
                className="h-8 text-xs text-slate-400"
              >
                Close
              </Button>
              <Button
                size="sm"
                onClick={handleExecuteTest}
                disabled={isRunningTest}
                className="h-8 bg-cyan-500 hover:bg-cyan-400 text-slate-950 font-semibold text-xs gap-1.5"
              >
                <Play className="w-3.5 h-3.5" />
                {isRunningTest ? 'Running...' : 'Execute Sandbox Test'}
              </Button>
            </div>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Register Custom Tool Dialog */}
      <Dialog open={isNewSkillOpen} onOpenChange={setIsNewSkillOpen}>
        <DialogContent className="bg-slate-900 border-slate-800 text-slate-200 max-w-md">
          <form onSubmit={handleCreateSkill}>
            <DialogHeader>
              <DialogTitle className="text-sm font-bold flex items-center gap-2 text-slate-100">
                <Plus className="w-4 h-4 text-cyan-400" />
                Register Custom Zeus Skill
              </DialogTitle>
              <DialogDescription className="text-xs text-slate-400">
                Add a new tool that the Zeus agent can automatically invoke using &lt;tool_call&gt;.
              </DialogDescription>
            </DialogHeader>

            <div className="space-y-3 my-4 text-xs">
              <div>
                <label className="text-[11px] font-medium text-slate-400 block mb-1">
                  Tool Name (Snake case)
                </label>
                <Input
                  value={newSkillName}
                  onChange={(e) => setNewSkillName(e.target.value)}
                  placeholder="e.g. docker_container_inspect"
                  className="bg-slate-950 border-slate-800 text-slate-200 text-xs font-mono"
                  required
                />
              </div>

              <div>
                <label className="text-[11px] font-medium text-slate-400 block mb-1">
                  Description (Used by Agent for Tool Selection)
                </label>
                <Textarea
                  value={newSkillDesc}
                  onChange={(e) => setNewSkillDesc(e.target.value)}
                  placeholder="Explains what the tool does and when Zeus should call it..."
                  className="bg-slate-950 border-slate-800 text-slate-200 text-xs min-h-[60px]"
                  required
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-[11px] font-medium text-slate-400 block mb-1">
                    Runtime Layer
                  </label>
                  <select
                    value={newSkillImpl}
                    onChange={(e) => setNewSkillImpl(e.target.value as 'Rust' | 'C++')}
                    className="w-full bg-slate-950 border border-slate-800 rounded-md px-3 py-1.5 text-xs text-slate-200"
                  >
                    <option value="Rust">Rust (Tokio / Sandbox)</option>
                    <option value="C++">C++ (Native / AVX2 Core)</option>
                  </select>
                </div>

                <div>
                  <label className="text-[11px] font-medium text-slate-400 block mb-1">
                    Category
                  </label>
                  <select
                    value={newSkillCategory}
                    onChange={(e) => setNewSkillCategory(e.target.value as any)}
                    className="w-full bg-slate-950 border border-slate-800 rounded-md px-3 py-1.5 text-xs text-slate-200"
                  >
                    <option value="system">System</option>
                    <option value="code">Code</option>
                    <option value="web">Web</option>
                    <option value="memory">Memory</option>
                  </select>
                </div>
              </div>
            </div>

            <DialogFooter>
              <Button
                type="button"
                variant="ghost"
                size="sm"
                onClick={() => setIsNewSkillOpen(false)}
                className="h-8 text-xs text-slate-400"
              >
                Cancel
              </Button>
              <Button
                type="submit"
                size="sm"
                className="h-8 bg-cyan-500 hover:bg-cyan-400 text-slate-950 font-semibold text-xs"
              >
                Register Tool
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
};
