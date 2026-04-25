import { BaseComponent } from "../core/base-component.js";
import { Engine } from "../core/engine.js";
import { SpriteComponent } from "./sprite-component.js";

export class AnimationStateMachine
{
    constructor(component, states = {}, options = {})
    {
        this.component = component;
        this.states = new Map();
        this.parameters = new Map();

        this.currentState = null;
        this.currentStateName = null;
        this.currentFrameIndex = 0;
        this.frameTime = 0;
        this.stateTime = 0;

        this.defaultFps = Number(options.defaultFps ?? 12) || 12;

        this.setStates(states);

        const firstState = this.states.keys().next().value ?? null;
        const initialState = options.initialState ?? firstState;

        if (initialState)
        {
            this.setState(initialState, { force: true });
        }
    }

    setStates(states = {})
    {
        const source = states && typeof states === "object" ? states : {};
        this.states.clear();

        Object.entries(source).forEach(([name, definition]) =>
        {
            const state = this.normalizeState(name, definition ?? {});
            this.states.set(name, state);
        });
    }

    normalizeState(name, definition = {})
    {
        const fps = Number(definition.fps ?? this.defaultFps);
        const frameDuration = fps > 0 ? 1 / fps : 1 / this.defaultFps;
        const frames = this.component.normalizeFrames(definition.frames ?? [0], definition);

        if (frames.length === 0)
        {
            throw new Error(`AnimationState '${name}' must contain at least one frame`);
        }

        const transitions = Array.isArray(definition.transitions)
            ? definition.transitions
                .filter(transition => transition && transition.to)
                .map(transition =>
                {
                    const normalizedTransition = {
                        to: String(transition.to),
                    };

                    if (typeof transition.when === "function")
                    {
                        normalizedTransition.when = transition.when;
                    }

                    if ("param" in transition) normalizedTransition.param = transition.param;
                    if ("equals" in transition) normalizedTransition.equals = transition.equals;
                    if ("notEquals" in transition) normalizedTransition.notEquals = transition.notEquals;
                    if ("greaterThan" in transition) normalizedTransition.greaterThan = transition.greaterThan;
                    if ("lessThan" in transition) normalizedTransition.lessThan = transition.lessThan;

                    return normalizedTransition;
                })
            : [];

        return {
            name,
            frames,
            frameDuration,
            loop: definition.loop ?? true,
            next: definition.next ?? null,
            speed: Number(definition.speed ?? 1) || 1,
            startFrame: Math.max(0, Math.floor(definition.startFrame ?? 0)),
            transitions,
            onEnter: typeof definition.onEnter === "function" ? definition.onEnter : null,
            onExit: typeof definition.onExit === "function" ? definition.onExit : null,
            onComplete: typeof definition.onComplete === "function" ? definition.onComplete : null,
        };
    }

    getCurrentFrame()
    {
        if (!this.currentState) return null;
        return this.currentState.frames[this.currentFrameIndex] ?? null;
    }

    setState(name, options = {})
    {
        const force = options.force ?? false;
        const stateName = String(name);
        const nextState = this.states.get(stateName);

        if (!nextState)
        {
            throw new Error(`AnimationState '${stateName}' is not registered`);
        }

        if (!force && this.currentStateName === stateName)
        {
            return false;
        }

        const previousState = this.currentState;
        const previousStateName = this.currentStateName;

        if (previousState?.onExit)
        {
            previousState.onExit(this.createContext({
                from: previousStateName,
                to: stateName,
            }));
        }

        this.currentState = nextState;
        this.currentStateName = stateName;
        this.currentFrameIndex = Math.min(nextState.frames.length - 1, nextState.startFrame);
        this.frameTime = 0;
        this.stateTime = 0;

        if (nextState.onEnter)
        {
            nextState.onEnter(this.createContext({
                from: previousStateName,
                to: stateName,
            }));
        }

        if (this.component?.onStateChanged)
        {
            this.component.onStateChanged({
                from: previousStateName,
                to: stateName,
                state: this.currentStateName,
            });
        }

        return true;
    }

    update(deltaTime)
    {
        if (!this.currentState) return null;

        this.tryTransit();

        const state = this.currentState;
        const safeDelta = Number(deltaTime);
        const dt = Number.isFinite(safeDelta) && safeDelta > 0 ? safeDelta : 0;

        if (dt <= 0)
        {
            return this.getCurrentFrame();
        }

        this.stateTime += dt;
        this.frameTime += dt * state.speed;

        let currentFrame = this.getCurrentFrame();
        let frameDuration = currentFrame?.duration ?? state.frameDuration;
        let loopGuard = 0;

        while (frameDuration > 0 && this.frameTime >= frameDuration && loopGuard < 120)
        {
            this.frameTime -= frameDuration;

            const canContinue = this.advanceFrame();
            currentFrame = this.getCurrentFrame();
            frameDuration = currentFrame?.duration ?? this.currentState?.frameDuration ?? frameDuration;

            if (!canContinue)
            {
                this.frameTime = 0;
                break;
            }

            loopGuard += 1;
        }

        this.tryTransit();

        return this.getCurrentFrame();
    }

    advanceFrame()
    {
        if (!this.currentState) return false;

        const state = this.currentState;
        const frameCount = state.frames.length;
        const lastFrameIndex = frameCount - 1;

        if (this.currentFrameIndex < lastFrameIndex)
        {
            this.currentFrameIndex += 1;
            return true;
        }

        if (state.onComplete)
        {
            state.onComplete(this.createContext({
                state: this.currentStateName,
            }));
        }

        if (state.next)
        {
            this.setState(state.next);
            return true;
        }

        if (state.loop)
        {
            this.currentFrameIndex = Math.min(lastFrameIndex, state.startFrame);
            return true;
        }

        this.currentFrameIndex = lastFrameIndex;
        return false;
    }

    tryTransit()
    {
        const state = this.currentState;
        if (!state || !Array.isArray(state.transitions) || state.transitions.length === 0)
        {
            return false;
        }

        for (const transition of state.transitions)
        {
            if (!this.states.has(transition.to))
            {
                continue;
            }

            if (this.isTransitionMatched(transition))
            {
                const isSwitched = this.setState(transition.to);
                if (isSwitched)
                {
                    return true;
                }
            }
        }

        return false;
    }

    isTransitionMatched(transition)
    {
        if (typeof transition.when === "function")
        {
            return !!transition.when(this.createContext({
                state: this.currentStateName,
            }));
        }

        if (!transition.param)
        {
            return false;
        }

        const value = this.getParam(transition.param);

        let hasRule = false;

        if ("equals" in transition)
        {
            hasRule = true;
            if (value !== transition.equals) return false;
        }

        if ("notEquals" in transition)
        {
            hasRule = true;
            if (value === transition.notEquals) return false;
        }

        if ("greaterThan" in transition)
        {
            hasRule = true;
            if (!(value > transition.greaterThan)) return false;
        }

        if ("lessThan" in transition)
        {
            hasRule = true;
            if (!(value < transition.lessThan)) return false;
        }

        return hasRule ? true : !!value;
    }

    setParam(name, value)
    {
        this.parameters.set(String(name), value);
    }

    getParam(name)
    {
        return this.parameters.get(String(name));
    }

    createContext(extra = {})
    {
        return {
            machine: this,
            component: this.component,
            owner: this.component?.parent ?? null,
            state: this.currentStateName,
            timeInState: this.stateTime,
            ...extra,
        };
    }
}

export class AnimationComponent extends BaseComponent
{
    spriteComponent = null;
    spriteSheet = null;
    stateMachine = null;

    isPlaying = true;
    isPaused = false;
    playbackRate = 1;
    autoSize = true;

    frameWidth = null;
    frameHeight = null;
    columns = null;
    initialState = null;
    defaultFps = 12;

    constructor(params = {})
    {
        super(params);

        this.frameWidth = params.frameWidth ?? null;
        this.frameHeight = params.frameHeight ?? null;
        this.columns = params.columns ?? null;

        this.defaultFps = Number(params.fps ?? 12) || 12;
        this.initialState = params.initialState ?? null;

        this.playbackRate = Number(params.playbackRate ?? 1) || 1;
        this.autoSize = params.autoSize ?? (params.width === undefined && params.height === undefined);

        this.isPlaying = params.autoPlay ?? true;
    }

    init()
    {
        this.spriteComponent = this.resolveSpriteComponent();
        this.spriteSheet = this.resolveSpriteSheet();

        const states = this.params.states ?? {};
        if (Object.keys(states).length === 0)
        {
            throw new Error("AnimationComponent requires at least one state in params.states");
        }

        this.stateMachine = new AnimationStateMachine(this, states, {
            initialState: this.initialState,
            defaultFps: this.defaultFps,
        });

        const currentFrame = this.stateMachine.getCurrentFrame();
        this.applyFrame(currentFrame);
    }

    update(deltaTime)
    {
        if (!this.stateMachine) return;
        if (!this.isPlaying || this.isPaused) return;

        const dt = Math.max(0, Number(deltaTime) || 0) * Math.max(0, this.playbackRate);
        const frame = this.stateMachine.update(dt);
        this.applyFrame(frame);
    }

    play(stateName = null, options = {})
    {
        if (!this.stateMachine) return;

        if (stateName !== null && stateName !== undefined)
        {
            this.stateMachine.setState(stateName, {
                force: options.force ?? options.restart ?? false,
            });
            this.applyFrame(this.stateMachine.getCurrentFrame());
        }
        else if (options.restart && this.stateMachine.currentStateName)
        {
            this.stateMachine.setState(this.stateMachine.currentStateName, { force: true });
            this.applyFrame(this.stateMachine.getCurrentFrame());
        }

        this.isPlaying = true;
        this.isPaused = false;
    }

    setState(stateName, options = {})
    {
        this.play(stateName, options);
    }

    pause()
    {
        this.isPaused = true;
    }

    resume()
    {
        this.isPaused = false;
        this.isPlaying = true;
    }

    stop(options = {})
    {
        this.isPlaying = false;
        this.isPaused = false;

        if (options.resetFrame !== false && this.stateMachine?.currentState)
        {
            this.stateMachine.currentFrameIndex = Math.min(
                this.stateMachine.currentState.frames.length - 1,
                this.stateMachine.currentState.startFrame
            );
            this.applyFrame(this.stateMachine.getCurrentFrame());
        }
    }

    setPlaybackRate(value = 1)
    {
        const numericValue = Number(value);
        this.playbackRate = Number.isFinite(numericValue) ? numericValue : 1;
    }

    setParam(name, value)
    {
        this.stateMachine?.setParam(name, value);
    }

    getParam(name)
    {
        return this.stateMachine?.getParam(name);
    }

    getState()
    {
        return this.stateMachine?.currentStateName ?? null;
    }

    onStateChanged(context)
    {
        if (typeof this.params.onStateChanged === "function")
        {
            this.params.onStateChanged(context);
        }
    }

    resolveSpriteComponent()
    {
        let spriteComponent = this.parent.findComponent(SpriteComponent);

        if (spriteComponent)
        {
            return spriteComponent;
        }

        if (this.params.autoCreateSprite === false)
        {
            throw new Error("AnimationComponent requires SpriteComponent when autoCreateSprite=false");
        }

        spriteComponent = new SpriteComponent({
            sprite: this.params.sprite ?? this.params.spriteKey,
            width: this.params.width,
            height: this.params.height,
            color: this.params.color,
        });

        this.parent.bindComponent(spriteComponent);
        spriteComponent.init?.();

        return spriteComponent;
    }

    resolveSpriteSheet()
    {
        const imageFromParams = this.params.spriteSheet ?? this.params.image ?? null;

        if (this.isImageObject(imageFromParams))
        {
            if (!this.spriteComponent.sprite)
            {
                this.spriteComponent.sprite = imageFromParams;
            }

            return imageFromParams;
        }

        const spriteKey = this.params.sprite ?? this.params.spriteKey ?? this.spriteComponent.params?.sprite;

        if (spriteKey)
        {
            const assetImage = Engine.instance.assets?.get(spriteKey);
            if (assetImage)
            {
                this.spriteComponent.sprite = assetImage;
                return assetImage;
            }
        }

        if (this.isImageObject(this.spriteComponent.sprite))
        {
            return this.spriteComponent.sprite;
        }

        throw new Error(
            "AnimationComponent could not resolve sprite sheet. " +
            "Pass params.sprite with an asset key or params.spriteSheet with an Image."
        );
    }

    isImageObject(value)
    {
        if (!value || typeof value !== "object") return false;
        return typeof value.width === "number" && typeof value.height === "number";
    }

    normalizeFrames(frames, stateDefinition = {})
    {
        const sourceFrames = Array.isArray(frames) && frames.length > 0 ? frames : [0];
        return sourceFrames.map(frame => this.normalizeFrame(frame, stateDefinition));
    }

    normalizeFrame(frame, stateDefinition = {})
    {
        const baseDuration = this.resolveDefaultFrameDuration(stateDefinition);

        if (typeof frame === "number")
        {
            return {
                ...this.resolveFrameByIndex(frame, stateDefinition),
                duration: baseDuration,
            };
        }

        if (Array.isArray(frame))
        {
            const column = Number(frame[0] ?? 0);
            const row = Number(frame[1] ?? 0);
            const duration = Number(frame[2] ?? baseDuration);

            return {
                ...this.resolveFrameByColumnRow(column, row, stateDefinition),
                duration: Number.isFinite(duration) && duration > 0 ? duration : baseDuration,
            };
        }

        if (frame && typeof frame === "object")
        {
            const duration = Number(frame.duration ?? baseDuration);
            const normalizedDuration = Number.isFinite(duration) && duration > 0 ? duration : baseDuration;

            if (typeof frame.index === "number")
            {
                return {
                    ...this.resolveFrameByIndex(frame.index, {
                        ...stateDefinition,
                        frameWidth: frame.frameWidth ?? stateDefinition.frameWidth,
                        frameHeight: frame.frameHeight ?? stateDefinition.frameHeight,
                        columns: frame.columns ?? stateDefinition.columns,
                    }),
                    duration: normalizedDuration,
                };
            }

            if (typeof frame.column === "number" && typeof frame.row === "number")
            {
                return {
                    ...this.resolveFrameByColumnRow(frame.column, frame.row, {
                        ...stateDefinition,
                        frameWidth: frame.frameWidth ?? stateDefinition.frameWidth,
                        frameHeight: frame.frameHeight ?? stateDefinition.frameHeight,
                        columns: frame.columns ?? stateDefinition.columns,
                    }),
                    duration: normalizedDuration,
                };
            }

            if (typeof frame.x === "number" && typeof frame.y === "number")
            {
                const frameSize = this.resolveFrameSize({
                    ...stateDefinition,
                    frameWidth: frame.width ?? stateDefinition.frameWidth,
                    frameHeight: frame.height ?? stateDefinition.frameHeight,
                });

                return {
                    x: frame.x,
                    y: frame.y,
                    width: frame.width ?? frameSize.width,
                    height: frame.height ?? frameSize.height,
                    duration: normalizedDuration,
                };
            }
        }

        throw new Error("AnimationComponent frame must be number, tuple [column,row], or frame object");
    }

    resolveDefaultFrameDuration(stateDefinition = {})
    {
        const fps = Number(stateDefinition.fps ?? this.defaultFps);
        if (!Number.isFinite(fps) || fps <= 0) return 1 / this.defaultFps;
        return 1 / fps;
    }

    resolveFrameSize(stateDefinition = {})
    {
        const frameWidth = Number(stateDefinition.frameWidth ?? this.frameWidth);
        const frameHeight = Number(stateDefinition.frameHeight ?? this.frameHeight);

        const width = Number.isFinite(frameWidth) && frameWidth > 0
            ? frameWidth
            : (this.spriteSheet?.width ?? this.spriteSheet?.naturalWidth ?? 1);

        const height = Number.isFinite(frameHeight) && frameHeight > 0
            ? frameHeight
            : (this.spriteSheet?.height ?? this.spriteSheet?.naturalHeight ?? 1);

        return { width, height };
    }

    resolveColumns(stateDefinition = {}, frameWidth = 1)
    {
        const explicitColumns = Number(stateDefinition.columns ?? this.columns);
        if (Number.isFinite(explicitColumns) && explicitColumns > 0)
        {
            return Math.max(1, Math.floor(explicitColumns));
        }

        const sheetWidth = this.spriteSheet?.width ?? this.spriteSheet?.naturalWidth ?? 1;
        return Math.max(1, Math.floor(sheetWidth / Math.max(1, frameWidth)));
    }

    resolveFrameByIndex(index, stateDefinition = {})
    {
        const normalizedIndex = Math.max(0, Math.floor(Number(index) || 0));
        const frameSize = this.resolveFrameSize(stateDefinition);
        const columns = this.resolveColumns(stateDefinition, frameSize.width);

        return {
            x: (normalizedIndex % columns) * frameSize.width,
            y: Math.floor(normalizedIndex / columns) * frameSize.height,
            width: frameSize.width,
            height: frameSize.height,
        };
    }

    resolveFrameByColumnRow(column, row, stateDefinition = {})
    {
        const frameSize = this.resolveFrameSize(stateDefinition);
        const normalizedColumn = Math.max(0, Math.floor(Number(column) || 0));
        const normalizedRow = Math.max(0, Math.floor(Number(row) || 0));

        return {
            x: normalizedColumn * frameSize.width,
            y: normalizedRow * frameSize.height,
            width: frameSize.width,
            height: frameSize.height,
        };
    }

    applyFrame(frame)
    {
        if (!frame || !this.spriteComponent) return;

        if (!this.spriteComponent.sprite && this.spriteSheet)
        {
            this.spriteComponent.sprite = this.spriteSheet;
        }

        this.spriteComponent.setSourceRect(frame.x, frame.y, frame.width, frame.height);

        if (this.autoSize)
        {
            if (this.params.width === undefined)
            {
                this.spriteComponent.width = frame.width;
            }

            if (this.params.height === undefined)
            {
                this.spriteComponent.height = frame.height;
            }
        }
    }
}
