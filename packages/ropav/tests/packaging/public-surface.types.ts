import type {
  AnyCalendarState,
  CalendarHeadingFormatOptions,
  CalendarSelectionMode,
  CalendarValue,
  CalendarYearPickerFormatOptions,
  CheckboxGroupState,
  ComboBoxFilter,
  ComboBoxMenuTrigger,
  ComboBoxValidationValue,
  DateRange,
  DateSegment,
  DisclosureKey,
  ImageLoadingStatus,
  InputOTPTextAlign,
  MenuTriggerType,
  NumberFieldCommitBehavior,
  NumberFieldStepper,
  PageBehavior,
  PushPasswordManagerStrategy,
  RadioGroupState,
  RangeCalendarCommitBehavior,
  RootMenuTriggerState,
  SelectSelectionMode,
  SelectedItem,
  SelectedValue,
  SelectionAlignment,
  SidebarCollapsibleMode,
  SidebarState,
  SliderOrientation,
  SplitterState,
  TableColumnSize,
  TimeGranularity,
  Timer,
  ToggleGroupKey,
  ToggleGroupSelectionMode,
  ToolbarOrientation,
  TooltipTriggerState,
  UseCalendarReturn,
  UseComboBoxReturn,
  UseComboBoxStateReturn,
  UseDisclosureGroupNavigationOptions,
  UseDisclosureGroupNavigationReturn,
  UseDisclosureGroupReturn,
  UseDraggableCollectionStateReturn,
  UseDroppableCollectionStateReturn,
  UseNumberFieldReturn,
  UseSelectReturn,
  UseSelectStateReturn,
  UseSingleSelectListStateReturn,
  UseTabListStateReturn,
  UseToggleGroupStateReturn,
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
  "calendar: CalendarSelectionMode": CalendarSelectionMode;
  "calendar: CalendarValue": CalendarValue;
  "calendar: PageBehavior": PageBehavior;
  "calendar: SelectionAlignment": SelectionAlignment;
  "calendar: UseCalendarReturn": UseCalendarReturn;
  "checkbox-group: CheckboxGroupState": CheckboxGroupState;
  "combo-box: ComboBoxFilter": ComboBoxFilter;
  "combo-box: ComboBoxMenuTrigger": ComboBoxMenuTrigger;
  "combo-box: ComboBoxValidationValue": ComboBoxValidationValue;
  "combo-box: UseComboBoxReturn": UseComboBoxReturn;
  "combo-box: UseComboBoxStateReturn": UseComboBoxStateReturn<unknown>;
  "date-field: DateSegment": DateSegment;
  "date-range-picker: DateRange": DateRange;
  "disclosure-group: DisclosureKey": DisclosureKey;
  "disclosure-group: UseDisclosureGroupNavigationOptions": UseDisclosureGroupNavigationOptions;
  "disclosure-group: UseDisclosureGroupNavigationReturn": UseDisclosureGroupNavigationReturn;
  "disclosure-group: UseDisclosureGroupReturn": UseDisclosureGroupReturn;
  "dropdown: MenuTriggerType": MenuTriggerType;
  "dropdown: RootMenuTriggerState": RootMenuTriggerState;
  "input-otp: InputOTPTextAlign": InputOTPTextAlign;
  "input-otp: PushPasswordManagerStrategy": PushPasswordManagerStrategy;
  "list-box: UseDraggableCollectionStateReturn": UseDraggableCollectionStateReturn;
  "list-box: UseDroppableCollectionStateReturn": UseDroppableCollectionStateReturn;
  "number-field: NumberFieldCommitBehavior": NumberFieldCommitBehavior;
  "number-field: NumberFieldStepper": NumberFieldStepper;
  "number-field: UseNumberFieldReturn": UseNumberFieldReturn;
  "radio-group: RadioGroupState": RadioGroupState;
  "range-calendar: RangeCalendarCommitBehavior": RangeCalendarCommitBehavior;
  "segmented-control: UseSingleSelectListStateReturn": UseSingleSelectListStateReturn;
  "select: SelectSelectionMode": SelectSelectionMode;
  "select: SelectedItem": SelectedItem<unknown>;
  "select: SelectedValue": SelectedValue;
  "select: UseSelectStateReturn": UseSelectStateReturn<unknown>;
  "sidebar: SidebarCollapsibleMode": SidebarCollapsibleMode;
  "sidebar: SidebarState": SidebarState;
  "slider: SliderOrientation": SliderOrientation;
  "splitter: SplitterState": SplitterState;
  "table: TableColumnSize": TableColumnSize;
  "tabs: UseTabListStateReturn": UseTabListStateReturn;
  "time-field: TimeGranularity": TimeGranularity;
  "toast: Timer": Timer;
  "toggle-button-group: ToggleGroupKey": ToggleGroupKey;
  "toggle-button-group: ToggleGroupSelectionMode": ToggleGroupSelectionMode;
  "toggle-button-group: UseToggleGroupStateReturn": UseToggleGroupStateReturn;
  "toolbar: ToolbarOrientation": ToolbarOrientation;
  "tooltip: TooltipTriggerState": TooltipTriggerState;
}
