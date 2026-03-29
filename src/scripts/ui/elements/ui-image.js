class UiImage extends UiElement
{
    constructor(panel, options = {})
    {
        super(panel, {
            selector: 'img',
            baseClass: 'ui-image',
            ...options
        });

        this.width = this.options.width ?? '150';
        this.height = this.options.height ?? '150';
        this.html.setAttribute('src', this.options.src ?? 'none');
    }

    set width(value)
    {
        this.options.width = value;
        this.html.style.width = value + 'px';
    }

    set height(value)
    {
        this.options.height = value;
        this.html.style.height = value + 'px';
    }
}