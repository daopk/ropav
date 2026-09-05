import type { Component } from "vue";

import {
  Alert,
  AlertContent,
  AlertDescription,
  AlertIndicator,
  AlertTitle,
  Button,
  Switch,
  SwitchContent,
  SwitchControl,
  SwitchThumb,
} from "ropav";

/**
 * The only module that names a library part, so a catalogue entry can stay data. A tag the
 * catalogue uses has to be listed here.
 */
export const parts: Record<string, Component> = {
  Alert,
  AlertContent,
  AlertDescription,
  AlertIndicator,
  AlertTitle,
  Button,
  Switch,
  SwitchContent,
  SwitchControl,
  SwitchThumb,
};
