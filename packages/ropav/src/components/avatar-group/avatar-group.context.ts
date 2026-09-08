import type { avatarGroupVariants, AvatarVariants } from "@ropav/styles";
import type { ComputedRef } from "vue";

import { createContext } from "../../utils/create-context";

export interface AvatarGroupContext {
  slots: ComputedRef<ReturnType<typeof avatarGroupVariants>>;
  /** Size for every avatar in the group, which each avatar may still override. */
  size: ComputedRef<AvatarVariants["size"]>;
}

/**
 * Loose on purpose: an Avatar reads this context but is perfectly usable on its own, so the
 * absence of a group is a normal state rather than an error.
 */
export const [useAvatarGroupContext, provideAvatarGroupContext] =
  createContext<AvatarGroupContext | null>({
    defaultValue: null,
    name: "AvatarGroupContext",
    strict: false,
  });
