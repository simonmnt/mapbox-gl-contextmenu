import type { ContextMenuContext, MenuItem } from "../../types";
import ContextMenuItem, {
  type ContextMenuItemOptions
} from "../ContextMenuItem/ContextMenuItem";
import ContextMenu from "../ContextMenu/ContextMenu";
import styles from "./ContextMenuSubmenu.module.scss";
import itemStyles from "../ContextMenuItem/ContextMenuItem.module.scss";
import chevronSvg from "../../icons/chevron-right.svg?raw";

/**
 * Configuration options for creating a context menu submenu.
 * Extends {@link ContextMenuItemOptions} with submenu-specific timing options.
 */
export interface ContextMenuSubmenuOptions extends ContextMenuItemOptions {
  /** Delay in milliseconds before showing the submenu on hover. Defaults to 300. */
  showDelay?: number;
  /** Delay in milliseconds before hiding the submenu when mouse leaves. Defaults to 200. */
  hideDelay?: number;
}

/**
 * A context menu item that displays a submenu when hovered or clicked.
 *
 * Submenus extend regular menu items and can contain their own menu items, shown in a child menu.
 * They display a chevron icon to indicate that child items are available.
 * Submenus open on hover (with a delay) or on click, and can be navigated
 * using keyboard controls.
 *
 * @example
 * ```ts
 * const directionsSubmenu = new ContextMenuSubmenu({
 *   label: "Get directions",
 *   icon: "fa-solid fa-route"
 * });
 *
 * const toHere = new ContextMenuItem({
 *   label: "Directions to here",
 *   icon: "fa-solid fa-arrow-right-to-arc"
 * });
 * toHere.on("click", ({ lngLat }) => {
 *   // Handle click
 * });
 *
 * directionsSubmenu.addItem(toHere);
 * menu.addItem(directionsSubmenu);
 * ```
 */
export default class ContextMenuSubmenu extends ContextMenuItem {
  private _submenu: ContextMenu;
  private _chevronEl: SVGElement | null = null;
  private _hoverTimeout: number | null = null;
  private _submenuContainer: HTMLElement | null = null;
  private _isPinned: boolean = false;
  private _showDelay: number;
  private _hideDelay: number;


  /**
   * Creates a new submenu item.
   * @param options - Configuration options for the submenu item.
   * @param options.label - The text label to display.
   * @param options.icon - CSS class name(s) for the icon (e.g., "fa-solid fa-folder").
   * @param options.iconPosition - Position of the icon relative to the label. Defaults to "before".
   * @param options.disabled - Whether the submenu item is disabled. Defaults to `false`.
   * @param options.className - Custom CSS class name for the `<li>` element.
   * @param options.buttonClassName - Custom CSS class name for the `<button>` element.
   * @param options.showDelay - Delay in milliseconds before showing the submenu on hover. Defaults to 300.
   * @param options.hideDelay - Delay in milliseconds before hiding the submenu when mouse leaves. Defaults to 200.
   */
  constructor(options: ContextMenuSubmenuOptions) {
    super(options);
    this._submenu = new ContextMenu();
    this._showDelay = options.showDelay ?? 300;
    this._hideDelay = options.hideDelay ?? 200;
  }

  /**
   * Adds a menu item to the submenu.
   * @param item - The menu item to add. Can be a `ContextMenuItem` or `ContextMenuSeparator`.
   * @returns The submenu instance for method chaining.
   */
  addItem(item: MenuItem): this {
    this._submenu.addItem(item);
    return this;
  }

  /**
   * Inserts a menu item into the submenu at the specified index.
   * @param index - The index at which to insert the item. If the index is out of bounds, the item will be added at the end.
   * @param item - The menu item to insert. Can be a `ContextMenuItem` or `ContextMenuSeparator`.
   * @returns The submenu instance for method chaining.
   */
  insertItem(index: number, item: MenuItem): this {
    this._submenu.insertItem(index, item);
    return this;
  }

  /**
   * Removes a menu item from the submenu, doing any clean up necessary.
   * @param item - The menu item to remove.
   * @returns The submenu instance for method chaining.
   */
  removeItem(item: MenuItem): this {
    this._submenu.removeItem(item);
    return this;
  }

  /**
   * @internal
   */
  render(parent: HTMLElement, ctx: ContextMenuContext): HTMLElement {
    const liEl = super.render(parent, ctx);

    if (!this._chevronEl && this._buttonEl) {
      this._chevronEl = this._createChevron();
      this._buttonEl.appendChild(this._chevronEl);
    }

    if (!this._submenuContainer) {
      const { map, menuWidth, menuTheme } = ctx;

      this._submenuContainer = map.getContainer();
      this._submenu.addTo(this._submenuContainer);

      if (menuWidth !== undefined) {
        this._submenu.width = menuWidth;
      }

      if (menuTheme !== undefined) {
        this._submenu.theme = menuTheme;
      }
    }

    return liEl;
  }

  focus(): void {
    super.focus();
  }

  blur(): void {
    super.blur();
    this._closeSubmenu();
  }

  /**
   * Opens the submenu and focuses its first item.
   * Used for keyboard navigation (Enter/Space/ArrowRight).
   * @internal
   */
  openAndFocusSubmenu(): void {
    this._openSubmenu();
    this._isPinned = true;

    // Show parent item with lighter highlight while submenu has focus
    this._buttonEl?.classList.remove(itemStyles.focused);
    this._buttonEl?.classList.add(itemStyles.focusedParent);

    // Set up callback so ArrowLeft returns focus to this item
    this._submenu.onEscapeLeft = () => {
      this._buttonEl?.classList.remove(itemStyles.focusedParent);
      this._closeSubmenu();
      this.focus();
    };

    this._submenu.focusFirstItem();
  }

  remove(): this {
    this._removeEventListeners();
    this._cancelOpen();
    this._closeSubmenu();
    this._submenu.remove();
    super.remove();
    this._submenuContainer = null;
    return this;
  }

  protected _addEventListeners(): void {
    // Don't call super - we want our own unified click handler for submenu toggling
    if (!this._buttonEl) return;

    this._handlers.mouseenter = (() => {
      this._scheduleOpen();
    }) as EventListener;

    this._handlers.mouseleave = (() => {
      this._cancelOpen();
      // Don't auto-close if submenu was opened via click (pinned)
      if (this._isPinned) return;
      // Close after a delay to allow moving to submenu
      setTimeout(() => {
        if (!this._isHovering() && !this._isPinned) {
          this._closeSubmenu();
        }
      }, this._hideDelay);
    }) as EventListener;

    // Unified click handler for submenu toggling (doesn't fire "click" event)
    this._handlers.click = ((ev: MouseEvent) => {
      ev.preventDefault();
      ev.stopPropagation();

      const submenuEl = this._submenu.menuElement;
      if (submenuEl?.classList.contains("visible")) {
        this._closeSubmenu();
      } else {
        this._openSubmenu();
        this._isPinned = true;
      }
    }) as EventListener;

    // Prevent Space/Enter from triggering native button click
    // (keyboard navigation is handled by ContextMenu._handleKeydown)
    this._handlers.keydown = ((ev: KeyboardEvent) => {
      if (ev.key === " " || ev.key === "Enter") {
        ev.preventDefault();
      }
    }) as EventListener;

    this._buttonEl.addEventListener("mouseenter", this._handlers.mouseenter);
    this._buttonEl.addEventListener("mouseleave", this._handlers.mouseleave);
    this._buttonEl.addEventListener("click", this._handlers.click);
    this._buttonEl.addEventListener("keydown", this._handlers.keydown);
  }


  private _createChevron(): SVGElement {
    const parser = new DOMParser();
    const svgDoc = parser.parseFromString(chevronSvg, "image/svg+xml");
    const svg = svgDoc.documentElement as unknown as SVGElement;
    svg.setAttribute("class", styles.chevron);
    return svg;
  }

  private _scheduleOpen(): void {
    this._cancelOpen();
    this._hoverTimeout = window.setTimeout(() => {
      this._openSubmenu();
    }, this._showDelay);
  }

  private _cancelOpen(): void {
    if (this._hoverTimeout !== null) {
      clearTimeout(this._hoverTimeout);
      this._hoverTimeout = null;
    }
  }

  private _openSubmenu(): void {
    if (
      !this._buttonEl ||
      !this._submenuContainer ||
      this._disabled ||
      !this._currentCtx
    )
      return;

    // Prevent nested submenus - check if any item in submenu is also a submenu
    const hasNestedSubmenu = this._submenu.items.some(
      (item) => item instanceof ContextMenuSubmenu
    );
    if (hasNestedSubmenu) {
      return; // Don't allow nested submenus
    }

    // Close any other open submenus
    this._closeOtherSubmenus();

    const liRect = this._liEl!.getBoundingClientRect();
    const containerRect = this._submenuContainer.getBoundingClientRect();

    // Position to the right of the menu item, with slight overlap
    let x = liRect.right - containerRect.left - 4;
    let y = liRect.top - containerRect.top;

    // Get actual submenu dimensions (need to show it first to measure)
    this._submenu.show(x, y, this._currentCtx);

    const submenuEl = this._submenu.menuElement;
    if (submenuEl) {
      const submenuWidth = submenuEl.offsetWidth;
      const submenuHeight = submenuEl.offsetHeight;

      // Check if submenu would go off-screen to the right
      if (x + submenuWidth > containerRect.width) {
        // Position to the left instead
        x = liRect.left - containerRect.left - submenuWidth;
      }

      // Check if submenu would go off-screen vertically
      if (y + submenuHeight > containerRect.height) {
        y = containerRect.height - submenuHeight;
      }
      if (y < 0) {
        y = 0;
      }

      // Reposition with correct coordinates
      this._submenu.show(x, y, this._currentCtx);
    }
  }

  private _closeSubmenu(): void {
    this._submenu.hide();
    this._isPinned = false;
    this._buttonEl?.classList.remove(itemStyles.focusedParent);
  }

  private _isHovering(): boolean {
    if (!this._buttonEl) return false;
    const submenuEl = this._submenu.menuElement;
    if (!submenuEl) return false;
    return this._buttonEl.matches(":hover") || submenuEl.matches(":hover");
  }

  private _closeOtherSubmenus(): void {
    if (!this._submenuContainer) return;

    // Close all other visible submenus
    const visibleSubmenus =
      this._submenuContainer.querySelectorAll(`menu.visible`);
    const currentSubmenuEl = this._submenu.menuElement;
    visibleSubmenus.forEach((submenu) => {
      const submenuEl = submenu as HTMLElement;
      if (submenuEl !== currentSubmenuEl) {
        submenuEl.classList.remove("visible");
        submenuEl.style.opacity = "0";
        submenuEl.style.pointerEvents = "none";
        submenuEl.style.visibility = "hidden";
      }
    });
  }
}
