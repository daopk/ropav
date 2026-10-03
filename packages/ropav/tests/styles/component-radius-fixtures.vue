<script setup lang="ts" vapor>
import type { ButtonVariants } from "@ropav/styles";

import { Alert, AlertContent, AlertTitle } from "@/components/alert";
import { Button } from "@/components/button";
import { ButtonGroup } from "@/components/button-group";
import { Chip, ChipLabel } from "@/components/chip";
import { Input } from "@/components/input";
import { ToggleButton } from "@/components/toggle-button";
import { ToggleButtonGroup } from "@/components/toggle-button-group";

/*
 * A field and every rectangular control a theme would want to meet it, each at the size it is
 * handed. Three to a group, so the group has a middle as well as two ends. The chip is the
 * opt-out the docs give, a part that reads the same token but should stay round.
 */
const props = defineProps<{ size: NonNullable<ButtonVariants["size"]> }>();
</script>

<template>
  <div class="flex flex-col items-start gap-2">
    <Input aria-label="Name" data-testid="field" :size="props.size" />
    <Button data-testid="button" :size="props.size">Save</Button>
    <ToggleButton data-testid="toggle-button" :size="props.size">Bold</ToggleButton>
    <Alert data-testid="alert">
      <AlertContent>
        <AlertTitle>Saved</AlertTitle>
      </AlertContent>
    </Alert>
    <Chip data-testid="chip"><ChipLabel>New</ChipLabel></Chip>

    <ButtonGroup data-testid="button-group-horizontal" :size="props.size">
      <Button>Copy</Button>
      <Button>Cut</Button>
      <Button>Paste</Button>
    </ButtonGroup>
    <ButtonGroup data-testid="button-group-vertical" orientation="vertical" :size="props.size">
      <Button>Copy</Button>
      <Button>Cut</Button>
      <Button>Paste</Button>
    </ButtonGroup>

    <ToggleButtonGroup data-testid="toggle-button-group-horizontal" :size="props.size">
      <ToggleButton id="bold">Bold</ToggleButton>
      <ToggleButton id="italic">Italic</ToggleButton>
      <ToggleButton id="underline">Underline</ToggleButton>
    </ToggleButtonGroup>
    <ToggleButtonGroup
      data-testid="toggle-button-group-vertical"
      orientation="vertical"
      :size="props.size"
    >
      <ToggleButton id="bold">Bold</ToggleButton>
      <ToggleButton id="italic">Italic</ToggleButton>
      <ToggleButton id="underline">Underline</ToggleButton>
    </ToggleButtonGroup>
    <ToggleButtonGroup data-testid="toggle-button-group-detached" is-detached :size="props.size">
      <ToggleButton id="bold">Bold</ToggleButton>
      <ToggleButton id="italic">Italic</ToggleButton>
      <ToggleButton id="underline">Underline</ToggleButton>
    </ToggleButtonGroup>
  </div>
</template>
