class SceneManager extends GameEntity
{
    constructor(engine = null)
    {
        super();

        this.engine = engine;

        this.scenes = new Map();
        this.items = [];
        this.sceneStates = new WeakMap();

        this.activeScene = null;
        this.activeSceneKey = null;
        this.defaultSceneKey = null;

        this.isPaused = false;
        this.isSwitching = false;
        this.pauseUpdatesDuringSwitch = true;
        this.switchPromise = null;

        this.loadingScreen = {
            isVisible: false,
            text: "Loading...",
            progress: 0,
            showProgress: true,
            backgroundColor: "rgba(0, 0, 0, 0.72)",
            barColor: "#ffffff",
            barBackgroundColor: "rgba(255, 255, 255, 0.2)",
            customRenderer: null,
        };
    }

    setEngine(engine)
    {
        this.engine = engine;
        return this;
    }

    get Count()
    {
        return this.items.length;
    }

    contains(sceneOrKey)
    {
        return this.resolveSceneRef(sceneOrKey) !== null;
    }

    get(sceneKey)
    {
        return this.scenes.get(sceneKey) ?? null;
    }

    append(scene)
    {
        this.add(scene);
        return scene;
    }

    add(keyOrScene, maybeScene = undefined)
    {
        const { key, scene } = this.parseAddArguments(keyOrScene, maybeScene);

        if (!scene || typeof scene !== "object")
        {
            throw new Error("SceneManager.add(scene) expects a scene object");
        }

        if (this.scenes.has(key))
        {
            throw new Error(`Scene '${key}' is already registered`);
        }

        scene.parent = this;

        this.scenes.set(key, scene);
        this.items.push(scene);
        this.sceneStates.set(scene, {
            initialized: false,
            started: false,
            preloaded: false,
            disabledColliders: new WeakMap(),
        });

        if (this.defaultSceneKey === null)
        {
            this.defaultSceneKey = key;
        }

        if (this.activeScene === null)
        {
            this.activeScene = scene;
            this.activeSceneKey = key;
        }

        return key;
    }

    remove(sceneOrKey, options = {})
    {
        const resolved = this.resolveSceneRef(sceneOrKey);
        if (!resolved) return false;

        // Keep compatibility with GameCollection.remove: removing does not imply destroy by default.
        const destroyScene = options.destroy ?? false;
        const { key, scene } = resolved;

        this.setSceneCollidersActive(scene, false);

        this.scenes.delete(key);
        const index = this.items.indexOf(scene);
        if (index !== -1)
        {
            this.items.splice(index, 1);
        }

        if (destroyScene && typeof scene.destroy === "function")
        {
            scene.destroy();
        }

        if (this.defaultSceneKey === key)
        {
            this.defaultSceneKey = this.scenes.keys().next().value ?? null;
        }

        if (this.activeScene === scene)
        {
            this.activeScene = null;
            this.activeSceneKey = null;
            this.isPaused = false;

            if (this.defaultSceneKey !== null)
            {
                this.activeSceneKey = this.defaultSceneKey;
                this.activeScene = this.scenes.get(this.defaultSceneKey) ?? null;
            }
        }

        return true;
    }

    clear(options = {})
    {
        const destroyScenes = options.destroy ?? true;
        const allScenes = [...this.items];

        allScenes.forEach(scene =>
        {
            this.remove(scene, { destroy: destroyScenes });
        });
    }

    init()
    {
        // SceneManager lazily initializes scenes when they become active.
    }

    start()
    {
        if (!this.activeScene && this.defaultSceneKey !== null)
        {
            this.activeScene = this.scenes.get(this.defaultSceneKey) ?? null;
            this.activeSceneKey = this.defaultSceneKey;
        }

        if (!this.activeScene) return;

        this.ensureSceneReady(this.activeScene);

        this.items.forEach(scene =>
        {
            this.setSceneCollidersActive(scene, scene === this.activeScene);
        });
    }

    update(deltaTime)
    {
        if (!this.activeScene) return;
        if (this.isPaused) return;
        if (this.isSwitching && this.pauseUpdatesDuringSwitch) return;

        this.activeScene.update?.(deltaTime);
    }

    render(ctx)
    {
        if (!this.activeScene) return;
        this.activeScene.render?.(ctx);
    }

    pause()
    {
        if (this.isPaused) return;

        this.isPaused = true;
        this.activeScene?.onPause?.();
    }

    resume()
    {
        if (!this.isPaused) return;

        this.isPaused = false;
        this.activeScene?.onResume?.();
    }

    togglePause()
    {
        if (this.isPaused)
        {
            this.resume();
            return false;
        }

        this.pause();
        return true;
    }

    showLoadingScreen(options = {})
    {
        this.loadingScreen.isVisible = true;
        this.loadingScreen.text = options.text ?? this.loadingScreen.text ?? "Loading...";
        this.loadingScreen.progress = this.normalizeProgress(options.progress ?? 0);
        this.loadingScreen.showProgress = options.showProgress ?? true;
        this.loadingScreen.backgroundColor = options.backgroundColor ?? this.loadingScreen.backgroundColor;
        this.loadingScreen.barColor = options.barColor ?? this.loadingScreen.barColor;
        this.loadingScreen.barBackgroundColor = options.barBackgroundColor ?? this.loadingScreen.barBackgroundColor;
        this.loadingScreen.customRenderer = options.renderer ?? this.loadingScreen.customRenderer;
    }

    hideLoadingScreen()
    {
        this.loadingScreen.isVisible = false;
        this.loadingScreen.progress = 0;
        this.loadingScreen.customRenderer = null;
    }

    setLoadingProgress(progress)
    {
        this.loadingScreen.progress = this.normalizeProgress(progress);
    }

    setLoadingText(text)
    {
        this.loadingScreen.text = text ?? "Loading...";
    }

    async switchTo(sceneOrKey, options = {})
    {
        if (this.switchPromise)
        {
            return this.switchPromise;
        }

        this.switchPromise = this.performSwitch(sceneOrKey, options)
            .finally(() =>
            {
                this.switchPromise = null;
            });

        return this.switchPromise;
    }

    async performSwitch(sceneOrKey, options = {})
    {
        const resolved = this.resolveSceneRef(sceneOrKey);

        if (!resolved)
        {
            throw new Error(`Scene '${sceneOrKey}' is not registered`);
        }

        const switchOptions = {
            showLoadingScreen: options.showLoadingScreen ?? true,
            loadingText: options.loadingText ?? "Loading...",
            loadingRenderer: options.loadingRenderer ?? null,
            loadingProgress: options.loadingProgress ?? 0,
            assets: options.assets ?? null,
            load: options.load ?? null,
            unloadPrevious: options.unloadPrevious ?? false,
            keepPausedState: options.keepPausedState ?? false,
            pauseUpdatesDuringSwitch: options.pauseUpdatesDuringSwitch ?? true,
            resetCamera: options.resetCamera ?? true,
            force: options.force ?? false,
        };

        const { key: nextKey, scene: nextScene } = resolved;
        const previousScene = this.activeScene;
        const previousKey = this.activeSceneKey;
        const pausedBeforeSwitch = this.isPaused;

        if (!switchOptions.force && previousScene === nextScene && !this.isSwitching)
        {
            return nextScene;
        }

        this.pauseUpdatesDuringSwitch = switchOptions.pauseUpdatesDuringSwitch;
        this.isSwitching = true;

        if (switchOptions.showLoadingScreen)
        {
            this.showLoadingScreen({
                text: switchOptions.loadingText,
                progress: switchOptions.loadingProgress,
                renderer: switchOptions.loadingRenderer,
            });
        }

        try
        {
            const context = this.createSwitchContext({
                previousScene,
                previousKey,
                nextScene,
                nextKey,
            });

            await this.prepareScene(nextScene, context, switchOptions);
            this.setSceneCollidersActive(nextScene, false);

            previousScene?.onExit?.(nextScene, context);

            if (previousScene && previousScene !== nextScene)
            {
                this.setSceneCollidersActive(previousScene, false);
            }

            this.activeScene = nextScene;
            this.activeSceneKey = nextKey;

            this.setSceneCollidersActive(nextScene, true);

            if (switchOptions.resetCamera)
            {
                this.resetEngineCamera();
            }

            if (switchOptions.keepPausedState)
            {
                this.isPaused = pausedBeforeSwitch;
            }
            else
            {
                this.isPaused = false;
            }

            nextScene.onEnter?.(previousScene, context);

            if (switchOptions.unloadPrevious && previousScene && previousScene !== nextScene)
            {
                this.remove(previousKey, { destroy: true });
            }

            return nextScene;
        }
        catch (error)
        {
            this.setSceneCollidersActive(nextScene, false);

            if (previousScene)
            {
                this.activeScene = previousScene;
                this.activeSceneKey = previousKey;
                this.setSceneCollidersActive(previousScene, true);
                this.isPaused = pausedBeforeSwitch;
            }

            throw error;
        }
        finally
        {
            if (switchOptions.showLoadingScreen)
            {
                this.hideLoadingScreen();
            }

            this.isSwitching = false;
        }
    }

    ensureSceneReady(scene)
    {
        const state = this.sceneStates.get(scene);
        if (!state) return;

        if (!state.initialized)
        {
            scene.init?.();
            state.initialized = true;
        }

        if (!state.started)
        {
            scene.start?.();
            state.started = true;
        }
    }

    async prepareScene(scene, context, options)
    {
        const state = this.sceneStates.get(scene);
        if (!state) return;

        if (options.assets)
        {
            await this.getEngine().prepareData(options.assets);
        }

        if (!state.preloaded && typeof scene.preload === "function")
        {
            await scene.preload(context);
            state.preloaded = true;
        }

        if (typeof options.load === "function")
        {
            await options.load(context);
        }

        this.ensureSceneReady(scene);
    }

    createSwitchContext({
        previousScene = null,
        previousKey = null,
        nextScene = null,
        nextKey = null,
    } = {})
    {
        return {
            engine: this.getEngine(),
            manager: this,
            previousScene,
            previousKey,
            nextScene,
            nextKey,
            setProgress: progress => this.setLoadingProgress(progress),
            setText: text => this.setLoadingText(text),
        };
    }

    resetEngineCamera()
    {
        const engine = this.getEngine();
        engine.activeCameraComponent = null;
        engine.setCameraPosition(0, 0);
    }

    renderOverlay(ctx)
    {
        if (!this.loadingScreen.isVisible) return;

        const engine = this.getEngine();
        const dpr = engine.devicePixelRatio || 1;
        const width = engine.screenWidth || engine.designWidth || 1920;
        const height = engine.screenHeight || engine.designHeight || 1080;

        const progress = this.getLoadingProgress();
        const payload = {
            width,
            height,
            text: this.loadingScreen.text,
            progress,
        };

        ctx.save();
        ctx.setTransform(dpr, 0, 0, dpr, 0, 0);

        if (typeof this.loadingScreen.customRenderer === "function")
        {
            this.loadingScreen.customRenderer(ctx, payload);
            ctx.restore();
            return;
        }

        ctx.fillStyle = this.loadingScreen.backgroundColor;
        ctx.fillRect(0, 0, width, height);

        ctx.fillStyle = "#ffffff";
        ctx.textAlign = "center";
        ctx.textBaseline = "middle";
        ctx.font = "600 36px sans-serif";
        ctx.fillText(this.loadingScreen.text, width / 2, height / 2 - 60);

        if (this.loadingScreen.showProgress)
        {
            const barWidth = Math.max(220, Math.min(560, width * 0.42));
            const barHeight = 18;
            const barX = (width - barWidth) / 2;
            const barY = height / 2 - barHeight / 2;

            ctx.fillStyle = this.loadingScreen.barBackgroundColor;
            ctx.fillRect(barX, barY, barWidth, barHeight);

            ctx.fillStyle = this.loadingScreen.barColor;
            ctx.fillRect(barX, barY, barWidth * (progress / 100), barHeight);

            ctx.font = "500 20px sans-serif";
            ctx.fillText(`${Math.round(progress)}%`, width / 2, barY + 44);
        }

        ctx.restore();
    }

    getLoadingProgress()
    {
        const engine = this.getEngine();
        const assetLoaderProgress =
            engine.assetLoader && engine.assetLoader.totalAssets > 0
                ? engine.assetLoader.loadProgress
                : 0;

        return this.normalizeProgress(Math.max(this.loadingScreen.progress, assetLoaderProgress));
    }

    getEngine()
    {
        if (this.engine) return this.engine;
        return Engine.instance;
    }

    setSceneCollidersActive(scene, isActive)
    {
        const state = this.sceneStates.get(scene);
        if (!state) return;

        const colliders = this.collectSceneColliders(scene);

        colliders.forEach(collider =>
        {
            if (isActive)
            {
                if (state.disabledColliders.has(collider))
                {
                    collider.isEnabled = state.disabledColliders.get(collider);
                    state.disabledColliders.delete(collider);
                }

                return;
            }

            if (!state.disabledColliders.has(collider))
            {
                state.disabledColliders.set(collider, collider.isEnabled);
            }

            collider.isEnabled = false;
        });
    }

    collectSceneColliders(scene)
    {
        if (!scene?.gameObjects?.items?.length) return [];

        if (typeof ColliderComponent === "undefined")
        {
            return [];
        }

        const colliders = [];

        scene.gameObjects.items.forEach(gameObject =>
        {
            if (!gameObject?.components?.items?.length) return;

            gameObject.components.items.forEach(component =>
            {
                if (component instanceof ColliderComponent)
                {
                    colliders.push(component);
                }
            });
        });

        return colliders;
    }

    parseAddArguments(keyOrScene, maybeScene)
    {
        if (maybeScene === undefined)
        {
            const scene = keyOrScene;
            const key = this.generateSceneKey(scene);
            return { key, scene };
        }

        const key = String(keyOrScene);
        const scene = maybeScene;
        return { key, scene };
    }

    resolveSceneRef(sceneOrKey)
    {
        if (typeof sceneOrKey === "string")
        {
            const sceneByKey = this.scenes.get(sceneOrKey);

            if (!sceneByKey) return null;

            return {
                key: sceneOrKey,
                scene: sceneByKey,
            };
        }

        const scene = sceneOrKey;

        for (const [key, registeredScene] of this.scenes.entries())
        {
            if (registeredScene === scene)
            {
                return { key, scene };
            }
        }

        return null;
    }

    generateSceneKey(scene)
    {
        const baseKey = (scene?.name || scene?.constructor?.name || "scene")
            .toString()
            .trim() || "scene";

        if (!this.scenes.has(baseKey))
        {
            return baseKey;
        }

        let index = 1;
        let nextKey = `${baseKey}_${index}`;

        while (this.scenes.has(nextKey))
        {
            index += 1;
            nextKey = `${baseKey}_${index}`;
        }

        return nextKey;
    }

    normalizeProgress(progress)
    {
        const numericValue = Number(progress);
        if (Number.isNaN(numericValue)) return 0;
        return Math.max(0, Math.min(100, numericValue));
    }
}
