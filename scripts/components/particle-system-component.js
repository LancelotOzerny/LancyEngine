import { BaseComponent } from "../core/base-component.js";
import { Engine } from "../core/engine.js";

export class ParticleSystemComponent extends BaseComponent
{
    constructor(params = {})
    {
        super(params);

        this.maxParticles = params.maxParticles ?? 300;
        this.emissionRate = params.emissionRate ?? 50;
        this.duration = params.duration ?? 1;
        this.looping = params.looping ?? false;
        this.autoplay = params.autoplay ?? true;

        this.shape = params.shape ?? "point";
        this.radius = params.radius ?? 0;

        this.lifetime = this.normalizeRange(params.lifetime, 0.3, 1);
        this.speed = this.normalizeRange(params.speed, 100, 300);
        this.angle = this.normalizeRange(params.angle, 0, Math.PI * 2);
        this.gravity = {
            x: params.gravity?.x ?? 0,
            y: params.gravity?.y ?? 0,
        };

        this.startSize = this.normalizeRange(params.startSize, 4, 12);
        this.endSize = this.normalizeRange(params.endSize, 0, 0);
        this.startAlpha = params.startAlpha ?? 1;
        this.endAlpha = params.endAlpha ?? 0;
        this.startColor = params.startColor ?? "#ffffff";
        this.endColor = params.endColor ?? this.startColor;
        this.textureKey = params.textureKey ?? null;
        this.blendMode = params.blendMode ?? "source-over";
        this.worldSpace = params.worldSpace ?? true;
        this.renderShape = params.renderShape ?? params.particleShape ?? "circle";

        this.texture = null;
        this.particles = [];
        this.activeParticles = [];
        this.freeParticles = [];
        this.emissionAccumulator = 0;
        this.emissionTime = 0;
        this.playing = this.autoplay;
        this.paused = false;
        this.startColorRgba = this.parseHexColor(this.startColor);
        this.endColorRgba = this.parseHexColor(this.endColor);
        this._spawnOffsetX = 0;
        this._spawnOffsetY = 0;

        this.createPool();
    }

    init()
    {
        this.texture = this.textureKey
            ? Engine.instance.assets?.get(this.textureKey) ?? null
            : null;
    }

    update(dt)
    {
        const deltaTime = Math.max(0, Number(dt) || 0);

        if (this.playing && !this.paused)
        {
            this.updateEmission(deltaTime);
        }

        this.updateParticles(deltaTime);
    }

    render(ctx)
    {
        if (this.activeParticles.length === 0) return;

        const origin = this.parent.transform.position;
        const previousComposite = ctx.globalCompositeOperation;

        ctx.save();
        ctx.globalCompositeOperation = this.blendMode;

        for (let index = this.activeParticles.length - 1; index >= 0; index--)
        {
            const particle = this.activeParticles[index];
            const progress = particle.age / particle.lifetime;
            const size = lerp(particle.startSize, particle.endSize, progress);
            const alpha = lerp(particle.startAlpha, particle.endAlpha, progress);
            const halfSize = size / 2;
            const x = (this.worldSpace ? particle.x : origin.x + particle.x);
            const y = (this.worldSpace ? particle.y : origin.y + particle.y);

            if (size <= 0 || alpha <= 0) continue;

            ctx.globalAlpha = alpha;

            if (this.texture)
            {
                ctx.drawImage(this.texture, x - halfSize, y - halfSize, size, size);
                continue;
            }

            ctx.fillStyle = this.getParticleColor(particle, progress);

            if (this.renderShape === "rect")
            {
                ctx.fillRect(x - halfSize, y - halfSize, size, size);
            }
            else
            {
                ctx.beginPath();
                ctx.arc(x, y, halfSize, 0, Math.PI * 2);
                ctx.fill();
            }
        }

        ctx.restore();
        ctx.globalCompositeOperation = previousComposite;
    }

    play()
    {
        this.playing = true;
        this.paused = false;

        if (this.emissionTime >= this.duration && !this.looping)
        {
            this.emissionTime = 0;
            this.emissionAccumulator = 0;
        }

        return this;
    }

    pause()
    {
        this.paused = true;
        return this;
    }

    stop(clear = false)
    {
        this.playing = false;
        this.paused = false;
        this.emissionAccumulator = 0;

        if (clear)
        {
            this.clear();
        }

        return this;
    }

    clear()
    {
        for (let index = this.activeParticles.length - 1; index >= 0; index--)
        {
            const particle = this.activeParticles[index];
            particle.active = false;
            this.freeParticles.push(particle);
        }

        this.activeParticles.length = 0;
        return this;
    }

    emit(count = 1)
    {
        const amount = Math.max(0, Math.floor(count));

        for (let index = 0; index < amount; index++)
        {
            const particle = this.freeParticles.pop();
            if (!particle) return this;

            this.spawnParticle(particle);
            this.activeParticles.push(particle);
        }

        return this;
    }

    burst(count = 10)
    {
        return this.emit(count);
    }

    isPlaying()
    {
        return this.playing && !this.paused;
    }

    getAliveCount()
    {
        return this.activeParticles.length;
    }

    createPool()
    {
        this.particles.length = 0;
        this.activeParticles.length = 0;
        this.freeParticles.length = 0;

        for (let index = 0; index < this.maxParticles; index++)
        {
            const particle = this.createParticle();
            this.particles.push(particle);
            this.freeParticles.push(particle);
        }
    }

    createParticle()
    {
        return {
            active: false,
            x: 0,
            y: 0,
            vx: 0,
            vy: 0,
            age: 0,
            lifetime: 1,
            startSize: 1,
            endSize: 0,
            startAlpha: 1,
            endAlpha: 0,
            startColor: this.startColor,
            endColor: this.endColor,
            startColorR: this.startColorRgba.r,
            startColorG: this.startColorRgba.g,
            startColorB: this.startColorRgba.b,
            endColorR: this.endColorRgba.r,
            endColorG: this.endColorRgba.g,
            endColorB: this.endColorRgba.b,
        };
    }

    updateEmission(dt)
    {
        if (!this.looping && this.duration > 0 && this.emissionTime >= this.duration)
        {
            this.playing = false;
            return;
        }

        this.emissionTime += dt;

        if (this.looping && this.duration > 0 && this.emissionTime >= this.duration)
        {
            this.emissionTime %= this.duration;
        }

        if (!this.looping && this.duration > 0 && this.emissionTime > this.duration)
        {
            dt -= this.emissionTime - this.duration;
            this.playing = false;
        }

        if (dt <= 0 || this.emissionRate <= 0) return;

        this.emissionAccumulator += this.emissionRate * dt;
        const count = Math.floor(this.emissionAccumulator);

        if (count > 0)
        {
            this.emissionAccumulator -= count;
            this.emit(count);
        }
    }

    updateParticles(dt)
    {
        for (let index = this.activeParticles.length - 1; index >= 0; index--)
        {
            const particle = this.activeParticles[index];

            particle.age += dt;

            if (particle.age >= particle.lifetime)
            {
                this.recycleParticle(index);
                continue;
            }

            particle.vx += this.gravity.x * dt;
            particle.vy += this.gravity.y * dt;
            particle.x += particle.vx * dt;
            particle.y += particle.vy * dt;
        }
    }

    recycleParticle(activeIndex)
    {
        const particle = this.activeParticles[activeIndex];
        const last = this.activeParticles.pop();

        if (activeIndex < this.activeParticles.length)
        {
            this.activeParticles[activeIndex] = last;
        }

        particle.active = false;
        this.freeParticles.push(particle);
    }

    spawnParticle(particle)
    {
        const origin = this.parent.transform.position;
        const angle = this.randomRange(this.angle);
        const speed = this.randomRange(this.speed);
        this.setSpawnOffset();

        particle.active = true;
        particle.age = 0;
        particle.lifetime = Math.max(0.001, this.randomRange(this.lifetime));
        particle.x = (this.worldSpace ? origin.x : 0) + this._spawnOffsetX;
        particle.y = (this.worldSpace ? origin.y : 0) + this._spawnOffsetY;
        particle.vx = Math.cos(angle) * speed;
        particle.vy = Math.sin(angle) * speed;
        particle.startSize = this.randomRange(this.startSize);
        particle.endSize = this.randomRange(this.endSize);
        particle.startAlpha = this.startAlpha;
        particle.endAlpha = this.endAlpha;
        particle.startColor = this.startColor;
        particle.endColor = this.endColor;
        particle.startColorR = this.startColorRgba.r;
        particle.startColorG = this.startColorRgba.g;
        particle.startColorB = this.startColorRgba.b;
        particle.endColorR = this.endColorRgba.r;
        particle.endColorG = this.endColorRgba.g;
        particle.endColorB = this.endColorRgba.b;
    }

    setSpawnOffset()
    {
        if (this.shape === "circle")
        {
            const angle = Math.random() * Math.PI * 2;
            const radius = Math.sqrt(Math.random()) * this.radius;

            this._spawnOffsetX = Math.cos(angle) * radius;
            this._spawnOffsetY = Math.sin(angle) * radius;
            return;
        }

        if (this.shape === "edgeCircle")
        {
            const angle = Math.random() * Math.PI * 2;

            this._spawnOffsetX = Math.cos(angle) * this.radius;
            this._spawnOffsetY = Math.sin(angle) * this.radius;
            return;
        }

        this._spawnOffsetX = 0;
        this._spawnOffsetY = 0;
    }

    getParticleColor(particle, progress)
    {
        if (this.startColor === this.endColor)
        {
            return this.startColor;
        }

        const r = Math.round(lerp(particle.startColorR, particle.endColorR, progress));
        const g = Math.round(lerp(particle.startColorG, particle.endColorG, progress));
        const b = Math.round(lerp(particle.startColorB, particle.endColorB, progress));

        return `rgb(${r}, ${g}, ${b})`;
    }

    normalizeRange(value, fallbackMin, fallbackMax)
    {
        if (typeof value === "number")
        {
            return { min: value, max: value };
        }

        return {
            min: value?.min ?? fallbackMin,
            max: value?.max ?? fallbackMax,
        };
    }

    randomRange(range)
    {
        const min = Number(range.min) || 0;
        const max = Number(range.max) || 0;

        return min + Math.random() * (max - min);
    }

    parseHexColor(color)
    {
        if (typeof color !== "string" || color[0] !== "#")
        {
            return { r: 255, g: 255, b: 255 };
        }

        if (color.length === 4)
        {
            return {
                r: parseInt(color[1] + color[1], 16),
                g: parseInt(color[2] + color[2], 16),
                b: parseInt(color[3] + color[3], 16),
            };
        }

        if (color.length === 7)
        {
            return {
                r: parseInt(color.slice(1, 3), 16),
                g: parseInt(color.slice(3, 5), 16),
                b: parseInt(color.slice(5, 7), 16),
            };
        }

        return { r: 255, g: 255, b: 255 };
    }
}

function lerp(start, end, t)
{
    return start + (end - start) * Math.max(0, Math.min(1, t));
}
