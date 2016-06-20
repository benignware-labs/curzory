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
                throw new Error('Cannot find module \'jquery\' from \'/Users/rafaelnowrotek/Documents/Projekte/DWSActive/Workspace/curzory/src\'');
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
    function getParents(element, selector) {
        var parents = [];
        var parent = element;
        while (parent = parent.parentElement && parent.parentElement.closest(selector)) {
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
        container = symbol.offsetParent || element;
        var rect = getBoundingRect(container);
        var containerPos = getOffset(container) || {
                x: 0,
                y: 0
            };
        if (typeof bounds === 'function') {
            bounds = bounds(container);
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
//# sourceMappingURL=data:application/json;charset:utf-8;base64,eyJ2ZXJzaW9uIjozLCJzb3VyY2VzIjpbIm5vZGVfbW9kdWxlcy9ncnVudC1icm93c2VyaWZ5L25vZGVfbW9kdWxlcy9icm93c2VyaWZ5L25vZGVfbW9kdWxlcy9icm93c2VyLXBhY2svX3ByZWx1ZGUuanMiLCJzcmMvY3Vyem9yeS5qcyIsInNyYy9qcXVlcnkuY3Vyem9yeS5qcyIsInNyYy9saWIvQ3Vyc29yLmpzIiwic3JjL2xpYi9DdXJzb3JNYW5hZ2VyLmpzIiwic3JjL2xpYi9tZXJnZS5qcyIsInNyYy9saWIvdG9wbW9zdC5qcyJdLCJuYW1lcyI6W10sIm1hcHBpbmdzIjoiQUFBQTtBQ0FBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBOztBQ05BO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBOztBQ3hCQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7O0FDL0ZBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7O0FDbldBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7O0FDVkE7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBIiwiZmlsZSI6ImdlbmVyYXRlZC5qcyIsInNvdXJjZVJvb3QiOiIiLCJzb3VyY2VzQ29udGVudCI6WyIoZnVuY3Rpb24gZSh0LG4scil7ZnVuY3Rpb24gcyhvLHUpe2lmKCFuW29dKXtpZighdFtvXSl7dmFyIGE9dHlwZW9mIHJlcXVpcmU9PVwiZnVuY3Rpb25cIiYmcmVxdWlyZTtpZighdSYmYSlyZXR1cm4gYShvLCEwKTtpZihpKXJldHVybiBpKG8sITApO3ZhciBmPW5ldyBFcnJvcihcIkNhbm5vdCBmaW5kIG1vZHVsZSAnXCIrbytcIidcIik7dGhyb3cgZi5jb2RlPVwiTU9EVUxFX05PVF9GT1VORFwiLGZ9dmFyIGw9bltvXT17ZXhwb3J0czp7fX07dFtvXVswXS5jYWxsKGwuZXhwb3J0cyxmdW5jdGlvbihlKXt2YXIgbj10W29dWzFdW2VdO3JldHVybiBzKG4/bjplKX0sbCxsLmV4cG9ydHMsZSx0LG4scil9cmV0dXJuIG5bb10uZXhwb3J0c312YXIgaT10eXBlb2YgcmVxdWlyZT09XCJmdW5jdGlvblwiJiZyZXF1aXJlO2Zvcih2YXIgbz0wO288ci5sZW5ndGg7bysrKXMocltvXSk7cmV0dXJuIHN9KSIsInZhciBDdXJzb3JNYW5hZ2VyID0gcmVxdWlyZSgnLi9saWIvQ3Vyc29yTWFuYWdlcicpLCBDdXJzb3IgPSByZXF1aXJlKCcuL2xpYi9DdXJzb3InKTtcbmN1cnNvck1hbmFnZXIgPSBuZXcgQ3Vyc29yTWFuYWdlcigpO1xubW9kdWxlLmV4cG9ydHMgPSBmdW5jdGlvbiBjdXJ6b3J5KGVsZW1lbnQsIG9wdGlvbnMpIHtcbiAgICB2YXIgY3Vyc29yID0gbmV3IEN1cnNvcihlbGVtZW50LCBvcHRpb25zKTtcbiAgICBjdXJzb3JNYW5hZ2VyLmFkZChjdXJzb3IpO1xuICAgIHJldHVybiBjdXJzb3I7XG59OyIsInZhciBjdXJ6b3J5ID0gcmVxdWlyZSgnLi9jdXJ6b3J5JyksICQgPSBmdW5jdGlvbiAoKSB7XG4gICAgICAgIHRyeSB7XG4gICAgICAgICAgICByZXR1cm4gZnVuY3Rpb24gKCkge1xuICAgICAgICAgICAgICAgIHRocm93IG5ldyBFcnJvcignQ2Fubm90IGZpbmQgbW9kdWxlIFxcJ2pxdWVyeVxcJyBmcm9tIFxcJy9Vc2Vycy9yYWZhZWxub3dyb3Rlay9Eb2N1bWVudHMvUHJvamVrdGUvRFdTQWN0aXZlL1dvcmtzcGFjZS9jdXJ6b3J5L3NyY1xcJycpO1xuICAgICAgICAgICAgfSgpO1xuICAgICAgICB9IGNhdGNoIChlKSB7XG4gICAgICAgICAgICByZXR1cm4gJCB8fCBqUXVlcnk7XG4gICAgICAgIH1cbiAgICB9KCk7XG5pZiAoJCkge1xuICAgICQuZm4uZXh0ZW5kKHtcbiAgICAgICAgY3Vyem9yeTogZnVuY3Rpb24gKG9wdGlvbnMpIHtcbiAgICAgICAgICAgIHJldHVybiB0aGlzLmVhY2goZnVuY3Rpb24gKCkge1xuICAgICAgICAgICAgICAgIHZhciBjdXJzb3IgPSAkKHRoaXMpLmRhdGEoJ2N1cnpvcnknKTtcbiAgICAgICAgICAgICAgICBpZiAoIWN1cnNvcikge1xuICAgICAgICAgICAgICAgICAgICBjdXJzb3IgPSBjdXJ6b3J5KHRoaXMsIG9wdGlvbnMpO1xuICAgICAgICAgICAgICAgICAgICAkKHRoaXMpLmRhdGEoJ2N1cnpvcnknLCBjdXJzb3IpO1xuICAgICAgICAgICAgICAgIH0gZWxzZSB7XG4gICAgICAgICAgICAgICAgICAgIGN1cnNvci5zZXQob3B0aW9ucyk7XG4gICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICAgIHJldHVybiAkKHRoaXMpO1xuICAgICAgICAgICAgfSk7XG4gICAgICAgIH1cbiAgICB9KTtcbn0iLCJ2YXIgbWVyZ2UgPSByZXF1aXJlKCcuL21lcmdlJyksIGNyZWF0ZUVsZW1lbnQgPSBmdW5jdGlvbiAoc3RyaW5nKSB7XG4gICAgICAgIHZhciBlbGVtZW50ID0gZG9jdW1lbnQuY3JlYXRlRWxlbWVudCgnZGl2Jyk7XG4gICAgICAgIGVsZW1lbnQuaW5uZXJIVE1MID0gc3RyaW5nO1xuICAgICAgICB2YXIgcmVzdWx0ID0gZWxlbWVudC5maXJzdENoaWxkO1xuICAgICAgICBlbGVtZW50LnJlbW92ZUNoaWxkKHJlc3VsdCk7XG4gICAgICAgIHJldHVybiByZXN1bHQ7XG4gICAgfSwgaXNIVE1MID0gZnVuY3Rpb24gKHN0cmluZykge1xuICAgICAgICByZXR1cm4gdHlwZW9mIHN0cmluZyA9PT0gJ3N0cmluZycgJiYgc3RyaW5nLm1hdGNoKC88XFwvP1xcdysoKFxccytcXHcrKFxccyo9XFxzKig/OlwiLio/XCJ8Jy4qPyd8W14nXCI+XFxzXSspKT8pK1xccyp8XFxzKilcXC8/Pi8pO1xuICAgIH0sIGdldEVsZW1lbnQgPSBmdW5jdGlvbiAodmFsdWUsIHBhcmVudCkge1xuICAgICAgICB2YWx1ZSA9IHZhbHVlLnRvQXJyYXkgPyB2YWx1ZS50b0FycmF5KClbMF0gOiB2YWx1ZSBpbnN0YW5jZW9mIEFycmF5ID8gdmFsdWVbMF0gOiB2YWx1ZTtcbiAgICAgICAgaWYgKHR5cGVvZiB2YWx1ZSA9PT0gJ2Z1bmN0aW9uJykge1xuICAgICAgICAgICAgdmFsdWUgPSB2YWx1ZS5jYWxsKHRoaXMsIHZhbHVlKTtcbiAgICAgICAgfVxuICAgICAgICBpZiAodHlwZW9mIHZhbHVlID09PSAnc3RyaW5nJykge1xuICAgICAgICAgICAgaWYgKGlzSFRNTCh2YWx1ZSkpIHtcbiAgICAgICAgICAgICAgICB2YWx1ZSA9IGNyZWF0ZUVsZW1lbnQodmFsdWUpO1xuICAgICAgICAgICAgfSBlbHNlIHtcbiAgICAgICAgICAgICAgICB2YWx1ZSA9IHBhcmVudC5xdWVyeVNlbGVjdG9yKHZhbHVlKTtcbiAgICAgICAgICAgIH1cbiAgICAgICAgfVxuICAgICAgICBpZiAodmFsdWUgJiYgdmFsdWUubm9kZU5hbWUpIHtcbiAgICAgICAgICAgIHJldHVybiB2YWx1ZTtcbiAgICAgICAgfVxuICAgICAgICByZXR1cm4gbnVsbDtcbiAgICB9O1xubW9kdWxlLmV4cG9ydHMgPSBmdW5jdGlvbiBDdXJzb3IoZWxlbWVudCwgb3B0aW9ucykge1xuICAgIGZ1bmN0aW9uIHNldChuYW1lLCB2YWx1ZSkge1xuICAgICAgICB2YXIgb3B0cztcbiAgICAgICAgaWYgKHR5cGVvZiBuYW1lID09PSAnb2JqZWN0Jykge1xuICAgICAgICAgICAgb3B0cyA9IG5hbWU7XG4gICAgICAgIH0gZWxzZSB7XG4gICAgICAgICAgICBvcHRzID0ge307XG4gICAgICAgICAgICBvcHRzW25hbWVdID0gdmFsdWU7XG4gICAgICAgIH1cbiAgICAgICAgZm9yIChuYW1lIGluIG9wdHMpIHtcbiAgICAgICAgICAgIHZhbHVlID0gb3B0c1tuYW1lXTtcbiAgICAgICAgICAgIHN3aXRjaCAobmFtZSkge1xuICAgICAgICAgICAgY2FzZSAnZWxlbWVudCc6XG4gICAgICAgICAgICBjYXNlICdzeW1ib2wnOlxuICAgICAgICAgICAgICAgIGlmIChpc0hUTUwodmFsdWUpKSB7XG4gICAgICAgICAgICAgICAgICAgIHZhbHVlID0gY3JlYXRlRWxlbWVudCh2YWx1ZSk7XG4gICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICAgIGJyZWFrO1xuICAgICAgICAgICAgfVxuICAgICAgICAgICAgb3B0c1tuYW1lXSA9IHZhbHVlO1xuICAgICAgICB9XG4gICAgICAgIG9wdGlvbnMgPSBtZXJnZShvcHRpb25zLCBvcHRzKTtcbiAgICB9XG4gICAgO1xuICAgIHRoaXMuc2V0ID0gZnVuY3Rpb24gKCkge1xuICAgICAgICBzZXQuY2FsbCh0aGlzLCBhcmd1bWVudHMpO1xuICAgICAgICBjdXJzb3JNYW5hZ2VyLnVwZGF0ZSgpO1xuICAgIH07XG4gICAgdGhpcy5nZXQgPSBmdW5jdGlvbiAobmFtZSkge1xuICAgICAgICB2YXIgdmFsdWU7XG4gICAgICAgIGlmICghbmFtZSkge1xuICAgICAgICAgICAgdmFsdWUgPSB7fTtcbiAgICAgICAgICAgIGZvciAodmFyIHggaW4gb3B0aW9ucykge1xuICAgICAgICAgICAgICAgIHZhbHVlW3hdID0gdGhpcy5nZXQoeCk7XG4gICAgICAgICAgICB9XG4gICAgICAgIH0gZWxzZSB7XG4gICAgICAgICAgICB2YWx1ZSA9IG9wdGlvbnNbbmFtZV07XG4gICAgICAgICAgICBzd2l0Y2ggKG5hbWUpIHtcbiAgICAgICAgICAgIGNhc2UgJ2VsZW1lbnQnOlxuICAgICAgICAgICAgY2FzZSAnc3ltYm9sJzpcbiAgICAgICAgICAgIGNhc2UgJ2JvdW5kcyc6XG4gICAgICAgICAgICBjYXNlICd0YXJnZXQnOlxuICAgICAgICAgICAgICAgIHZhbHVlID0gdmFsdWUgJiYgdmFsdWUudG9BcnJheSA/IHZhbHVlLnRvQXJyYXkoKVswXSA6IHZhbHVlIGluc3RhbmNlb2YgQXJyYXkgPyB2YWx1ZVswXSA6IHZhbHVlO1xuICAgICAgICAgICAgICAgIHZhbHVlID0gdHlwZW9mIHZhbHVlID09PSAnc3RyaW5nJyA/IChlbGVtZW50IHx8IGRvY3VtZW50KS5xdWVyeVNlbGVjdG9yKHZhbHVlKSA6IHZhbHVlO1xuICAgICAgICAgICAgICAgIGJyZWFrO1xuICAgICAgICAgICAgfVxuICAgICAgICAgICAgc3dpdGNoIChuYW1lKSB7XG4gICAgICAgICAgICBjYXNlICdzeW1ib2wnOlxuICAgICAgICAgICAgICAgIHZhbHVlID0gdmFsdWUgfHwgdGhpcy5nZXQoJ2VsZW1lbnQnKTtcbiAgICAgICAgICAgICAgICBicmVhaztcbiAgICAgICAgICAgIGNhc2UgJ2JvdW5kcyc6XG4gICAgICAgICAgICAgICAgdmFsdWUgPSB2YWx1ZSA/IHZhbHVlIDogb3B0aW9uc1snc3ltYm9sJ10gPyB0aGlzLmdldCgnZWxlbWVudCcpIDogdGhpcy5nZXQoJ2VsZW1lbnQnKS5vZmZzZXRQYXJlbnQ7XG4gICAgICAgICAgICAgICAgYnJlYWs7XG4gICAgICAgICAgICB9XG4gICAgICAgIH1cbiAgICAgICAgcmV0dXJuIHZhbHVlO1xuICAgIH07XG4gICAgc2V0KG1lcmdlKHtcbiAgICAgICAgZWxlbWVudDogbnVsbCxcbiAgICAgICAgb2Zmc2V0OiB7XG4gICAgICAgICAgICBsZWZ0OiA4LFxuICAgICAgICAgICAgdG9wOiA2XG4gICAgICAgIH0sXG4gICAgICAgIHN0eWxlOiAndHJhbnNmb3JtJyxcbiAgICAgICAgc2NhbGU6IDEsXG4gICAgICAgIGJvdW5kczogbnVsbCxcbiAgICAgICAgc3ltYm9sOiBudWxsLFxuICAgICAgICB0YXJnZXQ6IG51bGwsXG4gICAgICAgIGhpZGVPbkZvY3VzOiBmYWxzZVxuICAgIH0sIG9wdGlvbnMsIHsgZWxlbWVudDogZWxlbWVudCB9KSk7XG59OyIsInZhciBtZXJnZSA9IHJlcXVpcmUoJy4vbWVyZ2UnKSwgdG9wbW9zdCA9IHJlcXVpcmUoJy4vdG9wbW9zdCcpLCBoeXBoZW5hdGUgPSBmdW5jdGlvbiAoKSB7XG4gICAgICAgIHZhciBjYWNoZSA9IHt9O1xuICAgICAgICByZXR1cm4gZnVuY3Rpb24gKHN0cmluZykge1xuICAgICAgICAgICAgcmV0dXJuIGNhY2hlW3N0cmluZ10gPSBjYWNoZVtzdHJpbmddIHx8IGZ1bmN0aW9uICgpIHtcbiAgICAgICAgICAgICAgICByZXR1cm4gc3RyaW5nLnJlcGxhY2UoLyhbQS1aXSkvZywgZnVuY3Rpb24gKCQxKSB7XG4gICAgICAgICAgICAgICAgICAgIHJldHVybiAnLScgKyAkMS50b0xvd2VyQ2FzZSgpO1xuICAgICAgICAgICAgICAgIH0pO1xuICAgICAgICAgICAgfSgpO1xuICAgICAgICB9O1xuICAgIH0oKSwgZ2V0U3R5bGUgPSBmdW5jdGlvbiAoZWwsIGNzc3Byb3ApIHtcbiAgICAgICAgaWYgKGVsLmN1cnJlbnRTdHlsZSlcbiAgICAgICAgICAgIHJldHVybiBlbC5jdXJyZW50U3R5bGVbY3NzcHJvcF07XG4gICAgICAgIGVsc2UgaWYgKGRvY3VtZW50LmRlZmF1bHRWaWV3ICYmIGRvY3VtZW50LmRlZmF1bHRWaWV3LmdldENvbXB1dGVkU3R5bGUpXG4gICAgICAgICAgICByZXR1cm4gZG9jdW1lbnQuZGVmYXVsdFZpZXcuZ2V0Q29tcHV0ZWRTdHlsZShlbCwgJycpW2Nzc3Byb3BdO1xuICAgICAgICBlbHNlXG4gICAgICAgICAgICByZXR1cm4gZWwuc3R5bGVbY3NzcHJvcF07XG4gICAgfSwgdHJhbnNmb3JtU3R5bGUgPSBmdW5jdGlvbiAocHJvcCwgcHJlZml4ZXMpIHtcbiAgICAgICAgdmFyIGksIGVsZW0gPSBkb2N1bWVudC5jcmVhdGVFbGVtZW50KCdkaXYnKSwgY2FwaXRhbGl6ZWQgPSBwcm9wLmNoYXJBdCgwKS50b1VwcGVyQ2FzZSgpICsgcHJvcC5zbGljZSgxKTtcbiAgICAgICAgZm9yIChpID0gMDsgaSA8IHByZWZpeGVzLmxlbmd0aDsgaSsrKSB7XG4gICAgICAgICAgICBpZiAodHlwZW9mIGVsZW0uc3R5bGVbcHJlZml4ZXNbaV0gKyBjYXBpdGFsaXplZF0gIT09ICd1bmRlZmluZWQnKSB7XG4gICAgICAgICAgICAgICAgcmV0dXJuIHByZWZpeGVzW2ldICsgY2FwaXRhbGl6ZWQ7XG4gICAgICAgICAgICB9XG4gICAgICAgIH1cbiAgICAgICAgcmV0dXJuIG51bGw7XG4gICAgfSgndHJhbnNmb3JtJywgW1xuICAgICAgICAnJyxcbiAgICAgICAgJ01veicsXG4gICAgICAgICdXZWJraXQnLFxuICAgICAgICAnTycsXG4gICAgICAgICdNcydcbiAgICBdKSwgaXNDaGlsZE9mID0gZnVuY3Rpb24gKHBhcmVudCwgY2hpbGQpIHtcbiAgICAgICAgaWYgKCFjaGlsZCB8fCAhcGFyZW50KSB7XG4gICAgICAgICAgICByZXR1cm4gZmFsc2U7XG4gICAgICAgIH1cbiAgICAgICAgdmFyIG5vZGUgPSBjaGlsZC5wYXJlbnROb2RlO1xuICAgICAgICB3aGlsZSAobm9kZSAhPSBudWxsKSB7XG4gICAgICAgICAgICBpZiAobm9kZSA9PSBwYXJlbnQpIHtcbiAgICAgICAgICAgICAgICByZXR1cm4gdHJ1ZTtcbiAgICAgICAgICAgIH1cbiAgICAgICAgICAgIG5vZGUgPSBub2RlLnBhcmVudE5vZGU7XG4gICAgICAgIH1cbiAgICAgICAgcmV0dXJuIGZhbHNlO1xuICAgIH0sIGNzcyA9IGZ1bmN0aW9uIChlbGVtLCBuYW1lLCB2YWx1ZSkge1xuICAgICAgICB2YXIgbWFwID0ge30sIGNzc1RleHQgPSBudWxsO1xuICAgICAgICBpZiAodHlwZW9mIG5hbWUgPT09ICdvYmplY3QnKSB7XG4gICAgICAgICAgICBtYXAgPSBuYW1lO1xuICAgICAgICB9IGVsc2UgaWYgKHR5cGVvZiB2YWx1ZSAhPT0gJ3VuZGVmaW5lZCcpIHtcbiAgICAgICAgICAgIG1hcFtuYW1lXSA9IHZhbHVlO1xuICAgICAgICB9XG4gICAgICAgIHZhciBrZXlzID0gT2JqZWN0LmtleXMobWFwKTtcbiAgICAgICAga2V5cyA9IGtleXMuZmlsdGVyKGZ1bmN0aW9uIChrZXksIGluZGV4KSB7XG4gICAgICAgICAgICBpZiAobWFwW2tleV0gPT09ICcnKSB7XG4gICAgICAgICAgICAgICAgZWxlbS5zdHlsZVtrZXldID0gbWFwW2tleV07XG4gICAgICAgICAgICAgICAgcmV0dXJuIGZhbHNlO1xuICAgICAgICAgICAgfVxuICAgICAgICAgICAgcmV0dXJuIHRydWU7XG4gICAgICAgIH0pO1xuICAgICAgICBjc3NUZXh0ID0ga2V5cy5tYXAoZnVuY3Rpb24gKG5hbWUpIHtcbiAgICAgICAgICAgIHJldHVybiBoeXBoZW5hdGUobmFtZSkgKyAnOiAnICsgbWFwW25hbWVdO1xuICAgICAgICB9KS5qb2luKCc7ICcpO1xuICAgICAgICBpZiAoY3NzVGV4dCAmJiBjc3NUZXh0Lmxlbmd0aCkge1xuICAgICAgICAgICAgZWxlbS5zdHlsZS5jc3NUZXh0ID0gZWxlbS5zdHlsZS5jc3NUZXh0ICsgY3NzVGV4dDtcbiAgICAgICAgICAgIHJldHVybiBudWxsO1xuICAgICAgICB9XG4gICAgICAgIHJldHVybiBlbGVtLnN0eWxlW25hbWVdIHx8IHdpbmRvdy5nZXRDb21wdXRlZFN0eWxlKGVsZW0sIG51bGwpLmdldFByb3BlcnR5VmFsdWUobmFtZSk7XG4gICAgfSwgZ2V0T2Zmc2V0ID0gZnVuY3Rpb24gKGVsZW1lbnQpIHtcbiAgICAgICAgdmFyIHNjcm9sbE9mZnNldCA9IGdldFNjcm9sbE9mZnNldCgpLCByZWN0ID0gZWxlbWVudC5nZXRCb3VuZGluZ0NsaWVudFJlY3QoKTtcbiAgICAgICAgcmV0dXJuIHtcbiAgICAgICAgICAgIHRvcDogcmVjdC50b3AgKyBzY3JvbGxPZmZzZXQudG9wLFxuICAgICAgICAgICAgbGVmdDogcmVjdC5sZWZ0ICsgc2Nyb2xsT2Zmc2V0LmxlZnRcbiAgICAgICAgfTtcbiAgICB9LCBnZXRTY3JvbGxPZmZzZXQgPSBmdW5jdGlvbiAoKSB7XG4gICAgICAgIHJldHVybiB7XG4gICAgICAgICAgICBsZWZ0OiBkb2N1bWVudC5ib2R5ICYmIGRvY3VtZW50LmJvZHkuc2Nyb2xsTGVmdCArIGRvY3VtZW50LmRvY3VtZW50RWxlbWVudC5zY3JvbGxMZWZ0LFxuICAgICAgICAgICAgdG9wOiBkb2N1bWVudC5ib2R5ICYmIGRvY3VtZW50LmJvZHkuc2Nyb2xsVG9wICsgZG9jdW1lbnQuZG9jdW1lbnRFbGVtZW50LnNjcm9sbFRvcFxuICAgICAgICB9O1xuICAgIH0sIGdldEJvdW5kaW5nUmVjdCA9IGZ1bmN0aW9uIChlbGVtZW50KSB7XG4gICAgICAgIGlmICghZWxlbWVudCkge1xuICAgICAgICAgICAgcmV0dXJuIHtcbiAgICAgICAgICAgICAgICB4OiAtSW5maW5pdHksXG4gICAgICAgICAgICAgICAgeTogLUluZmluaXR5LFxuICAgICAgICAgICAgICAgIHdpZHRoOiBJbmZpbml0eSxcbiAgICAgICAgICAgICAgICBoZWlnaHQ6IEluZmluaXR5XG4gICAgICAgICAgICB9O1xuICAgICAgICB9XG4gICAgICAgIHZhciBzY3JvbGxPZmZzZXQgPSBnZXRTY3JvbGxPZmZzZXQoKTtcbiAgICAgICAgdmFyIHJlY3QgPSBlbGVtZW50LmdldEJvdW5kaW5nQ2xpZW50UmVjdCgpO1xuICAgICAgICByZXR1cm4ge1xuICAgICAgICAgICAgeDogcmVjdC5sZWZ0ICsgc2Nyb2xsT2Zmc2V0LmxlZnQsXG4gICAgICAgICAgICB5OiByZWN0LnRvcCArIHNjcm9sbE9mZnNldC50b3AsXG4gICAgICAgICAgICB3aWR0aDogcmVjdC53aWR0aCxcbiAgICAgICAgICAgIGhlaWdodDogcmVjdC5oZWlnaHRcbiAgICAgICAgfTtcbiAgICB9LCBpbnN0YW5jZSA9IG51bGw7XG5mdW5jdGlvbiBDdXJzb3JNYW5hZ2VyKG9wdGlvbnMpIHtcbiAgICBpZiAoaW5zdGFuY2UpIHtcbiAgICAgICAgaW5zdGFuY2Uuc2V0KG9wdGlvbnMpO1xuICAgICAgICByZXR1cm4gaW5zdGFuY2U7XG4gICAgfVxuICAgIGluc3RhbmNlID0gdGhpcztcbiAgICB2YXIgY3Vyc29ycyA9IFtdO1xuICAgIHZhciBjbGllbnQgPSB7XG4gICAgICAgICAgICB4OiAwLFxuICAgICAgICAgICAgeTogMFxuICAgICAgICB9O1xuICAgIHZhciBtb3VzZSA9IHtcbiAgICAgICAgICAgIHg6IC1JbmZpbml0eSxcbiAgICAgICAgICAgIHk6IC1JbmZpbml0eSxcbiAgICAgICAgICAgIGVsZW1lbnQ6IG51bGxcbiAgICAgICAgfTtcbiAgICB2YXIgZXZlbnRzID0gW1xuICAgICAgICAgICAgJ21vdXNlZG93bicsXG4gICAgICAgICAgICAnY2xpY2snLFxuICAgICAgICAgICAgJ3Njcm9sbCcsXG4gICAgICAgICAgICAncmVzaXplJyxcbiAgICAgICAgICAgICdtb3VzZW1vdmUnLFxuICAgICAgICAgICAgJ21vdXNlb3V0J1xuICAgICAgICBdO1xuICAgIHZhciBjdXJzb3JJdGVtcyA9IFtdO1xuICAgIHZhciBjdXJzb3JJdGVtID0gbnVsbDtcbiAgICB2YXIgY2xpY2tpbmcgPSBmYWxzZTtcbiAgICB2YXIgY2xpY2thYmxlID0gdHJ1ZTtcbiAgICBmdW5jdGlvbiBpbml0KCkge1xuICAgICAgICBpZiAoISgnb250b3VjaCcgaW4gd2luZG93KSkge1xuICAgICAgICAgICAgYWRkTW91c2VMaXN0ZW5lcnMod2luZG93KTtcbiAgICAgICAgfVxuICAgIH1cbiAgICBmdW5jdGlvbiBoYW5kbGVFdmVudChlKSB7XG4gICAgICAgIHRyeSB7XG4gICAgICAgICAgICBlLnR5cGU7XG4gICAgICAgIH0gY2F0Y2ggKGUpIHtcbiAgICAgICAgICAgIGNvbnNvbGUud2FybihlKTtcbiAgICAgICAgICAgIHJldHVybjtcbiAgICAgICAgfVxuICAgICAgICBzd2l0Y2ggKGUudHlwZSkge1xuICAgICAgICBjYXNlICdtb3VzZWRvd24nOlxuICAgICAgICAgICAgY2xpY2tpbmcgPSBmYWxzZTtcbiAgICAgICAgICAgIGJyZWFrO1xuICAgICAgICBjYXNlICdtb3VzZW91dCc6XG4gICAgICAgICAgICB2YXIgcmVsYXRlZFRhcmdldCA9IHR5cGVvZiBlLnRvRWxlbWVudCAhPSAndW5kZWZpbmVkJyA/IGUudG9FbGVtZW50IDogZS5yZWxhdGVkVGFyZ2V0O1xuICAgICAgICAgICAgaWYgKHJlbGF0ZWRUYXJnZXQgPT09IG51bGwpIHtcbiAgICAgICAgICAgICAgICBtb3VzZS54ID0gLUluZmluaXR5O1xuICAgICAgICAgICAgICAgIG1vdXNlLnkgPSAtSW5maW5pdHk7XG4gICAgICAgICAgICAgICAgbW91c2UuZWxlbWVudCA9IG51bGw7XG4gICAgICAgICAgICB9XG4gICAgICAgICAgICBicmVhaztcbiAgICAgICAgY2FzZSAnbW91c2Vtb3ZlJzpcbiAgICAgICAgICAgIGNsaWVudC54ID0gZS5jbGllbnRYO1xuICAgICAgICAgICAgY2xpZW50LnkgPSBlLmNsaWVudFk7XG4gICAgICAgIGRlZmF1bHQ6XG4gICAgICAgICAgICB2YXIgc2Nyb2xsT2Zmc2V0ID0gZ2V0U2Nyb2xsT2Zmc2V0KCk7XG4gICAgICAgICAgICBtb3VzZS54ID0gY2xpZW50LnggKyBzY3JvbGxPZmZzZXQubGVmdDtcbiAgICAgICAgICAgIG1vdXNlLnkgPSBjbGllbnQueSArIHNjcm9sbE9mZnNldC50b3A7XG4gICAgICAgICAgICBtb3VzZS5lbGVtZW50ID0gZS50YXJnZXQ7XG4gICAgICAgIH1cbiAgICAgICAgaW52YWxpZGF0ZS5jYWxsKHRoaXMpO1xuICAgICAgICBzd2l0Y2ggKGUudHlwZSkge1xuICAgICAgICBjYXNlICdjbGljayc6XG4gICAgICAgICAgICBpZiAoIWNsaWNraW5nICYmIGN1cnNvckl0ZW0pIHtcbiAgICAgICAgICAgICAgICBjbGlja2luZyA9IHRydWU7XG4gICAgICAgICAgICAgICAgaWYgKG1vdXNlLmVsZW1lbnQgJiYgY3Vyc29ySXRlbSAmJiBjdXJzb3JJdGVtLnRhcmdldCAmJiBjdXJzb3JJdGVtLnN5bWJvbCAhPT0gbW91c2UuZWxlbWVudCAmJiBpc0NoaWxkT2YoY3Vyc29ySXRlbS5jb250YWluZXIsIG1vdXNlLmVsZW1lbnQpKSB7XG4gICAgICAgICAgICAgICAgICAgIGN1cnNvckl0ZW0udGFyZ2V0LmNsaWNrKCk7XG4gICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICAgIHZhciBjbGljayA9IGN1cnNvckl0ZW0gJiYgY3Vyc29ySXRlbS5jbGljaztcbiAgICAgICAgICAgICAgICBpZiAodHlwZW9mIGNsaWNrID09PSAnZnVuY3Rpb24nKSB7XG4gICAgICAgICAgICAgICAgICAgIGNsaWNrLmNhbGwoY3Vyc29ySXRlbS5lbGVtZW50LCBlKTtcbiAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICB9XG4gICAgICAgICAgICBicmVhaztcbiAgICAgICAgfVxuICAgICAgICByZW5kZXIuY2FsbChpbnN0YW5jZSk7XG4gICAgfVxuICAgIGZ1bmN0aW9uIGdldFBhcmVudHMoZWxlbWVudCwgc2VsZWN0b3IpIHtcbiAgICAgICAgdmFyIHBhcmVudHMgPSBbXTtcbiAgICAgICAgdmFyIHBhcmVudCA9IGVsZW1lbnQ7XG4gICAgICAgIHdoaWxlIChwYXJlbnQgPSBwYXJlbnQucGFyZW50RWxlbWVudCAmJiBwYXJlbnQucGFyZW50RWxlbWVudC5jbG9zZXN0KHNlbGVjdG9yKSkge1xuICAgICAgICAgICAgcGFyZW50cy5wdXNoKHBhcmVudCk7XG4gICAgICAgIH1cbiAgICAgICAgcmV0dXJuIHBhcmVudHM7XG4gICAgfVxuICAgIGZ1bmN0aW9uIGludmFsaWRhdGUoKSB7XG4gICAgICAgIGN1cnNvckl0ZW1zID0gY3Vyc29ycy5tYXAoZnVuY3Rpb24gKGN1cnNvciwgaW5kZXgpIHtcbiAgICAgICAgICAgIHJldHVybiBnZXRDdXJzb3JJdGVtKGN1cnNvciwgY3Vyc29ySXRlbXNbaW5kZXhdKTtcbiAgICAgICAgfSk7XG4gICAgICAgIHZhciBmaWx0ZXJlZCA9IGN1cnNvckl0ZW1zLmZpbHRlcihmdW5jdGlvbiAoY3Vyc29ySXRlbSwgaW5kZXgpIHtcbiAgICAgICAgICAgICAgICB2YXIgbW91c2VFbGVtZW50ID0gbW91c2UuZWxlbWVudCwgc3ltYm9sID0gY3Vyc29ySXRlbS5zeW1ib2wsIGJvdW5kcyA9IGN1cnNvckl0ZW0uYm91bmRzLCBjb250YWluZXIgPSBjdXJzb3JJdGVtLmNvbnRhaW5lciwgcmVzdWx0ID0gZmFsc2U7XG4gICAgICAgICAgICAgICAgaWYgKG1vdXNlRWxlbWVudCkge1xuICAgICAgICAgICAgICAgICAgICBpZiAoIW1vdXNlRWxlbWVudC5ocmVmICYmICFnZXRQYXJlbnRzKG1vdXNlRWxlbWVudCwgJ2EnKS5sZW5ndGgpIHtcbiAgICAgICAgICAgICAgICAgICAgICAgIGlmICh0b3Btb3N0KG1vdXNlRWxlbWVudCwgc3ltYm9sKSA9PT0gc3ltYm9sKSB7XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgaWYgKGNvbnRhaW5lciA9PT0gbW91c2VFbGVtZW50IHx8IGlzQ2hpbGRPZihjb250YWluZXIsIG1vdXNlRWxlbWVudCkpIHtcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgcmVzdWx0ID0gbW91c2UueCA+PSBib3VuZHMueCAmJiBtb3VzZS54IDw9IGJvdW5kcy54ICsgYm91bmRzLndpZHRoICYmIG1vdXNlLnkgPj0gYm91bmRzLnkgJiYgbW91c2UueSA8PSBib3VuZHMueSArIGJvdW5kcy5oZWlnaHQ7XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICAgIHJldHVybiByZXN1bHQ7XG4gICAgICAgICAgICB9KSwgc29ydGVkID0gZmlsdGVyZWQuc29ydChmdW5jdGlvbiAoYSwgYikge1xuICAgICAgICAgICAgICAgIHZhciB6RWxlbWVudCA9IHRvcG1vc3QoYS5zeW1ib2wsIGIuc3ltYm9sKTtcbiAgICAgICAgICAgICAgICBpZiAoekVsZW1lbnQgPT09IGEuc3ltYm9sKSB7XG4gICAgICAgICAgICAgICAgICAgIHJldHVybiAtMTtcbiAgICAgICAgICAgICAgICB9IGVsc2UgaWYgKHpFbGVtZW50ID09PSBiLnN5bWJvbCkge1xuICAgICAgICAgICAgICAgICAgICByZXR1cm4gMTtcbiAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgICAgdmFyIHAxID0ge1xuICAgICAgICAgICAgICAgICAgICAgICAgeDogYS54ICsgYS53aWR0aCAvIDIsXG4gICAgICAgICAgICAgICAgICAgICAgICB5OiBhLnkgKyBhLmhlaWdodCAvIDJcbiAgICAgICAgICAgICAgICAgICAgfTtcbiAgICAgICAgICAgICAgICB2YXIgcDIgPSB7XG4gICAgICAgICAgICAgICAgICAgICAgICB4OiBiLnggKyBiLndpZHRoIC8gMixcbiAgICAgICAgICAgICAgICAgICAgICAgIHk6IGIueSArIGIuaGVpZ2h0IC8gMlxuICAgICAgICAgICAgICAgICAgICB9O1xuICAgICAgICAgICAgICAgIHZhciBkMSA9IE1hdGguc3FydChNYXRoLnBvdyhwMS54IC0gbW91c2UueCwgMikgKyBNYXRoLnBvdyhwMS55IC0gbW91c2UueSwgMikpO1xuICAgICAgICAgICAgICAgIHZhciBkMiA9IE1hdGguc3FydChNYXRoLnBvdyhwMi54IC0gbW91c2UueCwgMikgKyBNYXRoLnBvdyhwMi55IC0gbW91c2UueSwgMikpO1xuICAgICAgICAgICAgICAgIHJldHVybiBkMSA8IGQyID8gZDEgOiBkMSA+IGQyID8gZDIgOiAwO1xuICAgICAgICAgICAgfSkucmV2ZXJzZSgpO1xuICAgICAgICBjdXJzb3JJdGVtID0gc29ydGVkWzBdO1xuICAgICAgICBzZXRNb3VzZVByb3ZpZGVycyhbd2luZG93XS5jb25jYXQoY3Vyc29ySXRlbXMubWFwKGZ1bmN0aW9uIChpdGVtKSB7XG4gICAgICAgICAgICByZXR1cm4gaXRlbS5jb250YWluZXI7XG4gICAgICAgIH0pKSk7XG4gICAgfVxuICAgIGZ1bmN0aW9uIHJlbmRlcigpIHtcbiAgICAgICAgY3Vyc29ySXRlbXMuZm9yRWFjaChmdW5jdGlvbiAoaXRlbSkge1xuICAgICAgICAgICAgdmFyIHN5bWJvbCA9IGl0ZW0uc3ltYm9sLCBzdHlsZSA9IHtcbiAgICAgICAgICAgICAgICAgICAgdmlzaWJpbGl0eTogaXRlbSA9PT0gY3Vyc29ySXRlbSA/ICcnIDogJ2hpZGRlbicsXG4gICAgICAgICAgICAgICAgICAgIHBvc2l0aW9uOiAnYWJzb2x1dGUnLFxuICAgICAgICAgICAgICAgICAgICBjdXJzb3I6ICdpbmhlcml0J1xuICAgICAgICAgICAgICAgIH07XG4gICAgICAgICAgICBpZiAoaXRlbS5zdHlsZSA9PT0gJ3RyYW5zZm9ybScgJiYgdHJhbnNmb3JtU3R5bGUpIHtcbiAgICAgICAgICAgICAgICBzdHlsZVt0cmFuc2Zvcm1TdHlsZSArICdPcmlnaW4nXSA9ICcnO1xuICAgICAgICAgICAgICAgIHN0eWxlW3RyYW5zZm9ybVN0eWxlXSA9ICcnO1xuICAgICAgICAgICAgfSBlbHNlIHtcbiAgICAgICAgICAgICAgICBzdHlsZS5sZWZ0ID0gJyc7XG4gICAgICAgICAgICAgICAgc3R5bGUudG9wID0gJyc7XG4gICAgICAgICAgICB9XG4gICAgICAgICAgICBzeW1ib2wuY2xhc3NMaXN0ICYmICFzeW1ib2wuY2xhc3NMaXN0LmNvbnRhaW5zKCdjdXJzb3InKSAmJiBzeW1ib2wuY2xhc3NMaXN0LmFkZCgnY3Vyc29yJyk7XG4gICAgICAgICAgICBjc3Moc3ltYm9sLCBzdHlsZSk7XG4gICAgICAgICAgICBpZiAoY3Vyc29ySXRlbSA9PT0gaXRlbSkge1xuICAgICAgICAgICAgICAgIHZhciBwb3MgPSBnZXRPZmZzZXQoc3ltYm9sKTtcbiAgICAgICAgICAgICAgICB2YXIgcHggPSBwb3MubGVmdDtcbiAgICAgICAgICAgICAgICB2YXIgcHkgPSBwb3MudG9wO1xuICAgICAgICAgICAgICAgIHZhciBvZmYgPSBpdGVtLm9mZnNldDtcbiAgICAgICAgICAgICAgICB2YXIgeCA9IE1hdGgucm91bmQobW91c2UueCAtIHB4ICsgb2ZmLmxlZnQpO1xuICAgICAgICAgICAgICAgIHZhciB5ID0gTWF0aC5yb3VuZChtb3VzZS55IC0gcHkgKyBvZmYudG9wKTtcbiAgICAgICAgICAgICAgICBzdHlsZSA9IHt9O1xuICAgICAgICAgICAgICAgIGlmIChpdGVtLnN0eWxlID09PSAndHJhbnNmb3JtJyAmJiB0cmFuc2Zvcm1TdHlsZSkge1xuICAgICAgICAgICAgICAgICAgICBzdHlsZVt0cmFuc2Zvcm1TdHlsZSArICdPcmlnaW4nXSA9ICcwIDAnO1xuICAgICAgICAgICAgICAgICAgICBzdHlsZVt0cmFuc2Zvcm1TdHlsZV0gPSAndHJhbnNsYXRlM2QoJyArIHggKyAncHgsJyArIHkgKyAncHgsIDApIHNjYWxlKCcgKyBpdGVtLnNjYWxlICsgJywnICsgaXRlbS5zY2FsZSArICcpJztcbiAgICAgICAgICAgICAgICB9IGVsc2Uge1xuICAgICAgICAgICAgICAgICAgICBzdHlsZS5sZWZ0ID0geCArIHBvcy5sZWZ0ICsgJ3B4JztcbiAgICAgICAgICAgICAgICAgICAgc3R5bGUudG9wID0geSArIHBvcy50b3AgKyAncHgnO1xuICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgICBjc3Moc3ltYm9sLCBzdHlsZSk7XG4gICAgICAgICAgICB9XG4gICAgICAgICAgICBpZiAoaXRlbSA9PT0gY3Vyc29ySXRlbSkge1xuICAgICAgICAgICAgICAgIHN5bWJvbC5jbGFzc0xpc3QgJiYgIXN5bWJvbC5jbGFzc0xpc3QuY29udGFpbnMoJ2N1cnNvci1hY3RpdmUnKSAmJiBzeW1ib2wuY2xhc3NMaXN0LmFkZCgnY3Vyc29yLWFjdGl2ZScpO1xuICAgICAgICAgICAgICAgIHN5bWJvbC5jbGFzc0xpc3QgJiYgc3ltYm9sLmNsYXNzTGlzdC5jb250YWlucygnY3Vyc29yLWhpZGRlbicpICYmIHN5bWJvbC5jbGFzc0xpc3QucmVtb3ZlKCdjdXJzb3ItaGlkZGVuJyk7XG4gICAgICAgICAgICB9IGVsc2Uge1xuICAgICAgICAgICAgICAgIHN5bWJvbC5jbGFzc0xpc3QgJiYgc3ltYm9sLmNsYXNzTGlzdC5jb250YWlucygnY3Vyc29yLWFjdGl2ZScpICYmIHN5bWJvbC5jbGFzc0xpc3QucmVtb3ZlKCdjdXJzb3ItYWN0aXZlJyk7XG4gICAgICAgICAgICAgICAgc3ltYm9sLmNsYXNzTGlzdCAmJiAhc3ltYm9sLmNsYXNzTGlzdC5jb250YWlucygnY3Vyc29yLWhpZGRlbicpICYmIHN5bWJvbC5jbGFzc0xpc3QuYWRkKCdjdXJzb3ItaGlkZGVuJyk7XG4gICAgICAgICAgICB9XG4gICAgICAgIH0pO1xuICAgIH1cbiAgICA7XG4gICAgdGhpcy51cGRhdGUgPSBmdW5jdGlvbiAoKSB7XG4gICAgICAgIGludmFsaWRhdGUuY2FsbCh0aGlzKTtcbiAgICAgICAgcmVuZGVyLmNhbGwodGhpcyk7XG4gICAgfTtcbiAgICB0aGlzLmFkZCA9IGZ1bmN0aW9uIChjdXJzb3IpIHtcbiAgICAgICAgaWYgKGN1cnNvcnMuaW5kZXhPZihjdXJzb3IpID09PSAtMSkge1xuICAgICAgICAgICAgY3Vyc29ycy5wdXNoKGN1cnNvcik7XG4gICAgICAgICAgICB0aGlzLnVwZGF0ZSgpO1xuICAgICAgICB9XG4gICAgfTtcbiAgICB0aGlzLnJlbW92ZSA9IGZ1bmN0aW9uIChjdXJzb3IpIHtcbiAgICAgICAgY3Vyc29ycy5zcGxpY2UoY3Vyc29ycy5pbmRleE9mKGN1cnNvciksIDEpO1xuICAgICAgICB0aGlzLnVwZGF0ZSgpO1xuICAgIH07XG4gICAgdmFyIG1vdXNlUHJvdmlkZXJzID0gW107XG4gICAgZnVuY3Rpb24gc2V0TW91c2VQcm92aWRlcnMoZWxlbWVudHMpIHtcbiAgICAgICAgZWxlbWVudHMgPSBlbGVtZW50cy5maWx0ZXIoZnVuY3Rpb24gKG4pIHtcbiAgICAgICAgICAgIHJldHVybiBuO1xuICAgICAgICB9KTtcbiAgICAgICAgbW91c2VQcm92aWRlcnMuZm9yRWFjaChmdW5jdGlvbiAoZWxlbWVudCkge1xuICAgICAgICAgICAgaWYgKGVsZW1lbnRzLmluZGV4T2YoZWxlbWVudCkgPT09IC0xKSB7XG4gICAgICAgICAgICAgICAgcmVtb3ZlTW91c2VMaXN0ZW5lcnMoZWxlbWVudCk7XG4gICAgICAgICAgICB9XG4gICAgICAgIH0pO1xuICAgICAgICBlbGVtZW50cy5mb3JFYWNoKGZ1bmN0aW9uIChlbGVtZW50KSB7XG4gICAgICAgICAgICBpZiAobW91c2VQcm92aWRlcnMuaW5kZXhPZihlbGVtZW50KSA9PT0gLTEpIHtcbiAgICAgICAgICAgICAgICBhZGRNb3VzZUxpc3RlbmVycyhlbGVtZW50KTtcbiAgICAgICAgICAgIH1cbiAgICAgICAgfSk7XG4gICAgICAgIG1vdXNlUHJvdmlkZXJzID0gZWxlbWVudHM7XG4gICAgfVxuICAgIGZ1bmN0aW9uIGFkZE1vdXNlTGlzdGVuZXJzKGVsZW1lbnQpIHtcbiAgICAgICAgZm9yICh2YXIgaSA9IDAsIGV2ZW50OyBldmVudCA9IGV2ZW50c1tpXTsgaSsrKSB7XG4gICAgICAgICAgICBlbGVtZW50LmFkZEV2ZW50TGlzdGVuZXIoZXZlbnQsIGhhbmRsZUV2ZW50KTtcbiAgICAgICAgfVxuICAgIH1cbiAgICBmdW5jdGlvbiByZW1vdmVNb3VzZUxpc3RlbmVycyhlbGVtZW50KSB7XG4gICAgICAgIGZvciAodmFyIGkgPSAwLCBldmVudDsgZXZlbnQgPSBldmVudHNbaV07IGkrKykge1xuICAgICAgICAgICAgZWxlbWVudC5yZW1vdmVFdmVudExpc3RlbmVyKGV2ZW50LCBoYW5kbGVFdmVudCk7XG4gICAgICAgIH1cbiAgICB9XG4gICAgaW5pdC5jYWxsKHRoaXMpO1xufVxuZnVuY3Rpb24gZ2V0Q3Vyc29ySXRlbShjdXJzb3IpIHtcbiAgICB2YXIgZWxlbWVudCA9IGN1cnNvci5nZXQoJ2VsZW1lbnQnKSwgcHJvcHMgPSBjdXJzb3IuZ2V0KCksIHN5bWJvbCA9IHByb3BzLnN5bWJvbCwgYm91bmRzID0gcHJvcHMuYm91bmRzLCBvZmZzZXQgPSBwcm9wcy5vZmZzZXQsIHN0eWxlID0gcHJvcHMuc3R5bGUsIHNjYWxlID0gcHJvcHMuc2NhbGUsIHRhcmdldCA9IHByb3BzLnRhcmdldCB8fCBzeW1ib2wubm9kZU5hbWUudG9Mb3dlckNhc2UoKSA9PT0gJ2EnID8gc3ltYm9sIDogZWxlbWVudCwgY29udGFpbmVyLCBkaXNwbGF5ID0gZWxlbWVudC5zdHlsZS5kaXNwbGF5O1xuICAgIGNzcyhlbGVtZW50LCB7IGRpc3BsYXk6ICcnIH0pO1xuICAgIHByb3BzID0gY3Vyc29yLmdldCgpO1xuICAgIHN5bWJvbCA9IHByb3BzLnN5bWJvbDtcbiAgICBib3VuZHMgPSBwcm9wcy5ib3VuZHM7XG4gICAgb2Zmc2V0ID0gcHJvcHMub2Zmc2V0O1xuICAgIHN0eWxlID0gcHJvcHMuc3R5bGU7XG4gICAgc2NhbGUgPSBwcm9wcy5zY2FsZTtcbiAgICB0YXJnZXQgPSBwcm9wcy50YXJnZXQgfHwgc3ltYm9sLm5vZGVOYW1lLnRvTG93ZXJDYXNlKCkgPT09ICdhJyA/IHN5bWJvbCA6IGVsZW1lbnQ7XG4gICAgaWYgKCFzeW1ib2wucGFyZW50Tm9kZSkge1xuICAgICAgICBlbGVtZW50LmFwcGVuZENoaWxkKHN5bWJvbCk7XG4gICAgfVxuICAgIGlmIChib3VuZHMgJiYgYm91bmRzLmdldEJvdW5kaW5nQ2xpZW50UmVjdCkge1xuICAgICAgICBjb250YWluZXIgPSBib3VuZHM7XG4gICAgICAgIGJvdW5kcyA9IGdldEJvdW5kaW5nUmVjdChib3VuZHMpO1xuICAgIH0gZWxzZSB7XG4gICAgICAgIGNvbnRhaW5lciA9IHN5bWJvbC5vZmZzZXRQYXJlbnQgfHwgZWxlbWVudDtcbiAgICAgICAgdmFyIHJlY3QgPSBnZXRCb3VuZGluZ1JlY3QoY29udGFpbmVyKTtcbiAgICAgICAgdmFyIGNvbnRhaW5lclBvcyA9IGdldE9mZnNldChjb250YWluZXIpIHx8IHtcbiAgICAgICAgICAgICAgICB4OiAwLFxuICAgICAgICAgICAgICAgIHk6IDBcbiAgICAgICAgICAgIH07XG4gICAgICAgIGlmICh0eXBlb2YgYm91bmRzID09PSAnZnVuY3Rpb24nKSB7XG4gICAgICAgICAgICBib3VuZHMgPSBib3VuZHMoY29udGFpbmVyKTtcbiAgICAgICAgfVxuICAgICAgICB2YXIgeCA9IHR5cGVvZiBib3VuZHMueCA9PT0gJ3N0cmluZycgJiYgYm91bmRzLnguaW5kZXhPZignJScpID49IDAgPyBwYXJzZUZsb2F0KGJvdW5kcy54KSAqIHJlY3Qud2lkdGggLyAxMDAgOiBwYXJzZUZsb2F0KGJvdW5kcy54KTtcbiAgICAgICAgdmFyIHkgPSB0eXBlb2YgYm91bmRzLnkgPT09ICdzdHJpbmcnICYmIGJvdW5kcy55LmluZGV4T2YoJyUnKSA+PSAwID8gcGFyc2VGbG9hdChib3VuZHMueSkgKiByZWN0LmhlaWdodCAvIDEwMCA6IHBhcnNlRmxvYXQoYm91bmRzLnkpO1xuICAgICAgICB2YXIgd2lkdGggPSB0eXBlb2YgYm91bmRzLndpZHRoID09PSAnc3RyaW5nJyAmJiBib3VuZHMud2lkdGguaW5kZXhPZignJScpID49IDAgPyBwYXJzZUZsb2F0KGJvdW5kcy53aWR0aCkgKiByZWN0LndpZHRoIC8gMTAwIDogcGFyc2VGbG9hdChib3VuZHMud2lkdGgpO1xuICAgICAgICB2YXIgaGVpZ2h0ID0gdHlwZW9mIGJvdW5kcy5oZWlnaHQgPT09ICdzdHJpbmcnICYmIGJvdW5kcy5oZWlnaHQuaW5kZXhPZignJScpID49IDAgPyBwYXJzZUZsb2F0KGJvdW5kcy5oZWlnaHQpICogcmVjdC5oZWlnaHQgLyAxMDAgOiBwYXJzZUZsb2F0KGJvdW5kcy5oZWlnaHQpO1xuICAgICAgICBib3VuZHMgPSB7XG4gICAgICAgICAgICB4OiBjb250YWluZXJQb3MubGVmdCArIHgsXG4gICAgICAgICAgICB5OiBjb250YWluZXJQb3MudG9wICsgeSxcbiAgICAgICAgICAgIHdpZHRoOiB3aWR0aCxcbiAgICAgICAgICAgIGhlaWdodDogaGVpZ2h0XG4gICAgICAgIH07XG4gICAgfVxuICAgIGNzcyhlbGVtZW50LCAnZGlzcGxheScsIGRpc3BsYXkpO1xuICAgIHJldHVybiBtZXJnZShwcm9wcywge1xuICAgICAgICBjdXJzb3I6IGN1cnNvcixcbiAgICAgICAgc3ltYm9sOiBzeW1ib2wsXG4gICAgICAgIGJvdW5kczogYm91bmRzLFxuICAgICAgICBjb250YWluZXI6IGNvbnRhaW5lcixcbiAgICAgICAgdGFyZ2V0OiB0YXJnZXQsXG4gICAgICAgIG9mZnNldDogb2Zmc2V0LFxuICAgICAgICBzdHlsZTogc3R5bGUsXG4gICAgICAgIHNjYWxlOiBzY2FsZVxuICAgIH0pO1xufVxubW9kdWxlLmV4cG9ydHMgPSBDdXJzb3JNYW5hZ2VyOyIsIm1vZHVsZS5leHBvcnRzID0gZnVuY3Rpb24gKCkge1xuICAgIHZhciBvYmogPSB7fSwgaSA9IDAsIGlsID0gYXJndW1lbnRzLmxlbmd0aCwga2V5O1xuICAgIGZvciAoOyBpIDwgaWw7IGkrKykge1xuICAgICAgICBmb3IgKGtleSBpbiBhcmd1bWVudHNbaV0pIHtcbiAgICAgICAgICAgIGlmIChhcmd1bWVudHNbaV0uaGFzT3duUHJvcGVydHkoa2V5KSkge1xuICAgICAgICAgICAgICAgIG9ialtrZXldID0gYXJndW1lbnRzW2ldW2tleV07XG4gICAgICAgICAgICB9XG4gICAgICAgIH1cbiAgICB9XG4gICAgcmV0dXJuIG9iajtcbn07IiwidmFyIGdldFN0eWxlID0gZnVuY3Rpb24gKGVsLCBjc3Nwcm9wKSB7XG4gICAgICAgIGlmIChlbC5zdHlsZSlcbiAgICAgICAgICAgIGlmIChlbC5jdXJyZW50U3R5bGUpXG4gICAgICAgICAgICAgICAgcmV0dXJuIGVsLmN1cnJlbnRTdHlsZVtjc3Nwcm9wXTtcbiAgICAgICAgICAgIGVsc2UgaWYgKGRvY3VtZW50LmRlZmF1bHRWaWV3ICYmIGRvY3VtZW50LmRlZmF1bHRWaWV3LmdldENvbXB1dGVkU3R5bGUpXG4gICAgICAgICAgICAgICAgcmV0dXJuIGRvY3VtZW50LmRlZmF1bHRWaWV3LmdldENvbXB1dGVkU3R5bGUoZWwsICcnKVtjc3Nwcm9wXTtcbiAgICAgICAgICAgIGVsc2VcbiAgICAgICAgICAgICAgICByZXR1cm4gZWwuc3R5bGVbY3NzcHJvcF07XG4gICAgfSwgZ2V0WkluZGV4ID0gZnVuY3Rpb24gKGVsKSB7XG4gICAgICAgIHZhciB6SW5kZXggPSBwYXJzZUZsb2F0KGdldFN0eWxlKGVsLCAnekluZGV4JykpO1xuICAgICAgICB6SW5kZXggPSAhaXNOYU4oekluZGV4KSA/IHpJbmRleCA6IDA7XG4gICAgICAgIGlmICh6SW5kZXggPT09IDApIHtcbiAgICAgICAgICAgIGlmIChlbC5wYXJlbnROb2RlKSB7XG4gICAgICAgICAgICAgICAgcmV0dXJuIGdldFpJbmRleChlbC5wYXJlbnROb2RlKTtcbiAgICAgICAgICAgIH1cbiAgICAgICAgfVxuICAgICAgICByZXR1cm4gekluZGV4O1xuICAgIH0sIGlzQ2hpbGRPZiA9IGZ1bmN0aW9uIChwYXJlbnQsIGNoaWxkKSB7XG4gICAgICAgIGlmICghY2hpbGQgfHwgIXBhcmVudCkge1xuICAgICAgICAgICAgcmV0dXJuIGZhbHNlO1xuICAgICAgICB9XG4gICAgICAgIHZhciBub2RlID0gY2hpbGQucGFyZW50Tm9kZTtcbiAgICAgICAgd2hpbGUgKG5vZGUgIT0gbnVsbCkge1xuICAgICAgICAgICAgaWYgKG5vZGUgPT0gcGFyZW50KSB7XG4gICAgICAgICAgICAgICAgcmV0dXJuIHRydWU7XG4gICAgICAgICAgICB9XG4gICAgICAgICAgICBub2RlID0gbm9kZS5wYXJlbnROb2RlO1xuICAgICAgICB9XG4gICAgICAgIHJldHVybiBmYWxzZTtcbiAgICB9O1xuZnVuY3Rpb24gY29tcGFyZVZpc2liaWxpdHkoYSwgYikge1xuICAgIHZhciB2YSA9IGEgJiYgYS5zdHlsZSAmJiBnZXRTdHlsZShhLCAnZGlzcGxheScpICE9PSAnbm9uZSc7XG4gICAgdmFyIHZiID0gYiAmJiBiLnN0eWxlICYmIGdldFN0eWxlKGIsICdkaXNwbGF5JykgIT09ICdub25lJztcbiAgICBpZiAodmEgJiYgIXZiKSB7XG4gICAgICAgIHJldHVybiAtMTtcbiAgICB9IGVsc2UgaWYgKHZiICYmICF2YSkge1xuICAgICAgICByZXR1cm4gMTtcbiAgICB9XG4gICAgcmV0dXJuIDA7XG59XG5mdW5jdGlvbiBjb21wYXJlUG9zaXRpb25TdGFjayhhLCBiKSB7XG4gICAgdmFyIHBhID0gZ2V0U3R5bGUoYSwgJ3Bvc2l0aW9uJyk7XG4gICAgdmFyIHBiID0gZ2V0U3R5bGUoYiwgJ3Bvc2l0aW9uJyk7XG4gICAgaWYgKHphID4gemIpIHtcbiAgICAgICAgcmV0dXJuIC0xO1xuICAgIH0gZWxzZSBpZiAoemIgPiB6YSkge1xuICAgICAgICByZXR1cm4gMTtcbiAgICB9XG4gICAgcmV0dXJuIDA7XG59XG5mdW5jdGlvbiBjb21wYXJlWkluZGV4KGEsIGIpIHtcbiAgICB2YXIgemEgPSBnZXRaSW5kZXgoYSk7XG4gICAgdmFyIHpiID0gZ2V0WkluZGV4KGIpO1xuICAgIGlmICh6YSA+IHpiKSB7XG4gICAgICAgIHJldHVybiAtMTtcbiAgICB9IGVsc2UgaWYgKHpiID4gemEpIHtcbiAgICAgICAgcmV0dXJuIDE7XG4gICAgfVxuICAgIHJldHVybiAwO1xufVxuZnVuY3Rpb24gY29tcGFyZVBvc2l0aW9uKGEsIGIpIHtcbiAgICByZXR1cm4gYS5jb21wYXJlRG9jdW1lbnRQb3NpdGlvbiA/IGEuY29tcGFyZURvY3VtZW50UG9zaXRpb24oYikgOiBhLmNvbnRhaW5zID8gKGEgIT0gYiAmJiBhLmNvbnRhaW5zKGIpICYmIDE2KSArIChhICE9IGIgJiYgYi5jb250YWlucyhhKSAmJiA4KSArIChhLnNvdXJjZUluZGV4ID49IDAgJiYgYi5zb3VyY2VJbmRleCA+PSAwID8gKGEuc291cmNlSW5kZXggPCBiLnNvdXJjZUluZGV4ICYmIDQpICsgKGEuc291cmNlSW5kZXggPiBiLnNvdXJjZUluZGV4ICYmIDIpIDogMSkgKyAwIDogMDtcbn1cbm1vZHVsZS5leHBvcnRzID0gZnVuY3Rpb24gKGEsIGIpIHtcbiAgICB2YXIgdmlzaWJpbGl0eSA9IGNvbXBhcmVWaXNpYmlsaXR5KGEsIGIpO1xuICAgIGlmICh2aXNpYmlsaXR5ICE9PSAwKSB7XG4gICAgICAgIHJldHVybiB2aXNpYmlsaXR5IDwgMCA/IGEgOiBiO1xuICAgIH1cbiAgICBpZiAoaXNDaGlsZE9mKGEsIGIpKSB7XG4gICAgICAgIHJldHVybiBiO1xuICAgIH1cbiAgICB2YXIgekluZGV4Q29tcGFyaXNvblJlc3VsdCA9IGNvbXBhcmVaSW5kZXgoYSwgYik7XG4gICAgaWYgKHpJbmRleENvbXBhcmlzb25SZXN1bHQgPT09IC0xKSB7XG4gICAgICAgIHJldHVybiBhO1xuICAgIH1cbiAgICBpZiAoekluZGV4Q29tcGFyaXNvblJlc3VsdCA9PT0gMSkge1xuICAgICAgICByZXR1cm4gYjtcbiAgICB9XG4gICAgdmFyIGRvY3VtZW50UG9zaXRpb25SZXN1bHQgPSBjb21wYXJlUG9zaXRpb24oYSwgYik7XG4gICAgaWYgKGRvY3VtZW50UG9zaXRpb25SZXN1bHQgPT09IDIpIHtcbiAgICAgICAgcmV0dXJuIGE7XG4gICAgfVxuICAgIGlmIChkb2N1bWVudFBvc2l0aW9uUmVzdWx0ID09PSA0KSB7XG4gICAgICAgIHJldHVybiBiO1xuICAgIH1cbiAgICByZXR1cm4gYTtcbn07Il19
