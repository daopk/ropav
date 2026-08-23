import type { CollectionKey, UseCollectionReturn } from "../../composables/use-collection";
import type { UseFieldIdsReturn } from "../../composables/use-field-ids";
import type { UseListKeyboardReturn } from "../../composables/use-list-keyboard";
import type { UseSelectionManagerReturn } from "../../composables/use-selection-manager";
import type { UseTypeaheadReturn } from "../../composables/use-typeahead";
import type { TagVariants, tagGroupVariants } from "@ropav/styles";
import type { ComputedRef, ShallowRef } from "vue";

import { createContext } from "../../utils/create-context";

export interface TagGroupContext {
  slots: ComputedRef<ReturnType<typeof tagGroupVariants>>;
  /** Size and variant live on the group: every tag in a group looks the same. */
  size: ComputedRef<TagVariants["size"]>;
  variant: ComputedRef<TagVariants["variant"]>;
  collection: UseCollectionReturn;
  selection: UseSelectionManagerReturn;
  keyboard: UseListKeyboardReturn;
  /** The list's id, which tag ids are derived from. */
  listId: ComputedRef<string>;
  collectionId: ComputedRef<string>;
  /** Whether tags may be removed at all, which is what shows the remove button. */
  allowsRemoving: ComputedRef<boolean>;
  removeKeys: (keys: Iterable<CollectionKey>) => void;
  typeahead: UseTypeaheadReturn;
  /** The list element, which the group creates but the list fills in. */
  listElement: ShallowRef<HTMLElement | null>;
  /** Ids the group's label and help text claimed, for the list to point at. */
  fieldIds: UseFieldIdsReturn;
}

/** Strict: a tag outside a group has no collection to join and no size to take. */
export const [useTagGroupContext, provideTagGroupContext] = createContext<TagGroupContext>({
  name: "TagGroupContext",
});
