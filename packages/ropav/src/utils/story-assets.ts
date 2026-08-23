/**
 * Placeholder images for the stories.
 *
 * Every image a story shows is generated on demand by a public placeholder service rather than
 * served from a bucket this repo owns, so a story stays runnable without an asset pipeline behind
 * it. Each helper is a pure function of its seed — the same seed always resolves to the same
 * image — which is what keeps a story stable between runs and a visual diff readable.
 *
 * Story-only, so it is deliberately not re-exported from `utils/index.ts`.
 */

/** A square portrait for `seed`, from pravatar.cc. */
export const avatarSrc = (seed: number | string, size = 400) =>
  `https://i.pravatar.cc/${size}?u=ropav-${seed}`;

/** A photo for `seed` at `width` × `height`, from picsum.photos. */
export const photoSrc = (seed: string, width: number, height: number) =>
  `https://picsum.photos/seed/${seed}/${width}/${height}`;

/** A scannable QR code carrying `data`, from api.qrserver.com. */
export const qrCodeSrc = (data: string, size = 240) =>
  `https://api.qrserver.com/v1/create-qr-code/?size=${size}x${size}&data=${encodeURIComponent(data)}`;

/**
 * One Iconify icon as an `<img>` source, for the places a story needs a URL rather than a component.
 *
 * `name` is `prefix:icon`. The default colour is the neutral grey that reads against both the light
 * and the dark theme — an uncoloured Iconify SVG is black, which disappears in dark mode.
 */
export const iconSrc = (name: string, color = "#888888") =>
  `https://api.iconify.design/${name}.svg?color=${encodeURIComponent(color)}`;
