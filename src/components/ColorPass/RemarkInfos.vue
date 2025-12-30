<!--
 * @author Wayne
 * @Date 2023-07-17 19:55:15
 * @LastEditTime 2025-04-22 13:36:03
-->
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
// 颜色展示部分
.m-color-show {
  height: 25px;
  width: 25px;
  border-radius: 50%;
}
</style>
