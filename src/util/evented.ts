type EventHandler<T = unknown> = (event: T) => void;

export class Evented<
  Events extends Record<string, unknown> = Record<string, unknown>
> {
  private _eventHandlers: Record<string, EventHandler[]> = {};

  /**
   * Registers an event handler for the specified event type.
   * @param type - The event type to listen for.
   * @param handler - The function to call when the event is fired.
   * @returns The instance for method chaining.
   */
  on<K extends keyof Events>(type: K, handler: EventHandler<Events[K]>): this {
    const handlers =
      this._eventHandlers[type as string] ||
      (this._eventHandlers[type as string] = []);
    handlers.push(handler as EventHandler);
    return this;
  }

  /**
   * Unregisters an event handler for the specified event type.
   * @param type - The event type to stop listening for.
   * @param handler - The function to remove from the event handlers.
   * @returns The instance for method chaining.
   */
  off<K extends keyof Events>(type: K, handler: EventHandler<Events[K]>): this {
    const handlers = this._eventHandlers[type as string];
    if (handlers) {
      const index = handlers.indexOf(handler as EventHandler);
      if (index !== -1) {
        handlers.splice(index, 1);
      }
    }
    return this;
  }

  /**
   * Fires an event, calling all registered handlers for the event type.
   * @param type - The event type to fire.
   * @param event - The event data to pass to the handlers.
   * @returns The instance for method chaining.
   */
  fire<K extends keyof Events>(type: K, event: Events[K]): this {
    const handlers = this._eventHandlers[type as string];
    if (handlers) {
      for (const handler of handlers.slice()) {
        (handler as EventHandler<Events[K]>)(event);
      }
    }
    return this;
  }

  /**
   * Checks whether there are any registered handlers for the specified event type.
   * @param type - The event type to check.
   * @returns `true` if there are registered handlers for the event type, `false` otherwise.
   */
  listens<K extends keyof Events>(type: K): boolean {
    const handlers = this._eventHandlers[type as string];
    return !!(handlers && handlers.length > 0);
  }
}
