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
//# sourceMappingURL=data:application/json;charset:utf-8;base64,eyJ2ZXJzaW9uIjozLCJzb3VyY2VzIjpbIm5vZGVfbW9kdWxlcy9ncnVudC1icm93c2VyaWZ5L25vZGVfbW9kdWxlcy9icm93c2VyaWZ5L25vZGVfbW9kdWxlcy9icm93c2VyLXBhY2svX3ByZWx1ZGUuanMiLCJzcmMvY3Vyem9yeS5qcyIsInNyYy9qcXVlcnkuY3Vyem9yeS5qcyIsInNyYy9saWIvQ3Vyc29yLmpzIiwic3JjL2xpYi9DdXJzb3JNYW5hZ2VyLmpzIiwic3JjL2xpYi9tZXJnZS5qcyIsInNyYy9saWIvdG9wbW9zdC5qcyJdLCJuYW1lcyI6W10sIm1hcHBpbmdzIjoiQUFBQTtBQ0FBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBOztBQ05BO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBOztBQ3hCQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7O0FDL0ZBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTs7QUM1WEE7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTs7QUNWQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0EiLCJmaWxlIjoiZ2VuZXJhdGVkLmpzIiwic291cmNlUm9vdCI6IiIsInNvdXJjZXNDb250ZW50IjpbIihmdW5jdGlvbiBlKHQsbixyKXtmdW5jdGlvbiBzKG8sdSl7aWYoIW5bb10pe2lmKCF0W29dKXt2YXIgYT10eXBlb2YgcmVxdWlyZT09XCJmdW5jdGlvblwiJiZyZXF1aXJlO2lmKCF1JiZhKXJldHVybiBhKG8sITApO2lmKGkpcmV0dXJuIGkobywhMCk7dmFyIGY9bmV3IEVycm9yKFwiQ2Fubm90IGZpbmQgbW9kdWxlICdcIitvK1wiJ1wiKTt0aHJvdyBmLmNvZGU9XCJNT0RVTEVfTk9UX0ZPVU5EXCIsZn12YXIgbD1uW29dPXtleHBvcnRzOnt9fTt0W29dWzBdLmNhbGwobC5leHBvcnRzLGZ1bmN0aW9uKGUpe3ZhciBuPXRbb11bMV1bZV07cmV0dXJuIHMobj9uOmUpfSxsLGwuZXhwb3J0cyxlLHQsbixyKX1yZXR1cm4gbltvXS5leHBvcnRzfXZhciBpPXR5cGVvZiByZXF1aXJlPT1cImZ1bmN0aW9uXCImJnJlcXVpcmU7Zm9yKHZhciBvPTA7bzxyLmxlbmd0aDtvKyspcyhyW29dKTtyZXR1cm4gc30pIiwidmFyIEN1cnNvck1hbmFnZXIgPSByZXF1aXJlKCcuL2xpYi9DdXJzb3JNYW5hZ2VyJyksIEN1cnNvciA9IHJlcXVpcmUoJy4vbGliL0N1cnNvcicpO1xuY3Vyc29yTWFuYWdlciA9IG5ldyBDdXJzb3JNYW5hZ2VyKCk7XG5tb2R1bGUuZXhwb3J0cyA9IGZ1bmN0aW9uIGN1cnpvcnkoZWxlbWVudCwgb3B0aW9ucykge1xuICAgIHZhciBjdXJzb3IgPSBuZXcgQ3Vyc29yKGVsZW1lbnQsIG9wdGlvbnMpO1xuICAgIGN1cnNvck1hbmFnZXIuYWRkKGN1cnNvcik7XG4gICAgcmV0dXJuIGN1cnNvcjtcbn07IiwidmFyIGN1cnpvcnkgPSByZXF1aXJlKCcuL2N1cnpvcnknKSwgJCA9IGZ1bmN0aW9uICgpIHtcbiAgICAgICAgdHJ5IHtcbiAgICAgICAgICAgIHJldHVybiBmdW5jdGlvbiAoKSB7XG4gICAgICAgICAgICAgICAgdGhyb3cgbmV3IEVycm9yKCdDYW5ub3QgZmluZCBtb2R1bGUgXFwnanF1ZXJ5XFwnIGZyb20gXFwnL1VzZXJzL3JhZmFlbG5vd3JvdGVrL0RvY3VtZW50cy9Qcm9qZWt0ZS9EV1NBY3RpdmUvV29ya3NwYWNlL2N1cnpvcnkvc3JjXFwnJyk7XG4gICAgICAgICAgICB9KCk7XG4gICAgICAgIH0gY2F0Y2ggKGUpIHtcbiAgICAgICAgICAgIHJldHVybiAkIHx8IGpRdWVyeTtcbiAgICAgICAgfVxuICAgIH0oKTtcbmlmICgkKSB7XG4gICAgJC5mbi5leHRlbmQoe1xuICAgICAgICBjdXJ6b3J5OiBmdW5jdGlvbiAob3B0aW9ucykge1xuICAgICAgICAgICAgcmV0dXJuIHRoaXMuZWFjaChmdW5jdGlvbiAoKSB7XG4gICAgICAgICAgICAgICAgdmFyIGN1cnNvciA9ICQodGhpcykuZGF0YSgnY3Vyem9yeScpO1xuICAgICAgICAgICAgICAgIGlmICghY3Vyc29yKSB7XG4gICAgICAgICAgICAgICAgICAgIGN1cnNvciA9IGN1cnpvcnkodGhpcywgb3B0aW9ucyk7XG4gICAgICAgICAgICAgICAgICAgICQodGhpcykuZGF0YSgnY3Vyem9yeScsIGN1cnNvcik7XG4gICAgICAgICAgICAgICAgfSBlbHNlIHtcbiAgICAgICAgICAgICAgICAgICAgY3Vyc29yLnNldChvcHRpb25zKTtcbiAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgICAgcmV0dXJuICQodGhpcyk7XG4gICAgICAgICAgICB9KTtcbiAgICAgICAgfVxuICAgIH0pO1xufSIsInZhciBtZXJnZSA9IHJlcXVpcmUoJy4vbWVyZ2UnKSwgY3JlYXRlRWxlbWVudCA9IGZ1bmN0aW9uIChzdHJpbmcpIHtcbiAgICAgICAgdmFyIGVsZW1lbnQgPSBkb2N1bWVudC5jcmVhdGVFbGVtZW50KCdkaXYnKTtcbiAgICAgICAgZWxlbWVudC5pbm5lckhUTUwgPSBzdHJpbmc7XG4gICAgICAgIHZhciByZXN1bHQgPSBlbGVtZW50LmZpcnN0Q2hpbGQ7XG4gICAgICAgIGVsZW1lbnQucmVtb3ZlQ2hpbGQocmVzdWx0KTtcbiAgICAgICAgcmV0dXJuIHJlc3VsdDtcbiAgICB9LCBpc0hUTUwgPSBmdW5jdGlvbiAoc3RyaW5nKSB7XG4gICAgICAgIHJldHVybiB0eXBlb2Ygc3RyaW5nID09PSAnc3RyaW5nJyAmJiBzdHJpbmcubWF0Y2goLzxcXC8/XFx3KygoXFxzK1xcdysoXFxzKj1cXHMqKD86XCIuKj9cInwnLio/J3xbXidcIj5cXHNdKykpPykrXFxzKnxcXHMqKVxcLz8+Lyk7XG4gICAgfSwgZ2V0RWxlbWVudCA9IGZ1bmN0aW9uICh2YWx1ZSwgcGFyZW50KSB7XG4gICAgICAgIHZhbHVlID0gdmFsdWUudG9BcnJheSA/IHZhbHVlLnRvQXJyYXkoKVswXSA6IHZhbHVlIGluc3RhbmNlb2YgQXJyYXkgPyB2YWx1ZVswXSA6IHZhbHVlO1xuICAgICAgICBpZiAodHlwZW9mIHZhbHVlID09PSAnZnVuY3Rpb24nKSB7XG4gICAgICAgICAgICB2YWx1ZSA9IHZhbHVlLmNhbGwodGhpcywgdmFsdWUpO1xuICAgICAgICB9XG4gICAgICAgIGlmICh0eXBlb2YgdmFsdWUgPT09ICdzdHJpbmcnKSB7XG4gICAgICAgICAgICBpZiAoaXNIVE1MKHZhbHVlKSkge1xuICAgICAgICAgICAgICAgIHZhbHVlID0gY3JlYXRlRWxlbWVudCh2YWx1ZSk7XG4gICAgICAgICAgICB9IGVsc2Uge1xuICAgICAgICAgICAgICAgIHZhbHVlID0gcGFyZW50LnF1ZXJ5U2VsZWN0b3IodmFsdWUpO1xuICAgICAgICAgICAgfVxuICAgICAgICB9XG4gICAgICAgIGlmICh2YWx1ZSAmJiB2YWx1ZS5ub2RlTmFtZSkge1xuICAgICAgICAgICAgcmV0dXJuIHZhbHVlO1xuICAgICAgICB9XG4gICAgICAgIHJldHVybiBudWxsO1xuICAgIH07XG5tb2R1bGUuZXhwb3J0cyA9IGZ1bmN0aW9uIEN1cnNvcihlbGVtZW50LCBvcHRpb25zKSB7XG4gICAgZnVuY3Rpb24gc2V0KG5hbWUsIHZhbHVlKSB7XG4gICAgICAgIHZhciBvcHRzO1xuICAgICAgICBpZiAodHlwZW9mIG5hbWUgPT09ICdvYmplY3QnKSB7XG4gICAgICAgICAgICBvcHRzID0gbmFtZTtcbiAgICAgICAgfSBlbHNlIHtcbiAgICAgICAgICAgIG9wdHMgPSB7fTtcbiAgICAgICAgICAgIG9wdHNbbmFtZV0gPSB2YWx1ZTtcbiAgICAgICAgfVxuICAgICAgICBmb3IgKG5hbWUgaW4gb3B0cykge1xuICAgICAgICAgICAgdmFsdWUgPSBvcHRzW25hbWVdO1xuICAgICAgICAgICAgc3dpdGNoIChuYW1lKSB7XG4gICAgICAgICAgICBjYXNlICdlbGVtZW50JzpcbiAgICAgICAgICAgIGNhc2UgJ3N5bWJvbCc6XG4gICAgICAgICAgICAgICAgaWYgKGlzSFRNTCh2YWx1ZSkpIHtcbiAgICAgICAgICAgICAgICAgICAgdmFsdWUgPSBjcmVhdGVFbGVtZW50KHZhbHVlKTtcbiAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgICAgYnJlYWs7XG4gICAgICAgICAgICB9XG4gICAgICAgICAgICBvcHRzW25hbWVdID0gdmFsdWU7XG4gICAgICAgIH1cbiAgICAgICAgb3B0aW9ucyA9IG1lcmdlKG9wdGlvbnMsIG9wdHMpO1xuICAgIH1cbiAgICA7XG4gICAgdGhpcy5zZXQgPSBmdW5jdGlvbiAoKSB7XG4gICAgICAgIHNldC5jYWxsKHRoaXMsIGFyZ3VtZW50cyk7XG4gICAgICAgIGN1cnNvck1hbmFnZXIudXBkYXRlKCk7XG4gICAgfTtcbiAgICB0aGlzLmdldCA9IGZ1bmN0aW9uIChuYW1lKSB7XG4gICAgICAgIHZhciB2YWx1ZTtcbiAgICAgICAgaWYgKCFuYW1lKSB7XG4gICAgICAgICAgICB2YWx1ZSA9IHt9O1xuICAgICAgICAgICAgZm9yICh2YXIgeCBpbiBvcHRpb25zKSB7XG4gICAgICAgICAgICAgICAgdmFsdWVbeF0gPSB0aGlzLmdldCh4KTtcbiAgICAgICAgICAgIH1cbiAgICAgICAgfSBlbHNlIHtcbiAgICAgICAgICAgIHZhbHVlID0gb3B0aW9uc1tuYW1lXTtcbiAgICAgICAgICAgIHN3aXRjaCAobmFtZSkge1xuICAgICAgICAgICAgY2FzZSAnZWxlbWVudCc6XG4gICAgICAgICAgICBjYXNlICdzeW1ib2wnOlxuICAgICAgICAgICAgY2FzZSAnYm91bmRzJzpcbiAgICAgICAgICAgIGNhc2UgJ3RhcmdldCc6XG4gICAgICAgICAgICAgICAgdmFsdWUgPSB2YWx1ZSAmJiB2YWx1ZS50b0FycmF5ID8gdmFsdWUudG9BcnJheSgpWzBdIDogdmFsdWUgaW5zdGFuY2VvZiBBcnJheSA/IHZhbHVlWzBdIDogdmFsdWU7XG4gICAgICAgICAgICAgICAgdmFsdWUgPSB0eXBlb2YgdmFsdWUgPT09ICdzdHJpbmcnID8gKGVsZW1lbnQgfHwgZG9jdW1lbnQpLnF1ZXJ5U2VsZWN0b3IodmFsdWUpIDogdmFsdWU7XG4gICAgICAgICAgICAgICAgYnJlYWs7XG4gICAgICAgICAgICB9XG4gICAgICAgICAgICBzd2l0Y2ggKG5hbWUpIHtcbiAgICAgICAgICAgIGNhc2UgJ3N5bWJvbCc6XG4gICAgICAgICAgICAgICAgdmFsdWUgPSB2YWx1ZSB8fCB0aGlzLmdldCgnZWxlbWVudCcpO1xuICAgICAgICAgICAgICAgIGJyZWFrO1xuICAgICAgICAgICAgY2FzZSAnYm91bmRzJzpcbiAgICAgICAgICAgICAgICB2YWx1ZSA9IHZhbHVlID8gdmFsdWUgOiBvcHRpb25zWydzeW1ib2wnXSA/IHRoaXMuZ2V0KCdlbGVtZW50JykgOiB0aGlzLmdldCgnZWxlbWVudCcpLm9mZnNldFBhcmVudDtcbiAgICAgICAgICAgICAgICBicmVhaztcbiAgICAgICAgICAgIH1cbiAgICAgICAgfVxuICAgICAgICByZXR1cm4gdmFsdWU7XG4gICAgfTtcbiAgICBzZXQobWVyZ2Uoe1xuICAgICAgICBlbGVtZW50OiBudWxsLFxuICAgICAgICBvZmZzZXQ6IHtcbiAgICAgICAgICAgIGxlZnQ6IDgsXG4gICAgICAgICAgICB0b3A6IDZcbiAgICAgICAgfSxcbiAgICAgICAgc3R5bGU6ICd0cmFuc2Zvcm0nLFxuICAgICAgICBzY2FsZTogMSxcbiAgICAgICAgYm91bmRzOiBudWxsLFxuICAgICAgICBzeW1ib2w6IG51bGwsXG4gICAgICAgIHRhcmdldDogbnVsbCxcbiAgICAgICAgaGlkZU9uRm9jdXM6IGZhbHNlXG4gICAgfSwgb3B0aW9ucywgeyBlbGVtZW50OiBlbGVtZW50IH0pKTtcbn07IiwidmFyIG1lcmdlID0gcmVxdWlyZSgnLi9tZXJnZScpLCB0b3Btb3N0ID0gcmVxdWlyZSgnLi90b3Btb3N0JyksIGh5cGhlbmF0ZSA9IGZ1bmN0aW9uICgpIHtcbiAgICAgICAgdmFyIGNhY2hlID0ge307XG4gICAgICAgIHJldHVybiBmdW5jdGlvbiAoc3RyaW5nKSB7XG4gICAgICAgICAgICByZXR1cm4gY2FjaGVbc3RyaW5nXSA9IGNhY2hlW3N0cmluZ10gfHwgZnVuY3Rpb24gKCkge1xuICAgICAgICAgICAgICAgIHJldHVybiBzdHJpbmcucmVwbGFjZSgvKFtBLVpdKS9nLCBmdW5jdGlvbiAoJDEpIHtcbiAgICAgICAgICAgICAgICAgICAgcmV0dXJuICctJyArICQxLnRvTG93ZXJDYXNlKCk7XG4gICAgICAgICAgICAgICAgfSk7XG4gICAgICAgICAgICB9KCk7XG4gICAgICAgIH07XG4gICAgfSgpLCBnZXRTdHlsZSA9IGZ1bmN0aW9uIChlbCwgY3NzcHJvcCkge1xuICAgICAgICBpZiAoZWwuY3VycmVudFN0eWxlKVxuICAgICAgICAgICAgcmV0dXJuIGVsLmN1cnJlbnRTdHlsZVtjc3Nwcm9wXTtcbiAgICAgICAgZWxzZSBpZiAoZG9jdW1lbnQuZGVmYXVsdFZpZXcgJiYgZG9jdW1lbnQuZGVmYXVsdFZpZXcuZ2V0Q29tcHV0ZWRTdHlsZSlcbiAgICAgICAgICAgIHJldHVybiBkb2N1bWVudC5kZWZhdWx0Vmlldy5nZXRDb21wdXRlZFN0eWxlKGVsLCAnJylbY3NzcHJvcF07XG4gICAgICAgIGVsc2VcbiAgICAgICAgICAgIHJldHVybiBlbC5zdHlsZVtjc3Nwcm9wXTtcbiAgICB9LCB0cmFuc2Zvcm1TdHlsZSA9IGZ1bmN0aW9uIChwcm9wLCBwcmVmaXhlcykge1xuICAgICAgICB2YXIgaSwgZWxlbSA9IGRvY3VtZW50LmNyZWF0ZUVsZW1lbnQoJ2RpdicpLCBjYXBpdGFsaXplZCA9IHByb3AuY2hhckF0KDApLnRvVXBwZXJDYXNlKCkgKyBwcm9wLnNsaWNlKDEpO1xuICAgICAgICBmb3IgKGkgPSAwOyBpIDwgcHJlZml4ZXMubGVuZ3RoOyBpKyspIHtcbiAgICAgICAgICAgIGlmICh0eXBlb2YgZWxlbS5zdHlsZVtwcmVmaXhlc1tpXSArIGNhcGl0YWxpemVkXSAhPT0gJ3VuZGVmaW5lZCcpIHtcbiAgICAgICAgICAgICAgICByZXR1cm4gcHJlZml4ZXNbaV0gKyBjYXBpdGFsaXplZDtcbiAgICAgICAgICAgIH1cbiAgICAgICAgfVxuICAgICAgICByZXR1cm4gbnVsbDtcbiAgICB9KCd0cmFuc2Zvcm0nLCBbXG4gICAgICAgICcnLFxuICAgICAgICAnTW96JyxcbiAgICAgICAgJ1dlYmtpdCcsXG4gICAgICAgICdPJyxcbiAgICAgICAgJ01zJ1xuICAgIF0pLCBpc0NoaWxkT2YgPSBmdW5jdGlvbiAocGFyZW50LCBjaGlsZCkge1xuICAgICAgICBpZiAoIWNoaWxkIHx8ICFwYXJlbnQpIHtcbiAgICAgICAgICAgIHJldHVybiBmYWxzZTtcbiAgICAgICAgfVxuICAgICAgICB2YXIgbm9kZSA9IGNoaWxkLnBhcmVudE5vZGU7XG4gICAgICAgIHdoaWxlIChub2RlICE9IG51bGwpIHtcbiAgICAgICAgICAgIGlmIChub2RlID09IHBhcmVudCkge1xuICAgICAgICAgICAgICAgIHJldHVybiB0cnVlO1xuICAgICAgICAgICAgfVxuICAgICAgICAgICAgbm9kZSA9IG5vZGUucGFyZW50Tm9kZTtcbiAgICAgICAgfVxuICAgICAgICByZXR1cm4gZmFsc2U7XG4gICAgfSwgY3NzID0gZnVuY3Rpb24gKGVsZW0sIG5hbWUsIHZhbHVlKSB7XG4gICAgICAgIHZhciBtYXAgPSB7fSwgY3NzVGV4dCA9IG51bGw7XG4gICAgICAgIGlmICh0eXBlb2YgbmFtZSA9PT0gJ29iamVjdCcpIHtcbiAgICAgICAgICAgIG1hcCA9IG5hbWU7XG4gICAgICAgIH0gZWxzZSBpZiAodHlwZW9mIHZhbHVlICE9PSAndW5kZWZpbmVkJykge1xuICAgICAgICAgICAgbWFwW25hbWVdID0gdmFsdWU7XG4gICAgICAgIH1cbiAgICAgICAgdmFyIGtleXMgPSBPYmplY3Qua2V5cyhtYXApO1xuICAgICAgICBrZXlzID0ga2V5cy5maWx0ZXIoZnVuY3Rpb24gKGtleSwgaW5kZXgpIHtcbiAgICAgICAgICAgIGlmIChtYXBba2V5XSA9PT0gJycpIHtcbiAgICAgICAgICAgICAgICBlbGVtLnN0eWxlW2tleV0gPSBtYXBba2V5XTtcbiAgICAgICAgICAgICAgICByZXR1cm4gZmFsc2U7XG4gICAgICAgICAgICB9XG4gICAgICAgICAgICByZXR1cm4gdHJ1ZTtcbiAgICAgICAgfSk7XG4gICAgICAgIGNzc1RleHQgPSBrZXlzLm1hcChmdW5jdGlvbiAobmFtZSkge1xuICAgICAgICAgICAgcmV0dXJuIGh5cGhlbmF0ZShuYW1lKSArICc6ICcgKyBtYXBbbmFtZV07XG4gICAgICAgIH0pLmpvaW4oJzsgJyk7XG4gICAgICAgIGlmIChjc3NUZXh0ICYmIGNzc1RleHQubGVuZ3RoKSB7XG4gICAgICAgICAgICBlbGVtLnN0eWxlLmNzc1RleHQgPSBlbGVtLnN0eWxlLmNzc1RleHQgKyBjc3NUZXh0O1xuICAgICAgICAgICAgcmV0dXJuIG51bGw7XG4gICAgICAgIH1cbiAgICAgICAgcmV0dXJuIGVsZW0uc3R5bGVbbmFtZV0gfHwgd2luZG93LmdldENvbXB1dGVkU3R5bGUoZWxlbSwgbnVsbCkuZ2V0UHJvcGVydHlWYWx1ZShuYW1lKTtcbiAgICB9LCBnZXRPZmZzZXQgPSBmdW5jdGlvbiAoZWxlbWVudCkge1xuICAgICAgICB2YXIgc2Nyb2xsT2Zmc2V0ID0gZ2V0U2Nyb2xsT2Zmc2V0KCksIHJlY3QgPSBlbGVtZW50LmdldEJvdW5kaW5nQ2xpZW50UmVjdCgpO1xuICAgICAgICByZXR1cm4ge1xuICAgICAgICAgICAgdG9wOiByZWN0LnRvcCArIHNjcm9sbE9mZnNldC50b3AsXG4gICAgICAgICAgICBsZWZ0OiByZWN0LmxlZnQgKyBzY3JvbGxPZmZzZXQubGVmdFxuICAgICAgICB9O1xuICAgIH0sIGdldFNjcm9sbE9mZnNldCA9IGZ1bmN0aW9uICgpIHtcbiAgICAgICAgcmV0dXJuIHtcbiAgICAgICAgICAgIGxlZnQ6IGRvY3VtZW50LmJvZHkgJiYgZG9jdW1lbnQuYm9keS5zY3JvbGxMZWZ0ICsgZG9jdW1lbnQuZG9jdW1lbnRFbGVtZW50LnNjcm9sbExlZnQsXG4gICAgICAgICAgICB0b3A6IGRvY3VtZW50LmJvZHkgJiYgZG9jdW1lbnQuYm9keS5zY3JvbGxUb3AgKyBkb2N1bWVudC5kb2N1bWVudEVsZW1lbnQuc2Nyb2xsVG9wXG4gICAgICAgIH07XG4gICAgfSwgZ2V0Qm91bmRpbmdSZWN0ID0gZnVuY3Rpb24gKGVsZW1lbnQpIHtcbiAgICAgICAgaWYgKCFlbGVtZW50KSB7XG4gICAgICAgICAgICByZXR1cm4ge1xuICAgICAgICAgICAgICAgIHg6IC1JbmZpbml0eSxcbiAgICAgICAgICAgICAgICB5OiAtSW5maW5pdHksXG4gICAgICAgICAgICAgICAgd2lkdGg6IEluZmluaXR5LFxuICAgICAgICAgICAgICAgIGhlaWdodDogSW5maW5pdHlcbiAgICAgICAgICAgIH07XG4gICAgICAgIH1cbiAgICAgICAgdmFyIHNjcm9sbE9mZnNldCA9IGdldFNjcm9sbE9mZnNldCgpO1xuICAgICAgICB2YXIgcmVjdCA9IGVsZW1lbnQuZ2V0Qm91bmRpbmdDbGllbnRSZWN0KCk7XG4gICAgICAgIHJldHVybiB7XG4gICAgICAgICAgICB4OiByZWN0LmxlZnQgKyBzY3JvbGxPZmZzZXQubGVmdCxcbiAgICAgICAgICAgIHk6IHJlY3QudG9wICsgc2Nyb2xsT2Zmc2V0LnRvcCxcbiAgICAgICAgICAgIHdpZHRoOiByZWN0LndpZHRoLFxuICAgICAgICAgICAgaGVpZ2h0OiByZWN0LmhlaWdodFxuICAgICAgICB9O1xuICAgIH0sIGluc3RhbmNlID0gbnVsbDtcbmZ1bmN0aW9uIEN1cnNvck1hbmFnZXIob3B0aW9ucykge1xuICAgIGlmIChpbnN0YW5jZSkge1xuICAgICAgICBpbnN0YW5jZS5zZXQob3B0aW9ucyk7XG4gICAgICAgIHJldHVybiBpbnN0YW5jZTtcbiAgICB9XG4gICAgaW5zdGFuY2UgPSB0aGlzO1xuICAgIHZhciBjdXJzb3JzID0gW107XG4gICAgdmFyIGNsaWVudCA9IHtcbiAgICAgICAgICAgIHg6IDAsXG4gICAgICAgICAgICB5OiAwXG4gICAgICAgIH07XG4gICAgdmFyIG1vdXNlID0ge1xuICAgICAgICAgICAgeDogLUluZmluaXR5LFxuICAgICAgICAgICAgeTogLUluZmluaXR5LFxuICAgICAgICAgICAgZWxlbWVudDogbnVsbFxuICAgICAgICB9O1xuICAgIHZhciBldmVudHMgPSBbXG4gICAgICAgICAgICAnbW91c2Vkb3duJyxcbiAgICAgICAgICAgICdjbGljaycsXG4gICAgICAgICAgICAnc2Nyb2xsJyxcbiAgICAgICAgICAgICdyZXNpemUnLFxuICAgICAgICAgICAgJ21vdXNlbW92ZScsXG4gICAgICAgICAgICAnbW91c2VvdXQnXG4gICAgICAgIF07XG4gICAgdmFyIGN1cnNvckl0ZW1zID0gW107XG4gICAgdmFyIGN1cnNvckl0ZW0gPSBudWxsO1xuICAgIHZhciBjbGlja2luZyA9IGZhbHNlO1xuICAgIHZhciBjbGlja2FibGUgPSB0cnVlO1xuICAgIGZ1bmN0aW9uIGluaXQoKSB7XG4gICAgICAgIGlmICghKCdvbnRvdWNoJyBpbiB3aW5kb3cpKSB7XG4gICAgICAgICAgICBhZGRNb3VzZUxpc3RlbmVycyh3aW5kb3cpO1xuICAgICAgICB9XG4gICAgfVxuICAgIGZ1bmN0aW9uIGhhbmRsZUV2ZW50KGUpIHtcbiAgICAgICAgdHJ5IHtcbiAgICAgICAgICAgIGUudHlwZTtcbiAgICAgICAgfSBjYXRjaCAoZSkge1xuICAgICAgICAgICAgY29uc29sZS53YXJuKGUpO1xuICAgICAgICAgICAgcmV0dXJuO1xuICAgICAgICB9XG4gICAgICAgIHN3aXRjaCAoZS50eXBlKSB7XG4gICAgICAgIGNhc2UgJ21vdXNlZG93bic6XG4gICAgICAgICAgICBjbGlja2luZyA9IGZhbHNlO1xuICAgICAgICAgICAgYnJlYWs7XG4gICAgICAgIGNhc2UgJ21vdXNlb3V0JzpcbiAgICAgICAgICAgIHZhciByZWxhdGVkVGFyZ2V0ID0gdHlwZW9mIGUudG9FbGVtZW50ICE9ICd1bmRlZmluZWQnID8gZS50b0VsZW1lbnQgOiBlLnJlbGF0ZWRUYXJnZXQ7XG4gICAgICAgICAgICBpZiAocmVsYXRlZFRhcmdldCA9PT0gbnVsbCkge1xuICAgICAgICAgICAgICAgIG1vdXNlLnggPSAtSW5maW5pdHk7XG4gICAgICAgICAgICAgICAgbW91c2UueSA9IC1JbmZpbml0eTtcbiAgICAgICAgICAgICAgICBtb3VzZS5lbGVtZW50ID0gbnVsbDtcbiAgICAgICAgICAgIH1cbiAgICAgICAgICAgIGJyZWFrO1xuICAgICAgICBjYXNlICdtb3VzZW1vdmUnOlxuICAgICAgICAgICAgY2xpZW50LnggPSBlLmNsaWVudFg7XG4gICAgICAgICAgICBjbGllbnQueSA9IGUuY2xpZW50WTtcbiAgICAgICAgZGVmYXVsdDpcbiAgICAgICAgICAgIHZhciBzY3JvbGxPZmZzZXQgPSBnZXRTY3JvbGxPZmZzZXQoKTtcbiAgICAgICAgICAgIG1vdXNlLnggPSBjbGllbnQueCArIHNjcm9sbE9mZnNldC5sZWZ0O1xuICAgICAgICAgICAgbW91c2UueSA9IGNsaWVudC55ICsgc2Nyb2xsT2Zmc2V0LnRvcDtcbiAgICAgICAgICAgIG1vdXNlLmVsZW1lbnQgPSBlLnRhcmdldDtcbiAgICAgICAgfVxuICAgICAgICBpbnZhbGlkYXRlLmNhbGwodGhpcyk7XG4gICAgICAgIHN3aXRjaCAoZS50eXBlKSB7XG4gICAgICAgIGNhc2UgJ2NsaWNrJzpcbiAgICAgICAgICAgIGlmICghY2xpY2tpbmcgJiYgY3Vyc29ySXRlbSkge1xuICAgICAgICAgICAgICAgIGNsaWNraW5nID0gdHJ1ZTtcbiAgICAgICAgICAgICAgICBpZiAobW91c2UuZWxlbWVudCAmJiBjdXJzb3JJdGVtICYmIGN1cnNvckl0ZW0udGFyZ2V0ICYmIGN1cnNvckl0ZW0uc3ltYm9sICE9PSBtb3VzZS5lbGVtZW50ICYmIGlzQ2hpbGRPZihjdXJzb3JJdGVtLmNvbnRhaW5lciwgbW91c2UuZWxlbWVudCkpIHtcbiAgICAgICAgICAgICAgICAgICAgY3Vyc29ySXRlbS50YXJnZXQuY2xpY2soKTtcbiAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgICAgdmFyIGNsaWNrID0gY3Vyc29ySXRlbSAmJiBjdXJzb3JJdGVtLmNsaWNrO1xuICAgICAgICAgICAgICAgIGlmICh0eXBlb2YgY2xpY2sgPT09ICdmdW5jdGlvbicpIHtcbiAgICAgICAgICAgICAgICAgICAgY2xpY2suY2FsbChjdXJzb3JJdGVtLmVsZW1lbnQsIGUpO1xuICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgIH1cbiAgICAgICAgICAgIGJyZWFrO1xuICAgICAgICB9XG4gICAgICAgIHJlbmRlci5jYWxsKGluc3RhbmNlKTtcbiAgICB9XG4gICAgZnVuY3Rpb24gY2xvc2VzdChlbCwgc2VsZWN0b3IpIHtcbiAgICAgICAgdmFyIG1hdGNoZXNGbjtcbiAgICAgICAgW1xuICAgICAgICAgICAgJ21hdGNoZXMnLFxuICAgICAgICAgICAgJ3dlYmtpdE1hdGNoZXNTZWxlY3RvcicsXG4gICAgICAgICAgICAnbW96TWF0Y2hlc1NlbGVjdG9yJyxcbiAgICAgICAgICAgICdtc01hdGNoZXNTZWxlY3RvcicsXG4gICAgICAgICAgICAnb01hdGNoZXNTZWxlY3RvcidcbiAgICAgICAgXS5zb21lKGZ1bmN0aW9uIChmbikge1xuICAgICAgICAgICAgaWYgKHR5cGVvZiBkb2N1bWVudC5ib2R5W2ZuXSA9PSAnZnVuY3Rpb24nKSB7XG4gICAgICAgICAgICAgICAgbWF0Y2hlc0ZuID0gZm47XG4gICAgICAgICAgICAgICAgcmV0dXJuIHRydWU7XG4gICAgICAgICAgICB9XG4gICAgICAgICAgICByZXR1cm4gZmFsc2U7XG4gICAgICAgIH0pO1xuICAgICAgICB2YXIgcGFyZW50O1xuICAgICAgICB3aGlsZSAoZWwpIHtcbiAgICAgICAgICAgIHBhcmVudCA9IGVsLnBhcmVudEVsZW1lbnQ7XG4gICAgICAgICAgICBpZiAocGFyZW50ICYmIHBhcmVudFttYXRjaGVzRm5dKHNlbGVjdG9yKSkge1xuICAgICAgICAgICAgICAgIHJldHVybiBwYXJlbnQ7XG4gICAgICAgICAgICB9XG4gICAgICAgICAgICBlbCA9IHBhcmVudDtcbiAgICAgICAgfVxuICAgICAgICByZXR1cm4gbnVsbDtcbiAgICB9XG4gICAgZnVuY3Rpb24gZ2V0UGFyZW50cyhlbGVtZW50LCBzZWxlY3Rvcikge1xuICAgICAgICB2YXIgcGFyZW50cyA9IFtdO1xuICAgICAgICB2YXIgcGFyZW50ID0gZWxlbWVudDtcbiAgICAgICAgd2hpbGUgKHBhcmVudCA9IHBhcmVudC5wYXJlbnRFbGVtZW50ICYmIGNsb3Nlc3QocGFyZW50LnBhcmVudEVsZW1lbnQsIHNlbGVjdG9yKSkge1xuICAgICAgICAgICAgcGFyZW50cy5wdXNoKHBhcmVudCk7XG4gICAgICAgIH1cbiAgICAgICAgcmV0dXJuIHBhcmVudHM7XG4gICAgfVxuICAgIGZ1bmN0aW9uIGludmFsaWRhdGUoKSB7XG4gICAgICAgIGN1cnNvckl0ZW1zID0gY3Vyc29ycy5tYXAoZnVuY3Rpb24gKGN1cnNvciwgaW5kZXgpIHtcbiAgICAgICAgICAgIHJldHVybiBnZXRDdXJzb3JJdGVtKGN1cnNvciwgY3Vyc29ySXRlbXNbaW5kZXhdKTtcbiAgICAgICAgfSk7XG4gICAgICAgIHZhciBmaWx0ZXJlZCA9IGN1cnNvckl0ZW1zLmZpbHRlcihmdW5jdGlvbiAoY3Vyc29ySXRlbSwgaW5kZXgpIHtcbiAgICAgICAgICAgICAgICB2YXIgbW91c2VFbGVtZW50ID0gbW91c2UuZWxlbWVudCwgc3ltYm9sID0gY3Vyc29ySXRlbS5zeW1ib2wsIGJvdW5kcyA9IGN1cnNvckl0ZW0uYm91bmRzLCBjb250YWluZXIgPSBjdXJzb3JJdGVtLmNvbnRhaW5lciwgcmVzdWx0ID0gZmFsc2U7XG4gICAgICAgICAgICAgICAgaWYgKG1vdXNlRWxlbWVudCkge1xuICAgICAgICAgICAgICAgICAgICBpZiAoIW1vdXNlRWxlbWVudC5ocmVmICYmICFnZXRQYXJlbnRzKG1vdXNlRWxlbWVudCwgJ2EnKS5sZW5ndGgpIHtcbiAgICAgICAgICAgICAgICAgICAgICAgIGlmICh0b3Btb3N0KG1vdXNlRWxlbWVudCwgc3ltYm9sKSA9PT0gc3ltYm9sKSB7XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgaWYgKGNvbnRhaW5lciA9PT0gbW91c2VFbGVtZW50IHx8IGlzQ2hpbGRPZihjb250YWluZXIsIG1vdXNlRWxlbWVudCkpIHtcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgcmVzdWx0ID0gbW91c2UueCA+PSBib3VuZHMueCAmJiBtb3VzZS54IDw9IGJvdW5kcy54ICsgYm91bmRzLndpZHRoICYmIG1vdXNlLnkgPj0gYm91bmRzLnkgJiYgbW91c2UueSA8PSBib3VuZHMueSArIGJvdW5kcy5oZWlnaHQ7XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICAgIHJldHVybiByZXN1bHQ7XG4gICAgICAgICAgICB9KSwgc29ydGVkID0gZmlsdGVyZWQuc29ydChmdW5jdGlvbiAoYSwgYikge1xuICAgICAgICAgICAgICAgIHZhciB6RWxlbWVudCA9IHRvcG1vc3QoYS5zeW1ib2wsIGIuc3ltYm9sKTtcbiAgICAgICAgICAgICAgICBpZiAoekVsZW1lbnQgPT09IGEuc3ltYm9sKSB7XG4gICAgICAgICAgICAgICAgICAgIHJldHVybiAtMTtcbiAgICAgICAgICAgICAgICB9IGVsc2UgaWYgKHpFbGVtZW50ID09PSBiLnN5bWJvbCkge1xuICAgICAgICAgICAgICAgICAgICByZXR1cm4gMTtcbiAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgICAgdmFyIHAxID0ge1xuICAgICAgICAgICAgICAgICAgICAgICAgeDogYS54ICsgYS53aWR0aCAvIDIsXG4gICAgICAgICAgICAgICAgICAgICAgICB5OiBhLnkgKyBhLmhlaWdodCAvIDJcbiAgICAgICAgICAgICAgICAgICAgfTtcbiAgICAgICAgICAgICAgICB2YXIgcDIgPSB7XG4gICAgICAgICAgICAgICAgICAgICAgICB4OiBiLnggKyBiLndpZHRoIC8gMixcbiAgICAgICAgICAgICAgICAgICAgICAgIHk6IGIueSArIGIuaGVpZ2h0IC8gMlxuICAgICAgICAgICAgICAgICAgICB9O1xuICAgICAgICAgICAgICAgIHZhciBkMSA9IE1hdGguc3FydChNYXRoLnBvdyhwMS54IC0gbW91c2UueCwgMikgKyBNYXRoLnBvdyhwMS55IC0gbW91c2UueSwgMikpO1xuICAgICAgICAgICAgICAgIHZhciBkMiA9IE1hdGguc3FydChNYXRoLnBvdyhwMi54IC0gbW91c2UueCwgMikgKyBNYXRoLnBvdyhwMi55IC0gbW91c2UueSwgMikpO1xuICAgICAgICAgICAgICAgIHJldHVybiBkMSA8IGQyID8gZDEgOiBkMSA+IGQyID8gZDIgOiAwO1xuICAgICAgICAgICAgfSkucmV2ZXJzZSgpO1xuICAgICAgICBjdXJzb3JJdGVtID0gc29ydGVkWzBdO1xuICAgICAgICBzZXRNb3VzZVByb3ZpZGVycyhbd2luZG93XS5jb25jYXQoY3Vyc29ySXRlbXMubWFwKGZ1bmN0aW9uIChpdGVtKSB7XG4gICAgICAgICAgICByZXR1cm4gaXRlbS5jb250YWluZXI7XG4gICAgICAgIH0pKSk7XG4gICAgfVxuICAgIGZ1bmN0aW9uIHJlbmRlcigpIHtcbiAgICAgICAgY3Vyc29ySXRlbXMuZm9yRWFjaChmdW5jdGlvbiAoaXRlbSkge1xuICAgICAgICAgICAgdmFyIHN5bWJvbCA9IGl0ZW0uc3ltYm9sLCBzdHlsZSA9IHtcbiAgICAgICAgICAgICAgICAgICAgdmlzaWJpbGl0eTogaXRlbSA9PT0gY3Vyc29ySXRlbSA/ICcnIDogJ2hpZGRlbicsXG4gICAgICAgICAgICAgICAgICAgIHBvc2l0aW9uOiAnYWJzb2x1dGUnLFxuICAgICAgICAgICAgICAgICAgICBjdXJzb3I6ICdpbmhlcml0J1xuICAgICAgICAgICAgICAgIH07XG4gICAgICAgICAgICBpZiAoaXRlbS5zdHlsZSA9PT0gJ3RyYW5zZm9ybScgJiYgdHJhbnNmb3JtU3R5bGUpIHtcbiAgICAgICAgICAgICAgICBzdHlsZVt0cmFuc2Zvcm1TdHlsZSArICdPcmlnaW4nXSA9ICcnO1xuICAgICAgICAgICAgICAgIHN0eWxlW3RyYW5zZm9ybVN0eWxlXSA9ICcnO1xuICAgICAgICAgICAgfSBlbHNlIHtcbiAgICAgICAgICAgICAgICBzdHlsZS5sZWZ0ID0gJyc7XG4gICAgICAgICAgICAgICAgc3R5bGUudG9wID0gJyc7XG4gICAgICAgICAgICB9XG4gICAgICAgICAgICBzeW1ib2wuY2xhc3NMaXN0ICYmICFzeW1ib2wuY2xhc3NMaXN0LmNvbnRhaW5zKCdjdXJzb3InKSAmJiBzeW1ib2wuY2xhc3NMaXN0LmFkZCgnY3Vyc29yJyk7XG4gICAgICAgICAgICBjc3Moc3ltYm9sLCBzdHlsZSk7XG4gICAgICAgICAgICBpZiAoY3Vyc29ySXRlbSA9PT0gaXRlbSkge1xuICAgICAgICAgICAgICAgIHZhciBwb3MgPSBnZXRPZmZzZXQoc3ltYm9sKTtcbiAgICAgICAgICAgICAgICB2YXIgcHggPSBwb3MubGVmdDtcbiAgICAgICAgICAgICAgICB2YXIgcHkgPSBwb3MudG9wO1xuICAgICAgICAgICAgICAgIHZhciBvZmYgPSBpdGVtLm9mZnNldDtcbiAgICAgICAgICAgICAgICB2YXIgeCA9IE1hdGgucm91bmQobW91c2UueCAtIHB4ICsgb2ZmLmxlZnQpO1xuICAgICAgICAgICAgICAgIHZhciB5ID0gTWF0aC5yb3VuZChtb3VzZS55IC0gcHkgKyBvZmYudG9wKTtcbiAgICAgICAgICAgICAgICBzdHlsZSA9IHt9O1xuICAgICAgICAgICAgICAgIGlmIChpdGVtLnN0eWxlID09PSAndHJhbnNmb3JtJyAmJiB0cmFuc2Zvcm1TdHlsZSkge1xuICAgICAgICAgICAgICAgICAgICBzdHlsZVt0cmFuc2Zvcm1TdHlsZSArICdPcmlnaW4nXSA9ICcwIDAnO1xuICAgICAgICAgICAgICAgICAgICBzdHlsZVt0cmFuc2Zvcm1TdHlsZV0gPSAndHJhbnNsYXRlM2QoJyArIHggKyAncHgsJyArIHkgKyAncHgsIDApIHNjYWxlKCcgKyBpdGVtLnNjYWxlICsgJywnICsgaXRlbS5zY2FsZSArICcpJztcbiAgICAgICAgICAgICAgICB9IGVsc2Uge1xuICAgICAgICAgICAgICAgICAgICBzdHlsZS5sZWZ0ID0geCArIHBvcy5sZWZ0ICsgJ3B4JztcbiAgICAgICAgICAgICAgICAgICAgc3R5bGUudG9wID0geSArIHBvcy50b3AgKyAncHgnO1xuICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgICBjc3Moc3ltYm9sLCBzdHlsZSk7XG4gICAgICAgICAgICB9XG4gICAgICAgICAgICBpZiAoaXRlbSA9PT0gY3Vyc29ySXRlbSkge1xuICAgICAgICAgICAgICAgIHN5bWJvbC5jbGFzc0xpc3QgJiYgIXN5bWJvbC5jbGFzc0xpc3QuY29udGFpbnMoJ2N1cnNvci1hY3RpdmUnKSAmJiBzeW1ib2wuY2xhc3NMaXN0LmFkZCgnY3Vyc29yLWFjdGl2ZScpO1xuICAgICAgICAgICAgICAgIHN5bWJvbC5jbGFzc0xpc3QgJiYgc3ltYm9sLmNsYXNzTGlzdC5jb250YWlucygnY3Vyc29yLWhpZGRlbicpICYmIHN5bWJvbC5jbGFzc0xpc3QucmVtb3ZlKCdjdXJzb3ItaGlkZGVuJyk7XG4gICAgICAgICAgICB9IGVsc2Uge1xuICAgICAgICAgICAgICAgIHN5bWJvbC5jbGFzc0xpc3QgJiYgc3ltYm9sLmNsYXNzTGlzdC5jb250YWlucygnY3Vyc29yLWFjdGl2ZScpICYmIHN5bWJvbC5jbGFzc0xpc3QucmVtb3ZlKCdjdXJzb3ItYWN0aXZlJyk7XG4gICAgICAgICAgICAgICAgc3ltYm9sLmNsYXNzTGlzdCAmJiAhc3ltYm9sLmNsYXNzTGlzdC5jb250YWlucygnY3Vyc29yLWhpZGRlbicpICYmIHN5bWJvbC5jbGFzc0xpc3QuYWRkKCdjdXJzb3ItaGlkZGVuJyk7XG4gICAgICAgICAgICB9XG4gICAgICAgIH0pO1xuICAgIH1cbiAgICA7XG4gICAgdGhpcy51cGRhdGUgPSBmdW5jdGlvbiAoKSB7XG4gICAgICAgIGludmFsaWRhdGUuY2FsbCh0aGlzKTtcbiAgICAgICAgcmVuZGVyLmNhbGwodGhpcyk7XG4gICAgfTtcbiAgICB0aGlzLmFkZCA9IGZ1bmN0aW9uIChjdXJzb3IpIHtcbiAgICAgICAgaWYgKGN1cnNvcnMuaW5kZXhPZihjdXJzb3IpID09PSAtMSkge1xuICAgICAgICAgICAgY3Vyc29ycy5wdXNoKGN1cnNvcik7XG4gICAgICAgICAgICB0aGlzLnVwZGF0ZSgpO1xuICAgICAgICB9XG4gICAgfTtcbiAgICB0aGlzLnJlbW92ZSA9IGZ1bmN0aW9uIChjdXJzb3IpIHtcbiAgICAgICAgY3Vyc29ycy5zcGxpY2UoY3Vyc29ycy5pbmRleE9mKGN1cnNvciksIDEpO1xuICAgICAgICB0aGlzLnVwZGF0ZSgpO1xuICAgIH07XG4gICAgdmFyIG1vdXNlUHJvdmlkZXJzID0gW107XG4gICAgZnVuY3Rpb24gc2V0TW91c2VQcm92aWRlcnMoZWxlbWVudHMpIHtcbiAgICAgICAgZWxlbWVudHMgPSBlbGVtZW50cy5maWx0ZXIoZnVuY3Rpb24gKG4pIHtcbiAgICAgICAgICAgIHJldHVybiBuO1xuICAgICAgICB9KTtcbiAgICAgICAgbW91c2VQcm92aWRlcnMuZm9yRWFjaChmdW5jdGlvbiAoZWxlbWVudCkge1xuICAgICAgICAgICAgaWYgKGVsZW1lbnRzLmluZGV4T2YoZWxlbWVudCkgPT09IC0xKSB7XG4gICAgICAgICAgICAgICAgcmVtb3ZlTW91c2VMaXN0ZW5lcnMoZWxlbWVudCk7XG4gICAgICAgICAgICB9XG4gICAgICAgIH0pO1xuICAgICAgICBlbGVtZW50cy5mb3JFYWNoKGZ1bmN0aW9uIChlbGVtZW50KSB7XG4gICAgICAgICAgICBpZiAobW91c2VQcm92aWRlcnMuaW5kZXhPZihlbGVtZW50KSA9PT0gLTEpIHtcbiAgICAgICAgICAgICAgICBhZGRNb3VzZUxpc3RlbmVycyhlbGVtZW50KTtcbiAgICAgICAgICAgIH1cbiAgICAgICAgfSk7XG4gICAgICAgIG1vdXNlUHJvdmlkZXJzID0gZWxlbWVudHM7XG4gICAgfVxuICAgIGZ1bmN0aW9uIGFkZE1vdXNlTGlzdGVuZXJzKGVsZW1lbnQpIHtcbiAgICAgICAgZm9yICh2YXIgaSA9IDAsIGV2ZW50OyBldmVudCA9IGV2ZW50c1tpXTsgaSsrKSB7XG4gICAgICAgICAgICBlbGVtZW50LmFkZEV2ZW50TGlzdGVuZXIoZXZlbnQsIGhhbmRsZUV2ZW50KTtcbiAgICAgICAgfVxuICAgIH1cbiAgICBmdW5jdGlvbiByZW1vdmVNb3VzZUxpc3RlbmVycyhlbGVtZW50KSB7XG4gICAgICAgIGZvciAodmFyIGkgPSAwLCBldmVudDsgZXZlbnQgPSBldmVudHNbaV07IGkrKykge1xuICAgICAgICAgICAgZWxlbWVudC5yZW1vdmVFdmVudExpc3RlbmVyKGV2ZW50LCBoYW5kbGVFdmVudCk7XG4gICAgICAgIH1cbiAgICB9XG4gICAgaW5pdC5jYWxsKHRoaXMpO1xufVxuZnVuY3Rpb24gZ2V0Q3Vyc29ySXRlbShjdXJzb3IpIHtcbiAgICB2YXIgZWxlbWVudCA9IGN1cnNvci5nZXQoJ2VsZW1lbnQnKSwgcHJvcHMgPSBjdXJzb3IuZ2V0KCksIHN5bWJvbCA9IHByb3BzLnN5bWJvbCwgYm91bmRzID0gcHJvcHMuYm91bmRzLCBvZmZzZXQgPSBwcm9wcy5vZmZzZXQsIHN0eWxlID0gcHJvcHMuc3R5bGUsIHNjYWxlID0gcHJvcHMuc2NhbGUsIHRhcmdldCA9IHByb3BzLnRhcmdldCB8fCBzeW1ib2wubm9kZU5hbWUudG9Mb3dlckNhc2UoKSA9PT0gJ2EnID8gc3ltYm9sIDogZWxlbWVudCwgY29udGFpbmVyLCBkaXNwbGF5ID0gZWxlbWVudC5zdHlsZS5kaXNwbGF5O1xuICAgIGNzcyhlbGVtZW50LCB7IGRpc3BsYXk6ICcnIH0pO1xuICAgIHByb3BzID0gY3Vyc29yLmdldCgpO1xuICAgIHN5bWJvbCA9IHByb3BzLnN5bWJvbDtcbiAgICBib3VuZHMgPSBwcm9wcy5ib3VuZHM7XG4gICAgb2Zmc2V0ID0gcHJvcHMub2Zmc2V0O1xuICAgIHN0eWxlID0gcHJvcHMuc3R5bGU7XG4gICAgc2NhbGUgPSBwcm9wcy5zY2FsZTtcbiAgICB0YXJnZXQgPSBwcm9wcy50YXJnZXQgfHwgc3ltYm9sLm5vZGVOYW1lLnRvTG93ZXJDYXNlKCkgPT09ICdhJyA/IHN5bWJvbCA6IGVsZW1lbnQ7XG4gICAgaWYgKCFzeW1ib2wucGFyZW50Tm9kZSkge1xuICAgICAgICBlbGVtZW50LmFwcGVuZENoaWxkKHN5bWJvbCk7XG4gICAgfVxuICAgIGlmIChib3VuZHMgJiYgYm91bmRzLmdldEJvdW5kaW5nQ2xpZW50UmVjdCkge1xuICAgICAgICBjb250YWluZXIgPSBib3VuZHM7XG4gICAgICAgIGJvdW5kcyA9IGdldEJvdW5kaW5nUmVjdChib3VuZHMpO1xuICAgIH0gZWxzZSB7XG4gICAgICAgIGNvbnRhaW5lciA9IHN5bWJvbC5vZmZzZXRQYXJlbnQgfHwgZWxlbWVudCAmJiBlbGVtZW50ID09PSBzeW1ib2wgPyBlbGVtZW50Lm9mZnNldFBhcmVudCB8fCBkb2N1bWVudC5kb2N1bWVudEVsZW1lbnQgOiBlbGVtZW50O1xuICAgICAgICB2YXIgcmVjdCA9IGdldEJvdW5kaW5nUmVjdChjb250YWluZXIpO1xuICAgICAgICB2YXIgY29udGFpbmVyUG9zID0gZ2V0T2Zmc2V0KGNvbnRhaW5lcikgfHwge1xuICAgICAgICAgICAgICAgIHg6IDAsXG4gICAgICAgICAgICAgICAgeTogMFxuICAgICAgICAgICAgfTtcbiAgICAgICAgaWYgKHR5cGVvZiBib3VuZHMgPT09ICdmdW5jdGlvbicpIHtcbiAgICAgICAgICAgIGJvdW5kcyA9IGJvdW5kcyhjb250YWluZXIpO1xuICAgICAgICB9XG4gICAgICAgIHZhciB4ID0gdHlwZW9mIGJvdW5kcy54ID09PSAnc3RyaW5nJyAmJiBib3VuZHMueC5pbmRleE9mKCclJykgPj0gMCA/IHBhcnNlRmxvYXQoYm91bmRzLngpICogcmVjdC53aWR0aCAvIDEwMCA6IHBhcnNlRmxvYXQoYm91bmRzLngpO1xuICAgICAgICB2YXIgeSA9IHR5cGVvZiBib3VuZHMueSA9PT0gJ3N0cmluZycgJiYgYm91bmRzLnkuaW5kZXhPZignJScpID49IDAgPyBwYXJzZUZsb2F0KGJvdW5kcy55KSAqIHJlY3QuaGVpZ2h0IC8gMTAwIDogcGFyc2VGbG9hdChib3VuZHMueSk7XG4gICAgICAgIHZhciB3aWR0aCA9IHR5cGVvZiBib3VuZHMud2lkdGggPT09ICdzdHJpbmcnICYmIGJvdW5kcy53aWR0aC5pbmRleE9mKCclJykgPj0gMCA/IHBhcnNlRmxvYXQoYm91bmRzLndpZHRoKSAqIHJlY3Qud2lkdGggLyAxMDAgOiBwYXJzZUZsb2F0KGJvdW5kcy53aWR0aCk7XG4gICAgICAgIHZhciBoZWlnaHQgPSB0eXBlb2YgYm91bmRzLmhlaWdodCA9PT0gJ3N0cmluZycgJiYgYm91bmRzLmhlaWdodC5pbmRleE9mKCclJykgPj0gMCA/IHBhcnNlRmxvYXQoYm91bmRzLmhlaWdodCkgKiByZWN0LmhlaWdodCAvIDEwMCA6IHBhcnNlRmxvYXQoYm91bmRzLmhlaWdodCk7XG4gICAgICAgIGJvdW5kcyA9IHtcbiAgICAgICAgICAgIHg6IGNvbnRhaW5lclBvcy5sZWZ0ICsgeCxcbiAgICAgICAgICAgIHk6IGNvbnRhaW5lclBvcy50b3AgKyB5LFxuICAgICAgICAgICAgd2lkdGg6IHdpZHRoLFxuICAgICAgICAgICAgaGVpZ2h0OiBoZWlnaHRcbiAgICAgICAgfTtcbiAgICB9XG4gICAgY3NzKGVsZW1lbnQsICdkaXNwbGF5JywgZGlzcGxheSk7XG4gICAgcmV0dXJuIG1lcmdlKHByb3BzLCB7XG4gICAgICAgIGN1cnNvcjogY3Vyc29yLFxuICAgICAgICBzeW1ib2w6IHN5bWJvbCxcbiAgICAgICAgYm91bmRzOiBib3VuZHMsXG4gICAgICAgIGNvbnRhaW5lcjogY29udGFpbmVyLFxuICAgICAgICB0YXJnZXQ6IHRhcmdldCxcbiAgICAgICAgb2Zmc2V0OiBvZmZzZXQsXG4gICAgICAgIHN0eWxlOiBzdHlsZSxcbiAgICAgICAgc2NhbGU6IHNjYWxlXG4gICAgfSk7XG59XG5tb2R1bGUuZXhwb3J0cyA9IEN1cnNvck1hbmFnZXI7IiwibW9kdWxlLmV4cG9ydHMgPSBmdW5jdGlvbiAoKSB7XG4gICAgdmFyIG9iaiA9IHt9LCBpID0gMCwgaWwgPSBhcmd1bWVudHMubGVuZ3RoLCBrZXk7XG4gICAgZm9yICg7IGkgPCBpbDsgaSsrKSB7XG4gICAgICAgIGZvciAoa2V5IGluIGFyZ3VtZW50c1tpXSkge1xuICAgICAgICAgICAgaWYgKGFyZ3VtZW50c1tpXS5oYXNPd25Qcm9wZXJ0eShrZXkpKSB7XG4gICAgICAgICAgICAgICAgb2JqW2tleV0gPSBhcmd1bWVudHNbaV1ba2V5XTtcbiAgICAgICAgICAgIH1cbiAgICAgICAgfVxuICAgIH1cbiAgICByZXR1cm4gb2JqO1xufTsiLCJ2YXIgZ2V0U3R5bGUgPSBmdW5jdGlvbiAoZWwsIGNzc3Byb3ApIHtcbiAgICAgICAgaWYgKGVsLnN0eWxlKVxuICAgICAgICAgICAgaWYgKGVsLmN1cnJlbnRTdHlsZSlcbiAgICAgICAgICAgICAgICByZXR1cm4gZWwuY3VycmVudFN0eWxlW2Nzc3Byb3BdO1xuICAgICAgICAgICAgZWxzZSBpZiAoZG9jdW1lbnQuZGVmYXVsdFZpZXcgJiYgZG9jdW1lbnQuZGVmYXVsdFZpZXcuZ2V0Q29tcHV0ZWRTdHlsZSlcbiAgICAgICAgICAgICAgICByZXR1cm4gZG9jdW1lbnQuZGVmYXVsdFZpZXcuZ2V0Q29tcHV0ZWRTdHlsZShlbCwgJycpW2Nzc3Byb3BdO1xuICAgICAgICAgICAgZWxzZVxuICAgICAgICAgICAgICAgIHJldHVybiBlbC5zdHlsZVtjc3Nwcm9wXTtcbiAgICB9LCBnZXRaSW5kZXggPSBmdW5jdGlvbiAoZWwpIHtcbiAgICAgICAgdmFyIHpJbmRleCA9IHBhcnNlRmxvYXQoZ2V0U3R5bGUoZWwsICd6SW5kZXgnKSk7XG4gICAgICAgIHpJbmRleCA9ICFpc05hTih6SW5kZXgpID8gekluZGV4IDogMDtcbiAgICAgICAgaWYgKHpJbmRleCA9PT0gMCkge1xuICAgICAgICAgICAgaWYgKGVsLnBhcmVudE5vZGUpIHtcbiAgICAgICAgICAgICAgICByZXR1cm4gZ2V0WkluZGV4KGVsLnBhcmVudE5vZGUpO1xuICAgICAgICAgICAgfVxuICAgICAgICB9XG4gICAgICAgIHJldHVybiB6SW5kZXg7XG4gICAgfSwgaXNDaGlsZE9mID0gZnVuY3Rpb24gKHBhcmVudCwgY2hpbGQpIHtcbiAgICAgICAgaWYgKCFjaGlsZCB8fCAhcGFyZW50KSB7XG4gICAgICAgICAgICByZXR1cm4gZmFsc2U7XG4gICAgICAgIH1cbiAgICAgICAgdmFyIG5vZGUgPSBjaGlsZC5wYXJlbnROb2RlO1xuICAgICAgICB3aGlsZSAobm9kZSAhPSBudWxsKSB7XG4gICAgICAgICAgICBpZiAobm9kZSA9PSBwYXJlbnQpIHtcbiAgICAgICAgICAgICAgICByZXR1cm4gdHJ1ZTtcbiAgICAgICAgICAgIH1cbiAgICAgICAgICAgIG5vZGUgPSBub2RlLnBhcmVudE5vZGU7XG4gICAgICAgIH1cbiAgICAgICAgcmV0dXJuIGZhbHNlO1xuICAgIH07XG5mdW5jdGlvbiBjb21wYXJlVmlzaWJpbGl0eShhLCBiKSB7XG4gICAgdmFyIHZhID0gYSAmJiBhLnN0eWxlICYmIGdldFN0eWxlKGEsICdkaXNwbGF5JykgIT09ICdub25lJztcbiAgICB2YXIgdmIgPSBiICYmIGIuc3R5bGUgJiYgZ2V0U3R5bGUoYiwgJ2Rpc3BsYXknKSAhPT0gJ25vbmUnO1xuICAgIGlmICh2YSAmJiAhdmIpIHtcbiAgICAgICAgcmV0dXJuIC0xO1xuICAgIH0gZWxzZSBpZiAodmIgJiYgIXZhKSB7XG4gICAgICAgIHJldHVybiAxO1xuICAgIH1cbiAgICByZXR1cm4gMDtcbn1cbmZ1bmN0aW9uIGNvbXBhcmVQb3NpdGlvblN0YWNrKGEsIGIpIHtcbiAgICB2YXIgcGEgPSBnZXRTdHlsZShhLCAncG9zaXRpb24nKTtcbiAgICB2YXIgcGIgPSBnZXRTdHlsZShiLCAncG9zaXRpb24nKTtcbiAgICBpZiAoemEgPiB6Yikge1xuICAgICAgICByZXR1cm4gLTE7XG4gICAgfSBlbHNlIGlmICh6YiA+IHphKSB7XG4gICAgICAgIHJldHVybiAxO1xuICAgIH1cbiAgICByZXR1cm4gMDtcbn1cbmZ1bmN0aW9uIGNvbXBhcmVaSW5kZXgoYSwgYikge1xuICAgIHZhciB6YSA9IGdldFpJbmRleChhKTtcbiAgICB2YXIgemIgPSBnZXRaSW5kZXgoYik7XG4gICAgaWYgKHphID4gemIpIHtcbiAgICAgICAgcmV0dXJuIC0xO1xuICAgIH0gZWxzZSBpZiAoemIgPiB6YSkge1xuICAgICAgICByZXR1cm4gMTtcbiAgICB9XG4gICAgcmV0dXJuIDA7XG59XG5mdW5jdGlvbiBjb21wYXJlUG9zaXRpb24oYSwgYikge1xuICAgIHJldHVybiBhLmNvbXBhcmVEb2N1bWVudFBvc2l0aW9uID8gYS5jb21wYXJlRG9jdW1lbnRQb3NpdGlvbihiKSA6IGEuY29udGFpbnMgPyAoYSAhPSBiICYmIGEuY29udGFpbnMoYikgJiYgMTYpICsgKGEgIT0gYiAmJiBiLmNvbnRhaW5zKGEpICYmIDgpICsgKGEuc291cmNlSW5kZXggPj0gMCAmJiBiLnNvdXJjZUluZGV4ID49IDAgPyAoYS5zb3VyY2VJbmRleCA8IGIuc291cmNlSW5kZXggJiYgNCkgKyAoYS5zb3VyY2VJbmRleCA+IGIuc291cmNlSW5kZXggJiYgMikgOiAxKSArIDAgOiAwO1xufVxubW9kdWxlLmV4cG9ydHMgPSBmdW5jdGlvbiAoYSwgYikge1xuICAgIHZhciB2aXNpYmlsaXR5ID0gY29tcGFyZVZpc2liaWxpdHkoYSwgYik7XG4gICAgaWYgKHZpc2liaWxpdHkgIT09IDApIHtcbiAgICAgICAgcmV0dXJuIHZpc2liaWxpdHkgPCAwID8gYSA6IGI7XG4gICAgfVxuICAgIGlmIChpc0NoaWxkT2YoYSwgYikpIHtcbiAgICAgICAgcmV0dXJuIGI7XG4gICAgfVxuICAgIHZhciB6SW5kZXhDb21wYXJpc29uUmVzdWx0ID0gY29tcGFyZVpJbmRleChhLCBiKTtcbiAgICBpZiAoekluZGV4Q29tcGFyaXNvblJlc3VsdCA9PT0gLTEpIHtcbiAgICAgICAgcmV0dXJuIGE7XG4gICAgfVxuICAgIGlmICh6SW5kZXhDb21wYXJpc29uUmVzdWx0ID09PSAxKSB7XG4gICAgICAgIHJldHVybiBiO1xuICAgIH1cbiAgICB2YXIgZG9jdW1lbnRQb3NpdGlvblJlc3VsdCA9IGNvbXBhcmVQb3NpdGlvbihhLCBiKTtcbiAgICBpZiAoZG9jdW1lbnRQb3NpdGlvblJlc3VsdCA9PT0gMikge1xuICAgICAgICByZXR1cm4gYTtcbiAgICB9XG4gICAgaWYgKGRvY3VtZW50UG9zaXRpb25SZXN1bHQgPT09IDQpIHtcbiAgICAgICAgcmV0dXJuIGI7XG4gICAgfVxuICAgIHJldHVybiBhO1xufTsiXX0=
