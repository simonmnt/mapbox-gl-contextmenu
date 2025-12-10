import type { Map as MapboxMap, MapMouseEvent } from "mapbox-gl";
import { ContextMenuContext, LayerTarget, TargetDescriptor } from "../../types";
import { ContextMenu, ContextMenuOptions } from "../ContextMenu";

/**
 * Configuration options for creating a Mapbox context menu.
 * Extends {@link ContextMenuOptions}.
 */
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
  private _target: LayerTarget | undefined = undefined;
  private _interactionId: string | null = null;
  private _mapHandlers = {
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
   * @param target - Optional target to restrict the menu to. Can be:
   *   - A layer ID string (e.g., `"building"`)
   *   - An array of layer IDs (e.g., `["building", "poi"]`)
   *   - A TargetDescriptor for Mapbox GL JS v3.9.0+ (e.g., `{ featuresetId: "buildings", importId: "basemap" }`)
   */
  // @ts-expect-error - Override with different signature for Mapbox-specific API
  addTo(map: MapboxMap, target?: LayerTarget): this {
    this._map = map;
    this._target = target;

    ContextMenu.prototype.addTo.call(this, map.getContainer());

    this._addMapEventListeners();

    return this;
  }

  /**
   * Removes the context menu from the map and cleans up event listeners.
   */
  remove(): this {
    if (!this._map) return this;

    this._removeMapEventListeners();
    super.remove();

    if (MapboxContextMenu._openMenu === this) {
      MapboxContextMenu._openMenu = null;
    }

    this._map = null;
    this._target = undefined;
    this._interactionId = null;
    return this;
  }

  protected show(x: number, y: number, context: ContextMenuContext): void {
    if (MapboxContextMenu._openMenu && MapboxContextMenu._openMenu !== this) {
      MapboxContextMenu._openMenu.hide();
    }

    super.show(x, y, context);
    MapboxContextMenu._openMenu = this;

    // Add document-level Escape handler to close entire menu hierarchy
    if (!this._handlers.escape) {
      this._handlers.escape = ((e: KeyboardEvent) => {
        if (e.key === "Escape") {
          this.hide();
          e.preventDefault();
        }
      }) as EventListener;
      document.addEventListener("keydown", this._handlers.escape);
    }
  }

  protected hide(): void {
    super.hide();
    if (MapboxContextMenu._openMenu === this) {
      MapboxContextMenu._openMenu = null;
    }

    // Remove Escape handler
    if (this._handlers.escape) {
      document.removeEventListener("keydown", this._handlers.escape);
      this._handlers.escape = null;
    }
  }

  private _isTargetDescriptor(
    target: LayerTarget | undefined
  ): target is TargetDescriptor {
    return (
      typeof target === "object" &&
      !Array.isArray(target) &&
      ("featuresetId" in target || "layerId" in target)
    );
  }

  private _addMapEventListeners(): void {
    this._mapHandlers.contextmenu = (e: MapMouseEvent) => {
      e.preventDefault();
      const ctx: ContextMenuContext = {
        map: this._map!,
        event: e,
        menuWidth: this.width,
        menuTheme: this._theme,
        menuClassName: this._className
      };
      this.show(e.point.x, e.point.y, ctx);
    };

    this._mapHandlers.mousedown = () => {
      this.hide();
    };

    this._mapHandlers.move = () => {
      this.hide();
    };

    const map = this._map!;

    // Use Interaction API for TargetDescriptor if available (Mapbox GL JS v3.9.0+)
    if (
      this._isTargetDescriptor(this._target) &&
      typeof (map as any).addInteraction === "function"
    ) {
      this._interactionId = `contextmenu-${Date.now()}`;
      (map as any).addInteraction(this._interactionId, {
        type: "contextmenu",
        target: this._target,
        handler: (e: any) => {
          // Normalize interaction event: convert single `feature` to `features` array
          if (e.feature && !e.features) {
            e.features = [e.feature];
          }
          this._mapHandlers.contextmenu!(e);
        }
      });
    } else if (this._target && !this._isTargetDescriptor(this._target)) {
      // Layer-based targeting (string or string[])
      map.on("contextmenu", this._target, this._mapHandlers.contextmenu);
    } else if (!this._target) {
      // No target - listen on entire map
      map.on("contextmenu", this._mapHandlers.contextmenu);
    }

    map.on("move", this._mapHandlers.move);
    map.on("mousedown", this._mapHandlers.mousedown);
  }

  private _removeMapEventListeners(): void {
    if (!this._map) return;

    const map = this._map;
    const usedInteractionApi = !!this._interactionId;

    // Remove interaction if using Interaction API
    if (
      this._interactionId &&
      typeof (map as any).removeInteraction === "function"
    ) {
      (map as any).removeInteraction(this._interactionId);
      this._interactionId = null;
    }

    for (const [event, handler] of Object.entries(this._mapHandlers)) {
      if (!handler) continue;

      if (event === "contextmenu") {
        // Only remove via map.off if not using Interaction API
        if (!usedInteractionApi) {
          if (this._target && !this._isTargetDescriptor(this._target)) {
            map.off(
              "contextmenu",
              this._target,
              handler as (e: MapMouseEvent) => void
            );
          } else if (!this._target) {
            map.off("contextmenu", handler as (e: MapMouseEvent) => void);
          }
        }
      } else {
        map.off(event, handler as () => void);
      }
      this._mapHandlers[event as keyof typeof this._mapHandlers] = null;
    }
  }
}
