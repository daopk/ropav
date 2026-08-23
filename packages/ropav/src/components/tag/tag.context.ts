import type {CollectionKey} from "../../composables/use-collection";
import type {tagVariants} from "@ropav/styles";
import type {ComputedRef} from "vue";

import {createContext} from "../../utils/create-context";

export interface TagContext {
  slots: ComputedRef<ReturnType<typeof tagVariants>>;
  /** The key the remove button removes. */
  tagKey: ComputedRef<CollectionKey>;
  remove: () => void;
}

/** Strict: a remove button only means anything as part of a tag. */
export const [useTagContext, provideTagContext] = createContext<TagContext>({name: "TagContext"});
