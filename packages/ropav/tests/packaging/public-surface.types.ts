import type {
  AnyCalendarState,
  CalendarHeadingFormatOptions,
  CalendarYearPickerFormatOptions,
  DateRange,
  ImageLoadingStatus,
  InputOTPTextAlign,
  MenuTriggerType,
  NumberFieldStepper,
  PushPasswordManagerStrategy,
  RangeCalendarCommitBehavior,
  SidebarCollapsible,
  SidebarState,
  SplitterState,
  TableColumnSize,
  Timer,
  ToolbarOrientation,
  UseCalendarReturn,
  UseComboBoxReturn,
  UseDisclosureGroupNavigationOptions,
  UseDisclosureGroupNavigationReturn,
  UseDraggableCollectionStateReturn,
  UseDroppableCollectionStateReturn,
  UseNumberFieldReturn,
  UseSelectReturn,
} from "@/index";

/*
 * Types that a public prop names and the composables barrel does not carry, pinned by naming them.
 *
 * `composables.test.ts` finds these by reading source, which catches the barrel line going missing.
 * It cannot catch the symbol failing to resolve for a consumer, and structural typing hides that:
 * `DropdownRootProps["trigger"]` compiles whether or not `MenuTriggerType` is exported. The pain a
 * consumer actually feels is `const trigger: MenuTriggerType`, so the only proof is a file that
 * names the type and asks the compiler to resolve it from the package entry.
 *
 * Covered by `pnpm typecheck`, which includes `tests`, and never shipped — `tsconfig.build.json`
 * takes `src` alone. One entry per type, keyed by the component whose barrel carries it. A type
 * appears twice when two components' props both name it; each subpath has to carry its own.
 */
export interface HostExportedTypes {
  "autocomplete: UseSelectReturn": UseSelectReturn;
  "avatar: ImageLoadingStatus": ImageLoadingStatus;
  "calendar-year-picker: CalendarYearPickerFormatOptions": CalendarYearPickerFormatOptions;
  "calendar: AnyCalendarState": AnyCalendarState;
  "calendar: CalendarHeadingFormatOptions": CalendarHeadingFormatOptions;
  "calendar: UseCalendarReturn": UseCalendarReturn;
  "combo-box: UseComboBoxReturn": UseComboBoxReturn;
  "date-range-picker: DateRange": DateRange;
  "disclosure-group: UseDisclosureGroupNavigationOptions": UseDisclosureGroupNavigationOptions;
  "disclosure-group: UseDisclosureGroupNavigationReturn": UseDisclosureGroupNavigationReturn;
  "dropdown: MenuTriggerType": MenuTriggerType;
  "input-otp: InputOTPTextAlign": InputOTPTextAlign;
  "input-otp: PushPasswordManagerStrategy": PushPasswordManagerStrategy;
  "list-box: UseDraggableCollectionStateReturn": UseDraggableCollectionStateReturn;
  "list-box: UseDroppableCollectionStateReturn": UseDroppableCollectionStateReturn;
  "number-field: NumberFieldStepper": NumberFieldStepper;
  "number-field: UseNumberFieldReturn": UseNumberFieldReturn;
  "range-calendar: RangeCalendarCommitBehavior": RangeCalendarCommitBehavior;
  "sidebar: SidebarCollapsible": SidebarCollapsible;
  "sidebar: SidebarState": SidebarState;
  "splitter: SplitterState": SplitterState;
  "table: TableColumnSize": TableColumnSize;
  "toast: Timer": Timer;
  "toolbar: ToolbarOrientation": ToolbarOrientation;
}
