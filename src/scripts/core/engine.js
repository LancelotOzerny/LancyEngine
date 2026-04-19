class Engine extends GameEntity
{
    static #instance = null;

    scenes = new GameCollection();

    constructor() {
        super();

        this.canvas = null;
        this.context = null;

        this.isRunning = false;
        this.isFirstRunning = false;
        this.animationFrameId = null;
        this.activeCameraComponent = null;

        this.lastTime = 0;
        this.fps = 60;
        this.frameTime = 1000 / this.fps;
        this.elapsedTime = 0;

        this.isInitialized = false;

        this.assetLoader = new AssetLoader();
        this.assets = this.assetLoader.assets; // совместимость со SpriteComponent
        this.input = new InputSystem();

        this.params = {};

        // Базовое "дизайнерское" разрешение
        this.designWidth = 1920;
        this.designHeight = 1080;

        // Текущий видимый размер мира в world units
        this.viewWidth = 1920;
        this.viewHeight = 1080;

        // Реальный размер canvas на экране
        this.screenWidth = 1920;
        this.screenHeight = 1080;

        // Масштаб мира -> экран
        this.scale = 1;
        this.devicePixelRatio = 1;

        // Камера
        this.camera = new Vector2(0, 0);

        // Смещение мира, чтобы при широком окне
        // показывать больше пространства слева/справа
        this.worldOffset = new Vector2(0, 0);

        this.backgroundColor = "#000000";

        /**
         * screenMode:
         * - "expand"  -> фиксируем высоту мира, а по ширине показываем больше/меньше
         * - "contain" -> весь кадр 1920x1080 всегда виден целиком, могут быть поля
         */
        this.screenMode = "expand";

        this.fitToWindow = true;
        this.autoResize = true;
        this.centerView = true;
        this.pixelArt = false;

        // Ограничение большого deltaTime, если вкладка была неактивна
        this.maxDeltaTime = 100;

        this._onResize = this.resize.bind(this);
    }

    init(selector, params = {}) {
        this.params = params;

        this.canvas = document.querySelector(selector);
        if (!this.canvas) {
            throw new Error(`Canvas with selector ${selector} is not found!`);
        }

        this.context = this.canvas.getContext("2d");
        if (!this.context) {
            throw new Error("2D context is not available!");
        }

        this.designWidth = params.width ?? 1920;
        this.designHeight = params.height ?? 1080;

        this.viewWidth = this.designWidth;
        this.viewHeight = this.designHeight;

        this.backgroundColor = params.backgroundColor ?? "#000000";
        this.screenMode = params.screenMode ?? "expand";
        this.fitToWindow = params.fitToWindow ?? true;
        this.autoResize = params.autoResize ?? true;
        this.centerView = params.centerView ?? true;
        this.pixelArt = params.pixelArt ?? false;
        this.maxDeltaTime = params.maxDeltaTime ?? 100;

        this.camera.set(params.cameraX ?? 0, params.cameraY ?? 0);

        this.context.imageSmoothingEnabled = !this.pixelArt;

        if (this.pixelArt) {
            this.canvas.style.imageRendering = "pixelated";
        }

        if (this.fitToWindow) {
            this.canvas.style.display = "block";
            this.canvas.style.margin = "0";
            this.canvas.style.padding = "0";
        }

        this.resize();

        if (this.autoResize) {
            window.addEventListener("resize", this._onResize);
        }

        this.scenes.init();
        this.isInitialized = true;
    }

    resize() {
        if (!this.canvas || !this.context) return;

        let cssWidth;
        let cssHeight;

        if (this.fitToWindow) {
            cssWidth = window.innerWidth;
            cssHeight = window.innerHeight;
        } else {
            const rect = this.canvas.getBoundingClientRect();
            cssWidth = rect.width || this.designWidth;
            cssHeight = rect.height || this.designHeight;
        }

        this.screenWidth = Math.max(1, Math.round(cssWidth));
        this.screenHeight = Math.max(1, Math.round(cssHeight));
        this.devicePixelRatio = window.devicePixelRatio || 1;

        // Реальный размер backbuffer
        this.canvas.width = Math.max(1, Math.round(this.screenWidth * this.devicePixelRatio));
        this.canvas.height = Math.max(1, Math.round(this.screenHeight * this.devicePixelRatio));

        // CSS-размер canvas
        this.canvas.style.width = `${this.screenWidth}px`;
        this.canvas.style.height = `${this.screenHeight}px`;

        this.updateView();
    }

    updateView() {
        if (this.screenMode === "contain") {
            this.scale = Math.min(
                this.screenWidth / this.designWidth,
                this.screenHeight / this.designHeight
            );

            this.viewWidth = this.designWidth;
            this.viewHeight = this.designHeight;

            this.worldOffset.x = 0;
            this.worldOffset.y = 0;
            return;
        }

        // Основной режим:
        // фиксируем высоту дизайна, а ширину мира меняем под aspect ratio окна
        this.scale = this.screenHeight / this.designHeight;
        this.viewHeight = this.designHeight;
        this.viewWidth = this.screenWidth / this.scale;

        if (this.centerView) {
            this.worldOffset.x = (this.viewWidth - this.designWidth) / 2;
            this.worldOffset.y = (this.viewHeight - this.designHeight) / 2;
        } else {
            this.worldOffset.x = 0;
            this.worldOffset.y = 0;
        }
    }

    setCameraPosition(x, y) {
        this.camera.set(x, y);
    }

    moveCamera(dx, dy) {
        this.camera.x += dx;
        this.camera.y += dy;
    }

    centerCameraOn(x, y) {
        this.camera.x = x + this.worldOffset.x - this.viewWidth / 2;
        this.camera.y = y + this.worldOffset.y - this.viewHeight / 2;
    }

    worldToScreen(x, y) {
        return new Vector2(
            (x - this.camera.x + this.worldOffset.x) * this.scale,
            (y - this.camera.y + this.worldOffset.y) * this.scale
        );
    }

    screenToWorld(x, y) {
        return new Vector2(
            this.camera.x - this.worldOffset.x + x / this.scale,
            this.camera.y - this.worldOffset.y + y / this.scale
        );
    }

    setResolution(width, height) {
        this.designWidth = width;
        this.designHeight = height;
        this.updateView();
    }

    #startGameLoop() {
        if (this.isRunning) {
            console.warn("Игровой цикл уже запущен");
            return;
        }

        this.isRunning = true;
        this.lastTime = performance.now();
        this.elapsedTime = 0;

        if (!this.isFirstRunning) {
            this.start();
            this.isFirstRunning = true;
        }

        this.#gameLoop();
    }

    stopGameLoop() {
        if (!this.isRunning) {
            console.warn("Игровой цикл не запущен");
            return;
        }

        if (this.animationFrameId) {
            cancelAnimationFrame(this.animationFrameId);
            this.animationFrameId = null;
        }

        this.isRunning = false;
    }

    #gameLoop(time = performance.now()) {
        if (!this.isRunning) return;

        const deltaMs = Math.min(time - this.lastTime, this.maxDeltaTime);
        this.lastTime = time;
        this.elapsedTime += deltaMs;

        let hadLogicUpdate = false;

        while (this.elapsedTime >= this.frameTime) {
            this.update(this.frameTime / 1000);
            this.elapsedTime -= this.frameTime;
            hadLogicUpdate = true;
        }

        CollisionSystem.instance.updateCollisions();
        this.renderFrame();

        // Очищаем pressed/released только если реально был логический кадр
        if (hadLogicUpdate) {
            this.input.update();
        }

        this.animationFrameId = requestAnimationFrame(this.#gameLoop.bind(this));
    }

    start() {
        this.scenes.start();
    }

    update(dt) {
        this.scenes.update(dt);
    }

    render(ctx) {
        this.scenes.render(ctx);
    }

    renderFrame()
    {
        const ctx = this.context;
        if (!ctx) return;

        this.updateView();

        const dpr = this.devicePixelRatio;

        ctx.setTransform(1, 0, 0, 1, 0, 0);
        ctx.clearRect(0, 0, this.canvas.width, this.canvas.height);

        if (this.backgroundColor !== null)
        {
            ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
            ctx.fillStyle = this.backgroundColor;
            ctx.fillRect(0, 0, this.screenWidth, this.screenHeight);
        }

        let screenOffsetX = 0;
        let screenOffsetY = 0;

        if (this.screenMode === "contain")
        {
            screenOffsetX = (this.screenWidth - this.designWidth * this.scale) / 2;
            screenOffsetY = (this.screenHeight - this.designHeight * this.scale) / 2;
        }

        ctx.save();

        ctx.setTransform(
            this.scale * dpr,
            0,
            0,
            this.scale * dpr,
            (screenOffsetX + (-this.camera.x + this.worldOffset.x) * this.scale) * dpr,
            (screenOffsetY + (-this.camera.y + this.worldOffset.y) * this.scale) * dpr
        );

        this.render(ctx);

        ctx.restore();
    }

    destroy() {
        this.stopGameLoop();
        window.removeEventListener("resize", this._onResize);
        super.destroy();
    }

    static get instance()
    {
        if (!(Engine.#instance instanceof Engine))
        {
            Engine.#instance = new Engine();
        }

        return Engine.#instance;
    }

    async prepareData(data = {
        images: []
    })
    {
        this.assets = await this.assetLoader.loadImages(this.data?.images ?? [])
    }

    async run(prepareFunc, data)
    {
        await this.prepareData(data).then(() => {
            prepareFunc();
            Engine.instance.#startGameLoop();
        });
    }

    getViewRect()
    {
        const left = this.camera.x - this.worldOffset.x;
        const top = this.camera.y - this.worldOffset.y;

        return {
            left,
            top,
            right: left + this.viewWidth,
            bottom: top + this.viewHeight,
            width: this.viewWidth,
            height: this.viewHeight,
        };
    }
}