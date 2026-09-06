<script setup lang="ts">
import {
  ColorField,
  ColorInputGroup,
  ColorInputGroupInput,
  ColorInputGroupPrefix,
  ColorSwatch,
  Label,
} from "ropav";
</script>

<template>
  <div class="flex w-full max-w-xs flex-col gap-4">
    <ColorField default-value="#0485f7">
      <Label>Hex</Label>
      <ColorInputGroup>
        <ColorInputGroupPrefix><ColorSwatch size="xs" /></ColorInputGroupPrefix>
        <ColorInputGroupInput />
      </ColorInputGroup>
    </ColorField>

    <ColorField channel="red" color-space="rgb" default-value="#0485f7">
      <Label>Red</Label>
      <ColorInputGroup>
        <ColorInputGroupInput />
      </ColorInputGroup>
    </ColorField>
  </div>
</template>
