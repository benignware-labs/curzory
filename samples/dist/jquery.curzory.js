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
  },

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
  
  getOffset = function(element) {
    var scrollOffset = getScrollOffset();
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
    if (!('ontouch' in window)) {
      addMouseListeners(window);
    }
  }
  
  function handleEvent(e) {
    // Check for access to event's type property
    try {
      e.type;
    } catch (e) {
      //console.warn(e);
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
          if (mouse.element && cursorItem && cursorItem.target && cursorItem.symbol !== mouse.element && isChildOf(cursorItem.container, mouse.element)) {
            //e.stopImmediatePropagation();
            //e.preventDefault();
            clicking = true;
            cursorItem.target.click();
          }
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
        display: 'inline-block',
        position: 'absolute'
      };
      
      style[transformStyle] = "";
      style[transformStyle + "Origin"] = '';
      
      css(symbol, style);
      
      var pos = getOffset(symbol);
      
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
      
      css(symbol, style);
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
    container = symbol.offsetParent;
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
  if (!commonAncestor) {
    return element1;
  }
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
//# sourceMappingURL=data:application/json;charset:utf-8;base64,eyJ2ZXJzaW9uIjozLCJzb3VyY2VzIjpbIm5vZGVfbW9kdWxlcy9ncnVudC1icm93c2VyaWZ5L25vZGVfbW9kdWxlcy9icm93c2VyaWZ5L25vZGVfbW9kdWxlcy9icm93c2VyLXBhY2svX3ByZWx1ZGUuanMiLCJzcmMvY3Vyem9yeS5qcyIsInNyYy9qcXVlcnkuY3Vyem9yeS5qcyIsInNyYy9saWIvQ3Vyc29yLmpzIiwic3JjL2xpYi9DdXJzb3JNYW5hZ2VyLmpzIiwic3JjL2xpYi90b3Btb3N0LmpzIl0sIm5hbWVzIjpbXSwibWFwcGluZ3MiOiJBQUFBO0FDQUE7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7O0FDVEE7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTs7QUNuQkE7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBOztBQzdIQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBOztBQy9aQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBIiwiZmlsZSI6ImdlbmVyYXRlZC5qcyIsInNvdXJjZVJvb3QiOiIiLCJzb3VyY2VzQ29udGVudCI6WyIoZnVuY3Rpb24gZSh0LG4scil7ZnVuY3Rpb24gcyhvLHUpe2lmKCFuW29dKXtpZighdFtvXSl7dmFyIGE9dHlwZW9mIHJlcXVpcmU9PVwiZnVuY3Rpb25cIiYmcmVxdWlyZTtpZighdSYmYSlyZXR1cm4gYShvLCEwKTtpZihpKXJldHVybiBpKG8sITApO3ZhciBmPW5ldyBFcnJvcihcIkNhbm5vdCBmaW5kIG1vZHVsZSAnXCIrbytcIidcIik7dGhyb3cgZi5jb2RlPVwiTU9EVUxFX05PVF9GT1VORFwiLGZ9dmFyIGw9bltvXT17ZXhwb3J0czp7fX07dFtvXVswXS5jYWxsKGwuZXhwb3J0cyxmdW5jdGlvbihlKXt2YXIgbj10W29dWzFdW2VdO3JldHVybiBzKG4/bjplKX0sbCxsLmV4cG9ydHMsZSx0LG4scil9cmV0dXJuIG5bb10uZXhwb3J0c312YXIgaT10eXBlb2YgcmVxdWlyZT09XCJmdW5jdGlvblwiJiZyZXF1aXJlO2Zvcih2YXIgbz0wO288ci5sZW5ndGg7bysrKXMocltvXSk7cmV0dXJuIHN9KSIsInZhclxuICBDdXJzb3JNYW5hZ2VyID0gcmVxdWlyZSgnLi9saWIvQ3Vyc29yTWFuYWdlcicpLFxuICBDdXJzb3IgPSByZXF1aXJlKCcuL2xpYi9DdXJzb3InKTtcbiAgY3Vyc29yTWFuYWdlciA9IG5ldyBDdXJzb3JNYW5hZ2VyKCk7XG5cbm1vZHVsZS5leHBvcnRzID0gZnVuY3Rpb24gY3Vyem9yeShlbGVtZW50LCBvcHRpb25zKSB7XG4gIHZhciBjdXJzb3IgPSBuZXcgQ3Vyc29yKGVsZW1lbnQsIG9wdGlvbnMpO1xuICBjdXJzb3JNYW5hZ2VyLmFkZChjdXJzb3IpO1xuICByZXR1cm4gY3Vyc29yO1xufTsiLCJ2YXJcbiAgY3Vyem9yeSA9IHJlcXVpcmUoJy4vY3Vyem9yeScpLFxuICAkO1xuICBcbmlmICgkID0galF1ZXJ5KSB7XG4gICQuZm4uZXh0ZW5kKHtcbiAgICBjdXJ6b3J5OiBmdW5jdGlvbihvcHRpb25zKSB7XG4gICAgICByZXR1cm4gdGhpcy5lYWNoKGZ1bmN0aW9uKCkge1xuICAgICAgICB2YXIgY3Vyc29yID0gJCh0aGlzKS5kYXRhKCdjdXJ6b3J5Jyk7XG4gICAgICAgIGlmICghY3Vyc29yKSB7XG4gICAgICAgICAgY3Vyc29yID0gY3Vyem9yeSh0aGlzLCBvcHRpb25zKTtcbiAgICAgICAgICAkKHRoaXMpLmRhdGEoJ2N1cnpvcnknLCBjdXJzb3IpO1xuICAgICAgICB9IGVsc2Uge1xuICAgICAgICAgIGN1cnNvci5zZXQob3B0aW9ucyk7XG4gICAgICAgIH1cbiAgICAgICAgcmV0dXJuICQodGhpcyk7XG4gICAgICB9KTtcbiAgICB9XG4gIH0pO1xufSIsInZhclxuICBtZXJnZSA9IGZ1bmN0aW9uKCkge1xuICAgIHZhciBvYmogPSB7fSxcbiAgICAgIGkgPSAwLFxuICAgICAgaWwgPSBhcmd1bWVudHMubGVuZ3RoLFxuICAgICAga2V5O1xuICAgIGZvciAoOyBpIDwgaWw7IGkrKykge1xuICAgICAgZm9yIChrZXkgaW4gYXJndW1lbnRzW2ldKSB7XG4gICAgICAgIGlmIChhcmd1bWVudHNbaV0uaGFzT3duUHJvcGVydHkoa2V5KSkge1xuICAgICAgICAgICAgb2JqW2tleV0gPSBhcmd1bWVudHNbaV1ba2V5XTtcbiAgICAgICAgfVxuICAgICAgfVxuICAgIH1cbiAgICByZXR1cm4gb2JqO1xuICB9LFxuXG4gIGNyZWF0ZUVsZW1lbnQgPSBmdW5jdGlvbihzdHJpbmcpIHtcbiAgICB2YXIgZWxlbWVudCA9IGRvY3VtZW50LmNyZWF0ZUVsZW1lbnQoJ2RpdicpO1xuICAgIGVsZW1lbnQuaW5uZXJIVE1MID0gc3RyaW5nO1xuICAgIHZhciByZXN1bHQgPSBlbGVtZW50LmZpcnN0Q2hpbGQ7XG4gICAgZWxlbWVudC5yZW1vdmVDaGlsZChyZXN1bHQpO1xuICAgIHJldHVybiByZXN1bHQ7XG4gIH0sXG5cbiAgaXNIVE1MID0gZnVuY3Rpb24oc3RyaW5nKSB7XG4gICAgcmV0dXJuIHR5cGVvZiBzdHJpbmcgPT09ICdzdHJpbmcnICYmIHN0cmluZy5tYXRjaCgvPFxcLz9cXHcrKChcXHMrXFx3KyhcXHMqPVxccyooPzpcIi4qP1wifCcuKj8nfFteJ1wiPlxcc10rKSk/KStcXHMqfFxccyopXFwvPz4vKTtcbiAgfSxcbiAgXG5cbiAgZ2V0RWxlbWVudCA9IGZ1bmN0aW9uKHZhbHVlLCBwYXJlbnQpIHtcbiAgXG4gICAgdmFsdWUgPSB2YWx1ZS50b0FycmF5ID8gdmFsdWUudG9BcnJheSgpWzBdIDogdmFsdWUgaW5zdGFuY2VvZiBBcnJheSA/IHZhbHVlWzBdIDogdmFsdWU7XG4gICAgXG4gICAgaWYgKHR5cGVvZiB2YWx1ZSA9PT0gJ2Z1bmN0aW9uJykge1xuICAgICAgdmFsdWUgPSB2YWx1ZS5jYWxsKHRoaXMsIHZhbHVlKTtcbiAgICB9XG4gICAgXG4gICAgaWYgKHR5cGVvZiB2YWx1ZSA9PT0gJ3N0cmluZycpIHtcbiAgICAgIGlmIChpc0hUTUwodmFsdWUpKSB7XG4gICAgICAgIHZhbHVlID0gY3JlYXRlRWxlbWVudCh2YWx1ZSk7XG4gICAgICB9IGVsc2Uge1xuICAgICAgICB2YWx1ZSA9IHBhcmVudC5xdWVyeVNlbGVjdG9yKHZhbHVlKTtcbiAgICAgIH1cbiAgICB9XG4gICAgXG4gICAgaWYgKHZhbHVlICYmIHZhbHVlLm5vZGVOYW1lKSB7XG4gICAgICByZXR1cm4gdmFsdWU7XG4gICAgfVxuICAgIFxuICAgIHJldHVybiBudWxsO1xuICB9O1xuXG5tb2R1bGUuZXhwb3J0cyA9IGZ1bmN0aW9uIEN1cnNvcihlbGVtZW50LCBvcHRpb25zKSB7XG4gICAgXG4gIGZ1bmN0aW9uIHNldChuYW1lLCB2YWx1ZSkge1xuICAgIHZhciBvcHRzO1xuICAgIGlmICh0eXBlb2YgbmFtZSA9PT0gJ29iamVjdCcpIHtcbiAgICAgIG9wdHMgPSBuYW1lO1xuICAgIH0gZWxzZSB7XG4gICAgICBvcHRzID0ge307XG4gICAgICBvcHRzW25hbWVdID0gdmFsdWU7XG4gICAgfVxuICAgIGZvciAobmFtZSBpbiBvcHRzKSB7XG4gICAgICB2YWx1ZSA9IG9wdHNbbmFtZV07XG4gICAgICBzd2l0Y2ggKG5hbWUpIHtcbiAgICAgICAgY2FzZSAnZWxlbWVudCc6XG4gICAgICAgIGNhc2UgJ3N5bWJvbCc6XG4gICAgICAgICAgaWYgKGlzSFRNTCh2YWx1ZSkpIHtcbiAgICAgICAgICAgIHZhbHVlID0gY3JlYXRlRWxlbWVudCh2YWx1ZSk7XG4gICAgICAgICAgfVxuICAgICAgICAgIGJyZWFrO1xuICAgICAgfVxuICAgICAgb3B0c1tuYW1lXSA9IHZhbHVlO1xuICAgIH1cbiAgICBvcHRpb25zID0gbWVyZ2Uob3B0aW9ucywgb3B0cyk7XG4gIH07XG4gIFxuICB0aGlzLnNldCA9IGZ1bmN0aW9uKCkge1xuICAgIHNldC5jYWxsKHRoaXMsIGFyZ3VtZW50cyk7XG4gICAgY3Vyc29yTWFuYWdlci51cGRhdGUoKTtcbiAgfTtcbiAgXG4gIHRoaXMuZ2V0ID0gZnVuY3Rpb24obmFtZSkge1xuICAgIHZhciB2YWx1ZTtcbiAgICBpZiAoIW5hbWUpIHtcbiAgICAgIHZhbHVlID0ge307XG4gICAgICBmb3IgKHZhciB4IGluIG9wdGlvbnMpIHtcbiAgICAgICAgdmFsdWVbeF0gPSB0aGlzLmdldCh4KTtcbiAgICAgIH1cbiAgICB9IGVsc2Uge1xuICAgICAgdmFsdWUgPSBvcHRpb25zW25hbWVdO1xuICAgICAgc3dpdGNoIChuYW1lKSB7XG4gICAgICAgIGNhc2UgJ2VsZW1lbnQnOlxuICAgICAgICBjYXNlICdzeW1ib2wnOlxuICAgICAgICBjYXNlICdib3VuZHMnOlxuICAgICAgICBjYXNlICd0YXJnZXQnOlxuICAgICAgICAgIHZhbHVlID0gdmFsdWUgJiYgdmFsdWUudG9BcnJheSA/IHZhbHVlLnRvQXJyYXkoKVswXSA6IHZhbHVlIGluc3RhbmNlb2YgQXJyYXkgPyB2YWx1ZVswXSA6IHZhbHVlO1xuICAgICAgICAgIHZhbHVlID0gdHlwZW9mIHZhbHVlID09PSAnc3RyaW5nJyA/IChlbGVtZW50IHx8IGRvY3VtZW50KS5xdWVyeVNlbGVjdG9yKHZhbHVlKSA6IHZhbHVlO1xuICAgICAgICAgIGJyZWFrO1xuICAgICAgfVxuICAgICAgc3dpdGNoIChuYW1lKSB7XG4gICAgICAgIGNhc2UgJ3N5bWJvbCc6XG4gICAgICAgICAgdmFsdWUgPSB2YWx1ZSB8fCB0aGlzLmdldCgnZWxlbWVudCcpO1xuICAgICAgICAgIGJyZWFrO1xuICAgICAgICBjYXNlICdib3VuZHMnOlxuICAgICAgICAgIHZhbHVlID0gdmFsdWUgPyB2YWx1ZSA6IG9wdGlvbnNbJ3N5bWJvbCddID8gdGhpcy5nZXQoJ2VsZW1lbnQnKSA6IHRoaXMuZ2V0KCdlbGVtZW50Jykub2Zmc2V0UGFyZW50O1xuICAgICAgICAgIGJyZWFrO1xuICAgICAgfVxuICAgIH1cbiAgICByZXR1cm4gdmFsdWU7XG4gIH07XG4gIFxuICBzZXQobWVyZ2Uoe1xuICAgIGVsZW1lbnQ6IG51bGwsXG4gICAgb2Zmc2V0OiB7bGVmdDogOCwgdG9wOiA2fSxcbiAgICBzdHlsZTogJ3RyYW5zZm9ybScsXG4gICAgc2NhbGU6IDEsXG4gICAgYm91bmRzOiBudWxsLFxuICAgIHN5bWJvbDogbnVsbCxcbiAgICB0YXJnZXQ6IG51bGwsXG4gICAgaGlkZU9uRm9jdXM6IGZhbHNlXG4gIH0sIG9wdGlvbnMsIHtcbiAgICBlbGVtZW50OiBlbGVtZW50XG4gIH0pKTtcbiAgXG59OyIsInZhclxuICBcbiAgdG9wbW9zdCA9IHJlcXVpcmUoJy4vdG9wbW9zdCcpLFxuICBcbiAgLyoqXG4gICAqIEh5cGhlbmF0ZSBhIHN0cmluZ1xuICAgKiBAcGFyYW0ge1N0cmluZ30gc3RyaW5nXG4gICAqL1xuICBoeXBoZW5hdGUgPSAoZnVuY3Rpb24oKSB7XG4gICAgdmFyIGNhY2hlID0ge307XG4gICAgcmV0dXJuIGZ1bmN0aW9uKHN0cmluZykge1xuICAgICAgcmV0dXJuIGNhY2hlW3N0cmluZ10gPSBjYWNoZVtzdHJpbmddIHx8IChmdW5jdGlvbigpIHtcbiAgICAgICAgcmV0dXJuIHN0cmluZy5yZXBsYWNlKC8oW0EtWl0pL2csIGZ1bmN0aW9uKCQxKXtyZXR1cm4gXCItXCIrJDEudG9Mb3dlckNhc2UoKTt9KTtcbiAgICAgIH0pKCk7XG4gICAgfTtcbiAgfSkoKSxcbiAgXG4gIGdldFN0eWxlID0gZnVuY3Rpb24oZWwsIGNzc3Byb3Ape1xuICAgaWYgKGVsLmN1cnJlbnRTdHlsZSkgLy9JRVxuICAgIHJldHVybiBlbC5jdXJyZW50U3R5bGVbY3NzcHJvcF07XG4gICBlbHNlIGlmIChkb2N1bWVudC5kZWZhdWx0VmlldyAmJiBkb2N1bWVudC5kZWZhdWx0Vmlldy5nZXRDb21wdXRlZFN0eWxlKSAvL0ZpcmVmb3hcbiAgICByZXR1cm4gZG9jdW1lbnQuZGVmYXVsdFZpZXcuZ2V0Q29tcHV0ZWRTdHlsZShlbCwgXCJcIilbY3NzcHJvcF07XG4gICBlbHNlIC8vdHJ5IGFuZCBnZXQgaW5saW5lIHN0eWxlXG4gICAgcmV0dXJuIGVsLnN0eWxlW2Nzc3Byb3BdO1xuICB9LFxuICBcbiAgdHJhbnNmb3JtU3R5bGUgPSAoZnVuY3Rpb24ocHJvcCwgcHJlZml4ZXMpIHtcbiAgICB2YXIgaSxcbiAgICAgIGVsZW0gPSBkb2N1bWVudC5jcmVhdGVFbGVtZW50KCdkaXYnKSxcbiAgICAgIGNhcGl0YWxpemVkID0gcHJvcC5jaGFyQXQoMCkudG9VcHBlckNhc2UoKSArIHByb3Auc2xpY2UoMSk7XG4gICAgZm9yIChpID0gMDsgaSA8IHByZWZpeGVzLmxlbmd0aDsgaSsrKSB7XG4gICAgICBpZiAodHlwZW9mIGVsZW0uc3R5bGVbcHJlZml4ZXNbaV0gKyBjYXBpdGFsaXplZF0gIT09IFwidW5kZWZpbmVkXCIpIHtcbiAgICAgICAgcmV0dXJuIHByZWZpeGVzW2ldICsgY2FwaXRhbGl6ZWQ7XG4gICAgICB9XG4gICAgfVxuICAgIHJldHVybiBudWxsO1xuICB9KSgndHJhbnNmb3JtJywgWycnLCAnTW96JywgJ1dlYmtpdCcsICdPJywgJ01zJ10pLFxuICBcbiAgaXNDaGlsZE9mID0gZnVuY3Rpb24ocGFyZW50LCBjaGlsZCkge1xuICAgaWYgKCFjaGlsZCB8fCAhcGFyZW50KSB7XG4gICAgIHJldHVybiBmYWxzZTtcbiAgIH1cbiAgIHZhciBub2RlID0gY2hpbGQucGFyZW50Tm9kZTtcbiAgIHdoaWxlIChub2RlICE9IG51bGwpIHtcbiAgICAgaWYgKG5vZGUgPT0gcGFyZW50KSB7XG4gICAgICAgICByZXR1cm4gdHJ1ZTtcbiAgICAgfVxuICAgICBub2RlID0gbm9kZS5wYXJlbnROb2RlO1xuICAgfVxuICAgcmV0dXJuIGZhbHNlO1xuICB9LFxuICBcbiAgY3NzID0gZnVuY3Rpb24oZWxlbSwgbmFtZSwgdmFsdWUpIHtcbiAgICB2YXIgbWFwID0ge30sIGNzc1RleHQgPSBudWxsO1xuICAgIGlmICh0eXBlb2YgbmFtZSA9PT0gJ29iamVjdCcpIHtcbiAgICAgIG1hcCA9IG5hbWU7XG4gICAgfSBlbHNlIGlmICh0eXBlb2YgdmFsdWUgIT09IFwidW5kZWZpbmVkXCIpIHtcbiAgICAgIG1hcFtuYW1lXSA9IHZhbHVlO1xuICAgIH1cbiAgICB2YXIga2V5cyA9IE9iamVjdC5rZXlzKG1hcCk7XG4gICAga2V5cyA9IGtleXMuZmlsdGVyKGZ1bmN0aW9uKGtleSwgaW5kZXgpIHtcbiAgICAgIGlmIChtYXBba2V5XSA9PT0gJycpIHtcbiAgICAgICAgZWxlbS5zdHlsZVtrZXldID0gbWFwW2tleV07XG4gICAgICAgIHJldHVybiBmYWxzZTtcbiAgICAgIH1cbiAgICAgIHJldHVybiB0cnVlO1xuICAgIH0pO1xuICAgIGNzc1RleHQgPSBrZXlzLm1hcChmdW5jdGlvbihuYW1lKSB7XG4gICAgICByZXR1cm4gaHlwaGVuYXRlKG5hbWUpICsgXCI6IFwiICsgbWFwW25hbWVdO1xuICAgIH0pLmpvaW4oXCI7IFwiKTtcbiAgICBpZiAoY3NzVGV4dCAmJiBjc3NUZXh0Lmxlbmd0aCkge1xuICAgICAgZWxlbS5zdHlsZS5jc3NUZXh0ID0gZWxlbS5zdHlsZS5jc3NUZXh0ICsgY3NzVGV4dDtcbiAgICAgIHJldHVybiBudWxsO1xuICAgIH1cbiAgICByZXR1cm4gZWxlbS5zdHlsZVtuYW1lXSB8fCB3aW5kb3cuZ2V0Q29tcHV0ZWRTdHlsZShlbGVtLCBudWxsKS5nZXRQcm9wZXJ0eVZhbHVlKG5hbWUpO1xuICB9LFxuICBcbiAgZ2V0T2Zmc2V0ID0gZnVuY3Rpb24oZWxlbWVudCkge1xuICAgIHZhciBzY3JvbGxPZmZzZXQgPSBnZXRTY3JvbGxPZmZzZXQoKTtcbiAgICB2YXIgcmVjdCA9IGVsZW1lbnQuZ2V0Qm91bmRpbmdDbGllbnRSZWN0KCksIGJvZHlFbGVtZW50ID0gZG9jdW1lbnQuYm9keTtcbiAgICByZXR1cm4ge1xuICAgICAgdG9wOiByZWN0LnRvcCArIHNjcm9sbE9mZnNldC50b3AsXG4gICAgICBsZWZ0OiByZWN0LmxlZnQgKyBzY3JvbGxPZmZzZXQubGVmdFxuICAgIH07XG4gIH0sXG4gIFxuICBnZXRTY3JvbGxPZmZzZXQgPSBmdW5jdGlvbigpIHtcbiAgICByZXR1cm4ge1xuICAgICAgbGVmdDogZG9jdW1lbnQuYm9keS5zY3JvbGxMZWZ0ICsgZG9jdW1lbnQuZG9jdW1lbnRFbGVtZW50LnNjcm9sbExlZnQsXG4gICAgICB0b3A6IGRvY3VtZW50LmJvZHkuc2Nyb2xsVG9wICsgZG9jdW1lbnQuZG9jdW1lbnRFbGVtZW50LnNjcm9sbFRvcFxuICAgIH07XG4gIH0sXG4gIFxuICBnZXRCb3VuZGluZ1JlY3QgPSBmdW5jdGlvbihlbGVtZW50KSB7XG4gICAgaWYgKCFlbGVtZW50KSB7XG4gICAgICByZXR1cm4ge1xuICAgICAgICB4OiAtSW5maW5pdHksXG4gICAgICAgIHk6IC1JbmZpbml0eSxcbiAgICAgICAgd2lkdGg6IEluZmluaXR5LFxuICAgICAgICBoZWlnaHQ6IEluZmluaXR5XG4gICAgICB9O1xuICAgIH1cbiAgICB2YXIgc2Nyb2xsT2Zmc2V0ID0gZ2V0U2Nyb2xsT2Zmc2V0KCk7XG4gICAgdmFyIHJlY3QgPSBlbGVtZW50LmdldEJvdW5kaW5nQ2xpZW50UmVjdCgpO1xuICAgIHJldHVybiB7XG4gICAgICB4OiByZWN0LnggKyBzY3JvbGxPZmZzZXQubGVmdCxcbiAgICAgIHk6IHJlY3QueSArIHNjcm9sbE9mZnNldC50b3AsXG4gICAgICB3aWR0aDogcmVjdC53aWR0aCxcbiAgICAgIGhlaWdodDogcmVjdC5oZWlnaHRcbiAgICB9O1xuICB9LFxuICBcbiAgLy8gRGVjbGFyZSBzaW5nbGV0b24gaW5zdGFuY2VcbiAgaW5zdGFuY2UgPSBudWxsO1xuXG4vKipcbiAqIEN1cnNvck1hbmFnZXJcbiAqIFRoaXMgc2luZ2xldG9uIGNsYXNzIGhhbmRsZXMgYWxsIGN1cnNvciBvYmplY3RzIFxuICogQHBhcmFtIHtPYmplY3R9IG9wdGlvbnNcbiAqL1xuZnVuY3Rpb24gQ3Vyc29yTWFuYWdlcihvcHRpb25zKSB7XG4gIC8vIFNpbmdsZXRvbiBwYXR0ZXJuXG4gIGlmIChpbnN0YW5jZSkge1xuICAgIGluc3RhbmNlLnNldChvcHRpb25zKTtcbiAgICByZXR1cm4gaW5zdGFuY2U7XG4gIH1cbiAgaW5zdGFuY2UgPSB0aGlzO1xuICAvLyBJbXBsZW1lbnRhdGlvblxuICBcbiAgdmFyIGN1cnNvcnMgPSBbXTtcbiAgdmFyIGNsaWVudCA9IHt4OiAwLCB5OiAwfTtcbiAgdmFyIG1vdXNlID0ge3g6IC1JbmZpbml0eSwgeTogLUluZmluaXR5LCBlbGVtZW50OiBudWxsfTtcbiAgdmFyIGV2ZW50cyA9IFsnbW91c2Vkb3duJywgJ2NsaWNrJywgJ3Njcm9sbCcsICdyZXNpemUnLCAnbW91c2Vtb3ZlJywgJ21vdXNlb3V0J107XG4gIHZhciBjdXJzb3JJdGVtcyA9IFtdO1xuICB2YXIgY3Vyc29ySXRlbSA9IG51bGw7XG4gIHZhciBjbGlja2luZyA9IGZhbHNlO1xuICB2YXIgY2xpY2thYmxlID0gdHJ1ZTtcbiAgXG4gIGZ1bmN0aW9uIGluaXQoKSB7XG4gICAgaWYgKCEoJ29udG91Y2gnIGluIHdpbmRvdykpIHtcbiAgICAgIGFkZE1vdXNlTGlzdGVuZXJzKHdpbmRvdyk7XG4gICAgfVxuICB9XG4gIFxuICBmdW5jdGlvbiBoYW5kbGVFdmVudChlKSB7XG4gICAgLy8gQ2hlY2sgZm9yIGFjY2VzcyB0byBldmVudCdzIHR5cGUgcHJvcGVydHlcbiAgICB0cnkge1xuICAgICAgZS50eXBlO1xuICAgIH0gY2F0Y2ggKGUpIHtcbiAgICAgIC8vY29uc29sZS53YXJuKGUpO1xuICAgICAgcmV0dXJuO1xuICAgIH1cbiAgICAvLyBVcGRhdGUgTW91c2UgUG9zaXRpb25cbiAgICBzd2l0Y2ggKGUudHlwZSkge1xuICAgICAgY2FzZSAnbW91c2Vkb3duJzpcbiAgICAgICAgY2xpY2tpbmcgPSBmYWxzZTtcbiAgICAgICAgYnJlYWs7XG4gICAgICBjYXNlICdtb3VzZW91dCc6XG4gICAgICAgIHZhciByZWxhdGVkVGFyZ2V0ID0gdHlwZW9mIGUudG9FbGVtZW50ICE9ICd1bmRlZmluZWQnID8gZS50b0VsZW1lbnQgOiBlLnJlbGF0ZWRUYXJnZXQ7XG4gICAgICAgIGlmIChyZWxhdGVkVGFyZ2V0ID09PSBudWxsKSB7XG4gICAgICAgICAgbW91c2UueCA9IC1JbmZpbml0eTtcbiAgICAgICAgICBtb3VzZS55ID0gLUluZmluaXR5O1xuICAgICAgICAgIG1vdXNlLmVsZW1lbnQgPSBudWxsO1xuICAgICAgICB9XG4gICAgICAgIGJyZWFrO1xuICAgICAgY2FzZSAnbW91c2Vtb3ZlJzpcbiAgICAgICAgLy8gR2V0IG1vdXNlIGNvb3JkaW5hdGVzXG4gICAgICAgIC8vIFVwZGF0ZSBtb3VzZSBjb29yZGluYXRlc1xuICAgICAgICBjbGllbnQueCA9IGUuY2xpZW50WDtcbiAgICAgICAgY2xpZW50LnkgPSBlLmNsaWVudFk7XG4gICAgICBkZWZhdWx0OlxuICAgICAgdmFyIHNjcm9sbE9mZnNldCA9IGdldFNjcm9sbE9mZnNldCgpO1xuICAgICAgbW91c2UueCA9IGNsaWVudC54ICsgc2Nyb2xsT2Zmc2V0LmxlZnQ7XG4gICAgICBtb3VzZS55ID0gY2xpZW50LnkgKyBzY3JvbGxPZmZzZXQudG9wO1xuICAgICAgbW91c2UuZWxlbWVudCA9IGUudGFyZ2V0O1xuICAgIH1cbiAgICBcbiAgICAvLyBHZXQgQ3Vyc29yIFByb3BzXG4gICAgaW52YWxpZGF0ZS5jYWxsKHRoaXMpO1xuICAgIFxuICAgIC8vIFByb2Nlc3MgQ2xpY2tcbiAgICBzd2l0Y2ggKGUudHlwZSkge1xuICAgICAgY2FzZSAnY2xpY2snOlxuICAgICAgICBpZiAoIWNsaWNraW5nICYmIGN1cnNvckl0ZW0pIHtcbiAgICAgICAgICBpZiAobW91c2UuZWxlbWVudCAmJiBjdXJzb3JJdGVtICYmIGN1cnNvckl0ZW0udGFyZ2V0ICYmIGN1cnNvckl0ZW0uc3ltYm9sICE9PSBtb3VzZS5lbGVtZW50ICYmIGlzQ2hpbGRPZihjdXJzb3JJdGVtLmNvbnRhaW5lciwgbW91c2UuZWxlbWVudCkpIHtcbiAgICAgICAgICAgIC8vZS5zdG9wSW1tZWRpYXRlUHJvcGFnYXRpb24oKTtcbiAgICAgICAgICAgIC8vZS5wcmV2ZW50RGVmYXVsdCgpO1xuICAgICAgICAgICAgY2xpY2tpbmcgPSB0cnVlO1xuICAgICAgICAgICAgY3Vyc29ySXRlbS50YXJnZXQuY2xpY2soKTtcbiAgICAgICAgICB9XG4gICAgICAgIH1cbiAgICAgICAgYnJlYWs7XG4gICAgfVxuICAgIC8vIFVwZGF0ZSBjdXJzb3JzXG4gICAgcmVuZGVyLmNhbGwoaW5zdGFuY2UpO1xuICB9XG4gIFxuICBmdW5jdGlvbiBpc0NsaWNrYWJsZShjdXJzb3JJdGVtKSB7XG4gICAgdmFyIGVsZW1lbnQgPSBtb3VzZS5lbGVtZW50O1xuICAgIGlmIChlbGVtZW50KSB7XG4gICAgICBpZiAoY3Vyc29ySXRlbSAmJiBjdXJzb3JJdGVtLnRhcmdldCAmJiBjdXJzb3JJdGVtLnN5bWJvbCAhPT0gZWxlbWVudCAmJiBpc0NoaWxkT2YoY3Vyc29ySXRlbS5jb250YWluZXIsIGVsZW1lbnQpKSB7XG4gICAgICAgIC8vaWYgKCFvcHRzLmhpZGVPbkZvY3VzIHx8ICFpc0NoaWxkT2YoZWxlbWVudCwgZG9jdW1lbnQuYWN0aXZlRWxlbWVudCkgJiYgZWxlbWVudCAhPT0gZG9jdW1lbnQuYWN0aXZlRWxlbWVudCkge1xuICAgICAgICByZXR1cm4gdHJ1ZTtcbiAgICAgIH1cbiAgICB9XG4gICAgcmV0dXJuIGZhbHNlO1xuICB9IFxuICBcbiAgZnVuY3Rpb24gaW52YWxpZGF0ZSgpIHtcbiAgICBcbiAgICBjdXJzb3JJdGVtcyA9IGN1cnNvcnMubWFwKGZ1bmN0aW9uKGN1cnNvciwgaW5kZXgpIHtcbiAgICAgIHJldHVybiBnZXRDdXJzb3JJdGVtKGN1cnNvciwgY3Vyc29ySXRlbXNbaW5kZXhdKTtcbiAgICB9KTtcbiAgICBcbiAgICBjdXJzb3JJdGVtID0gY3Vyc29ySXRlbXMuZmlsdGVyKGZ1bmN0aW9uKGN1cnNvckl0ZW0sIGluZGV4KSB7XG4gICAgICB2YXIgbW91c2VFbGVtZW50ID0gbW91c2UuZWxlbWVudCwgc3ltYm9sID0gY3Vyc29ySXRlbS5zeW1ib2wsIGJvdW5kcyA9IGN1cnNvckl0ZW0uYm91bmRzLCBjb250YWluZXIgPSBjdXJzb3JJdGVtLmNvbnRhaW5lciwgcmVzdWx0ID0gZmFsc2U7XG4gICAgICAvLyBEZXRlY3QgaWYgYSBtb3VzZSBlbGVtZW50IGV4aXN0cyBhbmQgdGhhdCBpdCdzIG5vdCB0aGUgc3ltYm9sIGl0c2VsZlxuICAgICAgaWYgKG1vdXNlRWxlbWVudCAmJiBzeW1ib2wgIT09IG1vdXNlRWxlbWVudCkge1xuICAgICAgICAvLyBEZXRlY3QgaWYgc3ltYm9sIGlzIHRvcG1vc3QgZWxlbWVudFxuICAgICAgICBpZiAodG9wbW9zdChtb3VzZUVsZW1lbnQsIHN5bWJvbCkgPT09IHN5bWJvbCkge1xuICAgICAgICAgIC8vIERldGVjdCBpZiBtb3VzZSBlbGVtZW50IGlzIGNvbnRhaW5lZFxuICAgICAgICAgIGlmIChjb250YWluZXIgPT09IG1vdXNlRWxlbWVudCB8fCBpc0NoaWxkT2YoY29udGFpbmVyLCBtb3VzZUVsZW1lbnQpKSB7XG4gICAgICAgICAgICAvLyBNYXRjaCBib3VuZHNcbiAgICAgICAgICAgIHJlc3VsdCA9IChtb3VzZS54ID49IGJvdW5kcy54ICYmIG1vdXNlLnggPD0gYm91bmRzLnggKyBib3VuZHMud2lkdGggJiYgbW91c2UueSA+PSBib3VuZHMueSAmJiBtb3VzZS55IDw9IGJvdW5kcy55ICsgYm91bmRzLmhlaWdodCk7XG4gICAgICAgICAgfVxuICAgICAgICB9XG4gICAgICB9XG4gICAgICByZXR1cm4gcmVzdWx0O1xuICAgIH0pLnNvcnQoZnVuY3Rpb24oYSwgYikge1xuICAgICAgdmFyIHpFbGVtZW50ID0gdG9wbW9zdChhLnN5bWJvbCwgYi5zeW1ib2wpO1xuICAgICAgaWYgKHpFbGVtZW50ID09PSBhLnN5bWJvbCkge1xuICAgICAgICByZXR1cm4gYTtcbiAgICAgIH0gZWxzZSBpZiAoekVsZW1lbnQgPT09IGIuc3ltYm9sKSB7XG4gICAgICAgIHJldHVybiBiO1xuICAgICAgfVxuICAgICAgXG4gICAgICB2YXIgcDEgPSB7eDogYS54ICsgYS53aWR0aCAvIDIsIHk6IGEueSArIGEuaGVpZ2h0IC8gMn07XG4gICAgICB2YXIgcDIgPSB7eDogYi54ICsgYi53aWR0aCAvIDIsIHk6IGIueSArIGIuaGVpZ2h0IC8gMn07XG4gICAgICB2YXIgZDEgPSBNYXRoLnNxcnQoIE1hdGgucG93KChwMS54IC0gbW91c2UueCksIDIpICsgTWF0aC5wb3coKHAxLnkgLSBtb3VzZS55KSwgMikgKTtcbiAgICAgIHZhciBkMiA9IE1hdGguc3FydCggTWF0aC5wb3coKHAyLnggLSBtb3VzZS54KSwgMikgKyBNYXRoLnBvdygocDIueSAtIG1vdXNlLnkpLCAyKSApO1xuICAgICAgcmV0dXJuIGQxIDwgZDIgPyBkMSA6IGQxID4gZDIgPyBkMiA6IDA7XG4gICAgfSkucmV2ZXJzZSgpWzBdO1xuICAgIFxuICAgIC8vIFNldCBNb3VzZVByb3ZpZGVyc1xuICAgIHNldE1vdXNlUHJvdmlkZXJzKFt3aW5kb3ddLmNvbmNhdChjdXJzb3JJdGVtcy5tYXAoZnVuY3Rpb24oaXRlbSkge1xuICAgICAgcmV0dXJuIGl0ZW0uY29udGFpbmVyO1xuICAgIH0pKSk7XG4gICAgLy9zZXRNb3VzZVByb3ZpZGVycyhbd2luZG93XSk7XG4gIH1cbiAgXG4gIGZ1bmN0aW9uIHJlbmRlcigpIHtcblxuICAgIGN1cnNvckl0ZW1zLmZvckVhY2goZnVuY3Rpb24oaXRlbSkge1xuICAgICAgaWYgKGl0ZW0gIT09IGN1cnNvckl0ZW0pIHtcbiAgICAgICAgY3NzKGl0ZW0uc3ltYm9sLCB7XG4gICAgICAgICAgZGlzcGxheTogJ25vbmUnXG4gICAgICAgIH0pO1xuICAgICAgfVxuICAgIH0pO1xuICAgIFxuICAgIGlmIChjdXJzb3JJdGVtKSB7XG4gICAgICB2YXIgc3ltYm9sID0gY3Vyc29ySXRlbS5zeW1ib2w7XG4gICAgICBcbiAgICAgIHZhciBzdHlsZSA9IHtcbiAgICAgICAgZGlzcGxheTogJ2lubGluZS1ibG9jaycsXG4gICAgICAgIHBvc2l0aW9uOiAnYWJzb2x1dGUnXG4gICAgICB9O1xuICAgICAgXG4gICAgICBzdHlsZVt0cmFuc2Zvcm1TdHlsZV0gPSBcIlwiO1xuICAgICAgc3R5bGVbdHJhbnNmb3JtU3R5bGUgKyBcIk9yaWdpblwiXSA9ICcnO1xuICAgICAgXG4gICAgICBjc3Moc3ltYm9sLCBzdHlsZSk7XG4gICAgICBcbiAgICAgIHZhciBwb3MgPSBnZXRPZmZzZXQoc3ltYm9sKTtcbiAgICAgIFxuICAgICAgdmFyIHB4ID0gcG9zLmxlZnQ7XG4gICAgICB2YXIgcHkgPSBwb3MudG9wO1xuICAgICAgXG4gICAgICB2YXIgb2ZmID0gY3Vyc29ySXRlbS5vZmZzZXQ7XG4gICAgICB2YXIgeCA9IE1hdGgucm91bmQoKG1vdXNlLnggLSBweCkgKyBvZmYubGVmdCk7XG4gICAgICB2YXIgeSA9IE1hdGgucm91bmQoKG1vdXNlLnkgLSBweSkgKyBvZmYudG9wKTtcbiAgICAgIFxuICAgICAgc3R5bGUgPSB7XG4gICAgICAgIC8vYm9yZGVyOiAnMXB4IHNvbGlkIGJsdWUnXG4gICAgICB9O1xuICAgICAgXG4gICAgICBpZiAoY3Vyc29ySXRlbS5zdHlsZSA9PT0gJ3RyYW5zZm9ybScgJiYgdHJhbnNmb3JtU3R5bGUpIHtcbiAgICAgICAgc3R5bGVbdHJhbnNmb3JtU3R5bGUgKyBcIk9yaWdpblwiXSA9ICcwIDAnO1xuICAgICAgICBzdHlsZVt0cmFuc2Zvcm1TdHlsZV0gPSBcInRyYW5zbGF0ZTNkKFwiICsgeCArIFwicHgsXCIgKyB5ICsgXCJweCwgMCkgc2NhbGUoXCIgKyBjdXJzb3JJdGVtLnNjYWxlICsgXCIsXCIgKyBjdXJzb3JJdGVtLnNjYWxlICsgXCIpXCI7XG4gICAgICB9IGVsc2Uge1xuICAgICAgICBzdHlsZS5sZWZ0ID0geCArIHBvcy5sZWZ0O1xuICAgICAgICBzdHlsZS50b3AgPSB5ICsgcG9zLnRvcDtcbiAgICAgIH1cbiAgICAgIFxuICAgICAgY3NzKHN5bWJvbCwgc3R5bGUpO1xuICAgIH1cbiAgfTtcbiAgXG4gIHRoaXMudXBkYXRlID0gZnVuY3Rpb24oKSB7XG4gICAgaW52YWxpZGF0ZS5jYWxsKHRoaXMpO1xuICAgIHJlbmRlci5jYWxsKHRoaXMpO1xuICB9O1xuICBcbiAgdGhpcy5hZGQgPSBmdW5jdGlvbihjdXJzb3IpIHtcbiAgICBpZiAoY3Vyc29ycy5pbmRleE9mKGN1cnNvcikgPT09IC0xKSB7XG4gICAgICBjdXJzb3JzLnB1c2goY3Vyc29yKTtcbiAgICAgIHRoaXMudXBkYXRlKCk7XG4gICAgfVxuICB9O1xuICBcbiAgdGhpcy5yZW1vdmUgPSBmdW5jdGlvbihjdXJzb3IpIHtcbiAgICBjdXJzb3JzLnNwbGljZShjdXJzb3JzLmluZGV4T2YoY3Vyc29yKSwgMSk7XG4gICAgdGhpcy51cGRhdGUoKTtcbiAgfTtcbiAgXG4gIHZhciBtb3VzZVByb3ZpZGVycyA9IFtdO1xuICBmdW5jdGlvbiBzZXRNb3VzZVByb3ZpZGVycyhlbGVtZW50cykge1xuICAgIGVsZW1lbnRzID0gZWxlbWVudHMuZmlsdGVyKGZ1bmN0aW9uKG4pIHsgcmV0dXJuIChuKTsgfSk7XG4gICAgbW91c2VQcm92aWRlcnMuZm9yRWFjaChmdW5jdGlvbihlbGVtZW50KSB7XG4gICAgICBpZiAoZWxlbWVudHMuaW5kZXhPZihlbGVtZW50KSA9PT0gLTEpIHtcbiAgICAgICAgcmVtb3ZlTW91c2VMaXN0ZW5lcnMoZWxlbWVudCk7XG4gICAgICB9XG4gICAgfSk7XG4gICAgZWxlbWVudHMuZm9yRWFjaChmdW5jdGlvbihlbGVtZW50KSB7XG4gICAgICBpZiAobW91c2VQcm92aWRlcnMuaW5kZXhPZihlbGVtZW50KSA9PT0gLTEpIHtcbiAgICAgICAgYWRkTW91c2VMaXN0ZW5lcnMoZWxlbWVudCk7XG4gICAgICB9XG4gICAgfSk7XG4gICAgbW91c2VQcm92aWRlcnMgPSBlbGVtZW50cztcbiAgfVxuICBcbiAgZnVuY3Rpb24gYWRkTW91c2VMaXN0ZW5lcnMoZWxlbWVudCkge1xuICAgIGZvciAodmFyIGkgPSAwLCBldmVudDsgZXZlbnQgPSBldmVudHNbaV07IGkrKykge1xuICAgICAgZWxlbWVudC5hZGRFdmVudExpc3RlbmVyKGV2ZW50LCBoYW5kbGVFdmVudCk7XG4gICAgfVxuICB9XG4gIFxuICBmdW5jdGlvbiByZW1vdmVNb3VzZUxpc3RlbmVycyhlbGVtZW50KSB7XG4gICAgZm9yICh2YXIgaSA9IDAsIGV2ZW50OyBldmVudCA9IGV2ZW50c1tpXTsgaSsrKSB7XG4gICAgICBlbGVtZW50LnJlbW92ZUV2ZW50TGlzdGVuZXIoZXZlbnQsIGhhbmRsZUV2ZW50KTtcbiAgICB9XG4gIH1cbiAgXG4gIGluaXQuY2FsbCh0aGlzKTtcbiAgXG59XG5cblxuXG5mdW5jdGlvbiBnZXRDdXJzb3JJdGVtKGN1cnNvcikge1xuICBcbiAgdmFyXG4gICAgZWxlbWVudCA9IGN1cnNvci5nZXQoJ2VsZW1lbnQnKSxcbiAgICBwcm9wcywgc3ltYm9sLCBib3VuZHMsIGNvbnRhaW5lciwgb2Zmc2V0LCBzdHlsZSwgc2NhbGU7XG4gICAgXG4gIGNzcyhlbGVtZW50LCB7XG4gICAgZGlzcGxheTogJydcbiAgfSk7XG4gIFxuICBwcm9wcyA9IGN1cnNvci5nZXQoKTtcbiAgXG4gIHN5bWJvbCA9IHByb3BzLnN5bWJvbDtcbiAgYm91bmRzID0gcHJvcHMuYm91bmRzO1xuICBvZmZzZXQgPSBwcm9wcy5vZmZzZXQ7XG4gIHN0eWxlID0gcHJvcHMuc3R5bGU7XG4gIHNjYWxlID0gcHJvcHMuc2NhbGU7XG4gIFxuICAvLyBBZGQgY3Vyc29yIHN5bWJvbCB0byBkb21cbiAgaWYgKCFzeW1ib2wucGFyZW50Tm9kZSkge1xuICAgIGVsZW1lbnQuYXBwZW5kQ2hpbGQoc3ltYm9sKTtcbiAgfVxuICBcbiAgXG4gIC8vIEdldCBib3VuZHNcbiAgdmFyIGNvbnRhaW5lcjtcbiAgaWYgKGJvdW5kcyAmJiBib3VuZHMuZ2V0Qm91bmRpbmdDbGllbnRSZWN0KSB7XG4gICAgLy8gRWxlbWVudCBib3VuZHNcbiAgICBjb250YWluZXIgPSBib3VuZHM7XG4gICAgYm91bmRzID0gZ2V0Qm91bmRpbmdSZWN0KGJvdW5kcyk7XG4gIH0gZWxzZSB7XG4gICAgLy8gT2JqZWN0IGJvdW5kc1xuICAgIGNvbnRhaW5lciA9IHN5bWJvbC5vZmZzZXRQYXJlbnQ7XG4gICAgdmFyIHJlY3QgPSBnZXRCb3VuZGluZ1JlY3QoY29udGFpbmVyKTtcbiAgICB2YXIgY29udGFpbmVyUG9zID0gZ2V0T2Zmc2V0KGNvbnRhaW5lcikgfHwge3g6IDAsIHk6IDB9O1xuICAgIC8vIFByb2Nlc3MgZnVuY3Rpb24gXG4gICAgaWYgKHR5cGVvZiBib3VuZHMgPT09ICdmdW5jdGlvbicpIHtcbiAgICAgIGJvdW5kcyA9IGJvdW5kcyhjb250YWluZXIpO1xuICAgIH1cbiAgICAvLyBHZXQgcGVyY2VudCB2YWx1ZXNcbiAgICB2YXIgeCA9IHR5cGVvZiBib3VuZHMueCA9PT0gJ3N0cmluZycgJiYgYm91bmRzLnguaW5kZXhPZihcIiVcIikgPj0gMCA/IHBhcnNlRmxvYXQoYm91bmRzLngpICogcmVjdC53aWR0aCAvIDEwMCA6IHBhcnNlRmxvYXQoYm91bmRzLngpO1xuICAgIHZhciB5ID0gdHlwZW9mIGJvdW5kcy55ID09PSAnc3RyaW5nJyAmJiBib3VuZHMueS5pbmRleE9mKFwiJVwiKSA+PSAwID8gcGFyc2VGbG9hdChib3VuZHMueSkgKiByZWN0LmhlaWdodCAvIDEwMCA6IHBhcnNlRmxvYXQoYm91bmRzLnkpO1xuICAgIHZhciB3aWR0aCA9IHR5cGVvZiBib3VuZHMud2lkdGggPT09ICdzdHJpbmcnICYmIGJvdW5kcy53aWR0aC5pbmRleE9mKFwiJVwiKSA+PSAwID8gcGFyc2VGbG9hdChib3VuZHMud2lkdGgpICogcmVjdC53aWR0aCAvIDEwMCA6IHBhcnNlRmxvYXQoYm91bmRzLndpZHRoKTtcbiAgICB2YXIgaGVpZ2h0ID0gdHlwZW9mIGJvdW5kcy5oZWlnaHQgPT09ICdzdHJpbmcnICYmIGJvdW5kcy5oZWlnaHQuaW5kZXhPZihcIiVcIikgPj0gMCA/IHBhcnNlRmxvYXQoYm91bmRzLmhlaWdodCkgKiByZWN0LmhlaWdodCAvIDEwMCA6IHBhcnNlRmxvYXQoYm91bmRzLmhlaWdodCk7XG4gICAgYm91bmRzID0ge1xuICAgICAgeDogY29udGFpbmVyUG9zLmxlZnQgKyB4LFxuICAgICAgeTogY29udGFpbmVyUG9zLnRvcCArIHksXG4gICAgICB3aWR0aDogd2lkdGgsXG4gICAgICBoZWlnaHQ6IGhlaWdodFxuICAgIH07XG4gIH1cbiAgXG4gIHZhciB0YXJnZXQgPSBwcm9wcy50YXJnZXQgfHwgc3ltYm9sLm5vZGVOYW1lLnRvTG93ZXJDYXNlKCkgPT09ICdhJyA/IHN5bWJvbCA6IGVsZW1lbnQ7XG4gIFxuICByZXR1cm4ge1xuICAgIGN1cnNvcjogY3Vyc29yLFxuICAgIHN5bWJvbDogc3ltYm9sLFxuICAgIGJvdW5kczogYm91bmRzLFxuICAgIGNvbnRhaW5lcjogY29udGFpbmVyLFxuICAgIHRhcmdldDogdGFyZ2V0LFxuICAgIG9mZnNldDogb2Zmc2V0LFxuICAgIHN0eWxlOiBzdHlsZSxcbiAgICBzY2FsZTogc2NhbGVcbiAgfTtcbn1cblxubW9kdWxlLmV4cG9ydHMgPSBDdXJzb3JNYW5hZ2VyOyIsInZhciBcblxuICBnZXRTdHlsZSA9IGZ1bmN0aW9uKGVsLCBjc3Nwcm9wKXtcbiAgICBpZiAoZWwuY3VycmVudFN0eWxlKSAvL0lFXG4gICAgICByZXR1cm4gZWwuY3VycmVudFN0eWxlW2Nzc3Byb3BdO1xuICAgIGVsc2UgaWYgKGRvY3VtZW50LmRlZmF1bHRWaWV3ICYmIGRvY3VtZW50LmRlZmF1bHRWaWV3LmdldENvbXB1dGVkU3R5bGUpIC8vRmlyZWZveFxuICAgICAgcmV0dXJuIGRvY3VtZW50LmRlZmF1bHRWaWV3LmdldENvbXB1dGVkU3R5bGUoZWwsIFwiXCIpW2Nzc3Byb3BdO1xuICAgIGVsc2UgLy90cnkgYW5kIGdldCBpbmxpbmUgc3R5bGVcbiAgICAgIHJldHVybiBlbC5zdHlsZVtjc3Nwcm9wXTtcbiAgfTtcblxuZnVuY3Rpb24gZ2V0QW5jZXN0b3JzQXNBcnJheShlbGVtZW50KXtcbiAgdmFyIGFyciA9IG5ldyBBcnJheSgpO1xuICBhcnIudW5zaGlmdChlbGVtZW50KTtcbiAgd2hpbGUgKGFyclswXS5wYXJlbnROb2RlKXtcbiAgICBhcnIudW5zaGlmdChhcnJbMF0ucGFyZW50Tm9kZSk7XG4gIH1cbiAgcmV0dXJuIGFycjtcbn1cblxuZnVuY3Rpb24gaGlnaGVzdEluaXRpYWxaSW5kZXgoZWxlbWVudEFycil7XG4gIGZvciAodmFyIGkgPSAwOyBpIDwgZWxlbWVudEFyci5sZW5ndGg7IGkrKykge1xuICAgICAgaWYgKGVsZW1lbnRBcnJbaV0uc3R5bGUgPT0gdW5kZWZpbmVkKSBjb250aW51ZTtcbiAgICAgIHZhciByID0gZ2V0U3R5bGUoZWxlbWVudEFycltpXSwgJ3pJbmRleCcpO1xuICAgICAgaWYgKCFpc05hTihyKSAmJiByIT1cIlwiKSB7XG4gICAgICAgICAgcmV0dXJuIHI7XG4gICAgICB9XG4gIH1cbiAgcmV0dXJuIHVuZGVmaW5lZDtcbn1cblxuZnVuY3Rpb24gZmluZENvbW1vbkFuY2VzdG9yKGVsZW1lbnRBcnIxLCBlbGVtZW50QXJyMil7XG4gIHZhciBjb21tb25BbmNlc3RvcjtcbiAgZm9yICh2YXIgaT0wOyBpPGVsZW1lbnRBcnIxLmxlbmd0aDsgaSsrKXtcbiAgICBpZiAoZWxlbWVudEFycjFbaV0gPT0gZWxlbWVudEFycjJbaV0pIHtcbiAgICAgICAgY29tbW9uQW5jZXN0b3IgPSBlbGVtZW50QXJyMVtpXTtcbiAgICB9XG4gIH1cbiAgcmV0dXJuIGNvbW1vbkFuY2VzdG9yO1xufVxuXG5mdW5jdGlvbiBmaW5kSGlnaGVzdEFic29sdXRlSW5kZXgoZWxlbWVudDEsIGVsZW1lbnQyKXtcbiAgdmFyIGFycjEgPSBnZXRBbmNlc3RvcnNBc0FycmF5KGVsZW1lbnQxKTtcbiAgdmFyIGFycjIgPSBnZXRBbmNlc3RvcnNBc0FycmF5KGVsZW1lbnQyKTtcblxuICAvLyBEb2VzIGFuIGFuY2VzdG9yIG9mIG9uZSBlbG1lbnQgc2ltcGx5IGhhdmUgYSBoaWdoZXIgei1pbmRleD9cbiAgdmFyIGFycjFaID0gaGlnaGVzdEluaXRpYWxaSW5kZXgoYXJyMSk7XG4gIHZhciBhcnIyWiA9IGhpZ2hlc3RJbml0aWFsWkluZGV4KGFycjIpO1xuICBpZiAoYXJyMVogPiBhcnIyWiB8fCAoIWlzTmFOKGFycjFaKSAmJiBpc05hTihhcnIyWikpKSByZXR1cm4gZWxlbWVudDE7XG4gIGlmIChhcnIyWiA+IGFycjFaIHx8ICghaXNOYU4oYXJyMlopICYmIGlzTmFOKGFycjFaKSkpIHJldHVybiBlbGVtZW50MjtcblxuICAvLyBJcyBvbmUgZWxlbWVudCBhIGRlc2NlbmRlbnQgb2YgdGhlIG90aGVyP1xuICB2YXIgY29tbW9uQW5jZXN0b3IgPSBmaW5kQ29tbW9uQW5jZXN0b3IoYXJyMSwgYXJyMik7XG4gIGlmICghY29tbW9uQW5jZXN0b3IpIHtcbiAgICByZXR1cm4gZWxlbWVudDE7XG4gIH1cbiAgaWYgKGNvbW1vbkFuY2VzdG9yID09IGVsZW1lbnQxKSByZXR1cm4gZWxlbWVudDI7XG4gIGlmIChjb21tb25BbmNlc3RvciA9PSBlbGVtZW50MikgcmV0dXJuIGVsZW1lbnQxO1xuXG4gIC8vIE9LLCB3aGljaCBoYXMgdGhlIG9sZGVzdCBjb21tb24gc2libGluZz8gKEdyZWF0ZXIgaW5kZXggb2YgY2hpbGQgbm9kZSBmb3IgYW4gZWxlbWVudCA9IFwib2xkZXJcIiBjaGlsZClcbiAgdmFyIGluZGV4T2ZDb21tb25BbmNlc3RvcjtcbiAgZm9yICh2YXIgaT0wOyBpPGFycjEubGVuZ3RoOyBpKyspe1xuICAgIGlmIChhcnIxW2ldID09IGNvbW1vbkFuY2VzdG9yKSB7XG4gICAgICBpbmRleE9mQ29tbW9uQW5jZXN0b3IgPSBpO1xuICAgICAgYnJlYWs7XG4gICAgfVxuICB9XG5cbiAgZm9yICh2YXIgaj1jb21tb25BbmNlc3Rvci5jaGlsZE5vZGVzLmxlbmd0aDsgaj49MDsgai0tKSB7XG4gICAgaWYgKGFycjFbaW5kZXhPZkNvbW1vbkFuY2VzdG9yKzFdID09IGNvbW1vbkFuY2VzdG9yLmNoaWxkTm9kZXNbal0pIHJldHVybiBlbGVtZW50MTtcbiAgICBpZiAoYXJyMltpbmRleE9mQ29tbW9uQW5jZXN0b3IrMV0gPT0gY29tbW9uQW5jZXN0b3IuY2hpbGROb2Rlc1tqXSkgcmV0dXJuIGVsZW1lbnQyO1xuICB9ICAgXG59XG5tb2R1bGUuZXhwb3J0cyA9IGZpbmRIaWdoZXN0QWJzb2x1dGVJbmRleDsiXX0=
