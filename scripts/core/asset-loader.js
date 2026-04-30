export class AssetLoader
{
    constructor()
    {
        this.assets = new Map();
        this.images = new Map();
        this.audio = new Map();
        this.json = new Map();
        this.files = new Map();

        this.loadProgress = 0;
        this.totalAssets = 0;
        this.loadedAssets = 0;
    }

    async loadAssets(data = {})
    {
        const imageAssets = this.normalizeAssetList(data.images);
        const audioAssets = this.normalizeAssetList(data.audio);
        const jsonAssets = this.normalizeAssetList(data.json);
        const fileAssets = this.normalizeAssetList(data.files);

        this.totalAssets = imageAssets.length + audioAssets.length + jsonAssets.length + fileAssets.length;
        this.loadedAssets = 0;
        this.loadProgress = this.totalAssets === 0 ? 100 : 0;

        const imagePromises = imageAssets.map(asset => this.loadImage(asset));
        const audioPromises = audioAssets.map(asset => this.loadAudio(asset));
        const jsonPromises = jsonAssets.map(asset => this.loadJson(asset));
        const filePromises = fileAssets.map(asset => this.loadFile(asset));

        const [loadedImages, loadedAudio, loadedJson, loadedFiles] = await Promise.all([
            Promise.all(imagePromises),
            Promise.all(audioPromises),
            Promise.all(jsonPromises),
            Promise.all(filePromises),
        ]);

        const imageMap = new Map();
        imageAssets.forEach((asset, index) =>
        {
            imageMap.set(asset.key, loadedImages[index]);
        });

        const audioMap = new Map();
        audioAssets.forEach((asset, index) =>
        {
            audioMap.set(asset.key, loadedAudio[index]);
        });

        const jsonMap = new Map();
        jsonAssets.forEach((asset, index) =>
        {
            jsonMap.set(asset.key, loadedJson[index]);
        });

        const fileMap = new Map();
        fileAssets.forEach((asset, index) =>
        {
            fileMap.set(asset.key, loadedFiles[index]);
        });

        this.images = imageMap;
        this.audio = audioMap;
        this.json = jsonMap;
        this.files = fileMap;
        this.assets = this.images; // compatibility with SpriteComponent

        return {
            images: imageMap,
            audio: audioMap,
            json: jsonMap,
            files: fileMap,
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

    loadImage(asset)
    {
        return new Promise((resolve, reject) =>
        {
            const img = new Image();

            img.onload = () =>
            {
                this.registerLoadedAsset(asset.src, "image");
                resolve(img);
            };

            img.onerror = (event) =>
            {
                console.error(`Image loading error: ${asset.src}`, event);
                reject(new Error(`Failed to load image: ${asset.src}`));
            };

            img.src = asset.src;
        });
    }

    loadAudio(asset)
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
                this.registerLoadedAsset(asset.src, "audio");
                resolve(audio);
            };

            const onError = (event) =>
            {
                if (isSettled) return;
                isSettled = true;
                clearListeners();
                console.error(`Audio loading error: ${asset.src}`, event);
                reject(new Error(`Failed to load audio: ${asset.src}`));
            };

            audio.preload = "auto";
            audio.addEventListener("canplaythrough", onReady, { once: true });
            audio.addEventListener("loadeddata", onReady, { once: true });
            audio.addEventListener("error", onError, { once: true });
            audio.src = asset.src;
            audio.load();
        });
    }

    async loadJson(asset)
    {
        const response = await fetch(asset.src);

        if (!response.ok)
        {
            throw new Error(`Failed to load JSON: ${asset.src}`);
        }

        const json = await response.json();
        this.registerLoadedAsset(asset.src, "json");
        return json;
    }

    async loadFile(asset)
    {
        const response = await fetch(asset.src);

        if (!response.ok)
        {
            throw new Error(`Failed to load file: ${asset.src}`);
        }

        const text = await response.text();
        this.registerLoadedAsset(asset.src, "file");
        return text;
    }

    registerLoadedAsset(path, type)
    {
        this.loadedAssets += 1;
        this.loadProgress = this.totalAssets === 0
            ? 100
            : (this.loadedAssets / this.totalAssets) * 100;

        console.log(`Loaded ${type}: ${path} (${this.loadedAssets}/${this.totalAssets})`);
    }

    normalizeAssetList(items = [])
    {
        if (!Array.isArray(items)) return [];

        return items
            .map(item =>
            {
                if (typeof item === "string")
                {
                    return {
                        key: this.getAssetKey(item),
                        src: item,
                    };
                }

                if (!item || typeof item !== "object") return null;

                const src = item.src ?? item.path ?? item.url;
                if (!src) return null;

                return {
                    ...item,
                    key: item.key ?? this.getAssetKey(src),
                    src,
                };
            })
            .filter(Boolean);
    }

    getAssetKey(path)
    {
        const value = typeof path === "string" ? path : path?.src ?? path?.path ?? path?.url ?? "";

        return value
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

    getJson(key)
    {
        return this.json.get(key) || null;
    }

    getFile(key)
    {
        return this.files.get(key) || null;
    }
}
