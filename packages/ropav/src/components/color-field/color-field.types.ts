import type {
  ValidationBehavior,
  ValidationDetails,
  ValidationFunction,
} from "../../composables/use-form-validation-state";
import type { Color, ColorChannel, ColorSpace } from "../../utils/color-types";

export interface ColorFieldRootProps {
  class?: string;
  /**
   * The channel the field edits. Without one the field edits the colour as a hex value, which is
   * a different control: the two branches have their own state, their own keyboard and their own
   * DOM, and changing this at runtime rebuilds the field rather than reconfiguring it.
   */
  channel?: ColorChannel;
  /**
   * The colour space the field works in when a `channel` is given. Ignored without one — a hex
   * field always shows the colour as an RGB hex value.
   */
  colorSpace?: ColorSpace;
  /** Controlled colour. A string is parsed; one that will not parse is treated as absent. */
  value?: Color | string | null;
  /** Colour the field starts with, and goes back to when the form is reset. */
  defaultValue?: Color | string | null;
  /**
   * Whether the field stretches to fill its container.
   *
   * Declared as a plain `boolean` rather than through the variants type: the SFC compiler cannot
   * resolve an imported indexed-access type into a runtime prop type, and without `type: Boolean`
   * Vue never casts a valueless attribute — `<ColorField full-width>` would arrive as `""` and
   * read as falsy, so the modifier would silently never apply.
   */
  fullWidth?: boolean;
  isDisabled?: boolean;
  isReadOnly?: boolean;
  isRequired?: boolean;
  /**
   * Controlled validity. Present at all — `true` *or* `false` — pins the field.
   *
   * Only read on the hex branch. A channel field ignores it, along with `validate`, exactly as
   * React does: its validation state is the number field's, which is built without either.
   */
  isInvalid?: boolean;
  /** Only read on the hex branch. @see {@link ColorFieldRootProps.isInvalid} */
  validate?: ValidationFunction<Color | null>;
  validationBehavior?: ValidationBehavior;
  /** Name the field submits under. */
  name?: string;
  /** Id of the form the field belongs to, when it is not nested inside one. */
  form?: string;
  /** Lands on the input, which is the field as far as assistive technology is concerned. */
  id?: string;
  autoFocus?: boolean;
  /** Whether the wheel over a focused field is ignored. */
  isWheelDisabled?: boolean;
  ariaLabel?: string;
  ariaLabelledby?: string;
  ariaDescribedby?: string;
}

/** State the root hands to its slot, matching React's render props. */
export interface ColorFieldRootSlotProps {
  /** The channel being edited, or `"hex"` when the field edits the whole colour. */
  channel: ColorChannel | "hex";
  /** The colour the field currently holds, or `null` when it is empty. */
  colorValue: Color | null;
  isDisabled: boolean;
  isInvalid: boolean;
  isReadOnly: boolean;
  isRequired: boolean;
  validationDetails: ValidationDetails;
  validationErrors: string[];
}
