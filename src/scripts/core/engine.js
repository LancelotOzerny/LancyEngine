class Engine extends GameActions
{
    static #instance = null;
    scenes = [];

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

    init(selector)
    {
        this.canvas = document.querySelector(selector);
        if (!this.canvas)
        {
            throw new Error(`Canvas with selector ${selector} is not found!`);
        }

        this.context = this.canvas.getContext('2d');
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

    start= () => this.scenes.forEach(scene => scene.start());
    update = (deltaTime) => this.scenes.forEach(scene => scene.update());

    createScene()
    {
        let scene = new Scene();
        this.scenes.push(scene);
        return scene;
    }

    render = (ctx) => this.scenes.forEach(scene => scene.render(ctx));

    static get instance()
    {
        if (Engine.#instance instanceof Engine === false)
        {
            Engine.#instance = new Engine();
        }

        return Engine.#instance;
    }
}