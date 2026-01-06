<template>
  <article class="m-color-intro g-fs12" s-ft_sub_>
    <p>{{ t('colorPass.remarks.title') }}</p>
    <p>{{ t('colorPass.remarks.rgb') }}</p>
    <p>{{ t('colorPass.remarks.hex') }}</p>
    <p>{{ t('colorPass.remarks.hsb') }}</p>
    <p>{{ t('colorPass.remarks.hsl') }}</p>
  </article>
</template>

<script lang="ts" setup>
import { langManager } from '@/utils/i18n';

const t = (key: string) => langManager.t(key);
</script>

<style lang="less">
/**
 * Color swatch preview section.
 */
.m-color-show {
  height: 32px;
  width: 32px;
  border-radius: 50%;
  border: 1px solid #e2e9ff;
  box-shadow: 0 6px 14px rgba(28, 63, 124, 0.12);
}
</style>
