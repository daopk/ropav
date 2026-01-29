<template>
    <span :class="rootClass">
        <img
            v-if="src && !imgError"
            :src="src"
            :alt="alt"
            class="rp-avatar__image"
            @error="imgError = true"
        />
        <span v-else class="rp-avatar__fallback">
            {{ initials }}
        </span>
    </span>
</template>

<script lang="ts" setup vapor>
import { computed, ref, watch } from 'vue';
import { bem } from '@/utils/bem';
import type { AvatarProps } from './types';

defineOptions({ name: 'RpAvatar' });

const props = withDefaults(defineProps<AvatarProps>(), {
    alt: '',
    name: '',
    size: 'md',
    shape: 'circle',
});

const imgError = ref(false);

watch(() => props.src, () => {
    imgError.value = false;
});

const rootClass = computed(() => bem('rp-avatar', props.size, props.shape));

const initials = computed(() => {
    if (!props.name) return '?';
    return props.name
        .split(/\s+/)
        .slice(0, 2)
        .map(w => w[0])
        .join('')
        .toUpperCase();
});
</script>

<style lang="scss" scoped>
.rp-avatar {
    @include flex-center;
    overflow: hidden;
    flex-shrink: 0;
    background-color: var(--rp-color-gray-200);
    color: var(--rp-color-gray-700);
    font-family: var(--rp-font-family);
    font-weight: var(--rp-font-weight-semibold);
    vertical-align: middle;

    &--sm {
        width: var(--rp-size-sm);
        height: var(--rp-size-sm);
        font-size: var(--rp-font-size-xs);
    }

    &--md {
        width: var(--rp-size-md);
        height: var(--rp-size-md);
        font-size: var(--rp-font-size-sm);
    }

    &--lg {
        width: var(--rp-size-lg);
        height: var(--rp-size-lg);
        font-size: var(--rp-font-size-lg);
    }

    &--circle {
        border-radius: var(--rp-radius-full);
    }

    &--square {
        border-radius: var(--rp-radius-lg);
    }

    &__image {
        width: 100%;
        height: 100%;
        object-fit: cover;
    }

    &__fallback {
        display: flex;
        align-items: center;
        justify-content: center;
        width: 100%;
        height: 100%;
        line-height: 1;
        background-color: var(--rp-color-primary);
        color: var(--rp-color-white);
    }
}
</style>
