<script setup lang="ts" vapor>
import type { LinkFixtureProps } from "./fixtures.types";

import { Fieldset } from "@/components/fieldset";
import { LinkIcon, Link } from "@/components/link";

const props = withDefaults(defineProps<LinkFixtureProps>(), { isDisabled: undefined });
</script>

<template>
  <Fieldset v-if="props.inDisabledFieldset" disabled>
    <Link
      :aria-current="props.ariaCurrent"
      :aria-label="props.ariaLabel"
      :class="props.class"
      :href="props.href"
      :is-disabled="props.isDisabled"
      :rel="props.rel"
      :target="props.target"
      @click="props.onClick"
    >
      Call to action
      <LinkIcon v-if="props.withIcon" :class="props.iconClass" />
    </Link>
  </Fieldset>
  <Link v-else-if="props.bare" href="/next">Call to action</Link>
  <Link
    v-else
    :aria-current="props.ariaCurrent"
    :aria-label="props.ariaLabel"
    :class="props.class"
    :download="props.download"
    :href="props.href"
    :is-disabled="props.isDisabled"
    :rel="props.rel"
    :router-options="props.routerOptions"
    :target="props.target"
    @click="props.onClick"
  >
    <LinkIcon v-if="props.withIcon && props.iconFirst" :class="props.iconClass" />
    <LinkIcon v-if="props.withIcon && props.customIcon" :class="props.iconClass">
      <svg data-testid="custom-icon" viewBox="0 0 16 16"><path d="M0 0h16v16H0z" /></svg>
    </LinkIcon>
    Call to action
    <LinkIcon
      v-if="props.withIcon && !props.iconFirst && !props.customIcon"
      :class="props.iconClass"
    />
  </Link>
</template>
