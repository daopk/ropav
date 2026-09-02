<script setup lang="ts" vapor>
defineProps<{ class?: string }>();
</script>

<!--
  The tail of a tooltip or popover, drawn pointing away from the overlay's edge.

  Two cubics meeting at the apex, horizontal at the mouth ends and at the apex. One cubic cannot
  be tangent to horizontal at both of its ends without collapsing to a straight line, and the
  mouth tangent is the part that matters: it is what lets the flanks flow out of the overlay's
  flat edge instead of creasing against it.

  The straight run above the mouth is a skirt, buried inside the overlay by the anchor offset in
  `overlay-arrow.vue`. Overlapping rather than touching is what closes the seam that opens at
  fractional device pixel ratios, and the overlap has to be added geometry: consuming the flare
  itself would put a slope back against the edge.
-->
<template>
  <svg
    :class="$props.class"
    fill="none"
    height="12"
    viewBox="0 0 12 12"
    width="12"
    xmlns="http://www.w3.org/2000/svg"
  >
    <path d="M1 0V2C3.2 2 4.3 8 6 8C7.7 8 8.8 2 11 2V0Z" />
  </svg>
</template>
