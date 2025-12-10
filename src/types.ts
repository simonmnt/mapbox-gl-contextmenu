import type { Map, MapMouseEvent } from "mapbox-gl";
import type ContextMenuItem from "./components/ContextMenuItem";
import type ContextMenuLabel from "./components/ContextMenuLabel";
import type ContextMenuSeparator from "./components/ContextMenuSeparator";
import type ContextMenuSubmenu from "./components/ContextMenuSubmenu";
import type { ContextMenuTheme } from "./components/ContextMenu/ContextMenu";

/**
 * Context object passed to menu items when the menu is shown.
 * Contains information about the map, the triggering event, and menu configuration.
 */
export interface ContextMenuContext {
  /** The Mapbox GL or Maplibre GL map instance. */
  map: Map;
  /** The original contextmenu event that triggered the menu. */
  event: MapMouseEvent;
  /** The configured menu width, if set. */
  menuWidth?: string | number;
  /** The configured menu theme, if set. */
  menuTheme?: ContextMenuTheme;
  /** The custom CSS class name for the menu, if set. */
  menuClassName?: string;
}

/**
 * Event data passed to menu item click handlers.
 */
export interface ContextMenuItemEventData {
  /** The original DOM click event. */
  originalEvent: MouseEvent;
  /** The pixel coordinates of the original right-click, relative to the map container. */
  point: { x: number; y: number };
  /** The geographic coordinates of the original right-click. */
  lngLat: { lng: number; lat: number };
  /** Features at the click location, if the menu was bound to specific layers. */
  features?: Array<GeoJSON.Feature>;
  /** The Mapbox GL or Maplibre GL map instance. */
  map: Map;
}

/**
 * Interface for menu items that can receive keyboard focus.
 */
export interface Focusable {
  /** Focuses the item for keyboard navigation. */
  focus(): void;
  /** Removes focus from the item. */
  blur(): void;
}

export type MenuItem =
  | ContextMenuItem
  | ContextMenuLabel
  | ContextMenuSeparator
  | ContextMenuSubmenu;

/**
 * Options for creating a slot element via object notation.
 */
export interface SlotOptions {
  /** The element type to create. Defaults to 'span'. */
  as?: string;
  /** CSS class name(s) to apply. */
  className?: string;
  /** Text content for the element. */
  content?: string;
  /** Click event handler. */
  onClick?: (ev: MouseEvent) => void;
}

/**
 * Content that can be placed in a slot.
 * - `string`: Rendered as text content
 * - `HTMLElement`: Rendered as-is
 * - `SlotOptions`: Creates an element with the specified options
 */
export type Content = string | HTMLElement | SlotOptions;

/**
 * Featureset descriptor for targeting featuresets in imported basemaps.
 * Requires Mapbox GL JS v3.9.0 or later.
 */
export interface FeaturesetDescriptor {
  /** The featureset ID to target (e.g., "buildings", "poi"). */
  featuresetId: string;
  /** The import ID of the basemap (e.g., "basemap"). */
  importId?: string;
}

/**
 * Target descriptor for expanded targeting options in Mapbox GL JS v3.9.0+.
 * Can reference either a style layer ID or a featureset.
 */
export type TargetDescriptor = { layerId: string } | FeaturesetDescriptor;

/**
 * Target specification for layer-scoped context menus.
 * - `string` or `string[]`: Layer ID(s) for layer-based targeting
 * - `TargetDescriptor`: Expanded targeting options (Mapbox GL JS v3.9.0+)
 */
export type LayerTarget = string | string[] | TargetDescriptor;
