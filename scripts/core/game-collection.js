export class GameCollection
{
    items = [];

    constructor(parent = null, options = {})
    {
        if (parent) this.parent = parent;

        this.onAttach = typeof options.onAttach === "function" ? options.onAttach : null;
        this.onDetach = typeof options.onDetach === "function" ? options.onDetach : null;

        this._pendingAdd = [];
        this._pendingRemove = new Set();
        this._iterationDepth = 0;
    }

    append(item)
    {
        this.add(item);
    }

    add(item)
    {
        if (!item) return false;

        if (this._pendingRemove.has(item))
        {
            // Architectural fix: re-adding during the same frame cancels delayed removal.
            this._pendingRemove.delete(item);
            return true;
        }

        if (this.contains(item) || this._pendingAdd.includes(item))
        {
            return false;
        }

        if (this._iterationDepth > 0)
        {
            this._pendingAdd.push(item);
            return true;
        }

        this._attachItem(item);
        return true;
    }

    remove(item)
    {
        if (!item) return false;

        const pendingAddIndex = this._pendingAdd.indexOf(item);
        if (pendingAddIndex !== -1)
        {
            this._pendingAdd.splice(pendingAddIndex, 1);
            return true;
        }

        if (!this.contains(item))
        {
            return false;
        }

        if (this._iterationDepth > 0)
        {
            // Architectural fix: remove during update/render is postponed until iteration ends.
            this._pendingRemove.add(item);
            return true;
        }

        this._detachItem(item);
        return true;
    }

    clear(options = {})
    {
        const shouldDestroy = options.destroy ?? false;
        const snapshot = [...this.items, ...this._pendingAdd];

        snapshot.forEach(item =>
        {
            this.remove(item);

            if (shouldDestroy && typeof item?.destroy === "function")
            {
                item.destroy();
            }
        });

        if (this._iterationDepth === 0)
        {
            this._flushPending();
        }
    }

    init()
    {
        this._iterate("init");
    }

    destroy()
    {
        this._iterate("destroy");
        this.clear();
    }

    start()
    {
        this._iterate("start");
    }

    update(deltaTime)
    {
        this._iterate("update", [deltaTime]);
    }

    render(ctx)
    {
        this._iterate("render", [ctx]);
    }

    contains(item)
    {
        return this.items.indexOf(item) !== -1;
    }

    get Count()
    {
        return this.items.length;
    }

    _attachItem(item)
    {
        this.items.push(item);

        if (typeof this.parent !== "undefined")
        {
            item.parent = this.parent;
        }

        this.onAttach?.(item, this.parent, this);
    }

    _detachItem(item)
    {
        const index = this.items.indexOf(item);
        if (index === -1) return;

        this.items.splice(index, 1);

        this.onDetach?.(item, this.parent, this);

        if (item?.parent === this.parent)
        {
            item.parent = null;
        }
    }

    _iterate(methodName, args = [])
    {
        this._iterationDepth += 1;
        const snapshot = [...this.items];

        try
        {
            snapshot.forEach(item =>
            {
                if (!this._shouldInvoke(item, methodName))
                {
                    return;
                }

                this._invokeMethod(item, methodName, args);
            });
        }
        finally
        {
            this._iterationDepth -= 1;

            if (this._iterationDepth === 0)
            {
                this._flushPending();
            }
        }
    }

    _shouldInvoke(item, methodName)
    {
        if (!this.contains(item)) return false;
        if (this._pendingRemove.has(item)) return false;

        if (item && typeof item._isDestroyed === "boolean" && item._isDestroyed && methodName !== "destroy")
        {
            return false;
        }

        if (
            (methodName === "update" || methodName === "render") &&
            item &&
            typeof item._isStarted === "boolean" &&
            item._isStarted === false
        )
        {
            return false;
        }

        return true;
    }

    _invokeMethod(item, methodName, args)
    {
        const method = item?.[methodName];
        if (typeof method === "function")
        {
            method.apply(item, args);
        }
    }

    _flushPending()
    {
        if (this._pendingRemove.size > 0)
        {
            const removals = [...this._pendingRemove];
            this._pendingRemove.clear();

            removals.forEach(item =>
            {
                this._detachItem(item);
            });
        }

        if (this._pendingAdd.length > 0)
        {
            const additions = [...this._pendingAdd];
            this._pendingAdd.length = 0;

            additions.forEach(item =>
            {
                if (!this.contains(item))
                {
                    this._attachItem(item);
                }
            });
        }
    }
}
