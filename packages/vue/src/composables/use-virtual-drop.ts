import type {ComputedRef} from "vue";

import {computed} from "vue";

import {DROP_DESCRIPTION} from "../utils/dnd-messages";

import {useDragSession} from "./drag-manager";
import {useDragModality} from "./drag-modality";
import {useDescription} from "./use-description";

export interface UseVirtualDropReturn {
  /** Attributes for the drop target. Never carries a listener — see the note on `handlers`. */
  attrs: ComputedRef<{"aria-describedby": string | undefined}>;
  handlers: {onClick: () => void};
}

/**
 * The screen reader half of a drop target, ported from React Aria's `useVirtualDrop`.
 *
 * All it contributes is a description telling the user how to drop — but only while a drag is
 * actually in flight, so a page at rest is not littered with instructions for a gesture nobody
 * is performing.
 */
export const useVirtualDrop = (): UseVirtualDropReturn => {
  const modality = useDragModality();
  const session = useDragSession();
  const {describedBy} = useDescription(() =>
    session.value ? DROP_DESCRIPTION[modality.value] : "",
  );

  return {
    attrs: computed(() => ({"aria-describedby": describedBy.value})),
    handlers: {
      /**
       * Deliberately empty, and deliberately present.
       *
       * Mobile Safari does not bubble click events from an ordinary element unless that element
       * has a click handler bound directly to it, and the drag session listens for clicks at the
       * document. Without this, a screen reader drop would never be seen.
       *
       * @see https://www.quirksmode.org/blog/archives/2010/09/click_event_del.html
       */
      onClick: () => {},
    },
  };
};
