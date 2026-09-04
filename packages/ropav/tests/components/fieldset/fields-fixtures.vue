<script setup lang="ts" vapor>
import type { FieldsetFieldsFixtureProps } from "./fixtures.types";

import { Button } from "@/components/button";
import { ButtonGroup } from "@/components/button-group";
import {
  Checkbox,
  CheckboxContent,
  CheckboxControl,
  CheckboxIndicator,
} from "@/components/checkbox";
import { CheckboxGroup } from "@/components/checkbox-group";
import { Fieldset } from "@/components/fieldset";
import { Link } from "@/components/link";
import { Radio, RadioContent, RadioControl, RadioIndicator } from "@/components/radio";
import { RadioGroup } from "@/components/radio-group";
import { Slider, SliderThumb, SliderTrack } from "@/components/slider";
import { ToggleButton } from "@/components/toggle-button";
import { ToggleButtonGroup } from "@/components/toggle-button-group";

// Every field forwards `undefined` unless the test asks otherwise, so an absent prop can still
// fall through to the fieldset.
const props = withDefaults(defineProps<FieldsetFieldsFixtureProps>(), {
  fieldIsDisabled: undefined,
});
</script>

<template>
  <Fieldset :disabled="props.disabled">
    <Button data-testid="button" :is-disabled="props.fieldIsDisabled">Save</Button>
    <ButtonGroup data-testid="button-group">
      <Button data-testid="grouped-button">In a group</Button>
    </ButtonGroup>
    <Link data-testid="link" href="#target" :is-disabled="props.fieldIsDisabled"> A link </Link>
    <ToggleButton data-testid="toggle-button" :is-disabled="props.fieldIsDisabled">
      Toggle
    </ToggleButton>
    <ToggleButtonGroup data-testid="toggle-button-group" :is-disabled="props.fieldIsDisabled">
      <ToggleButton id="one" data-testid="grouped-toggle">One</ToggleButton>
    </ToggleButtonGroup>
    <CheckboxGroup data-testid="checkbox-group" :is-disabled="props.fieldIsDisabled">
      <Checkbox data-testid="checkbox" value="terms">
        <CheckboxContent>
          <CheckboxControl>
            <CheckboxIndicator />
          </CheckboxControl>
          Terms
        </CheckboxContent>
      </Checkbox>
    </CheckboxGroup>
    <RadioGroup data-testid="radio-group" :is-disabled="props.fieldIsDisabled">
      <Radio data-testid="radio" value="one">
        <RadioContent>
          <RadioControl>
            <RadioIndicator />
          </RadioControl>
          One
        </RadioContent>
      </Radio>
    </RadioGroup>
    <Slider
      aria-label="Volume"
      data-testid="slider"
      :default-value="50"
      :is-disabled="props.fieldIsDisabled"
    >
      <SliderTrack>
        <SliderThumb />
      </SliderTrack>
    </Slider>
  </Fieldset>
</template>
