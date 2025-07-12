import { WidgetRegistry, WidgetComponent, WidgetInstance } from '@/types/widgets';

class WidgetRegistryManager {
  private registry: WidgetRegistry = {};

  register(type: string, component: WidgetComponent) {
    this.registry[type] = component;
  }

  get(type: string): WidgetComponent | undefined {
    return this.registry[type];
  }

  getAll(): WidgetRegistry {
    return { ...this.registry };
  }

  getAvailableTypes(): string[] {
    return Object.keys(this.registry);
  }

  createWidget(type: string, initialData?: Record<string, any>, config?: Record<string, any>): WidgetInstance | null {
    try {
      const widgetComponent = this.registry[type];
      if (!widgetComponent) {
        console.warn(`Widget type "${type}" not found in registry`);
        return null;
      }

      const id = `widget-${type}-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
      const defaultData = widgetComponent.config.defaultData || {};
      const mergedData = { ...defaultData, ...initialData };

      // Validate the merged data
      if (widgetComponent.validateData && !widgetComponent.validateData(mergedData)) {
        console.warn(`Invalid data for widget type "${type}"`);
        return null;
      }

      return {
        id,
        type,
        data: mergedData,
        config: config || {},
        onDataChange: () => {},
        mode: 'interactive'
      };
    } catch (error) {
      console.error(`Error creating widget of type "${type}":`, error);
      return null;
    }
  }

  generateText(type: string, data: Record<string, any>, config?: Record<string, any>): string {
    try {
      const widgetComponent = this.registry[type];
      if (!widgetComponent) {
        console.warn(`Widget type "${type}" not found in registry`);
        return `[Widget "${type}" not found]`;
      }

      return widgetComponent.generateText(data, config);
    } catch (error) {
      console.error(`Error generating text for widget type "${type}":`, error);
      return `[Error generating text for widget "${type}"]`;
    }
  }

  validateData(type: string, data: Record<string, any>): boolean {
    const widgetComponent = this.registry[type];
    if (!widgetComponent) {
      return false;
    }

    if (widgetComponent.validateData) {
      return widgetComponent.validateData(data);
    }

    return true;
  }

  migrateData(type: string, data: Record<string, any>, fromVersion: string, toVersion: string): Record<string, any> {
    const widgetComponent = this.registry[type];
    if (!widgetComponent || !widgetComponent.migrateData) {
      return data;
    }

    return widgetComponent.migrateData(data, fromVersion, toVersion);
  }
}

export const widgetRegistry = new WidgetRegistryManager();

export const WIDGET_SYNTAX_REGEX = /\[\[WIDGET:([^:]+):([^:]+)\]\]/g;

export function parseWidgetSyntax(text: string): Array<{
  match: string;
  type: string;
  id: string;
  start: number;
  end: number;
}> {
  const matches = [];
  let match;
  
  while ((match = WIDGET_SYNTAX_REGEX.exec(text)) !== null) {
    matches.push({
      match: match[0],
      type: match[1],
      id: match[2],
      start: match.index,
      end: match.index + match[0].length
    });
  }
  
  return matches;
}

export function insertWidgetSyntax(text: string, position: number, type: string, id: string): string {
  const widgetSyntax = `[[WIDGET:${type}:${id}]]`;
  return text.slice(0, position) + widgetSyntax + text.slice(position);
}

export function replaceWidgetSyntax(text: string, widgetId: string, replacement: string): string {
  const regex = new RegExp(`\\[\\[WIDGET:[^:]+:${widgetId}\\]\\]`, 'g');
  return text.replace(regex, replacement);
}