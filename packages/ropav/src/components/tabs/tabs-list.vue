<template>
    <ScrollArea
        v-bind="rootAttrs"
        embedded
        type="auto"
        :scrollbars="scrollbarAxis"
        :viewport-attrs="{ tabindex: -1 }"
        :content-attrs="contentAttrs"
    >
        <slot v-bind="slotProps" />
    </ScrollArea>
</template>

<script lang="ts" setup vapor>
import { computed, mergeProps } from 'vue';
import { useStylesApi } from '@/styles-api';
import { toPresenceAttribute } from '@/utils/attributes';
import ScrollArea from '../scroll-area/scroll-area.vue';
import { useTabsList } from './useTabs';
import type { TabsListPart, TabsListProps } from './types';

defineOptions({ name: 'RpTabsList', inheritAttrs: false });

const props = defineProps<TabsListProps>();

const { rootProps: internalRootProps, slotProps } = useTabsList(props);
const scrollbarAxis = computed(() => (slotProps.value.orientation === 'horizontal' ? 'x' : 'y'));
const { attrs: forwardedAttrs, getRootAttrs } = useStylesApi<TabsListPart>(props, 'root');
const forwardedContentAttrNames = computed(() => Object.keys(forwardedAttrs).filter(isContentAttr));
const rootAttrs = computed(() => {
    const internal = internalRootProps.value;
    return getRootAttrs(
        {
            id: internal.id,
            class: internal.class,
            'data-disabled': toPresenceAttribute(internal['data-disabled']),
            'data-variant': internal['data-variant'],
            'data-orientation': internal['data-orientation'],
            'data-placement': internal['data-placement'],
        },
        {},
        forwardedContentAttrNames.value,
    );
});
const contentAttrs = computed(() => {
    const internal = internalRootProps.value;
    const internalAttrs = {
        role: internal.role,
        'aria-orientation': internal['aria-orientation'],
        'aria-label': internal['aria-label'],
        'aria-labelledby': internal['aria-labelledby'],
        'aria-describedby': internal['aria-describedby'],
        onKeydown: internal.onKeydown,
    };
    const attrs = Object.fromEntries(
        forwardedContentAttrNames.value.map((name) => [name, forwardedAttrs[name]]),
    );
    const merged = mergeProps(internalAttrs, attrs);

    for (const [name, value] of Object.entries(internalAttrs)) {
        if (name === 'onKeydown') continue;
        merged[name] = value;
    }

    return merged;
});

function isContentAttr(name: string) {
    return name === 'role' || name === 'onKeydown' || name.startsWith('aria-');
}
</script>

<style src="./tabs-list.scss" lang="scss" scoped></style>
