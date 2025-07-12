import { ReactNode } from 'react';

export interface WidgetData {
  id: string;
  type: string;
  config: Record<string, any>;
  data: Record<string, any>;
  createdAt: Date;
  updatedAt: Date;
}

export interface WidgetConfig {
  label: string;
  icon?: ReactNode;
  description?: string;
  defaultData?: Record<string, any>;
  configSchema?: Record<string, any>;
}

export interface WidgetInstance {
  id: string;
  type: string;
  data: Record<string, any>;
  config: Record<string, any>;
  onDataChange: (data: Record<string, any>) => void;
  onConfigChange?: (config: Record<string, any>) => void;
  mode?: 'interactive' | 'text';
  isReadOnly?: boolean;
}

export interface WidgetComponent {
  component: React.ComponentType<WidgetInstance>;
  config: WidgetConfig;
  generateText: (data: Record<string, any>, config?: Record<string, any>) => string;
  validateData?: (data: Record<string, any>) => boolean;
  migrateData?: (data: Record<string, any>, fromVersion: string, toVersion: string) => Record<string, any>;
}

export interface WidgetRegistry {
  [key: string]: WidgetComponent;
}

export interface DotPhraseWidget {
  id: string;
  type: string;
  data: Record<string, any>;
  config: Record<string, any>;
  position: number;
}

export interface DotPhraseContent {
  text: string;
  widgets: DotPhraseWidget[];
}