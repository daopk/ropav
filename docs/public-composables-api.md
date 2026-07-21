# Public composables API

Ropav exposes framework-level composables from both the root package and the dedicated
`ropav/composables` entrypoint. Prefer the dedicated entrypoint when an application only needs
headless state behavior.

## `useControllableValue`

`useControllableValue` implements the controlled/uncontrolled value pattern used by Ropav form
controls. A defined `modelValue` makes the value controlled; `undefined` selects internal state.

```vue
<script setup lang="ts">
import { useControllableValue } from 'ropav/composables';

const props = withDefaults(
  defineProps<{
    modelValue?: string;
    defaultValue?: string;
  }>(),
  {
    modelValue: undefined,
    defaultValue: '',
  },
);

const emit = defineEmits<{
  'update:modelValue': [value: string];
}>();

const { value, isControlled, setValue, resetValue } = useControllableValue({
  modelValue: () => props.modelValue,
  defaultValue: () => props.defaultValue,
  onChange: (value) => emit('update:modelValue', value),
});
</script>
```

`defaultValue()` is read once when the composable is created. `setValue()` updates internal state
only in uncontrolled mode and always calls `onChange`, including repeated requests for the same
value. In controlled mode, the parent remains responsible for updating `modelValue`.

`resetValue(value)` updates uncontrolled state without calling `onChange`. Calling `resetValue()`
without an argument restores the initial default. A reset is a no-op while controlled. If a value
changes from controlled to uncontrolled, the last controlled value becomes the internal fallback.

The return value contains readonly `value` and `isControlled` computed refs, the captured
`initialValue`, and the `setValue()` and `resetValue()` commands. `undefined` is reserved as the
uncontrolled sentinel and should not be used as a controlled value.
