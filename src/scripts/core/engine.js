class Engine extends GameEntity
{
    static #instance = null;
    scenes = new GameCollection();

    constructor()
    {
        super();

        this.canvas = null;
        this.context = null;
        this.isRunning = false;
        this.isFirstRunning = false;
        this.animationFrameId = null;
        this.lastTime = 0;
        this.fps = 60;
        this.frameTime = 1000 / this.fps;
        this.elapsedTime = 0;
    }

    init(selector, options)
    {
        this.options = options;
        this.canvas = document.querySelector(selector);
        if (!this.canvas)
        {
            throw new Error(`Canvas with selector ${selector} is not found!`);
        }

        this.context = this.canvas.getContext('2d');

        if (this.options.width) this.canvas.setAttribute('width', this.options.width + 'px');
        if (this.options.height) this.canvas.setAttribute('height', this.options.height + 'px');

        return this;
    }

    startGameLoop()
    {
        if (this.isRunning)
        {
            console.warn('Игровой цикл уже запущен');
            return;
        }

        this.isRunning = true;
        this.lastTime = performance.now();
        this.elapsedTime = 0;

        // Запускаем первый кадр цикла
        this.#gameLoop();

        if (!this.isFirstRunning)
        {
            this.start();
        }
        this.isFirstRunning = true;
    }

    stopGameLoop()
    {
        if (!this.isRunning)
        {
            console.warn('Игровой цикл не запущен');
            return;
        }

        if (this.animationFrameId)
        {
            cancelAnimationFrame(this.animationFrameId);
            this.animationFrameId = null;
        }

        this.isRunning = false;
        console.log('Игровой цикл остановлен');
    }

    #gameLoop(currentTime = performance.now()) {
        if (!this.isRunning)
        {
            return;
        }

        const deltaTime = currentTime - this.lastTime;
        this.lastTime = currentTime;
        this.elapsedTime += deltaTime;

        while (this.elapsedTime >= this.frameTime)
        {
            this.update(this.frameTime);
            this.elapsedTime -= this.frameTime;
        }

        this.render(this.context);
        this.animationFrameId = requestAnimationFrame(this.#gameLoop.bind(this));
    }

    start = () => this.scenes.start();
    update = (deltaTime) => this.scenes.update(deltaTime);
    render = (ctx) => this.scenes.render(ctx);

    static get instance()
    {
        if (Engine.#instance instanceof Engine === false)
        {
            Engine.#instance = new Engine();
        }

        return Engine.#instance;
    }
}