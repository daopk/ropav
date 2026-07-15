<template>
    <span v-bind="rootAttrs">
        <img
            v-if="showsImage"
            :class="getPartAttrs('image', { class: 'rp-avatar__image' }).class"
            :style="getPartAttrs('image').style"
            :src="src || undefined"
            :alt.attr="imageAlt"
            @load="handleImageLoad"
            @error="handleImageError"
        />
        <span
            v-else
            v-bind="getPartAttrs('fallback', { class: 'rp-avatar__fallback' })"
            :aria-hidden="fallbackAriaHidden"
        >
            <slot>
                <span v-if="initials" class="rp-avatar__initials">{{ initials }}</span>
                <IconUser v-else class="rp-avatar__icon" aria-hidden="true" />
            </slot>
        </span>
    </span>
</template>

<script lang="ts" setup vapor>
import { computed, ref, watch } from 'vue';
import IconUser from '~icons/lucide/user';
import { bem } from '@/utils/bem';
import { useStylesApi } from '@/styles-api';
import type { AvatarPart, AvatarProps } from './types';
import { getAvatarColorStyle } from './useAvatarColor';

defineOptions({ name: 'RpAvatar', inheritAttrs: false });

const props = defineProps<AvatarProps>();
const emit = defineEmits<{
    load: [event: Event];
    error: [event: Event];
}>();

const { attrs, getPartAttrs, getRootAttrs } = useStylesApi<AvatarPart>(props, 'root');
const imageFailed = ref(false);

const isHidden = computed(() => attrs['aria-hidden'] === true || attrs['aria-hidden'] === 'true');
const showsImage = computed(() => Boolean(props.src) && !imageFailed.value);
const accessibleName = computed(() => {
    if (isHidden.value) return undefined;
    return props.ariaLabel || props.alt || props.name || undefined;
});
const imageAlt = computed(() => accessibleName.value ?? '');
const rootRole = computed(() => (!showsImage.value && accessibleName.value ? 'img' : undefined));
const rootAriaLabel = computed(() => (rootRole.value ? accessibleName.value : undefined));
const fallbackAriaHidden = computed(() =>
    isHidden.value || rootAriaLabel.value ? true : undefined,
);
const initials = computed(() => getInitials(props.name));

const rootClass = computed(() =>
    bem('rp-avatar', {
        [props.variant ?? '']: Boolean(props.variant),
        [`size-${props.size}`]: Boolean(props.size),
        [`radius-${props.radius}`]: Boolean(props.radius),
    }),
);

const rootStyle = computed(() =>
    getAvatarColorStyle(props.color, props.variant, props.autoContrast),
);
const rootAttrs = computed(() =>
    getRootAttrs({
        class: rootClass.value,
        style: rootStyle.value,
        role: rootRole.value,
        'aria-label': rootAriaLabel.value,
    }),
);

watch(
    () => props.src,
    () => {
        imageFailed.value = false;
    },
);

function handleImageLoad(event: Event) {
    emit('load', event);
}

function handleImageError(event: Event) {
    imageFailed.value = true;
    emit('error', event);
}

function getInitials(name: string | undefined) {
    if (!name) return '';

    const parts = name.trim().split(/\s+/).filter(Boolean);
    const firstPart = parts[0];
    if (!firstPart) return '';

    if (parts.length === 1) {
        return Array.from(firstPart).slice(0, 2).join('').toLocaleUpperCase();
    }

    const lastPart = parts.at(-1) ?? firstPart;
    const firstInitial = Array.from(firstPart)[0] ?? '';
    const lastInitial = Array.from(lastPart)[0] ?? '';

    return `${firstInitial}${lastInitial}`.toLocaleUpperCase();
}
</script>

<style src="./avatar.scss" lang="scss" scoped></style>
