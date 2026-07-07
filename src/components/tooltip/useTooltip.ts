import {
    computed,
    isRef,
    onBeforeUnmount,
    onMounted,
    ref,
    useId,
    useSlots,
    watch,
    type CSSProperties,
} from 'vue';
import { useDelayedOpen } from '@/composables/useDelayedOpen';
import { bem } from '@/utils/bem';
import type { TooltipPlacement, TooltipProps, TooltipTriggerProps } from './types';

interface TooltipPosition {
    x: number;
    y: number;
}

function isHTMLElement(value: unknown): value is HTMLElement {
    return typeof HTMLElement !== 'undefined' && value instanceof HTMLElement;
}

function getTargetPosition(rect: DOMRect, placement: TooltipPlacement): TooltipPosition {
    switch (placement) {
        case 'right':
            return { x: rect.right, y: rect.top + rect.height / 2 };
        case 'bottom':
            return { x: rect.left + rect.width / 2, y: rect.bottom };
        case 'left':
            return { x: rect.left, y: rect.top + rect.height / 2 };
        case 'top':
        default:
            return { x: rect.left + rect.width / 2, y: rect.top };
    }
}

export function useTooltip(
    props: Readonly<TooltipProps>,
    emitOpenChange?: (open: boolean) => void,
) {
    const slots = useSlots();
    const generatedId = useId();
    const targetElement = ref<HTMLElement | null>(null);
    const targetPosition = ref<TooltipPosition | null>(null);

    let isMounted = false;
    let removeTargetListeners: (() => void) | undefined;
    let removePositionListeners: (() => void) | undefined;
    let describedTarget: HTMLElement | null = null;
    let previousTargetDescribedby: string | null = null;

    const tooltipId = computed(() => props.id ?? `${generatedId}-tooltip`);
    const placement = computed(() => props.placement ?? 'top');
    const isTargetMode = computed(() => props.target != null && props.target !== '');
    const hasContent = computed(() => Boolean(props.content || slots.content));
    const isDisabled = computed(() => Boolean(props.disabled || !hasContent.value));
    const shouldRenderContent = computed(() => !isDisabled.value);

    const { isOpen, open, closeImmediate } = useDelayedOpen({
        open: () => props.open,
        openDelay: () => props.openDelay ?? 300,
        disabled: () => isDisabled.value,
        onOpenChange: emitOpenChange,
    });

    const isVisible = computed(() => isOpen.value && !isDisabled.value);

    const rootClass = computed(() =>
        bem('rp-tooltip', {
            [`placement-${placement.value}`]: true,
            [`color-${props.color}`]: Boolean(props.color),
            arrow: props.arrow,
            target: isTargetMode.value,
            open: isVisible.value,
            disabled: props.disabled,
        }),
    );

    const triggerProps = computed<TooltipTriggerProps>(() => ({
        'aria-describedby': shouldRenderContent.value ? tooltipId.value : undefined,
    }));

    const contentStyle = computed<CSSProperties | undefined>(() => {
        if (!isTargetMode.value || !targetPosition.value) return undefined;

        return {
            '--_rp-tooltip-target-x': `${targetPosition.value.x}px`,
            '--_rp-tooltip-target-y': `${targetPosition.value.y}px`,
        };
    });

    function openTooltip() {
        open();
    }

    function closeTooltip() {
        closeImmediate();
    }

    function onKeydown(event: KeyboardEvent) {
        if (event.key === 'Escape') closeTooltip();
    }

    function readTarget() {
        return isRef(props.target) ? props.target.value : props.target;
    }

    function resolveTarget() {
        const target = readTarget();
        if (!target) return null;

        if (typeof target === 'string') {
            if (typeof document === 'undefined') return null;

            try {
                const element = document.querySelector(target);
                return isHTMLElement(element) ? element : null;
            } catch {
                return null;
            }
        }

        return isHTMLElement(target) ? target : null;
    }

    function restoreTargetDescription() {
        if (!describedTarget) return;

        if (previousTargetDescribedby) {
            describedTarget.setAttribute('aria-describedby', previousTargetDescribedby);
        } else {
            describedTarget.removeAttribute('aria-describedby');
        }

        describedTarget = null;
        previousTargetDescribedby = null;
    }

    function syncTargetDescription() {
        restoreTargetDescription();

        if (!isTargetMode.value || !shouldRenderContent.value || !targetElement.value) return;

        describedTarget = targetElement.value;
        previousTargetDescribedby = describedTarget.getAttribute('aria-describedby');

        const ids = (previousTargetDescribedby ?? '').split(/\s+/).filter(Boolean);
        if (!ids.includes(tooltipId.value)) ids.push(tooltipId.value);
        describedTarget.setAttribute('aria-describedby', ids.join(' '));
    }

    function updateTargetPosition() {
        if (!isTargetMode.value || !targetElement.value) {
            targetPosition.value = null;
            return;
        }

        targetPosition.value = getTargetPosition(
            targetElement.value.getBoundingClientRect(),
            placement.value,
        );
    }

    function onTargetOpen() {
        updateTargetPosition();
        openTooltip();
    }

    function bindTargetListeners(element: HTMLElement) {
        removeTargetListeners?.();

        element.addEventListener('mouseenter', onTargetOpen);
        element.addEventListener('mouseleave', closeTooltip);
        element.addEventListener('focusin', onTargetOpen);
        element.addEventListener('focusout', closeTooltip);
        element.addEventListener('keydown', onKeydown);

        removeTargetListeners = () => {
            element.removeEventListener('mouseenter', onTargetOpen);
            element.removeEventListener('mouseleave', closeTooltip);
            element.removeEventListener('focusin', onTargetOpen);
            element.removeEventListener('focusout', closeTooltip);
            element.removeEventListener('keydown', onKeydown);
            removeTargetListeners = undefined;
        };
    }

    function removeViewportListeners() {
        removePositionListeners?.();
        removePositionListeners = undefined;
    }

    function bindViewportListeners() {
        if (typeof window === 'undefined' || removePositionListeners) return;

        window.addEventListener('resize', updateTargetPosition);
        window.addEventListener('scroll', updateTargetPosition, true);

        removePositionListeners = () => {
            window.removeEventListener('resize', updateTargetPosition);
            window.removeEventListener('scroll', updateTargetPosition, true);
        };
    }

    function syncTarget() {
        if (!isTargetMode.value) {
            removeTargetListeners?.();
            removeViewportListeners();
            restoreTargetDescription();
            targetElement.value = null;
            targetPosition.value = null;
            return;
        }

        const nextTarget = resolveTarget();
        if (targetElement.value === nextTarget) {
            syncTargetDescription();
            updateTargetPosition();
            return;
        }

        removeTargetListeners?.();
        removeViewportListeners();
        restoreTargetDescription();
        targetElement.value = nextTarget;

        if (!nextTarget) {
            targetPosition.value = null;
            return;
        }

        bindTargetListeners(nextTarget);
        syncTargetDescription();
        updateTargetPosition();
    }

    watch(isDisabled, (disabled) => {
        if (disabled) closeTooltip();
    });

    watch(
        () => readTarget(),
        () => {
            if (isMounted) syncTarget();
        },
        { flush: 'post' },
    );

    watch([isTargetMode, shouldRenderContent, tooltipId], () => {
        if (isMounted) syncTargetDescription();
    });

    watch([placement, isVisible], () => {
        if (isMounted && isVisible.value) updateTargetPosition();
    });

    watch(isVisible, (visible) => {
        if (!isMounted || !isTargetMode.value) return;

        if (visible) {
            updateTargetPosition();
            bindViewportListeners();
        } else {
            removeViewportListeners();
        }
    });

    onMounted(() => {
        isMounted = true;
        syncTarget();
    });

    onBeforeUnmount(() => {
        isMounted = false;
        removeTargetListeners?.();
        removeViewportListeners();
        restoreTargetDescription();
    });

    return {
        tooltipId,
        isOpen,
        isVisible,
        isTargetMode,
        shouldRenderContent,
        rootClass,
        triggerProps,
        contentStyle,
        openTooltip,
        closeTooltip,
        onKeydown,
    };
}
