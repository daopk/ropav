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
