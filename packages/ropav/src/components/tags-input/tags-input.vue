<template>
    <div v-bind="rootAttrs" :ref="templateRefs.root">
        <select
            v-bind="nativeSelectAttrs"
            :ref="templateRefs.native"
            :name="name"
            :form="control.form"
            :disabled="control.disabled || undefined"
            :required="(control.required && !readonly) || undefined"
            multiple
            tabindex="-1"
            aria-hidden="true"
        />

        <div v-bind="getPartAttrs('tags', { class: 'rp-tags-input__tags' })">
            <span
                v-for="(value, index) in values"
                :key="`${value}-${index}`"
                v-bind="getPartAttrs('tag', { class: 'rp-tags-input__tag' })"
            >
                <span
                    v-bind="
                        getPartAttrs('tagLabel', {
                            class: 'rp-tags-input__tag-label',
                        })
                    "
                >
                    <slot name="tag" :value="value">{{ value }}</slot>
                </span>
                <button
                    v-if="!readonly"
                    type="button"
                    v-bind="
                        getPartAttrs('tagRemove', {
                            class: 'rp-tags-input__tag-remove',
                        })
                    "
                    :aria-label="`${removeLabel} ${value}`"
                    :disabled="control.disabled || undefined"
                    tabindex="-1"
                    @mousedown.prevent
                    @click.stop="removeTag(index)"
                >
                    <XIcon />
                </button>
            </span>

            <input v-bind="visibleInputAttrs" :ref="templateRefs.input" />
        </div>

        <button
            v-if="canClear"
            type="button"
            v-bind="getPartAttrs('clear', { class: 'rp-tags-input__clear' })"
            :aria-label="clearLabel"
            tabindex="-1"
            @mousedown.prevent
            @click.stop="clear"
        >
            <XIcon />
        </button>
    </div>
</template>

<script lang="ts" setup vapor>
import { computed, type InputHTMLAttributes } from 'vue';
import XIcon from '~icons/lucide/x';
import { useStylesApi } from '@/styles-api';
import { toPresenceAttribute } from '@/utils/attributes';
import { composeEventHandlers, splitCompatibilityAttributes } from '@/utils/dom/attributes';
import { useTagsInput } from './useTagsInput';
import type { TagsInputPart, TagsInputProps, TagsInputTagSlotProps } from './types';

defineOptions({ name: 'RpTagsInput', inheritAttrs: false });

const props = withDefaults(defineProps<TagsInputProps>(), {
    modelValue: undefined,
    defaultValue: () => [],
    maxTags: undefined,
    allowDuplicates: false,
    splitChars: () => [','],
    acceptValueOnBlur: false,
    validate: undefined,
    placeholder: 'Enter tags...',
    clearable: false,
    clearLabel: 'Clear tags',
    removeLabel: 'Remove',
    disabled: undefined,
    readonly: false,
    required: undefined,
    invalid: undefined,
});

const emit = defineEmits<{
    'update:modelValue': [value: string[]];
}>();

defineSlots<{
    tag?(props: TagsInputTagSlotProps): unknown;
}>();

const {
    templateRefs,
    nativeSelectAttrs,
    control,
    rootClass,
    values,
    searchValue,
    canClear,
    removeTag,
    clear,
    focusInput,
    onInput,
    onInputBlur,
    onInputKeydown,
} = useTagsInput(props, (value) => emit('update:modelValue', value));

const { getPartAttrs, getRootAttrs } = useStylesApi<TagsInputPart>(props, 'root');
const rootAttrs = computed(() =>
    getRootAttrs({
        class: rootClass.value,
        onMousedown: focusInput,
        'data-disabled': toPresenceAttribute(control.disabled),
        'data-readonly': toPresenceAttribute(props.readonly),
        'data-invalid': toPresenceAttribute(control.invalid),
    }),
);
const visibleInputAttrs = computed<InputHTMLAttributes>(() => {
    const attrs = props.inputAttrs ?? {};
    const { compatibilityClass, compatibilityStyle, forwardedAttributes } =
        splitCompatibilityAttributes(attrs);

    return {
        ...forwardedAttributes,
        ...getPartAttrs('input', {
            class: 'rp-tags-input__input',
            compatibilityClass,
            compatibilityStyle,
        }),
        id: control.id,
        name: undefined,
        form: '',
        type: 'text',
        value: searchValue.value,
        placeholder: values.value.length === 0 ? props.placeholder : undefined,
        disabled: control.disabled || undefined,
        readonly: props.readonly || undefined,
        required: undefined,
        autocomplete: forwardedAttributes.autocomplete ?? 'off',
        'aria-disabled': control.disabled || undefined,
        'aria-invalid': control.invalid || undefined,
        'aria-required': control.required || undefined,
        'aria-label': control.ariaLabelledby ? undefined : props.ariaLabel || undefined,
        'aria-labelledby': control.ariaLabelledby,
        'aria-describedby': control.ariaDescribedby,
        'data-disabled': toPresenceAttribute(control.disabled),
        'data-readonly': toPresenceAttribute(props.readonly),
        'data-invalid': toPresenceAttribute(control.invalid),
        onInput: composeEventHandlers(onInput, attrs.onInput),
        onBlur: composeEventHandlers(onInputBlur, attrs.onBlur),
        onKeydown: composeEventHandlers(onInputKeydown, attrs.onKeydown),
    };
});

defineExpose({
    nativeElement: templateRefs.native,
    inputElement: templateRefs.input,
    focus: () => templateRefs.input.value?.focus(),
});
</script>

<style src="./tags-input.scss" lang="scss" scoped></style>
