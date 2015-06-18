(function e(t,n,r){function s(o,u){if(!n[o]){if(!t[o]){var a=typeof require=="function"&&require;if(!u&&a)return a(o,!0);if(i)return i(o,!0);var f=new Error("Cannot find module '"+o+"'");throw f.code="MODULE_NOT_FOUND",f}var l=n[o]={exports:{}};t[o][0].call(l.exports,function(e){var n=t[o][1][e];return s(n?n:e)},l,l.exports,e,t,n,r)}return n[o].exports}var i=typeof require=="function"&&require;for(var o=0;o<r.length;o++)s(r[o]);return s})({1:[function(require,module,exports){
var
  CursorManager = require('./lib/CursorManager'),
  Cursor = require('./lib/Cursor');
  cursorManager = new CursorManager();

module.exports = function curzory(element, options) {
  var cursor = new Cursor(element, options);
  cursorManager.add(cursor);
  return cursor;
};
},{"./lib/Cursor":3,"./lib/CursorManager":4}],2:[function(require,module,exports){
var
  curzory = require('./curzory'),
  $;
  
if ($ = jQuery) {
  $.fn.extend({
    curzory: function(options) {
      return this.each(function() {
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
var
  merge = function() {
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
  }

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
  
    value = value instanceof Array ? value[0] : value;
    
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
          value = value instanceof Array ? value[0] : value;
          //value = typeof value === 'function' ? value.call(this, value) : value;
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
},{}],4:[function(require,module,exports){


var
  
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
  
  offset = function(element) {
    var scrollOffset = scrollOffset();
    var rect = element.getBoundingClientRect(), bodyElement = document.body;
    return {
      top: rect.top + scrollOffset.top,
      left: rect.left + scrollOffset.left
    };
  },
  
  getScrollOffset = function() {
    return {
      left: document.body.scrollLeft + document.documentElement.scrollLeft,
      top: document.body.scrollTop + document.documentElement.scrollTop
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
      x: rect.x + scrollOffset.left,
      y: rect.y + scrollOffset.top,
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
    addMouseListeners(window);
  }
  
  function handleEvent(e) {
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
          //e.stopImmediatePropagation();
          //e.preventDefault();
          clicking = true;
          cursorItem.target.click();
        }
        break;
    }
    // Update cursors
    render.call(instance);
  }
  
  function isClickable(cursorItem) {
    var element = mouse.element;
    if (element) {
      if (cursorItem && cursorItem.target && cursorItem.symbol !== element && isChildOf(cursorItem.container, element)) {
        //if (!opts.hideOnFocus || !isChildOf(element, document.activeElement) && element !== document.activeElement) {
        return true;
      }
    }
    return false;
  } 
  
  function invalidate() {
    
    cursorItems = cursors.map(function(cursor, index) {
      return getCursorItem(cursor, cursorItems[index]);
    });
    
    cursorItem = cursorItems.filter(function(cursorItem, index) {
      var mouseElement = mouse.element, symbol = cursorItem.symbol, bounds = cursorItem.bounds, container = cursorItem.container, result = false;
      // Detect if a mouse element exists and that it's not the symbol itself
      if (mouseElement && symbol !== mouseElement) {
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
      if (item !== cursorItem) {
        css(item.symbol, {
          display: 'none'
        });
      }
    });
    
    if (cursorItem) {
      var symbol = cursorItem.symbol;
      
      var style = {
        display: 'inline-block'
      };
      
      style[transformStyle] = "";
      style[transformStyle + "Origin"] = '';
      
      $(symbol).css(style);
      
      var pos = $(symbol).offset();
      
      var px = pos.left;
      var py = pos.top;
      
      var off = cursorItem.offset;
      var x = Math.round((mouse.x - px) + off.left);
      var y = Math.round((mouse.y - py) + off.top);
      
      style = {
        //border: '1px solid blue'
      };
      
      if (cursorItem.style === 'transform' && transformStyle) {
        style[transformStyle + "Origin"] = '0 0';
        style[transformStyle] = "translate3d(" + x + "px," + y + "px, 0) scale(" + cursorItem.scale + "," + cursorItem.scale + ")";
      } else {
        style.left = x + pos.left;
        style.top = y + pos.top;
      }
      
      $(symbol).css(style);
    }
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
    elements = $.grep(elements, function(n) { return (n); });
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
    container = symbol.offsetParent;
    var rect = getBoundingRect(container);
    var containerPos = $(container).offset() || {x: 0, y: 0};
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
  
  return {
    cursor: cursor,
    symbol: symbol,
    bounds: bounds,
    container: container,
    target: target,
    offset: offset,
    style: style,
    scale: scale
  };
}

module.exports = CursorManager;
},{"./topmost":5}],5:[function(require,module,exports){
var 

  getStyle = function(el, cssprop){
    if (el.currentStyle) //IE
      return el.currentStyle[cssprop];
    else if (document.defaultView && document.defaultView.getComputedStyle) //Firefox
      return document.defaultView.getComputedStyle(el, "")[cssprop];
    else //try and get inline style
      return el.style[cssprop];
  };

function getAncestorsAsArray(element){
  var arr = new Array();
  arr.unshift(element);
  while (arr[0].parentNode){
    arr.unshift(arr[0].parentNode);
  }
  return arr;
}

function highestInitialZIndex(elementArr){
  for (var i = 0; i < elementArr.length; i++) {
      if (elementArr[i].style == undefined) continue;
      var r = getStyle(elementArr[i], 'zIndex');
      if (!isNaN(r) && r!="") {
          return r;
      }
  }
  return undefined;
}

function findCommonAncestor(elementArr1, elementArr2){
  var commonAncestor;
  for (var i=0; i<elementArr1.length; i++){
    if (elementArr1[i] == elementArr2[i]) {
        commonAncestor = elementArr1[i];
    }
  }
  return commonAncestor;
}

function findHighestAbsoluteIndex(element1, element2){
  var arr1 = getAncestorsAsArray(element1);
  var arr2 = getAncestorsAsArray(element2);

  // Does an ancestor of one elment simply have a higher z-index?
  var arr1Z = highestInitialZIndex(arr1);
  var arr2Z = highestInitialZIndex(arr2);
  if (arr1Z > arr2Z || (!isNaN(arr1Z) && isNaN(arr2Z))) return element1;
  if (arr2Z > arr1Z || (!isNaN(arr2Z) && isNaN(arr1Z))) return element2;

  // Is one element a descendent of the other?
  var commonAncestor = findCommonAncestor(arr1, arr2);
  if (commonAncestor == element1) return element2;
  if (commonAncestor == element2) return element1;

  // OK, which has the oldest common sibling? (Greater index of child node for an element = "older" child)
  var indexOfCommonAncestor;
  for (var i=0; i<arr1.length; i++){
    if (arr1[i] == commonAncestor) {
      indexOfCommonAncestor = i;
      break;
    }
  }

  for (var j=commonAncestor.childNodes.length; j>=0; j--) {
    if (arr1[indexOfCommonAncestor+1] == commonAncestor.childNodes[j]) return element1;
    if (arr2[indexOfCommonAncestor+1] == commonAncestor.childNodes[j]) return element2;
  }   
}
module.exports = findHighestAbsoluteIndex;
},{}]},{},[2])
//# sourceMappingURL=data:application/json;charset:utf-8;base64,eyJ2ZXJzaW9uIjozLCJzb3VyY2VzIjpbIm5vZGVfbW9kdWxlcy9ncnVudC1icm93c2VyaWZ5L25vZGVfbW9kdWxlcy9icm93c2VyaWZ5L25vZGVfbW9kdWxlcy9icm93c2VyLXBhY2svX3ByZWx1ZGUuanMiLCJzcmMvY3Vyem9yeS5qcyIsInNyYy9qcXVlcnkuY3Vyem9yeS5qcyIsInNyYy9saWIvQ3Vyc29yLmpzIiwic3JjL2xpYi9DdXJzb3JNYW5hZ2VyLmpzIiwic3JjL2xpYi90b3Btb3N0LmpzIl0sIm5hbWVzIjpbXSwibWFwcGluZ3MiOiJBQUFBO0FDQUE7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7O0FDVEE7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTs7QUNuQkE7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7O0FDOUhBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBOztBQ3JaQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBIiwiZmlsZSI6ImdlbmVyYXRlZC5qcyIsInNvdXJjZVJvb3QiOiIiLCJzb3VyY2VzQ29udGVudCI6WyIoZnVuY3Rpb24gZSh0LG4scil7ZnVuY3Rpb24gcyhvLHUpe2lmKCFuW29dKXtpZighdFtvXSl7dmFyIGE9dHlwZW9mIHJlcXVpcmU9PVwiZnVuY3Rpb25cIiYmcmVxdWlyZTtpZighdSYmYSlyZXR1cm4gYShvLCEwKTtpZihpKXJldHVybiBpKG8sITApO3ZhciBmPW5ldyBFcnJvcihcIkNhbm5vdCBmaW5kIG1vZHVsZSAnXCIrbytcIidcIik7dGhyb3cgZi5jb2RlPVwiTU9EVUxFX05PVF9GT1VORFwiLGZ9dmFyIGw9bltvXT17ZXhwb3J0czp7fX07dFtvXVswXS5jYWxsKGwuZXhwb3J0cyxmdW5jdGlvbihlKXt2YXIgbj10W29dWzFdW2VdO3JldHVybiBzKG4/bjplKX0sbCxsLmV4cG9ydHMsZSx0LG4scil9cmV0dXJuIG5bb10uZXhwb3J0c312YXIgaT10eXBlb2YgcmVxdWlyZT09XCJmdW5jdGlvblwiJiZyZXF1aXJlO2Zvcih2YXIgbz0wO288ci5sZW5ndGg7bysrKXMocltvXSk7cmV0dXJuIHN9KSIsInZhclxuICBDdXJzb3JNYW5hZ2VyID0gcmVxdWlyZSgnLi9saWIvQ3Vyc29yTWFuYWdlcicpLFxuICBDdXJzb3IgPSByZXF1aXJlKCcuL2xpYi9DdXJzb3InKTtcbiAgY3Vyc29yTWFuYWdlciA9IG5ldyBDdXJzb3JNYW5hZ2VyKCk7XG5cbm1vZHVsZS5leHBvcnRzID0gZnVuY3Rpb24gY3Vyem9yeShlbGVtZW50LCBvcHRpb25zKSB7XG4gIHZhciBjdXJzb3IgPSBuZXcgQ3Vyc29yKGVsZW1lbnQsIG9wdGlvbnMpO1xuICBjdXJzb3JNYW5hZ2VyLmFkZChjdXJzb3IpO1xuICByZXR1cm4gY3Vyc29yO1xufTsiLCJ2YXJcbiAgY3Vyem9yeSA9IHJlcXVpcmUoJy4vY3Vyem9yeScpLFxuICAkO1xuICBcbmlmICgkID0galF1ZXJ5KSB7XG4gICQuZm4uZXh0ZW5kKHtcbiAgICBjdXJ6b3J5OiBmdW5jdGlvbihvcHRpb25zKSB7XG4gICAgICByZXR1cm4gdGhpcy5lYWNoKGZ1bmN0aW9uKCkge1xuICAgICAgICB2YXIgY3Vyc29yID0gJCh0aGlzKS5kYXRhKCdjdXJ6b3J5Jyk7XG4gICAgICAgIGlmICghY3Vyc29yKSB7XG4gICAgICAgICAgY3Vyc29yID0gY3Vyem9yeSh0aGlzLCBvcHRpb25zKTtcbiAgICAgICAgICAkKHRoaXMpLmRhdGEoJ2N1cnpvcnknLCBjdXJzb3IpO1xuICAgICAgICB9IGVsc2Uge1xuICAgICAgICAgIGN1cnNvci5zZXQob3B0aW9ucyk7XG4gICAgICAgIH1cbiAgICAgICAgcmV0dXJuICQodGhpcyk7XG4gICAgICB9KTtcbiAgICB9XG4gIH0pO1xufSIsInZhclxuICBtZXJnZSA9IGZ1bmN0aW9uKCkge1xuICAgIHZhciBvYmogPSB7fSxcbiAgICAgIGkgPSAwLFxuICAgICAgaWwgPSBhcmd1bWVudHMubGVuZ3RoLFxuICAgICAga2V5O1xuICAgIGZvciAoOyBpIDwgaWw7IGkrKykge1xuICAgICAgZm9yIChrZXkgaW4gYXJndW1lbnRzW2ldKSB7XG4gICAgICAgIGlmIChhcmd1bWVudHNbaV0uaGFzT3duUHJvcGVydHkoa2V5KSkge1xuICAgICAgICAgICAgb2JqW2tleV0gPSBhcmd1bWVudHNbaV1ba2V5XTtcbiAgICAgICAgfVxuICAgICAgfVxuICAgIH1cbiAgICByZXR1cm4gb2JqO1xuICB9XG5cbiAgY3JlYXRlRWxlbWVudCA9IGZ1bmN0aW9uKHN0cmluZykge1xuICAgIHZhciBlbGVtZW50ID0gZG9jdW1lbnQuY3JlYXRlRWxlbWVudCgnZGl2Jyk7XG4gICAgZWxlbWVudC5pbm5lckhUTUwgPSBzdHJpbmc7XG4gICAgdmFyIHJlc3VsdCA9IGVsZW1lbnQuZmlyc3RDaGlsZDtcbiAgICBlbGVtZW50LnJlbW92ZUNoaWxkKHJlc3VsdCk7XG4gICAgcmV0dXJuIHJlc3VsdDtcbiAgfSxcblxuICBpc0hUTUwgPSBmdW5jdGlvbihzdHJpbmcpIHtcbiAgICByZXR1cm4gdHlwZW9mIHN0cmluZyA9PT0gJ3N0cmluZycgJiYgc3RyaW5nLm1hdGNoKC88XFwvP1xcdysoKFxccytcXHcrKFxccyo9XFxzKig/OlwiLio/XCJ8Jy4qPyd8W14nXCI+XFxzXSspKT8pK1xccyp8XFxzKilcXC8/Pi8pO1xuICB9LFxuICBcblxuICBnZXRFbGVtZW50ID0gZnVuY3Rpb24odmFsdWUsIHBhcmVudCkge1xuICBcbiAgICB2YWx1ZSA9IHZhbHVlIGluc3RhbmNlb2YgQXJyYXkgPyB2YWx1ZVswXSA6IHZhbHVlO1xuICAgIFxuICAgIGlmICh0eXBlb2YgdmFsdWUgPT09ICdmdW5jdGlvbicpIHtcbiAgICAgIHZhbHVlID0gdmFsdWUuY2FsbCh0aGlzLCB2YWx1ZSk7XG4gICAgfVxuICAgIFxuICAgIGlmICh0eXBlb2YgdmFsdWUgPT09ICdzdHJpbmcnKSB7XG4gICAgICBpZiAoaXNIVE1MKHZhbHVlKSkge1xuICAgICAgICB2YWx1ZSA9IGNyZWF0ZUVsZW1lbnQodmFsdWUpO1xuICAgICAgfSBlbHNlIHtcbiAgICAgICAgdmFsdWUgPSBwYXJlbnQucXVlcnlTZWxlY3Rvcih2YWx1ZSk7XG4gICAgICB9XG4gICAgfVxuICAgIFxuICAgIGlmICh2YWx1ZSAmJiB2YWx1ZS5ub2RlTmFtZSkge1xuICAgICAgcmV0dXJuIHZhbHVlO1xuICAgIH1cbiAgICBcbiAgICByZXR1cm4gbnVsbDtcbiAgfTtcblxubW9kdWxlLmV4cG9ydHMgPSBmdW5jdGlvbiBDdXJzb3IoZWxlbWVudCwgb3B0aW9ucykge1xuICAgIFxuICBmdW5jdGlvbiBzZXQobmFtZSwgdmFsdWUpIHtcbiAgICB2YXIgb3B0cztcbiAgICBpZiAodHlwZW9mIG5hbWUgPT09ICdvYmplY3QnKSB7XG4gICAgICBvcHRzID0gbmFtZTtcbiAgICB9IGVsc2Uge1xuICAgICAgb3B0cyA9IHt9O1xuICAgICAgb3B0c1tuYW1lXSA9IHZhbHVlO1xuICAgIH1cbiAgICBmb3IgKG5hbWUgaW4gb3B0cykge1xuICAgICAgdmFsdWUgPSBvcHRzW25hbWVdO1xuICAgICAgc3dpdGNoIChuYW1lKSB7XG4gICAgICAgIGNhc2UgJ2VsZW1lbnQnOlxuICAgICAgICBjYXNlICdzeW1ib2wnOlxuICAgICAgICAgIGlmIChpc0hUTUwodmFsdWUpKSB7XG4gICAgICAgICAgICB2YWx1ZSA9IGNyZWF0ZUVsZW1lbnQodmFsdWUpO1xuICAgICAgICAgIH1cbiAgICAgICAgICBicmVhaztcbiAgICAgIH1cbiAgICAgIG9wdHNbbmFtZV0gPSB2YWx1ZTtcbiAgICB9XG4gICAgb3B0aW9ucyA9IG1lcmdlKG9wdGlvbnMsIG9wdHMpO1xuICB9O1xuICBcbiAgdGhpcy5zZXQgPSBmdW5jdGlvbigpIHtcbiAgICBzZXQuY2FsbCh0aGlzLCBhcmd1bWVudHMpO1xuICAgIGN1cnNvck1hbmFnZXIudXBkYXRlKCk7XG4gIH07XG4gIFxuICB0aGlzLmdldCA9IGZ1bmN0aW9uKG5hbWUpIHtcbiAgICB2YXIgdmFsdWU7XG4gICAgaWYgKCFuYW1lKSB7XG4gICAgICB2YWx1ZSA9IHt9O1xuICAgICAgZm9yICh2YXIgeCBpbiBvcHRpb25zKSB7XG4gICAgICAgIHZhbHVlW3hdID0gdGhpcy5nZXQoeCk7XG4gICAgICB9XG4gICAgfSBlbHNlIHtcbiAgICAgIHZhbHVlID0gb3B0aW9uc1tuYW1lXTtcbiAgICAgIHN3aXRjaCAobmFtZSkge1xuICAgICAgICBjYXNlICdlbGVtZW50JzpcbiAgICAgICAgY2FzZSAnc3ltYm9sJzpcbiAgICAgICAgY2FzZSAnYm91bmRzJzpcbiAgICAgICAgY2FzZSAndGFyZ2V0JzpcbiAgICAgICAgICB2YWx1ZSA9IHZhbHVlIGluc3RhbmNlb2YgQXJyYXkgPyB2YWx1ZVswXSA6IHZhbHVlO1xuICAgICAgICAgIC8vdmFsdWUgPSB0eXBlb2YgdmFsdWUgPT09ICdmdW5jdGlvbicgPyB2YWx1ZS5jYWxsKHRoaXMsIHZhbHVlKSA6IHZhbHVlO1xuICAgICAgICAgIHZhbHVlID0gdHlwZW9mIHZhbHVlID09PSAnc3RyaW5nJyA/IChlbGVtZW50IHx8IGRvY3VtZW50KS5xdWVyeVNlbGVjdG9yKHZhbHVlKSA6IHZhbHVlO1xuICAgICAgICAgIGJyZWFrO1xuICAgICAgfVxuICAgICAgc3dpdGNoIChuYW1lKSB7XG4gICAgICAgIGNhc2UgJ3N5bWJvbCc6XG4gICAgICAgICAgdmFsdWUgPSB2YWx1ZSB8fCB0aGlzLmdldCgnZWxlbWVudCcpO1xuICAgICAgICAgIGJyZWFrO1xuICAgICAgICBjYXNlICdib3VuZHMnOlxuICAgICAgICAgIHZhbHVlID0gdmFsdWUgPyB2YWx1ZSA6IG9wdGlvbnNbJ3N5bWJvbCddID8gdGhpcy5nZXQoJ2VsZW1lbnQnKSA6IHRoaXMuZ2V0KCdlbGVtZW50Jykub2Zmc2V0UGFyZW50O1xuICAgICAgICAgIGJyZWFrO1xuICAgICAgfVxuICAgIH1cbiAgICByZXR1cm4gdmFsdWU7XG4gIH07XG4gIFxuICBzZXQobWVyZ2Uoe1xuICAgIGVsZW1lbnQ6IG51bGwsXG4gICAgb2Zmc2V0OiB7bGVmdDogOCwgdG9wOiA2fSxcbiAgICBzdHlsZTogJ3RyYW5zZm9ybScsXG4gICAgc2NhbGU6IDEsXG4gICAgYm91bmRzOiBudWxsLFxuICAgIHN5bWJvbDogbnVsbCxcbiAgICB0YXJnZXQ6IG51bGwsXG4gICAgaGlkZU9uRm9jdXM6IGZhbHNlXG4gIH0sIG9wdGlvbnMsIHtcbiAgICBlbGVtZW50OiBlbGVtZW50XG4gIH0pKTtcbiAgXG59OyIsIlxuXG52YXJcbiAgXG4gIHRvcG1vc3QgPSByZXF1aXJlKCcuL3RvcG1vc3QnKSxcbiAgXG4gIC8qKlxuICAgKiBIeXBoZW5hdGUgYSBzdHJpbmdcbiAgICogQHBhcmFtIHtTdHJpbmd9IHN0cmluZ1xuICAgKi9cbiAgaHlwaGVuYXRlID0gKGZ1bmN0aW9uKCkge1xuICAgIHZhciBjYWNoZSA9IHt9O1xuICAgIHJldHVybiBmdW5jdGlvbihzdHJpbmcpIHtcbiAgICAgIHJldHVybiBjYWNoZVtzdHJpbmddID0gY2FjaGVbc3RyaW5nXSB8fCAoZnVuY3Rpb24oKSB7XG4gICAgICAgIHJldHVybiBzdHJpbmcucmVwbGFjZSgvKFtBLVpdKS9nLCBmdW5jdGlvbigkMSl7cmV0dXJuIFwiLVwiKyQxLnRvTG93ZXJDYXNlKCk7fSk7XG4gICAgICB9KSgpO1xuICAgIH07XG4gIH0pKCksXG4gIFxuICBnZXRTdHlsZSA9IGZ1bmN0aW9uKGVsLCBjc3Nwcm9wKXtcbiAgIGlmIChlbC5jdXJyZW50U3R5bGUpIC8vSUVcbiAgICByZXR1cm4gZWwuY3VycmVudFN0eWxlW2Nzc3Byb3BdO1xuICAgZWxzZSBpZiAoZG9jdW1lbnQuZGVmYXVsdFZpZXcgJiYgZG9jdW1lbnQuZGVmYXVsdFZpZXcuZ2V0Q29tcHV0ZWRTdHlsZSkgLy9GaXJlZm94XG4gICAgcmV0dXJuIGRvY3VtZW50LmRlZmF1bHRWaWV3LmdldENvbXB1dGVkU3R5bGUoZWwsIFwiXCIpW2Nzc3Byb3BdO1xuICAgZWxzZSAvL3RyeSBhbmQgZ2V0IGlubGluZSBzdHlsZVxuICAgIHJldHVybiBlbC5zdHlsZVtjc3Nwcm9wXTtcbiAgfSxcbiAgXG4gIHRyYW5zZm9ybVN0eWxlID0gKGZ1bmN0aW9uKHByb3AsIHByZWZpeGVzKSB7XG4gICAgdmFyIGksXG4gICAgICBlbGVtID0gZG9jdW1lbnQuY3JlYXRlRWxlbWVudCgnZGl2JyksXG4gICAgICBjYXBpdGFsaXplZCA9IHByb3AuY2hhckF0KDApLnRvVXBwZXJDYXNlKCkgKyBwcm9wLnNsaWNlKDEpO1xuICAgIGZvciAoaSA9IDA7IGkgPCBwcmVmaXhlcy5sZW5ndGg7IGkrKykge1xuICAgICAgaWYgKHR5cGVvZiBlbGVtLnN0eWxlW3ByZWZpeGVzW2ldICsgY2FwaXRhbGl6ZWRdICE9PSBcInVuZGVmaW5lZFwiKSB7XG4gICAgICAgIHJldHVybiBwcmVmaXhlc1tpXSArIGNhcGl0YWxpemVkO1xuICAgICAgfVxuICAgIH1cbiAgICByZXR1cm4gbnVsbDtcbiAgfSkoJ3RyYW5zZm9ybScsIFsnJywgJ01veicsICdXZWJraXQnLCAnTycsICdNcyddKSxcbiAgXG4gIGlzQ2hpbGRPZiA9IGZ1bmN0aW9uKHBhcmVudCwgY2hpbGQpIHtcbiAgIGlmICghY2hpbGQgfHwgIXBhcmVudCkge1xuICAgICByZXR1cm4gZmFsc2U7XG4gICB9XG4gICB2YXIgbm9kZSA9IGNoaWxkLnBhcmVudE5vZGU7XG4gICB3aGlsZSAobm9kZSAhPSBudWxsKSB7XG4gICAgIGlmIChub2RlID09IHBhcmVudCkge1xuICAgICAgICAgcmV0dXJuIHRydWU7XG4gICAgIH1cbiAgICAgbm9kZSA9IG5vZGUucGFyZW50Tm9kZTtcbiAgIH1cbiAgIHJldHVybiBmYWxzZTtcbiAgfSxcbiAgXG4gIGNzcyA9IGZ1bmN0aW9uKGVsZW0sIG5hbWUsIHZhbHVlKSB7XG4gICAgdmFyIG1hcCA9IHt9LCBjc3NUZXh0ID0gbnVsbDtcbiAgICBpZiAodHlwZW9mIG5hbWUgPT09ICdvYmplY3QnKSB7XG4gICAgICBtYXAgPSBuYW1lO1xuICAgIH0gZWxzZSBpZiAodHlwZW9mIHZhbHVlICE9PSBcInVuZGVmaW5lZFwiKSB7XG4gICAgICBtYXBbbmFtZV0gPSB2YWx1ZTtcbiAgICB9XG4gICAgdmFyIGtleXMgPSBPYmplY3Qua2V5cyhtYXApO1xuICAgIGtleXMgPSBrZXlzLmZpbHRlcihmdW5jdGlvbihrZXksIGluZGV4KSB7XG4gICAgICBpZiAobWFwW2tleV0gPT09ICcnKSB7XG4gICAgICAgIGVsZW0uc3R5bGVba2V5XSA9IG1hcFtrZXldO1xuICAgICAgICByZXR1cm4gZmFsc2U7XG4gICAgICB9XG4gICAgICByZXR1cm4gdHJ1ZTtcbiAgICB9KTtcbiAgICBjc3NUZXh0ID0ga2V5cy5tYXAoZnVuY3Rpb24obmFtZSkge1xuICAgICAgcmV0dXJuIGh5cGhlbmF0ZShuYW1lKSArIFwiOiBcIiArIG1hcFtuYW1lXTtcbiAgICB9KS5qb2luKFwiOyBcIik7XG4gICAgaWYgKGNzc1RleHQgJiYgY3NzVGV4dC5sZW5ndGgpIHtcbiAgICAgIGVsZW0uc3R5bGUuY3NzVGV4dCA9IGVsZW0uc3R5bGUuY3NzVGV4dCArIGNzc1RleHQ7XG4gICAgICByZXR1cm4gbnVsbDtcbiAgICB9XG4gICAgcmV0dXJuIGVsZW0uc3R5bGVbbmFtZV0gfHwgd2luZG93LmdldENvbXB1dGVkU3R5bGUoZWxlbSwgbnVsbCkuZ2V0UHJvcGVydHlWYWx1ZShuYW1lKTtcbiAgfSxcbiAgXG4gIG9mZnNldCA9IGZ1bmN0aW9uKGVsZW1lbnQpIHtcbiAgICB2YXIgc2Nyb2xsT2Zmc2V0ID0gc2Nyb2xsT2Zmc2V0KCk7XG4gICAgdmFyIHJlY3QgPSBlbGVtZW50LmdldEJvdW5kaW5nQ2xpZW50UmVjdCgpLCBib2R5RWxlbWVudCA9IGRvY3VtZW50LmJvZHk7XG4gICAgcmV0dXJuIHtcbiAgICAgIHRvcDogcmVjdC50b3AgKyBzY3JvbGxPZmZzZXQudG9wLFxuICAgICAgbGVmdDogcmVjdC5sZWZ0ICsgc2Nyb2xsT2Zmc2V0LmxlZnRcbiAgICB9O1xuICB9LFxuICBcbiAgZ2V0U2Nyb2xsT2Zmc2V0ID0gZnVuY3Rpb24oKSB7XG4gICAgcmV0dXJuIHtcbiAgICAgIGxlZnQ6IGRvY3VtZW50LmJvZHkuc2Nyb2xsTGVmdCArIGRvY3VtZW50LmRvY3VtZW50RWxlbWVudC5zY3JvbGxMZWZ0LFxuICAgICAgdG9wOiBkb2N1bWVudC5ib2R5LnNjcm9sbFRvcCArIGRvY3VtZW50LmRvY3VtZW50RWxlbWVudC5zY3JvbGxUb3BcbiAgICB9O1xuICB9LFxuICBcbiAgZ2V0Qm91bmRpbmdSZWN0ID0gZnVuY3Rpb24oZWxlbWVudCkge1xuICAgIGlmICghZWxlbWVudCkge1xuICAgICAgcmV0dXJuIHtcbiAgICAgICAgeDogLUluZmluaXR5LFxuICAgICAgICB5OiAtSW5maW5pdHksXG4gICAgICAgIHdpZHRoOiBJbmZpbml0eSxcbiAgICAgICAgaGVpZ2h0OiBJbmZpbml0eVxuICAgICAgfTtcbiAgICB9XG4gICAgdmFyIHNjcm9sbE9mZnNldCA9IGdldFNjcm9sbE9mZnNldCgpO1xuICAgIHZhciByZWN0ID0gZWxlbWVudC5nZXRCb3VuZGluZ0NsaWVudFJlY3QoKTtcbiAgICByZXR1cm4ge1xuICAgICAgeDogcmVjdC54ICsgc2Nyb2xsT2Zmc2V0LmxlZnQsXG4gICAgICB5OiByZWN0LnkgKyBzY3JvbGxPZmZzZXQudG9wLFxuICAgICAgd2lkdGg6IHJlY3Qud2lkdGgsXG4gICAgICBoZWlnaHQ6IHJlY3QuaGVpZ2h0XG4gICAgfTtcbiAgfSxcbiAgXG4gIC8vIERlY2xhcmUgc2luZ2xldG9uIGluc3RhbmNlXG4gIGluc3RhbmNlID0gbnVsbDtcblxuLyoqXG4gKiBDdXJzb3JNYW5hZ2VyXG4gKiBUaGlzIHNpbmdsZXRvbiBjbGFzcyBoYW5kbGVzIGFsbCBjdXJzb3Igb2JqZWN0cyBcbiAqIEBwYXJhbSB7T2JqZWN0fSBvcHRpb25zXG4gKi9cbmZ1bmN0aW9uIEN1cnNvck1hbmFnZXIob3B0aW9ucykge1xuICAvLyBTaW5nbGV0b24gcGF0dGVyblxuICBpZiAoaW5zdGFuY2UpIHtcbiAgICBpbnN0YW5jZS5zZXQob3B0aW9ucyk7XG4gICAgcmV0dXJuIGluc3RhbmNlO1xuICB9XG4gIGluc3RhbmNlID0gdGhpcztcbiAgLy8gSW1wbGVtZW50YXRpb25cbiAgXG4gIHZhciBjdXJzb3JzID0gW107XG4gIHZhciBjbGllbnQgPSB7eDogMCwgeTogMH07XG4gIHZhciBtb3VzZSA9IHt4OiAtSW5maW5pdHksIHk6IC1JbmZpbml0eSwgZWxlbWVudDogbnVsbH07XG4gIHZhciBldmVudHMgPSBbJ21vdXNlZG93bicsICdjbGljaycsICdzY3JvbGwnLCAncmVzaXplJywgJ21vdXNlbW92ZScsICdtb3VzZW91dCddO1xuICB2YXIgY3Vyc29ySXRlbXMgPSBbXTtcbiAgdmFyIGN1cnNvckl0ZW0gPSBudWxsO1xuICB2YXIgY2xpY2tpbmcgPSBmYWxzZTtcbiAgdmFyIGNsaWNrYWJsZSA9IHRydWU7XG4gIFxuICBmdW5jdGlvbiBpbml0KCkge1xuICAgIGFkZE1vdXNlTGlzdGVuZXJzKHdpbmRvdyk7XG4gIH1cbiAgXG4gIGZ1bmN0aW9uIGhhbmRsZUV2ZW50KGUpIHtcbiAgICAvLyBVcGRhdGUgTW91c2UgUG9zaXRpb25cbiAgICBzd2l0Y2ggKGUudHlwZSkge1xuICAgICAgY2FzZSAnbW91c2Vkb3duJzpcbiAgICAgICAgY2xpY2tpbmcgPSBmYWxzZTtcbiAgICAgICAgYnJlYWs7XG4gICAgICBjYXNlICdtb3VzZW91dCc6XG4gICAgICAgIHZhciByZWxhdGVkVGFyZ2V0ID0gdHlwZW9mIGUudG9FbGVtZW50ICE9ICd1bmRlZmluZWQnID8gZS50b0VsZW1lbnQgOiBlLnJlbGF0ZWRUYXJnZXQ7XG4gICAgICAgIGlmIChyZWxhdGVkVGFyZ2V0ID09PSBudWxsKSB7XG4gICAgICAgICAgbW91c2UueCA9IC1JbmZpbml0eTtcbiAgICAgICAgICBtb3VzZS55ID0gLUluZmluaXR5O1xuICAgICAgICAgIG1vdXNlLmVsZW1lbnQgPSBudWxsO1xuICAgICAgICB9XG4gICAgICAgIGJyZWFrO1xuICAgICAgY2FzZSAnbW91c2Vtb3ZlJzpcbiAgICAgICAgLy8gR2V0IG1vdXNlIGNvb3JkaW5hdGVzXG4gICAgICAgIC8vIFVwZGF0ZSBtb3VzZSBjb29yZGluYXRlc1xuICAgICAgICBjbGllbnQueCA9IGUuY2xpZW50WDtcbiAgICAgICAgY2xpZW50LnkgPSBlLmNsaWVudFk7XG4gICAgICBkZWZhdWx0OlxuICAgICAgdmFyIHNjcm9sbE9mZnNldCA9IGdldFNjcm9sbE9mZnNldCgpO1xuICAgICAgbW91c2UueCA9IGNsaWVudC54ICsgc2Nyb2xsT2Zmc2V0LmxlZnQ7XG4gICAgICBtb3VzZS55ID0gY2xpZW50LnkgKyBzY3JvbGxPZmZzZXQudG9wO1xuICAgICAgbW91c2UuZWxlbWVudCA9IGUudGFyZ2V0O1xuICAgIH1cbiAgICBcbiAgICAvLyBHZXQgQ3Vyc29yIFByb3BzXG4gICAgaW52YWxpZGF0ZS5jYWxsKHRoaXMpO1xuICAgIFxuICAgIC8vIFByb2Nlc3MgQ2xpY2tcbiAgICBzd2l0Y2ggKGUudHlwZSkge1xuICAgICAgY2FzZSAnY2xpY2snOlxuICAgICAgICBpZiAoIWNsaWNraW5nICYmIGN1cnNvckl0ZW0pIHtcbiAgICAgICAgICAvL2Uuc3RvcEltbWVkaWF0ZVByb3BhZ2F0aW9uKCk7XG4gICAgICAgICAgLy9lLnByZXZlbnREZWZhdWx0KCk7XG4gICAgICAgICAgY2xpY2tpbmcgPSB0cnVlO1xuICAgICAgICAgIGN1cnNvckl0ZW0udGFyZ2V0LmNsaWNrKCk7XG4gICAgICAgIH1cbiAgICAgICAgYnJlYWs7XG4gICAgfVxuICAgIC8vIFVwZGF0ZSBjdXJzb3JzXG4gICAgcmVuZGVyLmNhbGwoaW5zdGFuY2UpO1xuICB9XG4gIFxuICBmdW5jdGlvbiBpc0NsaWNrYWJsZShjdXJzb3JJdGVtKSB7XG4gICAgdmFyIGVsZW1lbnQgPSBtb3VzZS5lbGVtZW50O1xuICAgIGlmIChlbGVtZW50KSB7XG4gICAgICBpZiAoY3Vyc29ySXRlbSAmJiBjdXJzb3JJdGVtLnRhcmdldCAmJiBjdXJzb3JJdGVtLnN5bWJvbCAhPT0gZWxlbWVudCAmJiBpc0NoaWxkT2YoY3Vyc29ySXRlbS5jb250YWluZXIsIGVsZW1lbnQpKSB7XG4gICAgICAgIC8vaWYgKCFvcHRzLmhpZGVPbkZvY3VzIHx8ICFpc0NoaWxkT2YoZWxlbWVudCwgZG9jdW1lbnQuYWN0aXZlRWxlbWVudCkgJiYgZWxlbWVudCAhPT0gZG9jdW1lbnQuYWN0aXZlRWxlbWVudCkge1xuICAgICAgICByZXR1cm4gdHJ1ZTtcbiAgICAgIH1cbiAgICB9XG4gICAgcmV0dXJuIGZhbHNlO1xuICB9IFxuICBcbiAgZnVuY3Rpb24gaW52YWxpZGF0ZSgpIHtcbiAgICBcbiAgICBjdXJzb3JJdGVtcyA9IGN1cnNvcnMubWFwKGZ1bmN0aW9uKGN1cnNvciwgaW5kZXgpIHtcbiAgICAgIHJldHVybiBnZXRDdXJzb3JJdGVtKGN1cnNvciwgY3Vyc29ySXRlbXNbaW5kZXhdKTtcbiAgICB9KTtcbiAgICBcbiAgICBjdXJzb3JJdGVtID0gY3Vyc29ySXRlbXMuZmlsdGVyKGZ1bmN0aW9uKGN1cnNvckl0ZW0sIGluZGV4KSB7XG4gICAgICB2YXIgbW91c2VFbGVtZW50ID0gbW91c2UuZWxlbWVudCwgc3ltYm9sID0gY3Vyc29ySXRlbS5zeW1ib2wsIGJvdW5kcyA9IGN1cnNvckl0ZW0uYm91bmRzLCBjb250YWluZXIgPSBjdXJzb3JJdGVtLmNvbnRhaW5lciwgcmVzdWx0ID0gZmFsc2U7XG4gICAgICAvLyBEZXRlY3QgaWYgYSBtb3VzZSBlbGVtZW50IGV4aXN0cyBhbmQgdGhhdCBpdCdzIG5vdCB0aGUgc3ltYm9sIGl0c2VsZlxuICAgICAgaWYgKG1vdXNlRWxlbWVudCAmJiBzeW1ib2wgIT09IG1vdXNlRWxlbWVudCkge1xuICAgICAgICAvLyBEZXRlY3QgaWYgc3ltYm9sIGlzIHRvcG1vc3QgZWxlbWVudFxuICAgICAgICBpZiAodG9wbW9zdChtb3VzZUVsZW1lbnQsIHN5bWJvbCkgPT09IHN5bWJvbCkge1xuICAgICAgICAgIC8vIERldGVjdCBpZiBtb3VzZSBlbGVtZW50IGlzIGNvbnRhaW5lZFxuICAgICAgICAgIGlmIChjb250YWluZXIgPT09IG1vdXNlRWxlbWVudCB8fCBpc0NoaWxkT2YoY29udGFpbmVyLCBtb3VzZUVsZW1lbnQpKSB7XG4gICAgICAgICAgICAvLyBNYXRjaCBib3VuZHNcbiAgICAgICAgICAgIHJlc3VsdCA9IChtb3VzZS54ID49IGJvdW5kcy54ICYmIG1vdXNlLnggPD0gYm91bmRzLnggKyBib3VuZHMud2lkdGggJiYgbW91c2UueSA+PSBib3VuZHMueSAmJiBtb3VzZS55IDw9IGJvdW5kcy55ICsgYm91bmRzLmhlaWdodCk7XG4gICAgICAgICAgfVxuICAgICAgICB9XG4gICAgICB9XG4gICAgICByZXR1cm4gcmVzdWx0O1xuICAgIH0pLnNvcnQoZnVuY3Rpb24oYSwgYikge1xuICAgICAgdmFyIHpFbGVtZW50ID0gdG9wbW9zdChhLnN5bWJvbCwgYi5zeW1ib2wpO1xuICAgICAgaWYgKHpFbGVtZW50ID09PSBhLnN5bWJvbCkge1xuICAgICAgICByZXR1cm4gYTtcbiAgICAgIH0gZWxzZSBpZiAoekVsZW1lbnQgPT09IGIuc3ltYm9sKSB7XG4gICAgICAgIHJldHVybiBiO1xuICAgICAgfVxuICAgICAgXG4gICAgICB2YXIgcDEgPSB7eDogYS54ICsgYS53aWR0aCAvIDIsIHk6IGEueSArIGEuaGVpZ2h0IC8gMn07XG4gICAgICB2YXIgcDIgPSB7eDogYi54ICsgYi53aWR0aCAvIDIsIHk6IGIueSArIGIuaGVpZ2h0IC8gMn07XG4gICAgICB2YXIgZDEgPSBNYXRoLnNxcnQoIE1hdGgucG93KChwMS54IC0gbW91c2UueCksIDIpICsgTWF0aC5wb3coKHAxLnkgLSBtb3VzZS55KSwgMikgKTtcbiAgICAgIHZhciBkMiA9IE1hdGguc3FydCggTWF0aC5wb3coKHAyLnggLSBtb3VzZS54KSwgMikgKyBNYXRoLnBvdygocDIueSAtIG1vdXNlLnkpLCAyKSApO1xuICAgICAgcmV0dXJuIGQxIDwgZDIgPyBkMSA6IGQxID4gZDIgPyBkMiA6IDA7XG4gICAgfSkucmV2ZXJzZSgpWzBdO1xuICAgIFxuICAgIC8vIFNldCBNb3VzZVByb3ZpZGVyc1xuICAgIHNldE1vdXNlUHJvdmlkZXJzKFt3aW5kb3ddLmNvbmNhdChjdXJzb3JJdGVtcy5tYXAoZnVuY3Rpb24oaXRlbSkge1xuICAgICAgcmV0dXJuIGl0ZW0uY29udGFpbmVyO1xuICAgIH0pKSk7XG4gICAgLy9zZXRNb3VzZVByb3ZpZGVycyhbd2luZG93XSk7XG4gIH1cbiAgXG4gIGZ1bmN0aW9uIHJlbmRlcigpIHtcblxuICAgIGN1cnNvckl0ZW1zLmZvckVhY2goZnVuY3Rpb24oaXRlbSkge1xuICAgICAgaWYgKGl0ZW0gIT09IGN1cnNvckl0ZW0pIHtcbiAgICAgICAgY3NzKGl0ZW0uc3ltYm9sLCB7XG4gICAgICAgICAgZGlzcGxheTogJ25vbmUnXG4gICAgICAgIH0pO1xuICAgICAgfVxuICAgIH0pO1xuICAgIFxuICAgIGlmIChjdXJzb3JJdGVtKSB7XG4gICAgICB2YXIgc3ltYm9sID0gY3Vyc29ySXRlbS5zeW1ib2w7XG4gICAgICBcbiAgICAgIHZhciBzdHlsZSA9IHtcbiAgICAgICAgZGlzcGxheTogJ2lubGluZS1ibG9jaydcbiAgICAgIH07XG4gICAgICBcbiAgICAgIHN0eWxlW3RyYW5zZm9ybVN0eWxlXSA9IFwiXCI7XG4gICAgICBzdHlsZVt0cmFuc2Zvcm1TdHlsZSArIFwiT3JpZ2luXCJdID0gJyc7XG4gICAgICBcbiAgICAgICQoc3ltYm9sKS5jc3Moc3R5bGUpO1xuICAgICAgXG4gICAgICB2YXIgcG9zID0gJChzeW1ib2wpLm9mZnNldCgpO1xuICAgICAgXG4gICAgICB2YXIgcHggPSBwb3MubGVmdDtcbiAgICAgIHZhciBweSA9IHBvcy50b3A7XG4gICAgICBcbiAgICAgIHZhciBvZmYgPSBjdXJzb3JJdGVtLm9mZnNldDtcbiAgICAgIHZhciB4ID0gTWF0aC5yb3VuZCgobW91c2UueCAtIHB4KSArIG9mZi5sZWZ0KTtcbiAgICAgIHZhciB5ID0gTWF0aC5yb3VuZCgobW91c2UueSAtIHB5KSArIG9mZi50b3ApO1xuICAgICAgXG4gICAgICBzdHlsZSA9IHtcbiAgICAgICAgLy9ib3JkZXI6ICcxcHggc29saWQgYmx1ZSdcbiAgICAgIH07XG4gICAgICBcbiAgICAgIGlmIChjdXJzb3JJdGVtLnN0eWxlID09PSAndHJhbnNmb3JtJyAmJiB0cmFuc2Zvcm1TdHlsZSkge1xuICAgICAgICBzdHlsZVt0cmFuc2Zvcm1TdHlsZSArIFwiT3JpZ2luXCJdID0gJzAgMCc7XG4gICAgICAgIHN0eWxlW3RyYW5zZm9ybVN0eWxlXSA9IFwidHJhbnNsYXRlM2QoXCIgKyB4ICsgXCJweCxcIiArIHkgKyBcInB4LCAwKSBzY2FsZShcIiArIGN1cnNvckl0ZW0uc2NhbGUgKyBcIixcIiArIGN1cnNvckl0ZW0uc2NhbGUgKyBcIilcIjtcbiAgICAgIH0gZWxzZSB7XG4gICAgICAgIHN0eWxlLmxlZnQgPSB4ICsgcG9zLmxlZnQ7XG4gICAgICAgIHN0eWxlLnRvcCA9IHkgKyBwb3MudG9wO1xuICAgICAgfVxuICAgICAgXG4gICAgICAkKHN5bWJvbCkuY3NzKHN0eWxlKTtcbiAgICB9XG4gIH07XG4gIFxuICB0aGlzLnVwZGF0ZSA9IGZ1bmN0aW9uKCkge1xuICAgIGludmFsaWRhdGUuY2FsbCh0aGlzKTtcbiAgICByZW5kZXIuY2FsbCh0aGlzKTtcbiAgfTtcbiAgXG4gIHRoaXMuYWRkID0gZnVuY3Rpb24oY3Vyc29yKSB7XG4gICAgaWYgKGN1cnNvcnMuaW5kZXhPZihjdXJzb3IpID09PSAtMSkge1xuICAgICAgY3Vyc29ycy5wdXNoKGN1cnNvcik7XG4gICAgICB0aGlzLnVwZGF0ZSgpO1xuICAgIH1cbiAgfTtcbiAgXG4gIHRoaXMucmVtb3ZlID0gZnVuY3Rpb24oY3Vyc29yKSB7XG4gICAgY3Vyc29ycy5zcGxpY2UoY3Vyc29ycy5pbmRleE9mKGN1cnNvciksIDEpO1xuICAgIHRoaXMudXBkYXRlKCk7XG4gIH07XG4gIFxuICB2YXIgbW91c2VQcm92aWRlcnMgPSBbXTtcbiAgZnVuY3Rpb24gc2V0TW91c2VQcm92aWRlcnMoZWxlbWVudHMpIHtcbiAgICBlbGVtZW50cyA9ICQuZ3JlcChlbGVtZW50cywgZnVuY3Rpb24obikgeyByZXR1cm4gKG4pOyB9KTtcbiAgICBtb3VzZVByb3ZpZGVycy5mb3JFYWNoKGZ1bmN0aW9uKGVsZW1lbnQpIHtcbiAgICAgIGlmIChlbGVtZW50cy5pbmRleE9mKGVsZW1lbnQpID09PSAtMSkge1xuICAgICAgICByZW1vdmVNb3VzZUxpc3RlbmVycyhlbGVtZW50KTtcbiAgICAgIH1cbiAgICB9KTtcbiAgICBlbGVtZW50cy5mb3JFYWNoKGZ1bmN0aW9uKGVsZW1lbnQpIHtcbiAgICAgIGlmIChtb3VzZVByb3ZpZGVycy5pbmRleE9mKGVsZW1lbnQpID09PSAtMSkge1xuICAgICAgICBhZGRNb3VzZUxpc3RlbmVycyhlbGVtZW50KTtcbiAgICAgIH1cbiAgICB9KTtcbiAgICBtb3VzZVByb3ZpZGVycyA9IGVsZW1lbnRzO1xuICB9XG4gIFxuICBmdW5jdGlvbiBhZGRNb3VzZUxpc3RlbmVycyhlbGVtZW50KSB7XG4gICAgZm9yICh2YXIgaSA9IDAsIGV2ZW50OyBldmVudCA9IGV2ZW50c1tpXTsgaSsrKSB7XG4gICAgICBlbGVtZW50LmFkZEV2ZW50TGlzdGVuZXIoZXZlbnQsIGhhbmRsZUV2ZW50KTtcbiAgICB9XG4gIH1cbiAgXG4gIGZ1bmN0aW9uIHJlbW92ZU1vdXNlTGlzdGVuZXJzKGVsZW1lbnQpIHtcbiAgICBmb3IgKHZhciBpID0gMCwgZXZlbnQ7IGV2ZW50ID0gZXZlbnRzW2ldOyBpKyspIHtcbiAgICAgIGVsZW1lbnQucmVtb3ZlRXZlbnRMaXN0ZW5lcihldmVudCwgaGFuZGxlRXZlbnQpO1xuICAgIH1cbiAgfVxuICBcbiAgaW5pdC5jYWxsKHRoaXMpO1xuICBcbn1cblxuXG5cbmZ1bmN0aW9uIGdldEN1cnNvckl0ZW0oY3Vyc29yKSB7XG4gIFxuICB2YXJcbiAgICBlbGVtZW50ID0gY3Vyc29yLmdldCgnZWxlbWVudCcpLFxuICAgIHByb3BzLCBzeW1ib2wsIGJvdW5kcywgY29udGFpbmVyLCBvZmZzZXQsIHN0eWxlLCBzY2FsZTtcbiAgICBcbiAgY3NzKGVsZW1lbnQsIHtcbiAgICBkaXNwbGF5OiAnJ1xuICB9KTtcbiAgXG4gIHByb3BzID0gY3Vyc29yLmdldCgpO1xuICBcbiAgc3ltYm9sID0gcHJvcHMuc3ltYm9sO1xuICBib3VuZHMgPSBwcm9wcy5ib3VuZHM7XG4gIG9mZnNldCA9IHByb3BzLm9mZnNldDtcbiAgc3R5bGUgPSBwcm9wcy5zdHlsZTtcbiAgc2NhbGUgPSBwcm9wcy5zY2FsZTtcbiAgXG4gIC8vIEFkZCBjdXJzb3Igc3ltYm9sIHRvIGRvbVxuICBpZiAoIXN5bWJvbC5wYXJlbnROb2RlKSB7XG4gICAgZWxlbWVudC5hcHBlbmRDaGlsZChzeW1ib2wpO1xuICB9XG4gIFxuICBcbiAgLy8gR2V0IGJvdW5kc1xuICB2YXIgY29udGFpbmVyO1xuICBpZiAoYm91bmRzICYmIGJvdW5kcy5nZXRCb3VuZGluZ0NsaWVudFJlY3QpIHtcbiAgICAvLyBFbGVtZW50IGJvdW5kc1xuICAgIGNvbnRhaW5lciA9IGJvdW5kcztcbiAgICBib3VuZHMgPSBnZXRCb3VuZGluZ1JlY3QoYm91bmRzKTtcbiAgfSBlbHNlIHtcbiAgICAvLyBPYmplY3QgYm91bmRzXG4gICAgY29udGFpbmVyID0gc3ltYm9sLm9mZnNldFBhcmVudDtcbiAgICB2YXIgcmVjdCA9IGdldEJvdW5kaW5nUmVjdChjb250YWluZXIpO1xuICAgIHZhciBjb250YWluZXJQb3MgPSAkKGNvbnRhaW5lcikub2Zmc2V0KCkgfHwge3g6IDAsIHk6IDB9O1xuICAgIC8vIFByb2Nlc3MgZnVuY3Rpb24gXG4gICAgaWYgKHR5cGVvZiBib3VuZHMgPT09ICdmdW5jdGlvbicpIHtcbiAgICAgIGJvdW5kcyA9IGJvdW5kcyhjb250YWluZXIpO1xuICAgIH1cbiAgICAvLyBHZXQgcGVyY2VudCB2YWx1ZXNcbiAgICB2YXIgeCA9IHR5cGVvZiBib3VuZHMueCA9PT0gJ3N0cmluZycgJiYgYm91bmRzLnguaW5kZXhPZihcIiVcIikgPj0gMCA/IHBhcnNlRmxvYXQoYm91bmRzLngpICogcmVjdC53aWR0aCAvIDEwMCA6IHBhcnNlRmxvYXQoYm91bmRzLngpO1xuICAgIHZhciB5ID0gdHlwZW9mIGJvdW5kcy55ID09PSAnc3RyaW5nJyAmJiBib3VuZHMueS5pbmRleE9mKFwiJVwiKSA+PSAwID8gcGFyc2VGbG9hdChib3VuZHMueSkgKiByZWN0LmhlaWdodCAvIDEwMCA6IHBhcnNlRmxvYXQoYm91bmRzLnkpO1xuICAgIHZhciB3aWR0aCA9IHR5cGVvZiBib3VuZHMud2lkdGggPT09ICdzdHJpbmcnICYmIGJvdW5kcy53aWR0aC5pbmRleE9mKFwiJVwiKSA+PSAwID8gcGFyc2VGbG9hdChib3VuZHMud2lkdGgpICogcmVjdC53aWR0aCAvIDEwMCA6IHBhcnNlRmxvYXQoYm91bmRzLndpZHRoKTtcbiAgICB2YXIgaGVpZ2h0ID0gdHlwZW9mIGJvdW5kcy5oZWlnaHQgPT09ICdzdHJpbmcnICYmIGJvdW5kcy5oZWlnaHQuaW5kZXhPZihcIiVcIikgPj0gMCA/IHBhcnNlRmxvYXQoYm91bmRzLmhlaWdodCkgKiByZWN0LmhlaWdodCAvIDEwMCA6IHBhcnNlRmxvYXQoYm91bmRzLmhlaWdodCk7XG4gICAgYm91bmRzID0ge1xuICAgICAgeDogY29udGFpbmVyUG9zLmxlZnQgKyB4LFxuICAgICAgeTogY29udGFpbmVyUG9zLnRvcCArIHksXG4gICAgICB3aWR0aDogd2lkdGgsXG4gICAgICBoZWlnaHQ6IGhlaWdodFxuICAgIH07XG4gIH1cbiAgXG4gIHZhciB0YXJnZXQgPSBwcm9wcy50YXJnZXQgfHwgc3ltYm9sLm5vZGVOYW1lLnRvTG93ZXJDYXNlKCkgPT09ICdhJyA/IHN5bWJvbCA6IGVsZW1lbnQ7XG4gIFxuICByZXR1cm4ge1xuICAgIGN1cnNvcjogY3Vyc29yLFxuICAgIHN5bWJvbDogc3ltYm9sLFxuICAgIGJvdW5kczogYm91bmRzLFxuICAgIGNvbnRhaW5lcjogY29udGFpbmVyLFxuICAgIHRhcmdldDogdGFyZ2V0LFxuICAgIG9mZnNldDogb2Zmc2V0LFxuICAgIHN0eWxlOiBzdHlsZSxcbiAgICBzY2FsZTogc2NhbGVcbiAgfTtcbn1cblxubW9kdWxlLmV4cG9ydHMgPSBDdXJzb3JNYW5hZ2VyOyIsInZhciBcblxuICBnZXRTdHlsZSA9IGZ1bmN0aW9uKGVsLCBjc3Nwcm9wKXtcbiAgICBpZiAoZWwuY3VycmVudFN0eWxlKSAvL0lFXG4gICAgICByZXR1cm4gZWwuY3VycmVudFN0eWxlW2Nzc3Byb3BdO1xuICAgIGVsc2UgaWYgKGRvY3VtZW50LmRlZmF1bHRWaWV3ICYmIGRvY3VtZW50LmRlZmF1bHRWaWV3LmdldENvbXB1dGVkU3R5bGUpIC8vRmlyZWZveFxuICAgICAgcmV0dXJuIGRvY3VtZW50LmRlZmF1bHRWaWV3LmdldENvbXB1dGVkU3R5bGUoZWwsIFwiXCIpW2Nzc3Byb3BdO1xuICAgIGVsc2UgLy90cnkgYW5kIGdldCBpbmxpbmUgc3R5bGVcbiAgICAgIHJldHVybiBlbC5zdHlsZVtjc3Nwcm9wXTtcbiAgfTtcblxuZnVuY3Rpb24gZ2V0QW5jZXN0b3JzQXNBcnJheShlbGVtZW50KXtcbiAgdmFyIGFyciA9IG5ldyBBcnJheSgpO1xuICBhcnIudW5zaGlmdChlbGVtZW50KTtcbiAgd2hpbGUgKGFyclswXS5wYXJlbnROb2RlKXtcbiAgICBhcnIudW5zaGlmdChhcnJbMF0ucGFyZW50Tm9kZSk7XG4gIH1cbiAgcmV0dXJuIGFycjtcbn1cblxuZnVuY3Rpb24gaGlnaGVzdEluaXRpYWxaSW5kZXgoZWxlbWVudEFycil7XG4gIGZvciAodmFyIGkgPSAwOyBpIDwgZWxlbWVudEFyci5sZW5ndGg7IGkrKykge1xuICAgICAgaWYgKGVsZW1lbnRBcnJbaV0uc3R5bGUgPT0gdW5kZWZpbmVkKSBjb250aW51ZTtcbiAgICAgIHZhciByID0gZ2V0U3R5bGUoZWxlbWVudEFycltpXSwgJ3pJbmRleCcpO1xuICAgICAgaWYgKCFpc05hTihyKSAmJiByIT1cIlwiKSB7XG4gICAgICAgICAgcmV0dXJuIHI7XG4gICAgICB9XG4gIH1cbiAgcmV0dXJuIHVuZGVmaW5lZDtcbn1cblxuZnVuY3Rpb24gZmluZENvbW1vbkFuY2VzdG9yKGVsZW1lbnRBcnIxLCBlbGVtZW50QXJyMil7XG4gIHZhciBjb21tb25BbmNlc3RvcjtcbiAgZm9yICh2YXIgaT0wOyBpPGVsZW1lbnRBcnIxLmxlbmd0aDsgaSsrKXtcbiAgICBpZiAoZWxlbWVudEFycjFbaV0gPT0gZWxlbWVudEFycjJbaV0pIHtcbiAgICAgICAgY29tbW9uQW5jZXN0b3IgPSBlbGVtZW50QXJyMVtpXTtcbiAgICB9XG4gIH1cbiAgcmV0dXJuIGNvbW1vbkFuY2VzdG9yO1xufVxuXG5mdW5jdGlvbiBmaW5kSGlnaGVzdEFic29sdXRlSW5kZXgoZWxlbWVudDEsIGVsZW1lbnQyKXtcbiAgdmFyIGFycjEgPSBnZXRBbmNlc3RvcnNBc0FycmF5KGVsZW1lbnQxKTtcbiAgdmFyIGFycjIgPSBnZXRBbmNlc3RvcnNBc0FycmF5KGVsZW1lbnQyKTtcblxuICAvLyBEb2VzIGFuIGFuY2VzdG9yIG9mIG9uZSBlbG1lbnQgc2ltcGx5IGhhdmUgYSBoaWdoZXIgei1pbmRleD9cbiAgdmFyIGFycjFaID0gaGlnaGVzdEluaXRpYWxaSW5kZXgoYXJyMSk7XG4gIHZhciBhcnIyWiA9IGhpZ2hlc3RJbml0aWFsWkluZGV4KGFycjIpO1xuICBpZiAoYXJyMVogPiBhcnIyWiB8fCAoIWlzTmFOKGFycjFaKSAmJiBpc05hTihhcnIyWikpKSByZXR1cm4gZWxlbWVudDE7XG4gIGlmIChhcnIyWiA+IGFycjFaIHx8ICghaXNOYU4oYXJyMlopICYmIGlzTmFOKGFycjFaKSkpIHJldHVybiBlbGVtZW50MjtcblxuICAvLyBJcyBvbmUgZWxlbWVudCBhIGRlc2NlbmRlbnQgb2YgdGhlIG90aGVyP1xuICB2YXIgY29tbW9uQW5jZXN0b3IgPSBmaW5kQ29tbW9uQW5jZXN0b3IoYXJyMSwgYXJyMik7XG4gIGlmIChjb21tb25BbmNlc3RvciA9PSBlbGVtZW50MSkgcmV0dXJuIGVsZW1lbnQyO1xuICBpZiAoY29tbW9uQW5jZXN0b3IgPT0gZWxlbWVudDIpIHJldHVybiBlbGVtZW50MTtcblxuICAvLyBPSywgd2hpY2ggaGFzIHRoZSBvbGRlc3QgY29tbW9uIHNpYmxpbmc/IChHcmVhdGVyIGluZGV4IG9mIGNoaWxkIG5vZGUgZm9yIGFuIGVsZW1lbnQgPSBcIm9sZGVyXCIgY2hpbGQpXG4gIHZhciBpbmRleE9mQ29tbW9uQW5jZXN0b3I7XG4gIGZvciAodmFyIGk9MDsgaTxhcnIxLmxlbmd0aDsgaSsrKXtcbiAgICBpZiAoYXJyMVtpXSA9PSBjb21tb25BbmNlc3Rvcikge1xuICAgICAgaW5kZXhPZkNvbW1vbkFuY2VzdG9yID0gaTtcbiAgICAgIGJyZWFrO1xuICAgIH1cbiAgfVxuXG4gIGZvciAodmFyIGo9Y29tbW9uQW5jZXN0b3IuY2hpbGROb2Rlcy5sZW5ndGg7IGo+PTA7IGotLSkge1xuICAgIGlmIChhcnIxW2luZGV4T2ZDb21tb25BbmNlc3RvcisxXSA9PSBjb21tb25BbmNlc3Rvci5jaGlsZE5vZGVzW2pdKSByZXR1cm4gZWxlbWVudDE7XG4gICAgaWYgKGFycjJbaW5kZXhPZkNvbW1vbkFuY2VzdG9yKzFdID09IGNvbW1vbkFuY2VzdG9yLmNoaWxkTm9kZXNbal0pIHJldHVybiBlbGVtZW50MjtcbiAgfSAgIFxufVxubW9kdWxlLmV4cG9ydHMgPSBmaW5kSGlnaGVzdEFic29sdXRlSW5kZXg7Il19
