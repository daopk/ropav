import type { InjectionKey } from 'vue';
import type { AccordionContext } from './types';

export const accordionKey = Symbol('accordion') as InjectionKey<AccordionContext>;
