class UiImage extends UiElement
{
    constructor(panel, options = {})
    {
        super(panel, {
            selector: 'img',
            baseClass: 'ui-image',
            ...options
        });
    }
}