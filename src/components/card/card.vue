<template>
    <div v-bind="rootAttrs">
        <div v-if="hasHeader" v-bind="getPartAttrs('header', { class: 'rp-card__header' })">
            <slot name="header">
                <div v-if="hasTitle" v-bind="getPartAttrs('title', { class: 'rp-card__title' })">
                    {{ title }}
                </div>
                <p
                    v-if="hasDescription"
                    v-bind="getPartAttrs('description', { class: 'rp-card__description' })"
                >
                    {{ description }}
                </p>
            </slot>
        </div>

        <div
            v-if="hasBody"
            v-bind="
                getPartAttrs('body', {
                    class: 'rp-card__body',
                    compatibilityClass: bodyClass,
                })
            "
        >
            <slot />
        </div>

        <div v-if="hasFooter" v-bind="getPartAttrs('footer', { class: 'rp-card__footer' })">
            <slot name="footer" />
        </div>
    </div>
</template>

<script lang="ts" setup vapor>
import { computed, useSlots } from 'vue';
import { bem } from '@/utils/bem';
import { useStylesApi } from '@/styles-api';
import type { CardPart, CardProps } from './types';

defineOptions({ name: 'RpCard', inheritAttrs: false });

const props = withDefaults(defineProps<CardProps>(), {
    border: true,
    headerBorder: false,
    footerBorder: false,
    title: '',
    description: '',
});

const slots = useSlots();
const hasTitle = computed(() => Boolean(props.title));
const hasDescription = computed(() => Boolean(props.description));
const hasHeader = computed(() => Boolean(slots.header || hasTitle.value || hasDescription.value));
const hasBody = computed(() => Boolean(slots.default));
const hasFooter = computed(() => Boolean(slots.footer));
const hasCompactHeaderSpacing = computed(() =>
    Boolean(hasHeader.value && hasBody.value && !props.headerBorder),
);
const hasCompactFooterSpacing = computed(() =>
    Boolean(hasFooter.value && hasBody.value && !props.footerBorder),
);

const rootClass = computed(() =>
    bem('rp-card', {
        [`layer-${props.layer}`]: Boolean(props.layer),
        [`padding-${props.padding}`]: Boolean(props.padding),
        [`radius-${props.radius}`]: Boolean(props.radius),
        borderless: !props.border,
        'header-bordered': props.headerBorder,
        'header-compact': hasCompactHeaderSpacing.value,
        'footer-bordered': props.footerBorder,
        'footer-compact': hasCompactFooterSpacing.value,
    }),
);
const { getPartAttrs, getRootAttrs } = useStylesApi<CardPart>(props, 'root');
const rootAttrs = computed(() => getRootAttrs({ class: rootClass.value }));
</script>

<style src="./card.scss" lang="scss" scoped></style>
