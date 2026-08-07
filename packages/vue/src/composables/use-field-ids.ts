import type {ComputedRef} from "vue";

import {computed, onScopeDispose, shallowRef} from "vue";

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
export interface FieldIdsContext {
  claimLabelId: () => string;
  claimDescriptionId: () => string;
  claimErrorMessageId: () => string;
  claimHeadingId: () => string;
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
export const useFieldIds = (): UseFieldIdsReturn => {
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

  const claim = (slot: keyof typeof claims): string => {
    const count = claims[slot];

    count.value += 1;
    onScopeDispose(() => {
      count.value -= 1;
    });

    return ids[slot];
  };

  const claimed = (slot: keyof typeof claims) =>
    computed(() => (claims[slot].value > 0 ? ids[slot] : undefined));

  const descriptionId = claimed("description");
  const errorMessageId = claimed("errorMessage");

  return {
    context: {
      claimDescriptionId: () => claim("description"),
      claimErrorMessageId: () => claim("errorMessage"),
      claimHeadingId: () => claim("heading"),
      claimLabelId: () => claim("label"),
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
