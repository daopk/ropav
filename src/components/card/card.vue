<template>
    <div :class="rootClass">
        <div v-if="hasHeader" class="rp-card__header">
            <div v-if="hasTitle" class="rp-card__title">
                {{ title }}
            </div>
            <p v-if="hasDescription" class="rp-card__description">
                {{ description }}
            </p>
        </div>

        <div v-if="$slots.default" class="rp-card__body">
            <slot />
        </div>
    </div>
</template>

<script lang="ts" setup vapor>
import { computed } from 'vue';
import { bem } from '@/utils/bem';
import type { CardProps } from './types';

defineOptions({ name: 'RpCard' });

const props = withDefaults(defineProps<CardProps>(), {
    border: true,
    title: '',
    description: '',
});

const hasTitle = computed(() => Boolean(props.title));
const hasDescription = computed(() => Boolean(props.description));
const hasHeader = computed(() => Boolean(hasTitle.value || hasDescription.value));

const rootClass = computed(() =>
    bem('rp-card', {
        [`layer-${props.layer}`]: Boolean(props.layer),
        [`padding-${props.padding}`]: Boolean(props.padding),
        [`radius-${props.radius}`]: Boolean(props.radius),
        borderless: !props.border,
    }),
);
</script>

<style src="./card.scss" lang="scss" scoped></style>
