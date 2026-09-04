<script setup lang="ts" vapor>
import type { ScrollShadowProps } from "@/components/scroll-shadow";

import { ScrollShadow } from "@/components/scroll-shadow";

// Preserve absence through this forwarding fixture. Otherwise Vue casts an omitted Boolean to
// false here, before ScrollShadow gets a chance to apply its own defaults.
const props = withDefaults(defineProps<ScrollShadowProps & { contentSize?: number }>(), {
  contentSize: undefined,
  hideScrollBar: undefined,
  isEnabled: undefined,
});
</script>

<template>
  <ScrollShadow
    :class="props.class"
    data-foo="bar"
    :hide-scroll-bar="props.hideScrollBar"
    :is-enabled="props.isEnabled"
    :offset="props.offset"
    :on-visibility-change="props.onVisibilityChange"
    :orientation="props.orientation"
    :size="props.size"
    :style="props.style"
    :variant="props.variant"
    :visibility="props.visibility"
  >
    <div
      :style="{ height: `${props.contentSize ?? 400}px`, width: `${props.contentSize ?? 400}px` }"
    >
      Scrollable content
    </div>
  </ScrollShadow>
</template>
