import type { ComputedRef } from "vue";

import { createContext } from "../../utils/create-context";

export interface TextFieldContext {
  /** Visual variant the control inside picks up when it declares none of its own. */
  variant: ComputedRef<"primary" | "secondary" | undefined>;
}

/**
 * Carries the variant alone, kept apart from the control context that carries the behaviour.
 *
 * Two contexts rather than one because they have different providers: every field root hands
 * down behaviour, but only a root whose control is styled from *its* variants hands down a
 * variant — `TextField` and `ComboBox` do, while a `SearchField` styles its own control from its
 * own variants, exactly as in React.
 *
 * Loose: an `Input` outside any field is legal.
 */
export const [useTextFieldContext, provideTextFieldContext] =
  createContext<TextFieldContext | null>({
    defaultValue: null,
    name: "TextFieldContext",
    strict: false,
  });
