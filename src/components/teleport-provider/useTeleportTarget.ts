import {
    computed,
    inject,
    isRef,
    provide,
    toValue,
    type ComputedRef,
    type InjectionKey,
    type MaybeRefOrGetter,
} from 'vue';
import type { TeleportTarget, TeleportTargetValue } from '../floating/types';
import type { TeleportProviderProps } from './types';

const teleportTargetKey = Symbol('teleport-target') as InjectionKey<
    ComputedRef<TeleportTargetValue>
>;

function readTeleportTarget(target: TeleportTarget | null | undefined) {
    return isRef(target) ? target.value : target;
}

function hasTarget(target: TeleportTargetValue | null | undefined): target is TeleportTargetValue {
    return target != null && target !== '';
}

export function provideTeleportTarget(props: Readonly<TeleportProviderProps>) {
    const parentTarget = inject(teleportTargetKey, undefined);
    const target = computed<TeleportTargetValue>(() => {
        const ownTarget = readTeleportTarget(props.teleportTo);
        if (hasTarget(ownTarget)) return ownTarget;
        return parentTarget?.value ?? 'body';
    });

    provide(teleportTargetKey, target);
    return target;
}

export function useTeleportTarget(target?: MaybeRefOrGetter<TeleportTarget | null | undefined>) {
    const providedTarget = inject(teleportTargetKey, undefined);

    return computed<TeleportTargetValue>(() => {
        const ownTarget = readTeleportTarget(toValue(target));
        if (hasTarget(ownTarget)) return ownTarget;
        return providedTarget?.value ?? 'body';
    });
}
