import type { Map as MapboxMap, MapMouseEvent } from "mapbox-gl";
import ContextMenuItem from "../ContextMenuItem";
import { ContextMenuContext } from "../types";
import styles from "./MapboxContextMenu.module.css";

export interface MapboxContextMenuOptions {
  className?: string;
}

export default class MapboxContextMenu {
  private _map: MapboxMap | null = null;
  private _target: string | undefined = undefined;
  private _items: ContextMenuItem[] = [];
  private _className: string;
  private _itemClickHandlers = new Map<ContextMenuItem, () => void>();
  private _handlers = {
    contextmenu: null as ((e: MapMouseEvent) => void) | null,
    mousedown: null as ((e: MapMouseEvent) => void) | null,
    move: null as (() => void) | null
  };
  private _menuEl: HTMLMenuElement | null = null;

  constructor(options?: MapboxContextMenuOptions) {
    this._className = options?.className ?? styles.menu;
  }

  addItem(item: ContextMenuItem): this {
    this._items.push(item);
    const handler = () => {
      this._hide();
    };
    item.addEventListener("click", handler);
    this._itemClickHandlers.set(item, handler);
    return this;
  }

  removeItem(item: ContextMenuItem): this {
    const index = this._items.indexOf(item);
    if (index !== -1) {
      this._items.splice(index, 1);
      this._removeItemEventListener(item);
      item.remove();
    }
    return this;
  }

  addTo(map: MapboxMap, target?: string): this {
    this._map = map;
    this._target = target;

    this._createElements();
    this._addEventListeners();

    return this;
  }

  remove(): this {
    if (!this._map) return this;

    this._removeEventListeners();
    this._removeItems();

    if (this._menuEl?.parentElement) {
      this._menuEl.remove();
    }

    this._menuEl = null;
    this._map = null;
    this._target = undefined;
    return this;
  }

  private _createElements(): void {
    const menu = document.createElement("menu");
    menu.className = this._className;
    menu.setAttribute("role", "menu");
    menu.style.position = "absolute";

    this._map!.getContainer().appendChild(menu);

    this._menuEl = menu;
  }

  private _addEventListeners(): void {
    this._handlers.contextmenu = (e: MapMouseEvent) => {
      e.preventDefault();
      this._show(e);
    };

    this._handlers.mousedown = () => {
      this._hide();
    };

    this._handlers.move = () => {
      this._hide();
    };

    if (this._target) {
      this._map!.on("contextmenu", this._target, this._handlers.contextmenu);
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
        this._target
          ? this._map.off(
              "contextmenu",
              this._target,
              handler as (e: MapMouseEvent) => void
            )
          : this._map.off("contextmenu", handler as (e: MapMouseEvent) => void);
      } else {
        this._map.off(event, handler as () => void);
      }
      this._handlers[event as keyof typeof this._handlers] = null;
    }
  }

  private _removeItems(): void {
    this._items.forEach((item) => {
      this._removeItemEventListener(item);
      item.remove();
    });
    this._items = [];
    this._itemClickHandlers.clear();
  }

  private _removeItemEventListener(item: ContextMenuItem): void {
    const handler = this._itemClickHandlers.get(item);
    if (handler) {
      item.removeEventListener("mousedown", handler);
      this._itemClickHandlers.delete(item);
    }
  }

  private _show(event: MapMouseEvent): void {
    if (!this._menuEl) return;

    const ctx: ContextMenuContext = {
      map: this._map!,
      event: event
    };

    this._items.forEach((item) => {
      item.render(this._menuEl!, ctx);
    });

    this._menuEl.style.left = `${event.point.x}px`;
    this._menuEl.style.top = `${event.point.y}px`;

    this._menuEl.classList.add(styles.visible);
  }

  private _hide(): void {
    if (!this._menuEl) return;

    this._menuEl.classList.remove(styles.visible);
  }
}
