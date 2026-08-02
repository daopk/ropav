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
import { getNameInitials } from '@/utils/text';
import type { AvatarPart, AvatarProps } from './types';
import { getAvatarColorStyle } from './avatarColor';

defineOptions({ name: 'RpAvatar', inheritAttrs: false });

const props = withDefaults(defineProps<AvatarProps>(), {
    autoContrast: true,
});
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
const initials = computed(() => getNameInitials(props.name));

const rootClass = computed(() =>
    bem('rp-avatar', {
        [props.variant ?? '']: Boolean(props.variant),
        [`size-${props.size}`]: Boolean(props.size),
        [`radius-${props.radius}`]: Boolean(props.radius),
    }),
);

const rootStyle = computed(() =>
    getAvatarColorStyle(props.color, props.variant, props.autoContrast, props.contrastColor),
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
</script>

<style src="./avatar.scss" lang="scss" scoped></style>
