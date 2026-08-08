import type {AvatarVariants} from "@heroui/styles";

export interface AvatarRootProps {
  class?: string;
  /** Fallback color. */
  color?: AvatarVariants["color"];
  /** Avatar size. @default "md" */
  size?: AvatarVariants["size"];
  /** Avatar variant. */
  variant?: AvatarVariants["variant"];
}

export interface AvatarImageProps {
  class?: string;
  /** Alternative text, forwarded to the rendered `img`. */
  alt?: string;
  /** Forwarded to the probe image so the request matches the rendered one. */
  crossOrigin?: "" | "anonymous" | "use-credentials";
  /** Native `loading` behaviour. */
  loading?: "eager" | "lazy";
  /** Forwarded to the probe image. */
  referrerPolicy?: ReferrerPolicy;
  /** Responsive size hints. */
  sizes?: string;
  /** Image source. */
  src?: string;
  /** Responsive source set. Rendered as the `srcset` attribute. */
  srcSet?: string;
}

export interface AvatarFallbackProps {
  class?: string;
  /** Overrides the fallback color inherited from the root. */
  color?: AvatarVariants["color"];
}
