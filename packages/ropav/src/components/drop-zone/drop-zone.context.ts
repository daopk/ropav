import type { dropZoneVariants } from "@ropav/styles";
import type { ComputedRef } from "vue";

import { createContext } from "../../utils/create-context";

export interface DropZoneContext {
  slots: ComputedRef<ReturnType<typeof dropZoneVariants>>;
}

export const [useDropZoneContext, provideDropZoneContext] = createContext<DropZoneContext>({
  name: "DropZoneContext",
});
