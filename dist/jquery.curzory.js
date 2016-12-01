(function e(t,n,r){function s(o,u){if(!n[o]){if(!t[o]){var a=typeof require=="function"&&require;if(!u&&a)return a(o,!0);if(i)return i(o,!0);var f=new Error("Cannot find module '"+o+"'");throw f.code="MODULE_NOT_FOUND",f}var l=n[o]={exports:{}};t[o][0].call(l.exports,function(e){var n=t[o][1][e];return s(n?n:e)},l,l.exports,e,t,n,r)}return n[o].exports}var i=typeof require=="function"&&require;for(var o=0;o<r.length;o++)s(r[o]);return s})({1:[function(require,module,exports){
var CursorManager = require('./lib/CursorManager'), Cursor = require('./lib/Cursor');
cursorManager = new CursorManager();
module.exports = function curzory(element, options) {
    var cursor = new Cursor(element, options);
    cursorManager.add(cursor);
    return cursor;
};
},{"./lib/Cursor":3,"./lib/CursorManager":4}],2:[function(require,module,exports){
var curzory = require('./curzory'), $ = function () {
        try {
            return function () {
                throw new Error('Cannot find module \'jquery\' from \'/Users/rafaelnowrotek/Documents/Projekte/Squirrel/Workspace/curzory/src\'');
            }();
        } catch (e) {
            return $ || jQuery;
        }
    }();
if ($) {
    $.fn.extend({
        curzory: function (options) {
            return this.each(function () {
                var cursor = $(this).data('curzory');
                if (!cursor) {
                    cursor = curzory(this, options);
                    $(this).data('curzory', cursor);
                } else {
                    cursor.set(options);
                }
                return $(this);
            });
        }
    });
}
},{"./curzory":1}],3:[function(require,module,exports){
var merge = require('./merge'), createElement = function (string) {
        var element = document.createElement('div');
        element.innerHTML = string;
        var result = element.firstChild;
        element.removeChild(result);
        return result;
    }, isHTML = function (string) {
        return typeof string === 'string' && string.match(/<\/?\w+((\s+\w+(\s*=\s*(?:".*?"|'.*?'|[^'">\s]+))?)+\s*|\s*)\/?>/);
    }, getElement = function (value, parent) {
        value = value.toArray ? value.toArray()[0] : value instanceof Array ? value[0] : value;
        if (typeof value === 'function') {
            value = value.call(this, value);
        }
        if (typeof value === 'string') {
            if (isHTML(value)) {
                value = createElement(value);
            } else {
                value = parent.querySelector(value);
            }
        }
        if (value && value.nodeName) {
            return value;
        }
        return null;
    };
module.exports = function Cursor(element, options) {
    function set(name, value) {
        var opts;
        if (typeof name === 'object') {
            opts = name;
        } else {
            opts = {};
            opts[name] = value;
        }
        for (name in opts) {
            value = opts[name];
            switch (name) {
            case 'element':
            case 'symbol':
                if (isHTML(value)) {
                    value = createElement(value);
                }
                break;
            }
            opts[name] = value;
        }
        options = merge(options, opts);
    }
    ;
    this.set = function () {
        set.call(this, arguments);
        cursorManager.update();
    };
    this.get = function (name) {
        var value;
        if (!name) {
            value = {};
            for (var x in options) {
                value[x] = this.get(x);
            }
        } else {
            value = options[name];
            switch (name) {
            case 'element':
            case 'symbol':
            case 'bounds':
            case 'target':
                value = value && value.toArray ? value.toArray()[0] : value instanceof Array ? value[0] : value;
                value = typeof value === 'string' ? (element || document).querySelector(value) : value;
                break;
            }
            switch (name) {
            case 'symbol':
                value = value || this.get('element');
                break;
            case 'bounds':
                value = value ? value : options['symbol'] ? this.get('element') : this.get('element').offsetParent;
                break;
            }
        }
        return value;
    };
    set(merge({
        element: null,
        offset: {
            left: 8,
            top: 6
        },
        style: 'transform',
        scale: 1,
        bounds: null,
        symbol: null,
        target: null,
        hideOnFocus: false
    }, options, { element: element }));
};
},{"./merge":5}],4:[function(require,module,exports){
var merge = require('./merge'), topmost = require('./topmost'), hyphenate = function () {
        var cache = {};
        return function (string) {
            return cache[string] = cache[string] || function () {
                return string.replace(/([A-Z])/g, function ($1) {
                    return '-' + $1.toLowerCase();
                });
            }();
        };
    }(), getStyle = function (el, cssprop) {
        if (el.currentStyle)
            return el.currentStyle[cssprop];
        else if (document.defaultView && document.defaultView.getComputedStyle)
            return document.defaultView.getComputedStyle(el, '')[cssprop];
        else
            return el.style[cssprop];
    }, transformStyle = function (prop, prefixes) {
        var i, elem = document.createElement('div'), capitalized = prop.charAt(0).toUpperCase() + prop.slice(1);
        for (i = 0; i < prefixes.length; i++) {
            if (typeof elem.style[prefixes[i] + capitalized] !== 'undefined') {
                return prefixes[i] + capitalized;
            }
        }
        return null;
    }('transform', [
        '',
        'Moz',
        'Webkit',
        'O',
        'Ms'
    ]), isChildOf = function (parent, child) {
        if (!child || !parent) {
            return false;
        }
        var node = child.parentNode;
        while (node != null) {
            if (node == parent) {
                return true;
            }
            node = node.parentNode;
        }
        return false;
    }, css = function (elem, name, value) {
        var map = {}, cssText = null;
        if (typeof name === 'object') {
            map = name;
        } else if (typeof value !== 'undefined') {
            map[name] = value;
        }
        var keys = Object.keys(map);
        keys = keys.filter(function (key, index) {
            if (map[key] === '') {
                elem.style[key] = map[key];
                return false;
            }
            return true;
        });
        cssText = keys.map(function (name) {
            return hyphenate(name) + ': ' + map[name];
        }).join('; ');
        if (cssText && cssText.length) {
            elem.style.cssText = elem.style.cssText + cssText;
            return null;
        }
        return elem.style[name] || window.getComputedStyle(elem, null).getPropertyValue(name);
    }, getOffset = function (element) {
        var scrollOffset = getScrollOffset(), rect = element.getBoundingClientRect();
        return {
            top: rect.top + scrollOffset.top,
            left: rect.left + scrollOffset.left
        };
    }, getScrollOffset = function () {
        return {
            left: document.body && document.body.scrollLeft + document.documentElement.scrollLeft,
            top: document.body && document.body.scrollTop + document.documentElement.scrollTop
        };
    }, getBoundingRect = function (element) {
        if (!element) {
            return {
                x: -Infinity,
                y: -Infinity,
                width: Infinity,
                height: Infinity
            };
        }
        var scrollOffset = getScrollOffset();
        var rect = element.getBoundingClientRect();
        return {
            x: rect.left + scrollOffset.left,
            y: rect.top + scrollOffset.top,
            width: rect.width,
            height: rect.height
        };
    }, instance = null;
function CursorManager(options) {
    if (instance) {
        instance.set(options);
        return instance;
    }
    instance = this;
    var cursors = [];
    var client = {
            x: 0,
            y: 0
        };
    var mouse = {
            x: -Infinity,
            y: -Infinity,
            element: null
        };
    var events = [
            'mousedown',
            'click',
            'scroll',
            'resize',
            'mousemove',
            'mouseout'
        ];
    var cursorItems = [];
    var cursorItem = null;
    var clicking = false;
    var clickable = true;
    function init() {
        if (!('ontouch' in window)) {
            addMouseListeners(window);
        }
    }
    function handleEvent(e) {
        try {
            e.type;
        } catch (e) {
            console.warn(e);
            return;
        }
        switch (e.type) {
        case 'mousedown':
            clicking = false;
            break;
        case 'mouseout':
            var relatedTarget = typeof e.toElement != 'undefined' ? e.toElement : e.relatedTarget;
            if (relatedTarget === null) {
                mouse.x = -Infinity;
                mouse.y = -Infinity;
                mouse.element = null;
            }
            break;
        case 'mousemove':
            client.x = e.clientX;
            client.y = e.clientY;
        default:
            var scrollOffset = getScrollOffset();
            mouse.x = client.x + scrollOffset.left;
            mouse.y = client.y + scrollOffset.top;
            mouse.element = e.target;
        }
        invalidate.call(this);
        switch (e.type) {
        case 'click':
            if (!clicking && cursorItem) {
                clicking = true;
                if (mouse.element && cursorItem && cursorItem.target && cursorItem.symbol !== mouse.element && isChildOf(cursorItem.container, mouse.element)) {
                    cursorItem.target.click();
                }
                var click = cursorItem && cursorItem.click;
                if (typeof click === 'function') {
                    click.call(cursorItem.element, e);
                }
            }
            break;
        }
        render.call(instance);
    }
    function closest(el, selector) {
        var matchesFn;
        [
            'matches',
            'webkitMatchesSelector',
            'mozMatchesSelector',
            'msMatchesSelector',
            'oMatchesSelector'
        ].some(function (fn) {
            if (typeof document.body[fn] == 'function') {
                matchesFn = fn;
                return true;
            }
            return false;
        });
        var parent;
        while (el) {
            parent = el.parentElement;
            if (parent && parent[matchesFn](selector)) {
                return parent;
            }
            el = parent;
        }
        return null;
    }
    function getParents(element, selector) {
        var parents = [];
        var parent = element;
        while (parent = parent.parentElement && closest(parent.parentElement, selector)) {
            parents.push(parent);
        }
        return parents;
    }
    function invalidate() {
        cursorItems = cursors.map(function (cursor, index) {
            return getCursorItem(cursor, cursorItems[index]);
        });
        var filtered = cursorItems.filter(function (cursorItem, index) {
                var mouseElement = mouse.element, symbol = cursorItem.symbol, bounds = cursorItem.bounds, container = cursorItem.container, result = false;
                if (mouseElement) {
                    if (!mouseElement.href && !getParents(mouseElement, 'a').length) {
                        if (topmost(mouseElement, symbol) === symbol) {
                            if (container === mouseElement || isChildOf(container, mouseElement)) {
                                result = mouse.x >= bounds.x && mouse.x <= bounds.x + bounds.width && mouse.y >= bounds.y && mouse.y <= bounds.y + bounds.height;
                            }
                        }
                    }
                }
                return result;
            }), sorted = filtered.sort(function (a, b) {
                var zElement = topmost(a.symbol, b.symbol);
                if (zElement === a.symbol) {
                    return -1;
                } else if (zElement === b.symbol) {
                    return 1;
                }
                var p1 = {
                        x: a.x + a.width / 2,
                        y: a.y + a.height / 2
                    };
                var p2 = {
                        x: b.x + b.width / 2,
                        y: b.y + b.height / 2
                    };
                var d1 = Math.sqrt(Math.pow(p1.x - mouse.x, 2) + Math.pow(p1.y - mouse.y, 2));
                var d2 = Math.sqrt(Math.pow(p2.x - mouse.x, 2) + Math.pow(p2.y - mouse.y, 2));
                return d1 < d2 ? d1 : d1 > d2 ? d2 : 0;
            }).reverse();
        cursorItem = sorted[0];
        setMouseProviders([window].concat(cursorItems.map(function (item) {
            return item.container;
        })));
    }
    function render() {
        cursorItems.forEach(function (item) {
            var symbol = item.symbol, style = {
                    visibility: item === cursorItem ? '' : 'hidden',
                    position: 'absolute',
                    cursor: 'inherit'
                };
            if (item.style === 'transform' && transformStyle) {
                style[transformStyle + 'Origin'] = '';
                style[transformStyle] = '';
            } else {
                style.left = '';
                style.top = '';
            }
            symbol.classList && !symbol.classList.contains('cursor') && symbol.classList.add('cursor');
            css(symbol, style);
            if (cursorItem === item) {
                var pos = getOffset(symbol);
                var px = pos.left;
                var py = pos.top;
                var off = item.offset;
                var x = Math.round(mouse.x - px + off.left);
                var y = Math.round(mouse.y - py + off.top);
                style = {};
                if (item.style === 'transform' && transformStyle) {
                    style[transformStyle + 'Origin'] = '0 0';
                    style[transformStyle] = 'translate3d(' + x + 'px,' + y + 'px, 0) scale(' + item.scale + ',' + item.scale + ')';
                } else {
                    style.left = x + pos.left + 'px';
                    style.top = y + pos.top + 'px';
                }
                css(symbol, style);
            }
            if (item === cursorItem) {
                symbol.classList && !symbol.classList.contains('cursor-active') && symbol.classList.add('cursor-active');
                symbol.classList && symbol.classList.contains('cursor-hidden') && symbol.classList.remove('cursor-hidden');
            } else {
                symbol.classList && symbol.classList.contains('cursor-active') && symbol.classList.remove('cursor-active');
                symbol.classList && !symbol.classList.contains('cursor-hidden') && symbol.classList.add('cursor-hidden');
            }
        });
    }
    ;
    this.update = function () {
        invalidate.call(this);
        render.call(this);
    };
    this.add = function (cursor) {
        if (cursors.indexOf(cursor) === -1) {
            cursors.push(cursor);
            this.update();
        }
    };
    this.remove = function (cursor) {
        cursors.splice(cursors.indexOf(cursor), 1);
        this.update();
    };
    var mouseProviders = [];
    function setMouseProviders(elements) {
        elements = elements.filter(function (n) {
            return n;
        });
        mouseProviders.forEach(function (element) {
            if (elements.indexOf(element) === -1) {
                removeMouseListeners(element);
            }
        });
        elements.forEach(function (element) {
            if (mouseProviders.indexOf(element) === -1) {
                addMouseListeners(element);
            }
        });
        mouseProviders = elements;
    }
    function addMouseListeners(element) {
        for (var i = 0, event; event = events[i]; i++) {
            element.addEventListener(event, handleEvent);
        }
    }
    function removeMouseListeners(element) {
        for (var i = 0, event; event = events[i]; i++) {
            element.removeEventListener(event, handleEvent);
        }
    }
    init.call(this);
}
function getCursorItem(cursor) {
    var element = cursor.get('element'), props = cursor.get(), symbol = props.symbol, bounds = props.bounds, offset = props.offset, style = props.style, scale = props.scale, target = props.target || symbol.nodeName.toLowerCase() === 'a' ? symbol : element, container, display = element.style.display;
    css(element, { display: '' });
    props = cursor.get();
    symbol = props.symbol;
    bounds = props.bounds;
    offset = props.offset;
    style = props.style;
    scale = props.scale;
    target = props.target || symbol.nodeName.toLowerCase() === 'a' ? symbol : element;
    if (!symbol.parentNode) {
        element.appendChild(symbol);
    }
    if (bounds && bounds.getBoundingClientRect) {
        container = bounds;
        bounds = getBoundingRect(bounds);
    } else {
        container = symbol.offsetParent || element && element === symbol ? element.offsetParent || document.documentElement : element;
        var rect = getBoundingRect(container);
        var containerPos = getOffset(container) || {
                x: 0,
                y: 0
            };
        if (typeof bounds === 'function') {
            bounds = bounds.apply(element, [container]);
        }
        var x = typeof bounds.x === 'string' && bounds.x.indexOf('%') >= 0 ? parseFloat(bounds.x) * rect.width / 100 : parseFloat(bounds.x);
        var y = typeof bounds.y === 'string' && bounds.y.indexOf('%') >= 0 ? parseFloat(bounds.y) * rect.height / 100 : parseFloat(bounds.y);
        var width = typeof bounds.width === 'string' && bounds.width.indexOf('%') >= 0 ? parseFloat(bounds.width) * rect.width / 100 : parseFloat(bounds.width);
        var height = typeof bounds.height === 'string' && bounds.height.indexOf('%') >= 0 ? parseFloat(bounds.height) * rect.height / 100 : parseFloat(bounds.height);
        bounds = {
            x: containerPos.left + x,
            y: containerPos.top + y,
            width: width,
            height: height
        };
    }
    css(element, 'display', display);
    return merge(props, {
        cursor: cursor,
        symbol: symbol,
        bounds: bounds,
        container: container,
        target: target,
        offset: offset,
        style: style,
        scale: scale
    });
}
module.exports = CursorManager;
},{"./merge":5,"./topmost":6}],5:[function(require,module,exports){
module.exports = function () {
    var obj = {}, i = 0, il = arguments.length, key;
    for (; i < il; i++) {
        for (key in arguments[i]) {
            if (arguments[i].hasOwnProperty(key)) {
                obj[key] = arguments[i][key];
            }
        }
    }
    return obj;
};
},{}],6:[function(require,module,exports){
var getStyle = function (el, cssprop) {
        if (el.style)
            if (el.currentStyle)
                return el.currentStyle[cssprop];
            else if (document.defaultView && document.defaultView.getComputedStyle)
                return document.defaultView.getComputedStyle(el, '')[cssprop];
            else
                return el.style[cssprop];
    }, getZIndex = function (el) {
        var zIndex = parseFloat(getStyle(el, 'zIndex'));
        zIndex = !isNaN(zIndex) ? zIndex : 0;
        if (zIndex === 0) {
            if (el.parentNode) {
                return getZIndex(el.parentNode);
            }
        }
        return zIndex;
    }, isChildOf = function (parent, child) {
        if (!child || !parent) {
            return false;
        }
        var node = child.parentNode;
        while (node != null) {
            if (node == parent) {
                return true;
            }
            node = node.parentNode;
        }
        return false;
    };
function compareVisibility(a, b) {
    var va = a && a.style && getStyle(a, 'display') !== 'none';
    var vb = b && b.style && getStyle(b, 'display') !== 'none';
    if (va && !vb) {
        return -1;
    } else if (vb && !va) {
        return 1;
    }
    return 0;
}
function comparePositionStack(a, b) {
    var pa = getStyle(a, 'position');
    var pb = getStyle(b, 'position');
    if (za > zb) {
        return -1;
    } else if (zb > za) {
        return 1;
    }
    return 0;
}
function compareZIndex(a, b) {
    var za = getZIndex(a);
    var zb = getZIndex(b);
    if (za > zb) {
        return -1;
    } else if (zb > za) {
        return 1;
    }
    return 0;
}
function comparePosition(a, b) {
    return a.compareDocumentPosition ? a.compareDocumentPosition(b) : a.contains ? (a != b && a.contains(b) && 16) + (a != b && b.contains(a) && 8) + (a.sourceIndex >= 0 && b.sourceIndex >= 0 ? (a.sourceIndex < b.sourceIndex && 4) + (a.sourceIndex > b.sourceIndex && 2) : 1) + 0 : 0;
}
module.exports = function (a, b) {
    var visibility = compareVisibility(a, b);
    if (visibility !== 0) {
        return visibility < 0 ? a : b;
    }
    if (isChildOf(a, b)) {
        return b;
    }
    var zIndexComparisonResult = compareZIndex(a, b);
    if (zIndexComparisonResult === -1) {
        return a;
    }
    if (zIndexComparisonResult === 1) {
        return b;
    }
    var documentPositionResult = comparePosition(a, b);
    if (documentPositionResult === 2) {
        return a;
    }
    if (documentPositionResult === 4) {
        return b;
    }
    return a;
};
},{}]},{},[2])
//# sourceMappingURL=data:application/json;charset:utf-8;base64,eyJ2ZXJzaW9uIjozLCJzb3VyY2VzIjpbIm5vZGVfbW9kdWxlcy9icm93c2VyLXBhY2svX3ByZWx1ZGUuanMiLCJzcmMvY3Vyem9yeS5qcyIsInNyYy9qcXVlcnkuY3Vyem9yeS5qcyIsInNyYy9saWIvQ3Vyc29yLmpzIiwic3JjL2xpYi9DdXJzb3JNYW5hZ2VyLmpzIiwic3JjL2xpYi9tZXJnZS5qcyIsInNyYy9saWIvdG9wbW9zdC5qcyJdLCJuYW1lcyI6W10sIm1hcHBpbmdzIjoiQUFBQTtBQ0FBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBOztBQ05BO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBOztBQ3hCQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7O0FDL0ZBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTs7QUM1WEE7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTs7QUNWQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0EiLCJmaWxlIjoiZ2VuZXJhdGVkLmpzIiwic291cmNlUm9vdCI6IiIsInNvdXJjZXNDb250ZW50IjpbIihmdW5jdGlvbiBlKHQsbixyKXtmdW5jdGlvbiBzKG8sdSl7aWYoIW5bb10pe2lmKCF0W29dKXt2YXIgYT10eXBlb2YgcmVxdWlyZT09XCJmdW5jdGlvblwiJiZyZXF1aXJlO2lmKCF1JiZhKXJldHVybiBhKG8sITApO2lmKGkpcmV0dXJuIGkobywhMCk7dmFyIGY9bmV3IEVycm9yKFwiQ2Fubm90IGZpbmQgbW9kdWxlICdcIitvK1wiJ1wiKTt0aHJvdyBmLmNvZGU9XCJNT0RVTEVfTk9UX0ZPVU5EXCIsZn12YXIgbD1uW29dPXtleHBvcnRzOnt9fTt0W29dWzBdLmNhbGwobC5leHBvcnRzLGZ1bmN0aW9uKGUpe3ZhciBuPXRbb11bMV1bZV07cmV0dXJuIHMobj9uOmUpfSxsLGwuZXhwb3J0cyxlLHQsbixyKX1yZXR1cm4gbltvXS5leHBvcnRzfXZhciBpPXR5cGVvZiByZXF1aXJlPT1cImZ1bmN0aW9uXCImJnJlcXVpcmU7Zm9yKHZhciBvPTA7bzxyLmxlbmd0aDtvKyspcyhyW29dKTtyZXR1cm4gc30pIiwidmFyIEN1cnNvck1hbmFnZXIgPSByZXF1aXJlKCcuL2xpYi9DdXJzb3JNYW5hZ2VyJyksIEN1cnNvciA9IHJlcXVpcmUoJy4vbGliL0N1cnNvcicpO1xuY3Vyc29yTWFuYWdlciA9IG5ldyBDdXJzb3JNYW5hZ2VyKCk7XG5tb2R1bGUuZXhwb3J0cyA9IGZ1bmN0aW9uIGN1cnpvcnkoZWxlbWVudCwgb3B0aW9ucykge1xuICAgIHZhciBjdXJzb3IgPSBuZXcgQ3Vyc29yKGVsZW1lbnQsIG9wdGlvbnMpO1xuICAgIGN1cnNvck1hbmFnZXIuYWRkKGN1cnNvcik7XG4gICAgcmV0dXJuIGN1cnNvcjtcbn07IiwidmFyIGN1cnpvcnkgPSByZXF1aXJlKCcuL2N1cnpvcnknKSwgJCA9IGZ1bmN0aW9uICgpIHtcbiAgICAgICAgdHJ5IHtcbiAgICAgICAgICAgIHJldHVybiBmdW5jdGlvbiAoKSB7XG4gICAgICAgICAgICAgICAgdGhyb3cgbmV3IEVycm9yKCdDYW5ub3QgZmluZCBtb2R1bGUgXFwnanF1ZXJ5XFwnIGZyb20gXFwnL1VzZXJzL3JhZmFlbG5vd3JvdGVrL0RvY3VtZW50cy9Qcm9qZWt0ZS9TcXVpcnJlbC9Xb3Jrc3BhY2UvY3Vyem9yeS9zcmNcXCcnKTtcbiAgICAgICAgICAgIH0oKTtcbiAgICAgICAgfSBjYXRjaCAoZSkge1xuICAgICAgICAgICAgcmV0dXJuICQgfHwgalF1ZXJ5O1xuICAgICAgICB9XG4gICAgfSgpO1xuaWYgKCQpIHtcbiAgICAkLmZuLmV4dGVuZCh7XG4gICAgICAgIGN1cnpvcnk6IGZ1bmN0aW9uIChvcHRpb25zKSB7XG4gICAgICAgICAgICByZXR1cm4gdGhpcy5lYWNoKGZ1bmN0aW9uICgpIHtcbiAgICAgICAgICAgICAgICB2YXIgY3Vyc29yID0gJCh0aGlzKS5kYXRhKCdjdXJ6b3J5Jyk7XG4gICAgICAgICAgICAgICAgaWYgKCFjdXJzb3IpIHtcbiAgICAgICAgICAgICAgICAgICAgY3Vyc29yID0gY3Vyem9yeSh0aGlzLCBvcHRpb25zKTtcbiAgICAgICAgICAgICAgICAgICAgJCh0aGlzKS5kYXRhKCdjdXJ6b3J5JywgY3Vyc29yKTtcbiAgICAgICAgICAgICAgICB9IGVsc2Uge1xuICAgICAgICAgICAgICAgICAgICBjdXJzb3Iuc2V0KG9wdGlvbnMpO1xuICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgICByZXR1cm4gJCh0aGlzKTtcbiAgICAgICAgICAgIH0pO1xuICAgICAgICB9XG4gICAgfSk7XG59IiwidmFyIG1lcmdlID0gcmVxdWlyZSgnLi9tZXJnZScpLCBjcmVhdGVFbGVtZW50ID0gZnVuY3Rpb24gKHN0cmluZykge1xuICAgICAgICB2YXIgZWxlbWVudCA9IGRvY3VtZW50LmNyZWF0ZUVsZW1lbnQoJ2RpdicpO1xuICAgICAgICBlbGVtZW50LmlubmVySFRNTCA9IHN0cmluZztcbiAgICAgICAgdmFyIHJlc3VsdCA9IGVsZW1lbnQuZmlyc3RDaGlsZDtcbiAgICAgICAgZWxlbWVudC5yZW1vdmVDaGlsZChyZXN1bHQpO1xuICAgICAgICByZXR1cm4gcmVzdWx0O1xuICAgIH0sIGlzSFRNTCA9IGZ1bmN0aW9uIChzdHJpbmcpIHtcbiAgICAgICAgcmV0dXJuIHR5cGVvZiBzdHJpbmcgPT09ICdzdHJpbmcnICYmIHN0cmluZy5tYXRjaCgvPFxcLz9cXHcrKChcXHMrXFx3KyhcXHMqPVxccyooPzpcIi4qP1wifCcuKj8nfFteJ1wiPlxcc10rKSk/KStcXHMqfFxccyopXFwvPz4vKTtcbiAgICB9LCBnZXRFbGVtZW50ID0gZnVuY3Rpb24gKHZhbHVlLCBwYXJlbnQpIHtcbiAgICAgICAgdmFsdWUgPSB2YWx1ZS50b0FycmF5ID8gdmFsdWUudG9BcnJheSgpWzBdIDogdmFsdWUgaW5zdGFuY2VvZiBBcnJheSA/IHZhbHVlWzBdIDogdmFsdWU7XG4gICAgICAgIGlmICh0eXBlb2YgdmFsdWUgPT09ICdmdW5jdGlvbicpIHtcbiAgICAgICAgICAgIHZhbHVlID0gdmFsdWUuY2FsbCh0aGlzLCB2YWx1ZSk7XG4gICAgICAgIH1cbiAgICAgICAgaWYgKHR5cGVvZiB2YWx1ZSA9PT0gJ3N0cmluZycpIHtcbiAgICAgICAgICAgIGlmIChpc0hUTUwodmFsdWUpKSB7XG4gICAgICAgICAgICAgICAgdmFsdWUgPSBjcmVhdGVFbGVtZW50KHZhbHVlKTtcbiAgICAgICAgICAgIH0gZWxzZSB7XG4gICAgICAgICAgICAgICAgdmFsdWUgPSBwYXJlbnQucXVlcnlTZWxlY3Rvcih2YWx1ZSk7XG4gICAgICAgICAgICB9XG4gICAgICAgIH1cbiAgICAgICAgaWYgKHZhbHVlICYmIHZhbHVlLm5vZGVOYW1lKSB7XG4gICAgICAgICAgICByZXR1cm4gdmFsdWU7XG4gICAgICAgIH1cbiAgICAgICAgcmV0dXJuIG51bGw7XG4gICAgfTtcbm1vZHVsZS5leHBvcnRzID0gZnVuY3Rpb24gQ3Vyc29yKGVsZW1lbnQsIG9wdGlvbnMpIHtcbiAgICBmdW5jdGlvbiBzZXQobmFtZSwgdmFsdWUpIHtcbiAgICAgICAgdmFyIG9wdHM7XG4gICAgICAgIGlmICh0eXBlb2YgbmFtZSA9PT0gJ29iamVjdCcpIHtcbiAgICAgICAgICAgIG9wdHMgPSBuYW1lO1xuICAgICAgICB9IGVsc2Uge1xuICAgICAgICAgICAgb3B0cyA9IHt9O1xuICAgICAgICAgICAgb3B0c1tuYW1lXSA9IHZhbHVlO1xuICAgICAgICB9XG4gICAgICAgIGZvciAobmFtZSBpbiBvcHRzKSB7XG4gICAgICAgICAgICB2YWx1ZSA9IG9wdHNbbmFtZV07XG4gICAgICAgICAgICBzd2l0Y2ggKG5hbWUpIHtcbiAgICAgICAgICAgIGNhc2UgJ2VsZW1lbnQnOlxuICAgICAgICAgICAgY2FzZSAnc3ltYm9sJzpcbiAgICAgICAgICAgICAgICBpZiAoaXNIVE1MKHZhbHVlKSkge1xuICAgICAgICAgICAgICAgICAgICB2YWx1ZSA9IGNyZWF0ZUVsZW1lbnQodmFsdWUpO1xuICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgICBicmVhaztcbiAgICAgICAgICAgIH1cbiAgICAgICAgICAgIG9wdHNbbmFtZV0gPSB2YWx1ZTtcbiAgICAgICAgfVxuICAgICAgICBvcHRpb25zID0gbWVyZ2Uob3B0aW9ucywgb3B0cyk7XG4gICAgfVxuICAgIDtcbiAgICB0aGlzLnNldCA9IGZ1bmN0aW9uICgpIHtcbiAgICAgICAgc2V0LmNhbGwodGhpcywgYXJndW1lbnRzKTtcbiAgICAgICAgY3Vyc29yTWFuYWdlci51cGRhdGUoKTtcbiAgICB9O1xuICAgIHRoaXMuZ2V0ID0gZnVuY3Rpb24gKG5hbWUpIHtcbiAgICAgICAgdmFyIHZhbHVlO1xuICAgICAgICBpZiAoIW5hbWUpIHtcbiAgICAgICAgICAgIHZhbHVlID0ge307XG4gICAgICAgICAgICBmb3IgKHZhciB4IGluIG9wdGlvbnMpIHtcbiAgICAgICAgICAgICAgICB2YWx1ZVt4XSA9IHRoaXMuZ2V0KHgpO1xuICAgICAgICAgICAgfVxuICAgICAgICB9IGVsc2Uge1xuICAgICAgICAgICAgdmFsdWUgPSBvcHRpb25zW25hbWVdO1xuICAgICAgICAgICAgc3dpdGNoIChuYW1lKSB7XG4gICAgICAgICAgICBjYXNlICdlbGVtZW50JzpcbiAgICAgICAgICAgIGNhc2UgJ3N5bWJvbCc6XG4gICAgICAgICAgICBjYXNlICdib3VuZHMnOlxuICAgICAgICAgICAgY2FzZSAndGFyZ2V0JzpcbiAgICAgICAgICAgICAgICB2YWx1ZSA9IHZhbHVlICYmIHZhbHVlLnRvQXJyYXkgPyB2YWx1ZS50b0FycmF5KClbMF0gOiB2YWx1ZSBpbnN0YW5jZW9mIEFycmF5ID8gdmFsdWVbMF0gOiB2YWx1ZTtcbiAgICAgICAgICAgICAgICB2YWx1ZSA9IHR5cGVvZiB2YWx1ZSA9PT0gJ3N0cmluZycgPyAoZWxlbWVudCB8fCBkb2N1bWVudCkucXVlcnlTZWxlY3Rvcih2YWx1ZSkgOiB2YWx1ZTtcbiAgICAgICAgICAgICAgICBicmVhaztcbiAgICAgICAgICAgIH1cbiAgICAgICAgICAgIHN3aXRjaCAobmFtZSkge1xuICAgICAgICAgICAgY2FzZSAnc3ltYm9sJzpcbiAgICAgICAgICAgICAgICB2YWx1ZSA9IHZhbHVlIHx8IHRoaXMuZ2V0KCdlbGVtZW50Jyk7XG4gICAgICAgICAgICAgICAgYnJlYWs7XG4gICAgICAgICAgICBjYXNlICdib3VuZHMnOlxuICAgICAgICAgICAgICAgIHZhbHVlID0gdmFsdWUgPyB2YWx1ZSA6IG9wdGlvbnNbJ3N5bWJvbCddID8gdGhpcy5nZXQoJ2VsZW1lbnQnKSA6IHRoaXMuZ2V0KCdlbGVtZW50Jykub2Zmc2V0UGFyZW50O1xuICAgICAgICAgICAgICAgIGJyZWFrO1xuICAgICAgICAgICAgfVxuICAgICAgICB9XG4gICAgICAgIHJldHVybiB2YWx1ZTtcbiAgICB9O1xuICAgIHNldChtZXJnZSh7XG4gICAgICAgIGVsZW1lbnQ6IG51bGwsXG4gICAgICAgIG9mZnNldDoge1xuICAgICAgICAgICAgbGVmdDogOCxcbiAgICAgICAgICAgIHRvcDogNlxuICAgICAgICB9LFxuICAgICAgICBzdHlsZTogJ3RyYW5zZm9ybScsXG4gICAgICAgIHNjYWxlOiAxLFxuICAgICAgICBib3VuZHM6IG51bGwsXG4gICAgICAgIHN5bWJvbDogbnVsbCxcbiAgICAgICAgdGFyZ2V0OiBudWxsLFxuICAgICAgICBoaWRlT25Gb2N1czogZmFsc2VcbiAgICB9LCBvcHRpb25zLCB7IGVsZW1lbnQ6IGVsZW1lbnQgfSkpO1xufTsiLCJ2YXIgbWVyZ2UgPSByZXF1aXJlKCcuL21lcmdlJyksIHRvcG1vc3QgPSByZXF1aXJlKCcuL3RvcG1vc3QnKSwgaHlwaGVuYXRlID0gZnVuY3Rpb24gKCkge1xuICAgICAgICB2YXIgY2FjaGUgPSB7fTtcbiAgICAgICAgcmV0dXJuIGZ1bmN0aW9uIChzdHJpbmcpIHtcbiAgICAgICAgICAgIHJldHVybiBjYWNoZVtzdHJpbmddID0gY2FjaGVbc3RyaW5nXSB8fCBmdW5jdGlvbiAoKSB7XG4gICAgICAgICAgICAgICAgcmV0dXJuIHN0cmluZy5yZXBsYWNlKC8oW0EtWl0pL2csIGZ1bmN0aW9uICgkMSkge1xuICAgICAgICAgICAgICAgICAgICByZXR1cm4gJy0nICsgJDEudG9Mb3dlckNhc2UoKTtcbiAgICAgICAgICAgICAgICB9KTtcbiAgICAgICAgICAgIH0oKTtcbiAgICAgICAgfTtcbiAgICB9KCksIGdldFN0eWxlID0gZnVuY3Rpb24gKGVsLCBjc3Nwcm9wKSB7XG4gICAgICAgIGlmIChlbC5jdXJyZW50U3R5bGUpXG4gICAgICAgICAgICByZXR1cm4gZWwuY3VycmVudFN0eWxlW2Nzc3Byb3BdO1xuICAgICAgICBlbHNlIGlmIChkb2N1bWVudC5kZWZhdWx0VmlldyAmJiBkb2N1bWVudC5kZWZhdWx0Vmlldy5nZXRDb21wdXRlZFN0eWxlKVxuICAgICAgICAgICAgcmV0dXJuIGRvY3VtZW50LmRlZmF1bHRWaWV3LmdldENvbXB1dGVkU3R5bGUoZWwsICcnKVtjc3Nwcm9wXTtcbiAgICAgICAgZWxzZVxuICAgICAgICAgICAgcmV0dXJuIGVsLnN0eWxlW2Nzc3Byb3BdO1xuICAgIH0sIHRyYW5zZm9ybVN0eWxlID0gZnVuY3Rpb24gKHByb3AsIHByZWZpeGVzKSB7XG4gICAgICAgIHZhciBpLCBlbGVtID0gZG9jdW1lbnQuY3JlYXRlRWxlbWVudCgnZGl2JyksIGNhcGl0YWxpemVkID0gcHJvcC5jaGFyQXQoMCkudG9VcHBlckNhc2UoKSArIHByb3Auc2xpY2UoMSk7XG4gICAgICAgIGZvciAoaSA9IDA7IGkgPCBwcmVmaXhlcy5sZW5ndGg7IGkrKykge1xuICAgICAgICAgICAgaWYgKHR5cGVvZiBlbGVtLnN0eWxlW3ByZWZpeGVzW2ldICsgY2FwaXRhbGl6ZWRdICE9PSAndW5kZWZpbmVkJykge1xuICAgICAgICAgICAgICAgIHJldHVybiBwcmVmaXhlc1tpXSArIGNhcGl0YWxpemVkO1xuICAgICAgICAgICAgfVxuICAgICAgICB9XG4gICAgICAgIHJldHVybiBudWxsO1xuICAgIH0oJ3RyYW5zZm9ybScsIFtcbiAgICAgICAgJycsXG4gICAgICAgICdNb3onLFxuICAgICAgICAnV2Via2l0JyxcbiAgICAgICAgJ08nLFxuICAgICAgICAnTXMnXG4gICAgXSksIGlzQ2hpbGRPZiA9IGZ1bmN0aW9uIChwYXJlbnQsIGNoaWxkKSB7XG4gICAgICAgIGlmICghY2hpbGQgfHwgIXBhcmVudCkge1xuICAgICAgICAgICAgcmV0dXJuIGZhbHNlO1xuICAgICAgICB9XG4gICAgICAgIHZhciBub2RlID0gY2hpbGQucGFyZW50Tm9kZTtcbiAgICAgICAgd2hpbGUgKG5vZGUgIT0gbnVsbCkge1xuICAgICAgICAgICAgaWYgKG5vZGUgPT0gcGFyZW50KSB7XG4gICAgICAgICAgICAgICAgcmV0dXJuIHRydWU7XG4gICAgICAgICAgICB9XG4gICAgICAgICAgICBub2RlID0gbm9kZS5wYXJlbnROb2RlO1xuICAgICAgICB9XG4gICAgICAgIHJldHVybiBmYWxzZTtcbiAgICB9LCBjc3MgPSBmdW5jdGlvbiAoZWxlbSwgbmFtZSwgdmFsdWUpIHtcbiAgICAgICAgdmFyIG1hcCA9IHt9LCBjc3NUZXh0ID0gbnVsbDtcbiAgICAgICAgaWYgKHR5cGVvZiBuYW1lID09PSAnb2JqZWN0Jykge1xuICAgICAgICAgICAgbWFwID0gbmFtZTtcbiAgICAgICAgfSBlbHNlIGlmICh0eXBlb2YgdmFsdWUgIT09ICd1bmRlZmluZWQnKSB7XG4gICAgICAgICAgICBtYXBbbmFtZV0gPSB2YWx1ZTtcbiAgICAgICAgfVxuICAgICAgICB2YXIga2V5cyA9IE9iamVjdC5rZXlzKG1hcCk7XG4gICAgICAgIGtleXMgPSBrZXlzLmZpbHRlcihmdW5jdGlvbiAoa2V5LCBpbmRleCkge1xuICAgICAgICAgICAgaWYgKG1hcFtrZXldID09PSAnJykge1xuICAgICAgICAgICAgICAgIGVsZW0uc3R5bGVba2V5XSA9IG1hcFtrZXldO1xuICAgICAgICAgICAgICAgIHJldHVybiBmYWxzZTtcbiAgICAgICAgICAgIH1cbiAgICAgICAgICAgIHJldHVybiB0cnVlO1xuICAgICAgICB9KTtcbiAgICAgICAgY3NzVGV4dCA9IGtleXMubWFwKGZ1bmN0aW9uIChuYW1lKSB7XG4gICAgICAgICAgICByZXR1cm4gaHlwaGVuYXRlKG5hbWUpICsgJzogJyArIG1hcFtuYW1lXTtcbiAgICAgICAgfSkuam9pbignOyAnKTtcbiAgICAgICAgaWYgKGNzc1RleHQgJiYgY3NzVGV4dC5sZW5ndGgpIHtcbiAgICAgICAgICAgIGVsZW0uc3R5bGUuY3NzVGV4dCA9IGVsZW0uc3R5bGUuY3NzVGV4dCArIGNzc1RleHQ7XG4gICAgICAgICAgICByZXR1cm4gbnVsbDtcbiAgICAgICAgfVxuICAgICAgICByZXR1cm4gZWxlbS5zdHlsZVtuYW1lXSB8fCB3aW5kb3cuZ2V0Q29tcHV0ZWRTdHlsZShlbGVtLCBudWxsKS5nZXRQcm9wZXJ0eVZhbHVlKG5hbWUpO1xuICAgIH0sIGdldE9mZnNldCA9IGZ1bmN0aW9uIChlbGVtZW50KSB7XG4gICAgICAgIHZhciBzY3JvbGxPZmZzZXQgPSBnZXRTY3JvbGxPZmZzZXQoKSwgcmVjdCA9IGVsZW1lbnQuZ2V0Qm91bmRpbmdDbGllbnRSZWN0KCk7XG4gICAgICAgIHJldHVybiB7XG4gICAgICAgICAgICB0b3A6IHJlY3QudG9wICsgc2Nyb2xsT2Zmc2V0LnRvcCxcbiAgICAgICAgICAgIGxlZnQ6IHJlY3QubGVmdCArIHNjcm9sbE9mZnNldC5sZWZ0XG4gICAgICAgIH07XG4gICAgfSwgZ2V0U2Nyb2xsT2Zmc2V0ID0gZnVuY3Rpb24gKCkge1xuICAgICAgICByZXR1cm4ge1xuICAgICAgICAgICAgbGVmdDogZG9jdW1lbnQuYm9keSAmJiBkb2N1bWVudC5ib2R5LnNjcm9sbExlZnQgKyBkb2N1bWVudC5kb2N1bWVudEVsZW1lbnQuc2Nyb2xsTGVmdCxcbiAgICAgICAgICAgIHRvcDogZG9jdW1lbnQuYm9keSAmJiBkb2N1bWVudC5ib2R5LnNjcm9sbFRvcCArIGRvY3VtZW50LmRvY3VtZW50RWxlbWVudC5zY3JvbGxUb3BcbiAgICAgICAgfTtcbiAgICB9LCBnZXRCb3VuZGluZ1JlY3QgPSBmdW5jdGlvbiAoZWxlbWVudCkge1xuICAgICAgICBpZiAoIWVsZW1lbnQpIHtcbiAgICAgICAgICAgIHJldHVybiB7XG4gICAgICAgICAgICAgICAgeDogLUluZmluaXR5LFxuICAgICAgICAgICAgICAgIHk6IC1JbmZpbml0eSxcbiAgICAgICAgICAgICAgICB3aWR0aDogSW5maW5pdHksXG4gICAgICAgICAgICAgICAgaGVpZ2h0OiBJbmZpbml0eVxuICAgICAgICAgICAgfTtcbiAgICAgICAgfVxuICAgICAgICB2YXIgc2Nyb2xsT2Zmc2V0ID0gZ2V0U2Nyb2xsT2Zmc2V0KCk7XG4gICAgICAgIHZhciByZWN0ID0gZWxlbWVudC5nZXRCb3VuZGluZ0NsaWVudFJlY3QoKTtcbiAgICAgICAgcmV0dXJuIHtcbiAgICAgICAgICAgIHg6IHJlY3QubGVmdCArIHNjcm9sbE9mZnNldC5sZWZ0LFxuICAgICAgICAgICAgeTogcmVjdC50b3AgKyBzY3JvbGxPZmZzZXQudG9wLFxuICAgICAgICAgICAgd2lkdGg6IHJlY3Qud2lkdGgsXG4gICAgICAgICAgICBoZWlnaHQ6IHJlY3QuaGVpZ2h0XG4gICAgICAgIH07XG4gICAgfSwgaW5zdGFuY2UgPSBudWxsO1xuZnVuY3Rpb24gQ3Vyc29yTWFuYWdlcihvcHRpb25zKSB7XG4gICAgaWYgKGluc3RhbmNlKSB7XG4gICAgICAgIGluc3RhbmNlLnNldChvcHRpb25zKTtcbiAgICAgICAgcmV0dXJuIGluc3RhbmNlO1xuICAgIH1cbiAgICBpbnN0YW5jZSA9IHRoaXM7XG4gICAgdmFyIGN1cnNvcnMgPSBbXTtcbiAgICB2YXIgY2xpZW50ID0ge1xuICAgICAgICAgICAgeDogMCxcbiAgICAgICAgICAgIHk6IDBcbiAgICAgICAgfTtcbiAgICB2YXIgbW91c2UgPSB7XG4gICAgICAgICAgICB4OiAtSW5maW5pdHksXG4gICAgICAgICAgICB5OiAtSW5maW5pdHksXG4gICAgICAgICAgICBlbGVtZW50OiBudWxsXG4gICAgICAgIH07XG4gICAgdmFyIGV2ZW50cyA9IFtcbiAgICAgICAgICAgICdtb3VzZWRvd24nLFxuICAgICAgICAgICAgJ2NsaWNrJyxcbiAgICAgICAgICAgICdzY3JvbGwnLFxuICAgICAgICAgICAgJ3Jlc2l6ZScsXG4gICAgICAgICAgICAnbW91c2Vtb3ZlJyxcbiAgICAgICAgICAgICdtb3VzZW91dCdcbiAgICAgICAgXTtcbiAgICB2YXIgY3Vyc29ySXRlbXMgPSBbXTtcbiAgICB2YXIgY3Vyc29ySXRlbSA9IG51bGw7XG4gICAgdmFyIGNsaWNraW5nID0gZmFsc2U7XG4gICAgdmFyIGNsaWNrYWJsZSA9IHRydWU7XG4gICAgZnVuY3Rpb24gaW5pdCgpIHtcbiAgICAgICAgaWYgKCEoJ29udG91Y2gnIGluIHdpbmRvdykpIHtcbiAgICAgICAgICAgIGFkZE1vdXNlTGlzdGVuZXJzKHdpbmRvdyk7XG4gICAgICAgIH1cbiAgICB9XG4gICAgZnVuY3Rpb24gaGFuZGxlRXZlbnQoZSkge1xuICAgICAgICB0cnkge1xuICAgICAgICAgICAgZS50eXBlO1xuICAgICAgICB9IGNhdGNoIChlKSB7XG4gICAgICAgICAgICBjb25zb2xlLndhcm4oZSk7XG4gICAgICAgICAgICByZXR1cm47XG4gICAgICAgIH1cbiAgICAgICAgc3dpdGNoIChlLnR5cGUpIHtcbiAgICAgICAgY2FzZSAnbW91c2Vkb3duJzpcbiAgICAgICAgICAgIGNsaWNraW5nID0gZmFsc2U7XG4gICAgICAgICAgICBicmVhaztcbiAgICAgICAgY2FzZSAnbW91c2VvdXQnOlxuICAgICAgICAgICAgdmFyIHJlbGF0ZWRUYXJnZXQgPSB0eXBlb2YgZS50b0VsZW1lbnQgIT0gJ3VuZGVmaW5lZCcgPyBlLnRvRWxlbWVudCA6IGUucmVsYXRlZFRhcmdldDtcbiAgICAgICAgICAgIGlmIChyZWxhdGVkVGFyZ2V0ID09PSBudWxsKSB7XG4gICAgICAgICAgICAgICAgbW91c2UueCA9IC1JbmZpbml0eTtcbiAgICAgICAgICAgICAgICBtb3VzZS55ID0gLUluZmluaXR5O1xuICAgICAgICAgICAgICAgIG1vdXNlLmVsZW1lbnQgPSBudWxsO1xuICAgICAgICAgICAgfVxuICAgICAgICAgICAgYnJlYWs7XG4gICAgICAgIGNhc2UgJ21vdXNlbW92ZSc6XG4gICAgICAgICAgICBjbGllbnQueCA9IGUuY2xpZW50WDtcbiAgICAgICAgICAgIGNsaWVudC55ID0gZS5jbGllbnRZO1xuICAgICAgICBkZWZhdWx0OlxuICAgICAgICAgICAgdmFyIHNjcm9sbE9mZnNldCA9IGdldFNjcm9sbE9mZnNldCgpO1xuICAgICAgICAgICAgbW91c2UueCA9IGNsaWVudC54ICsgc2Nyb2xsT2Zmc2V0LmxlZnQ7XG4gICAgICAgICAgICBtb3VzZS55ID0gY2xpZW50LnkgKyBzY3JvbGxPZmZzZXQudG9wO1xuICAgICAgICAgICAgbW91c2UuZWxlbWVudCA9IGUudGFyZ2V0O1xuICAgICAgICB9XG4gICAgICAgIGludmFsaWRhdGUuY2FsbCh0aGlzKTtcbiAgICAgICAgc3dpdGNoIChlLnR5cGUpIHtcbiAgICAgICAgY2FzZSAnY2xpY2snOlxuICAgICAgICAgICAgaWYgKCFjbGlja2luZyAmJiBjdXJzb3JJdGVtKSB7XG4gICAgICAgICAgICAgICAgY2xpY2tpbmcgPSB0cnVlO1xuICAgICAgICAgICAgICAgIGlmIChtb3VzZS5lbGVtZW50ICYmIGN1cnNvckl0ZW0gJiYgY3Vyc29ySXRlbS50YXJnZXQgJiYgY3Vyc29ySXRlbS5zeW1ib2wgIT09IG1vdXNlLmVsZW1lbnQgJiYgaXNDaGlsZE9mKGN1cnNvckl0ZW0uY29udGFpbmVyLCBtb3VzZS5lbGVtZW50KSkge1xuICAgICAgICAgICAgICAgICAgICBjdXJzb3JJdGVtLnRhcmdldC5jbGljaygpO1xuICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgICB2YXIgY2xpY2sgPSBjdXJzb3JJdGVtICYmIGN1cnNvckl0ZW0uY2xpY2s7XG4gICAgICAgICAgICAgICAgaWYgKHR5cGVvZiBjbGljayA9PT0gJ2Z1bmN0aW9uJykge1xuICAgICAgICAgICAgICAgICAgICBjbGljay5jYWxsKGN1cnNvckl0ZW0uZWxlbWVudCwgZSk7XG4gICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgfVxuICAgICAgICAgICAgYnJlYWs7XG4gICAgICAgIH1cbiAgICAgICAgcmVuZGVyLmNhbGwoaW5zdGFuY2UpO1xuICAgIH1cbiAgICBmdW5jdGlvbiBjbG9zZXN0KGVsLCBzZWxlY3Rvcikge1xuICAgICAgICB2YXIgbWF0Y2hlc0ZuO1xuICAgICAgICBbXG4gICAgICAgICAgICAnbWF0Y2hlcycsXG4gICAgICAgICAgICAnd2Via2l0TWF0Y2hlc1NlbGVjdG9yJyxcbiAgICAgICAgICAgICdtb3pNYXRjaGVzU2VsZWN0b3InLFxuICAgICAgICAgICAgJ21zTWF0Y2hlc1NlbGVjdG9yJyxcbiAgICAgICAgICAgICdvTWF0Y2hlc1NlbGVjdG9yJ1xuICAgICAgICBdLnNvbWUoZnVuY3Rpb24gKGZuKSB7XG4gICAgICAgICAgICBpZiAodHlwZW9mIGRvY3VtZW50LmJvZHlbZm5dID09ICdmdW5jdGlvbicpIHtcbiAgICAgICAgICAgICAgICBtYXRjaGVzRm4gPSBmbjtcbiAgICAgICAgICAgICAgICByZXR1cm4gdHJ1ZTtcbiAgICAgICAgICAgIH1cbiAgICAgICAgICAgIHJldHVybiBmYWxzZTtcbiAgICAgICAgfSk7XG4gICAgICAgIHZhciBwYXJlbnQ7XG4gICAgICAgIHdoaWxlIChlbCkge1xuICAgICAgICAgICAgcGFyZW50ID0gZWwucGFyZW50RWxlbWVudDtcbiAgICAgICAgICAgIGlmIChwYXJlbnQgJiYgcGFyZW50W21hdGNoZXNGbl0oc2VsZWN0b3IpKSB7XG4gICAgICAgICAgICAgICAgcmV0dXJuIHBhcmVudDtcbiAgICAgICAgICAgIH1cbiAgICAgICAgICAgIGVsID0gcGFyZW50O1xuICAgICAgICB9XG4gICAgICAgIHJldHVybiBudWxsO1xuICAgIH1cbiAgICBmdW5jdGlvbiBnZXRQYXJlbnRzKGVsZW1lbnQsIHNlbGVjdG9yKSB7XG4gICAgICAgIHZhciBwYXJlbnRzID0gW107XG4gICAgICAgIHZhciBwYXJlbnQgPSBlbGVtZW50O1xuICAgICAgICB3aGlsZSAocGFyZW50ID0gcGFyZW50LnBhcmVudEVsZW1lbnQgJiYgY2xvc2VzdChwYXJlbnQucGFyZW50RWxlbWVudCwgc2VsZWN0b3IpKSB7XG4gICAgICAgICAgICBwYXJlbnRzLnB1c2gocGFyZW50KTtcbiAgICAgICAgfVxuICAgICAgICByZXR1cm4gcGFyZW50cztcbiAgICB9XG4gICAgZnVuY3Rpb24gaW52YWxpZGF0ZSgpIHtcbiAgICAgICAgY3Vyc29ySXRlbXMgPSBjdXJzb3JzLm1hcChmdW5jdGlvbiAoY3Vyc29yLCBpbmRleCkge1xuICAgICAgICAgICAgcmV0dXJuIGdldEN1cnNvckl0ZW0oY3Vyc29yLCBjdXJzb3JJdGVtc1tpbmRleF0pO1xuICAgICAgICB9KTtcbiAgICAgICAgdmFyIGZpbHRlcmVkID0gY3Vyc29ySXRlbXMuZmlsdGVyKGZ1bmN0aW9uIChjdXJzb3JJdGVtLCBpbmRleCkge1xuICAgICAgICAgICAgICAgIHZhciBtb3VzZUVsZW1lbnQgPSBtb3VzZS5lbGVtZW50LCBzeW1ib2wgPSBjdXJzb3JJdGVtLnN5bWJvbCwgYm91bmRzID0gY3Vyc29ySXRlbS5ib3VuZHMsIGNvbnRhaW5lciA9IGN1cnNvckl0ZW0uY29udGFpbmVyLCByZXN1bHQgPSBmYWxzZTtcbiAgICAgICAgICAgICAgICBpZiAobW91c2VFbGVtZW50KSB7XG4gICAgICAgICAgICAgICAgICAgIGlmICghbW91c2VFbGVtZW50LmhyZWYgJiYgIWdldFBhcmVudHMobW91c2VFbGVtZW50LCAnYScpLmxlbmd0aCkge1xuICAgICAgICAgICAgICAgICAgICAgICAgaWYgKHRvcG1vc3QobW91c2VFbGVtZW50LCBzeW1ib2wpID09PSBzeW1ib2wpIHtcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICBpZiAoY29udGFpbmVyID09PSBtb3VzZUVsZW1lbnQgfHwgaXNDaGlsZE9mKGNvbnRhaW5lciwgbW91c2VFbGVtZW50KSkge1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICByZXN1bHQgPSBtb3VzZS54ID49IGJvdW5kcy54ICYmIG1vdXNlLnggPD0gYm91bmRzLnggKyBib3VuZHMud2lkdGggJiYgbW91c2UueSA+PSBib3VuZHMueSAmJiBtb3VzZS55IDw9IGJvdW5kcy55ICsgYm91bmRzLmhlaWdodDtcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgICAgcmV0dXJuIHJlc3VsdDtcbiAgICAgICAgICAgIH0pLCBzb3J0ZWQgPSBmaWx0ZXJlZC5zb3J0KGZ1bmN0aW9uIChhLCBiKSB7XG4gICAgICAgICAgICAgICAgdmFyIHpFbGVtZW50ID0gdG9wbW9zdChhLnN5bWJvbCwgYi5zeW1ib2wpO1xuICAgICAgICAgICAgICAgIGlmICh6RWxlbWVudCA9PT0gYS5zeW1ib2wpIHtcbiAgICAgICAgICAgICAgICAgICAgcmV0dXJuIC0xO1xuICAgICAgICAgICAgICAgIH0gZWxzZSBpZiAoekVsZW1lbnQgPT09IGIuc3ltYm9sKSB7XG4gICAgICAgICAgICAgICAgICAgIHJldHVybiAxO1xuICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgICB2YXIgcDEgPSB7XG4gICAgICAgICAgICAgICAgICAgICAgICB4OiBhLnggKyBhLndpZHRoIC8gMixcbiAgICAgICAgICAgICAgICAgICAgICAgIHk6IGEueSArIGEuaGVpZ2h0IC8gMlxuICAgICAgICAgICAgICAgICAgICB9O1xuICAgICAgICAgICAgICAgIHZhciBwMiA9IHtcbiAgICAgICAgICAgICAgICAgICAgICAgIHg6IGIueCArIGIud2lkdGggLyAyLFxuICAgICAgICAgICAgICAgICAgICAgICAgeTogYi55ICsgYi5oZWlnaHQgLyAyXG4gICAgICAgICAgICAgICAgICAgIH07XG4gICAgICAgICAgICAgICAgdmFyIGQxID0gTWF0aC5zcXJ0KE1hdGgucG93KHAxLnggLSBtb3VzZS54LCAyKSArIE1hdGgucG93KHAxLnkgLSBtb3VzZS55LCAyKSk7XG4gICAgICAgICAgICAgICAgdmFyIGQyID0gTWF0aC5zcXJ0KE1hdGgucG93KHAyLnggLSBtb3VzZS54LCAyKSArIE1hdGgucG93KHAyLnkgLSBtb3VzZS55LCAyKSk7XG4gICAgICAgICAgICAgICAgcmV0dXJuIGQxIDwgZDIgPyBkMSA6IGQxID4gZDIgPyBkMiA6IDA7XG4gICAgICAgICAgICB9KS5yZXZlcnNlKCk7XG4gICAgICAgIGN1cnNvckl0ZW0gPSBzb3J0ZWRbMF07XG4gICAgICAgIHNldE1vdXNlUHJvdmlkZXJzKFt3aW5kb3ddLmNvbmNhdChjdXJzb3JJdGVtcy5tYXAoZnVuY3Rpb24gKGl0ZW0pIHtcbiAgICAgICAgICAgIHJldHVybiBpdGVtLmNvbnRhaW5lcjtcbiAgICAgICAgfSkpKTtcbiAgICB9XG4gICAgZnVuY3Rpb24gcmVuZGVyKCkge1xuICAgICAgICBjdXJzb3JJdGVtcy5mb3JFYWNoKGZ1bmN0aW9uIChpdGVtKSB7XG4gICAgICAgICAgICB2YXIgc3ltYm9sID0gaXRlbS5zeW1ib2wsIHN0eWxlID0ge1xuICAgICAgICAgICAgICAgICAgICB2aXNpYmlsaXR5OiBpdGVtID09PSBjdXJzb3JJdGVtID8gJycgOiAnaGlkZGVuJyxcbiAgICAgICAgICAgICAgICAgICAgcG9zaXRpb246ICdhYnNvbHV0ZScsXG4gICAgICAgICAgICAgICAgICAgIGN1cnNvcjogJ2luaGVyaXQnXG4gICAgICAgICAgICAgICAgfTtcbiAgICAgICAgICAgIGlmIChpdGVtLnN0eWxlID09PSAndHJhbnNmb3JtJyAmJiB0cmFuc2Zvcm1TdHlsZSkge1xuICAgICAgICAgICAgICAgIHN0eWxlW3RyYW5zZm9ybVN0eWxlICsgJ09yaWdpbiddID0gJyc7XG4gICAgICAgICAgICAgICAgc3R5bGVbdHJhbnNmb3JtU3R5bGVdID0gJyc7XG4gICAgICAgICAgICB9IGVsc2Uge1xuICAgICAgICAgICAgICAgIHN0eWxlLmxlZnQgPSAnJztcbiAgICAgICAgICAgICAgICBzdHlsZS50b3AgPSAnJztcbiAgICAgICAgICAgIH1cbiAgICAgICAgICAgIHN5bWJvbC5jbGFzc0xpc3QgJiYgIXN5bWJvbC5jbGFzc0xpc3QuY29udGFpbnMoJ2N1cnNvcicpICYmIHN5bWJvbC5jbGFzc0xpc3QuYWRkKCdjdXJzb3InKTtcbiAgICAgICAgICAgIGNzcyhzeW1ib2wsIHN0eWxlKTtcbiAgICAgICAgICAgIGlmIChjdXJzb3JJdGVtID09PSBpdGVtKSB7XG4gICAgICAgICAgICAgICAgdmFyIHBvcyA9IGdldE9mZnNldChzeW1ib2wpO1xuICAgICAgICAgICAgICAgIHZhciBweCA9IHBvcy5sZWZ0O1xuICAgICAgICAgICAgICAgIHZhciBweSA9IHBvcy50b3A7XG4gICAgICAgICAgICAgICAgdmFyIG9mZiA9IGl0ZW0ub2Zmc2V0O1xuICAgICAgICAgICAgICAgIHZhciB4ID0gTWF0aC5yb3VuZChtb3VzZS54IC0gcHggKyBvZmYubGVmdCk7XG4gICAgICAgICAgICAgICAgdmFyIHkgPSBNYXRoLnJvdW5kKG1vdXNlLnkgLSBweSArIG9mZi50b3ApO1xuICAgICAgICAgICAgICAgIHN0eWxlID0ge307XG4gICAgICAgICAgICAgICAgaWYgKGl0ZW0uc3R5bGUgPT09ICd0cmFuc2Zvcm0nICYmIHRyYW5zZm9ybVN0eWxlKSB7XG4gICAgICAgICAgICAgICAgICAgIHN0eWxlW3RyYW5zZm9ybVN0eWxlICsgJ09yaWdpbiddID0gJzAgMCc7XG4gICAgICAgICAgICAgICAgICAgIHN0eWxlW3RyYW5zZm9ybVN0eWxlXSA9ICd0cmFuc2xhdGUzZCgnICsgeCArICdweCwnICsgeSArICdweCwgMCkgc2NhbGUoJyArIGl0ZW0uc2NhbGUgKyAnLCcgKyBpdGVtLnNjYWxlICsgJyknO1xuICAgICAgICAgICAgICAgIH0gZWxzZSB7XG4gICAgICAgICAgICAgICAgICAgIHN0eWxlLmxlZnQgPSB4ICsgcG9zLmxlZnQgKyAncHgnO1xuICAgICAgICAgICAgICAgICAgICBzdHlsZS50b3AgPSB5ICsgcG9zLnRvcCArICdweCc7XG4gICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICAgIGNzcyhzeW1ib2wsIHN0eWxlKTtcbiAgICAgICAgICAgIH1cbiAgICAgICAgICAgIGlmIChpdGVtID09PSBjdXJzb3JJdGVtKSB7XG4gICAgICAgICAgICAgICAgc3ltYm9sLmNsYXNzTGlzdCAmJiAhc3ltYm9sLmNsYXNzTGlzdC5jb250YWlucygnY3Vyc29yLWFjdGl2ZScpICYmIHN5bWJvbC5jbGFzc0xpc3QuYWRkKCdjdXJzb3ItYWN0aXZlJyk7XG4gICAgICAgICAgICAgICAgc3ltYm9sLmNsYXNzTGlzdCAmJiBzeW1ib2wuY2xhc3NMaXN0LmNvbnRhaW5zKCdjdXJzb3ItaGlkZGVuJykgJiYgc3ltYm9sLmNsYXNzTGlzdC5yZW1vdmUoJ2N1cnNvci1oaWRkZW4nKTtcbiAgICAgICAgICAgIH0gZWxzZSB7XG4gICAgICAgICAgICAgICAgc3ltYm9sLmNsYXNzTGlzdCAmJiBzeW1ib2wuY2xhc3NMaXN0LmNvbnRhaW5zKCdjdXJzb3ItYWN0aXZlJykgJiYgc3ltYm9sLmNsYXNzTGlzdC5yZW1vdmUoJ2N1cnNvci1hY3RpdmUnKTtcbiAgICAgICAgICAgICAgICBzeW1ib2wuY2xhc3NMaXN0ICYmICFzeW1ib2wuY2xhc3NMaXN0LmNvbnRhaW5zKCdjdXJzb3ItaGlkZGVuJykgJiYgc3ltYm9sLmNsYXNzTGlzdC5hZGQoJ2N1cnNvci1oaWRkZW4nKTtcbiAgICAgICAgICAgIH1cbiAgICAgICAgfSk7XG4gICAgfVxuICAgIDtcbiAgICB0aGlzLnVwZGF0ZSA9IGZ1bmN0aW9uICgpIHtcbiAgICAgICAgaW52YWxpZGF0ZS5jYWxsKHRoaXMpO1xuICAgICAgICByZW5kZXIuY2FsbCh0aGlzKTtcbiAgICB9O1xuICAgIHRoaXMuYWRkID0gZnVuY3Rpb24gKGN1cnNvcikge1xuICAgICAgICBpZiAoY3Vyc29ycy5pbmRleE9mKGN1cnNvcikgPT09IC0xKSB7XG4gICAgICAgICAgICBjdXJzb3JzLnB1c2goY3Vyc29yKTtcbiAgICAgICAgICAgIHRoaXMudXBkYXRlKCk7XG4gICAgICAgIH1cbiAgICB9O1xuICAgIHRoaXMucmVtb3ZlID0gZnVuY3Rpb24gKGN1cnNvcikge1xuICAgICAgICBjdXJzb3JzLnNwbGljZShjdXJzb3JzLmluZGV4T2YoY3Vyc29yKSwgMSk7XG4gICAgICAgIHRoaXMudXBkYXRlKCk7XG4gICAgfTtcbiAgICB2YXIgbW91c2VQcm92aWRlcnMgPSBbXTtcbiAgICBmdW5jdGlvbiBzZXRNb3VzZVByb3ZpZGVycyhlbGVtZW50cykge1xuICAgICAgICBlbGVtZW50cyA9IGVsZW1lbnRzLmZpbHRlcihmdW5jdGlvbiAobikge1xuICAgICAgICAgICAgcmV0dXJuIG47XG4gICAgICAgIH0pO1xuICAgICAgICBtb3VzZVByb3ZpZGVycy5mb3JFYWNoKGZ1bmN0aW9uIChlbGVtZW50KSB7XG4gICAgICAgICAgICBpZiAoZWxlbWVudHMuaW5kZXhPZihlbGVtZW50KSA9PT0gLTEpIHtcbiAgICAgICAgICAgICAgICByZW1vdmVNb3VzZUxpc3RlbmVycyhlbGVtZW50KTtcbiAgICAgICAgICAgIH1cbiAgICAgICAgfSk7XG4gICAgICAgIGVsZW1lbnRzLmZvckVhY2goZnVuY3Rpb24gKGVsZW1lbnQpIHtcbiAgICAgICAgICAgIGlmIChtb3VzZVByb3ZpZGVycy5pbmRleE9mKGVsZW1lbnQpID09PSAtMSkge1xuICAgICAgICAgICAgICAgIGFkZE1vdXNlTGlzdGVuZXJzKGVsZW1lbnQpO1xuICAgICAgICAgICAgfVxuICAgICAgICB9KTtcbiAgICAgICAgbW91c2VQcm92aWRlcnMgPSBlbGVtZW50cztcbiAgICB9XG4gICAgZnVuY3Rpb24gYWRkTW91c2VMaXN0ZW5lcnMoZWxlbWVudCkge1xuICAgICAgICBmb3IgKHZhciBpID0gMCwgZXZlbnQ7IGV2ZW50ID0gZXZlbnRzW2ldOyBpKyspIHtcbiAgICAgICAgICAgIGVsZW1lbnQuYWRkRXZlbnRMaXN0ZW5lcihldmVudCwgaGFuZGxlRXZlbnQpO1xuICAgICAgICB9XG4gICAgfVxuICAgIGZ1bmN0aW9uIHJlbW92ZU1vdXNlTGlzdGVuZXJzKGVsZW1lbnQpIHtcbiAgICAgICAgZm9yICh2YXIgaSA9IDAsIGV2ZW50OyBldmVudCA9IGV2ZW50c1tpXTsgaSsrKSB7XG4gICAgICAgICAgICBlbGVtZW50LnJlbW92ZUV2ZW50TGlzdGVuZXIoZXZlbnQsIGhhbmRsZUV2ZW50KTtcbiAgICAgICAgfVxuICAgIH1cbiAgICBpbml0LmNhbGwodGhpcyk7XG59XG5mdW5jdGlvbiBnZXRDdXJzb3JJdGVtKGN1cnNvcikge1xuICAgIHZhciBlbGVtZW50ID0gY3Vyc29yLmdldCgnZWxlbWVudCcpLCBwcm9wcyA9IGN1cnNvci5nZXQoKSwgc3ltYm9sID0gcHJvcHMuc3ltYm9sLCBib3VuZHMgPSBwcm9wcy5ib3VuZHMsIG9mZnNldCA9IHByb3BzLm9mZnNldCwgc3R5bGUgPSBwcm9wcy5zdHlsZSwgc2NhbGUgPSBwcm9wcy5zY2FsZSwgdGFyZ2V0ID0gcHJvcHMudGFyZ2V0IHx8IHN5bWJvbC5ub2RlTmFtZS50b0xvd2VyQ2FzZSgpID09PSAnYScgPyBzeW1ib2wgOiBlbGVtZW50LCBjb250YWluZXIsIGRpc3BsYXkgPSBlbGVtZW50LnN0eWxlLmRpc3BsYXk7XG4gICAgY3NzKGVsZW1lbnQsIHsgZGlzcGxheTogJycgfSk7XG4gICAgcHJvcHMgPSBjdXJzb3IuZ2V0KCk7XG4gICAgc3ltYm9sID0gcHJvcHMuc3ltYm9sO1xuICAgIGJvdW5kcyA9IHByb3BzLmJvdW5kcztcbiAgICBvZmZzZXQgPSBwcm9wcy5vZmZzZXQ7XG4gICAgc3R5bGUgPSBwcm9wcy5zdHlsZTtcbiAgICBzY2FsZSA9IHByb3BzLnNjYWxlO1xuICAgIHRhcmdldCA9IHByb3BzLnRhcmdldCB8fCBzeW1ib2wubm9kZU5hbWUudG9Mb3dlckNhc2UoKSA9PT0gJ2EnID8gc3ltYm9sIDogZWxlbWVudDtcbiAgICBpZiAoIXN5bWJvbC5wYXJlbnROb2RlKSB7XG4gICAgICAgIGVsZW1lbnQuYXBwZW5kQ2hpbGQoc3ltYm9sKTtcbiAgICB9XG4gICAgaWYgKGJvdW5kcyAmJiBib3VuZHMuZ2V0Qm91bmRpbmdDbGllbnRSZWN0KSB7XG4gICAgICAgIGNvbnRhaW5lciA9IGJvdW5kcztcbiAgICAgICAgYm91bmRzID0gZ2V0Qm91bmRpbmdSZWN0KGJvdW5kcyk7XG4gICAgfSBlbHNlIHtcbiAgICAgICAgY29udGFpbmVyID0gc3ltYm9sLm9mZnNldFBhcmVudCB8fCBlbGVtZW50ICYmIGVsZW1lbnQgPT09IHN5bWJvbCA/IGVsZW1lbnQub2Zmc2V0UGFyZW50IHx8IGRvY3VtZW50LmRvY3VtZW50RWxlbWVudCA6IGVsZW1lbnQ7XG4gICAgICAgIHZhciByZWN0ID0gZ2V0Qm91bmRpbmdSZWN0KGNvbnRhaW5lcik7XG4gICAgICAgIHZhciBjb250YWluZXJQb3MgPSBnZXRPZmZzZXQoY29udGFpbmVyKSB8fCB7XG4gICAgICAgICAgICAgICAgeDogMCxcbiAgICAgICAgICAgICAgICB5OiAwXG4gICAgICAgICAgICB9O1xuICAgICAgICBpZiAodHlwZW9mIGJvdW5kcyA9PT0gJ2Z1bmN0aW9uJykge1xuICAgICAgICAgICAgYm91bmRzID0gYm91bmRzLmFwcGx5KGVsZW1lbnQsIFtjb250YWluZXJdKTtcbiAgICAgICAgfVxuICAgICAgICB2YXIgeCA9IHR5cGVvZiBib3VuZHMueCA9PT0gJ3N0cmluZycgJiYgYm91bmRzLnguaW5kZXhPZignJScpID49IDAgPyBwYXJzZUZsb2F0KGJvdW5kcy54KSAqIHJlY3Qud2lkdGggLyAxMDAgOiBwYXJzZUZsb2F0KGJvdW5kcy54KTtcbiAgICAgICAgdmFyIHkgPSB0eXBlb2YgYm91bmRzLnkgPT09ICdzdHJpbmcnICYmIGJvdW5kcy55LmluZGV4T2YoJyUnKSA+PSAwID8gcGFyc2VGbG9hdChib3VuZHMueSkgKiByZWN0LmhlaWdodCAvIDEwMCA6IHBhcnNlRmxvYXQoYm91bmRzLnkpO1xuICAgICAgICB2YXIgd2lkdGggPSB0eXBlb2YgYm91bmRzLndpZHRoID09PSAnc3RyaW5nJyAmJiBib3VuZHMud2lkdGguaW5kZXhPZignJScpID49IDAgPyBwYXJzZUZsb2F0KGJvdW5kcy53aWR0aCkgKiByZWN0LndpZHRoIC8gMTAwIDogcGFyc2VGbG9hdChib3VuZHMud2lkdGgpO1xuICAgICAgICB2YXIgaGVpZ2h0ID0gdHlwZW9mIGJvdW5kcy5oZWlnaHQgPT09ICdzdHJpbmcnICYmIGJvdW5kcy5oZWlnaHQuaW5kZXhPZignJScpID49IDAgPyBwYXJzZUZsb2F0KGJvdW5kcy5oZWlnaHQpICogcmVjdC5oZWlnaHQgLyAxMDAgOiBwYXJzZUZsb2F0KGJvdW5kcy5oZWlnaHQpO1xuICAgICAgICBib3VuZHMgPSB7XG4gICAgICAgICAgICB4OiBjb250YWluZXJQb3MubGVmdCArIHgsXG4gICAgICAgICAgICB5OiBjb250YWluZXJQb3MudG9wICsgeSxcbiAgICAgICAgICAgIHdpZHRoOiB3aWR0aCxcbiAgICAgICAgICAgIGhlaWdodDogaGVpZ2h0XG4gICAgICAgIH07XG4gICAgfVxuICAgIGNzcyhlbGVtZW50LCAnZGlzcGxheScsIGRpc3BsYXkpO1xuICAgIHJldHVybiBtZXJnZShwcm9wcywge1xuICAgICAgICBjdXJzb3I6IGN1cnNvcixcbiAgICAgICAgc3ltYm9sOiBzeW1ib2wsXG4gICAgICAgIGJvdW5kczogYm91bmRzLFxuICAgICAgICBjb250YWluZXI6IGNvbnRhaW5lcixcbiAgICAgICAgdGFyZ2V0OiB0YXJnZXQsXG4gICAgICAgIG9mZnNldDogb2Zmc2V0LFxuICAgICAgICBzdHlsZTogc3R5bGUsXG4gICAgICAgIHNjYWxlOiBzY2FsZVxuICAgIH0pO1xufVxubW9kdWxlLmV4cG9ydHMgPSBDdXJzb3JNYW5hZ2VyOyIsIm1vZHVsZS5leHBvcnRzID0gZnVuY3Rpb24gKCkge1xuICAgIHZhciBvYmogPSB7fSwgaSA9IDAsIGlsID0gYXJndW1lbnRzLmxlbmd0aCwga2V5O1xuICAgIGZvciAoOyBpIDwgaWw7IGkrKykge1xuICAgICAgICBmb3IgKGtleSBpbiBhcmd1bWVudHNbaV0pIHtcbiAgICAgICAgICAgIGlmIChhcmd1bWVudHNbaV0uaGFzT3duUHJvcGVydHkoa2V5KSkge1xuICAgICAgICAgICAgICAgIG9ialtrZXldID0gYXJndW1lbnRzW2ldW2tleV07XG4gICAgICAgICAgICB9XG4gICAgICAgIH1cbiAgICB9XG4gICAgcmV0dXJuIG9iajtcbn07IiwidmFyIGdldFN0eWxlID0gZnVuY3Rpb24gKGVsLCBjc3Nwcm9wKSB7XG4gICAgICAgIGlmIChlbC5zdHlsZSlcbiAgICAgICAgICAgIGlmIChlbC5jdXJyZW50U3R5bGUpXG4gICAgICAgICAgICAgICAgcmV0dXJuIGVsLmN1cnJlbnRTdHlsZVtjc3Nwcm9wXTtcbiAgICAgICAgICAgIGVsc2UgaWYgKGRvY3VtZW50LmRlZmF1bHRWaWV3ICYmIGRvY3VtZW50LmRlZmF1bHRWaWV3LmdldENvbXB1dGVkU3R5bGUpXG4gICAgICAgICAgICAgICAgcmV0dXJuIGRvY3VtZW50LmRlZmF1bHRWaWV3LmdldENvbXB1dGVkU3R5bGUoZWwsICcnKVtjc3Nwcm9wXTtcbiAgICAgICAgICAgIGVsc2VcbiAgICAgICAgICAgICAgICByZXR1cm4gZWwuc3R5bGVbY3NzcHJvcF07XG4gICAgfSwgZ2V0WkluZGV4ID0gZnVuY3Rpb24gKGVsKSB7XG4gICAgICAgIHZhciB6SW5kZXggPSBwYXJzZUZsb2F0KGdldFN0eWxlKGVsLCAnekluZGV4JykpO1xuICAgICAgICB6SW5kZXggPSAhaXNOYU4oekluZGV4KSA/IHpJbmRleCA6IDA7XG4gICAgICAgIGlmICh6SW5kZXggPT09IDApIHtcbiAgICAgICAgICAgIGlmIChlbC5wYXJlbnROb2RlKSB7XG4gICAgICAgICAgICAgICAgcmV0dXJuIGdldFpJbmRleChlbC5wYXJlbnROb2RlKTtcbiAgICAgICAgICAgIH1cbiAgICAgICAgfVxuICAgICAgICByZXR1cm4gekluZGV4O1xuICAgIH0sIGlzQ2hpbGRPZiA9IGZ1bmN0aW9uIChwYXJlbnQsIGNoaWxkKSB7XG4gICAgICAgIGlmICghY2hpbGQgfHwgIXBhcmVudCkge1xuICAgICAgICAgICAgcmV0dXJuIGZhbHNlO1xuICAgICAgICB9XG4gICAgICAgIHZhciBub2RlID0gY2hpbGQucGFyZW50Tm9kZTtcbiAgICAgICAgd2hpbGUgKG5vZGUgIT0gbnVsbCkge1xuICAgICAgICAgICAgaWYgKG5vZGUgPT0gcGFyZW50KSB7XG4gICAgICAgICAgICAgICAgcmV0dXJuIHRydWU7XG4gICAgICAgICAgICB9XG4gICAgICAgICAgICBub2RlID0gbm9kZS5wYXJlbnROb2RlO1xuICAgICAgICB9XG4gICAgICAgIHJldHVybiBmYWxzZTtcbiAgICB9O1xuZnVuY3Rpb24gY29tcGFyZVZpc2liaWxpdHkoYSwgYikge1xuICAgIHZhciB2YSA9IGEgJiYgYS5zdHlsZSAmJiBnZXRTdHlsZShhLCAnZGlzcGxheScpICE9PSAnbm9uZSc7XG4gICAgdmFyIHZiID0gYiAmJiBiLnN0eWxlICYmIGdldFN0eWxlKGIsICdkaXNwbGF5JykgIT09ICdub25lJztcbiAgICBpZiAodmEgJiYgIXZiKSB7XG4gICAgICAgIHJldHVybiAtMTtcbiAgICB9IGVsc2UgaWYgKHZiICYmICF2YSkge1xuICAgICAgICByZXR1cm4gMTtcbiAgICB9XG4gICAgcmV0dXJuIDA7XG59XG5mdW5jdGlvbiBjb21wYXJlUG9zaXRpb25TdGFjayhhLCBiKSB7XG4gICAgdmFyIHBhID0gZ2V0U3R5bGUoYSwgJ3Bvc2l0aW9uJyk7XG4gICAgdmFyIHBiID0gZ2V0U3R5bGUoYiwgJ3Bvc2l0aW9uJyk7XG4gICAgaWYgKHphID4gemIpIHtcbiAgICAgICAgcmV0dXJuIC0xO1xuICAgIH0gZWxzZSBpZiAoemIgPiB6YSkge1xuICAgICAgICByZXR1cm4gMTtcbiAgICB9XG4gICAgcmV0dXJuIDA7XG59XG5mdW5jdGlvbiBjb21wYXJlWkluZGV4KGEsIGIpIHtcbiAgICB2YXIgemEgPSBnZXRaSW5kZXgoYSk7XG4gICAgdmFyIHpiID0gZ2V0WkluZGV4KGIpO1xuICAgIGlmICh6YSA+IHpiKSB7XG4gICAgICAgIHJldHVybiAtMTtcbiAgICB9IGVsc2UgaWYgKHpiID4gemEpIHtcbiAgICAgICAgcmV0dXJuIDE7XG4gICAgfVxuICAgIHJldHVybiAwO1xufVxuZnVuY3Rpb24gY29tcGFyZVBvc2l0aW9uKGEsIGIpIHtcbiAgICByZXR1cm4gYS5jb21wYXJlRG9jdW1lbnRQb3NpdGlvbiA/IGEuY29tcGFyZURvY3VtZW50UG9zaXRpb24oYikgOiBhLmNvbnRhaW5zID8gKGEgIT0gYiAmJiBhLmNvbnRhaW5zKGIpICYmIDE2KSArIChhICE9IGIgJiYgYi5jb250YWlucyhhKSAmJiA4KSArIChhLnNvdXJjZUluZGV4ID49IDAgJiYgYi5zb3VyY2VJbmRleCA+PSAwID8gKGEuc291cmNlSW5kZXggPCBiLnNvdXJjZUluZGV4ICYmIDQpICsgKGEuc291cmNlSW5kZXggPiBiLnNvdXJjZUluZGV4ICYmIDIpIDogMSkgKyAwIDogMDtcbn1cbm1vZHVsZS5leHBvcnRzID0gZnVuY3Rpb24gKGEsIGIpIHtcbiAgICB2YXIgdmlzaWJpbGl0eSA9IGNvbXBhcmVWaXNpYmlsaXR5KGEsIGIpO1xuICAgIGlmICh2aXNpYmlsaXR5ICE9PSAwKSB7XG4gICAgICAgIHJldHVybiB2aXNpYmlsaXR5IDwgMCA/IGEgOiBiO1xuICAgIH1cbiAgICBpZiAoaXNDaGlsZE9mKGEsIGIpKSB7XG4gICAgICAgIHJldHVybiBiO1xuICAgIH1cbiAgICB2YXIgekluZGV4Q29tcGFyaXNvblJlc3VsdCA9IGNvbXBhcmVaSW5kZXgoYSwgYik7XG4gICAgaWYgKHpJbmRleENvbXBhcmlzb25SZXN1bHQgPT09IC0xKSB7XG4gICAgICAgIHJldHVybiBhO1xuICAgIH1cbiAgICBpZiAoekluZGV4Q29tcGFyaXNvblJlc3VsdCA9PT0gMSkge1xuICAgICAgICByZXR1cm4gYjtcbiAgICB9XG4gICAgdmFyIGRvY3VtZW50UG9zaXRpb25SZXN1bHQgPSBjb21wYXJlUG9zaXRpb24oYSwgYik7XG4gICAgaWYgKGRvY3VtZW50UG9zaXRpb25SZXN1bHQgPT09IDIpIHtcbiAgICAgICAgcmV0dXJuIGE7XG4gICAgfVxuICAgIGlmIChkb2N1bWVudFBvc2l0aW9uUmVzdWx0ID09PSA0KSB7XG4gICAgICAgIHJldHVybiBiO1xuICAgIH1cbiAgICByZXR1cm4gYTtcbn07Il19
