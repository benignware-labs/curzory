(function(f){if(typeof exports==="object"&&typeof module!=="undefined"){module.exports=f()}else if(typeof define==="function"&&define.amd){define([],f)}else{var g;if(typeof window!=="undefined"){g=window}else if(typeof global!=="undefined"){g=global}else if(typeof self!=="undefined"){g=self}else{g=this}g.curzory = f()}})(function(){var define,module,exports;return (function e(t,n,r){function s(o,u){if(!n[o]){if(!t[o]){var a=typeof require=="function"&&require;if(!u&&a)return a(o,!0);if(i)return i(o,!0);var f=new Error("Cannot find module '"+o+"'");throw f.code="MODULE_NOT_FOUND",f}var l=n[o]={exports:{}};t[o][0].call(l.exports,function(e){var n=t[o][1][e];return s(n?n:e)},l,l.exports,e,t,n,r)}return n[o].exports}var i=typeof require=="function"&&require;for(var o=0;o<r.length;o++)s(r[o]);return s})({1:[function(require,module,exports){
var
  CursorManager = require('./lib/CursorManager'),
  Cursor = require('./lib/Cursor');
  cursorManager = new CursorManager();

module.exports = function curzory(element, options) {
  var cursor = new Cursor(element, options);
  cursorManager.add(cursor);
  return cursor;
};
},{"./lib/Cursor":2,"./lib/CursorManager":3}],2:[function(require,module,exports){
var
  merge = require('./merge'),
  
  createElement = function(string) {
    var element = document.createElement('div');
    element.innerHTML = string;
    var result = element.firstChild;
    element.removeChild(result);
    return result;
  },

  isHTML = function(string) {
    return typeof string === 'string' && string.match(/<\/?\w+((\s+\w+(\s*=\s*(?:".*?"|'.*?'|[^'">\s]+))?)+\s*|\s*)\/?>/);
  },
  

  getElement = function(value, parent) {
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
  };
  
  this.set = function() {
    set.call(this, arguments);
    cursorManager.update();
  };
  
  this.get = function(name) {
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
    offset: {left: 8, top: 6},
    style: 'transform',
    scale: 1,
    bounds: null,
    symbol: null,
    target: null,
    hideOnFocus: false
  }, options, {
    element: element
  }));
  
};
},{"./merge":4}],3:[function(require,module,exports){
var

  merge = require('./merge'),
  topmost = require('./topmost'),

  /**
   * Hyphenate a string
   * @param {String} string
   */
  hyphenate = (function() {
    var cache = {};
    return function(string) {
      return cache[string] = cache[string] || (function() {
        return string.replace(/([A-Z])/g, function($1){return "-"+$1.toLowerCase();});
      })();
    };
  })(),

  getStyle = function(el, cssprop){
   if (el.currentStyle) //IE
    return el.currentStyle[cssprop];
   else if (document.defaultView && document.defaultView.getComputedStyle) //Firefox
    return document.defaultView.getComputedStyle(el, "")[cssprop];
   else //try and get inline style
    return el.style[cssprop];
  },

  transformStyle = (function(prop, prefixes) {
    var i,
      elem = document.createElement('div'),
      capitalized = prop.charAt(0).toUpperCase() + prop.slice(1);
    for (i = 0; i < prefixes.length; i++) {
      if (typeof elem.style[prefixes[i] + capitalized] !== "undefined") {
        return prefixes[i] + capitalized;
      }
    }
    return null;
  })('transform', ['', 'Moz', 'Webkit', 'O', 'Ms']),

  isChildOf = function(parent, child) {
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
  },

  css = function(elem, name, value) {
    var map = {}, cssText = null;
    if (typeof name === 'object') {
      map = name;
    } else if (typeof value !== "undefined") {
      map[name] = value;
    }
    var keys = Object.keys(map);
    keys = keys.filter(function(key, index) {
      if (map[key] === '') {
        elem.style[key] = map[key];
        return false;
      }
      return true;
    });
    cssText = keys.map(function(name) {
      return hyphenate(name) + ": " + map[name];
    }).join("; ");
    if (cssText && cssText.length) {
      elem.style.cssText = elem.style.cssText + cssText;
      return null;
    }
    return elem.style[name] || window.getComputedStyle(elem, null).getPropertyValue(name);
  },

  getOffset = function(element) {
    var
      scrollOffset = getScrollOffset(),
      rect = element.getBoundingClientRect();
    return {
      top: rect.top + scrollOffset.top,
      left: rect.left + scrollOffset.left
    };
  },

  getScrollOffset = function() {
    return {
      left: document.body && document.body.scrollLeft + document.documentElement.scrollLeft,
      top: document.body && document.body.scrollTop + document.documentElement.scrollTop
    };
  },

  getBoundingRect = function(element) {
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
  },

  // Declare singleton instance
  instance = null;

/**
 * CursorManager
 * This singleton class handles all cursor objects
 * @param {Object} options
 */
function CursorManager(options) {
  // Singleton pattern
  if (instance) {
    instance.set(options);
    return instance;
  }
  instance = this;
  // Implementation

  var cursors = [];
  var client = {x: 0, y: 0};
  var mouse = {x: -Infinity, y: -Infinity, element: null};
  var events = ['mousedown', 'click', 'scroll', 'resize', 'mousemove', 'mouseout'];
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

    // Check for access to event's type property
    try {
      e.type;
    } catch (e) {
      console.warn(e);
      return;
    }
    // Update Mouse Position
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
        // Get mouse coordinates
        // Update mouse coordinates
        client.x = e.clientX;
        client.y = e.clientY;
      default:
      var scrollOffset = getScrollOffset();
      mouse.x = client.x + scrollOffset.left;
      mouse.y = client.y + scrollOffset.top;
      mouse.element = e.target;


    }

    // Get Cursor Props
    invalidate.call(this);

    // Process Click
    switch (e.type) {
      case 'click':
        if (!clicking && cursorItem) {
          clicking = true;
          if (mouse.element && cursorItem && cursorItem.target && cursorItem.symbol !== mouse.element && isChildOf(cursorItem.container, mouse.element)) {
            //e.stopImmediatePropagation();
            //e.preventDefault();
            cursorItem.target.click();
          }
          var click = cursorItem && cursorItem.click;
          if (typeof click === 'function') {
            click.call(cursorItem.element, e);
          }
        }
        //e.stopPropagation();
        break;
    }
    // Update cursors
    render.call(instance);
  }

  // http://stackoverflow.com/questions/18663941/finding-closest-element-without-jquery
  // Fix IE
  function closest(el, selector) {
    var matchesFn;

    // find vendor prefix
    ['matches','webkitMatchesSelector','mozMatchesSelector','msMatchesSelector','oMatchesSelector'].some(function(fn) {
        if (typeof document.body[fn] == 'function') {
            matchesFn = fn;
            return true;
        }
        return false;
    });

    var parent;

    // traverse parents
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

    cursorItems = cursors.map(function(cursor, index) {
      return getCursorItem(cursor, cursorItems[index]);
    });

    var
      filtered = cursorItems.filter(function(cursorItem, index) {
        var mouseElement = mouse.element, symbol = cursorItem.symbol, bounds = cursorItem.bounds, container = cursorItem.container, result = false;
        // Detect if a mouse element exists and that it's not the symbol itself
        if (mouseElement) {
          // Check if mouse element is not contained in a link
          if (!mouseElement.href && !getParents(mouseElement, 'a').length) {
            // Detect if symbol is topmost element
            if (topmost(mouseElement, symbol) === symbol) {
              // Detect if mouse element is contained
              if (container === mouseElement || isChildOf(container, mouseElement)) {
                // Match bounds
                result = (mouse.x >= bounds.x && mouse.x <= bounds.x + bounds.width && mouse.y >= bounds.y && mouse.y <= bounds.y + bounds.height);
              }
            }
          }
        }
        return result;
      }),
      sorted = filtered.sort(function(a, b) {
        var zElement = topmost(a.symbol, b.symbol);
        if (zElement === a.symbol) {
          return -1;
        } else if (zElement === b.symbol) {
          return 1;
        }
        var p1 = {x: a.x + a.width / 2, y: a.y + a.height / 2};
        var p2 = {x: b.x + b.width / 2, y: b.y + b.height / 2};
        var d1 = Math.sqrt( Math.pow((p1.x - mouse.x), 2) + Math.pow((p1.y - mouse.y), 2) );
        var d2 = Math.sqrt( Math.pow((p2.x - mouse.x), 2) + Math.pow((p2.y - mouse.y), 2) );
        return d1 < d2 ? d1 : d1 > d2 ? d2 : 0;
      }).reverse();

    cursorItem = sorted[0];


    // Set MouseProviders
    setMouseProviders([window].concat(cursorItems.map(function(item) {
      return item.container;
    })));
    //setMouseProviders([window]);
  }

  function render() {

    cursorItems.forEach(function(item) {

      var
        symbol = item.symbol,
        style = {
          visibility: item === cursorItem ? '' : 'hidden',
          position: 'absolute',
          cursor: 'inherit'
        };

      if (item.style === 'transform' && transformStyle) {
        style[transformStyle + "Origin"] = '';
        style[transformStyle] = "";
      } else {
        style.left = "";
        style.top = "";
      }

      symbol.classList && !symbol.classList.contains("cursor") && symbol.classList.add("cursor");
      css(symbol, style);

      if (cursorItem === item) {

        var pos = getOffset(symbol);

        var px = pos.left;
        var py = pos.top;

        var off = item.offset;
        var x = Math.round((mouse.x - px) + off.left);
        var y = Math.round((mouse.y - py) + off.top);

        style = {
        };

        if (item.style === 'transform' && transformStyle) {
          style[transformStyle + "Origin"] = '0 0';
          style[transformStyle] = "translate3d(" + x + "px," + y + "px, 0) scale(" + item.scale + "," + item.scale + ")";
        } else {
          style.left = (x + pos.left) + "px";
          style.top = (y + pos.top) + "px";
        }

        css(symbol, style);
      }


      if (item === cursorItem) {
        symbol.classList && !symbol.classList.contains("cursor-active") && symbol.classList.add("cursor-active");
        symbol.classList && symbol.classList.contains("cursor-hidden") && symbol.classList.remove("cursor-hidden");
      } else {
        symbol.classList && symbol.classList.contains("cursor-active") && symbol.classList.remove("cursor-active");
        symbol.classList && !symbol.classList.contains("cursor-hidden") && symbol.classList.add("cursor-hidden");
      }

    });
  };

  this.update = function() {
    invalidate.call(this);
    render.call(this);
  };

  this.add = function(cursor) {
    if (cursors.indexOf(cursor) === -1) {
      cursors.push(cursor);
      this.update();
    }
  };

  this.remove = function(cursor) {
    cursors.splice(cursors.indexOf(cursor), 1);
    this.update();
  };

  var mouseProviders = [];
  function setMouseProviders(elements) {
    elements = elements.filter(function(n) { return (n); });
    mouseProviders.forEach(function(element) {
      if (elements.indexOf(element) === -1) {
        removeMouseListeners(element);
      }
    });
    elements.forEach(function(element) {
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

  var
    element = cursor.get('element'),
    props = cursor.get(),
    symbol = props.symbol,
    bounds = props.bounds,
    offset = props.offset,
    style = props.style,
    scale = props.scale,
    target = props.target || symbol.nodeName.toLowerCase() === 'a' ? symbol : element,
    container,
    display = element.style.display;

  // Force visibility to get things measured
  css(element, {
    display: ''
  });

  //
  props = cursor.get();

  symbol = props.symbol;
  bounds = props.bounds;
  offset = props.offset;
  style = props.style;
  scale = props.scale;
  target = props.target || symbol.nodeName.toLowerCase() === 'a' ? symbol : element;

  // Add cursor symbol to dom
  if (!symbol.parentNode) {
    element.appendChild(symbol);
  }

  // Get bounds and container
  if (bounds && bounds.getBoundingClientRect) {
    // Element bounds
    container = bounds;
    bounds = getBoundingRect(bounds);
  } else {
    // Object bounds: Either choose symbol's, element's offsetParent or root as container
    // FIXME: Descendants of body with position: fixed wouldn't have offsetParent: http://stackoverflow.com/questions/306305/what-would-make-offsetparent-null
    container = symbol.offsetParent || element && element === symbol ? element.offsetParent || document.documentElement : element;
    var rect = getBoundingRect(container);

    var containerPos = getOffset(container) || {x: 0, y: 0};
    // Process custom function
    if (typeof bounds === 'function') {
      bounds = bounds.apply(element, [container]);
    }
    // Get percent values
    var x = typeof bounds.x === 'string' && bounds.x.indexOf("%") >= 0 ? parseFloat(bounds.x) * rect.width / 100 : parseFloat(bounds.x);
    var y = typeof bounds.y === 'string' && bounds.y.indexOf("%") >= 0 ? parseFloat(bounds.y) * rect.height / 100 : parseFloat(bounds.y);
    var width = typeof bounds.width === 'string' && bounds.width.indexOf("%") >= 0 ? parseFloat(bounds.width) * rect.width / 100 : parseFloat(bounds.width);
    var height = typeof bounds.height === 'string' && bounds.height.indexOf("%") >= 0 ? parseFloat(bounds.height) * rect.height / 100 : parseFloat(bounds.height);
    bounds = {
      x: containerPos.left + x,
      y: containerPos.top + y,
      width: width,
      height: height
    };
  }

  // Reset visibility
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

},{"./merge":4,"./topmost":5}],4:[function(require,module,exports){
module.exports = function() {
  var obj = {},
    i = 0,
    il = arguments.length,
    key;
  for (; i < il; i++) {
    for (key in arguments[i]) {
      if (arguments[i].hasOwnProperty(key)) {
          obj[key] = arguments[i][key];
      }
    }
  }
  return obj;
};
},{}],5:[function(require,module,exports){
var 

  getStyle = function(el, cssprop){
    if (el.style)
      if (el.currentStyle) //IE
        return el.currentStyle[cssprop];
      else if (document.defaultView && document.defaultView.getComputedStyle) //Firefox
        return document.defaultView.getComputedStyle(el, "")[cssprop];
      else //try and get inline style
        return el.style[cssprop];
  },
  
  getZIndex = function(el) {
    var zIndex = parseFloat(getStyle(el, 'zIndex'));
    zIndex = !isNaN(zIndex) ? zIndex : 0;
    if (zIndex === 0) {
      if (el.parentNode) {
        return getZIndex(el.parentNode);
      }
    }
    return zIndex;
  },
  
  isChildOf = function(parent, child) {
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


// Compare Visibility, returns -1, 1 or 0
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

// Compare Z-Index, returns -1, 1 or 0
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


// Compare Z-Index, returns -1, 1 or 0
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

// Compare Position - MIT Licensed, John Resig
function comparePosition(a, b){
  return a.compareDocumentPosition ?
    a.compareDocumentPosition(b) :
    a.contains ?
      (a != b && a.contains(b) && 16) +
        (a != b && b.contains(a) && 8) +
        (a.sourceIndex >= 0 && b.sourceIndex >= 0 ?
          (a.sourceIndex < b.sourceIndex && 4) +
            (a.sourceIndex > b.sourceIndex && 2) :
          1) +
      0 :
      0;
}

module.exports = function(a, b) {
  // Compare Visibility
  var visibility = compareVisibility(a, b);
  if (visibility !== 0) {
    return visibility < 0 ? a : b;
  } 
  
  // Compare parent/child relation
  if (isChildOf(a, b)) {
    // if b is contained in a, it's always on top
    return b;
  }
  
  // Compare Z-Index Stack
  var zIndexComparisonResult = compareZIndex(a, b);
  if (zIndexComparisonResult === -1) {
    // a is on top
    return a;
  }
  if (zIndexComparisonResult === 1) {
    // b is on top
    return b;
  }
  // TODO: Compare Ancestor Position Stack
  
  // Compare Document Position
  var documentPositionResult = comparePosition(a, b);
  if (documentPositionResult === 2) {
    // a is preceding
    return a;
  }
  if (documentPositionResult === 4) {
    // b is following
    return b;
  }
  
  return a;
};
},{}]},{},[1])(1)
});
//# sourceMappingURL=data:application/json;charset:utf-8;base64,eyJ2ZXJzaW9uIjozLCJzb3VyY2VzIjpbIm5vZGVfbW9kdWxlcy9icm93c2VyLXBhY2svX3ByZWx1ZGUuanMiLCJzcmMvY3Vyem9yeS5qcyIsInNyYy9saWIvQ3Vyc29yLmpzIiwic3JjL2xpYi9DdXJzb3JNYW5hZ2VyLmpzIiwic3JjL2xpYi9tZXJnZS5qcyIsInNyYy9saWIvdG9wbW9zdC5qcyJdLCJuYW1lcyI6W10sIm1hcHBpbmdzIjoiQUFBQTtBQ0FBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBOztBQ1RBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTs7QUMzR0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7O0FDbmVBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7O0FDYkE7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQSIsImZpbGUiOiJnZW5lcmF0ZWQuanMiLCJzb3VyY2VSb290IjoiIiwic291cmNlc0NvbnRlbnQiOlsiKGZ1bmN0aW9uIGUodCxuLHIpe2Z1bmN0aW9uIHMobyx1KXtpZighbltvXSl7aWYoIXRbb10pe3ZhciBhPXR5cGVvZiByZXF1aXJlPT1cImZ1bmN0aW9uXCImJnJlcXVpcmU7aWYoIXUmJmEpcmV0dXJuIGEobywhMCk7aWYoaSlyZXR1cm4gaShvLCEwKTt2YXIgZj1uZXcgRXJyb3IoXCJDYW5ub3QgZmluZCBtb2R1bGUgJ1wiK28rXCInXCIpO3Rocm93IGYuY29kZT1cIk1PRFVMRV9OT1RfRk9VTkRcIixmfXZhciBsPW5bb109e2V4cG9ydHM6e319O3Rbb11bMF0uY2FsbChsLmV4cG9ydHMsZnVuY3Rpb24oZSl7dmFyIG49dFtvXVsxXVtlXTtyZXR1cm4gcyhuP246ZSl9LGwsbC5leHBvcnRzLGUsdCxuLHIpfXJldHVybiBuW29dLmV4cG9ydHN9dmFyIGk9dHlwZW9mIHJlcXVpcmU9PVwiZnVuY3Rpb25cIiYmcmVxdWlyZTtmb3IodmFyIG89MDtvPHIubGVuZ3RoO28rKylzKHJbb10pO3JldHVybiBzfSkiLCJ2YXJcbiAgQ3Vyc29yTWFuYWdlciA9IHJlcXVpcmUoJy4vbGliL0N1cnNvck1hbmFnZXInKSxcbiAgQ3Vyc29yID0gcmVxdWlyZSgnLi9saWIvQ3Vyc29yJyk7XG4gIGN1cnNvck1hbmFnZXIgPSBuZXcgQ3Vyc29yTWFuYWdlcigpO1xuXG5tb2R1bGUuZXhwb3J0cyA9IGZ1bmN0aW9uIGN1cnpvcnkoZWxlbWVudCwgb3B0aW9ucykge1xuICB2YXIgY3Vyc29yID0gbmV3IEN1cnNvcihlbGVtZW50LCBvcHRpb25zKTtcbiAgY3Vyc29yTWFuYWdlci5hZGQoY3Vyc29yKTtcbiAgcmV0dXJuIGN1cnNvcjtcbn07IiwidmFyXG4gIG1lcmdlID0gcmVxdWlyZSgnLi9tZXJnZScpLFxuICBcbiAgY3JlYXRlRWxlbWVudCA9IGZ1bmN0aW9uKHN0cmluZykge1xuICAgIHZhciBlbGVtZW50ID0gZG9jdW1lbnQuY3JlYXRlRWxlbWVudCgnZGl2Jyk7XG4gICAgZWxlbWVudC5pbm5lckhUTUwgPSBzdHJpbmc7XG4gICAgdmFyIHJlc3VsdCA9IGVsZW1lbnQuZmlyc3RDaGlsZDtcbiAgICBlbGVtZW50LnJlbW92ZUNoaWxkKHJlc3VsdCk7XG4gICAgcmV0dXJuIHJlc3VsdDtcbiAgfSxcblxuICBpc0hUTUwgPSBmdW5jdGlvbihzdHJpbmcpIHtcbiAgICByZXR1cm4gdHlwZW9mIHN0cmluZyA9PT0gJ3N0cmluZycgJiYgc3RyaW5nLm1hdGNoKC88XFwvP1xcdysoKFxccytcXHcrKFxccyo9XFxzKig/OlwiLio/XCJ8Jy4qPyd8W14nXCI+XFxzXSspKT8pK1xccyp8XFxzKilcXC8/Pi8pO1xuICB9LFxuICBcblxuICBnZXRFbGVtZW50ID0gZnVuY3Rpb24odmFsdWUsIHBhcmVudCkge1xuICAgIHZhbHVlID0gdmFsdWUudG9BcnJheSA/IHZhbHVlLnRvQXJyYXkoKVswXSA6IHZhbHVlIGluc3RhbmNlb2YgQXJyYXkgPyB2YWx1ZVswXSA6IHZhbHVlO1xuICAgIGlmICh0eXBlb2YgdmFsdWUgPT09ICdmdW5jdGlvbicpIHtcbiAgICAgIHZhbHVlID0gdmFsdWUuY2FsbCh0aGlzLCB2YWx1ZSk7XG4gICAgfVxuICAgIGlmICh0eXBlb2YgdmFsdWUgPT09ICdzdHJpbmcnKSB7XG4gICAgICBpZiAoaXNIVE1MKHZhbHVlKSkge1xuICAgICAgICB2YWx1ZSA9IGNyZWF0ZUVsZW1lbnQodmFsdWUpO1xuICAgICAgfSBlbHNlIHtcbiAgICAgICAgdmFsdWUgPSBwYXJlbnQucXVlcnlTZWxlY3Rvcih2YWx1ZSk7XG4gICAgICB9XG4gICAgfVxuICAgIGlmICh2YWx1ZSAmJiB2YWx1ZS5ub2RlTmFtZSkge1xuICAgICAgcmV0dXJuIHZhbHVlO1xuICAgIH1cbiAgICByZXR1cm4gbnVsbDtcbiAgfTtcblxubW9kdWxlLmV4cG9ydHMgPSBmdW5jdGlvbiBDdXJzb3IoZWxlbWVudCwgb3B0aW9ucykge1xuICAgIFxuICBmdW5jdGlvbiBzZXQobmFtZSwgdmFsdWUpIHtcbiAgICB2YXIgb3B0cztcbiAgICBpZiAodHlwZW9mIG5hbWUgPT09ICdvYmplY3QnKSB7XG4gICAgICBvcHRzID0gbmFtZTtcbiAgICB9IGVsc2Uge1xuICAgICAgb3B0cyA9IHt9O1xuICAgICAgb3B0c1tuYW1lXSA9IHZhbHVlO1xuICAgIH1cbiAgICBmb3IgKG5hbWUgaW4gb3B0cykge1xuICAgICAgdmFsdWUgPSBvcHRzW25hbWVdO1xuICAgICAgc3dpdGNoIChuYW1lKSB7XG4gICAgICAgIGNhc2UgJ2VsZW1lbnQnOlxuICAgICAgICBjYXNlICdzeW1ib2wnOlxuICAgICAgICAgIGlmIChpc0hUTUwodmFsdWUpKSB7XG4gICAgICAgICAgICB2YWx1ZSA9IGNyZWF0ZUVsZW1lbnQodmFsdWUpO1xuICAgICAgICAgIH1cbiAgICAgICAgICBicmVhaztcbiAgICAgIH1cbiAgICAgIG9wdHNbbmFtZV0gPSB2YWx1ZTtcbiAgICB9XG4gICAgb3B0aW9ucyA9IG1lcmdlKG9wdGlvbnMsIG9wdHMpO1xuICB9O1xuICBcbiAgdGhpcy5zZXQgPSBmdW5jdGlvbigpIHtcbiAgICBzZXQuY2FsbCh0aGlzLCBhcmd1bWVudHMpO1xuICAgIGN1cnNvck1hbmFnZXIudXBkYXRlKCk7XG4gIH07XG4gIFxuICB0aGlzLmdldCA9IGZ1bmN0aW9uKG5hbWUpIHtcbiAgICB2YXIgdmFsdWU7XG4gICAgaWYgKCFuYW1lKSB7XG4gICAgICB2YWx1ZSA9IHt9O1xuICAgICAgZm9yICh2YXIgeCBpbiBvcHRpb25zKSB7XG4gICAgICAgIHZhbHVlW3hdID0gdGhpcy5nZXQoeCk7XG4gICAgICB9XG4gICAgfSBlbHNlIHtcbiAgICAgIHZhbHVlID0gb3B0aW9uc1tuYW1lXTtcbiAgICAgIHN3aXRjaCAobmFtZSkge1xuICAgICAgICBjYXNlICdlbGVtZW50JzpcbiAgICAgICAgY2FzZSAnc3ltYm9sJzpcbiAgICAgICAgY2FzZSAnYm91bmRzJzpcbiAgICAgICAgY2FzZSAndGFyZ2V0JzpcbiAgICAgICAgICB2YWx1ZSA9IHZhbHVlICYmIHZhbHVlLnRvQXJyYXkgPyB2YWx1ZS50b0FycmF5KClbMF0gOiB2YWx1ZSBpbnN0YW5jZW9mIEFycmF5ID8gdmFsdWVbMF0gOiB2YWx1ZTtcbiAgICAgICAgICB2YWx1ZSA9IHR5cGVvZiB2YWx1ZSA9PT0gJ3N0cmluZycgPyAoZWxlbWVudCB8fCBkb2N1bWVudCkucXVlcnlTZWxlY3Rvcih2YWx1ZSkgOiB2YWx1ZTtcbiAgICAgICAgICBicmVhaztcbiAgICAgIH1cbiAgICAgIHN3aXRjaCAobmFtZSkge1xuICAgICAgICBjYXNlICdzeW1ib2wnOlxuICAgICAgICAgIHZhbHVlID0gdmFsdWUgfHwgdGhpcy5nZXQoJ2VsZW1lbnQnKTtcbiAgICAgICAgICBicmVhaztcbiAgICAgICAgY2FzZSAnYm91bmRzJzpcbiAgICAgICAgICB2YWx1ZSA9IHZhbHVlID8gdmFsdWUgOiBvcHRpb25zWydzeW1ib2wnXSA/IHRoaXMuZ2V0KCdlbGVtZW50JykgOiB0aGlzLmdldCgnZWxlbWVudCcpLm9mZnNldFBhcmVudDtcbiAgICAgICAgICBicmVhaztcbiAgICAgIH1cbiAgICB9XG4gICAgcmV0dXJuIHZhbHVlO1xuICB9O1xuICBcbiAgc2V0KG1lcmdlKHtcbiAgICBlbGVtZW50OiBudWxsLFxuICAgIG9mZnNldDoge2xlZnQ6IDgsIHRvcDogNn0sXG4gICAgc3R5bGU6ICd0cmFuc2Zvcm0nLFxuICAgIHNjYWxlOiAxLFxuICAgIGJvdW5kczogbnVsbCxcbiAgICBzeW1ib2w6IG51bGwsXG4gICAgdGFyZ2V0OiBudWxsLFxuICAgIGhpZGVPbkZvY3VzOiBmYWxzZVxuICB9LCBvcHRpb25zLCB7XG4gICAgZWxlbWVudDogZWxlbWVudFxuICB9KSk7XG4gIFxufTsiLCJ2YXJcblxuICBtZXJnZSA9IHJlcXVpcmUoJy4vbWVyZ2UnKSxcbiAgdG9wbW9zdCA9IHJlcXVpcmUoJy4vdG9wbW9zdCcpLFxuXG4gIC8qKlxuICAgKiBIeXBoZW5hdGUgYSBzdHJpbmdcbiAgICogQHBhcmFtIHtTdHJpbmd9IHN0cmluZ1xuICAgKi9cbiAgaHlwaGVuYXRlID0gKGZ1bmN0aW9uKCkge1xuICAgIHZhciBjYWNoZSA9IHt9O1xuICAgIHJldHVybiBmdW5jdGlvbihzdHJpbmcpIHtcbiAgICAgIHJldHVybiBjYWNoZVtzdHJpbmddID0gY2FjaGVbc3RyaW5nXSB8fCAoZnVuY3Rpb24oKSB7XG4gICAgICAgIHJldHVybiBzdHJpbmcucmVwbGFjZSgvKFtBLVpdKS9nLCBmdW5jdGlvbigkMSl7cmV0dXJuIFwiLVwiKyQxLnRvTG93ZXJDYXNlKCk7fSk7XG4gICAgICB9KSgpO1xuICAgIH07XG4gIH0pKCksXG5cbiAgZ2V0U3R5bGUgPSBmdW5jdGlvbihlbCwgY3NzcHJvcCl7XG4gICBpZiAoZWwuY3VycmVudFN0eWxlKSAvL0lFXG4gICAgcmV0dXJuIGVsLmN1cnJlbnRTdHlsZVtjc3Nwcm9wXTtcbiAgIGVsc2UgaWYgKGRvY3VtZW50LmRlZmF1bHRWaWV3ICYmIGRvY3VtZW50LmRlZmF1bHRWaWV3LmdldENvbXB1dGVkU3R5bGUpIC8vRmlyZWZveFxuICAgIHJldHVybiBkb2N1bWVudC5kZWZhdWx0Vmlldy5nZXRDb21wdXRlZFN0eWxlKGVsLCBcIlwiKVtjc3Nwcm9wXTtcbiAgIGVsc2UgLy90cnkgYW5kIGdldCBpbmxpbmUgc3R5bGVcbiAgICByZXR1cm4gZWwuc3R5bGVbY3NzcHJvcF07XG4gIH0sXG5cbiAgdHJhbnNmb3JtU3R5bGUgPSAoZnVuY3Rpb24ocHJvcCwgcHJlZml4ZXMpIHtcbiAgICB2YXIgaSxcbiAgICAgIGVsZW0gPSBkb2N1bWVudC5jcmVhdGVFbGVtZW50KCdkaXYnKSxcbiAgICAgIGNhcGl0YWxpemVkID0gcHJvcC5jaGFyQXQoMCkudG9VcHBlckNhc2UoKSArIHByb3Auc2xpY2UoMSk7XG4gICAgZm9yIChpID0gMDsgaSA8IHByZWZpeGVzLmxlbmd0aDsgaSsrKSB7XG4gICAgICBpZiAodHlwZW9mIGVsZW0uc3R5bGVbcHJlZml4ZXNbaV0gKyBjYXBpdGFsaXplZF0gIT09IFwidW5kZWZpbmVkXCIpIHtcbiAgICAgICAgcmV0dXJuIHByZWZpeGVzW2ldICsgY2FwaXRhbGl6ZWQ7XG4gICAgICB9XG4gICAgfVxuICAgIHJldHVybiBudWxsO1xuICB9KSgndHJhbnNmb3JtJywgWycnLCAnTW96JywgJ1dlYmtpdCcsICdPJywgJ01zJ10pLFxuXG4gIGlzQ2hpbGRPZiA9IGZ1bmN0aW9uKHBhcmVudCwgY2hpbGQpIHtcbiAgIGlmICghY2hpbGQgfHwgIXBhcmVudCkge1xuICAgICByZXR1cm4gZmFsc2U7XG4gICB9XG4gICB2YXIgbm9kZSA9IGNoaWxkLnBhcmVudE5vZGU7XG4gICB3aGlsZSAobm9kZSAhPSBudWxsKSB7XG4gICAgIGlmIChub2RlID09IHBhcmVudCkge1xuICAgICAgICAgcmV0dXJuIHRydWU7XG4gICAgIH1cbiAgICAgbm9kZSA9IG5vZGUucGFyZW50Tm9kZTtcbiAgIH1cbiAgIHJldHVybiBmYWxzZTtcbiAgfSxcblxuICBjc3MgPSBmdW5jdGlvbihlbGVtLCBuYW1lLCB2YWx1ZSkge1xuICAgIHZhciBtYXAgPSB7fSwgY3NzVGV4dCA9IG51bGw7XG4gICAgaWYgKHR5cGVvZiBuYW1lID09PSAnb2JqZWN0Jykge1xuICAgICAgbWFwID0gbmFtZTtcbiAgICB9IGVsc2UgaWYgKHR5cGVvZiB2YWx1ZSAhPT0gXCJ1bmRlZmluZWRcIikge1xuICAgICAgbWFwW25hbWVdID0gdmFsdWU7XG4gICAgfVxuICAgIHZhciBrZXlzID0gT2JqZWN0LmtleXMobWFwKTtcbiAgICBrZXlzID0ga2V5cy5maWx0ZXIoZnVuY3Rpb24oa2V5LCBpbmRleCkge1xuICAgICAgaWYgKG1hcFtrZXldID09PSAnJykge1xuICAgICAgICBlbGVtLnN0eWxlW2tleV0gPSBtYXBba2V5XTtcbiAgICAgICAgcmV0dXJuIGZhbHNlO1xuICAgICAgfVxuICAgICAgcmV0dXJuIHRydWU7XG4gICAgfSk7XG4gICAgY3NzVGV4dCA9IGtleXMubWFwKGZ1bmN0aW9uKG5hbWUpIHtcbiAgICAgIHJldHVybiBoeXBoZW5hdGUobmFtZSkgKyBcIjogXCIgKyBtYXBbbmFtZV07XG4gICAgfSkuam9pbihcIjsgXCIpO1xuICAgIGlmIChjc3NUZXh0ICYmIGNzc1RleHQubGVuZ3RoKSB7XG4gICAgICBlbGVtLnN0eWxlLmNzc1RleHQgPSBlbGVtLnN0eWxlLmNzc1RleHQgKyBjc3NUZXh0O1xuICAgICAgcmV0dXJuIG51bGw7XG4gICAgfVxuICAgIHJldHVybiBlbGVtLnN0eWxlW25hbWVdIHx8IHdpbmRvdy5nZXRDb21wdXRlZFN0eWxlKGVsZW0sIG51bGwpLmdldFByb3BlcnR5VmFsdWUobmFtZSk7XG4gIH0sXG5cbiAgZ2V0T2Zmc2V0ID0gZnVuY3Rpb24oZWxlbWVudCkge1xuICAgIHZhclxuICAgICAgc2Nyb2xsT2Zmc2V0ID0gZ2V0U2Nyb2xsT2Zmc2V0KCksXG4gICAgICByZWN0ID0gZWxlbWVudC5nZXRCb3VuZGluZ0NsaWVudFJlY3QoKTtcbiAgICByZXR1cm4ge1xuICAgICAgdG9wOiByZWN0LnRvcCArIHNjcm9sbE9mZnNldC50b3AsXG4gICAgICBsZWZ0OiByZWN0LmxlZnQgKyBzY3JvbGxPZmZzZXQubGVmdFxuICAgIH07XG4gIH0sXG5cbiAgZ2V0U2Nyb2xsT2Zmc2V0ID0gZnVuY3Rpb24oKSB7XG4gICAgcmV0dXJuIHtcbiAgICAgIGxlZnQ6IGRvY3VtZW50LmJvZHkgJiYgZG9jdW1lbnQuYm9keS5zY3JvbGxMZWZ0ICsgZG9jdW1lbnQuZG9jdW1lbnRFbGVtZW50LnNjcm9sbExlZnQsXG4gICAgICB0b3A6IGRvY3VtZW50LmJvZHkgJiYgZG9jdW1lbnQuYm9keS5zY3JvbGxUb3AgKyBkb2N1bWVudC5kb2N1bWVudEVsZW1lbnQuc2Nyb2xsVG9wXG4gICAgfTtcbiAgfSxcblxuICBnZXRCb3VuZGluZ1JlY3QgPSBmdW5jdGlvbihlbGVtZW50KSB7XG4gICAgaWYgKCFlbGVtZW50KSB7XG4gICAgICByZXR1cm4ge1xuICAgICAgICB4OiAtSW5maW5pdHksXG4gICAgICAgIHk6IC1JbmZpbml0eSxcbiAgICAgICAgd2lkdGg6IEluZmluaXR5LFxuICAgICAgICBoZWlnaHQ6IEluZmluaXR5XG4gICAgICB9O1xuICAgIH1cbiAgICB2YXIgc2Nyb2xsT2Zmc2V0ID0gZ2V0U2Nyb2xsT2Zmc2V0KCk7XG4gICAgdmFyIHJlY3QgPSBlbGVtZW50LmdldEJvdW5kaW5nQ2xpZW50UmVjdCgpO1xuICAgIHJldHVybiB7XG4gICAgICB4OiByZWN0LmxlZnQgKyBzY3JvbGxPZmZzZXQubGVmdCxcbiAgICAgIHk6IHJlY3QudG9wICsgc2Nyb2xsT2Zmc2V0LnRvcCxcbiAgICAgIHdpZHRoOiByZWN0LndpZHRoLFxuICAgICAgaGVpZ2h0OiByZWN0LmhlaWdodFxuICAgIH07XG4gIH0sXG5cbiAgLy8gRGVjbGFyZSBzaW5nbGV0b24gaW5zdGFuY2VcbiAgaW5zdGFuY2UgPSBudWxsO1xuXG4vKipcbiAqIEN1cnNvck1hbmFnZXJcbiAqIFRoaXMgc2luZ2xldG9uIGNsYXNzIGhhbmRsZXMgYWxsIGN1cnNvciBvYmplY3RzXG4gKiBAcGFyYW0ge09iamVjdH0gb3B0aW9uc1xuICovXG5mdW5jdGlvbiBDdXJzb3JNYW5hZ2VyKG9wdGlvbnMpIHtcbiAgLy8gU2luZ2xldG9uIHBhdHRlcm5cbiAgaWYgKGluc3RhbmNlKSB7XG4gICAgaW5zdGFuY2Uuc2V0KG9wdGlvbnMpO1xuICAgIHJldHVybiBpbnN0YW5jZTtcbiAgfVxuICBpbnN0YW5jZSA9IHRoaXM7XG4gIC8vIEltcGxlbWVudGF0aW9uXG5cbiAgdmFyIGN1cnNvcnMgPSBbXTtcbiAgdmFyIGNsaWVudCA9IHt4OiAwLCB5OiAwfTtcbiAgdmFyIG1vdXNlID0ge3g6IC1JbmZpbml0eSwgeTogLUluZmluaXR5LCBlbGVtZW50OiBudWxsfTtcbiAgdmFyIGV2ZW50cyA9IFsnbW91c2Vkb3duJywgJ2NsaWNrJywgJ3Njcm9sbCcsICdyZXNpemUnLCAnbW91c2Vtb3ZlJywgJ21vdXNlb3V0J107XG4gIHZhciBjdXJzb3JJdGVtcyA9IFtdO1xuICB2YXIgY3Vyc29ySXRlbSA9IG51bGw7XG4gIHZhciBjbGlja2luZyA9IGZhbHNlO1xuICB2YXIgY2xpY2thYmxlID0gdHJ1ZTtcblxuICBmdW5jdGlvbiBpbml0KCkge1xuICAgIGlmICghKCdvbnRvdWNoJyBpbiB3aW5kb3cpKSB7XG4gICAgICBhZGRNb3VzZUxpc3RlbmVycyh3aW5kb3cpO1xuICAgIH1cbiAgfVxuXG4gIGZ1bmN0aW9uIGhhbmRsZUV2ZW50KGUpIHtcblxuICAgIC8vIENoZWNrIGZvciBhY2Nlc3MgdG8gZXZlbnQncyB0eXBlIHByb3BlcnR5XG4gICAgdHJ5IHtcbiAgICAgIGUudHlwZTtcbiAgICB9IGNhdGNoIChlKSB7XG4gICAgICBjb25zb2xlLndhcm4oZSk7XG4gICAgICByZXR1cm47XG4gICAgfVxuICAgIC8vIFVwZGF0ZSBNb3VzZSBQb3NpdGlvblxuICAgIHN3aXRjaCAoZS50eXBlKSB7XG4gICAgICBjYXNlICdtb3VzZWRvd24nOlxuICAgICAgICBjbGlja2luZyA9IGZhbHNlO1xuICAgICAgICBicmVhaztcbiAgICAgIGNhc2UgJ21vdXNlb3V0JzpcbiAgICAgICAgdmFyIHJlbGF0ZWRUYXJnZXQgPSB0eXBlb2YgZS50b0VsZW1lbnQgIT0gJ3VuZGVmaW5lZCcgPyBlLnRvRWxlbWVudCA6IGUucmVsYXRlZFRhcmdldDtcbiAgICAgICAgaWYgKHJlbGF0ZWRUYXJnZXQgPT09IG51bGwpIHtcbiAgICAgICAgICBtb3VzZS54ID0gLUluZmluaXR5O1xuICAgICAgICAgIG1vdXNlLnkgPSAtSW5maW5pdHk7XG4gICAgICAgICAgbW91c2UuZWxlbWVudCA9IG51bGw7XG4gICAgICAgIH1cbiAgICAgICAgYnJlYWs7XG4gICAgICBjYXNlICdtb3VzZW1vdmUnOlxuICAgICAgICAvLyBHZXQgbW91c2UgY29vcmRpbmF0ZXNcbiAgICAgICAgLy8gVXBkYXRlIG1vdXNlIGNvb3JkaW5hdGVzXG4gICAgICAgIGNsaWVudC54ID0gZS5jbGllbnRYO1xuICAgICAgICBjbGllbnQueSA9IGUuY2xpZW50WTtcbiAgICAgIGRlZmF1bHQ6XG4gICAgICB2YXIgc2Nyb2xsT2Zmc2V0ID0gZ2V0U2Nyb2xsT2Zmc2V0KCk7XG4gICAgICBtb3VzZS54ID0gY2xpZW50LnggKyBzY3JvbGxPZmZzZXQubGVmdDtcbiAgICAgIG1vdXNlLnkgPSBjbGllbnQueSArIHNjcm9sbE9mZnNldC50b3A7XG4gICAgICBtb3VzZS5lbGVtZW50ID0gZS50YXJnZXQ7XG5cblxuICAgIH1cblxuICAgIC8vIEdldCBDdXJzb3IgUHJvcHNcbiAgICBpbnZhbGlkYXRlLmNhbGwodGhpcyk7XG5cbiAgICAvLyBQcm9jZXNzIENsaWNrXG4gICAgc3dpdGNoIChlLnR5cGUpIHtcbiAgICAgIGNhc2UgJ2NsaWNrJzpcbiAgICAgICAgaWYgKCFjbGlja2luZyAmJiBjdXJzb3JJdGVtKSB7XG4gICAgICAgICAgY2xpY2tpbmcgPSB0cnVlO1xuICAgICAgICAgIGlmIChtb3VzZS5lbGVtZW50ICYmIGN1cnNvckl0ZW0gJiYgY3Vyc29ySXRlbS50YXJnZXQgJiYgY3Vyc29ySXRlbS5zeW1ib2wgIT09IG1vdXNlLmVsZW1lbnQgJiYgaXNDaGlsZE9mKGN1cnNvckl0ZW0uY29udGFpbmVyLCBtb3VzZS5lbGVtZW50KSkge1xuICAgICAgICAgICAgLy9lLnN0b3BJbW1lZGlhdGVQcm9wYWdhdGlvbigpO1xuICAgICAgICAgICAgLy9lLnByZXZlbnREZWZhdWx0KCk7XG4gICAgICAgICAgICBjdXJzb3JJdGVtLnRhcmdldC5jbGljaygpO1xuICAgICAgICAgIH1cbiAgICAgICAgICB2YXIgY2xpY2sgPSBjdXJzb3JJdGVtICYmIGN1cnNvckl0ZW0uY2xpY2s7XG4gICAgICAgICAgaWYgKHR5cGVvZiBjbGljayA9PT0gJ2Z1bmN0aW9uJykge1xuICAgICAgICAgICAgY2xpY2suY2FsbChjdXJzb3JJdGVtLmVsZW1lbnQsIGUpO1xuICAgICAgICAgIH1cbiAgICAgICAgfVxuICAgICAgICAvL2Uuc3RvcFByb3BhZ2F0aW9uKCk7XG4gICAgICAgIGJyZWFrO1xuICAgIH1cbiAgICAvLyBVcGRhdGUgY3Vyc29yc1xuICAgIHJlbmRlci5jYWxsKGluc3RhbmNlKTtcbiAgfVxuXG4gIC8vIGh0dHA6Ly9zdGFja292ZXJmbG93LmNvbS9xdWVzdGlvbnMvMTg2NjM5NDEvZmluZGluZy1jbG9zZXN0LWVsZW1lbnQtd2l0aG91dC1qcXVlcnlcbiAgLy8gRml4IElFXG4gIGZ1bmN0aW9uIGNsb3Nlc3QoZWwsIHNlbGVjdG9yKSB7XG4gICAgdmFyIG1hdGNoZXNGbjtcblxuICAgIC8vIGZpbmQgdmVuZG9yIHByZWZpeFxuICAgIFsnbWF0Y2hlcycsJ3dlYmtpdE1hdGNoZXNTZWxlY3RvcicsJ21vek1hdGNoZXNTZWxlY3RvcicsJ21zTWF0Y2hlc1NlbGVjdG9yJywnb01hdGNoZXNTZWxlY3RvciddLnNvbWUoZnVuY3Rpb24oZm4pIHtcbiAgICAgICAgaWYgKHR5cGVvZiBkb2N1bWVudC5ib2R5W2ZuXSA9PSAnZnVuY3Rpb24nKSB7XG4gICAgICAgICAgICBtYXRjaGVzRm4gPSBmbjtcbiAgICAgICAgICAgIHJldHVybiB0cnVlO1xuICAgICAgICB9XG4gICAgICAgIHJldHVybiBmYWxzZTtcbiAgICB9KTtcblxuICAgIHZhciBwYXJlbnQ7XG5cbiAgICAvLyB0cmF2ZXJzZSBwYXJlbnRzXG4gICAgd2hpbGUgKGVsKSB7XG4gICAgICAgIHBhcmVudCA9IGVsLnBhcmVudEVsZW1lbnQ7XG4gICAgICAgIGlmIChwYXJlbnQgJiYgcGFyZW50W21hdGNoZXNGbl0oc2VsZWN0b3IpKSB7XG4gICAgICAgICAgICByZXR1cm4gcGFyZW50O1xuICAgICAgICB9XG4gICAgICAgIGVsID0gcGFyZW50O1xuICAgIH1cblxuICAgIHJldHVybiBudWxsO1xuICB9XG5cbiAgZnVuY3Rpb24gZ2V0UGFyZW50cyhlbGVtZW50LCBzZWxlY3Rvcikge1xuICAgIHZhciBwYXJlbnRzID0gW107XG4gICAgdmFyIHBhcmVudCA9IGVsZW1lbnQ7XG4gICAgd2hpbGUgKHBhcmVudCA9IHBhcmVudC5wYXJlbnRFbGVtZW50ICYmIGNsb3Nlc3QocGFyZW50LnBhcmVudEVsZW1lbnQsIHNlbGVjdG9yKSkge1xuICAgICAgcGFyZW50cy5wdXNoKHBhcmVudCk7XG4gICAgfVxuICAgIHJldHVybiBwYXJlbnRzO1xuICB9XG5cbiAgZnVuY3Rpb24gaW52YWxpZGF0ZSgpIHtcblxuICAgIGN1cnNvckl0ZW1zID0gY3Vyc29ycy5tYXAoZnVuY3Rpb24oY3Vyc29yLCBpbmRleCkge1xuICAgICAgcmV0dXJuIGdldEN1cnNvckl0ZW0oY3Vyc29yLCBjdXJzb3JJdGVtc1tpbmRleF0pO1xuICAgIH0pO1xuXG4gICAgdmFyXG4gICAgICBmaWx0ZXJlZCA9IGN1cnNvckl0ZW1zLmZpbHRlcihmdW5jdGlvbihjdXJzb3JJdGVtLCBpbmRleCkge1xuICAgICAgICB2YXIgbW91c2VFbGVtZW50ID0gbW91c2UuZWxlbWVudCwgc3ltYm9sID0gY3Vyc29ySXRlbS5zeW1ib2wsIGJvdW5kcyA9IGN1cnNvckl0ZW0uYm91bmRzLCBjb250YWluZXIgPSBjdXJzb3JJdGVtLmNvbnRhaW5lciwgcmVzdWx0ID0gZmFsc2U7XG4gICAgICAgIC8vIERldGVjdCBpZiBhIG1vdXNlIGVsZW1lbnQgZXhpc3RzIGFuZCB0aGF0IGl0J3Mgbm90IHRoZSBzeW1ib2wgaXRzZWxmXG4gICAgICAgIGlmIChtb3VzZUVsZW1lbnQpIHtcbiAgICAgICAgICAvLyBDaGVjayBpZiBtb3VzZSBlbGVtZW50IGlzIG5vdCBjb250YWluZWQgaW4gYSBsaW5rXG4gICAgICAgICAgaWYgKCFtb3VzZUVsZW1lbnQuaHJlZiAmJiAhZ2V0UGFyZW50cyhtb3VzZUVsZW1lbnQsICdhJykubGVuZ3RoKSB7XG4gICAgICAgICAgICAvLyBEZXRlY3QgaWYgc3ltYm9sIGlzIHRvcG1vc3QgZWxlbWVudFxuICAgICAgICAgICAgaWYgKHRvcG1vc3QobW91c2VFbGVtZW50LCBzeW1ib2wpID09PSBzeW1ib2wpIHtcbiAgICAgICAgICAgICAgLy8gRGV0ZWN0IGlmIG1vdXNlIGVsZW1lbnQgaXMgY29udGFpbmVkXG4gICAgICAgICAgICAgIGlmIChjb250YWluZXIgPT09IG1vdXNlRWxlbWVudCB8fCBpc0NoaWxkT2YoY29udGFpbmVyLCBtb3VzZUVsZW1lbnQpKSB7XG4gICAgICAgICAgICAgICAgLy8gTWF0Y2ggYm91bmRzXG4gICAgICAgICAgICAgICAgcmVzdWx0ID0gKG1vdXNlLnggPj0gYm91bmRzLnggJiYgbW91c2UueCA8PSBib3VuZHMueCArIGJvdW5kcy53aWR0aCAmJiBtb3VzZS55ID49IGJvdW5kcy55ICYmIG1vdXNlLnkgPD0gYm91bmRzLnkgKyBib3VuZHMuaGVpZ2h0KTtcbiAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgfVxuICAgICAgICAgIH1cbiAgICAgICAgfVxuICAgICAgICByZXR1cm4gcmVzdWx0O1xuICAgICAgfSksXG4gICAgICBzb3J0ZWQgPSBmaWx0ZXJlZC5zb3J0KGZ1bmN0aW9uKGEsIGIpIHtcbiAgICAgICAgdmFyIHpFbGVtZW50ID0gdG9wbW9zdChhLnN5bWJvbCwgYi5zeW1ib2wpO1xuICAgICAgICBpZiAoekVsZW1lbnQgPT09IGEuc3ltYm9sKSB7XG4gICAgICAgICAgcmV0dXJuIC0xO1xuICAgICAgICB9IGVsc2UgaWYgKHpFbGVtZW50ID09PSBiLnN5bWJvbCkge1xuICAgICAgICAgIHJldHVybiAxO1xuICAgICAgICB9XG4gICAgICAgIHZhciBwMSA9IHt4OiBhLnggKyBhLndpZHRoIC8gMiwgeTogYS55ICsgYS5oZWlnaHQgLyAyfTtcbiAgICAgICAgdmFyIHAyID0ge3g6IGIueCArIGIud2lkdGggLyAyLCB5OiBiLnkgKyBiLmhlaWdodCAvIDJ9O1xuICAgICAgICB2YXIgZDEgPSBNYXRoLnNxcnQoIE1hdGgucG93KChwMS54IC0gbW91c2UueCksIDIpICsgTWF0aC5wb3coKHAxLnkgLSBtb3VzZS55KSwgMikgKTtcbiAgICAgICAgdmFyIGQyID0gTWF0aC5zcXJ0KCBNYXRoLnBvdygocDIueCAtIG1vdXNlLngpLCAyKSArIE1hdGgucG93KChwMi55IC0gbW91c2UueSksIDIpICk7XG4gICAgICAgIHJldHVybiBkMSA8IGQyID8gZDEgOiBkMSA+IGQyID8gZDIgOiAwO1xuICAgICAgfSkucmV2ZXJzZSgpO1xuXG4gICAgY3Vyc29ySXRlbSA9IHNvcnRlZFswXTtcblxuXG4gICAgLy8gU2V0IE1vdXNlUHJvdmlkZXJzXG4gICAgc2V0TW91c2VQcm92aWRlcnMoW3dpbmRvd10uY29uY2F0KGN1cnNvckl0ZW1zLm1hcChmdW5jdGlvbihpdGVtKSB7XG4gICAgICByZXR1cm4gaXRlbS5jb250YWluZXI7XG4gICAgfSkpKTtcbiAgICAvL3NldE1vdXNlUHJvdmlkZXJzKFt3aW5kb3ddKTtcbiAgfVxuXG4gIGZ1bmN0aW9uIHJlbmRlcigpIHtcblxuICAgIGN1cnNvckl0ZW1zLmZvckVhY2goZnVuY3Rpb24oaXRlbSkge1xuXG4gICAgICB2YXJcbiAgICAgICAgc3ltYm9sID0gaXRlbS5zeW1ib2wsXG4gICAgICAgIHN0eWxlID0ge1xuICAgICAgICAgIHZpc2liaWxpdHk6IGl0ZW0gPT09IGN1cnNvckl0ZW0gPyAnJyA6ICdoaWRkZW4nLFxuICAgICAgICAgIHBvc2l0aW9uOiAnYWJzb2x1dGUnLFxuICAgICAgICAgIGN1cnNvcjogJ2luaGVyaXQnXG4gICAgICAgIH07XG5cbiAgICAgIGlmIChpdGVtLnN0eWxlID09PSAndHJhbnNmb3JtJyAmJiB0cmFuc2Zvcm1TdHlsZSkge1xuICAgICAgICBzdHlsZVt0cmFuc2Zvcm1TdHlsZSArIFwiT3JpZ2luXCJdID0gJyc7XG4gICAgICAgIHN0eWxlW3RyYW5zZm9ybVN0eWxlXSA9IFwiXCI7XG4gICAgICB9IGVsc2Uge1xuICAgICAgICBzdHlsZS5sZWZ0ID0gXCJcIjtcbiAgICAgICAgc3R5bGUudG9wID0gXCJcIjtcbiAgICAgIH1cblxuICAgICAgc3ltYm9sLmNsYXNzTGlzdCAmJiAhc3ltYm9sLmNsYXNzTGlzdC5jb250YWlucyhcImN1cnNvclwiKSAmJiBzeW1ib2wuY2xhc3NMaXN0LmFkZChcImN1cnNvclwiKTtcbiAgICAgIGNzcyhzeW1ib2wsIHN0eWxlKTtcblxuICAgICAgaWYgKGN1cnNvckl0ZW0gPT09IGl0ZW0pIHtcblxuICAgICAgICB2YXIgcG9zID0gZ2V0T2Zmc2V0KHN5bWJvbCk7XG5cbiAgICAgICAgdmFyIHB4ID0gcG9zLmxlZnQ7XG4gICAgICAgIHZhciBweSA9IHBvcy50b3A7XG5cbiAgICAgICAgdmFyIG9mZiA9IGl0ZW0ub2Zmc2V0O1xuICAgICAgICB2YXIgeCA9IE1hdGgucm91bmQoKG1vdXNlLnggLSBweCkgKyBvZmYubGVmdCk7XG4gICAgICAgIHZhciB5ID0gTWF0aC5yb3VuZCgobW91c2UueSAtIHB5KSArIG9mZi50b3ApO1xuXG4gICAgICAgIHN0eWxlID0ge1xuICAgICAgICB9O1xuXG4gICAgICAgIGlmIChpdGVtLnN0eWxlID09PSAndHJhbnNmb3JtJyAmJiB0cmFuc2Zvcm1TdHlsZSkge1xuICAgICAgICAgIHN0eWxlW3RyYW5zZm9ybVN0eWxlICsgXCJPcmlnaW5cIl0gPSAnMCAwJztcbiAgICAgICAgICBzdHlsZVt0cmFuc2Zvcm1TdHlsZV0gPSBcInRyYW5zbGF0ZTNkKFwiICsgeCArIFwicHgsXCIgKyB5ICsgXCJweCwgMCkgc2NhbGUoXCIgKyBpdGVtLnNjYWxlICsgXCIsXCIgKyBpdGVtLnNjYWxlICsgXCIpXCI7XG4gICAgICAgIH0gZWxzZSB7XG4gICAgICAgICAgc3R5bGUubGVmdCA9ICh4ICsgcG9zLmxlZnQpICsgXCJweFwiO1xuICAgICAgICAgIHN0eWxlLnRvcCA9ICh5ICsgcG9zLnRvcCkgKyBcInB4XCI7XG4gICAgICAgIH1cblxuICAgICAgICBjc3Moc3ltYm9sLCBzdHlsZSk7XG4gICAgICB9XG5cblxuICAgICAgaWYgKGl0ZW0gPT09IGN1cnNvckl0ZW0pIHtcbiAgICAgICAgc3ltYm9sLmNsYXNzTGlzdCAmJiAhc3ltYm9sLmNsYXNzTGlzdC5jb250YWlucyhcImN1cnNvci1hY3RpdmVcIikgJiYgc3ltYm9sLmNsYXNzTGlzdC5hZGQoXCJjdXJzb3ItYWN0aXZlXCIpO1xuICAgICAgICBzeW1ib2wuY2xhc3NMaXN0ICYmIHN5bWJvbC5jbGFzc0xpc3QuY29udGFpbnMoXCJjdXJzb3ItaGlkZGVuXCIpICYmIHN5bWJvbC5jbGFzc0xpc3QucmVtb3ZlKFwiY3Vyc29yLWhpZGRlblwiKTtcbiAgICAgIH0gZWxzZSB7XG4gICAgICAgIHN5bWJvbC5jbGFzc0xpc3QgJiYgc3ltYm9sLmNsYXNzTGlzdC5jb250YWlucyhcImN1cnNvci1hY3RpdmVcIikgJiYgc3ltYm9sLmNsYXNzTGlzdC5yZW1vdmUoXCJjdXJzb3ItYWN0aXZlXCIpO1xuICAgICAgICBzeW1ib2wuY2xhc3NMaXN0ICYmICFzeW1ib2wuY2xhc3NMaXN0LmNvbnRhaW5zKFwiY3Vyc29yLWhpZGRlblwiKSAmJiBzeW1ib2wuY2xhc3NMaXN0LmFkZChcImN1cnNvci1oaWRkZW5cIik7XG4gICAgICB9XG5cbiAgICB9KTtcbiAgfTtcblxuICB0aGlzLnVwZGF0ZSA9IGZ1bmN0aW9uKCkge1xuICAgIGludmFsaWRhdGUuY2FsbCh0aGlzKTtcbiAgICByZW5kZXIuY2FsbCh0aGlzKTtcbiAgfTtcblxuICB0aGlzLmFkZCA9IGZ1bmN0aW9uKGN1cnNvcikge1xuICAgIGlmIChjdXJzb3JzLmluZGV4T2YoY3Vyc29yKSA9PT0gLTEpIHtcbiAgICAgIGN1cnNvcnMucHVzaChjdXJzb3IpO1xuICAgICAgdGhpcy51cGRhdGUoKTtcbiAgICB9XG4gIH07XG5cbiAgdGhpcy5yZW1vdmUgPSBmdW5jdGlvbihjdXJzb3IpIHtcbiAgICBjdXJzb3JzLnNwbGljZShjdXJzb3JzLmluZGV4T2YoY3Vyc29yKSwgMSk7XG4gICAgdGhpcy51cGRhdGUoKTtcbiAgfTtcblxuICB2YXIgbW91c2VQcm92aWRlcnMgPSBbXTtcbiAgZnVuY3Rpb24gc2V0TW91c2VQcm92aWRlcnMoZWxlbWVudHMpIHtcbiAgICBlbGVtZW50cyA9IGVsZW1lbnRzLmZpbHRlcihmdW5jdGlvbihuKSB7IHJldHVybiAobik7IH0pO1xuICAgIG1vdXNlUHJvdmlkZXJzLmZvckVhY2goZnVuY3Rpb24oZWxlbWVudCkge1xuICAgICAgaWYgKGVsZW1lbnRzLmluZGV4T2YoZWxlbWVudCkgPT09IC0xKSB7XG4gICAgICAgIHJlbW92ZU1vdXNlTGlzdGVuZXJzKGVsZW1lbnQpO1xuICAgICAgfVxuICAgIH0pO1xuICAgIGVsZW1lbnRzLmZvckVhY2goZnVuY3Rpb24oZWxlbWVudCkge1xuICAgICAgaWYgKG1vdXNlUHJvdmlkZXJzLmluZGV4T2YoZWxlbWVudCkgPT09IC0xKSB7XG4gICAgICAgIGFkZE1vdXNlTGlzdGVuZXJzKGVsZW1lbnQpO1xuICAgICAgfVxuICAgIH0pO1xuICAgIG1vdXNlUHJvdmlkZXJzID0gZWxlbWVudHM7XG4gIH1cblxuICBmdW5jdGlvbiBhZGRNb3VzZUxpc3RlbmVycyhlbGVtZW50KSB7XG4gICAgZm9yICh2YXIgaSA9IDAsIGV2ZW50OyBldmVudCA9IGV2ZW50c1tpXTsgaSsrKSB7XG4gICAgICBlbGVtZW50LmFkZEV2ZW50TGlzdGVuZXIoZXZlbnQsIGhhbmRsZUV2ZW50KTtcbiAgICB9XG4gIH1cblxuICBmdW5jdGlvbiByZW1vdmVNb3VzZUxpc3RlbmVycyhlbGVtZW50KSB7XG4gICAgZm9yICh2YXIgaSA9IDAsIGV2ZW50OyBldmVudCA9IGV2ZW50c1tpXTsgaSsrKSB7XG4gICAgICBlbGVtZW50LnJlbW92ZUV2ZW50TGlzdGVuZXIoZXZlbnQsIGhhbmRsZUV2ZW50KTtcbiAgICB9XG4gIH1cblxuICBpbml0LmNhbGwodGhpcyk7XG5cbn1cblxuXG5cbmZ1bmN0aW9uIGdldEN1cnNvckl0ZW0oY3Vyc29yKSB7XG5cbiAgdmFyXG4gICAgZWxlbWVudCA9IGN1cnNvci5nZXQoJ2VsZW1lbnQnKSxcbiAgICBwcm9wcyA9IGN1cnNvci5nZXQoKSxcbiAgICBzeW1ib2wgPSBwcm9wcy5zeW1ib2wsXG4gICAgYm91bmRzID0gcHJvcHMuYm91bmRzLFxuICAgIG9mZnNldCA9IHByb3BzLm9mZnNldCxcbiAgICBzdHlsZSA9IHByb3BzLnN0eWxlLFxuICAgIHNjYWxlID0gcHJvcHMuc2NhbGUsXG4gICAgdGFyZ2V0ID0gcHJvcHMudGFyZ2V0IHx8IHN5bWJvbC5ub2RlTmFtZS50b0xvd2VyQ2FzZSgpID09PSAnYScgPyBzeW1ib2wgOiBlbGVtZW50LFxuICAgIGNvbnRhaW5lcixcbiAgICBkaXNwbGF5ID0gZWxlbWVudC5zdHlsZS5kaXNwbGF5O1xuXG4gIC8vIEZvcmNlIHZpc2liaWxpdHkgdG8gZ2V0IHRoaW5ncyBtZWFzdXJlZFxuICBjc3MoZWxlbWVudCwge1xuICAgIGRpc3BsYXk6ICcnXG4gIH0pO1xuXG4gIC8vXG4gIHByb3BzID0gY3Vyc29yLmdldCgpO1xuXG4gIHN5bWJvbCA9IHByb3BzLnN5bWJvbDtcbiAgYm91bmRzID0gcHJvcHMuYm91bmRzO1xuICBvZmZzZXQgPSBwcm9wcy5vZmZzZXQ7XG4gIHN0eWxlID0gcHJvcHMuc3R5bGU7XG4gIHNjYWxlID0gcHJvcHMuc2NhbGU7XG4gIHRhcmdldCA9IHByb3BzLnRhcmdldCB8fCBzeW1ib2wubm9kZU5hbWUudG9Mb3dlckNhc2UoKSA9PT0gJ2EnID8gc3ltYm9sIDogZWxlbWVudDtcblxuICAvLyBBZGQgY3Vyc29yIHN5bWJvbCB0byBkb21cbiAgaWYgKCFzeW1ib2wucGFyZW50Tm9kZSkge1xuICAgIGVsZW1lbnQuYXBwZW5kQ2hpbGQoc3ltYm9sKTtcbiAgfVxuXG4gIC8vIEdldCBib3VuZHMgYW5kIGNvbnRhaW5lclxuICBpZiAoYm91bmRzICYmIGJvdW5kcy5nZXRCb3VuZGluZ0NsaWVudFJlY3QpIHtcbiAgICAvLyBFbGVtZW50IGJvdW5kc1xuICAgIGNvbnRhaW5lciA9IGJvdW5kcztcbiAgICBib3VuZHMgPSBnZXRCb3VuZGluZ1JlY3QoYm91bmRzKTtcbiAgfSBlbHNlIHtcbiAgICAvLyBPYmplY3QgYm91bmRzOiBFaXRoZXIgY2hvb3NlIHN5bWJvbCdzLCBlbGVtZW50J3Mgb2Zmc2V0UGFyZW50IG9yIHJvb3QgYXMgY29udGFpbmVyXG4gICAgLy8gRklYTUU6IERlc2NlbmRhbnRzIG9mIGJvZHkgd2l0aCBwb3NpdGlvbjogZml4ZWQgd291bGRuJ3QgaGF2ZSBvZmZzZXRQYXJlbnQ6IGh0dHA6Ly9zdGFja292ZXJmbG93LmNvbS9xdWVzdGlvbnMvMzA2MzA1L3doYXQtd291bGQtbWFrZS1vZmZzZXRwYXJlbnQtbnVsbFxuICAgIGNvbnRhaW5lciA9IHN5bWJvbC5vZmZzZXRQYXJlbnQgfHwgZWxlbWVudCAmJiBlbGVtZW50ID09PSBzeW1ib2wgPyBlbGVtZW50Lm9mZnNldFBhcmVudCB8fCBkb2N1bWVudC5kb2N1bWVudEVsZW1lbnQgOiBlbGVtZW50O1xuICAgIHZhciByZWN0ID0gZ2V0Qm91bmRpbmdSZWN0KGNvbnRhaW5lcik7XG5cbiAgICB2YXIgY29udGFpbmVyUG9zID0gZ2V0T2Zmc2V0KGNvbnRhaW5lcikgfHwge3g6IDAsIHk6IDB9O1xuICAgIC8vIFByb2Nlc3MgY3VzdG9tIGZ1bmN0aW9uXG4gICAgaWYgKHR5cGVvZiBib3VuZHMgPT09ICdmdW5jdGlvbicpIHtcbiAgICAgIGJvdW5kcyA9IGJvdW5kcy5hcHBseShlbGVtZW50LCBbY29udGFpbmVyXSk7XG4gICAgfVxuICAgIC8vIEdldCBwZXJjZW50IHZhbHVlc1xuICAgIHZhciB4ID0gdHlwZW9mIGJvdW5kcy54ID09PSAnc3RyaW5nJyAmJiBib3VuZHMueC5pbmRleE9mKFwiJVwiKSA+PSAwID8gcGFyc2VGbG9hdChib3VuZHMueCkgKiByZWN0LndpZHRoIC8gMTAwIDogcGFyc2VGbG9hdChib3VuZHMueCk7XG4gICAgdmFyIHkgPSB0eXBlb2YgYm91bmRzLnkgPT09ICdzdHJpbmcnICYmIGJvdW5kcy55LmluZGV4T2YoXCIlXCIpID49IDAgPyBwYXJzZUZsb2F0KGJvdW5kcy55KSAqIHJlY3QuaGVpZ2h0IC8gMTAwIDogcGFyc2VGbG9hdChib3VuZHMueSk7XG4gICAgdmFyIHdpZHRoID0gdHlwZW9mIGJvdW5kcy53aWR0aCA9PT0gJ3N0cmluZycgJiYgYm91bmRzLndpZHRoLmluZGV4T2YoXCIlXCIpID49IDAgPyBwYXJzZUZsb2F0KGJvdW5kcy53aWR0aCkgKiByZWN0LndpZHRoIC8gMTAwIDogcGFyc2VGbG9hdChib3VuZHMud2lkdGgpO1xuICAgIHZhciBoZWlnaHQgPSB0eXBlb2YgYm91bmRzLmhlaWdodCA9PT0gJ3N0cmluZycgJiYgYm91bmRzLmhlaWdodC5pbmRleE9mKFwiJVwiKSA+PSAwID8gcGFyc2VGbG9hdChib3VuZHMuaGVpZ2h0KSAqIHJlY3QuaGVpZ2h0IC8gMTAwIDogcGFyc2VGbG9hdChib3VuZHMuaGVpZ2h0KTtcbiAgICBib3VuZHMgPSB7XG4gICAgICB4OiBjb250YWluZXJQb3MubGVmdCArIHgsXG4gICAgICB5OiBjb250YWluZXJQb3MudG9wICsgeSxcbiAgICAgIHdpZHRoOiB3aWR0aCxcbiAgICAgIGhlaWdodDogaGVpZ2h0XG4gICAgfTtcbiAgfVxuXG4gIC8vIFJlc2V0IHZpc2liaWxpdHlcbiAgY3NzKGVsZW1lbnQsICdkaXNwbGF5JywgZGlzcGxheSk7XG5cbiAgcmV0dXJuIG1lcmdlKHByb3BzLCB7XG4gICAgY3Vyc29yOiBjdXJzb3IsXG4gICAgc3ltYm9sOiBzeW1ib2wsXG4gICAgYm91bmRzOiBib3VuZHMsXG4gICAgY29udGFpbmVyOiBjb250YWluZXIsXG4gICAgdGFyZ2V0OiB0YXJnZXQsXG4gICAgb2Zmc2V0OiBvZmZzZXQsXG4gICAgc3R5bGU6IHN0eWxlLFxuICAgIHNjYWxlOiBzY2FsZVxuICB9KTtcbn1cblxubW9kdWxlLmV4cG9ydHMgPSBDdXJzb3JNYW5hZ2VyO1xuIiwibW9kdWxlLmV4cG9ydHMgPSBmdW5jdGlvbigpIHtcbiAgdmFyIG9iaiA9IHt9LFxuICAgIGkgPSAwLFxuICAgIGlsID0gYXJndW1lbnRzLmxlbmd0aCxcbiAgICBrZXk7XG4gIGZvciAoOyBpIDwgaWw7IGkrKykge1xuICAgIGZvciAoa2V5IGluIGFyZ3VtZW50c1tpXSkge1xuICAgICAgaWYgKGFyZ3VtZW50c1tpXS5oYXNPd25Qcm9wZXJ0eShrZXkpKSB7XG4gICAgICAgICAgb2JqW2tleV0gPSBhcmd1bWVudHNbaV1ba2V5XTtcbiAgICAgIH1cbiAgICB9XG4gIH1cbiAgcmV0dXJuIG9iajtcbn07IiwidmFyIFxuXG4gIGdldFN0eWxlID0gZnVuY3Rpb24oZWwsIGNzc3Byb3Ape1xuICAgIGlmIChlbC5zdHlsZSlcbiAgICAgIGlmIChlbC5jdXJyZW50U3R5bGUpIC8vSUVcbiAgICAgICAgcmV0dXJuIGVsLmN1cnJlbnRTdHlsZVtjc3Nwcm9wXTtcbiAgICAgIGVsc2UgaWYgKGRvY3VtZW50LmRlZmF1bHRWaWV3ICYmIGRvY3VtZW50LmRlZmF1bHRWaWV3LmdldENvbXB1dGVkU3R5bGUpIC8vRmlyZWZveFxuICAgICAgICByZXR1cm4gZG9jdW1lbnQuZGVmYXVsdFZpZXcuZ2V0Q29tcHV0ZWRTdHlsZShlbCwgXCJcIilbY3NzcHJvcF07XG4gICAgICBlbHNlIC8vdHJ5IGFuZCBnZXQgaW5saW5lIHN0eWxlXG4gICAgICAgIHJldHVybiBlbC5zdHlsZVtjc3Nwcm9wXTtcbiAgfSxcbiAgXG4gIGdldFpJbmRleCA9IGZ1bmN0aW9uKGVsKSB7XG4gICAgdmFyIHpJbmRleCA9IHBhcnNlRmxvYXQoZ2V0U3R5bGUoZWwsICd6SW5kZXgnKSk7XG4gICAgekluZGV4ID0gIWlzTmFOKHpJbmRleCkgPyB6SW5kZXggOiAwO1xuICAgIGlmICh6SW5kZXggPT09IDApIHtcbiAgICAgIGlmIChlbC5wYXJlbnROb2RlKSB7XG4gICAgICAgIHJldHVybiBnZXRaSW5kZXgoZWwucGFyZW50Tm9kZSk7XG4gICAgICB9XG4gICAgfVxuICAgIHJldHVybiB6SW5kZXg7XG4gIH0sXG4gIFxuICBpc0NoaWxkT2YgPSBmdW5jdGlvbihwYXJlbnQsIGNoaWxkKSB7XG4gICBpZiAoIWNoaWxkIHx8ICFwYXJlbnQpIHtcbiAgICAgcmV0dXJuIGZhbHNlO1xuICAgfVxuICAgdmFyIG5vZGUgPSBjaGlsZC5wYXJlbnROb2RlO1xuICAgd2hpbGUgKG5vZGUgIT0gbnVsbCkge1xuICAgICBpZiAobm9kZSA9PSBwYXJlbnQpIHtcbiAgICAgICAgIHJldHVybiB0cnVlO1xuICAgICB9XG4gICAgIG5vZGUgPSBub2RlLnBhcmVudE5vZGU7XG4gICB9XG4gICByZXR1cm4gZmFsc2U7XG4gIH07XG5cblxuLy8gQ29tcGFyZSBWaXNpYmlsaXR5LCByZXR1cm5zIC0xLCAxIG9yIDBcbmZ1bmN0aW9uIGNvbXBhcmVWaXNpYmlsaXR5KGEsIGIpIHtcbiAgdmFyIHZhID0gYSAmJiBhLnN0eWxlICYmIGdldFN0eWxlKGEsICdkaXNwbGF5JykgIT09ICdub25lJztcbiAgdmFyIHZiID0gYiAmJiBiLnN0eWxlICYmIGdldFN0eWxlKGIsICdkaXNwbGF5JykgIT09ICdub25lJztcbiAgaWYgKHZhICYmICF2Yikge1xuICAgIHJldHVybiAtMTtcbiAgfSBlbHNlIGlmICh2YiAmJiAhdmEpIHtcbiAgICByZXR1cm4gMTtcbiAgfVxuICByZXR1cm4gMDtcbn1cblxuLy8gQ29tcGFyZSBaLUluZGV4LCByZXR1cm5zIC0xLCAxIG9yIDBcbmZ1bmN0aW9uIGNvbXBhcmVQb3NpdGlvblN0YWNrKGEsIGIpIHtcbiAgdmFyIHBhID0gZ2V0U3R5bGUoYSwgJ3Bvc2l0aW9uJyk7XG4gIHZhciBwYiA9IGdldFN0eWxlKGIsICdwb3NpdGlvbicpO1xuICBpZiAoemEgPiB6Yikge1xuICAgIHJldHVybiAtMTtcbiAgfSBlbHNlIGlmICh6YiA+IHphKSB7XG4gICAgcmV0dXJuIDE7XG4gIH1cbiAgcmV0dXJuIDA7XG59XG5cblxuLy8gQ29tcGFyZSBaLUluZGV4LCByZXR1cm5zIC0xLCAxIG9yIDBcbmZ1bmN0aW9uIGNvbXBhcmVaSW5kZXgoYSwgYikge1xuICB2YXIgemEgPSBnZXRaSW5kZXgoYSk7XG4gIHZhciB6YiA9IGdldFpJbmRleChiKTtcbiAgaWYgKHphID4gemIpIHtcbiAgICByZXR1cm4gLTE7XG4gIH0gZWxzZSBpZiAoemIgPiB6YSkge1xuICAgIHJldHVybiAxO1xuICB9XG4gIHJldHVybiAwO1xufVxuXG4vLyBDb21wYXJlIFBvc2l0aW9uIC0gTUlUIExpY2Vuc2VkLCBKb2huIFJlc2lnXG5mdW5jdGlvbiBjb21wYXJlUG9zaXRpb24oYSwgYil7XG4gIHJldHVybiBhLmNvbXBhcmVEb2N1bWVudFBvc2l0aW9uID9cbiAgICBhLmNvbXBhcmVEb2N1bWVudFBvc2l0aW9uKGIpIDpcbiAgICBhLmNvbnRhaW5zID9cbiAgICAgIChhICE9IGIgJiYgYS5jb250YWlucyhiKSAmJiAxNikgK1xuICAgICAgICAoYSAhPSBiICYmIGIuY29udGFpbnMoYSkgJiYgOCkgK1xuICAgICAgICAoYS5zb3VyY2VJbmRleCA+PSAwICYmIGIuc291cmNlSW5kZXggPj0gMCA/XG4gICAgICAgICAgKGEuc291cmNlSW5kZXggPCBiLnNvdXJjZUluZGV4ICYmIDQpICtcbiAgICAgICAgICAgIChhLnNvdXJjZUluZGV4ID4gYi5zb3VyY2VJbmRleCAmJiAyKSA6XG4gICAgICAgICAgMSkgK1xuICAgICAgMCA6XG4gICAgICAwO1xufVxuXG5tb2R1bGUuZXhwb3J0cyA9IGZ1bmN0aW9uKGEsIGIpIHtcbiAgLy8gQ29tcGFyZSBWaXNpYmlsaXR5XG4gIHZhciB2aXNpYmlsaXR5ID0gY29tcGFyZVZpc2liaWxpdHkoYSwgYik7XG4gIGlmICh2aXNpYmlsaXR5ICE9PSAwKSB7XG4gICAgcmV0dXJuIHZpc2liaWxpdHkgPCAwID8gYSA6IGI7XG4gIH0gXG4gIFxuICAvLyBDb21wYXJlIHBhcmVudC9jaGlsZCByZWxhdGlvblxuICBpZiAoaXNDaGlsZE9mKGEsIGIpKSB7XG4gICAgLy8gaWYgYiBpcyBjb250YWluZWQgaW4gYSwgaXQncyBhbHdheXMgb24gdG9wXG4gICAgcmV0dXJuIGI7XG4gIH1cbiAgXG4gIC8vIENvbXBhcmUgWi1JbmRleCBTdGFja1xuICB2YXIgekluZGV4Q29tcGFyaXNvblJlc3VsdCA9IGNvbXBhcmVaSW5kZXgoYSwgYik7XG4gIGlmICh6SW5kZXhDb21wYXJpc29uUmVzdWx0ID09PSAtMSkge1xuICAgIC8vIGEgaXMgb24gdG9wXG4gICAgcmV0dXJuIGE7XG4gIH1cbiAgaWYgKHpJbmRleENvbXBhcmlzb25SZXN1bHQgPT09IDEpIHtcbiAgICAvLyBiIGlzIG9uIHRvcFxuICAgIHJldHVybiBiO1xuICB9XG4gIC8vIFRPRE86IENvbXBhcmUgQW5jZXN0b3IgUG9zaXRpb24gU3RhY2tcbiAgXG4gIC8vIENvbXBhcmUgRG9jdW1lbnQgUG9zaXRpb25cbiAgdmFyIGRvY3VtZW50UG9zaXRpb25SZXN1bHQgPSBjb21wYXJlUG9zaXRpb24oYSwgYik7XG4gIGlmIChkb2N1bWVudFBvc2l0aW9uUmVzdWx0ID09PSAyKSB7XG4gICAgLy8gYSBpcyBwcmVjZWRpbmdcbiAgICByZXR1cm4gYTtcbiAgfVxuICBpZiAoZG9jdW1lbnRQb3NpdGlvblJlc3VsdCA9PT0gNCkge1xuICAgIC8vIGIgaXMgZm9sbG93aW5nXG4gICAgcmV0dXJuIGI7XG4gIH1cbiAgXG4gIHJldHVybiBhO1xufTsiXX0=
