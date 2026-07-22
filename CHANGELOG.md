## [0.1.6](https://github.com/daopk/ropav/compare/v0.1.5...v0.1.6) (2026-07-22)

### Features

* **a11y:** require accessible names for controls ([ef99692](https://github.com/daopk/ropav/commit/ef99692ee69a9a98d10a5b409ed18f58ba50d487))
* **composables:** expose controllable value utility ([ce4917d](https://github.com/daopk/ropav/commit/ce4917d0974cc145db68be48b44f5c2283ce2ad1))

### Bug Fixes

* **a11y:** improve story labels and reduced motion ([87ff4ad](https://github.com/daopk/ropav/commit/87ff4add412f5b19130d12f81cff208ae4807569))
* **a11y:** pass Storybook theme matrix ([b18101d](https://github.com/daopk/ropav/commit/b18101d952a583614f814e84d878ae25a363f409))
* **ci:** defer consumer fixture typecheck until after build ([974f8c8](https://github.com/daopk/ropav/commit/974f8c86c582f28b8552e37e2e4363b5706318ea))
* **input:** use non-label root for slotted controls ([fc946e6](https://github.com/daopk/ropav/commit/fc946e62cb6b8bc501af32908ac8f0e56daffa0a))
* **package:** preserve SCSS side effects ([57d8ed8](https://github.com/daopk/ropav/commit/57d8ed858542ee230a60dc1e4a054a3f35e3bc9b))
* **scroll-area:** refresh runtime direction changes ([e1e8485](https://github.com/daopk/ropav/commit/e1e84859a77ec6ef44e1890535132f1fc7f072d2))
* **scroll-area:** support horizontal scrolling in RTL ([e172569](https://github.com/daopk/ropav/commit/e172569015952f21b2e76d79260884dbf9b787bb))
* **select:** correct listbox aria ownership ([8186da9](https://github.com/daopk/ropav/commit/8186da9cd3280f61e21e157997e14b99a62aef21))
* **state:** accept requests after control release ([453faab](https://github.com/daopk/ropav/commit/453faab505db590d7e6d19e0dc593a8945e6924e))
* **state:** preserve controlled values on release ([a6b7c6f](https://github.com/daopk/ropav/commit/a6b7c6f0f8dc2be655eda7066a001bdbffe4cbed))
* **tabs:** reconcile selection and rtl navigation ([fd5732d](https://github.com/daopk/ropav/commit/fd5732dbc7575238d66c61621558f4f2b77cd51d))

### Performance Improvements

* **package:** reduce duplicated bundle output ([64b2bbe](https://github.com/daopk/ropav/commit/64b2bbee11d47d2e5c276375b7d6a30990f3c469))

## [0.1.5](https://github.com/daopk/ropav/compare/v0.1.4...v0.1.5) (2026-07-20)

### Features

* add shared typeahead collection navigation ([384826e](https://github.com/daopk/ropav/commit/384826e5b25e781c0d2c48e4b6cf4daea329d6d1))
* **pagination:** add pagination component ([070608c](https://github.com/daopk/ropav/commit/070608c9db386f28cfb2659805db4f86fd353df5))

### Bug Fixes

* **button:** preserve contrast across state changes ([bb4562c](https://github.com/daopk/ropav/commit/bb4562cec1287e0436b77c32150159d1d806fd30))
* **colors:** handle translucent auto contrast ([301f5a6](https://github.com/daopk/ropav/commit/301f5a600001bf3868ac2a0f9703fd98bd1b1419))
* **colors:** improve accessible contrast defaults ([e5c3a21](https://github.com/daopk/ropav/commit/e5c3a214a8694a352dc84d2135fb469c77b7e254))
* **colors:** preserve contrast across interaction states ([8c5d9eb](https://github.com/daopk/ropav/commit/8c5d9eb521e50edf45858266be16394f73ef2c43))
* **dropdown-menu:** close stale submenu after typeahead ([912bbe8](https://github.com/daopk/ropav/commit/912bbe807c84c909b904f2198e36011157eadd23))
* **icons:** avoid vapor setup state for gradients ([346fa24](https://github.com/daopk/ropav/commit/346fa249207ece1347c0fa6805de87baaf8c4737))
* **typeahead:** cycle items with duplicate keys ([314e6c1](https://github.com/daopk/ropav/commit/314e6c1cd7b585e4b563b3b64ce47b36a6285664))
* **typeahead:** normalize locale case before accents ([d5a2566](https://github.com/daopk/ropav/commit/d5a256646add7a2948a5f93ea00716999a437967))
* **typeahead:** support supplementary unicode keys ([94ee50d](https://github.com/daopk/ropav/commit/94ee50d42804b4e575c808ac569525cc606021f5))

## [0.1.4](https://github.com/daopk/ropav/compare/v0.1.3...v0.1.4) (2026-07-19)

### Features

* **scroll-area:** emit boundary events ([dfcac9d](https://github.com/daopk/ropav/commit/dfcac9d147cacca47811aa79e9ea28898eb747b8))

### Bug Fixes

* **package:** update pnpm version to 11.14.0 ([98dd473](https://github.com/daopk/ropav/commit/98dd473c854ccab74685d33c48757d1ed0cac9cc))
* **scroll-area:** accept axis scrollbar props ([33549f7](https://github.com/daopk/ropav/commit/33549f72ad820fc44deac8794e03c8b3d18abe4b))
* **tabs:** correct tablist aria structure ([dbf2c9a](https://github.com/daopk/ropav/commit/dbf2c9a1b9e029afda07423c5fc8cf132da620d8))

## [0.1.3](https://github.com/daopk/ropav/compare/v0.1.2...v0.1.3) (2026-07-19)

### ⚠ BREAKING CHANGES

* **accordion:** Accordion no longer accepts the orientation prop or exports AccordionOrientation.

### Features

* **modal:** use scroll area for body ([63ca5d4](https://github.com/daopk/ropav/commit/63ca5d465c4256e75eb5f0d67cc383fe0927fd9b))
* **scroll-area:** add embedded mode ([6f876da](https://github.com/daopk/ropav/commit/6f876daab9e643d4b5f3923382bb97359556f270))
* **scroll-area:** add scroll area component ([9b1e78f](https://github.com/daopk/ropav/commit/9b1e78f69589029bc2b84cdc4ba1c8c02eaf223f))
* **scroll-area:** support intrinsic height sizing ([90a7693](https://github.com/daopk/ropav/commit/90a76938977d7c735b1caaf22951679933daf6e3))
* **select:** use scroll area for dropdown ([43ea070](https://github.com/daopk/ropav/commit/43ea070a7b6683698fc2119105f68c7ec8f44c6d))
* **tabs:** add scrollable tab list ([49bef7c](https://github.com/daopk/ropav/commit/49bef7c357105794d694a5558650b2b3adfbf88a))

### Bug Fixes

* **accordion:** balance content spacing ([a8df8e0](https://github.com/daopk/ropav/commit/a8df8e05712b2e0c903fdc5d9e5ca44146c704fc))
* **card:** restore padding story demo colors ([0e28736](https://github.com/daopk/ropav/commit/0e28736dc5f2212a3720752fda3a8cae347f2a6b))
* **dialog:** resolve Vapor component element refs ([30a5032](https://github.com/daopk/ropav/commit/30a5032064d20f90d65a5a08ef29885718e3b2e9))
* **number-input:** refine input spacing ([9b067a4](https://github.com/daopk/ropav/commit/9b067a471c63bf685af2bceceddea5773cc0ccd5))
* **select:** close dropdown when focus leaves ([d1d6ba1](https://github.com/daopk/ropav/commit/d1d6ba126cc4430059baec5bde24dffcdfc9ebc9))
* **select:** keep focused options within view ([8a5a9a2](https://github.com/daopk/ropav/commit/8a5a9a29178b7a111ea8f57788748a639490ff1f))

### Code Refactoring

* **accordion:** remove orientation support ([dab0c12](https://github.com/daopk/ropav/commit/dab0c129029e5a80b2b3102e4cd35f64dc4a3a63))

## [0.1.2](https://github.com/daopk/ropav/compare/v0.1.1...v0.1.2) (2026-07-18)

### ⚠ BREAKING CHANGES

* **slider:** replace the thumbStyle prop with thumb and the SliderThumbStyle type with SliderThumbOptions.

### Features

* **icons:** expose Vapor compiler for unplugin-icons ([0fcdf00](https://github.com/daopk/ropav/commit/0fcdf00651b3bfa9f72384e60606e63630cb8f5a))
* **slider:** add custom track layers ([2b0361d](https://github.com/daopk/ropav/commit/2b0361d5fe56df8c9ce3c4d0b023c04f0b9b2f6e))
* **slider:** add thumb visibility modes ([e5df54d](https://github.com/daopk/ropav/commit/e5df54d6e19730464f99b12a72cf9565fc0bda9a))
* **slider:** support media seek controls ([ab6e073](https://github.com/daopk/ropav/commit/ab6e07301d16c64e8bd68cca473d14385c4c89fe))

### Bug Fixes

* **switch:** preserve controlled native state ([8341d45](https://github.com/daopk/ropav/commit/8341d457c0662430db4ba0acfe54f6c3ea514f34))

### Code Refactoring

* **slider:** replace thumb style API ([c430cc9](https://github.com/daopk/ropav/commit/c430cc918b336ea53ded828372ea772edc053fe3))

## [0.1.1](https://github.com/daopk/ropav/compare/v0.1.0...v0.1.1) (2026-07-17)

## [0.1.0](https://github.com/daopk/ropav/compare/v0.0.13...v0.1.0) (2026-07-17)

### ⚠ BREAKING CHANGES

* remove the deprecated compatibility APIs. Replace Card.bodyClass with classNames.body, DropdownMenu.portal with teleport, and DropdownMenu.portalTo with teleportTo. Replace avoidCollisions: false with flip: false and shift: false; the true behavior remains the default. The ropav/legacy-unlayered.css export is removed; import ropav/base.css and use the documented cascade layers instead.

### Features

* **overlay:** support configurable layer z-index ([c136a23](https://github.com/daopk/ropav/commit/c136a23f52f43271a8bb936e559aa1d6d797b3c9))

### Code Refactoring

* remove deprecated compatibility APIs ([1d225bb](https://github.com/daopk/ropav/commit/1d225bbf3f46a47858db2a85a50adc766872b42f))

## [0.0.13](https://github.com/daopk/ropav/compare/v0.0.12...v0.0.13) (2026-07-17)

### Features

* **floating:** expose advanced options on components ([d9f5cd6](https://github.com/daopk/ropav/commit/d9f5cd6ceecedeece683fca0aa254cc955fb2f67))
* **floating:** expose advanced positioning options ([47d509c](https://github.com/daopk/ropav/commit/47d509c8a63cf3ccd48fbadd8c2a81c615ef294f))

## [0.0.12](https://github.com/daopk/ropav/compare/v0.0.11...v0.0.12) (2026-07-16)

### ⚠ BREAKING CHANGES

* **dropdown-menu:** DropdownMenu data-placement now contains the full final placement. Use data-side for side-only selectors.
* **toast:** Toast callbacks now receive replace when a duplicate ID displaces a toast and overflow when the maximum evicts a toast, instead of dismiss.

### Features

* **dialog:** add composable dialog primitives ([43c7f59](https://github.com/daopk/ropav/commit/43c7f597a99b735f4c456e4ad2c990f1d7c34c70))
* **dropdown-menu:** harden outside interactions ([d5f7960](https://github.com/daopk/ropav/commit/d5f7960d6e2cc3482c1052d4bbb23aecb7423ddc))
* **floating:** add hover disclosure interactions ([296dab3](https://github.com/daopk/ropav/commit/296dab30dbd5570a1b6dafaeb23984247c2464ce))
* **floating:** expose positioning composables ([3365151](https://github.com/daopk/ropav/commit/33651517f3ce6e90ecd7f6ffb76f2427c83b8ab4))
* **form-controls:** standardize native form behavior ([f27bb63](https://github.com/daopk/ropav/commit/f27bb638cb3a2e1143aab8e58d5ca25be616c6ad))
* **toast:** add standalone store ([bd24a2b](https://github.com/daopk/ropav/commit/bd24a2bfbc44dbf0a82d1e550ce5f9782bc334bb))

### Bug Fixes

* **dialog:** preserve content ids while closed ([b09f0ae](https://github.com/daopk/ropav/commit/b09f0aeea766da5f88e45ee1c1cce09ccadcbddc))
* **dialog:** reserve overlay z-index planes ([75e3958](https://github.com/daopk/ropav/commit/75e395816bc4b92c8663aa3c9204f6700adc5be7))
* **dropdown-menu:** expose final aligned placement ([3d12a54](https://github.com/daopk/ropav/commit/3d12a5451f578eb1cd95f3e24b8d78b41bce56ce))
* **dropdown-menu:** reset stale virtual reference ([2a7e942](https://github.com/daopk/ropav/commit/2a7e942a96907b18924236e370740b24a15230e2))
* **dropdown-menu:** restore hover background in portals ([a27aad9](https://github.com/daopk/ropav/commit/a27aad92a98e960a5687ba3114d5c78f7ab2742b))
* **dropdown-menu:** support Vapor component hosts ([888de0c](https://github.com/daopk/ropav/commit/888de0c879606cd19a02e1710c4fa5fe52b37f9a))
* **floating:** preserve position during leave transitions ([0047d53](https://github.com/daopk/ropav/commit/0047d5376e0d685301ed5ea79f29a45b0e26f2c4))
* **floating:** rebind after ancestor teleport moves ([2f0bb2c](https://github.com/daopk/ropav/commit/2f0bb2cc4a88c6c66a5e8f6ca0e4fae43f9629c2))
* **floating:** restart positioning after teleport moves ([00e18ed](https://github.com/daopk/ropav/commit/00e18ed0fca22d519d6795f67192ee7eef86b951))
* **modal:** stack active modal roots ([5f433d8](https://github.com/daopk/ropav/commit/5f433d8273f9d68c46dacb54c11c2245c266995c))
* preserve floating styles when teleported ([850770b](https://github.com/daopk/ropav/commit/850770b7f33a43b9fe30428e9075e09144fb07df))
* **slider:** style teleported tooltip content ([fd2d66b](https://github.com/daopk/ropav/commit/fd2d66bc89d788d36e1e30f06a1cb0054c58118e))
* **tooltip:** remove legacy positioning ([219f27c](https://github.com/daopk/ropav/commit/219f27c3f27a1afea2784b6f722bc6fb72b31716))

## [0.0.11](https://github.com/daopk/ropav/compare/v0.0.10...v0.0.11) (2026-07-15)

### ⚠ BREAKING CHANGES

* **styles:** Ropav token and component CSS now uses named cascade layers, which changes precedence for unlayered resets.

### Features

* **dropdown-menu:** add compound primitives ([aeba601](https://github.com/daopk/ropav/commit/aeba60160cdbf3fdac8f8dcaf66ac7350a761ee5))
* **focus-trap:** add focus trapping primitives ([5102a40](https://github.com/daopk/ropav/commit/5102a4099d4f05bfb4a9e3c08521d4290a40217d))
* **forms:** expose native control APIs ([c7e001f](https://github.com/daopk/ropav/commit/c7e001f278d70c81ecfc4921f9d8f5ea9ad55542))
* **overlays:** unify floating positioning and teleport ([7e44636](https://github.com/daopk/ropav/commit/7e4463653a3e9cb3ed57e4e8f36dd045a1097c8b))
* **styles:** add public styles API ([f16e826](https://github.com/daopk/ropav/commit/f16e826a64fb30a6c3403b42ffcaea358bcbfec5))

### Bug Fixes

* **styles:** update bootstrap manifest ref ([6f9f55e](https://github.com/daopk/ropav/commit/6f9f55e4aa6ab2d2c52d5e4da8842cbb3627c02b))

## [0.0.10](https://github.com/daopk/ropav/compare/v0.0.9...v0.0.10) (2026-07-15)

### ⚠ BREAKING CHANGES

* **slider:** remove validation state props

### Features

* **toast:** add notification system ([482b7e4](https://github.com/daopk/ropav/commit/482b7e402706ec205435ffb3cb7a82b7b5cb257c))

### Bug Fixes

* **slider:** align merged tooltip arrows with thumbs ([d9fb2c2](https://github.com/daopk/ropav/commit/d9fb2c293c6e766df3898c3440e2fcc8c1095b71))
* **slider:** improve merged tooltip separator ([5fdf4f1](https://github.com/daopk/ropav/commit/5fdf4f126b111f42787086bf6dd63e746beafc2f))
* **slider:** preserve merged tooltip arrow margins ([8b0019c](https://github.com/daopk/ropav/commit/8b0019c8c27fedb2d33ddeff2585ffd0bc8635b6))
* **slider:** remove range tooltip transitions ([4340919](https://github.com/daopk/ropav/commit/43409191bec37e22aa6f4a051682d8dc7ebcdb75))
* **slider:** show tooltip during touch drag ([a53bada](https://github.com/daopk/ropav/commit/a53bada7af37fc9acd473ebf0fb5d5b8fe20cf33))
* **slider:** stack merged vertical tooltip values ([8f5e1d2](https://github.com/daopk/ropav/commit/8f5e1d249146e0f2ca3fc9597605e60db0e2e290))
* **storybook:** apply theme before initial render ([153c3b3](https://github.com/daopk/ropav/commit/153c3b3b46ac552c3cc4ab139c654d427dfaf271))
* **toast:** prevent transition layout shifts ([cab3b70](https://github.com/daopk/ropav/commit/cab3b7000196b5e55722e01641c62409c3737acb))

### Performance Improvements

* **color-picker:** optimize pointer dragging ([6d9c88a](https://github.com/daopk/ropav/commit/6d9c88ae069303641a9110d4b8a7eb22f055084d))
* **dropdown-menu:** isolate item rendering ([a1e2387](https://github.com/daopk/ropav/commit/a1e23871d0b084b1f988c5c72a3282cfba20ddc7))
* **overlay:** throttle target repositioning ([6a5e30a](https://github.com/daopk/ropav/commit/6a5e30a63c969804d1489252d425699b6c6b8ced))
* **popover:** lazy mount content ([32712ec](https://github.com/daopk/ropav/commit/32712eca1cb151136b43bae518d3998bf83cebf9))
* **slider:** optimize range pointer dragging ([c757141](https://github.com/daopk/ropav/commit/c757141299e403c171062c1a6efe59f0c5cedfeb))
* **textarea:** coalesce autosize measurements ([691b3a6](https://github.com/daopk/ropav/commit/691b3a64fd4a535b3478b994b8072a1cf07f0b85))

### Code Refactoring

* **slider:** remove validation state props ([299f08e](https://github.com/daopk/ropav/commit/299f08ec9bc54e55028d767157a66228d66ad855))

## [0.0.9](https://github.com/daopk/ropav/compare/v0.0.8...v0.0.9) (2026-07-11)

### ⚠ BREAKING CHANGES

* **tokens:** replace legacy base/2xl/3xl font tokens and semantic line-height tokens with Mantine-style runtime sizing tokens.
* **color-input:** Use pickerAriaLabel instead of triggerAriaLabel.

### Features

* add alert component ([145aa7b](https://github.com/daopk/ropav/commit/145aa7bbed732ef2abb1d49f5f86739553ebbc23))
* add button link component ([fbbacb9](https://github.com/daopk/ropav/commit/fbbacb9aab043ff7d346bc4cb902211419abf696))
* add color input component ([0f0fa4d](https://github.com/daopk/ropav/commit/0f0fa4d5f3eb04d65f2b3124daba068835f297e7))
* **aspect-ratio:** add aspect ratio component ([0739353](https://github.com/daopk/ropav/commit/073935349d4d674096cc249eeb94ba86985d7240))
* **avatar:** add avatar component ([4b14b75](https://github.com/daopk/ropav/commit/4b14b751c1ba752e5327355d75c28cc883cdd50d))
* **avatar:** add icon fallback demo ([af0e19e](https://github.com/daopk/ropav/commit/af0e19e1f937fdb7a2b144c149e5c098b00b797a))
* **avatar:** support color variants ([a2b406b](https://github.com/daopk/ropav/commit/a2b406b2801ea015daf5ad5b3bbc2f5d508b7ce7))
* **color-input:** add restricted input modes ([73daa45](https://github.com/daopk/ropav/commit/73daa458a870144a8422598ece490fb107801b6a))
* **color-input:** remove trigger aria label prop ([10a5790](https://github.com/daopk/ropav/commit/10a5790f2bd49ae323b96fc5abc7e2fb4fcb6cbc))
* **color-input:** show preview and open picker on focus ([0a48836](https://github.com/daopk/ropav/commit/0a4883667f9391c0e07e83a7ba33175a9195db2f))
* **color-input:** support eye dropper ([bae6f7c](https://github.com/daopk/ropav/commit/bae6f7c98efeca19da3278ba214b83652eaa2fb4))
* **color-input:** support native attrs and validation ([cafa9bd](https://github.com/daopk/ropav/commit/cafa9bdde3654f49aff78ebc5fb675f0f12f974c))
* **color-picker:** add color picker component ([d37b8c8](https://github.com/daopk/ropav/commit/d37b8c8f41653260d5906833383244f689bea218))
* **color-picker:** add color swatches ([e2de1da](https://github.com/daopk/ropav/commit/e2de1dadf7078377e6cba67ea55807b02ad22793))
* **color-picker:** simplify value and swatches ([46e3176](https://github.com/daopk/ropav/commit/46e317699dada95c72289df5f837b508a9418de3))
* **color-picker:** support keyboard swatch navigation ([b9382d8](https://github.com/daopk/ropav/commit/b9382d8a3110fbf19f957127d5ef6eb8e22efe30))
* **color-picker:** support size presets ([6378955](https://github.com/daopk/ropav/commit/6378955fff35a339f8674444dee058acef1c9d65))
* **color-picker:** support swatches-only mode ([d82dc35](https://github.com/daopk/ropav/commit/d82dc3580a4c4674031fcc87d41278e7f43d67c5))
* **input:** support native attributes and validation ([e0d097e](https://github.com/daopk/ropav/commit/e0d097e42aafcd52eeec788836ac835408b8a56f))
* **number-input:** add number input component ([056366d](https://github.com/daopk/ropav/commit/056366dc8a31bfdd8343a28f0a82753ca2c21270))
* **number-input:** support control positions ([aed0496](https://github.com/daopk/ropav/commit/aed049630e4ab910825446e45c0407d3480c96d1))
* **number-input:** support text alignment ([3fd3585](https://github.com/daopk/ropav/commit/3fd358564d76b4b46a30dfefe0648f502af5192b))
* **popover:** support aligned placements ([f818229](https://github.com/daopk/ropav/commit/f8182291b5e1c950cbed5ca0bdf1d0d41f70c135))
* **slider:** add range slider component ([8386b51](https://github.com/daopk/ropav/commit/8386b51e20c17b726f5ddeb8faee3f0a2fc82c5d))
* **slider:** add thumb crossover and merged tooltips ([c822cb3](https://github.com/daopk/ropav/commit/c822cb3eb025ba7e9ae9ebfb77d47b856f16385d))
* **tokens:** add derived color system ([f280e1c](https://github.com/daopk/ropav/commit/f280e1cfd71227e26a32d052250b3b77a6cce67c))
* **tokens:** add xs and xl control sizes ([df84253](https://github.com/daopk/ropav/commit/df842530a42f6857425b98837e9ca32bd91cba03))
* **tokens:** align sizing scale with mantine ([7b44e0e](https://github.com/daopk/ropav/commit/7b44e0ed0b9facb79db86bcaa102b8ee0b0e7711))

### Bug Fixes

* **button:** keep default border color on hover ([8d9f84b](https://github.com/daopk/ropav/commit/8d9f84b44eac8ad6f8f85f7732109c28c83d5de4))
* **color-input:** align preview inset ([be63a06](https://github.com/daopk/ropav/commit/be63a069446c0c30fe3a328be20e4dad4f02a8e1))
* **color-input:** correct readonly and story interactions ([9b6106a](https://github.com/daopk/ropav/commit/9b6106a4a8ebbc7f0c1027d8c6ca203db6a84c9d))
* **color-input:** refine preview and picker behavior ([78d71eb](https://github.com/daopk/ropav/commit/78d71ebe39d630796306636331d97a1e82a9dda4))
* **color-input:** wire popover trigger semantics ([4cd73a9](https://github.com/daopk/ropav/commit/4cd73a99b87490220413614457166a33745a1331))
* **color-picker:** expose color area axes ([2307b94](https://github.com/daopk/ropav/commit/2307b9449d965e3280a501195e5da53cb9c03be5))
* **color-picker:** meet minimum pointer target size ([7b3ebab](https://github.com/daopk/ropav/commit/7b3ebab5cacb0783883b4a06cd9d2ba2c604ec6c))
* **color-picker:** omit invalid swatches ([2969d49](https://github.com/daopk/ropav/commit/2969d49476839b467a2cb7d0181bc4f79e983868))
* **color-picker:** show keyboard focus indicators ([87afcca](https://github.com/daopk/ropav/commit/87afcca8cdb213750ed5ea80a01e57cc6babd10c))
* **color:** share strict CSS color parsing ([1dce67d](https://github.com/daopk/ropav/commit/1dce67d2c778f0325b8d886ce0421b0690e009d7))
* **input:** correct dark validation colors ([87a9b7f](https://github.com/daopk/ropav/commit/87a9b7f1fb8eb14dd0ff70eced8fab0462fb06e7))
* **select:** refine dropdown option styling ([369d544](https://github.com/daopk/ropav/commit/369d5445bc5689198f08f9677a3788dcf2b3360e))
* **slider:** align tooltip anchor with thumb ([5bba94b](https://github.com/daopk/ropav/commit/5bba94b9c8e6997d10e946ecf2414e170e19b87e))
* **slider:** improve range slider tooltip controls ([fa42c73](https://github.com/daopk/ropav/commit/fa42c7368c608772ad9d087f30e085e27043d717))
* **slider:** prevent range tooltip hover flicker ([04dea77](https://github.com/daopk/ropav/commit/04dea7769e704db4a92d6d2e2e5f82cc4ea70ff5))
* **slider:** remove range tooltip transition ([4d440a6](https://github.com/daopk/ropav/commit/4d440a6091d4968a03ca72588935eec3133c51aa))
* **slider:** smooth range tooltip handoff ([e3e923b](https://github.com/daopk/ropav/commit/e3e923b0f9ddbb294d6bc9f6ab4ca3a9fdd59fc2))
* **slider:** synchronize range tooltip visibility ([0b6f0d9](https://github.com/daopk/ropav/commit/0b6f0d93dd832c295d45aaf4b97838cc2145e17f))
* **storybook:** clean color component examples ([4b5bd88](https://github.com/daopk/ropav/commit/4b5bd8861d531131f99dcbc1c35eca7bb8e76592))

## [0.0.8](https://github.com/daopk/ropav/compare/v0.0.7...v0.0.8) (2026-07-07)

### ⚠ BREAKING CHANGES

* remove defaultOpen from modal and collapse

### Features

* **card:** add footer slot support ([3d91af1](https://github.com/daopk/ropav/commit/3d91af16f47d59f4d2b91e8333b84389069a7913))
* **card:** add optional header border ([450a955](https://github.com/daopk/ropav/commit/450a95533d58d0675ef927d2f9e3e00236b19509))
* **card:** support custom body class ([10a6a84](https://github.com/daopk/ropav/commit/10a6a845e0166b520c8c438ebc166805f309b00a))
* **card:** support header slot ([437d740](https://github.com/daopk/ropav/commit/437d7408d54af47123cc1c8363cd33a218e71fba))
* remove defaultOpen from modal and collapse ([cb426db](https://github.com/daopk/ropav/commit/cb426db668df9d85c541f9d77146dee4535e52bd))

### Bug Fixes

* **field:** focus control when pressing label ([73deafa](https://github.com/daopk/ropav/commit/73deafa6b3332f67abc36f54c54aaa457deae7fe))
* **field:** increase label control spacing ([9d3156f](https://github.com/daopk/ropav/commit/9d3156ff69ca683584a93f575e699635d015badb))
* **popover:** narrow accessible role contract ([18dc2ed](https://github.com/daopk/ropav/commit/18dc2ede984b813a0f08878184269c4cd62ddd1b))

## [0.0.7](https://github.com/daopk/ropav/compare/v0.0.6...v0.0.7) (2026-07-07)

### Features

* add accordion component ([bebcf37](https://github.com/daopk/ropav/commit/bebcf37d96385b3ef5ee9140b7b362ea5a2e9fe5))
* add badge component ([01abb34](https://github.com/daopk/ropav/commit/01abb34a96b535763045822d7655bcfd4f02e856))
* add collapse component ([138d0a9](https://github.com/daopk/ropav/commit/138d0a9869890c81d41aedd79e9f3dcd594a2822))
* add dropdown menu component ([e294bd1](https://github.com/daopk/ropav/commit/e294bd16fa9d88775e87ff5cd391920f11a6fd8f))
* add modal component ([4df861e](https://github.com/daopk/ropav/commit/4df861ed4f106f5092901ff3e2a0ac297a72b161))
* add overlay component ([fbc5f8a](https://github.com/daopk/ropav/commit/fbc5f8af7f4ed6474445ff50c7f64aac83c7ca17))
* add popover component ([c891051](https://github.com/daopk/ropav/commit/c8910511b697182a8abf181c995517b38ddf84ef))
* add tabs component ([248c14b](https://github.com/daopk/ropav/commit/248c14bd2ad0a95aede88792e2a3e1c5cbd6606c))
* **dropdown-menu:** add safe triangle hover intent ([eb99c72](https://github.com/daopk/ropav/commit/eb99c725b9250d006d8f5db5587027869fb58aa4))
* **dropdown-menu:** support submenus ([a90d871](https://github.com/daopk/ropav/commit/a90d871731aac14c0576ead99a12717ba50ee5a6))
* expose collapse composable ([5112775](https://github.com/daopk/ropav/commit/511277503c34b10ec3e32ac794c43594544f1d8d))
* **modal:** support overlay props ([aab4e8d](https://github.com/daopk/ropav/commit/aab4e8d18db007643d4f91052f75b65ea2b752d7))
* support overlay backdrop blur ([111cd1e](https://github.com/daopk/ropav/commit/111cd1e2bb961dbc7f15a2bb35d57c9a972f7052))
* support overlay gradients ([c958fbb](https://github.com/daopk/ropav/commit/c958fbbd109b0be6217521f54a45d0831c7b51f6))
* **tabs:** add root size prop ([28b1b0b](https://github.com/daopk/ropav/commit/28b1b0b91961d3d9579e979783987e9c9e2886bd))
* **tabs:** support pills and outline variants ([a4cacbf](https://github.com/daopk/ropav/commit/a4cacbf859892ca2829c4ce236b78403dedb7857))
* **tabs:** support vertical placement and trigger alignment ([cfab614](https://github.com/daopk/ropav/commit/cfab61434b79c85fc0f43ccb8af4037d0782f7e1))
* update badge slots and default style ([5e00223](https://github.com/daopk/ropav/commit/5e002239ffc5152041093bd58269323fc9964ec5))

### Bug Fixes

* **button-group:** correct attached styles in production ([c30208a](https://github.com/daopk/ropav/commit/c30208a24376daaa6443fb709359a1a3af713eb6))
* **dropdown-menu:** align safe triangle geometry ([bffb8dc](https://github.com/daopk/ropav/commit/bffb8dcf28fed3837d4f180ef84959d8d877a984))
* **dropdown-menu:** bound safe triangle hover area ([50805d5](https://github.com/daopk/ropav/commit/50805d533eedfab67b4a64723ec5a2bf6dd9f9b5))
* **dropdown-menu:** expand safe triangle origin ([174ad4d](https://github.com/daopk/ropav/commit/174ad4d309b38e83bc80b533c4a1c81ba787d304))
* **dropdown-menu:** improve submenu accessibility ([d969b7f](https://github.com/daopk/ropav/commit/d969b7f5f5a9c316995d8274c397110c4cb68c7c))
* **dropdown-menu:** support second-level submenus ([dfc6668](https://github.com/daopk/ropav/commit/dfc66686b9cce85ecbbcb28d98efcca78e402fa4))
* **icon-button:** correct slotted svg production styles ([7ae8b69](https://github.com/daopk/ropav/commit/7ae8b69388ff2ddacc3b64db04dc580a84505137))
* smooth accordion transition ([43a5737](https://github.com/daopk/ropav/commit/43a5737c702fc64b92f3ada2feb52b565edaf772))
* **tabs:** adjust trigger padding scale ([b90c51c](https://github.com/daopk/ropav/commit/b90c51cca6e9947cb0e29af62c9a77b1a84b69cb))
* **tabs:** avoid primary color self-reference ([25ddf66](https://github.com/daopk/ropav/commit/25ddf66e850885e03ba95344bf3b39edc354d952))

## [0.0.6](https://github.com/daopk/ropav/compare/v0.0.5...v0.0.6) (2026-07-07)

### Features

* add button group component ([339750b](https://github.com/daopk/ropav/commit/339750ba91562bf413455e126e6de587ef277e17))
* add progress component ([6a17fed](https://github.com/daopk/ropav/commit/6a17fed243d4b6b241add55793f4741bdc247bb5))
* add slider component ([a69e71a](https://github.com/daopk/ropav/commit/a69e71a41bafdb7049041e980dc53195c1061215))
* add tooltip component ([46509c7](https://github.com/daopk/ropav/commit/46509c7d433e176ebd1e8179eab30df136e90392))
* **button:** support custom loading slot ([ec908cc](https://github.com/daopk/ropav/commit/ec908cccb5d6e7ff1e2d0a0a66d0aa4bc8dc4a88))
* **components:** support custom colors ([525bcdf](https://github.com/daopk/ropav/commit/525bcdf68864a5590af375b391c8db64b9236d76))
* expose spinner utility css ([1c5e778](https://github.com/daopk/ropav/commit/1c5e778168c0bf1e8986c61034f8f6c99b71ed31))
* **slider:** allow tooltip customization ([24c8c3d](https://github.com/daopk/ropav/commit/24c8c3d2a5b8a900f96f8e22a148afd3eb8e7548))
* **textarea:** add autosize rows ([06f1cbb](https://github.com/daopk/ropav/commit/06f1cbb53643f2d403ed063dede13cdcb13c7584))
* **textarea:** support configurable resize ([5076584](https://github.com/daopk/ropav/commit/5076584da06a59556a80853358d70fa1efe5471a))
* **tooltip:** add decorative mode for slider ([198434d](https://github.com/daopk/ropav/commit/198434d607ee906f4a3b2c6470dea1459592ff58))
* **tooltip:** support color variants ([c37efdb](https://github.com/daopk/ropav/commit/c37efdba39e6f0a82860e419be283c25c1582747))
* **tooltip:** support controlled open state ([f4d5694](https://github.com/daopk/ropav/commit/f4d5694370f0cc2e82895f3b0238863c80cb201c))
* **tooltip:** support offset prop ([fffb9cb](https://github.com/daopk/ropav/commit/fffb9cb075ae8fdcb7a613e85d8c674bea590245))
* **tooltip:** support target triggers ([bbc910a](https://github.com/daopk/ropav/commit/bbc910a07d371b85c002b79656104e258be4f7f8))

### Bug Fixes

* **button:** center spinner while loading ([5cb0c5b](https://github.com/daopk/ropav/commit/5cb0c5b047c3a952c10059f1587ce675b23ca5dd))
* **button:** keep loading indicator when disabled ([ab4f3f0](https://github.com/daopk/ropav/commit/ab4f3f031c52dee85cad24d48cb177125e7d4828))
* **select:** improve dark mode option hover contrast ([81f73ec](https://github.com/daopk/ropav/commit/81f73ec0106eda2a568fee3baeaf592c60c3299e))
* **select:** support keyboard clear ([fbda16e](https://github.com/daopk/ropav/commit/fbda16ef4224f73f3d680cb3defec00eb03506e2))
* **slider:** use slider color for custom thumb ([2c72d8f](https://github.com/daopk/ropav/commit/2c72d8f75cecc2bcbe32bf6180aa0b7efc596445))

## [0.0.5](https://github.com/daopk/ropav/compare/v0.0.4...v0.0.5) (2026-07-06)

### Features

* add field component ([08fd7ce](https://github.com/daopk/ropav/commit/08fd7ce9a692a552fad005a760de10866c2b4890))
* add icon button component ([17fc318](https://github.com/daopk/ropav/commit/17fc318788b55e4e59bd23d2746ea5c201f931c0))
* **card:** add card component ([af20f4f](https://github.com/daopk/ropav/commit/af20f4f22f56b00363dcf8c61e81e7cf66f04dcc))

### Bug Fixes

* add distinct xs radius token ([27ad37f](https://github.com/daopk/ropav/commit/27ad37f90096a3b7193fee45791332133c89a88b))
* correct invalid state colors in light mode ([8abeeb6](https://github.com/daopk/ropav/commit/8abeeb665ebb8c0d2a01b5301c82316b06787895))
* **select:** increase dropdown offset ([f90ba0b](https://github.com/daopk/ropav/commit/f90ba0b7bf39f2ecb41cb2e62ee07bc2dd63ab93))
* stabilize checkbox field spacing ([e2c1ab0](https://github.com/daopk/ropav/commit/e2c1ab0eb53cba52c06e9b54d796687b274837ef))
* **tokens:** soften background and surface colors ([236f70c](https://github.com/daopk/ropav/commit/236f70c8ff36e96f339ad58540f964a752d0c6a2))

## [0.0.4](https://github.com/daopk/ropav/compare/v0.0.3...v0.0.4) (2026-07-06)

### Features

* add neutral component color ([5b7fe1b](https://github.com/daopk/ropav/commit/5b7fe1b2021927ff7f9798cbe0408a6b803120b9))
* expose control semantic tokens ([3a17122](https://github.com/daopk/ropav/commit/3a171227b752ae277cb21153bf3d53ec2a4ef8d6))

### Bug Fixes

* compile icons for vue vapor ([0d872fe](https://github.com/daopk/ropav/commit/0d872fe0bed3e649e3618dfd1a31bba8a3cfd1ad))
* correct light input state colors ([758284a](https://github.com/daopk/ropav/commit/758284a91c00f819cc63347b618fe1c05532c33b))
* generate disabled opacity token ([ec86fec](https://github.com/daopk/ropav/commit/ec86fec1efd3ac75080f82688b15630b962ce746))

## [0.0.3](https://github.com/daopk/ropav/compare/v0.0.2...v0.0.3) (2026-07-05)

### ⚠ BREAKING CHANGES

* remove tabs component
* remove tooltip component
* **components:** Button no longer renders legacy prefix and suffix slots.
* --rp-radius-base and -base are no longer generated.

### Features

* add outline variant to choice controls ([a3eedff](https://github.com/daopk/ropav/commit/a3eedffcc982ee1959a9e11a87d5f4ee2a0e8d82))
* **button:** add color variants ([c0ee0af](https://github.com/daopk/ropav/commit/c0ee0afa73b18ce84070562acc463ed512623504))
* **button:** add configurable radius ([67a5bdb](https://github.com/daopk/ropav/commit/67a5bdbb6e8cdb3e1c9b3f6107526c00eb04c432))
* **button:** add size variants ([d29d9dc](https://github.com/daopk/ropav/commit/d29d9dc2dd36d32a7f4baaab1b5a746f9a1e88f7))
* **button:** support additional variants ([6a3e55f](https://github.com/daopk/ropav/commit/6a3e55f3b574c79576d1bf5a07836ff2c5e0cd8a))
* **button:** support icon slots ([63bcdb7](https://github.com/daopk/ropav/commit/63bcdb7d53257a29a93ef1957e54b2fba6791f43))
* **checkbox:** support style props ([4626c3d](https://github.com/daopk/ropav/commit/4626c3d7a1ead107d8398fd060c2288337e2d5bd))
* **components:** standardize control slots ([d80d281](https://github.com/daopk/ropav/commit/d80d2813dad675008743b7649164da8dabaf76ef))
* **input:** support radii and improve hit area ([6fa4163](https://github.com/daopk/ropav/commit/6fa416356f8d85a0140b08316da1965916f97475))
* **input:** support validation states ([1ad27ef](https://github.com/daopk/ropav/commit/1ad27ef9769ebeb01ccf5d8f6040a3056ebfbda5))
* **radio:** support sizes and colors ([83febe9](https://github.com/daopk/ropav/commit/83febe9d85851a2f6bfcf97db4c07d582d327586))
* remove tabs component ([2e4fbbb](https://github.com/daopk/ropav/commit/2e4fbbbc6974defddf78777864e729c45d68834e))
* remove tooltip component ([a788550](https://github.com/daopk/ropav/commit/a788550e40a9fd294fb2b0d92f69a0535a5aa6d0))
* replace internal icons with lucide ([3b63d7a](https://github.com/daopk/ropav/commit/3b63d7aa596268d4e6660aef93cab155cc1afa3b))
* **select:** add clearable selection control ([980fda4](https://github.com/daopk/ropav/commit/980fda4a4bae3c7d1bce99eaacba2fa326beca40))
* **select:** add radius support and refine styling ([c4e5b18](https://github.com/daopk/ropav/commit/c4e5b1803d8f80a6c159dd8c4d4cb1039b26a0a4))
* **switch:** add color and size variants ([79ca36c](https://github.com/daopk/ropav/commit/79ca36c6d6321c7bb036a3ff3aedcd42b86f56c8))
* **textarea:** align with input component ([341a9fd](https://github.com/daopk/ropav/commit/341a9fd4ec7bfa39b3e40e439b1defa6ec8a266a))
* **tokens:** add internal color scale ([0dace94](https://github.com/daopk/ropav/commit/0dace9493c40b84c34106d7f5e3d6a0f8adb44a5))
* **tokens:** align neutral color scale ([d87ae28](https://github.com/daopk/ropav/commit/d87ae284b270f8aa91c5927fbd3ddf7509179465))
* **tokens:** enforce public runtime token API ([2b8cda3](https://github.com/daopk/ropav/commit/2b8cda3c41f75f7851a2524805eb0bd51e6cb7b7))

### Bug Fixes

* align form control backgrounds ([1d714b5](https://github.com/daopk/ropav/commit/1d714b58019b8c5e5cff5c70953bb36d22ca70ba))
* **button:** let disabled override loading ([b82c76f](https://github.com/daopk/ropav/commit/b82c76f97711aab355dd6aebbe29abe418e81f0b))
* **button:** use neutral default variant ([823ded6](https://github.com/daopk/ropav/commit/823ded6b1b73a575663db98390ffd48686d4f38a))

## 0.0.2 (2026-07-05)
