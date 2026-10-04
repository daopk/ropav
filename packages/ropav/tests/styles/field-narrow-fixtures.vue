<script setup lang="ts" vapor>
import type { FieldNarrowFixtureProps } from "./field-narrow-fixtures.types";

import { ColorField } from "@/components/color-field";
import {
  ColorInputGroup,
  ColorInputGroupInput,
  ColorInputGroupSuffix,
} from "@/components/color-input-group";
import { ComboBox, ComboBoxInputGroup, ComboBoxTrigger } from "@/components/combo-box";
import { Input } from "@/components/input";
import { InputGroup, InputGroupInput, InputGroupSuffix } from "@/components/input-group";
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
import { TextField } from "@/components/textfield";

/*
 * Each field full width in a column as narrow as a sidebar, holding a value so that whatever
 * trails the control is drawn: a search field shows its clear button only once there is something
 * to clear. The column is the box every case measures against.
 */
const props = defineProps<FieldNarrowFixtureProps>();
</script>

<template>
  <div class="w-[200px]" data-testid="column">
    <SearchField
      v-if="props.tree === 'SearchField'"
      aria-label="Search"
      default-value="Quarterly planning notes"
      full-width
    >
      <SearchFieldGroup>
        <SearchFieldSearchIcon />
        <SearchFieldInput />
        <SearchFieldClearButton />
      </SearchFieldGroup>
    </SearchField>
    <InputGroup v-else-if="props.tree === 'InputGroup'" full-width>
      <InputGroupInput aria-label="Website" value="ropav-components" />
      <InputGroupSuffix>.netlify.app</InputGroupSuffix>
    </InputGroup>
    <TextField
      v-else-if="props.tree === 'TextField > InputGroup'"
      aria-label="Website"
      default-value="ropav-components"
      full-width
    >
      <InputGroup full-width>
        <InputGroupInput />
        <InputGroupSuffix>.netlify.app</InputGroupSuffix>
      </InputGroup>
    </TextField>
    <NumberField
      v-else-if="props.tree === 'NumberField'"
      aria-label="Quantity"
      :default-value="1024"
      full-width
    >
      <NumberFieldGroup>
        <NumberFieldDecrementButton />
        <NumberFieldInput />
        <NumberFieldIncrementButton />
      </NumberFieldGroup>
    </NumberField>
    <ComboBox
      v-else-if="props.tree === 'ComboBox'"
      aria-label="Animal"
      default-input-value="Aardvark"
      full-width
      :items="[]"
    >
      <ComboBoxInputGroup>
        <Input />
        <ComboBoxTrigger />
      </ComboBoxInputGroup>
    </ComboBox>
    <ColorField
      v-else-if="props.tree === 'ColorField'"
      aria-label="Color"
      default-value="#0485F7"
      full-width
    >
      <ColorInputGroup full-width>
        <ColorInputGroupInput />
        <ColorInputGroupSuffix>sRGB</ColorInputGroupSuffix>
      </ColorInputGroup>
    </ColorField>
  </div>
</template>
