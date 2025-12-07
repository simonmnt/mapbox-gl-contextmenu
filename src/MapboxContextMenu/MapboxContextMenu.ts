import type { Map as MapboxMap, MapMouseEvent } from "mapbox-gl";
import { ContextMenuContext } from "../types";
import { ContextMenu, ContextMenuOptions } from "../ContextMenu";

export interface MapboxContextMenuOptions extends ContextMenuOptions {}

/**
 * A context menu for Mapbox GL JS and Maplibre GL JS.
 *
 * @example
 * ```ts
 * const menu = new MapboxContextMenu({ theme: "dark" });
 *
 * menu.addItem(new ContextMenuItem({ label: "Center here" })
 *   .on("click", (e) => map.flyTo({ center: e.lngLat })));
 *
 * menu.addTo(map);
 * ```
 */
export default class MapboxContextMenu extends ContextMenu {
  private static _openMenu: MapboxContextMenu | null = null;

  private _map: MapboxMap | null = null;
  private _layerIds: string | string[] | undefined = undefined;
  private _handlers = {
    contextmenu: null as ((e: MapMouseEvent) => void) | null,
    mousedown: null as ((e: MapMouseEvent) => void) | null,
    move: null as (() => void) | null
  };

  /**
   * Creates a new context menu for Mapbox GL JS or Maplibre GL JS.
   * @param options - Configuration options for the context menu.
   * @param options.theme - The color theme: "light", "dark", or "auto" (follows system preference). Defaults to "auto".
   * @param options.width - The menu width as a CSS value (e.g., "200px") or number in pixels.
   * @param options.className - Custom CSS class name for the menu element.
   */
  constructor(options?: MapboxContextMenuOptions) {
    super(options);
  }

  /**
   * Adds the context menu to a Mapbox GL JS or Maplibre GL JS map.
   *
   * @param map - The map instance.
   * @param layerIds - Optional layer ID(s) to restrict the menu to. Can be a string or array of strings.
   */
  // @ts-expect-error - Override with different signature for Mapbox-specific API
  addTo(map: MapboxMap, layerIds?: string | string[]): this {
    this._map = map;
    this._layerIds = layerIds;

    ContextMenu.prototype.addTo.call(this, map.getContainer());

    this._addEventListeners();

    return this;
  }

  /**
   * Removes the context menu from the map and cleans up event listeners.
   */
  remove(): this {
    if (!this._map) return this;

    this._removeEventListeners();
    super.remove();

    if (MapboxContextMenu._openMenu === this) {
      MapboxContextMenu._openMenu = null;
    }

    this._map = null;
    this._layerIds = undefined;
    return this;
  }

  protected show(x: number, y: number, context: ContextMenuContext): void {
    if (MapboxContextMenu._openMenu && MapboxContextMenu._openMenu !== this) {
      MapboxContextMenu._openMenu.hide();
    }

    super.show(x, y, context);
    MapboxContextMenu._openMenu = this;
  }

  protected hide(): void {
    super.hide();
    if (MapboxContextMenu._openMenu === this) {
      MapboxContextMenu._openMenu = null;
    }
  }

  private _addEventListeners(): void {
    this._handlers.contextmenu = (e: MapMouseEvent) => {
      e.preventDefault();
      const ctx: ContextMenuContext = {
        map: this._map!,
        event: e,
        menuWidth: this.width,
        menuTheme: this._theme
      };
      this.show(e.point.x, e.point.y, ctx);
    };

    this._handlers.mousedown = () => {
      this.hide();
    };

    this._handlers.move = () => {
      this.hide();
    };

    if (this._layerIds) {
      this._map!.on("contextmenu", this._layerIds, this._handlers.contextmenu);
    } else {
      this._map!.on("contextmenu", this._handlers.contextmenu);
    }

    this._map!.on("move", this._handlers.move);
    this._map!.on("mousedown", this._handlers.mousedown);
  }

  private _removeEventListeners(): void {
    if (!this._map) return;

    for (const [event, handler] of Object.entries(this._handlers)) {
      if (!handler) continue;

      if (event === "contextmenu") {
        this._layerIds
          ? this._map.off(
              "contextmenu",
              this._layerIds,
              handler as (e: MapMouseEvent) => void
            )
          : this._map.off("contextmenu", handler as (e: MapMouseEvent) => void);
      } else {
        this._map.off(event, handler as () => void);
      }
      this._handlers[event as keyof typeof this._handlers] = null;
    }
  }
}
