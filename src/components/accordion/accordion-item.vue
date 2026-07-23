<template>
    <div v-bind="rootAttrs">
        <h3 class="rp-accordion-item__heading">
            <slot name="trigger" v-bind="publicTriggerSlotProps">
                <button v-bind="publicTriggerProps">
                    <span v-bind="getPartAttrs('title', { class: 'rp-accordion-item__title' })">
                        <slot name="title">{{ title }}</slot>
                    </span>
                    <span
                        v-bind="getPartAttrs('icon', { class: 'rp-accordion-item__icon' })"
                        aria-hidden="true"
                    >
                        <IconChevronDown />
                    </span>
                </button>
            </slot>
        </h3>

        <Transition name="rp-accordion-content">
            <section v-if="shouldRenderContent" v-show="isOpen" v-bind="publicContentProps">
                <div class="rp-accordion-item__inner">
                    <slot v-bind="contentSlotProps" />
                </div>
            </section>
        </Transition>
    </div>
</template>

<script lang="ts" setup vapor>
import { computed } from 'vue';
import IconChevronDown from '~icons/lucide/chevron-down';
import { useStylesApi } from '@/styles-api';
import { toPresenceAttribute } from '@/utils/attributes';
import { useAccordionItem } from './useAccordion';
import type { AccordionItemPart, AccordionItemProps } from './types';

defineOptions({ name: 'RpAccordionItem', inheritAttrs: false });

const props = withDefaults(defineProps<AccordionItemProps>(), {
    title: '',
    disabled: false,
    unmountOnExit: undefined,
    role: 'region',
});

const {
    rootProps: internalRootProps,
    triggerProps: internalTriggerProps,
    contentProps,
    triggerSlotProps,
    contentSlotProps,
    isOpen,
    shouldRenderContent,
} = useAccordionItem(props);

const { getPartAttrs, getRootAttrs } = useStylesApi<AccordionItemPart>(props, 'root');
const rootAttrs = computed(() =>
    getRootAttrs({
        ...internalRootProps.value,
        'data-disabled': toPresenceAttribute(internalRootProps.value['data-disabled']),
    }),
);
const publicTriggerProps = computed(() => ({
    ...internalTriggerProps.value,
    ...getPartAttrs('trigger', { class: internalTriggerProps.value.class }),
    'data-state': internalRootProps.value['data-state'],
    'data-disabled': toPresenceAttribute(internalRootProps.value['data-disabled']),
}));
const publicTriggerSlotProps = computed(() => ({
    ...triggerSlotProps.value,
    triggerProps: publicTriggerProps.value,
}));
const publicContentProps = computed(() => ({
    ...contentProps.value,
    ...getPartAttrs('content', { class: contentProps.value.class }),
}));
</script>

<style src="./accordion-item.scss" lang="scss" scoped></style>
