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
      bounds = bounds(container);
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
//# sourceMappingURL=data:application/json;charset:utf-8;base64,eyJ2ZXJzaW9uIjozLCJzb3VyY2VzIjpbIm5vZGVfbW9kdWxlcy9ncnVudC1icm93c2VyaWZ5L25vZGVfbW9kdWxlcy9icm93c2VyaWZ5L25vZGVfbW9kdWxlcy9icm93c2VyLXBhY2svX3ByZWx1ZGUuanMiLCJzcmMvY3Vyem9yeS5qcyIsInNyYy9saWIvQ3Vyc29yLmpzIiwic3JjL2xpYi9DdXJzb3JNYW5hZ2VyLmpzIiwic3JjL2xpYi9tZXJnZS5qcyIsInNyYy9saWIvdG9wbW9zdC5qcyJdLCJuYW1lcyI6W10sIm1hcHBpbmdzIjoiQUFBQTtBQ0FBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBOztBQ1RBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTs7QUMzR0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBOztBQ2xlQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBOztBQ2JBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0EiLCJmaWxlIjoiZ2VuZXJhdGVkLmpzIiwic291cmNlUm9vdCI6IiIsInNvdXJjZXNDb250ZW50IjpbIihmdW5jdGlvbiBlKHQsbixyKXtmdW5jdGlvbiBzKG8sdSl7aWYoIW5bb10pe2lmKCF0W29dKXt2YXIgYT10eXBlb2YgcmVxdWlyZT09XCJmdW5jdGlvblwiJiZyZXF1aXJlO2lmKCF1JiZhKXJldHVybiBhKG8sITApO2lmKGkpcmV0dXJuIGkobywhMCk7dmFyIGY9bmV3IEVycm9yKFwiQ2Fubm90IGZpbmQgbW9kdWxlICdcIitvK1wiJ1wiKTt0aHJvdyBmLmNvZGU9XCJNT0RVTEVfTk9UX0ZPVU5EXCIsZn12YXIgbD1uW29dPXtleHBvcnRzOnt9fTt0W29dWzBdLmNhbGwobC5leHBvcnRzLGZ1bmN0aW9uKGUpe3ZhciBuPXRbb11bMV1bZV07cmV0dXJuIHMobj9uOmUpfSxsLGwuZXhwb3J0cyxlLHQsbixyKX1yZXR1cm4gbltvXS5leHBvcnRzfXZhciBpPXR5cGVvZiByZXF1aXJlPT1cImZ1bmN0aW9uXCImJnJlcXVpcmU7Zm9yKHZhciBvPTA7bzxyLmxlbmd0aDtvKyspcyhyW29dKTtyZXR1cm4gc30pIiwidmFyXG4gIEN1cnNvck1hbmFnZXIgPSByZXF1aXJlKCcuL2xpYi9DdXJzb3JNYW5hZ2VyJyksXG4gIEN1cnNvciA9IHJlcXVpcmUoJy4vbGliL0N1cnNvcicpO1xuICBjdXJzb3JNYW5hZ2VyID0gbmV3IEN1cnNvck1hbmFnZXIoKTtcblxubW9kdWxlLmV4cG9ydHMgPSBmdW5jdGlvbiBjdXJ6b3J5KGVsZW1lbnQsIG9wdGlvbnMpIHtcbiAgdmFyIGN1cnNvciA9IG5ldyBDdXJzb3IoZWxlbWVudCwgb3B0aW9ucyk7XG4gIGN1cnNvck1hbmFnZXIuYWRkKGN1cnNvcik7XG4gIHJldHVybiBjdXJzb3I7XG59OyIsInZhclxuICBtZXJnZSA9IHJlcXVpcmUoJy4vbWVyZ2UnKSxcbiAgXG4gIGNyZWF0ZUVsZW1lbnQgPSBmdW5jdGlvbihzdHJpbmcpIHtcbiAgICB2YXIgZWxlbWVudCA9IGRvY3VtZW50LmNyZWF0ZUVsZW1lbnQoJ2RpdicpO1xuICAgIGVsZW1lbnQuaW5uZXJIVE1MID0gc3RyaW5nO1xuICAgIHZhciByZXN1bHQgPSBlbGVtZW50LmZpcnN0Q2hpbGQ7XG4gICAgZWxlbWVudC5yZW1vdmVDaGlsZChyZXN1bHQpO1xuICAgIHJldHVybiByZXN1bHQ7XG4gIH0sXG5cbiAgaXNIVE1MID0gZnVuY3Rpb24oc3RyaW5nKSB7XG4gICAgcmV0dXJuIHR5cGVvZiBzdHJpbmcgPT09ICdzdHJpbmcnICYmIHN0cmluZy5tYXRjaCgvPFxcLz9cXHcrKChcXHMrXFx3KyhcXHMqPVxccyooPzpcIi4qP1wifCcuKj8nfFteJ1wiPlxcc10rKSk/KStcXHMqfFxccyopXFwvPz4vKTtcbiAgfSxcbiAgXG5cbiAgZ2V0RWxlbWVudCA9IGZ1bmN0aW9uKHZhbHVlLCBwYXJlbnQpIHtcbiAgICB2YWx1ZSA9IHZhbHVlLnRvQXJyYXkgPyB2YWx1ZS50b0FycmF5KClbMF0gOiB2YWx1ZSBpbnN0YW5jZW9mIEFycmF5ID8gdmFsdWVbMF0gOiB2YWx1ZTtcbiAgICBpZiAodHlwZW9mIHZhbHVlID09PSAnZnVuY3Rpb24nKSB7XG4gICAgICB2YWx1ZSA9IHZhbHVlLmNhbGwodGhpcywgdmFsdWUpO1xuICAgIH1cbiAgICBpZiAodHlwZW9mIHZhbHVlID09PSAnc3RyaW5nJykge1xuICAgICAgaWYgKGlzSFRNTCh2YWx1ZSkpIHtcbiAgICAgICAgdmFsdWUgPSBjcmVhdGVFbGVtZW50KHZhbHVlKTtcbiAgICAgIH0gZWxzZSB7XG4gICAgICAgIHZhbHVlID0gcGFyZW50LnF1ZXJ5U2VsZWN0b3IodmFsdWUpO1xuICAgICAgfVxuICAgIH1cbiAgICBpZiAodmFsdWUgJiYgdmFsdWUubm9kZU5hbWUpIHtcbiAgICAgIHJldHVybiB2YWx1ZTtcbiAgICB9XG4gICAgcmV0dXJuIG51bGw7XG4gIH07XG5cbm1vZHVsZS5leHBvcnRzID0gZnVuY3Rpb24gQ3Vyc29yKGVsZW1lbnQsIG9wdGlvbnMpIHtcbiAgICBcbiAgZnVuY3Rpb24gc2V0KG5hbWUsIHZhbHVlKSB7XG4gICAgdmFyIG9wdHM7XG4gICAgaWYgKHR5cGVvZiBuYW1lID09PSAnb2JqZWN0Jykge1xuICAgICAgb3B0cyA9IG5hbWU7XG4gICAgfSBlbHNlIHtcbiAgICAgIG9wdHMgPSB7fTtcbiAgICAgIG9wdHNbbmFtZV0gPSB2YWx1ZTtcbiAgICB9XG4gICAgZm9yIChuYW1lIGluIG9wdHMpIHtcbiAgICAgIHZhbHVlID0gb3B0c1tuYW1lXTtcbiAgICAgIHN3aXRjaCAobmFtZSkge1xuICAgICAgICBjYXNlICdlbGVtZW50JzpcbiAgICAgICAgY2FzZSAnc3ltYm9sJzpcbiAgICAgICAgICBpZiAoaXNIVE1MKHZhbHVlKSkge1xuICAgICAgICAgICAgdmFsdWUgPSBjcmVhdGVFbGVtZW50KHZhbHVlKTtcbiAgICAgICAgICB9XG4gICAgICAgICAgYnJlYWs7XG4gICAgICB9XG4gICAgICBvcHRzW25hbWVdID0gdmFsdWU7XG4gICAgfVxuICAgIG9wdGlvbnMgPSBtZXJnZShvcHRpb25zLCBvcHRzKTtcbiAgfTtcbiAgXG4gIHRoaXMuc2V0ID0gZnVuY3Rpb24oKSB7XG4gICAgc2V0LmNhbGwodGhpcywgYXJndW1lbnRzKTtcbiAgICBjdXJzb3JNYW5hZ2VyLnVwZGF0ZSgpO1xuICB9O1xuICBcbiAgdGhpcy5nZXQgPSBmdW5jdGlvbihuYW1lKSB7XG4gICAgdmFyIHZhbHVlO1xuICAgIGlmICghbmFtZSkge1xuICAgICAgdmFsdWUgPSB7fTtcbiAgICAgIGZvciAodmFyIHggaW4gb3B0aW9ucykge1xuICAgICAgICB2YWx1ZVt4XSA9IHRoaXMuZ2V0KHgpO1xuICAgICAgfVxuICAgIH0gZWxzZSB7XG4gICAgICB2YWx1ZSA9IG9wdGlvbnNbbmFtZV07XG4gICAgICBzd2l0Y2ggKG5hbWUpIHtcbiAgICAgICAgY2FzZSAnZWxlbWVudCc6XG4gICAgICAgIGNhc2UgJ3N5bWJvbCc6XG4gICAgICAgIGNhc2UgJ2JvdW5kcyc6XG4gICAgICAgIGNhc2UgJ3RhcmdldCc6XG4gICAgICAgICAgdmFsdWUgPSB2YWx1ZSAmJiB2YWx1ZS50b0FycmF5ID8gdmFsdWUudG9BcnJheSgpWzBdIDogdmFsdWUgaW5zdGFuY2VvZiBBcnJheSA/IHZhbHVlWzBdIDogdmFsdWU7XG4gICAgICAgICAgdmFsdWUgPSB0eXBlb2YgdmFsdWUgPT09ICdzdHJpbmcnID8gKGVsZW1lbnQgfHwgZG9jdW1lbnQpLnF1ZXJ5U2VsZWN0b3IodmFsdWUpIDogdmFsdWU7XG4gICAgICAgICAgYnJlYWs7XG4gICAgICB9XG4gICAgICBzd2l0Y2ggKG5hbWUpIHtcbiAgICAgICAgY2FzZSAnc3ltYm9sJzpcbiAgICAgICAgICB2YWx1ZSA9IHZhbHVlIHx8IHRoaXMuZ2V0KCdlbGVtZW50Jyk7XG4gICAgICAgICAgYnJlYWs7XG4gICAgICAgIGNhc2UgJ2JvdW5kcyc6XG4gICAgICAgICAgdmFsdWUgPSB2YWx1ZSA/IHZhbHVlIDogb3B0aW9uc1snc3ltYm9sJ10gPyB0aGlzLmdldCgnZWxlbWVudCcpIDogdGhpcy5nZXQoJ2VsZW1lbnQnKS5vZmZzZXRQYXJlbnQ7XG4gICAgICAgICAgYnJlYWs7XG4gICAgICB9XG4gICAgfVxuICAgIHJldHVybiB2YWx1ZTtcbiAgfTtcbiAgXG4gIHNldChtZXJnZSh7XG4gICAgZWxlbWVudDogbnVsbCxcbiAgICBvZmZzZXQ6IHtsZWZ0OiA4LCB0b3A6IDZ9LFxuICAgIHN0eWxlOiAndHJhbnNmb3JtJyxcbiAgICBzY2FsZTogMSxcbiAgICBib3VuZHM6IG51bGwsXG4gICAgc3ltYm9sOiBudWxsLFxuICAgIHRhcmdldDogbnVsbCxcbiAgICBoaWRlT25Gb2N1czogZmFsc2VcbiAgfSwgb3B0aW9ucywge1xuICAgIGVsZW1lbnQ6IGVsZW1lbnRcbiAgfSkpO1xuICBcbn07IiwidmFyXG4gIFxuICBtZXJnZSA9IHJlcXVpcmUoJy4vbWVyZ2UnKSxcbiAgdG9wbW9zdCA9IHJlcXVpcmUoJy4vdG9wbW9zdCcpLFxuICBcbiAgLyoqXG4gICAqIEh5cGhlbmF0ZSBhIHN0cmluZ1xuICAgKiBAcGFyYW0ge1N0cmluZ30gc3RyaW5nXG4gICAqL1xuICBoeXBoZW5hdGUgPSAoZnVuY3Rpb24oKSB7XG4gICAgdmFyIGNhY2hlID0ge307XG4gICAgcmV0dXJuIGZ1bmN0aW9uKHN0cmluZykge1xuICAgICAgcmV0dXJuIGNhY2hlW3N0cmluZ10gPSBjYWNoZVtzdHJpbmddIHx8IChmdW5jdGlvbigpIHtcbiAgICAgICAgcmV0dXJuIHN0cmluZy5yZXBsYWNlKC8oW0EtWl0pL2csIGZ1bmN0aW9uKCQxKXtyZXR1cm4gXCItXCIrJDEudG9Mb3dlckNhc2UoKTt9KTtcbiAgICAgIH0pKCk7XG4gICAgfTtcbiAgfSkoKSxcbiAgXG4gIGdldFN0eWxlID0gZnVuY3Rpb24oZWwsIGNzc3Byb3Ape1xuICAgaWYgKGVsLmN1cnJlbnRTdHlsZSkgLy9JRVxuICAgIHJldHVybiBlbC5jdXJyZW50U3R5bGVbY3NzcHJvcF07XG4gICBlbHNlIGlmIChkb2N1bWVudC5kZWZhdWx0VmlldyAmJiBkb2N1bWVudC5kZWZhdWx0Vmlldy5nZXRDb21wdXRlZFN0eWxlKSAvL0ZpcmVmb3hcbiAgICByZXR1cm4gZG9jdW1lbnQuZGVmYXVsdFZpZXcuZ2V0Q29tcHV0ZWRTdHlsZShlbCwgXCJcIilbY3NzcHJvcF07XG4gICBlbHNlIC8vdHJ5IGFuZCBnZXQgaW5saW5lIHN0eWxlXG4gICAgcmV0dXJuIGVsLnN0eWxlW2Nzc3Byb3BdO1xuICB9LFxuICBcbiAgdHJhbnNmb3JtU3R5bGUgPSAoZnVuY3Rpb24ocHJvcCwgcHJlZml4ZXMpIHtcbiAgICB2YXIgaSxcbiAgICAgIGVsZW0gPSBkb2N1bWVudC5jcmVhdGVFbGVtZW50KCdkaXYnKSxcbiAgICAgIGNhcGl0YWxpemVkID0gcHJvcC5jaGFyQXQoMCkudG9VcHBlckNhc2UoKSArIHByb3Auc2xpY2UoMSk7XG4gICAgZm9yIChpID0gMDsgaSA8IHByZWZpeGVzLmxlbmd0aDsgaSsrKSB7XG4gICAgICBpZiAodHlwZW9mIGVsZW0uc3R5bGVbcHJlZml4ZXNbaV0gKyBjYXBpdGFsaXplZF0gIT09IFwidW5kZWZpbmVkXCIpIHtcbiAgICAgICAgcmV0dXJuIHByZWZpeGVzW2ldICsgY2FwaXRhbGl6ZWQ7XG4gICAgICB9XG4gICAgfVxuICAgIHJldHVybiBudWxsO1xuICB9KSgndHJhbnNmb3JtJywgWycnLCAnTW96JywgJ1dlYmtpdCcsICdPJywgJ01zJ10pLFxuICBcbiAgaXNDaGlsZE9mID0gZnVuY3Rpb24ocGFyZW50LCBjaGlsZCkge1xuICAgaWYgKCFjaGlsZCB8fCAhcGFyZW50KSB7XG4gICAgIHJldHVybiBmYWxzZTtcbiAgIH1cbiAgIHZhciBub2RlID0gY2hpbGQucGFyZW50Tm9kZTtcbiAgIHdoaWxlIChub2RlICE9IG51bGwpIHtcbiAgICAgaWYgKG5vZGUgPT0gcGFyZW50KSB7XG4gICAgICAgICByZXR1cm4gdHJ1ZTtcbiAgICAgfVxuICAgICBub2RlID0gbm9kZS5wYXJlbnROb2RlO1xuICAgfVxuICAgcmV0dXJuIGZhbHNlO1xuICB9LFxuICBcbiAgY3NzID0gZnVuY3Rpb24oZWxlbSwgbmFtZSwgdmFsdWUpIHtcbiAgICB2YXIgbWFwID0ge30sIGNzc1RleHQgPSBudWxsO1xuICAgIGlmICh0eXBlb2YgbmFtZSA9PT0gJ29iamVjdCcpIHtcbiAgICAgIG1hcCA9IG5hbWU7XG4gICAgfSBlbHNlIGlmICh0eXBlb2YgdmFsdWUgIT09IFwidW5kZWZpbmVkXCIpIHtcbiAgICAgIG1hcFtuYW1lXSA9IHZhbHVlO1xuICAgIH1cbiAgICB2YXIga2V5cyA9IE9iamVjdC5rZXlzKG1hcCk7XG4gICAga2V5cyA9IGtleXMuZmlsdGVyKGZ1bmN0aW9uKGtleSwgaW5kZXgpIHtcbiAgICAgIGlmIChtYXBba2V5XSA9PT0gJycpIHtcbiAgICAgICAgZWxlbS5zdHlsZVtrZXldID0gbWFwW2tleV07XG4gICAgICAgIHJldHVybiBmYWxzZTtcbiAgICAgIH1cbiAgICAgIHJldHVybiB0cnVlO1xuICAgIH0pO1xuICAgIGNzc1RleHQgPSBrZXlzLm1hcChmdW5jdGlvbihuYW1lKSB7XG4gICAgICByZXR1cm4gaHlwaGVuYXRlKG5hbWUpICsgXCI6IFwiICsgbWFwW25hbWVdO1xuICAgIH0pLmpvaW4oXCI7IFwiKTtcbiAgICBpZiAoY3NzVGV4dCAmJiBjc3NUZXh0Lmxlbmd0aCkge1xuICAgICAgZWxlbS5zdHlsZS5jc3NUZXh0ID0gZWxlbS5zdHlsZS5jc3NUZXh0ICsgY3NzVGV4dDtcbiAgICAgIHJldHVybiBudWxsO1xuICAgIH1cbiAgICByZXR1cm4gZWxlbS5zdHlsZVtuYW1lXSB8fCB3aW5kb3cuZ2V0Q29tcHV0ZWRTdHlsZShlbGVtLCBudWxsKS5nZXRQcm9wZXJ0eVZhbHVlKG5hbWUpO1xuICB9LFxuICBcbiAgZ2V0T2Zmc2V0ID0gZnVuY3Rpb24oZWxlbWVudCkge1xuICAgIHZhclxuICAgICAgc2Nyb2xsT2Zmc2V0ID0gZ2V0U2Nyb2xsT2Zmc2V0KCksXG4gICAgICByZWN0ID0gZWxlbWVudC5nZXRCb3VuZGluZ0NsaWVudFJlY3QoKTtcbiAgICByZXR1cm4ge1xuICAgICAgdG9wOiByZWN0LnRvcCArIHNjcm9sbE9mZnNldC50b3AsXG4gICAgICBsZWZ0OiByZWN0LmxlZnQgKyBzY3JvbGxPZmZzZXQubGVmdFxuICAgIH07XG4gIH0sXG4gIFxuICBnZXRTY3JvbGxPZmZzZXQgPSBmdW5jdGlvbigpIHtcbiAgICByZXR1cm4ge1xuICAgICAgbGVmdDogZG9jdW1lbnQuYm9keSAmJiBkb2N1bWVudC5ib2R5LnNjcm9sbExlZnQgKyBkb2N1bWVudC5kb2N1bWVudEVsZW1lbnQuc2Nyb2xsTGVmdCxcbiAgICAgIHRvcDogZG9jdW1lbnQuYm9keSAmJiBkb2N1bWVudC5ib2R5LnNjcm9sbFRvcCArIGRvY3VtZW50LmRvY3VtZW50RWxlbWVudC5zY3JvbGxUb3BcbiAgICB9O1xuICB9LFxuICBcbiAgZ2V0Qm91bmRpbmdSZWN0ID0gZnVuY3Rpb24oZWxlbWVudCkge1xuICAgIGlmICghZWxlbWVudCkge1xuICAgICAgcmV0dXJuIHtcbiAgICAgICAgeDogLUluZmluaXR5LFxuICAgICAgICB5OiAtSW5maW5pdHksXG4gICAgICAgIHdpZHRoOiBJbmZpbml0eSxcbiAgICAgICAgaGVpZ2h0OiBJbmZpbml0eVxuICAgICAgfTtcbiAgICB9XG4gICAgdmFyIHNjcm9sbE9mZnNldCA9IGdldFNjcm9sbE9mZnNldCgpO1xuICAgIHZhciByZWN0ID0gZWxlbWVudC5nZXRCb3VuZGluZ0NsaWVudFJlY3QoKTtcbiAgICByZXR1cm4ge1xuICAgICAgeDogcmVjdC5sZWZ0ICsgc2Nyb2xsT2Zmc2V0LmxlZnQsXG4gICAgICB5OiByZWN0LnRvcCArIHNjcm9sbE9mZnNldC50b3AsXG4gICAgICB3aWR0aDogcmVjdC53aWR0aCxcbiAgICAgIGhlaWdodDogcmVjdC5oZWlnaHRcbiAgICB9O1xuICB9LFxuICBcbiAgLy8gRGVjbGFyZSBzaW5nbGV0b24gaW5zdGFuY2VcbiAgaW5zdGFuY2UgPSBudWxsO1xuXG4vKipcbiAqIEN1cnNvck1hbmFnZXJcbiAqIFRoaXMgc2luZ2xldG9uIGNsYXNzIGhhbmRsZXMgYWxsIGN1cnNvciBvYmplY3RzIFxuICogQHBhcmFtIHtPYmplY3R9IG9wdGlvbnNcbiAqL1xuZnVuY3Rpb24gQ3Vyc29yTWFuYWdlcihvcHRpb25zKSB7XG4gIC8vIFNpbmdsZXRvbiBwYXR0ZXJuXG4gIGlmIChpbnN0YW5jZSkge1xuICAgIGluc3RhbmNlLnNldChvcHRpb25zKTtcbiAgICByZXR1cm4gaW5zdGFuY2U7XG4gIH1cbiAgaW5zdGFuY2UgPSB0aGlzO1xuICAvLyBJbXBsZW1lbnRhdGlvblxuICBcbiAgdmFyIGN1cnNvcnMgPSBbXTtcbiAgdmFyIGNsaWVudCA9IHt4OiAwLCB5OiAwfTtcbiAgdmFyIG1vdXNlID0ge3g6IC1JbmZpbml0eSwgeTogLUluZmluaXR5LCBlbGVtZW50OiBudWxsfTtcbiAgdmFyIGV2ZW50cyA9IFsnbW91c2Vkb3duJywgJ2NsaWNrJywgJ3Njcm9sbCcsICdyZXNpemUnLCAnbW91c2Vtb3ZlJywgJ21vdXNlb3V0J107XG4gIHZhciBjdXJzb3JJdGVtcyA9IFtdO1xuICB2YXIgY3Vyc29ySXRlbSA9IG51bGw7XG4gIHZhciBjbGlja2luZyA9IGZhbHNlO1xuICB2YXIgY2xpY2thYmxlID0gdHJ1ZTtcbiAgXG4gIGZ1bmN0aW9uIGluaXQoKSB7XG4gICAgaWYgKCEoJ29udG91Y2gnIGluIHdpbmRvdykpIHtcbiAgICAgIGFkZE1vdXNlTGlzdGVuZXJzKHdpbmRvdyk7XG4gICAgfVxuICB9XG4gIFxuICBmdW5jdGlvbiBoYW5kbGVFdmVudChlKSB7XG4gICAgXG4gICAgLy8gQ2hlY2sgZm9yIGFjY2VzcyB0byBldmVudCdzIHR5cGUgcHJvcGVydHlcbiAgICB0cnkge1xuICAgICAgZS50eXBlO1xuICAgIH0gY2F0Y2ggKGUpIHtcbiAgICAgIGNvbnNvbGUud2FybihlKTtcbiAgICAgIHJldHVybjtcbiAgICB9XG4gICAgLy8gVXBkYXRlIE1vdXNlIFBvc2l0aW9uXG4gICAgc3dpdGNoIChlLnR5cGUpIHtcbiAgICAgIGNhc2UgJ21vdXNlZG93bic6XG4gICAgICAgIGNsaWNraW5nID0gZmFsc2U7XG4gICAgICAgIGJyZWFrO1xuICAgICAgY2FzZSAnbW91c2VvdXQnOlxuICAgICAgICB2YXIgcmVsYXRlZFRhcmdldCA9IHR5cGVvZiBlLnRvRWxlbWVudCAhPSAndW5kZWZpbmVkJyA/IGUudG9FbGVtZW50IDogZS5yZWxhdGVkVGFyZ2V0O1xuICAgICAgICBpZiAocmVsYXRlZFRhcmdldCA9PT0gbnVsbCkge1xuICAgICAgICAgIG1vdXNlLnggPSAtSW5maW5pdHk7XG4gICAgICAgICAgbW91c2UueSA9IC1JbmZpbml0eTtcbiAgICAgICAgICBtb3VzZS5lbGVtZW50ID0gbnVsbDtcbiAgICAgICAgfVxuICAgICAgICBicmVhaztcbiAgICAgIGNhc2UgJ21vdXNlbW92ZSc6XG4gICAgICAgIC8vIEdldCBtb3VzZSBjb29yZGluYXRlc1xuICAgICAgICAvLyBVcGRhdGUgbW91c2UgY29vcmRpbmF0ZXNcbiAgICAgICAgY2xpZW50LnggPSBlLmNsaWVudFg7XG4gICAgICAgIGNsaWVudC55ID0gZS5jbGllbnRZO1xuICAgICAgZGVmYXVsdDpcbiAgICAgIHZhciBzY3JvbGxPZmZzZXQgPSBnZXRTY3JvbGxPZmZzZXQoKTtcbiAgICAgIG1vdXNlLnggPSBjbGllbnQueCArIHNjcm9sbE9mZnNldC5sZWZ0O1xuICAgICAgbW91c2UueSA9IGNsaWVudC55ICsgc2Nyb2xsT2Zmc2V0LnRvcDtcbiAgICAgIG1vdXNlLmVsZW1lbnQgPSBlLnRhcmdldDtcbiAgICAgIFxuICAgICAgXG4gICAgfVxuICAgIFxuICAgIC8vIEdldCBDdXJzb3IgUHJvcHNcbiAgICBpbnZhbGlkYXRlLmNhbGwodGhpcyk7XG4gICAgXG4gICAgLy8gUHJvY2VzcyBDbGlja1xuICAgIHN3aXRjaCAoZS50eXBlKSB7XG4gICAgICBjYXNlICdjbGljayc6XG4gICAgICAgIGlmICghY2xpY2tpbmcgJiYgY3Vyc29ySXRlbSkge1xuICAgICAgICAgIGNsaWNraW5nID0gdHJ1ZTtcbiAgICAgICAgICBpZiAobW91c2UuZWxlbWVudCAmJiBjdXJzb3JJdGVtICYmIGN1cnNvckl0ZW0udGFyZ2V0ICYmIGN1cnNvckl0ZW0uc3ltYm9sICE9PSBtb3VzZS5lbGVtZW50ICYmIGlzQ2hpbGRPZihjdXJzb3JJdGVtLmNvbnRhaW5lciwgbW91c2UuZWxlbWVudCkpIHtcbiAgICAgICAgICAgIC8vZS5zdG9wSW1tZWRpYXRlUHJvcGFnYXRpb24oKTtcbiAgICAgICAgICAgIC8vZS5wcmV2ZW50RGVmYXVsdCgpO1xuICAgICAgICAgICAgY3Vyc29ySXRlbS50YXJnZXQuY2xpY2soKTtcbiAgICAgICAgICB9XG4gICAgICAgICAgdmFyIGNsaWNrID0gY3Vyc29ySXRlbSAmJiBjdXJzb3JJdGVtLmNsaWNrO1xuICAgICAgICAgIGlmICh0eXBlb2YgY2xpY2sgPT09ICdmdW5jdGlvbicpIHtcbiAgICAgICAgICAgIGNsaWNrLmNhbGwoY3Vyc29ySXRlbS5lbGVtZW50LCBlKTtcbiAgICAgICAgICB9XG4gICAgICAgIH1cbiAgICAgICAgLy9lLnN0b3BQcm9wYWdhdGlvbigpO1xuICAgICAgICBicmVhaztcbiAgICB9XG4gICAgLy8gVXBkYXRlIGN1cnNvcnNcbiAgICByZW5kZXIuY2FsbChpbnN0YW5jZSk7XG4gIH1cbiAgXG4gIC8vIGh0dHA6Ly9zdGFja292ZXJmbG93LmNvbS9xdWVzdGlvbnMvMTg2NjM5NDEvZmluZGluZy1jbG9zZXN0LWVsZW1lbnQtd2l0aG91dC1qcXVlcnlcbiAgLy8gRml4IElFXG4gIGZ1bmN0aW9uIGNsb3Nlc3QoZWwsIHNlbGVjdG9yKSB7XG4gICAgdmFyIG1hdGNoZXNGbjtcblxuICAgIC8vIGZpbmQgdmVuZG9yIHByZWZpeFxuICAgIFsnbWF0Y2hlcycsJ3dlYmtpdE1hdGNoZXNTZWxlY3RvcicsJ21vek1hdGNoZXNTZWxlY3RvcicsJ21zTWF0Y2hlc1NlbGVjdG9yJywnb01hdGNoZXNTZWxlY3RvciddLnNvbWUoZnVuY3Rpb24oZm4pIHtcbiAgICAgICAgaWYgKHR5cGVvZiBkb2N1bWVudC5ib2R5W2ZuXSA9PSAnZnVuY3Rpb24nKSB7XG4gICAgICAgICAgICBtYXRjaGVzRm4gPSBmbjtcbiAgICAgICAgICAgIHJldHVybiB0cnVlO1xuICAgICAgICB9XG4gICAgICAgIHJldHVybiBmYWxzZTtcbiAgICB9KTtcblxuICAgIHZhciBwYXJlbnQ7XG5cbiAgICAvLyB0cmF2ZXJzZSBwYXJlbnRzXG4gICAgd2hpbGUgKGVsKSB7XG4gICAgICAgIHBhcmVudCA9IGVsLnBhcmVudEVsZW1lbnQ7XG4gICAgICAgIGlmIChwYXJlbnQgJiYgcGFyZW50W21hdGNoZXNGbl0oc2VsZWN0b3IpKSB7XG4gICAgICAgICAgICByZXR1cm4gcGFyZW50O1xuICAgICAgICB9XG4gICAgICAgIGVsID0gcGFyZW50O1xuICAgIH1cblxuICAgIHJldHVybiBudWxsO1xuICB9XG4gIFxuICBmdW5jdGlvbiBnZXRQYXJlbnRzKGVsZW1lbnQsIHNlbGVjdG9yKSB7XG4gICAgdmFyIHBhcmVudHMgPSBbXTtcbiAgICB2YXIgcGFyZW50ID0gZWxlbWVudDtcbiAgICB3aGlsZSAocGFyZW50ID0gcGFyZW50LnBhcmVudEVsZW1lbnQgJiYgY2xvc2VzdChwYXJlbnQucGFyZW50RWxlbWVudCwgc2VsZWN0b3IpKSB7XG4gICAgICBwYXJlbnRzLnB1c2gocGFyZW50KTtcbiAgICB9XG4gICAgcmV0dXJuIHBhcmVudHM7XG4gIH1cbiAgXG4gIGZ1bmN0aW9uIGludmFsaWRhdGUoKSB7XG4gICAgXG4gICAgY3Vyc29ySXRlbXMgPSBjdXJzb3JzLm1hcChmdW5jdGlvbihjdXJzb3IsIGluZGV4KSB7XG4gICAgICByZXR1cm4gZ2V0Q3Vyc29ySXRlbShjdXJzb3IsIGN1cnNvckl0ZW1zW2luZGV4XSk7XG4gICAgfSk7XG4gICAgXG4gICAgdmFyXG4gICAgICBmaWx0ZXJlZCA9IGN1cnNvckl0ZW1zLmZpbHRlcihmdW5jdGlvbihjdXJzb3JJdGVtLCBpbmRleCkge1xuICAgICAgICB2YXIgbW91c2VFbGVtZW50ID0gbW91c2UuZWxlbWVudCwgc3ltYm9sID0gY3Vyc29ySXRlbS5zeW1ib2wsIGJvdW5kcyA9IGN1cnNvckl0ZW0uYm91bmRzLCBjb250YWluZXIgPSBjdXJzb3JJdGVtLmNvbnRhaW5lciwgcmVzdWx0ID0gZmFsc2U7XG4gICAgICAgIC8vIERldGVjdCBpZiBhIG1vdXNlIGVsZW1lbnQgZXhpc3RzIGFuZCB0aGF0IGl0J3Mgbm90IHRoZSBzeW1ib2wgaXRzZWxmXG4gICAgICAgIGlmIChtb3VzZUVsZW1lbnQpIHtcbiAgICAgICAgICAvLyBDaGVjayBpZiBtb3VzZSBlbGVtZW50IGlzIG5vdCBjb250YWluZWQgaW4gYSBsaW5rXG4gICAgICAgICAgaWYgKCFtb3VzZUVsZW1lbnQuaHJlZiAmJiAhZ2V0UGFyZW50cyhtb3VzZUVsZW1lbnQsICdhJykubGVuZ3RoKSB7IFxuICAgICAgICAgICAgLy8gRGV0ZWN0IGlmIHN5bWJvbCBpcyB0b3Btb3N0IGVsZW1lbnRcbiAgICAgICAgICAgIGlmICh0b3Btb3N0KG1vdXNlRWxlbWVudCwgc3ltYm9sKSA9PT0gc3ltYm9sKSB7XG4gICAgICAgICAgICAgIC8vIERldGVjdCBpZiBtb3VzZSBlbGVtZW50IGlzIGNvbnRhaW5lZFxuICAgICAgICAgICAgICBpZiAoY29udGFpbmVyID09PSBtb3VzZUVsZW1lbnQgfHwgaXNDaGlsZE9mKGNvbnRhaW5lciwgbW91c2VFbGVtZW50KSkge1xuICAgICAgICAgICAgICAgIC8vIE1hdGNoIGJvdW5kc1xuICAgICAgICAgICAgICAgIHJlc3VsdCA9IChtb3VzZS54ID49IGJvdW5kcy54ICYmIG1vdXNlLnggPD0gYm91bmRzLnggKyBib3VuZHMud2lkdGggJiYgbW91c2UueSA+PSBib3VuZHMueSAmJiBtb3VzZS55IDw9IGJvdW5kcy55ICsgYm91bmRzLmhlaWdodCk7XG4gICAgICAgICAgICAgIH1cbiAgICAgICAgICAgIH1cbiAgICAgICAgICB9XG4gICAgICAgIH1cbiAgICAgICAgcmV0dXJuIHJlc3VsdDtcbiAgICAgIH0pLFxuICAgICAgc29ydGVkID0gZmlsdGVyZWQuc29ydChmdW5jdGlvbihhLCBiKSB7XG4gICAgICAgIHZhciB6RWxlbWVudCA9IHRvcG1vc3QoYS5zeW1ib2wsIGIuc3ltYm9sKTtcbiAgICAgICAgaWYgKHpFbGVtZW50ID09PSBhLnN5bWJvbCkge1xuICAgICAgICAgIHJldHVybiAtMTtcbiAgICAgICAgfSBlbHNlIGlmICh6RWxlbWVudCA9PT0gYi5zeW1ib2wpIHtcbiAgICAgICAgICByZXR1cm4gMTtcbiAgICAgICAgfVxuICAgICAgICB2YXIgcDEgPSB7eDogYS54ICsgYS53aWR0aCAvIDIsIHk6IGEueSArIGEuaGVpZ2h0IC8gMn07XG4gICAgICAgIHZhciBwMiA9IHt4OiBiLnggKyBiLndpZHRoIC8gMiwgeTogYi55ICsgYi5oZWlnaHQgLyAyfTtcbiAgICAgICAgdmFyIGQxID0gTWF0aC5zcXJ0KCBNYXRoLnBvdygocDEueCAtIG1vdXNlLngpLCAyKSArIE1hdGgucG93KChwMS55IC0gbW91c2UueSksIDIpICk7XG4gICAgICAgIHZhciBkMiA9IE1hdGguc3FydCggTWF0aC5wb3coKHAyLnggLSBtb3VzZS54KSwgMikgKyBNYXRoLnBvdygocDIueSAtIG1vdXNlLnkpLCAyKSApO1xuICAgICAgICByZXR1cm4gZDEgPCBkMiA/IGQxIDogZDEgPiBkMiA/IGQyIDogMDtcbiAgICAgIH0pLnJldmVyc2UoKTtcbiAgICBcbiAgICBjdXJzb3JJdGVtID0gc29ydGVkWzBdO1xuICAgIFxuICAgIFxuICAgIC8vIFNldCBNb3VzZVByb3ZpZGVyc1xuICAgIHNldE1vdXNlUHJvdmlkZXJzKFt3aW5kb3ddLmNvbmNhdChjdXJzb3JJdGVtcy5tYXAoZnVuY3Rpb24oaXRlbSkge1xuICAgICAgcmV0dXJuIGl0ZW0uY29udGFpbmVyO1xuICAgIH0pKSk7XG4gICAgLy9zZXRNb3VzZVByb3ZpZGVycyhbd2luZG93XSk7XG4gIH1cbiAgXG4gIGZ1bmN0aW9uIHJlbmRlcigpIHtcblxuICAgIGN1cnNvckl0ZW1zLmZvckVhY2goZnVuY3Rpb24oaXRlbSkge1xuICAgICAgXG4gICAgICB2YXJcbiAgICAgICAgc3ltYm9sID0gaXRlbS5zeW1ib2wsXG4gICAgICAgIHN0eWxlID0ge1xuICAgICAgICAgIHZpc2liaWxpdHk6IGl0ZW0gPT09IGN1cnNvckl0ZW0gPyAnJyA6ICdoaWRkZW4nLFxuICAgICAgICAgIHBvc2l0aW9uOiAnYWJzb2x1dGUnLFxuICAgICAgICAgIGN1cnNvcjogJ2luaGVyaXQnXG4gICAgICAgIH07XG4gICAgICAgIFxuICAgICAgaWYgKGl0ZW0uc3R5bGUgPT09ICd0cmFuc2Zvcm0nICYmIHRyYW5zZm9ybVN0eWxlKSB7XG4gICAgICAgIHN0eWxlW3RyYW5zZm9ybVN0eWxlICsgXCJPcmlnaW5cIl0gPSAnJztcbiAgICAgICAgc3R5bGVbdHJhbnNmb3JtU3R5bGVdID0gXCJcIjtcbiAgICAgIH0gZWxzZSB7XG4gICAgICAgIHN0eWxlLmxlZnQgPSBcIlwiO1xuICAgICAgICBzdHlsZS50b3AgPSBcIlwiO1xuICAgICAgfVxuICAgICAgXG4gICAgICBzeW1ib2wuY2xhc3NMaXN0ICYmICFzeW1ib2wuY2xhc3NMaXN0LmNvbnRhaW5zKFwiY3Vyc29yXCIpICYmIHN5bWJvbC5jbGFzc0xpc3QuYWRkKFwiY3Vyc29yXCIpO1xuICAgICAgY3NzKHN5bWJvbCwgc3R5bGUpO1xuICAgICAgXG4gICAgICBpZiAoY3Vyc29ySXRlbSA9PT0gaXRlbSkge1xuICAgICAgICBcbiAgICAgICAgdmFyIHBvcyA9IGdldE9mZnNldChzeW1ib2wpO1xuICAgICAgICBcbiAgICAgICAgdmFyIHB4ID0gcG9zLmxlZnQ7XG4gICAgICAgIHZhciBweSA9IHBvcy50b3A7XG4gICAgICAgIFxuICAgICAgICB2YXIgb2ZmID0gaXRlbS5vZmZzZXQ7XG4gICAgICAgIHZhciB4ID0gTWF0aC5yb3VuZCgobW91c2UueCAtIHB4KSArIG9mZi5sZWZ0KTtcbiAgICAgICAgdmFyIHkgPSBNYXRoLnJvdW5kKChtb3VzZS55IC0gcHkpICsgb2ZmLnRvcCk7XG4gICAgICAgIFxuICAgICAgICBzdHlsZSA9IHtcbiAgICAgICAgfTtcbiAgICAgICAgXG4gICAgICAgIGlmIChpdGVtLnN0eWxlID09PSAndHJhbnNmb3JtJyAmJiB0cmFuc2Zvcm1TdHlsZSkge1xuICAgICAgICAgIHN0eWxlW3RyYW5zZm9ybVN0eWxlICsgXCJPcmlnaW5cIl0gPSAnMCAwJztcbiAgICAgICAgICBzdHlsZVt0cmFuc2Zvcm1TdHlsZV0gPSBcInRyYW5zbGF0ZTNkKFwiICsgeCArIFwicHgsXCIgKyB5ICsgXCJweCwgMCkgc2NhbGUoXCIgKyBpdGVtLnNjYWxlICsgXCIsXCIgKyBpdGVtLnNjYWxlICsgXCIpXCI7XG4gICAgICAgIH0gZWxzZSB7XG4gICAgICAgICAgc3R5bGUubGVmdCA9ICh4ICsgcG9zLmxlZnQpICsgXCJweFwiO1xuICAgICAgICAgIHN0eWxlLnRvcCA9ICh5ICsgcG9zLnRvcCkgKyBcInB4XCI7XG4gICAgICAgIH1cbiAgICAgICAgXG4gICAgICAgIGNzcyhzeW1ib2wsIHN0eWxlKTtcbiAgICAgIH1cbiAgICAgIFxuICAgICAgXG4gICAgICBpZiAoaXRlbSA9PT0gY3Vyc29ySXRlbSkge1xuICAgICAgICBzeW1ib2wuY2xhc3NMaXN0ICYmICFzeW1ib2wuY2xhc3NMaXN0LmNvbnRhaW5zKFwiY3Vyc29yLWFjdGl2ZVwiKSAmJiBzeW1ib2wuY2xhc3NMaXN0LmFkZChcImN1cnNvci1hY3RpdmVcIik7XG4gICAgICAgIHN5bWJvbC5jbGFzc0xpc3QgJiYgc3ltYm9sLmNsYXNzTGlzdC5jb250YWlucyhcImN1cnNvci1oaWRkZW5cIikgJiYgc3ltYm9sLmNsYXNzTGlzdC5yZW1vdmUoXCJjdXJzb3ItaGlkZGVuXCIpO1xuICAgICAgfSBlbHNlIHtcbiAgICAgICAgc3ltYm9sLmNsYXNzTGlzdCAmJiBzeW1ib2wuY2xhc3NMaXN0LmNvbnRhaW5zKFwiY3Vyc29yLWFjdGl2ZVwiKSAmJiBzeW1ib2wuY2xhc3NMaXN0LnJlbW92ZShcImN1cnNvci1hY3RpdmVcIik7XG4gICAgICAgIHN5bWJvbC5jbGFzc0xpc3QgJiYgIXN5bWJvbC5jbGFzc0xpc3QuY29udGFpbnMoXCJjdXJzb3ItaGlkZGVuXCIpICYmIHN5bWJvbC5jbGFzc0xpc3QuYWRkKFwiY3Vyc29yLWhpZGRlblwiKTtcbiAgICAgIH1cbiAgICAgIFxuICAgIH0pO1xuICB9O1xuICBcbiAgdGhpcy51cGRhdGUgPSBmdW5jdGlvbigpIHtcbiAgICBpbnZhbGlkYXRlLmNhbGwodGhpcyk7XG4gICAgcmVuZGVyLmNhbGwodGhpcyk7XG4gIH07XG4gIFxuICB0aGlzLmFkZCA9IGZ1bmN0aW9uKGN1cnNvcikge1xuICAgIGlmIChjdXJzb3JzLmluZGV4T2YoY3Vyc29yKSA9PT0gLTEpIHtcbiAgICAgIGN1cnNvcnMucHVzaChjdXJzb3IpO1xuICAgICAgdGhpcy51cGRhdGUoKTtcbiAgICB9XG4gIH07XG4gIFxuICB0aGlzLnJlbW92ZSA9IGZ1bmN0aW9uKGN1cnNvcikge1xuICAgIGN1cnNvcnMuc3BsaWNlKGN1cnNvcnMuaW5kZXhPZihjdXJzb3IpLCAxKTtcbiAgICB0aGlzLnVwZGF0ZSgpO1xuICB9O1xuICBcbiAgdmFyIG1vdXNlUHJvdmlkZXJzID0gW107XG4gIGZ1bmN0aW9uIHNldE1vdXNlUHJvdmlkZXJzKGVsZW1lbnRzKSB7XG4gICAgZWxlbWVudHMgPSBlbGVtZW50cy5maWx0ZXIoZnVuY3Rpb24obikgeyByZXR1cm4gKG4pOyB9KTtcbiAgICBtb3VzZVByb3ZpZGVycy5mb3JFYWNoKGZ1bmN0aW9uKGVsZW1lbnQpIHtcbiAgICAgIGlmIChlbGVtZW50cy5pbmRleE9mKGVsZW1lbnQpID09PSAtMSkge1xuICAgICAgICByZW1vdmVNb3VzZUxpc3RlbmVycyhlbGVtZW50KTtcbiAgICAgIH1cbiAgICB9KTtcbiAgICBlbGVtZW50cy5mb3JFYWNoKGZ1bmN0aW9uKGVsZW1lbnQpIHtcbiAgICAgIGlmIChtb3VzZVByb3ZpZGVycy5pbmRleE9mKGVsZW1lbnQpID09PSAtMSkge1xuICAgICAgICBhZGRNb3VzZUxpc3RlbmVycyhlbGVtZW50KTtcbiAgICAgIH1cbiAgICB9KTtcbiAgICBtb3VzZVByb3ZpZGVycyA9IGVsZW1lbnRzO1xuICB9XG4gIFxuICBmdW5jdGlvbiBhZGRNb3VzZUxpc3RlbmVycyhlbGVtZW50KSB7XG4gICAgZm9yICh2YXIgaSA9IDAsIGV2ZW50OyBldmVudCA9IGV2ZW50c1tpXTsgaSsrKSB7XG4gICAgICBlbGVtZW50LmFkZEV2ZW50TGlzdGVuZXIoZXZlbnQsIGhhbmRsZUV2ZW50KTtcbiAgICB9XG4gIH1cbiAgXG4gIGZ1bmN0aW9uIHJlbW92ZU1vdXNlTGlzdGVuZXJzKGVsZW1lbnQpIHtcbiAgICBmb3IgKHZhciBpID0gMCwgZXZlbnQ7IGV2ZW50ID0gZXZlbnRzW2ldOyBpKyspIHtcbiAgICAgIGVsZW1lbnQucmVtb3ZlRXZlbnRMaXN0ZW5lcihldmVudCwgaGFuZGxlRXZlbnQpO1xuICAgIH1cbiAgfVxuICBcbiAgaW5pdC5jYWxsKHRoaXMpO1xuICBcbn1cblxuXG5cbmZ1bmN0aW9uIGdldEN1cnNvckl0ZW0oY3Vyc29yKSB7XG4gIFxuICB2YXJcbiAgICBlbGVtZW50ID0gY3Vyc29yLmdldCgnZWxlbWVudCcpLFxuICAgIHByb3BzID0gY3Vyc29yLmdldCgpLCBcbiAgICBzeW1ib2wgPSBwcm9wcy5zeW1ib2wsIFxuICAgIGJvdW5kcyA9IHByb3BzLmJvdW5kcyxcbiAgICBvZmZzZXQgPSBwcm9wcy5vZmZzZXQsXG4gICAgc3R5bGUgPSBwcm9wcy5zdHlsZSxcbiAgICBzY2FsZSA9IHByb3BzLnNjYWxlLFxuICAgIHRhcmdldCA9IHByb3BzLnRhcmdldCB8fCBzeW1ib2wubm9kZU5hbWUudG9Mb3dlckNhc2UoKSA9PT0gJ2EnID8gc3ltYm9sIDogZWxlbWVudCxcbiAgICBjb250YWluZXIsXG4gICAgZGlzcGxheSA9IGVsZW1lbnQuc3R5bGUuZGlzcGxheTtcbiAgICBcbiAgLy8gRm9yY2UgdmlzaWJpbGl0eSB0byBnZXQgdGhpbmdzIG1lYXN1cmVkXG4gIGNzcyhlbGVtZW50LCB7XG4gICAgZGlzcGxheTogJydcbiAgfSk7XG4gIFxuICAvLyBcbiAgcHJvcHMgPSBjdXJzb3IuZ2V0KCk7XG4gIFxuICBzeW1ib2wgPSBwcm9wcy5zeW1ib2w7XG4gIGJvdW5kcyA9IHByb3BzLmJvdW5kcztcbiAgb2Zmc2V0ID0gcHJvcHMub2Zmc2V0O1xuICBzdHlsZSA9IHByb3BzLnN0eWxlO1xuICBzY2FsZSA9IHByb3BzLnNjYWxlO1xuICB0YXJnZXQgPSBwcm9wcy50YXJnZXQgfHwgc3ltYm9sLm5vZGVOYW1lLnRvTG93ZXJDYXNlKCkgPT09ICdhJyA/IHN5bWJvbCA6IGVsZW1lbnQ7XG4gIFxuICAvLyBBZGQgY3Vyc29yIHN5bWJvbCB0byBkb21cbiAgaWYgKCFzeW1ib2wucGFyZW50Tm9kZSkge1xuICAgIGVsZW1lbnQuYXBwZW5kQ2hpbGQoc3ltYm9sKTtcbiAgfVxuICBcbiAgLy8gR2V0IGJvdW5kcyBhbmQgY29udGFpbmVyXG4gIGlmIChib3VuZHMgJiYgYm91bmRzLmdldEJvdW5kaW5nQ2xpZW50UmVjdCkge1xuICAgIC8vIEVsZW1lbnQgYm91bmRzXG4gICAgY29udGFpbmVyID0gYm91bmRzO1xuICAgIGJvdW5kcyA9IGdldEJvdW5kaW5nUmVjdChib3VuZHMpO1xuICB9IGVsc2Uge1xuICAgIC8vIE9iamVjdCBib3VuZHM6IEVpdGhlciBjaG9vc2Ugc3ltYm9sJ3MsIGVsZW1lbnQncyBvZmZzZXRQYXJlbnQgb3Igcm9vdCBhcyBjb250YWluZXJcbiAgICAvLyBGSVhNRTogRGVzY2VuZGFudHMgb2YgYm9keSB3aXRoIHBvc2l0aW9uOiBmaXhlZCB3b3VsZG4ndCBoYXZlIG9mZnNldFBhcmVudDogaHR0cDovL3N0YWNrb3ZlcmZsb3cuY29tL3F1ZXN0aW9ucy8zMDYzMDUvd2hhdC13b3VsZC1tYWtlLW9mZnNldHBhcmVudC1udWxsXG4gICAgY29udGFpbmVyID0gc3ltYm9sLm9mZnNldFBhcmVudCB8fCBlbGVtZW50ICYmIGVsZW1lbnQgPT09IHN5bWJvbCA/IGVsZW1lbnQub2Zmc2V0UGFyZW50IHx8IGRvY3VtZW50LmRvY3VtZW50RWxlbWVudCA6IGVsZW1lbnQ7XG4gICAgdmFyIHJlY3QgPSBnZXRCb3VuZGluZ1JlY3QoY29udGFpbmVyKTtcbiAgICBcbiAgICB2YXIgY29udGFpbmVyUG9zID0gZ2V0T2Zmc2V0KGNvbnRhaW5lcikgfHwge3g6IDAsIHk6IDB9O1xuICAgIC8vIFByb2Nlc3MgY3VzdG9tIGZ1bmN0aW9uIFxuICAgIGlmICh0eXBlb2YgYm91bmRzID09PSAnZnVuY3Rpb24nKSB7XG4gICAgICBib3VuZHMgPSBib3VuZHMoY29udGFpbmVyKTtcbiAgICB9XG4gICAgLy8gR2V0IHBlcmNlbnQgdmFsdWVzXG4gICAgdmFyIHggPSB0eXBlb2YgYm91bmRzLnggPT09ICdzdHJpbmcnICYmIGJvdW5kcy54LmluZGV4T2YoXCIlXCIpID49IDAgPyBwYXJzZUZsb2F0KGJvdW5kcy54KSAqIHJlY3Qud2lkdGggLyAxMDAgOiBwYXJzZUZsb2F0KGJvdW5kcy54KTtcbiAgICB2YXIgeSA9IHR5cGVvZiBib3VuZHMueSA9PT0gJ3N0cmluZycgJiYgYm91bmRzLnkuaW5kZXhPZihcIiVcIikgPj0gMCA/IHBhcnNlRmxvYXQoYm91bmRzLnkpICogcmVjdC5oZWlnaHQgLyAxMDAgOiBwYXJzZUZsb2F0KGJvdW5kcy55KTtcbiAgICB2YXIgd2lkdGggPSB0eXBlb2YgYm91bmRzLndpZHRoID09PSAnc3RyaW5nJyAmJiBib3VuZHMud2lkdGguaW5kZXhPZihcIiVcIikgPj0gMCA/IHBhcnNlRmxvYXQoYm91bmRzLndpZHRoKSAqIHJlY3Qud2lkdGggLyAxMDAgOiBwYXJzZUZsb2F0KGJvdW5kcy53aWR0aCk7XG4gICAgdmFyIGhlaWdodCA9IHR5cGVvZiBib3VuZHMuaGVpZ2h0ID09PSAnc3RyaW5nJyAmJiBib3VuZHMuaGVpZ2h0LmluZGV4T2YoXCIlXCIpID49IDAgPyBwYXJzZUZsb2F0KGJvdW5kcy5oZWlnaHQpICogcmVjdC5oZWlnaHQgLyAxMDAgOiBwYXJzZUZsb2F0KGJvdW5kcy5oZWlnaHQpO1xuICAgIGJvdW5kcyA9IHtcbiAgICAgIHg6IGNvbnRhaW5lclBvcy5sZWZ0ICsgeCxcbiAgICAgIHk6IGNvbnRhaW5lclBvcy50b3AgKyB5LFxuICAgICAgd2lkdGg6IHdpZHRoLFxuICAgICAgaGVpZ2h0OiBoZWlnaHRcbiAgICB9O1xuICB9XG4gIFxuICAvLyBSZXNldCB2aXNpYmlsaXR5XG4gIGNzcyhlbGVtZW50LCAnZGlzcGxheScsIGRpc3BsYXkpO1xuICBcbiAgcmV0dXJuIG1lcmdlKHByb3BzLCB7XG4gICAgY3Vyc29yOiBjdXJzb3IsXG4gICAgc3ltYm9sOiBzeW1ib2wsXG4gICAgYm91bmRzOiBib3VuZHMsXG4gICAgY29udGFpbmVyOiBjb250YWluZXIsXG4gICAgdGFyZ2V0OiB0YXJnZXQsXG4gICAgb2Zmc2V0OiBvZmZzZXQsXG4gICAgc3R5bGU6IHN0eWxlLFxuICAgIHNjYWxlOiBzY2FsZVxuICB9KTtcbn1cblxubW9kdWxlLmV4cG9ydHMgPSBDdXJzb3JNYW5hZ2VyOyIsIm1vZHVsZS5leHBvcnRzID0gZnVuY3Rpb24oKSB7XG4gIHZhciBvYmogPSB7fSxcbiAgICBpID0gMCxcbiAgICBpbCA9IGFyZ3VtZW50cy5sZW5ndGgsXG4gICAga2V5O1xuICBmb3IgKDsgaSA8IGlsOyBpKyspIHtcbiAgICBmb3IgKGtleSBpbiBhcmd1bWVudHNbaV0pIHtcbiAgICAgIGlmIChhcmd1bWVudHNbaV0uaGFzT3duUHJvcGVydHkoa2V5KSkge1xuICAgICAgICAgIG9ialtrZXldID0gYXJndW1lbnRzW2ldW2tleV07XG4gICAgICB9XG4gICAgfVxuICB9XG4gIHJldHVybiBvYmo7XG59OyIsInZhciBcblxuICBnZXRTdHlsZSA9IGZ1bmN0aW9uKGVsLCBjc3Nwcm9wKXtcbiAgICBpZiAoZWwuc3R5bGUpXG4gICAgICBpZiAoZWwuY3VycmVudFN0eWxlKSAvL0lFXG4gICAgICAgIHJldHVybiBlbC5jdXJyZW50U3R5bGVbY3NzcHJvcF07XG4gICAgICBlbHNlIGlmIChkb2N1bWVudC5kZWZhdWx0VmlldyAmJiBkb2N1bWVudC5kZWZhdWx0Vmlldy5nZXRDb21wdXRlZFN0eWxlKSAvL0ZpcmVmb3hcbiAgICAgICAgcmV0dXJuIGRvY3VtZW50LmRlZmF1bHRWaWV3LmdldENvbXB1dGVkU3R5bGUoZWwsIFwiXCIpW2Nzc3Byb3BdO1xuICAgICAgZWxzZSAvL3RyeSBhbmQgZ2V0IGlubGluZSBzdHlsZVxuICAgICAgICByZXR1cm4gZWwuc3R5bGVbY3NzcHJvcF07XG4gIH0sXG4gIFxuICBnZXRaSW5kZXggPSBmdW5jdGlvbihlbCkge1xuICAgIHZhciB6SW5kZXggPSBwYXJzZUZsb2F0KGdldFN0eWxlKGVsLCAnekluZGV4JykpO1xuICAgIHpJbmRleCA9ICFpc05hTih6SW5kZXgpID8gekluZGV4IDogMDtcbiAgICBpZiAoekluZGV4ID09PSAwKSB7XG4gICAgICBpZiAoZWwucGFyZW50Tm9kZSkge1xuICAgICAgICByZXR1cm4gZ2V0WkluZGV4KGVsLnBhcmVudE5vZGUpO1xuICAgICAgfVxuICAgIH1cbiAgICByZXR1cm4gekluZGV4O1xuICB9LFxuICBcbiAgaXNDaGlsZE9mID0gZnVuY3Rpb24ocGFyZW50LCBjaGlsZCkge1xuICAgaWYgKCFjaGlsZCB8fCAhcGFyZW50KSB7XG4gICAgIHJldHVybiBmYWxzZTtcbiAgIH1cbiAgIHZhciBub2RlID0gY2hpbGQucGFyZW50Tm9kZTtcbiAgIHdoaWxlIChub2RlICE9IG51bGwpIHtcbiAgICAgaWYgKG5vZGUgPT0gcGFyZW50KSB7XG4gICAgICAgICByZXR1cm4gdHJ1ZTtcbiAgICAgfVxuICAgICBub2RlID0gbm9kZS5wYXJlbnROb2RlO1xuICAgfVxuICAgcmV0dXJuIGZhbHNlO1xuICB9O1xuXG5cbi8vIENvbXBhcmUgVmlzaWJpbGl0eSwgcmV0dXJucyAtMSwgMSBvciAwXG5mdW5jdGlvbiBjb21wYXJlVmlzaWJpbGl0eShhLCBiKSB7XG4gIHZhciB2YSA9IGEgJiYgYS5zdHlsZSAmJiBnZXRTdHlsZShhLCAnZGlzcGxheScpICE9PSAnbm9uZSc7XG4gIHZhciB2YiA9IGIgJiYgYi5zdHlsZSAmJiBnZXRTdHlsZShiLCAnZGlzcGxheScpICE9PSAnbm9uZSc7XG4gIGlmICh2YSAmJiAhdmIpIHtcbiAgICByZXR1cm4gLTE7XG4gIH0gZWxzZSBpZiAodmIgJiYgIXZhKSB7XG4gICAgcmV0dXJuIDE7XG4gIH1cbiAgcmV0dXJuIDA7XG59XG5cbi8vIENvbXBhcmUgWi1JbmRleCwgcmV0dXJucyAtMSwgMSBvciAwXG5mdW5jdGlvbiBjb21wYXJlUG9zaXRpb25TdGFjayhhLCBiKSB7XG4gIHZhciBwYSA9IGdldFN0eWxlKGEsICdwb3NpdGlvbicpO1xuICB2YXIgcGIgPSBnZXRTdHlsZShiLCAncG9zaXRpb24nKTtcbiAgaWYgKHphID4gemIpIHtcbiAgICByZXR1cm4gLTE7XG4gIH0gZWxzZSBpZiAoemIgPiB6YSkge1xuICAgIHJldHVybiAxO1xuICB9XG4gIHJldHVybiAwO1xufVxuXG5cbi8vIENvbXBhcmUgWi1JbmRleCwgcmV0dXJucyAtMSwgMSBvciAwXG5mdW5jdGlvbiBjb21wYXJlWkluZGV4KGEsIGIpIHtcbiAgdmFyIHphID0gZ2V0WkluZGV4KGEpO1xuICB2YXIgemIgPSBnZXRaSW5kZXgoYik7XG4gIGlmICh6YSA+IHpiKSB7XG4gICAgcmV0dXJuIC0xO1xuICB9IGVsc2UgaWYgKHpiID4gemEpIHtcbiAgICByZXR1cm4gMTtcbiAgfVxuICByZXR1cm4gMDtcbn1cblxuLy8gQ29tcGFyZSBQb3NpdGlvbiAtIE1JVCBMaWNlbnNlZCwgSm9obiBSZXNpZ1xuZnVuY3Rpb24gY29tcGFyZVBvc2l0aW9uKGEsIGIpe1xuICByZXR1cm4gYS5jb21wYXJlRG9jdW1lbnRQb3NpdGlvbiA/XG4gICAgYS5jb21wYXJlRG9jdW1lbnRQb3NpdGlvbihiKSA6XG4gICAgYS5jb250YWlucyA/XG4gICAgICAoYSAhPSBiICYmIGEuY29udGFpbnMoYikgJiYgMTYpICtcbiAgICAgICAgKGEgIT0gYiAmJiBiLmNvbnRhaW5zKGEpICYmIDgpICtcbiAgICAgICAgKGEuc291cmNlSW5kZXggPj0gMCAmJiBiLnNvdXJjZUluZGV4ID49IDAgP1xuICAgICAgICAgIChhLnNvdXJjZUluZGV4IDwgYi5zb3VyY2VJbmRleCAmJiA0KSArXG4gICAgICAgICAgICAoYS5zb3VyY2VJbmRleCA+IGIuc291cmNlSW5kZXggJiYgMikgOlxuICAgICAgICAgIDEpICtcbiAgICAgIDAgOlxuICAgICAgMDtcbn1cblxubW9kdWxlLmV4cG9ydHMgPSBmdW5jdGlvbihhLCBiKSB7XG4gIC8vIENvbXBhcmUgVmlzaWJpbGl0eVxuICB2YXIgdmlzaWJpbGl0eSA9IGNvbXBhcmVWaXNpYmlsaXR5KGEsIGIpO1xuICBpZiAodmlzaWJpbGl0eSAhPT0gMCkge1xuICAgIHJldHVybiB2aXNpYmlsaXR5IDwgMCA/IGEgOiBiO1xuICB9IFxuICBcbiAgLy8gQ29tcGFyZSBwYXJlbnQvY2hpbGQgcmVsYXRpb25cbiAgaWYgKGlzQ2hpbGRPZihhLCBiKSkge1xuICAgIC8vIGlmIGIgaXMgY29udGFpbmVkIGluIGEsIGl0J3MgYWx3YXlzIG9uIHRvcFxuICAgIHJldHVybiBiO1xuICB9XG4gIFxuICAvLyBDb21wYXJlIFotSW5kZXggU3RhY2tcbiAgdmFyIHpJbmRleENvbXBhcmlzb25SZXN1bHQgPSBjb21wYXJlWkluZGV4KGEsIGIpO1xuICBpZiAoekluZGV4Q29tcGFyaXNvblJlc3VsdCA9PT0gLTEpIHtcbiAgICAvLyBhIGlzIG9uIHRvcFxuICAgIHJldHVybiBhO1xuICB9XG4gIGlmICh6SW5kZXhDb21wYXJpc29uUmVzdWx0ID09PSAxKSB7XG4gICAgLy8gYiBpcyBvbiB0b3BcbiAgICByZXR1cm4gYjtcbiAgfVxuICAvLyBUT0RPOiBDb21wYXJlIEFuY2VzdG9yIFBvc2l0aW9uIFN0YWNrXG4gIFxuICAvLyBDb21wYXJlIERvY3VtZW50IFBvc2l0aW9uXG4gIHZhciBkb2N1bWVudFBvc2l0aW9uUmVzdWx0ID0gY29tcGFyZVBvc2l0aW9uKGEsIGIpO1xuICBpZiAoZG9jdW1lbnRQb3NpdGlvblJlc3VsdCA9PT0gMikge1xuICAgIC8vIGEgaXMgcHJlY2VkaW5nXG4gICAgcmV0dXJuIGE7XG4gIH1cbiAgaWYgKGRvY3VtZW50UG9zaXRpb25SZXN1bHQgPT09IDQpIHtcbiAgICAvLyBiIGlzIGZvbGxvd2luZ1xuICAgIHJldHVybiBiO1xuICB9XG4gIFxuICByZXR1cm4gYTtcbn07Il19
