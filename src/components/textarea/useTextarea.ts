import { computed, nextTick, onMounted, ref, watch } from 'vue';
import { useControlState } from '@/composables/useControlState';
import { bem } from '@/utils/bem';
import type { TextareaProps } from './types';

const MIN_ROWS = 1;
const NATIVE_TEXTAREA_SELECTOR = '.rp-textarea__native';
const INTERACTIVE_SELECTOR = [
    'button',
    'a[href]',
    'input',
    'select',
    `textarea:not(${NATIVE_TEXTAREA_SELECTOR})`,
    '[contenteditable="true"]',
    '[tabindex]:not([tabindex="-1"])',
].join(',');

interface AutosizeRows {
    minRows: number;
    maxRows: number | undefined;
}

interface TextareaMetrics {
    lineHeight: number;
    paddingHeight: number;
    borderHeight: number;
}

function isInteractiveElement(target: Element) {
    return Boolean(target.closest(INTERACTIVE_SELECTOR));
}

function normalizeRows(value: number | undefined, fallback?: number) {
    if (value === undefined || !Number.isFinite(value)) return fallback;
    return Math.max(MIN_ROWS, Math.floor(value));
}

function getPixelValue(value: string) {
    const parsed = Number.parseFloat(value);
    return Number.isFinite(parsed) ? parsed : 0;
}

function getLineHeight(styles: CSSStyleDeclaration) {
    const lineHeight = getPixelValue(styles.lineHeight);
    if (lineHeight > 0) return lineHeight;

    const fontSize = getPixelValue(styles.fontSize);
    return fontSize > 0 ? fontSize * 1.2 : 0;
}

function getTextareaMetrics(textarea: HTMLTextAreaElement): TextareaMetrics {
    const styles = getComputedStyle(textarea);

    return {
        lineHeight: getLineHeight(styles),
        paddingHeight: getPixelValue(styles.paddingTop) + getPixelValue(styles.paddingBottom),
        borderHeight:
            getPixelValue(styles.borderTopWidth) + getPixelValue(styles.borderBottomWidth),
    };
}

function getRowsHeight(metrics: TextareaMetrics, rows: number) {
    return rows * metrics.lineHeight + metrics.paddingHeight + metrics.borderHeight;
}

function getAutosizeMeasurement(textarea: HTMLTextAreaElement, rows: AutosizeRows) {
    const metrics = getTextareaMetrics(textarea);
    const maxHeight = rows.maxRows === undefined ? undefined : getRowsHeight(metrics, rows.maxRows);

    return {
        contentHeight: textarea.scrollHeight + metrics.borderHeight,
        minHeight: getRowsHeight(metrics, rows.minRows),
        maxHeight,
    };
}

function resetTextareaHeight(textarea: HTMLTextAreaElement) {
    textarea.style.height = '';
    textarea.style.overflowY = '';
}

export function useTextarea(props: Readonly<TextareaProps>, emitUpdate: (value: string) => void) {
    const textareaRef = ref<HTMLTextAreaElement | null>(null);
    const control = useControlState(props);

    const autosizeRows = computed<AutosizeRows>(() => {
        const minRows =
            normalizeRows(props.minRows, normalizeRows(props.rows, MIN_ROWS)) ?? MIN_ROWS;
        const maxRows = normalizeRows(props.maxRows);

        return {
            minRows,
            maxRows: maxRows === undefined ? undefined : Math.max(minRows, maxRows),
        };
    });

    const nativeRows = computed(() => (props.autosize ? autosizeRows.value.minRows : props.rows));

    const rootClass = computed(() =>
        bem('rp-textarea', {
            [`size-${props.size}`]: Boolean(props.size),
            [`radius-${props.radius}`]: Boolean(props.radius),
            [`resize-${props.resize}`]: props.resize !== undefined && props.resize !== 'none',
            autosize: props.autosize,
            disabled: control.disabled,
            invalid: control.invalid,
            valid: control.valid && !control.invalid,
            readonly: props.readonly,
        }),
    );

    const autosizeWatchSource = computed(() => [
        props.modelValue,
        props.autosize,
        props.minRows,
        props.maxRows,
        props.rows,
        props.size,
    ]);

    function syncTextareaHeight() {
        const textarea = textareaRef.value;
        if (!textarea) return;

        if (!props.autosize) {
            resetTextareaHeight(textarea);
            return;
        }

        textarea.style.height = 'auto';

        const { contentHeight, minHeight, maxHeight } = getAutosizeMeasurement(
            textarea,
            autosizeRows.value,
        );
        const heightLimit = maxHeight ?? Number.POSITIVE_INFINITY;
        const nextHeight = Math.min(Math.max(contentHeight, minHeight), heightLimit);

        textarea.style.height = `${nextHeight}px`;
        textarea.style.overflowY =
            maxHeight !== undefined && contentHeight > maxHeight ? 'auto' : 'hidden';
    }

    function scheduleTextareaHeightSync() {
        void nextTick(syncTextareaHeight);
    }

    function onInput(e: Event) {
        emitUpdate((e.target as HTMLTextAreaElement).value);
        syncTextareaHeight();
    }

    function focusTextarea(e: MouseEvent) {
        if (control.disabled) return;

        const target = e.target;
        if (target instanceof Element && isInteractiveElement(target)) return;

        textareaRef.value?.focus();
    }

    onMounted(scheduleTextareaHeightSync);

    watch(autosizeWatchSource, scheduleTextareaHeightSync);

    return {
        textareaRef,
        control,
        rootClass,
        nativeRows,
        onInput,
        focusTextarea,
    };
}
