<template>
    <div v-if="isOpen" v-bind="rootAttrs">
        <div
            v-if="hasIcon"
            v-bind="getPartAttrs('icon', { class: 'rp-alert__icon' })"
            aria-hidden="true"
        >
            <slot name="icon" />
        </div>

        <div v-if="hasContent" class="rp-alert__content">
            <div v-if="hasTitle" v-bind="getPartAttrs('title', { class: 'rp-alert__title' })">
                <slot name="title">
                    {{ title }}
                </slot>
            </div>
            <p
                v-if="hasDescription"
                v-bind="getPartAttrs('description', { class: 'rp-alert__description' })"
            >
                {{ description }}
            </p>
            <div v-if="$slots.default" v-bind="getPartAttrs('body', { class: 'rp-alert__body' })">
                <slot />
            </div>
        </div>

        <div v-if="$slots.action" v-bind="getPartAttrs('action', { class: 'rp-alert__action' })">
            <slot name="action" />
        </div>

        <button
            v-if="closable"
            v-bind="getPartAttrs('close', { class: 'rp-alert__close' })"
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
import IconX from '~icons/lucide/x';
import { bem } from '@/utils/bem';
import { useStylesApi } from '@/styles-api';
import type { AlertPart, AlertProps } from './types';
import { getAlertColorStyle } from './useAlertColor';

defineOptions({ name: 'RpAlert', inheritAttrs: false });

const props = withDefaults(defineProps<AlertProps>(), {
    open: undefined,
    title: '',
    description: '',
    autoContrast: true,
    role: 'alert',
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
const hasIcon = computed(() => Boolean(slots.icon));

const rootClass = computed(() =>
    bem('rp-alert', {
        [props.variant ?? '']: Boolean(props.variant),
        [`radius-${props.radius}`]: Boolean(props.radius),
    }),
);

const rootStyle = computed(() =>
    getAlertColorStyle(props.color, props.variant, props.autoContrast, props.contrastColor),
);

const { getPartAttrs, getRootAttrs } = useStylesApi<AlertPart>(props, 'root');
const rootAttrs = computed(() =>
    getRootAttrs({ class: rootClass.value, style: rootStyle.value, role: resolvedRole.value }),
);

function closeAlert() {
    localOpen.value = false;
    emit('update:open', false);
    emit('close');
}
</script>

<style src="./alert.scss" lang="scss" scoped></style>
