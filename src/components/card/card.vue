<template>
    <div :class="rootClass">
        <div v-if="hasHeader" class="rp-card__header">
            <slot name="header">
                <div v-if="hasTitle" class="rp-card__title">
                    {{ title }}
                </div>
                <p v-if="hasDescription" class="rp-card__description">
                    {{ description }}
                </p>
            </slot>
        </div>

        <div v-if="hasBody" :class="['rp-card__body', bodyClass]">
            <slot />
        </div>
    </div>
</template>

<script lang="ts" setup vapor>
import { computed, useSlots } from 'vue';
import { bem } from '@/utils/bem';
import type { CardProps } from './types';

defineOptions({ name: 'RpCard' });

const props = withDefaults(defineProps<CardProps>(), {
    border: true,
    headerBorder: false,
    title: '',
    description: '',
});

const slots = useSlots();
const hasTitle = computed(() => Boolean(props.title));
const hasDescription = computed(() => Boolean(props.description));
const hasHeader = computed(() => Boolean(slots.header || hasTitle.value || hasDescription.value));
const hasBody = computed(() => Boolean(slots.default));
const hasCompactHeaderSpacing = computed(() =>
    Boolean(hasHeader.value && hasBody.value && !props.headerBorder),
);

const rootClass = computed(() =>
    bem('rp-card', {
        [`layer-${props.layer}`]: Boolean(props.layer),
        [`padding-${props.padding}`]: Boolean(props.padding),
        [`radius-${props.radius}`]: Boolean(props.radius),
        borderless: !props.border,
        'header-bordered': props.headerBorder,
        'header-compact': hasCompactHeaderSpacing.value,
    }),
);
</script>

<style src="./card.scss" lang="scss" scoped></style>
