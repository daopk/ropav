import type {CollectionKey} from "../../composables/use-collection";

export interface TagRootProps {
  class?: string;
  /** The tag's key within the group. Generated when omitted. */
  id?: CollectionKey;
  /** Disables the tag: it can be neither focused nor selected. */
  isDisabled?: boolean;
  /** Text the tag is matched on and announced by. Read from its content when omitted. */
  textValue?: string;
}

export interface TagSlotProps {
  isDisabled: boolean;
  isFocusVisible: boolean;
  isFocused: boolean;
  isHovered: boolean;
  isPressed: boolean;
  isSelected: boolean;
}

export interface TagRemoveButtonProps {
  class?: string;
}
