<script setup lang="ts">
import {
  Button,
  ButtonGroup,
  ButtonGroupSeparator,
  Separator,
  ToggleButton,
  ToggleButtonGroup,
  ToggleButtonGroupSeparator,
  Toolbar,
} from "ropav";
</script>

<template>
  <Toolbar aria-label="Text formatting">
    <ToggleButtonGroup aria-label="Text style" selection-mode="multiple">
      <ToggleButton id="bold">Bold</ToggleButton>
      <ToggleButton id="italic">
        <ToggleButtonGroupSeparator />
        Italic
      </ToggleButton>
    </ToggleButtonGroup>

    <Separator />

    <ButtonGroup>
      <Button variant="secondary">Undo</Button>
      <Button variant="secondary">
        <ButtonGroupSeparator />
        Redo
      </Button>
    </ButtonGroup>
  </Toolbar>
</template>
