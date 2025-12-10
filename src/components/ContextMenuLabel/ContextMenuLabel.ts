import type { ContextMenuContext } from "../../types";
import { createElement } from "../../util/dom";
import styles from "./ContextMenuLabel.module.scss";

/**
 * Configuration options for creating a context menu label.
 */
export interface ContextMenuLabelOptions {
  /** The text to display. */
  text: string;
  /** Custom CSS class name for the label element. */
  className?: string;
}

/**
 * A non-interactive text label for grouping menu items into sections.
 *
 * @example
 * ```ts
 * menu.addItem(new ContextMenuLabel({ text: "Navigation" }));
 * menu.addItem(new ContextMenuItem({ label: "Center map here" }));
 * menu.addItem(new ContextMenuItem({ label: "Zoom in" }));
 * ```
 */
export default class ContextMenuLabel {
  private _text: string;
  private _className: string;
  private _liEl: HTMLElement | null = null;
  private _textEl: HTMLElement | null = null;

  /**
   * Creates a new label.
   * @param options - Configuration options for the label.
   * @param options.text - The text to display.
   * @param options.className - Custom CSS class name for the label element.
   */
  constructor(options: ContextMenuLabelOptions) {
    this._text = options.text;
    this._className = options.className
      ? `${styles.label} ${options.className}`
      : styles.label;
  }

  /**
   * Gets the text of the label.
   */
  get text(): string {
    return this._text;
  }

  /**
   * Sets the text of the label.
   */
  set text(value: string) {
    this._text = value;
    if (this._textEl) {
      this._textEl.textContent = value;
    }
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
      role: "presentation"
    });

    const text = createElement("span", {
      class: styles.text
    });
    text.textContent = this._text;

    li.appendChild(text);

    this._liEl = li;
    this._textEl = text;
  }

  /**
   * Removes the label from the DOM.
   * @returns The label instance for method chaining.
   */
  remove(): this {
    this._liEl?.remove();
    this._liEl = null;
    this._textEl = null;
    return this;
  }
}
