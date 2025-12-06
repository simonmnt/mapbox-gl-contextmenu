import { ContextMenuContext, MenuItem } from "../types";
import { createElement } from "../util/dom";
import styles from "./ContextMenu.module.scss";

export type ContextMenuTheme = "light" | "dark" | "auto";

export interface ContextMenuOptions {
  className?: string;
  theme?: ContextMenuTheme;
  width?: string | number;
}

export default class ContextMenu {
  private _items: MenuItem[] = [];
  private _className: string;
  private _theme: ContextMenuTheme;
  private _width: string | number | undefined;
  private _menuEl: HTMLElement | null = null;
  private _container: HTMLElement | null = null;
  private _menuClickHandler: ((ev: MouseEvent) => void) | null = null;

  constructor(options?: ContextMenuOptions) {
    this._className = options?.className ?? styles.menu;
    this._theme = options?.theme ?? "auto";
    this._width = options?.width;
  }

  get width(): string | number | undefined {
    return this._width;
  }

  set width(value: string | number | undefined) {
    this._width = value;
    this._updateWidth();
  }

  addItem(item: MenuItem): this {
    this._items.push(item);
    return this;
  }

  insertItem(index: number, item: MenuItem): this {
    this._items.splice(index, 0, item);
    return this;
  }

  removeItem(item: MenuItem): this {
    const index = this._items.indexOf(item);
    if (index !== -1) {
      this._items.splice(index, 1);
      item.remove();
    }
    return this;
  }

  protected show(x: number, y: number, context: ContextMenuContext): void {
    if (!this._menuEl) return;

    this._items.forEach((item) => {
      item.render(this._menuEl!, context);
    });

    const { left, top } = this._positionInViewport(x, y);

    this._menuEl.style.left = `${left}px`;
    this._menuEl.style.top = `${top}px`;

    this._menuEl.classList.add(styles.visible);
  }

  protected hide(): void {
    if (!this._menuEl) return;

    this._menuEl.classList.remove(styles.visible);
  }

  addTo(container: HTMLElement): this {
    this._container = container;
    this._setupUI();
    return this;
  }

  remove(): this {
    this._removeItems();

    if (this._menuEl && this._menuClickHandler) {
      this._menuEl.removeEventListener("click", this._menuClickHandler);
      this._menuClickHandler = null;
    }

    this._menuEl?.remove();

    this._menuEl = null;
    this._container = null;
    return this;
  }

  private _setupUI(): void {
    if (!this._container) return;

    const menu = createElement("menu", {
      role: "menu",
      class: this._className
    });
    menu.style.position = "absolute";

    if (this._theme === "light") {
      menu.classList.add("themeLight");
    } else if (this._theme === "dark") {
      menu.classList.add("themeDark");
    }

    this._menuClickHandler = () => {
      this.hide();
    };
    menu.addEventListener("click", this._menuClickHandler);

    this._container.appendChild(menu);

    this._menuEl = menu;

    this._updateWidth();
  }

  private _updateWidth(): void {
    if (!this._menuEl) return;

    if (this._width !== undefined) {
      this._menuEl.style.width =
        typeof this._width === "number" ? `${this._width}px` : this._width;
    } else {
      this._menuEl.style.width = "";
    }
  }

  private _removeItems(): void {
    this._items.forEach((item) => {
      item.remove();
    });
    this._items = [];
  }

  private _positionInViewport(
    x: number,
    y: number
  ): { left: number; top: number } {
    if (!this._menuEl || !this._container) {
      return { left: x, top: y };
    }

    const containerWidth = this._container.clientWidth;
    const containerHeight = this._container.clientHeight;

    // Ensure menu has been made visible so offsetWidth/Height are accurate
    // eslint-disable-next-line @typescript-eslint/no-unused-expressions
    this._menuEl.offsetWidth;

    const menuWidth = this._menuEl.offsetWidth;
    const menuHeight = this._menuEl.offsetHeight;

    let left = x;
    let top = y;

    if (left + menuWidth > containerWidth) {
      left = containerWidth - menuWidth;
    }
    if (top + menuHeight > containerHeight) {
      top = containerHeight - menuHeight;
    }

    if (left < 0) left = 0;
    if (top < 0) top = 0;

    return { left, top };
  }
}
