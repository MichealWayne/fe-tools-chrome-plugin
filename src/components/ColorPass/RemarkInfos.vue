<template>
  <details class="m-color-intro g-fs12" s-ft_sub_>
    <summary>{{ t('colorPass.remarks.title') }}</summary>
    <p>{{ t('colorPass.remarks.rgb') }}</p>
    <p>{{ t('colorPass.remarks.hex') }}</p>
    <p>{{ t('colorPass.remarks.hsb') }}</p>
    <p>{{ t('colorPass.remarks.hsl') }}</p>
  </details>
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
  box-sizing: border-box;
}
</style>
