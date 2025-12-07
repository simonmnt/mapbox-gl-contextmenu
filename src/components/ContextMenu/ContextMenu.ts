import { ContextMenuContext, MenuItem } from "../../types";
import { isFocusable } from "../../util/focusable";
import ContextMenuSubmenu from "../ContextMenuSubmenu/ContextMenuSubmenu";
import { createElement } from "../../util/dom";
import styles from "./ContextMenu.module.scss";

export type ContextMenuTheme = "light" | "dark" | "auto";

export interface ContextMenuOptions {
  /** Custom CSS class name for the menu element. */
  className?: string;
  /** The color theme: "light", "dark", or "auto" (follows system preference). Defaults to "auto". */
  theme?: ContextMenuTheme;
  /** The menu width as a CSS value (e.g., "200px") or number in pixels. */
  width?: string | number;
}

export default class ContextMenu {
  protected _items: MenuItem[] = [];
  private _className: string;
  protected _theme: ContextMenuTheme;
  private _width: string | number | undefined;
  protected _menuEl: HTMLElement | null = null;
  private _container: HTMLElement | null = null;

  protected _handlers: Record<string, EventListener | null> = {};

  private _focusedIndex: number = -1;

  private _onEscapeLeft: (() => void) | null = null;

  constructor(options?: ContextMenuOptions) {
    this._className = options?.className ?? styles.menu;
    this._theme = options?.theme ?? "auto";
    this._width = options?.width;
  }

  /**
   * Gets the width of the context menu.
   * @returns The width as a string (e.g., "200px") or number (in pixels), or undefined if not set.
   */
  get width(): string | number | undefined {
    return this._width;
  }

  /**
   * Sets the width of the context menu.
   * @param value - The width as a string (e.g., "200px") or number (in pixels), or undefined to use the default width.
   */
  set width(value: string | number | undefined) {
    this._width = value;
    this._updateWidth();
  }

  /**
   * Gets the theme of the context menu.
   * @returns The current theme setting: "light", "dark", or "auto".
   */
  get theme(): ContextMenuTheme {
    return this._theme;
  }

  /**
   * Sets the theme of the context menu.
   * @param value - The theme to use: "light" for light mode, "dark" for dark mode, or "auto" to follow the system preference.
   */
  set theme(value: ContextMenuTheme) {
    this._theme = value;
    this._updateTheme();
  }

  get menuElement(): HTMLElement | null {
    return this._menuEl;
  }

  /**
   * Gets the context menu items.
   * @returns The context menu items.
   */
  get items(): readonly MenuItem[] {
    return this._items;
  }

  /**
   * Set a callback to be invoked when ArrowLeft is pressed.
   * Used by submenus to return focus to parent.
   * @internal
   */
  set onEscapeLeft(callback: (() => void) | null) {
    this._onEscapeLeft = callback;
  }

  /**
   * Focus the first focusable item in the menu.
   */
  focusFirstItem(): void {
    for (let i = 0; i < this._items.length; i++) {
      if (this._isFocusable(this._items[i])) {
        this._focusItem(i);
        return;
      }
    }
  }

  /**
   * Adds a menu item to the end of the context menu.
   * @param item - The menu item to add. Can be a ContextMenuItem, ContextMenuSeparator, or ContextMenuSub.
   * @returns The context menu instance for method chaining.
   */
  addItem(item: MenuItem): this {
    this._items.push(item);
    return this;
  }

  /**
   * Inserts a menu item at the specified index.
   * @param index - The index at which to insert the item. If the index is out of bounds, the item will be added at the end.
   * @param item - The menu item to insert. Can be a ContextMenuItem, ContextMenuSeparator, or ContextMenuSub.
   * @returns The context menu instance for method chaining.
   */
  insertItem(index: number, item: MenuItem): this {
    this._items.splice(index, 0, item);
    return this;
  }

  /**
   * Removes a menu item from the context menu, doing any clean up necessary.
   * @param item - The menu item to remove.
   * @returns The context menu instance for method chaining.
   */
  removeItem(item: MenuItem): this {
    const index = this._items.indexOf(item);
    if (index !== -1) {
      this._items.splice(index, 1);
      item.remove();
    }
    return this;
  }

  /**
   * Adds the context menu to a container element.
   * @param container - The HTML element to add the menu to. The menu will be positioned absolutely within this container.
   * @returns The context menu instance for method chaining.
   */
  addTo(container: HTMLElement): this {
    this._container = container;
    this._setupUI();
    return this;
  }

  /**
   * Removes the context menu from the DOM and cleans up all event listeners and menu items.
   * @returns The context menu instance for method chaining.
   */
  remove(): this {
    this._removeItems();
    this._removeEventListeners();

    this._menuEl?.remove();

    this._menuEl = null;
    this._container = null;
    return this;
  }

  /**
   * Shows the context menu at the specified coordinates.
   * @param x - The x coordinate (in pixels) relative to the container.
   * @param y - The y coordinate (in pixels) relative to the container.
   * @param context - The context object containing the map, `contextmenu` event, and optional menu configuration.
   */
  show(x: number, y: number, context: ContextMenuContext): void {
    if (!this._menuEl) return;

    this._items.forEach((item) => {
      item.render(this._menuEl!, context);
    });

    const { left, top } = this._positionInViewport(x, y);

    this._menuEl.style.left = `${left}px`;
    this._menuEl.style.top = `${top}px`;

    this._menuEl.classList.add(styles.visible);

    this._focusedIndex = -1;

    this._handlers.keydown = this._handleKeydown.bind(this) as EventListener;
    document.addEventListener("keydown", this._handlers.keydown);

    this._menuEl.focus();

    // Check if mouse is already over a menu item (menu appeared under cursor)
    this._focusItemUnderMouse();
  }

  /**
   * Hides the context menu, cleaning up keyboard event listeners and focus state.
   * Also closes any open submenus.
   */
  hide(): void {
    if (!this._menuEl) return;

    this._menuEl.classList.remove(styles.visible);

    if (this._handlers.keydown) {
      document.removeEventListener("keydown", this._handlers.keydown);
      this._handlers.keydown = null;
    }

    if (this._focusedIndex !== -1) {
      const item = this._items[this._focusedIndex];
      if (isFocusable(item)) {
        item.blur();
      }
      this._focusedIndex = -1;
    }

    // Close any open submenus
    this._items.forEach((item) => {
      if (item instanceof ContextMenuSubmenu) {
        item.blur();
      }
    });
  }

  private _focusItem(index: number): void {
    if (this._focusedIndex !== -1 && this._items[this._focusedIndex]) {
      const prevItem = this._items[this._focusedIndex];
      if (isFocusable(prevItem)) {
        prevItem.blur();
      }
    }

    if (index >= 0 && index < this._items.length) {
      this._focusedIndex = index;
      const item = this._items[this._focusedIndex];
      if (isFocusable(item)) {
        item.focus();
      }
    } else {
      this._focusedIndex = -1;
    }
  }

  private _handleKeydown(ev: KeyboardEvent): void {
    if (!this._menuEl || !this._menuEl.classList.contains(styles.visible)) {
      return;
    }

    // Only handle keys if focus is within this menu
    if (!this._menuEl.contains(document.activeElement)) {
      return;
    }

    const len = this._items.length;
    if (len === 0) return;

    let newIndex = this._focusedIndex;
    let originalIndex = this._focusedIndex;

    switch (ev.key) {
      case "ArrowDown":
        ev.preventDefault();

        newIndex = this._focusedIndex === -1 ? 0 : this._focusedIndex + 1;

        while (newIndex < len) {
          if (this._isFocusable(this._items[newIndex])) {
            break;
          }
          newIndex++;
        }

        if (newIndex >= len) {
          newIndex = originalIndex;
        }
        break;

      case "ArrowUp":
        ev.preventDefault();

        newIndex = this._focusedIndex - 1;

        while (newIndex >= 0) {
          if (this._isFocusable(this._items[newIndex])) {
            break;
          }
          newIndex--;
        }

        if (newIndex < 0) {
          newIndex = originalIndex;
        }
        break;

      case "ArrowRight":
        if (this._focusedIndex !== -1) {
          const item = this._items[this._focusedIndex];
          if (item instanceof ContextMenuSubmenu) {
            item.openAndFocusSubmenu();
            ev.preventDefault();
            return;
          }
        }
        return;

      case "Enter":
      case " ":
        if (this._focusedIndex !== -1) {
          const item = this._items[this._focusedIndex];
          // For submenus, open and focus instead of clicking
          if (item instanceof ContextMenuSubmenu) {
            item.openAndFocusSubmenu();
            ev.preventDefault();
            return;
          }
          if (isFocusable(item) && "listens" in item && item.listens("click")) {
            item.click();
            this.hide();
          }
        }
        ev.preventDefault();
        return;

      case "ArrowLeft":
        // If we have a callback (we're a submenu), go back to parent
        if (this._onEscapeLeft) {
          this._onEscapeLeft();
          ev.preventDefault();
        }
        return;

      case "Escape":
        this.hide();
        ev.preventDefault();
        return;

      default:
        return;
    }

    if (newIndex !== this._focusedIndex && newIndex !== originalIndex) {
      this._focusItem(newIndex);
    }
  }

  private _isFocusable(
    item: MenuItem
  ): item is MenuItem & { disabled: boolean; focus(): void } {
    return isFocusable(item) && !item.disabled;
  }

  private _setupUI(): void {
    if (!this._container) return;

    const menu = createElement("menu", {
      role: "menu",
      class: this._className
    });
    menu.style.position = "absolute";
    menu.setAttribute("tabindex", "-1"); // Essential for focusing the menu itself

    this._handlers.click = (() => {
      this.hide();
    }) as EventListener;
    menu.addEventListener("click", this._handlers.click);

    this._handlers.focusin = ((ev: FocusEvent) => {
      const target = ev.target as HTMLElement;
      const li = target.closest("li");
      if (li) {
        const index = this._items.findIndex((item) => {
          if ("_liEl" in item) {
            return (
              (item as unknown as { _liEl: HTMLElement | null })._liEl === li
            );
          }
          return false;
        });
        if (index !== -1 && index !== this._focusedIndex) {
          // Blur previous item without calling focus on new (it's already focused)
          if (this._focusedIndex !== -1 && this._items[this._focusedIndex]) {
            const prevItem = this._items[this._focusedIndex];
            if (isFocusable(prevItem)) {
              prevItem.blur();
            }
          }
          this._focusedIndex = index;
        }
      }
    }) as EventListener;
    menu.addEventListener("focusin", this._handlers.focusin);

    this._container.appendChild(menu);

    this._menuEl = menu;

    this._updateWidth();
    this._updateTheme();
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

  private _updateTheme(): void {
    if (!this._menuEl) return;

    this._menuEl.classList.remove("themeLight", "themeDark");
    if (this._theme === "light") {
      this._menuEl.classList.add("themeLight");
    } else if (this._theme === "dark") {
      this._menuEl.classList.add("themeDark");
    }
  }

  private _removeItems(): void {
    this._items.forEach((item) => {
      item.remove();
    });
    this._items = [];
  }

  protected _removeEventListeners(): void {
    if (!this._menuEl) return;

    for (const [event, handler] of Object.entries(this._handlers)) {
      if (!handler) continue;

      // keydown is on document, others are on menu element
      if (event === "keydown") {
        document.removeEventListener(event, handler);
      } else {
        this._menuEl.removeEventListener(event, handler);
      }
      this._handlers[event] = null;
    }
  }

  private _focusItemUnderMouse(): void {
    if (!this._menuEl) return;

    const hoveredButton = this._menuEl.querySelector("button:hover");
    if (hoveredButton) {
      const li = hoveredButton.closest("li");
      if (li) {
        const index = this._items.findIndex((item) => {
          if ("_liEl" in item) {
            return (
              (item as unknown as { _liEl: HTMLElement | null })._liEl === li
            );
          }
          return false;
        });
        if (index !== -1) {
          this._focusItem(index);
        }
      }
    }
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
