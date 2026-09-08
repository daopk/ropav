<script setup lang="ts" vapor>
import type { AvatarGroupProps } from "@/components/avatar-group";

import { Avatar, AvatarFallback } from "@/components/avatar";
import { AvatarGroup, AvatarGroupOverflow } from "@/components/avatar-group";

const props = withDefaults(
  defineProps<
    AvatarGroupProps & {
      /** Rendered as `+count` by the overflow part. */
      count?: number;
      /** Size applied to the first avatar only, so it can be shown to beat the group's. */
      childSize?: AvatarGroupProps["size"];
      /** Renders the overflow part with slot content in place of a count. */
      overflowLabel?: string;
      /** Wraps each avatar in a link, putting the focusable element outside the avatar. */
      withLinks?: boolean;
    }
  >(),
  // Absent has to stay absent, or the fixture would pass a value down and override the group
  // in every test that does not set one.
  { childSize: undefined, size: undefined, withLinks: undefined },
);

const labels = ["A", "B", "C"];
</script>

<template>
  <AvatarGroup
    :class="props.class"
    :front="props.front"
    :orientation="props.orientation"
    :overlap="props.overlap"
    :size="props.size"
  >
    <template v-if="props.withLinks">
      <a v-for="label in labels" :key="label" href="#">
        <Avatar>
          <AvatarFallback>{{ label }}</AvatarFallback>
        </Avatar>
      </a>
    </template>
    <template v-else>
      <Avatar
        v-for="(label, index) in labels"
        :key="label"
        :size="index === 0 ? props.childSize : undefined"
      >
        <AvatarFallback>{{ label }}</AvatarFallback>
      </Avatar>
    </template>

    <!-- Two elements rather than one with a conditional slot: a declared slot is present even
       when its content renders nothing, which would hide the count path entirely. -->
    <AvatarGroupOverflow v-if="props.overflowLabel">{{ props.overflowLabel }}</AvatarGroupOverflow>
    <AvatarGroupOverflow v-else-if="props.count !== undefined" :count="props.count" />
  </AvatarGroup>
</template>
