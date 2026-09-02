<script setup lang="ts" vapor>
import type { OverlayArrowProps } from "./overlay.types";

import { computed, shallowRef, watch } from "vue";

import { useOverlayArrowContext } from "./overlay.context";

const props = defineProps<OverlayArrowProps>();

defineSlots<{ default?: () => unknown }>();

const arrow = useOverlayArrowContext();

const element = shallowRef<HTMLElement | null>(null);

const setElement = (next: unknown) => {
  element.value = (next as HTMLElement | null) ?? null;
  arrow?.registerElement(element.value);
};

const placement = computed(() => arrow?.placement.value ?? null);

/** The straight run the shape carries above its mouth, buried inside the overlay. */
const SKIRT = 2;

/** Half the mouth's width: the shape's mouth spans the middle 10 of its 12 unit box. */
const HALF_MOUTH = 5;

/**
 * How much deeper than the skirt the arrow sits, where the overlay's edge is curved.
 *
 * The mouth is straight, and it normally lies exactly on the overlay's edge, whose flat run its
 * ends meet tangentially. Near a corner the edge has curved away from that line — entirely, when
 * a large radius has clamped a short overlay toward a pill — and the mouth's ends would hang past
 * the curve as two bare horns. The recession under each end follows from the radius the overlay
 * actually renders, and the whole arrow is pulled in that far, plus a little for antialiasing.
 */
const burial = shallowRef(0);

const measureBurial = (): number => {
  const own = element.value;
  const side = placement.value;
  const isHorizontal = side === "top" || side === "bottom";

  // The centre comes from the positioner's own offset rather than from layout, which passes
  // through states where the offset is not applied yet — a measurement taken in one of them
  // sticks, because nothing after it changes a dependency.
  const centre = Number.parseFloat(arrow?.style.value[isHorizontal ? "left" : "top"] ?? "");
  const overlay = own?.offsetParent;

  if (!own || !side || !Number.isFinite(centre) || !(overlay instanceof HTMLElement)) return 0;

  const width = overlay.offsetWidth;
  const height = overlay.offsetHeight;
  const edge = isHorizontal ? width : height;

  // The used radius: the declared one, clamped the way the renderer clamps it when neighbouring
  // corners would overlap. The declaration is uniform, so reading one corner reads them all; a
  // percentage is taken as the pill it becomes under the same clamp.
  const declared = getComputedStyle(overlay).borderTopLeftRadius;
  const radius = Math.min(
    declared.includes("%") ? Math.min(width, height) : Number.parseFloat(declared) || 0,
    width / 2,
    height / 2,
  );

  if (radius <= 0) return 0;

  const recessionAt = (position: number) => {
    const intoCorner = Math.max(radius - position, position - (edge - radius), 0);

    if (intoCorner <= 0) return 0;

    const reach = Math.min(intoCorner, radius);

    return radius - Math.sqrt(radius * radius - reach * reach);
  };

  const deepest = Math.max(recessionAt(centre - HALF_MOUTH), recessionAt(centre + HALF_MOUTH));

  return deepest > 0 ? Math.min(deepest + 0.5, 4) : 0;
};

watch(
  [element, placement, () => arrow?.style.value],
  () => {
    burial.value = measureBurial();
  },
  { flush: "post", immediate: true },
);

/**
 * Pinned to the edge the overlay is placed against, and centred on the offset the positioner
 * worked out.
 *
 * Pulled back into the overlay by the skirt, so the shape overlaps the body it grows out of
 * rather than touching it: shapes that merely touch each antialias the shared row at fractional
 * device pixel ratios, and the page bleeds through the seam.
 *
 * The offset names the arrow's centre, so it is pulled back by half its own size on the cross
 * axis — done with a transform rather than arithmetic because only the stylesheet knows how big
 * the arrow is.
 */
const style = computed<Record<string, string>>(() => {
  const side = placement.value;
  const isVertical = side === "top" || side === "bottom";

  return {
    position: "absolute",
    transform: isVertical ? "translateX(-50%)" : "translateY(-50%)",
    ...(side ? { [side]: `calc(100% - ${SKIRT + burial.value}px)` } : {}),
    ...(arrow?.style.value ?? {}),
  };
});
</script>

<!--
  The zero-sized svg carries the hairline filter the stylesheet points `--overlay-edge` at.

  The arrow and the body are two shapes filled with the same colour, and any edge painted on
  either of them alone draws itself across the join. A filter on the overlay sees the two as one
  image, so the edge it draws follows their combined silhouette: the hairline is the region just
  inside that silhouette — the outside, blurred, kept where it bled inward — laid over the source.

  It lives with the arrow because it is only referenced when an arrow exists, and it keeps a fixed
  id on purpose: a stylesheet cannot name a generated one. Several open overlays each carry a
  copy, and whichever the reference resolves to draws the same thing — the flood colour is a theme
  token, and every overlay is rendered under `body`, in the same theme scope.

  Composited in sRGB rather than the filter default, matching how the arrowless overlays' inset
  `box-shadow` composites — the same token value has to produce the same grey either way.
-->
<template>
  <div
    :ref="setElement"
    :class="props.class"
    :data-placement="placement ?? undefined"
    :style="style"
  >
    <slot />
    <svg aria-hidden="true" focusable="false" height="0" style="position: absolute" width="0">
      <filter
        id="ropav-overlay-edge"
        color-interpolation-filters="sRGB"
        height="200%"
        width="200%"
        x="-50%"
        y="-50%"
      >
        <feFlood result="line" style="flood-color: var(--overlay-edge-line, transparent)" />
        <feComposite in="line" in2="SourceAlpha" operator="out" result="outside" />
        <feGaussianBlur in="outside" result="soft" stdDeviation="0.5" />
        <feComposite in="soft" in2="SourceAlpha" operator="in" result="glow" />
        <feMerge>
          <feMergeNode in="SourceGraphic" />
          <feMergeNode in="glow" />
        </feMerge>
      </filter>
    </svg>
  </div>
</template>
