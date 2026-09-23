import { AgentMessage, HermesSkill, HermesModelConfig } from '../types/hermes';
import { DEFAULT_SKILLS, DEFAULT_MODELS, INITIAL_CONVERSATION } from './hermesAgentSimulator';

export interface BackendEndpointConfig {
  mode: 'zeus_engine' | 'ollama' | 'llama_cpp' | 'openai_compatible';
  baseUrl: string;
  apiKey?: string;
  isOnline: boolean;
  lastChecked?: string;
  discoveredModels: string[];
}

export interface ChatSession {
  id: string;
  title: string;
  createdAt: string;
  updatedAt: string;
  messages: AgentMessage[];
}

const STORAGE_KEYS = {
  SESSIONS: 'zeus_desktop_sessions_v1',
  ACTIVE_SESSION: 'zeus_desktop_active_session_id',
  ENDPOINT: 'zeus_desktop_endpoint_config_v1',
  SKILLS: 'zeus_desktop_custom_skills_v1',
  MODELS: 'zeus_desktop_models_v1',
  SELECTED_MODEL: 'zeus_desktop_selected_model_id',
};

export const DEFAULT_ENDPOINT_CONFIG: BackendEndpointConfig = {
  mode: 'zeus_engine',
  baseUrl: 'http://localhost:11434',
  apiKey: '',
  isOnline: true,
  discoveredModels: ['zeus-3-8b', 'zeus-3-70b', 'zeus-2-pro-7b'],
};

export class SessionStore {
  static getSessions(): ChatSession[] {
    try {
      const raw = localStorage.getItem(STORAGE_KEYS.SESSIONS);
      if (raw) {
        return JSON.parse(raw);
      }
    } catch (e) {
      console.error('Failed to load sessions from storage', e);
    }

    // Default initial session
    const defaultSession: ChatSession = {
      id: 'session-default',
      title: 'C++ Inference & FFI Safety Audit',
      createdAt: new Date().toLocaleDateString(),
      updatedAt: new Date().toLocaleTimeString(),
      messages: INITIAL_CONVERSATION,
    };
    this.saveSessions([defaultSession]);
    return [defaultSession];
  }

  static saveSessions(sessions: ChatSession[]): void {
    try {
      localStorage.setItem(STORAGE_KEYS.SESSIONS, JSON.stringify(sessions));
    } catch (e) {
      console.error('Failed to save sessions to storage', e);
    }
  }

  static getActiveSessionId(): string {
    return localStorage.getItem(STORAGE_KEYS.ACTIVE_SESSION) || 'session-default';
  }

  static setActiveSessionId(id: string): void {
    localStorage.setItem(STORAGE_KEYS.ACTIVE_SESSION, id);
  }

  static getEndpointConfig(): BackendEndpointConfig {
    try {
      const raw = localStorage.getItem(STORAGE_KEYS.ENDPOINT);
      if (raw) {
        return JSON.parse(raw);
      }
    } catch (e) {
      console.error('Failed to load endpoint config', e);
    }
    return DEFAULT_ENDPOINT_CONFIG;
  }

  static saveEndpointConfig(config: BackendEndpointConfig): void {
    try {
      localStorage.setItem(STORAGE_KEYS.ENDPOINT, JSON.stringify(config));
    } catch (e) {
      console.error('Failed to save endpoint config', e);
    }
  }

  static getSkills(): HermesSkill[] {
    try {
      const raw = localStorage.getItem(STORAGE_KEYS.SKILLS);
      if (raw) {
        return JSON.parse(raw);
      }
    } catch (e) {
      console.error('Failed to load skills', e);
    }
    return DEFAULT_SKILLS;
  }

  static saveSkills(skills: HermesSkill[]): void {
    try {
      localStorage.setItem(STORAGE_KEYS.SKILLS, JSON.stringify(skills));
    } catch (e) {
      console.error('Failed to save skills', e);
    }
  }

  static getModels(): HermesModelConfig[] {
    try {
      const raw = localStorage.getItem(STORAGE_KEYS.MODELS);
      if (raw) {
        return JSON.parse(raw);
      }
    } catch (e) {
      console.error('Failed to load models', e);
    }
    return DEFAULT_MODELS;
  }

  static saveModels(models: HermesModelConfig[]): void {
    try {
      localStorage.setItem(STORAGE_KEYS.MODELS, JSON.stringify(models));
    } catch (e) {
      console.error('Failed to save models', e);
    }
  }
}
