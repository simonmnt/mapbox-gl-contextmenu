import type { Map, MapMouseEvent } from "mapbox-gl";
import type { ContextMenuContext } from "../types";

export class ContextMenuItemEvent extends Event {
  readonly originalEvent: MouseEvent;
  readonly point: { x: number; y: number };
  readonly lngLat: { lng: number; lat: number };
  readonly features?: Array<GeoJSON.Feature>;
  readonly map: Map;

  constructor(type: string, originalEvent: MouseEvent, context: ContextMenuContext) {
    super(type, { bubbles: true, cancelable: true });
    this.originalEvent = originalEvent;
    this.point = context.event.point;
    this.lngLat = context.event.lngLat;
    this.features = context.event.features;
    this.map = context.map;
  }

  preventDefault(): void {
    super.preventDefault();
    if (this.originalEvent) {
      this.originalEvent.preventDefault();
    }
  }
}

