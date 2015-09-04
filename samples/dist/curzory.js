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
  
  function invalidate() {
    
    cursorItems = cursors.map(function(cursor, index) {
      return getCursorItem(cursor, cursorItems[index]);
    });
    
    cursorItem = cursorItems.filter(function(cursorItem, index) {
      var mouseElement = mouse.element, symbol = cursorItem.symbol, bounds = cursorItem.bounds, container = cursorItem.container, result = false;
      // Detect if a mouse element exists and that it's not the symbol itself
      if (mouseElement) {
        // Detect if symbol is topmost element
        if (topmost(mouseElement, symbol) === symbol) {
          // Detect if mouse element is contained
          if (container === mouseElement || isChildOf(container, mouseElement)) {
            // Match bounds
            result = (mouse.x >= bounds.x && mouse.x <= bounds.x + bounds.width && mouse.y >= bounds.y && mouse.y <= bounds.y + bounds.height);
          }
        }
      }
      return result;
    }).sort(function(a, b) {
      var zElement = topmost(a.symbol, b.symbol);
      if (zElement === a.symbol) {
        return a;
      } else if (zElement === b.symbol) {
        return b;
      }
      var p1 = {x: a.x + a.width / 2, y: a.y + a.height / 2};
      var p2 = {x: b.x + b.width / 2, y: b.y + b.height / 2};
      var d1 = Math.sqrt( Math.pow((p1.x - mouse.x), 2) + Math.pow((p1.y - mouse.y), 2) );
      var d2 = Math.sqrt( Math.pow((p2.x - mouse.x), 2) + Math.pow((p2.y - mouse.y), 2) );
      return d1 < d2 ? d1 : d1 > d2 ? d2 : 0;
    }).reverse()[0];
    
    
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
    props, symbol, bounds, container, offset, style, scale;
    
  css(element, {
    display: ''
  });
  
  props = cursor.get();
  
  symbol = props.symbol;
  bounds = props.bounds;
  offset = props.offset;
  style = props.style;
  scale = props.scale;
  
  // Add cursor symbol to dom
  if (!symbol.parentNode) {
    element.appendChild(symbol);
  }
  
  // Get bounds
  var container;
  if (bounds && bounds.getBoundingClientRect) {
    // Element bounds
    container = bounds;
    bounds = getBoundingRect(bounds);
  } else {
    // Object bounds
    container = symbol.offsetParent || element;
    var rect = getBoundingRect(container);
    
    var containerPos = getOffset(container) || {x: 0, y: 0};
    // Process function 
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
  
  var target = props.target || symbol.nodeName.toLowerCase() === 'a' ? symbol : element;
  
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
//# sourceMappingURL=data:application/json;charset:utf-8;base64,eyJ2ZXJzaW9uIjozLCJzb3VyY2VzIjpbIm5vZGVfbW9kdWxlcy9ncnVudC1icm93c2VyaWZ5L25vZGVfbW9kdWxlcy9icm93c2VyaWZ5L25vZGVfbW9kdWxlcy9icm93c2VyLXBhY2svX3ByZWx1ZGUuanMiLCJzcmMvY3Vyem9yeS5qcyIsInNyYy9saWIvQ3Vyc29yLmpzIiwic3JjL2xpYi9DdXJzb3JNYW5hZ2VyLmpzIiwic3JjL2xpYi9tZXJnZS5qcyIsInNyYy9saWIvdG9wbW9zdC5qcyJdLCJuYW1lcyI6W10sIm1hcHBpbmdzIjoiQUFBQTtBQ0FBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBOztBQ1RBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTs7QUMzR0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7O0FDMWFBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7O0FDYkE7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0EiLCJmaWxlIjoiZ2VuZXJhdGVkLmpzIiwic291cmNlUm9vdCI6IiIsInNvdXJjZXNDb250ZW50IjpbIihmdW5jdGlvbiBlKHQsbixyKXtmdW5jdGlvbiBzKG8sdSl7aWYoIW5bb10pe2lmKCF0W29dKXt2YXIgYT10eXBlb2YgcmVxdWlyZT09XCJmdW5jdGlvblwiJiZyZXF1aXJlO2lmKCF1JiZhKXJldHVybiBhKG8sITApO2lmKGkpcmV0dXJuIGkobywhMCk7dmFyIGY9bmV3IEVycm9yKFwiQ2Fubm90IGZpbmQgbW9kdWxlICdcIitvK1wiJ1wiKTt0aHJvdyBmLmNvZGU9XCJNT0RVTEVfTk9UX0ZPVU5EXCIsZn12YXIgbD1uW29dPXtleHBvcnRzOnt9fTt0W29dWzBdLmNhbGwobC5leHBvcnRzLGZ1bmN0aW9uKGUpe3ZhciBuPXRbb11bMV1bZV07cmV0dXJuIHMobj9uOmUpfSxsLGwuZXhwb3J0cyxlLHQsbixyKX1yZXR1cm4gbltvXS5leHBvcnRzfXZhciBpPXR5cGVvZiByZXF1aXJlPT1cImZ1bmN0aW9uXCImJnJlcXVpcmU7Zm9yKHZhciBvPTA7bzxyLmxlbmd0aDtvKyspcyhyW29dKTtyZXR1cm4gc30pIiwidmFyXG4gIEN1cnNvck1hbmFnZXIgPSByZXF1aXJlKCcuL2xpYi9DdXJzb3JNYW5hZ2VyJyksXG4gIEN1cnNvciA9IHJlcXVpcmUoJy4vbGliL0N1cnNvcicpO1xuICBjdXJzb3JNYW5hZ2VyID0gbmV3IEN1cnNvck1hbmFnZXIoKTtcblxubW9kdWxlLmV4cG9ydHMgPSBmdW5jdGlvbiBjdXJ6b3J5KGVsZW1lbnQsIG9wdGlvbnMpIHtcbiAgdmFyIGN1cnNvciA9IG5ldyBDdXJzb3IoZWxlbWVudCwgb3B0aW9ucyk7XG4gIGN1cnNvck1hbmFnZXIuYWRkKGN1cnNvcik7XG4gIHJldHVybiBjdXJzb3I7XG59OyIsInZhclxuICBtZXJnZSA9IHJlcXVpcmUoJy4vbWVyZ2UnKSxcbiAgXG4gIGNyZWF0ZUVsZW1lbnQgPSBmdW5jdGlvbihzdHJpbmcpIHtcbiAgICB2YXIgZWxlbWVudCA9IGRvY3VtZW50LmNyZWF0ZUVsZW1lbnQoJ2RpdicpO1xuICAgIGVsZW1lbnQuaW5uZXJIVE1MID0gc3RyaW5nO1xuICAgIHZhciByZXN1bHQgPSBlbGVtZW50LmZpcnN0Q2hpbGQ7XG4gICAgZWxlbWVudC5yZW1vdmVDaGlsZChyZXN1bHQpO1xuICAgIHJldHVybiByZXN1bHQ7XG4gIH0sXG5cbiAgaXNIVE1MID0gZnVuY3Rpb24oc3RyaW5nKSB7XG4gICAgcmV0dXJuIHR5cGVvZiBzdHJpbmcgPT09ICdzdHJpbmcnICYmIHN0cmluZy5tYXRjaCgvPFxcLz9cXHcrKChcXHMrXFx3KyhcXHMqPVxccyooPzpcIi4qP1wifCcuKj8nfFteJ1wiPlxcc10rKSk/KStcXHMqfFxccyopXFwvPz4vKTtcbiAgfSxcbiAgXG5cbiAgZ2V0RWxlbWVudCA9IGZ1bmN0aW9uKHZhbHVlLCBwYXJlbnQpIHtcbiAgICB2YWx1ZSA9IHZhbHVlLnRvQXJyYXkgPyB2YWx1ZS50b0FycmF5KClbMF0gOiB2YWx1ZSBpbnN0YW5jZW9mIEFycmF5ID8gdmFsdWVbMF0gOiB2YWx1ZTtcbiAgICBpZiAodHlwZW9mIHZhbHVlID09PSAnZnVuY3Rpb24nKSB7XG4gICAgICB2YWx1ZSA9IHZhbHVlLmNhbGwodGhpcywgdmFsdWUpO1xuICAgIH1cbiAgICBpZiAodHlwZW9mIHZhbHVlID09PSAnc3RyaW5nJykge1xuICAgICAgaWYgKGlzSFRNTCh2YWx1ZSkpIHtcbiAgICAgICAgdmFsdWUgPSBjcmVhdGVFbGVtZW50KHZhbHVlKTtcbiAgICAgIH0gZWxzZSB7XG4gICAgICAgIHZhbHVlID0gcGFyZW50LnF1ZXJ5U2VsZWN0b3IodmFsdWUpO1xuICAgICAgfVxuICAgIH1cbiAgICBpZiAodmFsdWUgJiYgdmFsdWUubm9kZU5hbWUpIHtcbiAgICAgIHJldHVybiB2YWx1ZTtcbiAgICB9XG4gICAgcmV0dXJuIG51bGw7XG4gIH07XG5cbm1vZHVsZS5leHBvcnRzID0gZnVuY3Rpb24gQ3Vyc29yKGVsZW1lbnQsIG9wdGlvbnMpIHtcbiAgICBcbiAgZnVuY3Rpb24gc2V0KG5hbWUsIHZhbHVlKSB7XG4gICAgdmFyIG9wdHM7XG4gICAgaWYgKHR5cGVvZiBuYW1lID09PSAnb2JqZWN0Jykge1xuICAgICAgb3B0cyA9IG5hbWU7XG4gICAgfSBlbHNlIHtcbiAgICAgIG9wdHMgPSB7fTtcbiAgICAgIG9wdHNbbmFtZV0gPSB2YWx1ZTtcbiAgICB9XG4gICAgZm9yIChuYW1lIGluIG9wdHMpIHtcbiAgICAgIHZhbHVlID0gb3B0c1tuYW1lXTtcbiAgICAgIHN3aXRjaCAobmFtZSkge1xuICAgICAgICBjYXNlICdlbGVtZW50JzpcbiAgICAgICAgY2FzZSAnc3ltYm9sJzpcbiAgICAgICAgICBpZiAoaXNIVE1MKHZhbHVlKSkge1xuICAgICAgICAgICAgdmFsdWUgPSBjcmVhdGVFbGVtZW50KHZhbHVlKTtcbiAgICAgICAgICB9XG4gICAgICAgICAgYnJlYWs7XG4gICAgICB9XG4gICAgICBvcHRzW25hbWVdID0gdmFsdWU7XG4gICAgfVxuICAgIG9wdGlvbnMgPSBtZXJnZShvcHRpb25zLCBvcHRzKTtcbiAgfTtcbiAgXG4gIHRoaXMuc2V0ID0gZnVuY3Rpb24oKSB7XG4gICAgc2V0LmNhbGwodGhpcywgYXJndW1lbnRzKTtcbiAgICBjdXJzb3JNYW5hZ2VyLnVwZGF0ZSgpO1xuICB9O1xuICBcbiAgdGhpcy5nZXQgPSBmdW5jdGlvbihuYW1lKSB7XG4gICAgdmFyIHZhbHVlO1xuICAgIGlmICghbmFtZSkge1xuICAgICAgdmFsdWUgPSB7fTtcbiAgICAgIGZvciAodmFyIHggaW4gb3B0aW9ucykge1xuICAgICAgICB2YWx1ZVt4XSA9IHRoaXMuZ2V0KHgpO1xuICAgICAgfVxuICAgIH0gZWxzZSB7XG4gICAgICB2YWx1ZSA9IG9wdGlvbnNbbmFtZV07XG4gICAgICBzd2l0Y2ggKG5hbWUpIHtcbiAgICAgICAgY2FzZSAnZWxlbWVudCc6XG4gICAgICAgIGNhc2UgJ3N5bWJvbCc6XG4gICAgICAgIGNhc2UgJ2JvdW5kcyc6XG4gICAgICAgIGNhc2UgJ3RhcmdldCc6XG4gICAgICAgICAgdmFsdWUgPSB2YWx1ZSAmJiB2YWx1ZS50b0FycmF5ID8gdmFsdWUudG9BcnJheSgpWzBdIDogdmFsdWUgaW5zdGFuY2VvZiBBcnJheSA/IHZhbHVlWzBdIDogdmFsdWU7XG4gICAgICAgICAgdmFsdWUgPSB0eXBlb2YgdmFsdWUgPT09ICdzdHJpbmcnID8gKGVsZW1lbnQgfHwgZG9jdW1lbnQpLnF1ZXJ5U2VsZWN0b3IodmFsdWUpIDogdmFsdWU7XG4gICAgICAgICAgYnJlYWs7XG4gICAgICB9XG4gICAgICBzd2l0Y2ggKG5hbWUpIHtcbiAgICAgICAgY2FzZSAnc3ltYm9sJzpcbiAgICAgICAgICB2YWx1ZSA9IHZhbHVlIHx8IHRoaXMuZ2V0KCdlbGVtZW50Jyk7XG4gICAgICAgICAgYnJlYWs7XG4gICAgICAgIGNhc2UgJ2JvdW5kcyc6XG4gICAgICAgICAgdmFsdWUgPSB2YWx1ZSA/IHZhbHVlIDogb3B0aW9uc1snc3ltYm9sJ10gPyB0aGlzLmdldCgnZWxlbWVudCcpIDogdGhpcy5nZXQoJ2VsZW1lbnQnKS5vZmZzZXRQYXJlbnQ7XG4gICAgICAgICAgYnJlYWs7XG4gICAgICB9XG4gICAgfVxuICAgIHJldHVybiB2YWx1ZTtcbiAgfTtcbiAgXG4gIHNldChtZXJnZSh7XG4gICAgZWxlbWVudDogbnVsbCxcbiAgICBvZmZzZXQ6IHtsZWZ0OiA4LCB0b3A6IDZ9LFxuICAgIHN0eWxlOiAndHJhbnNmb3JtJyxcbiAgICBzY2FsZTogMSxcbiAgICBib3VuZHM6IG51bGwsXG4gICAgc3ltYm9sOiBudWxsLFxuICAgIHRhcmdldDogbnVsbCxcbiAgICBoaWRlT25Gb2N1czogZmFsc2VcbiAgfSwgb3B0aW9ucywge1xuICAgIGVsZW1lbnQ6IGVsZW1lbnRcbiAgfSkpO1xuICBcbn07IiwidmFyXG4gIFxuICBtZXJnZSA9IHJlcXVpcmUoJy4vbWVyZ2UnKSxcbiAgdG9wbW9zdCA9IHJlcXVpcmUoJy4vdG9wbW9zdCcpLFxuICBcbiAgLyoqXG4gICAqIEh5cGhlbmF0ZSBhIHN0cmluZ1xuICAgKiBAcGFyYW0ge1N0cmluZ30gc3RyaW5nXG4gICAqL1xuICBoeXBoZW5hdGUgPSAoZnVuY3Rpb24oKSB7XG4gICAgdmFyIGNhY2hlID0ge307XG4gICAgcmV0dXJuIGZ1bmN0aW9uKHN0cmluZykge1xuICAgICAgcmV0dXJuIGNhY2hlW3N0cmluZ10gPSBjYWNoZVtzdHJpbmddIHx8IChmdW5jdGlvbigpIHtcbiAgICAgICAgcmV0dXJuIHN0cmluZy5yZXBsYWNlKC8oW0EtWl0pL2csIGZ1bmN0aW9uKCQxKXtyZXR1cm4gXCItXCIrJDEudG9Mb3dlckNhc2UoKTt9KTtcbiAgICAgIH0pKCk7XG4gICAgfTtcbiAgfSkoKSxcbiAgXG4gIGdldFN0eWxlID0gZnVuY3Rpb24oZWwsIGNzc3Byb3Ape1xuICAgaWYgKGVsLmN1cnJlbnRTdHlsZSkgLy9JRVxuICAgIHJldHVybiBlbC5jdXJyZW50U3R5bGVbY3NzcHJvcF07XG4gICBlbHNlIGlmIChkb2N1bWVudC5kZWZhdWx0VmlldyAmJiBkb2N1bWVudC5kZWZhdWx0Vmlldy5nZXRDb21wdXRlZFN0eWxlKSAvL0ZpcmVmb3hcbiAgICByZXR1cm4gZG9jdW1lbnQuZGVmYXVsdFZpZXcuZ2V0Q29tcHV0ZWRTdHlsZShlbCwgXCJcIilbY3NzcHJvcF07XG4gICBlbHNlIC8vdHJ5IGFuZCBnZXQgaW5saW5lIHN0eWxlXG4gICAgcmV0dXJuIGVsLnN0eWxlW2Nzc3Byb3BdO1xuICB9LFxuICBcbiAgdHJhbnNmb3JtU3R5bGUgPSAoZnVuY3Rpb24ocHJvcCwgcHJlZml4ZXMpIHtcbiAgICB2YXIgaSxcbiAgICAgIGVsZW0gPSBkb2N1bWVudC5jcmVhdGVFbGVtZW50KCdkaXYnKSxcbiAgICAgIGNhcGl0YWxpemVkID0gcHJvcC5jaGFyQXQoMCkudG9VcHBlckNhc2UoKSArIHByb3Auc2xpY2UoMSk7XG4gICAgZm9yIChpID0gMDsgaSA8IHByZWZpeGVzLmxlbmd0aDsgaSsrKSB7XG4gICAgICBpZiAodHlwZW9mIGVsZW0uc3R5bGVbcHJlZml4ZXNbaV0gKyBjYXBpdGFsaXplZF0gIT09IFwidW5kZWZpbmVkXCIpIHtcbiAgICAgICAgcmV0dXJuIHByZWZpeGVzW2ldICsgY2FwaXRhbGl6ZWQ7XG4gICAgICB9XG4gICAgfVxuICAgIHJldHVybiBudWxsO1xuICB9KSgndHJhbnNmb3JtJywgWycnLCAnTW96JywgJ1dlYmtpdCcsICdPJywgJ01zJ10pLFxuICBcbiAgaXNDaGlsZE9mID0gZnVuY3Rpb24ocGFyZW50LCBjaGlsZCkge1xuICAgaWYgKCFjaGlsZCB8fCAhcGFyZW50KSB7XG4gICAgIHJldHVybiBmYWxzZTtcbiAgIH1cbiAgIHZhciBub2RlID0gY2hpbGQucGFyZW50Tm9kZTtcbiAgIHdoaWxlIChub2RlICE9IG51bGwpIHtcbiAgICAgaWYgKG5vZGUgPT0gcGFyZW50KSB7XG4gICAgICAgICByZXR1cm4gdHJ1ZTtcbiAgICAgfVxuICAgICBub2RlID0gbm9kZS5wYXJlbnROb2RlO1xuICAgfVxuICAgcmV0dXJuIGZhbHNlO1xuICB9LFxuICBcbiAgY3NzID0gZnVuY3Rpb24oZWxlbSwgbmFtZSwgdmFsdWUpIHtcbiAgICB2YXIgbWFwID0ge30sIGNzc1RleHQgPSBudWxsO1xuICAgIGlmICh0eXBlb2YgbmFtZSA9PT0gJ29iamVjdCcpIHtcbiAgICAgIG1hcCA9IG5hbWU7XG4gICAgfSBlbHNlIGlmICh0eXBlb2YgdmFsdWUgIT09IFwidW5kZWZpbmVkXCIpIHtcbiAgICAgIG1hcFtuYW1lXSA9IHZhbHVlO1xuICAgIH1cbiAgICB2YXIga2V5cyA9IE9iamVjdC5rZXlzKG1hcCk7XG4gICAga2V5cyA9IGtleXMuZmlsdGVyKGZ1bmN0aW9uKGtleSwgaW5kZXgpIHtcbiAgICAgIGlmIChtYXBba2V5XSA9PT0gJycpIHtcbiAgICAgICAgZWxlbS5zdHlsZVtrZXldID0gbWFwW2tleV07XG4gICAgICAgIHJldHVybiBmYWxzZTtcbiAgICAgIH1cbiAgICAgIHJldHVybiB0cnVlO1xuICAgIH0pO1xuICAgIGNzc1RleHQgPSBrZXlzLm1hcChmdW5jdGlvbihuYW1lKSB7XG4gICAgICByZXR1cm4gaHlwaGVuYXRlKG5hbWUpICsgXCI6IFwiICsgbWFwW25hbWVdO1xuICAgIH0pLmpvaW4oXCI7IFwiKTtcbiAgICBpZiAoY3NzVGV4dCAmJiBjc3NUZXh0Lmxlbmd0aCkge1xuICAgICAgZWxlbS5zdHlsZS5jc3NUZXh0ID0gZWxlbS5zdHlsZS5jc3NUZXh0ICsgY3NzVGV4dDtcbiAgICAgIHJldHVybiBudWxsO1xuICAgIH1cbiAgICByZXR1cm4gZWxlbS5zdHlsZVtuYW1lXSB8fCB3aW5kb3cuZ2V0Q29tcHV0ZWRTdHlsZShlbGVtLCBudWxsKS5nZXRQcm9wZXJ0eVZhbHVlKG5hbWUpO1xuICB9LFxuICBcbiAgZ2V0T2Zmc2V0ID0gZnVuY3Rpb24oZWxlbWVudCkge1xuICAgIHZhclxuICAgICAgc2Nyb2xsT2Zmc2V0ID0gZ2V0U2Nyb2xsT2Zmc2V0KCksXG4gICAgICByZWN0ID0gZWxlbWVudC5nZXRCb3VuZGluZ0NsaWVudFJlY3QoKTtcbiAgICByZXR1cm4ge1xuICAgICAgdG9wOiByZWN0LnRvcCArIHNjcm9sbE9mZnNldC50b3AsXG4gICAgICBsZWZ0OiByZWN0LmxlZnQgKyBzY3JvbGxPZmZzZXQubGVmdFxuICAgIH07XG4gIH0sXG4gIFxuICBnZXRTY3JvbGxPZmZzZXQgPSBmdW5jdGlvbigpIHtcbiAgICByZXR1cm4ge1xuICAgICAgbGVmdDogZG9jdW1lbnQuYm9keSAmJiBkb2N1bWVudC5ib2R5LnNjcm9sbExlZnQgKyBkb2N1bWVudC5kb2N1bWVudEVsZW1lbnQuc2Nyb2xsTGVmdCxcbiAgICAgIHRvcDogZG9jdW1lbnQuYm9keSAmJiBkb2N1bWVudC5ib2R5LnNjcm9sbFRvcCArIGRvY3VtZW50LmRvY3VtZW50RWxlbWVudC5zY3JvbGxUb3BcbiAgICB9O1xuICB9LFxuICBcbiAgZ2V0Qm91bmRpbmdSZWN0ID0gZnVuY3Rpb24oZWxlbWVudCkge1xuICAgIGlmICghZWxlbWVudCkge1xuICAgICAgcmV0dXJuIHtcbiAgICAgICAgeDogLUluZmluaXR5LFxuICAgICAgICB5OiAtSW5maW5pdHksXG4gICAgICAgIHdpZHRoOiBJbmZpbml0eSxcbiAgICAgICAgaGVpZ2h0OiBJbmZpbml0eVxuICAgICAgfTtcbiAgICB9XG4gICAgdmFyIHNjcm9sbE9mZnNldCA9IGdldFNjcm9sbE9mZnNldCgpO1xuICAgIHZhciByZWN0ID0gZWxlbWVudC5nZXRCb3VuZGluZ0NsaWVudFJlY3QoKTtcbiAgICByZXR1cm4ge1xuICAgICAgeDogcmVjdC5sZWZ0ICsgc2Nyb2xsT2Zmc2V0LmxlZnQsXG4gICAgICB5OiByZWN0LnRvcCArIHNjcm9sbE9mZnNldC50b3AsXG4gICAgICB3aWR0aDogcmVjdC53aWR0aCxcbiAgICAgIGhlaWdodDogcmVjdC5oZWlnaHRcbiAgICB9O1xuICB9LFxuICBcbiAgLy8gRGVjbGFyZSBzaW5nbGV0b24gaW5zdGFuY2VcbiAgaW5zdGFuY2UgPSBudWxsO1xuXG4vKipcbiAqIEN1cnNvck1hbmFnZXJcbiAqIFRoaXMgc2luZ2xldG9uIGNsYXNzIGhhbmRsZXMgYWxsIGN1cnNvciBvYmplY3RzIFxuICogQHBhcmFtIHtPYmplY3R9IG9wdGlvbnNcbiAqL1xuZnVuY3Rpb24gQ3Vyc29yTWFuYWdlcihvcHRpb25zKSB7XG4gIC8vIFNpbmdsZXRvbiBwYXR0ZXJuXG4gIGlmIChpbnN0YW5jZSkge1xuICAgIGluc3RhbmNlLnNldChvcHRpb25zKTtcbiAgICByZXR1cm4gaW5zdGFuY2U7XG4gIH1cbiAgaW5zdGFuY2UgPSB0aGlzO1xuICAvLyBJbXBsZW1lbnRhdGlvblxuICBcbiAgdmFyIGN1cnNvcnMgPSBbXTtcbiAgdmFyIGNsaWVudCA9IHt4OiAwLCB5OiAwfTtcbiAgdmFyIG1vdXNlID0ge3g6IC1JbmZpbml0eSwgeTogLUluZmluaXR5LCBlbGVtZW50OiBudWxsfTtcbiAgdmFyIGV2ZW50cyA9IFsnbW91c2Vkb3duJywgJ2NsaWNrJywgJ3Njcm9sbCcsICdyZXNpemUnLCAnbW91c2Vtb3ZlJywgJ21vdXNlb3V0J107XG4gIHZhciBjdXJzb3JJdGVtcyA9IFtdO1xuICB2YXIgY3Vyc29ySXRlbSA9IG51bGw7XG4gIHZhciBjbGlja2luZyA9IGZhbHNlO1xuICB2YXIgY2xpY2thYmxlID0gdHJ1ZTtcbiAgXG4gIGZ1bmN0aW9uIGluaXQoKSB7XG4gICAgaWYgKCEoJ29udG91Y2gnIGluIHdpbmRvdykpIHtcbiAgICAgIGFkZE1vdXNlTGlzdGVuZXJzKHdpbmRvdyk7XG4gICAgfVxuICB9XG4gIFxuICBmdW5jdGlvbiBoYW5kbGVFdmVudChlKSB7XG4gICAgXG4gICAgLy8gQ2hlY2sgZm9yIGFjY2VzcyB0byBldmVudCdzIHR5cGUgcHJvcGVydHlcbiAgICB0cnkge1xuICAgICAgZS50eXBlO1xuICAgIH0gY2F0Y2ggKGUpIHtcbiAgICAgIGNvbnNvbGUud2FybihlKTtcbiAgICAgIHJldHVybjtcbiAgICB9XG4gICAgLy8gVXBkYXRlIE1vdXNlIFBvc2l0aW9uXG4gICAgc3dpdGNoIChlLnR5cGUpIHtcbiAgICAgIGNhc2UgJ21vdXNlZG93bic6XG4gICAgICAgIGNsaWNraW5nID0gZmFsc2U7XG4gICAgICAgIGJyZWFrO1xuICAgICAgY2FzZSAnbW91c2VvdXQnOlxuICAgICAgICB2YXIgcmVsYXRlZFRhcmdldCA9IHR5cGVvZiBlLnRvRWxlbWVudCAhPSAndW5kZWZpbmVkJyA/IGUudG9FbGVtZW50IDogZS5yZWxhdGVkVGFyZ2V0O1xuICAgICAgICBpZiAocmVsYXRlZFRhcmdldCA9PT0gbnVsbCkge1xuICAgICAgICAgIG1vdXNlLnggPSAtSW5maW5pdHk7XG4gICAgICAgICAgbW91c2UueSA9IC1JbmZpbml0eTtcbiAgICAgICAgICBtb3VzZS5lbGVtZW50ID0gbnVsbDtcbiAgICAgICAgfVxuICAgICAgICBicmVhaztcbiAgICAgIGNhc2UgJ21vdXNlbW92ZSc6XG4gICAgICAgIC8vIEdldCBtb3VzZSBjb29yZGluYXRlc1xuICAgICAgICAvLyBVcGRhdGUgbW91c2UgY29vcmRpbmF0ZXNcbiAgICAgICAgY2xpZW50LnggPSBlLmNsaWVudFg7XG4gICAgICAgIGNsaWVudC55ID0gZS5jbGllbnRZO1xuICAgICAgZGVmYXVsdDpcbiAgICAgIHZhciBzY3JvbGxPZmZzZXQgPSBnZXRTY3JvbGxPZmZzZXQoKTtcbiAgICAgIG1vdXNlLnggPSBjbGllbnQueCArIHNjcm9sbE9mZnNldC5sZWZ0O1xuICAgICAgbW91c2UueSA9IGNsaWVudC55ICsgc2Nyb2xsT2Zmc2V0LnRvcDtcbiAgICAgIG1vdXNlLmVsZW1lbnQgPSBlLnRhcmdldDtcbiAgICAgIFxuICAgICAgXG4gICAgfVxuICAgIFxuICAgIC8vIEdldCBDdXJzb3IgUHJvcHNcbiAgICBpbnZhbGlkYXRlLmNhbGwodGhpcyk7XG4gICAgXG4gICAgLy8gUHJvY2VzcyBDbGlja1xuICAgIHN3aXRjaCAoZS50eXBlKSB7XG4gICAgICBjYXNlICdjbGljayc6XG4gICAgICAgIGlmICghY2xpY2tpbmcgJiYgY3Vyc29ySXRlbSkge1xuICAgICAgICAgIGNsaWNraW5nID0gdHJ1ZTtcbiAgICAgICAgICBpZiAobW91c2UuZWxlbWVudCAmJiBjdXJzb3JJdGVtICYmIGN1cnNvckl0ZW0udGFyZ2V0ICYmIGN1cnNvckl0ZW0uc3ltYm9sICE9PSBtb3VzZS5lbGVtZW50ICYmIGlzQ2hpbGRPZihjdXJzb3JJdGVtLmNvbnRhaW5lciwgbW91c2UuZWxlbWVudCkpIHtcbiAgICAgICAgICAgIC8vZS5zdG9wSW1tZWRpYXRlUHJvcGFnYXRpb24oKTtcbiAgICAgICAgICAgIC8vZS5wcmV2ZW50RGVmYXVsdCgpO1xuICAgICAgICAgICAgY3Vyc29ySXRlbS50YXJnZXQuY2xpY2soKTtcbiAgICAgICAgICB9XG4gICAgICAgICAgdmFyIGNsaWNrID0gY3Vyc29ySXRlbSAmJiBjdXJzb3JJdGVtLmNsaWNrO1xuICAgICAgICAgIGlmICh0eXBlb2YgY2xpY2sgPT09ICdmdW5jdGlvbicpIHtcbiAgICAgICAgICAgIGNsaWNrLmNhbGwoY3Vyc29ySXRlbS5lbGVtZW50LCBlKTtcbiAgICAgICAgICB9XG4gICAgICAgIH1cbiAgICAgICAgLy9lLnN0b3BQcm9wYWdhdGlvbigpO1xuICAgICAgICBicmVhaztcbiAgICB9XG4gICAgLy8gVXBkYXRlIGN1cnNvcnNcbiAgICByZW5kZXIuY2FsbChpbnN0YW5jZSk7XG4gIH1cbiAgXG4gIGZ1bmN0aW9uIGludmFsaWRhdGUoKSB7XG4gICAgXG4gICAgY3Vyc29ySXRlbXMgPSBjdXJzb3JzLm1hcChmdW5jdGlvbihjdXJzb3IsIGluZGV4KSB7XG4gICAgICByZXR1cm4gZ2V0Q3Vyc29ySXRlbShjdXJzb3IsIGN1cnNvckl0ZW1zW2luZGV4XSk7XG4gICAgfSk7XG4gICAgXG4gICAgY3Vyc29ySXRlbSA9IGN1cnNvckl0ZW1zLmZpbHRlcihmdW5jdGlvbihjdXJzb3JJdGVtLCBpbmRleCkge1xuICAgICAgdmFyIG1vdXNlRWxlbWVudCA9IG1vdXNlLmVsZW1lbnQsIHN5bWJvbCA9IGN1cnNvckl0ZW0uc3ltYm9sLCBib3VuZHMgPSBjdXJzb3JJdGVtLmJvdW5kcywgY29udGFpbmVyID0gY3Vyc29ySXRlbS5jb250YWluZXIsIHJlc3VsdCA9IGZhbHNlO1xuICAgICAgLy8gRGV0ZWN0IGlmIGEgbW91c2UgZWxlbWVudCBleGlzdHMgYW5kIHRoYXQgaXQncyBub3QgdGhlIHN5bWJvbCBpdHNlbGZcbiAgICAgIGlmIChtb3VzZUVsZW1lbnQpIHtcbiAgICAgICAgLy8gRGV0ZWN0IGlmIHN5bWJvbCBpcyB0b3Btb3N0IGVsZW1lbnRcbiAgICAgICAgaWYgKHRvcG1vc3QobW91c2VFbGVtZW50LCBzeW1ib2wpID09PSBzeW1ib2wpIHtcbiAgICAgICAgICAvLyBEZXRlY3QgaWYgbW91c2UgZWxlbWVudCBpcyBjb250YWluZWRcbiAgICAgICAgICBpZiAoY29udGFpbmVyID09PSBtb3VzZUVsZW1lbnQgfHwgaXNDaGlsZE9mKGNvbnRhaW5lciwgbW91c2VFbGVtZW50KSkge1xuICAgICAgICAgICAgLy8gTWF0Y2ggYm91bmRzXG4gICAgICAgICAgICByZXN1bHQgPSAobW91c2UueCA+PSBib3VuZHMueCAmJiBtb3VzZS54IDw9IGJvdW5kcy54ICsgYm91bmRzLndpZHRoICYmIG1vdXNlLnkgPj0gYm91bmRzLnkgJiYgbW91c2UueSA8PSBib3VuZHMueSArIGJvdW5kcy5oZWlnaHQpO1xuICAgICAgICAgIH1cbiAgICAgICAgfVxuICAgICAgfVxuICAgICAgcmV0dXJuIHJlc3VsdDtcbiAgICB9KS5zb3J0KGZ1bmN0aW9uKGEsIGIpIHtcbiAgICAgIHZhciB6RWxlbWVudCA9IHRvcG1vc3QoYS5zeW1ib2wsIGIuc3ltYm9sKTtcbiAgICAgIGlmICh6RWxlbWVudCA9PT0gYS5zeW1ib2wpIHtcbiAgICAgICAgcmV0dXJuIGE7XG4gICAgICB9IGVsc2UgaWYgKHpFbGVtZW50ID09PSBiLnN5bWJvbCkge1xuICAgICAgICByZXR1cm4gYjtcbiAgICAgIH1cbiAgICAgIHZhciBwMSA9IHt4OiBhLnggKyBhLndpZHRoIC8gMiwgeTogYS55ICsgYS5oZWlnaHQgLyAyfTtcbiAgICAgIHZhciBwMiA9IHt4OiBiLnggKyBiLndpZHRoIC8gMiwgeTogYi55ICsgYi5oZWlnaHQgLyAyfTtcbiAgICAgIHZhciBkMSA9IE1hdGguc3FydCggTWF0aC5wb3coKHAxLnggLSBtb3VzZS54KSwgMikgKyBNYXRoLnBvdygocDEueSAtIG1vdXNlLnkpLCAyKSApO1xuICAgICAgdmFyIGQyID0gTWF0aC5zcXJ0KCBNYXRoLnBvdygocDIueCAtIG1vdXNlLngpLCAyKSArIE1hdGgucG93KChwMi55IC0gbW91c2UueSksIDIpICk7XG4gICAgICByZXR1cm4gZDEgPCBkMiA/IGQxIDogZDEgPiBkMiA/IGQyIDogMDtcbiAgICB9KS5yZXZlcnNlKClbMF07XG4gICAgXG4gICAgXG4gICAgLy8gU2V0IE1vdXNlUHJvdmlkZXJzXG4gICAgc2V0TW91c2VQcm92aWRlcnMoW3dpbmRvd10uY29uY2F0KGN1cnNvckl0ZW1zLm1hcChmdW5jdGlvbihpdGVtKSB7XG4gICAgICByZXR1cm4gaXRlbS5jb250YWluZXI7XG4gICAgfSkpKTtcbiAgICAvL3NldE1vdXNlUHJvdmlkZXJzKFt3aW5kb3ddKTtcbiAgfVxuICBcbiAgZnVuY3Rpb24gcmVuZGVyKCkge1xuXG4gICAgY3Vyc29ySXRlbXMuZm9yRWFjaChmdW5jdGlvbihpdGVtKSB7XG4gICAgICBcbiAgICAgIHZhclxuICAgICAgICBzeW1ib2wgPSBpdGVtLnN5bWJvbCxcbiAgICAgICAgc3R5bGUgPSB7XG4gICAgICAgICAgdmlzaWJpbGl0eTogaXRlbSA9PT0gY3Vyc29ySXRlbSA/ICcnIDogJ2hpZGRlbicsXG4gICAgICAgICAgcG9zaXRpb246ICdhYnNvbHV0ZScsXG4gICAgICAgICAgY3Vyc29yOiAnaW5oZXJpdCdcbiAgICAgICAgfTtcbiAgICAgICAgXG4gICAgICBpZiAoaXRlbS5zdHlsZSA9PT0gJ3RyYW5zZm9ybScgJiYgdHJhbnNmb3JtU3R5bGUpIHtcbiAgICAgICAgc3R5bGVbdHJhbnNmb3JtU3R5bGUgKyBcIk9yaWdpblwiXSA9ICcnO1xuICAgICAgICBzdHlsZVt0cmFuc2Zvcm1TdHlsZV0gPSBcIlwiO1xuICAgICAgfSBlbHNlIHtcbiAgICAgICAgc3R5bGUubGVmdCA9IFwiXCI7XG4gICAgICAgIHN0eWxlLnRvcCA9IFwiXCI7XG4gICAgICB9XG4gICAgICBcbiAgICAgIHN5bWJvbC5jbGFzc0xpc3QgJiYgIXN5bWJvbC5jbGFzc0xpc3QuY29udGFpbnMoXCJjdXJzb3JcIikgJiYgc3ltYm9sLmNsYXNzTGlzdC5hZGQoXCJjdXJzb3JcIik7XG4gICAgICBjc3Moc3ltYm9sLCBzdHlsZSk7XG4gICAgICBcbiAgICAgIGlmIChjdXJzb3JJdGVtID09PSBpdGVtKSB7XG4gICAgICAgIFxuICAgICAgICB2YXIgcG9zID0gZ2V0T2Zmc2V0KHN5bWJvbCk7XG4gICAgICAgIFxuICAgICAgICB2YXIgcHggPSBwb3MubGVmdDtcbiAgICAgICAgdmFyIHB5ID0gcG9zLnRvcDtcbiAgICAgICAgXG4gICAgICAgIHZhciBvZmYgPSBpdGVtLm9mZnNldDtcbiAgICAgICAgdmFyIHggPSBNYXRoLnJvdW5kKChtb3VzZS54IC0gcHgpICsgb2ZmLmxlZnQpO1xuICAgICAgICB2YXIgeSA9IE1hdGgucm91bmQoKG1vdXNlLnkgLSBweSkgKyBvZmYudG9wKTtcbiAgICAgICAgXG4gICAgICAgIHN0eWxlID0ge1xuICAgICAgICB9O1xuICAgICAgICBcbiAgICAgICAgaWYgKGl0ZW0uc3R5bGUgPT09ICd0cmFuc2Zvcm0nICYmIHRyYW5zZm9ybVN0eWxlKSB7XG4gICAgICAgICAgc3R5bGVbdHJhbnNmb3JtU3R5bGUgKyBcIk9yaWdpblwiXSA9ICcwIDAnO1xuICAgICAgICAgIHN0eWxlW3RyYW5zZm9ybVN0eWxlXSA9IFwidHJhbnNsYXRlM2QoXCIgKyB4ICsgXCJweCxcIiArIHkgKyBcInB4LCAwKSBzY2FsZShcIiArIGl0ZW0uc2NhbGUgKyBcIixcIiArIGl0ZW0uc2NhbGUgKyBcIilcIjtcbiAgICAgICAgfSBlbHNlIHtcbiAgICAgICAgICBzdHlsZS5sZWZ0ID0gKHggKyBwb3MubGVmdCkgKyBcInB4XCI7XG4gICAgICAgICAgc3R5bGUudG9wID0gKHkgKyBwb3MudG9wKSArIFwicHhcIjtcbiAgICAgICAgfVxuICAgICAgICBcbiAgICAgICAgY3NzKHN5bWJvbCwgc3R5bGUpO1xuICAgICAgfVxuICAgICAgXG4gICAgICBcbiAgICAgIGlmIChpdGVtID09PSBjdXJzb3JJdGVtKSB7XG4gICAgICAgIHN5bWJvbC5jbGFzc0xpc3QgJiYgIXN5bWJvbC5jbGFzc0xpc3QuY29udGFpbnMoXCJjdXJzb3ItYWN0aXZlXCIpICYmIHN5bWJvbC5jbGFzc0xpc3QuYWRkKFwiY3Vyc29yLWFjdGl2ZVwiKTtcbiAgICAgICAgc3ltYm9sLmNsYXNzTGlzdCAmJiBzeW1ib2wuY2xhc3NMaXN0LmNvbnRhaW5zKFwiY3Vyc29yLWhpZGRlblwiKSAmJiBzeW1ib2wuY2xhc3NMaXN0LnJlbW92ZShcImN1cnNvci1oaWRkZW5cIik7XG4gICAgICB9IGVsc2Uge1xuICAgICAgICBzeW1ib2wuY2xhc3NMaXN0ICYmIHN5bWJvbC5jbGFzc0xpc3QuY29udGFpbnMoXCJjdXJzb3ItYWN0aXZlXCIpICYmIHN5bWJvbC5jbGFzc0xpc3QucmVtb3ZlKFwiY3Vyc29yLWFjdGl2ZVwiKTtcbiAgICAgICAgc3ltYm9sLmNsYXNzTGlzdCAmJiAhc3ltYm9sLmNsYXNzTGlzdC5jb250YWlucyhcImN1cnNvci1oaWRkZW5cIikgJiYgc3ltYm9sLmNsYXNzTGlzdC5hZGQoXCJjdXJzb3ItaGlkZGVuXCIpO1xuICAgICAgfVxuICAgICAgXG4gICAgfSk7XG4gIH07XG4gIFxuICB0aGlzLnVwZGF0ZSA9IGZ1bmN0aW9uKCkge1xuICAgIGludmFsaWRhdGUuY2FsbCh0aGlzKTtcbiAgICByZW5kZXIuY2FsbCh0aGlzKTtcbiAgfTtcbiAgXG4gIHRoaXMuYWRkID0gZnVuY3Rpb24oY3Vyc29yKSB7XG4gICAgaWYgKGN1cnNvcnMuaW5kZXhPZihjdXJzb3IpID09PSAtMSkge1xuICAgICAgY3Vyc29ycy5wdXNoKGN1cnNvcik7XG4gICAgICB0aGlzLnVwZGF0ZSgpO1xuICAgIH1cbiAgfTtcbiAgXG4gIHRoaXMucmVtb3ZlID0gZnVuY3Rpb24oY3Vyc29yKSB7XG4gICAgY3Vyc29ycy5zcGxpY2UoY3Vyc29ycy5pbmRleE9mKGN1cnNvciksIDEpO1xuICAgIHRoaXMudXBkYXRlKCk7XG4gIH07XG4gIFxuICB2YXIgbW91c2VQcm92aWRlcnMgPSBbXTtcbiAgZnVuY3Rpb24gc2V0TW91c2VQcm92aWRlcnMoZWxlbWVudHMpIHtcbiAgICBlbGVtZW50cyA9IGVsZW1lbnRzLmZpbHRlcihmdW5jdGlvbihuKSB7IHJldHVybiAobik7IH0pO1xuICAgIG1vdXNlUHJvdmlkZXJzLmZvckVhY2goZnVuY3Rpb24oZWxlbWVudCkge1xuICAgICAgaWYgKGVsZW1lbnRzLmluZGV4T2YoZWxlbWVudCkgPT09IC0xKSB7XG4gICAgICAgIHJlbW92ZU1vdXNlTGlzdGVuZXJzKGVsZW1lbnQpO1xuICAgICAgfVxuICAgIH0pO1xuICAgIGVsZW1lbnRzLmZvckVhY2goZnVuY3Rpb24oZWxlbWVudCkge1xuICAgICAgaWYgKG1vdXNlUHJvdmlkZXJzLmluZGV4T2YoZWxlbWVudCkgPT09IC0xKSB7XG4gICAgICAgIGFkZE1vdXNlTGlzdGVuZXJzKGVsZW1lbnQpO1xuICAgICAgfVxuICAgIH0pO1xuICAgIG1vdXNlUHJvdmlkZXJzID0gZWxlbWVudHM7XG4gIH1cbiAgXG4gIGZ1bmN0aW9uIGFkZE1vdXNlTGlzdGVuZXJzKGVsZW1lbnQpIHtcbiAgICBmb3IgKHZhciBpID0gMCwgZXZlbnQ7IGV2ZW50ID0gZXZlbnRzW2ldOyBpKyspIHtcbiAgICAgIGVsZW1lbnQuYWRkRXZlbnRMaXN0ZW5lcihldmVudCwgaGFuZGxlRXZlbnQpO1xuICAgIH1cbiAgfVxuICBcbiAgZnVuY3Rpb24gcmVtb3ZlTW91c2VMaXN0ZW5lcnMoZWxlbWVudCkge1xuICAgIGZvciAodmFyIGkgPSAwLCBldmVudDsgZXZlbnQgPSBldmVudHNbaV07IGkrKykge1xuICAgICAgZWxlbWVudC5yZW1vdmVFdmVudExpc3RlbmVyKGV2ZW50LCBoYW5kbGVFdmVudCk7XG4gICAgfVxuICB9XG4gIFxuICBpbml0LmNhbGwodGhpcyk7XG4gIFxufVxuXG5cblxuZnVuY3Rpb24gZ2V0Q3Vyc29ySXRlbShjdXJzb3IpIHtcbiAgXG4gIHZhclxuICAgIGVsZW1lbnQgPSBjdXJzb3IuZ2V0KCdlbGVtZW50JyksXG4gICAgcHJvcHMsIHN5bWJvbCwgYm91bmRzLCBjb250YWluZXIsIG9mZnNldCwgc3R5bGUsIHNjYWxlO1xuICAgIFxuICBjc3MoZWxlbWVudCwge1xuICAgIGRpc3BsYXk6ICcnXG4gIH0pO1xuICBcbiAgcHJvcHMgPSBjdXJzb3IuZ2V0KCk7XG4gIFxuICBzeW1ib2wgPSBwcm9wcy5zeW1ib2w7XG4gIGJvdW5kcyA9IHByb3BzLmJvdW5kcztcbiAgb2Zmc2V0ID0gcHJvcHMub2Zmc2V0O1xuICBzdHlsZSA9IHByb3BzLnN0eWxlO1xuICBzY2FsZSA9IHByb3BzLnNjYWxlO1xuICBcbiAgLy8gQWRkIGN1cnNvciBzeW1ib2wgdG8gZG9tXG4gIGlmICghc3ltYm9sLnBhcmVudE5vZGUpIHtcbiAgICBlbGVtZW50LmFwcGVuZENoaWxkKHN5bWJvbCk7XG4gIH1cbiAgXG4gIC8vIEdldCBib3VuZHNcbiAgdmFyIGNvbnRhaW5lcjtcbiAgaWYgKGJvdW5kcyAmJiBib3VuZHMuZ2V0Qm91bmRpbmdDbGllbnRSZWN0KSB7XG4gICAgLy8gRWxlbWVudCBib3VuZHNcbiAgICBjb250YWluZXIgPSBib3VuZHM7XG4gICAgYm91bmRzID0gZ2V0Qm91bmRpbmdSZWN0KGJvdW5kcyk7XG4gIH0gZWxzZSB7XG4gICAgLy8gT2JqZWN0IGJvdW5kc1xuICAgIGNvbnRhaW5lciA9IHN5bWJvbC5vZmZzZXRQYXJlbnQgfHwgZWxlbWVudDtcbiAgICB2YXIgcmVjdCA9IGdldEJvdW5kaW5nUmVjdChjb250YWluZXIpO1xuICAgIFxuICAgIHZhciBjb250YWluZXJQb3MgPSBnZXRPZmZzZXQoY29udGFpbmVyKSB8fCB7eDogMCwgeTogMH07XG4gICAgLy8gUHJvY2VzcyBmdW5jdGlvbiBcbiAgICBpZiAodHlwZW9mIGJvdW5kcyA9PT0gJ2Z1bmN0aW9uJykge1xuICAgICAgYm91bmRzID0gYm91bmRzKGNvbnRhaW5lcik7XG4gICAgfVxuICAgIC8vIEdldCBwZXJjZW50IHZhbHVlc1xuICAgIHZhciB4ID0gdHlwZW9mIGJvdW5kcy54ID09PSAnc3RyaW5nJyAmJiBib3VuZHMueC5pbmRleE9mKFwiJVwiKSA+PSAwID8gcGFyc2VGbG9hdChib3VuZHMueCkgKiByZWN0LndpZHRoIC8gMTAwIDogcGFyc2VGbG9hdChib3VuZHMueCk7XG4gICAgdmFyIHkgPSB0eXBlb2YgYm91bmRzLnkgPT09ICdzdHJpbmcnICYmIGJvdW5kcy55LmluZGV4T2YoXCIlXCIpID49IDAgPyBwYXJzZUZsb2F0KGJvdW5kcy55KSAqIHJlY3QuaGVpZ2h0IC8gMTAwIDogcGFyc2VGbG9hdChib3VuZHMueSk7XG4gICAgdmFyIHdpZHRoID0gdHlwZW9mIGJvdW5kcy53aWR0aCA9PT0gJ3N0cmluZycgJiYgYm91bmRzLndpZHRoLmluZGV4T2YoXCIlXCIpID49IDAgPyBwYXJzZUZsb2F0KGJvdW5kcy53aWR0aCkgKiByZWN0LndpZHRoIC8gMTAwIDogcGFyc2VGbG9hdChib3VuZHMud2lkdGgpO1xuICAgIHZhciBoZWlnaHQgPSB0eXBlb2YgYm91bmRzLmhlaWdodCA9PT0gJ3N0cmluZycgJiYgYm91bmRzLmhlaWdodC5pbmRleE9mKFwiJVwiKSA+PSAwID8gcGFyc2VGbG9hdChib3VuZHMuaGVpZ2h0KSAqIHJlY3QuaGVpZ2h0IC8gMTAwIDogcGFyc2VGbG9hdChib3VuZHMuaGVpZ2h0KTtcbiAgICBib3VuZHMgPSB7XG4gICAgICB4OiBjb250YWluZXJQb3MubGVmdCArIHgsXG4gICAgICB5OiBjb250YWluZXJQb3MudG9wICsgeSxcbiAgICAgIHdpZHRoOiB3aWR0aCxcbiAgICAgIGhlaWdodDogaGVpZ2h0XG4gICAgfTtcbiAgfVxuICBcbiAgdmFyIHRhcmdldCA9IHByb3BzLnRhcmdldCB8fCBzeW1ib2wubm9kZU5hbWUudG9Mb3dlckNhc2UoKSA9PT0gJ2EnID8gc3ltYm9sIDogZWxlbWVudDtcbiAgXG4gIHJldHVybiBtZXJnZShwcm9wcywge1xuICAgIGN1cnNvcjogY3Vyc29yLFxuICAgIHN5bWJvbDogc3ltYm9sLFxuICAgIGJvdW5kczogYm91bmRzLFxuICAgIGNvbnRhaW5lcjogY29udGFpbmVyLFxuICAgIHRhcmdldDogdGFyZ2V0LFxuICAgIG9mZnNldDogb2Zmc2V0LFxuICAgIHN0eWxlOiBzdHlsZSxcbiAgICBzY2FsZTogc2NhbGVcbiAgfSk7XG59XG5cbm1vZHVsZS5leHBvcnRzID0gQ3Vyc29yTWFuYWdlcjsiLCJtb2R1bGUuZXhwb3J0cyA9IGZ1bmN0aW9uKCkge1xuICB2YXIgb2JqID0ge30sXG4gICAgaSA9IDAsXG4gICAgaWwgPSBhcmd1bWVudHMubGVuZ3RoLFxuICAgIGtleTtcbiAgZm9yICg7IGkgPCBpbDsgaSsrKSB7XG4gICAgZm9yIChrZXkgaW4gYXJndW1lbnRzW2ldKSB7XG4gICAgICBpZiAoYXJndW1lbnRzW2ldLmhhc093blByb3BlcnR5KGtleSkpIHtcbiAgICAgICAgICBvYmpba2V5XSA9IGFyZ3VtZW50c1tpXVtrZXldO1xuICAgICAgfVxuICAgIH1cbiAgfVxuICByZXR1cm4gb2JqO1xufTsiLCJ2YXIgXG5cbiAgZ2V0U3R5bGUgPSBmdW5jdGlvbihlbCwgY3NzcHJvcCl7XG4gICAgaWYgKGVsLnN0eWxlKVxuICAgICAgaWYgKGVsLmN1cnJlbnRTdHlsZSkgLy9JRVxuICAgICAgICByZXR1cm4gZWwuY3VycmVudFN0eWxlW2Nzc3Byb3BdO1xuICAgICAgZWxzZSBpZiAoZG9jdW1lbnQuZGVmYXVsdFZpZXcgJiYgZG9jdW1lbnQuZGVmYXVsdFZpZXcuZ2V0Q29tcHV0ZWRTdHlsZSkgLy9GaXJlZm94XG4gICAgICAgIHJldHVybiBkb2N1bWVudC5kZWZhdWx0Vmlldy5nZXRDb21wdXRlZFN0eWxlKGVsLCBcIlwiKVtjc3Nwcm9wXTtcbiAgICAgIGVsc2UgLy90cnkgYW5kIGdldCBpbmxpbmUgc3R5bGVcbiAgICAgICAgcmV0dXJuIGVsLnN0eWxlW2Nzc3Byb3BdO1xuICB9LFxuICBcbiAgZ2V0WkluZGV4ID0gZnVuY3Rpb24oZWwpIHtcbiAgICB2YXIgekluZGV4ID0gcGFyc2VGbG9hdChnZXRTdHlsZShlbCwgJ3pJbmRleCcpKTtcbiAgICB6SW5kZXggPSAhaXNOYU4oekluZGV4KSA/IHpJbmRleCA6IDA7XG4gICAgaWYgKHpJbmRleCA9PT0gMCkge1xuICAgICAgaWYgKGVsLnBhcmVudE5vZGUpIHtcbiAgICAgICAgcmV0dXJuIGdldFpJbmRleChlbC5wYXJlbnROb2RlKTtcbiAgICAgIH1cbiAgICB9XG4gICAgcmV0dXJuIHpJbmRleDtcbiAgfSxcbiAgXG4gIGlzQ2hpbGRPZiA9IGZ1bmN0aW9uKHBhcmVudCwgY2hpbGQpIHtcbiAgIGlmICghY2hpbGQgfHwgIXBhcmVudCkge1xuICAgICByZXR1cm4gZmFsc2U7XG4gICB9XG4gICB2YXIgbm9kZSA9IGNoaWxkLnBhcmVudE5vZGU7XG4gICB3aGlsZSAobm9kZSAhPSBudWxsKSB7XG4gICAgIGlmIChub2RlID09IHBhcmVudCkge1xuICAgICAgICAgcmV0dXJuIHRydWU7XG4gICAgIH1cbiAgICAgbm9kZSA9IG5vZGUucGFyZW50Tm9kZTtcbiAgIH1cbiAgIHJldHVybiBmYWxzZTtcbiAgfTtcblxuLy8gQ29tcGFyZSBaLUluZGV4LCByZXR1cm5zIC0xLCAxIG9yIDBcbmZ1bmN0aW9uIGNvbXBhcmVQb3NpdGlvblN0YWNrKGEsIGIpIHtcbiAgdmFyIHBhID0gZ2V0U3R5bGUoYSwgJ3Bvc2l0aW9uJyk7XG4gIHZhciBwYiA9IGdldFN0eWxlKGIsICdwb3NpdGlvbicpO1xuICBpZiAoemEgPiB6Yikge1xuICAgIHJldHVybiAtMTtcbiAgfSBlbHNlIGlmICh6YiA+IHphKSB7XG4gICAgcmV0dXJuIDE7XG4gIH1cbiAgcmV0dXJuIDA7XG59XG5cbi8vIENvbXBhcmUgWi1JbmRleCwgcmV0dXJucyAtMSwgMSBvciAwXG5mdW5jdGlvbiBjb21wYXJlWkluZGV4KGEsIGIpIHtcbiAgdmFyIHphID0gZ2V0WkluZGV4KGEpO1xuICB2YXIgemIgPSBnZXRaSW5kZXgoYik7XG4gIGlmICh6YSA+IHpiKSB7XG4gICAgcmV0dXJuIC0xO1xuICB9IGVsc2UgaWYgKHpiID4gemEpIHtcbiAgICByZXR1cm4gMTtcbiAgfVxuICByZXR1cm4gMDtcbn1cblxuLy8gQ29tcGFyZSBQb3NpdGlvbiAtIE1JVCBMaWNlbnNlZCwgSm9obiBSZXNpZ1xuZnVuY3Rpb24gY29tcGFyZVBvc2l0aW9uKGEsIGIpe1xuICByZXR1cm4gYS5jb21wYXJlRG9jdW1lbnRQb3NpdGlvbiA/XG4gICAgYS5jb21wYXJlRG9jdW1lbnRQb3NpdGlvbihiKSA6XG4gICAgYS5jb250YWlucyA/XG4gICAgICAoYSAhPSBiICYmIGEuY29udGFpbnMoYikgJiYgMTYpICtcbiAgICAgICAgKGEgIT0gYiAmJiBiLmNvbnRhaW5zKGEpICYmIDgpICtcbiAgICAgICAgKGEuc291cmNlSW5kZXggPj0gMCAmJiBiLnNvdXJjZUluZGV4ID49IDAgP1xuICAgICAgICAgIChhLnNvdXJjZUluZGV4IDwgYi5zb3VyY2VJbmRleCAmJiA0KSArXG4gICAgICAgICAgICAoYS5zb3VyY2VJbmRleCA+IGIuc291cmNlSW5kZXggJiYgMikgOlxuICAgICAgICAgIDEpICtcbiAgICAgIDAgOlxuICAgICAgMDtcbn1cblxubW9kdWxlLmV4cG9ydHMgPSBmdW5jdGlvbihhLCBiKSB7XG4gIFxuICAvLyBDb21wYXJlIHBhcmVudC9jaGlsZCByZWxhdGlvblxuICBpZiAoaXNDaGlsZE9mKGEsIGIpKSB7XG4gICAgLy8gaWYgYiBpcyBjb250YWluZWQgaW4gYSwgaXQncyBhbHdheXMgb24gdG9wXG4gICAgcmV0dXJuIGI7XG4gIH1cbiAgXG4gIC8vIENvbXBhcmUgWi1JbmRleCBTdGFja1xuICB2YXIgekluZGV4Q29tcGFyaXNvblJlc3VsdCA9IGNvbXBhcmVaSW5kZXgoYSwgYik7XG4gIGlmICh6SW5kZXhDb21wYXJpc29uUmVzdWx0ID09PSAtMSkge1xuICAgIC8vIGEgaXMgb24gdG9wXG4gICAgcmV0dXJuIGE7XG4gIH1cbiAgaWYgKHpJbmRleENvbXBhcmlzb25SZXN1bHQgPT09IDEpIHtcbiAgICAvLyBiIGlzIG9uIHRvcFxuICAgIHJldHVybiBiO1xuICB9XG4gIC8vIFRPRE86IENvbXBhcmUgQW5jZXN0b3IgUG9zaXRpb24gU3RhY2tcbiAgXG4gIC8vIENvbXBhcmUgRG9jdW1lbnQgUG9zaXRpb25cbiAgdmFyIGRvY3VtZW50UG9zaXRpb25SZXN1bHQgPSBjb21wYXJlUG9zaXRpb24oYSwgYik7XG4gIGlmIChkb2N1bWVudFBvc2l0aW9uUmVzdWx0ID09PSAyKSB7XG4gICAgLy8gYSBpcyBwcmVjZWRpbmdcbiAgICByZXR1cm4gYTtcbiAgfVxuICBpZiAoZG9jdW1lbnRQb3NpdGlvblJlc3VsdCA9PT0gNCkge1xuICAgIC8vIGIgaXMgZm9sbG93aW5nXG4gICAgcmV0dXJuIGI7XG4gIH1cbiAgXG4gIHJldHVybiBhO1xufTsiXX0=
