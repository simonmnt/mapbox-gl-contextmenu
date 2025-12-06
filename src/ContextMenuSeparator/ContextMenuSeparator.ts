import type { ContextMenuContext } from "../types";
import { createElement } from "../util/dom";
import styles from "./ContextMenuSeparator.module.scss";

export interface ContextMenuSeparatorOptions {
  id?: string;
  className?: string;
}

let nextId = 0;

export default class ContextMenuSeparator {
  public readonly id: string;
  private _className: string;
  private _liEl: HTMLElement | null = null;

  constructor(options?: ContextMenuSeparatorOptions) {
    this.id = options?.id ?? `menu-separator-${nextId++}`;
    this._className = options?.className ?? styles.separator;
  }

  render(parent: HTMLElement, _ctx: ContextMenuContext): HTMLElement {
    if (!this._liEl) {
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
      className: this._className,
      role: "separator",
      "aria-orientation": "horizontal"
    });

    this._liEl = li;
  }

  remove(): this {
    this._liEl?.remove();
    this._liEl = null;
    return this;
  }
}
