# Changelog

Every release of Pulse Theme, newest first. Format: [Keep a Changelog](https://keepachangelog.com), versions: [Semantic Versioning](https://semver.org). The release workflow copies a version's section into its GitHub release, and refuses to release a version that has no section here.

Sections inside a version, only those that apply: **All variations**, **Pulse**, **Pulse Glass**, **Pulse Tonal**, **For card authors**. Inside a section: *Added*, *Changed*, *Fixed*, *Removed*, and **Breaking** first when there is something you have to act on.

## [1.4.0] - 2026-10-11

### Pulse

- **Changed:** dark mode has a character of its own, the night-time twin of the light mode: warm charcoal instead of a plain grey, a soft warm glow at the top of the page, and cards that sit a little above it (a faint lit top edge and a drop shadow). The accent is a touch bluer, so it no longer reads as lavender. Light mode is unchanged.

### Pulse Glass

- **Changed:** graphite instead of purple. The surfaces, the background and the shadows are a neutral, slightly cool grey, and the accent is a clear blue.
- **Fixed:** blotches and smears in the frosted areas. The background no longer has a grain (once blurred, it turned into uneven patches behind the cards), the blur saturates far less (it amplified every unevenness behind the glass), and the background is no longer `fixed`, which made some browsers repaint the blur badly while scrolling. The header is a little more opaque, so content scrolling under it smears less.

### Pulse Tonal

- **Changed:** a soft plum seed instead of the red-leaning mauve: cards, chips, buttons and the accent are cooler and calmer, and dark cards no longer look brown-red.

### For card authors

- **Changed:** the values of `--pulse-accent`, `--pulse-surface-neutral*` and the surface colours, as above. Token names and meanings are unchanged.

## Earlier releases

1.0.0 to 1.3.1 (October 2026) are described on their [GitHub release pages](https://github.com/zacharatos/pulse-theme/releases).
