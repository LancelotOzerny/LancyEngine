import { getEasing } from "./easing.js";

export class TweenManager
{
    constructor()
    {
        this.tweens = new Map();
        this.nextId = 1;
    }

    tween(target, props, duration, options = {})
    {
        return this.to(target, props, duration, options);
    }

    to(target, props, duration, options = {})
    {
        return this._createTween(target, props, duration, options, "to");
    }

    from(target, props, duration, options = {})
    {
        return this._createTween(target, props, duration, options, "from");
    }

    clear(tweenId)
    {
        return this.tweens.delete(tweenId);
    }

    clearTarget(target)
    {
        let removed = 0;

        this.tweens.forEach((tween, id) =>
        {
            if (tween.target === target)
            {
                this.tweens.delete(id);
                removed += 1;
            }
        });

        return removed;
    }

    clearAll()
    {
        this.tweens.clear();
    }

    pause(tweenId)
    {
        const tween = this.tweens.get(tweenId);
        if (!tween) return false;

        tween.paused = true;
        return true;
    }

    resume(tweenId)
    {
        const tween = this.tweens.get(tweenId);
        if (!tween) return false;

        tween.paused = false;
        return true;
    }

    update(dt)
    {
        const snapshot = [...this.tweens.values()];

        snapshot.forEach(tween =>
        {
            if (!this.tweens.has(tween.id)) return;

            if (this._isOwnerDestroyed(tween.owner))
            {
                this.clear(tween.id);
                return;
            }

            if (tween.paused) return;

            this._updateTween(tween, Math.max(0, dt));
        });
    }

    _createTween(target, props, duration, options = {}, mode = "to")
    {
        if (!target || typeof target !== "object")
        {
            throw new Error("Tween target must be an object");
        }

        const propNames = Object.keys(props ?? {});
        if (propNames.length === 0)
        {
            throw new Error("Tween props must contain at least one property");
        }

        const id = this.nextId++;
        const startValues = {};
        const endValues = {};

        propNames.forEach(key =>
        {
            const current = Number(target[key]) || 0;
            const value = Number(props[key]) || 0;

            if (mode === "from")
            {
                startValues[key] = value;
                endValues[key] = current;
                target[key] = value;
                return;
            }

            startValues[key] = current;
            endValues[key] = value;
        });

        this.tweens.set(id, {
            id,
            target,
            startValues,
            endValues,
            duration: Math.max(0, Number(duration) || 0),
            elapsed: 0,
            delay: Math.max(0, Number(options.delay) || 0),
            delayElapsed: 0,
            easing: getEasing(options.easing ?? "linear"),
            repeat: options.repeat ?? 0,
            yoyo: options.yoyo ?? false,
            owner: options.owner ?? null,
            onStart: typeof options.onStart === "function" ? options.onStart : null,
            onUpdate: typeof options.onUpdate === "function" ? options.onUpdate : null,
            onComplete: typeof options.onComplete === "function" ? options.onComplete : null,
            paused: options.paused ?? false,
            started: false,
            direction: 1,
            iteration: 0,
        });

        return id;
    }

    _updateTween(tween, dt)
    {
        if (tween.delayElapsed < tween.delay)
        {
            tween.delayElapsed += dt;
            if (tween.delayElapsed < tween.delay) return;
            dt = tween.delayElapsed - tween.delay;
        }

        if (!tween.started)
        {
            tween.started = true;
            tween.onStart?.(tween);
        }

        if (tween.duration === 0)
        {
            this._applyTween(tween, 1);
            tween.onUpdate?.(tween);
            this._completeTween(tween);
            return;
        }

        tween.elapsed += dt;
        const progress = Math.min(1, tween.elapsed / tween.duration);
        this._applyTween(tween, tween.easing(progress));
        tween.onUpdate?.(tween);

        if (progress < 1) return;

        if (this._shouldRepeat(tween))
        {
            this._restartTween(tween);
            return;
        }

        this._completeTween(tween);
    }

    _applyTween(tween, easedProgress)
    {
        const t = tween.direction === 1 ? easedProgress : 1 - easedProgress;

        Object.keys(tween.endValues).forEach(key =>
        {
            const start = tween.startValues[key];
            const end = tween.endValues[key];
            tween.target[key] = start + (end - start) * t;
        });
    }

    _shouldRepeat(tween)
    {
        return tween.repeat === Infinity || tween.iteration < tween.repeat;
    }

    _restartTween(tween)
    {
        tween.iteration += 1;
        tween.elapsed = 0;

        if (tween.yoyo)
        {
            tween.direction *= -1;
        }
        else
        {
            this._applyTween(tween, 0);
        }
    }

    _completeTween(tween)
    {
        this.clear(tween.id);
        tween.onComplete?.(tween);
    }

    _isOwnerDestroyed(owner)
    {
        return Boolean(owner && owner._isDestroyed === true);
    }
}
