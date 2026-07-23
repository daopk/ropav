import { createHoverDisclosureInteractionModel } from './hoverDisclosureInteractionModel';
import type { UseHoverDisclosureOptions, UseHoverDisclosureReturn } from './types';
import { useHoverDisclosureInteractions } from './useHoverDisclosureInteractions';
import { useHoverDisclosureOpenState } from './useHoverDisclosureOpenState';
import {
    createHoverDisclosureTargetState,
    useHoverDisclosureTargetBinding,
} from './useHoverDisclosureTargetBinding';

export function useHoverDisclosure(
    options: Readonly<UseHoverDisclosureOptions> = {},
): UseHoverDisclosureReturn {
    const interaction = createHoverDisclosureInteractionModel();
    const targets = createHoverDisclosureTargetState();
    const openState = useHoverDisclosureOpenState({
        interaction,
        onContentClosed: () => {
            targets.contentElement = null;
        },
        options,
    });
    const { bindingAdapter, contentProps, triggerProps } = useHoverDisclosureInteractions({
        commands: openState,
        interaction,
        options,
        state: openState.state,
        targets,
    });

    useHoverDisclosureTargetBinding({
        adapter: bindingAdapter,
        isOpen: openState.isOpen,
        options,
        targets,
    });

    return {
        isOpen: openState.isOpen,
        isDisabled: openState.isDisabled,
        state: openState.state,
        triggerProps,
        contentProps,
        open: openState.open,
        close: openState.close,
        toggle: openState.toggle,
    };
}
