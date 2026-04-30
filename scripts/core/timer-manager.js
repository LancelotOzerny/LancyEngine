export class TimerManager
{
    constructor()
    {
        this.timers = new Map();
        this.nextId = 1;
    }

    setTimeout(callback, delay, options = {})
    {
        return this._createTimer("timeout", callback, delay, options);
    }

    setInterval(callback, interval, options = {})
    {
        return this._createTimer("interval", callback, interval, options);
    }

    wait(delay)
    {
        return new Promise(resolve =>
        {
            this.setTimeout(resolve, delay);
        });
    }

    clear(timerId)
    {
        return this.timers.delete(timerId);
    }

    clearAll()
    {
        this.timers.clear();
    }

    pause(timerId)
    {
        const timer = this.timers.get(timerId);
        if (!timer) return false;

        timer.paused = true;
        return true;
    }

    resume(timerId)
    {
        const timer = this.timers.get(timerId);
        if (!timer) return false;

        timer.paused = false;
        return true;
    }

    update(dt, unscaledDt = dt)
    {
        const snapshot = [...this.timers.values()];

        snapshot.forEach(timer =>
        {
            if (!this.timers.has(timer.id)) return;

            if (this._isOwnerDestroyed(timer.owner))
            {
                this.clear(timer.id);
                return;
            }

            if (timer.paused) return;

            const deltaTime = timer.useUnscaledTime ? unscaledDt : dt;
            timer.elapsed += Math.max(0, deltaTime);

            if (timer.type === "timeout")
            {
                this._updateTimeout(timer);
                return;
            }

            this._updateInterval(timer);
        });
    }

    _createTimer(type, callback, delay, options = {})
    {
        if (typeof callback !== "function")
        {
            throw new Error("Timer callback must be a function");
        }

        const duration = Math.max(0, Number(delay) || 0);
        const id = this.nextId++;

        this.timers.set(id, {
            id,
            type,
            callback,
            duration,
            elapsed: 0,
            paused: options.paused ?? false,
            useUnscaledTime: options.useUnscaledTime ?? false,
            owner: options.owner ?? null,
        });

        return id;
    }

    _updateTimeout(timer)
    {
        if (timer.elapsed < timer.duration) return;

        this.clear(timer.id);
        timer.callback(timer);
    }

    _updateInterval(timer)
    {
        if (timer.duration === 0)
        {
            timer.callback(timer);
            return;
        }

        let guard = 0;

        while (timer.elapsed >= timer.duration && this.timers.has(timer.id))
        {
            timer.elapsed -= timer.duration;
            timer.callback(timer);

            guard += 1;
            if (guard >= 1000)
            {
                timer.elapsed = 0;
                break;
            }
        }
    }

    _isOwnerDestroyed(owner)
    {
        return Boolean(owner && owner._isDestroyed === true);
    }
}
