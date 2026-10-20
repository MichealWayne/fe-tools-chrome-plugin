import { flushPromises, mount } from '@vue/test-utils';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { defineComponent, h, ref } from 'vue';
import QRCode from '@/components/QRCode/index.vue';
import ColorPass from '@/components/ColorPass/index.vue';
import DateConverter from '@/components/DateConverter/index.vue';
import ImageCompressor from '@/components/ImageCompressor/index.vue';
import ImageViewer from '@/components/Experience/ImageViewer.vue';
import JsonCtn from '@/components/JsonCtn/index.vue';
import JsonWorkbench from '@/components/JsonCtn/JsonWorkbench.vue';
import SvgEditor from '@/components/SvgEditor/index.vue';
import SvgPreview from '@/components/SvgEditor/SvgPreview.vue';
import TailwindConverter from '@/components/TailwindConverter/index.vue';
import { provideTextDrafts } from '@/composables/useTextDraft';
import { dataUrlBytes } from '@/utils/media-metrics';
import { jsonErrorOffset } from '@/components/JsonCtn/workbench';
import { optimizeImage } from '@/components/ImageCompressor/optimizer';
import { handleQRCode } from '@/utils';

vi.mock('@/utils', () => ({ handleQRCode: vi.fn() }));
vi.mock('@/utils/chrome', () => ({ getLocalTabUrl: vi.fn() }));
vi.mock('@/components/ImageCompressor/optimizer', async importOriginal => ({
  ...(await importOriginal<typeof import('@/components/ImageCompressor/optimizer')>()),
  optimizeImage: vi.fn(),
}));
const getImgUrl = vi.fn(() => 'data:image/png;base64,cXI=');
const wrappers: Array<{ unmount: () => void }> = [];
beforeEach(() => {
  vi.clearAllMocks();
  Object.defineProperty(URL, 'createObjectURL', {
    configurable: true,
    value: vi.fn(() => 'blob:image'),
  });
  Object.defineProperty(URL, 'revokeObjectURL', { configurable: true, value: vi.fn() });
  window.location.search = '';
  vi.mocked(handleQRCode).mockReturnValue({ getImgUrl, downloadQR: vi.fn() });
  Object.defineProperty(navigator, 'clipboard', {
    configurable: true,
    value: { writeText: vi.fn().mockResolvedValue(undefined) },
  });
  Object.assign(chrome.tabs, { create: vi.fn().mockResolvedValue({}) });
  Object.assign(chrome.runtime, {
    getURL: vi.fn((path: string) => `chrome-extension://test/${path}`),
  });
});
afterEach(() => {
  wrappers.splice(0).forEach(wrapper => wrapper.unmount());
  vi.useRealTimers();
  vi.restoreAllMocks();
  vi.unstubAllGlobals();
  window.location.search = '';
});

describe('QR scanning and current results', () => {
  it('rerenders at scan sizes, restores focus on Escape and marks edited results stale', async () => {
    const wrapper = mount(QRCode, {
      props: { keywords: 'https://example.test' },
      attachTo: document.body,
    });
    wrappers.push(wrapper);
    await flushPromises();
    const trigger = wrapper.get<HTMLButtonElement>('.qr-tool__enlarge');
    trigger.element.focus();
    await trigger.trigger('click');
    expect(getImgUrl).toHaveBeenLastCalledWith(480);
    await wrapper.get('select').setValue('640');
    expect(getImgUrl).toHaveBeenLastCalledWith(640);
    await wrapper.get('dialog').trigger('keydown', { key: 'Escape' });
    expect(wrapper.find('dialog').exists()).toBe(false);
    expect(document.activeElement).toBe(trigger.element);
    await trigger.trigger('click');
    await wrapper.get('#qr-source').setValue('https://new.test');
    expect(wrapper.find('dialog').exists()).toBe(false);
    expect(wrapper.get('.qr-tool__stale').text()).toContain('上次内容');
    expect(wrapper.get('.qr-tool__encoded').text()).toContain('https://example.test');
    expect(wrapper.get('.qr-tool__download').attributes('disabled')).toBeDefined();
    await wrapper.get('.qr-tool__actions button').trigger('click');
    expect(wrapper.find('.qr-tool__stale').exists()).toBe(false);
  });

  it('opens the explicit encoded content in a standalone scan page', async () => {
    const wrapper = mount(QRCode, { props: { keywords: 'https://example.test?a=1&b=2' } });
    wrappers.push(wrapper);
    await flushPromises();
    const button = wrapper.findAll('button').find(item => item.text() === '打开独立扫码页')!;
    await button.trigger('click');
    await flushPromises();
    const target = new URL(vi.mocked(chrome.tabs.create).mock.calls[0][0].url!);
    expect(target.searchParams.get('scan')).toBe('1');
    expect(target.searchParams.get('url')).toBe('https://example.test?a=1&b=2');
  });

  it('opens scan mode on the standalone route and reports an absent renderer as an error', async () => {
    window.location.search = '?type=qrcode&scan=1';
    const wrapper = mount(QRCode, { props: { keywords: 'content' } });
    wrappers.push(wrapper);
    await flushPromises();
    expect(wrapper.find('dialog').exists()).toBe(true);
    await wrapper.get('dialog button').trigger('click');
    vi.mocked(handleQRCode).mockReturnValueOnce(null as never);
    await wrapper.get('.qr-tool__actions button').trigger('click');
    expect(wrapper.get('[role="alert"]').text()).toContain('生成失败');
  });
});

describe('media inspection and metrics', () => {
  it.each([400, 100])('zooms from the fitted image width of %ipx', async fittedWidth => {
    const wrapper = mount(ImageViewer, {
      props: { src: 'data:image/png;base64,YQ==', alt: 'large image' },
    });
    wrappers.push(wrapper);
    const image = wrapper.get<HTMLImageElement>('img');
    Object.defineProperty(image.element, 'naturalWidth', { value: 1400 });
    vi.spyOn(image.element, 'getBoundingClientRect').mockReturnValue({
      width: fittedWidth,
    } as DOMRect);
    await image.trigger('load');
    const buttons = wrapper.findAll('button');
    await buttons[2].trigger('click');
    expect(parseFloat(image.element.style.width)).toBeLessThan(fittedWidth);
    await buttons[0].trigger('click');
    await buttons[3].trigger('click');
    expect(parseFloat(image.element.style.width)).toBeGreaterThan(fittedWidth);
    expect(parseFloat(image.element.style.width)).toBeLessThan(1400);
  });

  it('supports native zoom, pointer panning and fit reset when the image changes', async () => {
    const wrapper = mount(ImageViewer, {
      props: { src: 'data:image/png;base64,aA==', alt: 'test', backgrounds: true },
    });
    wrappers.push(wrapper);
    const image = wrapper.get('img');
    Object.defineProperty(image.element, 'naturalWidth', { value: 800 });
    await image.trigger('load');
    await wrapper.findAll('button')[1].trigger('click');
    expect(image.attributes('style')).toContain('800px');
    const viewport = wrapper.get<HTMLElement>('.image-viewer__viewport');
    await viewport.trigger('pointerdown', { button: 0, clientX: 100, clientY: 100, pointerId: 1 });
    await viewport.trigger('pointermove', { clientX: 50, clientY: 40 });
    expect(viewport.element.scrollLeft).toBe(50);
    expect(viewport.element.scrollTop).toBe(60);
    await viewport.trigger('pointerup');
    await wrapper.get('select').setValue('dark');
    expect(viewport.classes()).toContain('image-viewer__viewport--dark');
    await wrapper.setProps({ src: 'data:image/png;base64,bg==' });
    expect(wrapper.get('.image-viewer__scale').text()).toBe('适应宽度');
  });

  it('compares actual source/result bytes and explicitly reports larger results', async () => {
    vi.mocked(optimizeImage).mockResolvedValue({
      blob: new Blob(['abcdef'], { type: 'image/png' }),
      originalWidth: 1,
      originalHeight: 1,
      quality: 1,
      targetMet: true,
      keptOriginal: false,
      width: 1,
      height: 1,
    });
    const wrapper = mount(ImageCompressor);
    wrappers.push(wrapper);
    const file = new File(['abc'], 'source.png', { type: 'image/png' });
    Object.defineProperty(wrapper.get('input[type=file]').element, 'files', {
      configurable: true,
      value: [file],
    });
    await wrapper.get('input[type=file]').trigger('change');
    await flushPromises();
    expect(dataUrlBytes('data:image/png;base64,YQ==')).toBe(1);
    expect(wrapper.get('.image-compressor__metrics').text()).toContain('原始 3 B → 结果 6 B');
    expect(wrapper.get('.image-compressor__metrics').text()).toContain('增大 100.0%');
    const result = wrapper.findAll('button').find(button => button.text() === '压缩结果')!;
    await result.trigger('click');
    expect(wrapper.get('.image-viewer img').attributes('src')).toBe('blob:image');
  });

  it('renders sanitized SVG as an image and allows background selection', async () => {
    const wrapper = mount(SvgPreview, {
      props: {
        svg: '<svg xmlns="http://www.w3.org/2000/svg" onload="alert(1)"><script>evil()</script><rect width="10" height="10" fill="white"/></svg>',
      },
    });
    wrappers.push(wrapper);
    const svg = decodeURIComponent(wrapper.get('img').attributes('src'));
    expect(svg).not.toMatch(/script|onload|evil/);
    await wrapper.get('select').setValue('dark');
    expect(wrapper.find('.image-viewer__viewport--dark').exists()).toBe(true);
  });
});

describe('CSS colors and date copies', () => {
  it('accepts short hex and CSS functions, copies CSS and rejects alpha without losing results', async () => {
    const wrapper = mount(ColorPass);
    wrappers.push(wrapper);
    await wrapper.get('#color-hex').setValue('#f00');
    expect(wrapper.get<HTMLInputElement>('#color-rgb').element.value).toBe('255,0,0');
    await wrapper.findAll('.copy-button')[0].trigger('click');
    await flushPromises();
    expect(navigator.clipboard.writeText).toHaveBeenLastCalledWith('#ff0000');
    await wrapper.get('#color-rgb').setValue('rgb(0 128 255)');
    expect(wrapper.get<HTMLInputElement>('#color-hex').element.value).toBe('0080ff');
    await wrapper.get('#color-hsl').setValue('hsl(120, 100%, 50%)');
    expect(wrapper.get<HTMLInputElement>('#color-rgb').element.value).toBe('0,255,0');
    await wrapper.get('#color-rgb').setValue('rgba(0,0,0,0.5)');
    expect(wrapper.find('[role=alert]').exists()).toBe(true);
    expect(wrapper.get<HTMLInputElement>('#color-hex').element.value).toBe('00ff00');
  });

  it('suggests timestamp units without overriding them and copies one precise value', async () => {
    const wrapper = mount(DateConverter);
    wrappers.push(wrapper);
    const input = wrapper.get('input[type=number]');
    await input.setValue('1700000000000');
    expect(wrapper.get('.date-converter__suggestion').text()).toContain('毫秒');
    expect(wrapper.get<HTMLInputElement>('input[value=seconds]').element.checked).toBe(true);
    await wrapper.get('.date-converter__suggestion button').trigger('click');
    expect(wrapper.get<HTMLInputElement>('input[value=milliseconds]').element.checked).toBe(true);
    await wrapper.get('.date-result-copy').trigger('click');
    await flushPromises();
    expect(navigator.clipboard.writeText).toHaveBeenLastCalledWith('1700000000');
  });
});

describe('popup drafts and JSON workflows', () => {
  it.each(['query', 'target'])(
    'keeps a pending JSON import when search %s changes',
    async field => {
      const wrapper = mount(JsonWorkbench, { props: { input: 'old', output: '' } });
      wrappers.push(wrapper);
      let resolve!: (value: string) => void;
      const pending = new Promise<string>(done => {
        resolve = done;
      });
      const input = wrapper.get('input[type=file]');
      Object.defineProperty(input.element, 'files', {
        value: [{ size: 10, text: () => pending }],
      });
      await input.trigger('change');
      if (field === 'query') await wrapper.get('.json-workbench__search input').setValue('old');
      else await wrapper.get('.json-workbench__search select').setValue('output');
      expect(input.attributes('disabled')).toBeDefined();
      resolve('{"new":2}');
      await flushPromises();
      expect(wrapper.emitted('import')).toEqual([[JSON.stringify({ new: 2 }, null, 2)]]);
      expect(input.attributes('disabled')).toBeUndefined();
    }
  );

  it('clears SVG optimization statistics and success feedback after editing the source', async () => {
    const wrapper = mount(SvgEditor);
    wrappers.push(wrapper);
    const source = wrapper.findAll('textarea')[0];
    await source.setValue('<svg xmlns="http://www.w3.org/2000/svg"><!-- old --></svg>');
    await wrapper.findAll('.svg-editor__action-btn')[0].trigger('click');
    expect(wrapper.find('.svg-editor__stats').exists()).toBe(true);
    expect(wrapper.find('[role=status]').exists()).toBe(true);
    await source.setValue('<svg xmlns="http://www.w3.org/2000/svg" width="100"/>');
    expect(wrapper.findAll('textarea')[1].element.value).toBe('');
    expect(wrapper.find('.svg-editor__stats').exists()).toBe(false);
    expect(wrapper.find('[role=status]').exists()).toBe(false);
    await wrapper.findAll('.svg-editor__action-btn')[0].trigger('click');
    expect(wrapper.find('.svg-editor__stats').exists()).toBe(true);
    expect(wrapper.findAll('textarea')[1].element.value).toContain('width="100"');
  });

  it('downloads only valid JSON and releases its temporary URL', async () => {
    vi.useFakeTimers();
    const create = vi.fn(() => 'blob:json-download');
    const revoke = vi.fn();
    const NativeURL = URL;
    vi.stubGlobal(
      'URL',
      class extends NativeURL {
        static createObjectURL = create;
        static revokeObjectURL = revoke;
      }
    );
    vi.spyOn(HTMLAnchorElement.prototype, 'click').mockImplementation(() => {});
    const wrapper = mount(JsonWorkbench, { props: { input: '', output: '{"value":1}' } });
    wrappers.push(wrapper);
    await wrapper.findAll('button')[0].trigger('click');
    expect(create.mock.calls[0][0]).toHaveProperty('type', 'application/json');
    await vi.advanceTimersByTimeAsync(1000);
    expect(revoke).toHaveBeenCalledWith('blob:json-download');
    await wrapper.setProps({ output: '{broken' });
    await wrapper.findAll('button')[0].trigger('click');
    expect(create).toHaveBeenCalledTimes(1);
    expect(wrapper.emitted('error')?.[0][0]).toContain('不是有效 JSON');
  });
  it('retains editor text across navigation, clears drafts, and does not share between popup instances', async () => {
    const active = ref('json');
    const Host = defineComponent({
      setup() {
        provideTextDrafts();
        return () =>
          active.value === 'json'
            ? h(JsonCtn)
            : active.value === 'svg'
              ? h(SvgEditor)
              : h(TailwindConverter);
      },
    });
    const wrapper = mount(Host);
    wrappers.push(wrapper);
    await wrapper.findAll('textarea')[0].setValue('{draft: 1}');
    active.value = 'svg';
    await flushPromises();
    await wrapper.get('textarea').setValue('<svg/>');
    active.value = 'tailwind';
    await flushPromises();
    await wrapper.get('textarea').setValue('p-4');
    active.value = 'json';
    await flushPromises();
    expect(wrapper.findAll('textarea')[0].element.value).toBe('{draft: 1}');
    await wrapper.get('.clear-btn').trigger('click');
    active.value = 'tailwind';
    await flushPromises();
    expect(wrapper.get('textarea').element.value).toBe('p-4');
    active.value = 'svg';
    await flushPromises();
    expect(wrapper.get('textarea').element.value).toBe('<svg/>');
    active.value = 'json';
    await flushPromises();
    expect(wrapper.findAll('textarea')[0].element.value).toBe('');
    const other = mount(Host);
    wrappers.push(other);
    expect(other.findAll('textarea')[0].element.value).toBe('');
  });

  it('imports strict arrays, searches literal matches and preserves content after invalid imports', async () => {
    const wrapper = mount(JsonCtn);
    wrappers.push(wrapper);
    const fileInput = wrapper.get('input[type=file]');
    Object.defineProperty(fileInput.element, 'files', {
      configurable: true,
      value: [{ size: 30, text: async () => '[{"text":"needle"},"needle"]' }],
    });
    await fileInput.trigger('change');
    await flushPromises();
    const output = wrapper.findAll('textarea')[1];
    expect(JSON.parse(output.element.value)).toEqual([{ text: 'needle' }, 'needle']);
    await wrapper.get('.json-workbench__search input').setValue('needle');
    await wrapper.get('.json-workbench__search input').trigger('keydown', { key: 'Enter' });
    const editor = wrapper.findAll('textarea')[0].element;
    expect(editor.value.slice(editor.selectionStart, editor.selectionEnd)).toBe('needle');
    const previous = output.element.value;
    Object.defineProperty(fileInput.element, 'files', {
      configurable: true,
      value: [{ size: 20, text: async () => '{oops' }],
    });
    await fileInput.trigger('change');
    await flushPromises();
    expect(output.element.value).toBe(previous);
    expect(wrapper.get('[role=alert]').text()).toContain('有效 JSON');
  });

  it('rejects oversized and stale imports without replacing text', async () => {
    const wrapper = mount(JsonWorkbench, { props: { input: 'old', output: '' } });
    wrappers.push(wrapper);
    const input = wrapper.get('input[type=file]');
    const read = vi.fn();
    Object.defineProperty(input.element, 'files', {
      configurable: true,
      value: [{ size: 2 * 1024 * 1024 + 1, text: read }],
    });
    await input.trigger('change');
    await flushPromises();
    expect(read).not.toHaveBeenCalled();
    let resolve!: (value: string) => void;
    Object.defineProperty(input.element, 'files', {
      configurable: true,
      value: [
        {
          size: 10,
          text: () =>
            new Promise<string>(done => {
              resolve = done;
            }),
        },
      ],
    });
    await input.trigger('change');
    await wrapper.setProps({ input: 'newer edit' });
    resolve('{"a":1}');
    await flushPromises();
    expect(wrapper.emitted('import')).toBeUndefined();
  });

  it('selects native JSON parser positions without inventing unknown locations', async () => {
    expect(jsonErrorOffset('one\ntwo', new Error('at line 2 column 2'))).toBe(5);
    expect(jsonErrorOffset('abc', new Error('unknown'))).toBeUndefined();
    const wrapper = mount(JsonCtn);
    wrappers.push(wrapper);
    await wrapper.findAll('textarea')[1].setValue('{\n"a":1,\n}');
    await wrapper.get('.to-js').trigger('click');
    const button = wrapper.findAll('button').find(item => item.text() === '跳转到错误')!;
    expect(button, wrapper.get('[role=alert]').text()).toBeTruthy();
    await button.trigger('click');
    expect(wrapper.findAll('textarea')[1].element.selectionStart).toBeGreaterThan(0);
  });
});
