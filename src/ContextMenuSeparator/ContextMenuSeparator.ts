import type { ContextMenuContext } from "../types";
import { createElement } from "../util/dom";
import styles from "./ContextMenuSeparator.module.scss";

export interface ContextMenuSeparatorOptions {
  /** Custom CSS class name for the separator element. */
  className?: string;
}

/**
 * A horizontal separator line for visually grouping menu items.
 *
 * @example
 * ```ts
 * menu.addItem(new ContextMenuItem({ label: "Edit" }));
 * menu.addItem(new ContextMenuSeparator());
 * menu.addItem(new ContextMenuItem({ label: "Copy" }));
 * menu.addItem(new ContextMenuItem({ label: "Paste" }));
 * ```
 */
export default class ContextMenuSeparator {
  private _className: string;
  private _liEl: HTMLElement | null = null;

  /**
   * Creates a new separator.
   * @param options - Configuration options for the separator.
   * @param options.className - Custom CSS class name for the separator element.
   */
  constructor(options?: ContextMenuSeparatorOptions) {
    this._className = options?.className ?? styles.separator;
  }

  /**
   * @internal
   */
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
      class: this._className,
      role: "separator",
      "aria-orientation": "horizontal"
    });

    this._liEl = li;
  }

  /**
   * Removes the separator from the DOM.
   * @returns The separator instance for method chaining.
   */
  remove(): this {
    this._liEl?.remove();
    this._liEl = null;
    return this;
  }
}
