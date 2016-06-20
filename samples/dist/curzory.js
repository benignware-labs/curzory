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
//# sourceMappingURL=data:application/json;charset:utf-8;base64,eyJ2ZXJzaW9uIjozLCJzb3VyY2VzIjpbIm5vZGVfbW9kdWxlcy9ncnVudC1icm93c2VyaWZ5L25vZGVfbW9kdWxlcy9icm93c2VyaWZ5L25vZGVfbW9kdWxlcy9icm93c2VyLXBhY2svX3ByZWx1ZGUuanMiLCJzcmMvY3Vyem9yeS5qcyIsInNyYy9saWIvQ3Vyc29yLmpzIiwic3JjL2xpYi9DdXJzb3JNYW5hZ2VyLmpzIiwic3JjL2xpYi9tZXJnZS5qcyIsInNyYy9saWIvdG9wbW9zdC5qcyJdLCJuYW1lcyI6W10sIm1hcHBpbmdzIjoiQUFBQTtBQ0FBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBOztBQ1RBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTs7QUMzR0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTs7QUN0Y0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTs7QUNiQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBIiwiZmlsZSI6ImdlbmVyYXRlZC5qcyIsInNvdXJjZVJvb3QiOiIiLCJzb3VyY2VzQ29udGVudCI6WyIoZnVuY3Rpb24gZSh0LG4scil7ZnVuY3Rpb24gcyhvLHUpe2lmKCFuW29dKXtpZighdFtvXSl7dmFyIGE9dHlwZW9mIHJlcXVpcmU9PVwiZnVuY3Rpb25cIiYmcmVxdWlyZTtpZighdSYmYSlyZXR1cm4gYShvLCEwKTtpZihpKXJldHVybiBpKG8sITApO3ZhciBmPW5ldyBFcnJvcihcIkNhbm5vdCBmaW5kIG1vZHVsZSAnXCIrbytcIidcIik7dGhyb3cgZi5jb2RlPVwiTU9EVUxFX05PVF9GT1VORFwiLGZ9dmFyIGw9bltvXT17ZXhwb3J0czp7fX07dFtvXVswXS5jYWxsKGwuZXhwb3J0cyxmdW5jdGlvbihlKXt2YXIgbj10W29dWzFdW2VdO3JldHVybiBzKG4/bjplKX0sbCxsLmV4cG9ydHMsZSx0LG4scil9cmV0dXJuIG5bb10uZXhwb3J0c312YXIgaT10eXBlb2YgcmVxdWlyZT09XCJmdW5jdGlvblwiJiZyZXF1aXJlO2Zvcih2YXIgbz0wO288ci5sZW5ndGg7bysrKXMocltvXSk7cmV0dXJuIHN9KSIsInZhclxuICBDdXJzb3JNYW5hZ2VyID0gcmVxdWlyZSgnLi9saWIvQ3Vyc29yTWFuYWdlcicpLFxuICBDdXJzb3IgPSByZXF1aXJlKCcuL2xpYi9DdXJzb3InKTtcbiAgY3Vyc29yTWFuYWdlciA9IG5ldyBDdXJzb3JNYW5hZ2VyKCk7XG5cbm1vZHVsZS5leHBvcnRzID0gZnVuY3Rpb24gY3Vyem9yeShlbGVtZW50LCBvcHRpb25zKSB7XG4gIHZhciBjdXJzb3IgPSBuZXcgQ3Vyc29yKGVsZW1lbnQsIG9wdGlvbnMpO1xuICBjdXJzb3JNYW5hZ2VyLmFkZChjdXJzb3IpO1xuICByZXR1cm4gY3Vyc29yO1xufTsiLCJ2YXJcbiAgbWVyZ2UgPSByZXF1aXJlKCcuL21lcmdlJyksXG4gIFxuICBjcmVhdGVFbGVtZW50ID0gZnVuY3Rpb24oc3RyaW5nKSB7XG4gICAgdmFyIGVsZW1lbnQgPSBkb2N1bWVudC5jcmVhdGVFbGVtZW50KCdkaXYnKTtcbiAgICBlbGVtZW50LmlubmVySFRNTCA9IHN0cmluZztcbiAgICB2YXIgcmVzdWx0ID0gZWxlbWVudC5maXJzdENoaWxkO1xuICAgIGVsZW1lbnQucmVtb3ZlQ2hpbGQocmVzdWx0KTtcbiAgICByZXR1cm4gcmVzdWx0O1xuICB9LFxuXG4gIGlzSFRNTCA9IGZ1bmN0aW9uKHN0cmluZykge1xuICAgIHJldHVybiB0eXBlb2Ygc3RyaW5nID09PSAnc3RyaW5nJyAmJiBzdHJpbmcubWF0Y2goLzxcXC8/XFx3KygoXFxzK1xcdysoXFxzKj1cXHMqKD86XCIuKj9cInwnLio/J3xbXidcIj5cXHNdKykpPykrXFxzKnxcXHMqKVxcLz8+Lyk7XG4gIH0sXG4gIFxuXG4gIGdldEVsZW1lbnQgPSBmdW5jdGlvbih2YWx1ZSwgcGFyZW50KSB7XG4gICAgdmFsdWUgPSB2YWx1ZS50b0FycmF5ID8gdmFsdWUudG9BcnJheSgpWzBdIDogdmFsdWUgaW5zdGFuY2VvZiBBcnJheSA/IHZhbHVlWzBdIDogdmFsdWU7XG4gICAgaWYgKHR5cGVvZiB2YWx1ZSA9PT0gJ2Z1bmN0aW9uJykge1xuICAgICAgdmFsdWUgPSB2YWx1ZS5jYWxsKHRoaXMsIHZhbHVlKTtcbiAgICB9XG4gICAgaWYgKHR5cGVvZiB2YWx1ZSA9PT0gJ3N0cmluZycpIHtcbiAgICAgIGlmIChpc0hUTUwodmFsdWUpKSB7XG4gICAgICAgIHZhbHVlID0gY3JlYXRlRWxlbWVudCh2YWx1ZSk7XG4gICAgICB9IGVsc2Uge1xuICAgICAgICB2YWx1ZSA9IHBhcmVudC5xdWVyeVNlbGVjdG9yKHZhbHVlKTtcbiAgICAgIH1cbiAgICB9XG4gICAgaWYgKHZhbHVlICYmIHZhbHVlLm5vZGVOYW1lKSB7XG4gICAgICByZXR1cm4gdmFsdWU7XG4gICAgfVxuICAgIHJldHVybiBudWxsO1xuICB9O1xuXG5tb2R1bGUuZXhwb3J0cyA9IGZ1bmN0aW9uIEN1cnNvcihlbGVtZW50LCBvcHRpb25zKSB7XG4gICAgXG4gIGZ1bmN0aW9uIHNldChuYW1lLCB2YWx1ZSkge1xuICAgIHZhciBvcHRzO1xuICAgIGlmICh0eXBlb2YgbmFtZSA9PT0gJ29iamVjdCcpIHtcbiAgICAgIG9wdHMgPSBuYW1lO1xuICAgIH0gZWxzZSB7XG4gICAgICBvcHRzID0ge307XG4gICAgICBvcHRzW25hbWVdID0gdmFsdWU7XG4gICAgfVxuICAgIGZvciAobmFtZSBpbiBvcHRzKSB7XG4gICAgICB2YWx1ZSA9IG9wdHNbbmFtZV07XG4gICAgICBzd2l0Y2ggKG5hbWUpIHtcbiAgICAgICAgY2FzZSAnZWxlbWVudCc6XG4gICAgICAgIGNhc2UgJ3N5bWJvbCc6XG4gICAgICAgICAgaWYgKGlzSFRNTCh2YWx1ZSkpIHtcbiAgICAgICAgICAgIHZhbHVlID0gY3JlYXRlRWxlbWVudCh2YWx1ZSk7XG4gICAgICAgICAgfVxuICAgICAgICAgIGJyZWFrO1xuICAgICAgfVxuICAgICAgb3B0c1tuYW1lXSA9IHZhbHVlO1xuICAgIH1cbiAgICBvcHRpb25zID0gbWVyZ2Uob3B0aW9ucywgb3B0cyk7XG4gIH07XG4gIFxuICB0aGlzLnNldCA9IGZ1bmN0aW9uKCkge1xuICAgIHNldC5jYWxsKHRoaXMsIGFyZ3VtZW50cyk7XG4gICAgY3Vyc29yTWFuYWdlci51cGRhdGUoKTtcbiAgfTtcbiAgXG4gIHRoaXMuZ2V0ID0gZnVuY3Rpb24obmFtZSkge1xuICAgIHZhciB2YWx1ZTtcbiAgICBpZiAoIW5hbWUpIHtcbiAgICAgIHZhbHVlID0ge307XG4gICAgICBmb3IgKHZhciB4IGluIG9wdGlvbnMpIHtcbiAgICAgICAgdmFsdWVbeF0gPSB0aGlzLmdldCh4KTtcbiAgICAgIH1cbiAgICB9IGVsc2Uge1xuICAgICAgdmFsdWUgPSBvcHRpb25zW25hbWVdO1xuICAgICAgc3dpdGNoIChuYW1lKSB7XG4gICAgICAgIGNhc2UgJ2VsZW1lbnQnOlxuICAgICAgICBjYXNlICdzeW1ib2wnOlxuICAgICAgICBjYXNlICdib3VuZHMnOlxuICAgICAgICBjYXNlICd0YXJnZXQnOlxuICAgICAgICAgIHZhbHVlID0gdmFsdWUgJiYgdmFsdWUudG9BcnJheSA/IHZhbHVlLnRvQXJyYXkoKVswXSA6IHZhbHVlIGluc3RhbmNlb2YgQXJyYXkgPyB2YWx1ZVswXSA6IHZhbHVlO1xuICAgICAgICAgIHZhbHVlID0gdHlwZW9mIHZhbHVlID09PSAnc3RyaW5nJyA/IChlbGVtZW50IHx8IGRvY3VtZW50KS5xdWVyeVNlbGVjdG9yKHZhbHVlKSA6IHZhbHVlO1xuICAgICAgICAgIGJyZWFrO1xuICAgICAgfVxuICAgICAgc3dpdGNoIChuYW1lKSB7XG4gICAgICAgIGNhc2UgJ3N5bWJvbCc6XG4gICAgICAgICAgdmFsdWUgPSB2YWx1ZSB8fCB0aGlzLmdldCgnZWxlbWVudCcpO1xuICAgICAgICAgIGJyZWFrO1xuICAgICAgICBjYXNlICdib3VuZHMnOlxuICAgICAgICAgIHZhbHVlID0gdmFsdWUgPyB2YWx1ZSA6IG9wdGlvbnNbJ3N5bWJvbCddID8gdGhpcy5nZXQoJ2VsZW1lbnQnKSA6IHRoaXMuZ2V0KCdlbGVtZW50Jykub2Zmc2V0UGFyZW50O1xuICAgICAgICAgIGJyZWFrO1xuICAgICAgfVxuICAgIH1cbiAgICByZXR1cm4gdmFsdWU7XG4gIH07XG4gIFxuICBzZXQobWVyZ2Uoe1xuICAgIGVsZW1lbnQ6IG51bGwsXG4gICAgb2Zmc2V0OiB7bGVmdDogOCwgdG9wOiA2fSxcbiAgICBzdHlsZTogJ3RyYW5zZm9ybScsXG4gICAgc2NhbGU6IDEsXG4gICAgYm91bmRzOiBudWxsLFxuICAgIHN5bWJvbDogbnVsbCxcbiAgICB0YXJnZXQ6IG51bGwsXG4gICAgaGlkZU9uRm9jdXM6IGZhbHNlXG4gIH0sIG9wdGlvbnMsIHtcbiAgICBlbGVtZW50OiBlbGVtZW50XG4gIH0pKTtcbiAgXG59OyIsInZhclxuICBcbiAgbWVyZ2UgPSByZXF1aXJlKCcuL21lcmdlJyksXG4gIHRvcG1vc3QgPSByZXF1aXJlKCcuL3RvcG1vc3QnKSxcbiAgXG4gIC8qKlxuICAgKiBIeXBoZW5hdGUgYSBzdHJpbmdcbiAgICogQHBhcmFtIHtTdHJpbmd9IHN0cmluZ1xuICAgKi9cbiAgaHlwaGVuYXRlID0gKGZ1bmN0aW9uKCkge1xuICAgIHZhciBjYWNoZSA9IHt9O1xuICAgIHJldHVybiBmdW5jdGlvbihzdHJpbmcpIHtcbiAgICAgIHJldHVybiBjYWNoZVtzdHJpbmddID0gY2FjaGVbc3RyaW5nXSB8fCAoZnVuY3Rpb24oKSB7XG4gICAgICAgIHJldHVybiBzdHJpbmcucmVwbGFjZSgvKFtBLVpdKS9nLCBmdW5jdGlvbigkMSl7cmV0dXJuIFwiLVwiKyQxLnRvTG93ZXJDYXNlKCk7fSk7XG4gICAgICB9KSgpO1xuICAgIH07XG4gIH0pKCksXG4gIFxuICBnZXRTdHlsZSA9IGZ1bmN0aW9uKGVsLCBjc3Nwcm9wKXtcbiAgIGlmIChlbC5jdXJyZW50U3R5bGUpIC8vSUVcbiAgICByZXR1cm4gZWwuY3VycmVudFN0eWxlW2Nzc3Byb3BdO1xuICAgZWxzZSBpZiAoZG9jdW1lbnQuZGVmYXVsdFZpZXcgJiYgZG9jdW1lbnQuZGVmYXVsdFZpZXcuZ2V0Q29tcHV0ZWRTdHlsZSkgLy9GaXJlZm94XG4gICAgcmV0dXJuIGRvY3VtZW50LmRlZmF1bHRWaWV3LmdldENvbXB1dGVkU3R5bGUoZWwsIFwiXCIpW2Nzc3Byb3BdO1xuICAgZWxzZSAvL3RyeSBhbmQgZ2V0IGlubGluZSBzdHlsZVxuICAgIHJldHVybiBlbC5zdHlsZVtjc3Nwcm9wXTtcbiAgfSxcbiAgXG4gIHRyYW5zZm9ybVN0eWxlID0gKGZ1bmN0aW9uKHByb3AsIHByZWZpeGVzKSB7XG4gICAgdmFyIGksXG4gICAgICBlbGVtID0gZG9jdW1lbnQuY3JlYXRlRWxlbWVudCgnZGl2JyksXG4gICAgICBjYXBpdGFsaXplZCA9IHByb3AuY2hhckF0KDApLnRvVXBwZXJDYXNlKCkgKyBwcm9wLnNsaWNlKDEpO1xuICAgIGZvciAoaSA9IDA7IGkgPCBwcmVmaXhlcy5sZW5ndGg7IGkrKykge1xuICAgICAgaWYgKHR5cGVvZiBlbGVtLnN0eWxlW3ByZWZpeGVzW2ldICsgY2FwaXRhbGl6ZWRdICE9PSBcInVuZGVmaW5lZFwiKSB7XG4gICAgICAgIHJldHVybiBwcmVmaXhlc1tpXSArIGNhcGl0YWxpemVkO1xuICAgICAgfVxuICAgIH1cbiAgICByZXR1cm4gbnVsbDtcbiAgfSkoJ3RyYW5zZm9ybScsIFsnJywgJ01veicsICdXZWJraXQnLCAnTycsICdNcyddKSxcbiAgXG4gIGlzQ2hpbGRPZiA9IGZ1bmN0aW9uKHBhcmVudCwgY2hpbGQpIHtcbiAgIGlmICghY2hpbGQgfHwgIXBhcmVudCkge1xuICAgICByZXR1cm4gZmFsc2U7XG4gICB9XG4gICB2YXIgbm9kZSA9IGNoaWxkLnBhcmVudE5vZGU7XG4gICB3aGlsZSAobm9kZSAhPSBudWxsKSB7XG4gICAgIGlmIChub2RlID09IHBhcmVudCkge1xuICAgICAgICAgcmV0dXJuIHRydWU7XG4gICAgIH1cbiAgICAgbm9kZSA9IG5vZGUucGFyZW50Tm9kZTtcbiAgIH1cbiAgIHJldHVybiBmYWxzZTtcbiAgfSxcbiAgXG4gIGNzcyA9IGZ1bmN0aW9uKGVsZW0sIG5hbWUsIHZhbHVlKSB7XG4gICAgdmFyIG1hcCA9IHt9LCBjc3NUZXh0ID0gbnVsbDtcbiAgICBpZiAodHlwZW9mIG5hbWUgPT09ICdvYmplY3QnKSB7XG4gICAgICBtYXAgPSBuYW1lO1xuICAgIH0gZWxzZSBpZiAodHlwZW9mIHZhbHVlICE9PSBcInVuZGVmaW5lZFwiKSB7XG4gICAgICBtYXBbbmFtZV0gPSB2YWx1ZTtcbiAgICB9XG4gICAgdmFyIGtleXMgPSBPYmplY3Qua2V5cyhtYXApO1xuICAgIGtleXMgPSBrZXlzLmZpbHRlcihmdW5jdGlvbihrZXksIGluZGV4KSB7XG4gICAgICBpZiAobWFwW2tleV0gPT09ICcnKSB7XG4gICAgICAgIGVsZW0uc3R5bGVba2V5XSA9IG1hcFtrZXldO1xuICAgICAgICByZXR1cm4gZmFsc2U7XG4gICAgICB9XG4gICAgICByZXR1cm4gdHJ1ZTtcbiAgICB9KTtcbiAgICBjc3NUZXh0ID0ga2V5cy5tYXAoZnVuY3Rpb24obmFtZSkge1xuICAgICAgcmV0dXJuIGh5cGhlbmF0ZShuYW1lKSArIFwiOiBcIiArIG1hcFtuYW1lXTtcbiAgICB9KS5qb2luKFwiOyBcIik7XG4gICAgaWYgKGNzc1RleHQgJiYgY3NzVGV4dC5sZW5ndGgpIHtcbiAgICAgIGVsZW0uc3R5bGUuY3NzVGV4dCA9IGVsZW0uc3R5bGUuY3NzVGV4dCArIGNzc1RleHQ7XG4gICAgICByZXR1cm4gbnVsbDtcbiAgICB9XG4gICAgcmV0dXJuIGVsZW0uc3R5bGVbbmFtZV0gfHwgd2luZG93LmdldENvbXB1dGVkU3R5bGUoZWxlbSwgbnVsbCkuZ2V0UHJvcGVydHlWYWx1ZShuYW1lKTtcbiAgfSxcbiAgXG4gIGdldE9mZnNldCA9IGZ1bmN0aW9uKGVsZW1lbnQpIHtcbiAgICB2YXJcbiAgICAgIHNjcm9sbE9mZnNldCA9IGdldFNjcm9sbE9mZnNldCgpLFxuICAgICAgcmVjdCA9IGVsZW1lbnQuZ2V0Qm91bmRpbmdDbGllbnRSZWN0KCk7XG4gICAgcmV0dXJuIHtcbiAgICAgIHRvcDogcmVjdC50b3AgKyBzY3JvbGxPZmZzZXQudG9wLFxuICAgICAgbGVmdDogcmVjdC5sZWZ0ICsgc2Nyb2xsT2Zmc2V0LmxlZnRcbiAgICB9O1xuICB9LFxuICBcbiAgZ2V0U2Nyb2xsT2Zmc2V0ID0gZnVuY3Rpb24oKSB7XG4gICAgcmV0dXJuIHtcbiAgICAgIGxlZnQ6IGRvY3VtZW50LmJvZHkgJiYgZG9jdW1lbnQuYm9keS5zY3JvbGxMZWZ0ICsgZG9jdW1lbnQuZG9jdW1lbnRFbGVtZW50LnNjcm9sbExlZnQsXG4gICAgICB0b3A6IGRvY3VtZW50LmJvZHkgJiYgZG9jdW1lbnQuYm9keS5zY3JvbGxUb3AgKyBkb2N1bWVudC5kb2N1bWVudEVsZW1lbnQuc2Nyb2xsVG9wXG4gICAgfTtcbiAgfSxcbiAgXG4gIGdldEJvdW5kaW5nUmVjdCA9IGZ1bmN0aW9uKGVsZW1lbnQpIHtcbiAgICBpZiAoIWVsZW1lbnQpIHtcbiAgICAgIHJldHVybiB7XG4gICAgICAgIHg6IC1JbmZpbml0eSxcbiAgICAgICAgeTogLUluZmluaXR5LFxuICAgICAgICB3aWR0aDogSW5maW5pdHksXG4gICAgICAgIGhlaWdodDogSW5maW5pdHlcbiAgICAgIH07XG4gICAgfVxuICAgIHZhciBzY3JvbGxPZmZzZXQgPSBnZXRTY3JvbGxPZmZzZXQoKTtcbiAgICB2YXIgcmVjdCA9IGVsZW1lbnQuZ2V0Qm91bmRpbmdDbGllbnRSZWN0KCk7XG4gICAgcmV0dXJuIHtcbiAgICAgIHg6IHJlY3QubGVmdCArIHNjcm9sbE9mZnNldC5sZWZ0LFxuICAgICAgeTogcmVjdC50b3AgKyBzY3JvbGxPZmZzZXQudG9wLFxuICAgICAgd2lkdGg6IHJlY3Qud2lkdGgsXG4gICAgICBoZWlnaHQ6IHJlY3QuaGVpZ2h0XG4gICAgfTtcbiAgfSxcbiAgXG4gIC8vIERlY2xhcmUgc2luZ2xldG9uIGluc3RhbmNlXG4gIGluc3RhbmNlID0gbnVsbDtcblxuLyoqXG4gKiBDdXJzb3JNYW5hZ2VyXG4gKiBUaGlzIHNpbmdsZXRvbiBjbGFzcyBoYW5kbGVzIGFsbCBjdXJzb3Igb2JqZWN0cyBcbiAqIEBwYXJhbSB7T2JqZWN0fSBvcHRpb25zXG4gKi9cbmZ1bmN0aW9uIEN1cnNvck1hbmFnZXIob3B0aW9ucykge1xuICAvLyBTaW5nbGV0b24gcGF0dGVyblxuICBpZiAoaW5zdGFuY2UpIHtcbiAgICBpbnN0YW5jZS5zZXQob3B0aW9ucyk7XG4gICAgcmV0dXJuIGluc3RhbmNlO1xuICB9XG4gIGluc3RhbmNlID0gdGhpcztcbiAgLy8gSW1wbGVtZW50YXRpb25cbiAgXG4gIHZhciBjdXJzb3JzID0gW107XG4gIHZhciBjbGllbnQgPSB7eDogMCwgeTogMH07XG4gIHZhciBtb3VzZSA9IHt4OiAtSW5maW5pdHksIHk6IC1JbmZpbml0eSwgZWxlbWVudDogbnVsbH07XG4gIHZhciBldmVudHMgPSBbJ21vdXNlZG93bicsICdjbGljaycsICdzY3JvbGwnLCAncmVzaXplJywgJ21vdXNlbW92ZScsICdtb3VzZW91dCddO1xuICB2YXIgY3Vyc29ySXRlbXMgPSBbXTtcbiAgdmFyIGN1cnNvckl0ZW0gPSBudWxsO1xuICB2YXIgY2xpY2tpbmcgPSBmYWxzZTtcbiAgdmFyIGNsaWNrYWJsZSA9IHRydWU7XG4gIFxuICBmdW5jdGlvbiBpbml0KCkge1xuICAgIGlmICghKCdvbnRvdWNoJyBpbiB3aW5kb3cpKSB7XG4gICAgICBhZGRNb3VzZUxpc3RlbmVycyh3aW5kb3cpO1xuICAgIH1cbiAgfVxuICBcbiAgZnVuY3Rpb24gaGFuZGxlRXZlbnQoZSkge1xuICAgIFxuICAgIC8vIENoZWNrIGZvciBhY2Nlc3MgdG8gZXZlbnQncyB0eXBlIHByb3BlcnR5XG4gICAgdHJ5IHtcbiAgICAgIGUudHlwZTtcbiAgICB9IGNhdGNoIChlKSB7XG4gICAgICBjb25zb2xlLndhcm4oZSk7XG4gICAgICByZXR1cm47XG4gICAgfVxuICAgIC8vIFVwZGF0ZSBNb3VzZSBQb3NpdGlvblxuICAgIHN3aXRjaCAoZS50eXBlKSB7XG4gICAgICBjYXNlICdtb3VzZWRvd24nOlxuICAgICAgICBjbGlja2luZyA9IGZhbHNlO1xuICAgICAgICBicmVhaztcbiAgICAgIGNhc2UgJ21vdXNlb3V0JzpcbiAgICAgICAgdmFyIHJlbGF0ZWRUYXJnZXQgPSB0eXBlb2YgZS50b0VsZW1lbnQgIT0gJ3VuZGVmaW5lZCcgPyBlLnRvRWxlbWVudCA6IGUucmVsYXRlZFRhcmdldDtcbiAgICAgICAgaWYgKHJlbGF0ZWRUYXJnZXQgPT09IG51bGwpIHtcbiAgICAgICAgICBtb3VzZS54ID0gLUluZmluaXR5O1xuICAgICAgICAgIG1vdXNlLnkgPSAtSW5maW5pdHk7XG4gICAgICAgICAgbW91c2UuZWxlbWVudCA9IG51bGw7XG4gICAgICAgIH1cbiAgICAgICAgYnJlYWs7XG4gICAgICBjYXNlICdtb3VzZW1vdmUnOlxuICAgICAgICAvLyBHZXQgbW91c2UgY29vcmRpbmF0ZXNcbiAgICAgICAgLy8gVXBkYXRlIG1vdXNlIGNvb3JkaW5hdGVzXG4gICAgICAgIGNsaWVudC54ID0gZS5jbGllbnRYO1xuICAgICAgICBjbGllbnQueSA9IGUuY2xpZW50WTtcbiAgICAgIGRlZmF1bHQ6XG4gICAgICB2YXIgc2Nyb2xsT2Zmc2V0ID0gZ2V0U2Nyb2xsT2Zmc2V0KCk7XG4gICAgICBtb3VzZS54ID0gY2xpZW50LnggKyBzY3JvbGxPZmZzZXQubGVmdDtcbiAgICAgIG1vdXNlLnkgPSBjbGllbnQueSArIHNjcm9sbE9mZnNldC50b3A7XG4gICAgICBtb3VzZS5lbGVtZW50ID0gZS50YXJnZXQ7XG4gICAgICBcbiAgICAgIFxuICAgIH1cbiAgICBcbiAgICAvLyBHZXQgQ3Vyc29yIFByb3BzXG4gICAgaW52YWxpZGF0ZS5jYWxsKHRoaXMpO1xuICAgIFxuICAgIC8vIFByb2Nlc3MgQ2xpY2tcbiAgICBzd2l0Y2ggKGUudHlwZSkge1xuICAgICAgY2FzZSAnY2xpY2snOlxuICAgICAgICBpZiAoIWNsaWNraW5nICYmIGN1cnNvckl0ZW0pIHtcbiAgICAgICAgICBjbGlja2luZyA9IHRydWU7XG4gICAgICAgICAgaWYgKG1vdXNlLmVsZW1lbnQgJiYgY3Vyc29ySXRlbSAmJiBjdXJzb3JJdGVtLnRhcmdldCAmJiBjdXJzb3JJdGVtLnN5bWJvbCAhPT0gbW91c2UuZWxlbWVudCAmJiBpc0NoaWxkT2YoY3Vyc29ySXRlbS5jb250YWluZXIsIG1vdXNlLmVsZW1lbnQpKSB7XG4gICAgICAgICAgICAvL2Uuc3RvcEltbWVkaWF0ZVByb3BhZ2F0aW9uKCk7XG4gICAgICAgICAgICAvL2UucHJldmVudERlZmF1bHQoKTtcbiAgICAgICAgICAgIGN1cnNvckl0ZW0udGFyZ2V0LmNsaWNrKCk7XG4gICAgICAgICAgfVxuICAgICAgICAgIHZhciBjbGljayA9IGN1cnNvckl0ZW0gJiYgY3Vyc29ySXRlbS5jbGljaztcbiAgICAgICAgICBpZiAodHlwZW9mIGNsaWNrID09PSAnZnVuY3Rpb24nKSB7XG4gICAgICAgICAgICBjbGljay5jYWxsKGN1cnNvckl0ZW0uZWxlbWVudCwgZSk7XG4gICAgICAgICAgfVxuICAgICAgICB9XG4gICAgICAgIC8vZS5zdG9wUHJvcGFnYXRpb24oKTtcbiAgICAgICAgYnJlYWs7XG4gICAgfVxuICAgIC8vIFVwZGF0ZSBjdXJzb3JzXG4gICAgcmVuZGVyLmNhbGwoaW5zdGFuY2UpO1xuICB9XG4gIFxuICBmdW5jdGlvbiBnZXRQYXJlbnRzKGVsZW1lbnQsIHNlbGVjdG9yKSB7XG4gICAgdmFyIHBhcmVudHMgPSBbXTtcbiAgICB2YXIgcGFyZW50ID0gZWxlbWVudDtcbiAgICB3aGlsZSAocGFyZW50ID0gcGFyZW50LnBhcmVudEVsZW1lbnQgJiYgcGFyZW50LnBhcmVudEVsZW1lbnQuY2xvc2VzdChzZWxlY3RvcikpIHtcbiAgICAgIHBhcmVudHMucHVzaChwYXJlbnQpO1xuICAgIH1cbiAgICByZXR1cm4gcGFyZW50cztcbiAgfVxuICBcbiAgZnVuY3Rpb24gaW52YWxpZGF0ZSgpIHtcbiAgICBcbiAgICBjdXJzb3JJdGVtcyA9IGN1cnNvcnMubWFwKGZ1bmN0aW9uKGN1cnNvciwgaW5kZXgpIHtcbiAgICAgIHJldHVybiBnZXRDdXJzb3JJdGVtKGN1cnNvciwgY3Vyc29ySXRlbXNbaW5kZXhdKTtcbiAgICB9KTtcbiAgICBcbiAgICB2YXJcbiAgICAgIGZpbHRlcmVkID0gY3Vyc29ySXRlbXMuZmlsdGVyKGZ1bmN0aW9uKGN1cnNvckl0ZW0sIGluZGV4KSB7XG4gICAgICAgIHZhciBtb3VzZUVsZW1lbnQgPSBtb3VzZS5lbGVtZW50LCBzeW1ib2wgPSBjdXJzb3JJdGVtLnN5bWJvbCwgYm91bmRzID0gY3Vyc29ySXRlbS5ib3VuZHMsIGNvbnRhaW5lciA9IGN1cnNvckl0ZW0uY29udGFpbmVyLCByZXN1bHQgPSBmYWxzZTtcbiAgICAgICAgLy8gRGV0ZWN0IGlmIGEgbW91c2UgZWxlbWVudCBleGlzdHMgYW5kIHRoYXQgaXQncyBub3QgdGhlIHN5bWJvbCBpdHNlbGZcbiAgICAgICAgaWYgKG1vdXNlRWxlbWVudCkge1xuICAgICAgICAgIC8vIENoZWNrIGlmIG1vdXNlIGVsZW1lbnQgaXMgbm90IGNvbnRhaW5lZCBpbiBhIGxpbmtcbiAgICAgICAgICBpZiAoIW1vdXNlRWxlbWVudC5ocmVmICYmICFnZXRQYXJlbnRzKG1vdXNlRWxlbWVudCwgJ2EnKS5sZW5ndGgpIHsgXG4gICAgICAgICAgICAvLyBEZXRlY3QgaWYgc3ltYm9sIGlzIHRvcG1vc3QgZWxlbWVudFxuICAgICAgICAgICAgaWYgKHRvcG1vc3QobW91c2VFbGVtZW50LCBzeW1ib2wpID09PSBzeW1ib2wpIHtcbiAgICAgICAgICAgICAgLy8gRGV0ZWN0IGlmIG1vdXNlIGVsZW1lbnQgaXMgY29udGFpbmVkXG4gICAgICAgICAgICAgIGlmIChjb250YWluZXIgPT09IG1vdXNlRWxlbWVudCB8fCBpc0NoaWxkT2YoY29udGFpbmVyLCBtb3VzZUVsZW1lbnQpKSB7XG4gICAgICAgICAgICAgICAgLy8gTWF0Y2ggYm91bmRzXG4gICAgICAgICAgICAgICAgcmVzdWx0ID0gKG1vdXNlLnggPj0gYm91bmRzLnggJiYgbW91c2UueCA8PSBib3VuZHMueCArIGJvdW5kcy53aWR0aCAmJiBtb3VzZS55ID49IGJvdW5kcy55ICYmIG1vdXNlLnkgPD0gYm91bmRzLnkgKyBib3VuZHMuaGVpZ2h0KTtcbiAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgfVxuICAgICAgICAgIH1cbiAgICAgICAgfVxuICAgICAgICByZXR1cm4gcmVzdWx0O1xuICAgICAgfSksXG4gICAgICBzb3J0ZWQgPSBmaWx0ZXJlZC5zb3J0KGZ1bmN0aW9uKGEsIGIpIHtcbiAgICAgICAgdmFyIHpFbGVtZW50ID0gdG9wbW9zdChhLnN5bWJvbCwgYi5zeW1ib2wpO1xuICAgICAgICBpZiAoekVsZW1lbnQgPT09IGEuc3ltYm9sKSB7XG4gICAgICAgICAgcmV0dXJuIC0xO1xuICAgICAgICB9IGVsc2UgaWYgKHpFbGVtZW50ID09PSBiLnN5bWJvbCkge1xuICAgICAgICAgIHJldHVybiAxO1xuICAgICAgICB9XG4gICAgICAgIHZhciBwMSA9IHt4OiBhLnggKyBhLndpZHRoIC8gMiwgeTogYS55ICsgYS5oZWlnaHQgLyAyfTtcbiAgICAgICAgdmFyIHAyID0ge3g6IGIueCArIGIud2lkdGggLyAyLCB5OiBiLnkgKyBiLmhlaWdodCAvIDJ9O1xuICAgICAgICB2YXIgZDEgPSBNYXRoLnNxcnQoIE1hdGgucG93KChwMS54IC0gbW91c2UueCksIDIpICsgTWF0aC5wb3coKHAxLnkgLSBtb3VzZS55KSwgMikgKTtcbiAgICAgICAgdmFyIGQyID0gTWF0aC5zcXJ0KCBNYXRoLnBvdygocDIueCAtIG1vdXNlLngpLCAyKSArIE1hdGgucG93KChwMi55IC0gbW91c2UueSksIDIpICk7XG4gICAgICAgIHJldHVybiBkMSA8IGQyID8gZDEgOiBkMSA+IGQyID8gZDIgOiAwO1xuICAgICAgfSkucmV2ZXJzZSgpO1xuICAgIFxuICAgIGN1cnNvckl0ZW0gPSBzb3J0ZWRbMF07XG4gICAgXG4gICAgXG4gICAgLy8gU2V0IE1vdXNlUHJvdmlkZXJzXG4gICAgc2V0TW91c2VQcm92aWRlcnMoW3dpbmRvd10uY29uY2F0KGN1cnNvckl0ZW1zLm1hcChmdW5jdGlvbihpdGVtKSB7XG4gICAgICByZXR1cm4gaXRlbS5jb250YWluZXI7XG4gICAgfSkpKTtcbiAgICAvL3NldE1vdXNlUHJvdmlkZXJzKFt3aW5kb3ddKTtcbiAgfVxuICBcbiAgZnVuY3Rpb24gcmVuZGVyKCkge1xuXG4gICAgY3Vyc29ySXRlbXMuZm9yRWFjaChmdW5jdGlvbihpdGVtKSB7XG4gICAgICBcbiAgICAgIHZhclxuICAgICAgICBzeW1ib2wgPSBpdGVtLnN5bWJvbCxcbiAgICAgICAgc3R5bGUgPSB7XG4gICAgICAgICAgdmlzaWJpbGl0eTogaXRlbSA9PT0gY3Vyc29ySXRlbSA/ICcnIDogJ2hpZGRlbicsXG4gICAgICAgICAgcG9zaXRpb246ICdhYnNvbHV0ZScsXG4gICAgICAgICAgY3Vyc29yOiAnaW5oZXJpdCdcbiAgICAgICAgfTtcbiAgICAgICAgXG4gICAgICBpZiAoaXRlbS5zdHlsZSA9PT0gJ3RyYW5zZm9ybScgJiYgdHJhbnNmb3JtU3R5bGUpIHtcbiAgICAgICAgc3R5bGVbdHJhbnNmb3JtU3R5bGUgKyBcIk9yaWdpblwiXSA9ICcnO1xuICAgICAgICBzdHlsZVt0cmFuc2Zvcm1TdHlsZV0gPSBcIlwiO1xuICAgICAgfSBlbHNlIHtcbiAgICAgICAgc3R5bGUubGVmdCA9IFwiXCI7XG4gICAgICAgIHN0eWxlLnRvcCA9IFwiXCI7XG4gICAgICB9XG4gICAgICBcbiAgICAgIHN5bWJvbC5jbGFzc0xpc3QgJiYgIXN5bWJvbC5jbGFzc0xpc3QuY29udGFpbnMoXCJjdXJzb3JcIikgJiYgc3ltYm9sLmNsYXNzTGlzdC5hZGQoXCJjdXJzb3JcIik7XG4gICAgICBjc3Moc3ltYm9sLCBzdHlsZSk7XG4gICAgICBcbiAgICAgIGlmIChjdXJzb3JJdGVtID09PSBpdGVtKSB7XG4gICAgICAgIFxuICAgICAgICB2YXIgcG9zID0gZ2V0T2Zmc2V0KHN5bWJvbCk7XG4gICAgICAgIFxuICAgICAgICB2YXIgcHggPSBwb3MubGVmdDtcbiAgICAgICAgdmFyIHB5ID0gcG9zLnRvcDtcbiAgICAgICAgXG4gICAgICAgIHZhciBvZmYgPSBpdGVtLm9mZnNldDtcbiAgICAgICAgdmFyIHggPSBNYXRoLnJvdW5kKChtb3VzZS54IC0gcHgpICsgb2ZmLmxlZnQpO1xuICAgICAgICB2YXIgeSA9IE1hdGgucm91bmQoKG1vdXNlLnkgLSBweSkgKyBvZmYudG9wKTtcbiAgICAgICAgXG4gICAgICAgIHN0eWxlID0ge1xuICAgICAgICB9O1xuICAgICAgICBcbiAgICAgICAgaWYgKGl0ZW0uc3R5bGUgPT09ICd0cmFuc2Zvcm0nICYmIHRyYW5zZm9ybVN0eWxlKSB7XG4gICAgICAgICAgc3R5bGVbdHJhbnNmb3JtU3R5bGUgKyBcIk9yaWdpblwiXSA9ICcwIDAnO1xuICAgICAgICAgIHN0eWxlW3RyYW5zZm9ybVN0eWxlXSA9IFwidHJhbnNsYXRlM2QoXCIgKyB4ICsgXCJweCxcIiArIHkgKyBcInB4LCAwKSBzY2FsZShcIiArIGl0ZW0uc2NhbGUgKyBcIixcIiArIGl0ZW0uc2NhbGUgKyBcIilcIjtcbiAgICAgICAgfSBlbHNlIHtcbiAgICAgICAgICBzdHlsZS5sZWZ0ID0gKHggKyBwb3MubGVmdCkgKyBcInB4XCI7XG4gICAgICAgICAgc3R5bGUudG9wID0gKHkgKyBwb3MudG9wKSArIFwicHhcIjtcbiAgICAgICAgfVxuICAgICAgICBcbiAgICAgICAgY3NzKHN5bWJvbCwgc3R5bGUpO1xuICAgICAgfVxuICAgICAgXG4gICAgICBcbiAgICAgIGlmIChpdGVtID09PSBjdXJzb3JJdGVtKSB7XG4gICAgICAgIHN5bWJvbC5jbGFzc0xpc3QgJiYgIXN5bWJvbC5jbGFzc0xpc3QuY29udGFpbnMoXCJjdXJzb3ItYWN0aXZlXCIpICYmIHN5bWJvbC5jbGFzc0xpc3QuYWRkKFwiY3Vyc29yLWFjdGl2ZVwiKTtcbiAgICAgICAgc3ltYm9sLmNsYXNzTGlzdCAmJiBzeW1ib2wuY2xhc3NMaXN0LmNvbnRhaW5zKFwiY3Vyc29yLWhpZGRlblwiKSAmJiBzeW1ib2wuY2xhc3NMaXN0LnJlbW92ZShcImN1cnNvci1oaWRkZW5cIik7XG4gICAgICB9IGVsc2Uge1xuICAgICAgICBzeW1ib2wuY2xhc3NMaXN0ICYmIHN5bWJvbC5jbGFzc0xpc3QuY29udGFpbnMoXCJjdXJzb3ItYWN0aXZlXCIpICYmIHN5bWJvbC5jbGFzc0xpc3QucmVtb3ZlKFwiY3Vyc29yLWFjdGl2ZVwiKTtcbiAgICAgICAgc3ltYm9sLmNsYXNzTGlzdCAmJiAhc3ltYm9sLmNsYXNzTGlzdC5jb250YWlucyhcImN1cnNvci1oaWRkZW5cIikgJiYgc3ltYm9sLmNsYXNzTGlzdC5hZGQoXCJjdXJzb3ItaGlkZGVuXCIpO1xuICAgICAgfVxuICAgICAgXG4gICAgfSk7XG4gIH07XG4gIFxuICB0aGlzLnVwZGF0ZSA9IGZ1bmN0aW9uKCkge1xuICAgIGludmFsaWRhdGUuY2FsbCh0aGlzKTtcbiAgICByZW5kZXIuY2FsbCh0aGlzKTtcbiAgfTtcbiAgXG4gIHRoaXMuYWRkID0gZnVuY3Rpb24oY3Vyc29yKSB7XG4gICAgaWYgKGN1cnNvcnMuaW5kZXhPZihjdXJzb3IpID09PSAtMSkge1xuICAgICAgY3Vyc29ycy5wdXNoKGN1cnNvcik7XG4gICAgICB0aGlzLnVwZGF0ZSgpO1xuICAgIH1cbiAgfTtcbiAgXG4gIHRoaXMucmVtb3ZlID0gZnVuY3Rpb24oY3Vyc29yKSB7XG4gICAgY3Vyc29ycy5zcGxpY2UoY3Vyc29ycy5pbmRleE9mKGN1cnNvciksIDEpO1xuICAgIHRoaXMudXBkYXRlKCk7XG4gIH07XG4gIFxuICB2YXIgbW91c2VQcm92aWRlcnMgPSBbXTtcbiAgZnVuY3Rpb24gc2V0TW91c2VQcm92aWRlcnMoZWxlbWVudHMpIHtcbiAgICBlbGVtZW50cyA9IGVsZW1lbnRzLmZpbHRlcihmdW5jdGlvbihuKSB7IHJldHVybiAobik7IH0pO1xuICAgIG1vdXNlUHJvdmlkZXJzLmZvckVhY2goZnVuY3Rpb24oZWxlbWVudCkge1xuICAgICAgaWYgKGVsZW1lbnRzLmluZGV4T2YoZWxlbWVudCkgPT09IC0xKSB7XG4gICAgICAgIHJlbW92ZU1vdXNlTGlzdGVuZXJzKGVsZW1lbnQpO1xuICAgICAgfVxuICAgIH0pO1xuICAgIGVsZW1lbnRzLmZvckVhY2goZnVuY3Rpb24oZWxlbWVudCkge1xuICAgICAgaWYgKG1vdXNlUHJvdmlkZXJzLmluZGV4T2YoZWxlbWVudCkgPT09IC0xKSB7XG4gICAgICAgIGFkZE1vdXNlTGlzdGVuZXJzKGVsZW1lbnQpO1xuICAgICAgfVxuICAgIH0pO1xuICAgIG1vdXNlUHJvdmlkZXJzID0gZWxlbWVudHM7XG4gIH1cbiAgXG4gIGZ1bmN0aW9uIGFkZE1vdXNlTGlzdGVuZXJzKGVsZW1lbnQpIHtcbiAgICBmb3IgKHZhciBpID0gMCwgZXZlbnQ7IGV2ZW50ID0gZXZlbnRzW2ldOyBpKyspIHtcbiAgICAgIGVsZW1lbnQuYWRkRXZlbnRMaXN0ZW5lcihldmVudCwgaGFuZGxlRXZlbnQpO1xuICAgIH1cbiAgfVxuICBcbiAgZnVuY3Rpb24gcmVtb3ZlTW91c2VMaXN0ZW5lcnMoZWxlbWVudCkge1xuICAgIGZvciAodmFyIGkgPSAwLCBldmVudDsgZXZlbnQgPSBldmVudHNbaV07IGkrKykge1xuICAgICAgZWxlbWVudC5yZW1vdmVFdmVudExpc3RlbmVyKGV2ZW50LCBoYW5kbGVFdmVudCk7XG4gICAgfVxuICB9XG4gIFxuICBpbml0LmNhbGwodGhpcyk7XG4gIFxufVxuXG5cblxuZnVuY3Rpb24gZ2V0Q3Vyc29ySXRlbShjdXJzb3IpIHtcbiAgXG4gIHZhclxuICAgIGVsZW1lbnQgPSBjdXJzb3IuZ2V0KCdlbGVtZW50JyksXG4gICAgcHJvcHMgPSBjdXJzb3IuZ2V0KCksIFxuICAgIHN5bWJvbCA9IHByb3BzLnN5bWJvbCwgXG4gICAgYm91bmRzID0gcHJvcHMuYm91bmRzLFxuICAgIG9mZnNldCA9IHByb3BzLm9mZnNldCxcbiAgICBzdHlsZSA9IHByb3BzLnN0eWxlLFxuICAgIHNjYWxlID0gcHJvcHMuc2NhbGUsXG4gICAgdGFyZ2V0ID0gcHJvcHMudGFyZ2V0IHx8IHN5bWJvbC5ub2RlTmFtZS50b0xvd2VyQ2FzZSgpID09PSAnYScgPyBzeW1ib2wgOiBlbGVtZW50LFxuICAgIGNvbnRhaW5lcixcbiAgICBkaXNwbGF5ID0gZWxlbWVudC5zdHlsZS5kaXNwbGF5O1xuICAgIFxuICAvLyBGb3JjZSB2aXNpYmlsaXR5IHRvIGdldCB0aGluZ3MgbWVhc3VyZWRcbiAgY3NzKGVsZW1lbnQsIHtcbiAgICBkaXNwbGF5OiAnJ1xuICB9KTtcbiAgXG4gIC8vIFxuICBwcm9wcyA9IGN1cnNvci5nZXQoKTtcbiAgXG4gIHN5bWJvbCA9IHByb3BzLnN5bWJvbDtcbiAgYm91bmRzID0gcHJvcHMuYm91bmRzO1xuICBvZmZzZXQgPSBwcm9wcy5vZmZzZXQ7XG4gIHN0eWxlID0gcHJvcHMuc3R5bGU7XG4gIHNjYWxlID0gcHJvcHMuc2NhbGU7XG4gIHRhcmdldCA9IHByb3BzLnRhcmdldCB8fCBzeW1ib2wubm9kZU5hbWUudG9Mb3dlckNhc2UoKSA9PT0gJ2EnID8gc3ltYm9sIDogZWxlbWVudDtcbiAgXG4gIC8vIEFkZCBjdXJzb3Igc3ltYm9sIHRvIGRvbVxuICBpZiAoIXN5bWJvbC5wYXJlbnROb2RlKSB7XG4gICAgZWxlbWVudC5hcHBlbmRDaGlsZChzeW1ib2wpO1xuICB9XG4gIFxuICAvLyBHZXQgYm91bmRzIGFuZCBjb250YWluZXJcbiAgaWYgKGJvdW5kcyAmJiBib3VuZHMuZ2V0Qm91bmRpbmdDbGllbnRSZWN0KSB7XG4gICAgLy8gRWxlbWVudCBib3VuZHNcbiAgICBjb250YWluZXIgPSBib3VuZHM7XG4gICAgYm91bmRzID0gZ2V0Qm91bmRpbmdSZWN0KGJvdW5kcyk7XG4gIH0gZWxzZSB7XG4gICAgLy8gT2JqZWN0IGJvdW5kczogRWl0aGVyIGNob29zZSBzeW1ib2wncywgZWxlbWVudCdzIG9mZnNldFBhcmVudCBvciByb290IGFzIGNvbnRhaW5lclxuICAgIC8vIEZJWE1FOiBEZXNjZW5kYW50cyBvZiBib2R5IHdpdGggcG9zaXRpb246IGZpeGVkIHdvdWxkbid0IGhhdmUgb2Zmc2V0UGFyZW50OiBodHRwOi8vc3RhY2tvdmVyZmxvdy5jb20vcXVlc3Rpb25zLzMwNjMwNS93aGF0LXdvdWxkLW1ha2Utb2Zmc2V0cGFyZW50LW51bGxcbiAgICBjb250YWluZXIgPSBzeW1ib2wub2Zmc2V0UGFyZW50IHx8IGVsZW1lbnQgJiYgZWxlbWVudCA9PT0gc3ltYm9sID8gZWxlbWVudC5vZmZzZXRQYXJlbnQgfHwgZG9jdW1lbnQuZG9jdW1lbnRFbGVtZW50IDogZWxlbWVudDtcbiAgICB2YXIgcmVjdCA9IGdldEJvdW5kaW5nUmVjdChjb250YWluZXIpO1xuICAgIFxuICAgIHZhciBjb250YWluZXJQb3MgPSBnZXRPZmZzZXQoY29udGFpbmVyKSB8fCB7eDogMCwgeTogMH07XG4gICAgLy8gUHJvY2VzcyBjdXN0b20gZnVuY3Rpb24gXG4gICAgaWYgKHR5cGVvZiBib3VuZHMgPT09ICdmdW5jdGlvbicpIHtcbiAgICAgIGJvdW5kcyA9IGJvdW5kcyhjb250YWluZXIpO1xuICAgIH1cbiAgICAvLyBHZXQgcGVyY2VudCB2YWx1ZXNcbiAgICB2YXIgeCA9IHR5cGVvZiBib3VuZHMueCA9PT0gJ3N0cmluZycgJiYgYm91bmRzLnguaW5kZXhPZihcIiVcIikgPj0gMCA/IHBhcnNlRmxvYXQoYm91bmRzLngpICogcmVjdC53aWR0aCAvIDEwMCA6IHBhcnNlRmxvYXQoYm91bmRzLngpO1xuICAgIHZhciB5ID0gdHlwZW9mIGJvdW5kcy55ID09PSAnc3RyaW5nJyAmJiBib3VuZHMueS5pbmRleE9mKFwiJVwiKSA+PSAwID8gcGFyc2VGbG9hdChib3VuZHMueSkgKiByZWN0LmhlaWdodCAvIDEwMCA6IHBhcnNlRmxvYXQoYm91bmRzLnkpO1xuICAgIHZhciB3aWR0aCA9IHR5cGVvZiBib3VuZHMud2lkdGggPT09ICdzdHJpbmcnICYmIGJvdW5kcy53aWR0aC5pbmRleE9mKFwiJVwiKSA+PSAwID8gcGFyc2VGbG9hdChib3VuZHMud2lkdGgpICogcmVjdC53aWR0aCAvIDEwMCA6IHBhcnNlRmxvYXQoYm91bmRzLndpZHRoKTtcbiAgICB2YXIgaGVpZ2h0ID0gdHlwZW9mIGJvdW5kcy5oZWlnaHQgPT09ICdzdHJpbmcnICYmIGJvdW5kcy5oZWlnaHQuaW5kZXhPZihcIiVcIikgPj0gMCA/IHBhcnNlRmxvYXQoYm91bmRzLmhlaWdodCkgKiByZWN0LmhlaWdodCAvIDEwMCA6IHBhcnNlRmxvYXQoYm91bmRzLmhlaWdodCk7XG4gICAgYm91bmRzID0ge1xuICAgICAgeDogY29udGFpbmVyUG9zLmxlZnQgKyB4LFxuICAgICAgeTogY29udGFpbmVyUG9zLnRvcCArIHksXG4gICAgICB3aWR0aDogd2lkdGgsXG4gICAgICBoZWlnaHQ6IGhlaWdodFxuICAgIH07XG4gIH1cbiAgXG4gIC8vIFJlc2V0IHZpc2liaWxpdHlcbiAgY3NzKGVsZW1lbnQsICdkaXNwbGF5JywgZGlzcGxheSk7XG4gIFxuICByZXR1cm4gbWVyZ2UocHJvcHMsIHtcbiAgICBjdXJzb3I6IGN1cnNvcixcbiAgICBzeW1ib2w6IHN5bWJvbCxcbiAgICBib3VuZHM6IGJvdW5kcyxcbiAgICBjb250YWluZXI6IGNvbnRhaW5lcixcbiAgICB0YXJnZXQ6IHRhcmdldCxcbiAgICBvZmZzZXQ6IG9mZnNldCxcbiAgICBzdHlsZTogc3R5bGUsXG4gICAgc2NhbGU6IHNjYWxlXG4gIH0pO1xufVxuXG5tb2R1bGUuZXhwb3J0cyA9IEN1cnNvck1hbmFnZXI7IiwibW9kdWxlLmV4cG9ydHMgPSBmdW5jdGlvbigpIHtcbiAgdmFyIG9iaiA9IHt9LFxuICAgIGkgPSAwLFxuICAgIGlsID0gYXJndW1lbnRzLmxlbmd0aCxcbiAgICBrZXk7XG4gIGZvciAoOyBpIDwgaWw7IGkrKykge1xuICAgIGZvciAoa2V5IGluIGFyZ3VtZW50c1tpXSkge1xuICAgICAgaWYgKGFyZ3VtZW50c1tpXS5oYXNPd25Qcm9wZXJ0eShrZXkpKSB7XG4gICAgICAgICAgb2JqW2tleV0gPSBhcmd1bWVudHNbaV1ba2V5XTtcbiAgICAgIH1cbiAgICB9XG4gIH1cbiAgcmV0dXJuIG9iajtcbn07IiwidmFyIFxuXG4gIGdldFN0eWxlID0gZnVuY3Rpb24oZWwsIGNzc3Byb3Ape1xuICAgIGlmIChlbC5zdHlsZSlcbiAgICAgIGlmIChlbC5jdXJyZW50U3R5bGUpIC8vSUVcbiAgICAgICAgcmV0dXJuIGVsLmN1cnJlbnRTdHlsZVtjc3Nwcm9wXTtcbiAgICAgIGVsc2UgaWYgKGRvY3VtZW50LmRlZmF1bHRWaWV3ICYmIGRvY3VtZW50LmRlZmF1bHRWaWV3LmdldENvbXB1dGVkU3R5bGUpIC8vRmlyZWZveFxuICAgICAgICByZXR1cm4gZG9jdW1lbnQuZGVmYXVsdFZpZXcuZ2V0Q29tcHV0ZWRTdHlsZShlbCwgXCJcIilbY3NzcHJvcF07XG4gICAgICBlbHNlIC8vdHJ5IGFuZCBnZXQgaW5saW5lIHN0eWxlXG4gICAgICAgIHJldHVybiBlbC5zdHlsZVtjc3Nwcm9wXTtcbiAgfSxcbiAgXG4gIGdldFpJbmRleCA9IGZ1bmN0aW9uKGVsKSB7XG4gICAgdmFyIHpJbmRleCA9IHBhcnNlRmxvYXQoZ2V0U3R5bGUoZWwsICd6SW5kZXgnKSk7XG4gICAgekluZGV4ID0gIWlzTmFOKHpJbmRleCkgPyB6SW5kZXggOiAwO1xuICAgIGlmICh6SW5kZXggPT09IDApIHtcbiAgICAgIGlmIChlbC5wYXJlbnROb2RlKSB7XG4gICAgICAgIHJldHVybiBnZXRaSW5kZXgoZWwucGFyZW50Tm9kZSk7XG4gICAgICB9XG4gICAgfVxuICAgIHJldHVybiB6SW5kZXg7XG4gIH0sXG4gIFxuICBpc0NoaWxkT2YgPSBmdW5jdGlvbihwYXJlbnQsIGNoaWxkKSB7XG4gICBpZiAoIWNoaWxkIHx8ICFwYXJlbnQpIHtcbiAgICAgcmV0dXJuIGZhbHNlO1xuICAgfVxuICAgdmFyIG5vZGUgPSBjaGlsZC5wYXJlbnROb2RlO1xuICAgd2hpbGUgKG5vZGUgIT0gbnVsbCkge1xuICAgICBpZiAobm9kZSA9PSBwYXJlbnQpIHtcbiAgICAgICAgIHJldHVybiB0cnVlO1xuICAgICB9XG4gICAgIG5vZGUgPSBub2RlLnBhcmVudE5vZGU7XG4gICB9XG4gICByZXR1cm4gZmFsc2U7XG4gIH07XG5cblxuLy8gQ29tcGFyZSBWaXNpYmlsaXR5LCByZXR1cm5zIC0xLCAxIG9yIDBcbmZ1bmN0aW9uIGNvbXBhcmVWaXNpYmlsaXR5KGEsIGIpIHtcbiAgdmFyIHZhID0gYSAmJiBhLnN0eWxlICYmIGdldFN0eWxlKGEsICdkaXNwbGF5JykgIT09ICdub25lJztcbiAgdmFyIHZiID0gYiAmJiBiLnN0eWxlICYmIGdldFN0eWxlKGIsICdkaXNwbGF5JykgIT09ICdub25lJztcbiAgaWYgKHZhICYmICF2Yikge1xuICAgIHJldHVybiAtMTtcbiAgfSBlbHNlIGlmICh2YiAmJiAhdmEpIHtcbiAgICByZXR1cm4gMTtcbiAgfVxuICByZXR1cm4gMDtcbn1cblxuLy8gQ29tcGFyZSBaLUluZGV4LCByZXR1cm5zIC0xLCAxIG9yIDBcbmZ1bmN0aW9uIGNvbXBhcmVQb3NpdGlvblN0YWNrKGEsIGIpIHtcbiAgdmFyIHBhID0gZ2V0U3R5bGUoYSwgJ3Bvc2l0aW9uJyk7XG4gIHZhciBwYiA9IGdldFN0eWxlKGIsICdwb3NpdGlvbicpO1xuICBpZiAoemEgPiB6Yikge1xuICAgIHJldHVybiAtMTtcbiAgfSBlbHNlIGlmICh6YiA+IHphKSB7XG4gICAgcmV0dXJuIDE7XG4gIH1cbiAgcmV0dXJuIDA7XG59XG5cblxuLy8gQ29tcGFyZSBaLUluZGV4LCByZXR1cm5zIC0xLCAxIG9yIDBcbmZ1bmN0aW9uIGNvbXBhcmVaSW5kZXgoYSwgYikge1xuICB2YXIgemEgPSBnZXRaSW5kZXgoYSk7XG4gIHZhciB6YiA9IGdldFpJbmRleChiKTtcbiAgaWYgKHphID4gemIpIHtcbiAgICByZXR1cm4gLTE7XG4gIH0gZWxzZSBpZiAoemIgPiB6YSkge1xuICAgIHJldHVybiAxO1xuICB9XG4gIHJldHVybiAwO1xufVxuXG4vLyBDb21wYXJlIFBvc2l0aW9uIC0gTUlUIExpY2Vuc2VkLCBKb2huIFJlc2lnXG5mdW5jdGlvbiBjb21wYXJlUG9zaXRpb24oYSwgYil7XG4gIHJldHVybiBhLmNvbXBhcmVEb2N1bWVudFBvc2l0aW9uID9cbiAgICBhLmNvbXBhcmVEb2N1bWVudFBvc2l0aW9uKGIpIDpcbiAgICBhLmNvbnRhaW5zID9cbiAgICAgIChhICE9IGIgJiYgYS5jb250YWlucyhiKSAmJiAxNikgK1xuICAgICAgICAoYSAhPSBiICYmIGIuY29udGFpbnMoYSkgJiYgOCkgK1xuICAgICAgICAoYS5zb3VyY2VJbmRleCA+PSAwICYmIGIuc291cmNlSW5kZXggPj0gMCA/XG4gICAgICAgICAgKGEuc291cmNlSW5kZXggPCBiLnNvdXJjZUluZGV4ICYmIDQpICtcbiAgICAgICAgICAgIChhLnNvdXJjZUluZGV4ID4gYi5zb3VyY2VJbmRleCAmJiAyKSA6XG4gICAgICAgICAgMSkgK1xuICAgICAgMCA6XG4gICAgICAwO1xufVxuXG5tb2R1bGUuZXhwb3J0cyA9IGZ1bmN0aW9uKGEsIGIpIHtcbiAgLy8gQ29tcGFyZSBWaXNpYmlsaXR5XG4gIHZhciB2aXNpYmlsaXR5ID0gY29tcGFyZVZpc2liaWxpdHkoYSwgYik7XG4gIGlmICh2aXNpYmlsaXR5ICE9PSAwKSB7XG4gICAgcmV0dXJuIHZpc2liaWxpdHkgPCAwID8gYSA6IGI7XG4gIH0gXG4gIFxuICAvLyBDb21wYXJlIHBhcmVudC9jaGlsZCByZWxhdGlvblxuICBpZiAoaXNDaGlsZE9mKGEsIGIpKSB7XG4gICAgLy8gaWYgYiBpcyBjb250YWluZWQgaW4gYSwgaXQncyBhbHdheXMgb24gdG9wXG4gICAgcmV0dXJuIGI7XG4gIH1cbiAgXG4gIC8vIENvbXBhcmUgWi1JbmRleCBTdGFja1xuICB2YXIgekluZGV4Q29tcGFyaXNvblJlc3VsdCA9IGNvbXBhcmVaSW5kZXgoYSwgYik7XG4gIGlmICh6SW5kZXhDb21wYXJpc29uUmVzdWx0ID09PSAtMSkge1xuICAgIC8vIGEgaXMgb24gdG9wXG4gICAgcmV0dXJuIGE7XG4gIH1cbiAgaWYgKHpJbmRleENvbXBhcmlzb25SZXN1bHQgPT09IDEpIHtcbiAgICAvLyBiIGlzIG9uIHRvcFxuICAgIHJldHVybiBiO1xuICB9XG4gIC8vIFRPRE86IENvbXBhcmUgQW5jZXN0b3IgUG9zaXRpb24gU3RhY2tcbiAgXG4gIC8vIENvbXBhcmUgRG9jdW1lbnQgUG9zaXRpb25cbiAgdmFyIGRvY3VtZW50UG9zaXRpb25SZXN1bHQgPSBjb21wYXJlUG9zaXRpb24oYSwgYik7XG4gIGlmIChkb2N1bWVudFBvc2l0aW9uUmVzdWx0ID09PSAyKSB7XG4gICAgLy8gYSBpcyBwcmVjZWRpbmdcbiAgICByZXR1cm4gYTtcbiAgfVxuICBpZiAoZG9jdW1lbnRQb3NpdGlvblJlc3VsdCA9PT0gNCkge1xuICAgIC8vIGIgaXMgZm9sbG93aW5nXG4gICAgcmV0dXJuIGI7XG4gIH1cbiAgXG4gIHJldHVybiBhO1xufTsiXX0=
