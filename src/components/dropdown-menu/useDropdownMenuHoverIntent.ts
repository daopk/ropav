import { onUnmounted, ref, type Ref } from 'vue';
import {
    clampPointToRect,
    getClientPoint,
    hasMeasuredRect,
    isPointInRect,
    isPointInTriangle,
    type Point,
    type Triangle,
} from '@/utils/geometry';
import { arePathsEqual, isPathPrefix } from '@/utils/indexPath';
import type { ItemPath } from './dropdown-menu-model';
import type { DropdownMenuItem } from './types';

const SAFE_TRIANGLE_PADDING = 2;
const SAFE_TRIANGLE_ORIGIN_OFFSET = 2;
const SAFE_TRIANGLE_TIMEOUT = 400;

export type SafeTriangle = Triangle;
type GetSafeTriangleOptions = {
    itemRect: DOMRect | null;
    submenuRect: DOMRect;
    origin: Point;
};
type PendingHover = {
    item: DropdownMenuItem;
    path: ItemPath;
};
type HoverCommit = (item: DropdownMenuItem, path: ItemPath, point?: Point) => void;

type UseDropdownMenuHoverIntentOptions = {
    openSubmenuPath: Ref<ItemPath>;
    getItemElement: (path: ItemPath) => HTMLElement | null;
    getSubmenuElement: (path: ItemPath) => HTMLElement | null;
};

export function getDropdownMenuSafeTriangle({
    itemRect,
    submenuRect,
    origin,
}: GetSafeTriangleOptions): SafeTriangle {
    const measuredItemRect = itemRect && hasMeasuredRect(itemRect) ? itemRect : null;
    const opensRight = !measuredItemRect || submenuRect.left >= measuredItemRect.right;
    const edgeX = opensRight ? submenuRect.left : submenuRect.right;
    const boundedOrigin = measuredItemRect ? clampPointToRect(origin, measuredItemRect) : origin;
    const expandedOrigin = {
        x:
            boundedOrigin.x +
            (opensRight ? -SAFE_TRIANGLE_ORIGIN_OFFSET : SAFE_TRIANGLE_ORIGIN_OFFSET),
        y: boundedOrigin.y,
    };

    return [
        expandedOrigin,
        {
            x: edgeX,
            y: submenuRect.top - SAFE_TRIANGLE_PADDING,
        },
        {
            x: edgeX,
            y: submenuRect.bottom + SAFE_TRIANGLE_PADDING,
        },
    ];
}

export function useDropdownMenuHoverIntent({
    openSubmenuPath,
    getItemElement,
    getSubmenuElement,
}: UseDropdownMenuHoverIntentOptions) {
    const safeTriangleOrigin = ref<Point | null>(null);
    let latestPointerPoint: Point | null = null;
    let pendingHover: PendingHover | null = null;
    let pendingHoverTimer: number | undefined;

    function clearPendingHover() {
        pendingHover = null;
        if (pendingHoverTimer !== undefined) {
            window.clearTimeout(pendingHoverTimer);
            pendingHoverTimer = undefined;
        }
    }

    function resetHoverIntent() {
        safeTriangleOrigin.value = null;
        latestPointerPoint = null;
        clearPendingHover();
    }

    function getFallbackTriangleOrigin(path: ItemPath): Point | null {
        const itemRect = getItemElement(path)?.getBoundingClientRect();
        if (!itemRect) return null;

        const submenuRect = getSubmenuElement(path)?.getBoundingClientRect();
        const opensRight = !submenuRect || submenuRect.left >= itemRect.right;
        return {
            x: opensRight ? itemRect.right : itemRect.left,
            y: itemRect.top + itemRect.height / 2,
        };
    }

    function trackSubmenuOpen(path: ItemPath, point?: Point) {
        safeTriangleOrigin.value = point ?? getFallbackTriangleOrigin(path);
        clearPendingHover();
    }

    function isPointInCurrentSubmenu(point: Point) {
        if (openSubmenuPath.value.length === 0) return false;

        const submenuRect = getSubmenuElement(openSubmenuPath.value)?.getBoundingClientRect();
        return submenuRect ? isPointInRect(point, submenuRect, SAFE_TRIANGLE_PADDING) : false;
    }

    function getSafeTriangle(path: ItemPath): SafeTriangle | null {
        const submenuRect = getSubmenuElement(path)?.getBoundingClientRect();
        const itemRect = getItemElement(path)?.getBoundingClientRect();
        const origin = safeTriangleOrigin.value ?? getFallbackTriangleOrigin(path);

        if (!submenuRect || !origin) return null;

        return getDropdownMenuSafeTriangle({
            itemRect: itemRect ?? null,
            submenuRect,
            origin,
        });
    }

    function updateSafeTriangleOrigin(point: Point) {
        if (openSubmenuPath.value.length === 0) return;

        const itemRect = getItemElement(openSubmenuPath.value)?.getBoundingClientRect();
        if (itemRect && isPointInRect(point, itemRect)) {
            safeTriangleOrigin.value = point;
        }
    }

    function shouldDelayHover(path: ItemPath, point: Point) {
        if (openSubmenuPath.value.length === 0) return false;
        if (arePathsEqual(path, openSubmenuPath.value)) return false;
        if (isPathPrefix(openSubmenuPath.value, path)) return false;
        if (isPointInCurrentSubmenu(point)) return true;

        const triangle = getSafeTriangle(openSubmenuPath.value);
        return triangle ? isPointInTriangle(point, triangle) : false;
    }

    function delayHoveredItem(item: DropdownMenuItem, path: ItemPath, commit: HoverCommit) {
        pendingHover = {
            item,
            path,
        };

        if (pendingHoverTimer !== undefined) window.clearTimeout(pendingHoverTimer);
        pendingHoverTimer = window.setTimeout(() => {
            if (!pendingHover) return;

            const nextHover = pendingHover;
            if (latestPointerPoint && isPointInCurrentSubmenu(latestPointerPoint)) {
                clearPendingHover();
                return;
            }

            commit(nextHover.item, nextHover.path);
        }, SAFE_TRIANGLE_TIMEOUT);
    }

    function handleItemHover(
        item: DropdownMenuItem,
        path: ItemPath,
        event: MouseEvent | undefined,
        commit: HoverCommit,
    ) {
        const point = event ? getClientPoint(event) : undefined;
        latestPointerPoint = point ?? latestPointerPoint;

        if (point && shouldDelayHover(path, point)) {
            delayHoveredItem(item, path, commit);
            return;
        }

        commit(item, path, point);
    }

    function handleMenuMousemove(event: MouseEvent, commit: HoverCommit) {
        const point = getClientPoint(event);
        latestPointerPoint = point;
        updateSafeTriangleOrigin(point);
        if (!pendingHover) return;

        if (shouldDelayHover(pendingHover.path, point)) return;

        const nextHover = pendingHover;
        commit(nextHover.item, nextHover.path, point);
    }

    onUnmounted(clearPendingHover);

    return {
        clearPendingHover,
        resetHoverIntent,
        trackSubmenuOpen,
        handleItemHover,
        handleMenuMousemove,
    };
}
