import { computed, ref, useId, useSlots, type CSSProperties } from 'vue';
import { bem } from '@/utils/bem';
import { getFloatingOffsetStyle } from '@/utils/floatingOffset';
import { useFloatingPosition } from '../floating/useFloatingPosition';
import { useFloatingTargetLifecycle } from '../floating/useFloatingTargetLifecycle';
import { useHoverDisclosure } from '../floating/useHoverDisclosure';
import { useOverlayZIndex } from '../overlay/useOverlayZIndex';
import { useTeleportTarget } from '../teleport-provider/useTeleportTarget';
import type {
    HoverCardContentSlotProps,
    HoverCardOpenChangeDetails,
    HoverCardPlacement,
    HoverCardProps,
} from './types';

const DEFAULT_PLACEMENT: HoverCardPlacement = 'bottom-start';
const HOVER_CARD_OFFSET_PROPERTIES = {
    mainAxis: '--_rp-hover-card-main-axis-offset',
    crossAxis: '--_rp-hover-card-cross-axis-offset',
} as const;

export function useHoverCard(
    props: Readonly<HoverCardProps>,
    onOpenChange?: (open: boolean, details: HoverCardOpenChangeDetails) => void,
) {
    const slots = useSlots();
    const generatedId = useId();
    const rootRef = ref<HTMLElement | null>(null);
    const contentRef = ref<HTMLElement | null>(null);
    const arrowRef = ref<HTMLElement | null>(null);
    const hoverCardId = computed(() => props.id ?? `${generatedId}-hover-card`);
    const placement = computed(() => props.placement ?? DEFAULT_PLACEMENT);
    const teleportTo = useTeleportTarget(() => props.teleportTo);
    const targetLifecycle = useFloatingTargetLifecycle({
        target: () => props.target,
        fallback: rootRef,
    });
    const { isExplicitTarget, reference } = targetLifecycle;
    const hasContent = computed(() =>
        Boolean(slots.content || (isExplicitTarget.value && slots.default)),
    );
    const disclosureDisabled = computed(() => Boolean(props.disabled || !hasContent.value));
    const disclosure = useHoverDisclosure({
        open: () => props.open,
        defaultOpen: props.defaultOpen,
        openDelay: () => props.openDelay,
        closeDelay: () => props.closeDelay,
        disabled: disclosureDisabled,
        openOnFocus: () => props.openOnFocus,
        closeOnEscape: () => props.closeOnEscape,
        touchBehavior: () => props.touchBehavior,
        interactionTarget: reference,
        contentTarget: contentRef,
        onOpenChange,
    });
    const isVisible = disclosure.isOpen;
    const shouldRenderContent = computed(
        () =>
            !disclosure.isDisabled.value && (Boolean(props.keepMounted) || disclosure.isOpen.value),
    );
    const shouldShowContent = computed(() => !props.keepMounted || disclosure.isOpen.value);
    const zIndex = useOverlayZIndex({
        baseZIndex: () => props.baseZIndex,
        defaultBaseZIndex: 100,
    });
    const floating = useFloatingPosition({
        reference,
        floating: contentRef,
        arrow: arrowRef,
        open: isVisible,
        placement,
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
        bem('rp-hover-card', {
            [`placement-${floating.actualPlacement.value}`]: true,
            target: isExplicitTarget.value,
            open: isVisible.value,
            disabled: disclosure.isDisabled.value,
            arrow: props.arrow,
        }),
    );
    const contentStyle = computed<CSSProperties>(() => ({
        ...floating.floatingStyle.value,
        ...getFloatingOffsetStyle(props.offset, HOVER_CARD_OFFSET_PROPERTIES),
        zIndex: zIndex.value,
    }));
    const contentSlotProps = computed<HoverCardContentSlotProps>(() => ({
        isOpen: isVisible.value,
        open: disclosure.open,
        close: disclosure.close,
        toggle: disclosure.toggle,
    }));

    return {
        rootRef,
        contentRef,
        arrowRef,
        hoverCardId,
        isDisabled: disclosure.isDisabled,
        isVisible,
        isTargetMode: isExplicitTarget,
        state: disclosure.state,
        shouldRenderContent,
        shouldShowContent,
        rootClass,
        contentStyle,
        contentSlotProps,
        actualPlacement: floating.actualPlacement,
        placementSide,
        arrowStyle: floating.arrowStyle,
        teleportTo,
    };
}
