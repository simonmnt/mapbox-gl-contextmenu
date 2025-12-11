import type {
  Content,
  ContextMenuContext,
  ContextMenuItemEvent
} from "../../types";
import { Evented } from "../../util/evented";
import { createElement, createSlotElement } from "../../util/dom";
import styles from "./ContextMenuItem.module.scss";

interface ContextMenuItemEvents extends Record<string, unknown> {
  click: ContextMenuItemEvent;
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
  /** Content to display before the label (e.g., an icon element). */
  start?: Content;
  /** Content to display after the label. */
  end?: Content;
  /** Whether the menu item is disabled. Defaults to `false`. */
  disabled?: boolean;
}

/**
 * A context menu item that can be added to a context menu.
 *
 * Menu items can display a label with optional content before and/or after it,
 * and can be enabled or disabled. When clicked, menu items fire a "click" event
 * with context data including the map, coordinates, and any features at the click location.
 *
 * @example
 * ```ts
 * const item = new ContextMenuItem({
 *   label: "Center here",
 *   start: { className: "fa-solid fa-crosshairs" }
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
  private _start: Content | undefined;
  private _end: Content | undefined;
  protected _disabled: boolean;

  protected _liEl: HTMLElement | null = null;
  protected _buttonEl: HTMLElement | null = null;
  private _startEl: HTMLElement | null = null;
  private _labelEl: HTMLElement | null = null;
  private _endEl: HTMLElement | null = null;

  protected _currentCtx: ContextMenuContext | null = null;

  protected _handlers: Record<string, EventListener | null> = {};

  /**
   * Creates a new context menu item.
   * @param options - Configuration options for the menu item.
   * @param options.label - The text label to display.
   * @param options.start - Content to display before the label (e.g., an icon element).
   * @param options.end - Content to display after the label.
   * @param options.disabled - Whether the menu item is disabled. Defaults to `false`.
   * @param options.className - Custom CSS class name for the `<li>` element.
   * @param options.buttonClassName - Custom CSS class name for the `<button>` element.
   */
  constructor(options: ContextMenuItemOptions) {
    super();
    this._className = options.className
      ? `${styles.menuItem} ${options.className}`
      : styles.menuItem;
    this._buttonClassName = options.buttonClassName
      ? `${styles.button} ${options.buttonClassName}`
      : styles.button;
    this._label = options.label;
    this._start = options.start;
    this._end = options.end;
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
   * Gets the start slot content of the menu item.
   * @returns The start content (string or HTMLElement), or `undefined` if not set.
   */
  get start(): Content | undefined {
    return this._start;
  }

  /**
   * Sets the start slot content of the menu item.
   * @param value - A string (rendered as text) or HTMLElement, or undefined to remove.
   */
  set start(value: Content | undefined) {
    this._start = value;
    this._startEl = this._updateSlot(value, styles.start, this._startEl, this._labelEl);
  }

  /**
   * Gets the end slot content of the menu item.
   * @returns The end content (string or HTMLElement), or `undefined` if not set.
   */
  get end(): Content | undefined {
    return this._end;
  }

  /**
   * Sets the end slot content of the menu item.
   * @param value - A string (rendered as text) or HTMLElement, or undefined to remove.
   */
  set end(value: Content | undefined) {
    this._end = value;
    this._endEl = this._updateSlot(value, styles.end, this._endEl);
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
    this._startEl = null;
    this._labelEl = null;
    this._endEl = null;
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

    const labelEl = createElement("span", {
      class: styles.label
    });
    labelEl.textContent = this._label;

    this._startEl = createSlotElement(this._start, { className: styles.start });
    this._endEl = createSlotElement(this._end, { className: styles.end });

    if (this._startEl) button.appendChild(this._startEl);

    button.appendChild(labelEl);

    if (this._endEl) button.appendChild(this._endEl);

    li.appendChild(button);

    this._liEl = li;
    this._buttonEl = button;
    this._labelEl = labelEl;

    this._addEventListeners();
  }

  private _updateSlot(
    content: Content | undefined,
    className: string,
    currentEl: HTMLElement | null,
    insertBefore?: HTMLElement | null
  ): HTMLElement | null {
    const newEl = createSlotElement(content, { className });

    if (currentEl) {
      if (newEl) {
        currentEl.replaceWith(newEl);
      } else {
        currentEl.remove();
      }
    } else if (newEl && this._buttonEl) {
      if (insertBefore) {
        this._buttonEl.insertBefore(newEl, insertBefore);
      } else {
        this._buttonEl.appendChild(newEl);
      }
    }

    return newEl;
  }

  protected _addEventListeners(): void {
    if (!this._buttonEl) return;

    this._handlers.click = ((ev: MouseEvent) => {
      ev.preventDefault();

      if (!this._disabled && this._currentCtx) {
        const { event, map } = this._currentCtx;
        this.fire("click", {
          type: "click",
          target: this,
          originalEvent: ev,
          point: event.point,
          lngLat: event.lngLat,
          features: event.features,
          map
        });
      }
    }) as EventListener;

    this._buttonEl.addEventListener("click", this._handlers.click);
  }

  protected _removeEventListeners(): void {
    if (!this._buttonEl) return;

    for (const [event, handler] of Object.entries(this._handlers)) {
      if (!handler) continue;

      this._buttonEl.removeEventListener(event, handler);
      this._handlers[event] = null;
    }
  }
}
