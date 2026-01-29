<template>
    <div :class="rootClass" ref="selectRef">
        <div
            class="rp-select__trigger"
            :tabindex="disabled ? -1 : 0"
            @click="toggle"
            @keydown="onTriggerKeydown"
        >
            <input
                v-if="searchable && isOpen"
                ref="searchInputRef"
                v-model="searchQuery"
                class="rp-select__search"
                :placeholder="displayLabel || placeholder"
                @click.stop
                @keydown="onTriggerKeydown"
            />
            <span v-else class="rp-select__value" :class="{ 'rp-select__placeholder': !hasValue }">
                {{ displayLabel || placeholder }}
            </span>

            <span class="rp-select__actions">
                <span
                    v-if="clearable && hasValue"
                    class="rp-select__clear"
                    @click.stop="clear"
                >
                    <CloseIcon />
                </span>
                <span class="rp-select__arrow" :class="{ 'rp-select__arrow--open': isOpen }">
                    <ChevronDownIcon />
                </span>
            </span>
        </div>

        <Transition name="rp-select-dropdown">
            <div v-if="isOpen" class="rp-select__dropdown">
                <div
                    v-if="filteredOptions.length === 0"
                    class="rp-select__empty"
                >
                    No options
                </div>
                <div
                    v-for="(option, index) in filteredOptions"
                    :key="option.value"
                    :class="[
                        'rp-select__option',
                        {
                            'rp-select__option--selected': option.value === modelValue,
                            'rp-select__option--focused': index === focusedIndex,
                            'rp-select__option--disabled': option.disabled,
                        },
                    ]"
                    @click="selectOption(option)"
                    @mouseenter="focusedIndex = index"
                >
                    {{ option.label }}
                </div>
            </div>
        </Transition>
    </div>
</template>

<script lang="ts" setup vapor>
import { computed, ref, nextTick } from 'vue';
import { bem } from '@/utils/bem';
import { useClickOutside } from '@/composables/useClickOutside';
import { CloseIcon, ChevronDownIcon } from '@/components/_internal/icons';
import type { SelectProps, SelectOption } from './types';

defineOptions({ name: 'RpSelect' });

const props = withDefaults(defineProps<SelectProps>(), {
    modelValue: null,
    options: () => [],
    placeholder: 'Select...',
    disabled: false,
    clearable: false,
    searchable: false,
    size: 'md',
    block: false,
});

const emit = defineEmits<{
    'update:modelValue': [value: string | number | null];
}>();

const selectRef = ref<HTMLElement | null>(null);
const searchInputRef = ref<HTMLInputElement | null>(null);
const isOpen = ref(false);
const searchQuery = ref('');
const focusedIndex = ref(-1);

const rootClass = computed(() =>
    bem('rp-select', props.size, {
        open: isOpen.value,
        disabled: props.disabled,
        block: props.block,
    }),
);

const hasValue = computed(() => props.modelValue != null && props.modelValue !== '');

const displayLabel = computed(() => {
    if (!hasValue.value) return '';
    const found = props.options.find((o) => o.value === props.modelValue);
    return found ? found.label : '';
});

const filteredOptions = computed(() => {
    if (!searchQuery.value) return props.options;
    const q = searchQuery.value.toLowerCase();
    return props.options.filter((o) => o.label.toLowerCase().includes(q));
});

function toggle() {
    if (props.disabled) return;
    isOpen.value ? close() : open();
}

function open() {
    isOpen.value = true;
    focusedIndex.value = props.options.findIndex((o) => o.value === props.modelValue);
    if (props.searchable) {
        nextTick(() => searchInputRef.value?.focus());
    }
}

function close() {
    isOpen.value = false;
    searchQuery.value = '';
    focusedIndex.value = -1;
}

function selectOption(option: SelectOption) {
    if (option.disabled) return;
    emit('update:modelValue', option.value);
    close();
}

function clear() {
    emit('update:modelValue', null);
    close();
}

function onTriggerKeydown(e: KeyboardEvent) {
    if (props.disabled) return;

    switch (e.key) {
        case 'Enter':
        case ' ':
            e.preventDefault();
            if (!isOpen.value) {
                open();
            } else if (focusedIndex.value >= 0 && focusedIndex.value < filteredOptions.value.length) {
                selectOption(filteredOptions.value[focusedIndex.value]!);
            }
            break;
        case 'ArrowDown':
            e.preventDefault();
            if (!isOpen.value) {
                open();
            } else {
                moveFocus(1);
            }
            break;
        case 'ArrowUp':
            e.preventDefault();
            if (isOpen.value) {
                moveFocus(-1);
            }
            break;
        case 'Escape':
            e.preventDefault();
            close();
            break;
    }
}

function moveFocus(delta: number) {
    const opts = filteredOptions.value;
    if (opts.length === 0) return;

    let next = focusedIndex.value + delta;
    while (next >= 0 && next < opts.length && opts[next]?.disabled) {
        next += delta;
    }
    if (next >= 0 && next < opts.length) {
        focusedIndex.value = next;
    }
}

useClickOutside(selectRef, isOpen, close);
</script>

<style lang="scss" scoped>
.rp-select {
    position: relative;
    display: inline-flex;
    font-family: var(--rp-font-family);
    font-weight: var(--rp-font-weight-normal);
    line-height: 1;

    &--block {
        display: flex;
        width: 100%;
    }

    &--disabled {
        opacity: 0.5;
        pointer-events: none;
    }

    // ── Sizes ──
    &--sm { --_select-height: var(--rp-size-sm); --_select-font: var(--rp-font-size-sm); --_select-px: var(--rp-spacing-3); --_select-radius: var(--rp-radius-md); }
    &--md { --_select-height: var(--rp-size-md); --_select-font: var(--rp-font-size-base); --_select-px: var(--rp-spacing-4); --_select-radius: var(--rp-radius-lg); }
    &--lg { --_select-height: var(--rp-size-lg); --_select-font: var(--rp-font-size-lg); --_select-px: var(--rp-spacing-6); --_select-radius: var(--rp-radius-lg); }

    // ── Trigger ──
    &__trigger {
        @include flex-center;
        justify-content: space-between;
        width: 100%;
        min-width: 180px;
        height: var(--_select-height);
        padding: 0 var(--_select-px);
        font-size: var(--_select-font);
        background-color: var(--rp-color-background);
        border: 1px solid var(--rp-color-border);
        border-radius: var(--_select-radius);
        cursor: pointer;
        transition:
            border-color var(--rp-transition-fast),
            box-shadow var(--rp-transition-fast);
        gap: var(--rp-spacing-2);

        &:hover {
            border-color: var(--rp-color-gray-400);
        }

        &:focus-visible {
            outline: none;
            @include focus-ring;
        }
    }

    &--open &__trigger {
        @include focus-ring;
    }

    // ── Value / Placeholder ──
    &__value {
        flex: 1;
        overflow: hidden;
        text-overflow: ellipsis;
        white-space: nowrap;
        color: var(--rp-color-text);
    }

    &__placeholder {
        color: var(--rp-color-text-secondary);
    }

    // ── Search input ──
    &__search {
        flex: 1;
        border: none;
        outline: none;
        background: transparent;
        font: inherit;
        color: var(--rp-color-text);
        min-width: 0;

        &::placeholder {
            color: var(--rp-color-text-secondary);
        }
    }

    // ── Actions (clear + arrow) ──
    &__actions {
        display: inline-flex;
        align-items: center;
        gap: var(--rp-spacing-1);
        flex-shrink: 0;
    }

    &__clear {
        display: inline-flex;
        align-items: center;
        justify-content: center;
        width: 1em;
        height: 1em;
        color: var(--rp-color-gray-400);
        cursor: pointer;
        border-radius: var(--rp-radius-full);
        transition: color var(--rp-transition-fast);

        &:hover {
            color: var(--rp-color-gray-700);
        }

        svg {
            width: 100%;
            height: 100%;
        }
    }

    &__arrow {
        display: inline-flex;
        align-items: center;
        width: 1em;
        height: 1em;
        color: var(--rp-color-gray-400);
        transition: transform var(--rp-transition-fast);

        &--open {
            transform: rotate(180deg);
        }

        svg {
            width: 100%;
            height: 100%;
        }
    }

    // ── Dropdown ──
    &__dropdown {
        position: absolute;
        top: calc(100% + var(--rp-spacing-1));
        left: 0;
        right: 0;
        z-index: 100;
        background-color: var(--rp-color-background);
        border: 1px solid var(--rp-color-border);
        border-radius: var(--_select-radius);
        box-shadow: var(--rp-shadow-md);
        padding: var(--rp-spacing-1) 0;
        max-height: 240px;
        overflow-y: auto;
    }

    // ── Options ──
    &__option {
        display: flex;
        align-items: center;
        padding: var(--rp-spacing-2) var(--_select-px);
        font-size: var(--_select-font);
        cursor: pointer;
        transition:
            background-color var(--rp-transition-fast),
            color var(--rp-transition-fast);
        color: var(--rp-color-text);

        &--focused {
            background-color: var(--rp-color-gray-100);
        }

        &--selected {
            color: var(--rp-color-primary);
            font-weight: var(--rp-font-weight-medium);
        }

        &--disabled {
            color: var(--rp-color-text-disabled);
            cursor: not-allowed;
        }
    }

    &__empty {
        display: flex;
        align-items: center;
        justify-content: center;
        padding: var(--rp-spacing-4);
        color: var(--rp-color-text-secondary);
        font-size: var(--_select-font);
    }
}

// ── Dropdown transition ──
.rp-select-dropdown-enter-active,
.rp-select-dropdown-leave-active {
    transition:
        opacity var(--rp-transition-fast),
        transform var(--rp-transition-fast);
}

.rp-select-dropdown-enter-from,
.rp-select-dropdown-leave-to {
    opacity: 0;
    transform: translateY(-4px);
}
</style>
