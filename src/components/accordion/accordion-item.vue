<template>
    <div v-bind="rootProps">
        <h3 class="rp-accordion-item__heading">
            <slot name="trigger" v-bind="triggerSlotProps">
                <button v-bind="triggerProps">
                    <span class="rp-accordion-item__title">
                        <slot name="title">{{ title }}</slot>
                    </span>
                    <span class="rp-accordion-item__icon" aria-hidden="true">
                        <IconChevronDown />
                    </span>
                </button>
            </slot>
        </h3>

        <Transition name="rp-accordion-content">
            <section v-if="shouldRenderContent" v-show="isOpen" v-bind="contentProps">
                <div class="rp-accordion-item__inner">
                    <slot v-bind="contentSlotProps" />
                </div>
            </section>
        </Transition>
    </div>
</template>

<script lang="ts" setup vapor>
import IconChevronDown from '~icons/lucide/chevron-down';
import { useAccordionItem } from './useAccordion';
import type { AccordionItemProps } from './types';

defineOptions({ name: 'RpAccordionItem' });

const props = withDefaults(defineProps<AccordionItemProps>(), {
    title: '',
    disabled: false,
    unmountOnExit: undefined,
    role: 'region',
});

const {
    rootProps,
    triggerProps,
    contentProps,
    triggerSlotProps,
    contentSlotProps,
    isOpen,
    shouldRenderContent,
} = useAccordionItem(props);
</script>

<style src="./accordion-item.scss" lang="scss" scoped></style>
