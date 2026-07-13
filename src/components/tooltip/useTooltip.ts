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
import { getComponentVariantColorRoles } from '@/utils/componentColors';
import { bem } from '@/utils/bem';
import { createRafScheduler } from '@/utils/rafScheduler';
import type { TooltipOffset, TooltipPlacement, TooltipProps, TooltipTriggerProps } from './types';

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

export function resolveTooltipOffsetStyle(
    offset: TooltipOffset | undefined,
): CSSProperties | undefined {
    if (offset == null) return undefined;

    if (typeof offset === 'number') {
        return {
            '--_rp-tooltip-main-axis-offset': `${offset}px`,
        };
    }

    const style: CSSProperties = {};

    if (offset.mainAxis != null) {
        style['--_rp-tooltip-main-axis-offset'] = `${offset.mainAxis}px`;
    }

    if (offset.crossAxis != null) {
        style['--_rp-tooltip-cross-axis-offset'] = `${offset.crossAxis}px`;
    }

    return Object.keys(style).length > 0 ? style : undefined;
}

export function resolveTooltipColorStyleWithContrast(
    color: TooltipProps['color'],
    autoContrast: TooltipProps['autoContrast'],
): CSSProperties | undefined {
    if (!color) return undefined;

    const roles = getComponentVariantColorRoles({
        color,
        variant: 'solid',
        autoContrast,
    });
    if (!roles) return undefined;

    return {
        '--_rp-tooltip-bg': roles.background,
        '--_rp-tooltip-fg': roles.color,
    } as CSSProperties;
}

export function useTooltip(
    props: Readonly<TooltipProps>,
    emitOpenChange?: (open: boolean) => void,
) {
    const slots = useSlots();
    const generatedId = useId();
    const targetElement = ref<HTMLElement | null>(null);
    const targetPosition = ref<TooltipPosition | null>(null);
    const positionScheduler = createRafScheduler(
        updateTargetPosition,
        () => targetElement.value?.ownerDocument.defaultView,
    );

    let isMounted = false;
    let removeTargetListeners: (() => void) | undefined;
    let removePositionListeners: (() => void) | undefined;
    let describedTarget: HTMLElement | null = null;
    let previousTargetDescribedby: string | null = null;

    const tooltipId = computed(() => props.id ?? `${generatedId}-tooltip`);
    const placement = computed(() => props.placement ?? 'top');
    const isTargetMode = computed(() => props.target != null && props.target !== '');
    const hasContent = computed(() => Boolean(props.content || slots.content));
    const isDecorative = computed(() => Boolean(props.decorative));
    const isDisabled = computed(() => Boolean(props.disabled || !hasContent.value));
    const shouldRenderContent = computed(() => !isDisabled.value);
    const shouldDescribeContent = computed(() => shouldRenderContent.value && !isDecorative.value);

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
            arrow: props.arrow,
            target: isTargetMode.value,
            open: isVisible.value,
            disabled: props.disabled,
        }),
    );

    const triggerProps = computed<TooltipTriggerProps>(() => ({
        'aria-describedby': shouldDescribeContent.value ? tooltipId.value : undefined,
    }));

    const contentRole = computed(() => (isDecorative.value ? undefined : 'tooltip'));
    const contentAriaHidden = computed(() => (isDecorative.value ? 'true' : undefined));

    const contentStyle = computed<CSSProperties | undefined>(() => {
        const style: CSSProperties = {
            ...resolveTooltipOffsetStyle(props.offset),
            ...resolveTooltipColorStyleWithContrast(props.color, props.autoContrast),
        };

        if (!isTargetMode.value || !targetPosition.value) {
            return Object.keys(style).length > 0 ? style : undefined;
        }

        return {
            ...style,
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

        if (!isTargetMode.value || !shouldDescribeContent.value || !targetElement.value) return;

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
        positionScheduler.cancel();
    }

    function bindViewportListeners() {
        const view = targetElement.value?.ownerDocument.defaultView;
        if (!view || removePositionListeners) return;

        view.addEventListener('resize', positionScheduler.schedule);
        view.addEventListener('scroll', positionScheduler.schedule, true);

        removePositionListeners = () => {
            view.removeEventListener('resize', positionScheduler.schedule);
            view.removeEventListener('scroll', positionScheduler.schedule, true);
        };
    }

    function syncTarget() {
        positionScheduler.cancel();
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
            if (isVisible.value) bindViewportListeners();
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
        if (isVisible.value) bindViewportListeners();
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

    watch([isTargetMode, shouldDescribeContent, tooltipId], () => {
        if (isMounted) syncTargetDescription();
    });

    watch(placement, () => {
        if (isMounted && isVisible.value) updateTargetPosition();
    });

    watch(isVisible, (visible) => {
        if (!isMounted || !isTargetMode.value) return;

        if (visible) {
            positionScheduler.cancel();
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
        contentRole,
        contentAriaHidden,
        contentStyle,
        openTooltip,
        closeTooltip,
        onKeydown,
    };
}
