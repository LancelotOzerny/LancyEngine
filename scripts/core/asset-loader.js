export class AssetLoader
{
    constructor()
    {
        this.assets = new Map();
        this.images = new Map();
        this.audio = new Map();

        this.loadProgress = 0;
        this.totalAssets = 0;
        this.loadedAssets = 0;
    }

    async loadAssets(data = {})
    {
        const imagePaths = Array.isArray(data.images) ? data.images : [];
        const audioPaths = Array.isArray(data.audio) ? data.audio : [];

        this.totalAssets = imagePaths.length + audioPaths.length;
        this.loadedAssets = 0;
        this.loadProgress = this.totalAssets === 0 ? 100 : 0;

        const imagePromises = imagePaths.map(path => this.loadImage(path));
        const audioPromises = audioPaths.map(path => this.loadAudio(path));

        const [loadedImages, loadedAudio] = await Promise.all([
            Promise.all(imagePromises),
            Promise.all(audioPromises),
        ]);

        const imageMap = new Map();
        imagePaths.forEach((path, index) =>
        {
            imageMap.set(this.getAssetKey(path), loadedImages[index]);
        });

        const audioMap = new Map();
        audioPaths.forEach((path, index) =>
        {
            audioMap.set(this.getAssetKey(path), loadedAudio[index]);
        });

        this.images = imageMap;
        this.audio = audioMap;
        this.assets = this.images; // compatibility with SpriteComponent

        return {
            images: imageMap,
            audio: audioMap,
        };
    }

    async loadImages(imagePaths = [])
    {
        const result = await this.loadAssets({ images: imagePaths, audio: [] });
        return result.images;
    }

    async loadAudio(audioPaths = [])
    {
        const result = await this.loadAssets({ images: [], audio: audioPaths });
        return result.audio;
    }

    loadImage(path)
    {
        return new Promise((resolve, reject) =>
        {
            const img = new Image();

            img.onload = () =>
            {
                this.registerLoadedAsset(path, "image");
                resolve(img);
            };

            img.onerror = (event) =>
            {
                console.error(`Image loading error: ${path}`, event);
                reject(new Error(`Failed to load image: ${path}`));
            };

            img.src = path;
        });
    }

    loadAudio(path)
    {
        return new Promise((resolve, reject) =>
        {
            const audio = new Audio();
            let isSettled = false;

            const clearListeners = () =>
            {
                audio.removeEventListener("canplaythrough", onReady);
                audio.removeEventListener("loadeddata", onReady);
                audio.removeEventListener("error", onError);
            };

            const onReady = () =>
            {
                if (isSettled) return;
                isSettled = true;
                clearListeners();
                this.registerLoadedAsset(path, "audio");
                resolve(audio);
            };

            const onError = (event) =>
            {
                if (isSettled) return;
                isSettled = true;
                clearListeners();
                console.error(`Audio loading error: ${path}`, event);
                reject(new Error(`Failed to load audio: ${path}`));
            };

            audio.preload = "auto";
            audio.addEventListener("canplaythrough", onReady, { once: true });
            audio.addEventListener("loadeddata", onReady, { once: true });
            audio.addEventListener("error", onError, { once: true });
            audio.src = path;
            audio.load();
        });
    }

    registerLoadedAsset(path, type)
    {
        this.loadedAssets += 1;
        this.loadProgress = this.totalAssets === 0
            ? 100
            : (this.loadedAssets / this.totalAssets) * 100;

        console.log(`Loaded ${type}: ${path} (${this.loadedAssets}/${this.totalAssets})`);
    }

    getAssetKey(path)
    {
        return path
            .split("/")
            .pop()
            .split("\\")
            .pop()
            .replace(/\.\w+$/, "");
    }

    getImage(key)
    {
        return this.images.get(key) || null;
    }

    getAudio(key)
    {
        return this.audio.get(key) || null;
    }
}
