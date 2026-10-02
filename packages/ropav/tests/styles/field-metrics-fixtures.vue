<script setup lang="ts" vapor>
import type { FieldMetricsFixtureProps } from "./field-metrics-fixtures.types";

import {
  Autocomplete,
  AutocompleteIndicator,
  AutocompleteTrigger,
  AutocompleteValue,
} from "@/components/autocomplete";
import { ColorField } from "@/components/color-field";
import { ColorInputGroup, ColorInputGroupInput } from "@/components/color-input-group";
import { ComboBox, ComboBoxInputGroup, ComboBoxTrigger } from "@/components/combo-box";
import {
  DateField,
  DateFieldGroup,
  DateFieldInput,
  DateFieldSegment,
} from "@/components/date-field";
import { Input } from "@/components/input";
import { InputGroup, InputGroupInput } from "@/components/input-group";
import {
  NumberField,
  NumberFieldDecrementButton,
  NumberFieldGroup,
  NumberFieldIncrementButton,
  NumberFieldInput,
} from "@/components/number-field";
import {
  SearchField,
  SearchFieldClearButton,
  SearchFieldGroup,
  SearchFieldInput,
  SearchFieldSearchIcon,
} from "@/components/search-field";
import { Select, SelectIndicator, SelectTrigger, SelectValue } from "@/components/select";
import { TextArea } from "@/components/textarea";
import { TextField } from "@/components/textfield";
import {
  TimeField,
  TimeFieldGroup,
  TimeFieldInput,
  TimeFieldSegment,
} from "@/components/time-field";

/*
 * Each field the way a caller writes it, with its usual parts and nothing more, so the heights
 * measured are the ones a page gets. The size goes where the field takes it: on the root for most,
 * on the group for the three fields whose group draws the field, and on a TextField for the trees
 * that measure a size arriving from outside. The pickers take an empty list, since only the
 * trigger is measured and the popover never opens.
 */
const props = defineProps<FieldMetricsFixtureProps>();
</script>

<template>
  <Input v-if="props.tree === 'Input'" aria-label="Name" :size="props.size" />
  <TextArea v-else-if="props.tree === 'TextArea'" aria-label="Notes" :size="props.size" />
  <InputGroup v-else-if="props.tree === 'InputGroup'" :size="props.size">
    <InputGroupInput aria-label="Website" />
  </InputGroup>
  <SearchField v-else-if="props.tree === 'SearchField'" aria-label="Search" :size="props.size">
    <SearchFieldGroup>
      <SearchFieldSearchIcon />
      <SearchFieldInput />
      <SearchFieldClearButton />
    </SearchFieldGroup>
  </SearchField>
  <NumberField v-else-if="props.tree === 'NumberField'" aria-label="Quantity" :size="props.size">
    <NumberFieldGroup>
      <NumberFieldDecrementButton />
      <NumberFieldInput />
      <NumberFieldIncrementButton />
    </NumberFieldGroup>
  </NumberField>
  <Select
    v-else-if="props.tree === 'Select'"
    aria-label="State"
    :items="[]"
    placeholder="Pick one"
    :size="props.size"
  >
    <SelectTrigger>
      <SelectValue />
      <SelectIndicator />
    </SelectTrigger>
  </Select>
  <Autocomplete
    v-else-if="props.tree === 'Autocomplete'"
    aria-label="Animal"
    :items="[]"
    placeholder="Pick one"
    :size="props.size"
  >
    <AutocompleteTrigger>
      <AutocompleteValue />
      <AutocompleteIndicator />
    </AutocompleteTrigger>
  </Autocomplete>
  <ComboBox
    v-else-if="props.tree === 'ComboBox'"
    aria-label="Animal"
    :items="[]"
    :size="props.size"
  >
    <ComboBoxInputGroup>
      <Input />
      <ComboBoxTrigger />
    </ComboBoxInputGroup>
  </ComboBox>
  <ColorField v-else-if="props.tree === 'ColorField'" aria-label="Color" default-value="#0485F7">
    <ColorInputGroup :size="props.size">
      <ColorInputGroupInput />
    </ColorInputGroup>
  </ColorField>
  <DateField v-else-if="props.tree === 'DateField'" aria-label="Date">
    <DateFieldGroup :size="props.size">
      <DateFieldInput>
        <template #default="{ segment }">
          <DateFieldSegment :segment="segment" />
        </template>
      </DateFieldInput>
    </DateFieldGroup>
  </DateField>
  <TimeField v-else-if="props.tree === 'TimeField'" aria-label="Time">
    <TimeFieldGroup :size="props.size">
      <TimeFieldInput>
        <template #default="{ segment }">
          <TimeFieldSegment :segment="segment" />
        </template>
      </TimeFieldInput>
    </TimeFieldGroup>
  </TimeField>
  <TextField v-else-if="props.tree === 'TextField > Input'" aria-label="Name" :size="props.size">
    <Input />
  </TextField>
  <TextField
    v-else-if="props.tree === 'TextField > TextArea'"
    aria-label="Notes"
    :size="props.size"
  >
    <TextArea />
  </TextField>
  <TextField
    v-else-if="props.tree === 'TextField > InputGroup'"
    aria-label="Website"
    :size="props.size"
  >
    <InputGroup>
      <InputGroupInput />
    </InputGroup>
  </TextField>
</template>
