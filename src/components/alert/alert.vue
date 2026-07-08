<template>
    <div v-if="isOpen" :class="rootClass" :style="rootStyle" :role="resolvedRole">
        <div v-if="hasIcon" class="rp-alert__icon" aria-hidden="true">
            <slot name="icon">
                <IconCircleCheck v-if="presetIcon === 'success'" />
                <IconTriangleAlert v-else-if="presetIcon === 'warning'" />
                <IconCircleX v-else-if="presetIcon === 'danger'" />
                <IconInfo v-else />
            </slot>
        </div>

        <div v-if="hasContent" class="rp-alert__content">
            <div v-if="hasTitle" class="rp-alert__title">
                <slot name="title">
                    {{ title }}
                </slot>
            </div>
            <p v-if="hasDescription" class="rp-alert__description">
                {{ description }}
            </p>
            <div v-if="$slots.default" class="rp-alert__body">
                <slot />
            </div>
        </div>

        <div v-if="$slots.action" class="rp-alert__action">
            <slot name="action" />
        </div>

        <button
            v-if="closable"
            class="rp-alert__close"
            type="button"
            :aria-label="closeLabel"
            @click="closeAlert"
        >
            <IconX aria-hidden="true" />
        </button>
    </div>
</template>

<script lang="ts" setup vapor>
import { computed, ref, useSlots, watch } from 'vue';
import IconCircleCheck from '~icons/lucide/circle-check';
import IconCircleX from '~icons/lucide/circle-x';
import IconInfo from '~icons/lucide/info';
import IconTriangleAlert from '~icons/lucide/triangle-alert';
import IconX from '~icons/lucide/x';
import { bem } from '@/utils/bem';
import { isComponentPresetColor } from '@/utils/componentColors';
import type { AlertProps } from './types';
import { getAlertColorStyle } from './useAlertColor';

defineOptions({ name: 'RpAlert' });

const props = withDefaults(defineProps<AlertProps>(), {
    open: undefined,
    title: '',
    description: '',
    role: 'alert',
    showIcon: true,
    closable: false,
    closeLabel: 'Close alert',
});

const emit = defineEmits<{
    'update:open': [value: boolean];
    close: [];
}>();

const slots = useSlots();
const localOpen = ref(props.open ?? true);

watch(
    () => props.open,
    (open) => {
        if (open !== undefined) localOpen.value = open;
    },
);

const isOpen = computed(() => props.open ?? localOpen.value);
const hasTitle = computed(() => Boolean(props.title || slots.title));
const hasDescription = computed(() => Boolean(props.description));
const hasContent = computed(() => Boolean(hasTitle.value || hasDescription.value || slots.default));
const resolvedRole = computed(() => (props.role === 'none' ? undefined : props.role));
const presetIcon = computed(() => {
    if (!props.showIcon) return '';

    if (props.color === 'success') return 'success';
    if (props.color === 'warning') return 'warning';
    if (props.color === 'danger') return 'danger';
    return 'info';
});
const hasIcon = computed(() => Boolean(props.showIcon && (slots.icon || presetIcon.value)));

const rootClass = computed(() =>
    bem('rp-alert', {
        [props.variant ?? '']: Boolean(props.variant),
        [`color-${props.color}`]: isComponentPresetColor(props.color),
        [`radius-${props.radius}`]: Boolean(props.radius),
    }),
);

const rootStyle = computed(() => getAlertColorStyle(props.color));

function closeAlert() {
    localOpen.value = false;
    emit('update:open', false);
    emit('close');
}
</script>

<style src="./alert.scss" lang="scss" scoped></style>
