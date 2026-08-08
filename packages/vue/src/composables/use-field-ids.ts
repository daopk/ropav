import type {ComputedRef, MaybeRefOrGetter} from "vue";

import {computed, onScopeDispose, shallowRef, toValue} from "vue";

import {createContext} from "../utils/create-context";

import {useId} from "./use-id";

/**
 * The ids a container hands to the text parts nested inside it, so the container can
 * point `aria-labelledby` / `aria-describedby` at them.
 *
 * React Aria solves this by generating every id up front and referencing them whether or
 * not anything renders — which leaves dangling idrefs when a slot is empty. Here a part
 * has to **claim** its id, and the container only references the ones actually claimed.
 * Each `claim*` returns the id to render and registers the part for as long as its scope
 * lives.
 */
export type FieldSlot = "label" | "description" | "errorMessage" | "heading";

export interface FieldIdsContext {
  /**
   * Each returns the id to render, or `undefined` when the container does not wire that slot.
   * A container that never references a slot must not hand out an id for it, or the markup
   * grows an attribute that means nothing.
   */
  claimLabelId: () => string | undefined;
  claimDescriptionId: () => string | undefined;
  claimErrorMessageId: () => string | undefined;
  claimHeadingId: () => string | undefined;
  /**
   * Element the label should render as. A field whose label names a composite rather than a
   * form control needs a `span`: `label` implies a labelable control to point at.
   */
  labelElementType?: "label" | "span";
  /**
   * Id of the control the label names, for the label's own `for`.
   *
   * A field that lays its label out *beside* the control needs both directions: the control
   * points `aria-labelledby` back at the label so assistive technology reads a name, but only
   * `for` makes a pointer click on the label move focus into the control. `undefined` when
   * there is nothing single to point at — a composite like a slider or a tag group, or a
   * control that already sits inside its own label the way a checkbox does.
   */
  labelFor: ComputedRef<string | undefined>;
  /**
   * Role to put on the heading, when the container needs one that is not the element's
   * own. A listbox section sets `"presentation"`: ARIA does not allow a heading inside a
   * listbox, so the heading is hidden from assistive technology and reused only as the
   * visual label the section points `aria-labelledby` at.
   */
  headingRole?: string;
}

/**
 * Loose on purpose: `Label`, `Description`, `ErrorMessage` and `Header` all render fine on
 * their own. Standing outside a container is the normal case, not an error — they just get
 * no id, which is exactly how React behaves outside a collection.
 */
export const [useFieldIdsContext, provideFieldIdsContext] = createContext<FieldIdsContext | null>({
  defaultValue: null,
  name: "FieldIdsContext",
  strict: false,
});

export interface UseFieldIdsReturn {
  /** Pass to `provideFieldIdsContext`. */
  context: FieldIdsContext;
  /** Each is `undefined` until a matching part claims it. */
  labelId: ComputedRef<string | undefined>;
  descriptionId: ComputedRef<string | undefined>;
  errorMessageId: ComputedRef<string | undefined>;
  headingId: ComputedRef<string | undefined>;
  /** Description and error message joined, ready for `aria-describedby`. */
  describedBy: ComputedRef<string | undefined>;
}

/**
 * Mint the ids for a container's text parts and track which of them are in use.
 *
 * Call in the container (a collection item, a field root, a section); pass `context` to
 * `provideFieldIdsContext` and read the id refs to build the ARIA attributes.
 *
 * @example
 * ```ts
 * const {context, describedBy, labelId} = useFieldIds();
 *
 * provideFieldIdsContext(context);
 * // <div role="option" :aria-labelledby="labelId" :aria-describedby="describedBy">
 * ```
 */
export const useFieldIds = (
  options: {
    headingRole?: string;
    labelElementType?: "label" | "span";
    /** Id of the control the label points `for` at. Omit when there is none. */
    labelFor?: MaybeRefOrGetter<string | undefined>;
    /** Slots this container actually references. @default all of them */
    slots?: FieldSlot[];
  } = {},
): UseFieldIdsReturn => {
  const baseId = useId();

  const ids = {
    description: `${baseId.value}-description`,
    errorMessage: `${baseId.value}-error-message`,
    heading: `${baseId.value}-heading`,
    label: `${baseId.value}-label`,
  };

  // A count rather than a flag, so a part that remounts elsewhere in the same tick cannot
  // leave the id looking unclaimed in between.
  const claims = {
    description: shallowRef(0),
    errorMessage: shallowRef(0),
    heading: shallowRef(0),
    label: shallowRef(0),
  };

  const isWired = (slot: FieldSlot) => !options.slots || options.slots.includes(slot);

  const claim = (slot: FieldSlot): string | undefined => {
    if (!isWired(slot)) return undefined;

    const count = claims[slot];

    count.value += 1;
    onScopeDispose(() => {
      count.value -= 1;
    });

    return ids[slot];
  };

  const claimed = (slot: FieldSlot) =>
    computed(() => (claims[slot].value > 0 ? ids[slot] : undefined));

  const descriptionId = claimed("description");
  const errorMessageId = claimed("errorMessage");

  return {
    context: {
      claimDescriptionId: () => claim("description"),
      claimErrorMessageId: () => claim("errorMessage"),
      claimHeadingId: () => claim("heading"),
      claimLabelId: () => claim("label"),
      headingRole: options.headingRole,
      labelElementType: options.labelElementType,
      labelFor: computed(() => toValue(options.labelFor)),
    },
    describedBy: computed(() => {
      const parts = [descriptionId.value, errorMessageId.value].filter(Boolean);

      return parts.length > 0 ? parts.join(" ") : undefined;
    }),
    descriptionId,
    errorMessageId,
    headingId: claimed("heading"),
    labelId: claimed("label"),
  };
};
