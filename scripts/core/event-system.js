export class EventSystem
{
    static #instance = null;

    constructor(params = {})
    {
        this.listeners = new Map();
        this.throwListenerErrors = params.throwListenerErrors ?? false;
    }

    static get instance()
    {
        if (!(EventSystem.#instance instanceof EventSystem))
        {
            EventSystem.#instance = new EventSystem();
        }

        return EventSystem.#instance;
    }

    on(eventName, callback, options = {})
    {
        return this.addListener(eventName, callback, {
            once: false,
            context: options.context ?? null,
        });
    }

    once(eventName, callback, options = {})
    {
        return this.addListener(eventName, callback, {
            once: true,
            context: options.context ?? null,
        });
    }

    off(eventName, callback = null)
    {
        if (eventName === undefined || eventName === null)
        {
            this.listeners.clear();
            return 0;
        }

        const normalizedEventName = this.normalizeEventName(eventName);
        const eventListeners = this.listeners.get(normalizedEventName);

        if (!eventListeners || eventListeners.length === 0)
        {
            return 0;
        }

        if (typeof callback !== "function")
        {
            const removedCount = eventListeners.length;
            this.listeners.delete(normalizedEventName);
            return removedCount;
        }

        const originalCount = eventListeners.length;
        const nextListeners = eventListeners.filter(listener => listener.callback !== callback);
        const removedCount = originalCount - nextListeners.length;

        if (nextListeners.length === 0)
        {
            this.listeners.delete(normalizedEventName);
            return removedCount;
        }

        this.listeners.set(normalizedEventName, nextListeners);
        return removedCount;
    }

    emit(eventName, ...args)
    {
        const normalizedEventName = this.normalizeEventName(eventName);
        const eventListeners = this.listeners.get(normalizedEventName);

        if (!eventListeners || eventListeners.length === 0)
        {
            return 0;
        }

        const queue = [...eventListeners];
        let emitCount = 0;

        queue.forEach(listener =>
        {
            emitCount += 1;

            try
            {
                if (listener.context !== null)
                {
                    listener.callback.call(listener.context, ...args);
                }
                else
                {
                    listener.callback(...args);
                }
            }
            catch (error)
            {
                if (this.throwListenerErrors)
                {
                    throw error;
                }

                console.error(`[EventSystem] '${normalizedEventName}' listener error`, error);
            }

            if (listener.once)
            {
                this.removeListenerRecord(normalizedEventName, listener);
            }
        });

        return emitCount;
    }

    clear(eventName = null)
    {
        if (eventName === null)
        {
            this.listeners.clear();
            return;
        }

        const normalizedEventName = this.normalizeEventName(eventName);
        this.listeners.delete(normalizedEventName);
    }

    listenerCount(eventName)
    {
        const normalizedEventName = this.normalizeEventName(eventName);
        return this.listeners.get(normalizedEventName)?.length ?? 0;
    }

    hasListeners(eventName)
    {
        return this.listenerCount(eventName) > 0;
    }

    addListener(eventName, callback, options = {})
    {
        if (typeof callback !== "function")
        {
            throw new Error("EventSystem callback must be a function");
        }

        const normalizedEventName = this.normalizeEventName(eventName);
        const eventListeners = this.listeners.get(normalizedEventName) ?? [];

        const listenerRecord = {
            callback,
            once: options.once ?? false,
            context: options.context ?? null,
        };

        eventListeners.push(listenerRecord);
        this.listeners.set(normalizedEventName, eventListeners);

        return () => this.removeListenerRecord(normalizedEventName, listenerRecord);
    }

    removeListenerRecord(eventName, listenerRecord)
    {
        const eventListeners = this.listeners.get(eventName);
        if (!eventListeners || eventListeners.length === 0) return false;

        const index = eventListeners.indexOf(listenerRecord);
        if (index === -1) return false;

        eventListeners.splice(index, 1);

        if (eventListeners.length === 0)
        {
            this.listeners.delete(eventName);
        }

        return true;
    }

    normalizeEventName(eventName)
    {
        if (eventName === undefined || eventName === null)
        {
            throw new Error("EventSystem eventName is required");
        }

        return String(eventName);
    }
}
