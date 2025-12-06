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
