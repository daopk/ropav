import { computed, ref, useId, useSlots, watch, type CSSProperties } from 'vue';
import { useDelayedOpen } from '@/internal/composables/useDelayedOpen';
import { bem } from '@/utils/bem';
import { getComponentVariantColorRoles } from '@/utils/componentColors';
import { getFloatingOffsetStyle } from '@/utils/floatingOffset';
import { useFloatingPosition } from '../floating/useFloatingPosition';
import { useFloatingTargetLifecycle } from '../floating/useFloatingTargetLifecycle';
import { useTeleportTarget } from '../teleport-provider/useTeleportTarget';
import { useOverlayZIndex } from '../overlay/useOverlayZIndex';
import type { TooltipProps, TooltipTriggerProps } from './types';
import { useTooltipTargetBindings } from './useTooltipTargetBindings';

type TooltipBehaviorProps = Omit<TooltipProps, 'classNames' | 'styles'>;

const TOOLTIP_OFFSET_PROPERTIES = {
    mainAxis: '--_rp-tooltip-main-axis-offset',
    crossAxis: '--_rp-tooltip-cross-axis-offset',
} as const;

export function resolveTooltipColorStyleWithContrast(
    color: TooltipProps['color'],
    autoContrast: TooltipProps['autoContrast'],
    contrastColor?: TooltipProps['contrastColor'],
): CSSProperties | undefined {
    if (!color) return undefined;

    const roles = getComponentVariantColorRoles({
        color,
        variant: 'solid',
        autoContrast,
        contrastColor,
    });
    if (!roles) return undefined;

    return {
        '--_rp-tooltip-bg': roles.background,
        '--_rp-tooltip-fg': roles.color,
    } as CSSProperties;
}

export function useTooltip(
    props: Readonly<TooltipBehaviorProps>,
    emitOpenChange?: (open: boolean) => void,
) {
    const slots = useSlots();
    const generatedId = useId();
    const rootRef = ref<HTMLElement | null>(null);
    const contentRef = ref<HTMLElement | null>(null);
    const arrowRef = ref<HTMLElement | null>(null);
    const tooltipId = computed(() => props.id ?? `${generatedId}-tooltip`);
    const placement = computed(() => props.placement ?? 'top');
    const isDecorative = computed(() => Boolean(props.decorative));
    const hasContent = computed(() => Boolean(props.content || slots.content));
    const isDisabled = computed(() => Boolean(props.disabled || !hasContent.value));
    const shouldRenderContent = computed(() => !isDisabled.value);
    const shouldDescribeContent = computed(() => shouldRenderContent.value && !isDecorative.value);
    const teleportTo = useTeleportTarget(() => props.teleportTo);
    const targetLifecycle = useFloatingTargetLifecycle({
        target: () => props.target,
        fallback: rootRef,
    });
    const { isExplicitTarget, reference } = targetLifecycle;
    const zIndex = useOverlayZIndex({
        baseZIndex: () => props.baseZIndex,
        defaultBaseZIndex: 1000,
    });

    const { isOpen, open, closeImmediate } = useDelayedOpen({
        open: () => props.open,
        openDelay: () => props.openDelay ?? 300,
        disabled: () => isDisabled.value,
        onOpenChange: emitOpenChange,
    });
    const isVisible = computed(() => isOpen.value && !isDisabled.value);

    const floating = useFloatingPosition({
        reference,
        floating: contentRef,
        arrow: arrowRef,
        open: isVisible,
        placement: () => placement.value,
        strategy: () => props.strategy ?? 'absolute',
        offset: () => props.offset,
        flip: () => props.flip !== false,
        flipOptions: () => props.flipOptions,
        shift: () => props.shift !== false,
        collisionPadding: () => props.collisionPadding ?? 8,
        autoUpdateOptions: () => props.autoUpdateOptions,
    });
    const placementSide = computed(() => floating.actualPlacement.value.split('-')[0]);

    const rootClass = computed(() =>
        bem('rp-tooltip', {
            [`placement-${floating.actualPlacement.value}`]: true,
            arrow: props.arrow,
            target: isExplicitTarget.value,
            open: isVisible.value,
            disabled: props.disabled,
        }),
    );
    const triggerProps = computed<TooltipTriggerProps>(() => ({
        'aria-describedby': shouldDescribeContent.value ? tooltipId.value : undefined,
    }));
    const contentRole = computed(() => (isDecorative.value ? undefined : 'tooltip'));
    const contentAriaHidden = computed(() => (isDecorative.value ? 'true' : undefined));
    const contentStyle = computed<CSSProperties>(() => ({
        ...floating.floatingStyle.value,
        ...getFloatingOffsetStyle(props.offset, TOOLTIP_OFFSET_PROPERTIES),
        ...resolveTooltipColorStyleWithContrast(
            props.color,
            props.autoContrast,
            props.contrastColor,
        ),
        zIndex: zIndex.value,
    }));

    function openTooltip() {
        open();
    }

    function closeTooltip() {
        closeImmediate();
    }

    function onKeydown(event: KeyboardEvent) {
        if (event.key === 'Escape') closeTooltip();
    }

    watch(isDisabled, (disabled) => {
        if (disabled) closeTooltip();
    });

    useTooltipTargetBindings({
        targetLifecycle,
        shouldDescribeContent,
        tooltipId,
        openTooltip,
        closeTooltip,
        onKeydown,
    });

    return {
        rootRef,
        contentRef,
        arrowRef,
        tooltipId,
        isOpen,
        isDisabled,
        isVisible,
        isTargetMode: isExplicitTarget,
        shouldRenderContent,
        rootClass,
        triggerProps,
        contentRole,
        contentAriaHidden,
        contentStyle,
        actualPlacement: floating.actualPlacement,
        placementSide,
        arrowStyle: floating.arrowStyle,
        teleportTo,
        openTooltip,
        closeTooltip,
        onKeydown,
    };
}
