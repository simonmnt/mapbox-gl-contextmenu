import type { Content, SlotOptions } from "../types";

export function createElement(
  tagName: string,
  attributes: {
    [key: string]: string | number;
  },
  container?: Element
): HTMLElement {
  const el = document.createElement(tagName);

  for (const name of Object.keys(attributes)) {
    el.setAttribute(name, String(attributes[name]));
  }

  if (container) container.appendChild(el);

  return el;
}

/**
 * Creates an HTMLElement from slot content, merging with defaults.
 * - `undefined`: Returns null
 * - `HTMLElement`: Returns as-is
 * - `string`: Creates element with defaults + content
 * - `SlotOptions`: Merges with defaults, combining classNames
 */
export function createSlotElement(
  content: Content | undefined,
  defaults: SlotOptions
): HTMLElement | null {
  if (content === undefined) return null;
  if (content instanceof HTMLElement) return content;

  if (typeof content === "string") {
    const el = document.createElement(defaults.as ?? "span");
    if (defaults.className) el.className = defaults.className;
    el.textContent = content;
    return el;
  }

  // SlotOptions - merge with defaults, combining classNames
  const className = content.className
    ? `${defaults.className ?? ""} ${content.className}`.trim()
    : defaults.className;

  const el = document.createElement(content.as ?? defaults.as ?? "span");
  if (className) el.className = className;
  if (content.content) el.textContent = content.content;
  if (content.onClick) el.addEventListener("click", content.onClick);
  return el;
}
