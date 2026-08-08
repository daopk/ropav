import AvatarFallback from "./avatar-fallback.vue";
import AvatarImage from "./avatar-image.vue";
import AvatarRoot from "./avatar-root.vue";

/* -------------------------------------------------------------------------------------------------
 * Compound Component
 * -----------------------------------------------------------------------------------------------*/
// Part order mirrors the DOM order of an avatar, and `@heroui/react` — not alphabetical.
/* eslint-disable sort-keys, sort-keys-fix/sort-keys-fix */
export const Avatar = Object.assign(AvatarRoot, {
  Root: AvatarRoot,
  Image: AvatarImage,
  Fallback: AvatarFallback,
});
/* eslint-enable sort-keys, sort-keys-fix/sort-keys-fix */

/* -------------------------------------------------------------------------------------------------
 * Named Components
 * -----------------------------------------------------------------------------------------------*/
export {AvatarRoot, AvatarImage, AvatarFallback};

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
export type {ImageLoadingStatus} from "../../composables/use-image-loading-status";

/* -------------------------------------------------------------------------------------------------
 * Variants
 * -----------------------------------------------------------------------------------------------*/
export {avatarVariants} from "@heroui/styles";

export type {AvatarVariants} from "@heroui/styles";
