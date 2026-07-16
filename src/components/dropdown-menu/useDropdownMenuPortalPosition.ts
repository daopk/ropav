import type { Ref } from 'vue';
import type { FloatingReference } from '../floating/types';
import { useFloatingPosition } from '../floating/useFloatingPosition';
import type { DropdownMenuPlacement, DropdownMenuProps } from './types';

type BooleanSource = Readonly<Ref<boolean>>;
type PlacementSource = Readonly<Ref<DropdownMenuPlacement>>;

export function useDropdownMenuPortalPosition(options: {
    props: Readonly<DropdownMenuProps>;
    reference: Readonly<Ref<FloatingReference | null>>;
    menuRef: Ref<HTMLElement | null>;
    arrowRef: Ref<HTMLElement | null>;
    isVisible: BooleanSource;
    placement: PlacementSource;
    restartKey: () => unknown;
}) {
    const floating = useFloatingPosition({
        reference: options.reference,
        floating: options.menuRef,
        arrow: options.arrowRef,
        open: options.isVisible,
        placement: () => options.placement.value,
        strategy: () => options.props.strategy ?? 'absolute',
        offset: () => options.props.offset,
        flip: () => options.props.flip !== false,
        shift: () => options.props.shift !== false,
        collisionPadding: () => options.props.collisionPadding ?? 8,
        restartKey: options.restartKey,
    });

    return {
        actualPlacement: floating.actualPlacement,
        arrowStyle: floating.arrowStyle,
        contentStyle: floating.floatingStyle,
    };
}
