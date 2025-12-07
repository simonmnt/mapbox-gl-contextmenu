import type { Map, MapMouseEvent } from "mapbox-gl";
import type ContextMenuItem from "./ContextMenuItem";
import type ContextMenuSeparator from "./ContextMenuSeparator";
import type ContextMenuSub from "./ContextMenuSub";
import type { ContextMenuTheme } from "./ContextMenu/ContextMenu";

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
  /** Whether the item is disabled and cannot receive focus. */
  readonly disabled: boolean;
  /** Focuses the item for keyboard navigation. */
  focus(): void;
  /** Removes focus from the item. */
  blur(): void;
  /** Programmatically triggers a click on the item. */
  click(): void;
}

export type MenuItem = ContextMenuItem | ContextMenuSeparator | ContextMenuSub;
