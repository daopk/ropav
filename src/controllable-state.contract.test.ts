import { describe, expect, it } from 'vitest';
import { defineComponent, h, shallowRef, type ShallowRef } from 'vue';

import { click, flush, mountDom, waitForAssertion } from '../tests/utils/vue';
import { useDelayedOpen } from './internal/composables/useDelayedOpen';
import Alert from './components/alert/alert.vue';
import DialogRoot from './components/dialog/dialog-root.vue';
import DropdownMenuCheckboxItem from './components/dropdown-menu/dropdown-menu-checkbox-item.vue';
import DropdownMenuContent from './components/dropdown-menu/dropdown-menu-content.vue';
import DropdownMenuRadioGroup from './components/dropdown-menu/dropdown-menu-radio-group.vue';
import DropdownMenuRadioItem from './components/dropdown-menu/dropdown-menu-radio-item.vue';
import DropdownMenuRoot from './components/dropdown-menu/dropdown-menu-root.vue';
import DropdownMenuSub from './components/dropdown-menu/dropdown-menu-sub.vue';
import NumberInput from './components/number-input/number-input.vue';
import Select from './components/select/select.vue';
import Toast from './components/toast/toast.vue';
import { useAccordion } from './components/accordion/useAccordion';
import { useCollapse } from './components/collapse/useCollapse';
import { useDropdownMenu } from './components/dropdown-menu/useDropdownMenu';
import { useHoverDisclosure } from './components/floating/useHoverDisclosure';
import { useModal } from './components/modal/useModal';
import { usePopover } from './components/popover/usePopover';
import { useRadioGroup } from './components/radio/useRadio';
import { useTabs } from './components/tabs/useTabs';
import { useToastState } from './components/toast/useToastState';
import type { AccordionModelValue, AccordionProps } from './components/accordion/types';
import type {
    DropdownMenuCheckedState,
    DropdownMenuItemValue,
    DropdownMenuProps,
} from './components/dropdown-menu/types';
import type { ModalProps } from './components/modal/types';
import type { PopoverProps } from './components/popover/types';
import type { RadioGroupProps } from './components/radio/types';
import type { TabsProps, TabsValue } from './components/tabs/types';

interface ContractHarness {
    initial: unknown;
    requested: unknown;
    accepted: unknown;
    updates: unknown[];
    read: () => unknown;
    request: () => void;
    setControlled: (value: unknown | undefined) => void;
}

interface ContractCase {
    name: string;
    mount: () => ContractHarness;
}

function noop() {}

function mountHeadlessContract<T>(options: {
    initial: T;
    requested: T;
    accepted: T;
    setup: (
        controlled: ShallowRef<T | undefined>,
        onUpdate: (value: T) => void,
    ) => Pick<ContractHarness, 'read' | 'request'>;
}): ContractHarness {
    const controlled = shallowRef<T | undefined>(options.initial);
    const updates: T[] = [];
    let state!: Pick<ContractHarness, 'read' | 'request'>;

    mountDom(
        defineComponent({
            setup() {
                state = options.setup(controlled, (value) => updates.push(value));
                return () => h('div');
            },
        }),
    );

    return {
        initial: options.initial,
        requested: options.requested,
        accepted: options.accepted,
        updates,
        read: () => state.read(),
        request: () => state.request(),
        setControlled(value) {
            controlled.value = value as T | undefined;
        },
    };
}

function mountDialogContract(): ContractHarness {
    const controlled = shallowRef<boolean>();
    controlled.value = true;
    const updates: boolean[] = [];
    let current = false;
    let close: () => void = noop;

    mountDom(
        defineComponent({
            setup() {
                return () =>
                    h(
                        DialogRoot,
                        {
                            open: controlled.value,
                            defaultOpen: false,
                            'onUpdate:open': (open: boolean) => updates.push(open),
                        },
                        {
                            default: (slot: { isOpen: boolean; close: () => void }) => {
                                current = slot.isOpen;
                                close = slot.close;
                                return h('span');
                            },
                        },
                    );
            },
        }),
    );

    return {
        initial: true,
        requested: false,
        accepted: false,
        updates,
        read: () => current,
        request: () => close(),
        setControlled(value) {
            controlled.value = value as boolean | undefined;
        },
    };
}

function mountAlertContract(): ContractHarness {
    const controlled = shallowRef<boolean>();
    controlled.value = true;
    const updates: boolean[] = [];
    const container = mountDom(
        defineComponent({
            setup() {
                return () =>
                    h(
                        Alert,
                        {
                            open: controlled.value,
                            closable: true,
                            'onUpdate:open': (open: boolean) => updates.push(open),
                        },
                        () => 'Alert',
                    );
            },
        }),
    );

    return {
        initial: true,
        requested: false,
        accepted: false,
        updates,
        read: () => Boolean(container.querySelector('.rp-alert')),
        request: () => click(container.querySelector('.rp-alert__close')!),
        setControlled(value) {
            controlled.value = value as boolean | undefined;
        },
    };
}

function mountToastContract(): ContractHarness {
    const controlled = shallowRef<boolean>();
    controlled.value = true;
    const updates: boolean[] = [];
    const container = mountDom(
        defineComponent({
            setup() {
                return () =>
                    h(
                        Toast,
                        {
                            open: controlled.value,
                            closable: true,
                            duration: 0,
                            'onUpdate:open': (open: boolean) => updates.push(open),
                        },
                        () => 'Toast',
                    );
            },
        }),
    );

    return {
        initial: true,
        requested: false,
        accepted: false,
        updates,
        read: () => Boolean(container.querySelector('.rp-toast')),
        request: () => click(container.querySelector('.rp-toast__close')!),
        setControlled(value) {
            controlled.value = value as boolean | undefined;
        },
    };
}

function mountDropdownRootContract(): ContractHarness {
    const controlled = shallowRef<boolean>();
    controlled.value = true;
    const updates: boolean[] = [];
    let current = false;
    let close: () => void = noop;

    mountDom(
        defineComponent({
            setup() {
                return () =>
                    h(
                        DropdownMenuRoot,
                        {
                            open: controlled.value,
                            defaultOpen: false,
                            modal: false,
                            'onUpdate:open': (open: boolean) => updates.push(open),
                        },
                        {
                            default: (slot: { isOpen: boolean; close: () => void }) => {
                                current = slot.isOpen;
                                close = slot.close;
                                return h('span');
                            },
                        },
                    );
            },
        }),
    );

    return {
        initial: true,
        requested: false,
        accepted: false,
        updates,
        read: () => current,
        request: () => close(),
        setControlled(value) {
            controlled.value = value as boolean | undefined;
        },
    };
}

function mountDropdownSubContract(): ContractHarness {
    const controlled = shallowRef<boolean>();
    controlled.value = true;
    const updates: boolean[] = [];
    let current = false;
    let close: () => void = noop;

    mountDom(
        defineComponent({
            setup() {
                return () =>
                    h(
                        DropdownMenuRoot,
                        { defaultOpen: true, modal: false },
                        {
                            default: () =>
                                h(
                                    DropdownMenuContent,
                                    { flip: false, shift: false },
                                    {
                                        default: () =>
                                            h(
                                                DropdownMenuSub,
                                                {
                                                    open: controlled.value,
                                                    defaultOpen: false,
                                                    'onUpdate:open': (open: boolean) =>
                                                        updates.push(open),
                                                },
                                                {
                                                    default: (slot: {
                                                        isOpen: boolean;
                                                        close: () => void;
                                                    }) => {
                                                        current = slot.isOpen;
                                                        close = slot.close;
                                                        return h('span');
                                                    },
                                                },
                                            ),
                                    },
                                ),
                        },
                    );
            },
        }),
    );

    return {
        initial: true,
        requested: false,
        accepted: false,
        updates,
        read: () => current,
        request: () => close(),
        setControlled(value) {
            controlled.value = value as boolean | undefined;
        },
    };
}

function mountDropdownCheckboxContract(): ContractHarness {
    const controlled = shallowRef<DropdownMenuCheckedState>();
    controlled.value = true;
    const updates: DropdownMenuCheckedState[] = [];
    const container = mountDom(
        defineComponent({
            setup() {
                return () =>
                    h(
                        DropdownMenuRoot,
                        { defaultOpen: true, modal: false },
                        {
                            default: () =>
                                h(
                                    DropdownMenuContent,
                                    { flip: false, shift: false },
                                    {
                                        default: () =>
                                            h(
                                                DropdownMenuCheckboxItem,
                                                {
                                                    class: 'contract-checkbox',
                                                    modelValue: controlled.value,
                                                    defaultValue: false,
                                                    'onUpdate:modelValue': (
                                                        value: DropdownMenuCheckedState,
                                                    ) => updates.push(value),
                                                },
                                                () => 'Checkbox',
                                            ),
                                    },
                                ),
                        },
                    );
            },
        }),
    );

    return {
        initial: true,
        requested: false,
        accepted: false,
        updates,
        read: () =>
            container.querySelector('.contract-checkbox')?.getAttribute('aria-checked') === 'true',
        request: () => click(container.querySelector('.contract-checkbox')!),
        setControlled(value) {
            controlled.value = value as DropdownMenuCheckedState | undefined;
        },
    };
}

function mountDropdownRadioContract(): ContractHarness {
    const controlled = shallowRef<DropdownMenuItemValue>();
    controlled.value = 'controlled';
    const updates: DropdownMenuItemValue[] = [];
    let current: DropdownMenuItemValue | null = null;
    const container = mountDom(
        defineComponent({
            setup() {
                return () =>
                    h(
                        DropdownMenuRoot,
                        { defaultOpen: true, modal: false },
                        {
                            default: () =>
                                h(
                                    DropdownMenuContent,
                                    { flip: false, shift: false },
                                    {
                                        default: () =>
                                            h(
                                                DropdownMenuRadioGroup,
                                                {
                                                    modelValue: controlled.value,
                                                    defaultValue: 'default',
                                                    'onUpdate:modelValue': (
                                                        value: DropdownMenuItemValue,
                                                    ) => updates.push(value),
                                                },
                                                {
                                                    default: (slot: {
                                                        value: DropdownMenuItemValue | null;
                                                    }) => {
                                                        current = slot.value;
                                                        return [
                                                            h(
                                                                DropdownMenuRadioItem,
                                                                {
                                                                    class: 'contract-requested',
                                                                    value: 'requested',
                                                                },
                                                                () => 'Requested',
                                                            ),
                                                            h(
                                                                DropdownMenuRadioItem,
                                                                { value: 'controlled' },
                                                                () => 'Controlled',
                                                            ),
                                                            h(
                                                                DropdownMenuRadioItem,
                                                                { value: 'accepted' },
                                                                () => 'Accepted',
                                                            ),
                                                        ];
                                                    },
                                                },
                                            ),
                                    },
                                ),
                        },
                    );
            },
        }),
    );

    return {
        initial: 'controlled',
        requested: 'requested',
        accepted: 'accepted',
        updates,
        read: () => current,
        request: () => click(container.querySelector('.contract-requested')!),
        setControlled(value) {
            controlled.value = value as DropdownMenuItemValue | undefined;
        },
    };
}

const contracts: ContractCase[] = [
    {
        name: 'Accordion',
        mount: () =>
            mountHeadlessContract<AccordionModelValue>({
                initial: 'controlled',
                requested: 'requested',
                accepted: 'accepted',
                setup(controlled, onUpdate) {
                    const props: AccordionProps = {
                        get modelValue() {
                            return controlled.value;
                        },
                        defaultValue: 'default',
                    };
                    const accordion = useAccordion(props, onUpdate);
                    return {
                        read: () => accordion.openValues.value[0] ?? null,
                        request: () => accordion.setItemOpen('requested', true),
                    };
                },
            }),
    },
    {
        name: 'Tabs',
        mount: () =>
            mountHeadlessContract<TabsValue | null>({
                initial: 'controlled',
                requested: 'requested',
                accepted: 'accepted',
                setup(controlled, onUpdate) {
                    const props: TabsProps = {
                        get modelValue() {
                            return controlled.value;
                        },
                        defaultValue: 'default',
                    };
                    const tabs = useTabs(props, onUpdate);
                    return {
                        read: () => tabs.selectedValue.value,
                        request: () => tabs.selectValue('requested'),
                    };
                },
            }),
    },
    {
        name: 'Collapse/useCollapse',
        mount: () =>
            mountHeadlessContract({
                initial: true,
                requested: false,
                accepted: false,
                setup(controlled, onUpdate) {
                    const collapse = useCollapse({
                        open: () => controlled.value,
                        onOpenChange: onUpdate,
                    });
                    return { read: () => collapse.isOpen.value, request: collapse.close };
                },
            }),
    },
    {
        name: 'Modal/useModal',
        mount: () =>
            mountHeadlessContract({
                initial: true,
                requested: false,
                accepted: false,
                setup(controlled, onUpdate) {
                    const props: ModalProps = {
                        get open() {
                            return controlled.value;
                        },
                    };
                    const modal = useModal(props, { openChange: onUpdate });
                    return { read: () => modal.isOpen.value, request: () => modal.closeModal() };
                },
            }),
    },
    {
        name: 'Popover/usePopover',
        mount: () =>
            mountHeadlessContract({
                initial: true,
                requested: false,
                accepted: false,
                setup(controlled, onUpdate) {
                    const props: PopoverProps = {
                        get open() {
                            return controlled.value;
                        },
                    };
                    const popover = usePopover(props, onUpdate);
                    return {
                        read: () => popover.isOpen.value,
                        request: popover.closePopover,
                    };
                },
            }),
    },
    {
        name: 'DropdownMenu/useDropdownMenu',
        mount: () =>
            mountHeadlessContract({
                initial: true,
                requested: false,
                accepted: false,
                setup(controlled, onUpdate) {
                    const props: DropdownMenuProps = {
                        get open() {
                            return controlled.value;
                        },
                        items: [],
                    };
                    const menu = useDropdownMenu(props, { openChange: onUpdate });
                    return { read: () => menu.slotProps.value.isOpen, request: () => menu.close() };
                },
            }),
    },
    {
        name: 'Hover disclosure',
        mount: () =>
            mountHeadlessContract({
                initial: true,
                requested: false,
                accepted: false,
                setup(controlled, onUpdate) {
                    const disclosure = useHoverDisclosure({
                        open: () => controlled.value,
                        onOpenChange: (open) => onUpdate(open),
                    });
                    return { read: () => disclosure.isOpen.value, request: disclosure.close };
                },
            }),
    },
    {
        name: 'Toast/useToastState',
        mount: () =>
            mountHeadlessContract({
                initial: true,
                requested: false,
                accepted: false,
                setup(controlled, onUpdate) {
                    const toast = useToastState({
                        open: controlled,
                        defaultOpen: false,
                        onOpenChange: onUpdate,
                    });
                    return { read: () => toast.isOpen.value, request: () => toast.close() };
                },
            }),
    },
    {
        name: 'Tooltip/useDelayedOpen',
        mount: () =>
            mountHeadlessContract({
                initial: true,
                requested: false,
                accepted: false,
                setup(controlled, onUpdate) {
                    const delayed = useDelayedOpen({
                        open: () => controlled.value,
                        onOpenChange: onUpdate,
                    });
                    return { read: () => delayed.isOpen.value, request: delayed.closeImmediate };
                },
            }),
    },
    { name: 'DialogRoot', mount: mountDialogContract },
    { name: 'Alert', mount: mountAlertContract },
    { name: 'Toast', mount: mountToastContract },
    { name: 'DropdownMenuRoot', mount: mountDropdownRootContract },
    { name: 'DropdownMenuSub', mount: mountDropdownSubContract },
    { name: 'DropdownMenuCheckboxItem', mount: mountDropdownCheckboxContract },
    { name: 'DropdownMenuRadioGroup', mount: mountDropdownRadioContract },
];

describe.each(contracts)('$name controllable-state contract', ({ mount }) => {
    it('preserves the latest accepted controlled value when control is released', async () => {
        const contract = mount();
        const settle = async (expected: unknown) => {
            await flush();
            await waitForAssertion(() => {
                expect(contract.read()).toEqual(expected);
            });
        };

        await settle(contract.initial);
        expect(contract.read()).toEqual(contract.initial);

        contract.request();
        await settle(contract.initial);
        expect(contract.read()).toEqual(contract.initial);
        expect(contract.updates).toEqual([contract.requested]);

        contract.setControlled(undefined);
        await settle(contract.initial);
        expect(contract.read()).toEqual(contract.initial);
        expect(contract.updates).toEqual([contract.requested]);

        contract.setControlled(contract.accepted);
        await settle(contract.accepted);
        expect(contract.read()).toEqual(contract.accepted);

        contract.setControlled(undefined);
        await settle(contract.accepted);
        expect(contract.read()).toEqual(contract.accepted);
        expect(contract.updates).toEqual([contract.requested]);
    });

    it('accepts a new request after control is released', async () => {
        const contract = mount();
        const settle = async (expected: unknown) => {
            await flush();
            await waitForAssertion(() => {
                expect(contract.read()).toEqual(expected);
            });
        };

        await settle(contract.initial);
        contract.request();
        await settle(contract.initial);

        contract.setControlled(undefined);
        await settle(contract.initial);

        contract.request();
        await settle(contract.requested);
        expect(contract.read()).toEqual(contract.requested);
        expect(contract.updates).toEqual([contract.requested, contract.requested]);
    });
});

interface NullContractHarness {
    read: () => unknown;
    setControlled: (value: null | undefined) => void;
}

const nullContracts: Array<{
    name: string;
    expectedNullState: unknown;
    mount: () => NullContractHarness;
}> = [
    {
        name: 'NumberInput',
        expectedNullState: '',
        mount() {
            const controlled = shallowRef<number | null | undefined>(12);
            const container = mountDom(
                defineComponent({
                    setup() {
                        return () =>
                            h(NumberInput, {
                                modelValue: controlled.value,
                                defaultValue: 7,
                            });
                    },
                }),
            );
            return {
                read: () => (container.querySelector('input') as HTMLInputElement).value,
                setControlled: (value) => {
                    controlled.value = value;
                },
            };
        },
    },
    {
        name: 'RadioGroup',
        expectedNullState: null,
        mount() {
            const controlled = shallowRef<string | number | null | undefined>('apple');
            let read = () => controlled.value;
            mountDom(
                defineComponent({
                    setup() {
                        const props: RadioGroupProps = {
                            get modelValue() {
                                return controlled.value;
                            },
                            defaultValue: 'banana',
                        };
                        const group = useRadioGroup(props, () => undefined);
                        read = () => group.value.value;
                        return () => h('div');
                    },
                }),
            );
            return {
                read: () => read(),
                setControlled: (value) => {
                    controlled.value = value;
                },
            };
        },
    },
    {
        name: 'Select',
        expectedNullState: 'Pick a fruit',
        mount() {
            const controlled = shallowRef<string | number | null | undefined>('apple');
            const container = mountDom(
                defineComponent({
                    setup() {
                        return () =>
                            h(Select, {
                                modelValue: controlled.value,
                                defaultValue: 'banana',
                                placeholder: 'Pick a fruit',
                                options: [
                                    { label: 'Apple', value: 'apple' },
                                    { label: 'Banana', value: 'banana' },
                                ],
                            });
                    },
                }),
            );
            return {
                read: () => container.querySelector('.rp-select__value')?.textContent?.trim(),
                setControlled: (value) => {
                    controlled.value = value;
                },
            };
        },
    },
];

describe.each(nullContracts)(
    '$name null controlled-value contract',
    ({ expectedNullState, mount }) => {
        it('treats null as controlled and preserves it when control is released', async () => {
            const contract = mount();
            await flush();

            contract.setControlled(null);
            await flush();
            const nullState = contract.read();
            expect(nullState).toEqual(expectedNullState);

            contract.setControlled(undefined);
            await flush();
            expect(contract.read()).toEqual(nullState);
        });
    },
);
