import type { ContextMenuContext, ContextMenuItemEventData } from "../types";
import { Evented } from "../util/evented";
import { createElement } from "../util/dom";
import styles from "./ContextMenuItem.module.scss";

interface ContextMenuItemEventRegistry
  extends Record<string, ContextMenuItemEventData | void> {
  click: ContextMenuItemEventData;
}

export interface ContextMenuItemOptions {
  id?: string;
  className?: string;
  buttonClassName?: string;
  label: string;
  icon?: string;
  iconPosition?: "before" | "after";
  disabled?: boolean;
}

let nextId = 0;

export default class ContextMenuItem extends Evented<ContextMenuItemEventRegistry> {
  public readonly id: string;
  private _className: string;
  private _buttonClassName: string;
  private _label: string;
  private _icon: string | undefined;
  private _iconPosition: "before" | "after";
  private _disabled: boolean;

  private _liEl: HTMLElement | null = null;
  private _buttonEl: HTMLElement | null = null;
  private _iconEl: HTMLElement | null = null;
  private _labelEl: HTMLElement | null = null;

  private _currentCtx: ContextMenuContext | null = null;

  private _clickHandler: ((ev: MouseEvent) => void) | null = null;

  constructor(options: ContextMenuItemOptions) {
    super();
    this.id = options.id ?? `menu-item-${nextId++}`;
    this._className = options.className ?? styles.menuItem;
    this._buttonClassName = options.buttonClassName ?? styles.button;
    this._label = options.label;
    this._icon = options.icon;
    this._iconPosition = options.iconPosition ?? "before";
    this._disabled = options.disabled ?? false;
  }

  get label(): string {
    return this._label;
  }

  set label(value: string) {
    this._label = value;

    if (this._labelEl) {
      this._labelEl.textContent = value;
    }
  }

  get icon(): string | undefined {
    return this._icon;
  }

  set icon(value: string | undefined) {
    this._icon = value;
    this._updateIcon();
  }

  get disabled(): boolean {
    return this._disabled;
  }

  set disabled(value: boolean) {
    this._disabled = value;

    if (this._buttonEl) {
      (this._buttonEl as HTMLButtonElement).disabled = value;
      this._buttonEl.setAttribute("aria-disabled", String(value));
    }
  }

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

    button.addEventListener("click", this._clickHandler);

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
  }

  private _updateIcon(): void {
    if (!this._iconEl) return;

    this._iconEl.className = this._icon
      ? `${styles.icon} ${this._icon}`
      : styles.icon;
    this._iconEl.style.display = this._icon ? "" : "none";
  }

  remove(): this {
    if (this._buttonEl && this._clickHandler) {
      this._buttonEl.removeEventListener("click", this._clickHandler);
      this._clickHandler = null;
    }

    this._liEl?.remove();

    this._liEl = null;
    this._buttonEl = null;
    this._iconEl = null;
    this._labelEl = null;
    this._currentCtx = null;
    return this;
  }
}
