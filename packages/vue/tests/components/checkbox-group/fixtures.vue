<script setup lang="ts" vapor>
import type {CheckboxGroupFixtureProps} from "./fixtures.types";

import {computed} from "vue";

import {Checkbox} from "@/components/checkbox";
import {CheckboxGroup} from "@/components/checkbox-group";
import {Description} from "@/components/description";
import {FieldError} from "@/components/field-error";
import {Form} from "@/components/form";
import {Label} from "@/components/label";

const props = withDefaults(defineProps<CheckboxGroupFixtureProps>(), {isInvalid: undefined});

defineEmits<{change: [value: string[]]}>();

const items = computed(() => props.items ?? ["email", "sms", "push"]);
</script>

<template>
  <component :is="props.withForm ? Form : 'div'" :validation-errors="props.formValidationErrors">
    <CheckboxGroup
      :aria-label="props.ariaLabel"
      :class="props.class"
      :default-value="props.defaultValue"
      :form="props.form"
      :is-disabled="props.isDisabled"
      :is-invalid="props.isInvalid"
      :is-read-only="props.isReadOnly"
      :is-required="props.isRequired"
      :name="props.name"
      :validate="props.validate"
      :validation-behavior="props.validationBehavior"
      :value="props.value"
      :variant="props.variant"
      @change="$emit('change', $event)"
    >
      <Label v-if="props.withLabel">Notifications</Label>
      <Description v-if="props.withDescription">Pick at least one</Description>
      <Checkbox
        v-for="(itemValue, index) in items"
        :key="itemValue"
        :is-disabled="index === 0 && props.itemDisabled ? true : undefined"
        :value="itemValue"
        :variant="index === 0 ? props.itemVariant : undefined"
      >
        <Checkbox.Content>
          <Checkbox.Control>
            <Checkbox.Indicator />
          </Checkbox.Control>
          {{ itemValue }}
        </Checkbox.Content>
        <FieldError v-if="index === 0 && props.withItemFieldError" />
      </Checkbox>
      <FieldError v-if="props.withFieldError" />
    </CheckboxGroup>
    <button v-if="props.withForm" data-testid="submit" type="submit">Submit</button>
  </component>
</template>
