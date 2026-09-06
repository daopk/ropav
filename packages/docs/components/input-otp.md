---
title: InputOTP
description: A one-time code, one character per box.
outline: [2, 3]
---

# InputOTP

An OTP field is a row of boxes for a code that arrived by text or email. The boxes are a picture:
underneath there is one hidden input holding the whole code, which is what lets paste, undo and a
password manager all work the way they do in any other field.

```ts
import { InputOTP, InputOTPGroup, InputOTPSeparator, InputOTPSlot } from "ropav";
```

`max-length` decides how long the code is, and each `InputOTPSlot` takes the `index` it displays.
`InputOTPGroup` splits the boxes into runs and `InputOTPSeparator` goes between them.

::: playground input-otp
:::

<Demo title="input-otp-groups.vue">
<DemoInputOtpGroups />

<template #code>

<<< @/.vitepress/theme/demos/input-otp-groups.vue

</template>
</Demo>

## What the code may contain

`pattern` is a regular expression tested against the *whole* value, not one character. Three are
exported ready-made — `REGEXP_ONLY_DIGITS`, `REGEXP_ONLY_CHARS` and
`REGEXP_ONLY_DIGITS_AND_CHARS` — and `input-mode` decides which keyboard a phone offers.

`auto-complete` defaults to `one-time-code`, which is what lets a phone offer the code straight
from the message. Leave it alone unless the code is not one.

`paste-transformer` rewrites pasted text before it is accepted, for stripping the spaces or the
prefix that come with a copied code.

## Accessibility

- There is one control, not six, so a screen reader announces one field and the whole value —
  which is the right unit. Six separate inputs would announce six unlabelled boxes.
- Name it. The boxes carry no text of their own, so `aria-label` or a `Label` is the only thing
  that says what code is being asked for.
- `push-password-manager-strategy` decides how the field gets out of the way of a password
  manager's badge. The default widens the control rather than letting the badge cover a box.
- The separator is decoration and announces nothing — the code is read as one string regardless of
  how the boxes are grouped.

## API

<Api family="input-otp" />
