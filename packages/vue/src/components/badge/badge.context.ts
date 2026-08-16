import type {badgeVariants} from "@heroui/styles";
import type {ComputedRef} from "vue";

import {createContext} from "../../utils/create-context";

export interface BadgeContext {
  slots: ComputedRef<ReturnType<typeof badgeVariants>>;
}

export const [useBadgeContext, provideBadgeContext] = createContext<BadgeContext>({
  name: "BadgeContext",
});
