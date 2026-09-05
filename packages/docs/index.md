---
layout: home

hero:
  name: Ropav
  text: Vue components that render without a virtual DOM
  tagline: Built on Vapor Mode and Tailwind CSS 4, with the accessibility layer ported from React Aria.
  actions:
    - theme: brand
      text: Get started
      link: /guide/installation
    - theme: alt
      text: Components
      link: /components/
    - theme: alt
      text: GitHub
      link: https://github.com/daopk/ropav

features:
  - title: Vapor Mode, per component
    details: Every component compiles to direct DOM operations rather than to a virtual DOM tree. It is opt-in per file, so a Vapor component drops into an application that is not.
    link: /guide/vapor
    linkText: How it works
  - title: Behaviour ported, not approximated
    details: Focus management, keyboard interaction, collections and internationalisation are re-implemented from React Aria rather than guessed at — including the parts that only show up on a screen reader.
    link: /guide/accessibility
    linkText: What that covers
  - title: Themes on two axes
    details: A palette on the element and light or dark on the same one, so both change independently. Every bundled theme ships as tokens you can read, extend or replace.
    link: /theming/
    linkText: Theming
  - title: Composed from parts
    details: A select is a trigger with a list box inside it. Nothing hides its insides behind a wall of props, so the thing you need to change is a part you can reach.
    link: /components/select
    linkText: See one
  - title: Styles you can reach from outside
    details: State is published on data attributes and colours go through custom properties, so a single state can be retuned without a wrapper, a fork, or an important.
    link: /theming/state-colors
    linkText: State colors
  - title: Calendars beyond Gregorian
    details: Buddhist, Hebrew, Islamic, Japanese and the rest are one opt-in away, and stay out of the bundle until you ask — so a project that never leaves Gregorian never carries them.
    link: /guide/calendar-systems
    linkText: Calendar systems
---
