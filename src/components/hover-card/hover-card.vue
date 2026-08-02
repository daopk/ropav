<template>
    <span :ref="templateRefs.root" v-bind="rootAttrs">
        <slot
            v-if="!isTargetMode"
            :trigger-props="publicTriggerProps"
            :is-open="contentSlotProps.isOpen"
            :open="contentSlotProps.open"
            :close="contentSlotProps.close"
            :toggle="contentSlotProps.toggle"
        />

        <Teleport :to="teleportTo" :disabled="!teleport">
            <Transition name="rp-hover-card-content">
                <div
                    v-if="shouldRenderContent"
                    v-show="shouldShowContent"
                    :id="hoverCardId"
                    :ref="templateRefs.content"
                    v-bind="contentAttrs"
                    :dir="contentDirection"
                    :data-side="placementSide"
                >
                    <slot
                        name="content"
                        :is-open="contentSlotProps.isOpen"
                        :open="contentSlotProps.open"
                        :close="contentSlotProps.close"
                        :toggle="contentSlotProps.toggle"
                    >
                        <slot
                            v-if="isTargetMode"
                            :trigger-props="publicTriggerProps"
                            :is-open="contentSlotProps.isOpen"
                            :open="contentSlotProps.open"
                            :close="contentSlotProps.close"
                            :toggle="contentSlotProps.toggle"
                        />
                    </slot>
                    <span
                        v-if="arrow"
                        :ref="templateRefs.arrow"
                        class="rp-hover-card__arrow"
                        :data-side="placementSide"
                        :style="arrowStyle"
                        aria-hidden="true"
                    />
                </div>
            </Transition>
        </Teleport>
    </span>
</template>

<script lang="ts" setup vapor>
import { computed } from 'vue';
import { useStylesApi } from '@/styles-api';
import { toPresenceAttribute } from '@/utils/attributes';
import type {
    HoverCardContentSlotProps,
    HoverCardOpenChangeDetails,
    HoverCardPart,
    HoverCardProps,
    HoverCardSlotProps,
    HoverCardTriggerProps,
} from './types';
import { useHoverCard } from './useHoverCard';

defineOptions({ name: 'RpHoverCard', inheritAttrs: false });

const props = withDefaults(defineProps<HoverCardProps>(), {
    placement: 'bottom-start',
    strategy: 'absolute',
    flip: true,
    shift: true,
    collisionPadding: 8,
    arrow: false,
    teleport: true,
    open: undefined,
    defaultOpen: false,
    openDelay: 700,
    closeDelay: 300,
    disabled: false,
    openOnFocus: true,
    closeOnEscape: true,
    touchBehavior: 'none',
    keepMounted: false,
});

const emit = defineEmits<{
    'update:open': [value: boolean];
    openChange: [value: boolean, details: HoverCardOpenChangeDetails];
}>();

defineSlots<{
    default?(props: HoverCardSlotProps): unknown;
    content?(props: HoverCardContentSlotProps): unknown;
}>();

const {
    rootRef,
    contentRef,
    arrowRef,
    hoverCardId,
    isDisabled,
    isTargetMode,
    state,
    shouldRenderContent,
    shouldShowContent,
    rootClass,
    contentStyle,
    contentDirection,
    contentSlotProps,
    actualPlacement,
    placementSide,
    arrowStyle,
    teleportTo,
} = useHoverCard(props, (open, details) => {
    emit('update:open', open);
    emit('openChange', open, details);
});
const templateRefs = { root: rootRef, content: contentRef, arrow: arrowRef };

const { getPartAttrs, getRootAttrs } = useStylesApi<HoverCardPart>(props, 'root');
const rootAttrs = computed(() =>
    getRootAttrs({
        class: rootClass.value,
        'data-state': state.value,
        'data-disabled': toPresenceAttribute(isDisabled.value),
    }),
);
const publicTriggerProps = computed<HoverCardTriggerProps>(() => {
    const partAttrs = getPartAttrs('trigger');
    return {
        ...(props.classNames?.trigger !== undefined ? { class: partAttrs.class } : {}),
        ...(props.styles?.trigger !== undefined ? { style: partAttrs.style } : {}),
        'data-state': state.value,
        'data-disabled': toPresenceAttribute(isDisabled.value),
    };
});
const contentAttrs = computed(() => ({
    ...getPartAttrs('content', {
        class: 'rp-hover-card__content',
        style: contentStyle.value,
    }),
    'data-state': state.value,
    'data-placement': actualPlacement.value,
}));
</script>

<style src="./hover-card.scss" lang="scss" scoped></style>
