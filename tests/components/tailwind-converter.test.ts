import { describe, expect, it } from 'vitest';
import { mount } from '@vue/test-utils';
import TailwindConverter from '@/components/TailwindConverter/index.vue';
import { convertTailwindClasses } from '@/components/TailwindConverter/convert';

describe('Tailwind to CSS', () => {
  it('converts common utilities, arbitrary values, and supported variants', () => {
    const result = convertTailwindClasses('flex p-4 bg-red-500 hover:bg-red-600 md:w-[320px] flex');
    expect(result.convertedCount).toBe(5);
    expect(result.unsupported).toEqual([]);
    expect(result.css).toContain('.flex {\n  display: flex;\n}');
    expect(result.css).toContain('.p-4 {\n  padding: 1rem;\n}');
    expect(result.css).toContain('.hover\\:bg-red-600:hover');
    expect(result.css).toContain('@media (min-width: 768px)');
    expect(result.css).toContain('width: 320px;');
  });

  it('reports unsupported and unsafe input without emitting it as CSS', () => {
    const result = convertTailwindClasses('unknown:hover foo-[red;display:block] constructor');
    expect(result.convertedCount).toBe(0);
    expect(result.unsupported).toEqual(['unknown:hover', 'foo-[red;display:block]', 'constructor']);
    expect(result.css).toBe('');
  });

  it('preserves multi-declaration utilities as valid CSS', () => {
    const result = convertTailwindClasses('text-sm');
    expect(result.css).toContain('font-size: 0.875rem;\n  line-height: 1.25rem;');
    expect(result.css).not.toContain('\\n');
  });

  it('updates the output and diagnostics from input', async () => {
    const wrapper = mount(TailwindConverter);
    await wrapper.get('#tailwind-input').setValue('text-center fake-utility');
    expect((wrapper.get('#tailwind-output').element as HTMLTextAreaElement).value).toContain(
      'text-align: center;'
    );
    expect(wrapper.get('.tailwind-converter__unsupported').text()).toContain('fake-utility');
  });
});
