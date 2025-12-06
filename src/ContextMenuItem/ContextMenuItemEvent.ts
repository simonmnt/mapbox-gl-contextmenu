import type { Map } from "mapbox-gl";
import type { ContextMenuContext } from "../types";

export class ContextMenuItemEvent extends Event {
  readonly originalEvent: MouseEvent;
  readonly point: { x: number; y: number };
  readonly lngLat: { lng: number; lat: number };
  readonly features?: Array<GeoJSON.Feature>;
  readonly map: Map;

  constructor(
    type: string,
    originalEvent: MouseEvent,
    context: ContextMenuContext
  ) {
    super(type, { bubbles: true, cancelable: true });

    const { event, map } = context;
    this.originalEvent = originalEvent;
    this.point = event.point;
    this.lngLat = event.lngLat;
    this.features = event.features;
    this.map = map;
  }

  preventDefault(): void {
    super.preventDefault();
    if (this.originalEvent) {
      this.originalEvent.preventDefault();
    }
  }
}
