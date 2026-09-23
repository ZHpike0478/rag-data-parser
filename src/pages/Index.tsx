import React, { useState, useEffect, useCallback } from 'react';
import { 
  Terminal, 
  Activity, 
  Wrench, 
  FolderTree, 
  Sparkles,
  Download,
  Settings as SettingsIcon,
  ShieldCheck,
  Cpu,
  RefreshCw,
  ExternalLink,
  Code2,
  Server
} from 'lucide-react';
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/tabs';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { DesktopTitleBar } from '@/components/hermes/DesktopTitleBar';
import { AgentChatView } from '@/components/hermes/AgentChatView';
import { TelemetryEngineView } from '@/components/hermes/TelemetryEngineView';
import { SkillsManagerView } from '@/components/hermes/SkillsManagerView';
import { CodebaseExporterView } from '@/components/hermes/CodebaseExporterView';
import { SettingsDialog } from '@/components/hermes/SettingsDialog';
import { MadeWithDyad } from '@/components/made-with-dyad';
import { 
  DEFAULT_MODELS, 
  DEFAULT_SKILLS, 
  INITIAL_CONVERSATION, 
  generateTelemetry 
} from '@/services/hermesAgentSimulator';
import { downloadProjectZip } from '@/services/nativeCodebase';
import { AgentMessage, EngineTelemetry, HermesModelConfig, HermesSkill } from '@/types/hermes';
import { SessionStore, ChatSession, BackendEndpointConfig } from '@/services/sessionStore';
import { RealAgentService } from '@/services/realAgentService';
import { detectRealSystemInfo } from '@/services/realSystemService';
import { toast } from 'sonner';

const Index: React.FC = () => {
  // Navigation
  const [activeTab, setActiveTab] = useState<string>('chat');

  // Persistent session state
  const [sessions, setSessions] = useState<ChatSession[]>(() => SessionStore.getSessions());
  const [activeSessionId, setActiveSessionId] = useState<string>(() => SessionStore.getActiveSessionId());
  
  // Endpoint config
  const [endpointConfig, setEndpointConfig] = useState<BackendEndpointConfig>(() => SessionStore.getEndpointConfig());

  // Models & State
  const [models, setModels] = useState<HermesModelConfig[]>(() => SessionStore.getModels());
  const [currentModel, setCurrentModel] = useState<HermesModelConfig>(() => models[0] || DEFAULT_MODELS[0]);
  const [skills, setSkills] = useState<HermesSkill[]>(() => SessionStore.getSkills());
  const [telemetry, setTelemetry] = useState<EngineTelemetry>(generateTelemetry());
  const [isGenerating, setIsGenerating] = useState<boolean>(false);

  // Settings & OS styling
  const [isSettingsOpen, setIsSettingsOpen] = useState(false);
  const [osStyle, setOsStyle] = useState<'macos' | 'linux' | 'windows'>('macos');

  // Active session messages
  const activeSession = sessions.find(s => s.id === activeSessionId) || sessions[0];
  const messages = activeSession ? activeSession.messages : [];

  // Update telemetry with real host hardware upon mount
  useEffect(() => {
    detectRealSystemInfo().then((realSys) => {
      setTelemetry(prev => ({
        ...prev,
        rust: {
          ...prev.rust,
          tokioWorkers: realSys.cpuCores,
          memoryMb: realSys.heapMemoryUsedMb,
        },
        cpp: {
          ...prev.cpp,
          activeKernels: `${realSys.gpuRenderer} (Offloaded)`,
        }
      }));
    });
  }, []);

  // Periodic simulated telemetry heartbeat
  useEffect(() => {
    const interval = setInterval(() => {
      setTelemetry(generateTelemetry());
    }, 5000);
    return () => clearInterval(interval);
  }, []);

  // Save sessions to storage whenever they change
  const updateMessages = (newMessages: AgentMessage[]) => {
    setSessions(prev => {
      const next = prev.map(s => {
        if (s.id === activeSessionId) {
          return { ...s, messages: newMessages, updatedAt: new Date().toLocaleTimeString() };
        }
        return s;
      });
      SessionStore.saveSessions(next);
      return next;
    });
  };

  // Handle user dispatching a message to Zeus with real data & tool execution
  const handleSendMessage = useCallback(async (text: string) => {
    const userMsg: AgentMessage = {
      id: 'msg-' + Date.now(),
      role: 'user',
      content: text,
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' }),
    };

    const updatedWithUser = [...messages, userMsg];
    updateMessages(updatedWithUser);
    setIsGenerating(true);

    try {
      // Execute real agent turn with live tools (web, github, math, system)
      const assistantMsg = await RealAgentService.runAgentTurn(text, currentModel, endpointConfig);
      updateMessages([...updatedWithUser, assistantMsg]);
      setTelemetry(generateTelemetry());
    } catch (err: any) {
      toast.error('Error generating response: ' + err.message);
    } finally {
      setIsGenerating(false);
    }
  }, [messages, currentModel, endpointConfig]);

  const handleClearChat = () => {
    updateMessages([]);
    toast.info('Zeus workspace session reset');
  };

  const handleToggleSkill = (skillId: string) => {
    setSkills(prev => {
      const next = prev.map(s => s.id === skillId ? { ...s, enabled: !s.enabled } : s);
      SessionStore.saveSkills(next);
      return next;
    });
  };

  const handleAddSkill = (newSkill: HermesSkill) => {
    setSkills(prev => {
      const next = [...prev, newSkill];
      SessionStore.saveSkills(next);
      return next;
    });
  };

  const handleUpdateModelConfig = (updated: Partial<HermesModelConfig>) => {
    setCurrentModel(prev => {
      const next = { ...prev, ...updated };
      return next;
    });
  };

  const handleExportZip = async () => {
    try {
      await downloadProjectZip();
      toast.success('Downloaded zeus-desktop-cpp-rust.zip project archive!');
    } catch (err) {
      toast.error('Failed to package project');
    }
  };

  return (
    <div className="flex flex-col h-screen w-screen overflow-hidden bg-slate-950 text-slate-100 font-sans selection:bg-cyan-500/30 selection:text-cyan-200">
      {/* Native Desktop Window Bar */}
      <DesktopTitleBar
        currentModel={currentModel}
        models={models}
        onSelectModel={setCurrentModel}
        telemetry={telemetry}
        onOpenSettings={() => setIsSettingsOpen(true)}
        onExportZip={handleExportZip}
        osStyle={osStyle}
        onChangeOsStyle={setOsStyle}
      />

      {/* Main App Container */}
      <div className="flex-1 flex flex-col overflow-hidden">
        {/* Navigation Tabs Bar */}
        <div className="bg-slate-950 px-4 py-2 border-b border-slate-800 flex items-center justify-between">
          <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
              <TabsList className="bg-slate-900/90 border border-slate-800 p-1 h-9 rounded-lg">
                <TabsTrigger 
                  value="chat" 
                  className="text-xs px-3 gap-1.5 data-[state=active]:bg-cyan-500 data-[state=active]:text-slate-950 font-medium"
                >
                  <Terminal className="w-3.5 h-3.5" />
                  <span>Agent Workspace</span>
                </TabsTrigger>

                <TabsTrigger 
                  value="telemetry" 
                  className="text-xs px-3 gap-1.5 data-[state=active]:bg-cyan-500 data-[state=active]:text-slate-950 font-medium"
                >
                  <Activity className="w-3.5 h-3.5" />
                  <span>C++ & Rust Architecture</span>
                </TabsTrigger>

                <TabsTrigger 
                  value="skills" 
                  className="text-xs px-3 gap-1.5 data-[state=active]:bg-cyan-500 data-[state=active]:text-slate-950 font-medium"
                >
                  <Wrench className="w-3.5 h-3.5" />
                  <span>Skills & Sandbox Tools</span>
                  <Badge variant="secondary" className="text-[10px] py-0 px-1 ml-1 bg-slate-800 text-slate-300">
                    {skills.length}
                  </Badge>
                </TabsTrigger>

                <TabsTrigger 
                  value="codebase" 
                  className="text-xs px-3 gap-1.5 data-[state=active]:bg-cyan-500 data-[state=active]:text-slate-950 font-medium"
                >
                  <FolderTree className="w-3.5 h-3.5" />
                  <span>C++ & Rust Codebase</span>
                  <span className="w-2 h-2 rounded-full bg-cyan-400 animate-pulse ml-0.5" />
                </TabsTrigger>
              </TabsList>

              {/* Status pill on right */}
              <div className="hidden xl:flex items-center gap-2 text-xs font-mono text-slate-400">
                <span className="flex items-center gap-1.5">
                  <Server className="w-3.5 h-3.5 text-cyan-400" />
                  Provider: {endpointConfig.mode}
                </span>
                <span>•</span>
                <span className="flex items-center gap-1.5">
                  <ShieldCheck className="w-3.5 h-3.5 text-emerald-400" />
                  Rust Tokio Sandbox
                </span>
              </div>
            </div>

            {/* Tab Contents */}
            <div className="mt-2 h-[calc(100vh-108px)] overflow-hidden">
              <TabsContent value="chat" className="h-full m-0 data-[state=inactive]:hidden">
                <AgentChatView
                  messages={messages}
                  onSendMessage={handleSendMessage}
                  isGenerating={isGenerating}
                  onClearChat={handleClearChat}
                  currentModel={currentModel}
                />
              </TabsContent>

              <TabsContent value="telemetry" className="h-full m-0 data-[state=inactive]:hidden">
                <TelemetryEngineView
                  telemetry={telemetry}
                  model={currentModel}
                  onRefreshTelemetry={() => setTelemetry(generateTelemetry())}
                />
              </TabsContent>

              <TabsContent value="skills" className="h-full m-0 data-[state=inactive]:hidden">
                <SkillsManagerView
                  skills={skills}
                  onToggleSkill={handleToggleSkill}
                  onAddSkill={handleAddSkill}
                />
              </TabsContent>

              <TabsContent value="codebase" className="h-full m-0 data-[state=inactive]:hidden">
                <CodebaseExporterView />
              </TabsContent>
            </div>
          </Tabs>
        </div>
      </div>

      {/* Settings Modal */}
      <SettingsDialog
        open={isSettingsOpen}
        onOpenChange={setIsSettingsOpen}
        currentModel={currentModel}
        onUpdateModelConfig={handleUpdateModelConfig}
        endpointConfig={endpointConfig}
        onUpdateEndpointConfig={setEndpointConfig}
      />

      {/* Floating Made with Dyad Badge */}
      <div className="fixed bottom-2 right-4 z-50 pointer-events-auto">
        <MadeWithDyad />
      </div>
    </div>
  );
};

export default Index;
