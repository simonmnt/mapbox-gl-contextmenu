export function createElement(
  tagName: string,
  attributes: {
    [key: string]: string | number;
  },
  container?: Element
): HTMLElement {
  const el = document.createElement(tagName);

  for (const name of Object.keys(attributes)) {
    const attrName = name === "className" ? "class" : name;
    el.setAttribute(attrName, String(attributes[name]));
  }

  if (container) container.appendChild(el);

  return el;
}
