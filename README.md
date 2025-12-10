# mapbox-gl-contextmenu

A context menu plugin for Mapbox GL JS and MapLibre GL JS.

<p align="center">
  <img src="assets/screenshot.png" width="800" alt="Context menu example showing menu items and submenu">
</p>

## Installation

### npm

```bash
npm install mapbox-gl-contextmenu
```

### CDN

```html
<link
  rel="stylesheet"
  href="https://unpkg.com/mapbox-gl-contextmenu@1/dist/style.css"
/>
<script src="https://unpkg.com/mapbox-gl-contextmenu@1/dist/index.umd.js"></script>
```

Or using jsDelivr:

```html
<link
  rel="stylesheet"
  href="https://cdn.jsdelivr.net/npm/mapbox-gl-contextmenu@1/dist/style.css"
/>
<script src="https://cdn.jsdelivr.net/npm/mapbox-gl-contextmenu@1/dist/index.umd.js"></script>
```

## Usage

### ES Modules

```ts
import mapboxgl from "mapbox-gl";
import { MapboxContextMenu, ContextMenuItem } from "mapbox-gl-contextmenu";

const map = new mapboxgl.Map({
  /* ... */
});

const menu = new MapboxContextMenu({ theme: "auto", width: 180 });

const centerItem = new ContextMenuItem({
  label: "Center map here",
  start: { className: "fa-solid fa-crosshairs" }
});

centerItem.on("click", ({ map, lngLat }) => {
  map.flyTo({ center: [lngLat.lng, lngLat.lat] });
});

menu.addItem(centerItem);
menu.addTo(map);
```

### Script Tag

When using the UMD build via a script tag, the library extends the `mapboxgl` global object:

```html
<script>
  const { MapboxContextMenu, ContextMenuItem } = mapboxgl;

  const menu = new MapboxContextMenu({ theme: "auto", width: 180 });

  const centerItem = new ContextMenuItem({
    label: "Center map here",
    start: { className: "fa-solid fa-crosshairs" }
  });

  centerItem.on("click", ({ map, lngLat }) => {
    map.flyTo({ center: [lngLat.lng, lngLat.lat] });
  });

  menu.addItem(centerItem);
  menu.addTo(map);
</script>
```

## API

For complete API documentation, see the [API Reference](https://aratcliffe.github.io/mapbox-gl-contextmenu/).

### MapboxContextMenu

The main context menu class for Mapbox GL JS and MapLibre GL JS maps.

```ts
const menu = new MapboxContextMenu(options);
```

**Options:**

- `theme` - theme to use: `'light'`, `'dark'`, or `'auto'` (follows system preference). Defaults to `'auto'`.
- `width` - menu width as a CSS value (e.g., `'200px'`) or number in pixels.
- `className` - custom CSS class name for the menu element.

**Methods:**

- `addItem(item)` - add a menu item.
- `insertItem(index, item)` - insert a menu item at a specific index.
- `removeItem(item)` - remove a menu item.
- `addTo(map, target?)` - add the menu to a map. Optionally restrict to specific layer(s). See [Layer Targeting](#layer-targeting).
- `remove()` - remove the menu from the map.

### ContextMenuItem

A clickable menu item with optional content slots.

```ts
const item = new ContextMenuItem({
  label: "Copy coordinates",
  start: { className: "fa-solid fa-copy" }
});

item.on("click", ({ lngLat, map, point, features }) => {
  // Handle click
});
```

**Options:**

- `label` - a textual label to display.
- `start` - content to display before the label. See [Slot Content](#slot-content).
- `end` - content to display after the label. See [Slot Content](#slot-content).
- `disabled` - whether the item is disabled. Defaults to `false`.
- `className` - custom CSS class for the `<li>` element.
- `buttonClassName` - custom CSS class for the `<button>` element.

**Properties:**

- `label` - get/set the label text.
- `start` - get/set the start slot content.
- `end` - get/set the end slot content.
- `disabled` - get/set the disabled state.

**Events:**

- `click` - fired when the item is clicked. Event data includes `lngLat`, `point`, `map`, `features`, and `originalEvent`.

### ContextMenuSubmenu

A menu item that displays a nested submenu on hover or click.

```ts
const submenu = new ContextMenuSubmenu({
  label: "More options",
  start: { className: "fa-solid fa-ellipsis" }
});

submenu.addItem(new ContextMenuItem({ label: "Option A" }));
submenu.addItem(new ContextMenuItem({ label: "Option B" }));
```

**Options:**

- All `ContextMenuItem` options, plus:
- `showDelay` - delay in ms before showing the submenu on hover. Defaults to `300`.
- `hideDelay` - delay in ms before hiding the submenu when mouse leaves. Defaults to `200`.

**Methods:**

- `addItem(item)` - add an item to the submenu.
- `insertItem(index, item)` - insert an item at a specific index.
- `removeItem(item)` - remove an item from the submenu.

### ContextMenuSeparator

A horizontal line for visually grouping menu items.

```ts
menu.addItem(new ContextMenuItem({ label: "Edit" }));
menu.addItem(new ContextMenuSeparator());
menu.addItem(new ContextMenuItem({ label: "Delete" }));
```

**Options:**

- `className` - custom CSS class for the separator element.

## Slot Content

The `start` and `end` slots accept three types of content:

### String

Rendered as text content:

```ts
new ContextMenuItem({
  label: "Rating",
  end: "★★★"
});
```

### HTMLElement

For full control, pass a DOM element directly:

```ts
const icon = document.createElement("i");
icon.className = "fa-solid fa-star";

new ContextMenuItem({
  label: "Favorite",
  start: icon
});
```

### Object Notation

A concise way to create elements:

```ts
new ContextMenuItem({
  label: "Favorite",
  start: { className: "fa-solid fa-star" }
});
```

Object notation supports:

- `as` - element type to create. Defaults to `'span'`.
- `className` - CSS class name(s) to apply.
- `content` - text content for the element.
- `onClick` - click event handler.

```ts
new ContextMenuItem({
  label: "Settings",
  start: { as: "i", className: "fa-solid fa-gear" },
  end: { content: "Beta", className: "badge" }
});
```

## Layer Targeting

Context menus can be scoped to specific map layers, so they only appear when the `contextmenu` event is triggered on features in those layers.

Pass a layer ID or array of layer IDs to `addTo()`:

```ts
// Single layer
menu.addTo(map, "building");

// Multiple layers
menu.addTo(map, ["building", "building-outline"]);
```

When the menu is triggered, the `features` property in the click event will contain one or more features at that location:

```ts
item.on("click", ({ features }) => {
  if (features && features.length > 0) {
    console.log(features[0].properties);
  }
});
```

### Featureset Targeting (Mapbox GL JS v3.9.0+)

Mapbox GL JS v3.9.0 introduced expanded targeting options, through the [Interactions API](https://docs.mapbox.com/mapbox-gl-js/guides/user-interactions/interactions/), that allow you to target [featuresets](https://docs.mapbox.com/style-spec/reference/featuresets/) in imported basemaps like Mapbox Standard:

```ts
menu.addTo(map, { featuresetId: "buildings", importId: "basemap" });
```

You can also target layers using this object notation:

```ts
menu.addTo(map, { layerId: "my-custom-layer" });
```

The library automatically detects whether these options are available and falls back to the traditional layer-based approach for older versions or MapLibre GL JS.

## Keyboard Navigation

The menu supports full keyboard navigation:

- **Arrow down/up** - move focus between items
- **Arrow right** - open a submenu when the submenu item is focused
- **Arrow left** - close submenu and return to parent
- **Enter/space** - activate the focused item
- **Escape** - close the menu

## Theming

The menu supports light and dark themes via the `theme` option. Use `'auto'` to follow the user's system preference.

Custom styling can be applied via the `className` options on each component, or by overriding the CSS custom properties:

| Variable                               | Description             | Light Default | Dark Default |
| -------------------------------------- | ----------------------- | ------------- | ------------ |
| `--context-menu-bg`                    | Menu background color   | `white`       | `#141414`    |
| `--context-menu-font-family`           | Menu font family        | Inherited from map  | Inherited from map |
| `--context-menu-border-radius`         | Menu border radius      | `5px`         | `5px`        |
| `--context-menu-min-width`             | Menu minimum width      | `200px`       | `200px`      |
| `--context-menu-item-text-color`       | Item text color         | `black`       | `white`      |
| `--context-menu-item-font-size`        | Item font size          | `13px`        | `13px`       |
| `--context-menu-item-focus-bg`         | Focused item background | `#e8e8e8`     | `#444444`    |
| `--context-menu-item-active-bg`        | Active item background  | `#f3f3f3`     | `#2a2a2a`    |
| `--context-menu-item-disabled-opacity` | Disabled item opacity   | `0.5`         | `0.5`        |
| `--context-menu-button-height`         | Button height           | `30px`        | `30px`       |
| `--context-menu-button-radius`         | Button border radius    | `2.5px`         | `2.5px`        |
| `--context-menu-separator-color`       | Separator line color    | `#e8e8e8`     | `#505050`    |

## License

MIT
