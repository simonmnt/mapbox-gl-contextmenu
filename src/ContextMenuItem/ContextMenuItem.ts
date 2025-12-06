import type { ContextMenuContext } from "../types";
import { ContextMenuItemEvent } from "./ContextMenuItemEvent";
import styles from "./ContextMenuItem.module.css";

export interface ContextMenuItemOptions {
  id?: string;
  className?: string;
  buttonClassName?: string;
  label: string;
  icon?: string;
  iconClass?: string;
  disabled?: boolean;
}

let nextId = 0;

export default class ContextMenuItem extends EventTarget {
  public readonly id: string;
  private _label: string;
  private _icon: string | undefined;
  private _iconClass: string | undefined;
  private _className: string;
  private _buttonClassName: string;
  private _disabled: boolean;

  private _liEl: HTMLLIElement | null = null;
  private _buttonEl: HTMLButtonElement | null = null;
  private _iconEl: HTMLSpanElement | null = null;
  private _labelEl: HTMLSpanElement | null = null;

  private _currentCtx: ContextMenuContext | null = null;

  private _clickHandler: ((ev: MouseEvent) => void) | null = null;

  constructor(options: ContextMenuItemOptions) {
    super();
    this.id = options.id ?? `menu-item-${nextId++}`;
    this._label = options.label;
    this._icon = options.icon;
    this._iconClass = options.iconClass;
    this._className = options.className ?? styles.menuItem;
    this._buttonClassName = options.buttonClassName ?? styles.button;
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
    this._iconClass = undefined;
    this._updateIcon();
  }

  get iconClass(): string | undefined {
    return this._iconClass;
  }

  set iconClass(value: string | undefined) {
    this._iconClass = value;
    this._icon = undefined;
    this._updateIcon();
  }

  get disabled(): boolean {
    return this._disabled;
  }

  set disabled(value: boolean) {
    this._disabled = value;

    if (this._buttonEl) {
      this._buttonEl.disabled = value;
      this._buttonEl.setAttribute("aria-disabled", String(value));
    }
  }

  render(parent: HTMLElement, ctx: ContextMenuContext): HTMLElement {
    this._currentCtx = ctx;

    if (!this._liEl || !this._buttonEl) {
      this._createElements();
    }

    const liEl = this._liEl!;
    if (liEl.parentElement !== parent) {
      parent.appendChild(liEl);
    }

    return liEl;
  }

  private _createElements(): void {
    const li = document.createElement("li");
    li.className = this._className;
    li.setAttribute("role", "presentation");

    const button = document.createElement("button");
    button.className = this._buttonClassName;
    button.setAttribute("role", "menuitem");
    button.disabled = this._disabled;
    button.setAttribute("aria-disabled", String(this._disabled));

    const iconEl = document.createElement("span");
    iconEl.className = "context-menu-icon";

    const labelEl = document.createElement("span");
    labelEl.className = "context-menu-label";
    labelEl.textContent = this._label;

    this._clickHandler = (ev: MouseEvent) => {
      ev.stopPropagation();
      ev.preventDefault();

      if (!this._disabled && this._currentCtx) {
        this.dispatchEvent(
          new ContextMenuItemEvent("click", ev, this._currentCtx)
        );
      }
    };

    button.addEventListener("click", this._clickHandler);
    button.appendChild(iconEl);
    button.appendChild(labelEl);
    li.appendChild(button);

    this._liEl = li;
    this._buttonEl = button;
    this._iconEl = iconEl;
    this._labelEl = labelEl;

    this._updateIcon();
  }

  private _updateIcon(): void {
    if (!this._iconEl) return;

    this._iconEl.innerHTML = "";
    this._iconEl.className = "context-menu-icon";

    if (this._icon) {
      this._iconEl.innerHTML = this._icon;
      this._iconEl.style.display = "";
    } else if (this._iconClass) {
      this._iconEl.className += ` ${this._iconClass}`;
      this._iconEl.style.display = "";
    } else {
      this._iconEl.style.display = "none";
    }
  }

  remove(): this {
    if (this._buttonEl && this._clickHandler) {
      this._buttonEl.removeEventListener("click", this._clickHandler);
      this._clickHandler = null;
    }

    if (this._liEl?.parentElement) {
      this._liEl.remove();
    }

    this._liEl = null;
    this._buttonEl = null;
    this._iconEl = null;
    this._labelEl = null;
    this._currentCtx = null;
    return this;
  }
}
