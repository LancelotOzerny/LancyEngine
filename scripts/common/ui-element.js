export class UiElement
{
    x = 0;
    y = 0;

    constructor(panel, params = {
        selector: 'div',
        anchors: 'center center',
    })
    {
        this.params = params;

        this.html = document.createElement(this.params.selector ?? 'div');
        this.params.additionalClasses = this.params.additionalClasses ?? '';
        this.params.baseClass = this.params.baseClass ?? '';
        this.html.classList = `${this.params.baseClass} ${this.params.additionalClasses}`;

        this.active = true;
        this.visible = true;

        this.setAnchors(this.params.anchors ?? 'center center');
        this.setPosition(this.params.x ?? 0, this.params.y ?? 0);

        if (panel)
        {
            this.ui_panel = panel;
            this.ui_panel.html.append(this.html);
        }
    }

    _active = true;
    get active() { return this._active; }
    set active(value)
    {
        this._active = value;
        this.html.style.display = this.active ? 'block' : 'hidden';
    }

    _visible = true;
    get visible() { return this._visible; }
    set visible(value)
    {
        this._visible = value;
        this.html.style.opacity = this._visible ? 1 : 0;
    }

    setPosition(x, y)
    {
        let xValue = x;
        let yValue = y;

        if (typeof(x) === 'number' || x[x.length - 1] !== '%') xValue += 'px';
        if (typeof(y) === 'number' || y[y.length - 1] !== '%') yValue += 'px';

        this.html.style.removeProperty('top');
        this.html.style.removeProperty('left');
        this.html.style.removeProperty('right');
        this.html.style.removeProperty('bottom');
        this.html.style.removeProperty('transform');

        if (this.anchors.horizonal === 'left') this.html.style.left = xValue;
        if (this.anchors.horizonal === 'right') this.html.style.right = xValue;
        if (this.anchors.horizonal === 'center')
        {
            this.html.style.left = `calc(50% + ${xValue})`;
            this.html.style.transform = `translateX(-50%)`;
        }

        if (this.anchors.vertical === 'top') this.html.style.top = yValue;
        if (this.anchors.vertical === 'bottom') this.html.style.bottom = yValue;
        if (this.anchors.vertical === 'center')
        {
            this.html.style.top = `calc(50% + ${yValue})`;
            this.html.style.transform += ` translateY(-50%)`;
        }
    }

    setAnchors(anchorsStr)
    {
        let [anchorHor, anchorVert] = anchorsStr.trim().split(' ');
        this.anchors = {
            horizonal: anchorHor,
            vertical: anchorVert
        }
    }

    getHtml = () => this.html;
}
