import type { Map, MapMouseEvent } from "mapbox-gl";

export interface ContextMenuContext {
  map: Map;
  event: MapMouseEvent;
}
