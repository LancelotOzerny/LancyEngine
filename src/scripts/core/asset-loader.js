class AssetLoader
{
    constructor()
    {
        this.assets = new Map();
        this.loadProgress = 0;
        this.totalAssets = 0;
        this.loadedAssets = 0;
    }

    async loadImages(imagePaths)
    {
        this.totalAssets = imagePaths.length;
        this.loadedAssets = 0;

        const promises = imagePaths.map(path => this.loadImage(path));

        return Promise.all(promises).then(images =>
        {
            const result = new Map();
            imagePaths.forEach((path, index) =>
            {
                const fileName = path.split('/').pop().replace(/\.\w+$/, '');
                result.set(fileName, images[index]);
            });
            return result;
        });
    }

    loadImage(path)
    {
        return new Promise((resolve, reject) =>
        {
            const img = new Image();

            img.onload = () =>
            {
                this.loadedAssets++;
                this.loadProgress = (this.loadedAssets / this.totalAssets) * 100;
                console.log(`Загружено: ${path} (${this.loadedAssets}/${this.totalAssets})`);
                resolve(img);
            };

            img.onerror = (e) =>
            {
                console.error(`Ошибка загрузки изображения: ${path}`, e);
                reject(new Error(`Не удалось загрузить изображение: ${path}`));
            };

            img.src = path;
        });
    }

    getImage(key)
    {
        return this.assets.get(key) || null;
    }
}