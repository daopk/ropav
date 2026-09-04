import { tv } from "../../tv";

/**
 * The parts a windowed collection draws for itself, whichever collection it is.
 *
 * Only the scrollbar so far: a table and a listbox hide the native one and draw this in its place,
 * so a dragged thumb moves the rows and the scroll offset together.
 */
export const virtualizerVariants = tv({
  slots: {
    scrollbar: "virtualizer__scrollbar",
    scrollbarThumb: "virtualizer__scrollbar-thumb",
    scrollbarTrack: "virtualizer__scrollbar-track",
  },
});
