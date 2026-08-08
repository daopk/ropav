<script setup lang="ts" vapor>
import type {SwitchFixtureProps} from "./fixtures.types";

import {Description} from "@/components/description";
import {FieldError} from "@/components/field-error";
import {Switch} from "@/components/switch";

// Both booleans have to declare an explicit `undefined` default here too, for the same
// reason the component does: forwarding a `false` that Vue cast from an absent prop would
// hand the switch a controlled value — a pinned-off switch, or a field permanently claiming
// to be valid — that the test never asked for.
withDefaults(defineProps<SwitchFixtureProps>(), {isInvalid: undefined, isSelected: undefined});

defineEmits<{change: [isSelected: boolean]}>();
</script>

<template>
  <Switch
    :aria-label="$props.ariaLabel"
    :class="$props.class"
    :default-selected="$props.defaultSelected"
    :form="$props.form"
    :is-disabled="$props.isDisabled"
    :is-invalid="$props.isInvalid"
    :is-read-only="$props.isReadOnly"
    :is-required="$props.isRequired"
    :is-selected="$props.isSelected"
    :name="$props.name"
    :size="$props.size"
    :validate="$props.validate"
    :validation-behavior="$props.validationBehavior"
    :value="$props.value"
    @change="$emit('change', $event)"
  >
    <Switch.Content>
      <Switch.Control>
        <Switch.Thumb>
          <Switch.Icon v-if="$props.withIcon">
            <svg data-testid="thumb-icon" />
          </Switch.Icon>
        </Switch.Thumb>
      </Switch.Control>
      Enable notifications
    </Switch.Content>
    <Description v-if="$props.withDescription">Allow others to see your profile</Description>
    <FieldError v-if="$props.withCustomError">
      <template #default="{validationErrors}">
        <span data-testid="custom-error">{{ validationErrors.length }} problem(s)</span>
      </template>
    </FieldError>
    <FieldError v-else-if="$props.withFieldError" />
  </Switch>
</template>
