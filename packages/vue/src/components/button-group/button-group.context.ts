import type {ButtonVariants, buttonGroupVariants} from "@heroui/styles";
import type {ComputedRef} from "vue";

import {createContext} from "../../utils/create-context";

export interface ButtonGroupContext {
  slots: ComputedRef<ReturnType<typeof buttonGroupVariants>>;
  fullWidth: ComputedRef<boolean | undefined>;
  isDisabled: ComputedRef<boolean | undefined>;
  size: ComputedRef<ButtonVariants["size"]>;
  variant: ComputedRef<ButtonVariants["variant"]>;
}

/**
 * Loose on purpose: a Button reads this context but is perfectly usable on its own, so
 * the absence of a group is a normal state rather than an error.
 */
export const [useButtonGroupContext, provideButtonGroupContext] =
  createContext<ButtonGroupContext | null>({
    defaultValue: null,
    name: "ButtonGroupContext",
    strict: false,
  });
