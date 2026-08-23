<script setup lang="ts" vapor>
import type {ToolbarRootProps} from "@/components/toolbar";

import {Button} from "@/components/button";
import {ButtonGroup} from "@/components/button-group";
import {SeparatorRoot} from "@/components/separator";
import {ToggleButton} from "@/components/toggle-button";
import {ToggleButtonGroup} from "@/components/toggle-button-group";
import {Toolbar} from "@/components/toolbar";

const props = withDefaults(
  defineProps<
    ToolbarRootProps & {
      /** Orientation handed to the inner groups, overriding what they inherit. */
      groupOrientation?: "horizontal" | "vertical";
      /** Orientation handed to the standalone separator, overriding what it inherits. */
      separatorOrientation?: "horizontal" | "vertical";
      /** Nests a second Toolbar inside the first, which is not allowed to own the keyboard. */
      withNestedToolbar?: boolean;
    }
  >(),
  // Absent has to stay absent, or the fixture would forward an orientation the tests never
  // asked for and the parts could never inherit one.
  {
    groupOrientation: undefined,
    isAttached: undefined,
    orientation: undefined,
    separatorOrientation: undefined,
  },
);
</script>

<template>
  <Toolbar
    aria-label="Text formatting"
    :class="props.class"
    :is-attached="props.isAttached"
    :orientation="props.orientation"
  >
    <ToggleButtonGroup
      aria-label="Text style"
      :orientation="props.groupOrientation"
      selection-mode="multiple"
    >
      <ToggleButton id="bold">Bold</ToggleButton>
      <ToggleButton id="italic">Italic</ToggleButton>
    </ToggleButtonGroup>
    <SeparatorRoot :orientation="props.separatorOrientation" />
    <ButtonGroup :orientation="props.groupOrientation">
      <Button>Copy</Button>
      <Button>Cut</Button>
    </ButtonGroup>
    <Toolbar v-if="props.withNestedToolbar" aria-label="Nested">
      <Button>Nested</Button>
    </Toolbar>
  </Toolbar>
</template>
