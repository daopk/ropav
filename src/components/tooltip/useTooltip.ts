import { computed, ref, useId, useSlots, watch, type CSSProperties } from 'vue';
import { useDelayedOpen } from '@/composables/useDelayedOpen';
import { bem } from '@/utils/bem';
import { getComponentVariantColorRoles } from '@/utils/componentColors';
import {
    isElementReference,
    useFloatingPosition,
    useFloatingTarget,
} from '../floating/useFloatingPosition';
import { useTeleportTarget } from '../teleport-provider/useTeleportTarget';
import type { TooltipOffset, TooltipPlacement, TooltipProps, TooltipTriggerProps } from './types';

type TooltipBehaviorProps = Omit<TooltipProps, 'classNames' | 'styles'>;

export function resolveTooltipOffsetStyle(
    offset: TooltipOffset | undefined,
): CSSProperties | undefined {
    if (offset == null) return undefined;

    if (typeof offset === 'number') {
        return { '--_rp-tooltip-main-axis-offset': `${offset}px` };
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
    const { isExplicitTarget, reference, resolvedTarget } = useFloatingTarget(
        () => props.target,
        rootRef,
    );
    const targetElement = computed(() =>
        isElementReference(resolvedTarget.value) ? resolvedTarget.value : null,
    );

    const { isOpen, open, closeImmediate } = useDelayedOpen({
        open: () => props.open,
        openDelay: () => props.openDelay ?? 300,
        disabled: () => isDisabled.value,
        onOpenChange: emitOpenChange,
    });
    const isVisible = computed(() => isOpen.value && !isDisabled.value);

    const floating = useFloatingPosition<TooltipPlacement>({
        reference,
        floating: contentRef,
        arrow: arrowRef,
        open: isVisible,
        placement: () => placement.value,
        strategy: () => props.strategy ?? 'absolute',
        offset: () => props.offset,
        flip: () => props.flip !== false,
        shift: () => props.shift !== false,
        collisionPadding: () => props.collisionPadding ?? 8,
        arrowEnabled: () => Boolean(props.arrow),
        restartKey: () => teleportTo.value,
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
        ...resolveTooltipOffsetStyle(props.offset),
        ...resolveTooltipColorStyleWithContrast(props.color, props.autoContrast),
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

    watch(
        [isExplicitTarget, targetElement],
        ([explicit, target], _previous, onCleanup) => {
            if (!explicit || !target) return;

            target.addEventListener('mouseenter', openTooltip);
            target.addEventListener('mouseleave', closeTooltip);
            target.addEventListener('focusin', openTooltip);
            target.addEventListener('focusout', closeTooltip);
            target.addEventListener('keydown', onKeydown as EventListener);

            onCleanup(() => {
                target.removeEventListener('mouseenter', openTooltip);
                target.removeEventListener('mouseleave', closeTooltip);
                target.removeEventListener('focusin', openTooltip);
                target.removeEventListener('focusout', closeTooltip);
                target.removeEventListener('keydown', onKeydown as EventListener);
            });
        },
        { flush: 'sync' },
    );

    watch(
        [isExplicitTarget, targetElement, shouldDescribeContent, tooltipId],
        ([explicit, target, shouldDescribe, id], _previous, onCleanup) => {
            if (!explicit || !target || !shouldDescribe) return;

            const previous = target.getAttribute('aria-describedby');
            const ids = (previous ?? '').split(/\s+/).filter(Boolean);
            if (!ids.includes(id)) ids.push(id);
            target.setAttribute('aria-describedby', ids.join(' '));

            onCleanup(() => {
                if (previous == null) target.removeAttribute('aria-describedby');
                else target.setAttribute('aria-describedby', previous);
            });
        },
        { flush: 'sync' },
    );

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
