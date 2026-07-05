<template>
    <div :class="rootClass" role="tablist" ref="listRef" @keydown="onKeydown">
        <slot />
    </div>
</template>

<script lang="ts" setup vapor>
import { useTabsList } from './useTabs';

defineOptions({ name: 'RpTabsList' });

const { listRef, rootClass, onKeydown } = useTabsList();
void listRef;
</script>

<style src="./tabs-list.scss" lang="scss" scoped></style>
