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

interface TeleportContext {
    target: ComputedRef<TeleportTargetValue>;
}

const teleportTargetKey = Symbol('teleport-target') as InjectionKey<TeleportContext>;

function readTeleportTarget(target: TeleportTarget | null | undefined) {
    return isRef(target) ? target.value : target;
}

function hasTarget(target: TeleportTargetValue | null | undefined): target is TeleportTargetValue {
    return target != null && target !== '';
}

export function provideTeleportTarget(props: Readonly<TeleportProviderProps>) {
    const parentContext = inject(teleportTargetKey, undefined);
    const target = computed<TeleportTargetValue>(() => {
        const ownTarget = readTeleportTarget(props.teleportTo);
        if (hasTarget(ownTarget)) return ownTarget;
        return parentContext?.target.value ?? 'body';
    });

    provide(teleportTargetKey, { target });
    return target;
}

export function useTeleportTarget(target?: MaybeRefOrGetter<TeleportTarget | null | undefined>) {
    const providedContext = inject(teleportTargetKey, undefined);

    return computed<TeleportTargetValue>(() => {
        const ownTarget = readTeleportTarget(toValue(target));
        if (hasTarget(ownTarget)) return ownTarget;
        return providedContext?.target.value ?? 'body';
    });
}
