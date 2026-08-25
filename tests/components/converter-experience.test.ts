import { flushPromises, mount } from '@vue/test-utils';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import QRCode from '@/components/QRCode/index.vue';
import ColorPass from '@/components/ColorPass/index.vue';
import UnitCalculator from '@/components/UnitCalculator/index.vue';
import DateConverter from '@/components/DateConverter/index.vue';
import JsonCtn from '@/components/JsonCtn/index.vue';
import SvgEditor from '@/components/SvgEditor/index.vue';

const qrDownload = vi.fn();
vi.mock('@/utils/chrome', () => ({ getLocalTabUrl: vi.fn() }));
vi.mock('@/utils', () => ({
  handleQRCode: vi.fn(() => ({
    getImgUrl: () => 'data:image/png;base64,qr',
    downloadQR: qrDownload,
  })),
}));

describe('converter and editor experience', () => {
  beforeEach(() => {
    localStorage.clear();
    qrDownload.mockClear();
    Object.defineProperty(navigator, 'clipboard', {
      configurable: true,
      value: { writeText: vi.fn().mockResolvedValue(undefined) },
    });
  });

  it('validates QR source and reports generation/download outcomes', async () => {
    const wrapper = mount(QRCode);
    await wrapper.get('button[s-color="blue"]').trigger('click');
    expect(wrapper.get('[role="alert"]').text()).toContain('请输入');
    await wrapper.get('#qr-source').setValue('https://example.test');
    await wrapper.get('button[s-color="blue"]').trigger('click');
    expect(wrapper.get('.qr-tool__image').attributes('src')).toContain('data:image/png');
    await wrapper.findAll('button[s-color="blue"]')[1].trigger('click');
    expect(qrDownload).toHaveBeenCalledWith('svg');
  });

  it('retains the last valid color result while invalid input is edited', async () => {
    const wrapper = mount(ColorPass);
    const hex = wrapper.get('#color-hex');
    await hex.setValue('ff0000');
    expect((wrapper.get('#color-rgb').element as HTMLInputElement).value).toBe('255,0,0');
    await hex.setValue('bad');
    expect(wrapper.get('[role="alert"]').exists()).toBe(true);
    expect((wrapper.get('#color-rgb').element as HTMLInputElement).value).toBe('255,0,0');
  });

  it('prevents NaN unit output and persists only valid settings', async () => {
    const wrapper = mount(UnitCalculator);
    await wrapper.get('#unit-px').setValue('75');
    expect((wrapper.get('#unit-rem').element as HTMLInputElement).value).toBe('1.000000');
    await wrapper.get('#unit-rate').setValue('0');
    expect(wrapper.get('[role="alert"]').exists()).toBe(true);
    expect((wrapper.get('#unit-rem').element as HTMLInputElement).value).toBe('1.000000');
    expect(localStorage.getItem('feTools_rate')).not.toBe('0');
  });

  it('retains Date Converter results and uses inline validation and copy feedback', async () => {
    const wrapper = mount(DateConverter);
    await flushPromises();
    const previous = wrapper.get('.date-converter__result-value').text();
    await wrapper.find('input[value="iso"]').setValue(true);
    await wrapper.get('input[placeholder*="ISO"]').setValue('not-a-date');
    expect(wrapper.get('[role="alert"]').exists()).toBe(true);
    expect(wrapper.get('.date-converter__result-value').text()).toBe(previous);
  });

  it('uses semantic JSON actions and non-modal success feedback', async () => {
    const wrapper = mount(JsonCtn);
    await wrapper.findAll('textarea')[0].setValue('{ a: 1 }');
    await wrapper.get('button.action-icon.to-json').trigger('click');
    expect(wrapper.findAll('textarea')[1].element.value).toContain('"a": 1');
    expect(wrapper.get('[role="status"]').text()).toContain('成功');
  });

  it('keeps expression compatibility but blocks direct browser capability access', async () => {
    const wrapper = mount(JsonCtn);
    await wrapper.findAll('textarea')[0].setValue('{ answer: (() => 40 + 2)() }');
    await wrapper.get('button.action-icon.to-json').trigger('click');
    expect(wrapper.findAll('textarea')[1].element.value).toContain('"answer": 42');

    await wrapper.findAll('textarea')[0].setValue('{ label: `window status` }');
    await wrapper.get('button.action-icon.to-json').trigger('click');
    expect(wrapper.findAll('textarea')[1].element.value).toContain('"window status"');

    await wrapper.findAll('textarea')[0].setValue('{ value: window.location.href }');
    await wrapper.get('button.action-icon.to-json').trigger('click');
    expect(wrapper.get('[role="alert"]').text()).toContain('不允许');
  });

  it('confirms SVG reset and reports optimization inline', async () => {
    const wrapper = mount(SvgEditor);
    await wrapper.findAll('.svg-editor__btn-link')[0].trigger('click');
    await wrapper.get('.svg-editor__action-btn[s-color="blue"]').trigger('click');
    expect(wrapper.get('[role="status"]').text()).toContain('成功');
    await wrapper.findAll('.svg-editor__btn-link')[0].trigger('click');
    expect(wrapper.get('[role="alertdialog"]').exists()).toBe(true);
  });
});
