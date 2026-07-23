import { describe, expect, it } from 'vitest';
import { defineComponent, h, nextTick, ref, type Ref } from 'vue';
import { waitForDropdownClose } from '../../../tests/fixtures/dropdown-menu';
import { flush, keydown, mountDom } from '../../../tests/utils/vue';
import {
    DropdownMenuContent,
    DropdownMenuItem as DropdownMenuItemPrimitive,
    DropdownMenuRoot,
    DropdownMenuSub,
    DropdownMenuSubContent,
    DropdownMenuSubTrigger,
    DropdownMenuTrigger,
} from './dropdown-menu-primitives';
import DropdownMenu from './dropdown-menu.vue';
import type { DropdownMenuItem, DropdownMenuSelectEvent, DropdownMenuSlotProps } from './types';

type ContractItem = DropdownMenuItem & {
    id: string;
    children?: ContractItem[];
};

type ContractHarness = {
    container: HTMLElement;
    items: Ref<ContractItem[]>;
    trigger: () => HTMLElement;
    menu: () => HTMLElement;
    activeText: () => string | undefined;
};

type MountContract = (initialItems: ContractItem[], cancelSelection?: boolean) => ContractHarness;

function createItems(...items: Array<Omit<ContractItem, 'value'> & { value?: string }>) {
    return items.map((item) => Object.assign({}, item, { value: item.value ?? item.id }));
}

function getActiveText(menu: HTMLElement) {
    const activeId = menu.getAttribute('aria-activedescendant');
    return activeId ? document.getElementById(activeId)?.textContent?.trim() : undefined;
}

function getDataContractMenu() {
    return document.getElementById('interaction-contract-data') as HTMLElement;
}

const mountDataContract: MountContract = (initialItems, cancelSelection = false) => {
    const items = ref(initialItems);
    const container = mountDom(
        defineComponent({
            setup() {
                return () =>
                    h(
                        DropdownMenu,
                        {
                            id: 'interaction-contract-data',
                            items: items.value,
                            modal: false,
                            onSelect: (_item: DropdownMenuItem, event: DropdownMenuSelectEvent) => {
                                if (cancelSelection) event.preventDefault();
                            },
                        },
                        {
                            default: ({ triggerProps }: DropdownMenuSlotProps) =>
                                h(
                                    'button',
                                    { class: 'contract-trigger', ...triggerProps },
                                    'Actions',
                                ),
                        },
                    );
            },
        }),
    );

    return {
        container,
        items,
        trigger: () => container.querySelector('.contract-trigger') as HTMLElement,
        menu: getDataContractMenu,
        activeText: () => getActiveText(getDataContractMenu()),
    };
};

function renderCompoundItems(
    items: ContractItem[],
    cancelSelection: boolean,
): Array<ReturnType<typeof h>> {
    return items.map((item) => {
        if (item.children?.length) {
            return h(
                DropdownMenuSub,
                { key: item.id },
                {
                    default: () => [
                        h(
                            DropdownMenuSubTrigger,
                            {
                                id: `interaction-contract-compound-${item.id}`,
                                disabled: item.disabled,
                                textValue: item.label,
                            },
                            () => item.label,
                        ),
                        h(
                            DropdownMenuSubContent,
                            {
                                id: `interaction-contract-compound-${item.id}-menu`,
                                flip: false,
                                shift: false,
                            },
                            () => renderCompoundItems(item.children ?? [], cancelSelection),
                        ),
                    ],
                },
            );
        }

        return h(
            DropdownMenuItemPrimitive,
            {
                key: item.id,
                id: `interaction-contract-compound-${item.id}`,
                disabled: item.disabled,
                textValue: item.label,
                value: item.value,
                onSelect: (event: DropdownMenuSelectEvent) => {
                    if (cancelSelection) event.preventDefault();
                },
            },
            () => item.label,
        );
    });
}

const mountCompoundContract: MountContract = (initialItems, cancelSelection = false) => {
    const items = ref(initialItems);
    const container = mountDom(
        defineComponent({
            setup() {
                return () =>
                    h(
                        DropdownMenuRoot,
                        { modal: false },
                        {
                            default: () => [
                                h(
                                    DropdownMenuTrigger,
                                    { class: 'contract-trigger' },
                                    () => 'Actions',
                                ),
                                h(
                                    DropdownMenuContent,
                                    {
                                        id: 'interaction-contract-compound',
                                        flip: false,
                                        shift: false,
                                    },
                                    () => renderCompoundItems(items.value, cancelSelection),
                                ),
                            ],
                        },
                    );
            },
        }),
    );

    const menu = () => container.querySelector('#interaction-contract-compound') as HTMLElement;
    return {
        container,
        items,
        trigger: () => container.querySelector('.contract-trigger') as HTMLElement,
        menu,
        activeText: () => getActiveText(menu()),
    };
};

const adapters = [
    { name: 'data adapter', mount: mountDataContract },
    { name: 'compound adapter', mount: mountCompoundContract },
];

describe.each(adapters)('$name Dropdown Menu interaction contract', ({ mount }) => {
    it('shares trigger, navigation, disabled-item, Home, End, and typeahead behavior', async () => {
        const harness = mount(
            createItems(
                { id: 'alpha', label: 'Alpha' },
                { id: 'disabled', label: 'Disabled', disabled: true },
                { id: 'beta', label: 'Beta' },
                { id: 'bravo', label: 'Bravo' },
            ),
        );

        keydown(harness.trigger(), 'ArrowDown');
        await flush();
        expect(harness.activeText()).toBe('Alpha');

        keydown(harness.menu(), 'ArrowDown');
        await nextTick();
        expect(harness.activeText()).toBe('Beta');

        keydown(harness.menu(), 'End');
        await nextTick();
        expect(harness.activeText()).toBe('Bravo');

        keydown(harness.menu(), 'Home');
        await nextTick();
        expect(harness.activeText()).toBe('Alpha');

        keydown(harness.menu(), 'b');
        await nextTick();
        expect(harness.activeText()).toBe('Beta');
    });

    it('closes a stale all-disabled submenu when root typeahead matches a sibling', async () => {
        const harness = mount(
            createItems(
                {
                    id: 'move',
                    label: 'Move to',
                    children: createItems(
                        { id: 'backlog', label: 'Backlog', disabled: true },
                        { id: 'done', label: 'Done', disabled: true },
                    ),
                },
                { id: 'archive', label: 'Archive' },
            ),
        );

        keydown(harness.trigger(), 'ArrowDown');
        await flush();
        keydown(harness.menu(), 'ArrowRight');
        await flush();
        expect(document.querySelectorAll('[role="menu"]')).toHaveLength(2);

        keydown(harness.menu(), 'a');
        await flush();

        expect(document.querySelectorAll('[role="menu"]')).toHaveLength(1);
        expect(harness.activeText()).toBe('Archive');
    });

    it('keeps identity through reorder and chooses the next then previous enabled neighbor', async () => {
        const [alpha, beta, charlie] = createItems(
            { id: 'alpha', label: 'Alpha' },
            { id: 'beta', label: 'Beta' },
            { id: 'charlie', label: 'Charlie' },
        );
        const harness = mount([alpha!, beta!, charlie!]);

        keydown(harness.trigger(), 'ArrowDown');
        await flush();
        keydown(harness.menu(), 'ArrowDown');
        await nextTick();
        expect(harness.activeText()).toBe('Beta');

        harness.items.value = [charlie!, beta!, alpha!];
        await flush();
        expect(harness.activeText()).toBe('Beta');

        const activeBeta = harness.items.value.find((item) => item.id === 'beta');
        if (activeBeta) activeBeta.disabled = true;
        await flush();
        expect(harness.activeText()).toBe('Alpha');

        harness.items.value = [charlie!, beta!];
        await flush();
        expect(harness.activeText()).toBe('Charlie');
    });

    it('honors cancelable selection and then dismisses on an outside pointer', async () => {
        const harness = mount(createItems({ id: 'alpha', label: 'Alpha' }), true);

        keydown(harness.trigger(), 'ArrowDown');
        await flush();
        keydown(harness.menu(), 'Enter');
        await flush();
        expect(harness.menu()).not.toBeNull();

        document.body.dispatchEvent(new Event('pointerdown', { bubbles: true, cancelable: true }));
        await waitForDropdownClose();
    });
});
