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
},{}],3:[function(require,module,exports){


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
},{"./topmost":4}],4:[function(require,module,exports){
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
},{}]},{},[1])(1)
});
//# sourceMappingURL=data:application/json;charset:utf-8;base64,eyJ2ZXJzaW9uIjozLCJzb3VyY2VzIjpbIm5vZGVfbW9kdWxlcy9ncnVudC1icm93c2VyaWZ5L25vZGVfbW9kdWxlcy9icm93c2VyaWZ5L25vZGVfbW9kdWxlcy9icm93c2VyLXBhY2svX3ByZWx1ZGUuanMiLCJzcmMvY3Vyem9yeS5qcyIsInNyYy9saWIvQ3Vyc29yLmpzIiwic3JjL2xpYi9DdXJzb3JNYW5hZ2VyLmpzIiwic3JjL2xpYi90b3Btb3N0LmpzIl0sIm5hbWVzIjpbXSwibWFwcGluZ3MiOiJBQUFBO0FDQUE7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7O0FDVEE7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7O0FDOUhBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBOztBQ3JaQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBIiwiZmlsZSI6ImdlbmVyYXRlZC5qcyIsInNvdXJjZVJvb3QiOiIiLCJzb3VyY2VzQ29udGVudCI6WyIoZnVuY3Rpb24gZSh0LG4scil7ZnVuY3Rpb24gcyhvLHUpe2lmKCFuW29dKXtpZighdFtvXSl7dmFyIGE9dHlwZW9mIHJlcXVpcmU9PVwiZnVuY3Rpb25cIiYmcmVxdWlyZTtpZighdSYmYSlyZXR1cm4gYShvLCEwKTtpZihpKXJldHVybiBpKG8sITApO3ZhciBmPW5ldyBFcnJvcihcIkNhbm5vdCBmaW5kIG1vZHVsZSAnXCIrbytcIidcIik7dGhyb3cgZi5jb2RlPVwiTU9EVUxFX05PVF9GT1VORFwiLGZ9dmFyIGw9bltvXT17ZXhwb3J0czp7fX07dFtvXVswXS5jYWxsKGwuZXhwb3J0cyxmdW5jdGlvbihlKXt2YXIgbj10W29dWzFdW2VdO3JldHVybiBzKG4/bjplKX0sbCxsLmV4cG9ydHMsZSx0LG4scil9cmV0dXJuIG5bb10uZXhwb3J0c312YXIgaT10eXBlb2YgcmVxdWlyZT09XCJmdW5jdGlvblwiJiZyZXF1aXJlO2Zvcih2YXIgbz0wO288ci5sZW5ndGg7bysrKXMocltvXSk7cmV0dXJuIHN9KSIsInZhclxuICBDdXJzb3JNYW5hZ2VyID0gcmVxdWlyZSgnLi9saWIvQ3Vyc29yTWFuYWdlcicpLFxuICBDdXJzb3IgPSByZXF1aXJlKCcuL2xpYi9DdXJzb3InKTtcbiAgY3Vyc29yTWFuYWdlciA9IG5ldyBDdXJzb3JNYW5hZ2VyKCk7XG5cbm1vZHVsZS5leHBvcnRzID0gZnVuY3Rpb24gY3Vyem9yeShlbGVtZW50LCBvcHRpb25zKSB7XG4gIHZhciBjdXJzb3IgPSBuZXcgQ3Vyc29yKGVsZW1lbnQsIG9wdGlvbnMpO1xuICBjdXJzb3JNYW5hZ2VyLmFkZChjdXJzb3IpO1xuICByZXR1cm4gY3Vyc29yO1xufTsiLCJ2YXJcbiAgbWVyZ2UgPSBmdW5jdGlvbigpIHtcbiAgICB2YXIgb2JqID0ge30sXG4gICAgICBpID0gMCxcbiAgICAgIGlsID0gYXJndW1lbnRzLmxlbmd0aCxcbiAgICAgIGtleTtcbiAgICBmb3IgKDsgaSA8IGlsOyBpKyspIHtcbiAgICAgIGZvciAoa2V5IGluIGFyZ3VtZW50c1tpXSkge1xuICAgICAgICBpZiAoYXJndW1lbnRzW2ldLmhhc093blByb3BlcnR5KGtleSkpIHtcbiAgICAgICAgICAgIG9ialtrZXldID0gYXJndW1lbnRzW2ldW2tleV07XG4gICAgICAgIH1cbiAgICAgIH1cbiAgICB9XG4gICAgcmV0dXJuIG9iajtcbiAgfVxuXG4gIGNyZWF0ZUVsZW1lbnQgPSBmdW5jdGlvbihzdHJpbmcpIHtcbiAgICB2YXIgZWxlbWVudCA9IGRvY3VtZW50LmNyZWF0ZUVsZW1lbnQoJ2RpdicpO1xuICAgIGVsZW1lbnQuaW5uZXJIVE1MID0gc3RyaW5nO1xuICAgIHZhciByZXN1bHQgPSBlbGVtZW50LmZpcnN0Q2hpbGQ7XG4gICAgZWxlbWVudC5yZW1vdmVDaGlsZChyZXN1bHQpO1xuICAgIHJldHVybiByZXN1bHQ7XG4gIH0sXG5cbiAgaXNIVE1MID0gZnVuY3Rpb24oc3RyaW5nKSB7XG4gICAgcmV0dXJuIHR5cGVvZiBzdHJpbmcgPT09ICdzdHJpbmcnICYmIHN0cmluZy5tYXRjaCgvPFxcLz9cXHcrKChcXHMrXFx3KyhcXHMqPVxccyooPzpcIi4qP1wifCcuKj8nfFteJ1wiPlxcc10rKSk/KStcXHMqfFxccyopXFwvPz4vKTtcbiAgfSxcbiAgXG5cbiAgZ2V0RWxlbWVudCA9IGZ1bmN0aW9uKHZhbHVlLCBwYXJlbnQpIHtcbiAgXG4gICAgdmFsdWUgPSB2YWx1ZSBpbnN0YW5jZW9mIEFycmF5ID8gdmFsdWVbMF0gOiB2YWx1ZTtcbiAgICBcbiAgICBpZiAodHlwZW9mIHZhbHVlID09PSAnZnVuY3Rpb24nKSB7XG4gICAgICB2YWx1ZSA9IHZhbHVlLmNhbGwodGhpcywgdmFsdWUpO1xuICAgIH1cbiAgICBcbiAgICBpZiAodHlwZW9mIHZhbHVlID09PSAnc3RyaW5nJykge1xuICAgICAgaWYgKGlzSFRNTCh2YWx1ZSkpIHtcbiAgICAgICAgdmFsdWUgPSBjcmVhdGVFbGVtZW50KHZhbHVlKTtcbiAgICAgIH0gZWxzZSB7XG4gICAgICAgIHZhbHVlID0gcGFyZW50LnF1ZXJ5U2VsZWN0b3IodmFsdWUpO1xuICAgICAgfVxuICAgIH1cbiAgICBcbiAgICBpZiAodmFsdWUgJiYgdmFsdWUubm9kZU5hbWUpIHtcbiAgICAgIHJldHVybiB2YWx1ZTtcbiAgICB9XG4gICAgXG4gICAgcmV0dXJuIG51bGw7XG4gIH07XG5cbm1vZHVsZS5leHBvcnRzID0gZnVuY3Rpb24gQ3Vyc29yKGVsZW1lbnQsIG9wdGlvbnMpIHtcbiAgICBcbiAgZnVuY3Rpb24gc2V0KG5hbWUsIHZhbHVlKSB7XG4gICAgdmFyIG9wdHM7XG4gICAgaWYgKHR5cGVvZiBuYW1lID09PSAnb2JqZWN0Jykge1xuICAgICAgb3B0cyA9IG5hbWU7XG4gICAgfSBlbHNlIHtcbiAgICAgIG9wdHMgPSB7fTtcbiAgICAgIG9wdHNbbmFtZV0gPSB2YWx1ZTtcbiAgICB9XG4gICAgZm9yIChuYW1lIGluIG9wdHMpIHtcbiAgICAgIHZhbHVlID0gb3B0c1tuYW1lXTtcbiAgICAgIHN3aXRjaCAobmFtZSkge1xuICAgICAgICBjYXNlICdlbGVtZW50JzpcbiAgICAgICAgY2FzZSAnc3ltYm9sJzpcbiAgICAgICAgICBpZiAoaXNIVE1MKHZhbHVlKSkge1xuICAgICAgICAgICAgdmFsdWUgPSBjcmVhdGVFbGVtZW50KHZhbHVlKTtcbiAgICAgICAgICB9XG4gICAgICAgICAgYnJlYWs7XG4gICAgICB9XG4gICAgICBvcHRzW25hbWVdID0gdmFsdWU7XG4gICAgfVxuICAgIG9wdGlvbnMgPSBtZXJnZShvcHRpb25zLCBvcHRzKTtcbiAgfTtcbiAgXG4gIHRoaXMuc2V0ID0gZnVuY3Rpb24oKSB7XG4gICAgc2V0LmNhbGwodGhpcywgYXJndW1lbnRzKTtcbiAgICBjdXJzb3JNYW5hZ2VyLnVwZGF0ZSgpO1xuICB9O1xuICBcbiAgdGhpcy5nZXQgPSBmdW5jdGlvbihuYW1lKSB7XG4gICAgdmFyIHZhbHVlO1xuICAgIGlmICghbmFtZSkge1xuICAgICAgdmFsdWUgPSB7fTtcbiAgICAgIGZvciAodmFyIHggaW4gb3B0aW9ucykge1xuICAgICAgICB2YWx1ZVt4XSA9IHRoaXMuZ2V0KHgpO1xuICAgICAgfVxuICAgIH0gZWxzZSB7XG4gICAgICB2YWx1ZSA9IG9wdGlvbnNbbmFtZV07XG4gICAgICBzd2l0Y2ggKG5hbWUpIHtcbiAgICAgICAgY2FzZSAnZWxlbWVudCc6XG4gICAgICAgIGNhc2UgJ3N5bWJvbCc6XG4gICAgICAgIGNhc2UgJ2JvdW5kcyc6XG4gICAgICAgIGNhc2UgJ3RhcmdldCc6XG4gICAgICAgICAgdmFsdWUgPSB2YWx1ZSBpbnN0YW5jZW9mIEFycmF5ID8gdmFsdWVbMF0gOiB2YWx1ZTtcbiAgICAgICAgICAvL3ZhbHVlID0gdHlwZW9mIHZhbHVlID09PSAnZnVuY3Rpb24nID8gdmFsdWUuY2FsbCh0aGlzLCB2YWx1ZSkgOiB2YWx1ZTtcbiAgICAgICAgICB2YWx1ZSA9IHR5cGVvZiB2YWx1ZSA9PT0gJ3N0cmluZycgPyAoZWxlbWVudCB8fCBkb2N1bWVudCkucXVlcnlTZWxlY3Rvcih2YWx1ZSkgOiB2YWx1ZTtcbiAgICAgICAgICBicmVhaztcbiAgICAgIH1cbiAgICAgIHN3aXRjaCAobmFtZSkge1xuICAgICAgICBjYXNlICdzeW1ib2wnOlxuICAgICAgICAgIHZhbHVlID0gdmFsdWUgfHwgdGhpcy5nZXQoJ2VsZW1lbnQnKTtcbiAgICAgICAgICBicmVhaztcbiAgICAgICAgY2FzZSAnYm91bmRzJzpcbiAgICAgICAgICB2YWx1ZSA9IHZhbHVlID8gdmFsdWUgOiBvcHRpb25zWydzeW1ib2wnXSA/IHRoaXMuZ2V0KCdlbGVtZW50JykgOiB0aGlzLmdldCgnZWxlbWVudCcpLm9mZnNldFBhcmVudDtcbiAgICAgICAgICBicmVhaztcbiAgICAgIH1cbiAgICB9XG4gICAgcmV0dXJuIHZhbHVlO1xuICB9O1xuICBcbiAgc2V0KG1lcmdlKHtcbiAgICBlbGVtZW50OiBudWxsLFxuICAgIG9mZnNldDoge2xlZnQ6IDgsIHRvcDogNn0sXG4gICAgc3R5bGU6ICd0cmFuc2Zvcm0nLFxuICAgIHNjYWxlOiAxLFxuICAgIGJvdW5kczogbnVsbCxcbiAgICBzeW1ib2w6IG51bGwsXG4gICAgdGFyZ2V0OiBudWxsLFxuICAgIGhpZGVPbkZvY3VzOiBmYWxzZVxuICB9LCBvcHRpb25zLCB7XG4gICAgZWxlbWVudDogZWxlbWVudFxuICB9KSk7XG4gIFxufTsiLCJcblxudmFyXG4gIFxuICB0b3Btb3N0ID0gcmVxdWlyZSgnLi90b3Btb3N0JyksXG4gIFxuICAvKipcbiAgICogSHlwaGVuYXRlIGEgc3RyaW5nXG4gICAqIEBwYXJhbSB7U3RyaW5nfSBzdHJpbmdcbiAgICovXG4gIGh5cGhlbmF0ZSA9IChmdW5jdGlvbigpIHtcbiAgICB2YXIgY2FjaGUgPSB7fTtcbiAgICByZXR1cm4gZnVuY3Rpb24oc3RyaW5nKSB7XG4gICAgICByZXR1cm4gY2FjaGVbc3RyaW5nXSA9IGNhY2hlW3N0cmluZ10gfHwgKGZ1bmN0aW9uKCkge1xuICAgICAgICByZXR1cm4gc3RyaW5nLnJlcGxhY2UoLyhbQS1aXSkvZywgZnVuY3Rpb24oJDEpe3JldHVybiBcIi1cIiskMS50b0xvd2VyQ2FzZSgpO30pO1xuICAgICAgfSkoKTtcbiAgICB9O1xuICB9KSgpLFxuICBcbiAgZ2V0U3R5bGUgPSBmdW5jdGlvbihlbCwgY3NzcHJvcCl7XG4gICBpZiAoZWwuY3VycmVudFN0eWxlKSAvL0lFXG4gICAgcmV0dXJuIGVsLmN1cnJlbnRTdHlsZVtjc3Nwcm9wXTtcbiAgIGVsc2UgaWYgKGRvY3VtZW50LmRlZmF1bHRWaWV3ICYmIGRvY3VtZW50LmRlZmF1bHRWaWV3LmdldENvbXB1dGVkU3R5bGUpIC8vRmlyZWZveFxuICAgIHJldHVybiBkb2N1bWVudC5kZWZhdWx0Vmlldy5nZXRDb21wdXRlZFN0eWxlKGVsLCBcIlwiKVtjc3Nwcm9wXTtcbiAgIGVsc2UgLy90cnkgYW5kIGdldCBpbmxpbmUgc3R5bGVcbiAgICByZXR1cm4gZWwuc3R5bGVbY3NzcHJvcF07XG4gIH0sXG4gIFxuICB0cmFuc2Zvcm1TdHlsZSA9IChmdW5jdGlvbihwcm9wLCBwcmVmaXhlcykge1xuICAgIHZhciBpLFxuICAgICAgZWxlbSA9IGRvY3VtZW50LmNyZWF0ZUVsZW1lbnQoJ2RpdicpLFxuICAgICAgY2FwaXRhbGl6ZWQgPSBwcm9wLmNoYXJBdCgwKS50b1VwcGVyQ2FzZSgpICsgcHJvcC5zbGljZSgxKTtcbiAgICBmb3IgKGkgPSAwOyBpIDwgcHJlZml4ZXMubGVuZ3RoOyBpKyspIHtcbiAgICAgIGlmICh0eXBlb2YgZWxlbS5zdHlsZVtwcmVmaXhlc1tpXSArIGNhcGl0YWxpemVkXSAhPT0gXCJ1bmRlZmluZWRcIikge1xuICAgICAgICByZXR1cm4gcHJlZml4ZXNbaV0gKyBjYXBpdGFsaXplZDtcbiAgICAgIH1cbiAgICB9XG4gICAgcmV0dXJuIG51bGw7XG4gIH0pKCd0cmFuc2Zvcm0nLCBbJycsICdNb3onLCAnV2Via2l0JywgJ08nLCAnTXMnXSksXG4gIFxuICBpc0NoaWxkT2YgPSBmdW5jdGlvbihwYXJlbnQsIGNoaWxkKSB7XG4gICBpZiAoIWNoaWxkIHx8ICFwYXJlbnQpIHtcbiAgICAgcmV0dXJuIGZhbHNlO1xuICAgfVxuICAgdmFyIG5vZGUgPSBjaGlsZC5wYXJlbnROb2RlO1xuICAgd2hpbGUgKG5vZGUgIT0gbnVsbCkge1xuICAgICBpZiAobm9kZSA9PSBwYXJlbnQpIHtcbiAgICAgICAgIHJldHVybiB0cnVlO1xuICAgICB9XG4gICAgIG5vZGUgPSBub2RlLnBhcmVudE5vZGU7XG4gICB9XG4gICByZXR1cm4gZmFsc2U7XG4gIH0sXG4gIFxuICBjc3MgPSBmdW5jdGlvbihlbGVtLCBuYW1lLCB2YWx1ZSkge1xuICAgIHZhciBtYXAgPSB7fSwgY3NzVGV4dCA9IG51bGw7XG4gICAgaWYgKHR5cGVvZiBuYW1lID09PSAnb2JqZWN0Jykge1xuICAgICAgbWFwID0gbmFtZTtcbiAgICB9IGVsc2UgaWYgKHR5cGVvZiB2YWx1ZSAhPT0gXCJ1bmRlZmluZWRcIikge1xuICAgICAgbWFwW25hbWVdID0gdmFsdWU7XG4gICAgfVxuICAgIHZhciBrZXlzID0gT2JqZWN0LmtleXMobWFwKTtcbiAgICBrZXlzID0ga2V5cy5maWx0ZXIoZnVuY3Rpb24oa2V5LCBpbmRleCkge1xuICAgICAgaWYgKG1hcFtrZXldID09PSAnJykge1xuICAgICAgICBlbGVtLnN0eWxlW2tleV0gPSBtYXBba2V5XTtcbiAgICAgICAgcmV0dXJuIGZhbHNlO1xuICAgICAgfVxuICAgICAgcmV0dXJuIHRydWU7XG4gICAgfSk7XG4gICAgY3NzVGV4dCA9IGtleXMubWFwKGZ1bmN0aW9uKG5hbWUpIHtcbiAgICAgIHJldHVybiBoeXBoZW5hdGUobmFtZSkgKyBcIjogXCIgKyBtYXBbbmFtZV07XG4gICAgfSkuam9pbihcIjsgXCIpO1xuICAgIGlmIChjc3NUZXh0ICYmIGNzc1RleHQubGVuZ3RoKSB7XG4gICAgICBlbGVtLnN0eWxlLmNzc1RleHQgPSBlbGVtLnN0eWxlLmNzc1RleHQgKyBjc3NUZXh0O1xuICAgICAgcmV0dXJuIG51bGw7XG4gICAgfVxuICAgIHJldHVybiBlbGVtLnN0eWxlW25hbWVdIHx8IHdpbmRvdy5nZXRDb21wdXRlZFN0eWxlKGVsZW0sIG51bGwpLmdldFByb3BlcnR5VmFsdWUobmFtZSk7XG4gIH0sXG4gIFxuICBvZmZzZXQgPSBmdW5jdGlvbihlbGVtZW50KSB7XG4gICAgdmFyIHNjcm9sbE9mZnNldCA9IHNjcm9sbE9mZnNldCgpO1xuICAgIHZhciByZWN0ID0gZWxlbWVudC5nZXRCb3VuZGluZ0NsaWVudFJlY3QoKSwgYm9keUVsZW1lbnQgPSBkb2N1bWVudC5ib2R5O1xuICAgIHJldHVybiB7XG4gICAgICB0b3A6IHJlY3QudG9wICsgc2Nyb2xsT2Zmc2V0LnRvcCxcbiAgICAgIGxlZnQ6IHJlY3QubGVmdCArIHNjcm9sbE9mZnNldC5sZWZ0XG4gICAgfTtcbiAgfSxcbiAgXG4gIGdldFNjcm9sbE9mZnNldCA9IGZ1bmN0aW9uKCkge1xuICAgIHJldHVybiB7XG4gICAgICBsZWZ0OiBkb2N1bWVudC5ib2R5LnNjcm9sbExlZnQgKyBkb2N1bWVudC5kb2N1bWVudEVsZW1lbnQuc2Nyb2xsTGVmdCxcbiAgICAgIHRvcDogZG9jdW1lbnQuYm9keS5zY3JvbGxUb3AgKyBkb2N1bWVudC5kb2N1bWVudEVsZW1lbnQuc2Nyb2xsVG9wXG4gICAgfTtcbiAgfSxcbiAgXG4gIGdldEJvdW5kaW5nUmVjdCA9IGZ1bmN0aW9uKGVsZW1lbnQpIHtcbiAgICBpZiAoIWVsZW1lbnQpIHtcbiAgICAgIHJldHVybiB7XG4gICAgICAgIHg6IC1JbmZpbml0eSxcbiAgICAgICAgeTogLUluZmluaXR5LFxuICAgICAgICB3aWR0aDogSW5maW5pdHksXG4gICAgICAgIGhlaWdodDogSW5maW5pdHlcbiAgICAgIH07XG4gICAgfVxuICAgIHZhciBzY3JvbGxPZmZzZXQgPSBnZXRTY3JvbGxPZmZzZXQoKTtcbiAgICB2YXIgcmVjdCA9IGVsZW1lbnQuZ2V0Qm91bmRpbmdDbGllbnRSZWN0KCk7XG4gICAgcmV0dXJuIHtcbiAgICAgIHg6IHJlY3QueCArIHNjcm9sbE9mZnNldC5sZWZ0LFxuICAgICAgeTogcmVjdC55ICsgc2Nyb2xsT2Zmc2V0LnRvcCxcbiAgICAgIHdpZHRoOiByZWN0LndpZHRoLFxuICAgICAgaGVpZ2h0OiByZWN0LmhlaWdodFxuICAgIH07XG4gIH0sXG4gIFxuICAvLyBEZWNsYXJlIHNpbmdsZXRvbiBpbnN0YW5jZVxuICBpbnN0YW5jZSA9IG51bGw7XG5cbi8qKlxuICogQ3Vyc29yTWFuYWdlclxuICogVGhpcyBzaW5nbGV0b24gY2xhc3MgaGFuZGxlcyBhbGwgY3Vyc29yIG9iamVjdHMgXG4gKiBAcGFyYW0ge09iamVjdH0gb3B0aW9uc1xuICovXG5mdW5jdGlvbiBDdXJzb3JNYW5hZ2VyKG9wdGlvbnMpIHtcbiAgLy8gU2luZ2xldG9uIHBhdHRlcm5cbiAgaWYgKGluc3RhbmNlKSB7XG4gICAgaW5zdGFuY2Uuc2V0KG9wdGlvbnMpO1xuICAgIHJldHVybiBpbnN0YW5jZTtcbiAgfVxuICBpbnN0YW5jZSA9IHRoaXM7XG4gIC8vIEltcGxlbWVudGF0aW9uXG4gIFxuICB2YXIgY3Vyc29ycyA9IFtdO1xuICB2YXIgY2xpZW50ID0ge3g6IDAsIHk6IDB9O1xuICB2YXIgbW91c2UgPSB7eDogLUluZmluaXR5LCB5OiAtSW5maW5pdHksIGVsZW1lbnQ6IG51bGx9O1xuICB2YXIgZXZlbnRzID0gWydtb3VzZWRvd24nLCAnY2xpY2snLCAnc2Nyb2xsJywgJ3Jlc2l6ZScsICdtb3VzZW1vdmUnLCAnbW91c2VvdXQnXTtcbiAgdmFyIGN1cnNvckl0ZW1zID0gW107XG4gIHZhciBjdXJzb3JJdGVtID0gbnVsbDtcbiAgdmFyIGNsaWNraW5nID0gZmFsc2U7XG4gIHZhciBjbGlja2FibGUgPSB0cnVlO1xuICBcbiAgZnVuY3Rpb24gaW5pdCgpIHtcbiAgICBhZGRNb3VzZUxpc3RlbmVycyh3aW5kb3cpO1xuICB9XG4gIFxuICBmdW5jdGlvbiBoYW5kbGVFdmVudChlKSB7XG4gICAgLy8gVXBkYXRlIE1vdXNlIFBvc2l0aW9uXG4gICAgc3dpdGNoIChlLnR5cGUpIHtcbiAgICAgIGNhc2UgJ21vdXNlZG93bic6XG4gICAgICAgIGNsaWNraW5nID0gZmFsc2U7XG4gICAgICAgIGJyZWFrO1xuICAgICAgY2FzZSAnbW91c2VvdXQnOlxuICAgICAgICB2YXIgcmVsYXRlZFRhcmdldCA9IHR5cGVvZiBlLnRvRWxlbWVudCAhPSAndW5kZWZpbmVkJyA/IGUudG9FbGVtZW50IDogZS5yZWxhdGVkVGFyZ2V0O1xuICAgICAgICBpZiAocmVsYXRlZFRhcmdldCA9PT0gbnVsbCkge1xuICAgICAgICAgIG1vdXNlLnggPSAtSW5maW5pdHk7XG4gICAgICAgICAgbW91c2UueSA9IC1JbmZpbml0eTtcbiAgICAgICAgICBtb3VzZS5lbGVtZW50ID0gbnVsbDtcbiAgICAgICAgfVxuICAgICAgICBicmVhaztcbiAgICAgIGNhc2UgJ21vdXNlbW92ZSc6XG4gICAgICAgIC8vIEdldCBtb3VzZSBjb29yZGluYXRlc1xuICAgICAgICAvLyBVcGRhdGUgbW91c2UgY29vcmRpbmF0ZXNcbiAgICAgICAgY2xpZW50LnggPSBlLmNsaWVudFg7XG4gICAgICAgIGNsaWVudC55ID0gZS5jbGllbnRZO1xuICAgICAgZGVmYXVsdDpcbiAgICAgIHZhciBzY3JvbGxPZmZzZXQgPSBnZXRTY3JvbGxPZmZzZXQoKTtcbiAgICAgIG1vdXNlLnggPSBjbGllbnQueCArIHNjcm9sbE9mZnNldC5sZWZ0O1xuICAgICAgbW91c2UueSA9IGNsaWVudC55ICsgc2Nyb2xsT2Zmc2V0LnRvcDtcbiAgICAgIG1vdXNlLmVsZW1lbnQgPSBlLnRhcmdldDtcbiAgICB9XG4gICAgXG4gICAgLy8gR2V0IEN1cnNvciBQcm9wc1xuICAgIGludmFsaWRhdGUuY2FsbCh0aGlzKTtcbiAgICBcbiAgICAvLyBQcm9jZXNzIENsaWNrXG4gICAgc3dpdGNoIChlLnR5cGUpIHtcbiAgICAgIGNhc2UgJ2NsaWNrJzpcbiAgICAgICAgaWYgKCFjbGlja2luZyAmJiBjdXJzb3JJdGVtKSB7XG4gICAgICAgICAgLy9lLnN0b3BJbW1lZGlhdGVQcm9wYWdhdGlvbigpO1xuICAgICAgICAgIC8vZS5wcmV2ZW50RGVmYXVsdCgpO1xuICAgICAgICAgIGNsaWNraW5nID0gdHJ1ZTtcbiAgICAgICAgICBjdXJzb3JJdGVtLnRhcmdldC5jbGljaygpO1xuICAgICAgICB9XG4gICAgICAgIGJyZWFrO1xuICAgIH1cbiAgICAvLyBVcGRhdGUgY3Vyc29yc1xuICAgIHJlbmRlci5jYWxsKGluc3RhbmNlKTtcbiAgfVxuICBcbiAgZnVuY3Rpb24gaXNDbGlja2FibGUoY3Vyc29ySXRlbSkge1xuICAgIHZhciBlbGVtZW50ID0gbW91c2UuZWxlbWVudDtcbiAgICBpZiAoZWxlbWVudCkge1xuICAgICAgaWYgKGN1cnNvckl0ZW0gJiYgY3Vyc29ySXRlbS50YXJnZXQgJiYgY3Vyc29ySXRlbS5zeW1ib2wgIT09IGVsZW1lbnQgJiYgaXNDaGlsZE9mKGN1cnNvckl0ZW0uY29udGFpbmVyLCBlbGVtZW50KSkge1xuICAgICAgICAvL2lmICghb3B0cy5oaWRlT25Gb2N1cyB8fCAhaXNDaGlsZE9mKGVsZW1lbnQsIGRvY3VtZW50LmFjdGl2ZUVsZW1lbnQpICYmIGVsZW1lbnQgIT09IGRvY3VtZW50LmFjdGl2ZUVsZW1lbnQpIHtcbiAgICAgICAgcmV0dXJuIHRydWU7XG4gICAgICB9XG4gICAgfVxuICAgIHJldHVybiBmYWxzZTtcbiAgfSBcbiAgXG4gIGZ1bmN0aW9uIGludmFsaWRhdGUoKSB7XG4gICAgXG4gICAgY3Vyc29ySXRlbXMgPSBjdXJzb3JzLm1hcChmdW5jdGlvbihjdXJzb3IsIGluZGV4KSB7XG4gICAgICByZXR1cm4gZ2V0Q3Vyc29ySXRlbShjdXJzb3IsIGN1cnNvckl0ZW1zW2luZGV4XSk7XG4gICAgfSk7XG4gICAgXG4gICAgY3Vyc29ySXRlbSA9IGN1cnNvckl0ZW1zLmZpbHRlcihmdW5jdGlvbihjdXJzb3JJdGVtLCBpbmRleCkge1xuICAgICAgdmFyIG1vdXNlRWxlbWVudCA9IG1vdXNlLmVsZW1lbnQsIHN5bWJvbCA9IGN1cnNvckl0ZW0uc3ltYm9sLCBib3VuZHMgPSBjdXJzb3JJdGVtLmJvdW5kcywgY29udGFpbmVyID0gY3Vyc29ySXRlbS5jb250YWluZXIsIHJlc3VsdCA9IGZhbHNlO1xuICAgICAgLy8gRGV0ZWN0IGlmIGEgbW91c2UgZWxlbWVudCBleGlzdHMgYW5kIHRoYXQgaXQncyBub3QgdGhlIHN5bWJvbCBpdHNlbGZcbiAgICAgIGlmIChtb3VzZUVsZW1lbnQgJiYgc3ltYm9sICE9PSBtb3VzZUVsZW1lbnQpIHtcbiAgICAgICAgLy8gRGV0ZWN0IGlmIHN5bWJvbCBpcyB0b3Btb3N0IGVsZW1lbnRcbiAgICAgICAgaWYgKHRvcG1vc3QobW91c2VFbGVtZW50LCBzeW1ib2wpID09PSBzeW1ib2wpIHtcbiAgICAgICAgICAvLyBEZXRlY3QgaWYgbW91c2UgZWxlbWVudCBpcyBjb250YWluZWRcbiAgICAgICAgICBpZiAoY29udGFpbmVyID09PSBtb3VzZUVsZW1lbnQgfHwgaXNDaGlsZE9mKGNvbnRhaW5lciwgbW91c2VFbGVtZW50KSkge1xuICAgICAgICAgICAgLy8gTWF0Y2ggYm91bmRzXG4gICAgICAgICAgICByZXN1bHQgPSAobW91c2UueCA+PSBib3VuZHMueCAmJiBtb3VzZS54IDw9IGJvdW5kcy54ICsgYm91bmRzLndpZHRoICYmIG1vdXNlLnkgPj0gYm91bmRzLnkgJiYgbW91c2UueSA8PSBib3VuZHMueSArIGJvdW5kcy5oZWlnaHQpO1xuICAgICAgICAgIH1cbiAgICAgICAgfVxuICAgICAgfVxuICAgICAgcmV0dXJuIHJlc3VsdDtcbiAgICB9KS5zb3J0KGZ1bmN0aW9uKGEsIGIpIHtcbiAgICAgIHZhciB6RWxlbWVudCA9IHRvcG1vc3QoYS5zeW1ib2wsIGIuc3ltYm9sKTtcbiAgICAgIGlmICh6RWxlbWVudCA9PT0gYS5zeW1ib2wpIHtcbiAgICAgICAgcmV0dXJuIGE7XG4gICAgICB9IGVsc2UgaWYgKHpFbGVtZW50ID09PSBiLnN5bWJvbCkge1xuICAgICAgICByZXR1cm4gYjtcbiAgICAgIH1cbiAgICAgIFxuICAgICAgdmFyIHAxID0ge3g6IGEueCArIGEud2lkdGggLyAyLCB5OiBhLnkgKyBhLmhlaWdodCAvIDJ9O1xuICAgICAgdmFyIHAyID0ge3g6IGIueCArIGIud2lkdGggLyAyLCB5OiBiLnkgKyBiLmhlaWdodCAvIDJ9O1xuICAgICAgdmFyIGQxID0gTWF0aC5zcXJ0KCBNYXRoLnBvdygocDEueCAtIG1vdXNlLngpLCAyKSArIE1hdGgucG93KChwMS55IC0gbW91c2UueSksIDIpICk7XG4gICAgICB2YXIgZDIgPSBNYXRoLnNxcnQoIE1hdGgucG93KChwMi54IC0gbW91c2UueCksIDIpICsgTWF0aC5wb3coKHAyLnkgLSBtb3VzZS55KSwgMikgKTtcbiAgICAgIHJldHVybiBkMSA8IGQyID8gZDEgOiBkMSA+IGQyID8gZDIgOiAwO1xuICAgIH0pLnJldmVyc2UoKVswXTtcbiAgICBcbiAgICAvLyBTZXQgTW91c2VQcm92aWRlcnNcbiAgICBzZXRNb3VzZVByb3ZpZGVycyhbd2luZG93XS5jb25jYXQoY3Vyc29ySXRlbXMubWFwKGZ1bmN0aW9uKGl0ZW0pIHtcbiAgICAgIHJldHVybiBpdGVtLmNvbnRhaW5lcjtcbiAgICB9KSkpO1xuICAgIC8vc2V0TW91c2VQcm92aWRlcnMoW3dpbmRvd10pO1xuICB9XG4gIFxuICBmdW5jdGlvbiByZW5kZXIoKSB7XG5cbiAgICBjdXJzb3JJdGVtcy5mb3JFYWNoKGZ1bmN0aW9uKGl0ZW0pIHtcbiAgICAgIGlmIChpdGVtICE9PSBjdXJzb3JJdGVtKSB7XG4gICAgICAgIGNzcyhpdGVtLnN5bWJvbCwge1xuICAgICAgICAgIGRpc3BsYXk6ICdub25lJ1xuICAgICAgICB9KTtcbiAgICAgIH1cbiAgICB9KTtcbiAgICBcbiAgICBpZiAoY3Vyc29ySXRlbSkge1xuICAgICAgdmFyIHN5bWJvbCA9IGN1cnNvckl0ZW0uc3ltYm9sO1xuICAgICAgXG4gICAgICB2YXIgc3R5bGUgPSB7XG4gICAgICAgIGRpc3BsYXk6ICdpbmxpbmUtYmxvY2snXG4gICAgICB9O1xuICAgICAgXG4gICAgICBzdHlsZVt0cmFuc2Zvcm1TdHlsZV0gPSBcIlwiO1xuICAgICAgc3R5bGVbdHJhbnNmb3JtU3R5bGUgKyBcIk9yaWdpblwiXSA9ICcnO1xuICAgICAgXG4gICAgICAkKHN5bWJvbCkuY3NzKHN0eWxlKTtcbiAgICAgIFxuICAgICAgdmFyIHBvcyA9ICQoc3ltYm9sKS5vZmZzZXQoKTtcbiAgICAgIFxuICAgICAgdmFyIHB4ID0gcG9zLmxlZnQ7XG4gICAgICB2YXIgcHkgPSBwb3MudG9wO1xuICAgICAgXG4gICAgICB2YXIgb2ZmID0gY3Vyc29ySXRlbS5vZmZzZXQ7XG4gICAgICB2YXIgeCA9IE1hdGgucm91bmQoKG1vdXNlLnggLSBweCkgKyBvZmYubGVmdCk7XG4gICAgICB2YXIgeSA9IE1hdGgucm91bmQoKG1vdXNlLnkgLSBweSkgKyBvZmYudG9wKTtcbiAgICAgIFxuICAgICAgc3R5bGUgPSB7XG4gICAgICAgIC8vYm9yZGVyOiAnMXB4IHNvbGlkIGJsdWUnXG4gICAgICB9O1xuICAgICAgXG4gICAgICBpZiAoY3Vyc29ySXRlbS5zdHlsZSA9PT0gJ3RyYW5zZm9ybScgJiYgdHJhbnNmb3JtU3R5bGUpIHtcbiAgICAgICAgc3R5bGVbdHJhbnNmb3JtU3R5bGUgKyBcIk9yaWdpblwiXSA9ICcwIDAnO1xuICAgICAgICBzdHlsZVt0cmFuc2Zvcm1TdHlsZV0gPSBcInRyYW5zbGF0ZTNkKFwiICsgeCArIFwicHgsXCIgKyB5ICsgXCJweCwgMCkgc2NhbGUoXCIgKyBjdXJzb3JJdGVtLnNjYWxlICsgXCIsXCIgKyBjdXJzb3JJdGVtLnNjYWxlICsgXCIpXCI7XG4gICAgICB9IGVsc2Uge1xuICAgICAgICBzdHlsZS5sZWZ0ID0geCArIHBvcy5sZWZ0O1xuICAgICAgICBzdHlsZS50b3AgPSB5ICsgcG9zLnRvcDtcbiAgICAgIH1cbiAgICAgIFxuICAgICAgJChzeW1ib2wpLmNzcyhzdHlsZSk7XG4gICAgfVxuICB9O1xuICBcbiAgdGhpcy51cGRhdGUgPSBmdW5jdGlvbigpIHtcbiAgICBpbnZhbGlkYXRlLmNhbGwodGhpcyk7XG4gICAgcmVuZGVyLmNhbGwodGhpcyk7XG4gIH07XG4gIFxuICB0aGlzLmFkZCA9IGZ1bmN0aW9uKGN1cnNvcikge1xuICAgIGlmIChjdXJzb3JzLmluZGV4T2YoY3Vyc29yKSA9PT0gLTEpIHtcbiAgICAgIGN1cnNvcnMucHVzaChjdXJzb3IpO1xuICAgICAgdGhpcy51cGRhdGUoKTtcbiAgICB9XG4gIH07XG4gIFxuICB0aGlzLnJlbW92ZSA9IGZ1bmN0aW9uKGN1cnNvcikge1xuICAgIGN1cnNvcnMuc3BsaWNlKGN1cnNvcnMuaW5kZXhPZihjdXJzb3IpLCAxKTtcbiAgICB0aGlzLnVwZGF0ZSgpO1xuICB9O1xuICBcbiAgdmFyIG1vdXNlUHJvdmlkZXJzID0gW107XG4gIGZ1bmN0aW9uIHNldE1vdXNlUHJvdmlkZXJzKGVsZW1lbnRzKSB7XG4gICAgZWxlbWVudHMgPSAkLmdyZXAoZWxlbWVudHMsIGZ1bmN0aW9uKG4pIHsgcmV0dXJuIChuKTsgfSk7XG4gICAgbW91c2VQcm92aWRlcnMuZm9yRWFjaChmdW5jdGlvbihlbGVtZW50KSB7XG4gICAgICBpZiAoZWxlbWVudHMuaW5kZXhPZihlbGVtZW50KSA9PT0gLTEpIHtcbiAgICAgICAgcmVtb3ZlTW91c2VMaXN0ZW5lcnMoZWxlbWVudCk7XG4gICAgICB9XG4gICAgfSk7XG4gICAgZWxlbWVudHMuZm9yRWFjaChmdW5jdGlvbihlbGVtZW50KSB7XG4gICAgICBpZiAobW91c2VQcm92aWRlcnMuaW5kZXhPZihlbGVtZW50KSA9PT0gLTEpIHtcbiAgICAgICAgYWRkTW91c2VMaXN0ZW5lcnMoZWxlbWVudCk7XG4gICAgICB9XG4gICAgfSk7XG4gICAgbW91c2VQcm92aWRlcnMgPSBlbGVtZW50cztcbiAgfVxuICBcbiAgZnVuY3Rpb24gYWRkTW91c2VMaXN0ZW5lcnMoZWxlbWVudCkge1xuICAgIGZvciAodmFyIGkgPSAwLCBldmVudDsgZXZlbnQgPSBldmVudHNbaV07IGkrKykge1xuICAgICAgZWxlbWVudC5hZGRFdmVudExpc3RlbmVyKGV2ZW50LCBoYW5kbGVFdmVudCk7XG4gICAgfVxuICB9XG4gIFxuICBmdW5jdGlvbiByZW1vdmVNb3VzZUxpc3RlbmVycyhlbGVtZW50KSB7XG4gICAgZm9yICh2YXIgaSA9IDAsIGV2ZW50OyBldmVudCA9IGV2ZW50c1tpXTsgaSsrKSB7XG4gICAgICBlbGVtZW50LnJlbW92ZUV2ZW50TGlzdGVuZXIoZXZlbnQsIGhhbmRsZUV2ZW50KTtcbiAgICB9XG4gIH1cbiAgXG4gIGluaXQuY2FsbCh0aGlzKTtcbiAgXG59XG5cblxuXG5mdW5jdGlvbiBnZXRDdXJzb3JJdGVtKGN1cnNvcikge1xuICBcbiAgdmFyXG4gICAgZWxlbWVudCA9IGN1cnNvci5nZXQoJ2VsZW1lbnQnKSxcbiAgICBwcm9wcywgc3ltYm9sLCBib3VuZHMsIGNvbnRhaW5lciwgb2Zmc2V0LCBzdHlsZSwgc2NhbGU7XG4gICAgXG4gIGNzcyhlbGVtZW50LCB7XG4gICAgZGlzcGxheTogJydcbiAgfSk7XG4gIFxuICBwcm9wcyA9IGN1cnNvci5nZXQoKTtcbiAgXG4gIHN5bWJvbCA9IHByb3BzLnN5bWJvbDtcbiAgYm91bmRzID0gcHJvcHMuYm91bmRzO1xuICBvZmZzZXQgPSBwcm9wcy5vZmZzZXQ7XG4gIHN0eWxlID0gcHJvcHMuc3R5bGU7XG4gIHNjYWxlID0gcHJvcHMuc2NhbGU7XG4gIFxuICAvLyBBZGQgY3Vyc29yIHN5bWJvbCB0byBkb21cbiAgaWYgKCFzeW1ib2wucGFyZW50Tm9kZSkge1xuICAgIGVsZW1lbnQuYXBwZW5kQ2hpbGQoc3ltYm9sKTtcbiAgfVxuICBcbiAgXG4gIC8vIEdldCBib3VuZHNcbiAgdmFyIGNvbnRhaW5lcjtcbiAgaWYgKGJvdW5kcyAmJiBib3VuZHMuZ2V0Qm91bmRpbmdDbGllbnRSZWN0KSB7XG4gICAgLy8gRWxlbWVudCBib3VuZHNcbiAgICBjb250YWluZXIgPSBib3VuZHM7XG4gICAgYm91bmRzID0gZ2V0Qm91bmRpbmdSZWN0KGJvdW5kcyk7XG4gIH0gZWxzZSB7XG4gICAgLy8gT2JqZWN0IGJvdW5kc1xuICAgIGNvbnRhaW5lciA9IHN5bWJvbC5vZmZzZXRQYXJlbnQ7XG4gICAgdmFyIHJlY3QgPSBnZXRCb3VuZGluZ1JlY3QoY29udGFpbmVyKTtcbiAgICB2YXIgY29udGFpbmVyUG9zID0gJChjb250YWluZXIpLm9mZnNldCgpIHx8IHt4OiAwLCB5OiAwfTtcbiAgICAvLyBQcm9jZXNzIGZ1bmN0aW9uIFxuICAgIGlmICh0eXBlb2YgYm91bmRzID09PSAnZnVuY3Rpb24nKSB7XG4gICAgICBib3VuZHMgPSBib3VuZHMoY29udGFpbmVyKTtcbiAgICB9XG4gICAgLy8gR2V0IHBlcmNlbnQgdmFsdWVzXG4gICAgdmFyIHggPSB0eXBlb2YgYm91bmRzLnggPT09ICdzdHJpbmcnICYmIGJvdW5kcy54LmluZGV4T2YoXCIlXCIpID49IDAgPyBwYXJzZUZsb2F0KGJvdW5kcy54KSAqIHJlY3Qud2lkdGggLyAxMDAgOiBwYXJzZUZsb2F0KGJvdW5kcy54KTtcbiAgICB2YXIgeSA9IHR5cGVvZiBib3VuZHMueSA9PT0gJ3N0cmluZycgJiYgYm91bmRzLnkuaW5kZXhPZihcIiVcIikgPj0gMCA/IHBhcnNlRmxvYXQoYm91bmRzLnkpICogcmVjdC5oZWlnaHQgLyAxMDAgOiBwYXJzZUZsb2F0KGJvdW5kcy55KTtcbiAgICB2YXIgd2lkdGggPSB0eXBlb2YgYm91bmRzLndpZHRoID09PSAnc3RyaW5nJyAmJiBib3VuZHMud2lkdGguaW5kZXhPZihcIiVcIikgPj0gMCA/IHBhcnNlRmxvYXQoYm91bmRzLndpZHRoKSAqIHJlY3Qud2lkdGggLyAxMDAgOiBwYXJzZUZsb2F0KGJvdW5kcy53aWR0aCk7XG4gICAgdmFyIGhlaWdodCA9IHR5cGVvZiBib3VuZHMuaGVpZ2h0ID09PSAnc3RyaW5nJyAmJiBib3VuZHMuaGVpZ2h0LmluZGV4T2YoXCIlXCIpID49IDAgPyBwYXJzZUZsb2F0KGJvdW5kcy5oZWlnaHQpICogcmVjdC5oZWlnaHQgLyAxMDAgOiBwYXJzZUZsb2F0KGJvdW5kcy5oZWlnaHQpO1xuICAgIGJvdW5kcyA9IHtcbiAgICAgIHg6IGNvbnRhaW5lclBvcy5sZWZ0ICsgeCxcbiAgICAgIHk6IGNvbnRhaW5lclBvcy50b3AgKyB5LFxuICAgICAgd2lkdGg6IHdpZHRoLFxuICAgICAgaGVpZ2h0OiBoZWlnaHRcbiAgICB9O1xuICB9XG4gIFxuICB2YXIgdGFyZ2V0ID0gcHJvcHMudGFyZ2V0IHx8IHN5bWJvbC5ub2RlTmFtZS50b0xvd2VyQ2FzZSgpID09PSAnYScgPyBzeW1ib2wgOiBlbGVtZW50O1xuICBcbiAgcmV0dXJuIHtcbiAgICBjdXJzb3I6IGN1cnNvcixcbiAgICBzeW1ib2w6IHN5bWJvbCxcbiAgICBib3VuZHM6IGJvdW5kcyxcbiAgICBjb250YWluZXI6IGNvbnRhaW5lcixcbiAgICB0YXJnZXQ6IHRhcmdldCxcbiAgICBvZmZzZXQ6IG9mZnNldCxcbiAgICBzdHlsZTogc3R5bGUsXG4gICAgc2NhbGU6IHNjYWxlXG4gIH07XG59XG5cbm1vZHVsZS5leHBvcnRzID0gQ3Vyc29yTWFuYWdlcjsiLCJ2YXIgXG5cbiAgZ2V0U3R5bGUgPSBmdW5jdGlvbihlbCwgY3NzcHJvcCl7XG4gICAgaWYgKGVsLmN1cnJlbnRTdHlsZSkgLy9JRVxuICAgICAgcmV0dXJuIGVsLmN1cnJlbnRTdHlsZVtjc3Nwcm9wXTtcbiAgICBlbHNlIGlmIChkb2N1bWVudC5kZWZhdWx0VmlldyAmJiBkb2N1bWVudC5kZWZhdWx0Vmlldy5nZXRDb21wdXRlZFN0eWxlKSAvL0ZpcmVmb3hcbiAgICAgIHJldHVybiBkb2N1bWVudC5kZWZhdWx0Vmlldy5nZXRDb21wdXRlZFN0eWxlKGVsLCBcIlwiKVtjc3Nwcm9wXTtcbiAgICBlbHNlIC8vdHJ5IGFuZCBnZXQgaW5saW5lIHN0eWxlXG4gICAgICByZXR1cm4gZWwuc3R5bGVbY3NzcHJvcF07XG4gIH07XG5cbmZ1bmN0aW9uIGdldEFuY2VzdG9yc0FzQXJyYXkoZWxlbWVudCl7XG4gIHZhciBhcnIgPSBuZXcgQXJyYXkoKTtcbiAgYXJyLnVuc2hpZnQoZWxlbWVudCk7XG4gIHdoaWxlIChhcnJbMF0ucGFyZW50Tm9kZSl7XG4gICAgYXJyLnVuc2hpZnQoYXJyWzBdLnBhcmVudE5vZGUpO1xuICB9XG4gIHJldHVybiBhcnI7XG59XG5cbmZ1bmN0aW9uIGhpZ2hlc3RJbml0aWFsWkluZGV4KGVsZW1lbnRBcnIpe1xuICBmb3IgKHZhciBpID0gMDsgaSA8IGVsZW1lbnRBcnIubGVuZ3RoOyBpKyspIHtcbiAgICAgIGlmIChlbGVtZW50QXJyW2ldLnN0eWxlID09IHVuZGVmaW5lZCkgY29udGludWU7XG4gICAgICB2YXIgciA9IGdldFN0eWxlKGVsZW1lbnRBcnJbaV0sICd6SW5kZXgnKTtcbiAgICAgIGlmICghaXNOYU4ocikgJiYgciE9XCJcIikge1xuICAgICAgICAgIHJldHVybiByO1xuICAgICAgfVxuICB9XG4gIHJldHVybiB1bmRlZmluZWQ7XG59XG5cbmZ1bmN0aW9uIGZpbmRDb21tb25BbmNlc3RvcihlbGVtZW50QXJyMSwgZWxlbWVudEFycjIpe1xuICB2YXIgY29tbW9uQW5jZXN0b3I7XG4gIGZvciAodmFyIGk9MDsgaTxlbGVtZW50QXJyMS5sZW5ndGg7IGkrKyl7XG4gICAgaWYgKGVsZW1lbnRBcnIxW2ldID09IGVsZW1lbnRBcnIyW2ldKSB7XG4gICAgICAgIGNvbW1vbkFuY2VzdG9yID0gZWxlbWVudEFycjFbaV07XG4gICAgfVxuICB9XG4gIHJldHVybiBjb21tb25BbmNlc3Rvcjtcbn1cblxuZnVuY3Rpb24gZmluZEhpZ2hlc3RBYnNvbHV0ZUluZGV4KGVsZW1lbnQxLCBlbGVtZW50Mil7XG4gIHZhciBhcnIxID0gZ2V0QW5jZXN0b3JzQXNBcnJheShlbGVtZW50MSk7XG4gIHZhciBhcnIyID0gZ2V0QW5jZXN0b3JzQXNBcnJheShlbGVtZW50Mik7XG5cbiAgLy8gRG9lcyBhbiBhbmNlc3RvciBvZiBvbmUgZWxtZW50IHNpbXBseSBoYXZlIGEgaGlnaGVyIHotaW5kZXg/XG4gIHZhciBhcnIxWiA9IGhpZ2hlc3RJbml0aWFsWkluZGV4KGFycjEpO1xuICB2YXIgYXJyMlogPSBoaWdoZXN0SW5pdGlhbFpJbmRleChhcnIyKTtcbiAgaWYgKGFycjFaID4gYXJyMlogfHwgKCFpc05hTihhcnIxWikgJiYgaXNOYU4oYXJyMlopKSkgcmV0dXJuIGVsZW1lbnQxO1xuICBpZiAoYXJyMlogPiBhcnIxWiB8fCAoIWlzTmFOKGFycjJaKSAmJiBpc05hTihhcnIxWikpKSByZXR1cm4gZWxlbWVudDI7XG5cbiAgLy8gSXMgb25lIGVsZW1lbnQgYSBkZXNjZW5kZW50IG9mIHRoZSBvdGhlcj9cbiAgdmFyIGNvbW1vbkFuY2VzdG9yID0gZmluZENvbW1vbkFuY2VzdG9yKGFycjEsIGFycjIpO1xuICBpZiAoY29tbW9uQW5jZXN0b3IgPT0gZWxlbWVudDEpIHJldHVybiBlbGVtZW50MjtcbiAgaWYgKGNvbW1vbkFuY2VzdG9yID09IGVsZW1lbnQyKSByZXR1cm4gZWxlbWVudDE7XG5cbiAgLy8gT0ssIHdoaWNoIGhhcyB0aGUgb2xkZXN0IGNvbW1vbiBzaWJsaW5nPyAoR3JlYXRlciBpbmRleCBvZiBjaGlsZCBub2RlIGZvciBhbiBlbGVtZW50ID0gXCJvbGRlclwiIGNoaWxkKVxuICB2YXIgaW5kZXhPZkNvbW1vbkFuY2VzdG9yO1xuICBmb3IgKHZhciBpPTA7IGk8YXJyMS5sZW5ndGg7IGkrKyl7XG4gICAgaWYgKGFycjFbaV0gPT0gY29tbW9uQW5jZXN0b3IpIHtcbiAgICAgIGluZGV4T2ZDb21tb25BbmNlc3RvciA9IGk7XG4gICAgICBicmVhaztcbiAgICB9XG4gIH1cblxuICBmb3IgKHZhciBqPWNvbW1vbkFuY2VzdG9yLmNoaWxkTm9kZXMubGVuZ3RoOyBqPj0wOyBqLS0pIHtcbiAgICBpZiAoYXJyMVtpbmRleE9mQ29tbW9uQW5jZXN0b3IrMV0gPT0gY29tbW9uQW5jZXN0b3IuY2hpbGROb2Rlc1tqXSkgcmV0dXJuIGVsZW1lbnQxO1xuICAgIGlmIChhcnIyW2luZGV4T2ZDb21tb25BbmNlc3RvcisxXSA9PSBjb21tb25BbmNlc3Rvci5jaGlsZE5vZGVzW2pdKSByZXR1cm4gZWxlbWVudDI7XG4gIH0gICBcbn1cbm1vZHVsZS5leHBvcnRzID0gZmluZEhpZ2hlc3RBYnNvbHV0ZUluZGV4OyJdfQ==
