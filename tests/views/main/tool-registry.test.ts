import { describe, expect, it } from 'vitest';
import CompMap from '@/components';
import {
  TOOL_CARDS,
  TOOL_COMPONENT_NAMES,
  TOOL_REGISTRY,
  type ToolDefinition,
} from '@/views/main/tool-cards';

describe('tool registry', () => {
  it('keeps the legacy cards export as a stable view of the registry', () => {
    expect(TOOL_CARDS).toBe(TOOL_REGISTRY);
    expect(TOOL_REGISTRY.length).toBeGreaterThan(0);
    expect(new Set(TOOL_REGISTRY.map(tool => tool.key)).size).toBe(TOOL_REGISTRY.length);
  });

  it('registers every embedded component and preserves navigation metadata', () => {
    const registeredComponents = new Set(Object.keys(CompMap));
    expect(registeredComponents).toEqual(new Set(TOOL_COMPONENT_NAMES));

    TOOL_REGISTRY.forEach((tool: ToolDefinition) => {
      expect(tool.nameKey).toMatch(/^tools\./);
      expect(tool.descriptionKey).toMatch(/^descriptions\./);
      if (tool.destination === 'embedded') {
        expect(tool.componentName).toBeTruthy();
        expect(registeredComponents.has(tool.componentName as string)).toBe(true);
      } else {
        expect(tool.url).toMatch(/^(https?:\/\/|index\.html\?)/);
        expect(tool.componentName).toBeUndefined();
      }
    });
  });

  it('keeps the existing standalone and external destinations', () => {
    expect(TOOL_REGISTRY.find(tool => tool.key === 'postman')).toMatchObject({
      destination: 'standalone',
      url: 'index.html?type=postman',
    });
    expect(TOOL_REGISTRY.find(tool => tool.key === 'lang-translator')).toMatchObject({
      destination: 'external',
      url: 'https://fanyi.youdao.com/indexLLM.html#/',
    });
  });
});
