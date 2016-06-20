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
  
  function getParents(element, selector) {
    var parents = [];
    var parent = element;
    while (parent = parent.parentElement && parent.parentElement.closest(selector)) {
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
    // Object bounds
    container = symbol.offsetParent || element;
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
//# sourceMappingURL=data:application/json;charset:utf-8;base64,eyJ2ZXJzaW9uIjozLCJzb3VyY2VzIjpbIm5vZGVfbW9kdWxlcy9ncnVudC1icm93c2VyaWZ5L25vZGVfbW9kdWxlcy9icm93c2VyaWZ5L25vZGVfbW9kdWxlcy9icm93c2VyLXBhY2svX3ByZWx1ZGUuanMiLCJzcmMvY3Vyem9yeS5qcyIsInNyYy9saWIvQ3Vyc29yLmpzIiwic3JjL2xpYi9DdXJzb3JNYW5hZ2VyLmpzIiwic3JjL2xpYi9tZXJnZS5qcyIsInNyYy9saWIvdG9wbW9zdC5qcyJdLCJuYW1lcyI6W10sIm1hcHBpbmdzIjoiQUFBQTtBQ0FBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBOztBQ1RBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTs7QUMzR0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7O0FDcmNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7O0FDYkE7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQSIsImZpbGUiOiJnZW5lcmF0ZWQuanMiLCJzb3VyY2VSb290IjoiIiwic291cmNlc0NvbnRlbnQiOlsiKGZ1bmN0aW9uIGUodCxuLHIpe2Z1bmN0aW9uIHMobyx1KXtpZighbltvXSl7aWYoIXRbb10pe3ZhciBhPXR5cGVvZiByZXF1aXJlPT1cImZ1bmN0aW9uXCImJnJlcXVpcmU7aWYoIXUmJmEpcmV0dXJuIGEobywhMCk7aWYoaSlyZXR1cm4gaShvLCEwKTt2YXIgZj1uZXcgRXJyb3IoXCJDYW5ub3QgZmluZCBtb2R1bGUgJ1wiK28rXCInXCIpO3Rocm93IGYuY29kZT1cIk1PRFVMRV9OT1RfRk9VTkRcIixmfXZhciBsPW5bb109e2V4cG9ydHM6e319O3Rbb11bMF0uY2FsbChsLmV4cG9ydHMsZnVuY3Rpb24oZSl7dmFyIG49dFtvXVsxXVtlXTtyZXR1cm4gcyhuP246ZSl9LGwsbC5leHBvcnRzLGUsdCxuLHIpfXJldHVybiBuW29dLmV4cG9ydHN9dmFyIGk9dHlwZW9mIHJlcXVpcmU9PVwiZnVuY3Rpb25cIiYmcmVxdWlyZTtmb3IodmFyIG89MDtvPHIubGVuZ3RoO28rKylzKHJbb10pO3JldHVybiBzfSkiLCJ2YXJcbiAgQ3Vyc29yTWFuYWdlciA9IHJlcXVpcmUoJy4vbGliL0N1cnNvck1hbmFnZXInKSxcbiAgQ3Vyc29yID0gcmVxdWlyZSgnLi9saWIvQ3Vyc29yJyk7XG4gIGN1cnNvck1hbmFnZXIgPSBuZXcgQ3Vyc29yTWFuYWdlcigpO1xuXG5tb2R1bGUuZXhwb3J0cyA9IGZ1bmN0aW9uIGN1cnpvcnkoZWxlbWVudCwgb3B0aW9ucykge1xuICB2YXIgY3Vyc29yID0gbmV3IEN1cnNvcihlbGVtZW50LCBvcHRpb25zKTtcbiAgY3Vyc29yTWFuYWdlci5hZGQoY3Vyc29yKTtcbiAgcmV0dXJuIGN1cnNvcjtcbn07IiwidmFyXG4gIG1lcmdlID0gcmVxdWlyZSgnLi9tZXJnZScpLFxuICBcbiAgY3JlYXRlRWxlbWVudCA9IGZ1bmN0aW9uKHN0cmluZykge1xuICAgIHZhciBlbGVtZW50ID0gZG9jdW1lbnQuY3JlYXRlRWxlbWVudCgnZGl2Jyk7XG4gICAgZWxlbWVudC5pbm5lckhUTUwgPSBzdHJpbmc7XG4gICAgdmFyIHJlc3VsdCA9IGVsZW1lbnQuZmlyc3RDaGlsZDtcbiAgICBlbGVtZW50LnJlbW92ZUNoaWxkKHJlc3VsdCk7XG4gICAgcmV0dXJuIHJlc3VsdDtcbiAgfSxcblxuICBpc0hUTUwgPSBmdW5jdGlvbihzdHJpbmcpIHtcbiAgICByZXR1cm4gdHlwZW9mIHN0cmluZyA9PT0gJ3N0cmluZycgJiYgc3RyaW5nLm1hdGNoKC88XFwvP1xcdysoKFxccytcXHcrKFxccyo9XFxzKig/OlwiLio/XCJ8Jy4qPyd8W14nXCI+XFxzXSspKT8pK1xccyp8XFxzKilcXC8/Pi8pO1xuICB9LFxuICBcblxuICBnZXRFbGVtZW50ID0gZnVuY3Rpb24odmFsdWUsIHBhcmVudCkge1xuICAgIHZhbHVlID0gdmFsdWUudG9BcnJheSA/IHZhbHVlLnRvQXJyYXkoKVswXSA6IHZhbHVlIGluc3RhbmNlb2YgQXJyYXkgPyB2YWx1ZVswXSA6IHZhbHVlO1xuICAgIGlmICh0eXBlb2YgdmFsdWUgPT09ICdmdW5jdGlvbicpIHtcbiAgICAgIHZhbHVlID0gdmFsdWUuY2FsbCh0aGlzLCB2YWx1ZSk7XG4gICAgfVxuICAgIGlmICh0eXBlb2YgdmFsdWUgPT09ICdzdHJpbmcnKSB7XG4gICAgICBpZiAoaXNIVE1MKHZhbHVlKSkge1xuICAgICAgICB2YWx1ZSA9IGNyZWF0ZUVsZW1lbnQodmFsdWUpO1xuICAgICAgfSBlbHNlIHtcbiAgICAgICAgdmFsdWUgPSBwYXJlbnQucXVlcnlTZWxlY3Rvcih2YWx1ZSk7XG4gICAgICB9XG4gICAgfVxuICAgIGlmICh2YWx1ZSAmJiB2YWx1ZS5ub2RlTmFtZSkge1xuICAgICAgcmV0dXJuIHZhbHVlO1xuICAgIH1cbiAgICByZXR1cm4gbnVsbDtcbiAgfTtcblxubW9kdWxlLmV4cG9ydHMgPSBmdW5jdGlvbiBDdXJzb3IoZWxlbWVudCwgb3B0aW9ucykge1xuICAgIFxuICBmdW5jdGlvbiBzZXQobmFtZSwgdmFsdWUpIHtcbiAgICB2YXIgb3B0cztcbiAgICBpZiAodHlwZW9mIG5hbWUgPT09ICdvYmplY3QnKSB7XG4gICAgICBvcHRzID0gbmFtZTtcbiAgICB9IGVsc2Uge1xuICAgICAgb3B0cyA9IHt9O1xuICAgICAgb3B0c1tuYW1lXSA9IHZhbHVlO1xuICAgIH1cbiAgICBmb3IgKG5hbWUgaW4gb3B0cykge1xuICAgICAgdmFsdWUgPSBvcHRzW25hbWVdO1xuICAgICAgc3dpdGNoIChuYW1lKSB7XG4gICAgICAgIGNhc2UgJ2VsZW1lbnQnOlxuICAgICAgICBjYXNlICdzeW1ib2wnOlxuICAgICAgICAgIGlmIChpc0hUTUwodmFsdWUpKSB7XG4gICAgICAgICAgICB2YWx1ZSA9IGNyZWF0ZUVsZW1lbnQodmFsdWUpO1xuICAgICAgICAgIH1cbiAgICAgICAgICBicmVhaztcbiAgICAgIH1cbiAgICAgIG9wdHNbbmFtZV0gPSB2YWx1ZTtcbiAgICB9XG4gICAgb3B0aW9ucyA9IG1lcmdlKG9wdGlvbnMsIG9wdHMpO1xuICB9O1xuICBcbiAgdGhpcy5zZXQgPSBmdW5jdGlvbigpIHtcbiAgICBzZXQuY2FsbCh0aGlzLCBhcmd1bWVudHMpO1xuICAgIGN1cnNvck1hbmFnZXIudXBkYXRlKCk7XG4gIH07XG4gIFxuICB0aGlzLmdldCA9IGZ1bmN0aW9uKG5hbWUpIHtcbiAgICB2YXIgdmFsdWU7XG4gICAgaWYgKCFuYW1lKSB7XG4gICAgICB2YWx1ZSA9IHt9O1xuICAgICAgZm9yICh2YXIgeCBpbiBvcHRpb25zKSB7XG4gICAgICAgIHZhbHVlW3hdID0gdGhpcy5nZXQoeCk7XG4gICAgICB9XG4gICAgfSBlbHNlIHtcbiAgICAgIHZhbHVlID0gb3B0aW9uc1tuYW1lXTtcbiAgICAgIHN3aXRjaCAobmFtZSkge1xuICAgICAgICBjYXNlICdlbGVtZW50JzpcbiAgICAgICAgY2FzZSAnc3ltYm9sJzpcbiAgICAgICAgY2FzZSAnYm91bmRzJzpcbiAgICAgICAgY2FzZSAndGFyZ2V0JzpcbiAgICAgICAgICB2YWx1ZSA9IHZhbHVlICYmIHZhbHVlLnRvQXJyYXkgPyB2YWx1ZS50b0FycmF5KClbMF0gOiB2YWx1ZSBpbnN0YW5jZW9mIEFycmF5ID8gdmFsdWVbMF0gOiB2YWx1ZTtcbiAgICAgICAgICB2YWx1ZSA9IHR5cGVvZiB2YWx1ZSA9PT0gJ3N0cmluZycgPyAoZWxlbWVudCB8fCBkb2N1bWVudCkucXVlcnlTZWxlY3Rvcih2YWx1ZSkgOiB2YWx1ZTtcbiAgICAgICAgICBicmVhaztcbiAgICAgIH1cbiAgICAgIHN3aXRjaCAobmFtZSkge1xuICAgICAgICBjYXNlICdzeW1ib2wnOlxuICAgICAgICAgIHZhbHVlID0gdmFsdWUgfHwgdGhpcy5nZXQoJ2VsZW1lbnQnKTtcbiAgICAgICAgICBicmVhaztcbiAgICAgICAgY2FzZSAnYm91bmRzJzpcbiAgICAgICAgICB2YWx1ZSA9IHZhbHVlID8gdmFsdWUgOiBvcHRpb25zWydzeW1ib2wnXSA/IHRoaXMuZ2V0KCdlbGVtZW50JykgOiB0aGlzLmdldCgnZWxlbWVudCcpLm9mZnNldFBhcmVudDtcbiAgICAgICAgICBicmVhaztcbiAgICAgIH1cbiAgICB9XG4gICAgcmV0dXJuIHZhbHVlO1xuICB9O1xuICBcbiAgc2V0KG1lcmdlKHtcbiAgICBlbGVtZW50OiBudWxsLFxuICAgIG9mZnNldDoge2xlZnQ6IDgsIHRvcDogNn0sXG4gICAgc3R5bGU6ICd0cmFuc2Zvcm0nLFxuICAgIHNjYWxlOiAxLFxuICAgIGJvdW5kczogbnVsbCxcbiAgICBzeW1ib2w6IG51bGwsXG4gICAgdGFyZ2V0OiBudWxsLFxuICAgIGhpZGVPbkZvY3VzOiBmYWxzZVxuICB9LCBvcHRpb25zLCB7XG4gICAgZWxlbWVudDogZWxlbWVudFxuICB9KSk7XG4gIFxufTsiLCJ2YXJcbiAgXG4gIG1lcmdlID0gcmVxdWlyZSgnLi9tZXJnZScpLFxuICB0b3Btb3N0ID0gcmVxdWlyZSgnLi90b3Btb3N0JyksXG4gIFxuICAvKipcbiAgICogSHlwaGVuYXRlIGEgc3RyaW5nXG4gICAqIEBwYXJhbSB7U3RyaW5nfSBzdHJpbmdcbiAgICovXG4gIGh5cGhlbmF0ZSA9IChmdW5jdGlvbigpIHtcbiAgICB2YXIgY2FjaGUgPSB7fTtcbiAgICByZXR1cm4gZnVuY3Rpb24oc3RyaW5nKSB7XG4gICAgICByZXR1cm4gY2FjaGVbc3RyaW5nXSA9IGNhY2hlW3N0cmluZ10gfHwgKGZ1bmN0aW9uKCkge1xuICAgICAgICByZXR1cm4gc3RyaW5nLnJlcGxhY2UoLyhbQS1aXSkvZywgZnVuY3Rpb24oJDEpe3JldHVybiBcIi1cIiskMS50b0xvd2VyQ2FzZSgpO30pO1xuICAgICAgfSkoKTtcbiAgICB9O1xuICB9KSgpLFxuICBcbiAgZ2V0U3R5bGUgPSBmdW5jdGlvbihlbCwgY3NzcHJvcCl7XG4gICBpZiAoZWwuY3VycmVudFN0eWxlKSAvL0lFXG4gICAgcmV0dXJuIGVsLmN1cnJlbnRTdHlsZVtjc3Nwcm9wXTtcbiAgIGVsc2UgaWYgKGRvY3VtZW50LmRlZmF1bHRWaWV3ICYmIGRvY3VtZW50LmRlZmF1bHRWaWV3LmdldENvbXB1dGVkU3R5bGUpIC8vRmlyZWZveFxuICAgIHJldHVybiBkb2N1bWVudC5kZWZhdWx0Vmlldy5nZXRDb21wdXRlZFN0eWxlKGVsLCBcIlwiKVtjc3Nwcm9wXTtcbiAgIGVsc2UgLy90cnkgYW5kIGdldCBpbmxpbmUgc3R5bGVcbiAgICByZXR1cm4gZWwuc3R5bGVbY3NzcHJvcF07XG4gIH0sXG4gIFxuICB0cmFuc2Zvcm1TdHlsZSA9IChmdW5jdGlvbihwcm9wLCBwcmVmaXhlcykge1xuICAgIHZhciBpLFxuICAgICAgZWxlbSA9IGRvY3VtZW50LmNyZWF0ZUVsZW1lbnQoJ2RpdicpLFxuICAgICAgY2FwaXRhbGl6ZWQgPSBwcm9wLmNoYXJBdCgwKS50b1VwcGVyQ2FzZSgpICsgcHJvcC5zbGljZSgxKTtcbiAgICBmb3IgKGkgPSAwOyBpIDwgcHJlZml4ZXMubGVuZ3RoOyBpKyspIHtcbiAgICAgIGlmICh0eXBlb2YgZWxlbS5zdHlsZVtwcmVmaXhlc1tpXSArIGNhcGl0YWxpemVkXSAhPT0gXCJ1bmRlZmluZWRcIikge1xuICAgICAgICByZXR1cm4gcHJlZml4ZXNbaV0gKyBjYXBpdGFsaXplZDtcbiAgICAgIH1cbiAgICB9XG4gICAgcmV0dXJuIG51bGw7XG4gIH0pKCd0cmFuc2Zvcm0nLCBbJycsICdNb3onLCAnV2Via2l0JywgJ08nLCAnTXMnXSksXG4gIFxuICBpc0NoaWxkT2YgPSBmdW5jdGlvbihwYXJlbnQsIGNoaWxkKSB7XG4gICBpZiAoIWNoaWxkIHx8ICFwYXJlbnQpIHtcbiAgICAgcmV0dXJuIGZhbHNlO1xuICAgfVxuICAgdmFyIG5vZGUgPSBjaGlsZC5wYXJlbnROb2RlO1xuICAgd2hpbGUgKG5vZGUgIT0gbnVsbCkge1xuICAgICBpZiAobm9kZSA9PSBwYXJlbnQpIHtcbiAgICAgICAgIHJldHVybiB0cnVlO1xuICAgICB9XG4gICAgIG5vZGUgPSBub2RlLnBhcmVudE5vZGU7XG4gICB9XG4gICByZXR1cm4gZmFsc2U7XG4gIH0sXG4gIFxuICBjc3MgPSBmdW5jdGlvbihlbGVtLCBuYW1lLCB2YWx1ZSkge1xuICAgIHZhciBtYXAgPSB7fSwgY3NzVGV4dCA9IG51bGw7XG4gICAgaWYgKHR5cGVvZiBuYW1lID09PSAnb2JqZWN0Jykge1xuICAgICAgbWFwID0gbmFtZTtcbiAgICB9IGVsc2UgaWYgKHR5cGVvZiB2YWx1ZSAhPT0gXCJ1bmRlZmluZWRcIikge1xuICAgICAgbWFwW25hbWVdID0gdmFsdWU7XG4gICAgfVxuICAgIHZhciBrZXlzID0gT2JqZWN0LmtleXMobWFwKTtcbiAgICBrZXlzID0ga2V5cy5maWx0ZXIoZnVuY3Rpb24oa2V5LCBpbmRleCkge1xuICAgICAgaWYgKG1hcFtrZXldID09PSAnJykge1xuICAgICAgICBlbGVtLnN0eWxlW2tleV0gPSBtYXBba2V5XTtcbiAgICAgICAgcmV0dXJuIGZhbHNlO1xuICAgICAgfVxuICAgICAgcmV0dXJuIHRydWU7XG4gICAgfSk7XG4gICAgY3NzVGV4dCA9IGtleXMubWFwKGZ1bmN0aW9uKG5hbWUpIHtcbiAgICAgIHJldHVybiBoeXBoZW5hdGUobmFtZSkgKyBcIjogXCIgKyBtYXBbbmFtZV07XG4gICAgfSkuam9pbihcIjsgXCIpO1xuICAgIGlmIChjc3NUZXh0ICYmIGNzc1RleHQubGVuZ3RoKSB7XG4gICAgICBlbGVtLnN0eWxlLmNzc1RleHQgPSBlbGVtLnN0eWxlLmNzc1RleHQgKyBjc3NUZXh0O1xuICAgICAgcmV0dXJuIG51bGw7XG4gICAgfVxuICAgIHJldHVybiBlbGVtLnN0eWxlW25hbWVdIHx8IHdpbmRvdy5nZXRDb21wdXRlZFN0eWxlKGVsZW0sIG51bGwpLmdldFByb3BlcnR5VmFsdWUobmFtZSk7XG4gIH0sXG4gIFxuICBnZXRPZmZzZXQgPSBmdW5jdGlvbihlbGVtZW50KSB7XG4gICAgdmFyXG4gICAgICBzY3JvbGxPZmZzZXQgPSBnZXRTY3JvbGxPZmZzZXQoKSxcbiAgICAgIHJlY3QgPSBlbGVtZW50LmdldEJvdW5kaW5nQ2xpZW50UmVjdCgpO1xuICAgIHJldHVybiB7XG4gICAgICB0b3A6IHJlY3QudG9wICsgc2Nyb2xsT2Zmc2V0LnRvcCxcbiAgICAgIGxlZnQ6IHJlY3QubGVmdCArIHNjcm9sbE9mZnNldC5sZWZ0XG4gICAgfTtcbiAgfSxcbiAgXG4gIGdldFNjcm9sbE9mZnNldCA9IGZ1bmN0aW9uKCkge1xuICAgIHJldHVybiB7XG4gICAgICBsZWZ0OiBkb2N1bWVudC5ib2R5ICYmIGRvY3VtZW50LmJvZHkuc2Nyb2xsTGVmdCArIGRvY3VtZW50LmRvY3VtZW50RWxlbWVudC5zY3JvbGxMZWZ0LFxuICAgICAgdG9wOiBkb2N1bWVudC5ib2R5ICYmIGRvY3VtZW50LmJvZHkuc2Nyb2xsVG9wICsgZG9jdW1lbnQuZG9jdW1lbnRFbGVtZW50LnNjcm9sbFRvcFxuICAgIH07XG4gIH0sXG4gIFxuICBnZXRCb3VuZGluZ1JlY3QgPSBmdW5jdGlvbihlbGVtZW50KSB7XG4gICAgaWYgKCFlbGVtZW50KSB7XG4gICAgICByZXR1cm4ge1xuICAgICAgICB4OiAtSW5maW5pdHksXG4gICAgICAgIHk6IC1JbmZpbml0eSxcbiAgICAgICAgd2lkdGg6IEluZmluaXR5LFxuICAgICAgICBoZWlnaHQ6IEluZmluaXR5XG4gICAgICB9O1xuICAgIH1cbiAgICB2YXIgc2Nyb2xsT2Zmc2V0ID0gZ2V0U2Nyb2xsT2Zmc2V0KCk7XG4gICAgdmFyIHJlY3QgPSBlbGVtZW50LmdldEJvdW5kaW5nQ2xpZW50UmVjdCgpO1xuICAgIHJldHVybiB7XG4gICAgICB4OiByZWN0LmxlZnQgKyBzY3JvbGxPZmZzZXQubGVmdCxcbiAgICAgIHk6IHJlY3QudG9wICsgc2Nyb2xsT2Zmc2V0LnRvcCxcbiAgICAgIHdpZHRoOiByZWN0LndpZHRoLFxuICAgICAgaGVpZ2h0OiByZWN0LmhlaWdodFxuICAgIH07XG4gIH0sXG4gIFxuICAvLyBEZWNsYXJlIHNpbmdsZXRvbiBpbnN0YW5jZVxuICBpbnN0YW5jZSA9IG51bGw7XG5cbi8qKlxuICogQ3Vyc29yTWFuYWdlclxuICogVGhpcyBzaW5nbGV0b24gY2xhc3MgaGFuZGxlcyBhbGwgY3Vyc29yIG9iamVjdHMgXG4gKiBAcGFyYW0ge09iamVjdH0gb3B0aW9uc1xuICovXG5mdW5jdGlvbiBDdXJzb3JNYW5hZ2VyKG9wdGlvbnMpIHtcbiAgLy8gU2luZ2xldG9uIHBhdHRlcm5cbiAgaWYgKGluc3RhbmNlKSB7XG4gICAgaW5zdGFuY2Uuc2V0KG9wdGlvbnMpO1xuICAgIHJldHVybiBpbnN0YW5jZTtcbiAgfVxuICBpbnN0YW5jZSA9IHRoaXM7XG4gIC8vIEltcGxlbWVudGF0aW9uXG4gIFxuICB2YXIgY3Vyc29ycyA9IFtdO1xuICB2YXIgY2xpZW50ID0ge3g6IDAsIHk6IDB9O1xuICB2YXIgbW91c2UgPSB7eDogLUluZmluaXR5LCB5OiAtSW5maW5pdHksIGVsZW1lbnQ6IG51bGx9O1xuICB2YXIgZXZlbnRzID0gWydtb3VzZWRvd24nLCAnY2xpY2snLCAnc2Nyb2xsJywgJ3Jlc2l6ZScsICdtb3VzZW1vdmUnLCAnbW91c2VvdXQnXTtcbiAgdmFyIGN1cnNvckl0ZW1zID0gW107XG4gIHZhciBjdXJzb3JJdGVtID0gbnVsbDtcbiAgdmFyIGNsaWNraW5nID0gZmFsc2U7XG4gIHZhciBjbGlja2FibGUgPSB0cnVlO1xuICBcbiAgZnVuY3Rpb24gaW5pdCgpIHtcbiAgICBpZiAoISgnb250b3VjaCcgaW4gd2luZG93KSkge1xuICAgICAgYWRkTW91c2VMaXN0ZW5lcnMod2luZG93KTtcbiAgICB9XG4gIH1cbiAgXG4gIGZ1bmN0aW9uIGhhbmRsZUV2ZW50KGUpIHtcbiAgICBcbiAgICAvLyBDaGVjayBmb3IgYWNjZXNzIHRvIGV2ZW50J3MgdHlwZSBwcm9wZXJ0eVxuICAgIHRyeSB7XG4gICAgICBlLnR5cGU7XG4gICAgfSBjYXRjaCAoZSkge1xuICAgICAgY29uc29sZS53YXJuKGUpO1xuICAgICAgcmV0dXJuO1xuICAgIH1cbiAgICAvLyBVcGRhdGUgTW91c2UgUG9zaXRpb25cbiAgICBzd2l0Y2ggKGUudHlwZSkge1xuICAgICAgY2FzZSAnbW91c2Vkb3duJzpcbiAgICAgICAgY2xpY2tpbmcgPSBmYWxzZTtcbiAgICAgICAgYnJlYWs7XG4gICAgICBjYXNlICdtb3VzZW91dCc6XG4gICAgICAgIHZhciByZWxhdGVkVGFyZ2V0ID0gdHlwZW9mIGUudG9FbGVtZW50ICE9ICd1bmRlZmluZWQnID8gZS50b0VsZW1lbnQgOiBlLnJlbGF0ZWRUYXJnZXQ7XG4gICAgICAgIGlmIChyZWxhdGVkVGFyZ2V0ID09PSBudWxsKSB7XG4gICAgICAgICAgbW91c2UueCA9IC1JbmZpbml0eTtcbiAgICAgICAgICBtb3VzZS55ID0gLUluZmluaXR5O1xuICAgICAgICAgIG1vdXNlLmVsZW1lbnQgPSBudWxsO1xuICAgICAgICB9XG4gICAgICAgIGJyZWFrO1xuICAgICAgY2FzZSAnbW91c2Vtb3ZlJzpcbiAgICAgICAgLy8gR2V0IG1vdXNlIGNvb3JkaW5hdGVzXG4gICAgICAgIC8vIFVwZGF0ZSBtb3VzZSBjb29yZGluYXRlc1xuICAgICAgICBjbGllbnQueCA9IGUuY2xpZW50WDtcbiAgICAgICAgY2xpZW50LnkgPSBlLmNsaWVudFk7XG4gICAgICBkZWZhdWx0OlxuICAgICAgdmFyIHNjcm9sbE9mZnNldCA9IGdldFNjcm9sbE9mZnNldCgpO1xuICAgICAgbW91c2UueCA9IGNsaWVudC54ICsgc2Nyb2xsT2Zmc2V0LmxlZnQ7XG4gICAgICBtb3VzZS55ID0gY2xpZW50LnkgKyBzY3JvbGxPZmZzZXQudG9wO1xuICAgICAgbW91c2UuZWxlbWVudCA9IGUudGFyZ2V0O1xuICAgICAgXG4gICAgICBcbiAgICB9XG4gICAgXG4gICAgLy8gR2V0IEN1cnNvciBQcm9wc1xuICAgIGludmFsaWRhdGUuY2FsbCh0aGlzKTtcbiAgICBcbiAgICAvLyBQcm9jZXNzIENsaWNrXG4gICAgc3dpdGNoIChlLnR5cGUpIHtcbiAgICAgIGNhc2UgJ2NsaWNrJzpcbiAgICAgICAgaWYgKCFjbGlja2luZyAmJiBjdXJzb3JJdGVtKSB7XG4gICAgICAgICAgY2xpY2tpbmcgPSB0cnVlO1xuICAgICAgICAgIGlmIChtb3VzZS5lbGVtZW50ICYmIGN1cnNvckl0ZW0gJiYgY3Vyc29ySXRlbS50YXJnZXQgJiYgY3Vyc29ySXRlbS5zeW1ib2wgIT09IG1vdXNlLmVsZW1lbnQgJiYgaXNDaGlsZE9mKGN1cnNvckl0ZW0uY29udGFpbmVyLCBtb3VzZS5lbGVtZW50KSkge1xuICAgICAgICAgICAgLy9lLnN0b3BJbW1lZGlhdGVQcm9wYWdhdGlvbigpO1xuICAgICAgICAgICAgLy9lLnByZXZlbnREZWZhdWx0KCk7XG4gICAgICAgICAgICBjdXJzb3JJdGVtLnRhcmdldC5jbGljaygpO1xuICAgICAgICAgIH1cbiAgICAgICAgICB2YXIgY2xpY2sgPSBjdXJzb3JJdGVtICYmIGN1cnNvckl0ZW0uY2xpY2s7XG4gICAgICAgICAgaWYgKHR5cGVvZiBjbGljayA9PT0gJ2Z1bmN0aW9uJykge1xuICAgICAgICAgICAgY2xpY2suY2FsbChjdXJzb3JJdGVtLmVsZW1lbnQsIGUpO1xuICAgICAgICAgIH1cbiAgICAgICAgfVxuICAgICAgICAvL2Uuc3RvcFByb3BhZ2F0aW9uKCk7XG4gICAgICAgIGJyZWFrO1xuICAgIH1cbiAgICAvLyBVcGRhdGUgY3Vyc29yc1xuICAgIHJlbmRlci5jYWxsKGluc3RhbmNlKTtcbiAgfVxuICBcbiAgZnVuY3Rpb24gZ2V0UGFyZW50cyhlbGVtZW50LCBzZWxlY3Rvcikge1xuICAgIHZhciBwYXJlbnRzID0gW107XG4gICAgdmFyIHBhcmVudCA9IGVsZW1lbnQ7XG4gICAgd2hpbGUgKHBhcmVudCA9IHBhcmVudC5wYXJlbnRFbGVtZW50ICYmIHBhcmVudC5wYXJlbnRFbGVtZW50LmNsb3Nlc3Qoc2VsZWN0b3IpKSB7XG4gICAgICBwYXJlbnRzLnB1c2gocGFyZW50KTtcbiAgICB9XG4gICAgcmV0dXJuIHBhcmVudHM7XG4gIH1cbiAgXG4gIGZ1bmN0aW9uIGludmFsaWRhdGUoKSB7XG4gICAgXG4gICAgY3Vyc29ySXRlbXMgPSBjdXJzb3JzLm1hcChmdW5jdGlvbihjdXJzb3IsIGluZGV4KSB7XG4gICAgICByZXR1cm4gZ2V0Q3Vyc29ySXRlbShjdXJzb3IsIGN1cnNvckl0ZW1zW2luZGV4XSk7XG4gICAgfSk7XG4gICAgXG4gICAgdmFyXG4gICAgICBmaWx0ZXJlZCA9IGN1cnNvckl0ZW1zLmZpbHRlcihmdW5jdGlvbihjdXJzb3JJdGVtLCBpbmRleCkge1xuICAgICAgICB2YXIgbW91c2VFbGVtZW50ID0gbW91c2UuZWxlbWVudCwgc3ltYm9sID0gY3Vyc29ySXRlbS5zeW1ib2wsIGJvdW5kcyA9IGN1cnNvckl0ZW0uYm91bmRzLCBjb250YWluZXIgPSBjdXJzb3JJdGVtLmNvbnRhaW5lciwgcmVzdWx0ID0gZmFsc2U7XG4gICAgICAgIC8vIERldGVjdCBpZiBhIG1vdXNlIGVsZW1lbnQgZXhpc3RzIGFuZCB0aGF0IGl0J3Mgbm90IHRoZSBzeW1ib2wgaXRzZWxmXG4gICAgICAgIGlmIChtb3VzZUVsZW1lbnQpIHtcbiAgICAgICAgICAvLyBDaGVjayBpZiBtb3VzZSBlbGVtZW50IGlzIG5vdCBjb250YWluZWQgaW4gYSBsaW5rXG4gICAgICAgICAgaWYgKCFtb3VzZUVsZW1lbnQuaHJlZiAmJiAhZ2V0UGFyZW50cyhtb3VzZUVsZW1lbnQsICdhJykubGVuZ3RoKSB7IFxuICAgICAgICAgICAgLy8gRGV0ZWN0IGlmIHN5bWJvbCBpcyB0b3Btb3N0IGVsZW1lbnRcbiAgICAgICAgICAgIGlmICh0b3Btb3N0KG1vdXNlRWxlbWVudCwgc3ltYm9sKSA9PT0gc3ltYm9sKSB7XG4gICAgICAgICAgICAgIC8vIERldGVjdCBpZiBtb3VzZSBlbGVtZW50IGlzIGNvbnRhaW5lZFxuICAgICAgICAgICAgICBpZiAoY29udGFpbmVyID09PSBtb3VzZUVsZW1lbnQgfHwgaXNDaGlsZE9mKGNvbnRhaW5lciwgbW91c2VFbGVtZW50KSkge1xuICAgICAgICAgICAgICAgIC8vIE1hdGNoIGJvdW5kc1xuICAgICAgICAgICAgICAgIHJlc3VsdCA9IChtb3VzZS54ID49IGJvdW5kcy54ICYmIG1vdXNlLnggPD0gYm91bmRzLnggKyBib3VuZHMud2lkdGggJiYgbW91c2UueSA+PSBib3VuZHMueSAmJiBtb3VzZS55IDw9IGJvdW5kcy55ICsgYm91bmRzLmhlaWdodCk7XG4gICAgICAgICAgICAgIH1cbiAgICAgICAgICAgIH1cbiAgICAgICAgICB9XG4gICAgICAgIH1cbiAgICAgICAgcmV0dXJuIHJlc3VsdDtcbiAgICAgIH0pLFxuICAgICAgc29ydGVkID0gZmlsdGVyZWQuc29ydChmdW5jdGlvbihhLCBiKSB7XG4gICAgICAgIHZhciB6RWxlbWVudCA9IHRvcG1vc3QoYS5zeW1ib2wsIGIuc3ltYm9sKTtcbiAgICAgICAgaWYgKHpFbGVtZW50ID09PSBhLnN5bWJvbCkge1xuICAgICAgICAgIHJldHVybiAtMTtcbiAgICAgICAgfSBlbHNlIGlmICh6RWxlbWVudCA9PT0gYi5zeW1ib2wpIHtcbiAgICAgICAgICByZXR1cm4gMTtcbiAgICAgICAgfVxuICAgICAgICB2YXIgcDEgPSB7eDogYS54ICsgYS53aWR0aCAvIDIsIHk6IGEueSArIGEuaGVpZ2h0IC8gMn07XG4gICAgICAgIHZhciBwMiA9IHt4OiBiLnggKyBiLndpZHRoIC8gMiwgeTogYi55ICsgYi5oZWlnaHQgLyAyfTtcbiAgICAgICAgdmFyIGQxID0gTWF0aC5zcXJ0KCBNYXRoLnBvdygocDEueCAtIG1vdXNlLngpLCAyKSArIE1hdGgucG93KChwMS55IC0gbW91c2UueSksIDIpICk7XG4gICAgICAgIHZhciBkMiA9IE1hdGguc3FydCggTWF0aC5wb3coKHAyLnggLSBtb3VzZS54KSwgMikgKyBNYXRoLnBvdygocDIueSAtIG1vdXNlLnkpLCAyKSApO1xuICAgICAgICByZXR1cm4gZDEgPCBkMiA/IGQxIDogZDEgPiBkMiA/IGQyIDogMDtcbiAgICAgIH0pLnJldmVyc2UoKTtcbiAgICBcbiAgICBjdXJzb3JJdGVtID0gc29ydGVkWzBdO1xuICAgIFxuICAgIFxuICAgIC8vIFNldCBNb3VzZVByb3ZpZGVyc1xuICAgIHNldE1vdXNlUHJvdmlkZXJzKFt3aW5kb3ddLmNvbmNhdChjdXJzb3JJdGVtcy5tYXAoZnVuY3Rpb24oaXRlbSkge1xuICAgICAgcmV0dXJuIGl0ZW0uY29udGFpbmVyO1xuICAgIH0pKSk7XG4gICAgLy9zZXRNb3VzZVByb3ZpZGVycyhbd2luZG93XSk7XG4gIH1cbiAgXG4gIGZ1bmN0aW9uIHJlbmRlcigpIHtcblxuICAgIGN1cnNvckl0ZW1zLmZvckVhY2goZnVuY3Rpb24oaXRlbSkge1xuICAgICAgXG4gICAgICB2YXJcbiAgICAgICAgc3ltYm9sID0gaXRlbS5zeW1ib2wsXG4gICAgICAgIHN0eWxlID0ge1xuICAgICAgICAgIHZpc2liaWxpdHk6IGl0ZW0gPT09IGN1cnNvckl0ZW0gPyAnJyA6ICdoaWRkZW4nLFxuICAgICAgICAgIHBvc2l0aW9uOiAnYWJzb2x1dGUnLFxuICAgICAgICAgIGN1cnNvcjogJ2luaGVyaXQnXG4gICAgICAgIH07XG4gICAgICAgIFxuICAgICAgaWYgKGl0ZW0uc3R5bGUgPT09ICd0cmFuc2Zvcm0nICYmIHRyYW5zZm9ybVN0eWxlKSB7XG4gICAgICAgIHN0eWxlW3RyYW5zZm9ybVN0eWxlICsgXCJPcmlnaW5cIl0gPSAnJztcbiAgICAgICAgc3R5bGVbdHJhbnNmb3JtU3R5bGVdID0gXCJcIjtcbiAgICAgIH0gZWxzZSB7XG4gICAgICAgIHN0eWxlLmxlZnQgPSBcIlwiO1xuICAgICAgICBzdHlsZS50b3AgPSBcIlwiO1xuICAgICAgfVxuICAgICAgXG4gICAgICBzeW1ib2wuY2xhc3NMaXN0ICYmICFzeW1ib2wuY2xhc3NMaXN0LmNvbnRhaW5zKFwiY3Vyc29yXCIpICYmIHN5bWJvbC5jbGFzc0xpc3QuYWRkKFwiY3Vyc29yXCIpO1xuICAgICAgY3NzKHN5bWJvbCwgc3R5bGUpO1xuICAgICAgXG4gICAgICBpZiAoY3Vyc29ySXRlbSA9PT0gaXRlbSkge1xuICAgICAgICBcbiAgICAgICAgdmFyIHBvcyA9IGdldE9mZnNldChzeW1ib2wpO1xuICAgICAgICBcbiAgICAgICAgdmFyIHB4ID0gcG9zLmxlZnQ7XG4gICAgICAgIHZhciBweSA9IHBvcy50b3A7XG4gICAgICAgIFxuICAgICAgICB2YXIgb2ZmID0gaXRlbS5vZmZzZXQ7XG4gICAgICAgIHZhciB4ID0gTWF0aC5yb3VuZCgobW91c2UueCAtIHB4KSArIG9mZi5sZWZ0KTtcbiAgICAgICAgdmFyIHkgPSBNYXRoLnJvdW5kKChtb3VzZS55IC0gcHkpICsgb2ZmLnRvcCk7XG4gICAgICAgIFxuICAgICAgICBzdHlsZSA9IHtcbiAgICAgICAgfTtcbiAgICAgICAgXG4gICAgICAgIGlmIChpdGVtLnN0eWxlID09PSAndHJhbnNmb3JtJyAmJiB0cmFuc2Zvcm1TdHlsZSkge1xuICAgICAgICAgIHN0eWxlW3RyYW5zZm9ybVN0eWxlICsgXCJPcmlnaW5cIl0gPSAnMCAwJztcbiAgICAgICAgICBzdHlsZVt0cmFuc2Zvcm1TdHlsZV0gPSBcInRyYW5zbGF0ZTNkKFwiICsgeCArIFwicHgsXCIgKyB5ICsgXCJweCwgMCkgc2NhbGUoXCIgKyBpdGVtLnNjYWxlICsgXCIsXCIgKyBpdGVtLnNjYWxlICsgXCIpXCI7XG4gICAgICAgIH0gZWxzZSB7XG4gICAgICAgICAgc3R5bGUubGVmdCA9ICh4ICsgcG9zLmxlZnQpICsgXCJweFwiO1xuICAgICAgICAgIHN0eWxlLnRvcCA9ICh5ICsgcG9zLnRvcCkgKyBcInB4XCI7XG4gICAgICAgIH1cbiAgICAgICAgXG4gICAgICAgIGNzcyhzeW1ib2wsIHN0eWxlKTtcbiAgICAgIH1cbiAgICAgIFxuICAgICAgXG4gICAgICBpZiAoaXRlbSA9PT0gY3Vyc29ySXRlbSkge1xuICAgICAgICBzeW1ib2wuY2xhc3NMaXN0ICYmICFzeW1ib2wuY2xhc3NMaXN0LmNvbnRhaW5zKFwiY3Vyc29yLWFjdGl2ZVwiKSAmJiBzeW1ib2wuY2xhc3NMaXN0LmFkZChcImN1cnNvci1hY3RpdmVcIik7XG4gICAgICAgIHN5bWJvbC5jbGFzc0xpc3QgJiYgc3ltYm9sLmNsYXNzTGlzdC5jb250YWlucyhcImN1cnNvci1oaWRkZW5cIikgJiYgc3ltYm9sLmNsYXNzTGlzdC5yZW1vdmUoXCJjdXJzb3ItaGlkZGVuXCIpO1xuICAgICAgfSBlbHNlIHtcbiAgICAgICAgc3ltYm9sLmNsYXNzTGlzdCAmJiBzeW1ib2wuY2xhc3NMaXN0LmNvbnRhaW5zKFwiY3Vyc29yLWFjdGl2ZVwiKSAmJiBzeW1ib2wuY2xhc3NMaXN0LnJlbW92ZShcImN1cnNvci1hY3RpdmVcIik7XG4gICAgICAgIHN5bWJvbC5jbGFzc0xpc3QgJiYgIXN5bWJvbC5jbGFzc0xpc3QuY29udGFpbnMoXCJjdXJzb3ItaGlkZGVuXCIpICYmIHN5bWJvbC5jbGFzc0xpc3QuYWRkKFwiY3Vyc29yLWhpZGRlblwiKTtcbiAgICAgIH1cbiAgICAgIFxuICAgIH0pO1xuICB9O1xuICBcbiAgdGhpcy51cGRhdGUgPSBmdW5jdGlvbigpIHtcbiAgICBpbnZhbGlkYXRlLmNhbGwodGhpcyk7XG4gICAgcmVuZGVyLmNhbGwodGhpcyk7XG4gIH07XG4gIFxuICB0aGlzLmFkZCA9IGZ1bmN0aW9uKGN1cnNvcikge1xuICAgIGlmIChjdXJzb3JzLmluZGV4T2YoY3Vyc29yKSA9PT0gLTEpIHtcbiAgICAgIGN1cnNvcnMucHVzaChjdXJzb3IpO1xuICAgICAgdGhpcy51cGRhdGUoKTtcbiAgICB9XG4gIH07XG4gIFxuICB0aGlzLnJlbW92ZSA9IGZ1bmN0aW9uKGN1cnNvcikge1xuICAgIGN1cnNvcnMuc3BsaWNlKGN1cnNvcnMuaW5kZXhPZihjdXJzb3IpLCAxKTtcbiAgICB0aGlzLnVwZGF0ZSgpO1xuICB9O1xuICBcbiAgdmFyIG1vdXNlUHJvdmlkZXJzID0gW107XG4gIGZ1bmN0aW9uIHNldE1vdXNlUHJvdmlkZXJzKGVsZW1lbnRzKSB7XG4gICAgZWxlbWVudHMgPSBlbGVtZW50cy5maWx0ZXIoZnVuY3Rpb24obikgeyByZXR1cm4gKG4pOyB9KTtcbiAgICBtb3VzZVByb3ZpZGVycy5mb3JFYWNoKGZ1bmN0aW9uKGVsZW1lbnQpIHtcbiAgICAgIGlmIChlbGVtZW50cy5pbmRleE9mKGVsZW1lbnQpID09PSAtMSkge1xuICAgICAgICByZW1vdmVNb3VzZUxpc3RlbmVycyhlbGVtZW50KTtcbiAgICAgIH1cbiAgICB9KTtcbiAgICBlbGVtZW50cy5mb3JFYWNoKGZ1bmN0aW9uKGVsZW1lbnQpIHtcbiAgICAgIGlmIChtb3VzZVByb3ZpZGVycy5pbmRleE9mKGVsZW1lbnQpID09PSAtMSkge1xuICAgICAgICBhZGRNb3VzZUxpc3RlbmVycyhlbGVtZW50KTtcbiAgICAgIH1cbiAgICB9KTtcbiAgICBtb3VzZVByb3ZpZGVycyA9IGVsZW1lbnRzO1xuICB9XG4gIFxuICBmdW5jdGlvbiBhZGRNb3VzZUxpc3RlbmVycyhlbGVtZW50KSB7XG4gICAgZm9yICh2YXIgaSA9IDAsIGV2ZW50OyBldmVudCA9IGV2ZW50c1tpXTsgaSsrKSB7XG4gICAgICBlbGVtZW50LmFkZEV2ZW50TGlzdGVuZXIoZXZlbnQsIGhhbmRsZUV2ZW50KTtcbiAgICB9XG4gIH1cbiAgXG4gIGZ1bmN0aW9uIHJlbW92ZU1vdXNlTGlzdGVuZXJzKGVsZW1lbnQpIHtcbiAgICBmb3IgKHZhciBpID0gMCwgZXZlbnQ7IGV2ZW50ID0gZXZlbnRzW2ldOyBpKyspIHtcbiAgICAgIGVsZW1lbnQucmVtb3ZlRXZlbnRMaXN0ZW5lcihldmVudCwgaGFuZGxlRXZlbnQpO1xuICAgIH1cbiAgfVxuICBcbiAgaW5pdC5jYWxsKHRoaXMpO1xuICBcbn1cblxuXG5cbmZ1bmN0aW9uIGdldEN1cnNvckl0ZW0oY3Vyc29yKSB7XG4gIFxuICB2YXJcbiAgICBlbGVtZW50ID0gY3Vyc29yLmdldCgnZWxlbWVudCcpLFxuICAgIHByb3BzID0gY3Vyc29yLmdldCgpLCBcbiAgICBzeW1ib2wgPSBwcm9wcy5zeW1ib2wsIFxuICAgIGJvdW5kcyA9IHByb3BzLmJvdW5kcyxcbiAgICBvZmZzZXQgPSBwcm9wcy5vZmZzZXQsXG4gICAgc3R5bGUgPSBwcm9wcy5zdHlsZSxcbiAgICBzY2FsZSA9IHByb3BzLnNjYWxlLFxuICAgIHRhcmdldCA9IHByb3BzLnRhcmdldCB8fCBzeW1ib2wubm9kZU5hbWUudG9Mb3dlckNhc2UoKSA9PT0gJ2EnID8gc3ltYm9sIDogZWxlbWVudCxcbiAgICBjb250YWluZXIsXG4gICAgZGlzcGxheSA9IGVsZW1lbnQuc3R5bGUuZGlzcGxheTtcbiAgICBcbiAgLy8gRm9yY2UgdmlzaWJpbGl0eSB0byBnZXQgdGhpbmdzIG1lYXN1cmVkXG4gIGNzcyhlbGVtZW50LCB7XG4gICAgZGlzcGxheTogJydcbiAgfSk7XG4gIFxuICAvLyBcbiAgcHJvcHMgPSBjdXJzb3IuZ2V0KCk7XG4gIFxuICBzeW1ib2wgPSBwcm9wcy5zeW1ib2w7XG4gIGJvdW5kcyA9IHByb3BzLmJvdW5kcztcbiAgb2Zmc2V0ID0gcHJvcHMub2Zmc2V0O1xuICBzdHlsZSA9IHByb3BzLnN0eWxlO1xuICBzY2FsZSA9IHByb3BzLnNjYWxlO1xuICB0YXJnZXQgPSBwcm9wcy50YXJnZXQgfHwgc3ltYm9sLm5vZGVOYW1lLnRvTG93ZXJDYXNlKCkgPT09ICdhJyA/IHN5bWJvbCA6IGVsZW1lbnQ7XG4gIFxuICAvLyBBZGQgY3Vyc29yIHN5bWJvbCB0byBkb21cbiAgaWYgKCFzeW1ib2wucGFyZW50Tm9kZSkge1xuICAgIGVsZW1lbnQuYXBwZW5kQ2hpbGQoc3ltYm9sKTtcbiAgfVxuICBcbiAgLy8gR2V0IGJvdW5kcyBhbmQgY29udGFpbmVyXG4gIGlmIChib3VuZHMgJiYgYm91bmRzLmdldEJvdW5kaW5nQ2xpZW50UmVjdCkge1xuICAgIC8vIEVsZW1lbnQgYm91bmRzXG4gICAgY29udGFpbmVyID0gYm91bmRzO1xuICAgIGJvdW5kcyA9IGdldEJvdW5kaW5nUmVjdChib3VuZHMpO1xuICB9IGVsc2Uge1xuICAgIC8vIE9iamVjdCBib3VuZHNcbiAgICBjb250YWluZXIgPSBzeW1ib2wub2Zmc2V0UGFyZW50IHx8IGVsZW1lbnQ7XG4gICAgdmFyIHJlY3QgPSBnZXRCb3VuZGluZ1JlY3QoY29udGFpbmVyKTtcbiAgICBcbiAgICB2YXIgY29udGFpbmVyUG9zID0gZ2V0T2Zmc2V0KGNvbnRhaW5lcikgfHwge3g6IDAsIHk6IDB9O1xuICAgIC8vIFByb2Nlc3MgY3VzdG9tIGZ1bmN0aW9uIFxuICAgIGlmICh0eXBlb2YgYm91bmRzID09PSAnZnVuY3Rpb24nKSB7XG4gICAgICBib3VuZHMgPSBib3VuZHMoY29udGFpbmVyKTtcbiAgICB9XG4gICAgLy8gR2V0IHBlcmNlbnQgdmFsdWVzXG4gICAgdmFyIHggPSB0eXBlb2YgYm91bmRzLnggPT09ICdzdHJpbmcnICYmIGJvdW5kcy54LmluZGV4T2YoXCIlXCIpID49IDAgPyBwYXJzZUZsb2F0KGJvdW5kcy54KSAqIHJlY3Qud2lkdGggLyAxMDAgOiBwYXJzZUZsb2F0KGJvdW5kcy54KTtcbiAgICB2YXIgeSA9IHR5cGVvZiBib3VuZHMueSA9PT0gJ3N0cmluZycgJiYgYm91bmRzLnkuaW5kZXhPZihcIiVcIikgPj0gMCA/IHBhcnNlRmxvYXQoYm91bmRzLnkpICogcmVjdC5oZWlnaHQgLyAxMDAgOiBwYXJzZUZsb2F0KGJvdW5kcy55KTtcbiAgICB2YXIgd2lkdGggPSB0eXBlb2YgYm91bmRzLndpZHRoID09PSAnc3RyaW5nJyAmJiBib3VuZHMud2lkdGguaW5kZXhPZihcIiVcIikgPj0gMCA/IHBhcnNlRmxvYXQoYm91bmRzLndpZHRoKSAqIHJlY3Qud2lkdGggLyAxMDAgOiBwYXJzZUZsb2F0KGJvdW5kcy53aWR0aCk7XG4gICAgdmFyIGhlaWdodCA9IHR5cGVvZiBib3VuZHMuaGVpZ2h0ID09PSAnc3RyaW5nJyAmJiBib3VuZHMuaGVpZ2h0LmluZGV4T2YoXCIlXCIpID49IDAgPyBwYXJzZUZsb2F0KGJvdW5kcy5oZWlnaHQpICogcmVjdC5oZWlnaHQgLyAxMDAgOiBwYXJzZUZsb2F0KGJvdW5kcy5oZWlnaHQpO1xuICAgIGJvdW5kcyA9IHtcbiAgICAgIHg6IGNvbnRhaW5lclBvcy5sZWZ0ICsgeCxcbiAgICAgIHk6IGNvbnRhaW5lclBvcy50b3AgKyB5LFxuICAgICAgd2lkdGg6IHdpZHRoLFxuICAgICAgaGVpZ2h0OiBoZWlnaHRcbiAgICB9O1xuICB9XG4gIFxuICAvLyBSZXNldCB2aXNpYmlsaXR5XG4gIGNzcyhlbGVtZW50LCAnZGlzcGxheScsIGRpc3BsYXkpO1xuICBcbiAgcmV0dXJuIG1lcmdlKHByb3BzLCB7XG4gICAgY3Vyc29yOiBjdXJzb3IsXG4gICAgc3ltYm9sOiBzeW1ib2wsXG4gICAgYm91bmRzOiBib3VuZHMsXG4gICAgY29udGFpbmVyOiBjb250YWluZXIsXG4gICAgdGFyZ2V0OiB0YXJnZXQsXG4gICAgb2Zmc2V0OiBvZmZzZXQsXG4gICAgc3R5bGU6IHN0eWxlLFxuICAgIHNjYWxlOiBzY2FsZVxuICB9KTtcbn1cblxubW9kdWxlLmV4cG9ydHMgPSBDdXJzb3JNYW5hZ2VyOyIsIm1vZHVsZS5leHBvcnRzID0gZnVuY3Rpb24oKSB7XG4gIHZhciBvYmogPSB7fSxcbiAgICBpID0gMCxcbiAgICBpbCA9IGFyZ3VtZW50cy5sZW5ndGgsXG4gICAga2V5O1xuICBmb3IgKDsgaSA8IGlsOyBpKyspIHtcbiAgICBmb3IgKGtleSBpbiBhcmd1bWVudHNbaV0pIHtcbiAgICAgIGlmIChhcmd1bWVudHNbaV0uaGFzT3duUHJvcGVydHkoa2V5KSkge1xuICAgICAgICAgIG9ialtrZXldID0gYXJndW1lbnRzW2ldW2tleV07XG4gICAgICB9XG4gICAgfVxuICB9XG4gIHJldHVybiBvYmo7XG59OyIsInZhciBcblxuICBnZXRTdHlsZSA9IGZ1bmN0aW9uKGVsLCBjc3Nwcm9wKXtcbiAgICBpZiAoZWwuc3R5bGUpXG4gICAgICBpZiAoZWwuY3VycmVudFN0eWxlKSAvL0lFXG4gICAgICAgIHJldHVybiBlbC5jdXJyZW50U3R5bGVbY3NzcHJvcF07XG4gICAgICBlbHNlIGlmIChkb2N1bWVudC5kZWZhdWx0VmlldyAmJiBkb2N1bWVudC5kZWZhdWx0Vmlldy5nZXRDb21wdXRlZFN0eWxlKSAvL0ZpcmVmb3hcbiAgICAgICAgcmV0dXJuIGRvY3VtZW50LmRlZmF1bHRWaWV3LmdldENvbXB1dGVkU3R5bGUoZWwsIFwiXCIpW2Nzc3Byb3BdO1xuICAgICAgZWxzZSAvL3RyeSBhbmQgZ2V0IGlubGluZSBzdHlsZVxuICAgICAgICByZXR1cm4gZWwuc3R5bGVbY3NzcHJvcF07XG4gIH0sXG4gIFxuICBnZXRaSW5kZXggPSBmdW5jdGlvbihlbCkge1xuICAgIHZhciB6SW5kZXggPSBwYXJzZUZsb2F0KGdldFN0eWxlKGVsLCAnekluZGV4JykpO1xuICAgIHpJbmRleCA9ICFpc05hTih6SW5kZXgpID8gekluZGV4IDogMDtcbiAgICBpZiAoekluZGV4ID09PSAwKSB7XG4gICAgICBpZiAoZWwucGFyZW50Tm9kZSkge1xuICAgICAgICByZXR1cm4gZ2V0WkluZGV4KGVsLnBhcmVudE5vZGUpO1xuICAgICAgfVxuICAgIH1cbiAgICByZXR1cm4gekluZGV4O1xuICB9LFxuICBcbiAgaXNDaGlsZE9mID0gZnVuY3Rpb24ocGFyZW50LCBjaGlsZCkge1xuICAgaWYgKCFjaGlsZCB8fCAhcGFyZW50KSB7XG4gICAgIHJldHVybiBmYWxzZTtcbiAgIH1cbiAgIHZhciBub2RlID0gY2hpbGQucGFyZW50Tm9kZTtcbiAgIHdoaWxlIChub2RlICE9IG51bGwpIHtcbiAgICAgaWYgKG5vZGUgPT0gcGFyZW50KSB7XG4gICAgICAgICByZXR1cm4gdHJ1ZTtcbiAgICAgfVxuICAgICBub2RlID0gbm9kZS5wYXJlbnROb2RlO1xuICAgfVxuICAgcmV0dXJuIGZhbHNlO1xuICB9O1xuXG5cbi8vIENvbXBhcmUgVmlzaWJpbGl0eSwgcmV0dXJucyAtMSwgMSBvciAwXG5mdW5jdGlvbiBjb21wYXJlVmlzaWJpbGl0eShhLCBiKSB7XG4gIHZhciB2YSA9IGEgJiYgYS5zdHlsZSAmJiBnZXRTdHlsZShhLCAnZGlzcGxheScpICE9PSAnbm9uZSc7XG4gIHZhciB2YiA9IGIgJiYgYi5zdHlsZSAmJiBnZXRTdHlsZShiLCAnZGlzcGxheScpICE9PSAnbm9uZSc7XG4gIGlmICh2YSAmJiAhdmIpIHtcbiAgICByZXR1cm4gLTE7XG4gIH0gZWxzZSBpZiAodmIgJiYgIXZhKSB7XG4gICAgcmV0dXJuIDE7XG4gIH1cbiAgcmV0dXJuIDA7XG59XG5cbi8vIENvbXBhcmUgWi1JbmRleCwgcmV0dXJucyAtMSwgMSBvciAwXG5mdW5jdGlvbiBjb21wYXJlUG9zaXRpb25TdGFjayhhLCBiKSB7XG4gIHZhciBwYSA9IGdldFN0eWxlKGEsICdwb3NpdGlvbicpO1xuICB2YXIgcGIgPSBnZXRTdHlsZShiLCAncG9zaXRpb24nKTtcbiAgaWYgKHphID4gemIpIHtcbiAgICByZXR1cm4gLTE7XG4gIH0gZWxzZSBpZiAoemIgPiB6YSkge1xuICAgIHJldHVybiAxO1xuICB9XG4gIHJldHVybiAwO1xufVxuXG5cbi8vIENvbXBhcmUgWi1JbmRleCwgcmV0dXJucyAtMSwgMSBvciAwXG5mdW5jdGlvbiBjb21wYXJlWkluZGV4KGEsIGIpIHtcbiAgdmFyIHphID0gZ2V0WkluZGV4KGEpO1xuICB2YXIgemIgPSBnZXRaSW5kZXgoYik7XG4gIGlmICh6YSA+IHpiKSB7XG4gICAgcmV0dXJuIC0xO1xuICB9IGVsc2UgaWYgKHpiID4gemEpIHtcbiAgICByZXR1cm4gMTtcbiAgfVxuICByZXR1cm4gMDtcbn1cblxuLy8gQ29tcGFyZSBQb3NpdGlvbiAtIE1JVCBMaWNlbnNlZCwgSm9obiBSZXNpZ1xuZnVuY3Rpb24gY29tcGFyZVBvc2l0aW9uKGEsIGIpe1xuICByZXR1cm4gYS5jb21wYXJlRG9jdW1lbnRQb3NpdGlvbiA/XG4gICAgYS5jb21wYXJlRG9jdW1lbnRQb3NpdGlvbihiKSA6XG4gICAgYS5jb250YWlucyA/XG4gICAgICAoYSAhPSBiICYmIGEuY29udGFpbnMoYikgJiYgMTYpICtcbiAgICAgICAgKGEgIT0gYiAmJiBiLmNvbnRhaW5zKGEpICYmIDgpICtcbiAgICAgICAgKGEuc291cmNlSW5kZXggPj0gMCAmJiBiLnNvdXJjZUluZGV4ID49IDAgP1xuICAgICAgICAgIChhLnNvdXJjZUluZGV4IDwgYi5zb3VyY2VJbmRleCAmJiA0KSArXG4gICAgICAgICAgICAoYS5zb3VyY2VJbmRleCA+IGIuc291cmNlSW5kZXggJiYgMikgOlxuICAgICAgICAgIDEpICtcbiAgICAgIDAgOlxuICAgICAgMDtcbn1cblxubW9kdWxlLmV4cG9ydHMgPSBmdW5jdGlvbihhLCBiKSB7XG4gIC8vIENvbXBhcmUgVmlzaWJpbGl0eVxuICB2YXIgdmlzaWJpbGl0eSA9IGNvbXBhcmVWaXNpYmlsaXR5KGEsIGIpO1xuICBpZiAodmlzaWJpbGl0eSAhPT0gMCkge1xuICAgIHJldHVybiB2aXNpYmlsaXR5IDwgMCA/IGEgOiBiO1xuICB9IFxuICBcbiAgLy8gQ29tcGFyZSBwYXJlbnQvY2hpbGQgcmVsYXRpb25cbiAgaWYgKGlzQ2hpbGRPZihhLCBiKSkge1xuICAgIC8vIGlmIGIgaXMgY29udGFpbmVkIGluIGEsIGl0J3MgYWx3YXlzIG9uIHRvcFxuICAgIHJldHVybiBiO1xuICB9XG4gIFxuICAvLyBDb21wYXJlIFotSW5kZXggU3RhY2tcbiAgdmFyIHpJbmRleENvbXBhcmlzb25SZXN1bHQgPSBjb21wYXJlWkluZGV4KGEsIGIpO1xuICBpZiAoekluZGV4Q29tcGFyaXNvblJlc3VsdCA9PT0gLTEpIHtcbiAgICAvLyBhIGlzIG9uIHRvcFxuICAgIHJldHVybiBhO1xuICB9XG4gIGlmICh6SW5kZXhDb21wYXJpc29uUmVzdWx0ID09PSAxKSB7XG4gICAgLy8gYiBpcyBvbiB0b3BcbiAgICByZXR1cm4gYjtcbiAgfVxuICAvLyBUT0RPOiBDb21wYXJlIEFuY2VzdG9yIFBvc2l0aW9uIFN0YWNrXG4gIFxuICAvLyBDb21wYXJlIERvY3VtZW50IFBvc2l0aW9uXG4gIHZhciBkb2N1bWVudFBvc2l0aW9uUmVzdWx0ID0gY29tcGFyZVBvc2l0aW9uKGEsIGIpO1xuICBpZiAoZG9jdW1lbnRQb3NpdGlvblJlc3VsdCA9PT0gMikge1xuICAgIC8vIGEgaXMgcHJlY2VkaW5nXG4gICAgcmV0dXJuIGE7XG4gIH1cbiAgaWYgKGRvY3VtZW50UG9zaXRpb25SZXN1bHQgPT09IDQpIHtcbiAgICAvLyBiIGlzIGZvbGxvd2luZ1xuICAgIHJldHVybiBiO1xuICB9XG4gIFxuICByZXR1cm4gYTtcbn07Il19
