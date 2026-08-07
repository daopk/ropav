import type {CollectionKey} from "../../composables/use-collection";
import type {
  DisabledBehavior,
  SelectionBehavior,
  SelectionMode,
} from "../../composables/use-selection-manager";
import type {ListBoxVariants} from "@heroui/styles";

export interface ListBoxRootProps {
  class?: string;
  /** Whether one, many or no items can be selected. @default "none" */
  selectionMode?: SelectionMode;
  /** What a press means when several items can be selected. @default "toggle" */
  selectionBehavior?: SelectionBehavior;
  /** Selected keys, for controlled use. */
  selectedKeys?: "all" | Iterable<CollectionKey>;
  /** Selected keys the listbox starts with. */
  defaultSelectedKeys?: "all" | Iterable<CollectionKey>;
  /** Keys that cannot be selected, and by default cannot be focused either. */
  disabledKeys?: Iterable<CollectionKey>;
  /** Whether a disabled key is also unfocusable. @default "all" */
  disabledBehavior?: DisabledBehavior;
  /** Whether the listbox must always keep something selected. */
  disallowEmptySelection?: boolean;
  /** Visual variant. */
  variant?: ListBoxVariants["variant"];
}
