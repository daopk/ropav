import AvatarFallback from "./avatar-fallback.vue";
import AvatarImage from "./avatar-image.vue";
import AvatarRoot from "./avatar-root.vue";

/* -------------------------------------------------------------------------------------------------
 * Compound Component
 * -----------------------------------------------------------------------------------------------*/
export const Avatar = Object.assign(AvatarRoot, {
  Fallback: AvatarFallback,
  Image: AvatarImage,
  Root: AvatarRoot,
});

/* -------------------------------------------------------------------------------------------------
 * Named Components
 * -----------------------------------------------------------------------------------------------*/
export { AvatarRoot, AvatarImage, AvatarFallback };

export type {
  AvatarRootProps,
  AvatarRootProps as AvatarProps,
  AvatarImageProps,
  AvatarFallbackProps,
} from "./avatar.types";

/* -------------------------------------------------------------------------------------------------
 * Loading Status
 * -----------------------------------------------------------------------------------------------*/
// Re-exported so a caller can type a `loadingStatusChange` handler without reaching for the
// composable the status comes from.
export type { ImageLoadingStatus } from "../../composables/use-image-loading-status";

/* -------------------------------------------------------------------------------------------------
 * Variants
 * -----------------------------------------------------------------------------------------------*/
export { avatarVariants } from "@ropav/styles";

export type { AvatarVariants } from "@ropav/styles";
