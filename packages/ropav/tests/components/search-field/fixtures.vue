<script setup lang="ts" vapor>
import type { SearchFieldFixtureProps } from "./fixtures.types";

import { Description } from "@/components/description";
import { FieldError } from "@/components/field-error";
import { Label } from "@/components/label";
import {
  SearchFieldClearButton,
  SearchFieldGroup,
  SearchFieldInput,
  SearchField,
  SearchFieldSearchIcon,
} from "@/components/search-field";

// The three-state booleans need explicit `undefined` here too: forwarding a cast `false` would
// turn the field controlled, or claim it valid, without any test asking for it.
const props = withDefaults(defineProps<SearchFieldFixtureProps>(), {
  fullWidth: undefined,
  isDisabled: undefined,
  isInvalid: undefined,
  isReadOnly: undefined,
  isRequired: undefined,
  variant: undefined,
  withClearButton: true,
  withLabel: true,
  withSearchIcon: true,
});
</script>

<template>
  <SearchField
    v-if="props.attributeForm"
    :aria-label="props.ariaLabel"
    :class="props.class"
    :default-value="props.defaultValue"
    full-width
    :name="props.name"
  >
    <Label v-if="props.withLabel">Search</Label>
    <SearchFieldGroup>
      <SearchFieldSearchIcon v-if="props.withSearchIcon" />
      <SearchFieldInput />
      <SearchFieldClearButton v-if="props.withClearButton" />
    </SearchFieldGroup>
  </SearchField>
  <SearchField
    v-else
    :id="props.id"
    :aria-label="props.ariaLabel"
    :class="props.class"
    :default-value="props.defaultValue"
    :full-width="props.fullWidth"
    :is-disabled="props.isDisabled"
    :is-invalid="props.isInvalid"
    :is-read-only="props.isReadOnly"
    :is-required="props.isRequired"
    :name="props.name"
    :on-submit="props.onSubmit"
    :placeholder="props.placeholder"
    :type="props.type"
    :validate="props.validate"
    :validation-behavior="props.validationBehavior"
    :value="props.value"
    :variant="props.variant"
    @change="props.onChange"
    @clear="props.onClear"
  >
    <Label v-if="props.withLabel">Search</Label>
    <SearchFieldGroup>
      <SearchFieldSearchIcon v-if="props.withSearchIcon && props.customSearchIcon">
        <svg data-slot="search-field-search-icon" data-testid="custom-search" viewBox="0 0 16 16">
          <path d="M0 0h16v16H0z" />
        </svg>
      </SearchFieldSearchIcon>
      <SearchFieldSearchIcon v-else-if="props.withSearchIcon" />
      <SearchFieldInput :placeholder="props.controlPlaceholder" :value="props.controlValue" />
      <SearchFieldClearButton v-if="props.withClearButton && props.customClearIcon">
        <svg data-testid="custom-clear" viewBox="0 0 16 16">
          <path d="M0 0h16v16H0z" />
        </svg>
      </SearchFieldClearButton>
      <SearchFieldClearButton v-else-if="props.withClearButton" />
    </SearchFieldGroup>
    <Description v-if="props.withDescription">Type to search</Description>
    <FieldError v-if="props.withFieldError" />
  </SearchField>
</template>
