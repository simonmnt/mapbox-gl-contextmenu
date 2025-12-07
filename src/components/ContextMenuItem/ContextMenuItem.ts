import type { ContextMenuContext, ContextMenuItemEventData } from "../../types";
import { Evented } from "../../util/evented";
import { createElement } from "../../util/dom";
import styles from "./ContextMenuItem.module.scss";

interface ContextMenuItemEvents extends Record<string, unknown> {
  click: ContextMenuItemEventData;
}

/**
 * Configuration options for creating a context menu item.
 */
export interface ContextMenuItemOptions {
  /** Custom CSS class name for the menu item's `<li>` element. */
  className?: string;
  /** Custom CSS class name for the menu item's `<button>` element. */
  buttonClassName?: string;
  /** The text label to display. */
  label: string;
  /** Icon for the menu item. Can be CSS class name(s) (e.g., "fa-solid fa-location-dot") or an HTMLElement. If an HTMLElement is provided, it will be moved into the menu item. */
  icon?: string | HTMLElement;
  /** Position of the icon relative to the label. Defaults to "before". */
  iconPosition?: "before" | "after";
  /** Whether the menu item is disabled. Defaults to `false`. */
  disabled?: boolean;
}

/**
 * A context menu item that can be added to a context menu.
 *
 * Menu items can display a label, an optional icon, and can be enabled or disabled.
 * When clicked, menu items fire a "click" event with context data including the map,
 * coordinates, and any features at the click location.
 *
 * @example
 * ```ts
 * const item = new ContextMenuItem({
 *   label: "Center here",
 *   icon: "fa-solid fa-crosshairs"
 * });
 *
 * item.on("click", ({ map, lngLat }) => {
 *   map.flyTo({ center: [lngLat.lng, lngLat.lat] });
 * });
 *
 * menu.addItem(item);
 * ```
 **/
export default class ContextMenuItem extends Evented<ContextMenuItemEvents> {
  private _className: string;
  private _buttonClassName: string;
  private _label: string;
  private _icon: string | HTMLElement | undefined;
  private _iconPosition: "before" | "after";
  protected _disabled: boolean;

  protected _liEl: HTMLElement | null = null;
  protected _buttonEl: HTMLElement | null = null;
  private _iconEl: HTMLElement | null = null;
  private _labelEl: HTMLElement | null = null;

  protected _currentCtx: ContextMenuContext | null = null;

  private _clickHandler: ((ev: MouseEvent) => void) | null = null;

  /**
   * Creates a new context menu item.
   * @param options - Configuration options for the menu item.
   * @param options.label - The text label to display.
   * @param options.icon - Icon for the menu item. Can be CSS class name(s) (e.g., "fa-solid fa-location-dot") or an HTMLElement.
   * @param options.iconPosition - Position of the icon relative to the label. Defaults to "before".
   * @param options.disabled - Whether the menu item is disabled. Defaults to `false`.
   * @param options.className - Custom CSS class name for the `<li>` element.
   * @param options.buttonClassName - Custom CSS class name for the `<button>` element.
   */
  constructor(options: ContextMenuItemOptions) {
    super();
    this._className = options.className ?? styles.menuItem;
    this._buttonClassName = options.buttonClassName ?? styles.button;
    this._label = options.label;
    this._icon = options.icon;
    this._iconPosition = options.iconPosition ?? "before";
    this._disabled = options.disabled ?? false;
  }

  /**
   * Gets the label text of the menu item.
   * @returns The current label text.
   */
  get label(): string {
    return this._label;
  }

  /**
   * Sets the label text of the menu item.
   * @param value - The new label text to display.
   */
  set label(value: string) {
    this._label = value;

    if (this._labelEl) {
      this._labelEl.textContent = value;
    }
  }

  /**
   * Gets the icon for the menu item.
   * @returns The icon CSS class(es) or HTMLElement, or `undefined` if no icon is set.
   */
  get icon(): string | HTMLElement | undefined {
    return this._icon;
  }

  /**
   * Sets the icon for the menu item.
   * @param value - CSS class name(s) (e.g., "fa-solid fa-location-dot"), an HTMLElement, or undefined to remove the icon.
   */
  set icon(value: string | HTMLElement | undefined) {
    this._icon = value;
    this._updateIcon();
  }

  /**
   * Gets whether the menu item is disabled.
   * @returns `true` if the menu item is disabled, `false` otherwise.
   */
  get disabled(): boolean {
    return this._disabled;
  }

  /**
   * Sets whether the menu item is disabled.
   * @param value - `true` to disable the menu item, `false` to enable it.
   */
  set disabled(value: boolean) {
    this._disabled = value;

    if (this._buttonEl) {
      (this._buttonEl as HTMLButtonElement).disabled = value;
      this._buttonEl.setAttribute("aria-disabled", String(value));
    }
  }

  /**
   * @internal
   */
  render(parent: HTMLElement, ctx: ContextMenuContext): HTMLElement {
    this._currentCtx = ctx;

    if (!this._liEl || !this._buttonEl) {
      this._setupUI();
    }

    const liEl = this._liEl!;
    if (liEl.parentElement !== parent) {
      parent.appendChild(liEl);
    }

    return liEl;
  }

  /**
   * Focuses the menu item, adding the focused styling. Only works if the item is not `disabled`.
   */
  focus(): void {
    if (this._buttonEl && !this._disabled) {
      this._buttonEl.classList.add(styles.focused);
      (this._buttonEl as HTMLButtonElement).focus();
    }
  }

  /**
   * Removes focus from the menu item, removing the focused styling.
   */
  blur(): void {
    if (this._buttonEl) {
      this._buttonEl.classList.remove(styles.focused);
      (this._buttonEl as HTMLButtonElement).blur();
    }
  }

  /**
   * Programmatically triggers a click on the menu item. Only works if the item is not `disabled`.
   * This will fire the "click" event with the current context data.
   */
  click(): void {
    if (this._buttonEl && !this._disabled) {
      this._buttonEl.click();
    }
  }

  /**
   * Removes the menu item from the DOM and cleans up all event listeners and references.
   * @returns The menu item instance for method chaining.
   */
  remove(): this {
    this._removeEventListeners();

    this._liEl?.remove();

    this._liEl = null;
    this._buttonEl = null;
    this._iconEl = null;
    this._labelEl = null;
    this._currentCtx = null;
    return this;
  }

  private _setupUI(): void {
    const li = createElement("li", {
      role: "presentation",
      class: this._className
    });

    const button = createElement("button", {
      role: "menuitem",
      "aria-disabled": String(this._disabled),
      class: this._buttonClassName,
      ...(this._disabled && { disabled: "disabled" })
    }) as HTMLButtonElement;

    const iconEl = createElement("span", {
      class: styles.icon
    });
    this._iconEl = iconEl;
    this._updateIcon();

    const labelEl = createElement("span", {
      class: "context-menu-label"
    });
    labelEl.textContent = this._label;

    if (this._iconPosition === "before") {
      button.appendChild(iconEl);
      button.appendChild(labelEl);
    } else {
      button.appendChild(labelEl);
      button.appendChild(iconEl);
    }

    li.appendChild(button);

    this._liEl = li;
    this._buttonEl = button;
    this._labelEl = labelEl;

    this._addEventListeners();
  }

  private _updateIcon(): void {
    if (!this._iconEl) return;

    this._iconEl.innerHTML = "";
    this._iconEl.className = styles.icon;

    if (!this._icon) {
      this._iconEl.style.display = "none";
      return;
    }

    this._iconEl.style.display = "";

    if (typeof this._icon === "string") {
      this._iconEl.className = `${styles.icon} ${this._icon}`;
    } else {
      this._iconEl.appendChild(this._icon);
    }
  }

  protected _addEventListeners(): void {
    if (!this._buttonEl) return;

    this._clickHandler = (ev: MouseEvent) => {
      ev.preventDefault();

      if (!this._disabled && this._currentCtx) {
        const { event, map } = this._currentCtx;
        this.fire("click", {
          originalEvent: ev,
          point: event.point,
          lngLat: event.lngLat,
          features: event.features,
          map
        });
      }
    };

    this._buttonEl.addEventListener("click", this._clickHandler);
  }

  protected _removeEventListeners(): void {
    if (this._buttonEl && this._clickHandler) {
      this._buttonEl.removeEventListener("click", this._clickHandler);
      this._clickHandler = null;
    }
  }
}
