import type { Map, MapMouseEvent } from "mapbox-gl";
import type ContextMenuItem from "./ContextMenuItem";
import type ContextMenuSeparator from "./ContextMenuSeparator";

export interface ContextMenuContext {
  map: Map;
  event: MapMouseEvent;
}

export interface ContextMenuItemEventData {
  originalEvent: MouseEvent;
  point: { x: number; y: number };
  lngLat: { lng: number; lat: number };
  features?: Array<GeoJSON.Feature>;
  map: Map;
}

export type MenuItem = ContextMenuItem | ContextMenuSeparator;
