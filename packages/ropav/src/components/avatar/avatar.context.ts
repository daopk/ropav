import type { ImageLoadingStatus } from "../../composables/use-image-loading-status";
import type { avatarVariants } from "@ropav/styles";
import type { ComputedRef, Ref } from "vue";

import { createContext } from "../../utils/create-context";

export interface AvatarContext {
  slots: ComputedRef<ReturnType<typeof avatarVariants>>;
  /** Loading status of the image, so the fallback knows whether to render. */
  imageStatus: Ref<ImageLoadingStatus>;
  /** Called by `Avatar.Image` to publish its loading status to the root. */
  setImageStatus: (status: ImageLoadingStatus) => void;
}

export const [useAvatarContext, provideAvatarContext] = createContext<AvatarContext>({
  name: "AvatarContext",
});
