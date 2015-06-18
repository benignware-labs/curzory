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
//# sourceMappingURL=data:application/json;charset:utf-8;base64,eyJ2ZXJzaW9uIjozLCJzb3VyY2VzIjpbIm5vZGVfbW9kdWxlcy9ncnVudC1icm93c2VyaWZ5L25vZGVfbW9kdWxlcy9icm93c2VyaWZ5L25vZGVfbW9kdWxlcy9icm93c2VyLXBhY2svX3ByZWx1ZGUuanMiLCJzcmMvY3Vyem9yeS5qcyIsInNyYy9qcXVlcnkuY3Vyem9yeS5qcyIsInNyYy9saWIvQ3Vyc29yLmpzIiwic3JjL2xpYi9DdXJzb3JNYW5hZ2VyLmpzIiwic3JjL2xpYi90b3Btb3N0LmpzIl0sIm5hbWVzIjpbXSwibWFwcGluZ3MiOiJBQUFBO0FDQUE7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7O0FDVEE7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTs7QUNuQkE7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBOztBQzdIQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBOztBQy9aQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBIiwiZmlsZSI6ImdlbmVyYXRlZC5qcyIsInNvdXJjZVJvb3QiOiIiLCJzb3VyY2VzQ29udGVudCI6WyIoZnVuY3Rpb24gZSh0LG4scil7ZnVuY3Rpb24gcyhvLHUpe2lmKCFuW29dKXtpZighdFtvXSl7dmFyIGE9dHlwZW9mIHJlcXVpcmU9PVwiZnVuY3Rpb25cIiYmcmVxdWlyZTtpZighdSYmYSlyZXR1cm4gYShvLCEwKTtpZihpKXJldHVybiBpKG8sITApO3ZhciBmPW5ldyBFcnJvcihcIkNhbm5vdCBmaW5kIG1vZHVsZSAnXCIrbytcIidcIik7dGhyb3cgZi5jb2RlPVwiTU9EVUxFX05PVF9GT1VORFwiLGZ9dmFyIGw9bltvXT17ZXhwb3J0czp7fX07dFtvXVswXS5jYWxsKGwuZXhwb3J0cyxmdW5jdGlvbihlKXt2YXIgbj10W29dWzFdW2VdO3JldHVybiBzKG4/bjplKX0sbCxsLmV4cG9ydHMsZSx0LG4scil9cmV0dXJuIG5bb10uZXhwb3J0c312YXIgaT10eXBlb2YgcmVxdWlyZT09XCJmdW5jdGlvblwiJiZyZXF1aXJlO2Zvcih2YXIgbz0wO288ci5sZW5ndGg7bysrKXMocltvXSk7cmV0dXJuIHN9KSIsInZhclxuICBDdXJzb3JNYW5hZ2VyID0gcmVxdWlyZSgnLi9saWIvQ3Vyc29yTWFuYWdlcicpLFxuICBDdXJzb3IgPSByZXF1aXJlKCcuL2xpYi9DdXJzb3InKTtcbiAgY3Vyc29yTWFuYWdlciA9IG5ldyBDdXJzb3JNYW5hZ2VyKCk7XG5cbm1vZHVsZS5leHBvcnRzID0gZnVuY3Rpb24gY3Vyem9yeShlbGVtZW50LCBvcHRpb25zKSB7XG4gIHZhciBjdXJzb3IgPSBuZXcgQ3Vyc29yKGVsZW1lbnQsIG9wdGlvbnMpO1xuICBjdXJzb3JNYW5hZ2VyLmFkZChjdXJzb3IpO1xuICByZXR1cm4gY3Vyc29yO1xufTsiLCJ2YXJcbiAgY3Vyem9yeSA9IHJlcXVpcmUoJy4vY3Vyem9yeScpLFxuICAkO1xuICBcbmlmICgkID0galF1ZXJ5KSB7XG4gICQuZm4uZXh0ZW5kKHtcbiAgICBjdXJ6b3J5OiBmdW5jdGlvbihvcHRpb25zKSB7XG4gICAgICByZXR1cm4gdGhpcy5lYWNoKGZ1bmN0aW9uKCkge1xuICAgICAgICB2YXIgY3Vyc29yID0gJCh0aGlzKS5kYXRhKCdjdXJ6b3J5Jyk7XG4gICAgICAgIGlmICghY3Vyc29yKSB7XG4gICAgICAgICAgY3Vyc29yID0gY3Vyem9yeSh0aGlzLCBvcHRpb25zKTtcbiAgICAgICAgICAkKHRoaXMpLmRhdGEoJ2N1cnpvcnknLCBjdXJzb3IpO1xuICAgICAgICB9IGVsc2Uge1xuICAgICAgICAgIGN1cnNvci5zZXQob3B0aW9ucyk7XG4gICAgICAgIH1cbiAgICAgICAgcmV0dXJuICQodGhpcyk7XG4gICAgICB9KTtcbiAgICB9XG4gIH0pO1xufSIsInZhclxuICBtZXJnZSA9IGZ1bmN0aW9uKCkge1xuICAgIHZhciBvYmogPSB7fSxcbiAgICAgIGkgPSAwLFxuICAgICAgaWwgPSBhcmd1bWVudHMubGVuZ3RoLFxuICAgICAga2V5O1xuICAgIGZvciAoOyBpIDwgaWw7IGkrKykge1xuICAgICAgZm9yIChrZXkgaW4gYXJndW1lbnRzW2ldKSB7XG4gICAgICAgIGlmIChhcmd1bWVudHNbaV0uaGFzT3duUHJvcGVydHkoa2V5KSkge1xuICAgICAgICAgICAgb2JqW2tleV0gPSBhcmd1bWVudHNbaV1ba2V5XTtcbiAgICAgICAgfVxuICAgICAgfVxuICAgIH1cbiAgICByZXR1cm4gb2JqO1xuICB9LFxuXG4gIGNyZWF0ZUVsZW1lbnQgPSBmdW5jdGlvbihzdHJpbmcpIHtcbiAgICB2YXIgZWxlbWVudCA9IGRvY3VtZW50LmNyZWF0ZUVsZW1lbnQoJ2RpdicpO1xuICAgIGVsZW1lbnQuaW5uZXJIVE1MID0gc3RyaW5nO1xuICAgIHZhciByZXN1bHQgPSBlbGVtZW50LmZpcnN0Q2hpbGQ7XG4gICAgZWxlbWVudC5yZW1vdmVDaGlsZChyZXN1bHQpO1xuICAgIHJldHVybiByZXN1bHQ7XG4gIH0sXG5cbiAgaXNIVE1MID0gZnVuY3Rpb24oc3RyaW5nKSB7XG4gICAgcmV0dXJuIHR5cGVvZiBzdHJpbmcgPT09ICdzdHJpbmcnICYmIHN0cmluZy5tYXRjaCgvPFxcLz9cXHcrKChcXHMrXFx3KyhcXHMqPVxccyooPzpcIi4qP1wifCcuKj8nfFteJ1wiPlxcc10rKSk/KStcXHMqfFxccyopXFwvPz4vKTtcbiAgfSxcbiAgXG5cbiAgZ2V0RWxlbWVudCA9IGZ1bmN0aW9uKHZhbHVlLCBwYXJlbnQpIHtcbiAgXG4gICAgdmFsdWUgPSB2YWx1ZS50b0FycmF5ID8gdmFsdWUudG9BcnJheSgpWzBdIDogdmFsdWUgaW5zdGFuY2VvZiBBcnJheSA/IHZhbHVlWzBdIDogdmFsdWU7XG4gICAgXG4gICAgaWYgKHR5cGVvZiB2YWx1ZSA9PT0gJ2Z1bmN0aW9uJykge1xuICAgICAgdmFsdWUgPSB2YWx1ZS5jYWxsKHRoaXMsIHZhbHVlKTtcbiAgICB9XG4gICAgXG4gICAgaWYgKHR5cGVvZiB2YWx1ZSA9PT0gJ3N0cmluZycpIHtcbiAgICAgIGlmIChpc0hUTUwodmFsdWUpKSB7XG4gICAgICAgIHZhbHVlID0gY3JlYXRlRWxlbWVudCh2YWx1ZSk7XG4gICAgICB9IGVsc2Uge1xuICAgICAgICB2YWx1ZSA9IHBhcmVudC5xdWVyeVNlbGVjdG9yKHZhbHVlKTtcbiAgICAgIH1cbiAgICB9XG4gICAgXG4gICAgaWYgKHZhbHVlICYmIHZhbHVlLm5vZGVOYW1lKSB7XG4gICAgICByZXR1cm4gdmFsdWU7XG4gICAgfVxuICAgIFxuICAgIHJldHVybiBudWxsO1xuICB9O1xuXG5tb2R1bGUuZXhwb3J0cyA9IGZ1bmN0aW9uIEN1cnNvcihlbGVtZW50LCBvcHRpb25zKSB7XG4gICAgXG4gIGZ1bmN0aW9uIHNldChuYW1lLCB2YWx1ZSkge1xuICAgIHZhciBvcHRzO1xuICAgIGlmICh0eXBlb2YgbmFtZSA9PT0gJ29iamVjdCcpIHtcbiAgICAgIG9wdHMgPSBuYW1lO1xuICAgIH0gZWxzZSB7XG4gICAgICBvcHRzID0ge307XG4gICAgICBvcHRzW25hbWVdID0gdmFsdWU7XG4gICAgfVxuICAgIGZvciAobmFtZSBpbiBvcHRzKSB7XG4gICAgICB2YWx1ZSA9IG9wdHNbbmFtZV07XG4gICAgICBzd2l0Y2ggKG5hbWUpIHtcbiAgICAgICAgY2FzZSAnZWxlbWVudCc6XG4gICAgICAgIGNhc2UgJ3N5bWJvbCc6XG4gICAgICAgICAgaWYgKGlzSFRNTCh2YWx1ZSkpIHtcbiAgICAgICAgICAgIHZhbHVlID0gY3JlYXRlRWxlbWVudCh2YWx1ZSk7XG4gICAgICAgICAgfVxuICAgICAgICAgIGJyZWFrO1xuICAgICAgfVxuICAgICAgb3B0c1tuYW1lXSA9IHZhbHVlO1xuICAgIH1cbiAgICBvcHRpb25zID0gbWVyZ2Uob3B0aW9ucywgb3B0cyk7XG4gIH07XG4gIFxuICB0aGlzLnNldCA9IGZ1bmN0aW9uKCkge1xuICAgIHNldC5jYWxsKHRoaXMsIGFyZ3VtZW50cyk7XG4gICAgY3Vyc29yTWFuYWdlci51cGRhdGUoKTtcbiAgfTtcbiAgXG4gIHRoaXMuZ2V0ID0gZnVuY3Rpb24obmFtZSkge1xuICAgIHZhciB2YWx1ZTtcbiAgICBpZiAoIW5hbWUpIHtcbiAgICAgIHZhbHVlID0ge307XG4gICAgICBmb3IgKHZhciB4IGluIG9wdGlvbnMpIHtcbiAgICAgICAgdmFsdWVbeF0gPSB0aGlzLmdldCh4KTtcbiAgICAgIH1cbiAgICB9IGVsc2Uge1xuICAgICAgdmFsdWUgPSBvcHRpb25zW25hbWVdO1xuICAgICAgc3dpdGNoIChuYW1lKSB7XG4gICAgICAgIGNhc2UgJ2VsZW1lbnQnOlxuICAgICAgICBjYXNlICdzeW1ib2wnOlxuICAgICAgICBjYXNlICdib3VuZHMnOlxuICAgICAgICBjYXNlICd0YXJnZXQnOlxuICAgICAgICAgIHZhbHVlID0gdmFsdWUgJiYgdmFsdWUudG9BcnJheSA/IHZhbHVlLnRvQXJyYXkoKVswXSA6IHZhbHVlIGluc3RhbmNlb2YgQXJyYXkgPyB2YWx1ZVswXSA6IHZhbHVlO1xuICAgICAgICAgIHZhbHVlID0gdHlwZW9mIHZhbHVlID09PSAnc3RyaW5nJyA/IChlbGVtZW50IHx8IGRvY3VtZW50KS5xdWVyeVNlbGVjdG9yKHZhbHVlKSA6IHZhbHVlO1xuICAgICAgICAgIGJyZWFrO1xuICAgICAgfVxuICAgICAgc3dpdGNoIChuYW1lKSB7XG4gICAgICAgIGNhc2UgJ3N5bWJvbCc6XG4gICAgICAgICAgdmFsdWUgPSB2YWx1ZSB8fCB0aGlzLmdldCgnZWxlbWVudCcpO1xuICAgICAgICAgIGJyZWFrO1xuICAgICAgICBjYXNlICdib3VuZHMnOlxuICAgICAgICAgIHZhbHVlID0gdmFsdWUgPyB2YWx1ZSA6IG9wdGlvbnNbJ3N5bWJvbCddID8gdGhpcy5nZXQoJ2VsZW1lbnQnKSA6IHRoaXMuZ2V0KCdlbGVtZW50Jykub2Zmc2V0UGFyZW50O1xuICAgICAgICAgIGJyZWFrO1xuICAgICAgfVxuICAgIH1cbiAgICByZXR1cm4gdmFsdWU7XG4gIH07XG4gIFxuICBzZXQobWVyZ2Uoe1xuICAgIGVsZW1lbnQ6IG51bGwsXG4gICAgb2Zmc2V0OiB7bGVmdDogOCwgdG9wOiA2fSxcbiAgICBzdHlsZTogJ3RyYW5zZm9ybScsXG4gICAgc2NhbGU6IDEsXG4gICAgYm91bmRzOiBudWxsLFxuICAgIHN5bWJvbDogbnVsbCxcbiAgICB0YXJnZXQ6IG51bGwsXG4gICAgaGlkZU9uRm9jdXM6IGZhbHNlXG4gIH0sIG9wdGlvbnMsIHtcbiAgICBlbGVtZW50OiBlbGVtZW50XG4gIH0pKTtcbiAgXG59OyIsIlxuXG52YXJcbiAgXG4gIHRvcG1vc3QgPSByZXF1aXJlKCcuL3RvcG1vc3QnKSxcbiAgXG4gIC8qKlxuICAgKiBIeXBoZW5hdGUgYSBzdHJpbmdcbiAgICogQHBhcmFtIHtTdHJpbmd9IHN0cmluZ1xuICAgKi9cbiAgaHlwaGVuYXRlID0gKGZ1bmN0aW9uKCkge1xuICAgIHZhciBjYWNoZSA9IHt9O1xuICAgIHJldHVybiBmdW5jdGlvbihzdHJpbmcpIHtcbiAgICAgIHJldHVybiBjYWNoZVtzdHJpbmddID0gY2FjaGVbc3RyaW5nXSB8fCAoZnVuY3Rpb24oKSB7XG4gICAgICAgIHJldHVybiBzdHJpbmcucmVwbGFjZSgvKFtBLVpdKS9nLCBmdW5jdGlvbigkMSl7cmV0dXJuIFwiLVwiKyQxLnRvTG93ZXJDYXNlKCk7fSk7XG4gICAgICB9KSgpO1xuICAgIH07XG4gIH0pKCksXG4gIFxuICBnZXRTdHlsZSA9IGZ1bmN0aW9uKGVsLCBjc3Nwcm9wKXtcbiAgIGlmIChlbC5jdXJyZW50U3R5bGUpIC8vSUVcbiAgICByZXR1cm4gZWwuY3VycmVudFN0eWxlW2Nzc3Byb3BdO1xuICAgZWxzZSBpZiAoZG9jdW1lbnQuZGVmYXVsdFZpZXcgJiYgZG9jdW1lbnQuZGVmYXVsdFZpZXcuZ2V0Q29tcHV0ZWRTdHlsZSkgLy9GaXJlZm94XG4gICAgcmV0dXJuIGRvY3VtZW50LmRlZmF1bHRWaWV3LmdldENvbXB1dGVkU3R5bGUoZWwsIFwiXCIpW2Nzc3Byb3BdO1xuICAgZWxzZSAvL3RyeSBhbmQgZ2V0IGlubGluZSBzdHlsZVxuICAgIHJldHVybiBlbC5zdHlsZVtjc3Nwcm9wXTtcbiAgfSxcbiAgXG4gIHRyYW5zZm9ybVN0eWxlID0gKGZ1bmN0aW9uKHByb3AsIHByZWZpeGVzKSB7XG4gICAgdmFyIGksXG4gICAgICBlbGVtID0gZG9jdW1lbnQuY3JlYXRlRWxlbWVudCgnZGl2JyksXG4gICAgICBjYXBpdGFsaXplZCA9IHByb3AuY2hhckF0KDApLnRvVXBwZXJDYXNlKCkgKyBwcm9wLnNsaWNlKDEpO1xuICAgIGZvciAoaSA9IDA7IGkgPCBwcmVmaXhlcy5sZW5ndGg7IGkrKykge1xuICAgICAgaWYgKHR5cGVvZiBlbGVtLnN0eWxlW3ByZWZpeGVzW2ldICsgY2FwaXRhbGl6ZWRdICE9PSBcInVuZGVmaW5lZFwiKSB7XG4gICAgICAgIHJldHVybiBwcmVmaXhlc1tpXSArIGNhcGl0YWxpemVkO1xuICAgICAgfVxuICAgIH1cbiAgICByZXR1cm4gbnVsbDtcbiAgfSkoJ3RyYW5zZm9ybScsIFsnJywgJ01veicsICdXZWJraXQnLCAnTycsICdNcyddKSxcbiAgXG4gIGlzQ2hpbGRPZiA9IGZ1bmN0aW9uKHBhcmVudCwgY2hpbGQpIHtcbiAgIGlmICghY2hpbGQgfHwgIXBhcmVudCkge1xuICAgICByZXR1cm4gZmFsc2U7XG4gICB9XG4gICB2YXIgbm9kZSA9IGNoaWxkLnBhcmVudE5vZGU7XG4gICB3aGlsZSAobm9kZSAhPSBudWxsKSB7XG4gICAgIGlmIChub2RlID09IHBhcmVudCkge1xuICAgICAgICAgcmV0dXJuIHRydWU7XG4gICAgIH1cbiAgICAgbm9kZSA9IG5vZGUucGFyZW50Tm9kZTtcbiAgIH1cbiAgIHJldHVybiBmYWxzZTtcbiAgfSxcbiAgXG4gIGNzcyA9IGZ1bmN0aW9uKGVsZW0sIG5hbWUsIHZhbHVlKSB7XG4gICAgdmFyIG1hcCA9IHt9LCBjc3NUZXh0ID0gbnVsbDtcbiAgICBpZiAodHlwZW9mIG5hbWUgPT09ICdvYmplY3QnKSB7XG4gICAgICBtYXAgPSBuYW1lO1xuICAgIH0gZWxzZSBpZiAodHlwZW9mIHZhbHVlICE9PSBcInVuZGVmaW5lZFwiKSB7XG4gICAgICBtYXBbbmFtZV0gPSB2YWx1ZTtcbiAgICB9XG4gICAgdmFyIGtleXMgPSBPYmplY3Qua2V5cyhtYXApO1xuICAgIGtleXMgPSBrZXlzLmZpbHRlcihmdW5jdGlvbihrZXksIGluZGV4KSB7XG4gICAgICBpZiAobWFwW2tleV0gPT09ICcnKSB7XG4gICAgICAgIGVsZW0uc3R5bGVba2V5XSA9IG1hcFtrZXldO1xuICAgICAgICByZXR1cm4gZmFsc2U7XG4gICAgICB9XG4gICAgICByZXR1cm4gdHJ1ZTtcbiAgICB9KTtcbiAgICBjc3NUZXh0ID0ga2V5cy5tYXAoZnVuY3Rpb24obmFtZSkge1xuICAgICAgcmV0dXJuIGh5cGhlbmF0ZShuYW1lKSArIFwiOiBcIiArIG1hcFtuYW1lXTtcbiAgICB9KS5qb2luKFwiOyBcIik7XG4gICAgaWYgKGNzc1RleHQgJiYgY3NzVGV4dC5sZW5ndGgpIHtcbiAgICAgIGVsZW0uc3R5bGUuY3NzVGV4dCA9IGVsZW0uc3R5bGUuY3NzVGV4dCArIGNzc1RleHQ7XG4gICAgICByZXR1cm4gbnVsbDtcbiAgICB9XG4gICAgcmV0dXJuIGVsZW0uc3R5bGVbbmFtZV0gfHwgd2luZG93LmdldENvbXB1dGVkU3R5bGUoZWxlbSwgbnVsbCkuZ2V0UHJvcGVydHlWYWx1ZShuYW1lKTtcbiAgfSxcbiAgXG4gIG9mZnNldCA9IGZ1bmN0aW9uKGVsZW1lbnQpIHtcbiAgICB2YXIgc2Nyb2xsT2Zmc2V0ID0gc2Nyb2xsT2Zmc2V0KCk7XG4gICAgdmFyIHJlY3QgPSBlbGVtZW50LmdldEJvdW5kaW5nQ2xpZW50UmVjdCgpLCBib2R5RWxlbWVudCA9IGRvY3VtZW50LmJvZHk7XG4gICAgcmV0dXJuIHtcbiAgICAgIHRvcDogcmVjdC50b3AgKyBzY3JvbGxPZmZzZXQudG9wLFxuICAgICAgbGVmdDogcmVjdC5sZWZ0ICsgc2Nyb2xsT2Zmc2V0LmxlZnRcbiAgICB9O1xuICB9LFxuICBcbiAgZ2V0U2Nyb2xsT2Zmc2V0ID0gZnVuY3Rpb24oKSB7XG4gICAgcmV0dXJuIHtcbiAgICAgIGxlZnQ6IGRvY3VtZW50LmJvZHkuc2Nyb2xsTGVmdCArIGRvY3VtZW50LmRvY3VtZW50RWxlbWVudC5zY3JvbGxMZWZ0LFxuICAgICAgdG9wOiBkb2N1bWVudC5ib2R5LnNjcm9sbFRvcCArIGRvY3VtZW50LmRvY3VtZW50RWxlbWVudC5zY3JvbGxUb3BcbiAgICB9O1xuICB9LFxuICBcbiAgZ2V0Qm91bmRpbmdSZWN0ID0gZnVuY3Rpb24oZWxlbWVudCkge1xuICAgIGlmICghZWxlbWVudCkge1xuICAgICAgcmV0dXJuIHtcbiAgICAgICAgeDogLUluZmluaXR5LFxuICAgICAgICB5OiAtSW5maW5pdHksXG4gICAgICAgIHdpZHRoOiBJbmZpbml0eSxcbiAgICAgICAgaGVpZ2h0OiBJbmZpbml0eVxuICAgICAgfTtcbiAgICB9XG4gICAgdmFyIHNjcm9sbE9mZnNldCA9IGdldFNjcm9sbE9mZnNldCgpO1xuICAgIHZhciByZWN0ID0gZWxlbWVudC5nZXRCb3VuZGluZ0NsaWVudFJlY3QoKTtcbiAgICByZXR1cm4ge1xuICAgICAgeDogcmVjdC54ICsgc2Nyb2xsT2Zmc2V0LmxlZnQsXG4gICAgICB5OiByZWN0LnkgKyBzY3JvbGxPZmZzZXQudG9wLFxuICAgICAgd2lkdGg6IHJlY3Qud2lkdGgsXG4gICAgICBoZWlnaHQ6IHJlY3QuaGVpZ2h0XG4gICAgfTtcbiAgfSxcbiAgXG4gIC8vIERlY2xhcmUgc2luZ2xldG9uIGluc3RhbmNlXG4gIGluc3RhbmNlID0gbnVsbDtcblxuLyoqXG4gKiBDdXJzb3JNYW5hZ2VyXG4gKiBUaGlzIHNpbmdsZXRvbiBjbGFzcyBoYW5kbGVzIGFsbCBjdXJzb3Igb2JqZWN0cyBcbiAqIEBwYXJhbSB7T2JqZWN0fSBvcHRpb25zXG4gKi9cbmZ1bmN0aW9uIEN1cnNvck1hbmFnZXIob3B0aW9ucykge1xuICAvLyBTaW5nbGV0b24gcGF0dGVyblxuICBpZiAoaW5zdGFuY2UpIHtcbiAgICBpbnN0YW5jZS5zZXQob3B0aW9ucyk7XG4gICAgcmV0dXJuIGluc3RhbmNlO1xuICB9XG4gIGluc3RhbmNlID0gdGhpcztcbiAgLy8gSW1wbGVtZW50YXRpb25cbiAgXG4gIHZhciBjdXJzb3JzID0gW107XG4gIHZhciBjbGllbnQgPSB7eDogMCwgeTogMH07XG4gIHZhciBtb3VzZSA9IHt4OiAtSW5maW5pdHksIHk6IC1JbmZpbml0eSwgZWxlbWVudDogbnVsbH07XG4gIHZhciBldmVudHMgPSBbJ21vdXNlZG93bicsICdjbGljaycsICdzY3JvbGwnLCAncmVzaXplJywgJ21vdXNlbW92ZScsICdtb3VzZW91dCddO1xuICB2YXIgY3Vyc29ySXRlbXMgPSBbXTtcbiAgdmFyIGN1cnNvckl0ZW0gPSBudWxsO1xuICB2YXIgY2xpY2tpbmcgPSBmYWxzZTtcbiAgdmFyIGNsaWNrYWJsZSA9IHRydWU7XG4gIFxuICBmdW5jdGlvbiBpbml0KCkge1xuICAgIGFkZE1vdXNlTGlzdGVuZXJzKHdpbmRvdyk7XG4gIH1cbiAgXG4gIGZ1bmN0aW9uIGhhbmRsZUV2ZW50KGUpIHtcbiAgICAvLyBDaGVjayBmb3IgYWNjZXNzIHRvIGV2ZW50J3MgdHlwZSBwcm9wZXJ0eVxuICAgIHRyeSB7XG4gICAgICBlLnR5cGU7XG4gICAgfSBjYXRjaCAoZSkge1xuICAgICAgY29uc29sZS53YXJuKGUpO1xuICAgICAgcmV0dXJuO1xuICAgIH1cbiAgICAvLyBVcGRhdGUgTW91c2UgUG9zaXRpb25cbiAgICBzd2l0Y2ggKGUudHlwZSkge1xuICAgICAgY2FzZSAnbW91c2Vkb3duJzpcbiAgICAgICAgY2xpY2tpbmcgPSBmYWxzZTtcbiAgICAgICAgYnJlYWs7XG4gICAgICBjYXNlICdtb3VzZW91dCc6XG4gICAgICAgIHZhciByZWxhdGVkVGFyZ2V0ID0gdHlwZW9mIGUudG9FbGVtZW50ICE9ICd1bmRlZmluZWQnID8gZS50b0VsZW1lbnQgOiBlLnJlbGF0ZWRUYXJnZXQ7XG4gICAgICAgIGlmIChyZWxhdGVkVGFyZ2V0ID09PSBudWxsKSB7XG4gICAgICAgICAgbW91c2UueCA9IC1JbmZpbml0eTtcbiAgICAgICAgICBtb3VzZS55ID0gLUluZmluaXR5O1xuICAgICAgICAgIG1vdXNlLmVsZW1lbnQgPSBudWxsO1xuICAgICAgICB9XG4gICAgICAgIGJyZWFrO1xuICAgICAgY2FzZSAnbW91c2Vtb3ZlJzpcbiAgICAgICAgLy8gR2V0IG1vdXNlIGNvb3JkaW5hdGVzXG4gICAgICAgIC8vIFVwZGF0ZSBtb3VzZSBjb29yZGluYXRlc1xuICAgICAgICBjbGllbnQueCA9IGUuY2xpZW50WDtcbiAgICAgICAgY2xpZW50LnkgPSBlLmNsaWVudFk7XG4gICAgICBkZWZhdWx0OlxuICAgICAgdmFyIHNjcm9sbE9mZnNldCA9IGdldFNjcm9sbE9mZnNldCgpO1xuICAgICAgbW91c2UueCA9IGNsaWVudC54ICsgc2Nyb2xsT2Zmc2V0LmxlZnQ7XG4gICAgICBtb3VzZS55ID0gY2xpZW50LnkgKyBzY3JvbGxPZmZzZXQudG9wO1xuICAgICAgbW91c2UuZWxlbWVudCA9IGUudGFyZ2V0O1xuICAgIH1cbiAgICBcbiAgICAvLyBHZXQgQ3Vyc29yIFByb3BzXG4gICAgaW52YWxpZGF0ZS5jYWxsKHRoaXMpO1xuICAgIFxuICAgIC8vIFByb2Nlc3MgQ2xpY2tcbiAgICBzd2l0Y2ggKGUudHlwZSkge1xuICAgICAgY2FzZSAnY2xpY2snOlxuICAgICAgICBpZiAoIWNsaWNraW5nICYmIGN1cnNvckl0ZW0pIHtcbiAgICAgICAgICBpZiAobW91c2UuZWxlbWVudCAmJiBjdXJzb3JJdGVtICYmIGN1cnNvckl0ZW0udGFyZ2V0ICYmIGN1cnNvckl0ZW0uc3ltYm9sICE9PSBtb3VzZS5lbGVtZW50ICYmIGlzQ2hpbGRPZihjdXJzb3JJdGVtLmNvbnRhaW5lciwgbW91c2UuZWxlbWVudCkpIHtcbiAgICAgICAgICAgIC8vZS5zdG9wSW1tZWRpYXRlUHJvcGFnYXRpb24oKTtcbiAgICAgICAgICAgIC8vZS5wcmV2ZW50RGVmYXVsdCgpO1xuICAgICAgICAgICAgY2xpY2tpbmcgPSB0cnVlO1xuICAgICAgICAgICAgY3Vyc29ySXRlbS50YXJnZXQuY2xpY2soKTtcbiAgICAgICAgICB9XG4gICAgICAgIH1cbiAgICAgICAgYnJlYWs7XG4gICAgfVxuICAgIC8vIFVwZGF0ZSBjdXJzb3JzXG4gICAgcmVuZGVyLmNhbGwoaW5zdGFuY2UpO1xuICB9XG4gIFxuICBmdW5jdGlvbiBpc0NsaWNrYWJsZShjdXJzb3JJdGVtKSB7XG4gICAgdmFyIGVsZW1lbnQgPSBtb3VzZS5lbGVtZW50O1xuICAgIGlmIChlbGVtZW50KSB7XG4gICAgICBpZiAoY3Vyc29ySXRlbSAmJiBjdXJzb3JJdGVtLnRhcmdldCAmJiBjdXJzb3JJdGVtLnN5bWJvbCAhPT0gZWxlbWVudCAmJiBpc0NoaWxkT2YoY3Vyc29ySXRlbS5jb250YWluZXIsIGVsZW1lbnQpKSB7XG4gICAgICAgIC8vaWYgKCFvcHRzLmhpZGVPbkZvY3VzIHx8ICFpc0NoaWxkT2YoZWxlbWVudCwgZG9jdW1lbnQuYWN0aXZlRWxlbWVudCkgJiYgZWxlbWVudCAhPT0gZG9jdW1lbnQuYWN0aXZlRWxlbWVudCkge1xuICAgICAgICByZXR1cm4gdHJ1ZTtcbiAgICAgIH1cbiAgICB9XG4gICAgcmV0dXJuIGZhbHNlO1xuICB9IFxuICBcbiAgZnVuY3Rpb24gaW52YWxpZGF0ZSgpIHtcbiAgICBcbiAgICBjdXJzb3JJdGVtcyA9IGN1cnNvcnMubWFwKGZ1bmN0aW9uKGN1cnNvciwgaW5kZXgpIHtcbiAgICAgIHJldHVybiBnZXRDdXJzb3JJdGVtKGN1cnNvciwgY3Vyc29ySXRlbXNbaW5kZXhdKTtcbiAgICB9KTtcbiAgICBcbiAgICBjdXJzb3JJdGVtID0gY3Vyc29ySXRlbXMuZmlsdGVyKGZ1bmN0aW9uKGN1cnNvckl0ZW0sIGluZGV4KSB7XG4gICAgICB2YXIgbW91c2VFbGVtZW50ID0gbW91c2UuZWxlbWVudCwgc3ltYm9sID0gY3Vyc29ySXRlbS5zeW1ib2wsIGJvdW5kcyA9IGN1cnNvckl0ZW0uYm91bmRzLCBjb250YWluZXIgPSBjdXJzb3JJdGVtLmNvbnRhaW5lciwgcmVzdWx0ID0gZmFsc2U7XG4gICAgICAvLyBEZXRlY3QgaWYgYSBtb3VzZSBlbGVtZW50IGV4aXN0cyBhbmQgdGhhdCBpdCdzIG5vdCB0aGUgc3ltYm9sIGl0c2VsZlxuICAgICAgaWYgKG1vdXNlRWxlbWVudCAmJiBzeW1ib2wgIT09IG1vdXNlRWxlbWVudCkge1xuICAgICAgICAvLyBEZXRlY3QgaWYgc3ltYm9sIGlzIHRvcG1vc3QgZWxlbWVudFxuICAgICAgICBpZiAodG9wbW9zdChtb3VzZUVsZW1lbnQsIHN5bWJvbCkgPT09IHN5bWJvbCkge1xuICAgICAgICAgIC8vIERldGVjdCBpZiBtb3VzZSBlbGVtZW50IGlzIGNvbnRhaW5lZFxuICAgICAgICAgIGlmIChjb250YWluZXIgPT09IG1vdXNlRWxlbWVudCB8fCBpc0NoaWxkT2YoY29udGFpbmVyLCBtb3VzZUVsZW1lbnQpKSB7XG4gICAgICAgICAgICAvLyBNYXRjaCBib3VuZHNcbiAgICAgICAgICAgIHJlc3VsdCA9IChtb3VzZS54ID49IGJvdW5kcy54ICYmIG1vdXNlLnggPD0gYm91bmRzLnggKyBib3VuZHMud2lkdGggJiYgbW91c2UueSA+PSBib3VuZHMueSAmJiBtb3VzZS55IDw9IGJvdW5kcy55ICsgYm91bmRzLmhlaWdodCk7XG4gICAgICAgICAgfVxuICAgICAgICB9XG4gICAgICB9XG4gICAgICByZXR1cm4gcmVzdWx0O1xuICAgIH0pLnNvcnQoZnVuY3Rpb24oYSwgYikge1xuICAgICAgdmFyIHpFbGVtZW50ID0gdG9wbW9zdChhLnN5bWJvbCwgYi5zeW1ib2wpO1xuICAgICAgaWYgKHpFbGVtZW50ID09PSBhLnN5bWJvbCkge1xuICAgICAgICByZXR1cm4gYTtcbiAgICAgIH0gZWxzZSBpZiAoekVsZW1lbnQgPT09IGIuc3ltYm9sKSB7XG4gICAgICAgIHJldHVybiBiO1xuICAgICAgfVxuICAgICAgXG4gICAgICB2YXIgcDEgPSB7eDogYS54ICsgYS53aWR0aCAvIDIsIHk6IGEueSArIGEuaGVpZ2h0IC8gMn07XG4gICAgICB2YXIgcDIgPSB7eDogYi54ICsgYi53aWR0aCAvIDIsIHk6IGIueSArIGIuaGVpZ2h0IC8gMn07XG4gICAgICB2YXIgZDEgPSBNYXRoLnNxcnQoIE1hdGgucG93KChwMS54IC0gbW91c2UueCksIDIpICsgTWF0aC5wb3coKHAxLnkgLSBtb3VzZS55KSwgMikgKTtcbiAgICAgIHZhciBkMiA9IE1hdGguc3FydCggTWF0aC5wb3coKHAyLnggLSBtb3VzZS54KSwgMikgKyBNYXRoLnBvdygocDIueSAtIG1vdXNlLnkpLCAyKSApO1xuICAgICAgcmV0dXJuIGQxIDwgZDIgPyBkMSA6IGQxID4gZDIgPyBkMiA6IDA7XG4gICAgfSkucmV2ZXJzZSgpWzBdO1xuICAgIFxuICAgIC8vIFNldCBNb3VzZVByb3ZpZGVyc1xuICAgIHNldE1vdXNlUHJvdmlkZXJzKFt3aW5kb3ddLmNvbmNhdChjdXJzb3JJdGVtcy5tYXAoZnVuY3Rpb24oaXRlbSkge1xuICAgICAgcmV0dXJuIGl0ZW0uY29udGFpbmVyO1xuICAgIH0pKSk7XG4gICAgLy9zZXRNb3VzZVByb3ZpZGVycyhbd2luZG93XSk7XG4gIH1cbiAgXG4gIGZ1bmN0aW9uIHJlbmRlcigpIHtcblxuICAgIGN1cnNvckl0ZW1zLmZvckVhY2goZnVuY3Rpb24oaXRlbSkge1xuICAgICAgaWYgKGl0ZW0gIT09IGN1cnNvckl0ZW0pIHtcbiAgICAgICAgY3NzKGl0ZW0uc3ltYm9sLCB7XG4gICAgICAgICAgZGlzcGxheTogJ25vbmUnXG4gICAgICAgIH0pO1xuICAgICAgfVxuICAgIH0pO1xuICAgIFxuICAgIGlmIChjdXJzb3JJdGVtKSB7XG4gICAgICB2YXIgc3ltYm9sID0gY3Vyc29ySXRlbS5zeW1ib2w7XG4gICAgICBcbiAgICAgIHZhciBzdHlsZSA9IHtcbiAgICAgICAgZGlzcGxheTogJ2lubGluZS1ibG9jaycsXG4gICAgICAgIHBvc2l0aW9uOiAnYWJzb2x1dGUnXG4gICAgICB9O1xuICAgICAgXG4gICAgICBzdHlsZVt0cmFuc2Zvcm1TdHlsZV0gPSBcIlwiO1xuICAgICAgc3R5bGVbdHJhbnNmb3JtU3R5bGUgKyBcIk9yaWdpblwiXSA9ICcnO1xuICAgICAgXG4gICAgICAkKHN5bWJvbCkuY3NzKHN0eWxlKTtcbiAgICAgIFxuICAgICAgdmFyIHBvcyA9ICQoc3ltYm9sKS5vZmZzZXQoKTtcbiAgICAgIFxuICAgICAgdmFyIHB4ID0gcG9zLmxlZnQ7XG4gICAgICB2YXIgcHkgPSBwb3MudG9wO1xuICAgICAgXG4gICAgICB2YXIgb2ZmID0gY3Vyc29ySXRlbS5vZmZzZXQ7XG4gICAgICB2YXIgeCA9IE1hdGgucm91bmQoKG1vdXNlLnggLSBweCkgKyBvZmYubGVmdCk7XG4gICAgICB2YXIgeSA9IE1hdGgucm91bmQoKG1vdXNlLnkgLSBweSkgKyBvZmYudG9wKTtcbiAgICAgIFxuICAgICAgc3R5bGUgPSB7XG4gICAgICAgIC8vYm9yZGVyOiAnMXB4IHNvbGlkIGJsdWUnXG4gICAgICB9O1xuICAgICAgXG4gICAgICBpZiAoY3Vyc29ySXRlbS5zdHlsZSA9PT0gJ3RyYW5zZm9ybScgJiYgdHJhbnNmb3JtU3R5bGUpIHtcbiAgICAgICAgc3R5bGVbdHJhbnNmb3JtU3R5bGUgKyBcIk9yaWdpblwiXSA9ICcwIDAnO1xuICAgICAgICBzdHlsZVt0cmFuc2Zvcm1TdHlsZV0gPSBcInRyYW5zbGF0ZTNkKFwiICsgeCArIFwicHgsXCIgKyB5ICsgXCJweCwgMCkgc2NhbGUoXCIgKyBjdXJzb3JJdGVtLnNjYWxlICsgXCIsXCIgKyBjdXJzb3JJdGVtLnNjYWxlICsgXCIpXCI7XG4gICAgICB9IGVsc2Uge1xuICAgICAgICBzdHlsZS5sZWZ0ID0geCArIHBvcy5sZWZ0O1xuICAgICAgICBzdHlsZS50b3AgPSB5ICsgcG9zLnRvcDtcbiAgICAgIH1cbiAgICAgIFxuICAgICAgJChzeW1ib2wpLmNzcyhzdHlsZSk7XG4gICAgfVxuICB9O1xuICBcbiAgdGhpcy51cGRhdGUgPSBmdW5jdGlvbigpIHtcbiAgICBpbnZhbGlkYXRlLmNhbGwodGhpcyk7XG4gICAgcmVuZGVyLmNhbGwodGhpcyk7XG4gIH07XG4gIFxuICB0aGlzLmFkZCA9IGZ1bmN0aW9uKGN1cnNvcikge1xuICAgIGlmIChjdXJzb3JzLmluZGV4T2YoY3Vyc29yKSA9PT0gLTEpIHtcbiAgICAgIGN1cnNvcnMucHVzaChjdXJzb3IpO1xuICAgICAgdGhpcy51cGRhdGUoKTtcbiAgICB9XG4gIH07XG4gIFxuICB0aGlzLnJlbW92ZSA9IGZ1bmN0aW9uKGN1cnNvcikge1xuICAgIGN1cnNvcnMuc3BsaWNlKGN1cnNvcnMuaW5kZXhPZihjdXJzb3IpLCAxKTtcbiAgICB0aGlzLnVwZGF0ZSgpO1xuICB9O1xuICBcbiAgdmFyIG1vdXNlUHJvdmlkZXJzID0gW107XG4gIGZ1bmN0aW9uIHNldE1vdXNlUHJvdmlkZXJzKGVsZW1lbnRzKSB7XG4gICAgZWxlbWVudHMgPSAkLmdyZXAoZWxlbWVudHMsIGZ1bmN0aW9uKG4pIHsgcmV0dXJuIChuKTsgfSk7XG4gICAgbW91c2VQcm92aWRlcnMuZm9yRWFjaChmdW5jdGlvbihlbGVtZW50KSB7XG4gICAgICBpZiAoZWxlbWVudHMuaW5kZXhPZihlbGVtZW50KSA9PT0gLTEpIHtcbiAgICAgICAgcmVtb3ZlTW91c2VMaXN0ZW5lcnMoZWxlbWVudCk7XG4gICAgICB9XG4gICAgfSk7XG4gICAgZWxlbWVudHMuZm9yRWFjaChmdW5jdGlvbihlbGVtZW50KSB7XG4gICAgICBpZiAobW91c2VQcm92aWRlcnMuaW5kZXhPZihlbGVtZW50KSA9PT0gLTEpIHtcbiAgICAgICAgYWRkTW91c2VMaXN0ZW5lcnMoZWxlbWVudCk7XG4gICAgICB9XG4gICAgfSk7XG4gICAgbW91c2VQcm92aWRlcnMgPSBlbGVtZW50cztcbiAgfVxuICBcbiAgZnVuY3Rpb24gYWRkTW91c2VMaXN0ZW5lcnMoZWxlbWVudCkge1xuICAgIGZvciAodmFyIGkgPSAwLCBldmVudDsgZXZlbnQgPSBldmVudHNbaV07IGkrKykge1xuICAgICAgZWxlbWVudC5hZGRFdmVudExpc3RlbmVyKGV2ZW50LCBoYW5kbGVFdmVudCk7XG4gICAgfVxuICB9XG4gIFxuICBmdW5jdGlvbiByZW1vdmVNb3VzZUxpc3RlbmVycyhlbGVtZW50KSB7XG4gICAgZm9yICh2YXIgaSA9IDAsIGV2ZW50OyBldmVudCA9IGV2ZW50c1tpXTsgaSsrKSB7XG4gICAgICBlbGVtZW50LnJlbW92ZUV2ZW50TGlzdGVuZXIoZXZlbnQsIGhhbmRsZUV2ZW50KTtcbiAgICB9XG4gIH1cbiAgXG4gIGluaXQuY2FsbCh0aGlzKTtcbiAgXG59XG5cblxuXG5mdW5jdGlvbiBnZXRDdXJzb3JJdGVtKGN1cnNvcikge1xuICBcbiAgdmFyXG4gICAgZWxlbWVudCA9IGN1cnNvci5nZXQoJ2VsZW1lbnQnKSxcbiAgICBwcm9wcywgc3ltYm9sLCBib3VuZHMsIGNvbnRhaW5lciwgb2Zmc2V0LCBzdHlsZSwgc2NhbGU7XG4gICAgXG4gIGNzcyhlbGVtZW50LCB7XG4gICAgZGlzcGxheTogJydcbiAgfSk7XG4gIFxuICBwcm9wcyA9IGN1cnNvci5nZXQoKTtcbiAgXG4gIHN5bWJvbCA9IHByb3BzLnN5bWJvbDtcbiAgYm91bmRzID0gcHJvcHMuYm91bmRzO1xuICBvZmZzZXQgPSBwcm9wcy5vZmZzZXQ7XG4gIHN0eWxlID0gcHJvcHMuc3R5bGU7XG4gIHNjYWxlID0gcHJvcHMuc2NhbGU7XG4gIFxuICAvLyBBZGQgY3Vyc29yIHN5bWJvbCB0byBkb21cbiAgaWYgKCFzeW1ib2wucGFyZW50Tm9kZSkge1xuICAgIGVsZW1lbnQuYXBwZW5kQ2hpbGQoc3ltYm9sKTtcbiAgfVxuICBcbiAgXG4gIC8vIEdldCBib3VuZHNcbiAgdmFyIGNvbnRhaW5lcjtcbiAgaWYgKGJvdW5kcyAmJiBib3VuZHMuZ2V0Qm91bmRpbmdDbGllbnRSZWN0KSB7XG4gICAgLy8gRWxlbWVudCBib3VuZHNcbiAgICBjb250YWluZXIgPSBib3VuZHM7XG4gICAgYm91bmRzID0gZ2V0Qm91bmRpbmdSZWN0KGJvdW5kcyk7XG4gIH0gZWxzZSB7XG4gICAgLy8gT2JqZWN0IGJvdW5kc1xuICAgIGNvbnRhaW5lciA9IHN5bWJvbC5vZmZzZXRQYXJlbnQ7XG4gICAgdmFyIHJlY3QgPSBnZXRCb3VuZGluZ1JlY3QoY29udGFpbmVyKTtcbiAgICB2YXIgY29udGFpbmVyUG9zID0gJChjb250YWluZXIpLm9mZnNldCgpIHx8IHt4OiAwLCB5OiAwfTtcbiAgICAvLyBQcm9jZXNzIGZ1bmN0aW9uIFxuICAgIGlmICh0eXBlb2YgYm91bmRzID09PSAnZnVuY3Rpb24nKSB7XG4gICAgICBib3VuZHMgPSBib3VuZHMoY29udGFpbmVyKTtcbiAgICB9XG4gICAgLy8gR2V0IHBlcmNlbnQgdmFsdWVzXG4gICAgdmFyIHggPSB0eXBlb2YgYm91bmRzLnggPT09ICdzdHJpbmcnICYmIGJvdW5kcy54LmluZGV4T2YoXCIlXCIpID49IDAgPyBwYXJzZUZsb2F0KGJvdW5kcy54KSAqIHJlY3Qud2lkdGggLyAxMDAgOiBwYXJzZUZsb2F0KGJvdW5kcy54KTtcbiAgICB2YXIgeSA9IHR5cGVvZiBib3VuZHMueSA9PT0gJ3N0cmluZycgJiYgYm91bmRzLnkuaW5kZXhPZihcIiVcIikgPj0gMCA/IHBhcnNlRmxvYXQoYm91bmRzLnkpICogcmVjdC5oZWlnaHQgLyAxMDAgOiBwYXJzZUZsb2F0KGJvdW5kcy55KTtcbiAgICB2YXIgd2lkdGggPSB0eXBlb2YgYm91bmRzLndpZHRoID09PSAnc3RyaW5nJyAmJiBib3VuZHMud2lkdGguaW5kZXhPZihcIiVcIikgPj0gMCA/IHBhcnNlRmxvYXQoYm91bmRzLndpZHRoKSAqIHJlY3Qud2lkdGggLyAxMDAgOiBwYXJzZUZsb2F0KGJvdW5kcy53aWR0aCk7XG4gICAgdmFyIGhlaWdodCA9IHR5cGVvZiBib3VuZHMuaGVpZ2h0ID09PSAnc3RyaW5nJyAmJiBib3VuZHMuaGVpZ2h0LmluZGV4T2YoXCIlXCIpID49IDAgPyBwYXJzZUZsb2F0KGJvdW5kcy5oZWlnaHQpICogcmVjdC5oZWlnaHQgLyAxMDAgOiBwYXJzZUZsb2F0KGJvdW5kcy5oZWlnaHQpO1xuICAgIGJvdW5kcyA9IHtcbiAgICAgIHg6IGNvbnRhaW5lclBvcy5sZWZ0ICsgeCxcbiAgICAgIHk6IGNvbnRhaW5lclBvcy50b3AgKyB5LFxuICAgICAgd2lkdGg6IHdpZHRoLFxuICAgICAgaGVpZ2h0OiBoZWlnaHRcbiAgICB9O1xuICB9XG4gIFxuICB2YXIgdGFyZ2V0ID0gcHJvcHMudGFyZ2V0IHx8IHN5bWJvbC5ub2RlTmFtZS50b0xvd2VyQ2FzZSgpID09PSAnYScgPyBzeW1ib2wgOiBlbGVtZW50O1xuICBcbiAgcmV0dXJuIHtcbiAgICBjdXJzb3I6IGN1cnNvcixcbiAgICBzeW1ib2w6IHN5bWJvbCxcbiAgICBib3VuZHM6IGJvdW5kcyxcbiAgICBjb250YWluZXI6IGNvbnRhaW5lcixcbiAgICB0YXJnZXQ6IHRhcmdldCxcbiAgICBvZmZzZXQ6IG9mZnNldCxcbiAgICBzdHlsZTogc3R5bGUsXG4gICAgc2NhbGU6IHNjYWxlXG4gIH07XG59XG5cbm1vZHVsZS5leHBvcnRzID0gQ3Vyc29yTWFuYWdlcjsiLCJ2YXIgXG5cbiAgZ2V0U3R5bGUgPSBmdW5jdGlvbihlbCwgY3NzcHJvcCl7XG4gICAgaWYgKGVsLmN1cnJlbnRTdHlsZSkgLy9JRVxuICAgICAgcmV0dXJuIGVsLmN1cnJlbnRTdHlsZVtjc3Nwcm9wXTtcbiAgICBlbHNlIGlmIChkb2N1bWVudC5kZWZhdWx0VmlldyAmJiBkb2N1bWVudC5kZWZhdWx0Vmlldy5nZXRDb21wdXRlZFN0eWxlKSAvL0ZpcmVmb3hcbiAgICAgIHJldHVybiBkb2N1bWVudC5kZWZhdWx0Vmlldy5nZXRDb21wdXRlZFN0eWxlKGVsLCBcIlwiKVtjc3Nwcm9wXTtcbiAgICBlbHNlIC8vdHJ5IGFuZCBnZXQgaW5saW5lIHN0eWxlXG4gICAgICByZXR1cm4gZWwuc3R5bGVbY3NzcHJvcF07XG4gIH07XG5cbmZ1bmN0aW9uIGdldEFuY2VzdG9yc0FzQXJyYXkoZWxlbWVudCl7XG4gIHZhciBhcnIgPSBuZXcgQXJyYXkoKTtcbiAgYXJyLnVuc2hpZnQoZWxlbWVudCk7XG4gIHdoaWxlIChhcnJbMF0ucGFyZW50Tm9kZSl7XG4gICAgYXJyLnVuc2hpZnQoYXJyWzBdLnBhcmVudE5vZGUpO1xuICB9XG4gIHJldHVybiBhcnI7XG59XG5cbmZ1bmN0aW9uIGhpZ2hlc3RJbml0aWFsWkluZGV4KGVsZW1lbnRBcnIpe1xuICBmb3IgKHZhciBpID0gMDsgaSA8IGVsZW1lbnRBcnIubGVuZ3RoOyBpKyspIHtcbiAgICAgIGlmIChlbGVtZW50QXJyW2ldLnN0eWxlID09IHVuZGVmaW5lZCkgY29udGludWU7XG4gICAgICB2YXIgciA9IGdldFN0eWxlKGVsZW1lbnRBcnJbaV0sICd6SW5kZXgnKTtcbiAgICAgIGlmICghaXNOYU4ocikgJiYgciE9XCJcIikge1xuICAgICAgICAgIHJldHVybiByO1xuICAgICAgfVxuICB9XG4gIHJldHVybiB1bmRlZmluZWQ7XG59XG5cbmZ1bmN0aW9uIGZpbmRDb21tb25BbmNlc3RvcihlbGVtZW50QXJyMSwgZWxlbWVudEFycjIpe1xuICB2YXIgY29tbW9uQW5jZXN0b3I7XG4gIGZvciAodmFyIGk9MDsgaTxlbGVtZW50QXJyMS5sZW5ndGg7IGkrKyl7XG4gICAgaWYgKGVsZW1lbnRBcnIxW2ldID09IGVsZW1lbnRBcnIyW2ldKSB7XG4gICAgICAgIGNvbW1vbkFuY2VzdG9yID0gZWxlbWVudEFycjFbaV07XG4gICAgfVxuICB9XG4gIHJldHVybiBjb21tb25BbmNlc3Rvcjtcbn1cblxuZnVuY3Rpb24gZmluZEhpZ2hlc3RBYnNvbHV0ZUluZGV4KGVsZW1lbnQxLCBlbGVtZW50Mil7XG4gIHZhciBhcnIxID0gZ2V0QW5jZXN0b3JzQXNBcnJheShlbGVtZW50MSk7XG4gIHZhciBhcnIyID0gZ2V0QW5jZXN0b3JzQXNBcnJheShlbGVtZW50Mik7XG5cbiAgLy8gRG9lcyBhbiBhbmNlc3RvciBvZiBvbmUgZWxtZW50IHNpbXBseSBoYXZlIGEgaGlnaGVyIHotaW5kZXg/XG4gIHZhciBhcnIxWiA9IGhpZ2hlc3RJbml0aWFsWkluZGV4KGFycjEpO1xuICB2YXIgYXJyMlogPSBoaWdoZXN0SW5pdGlhbFpJbmRleChhcnIyKTtcbiAgaWYgKGFycjFaID4gYXJyMlogfHwgKCFpc05hTihhcnIxWikgJiYgaXNOYU4oYXJyMlopKSkgcmV0dXJuIGVsZW1lbnQxO1xuICBpZiAoYXJyMlogPiBhcnIxWiB8fCAoIWlzTmFOKGFycjJaKSAmJiBpc05hTihhcnIxWikpKSByZXR1cm4gZWxlbWVudDI7XG5cbiAgLy8gSXMgb25lIGVsZW1lbnQgYSBkZXNjZW5kZW50IG9mIHRoZSBvdGhlcj9cbiAgdmFyIGNvbW1vbkFuY2VzdG9yID0gZmluZENvbW1vbkFuY2VzdG9yKGFycjEsIGFycjIpO1xuICBpZiAoIWNvbW1vbkFuY2VzdG9yKSB7XG4gICAgcmV0dXJuIGVsZW1lbnQxO1xuICB9XG4gIGlmIChjb21tb25BbmNlc3RvciA9PSBlbGVtZW50MSkgcmV0dXJuIGVsZW1lbnQyO1xuICBpZiAoY29tbW9uQW5jZXN0b3IgPT0gZWxlbWVudDIpIHJldHVybiBlbGVtZW50MTtcblxuICAvLyBPSywgd2hpY2ggaGFzIHRoZSBvbGRlc3QgY29tbW9uIHNpYmxpbmc/IChHcmVhdGVyIGluZGV4IG9mIGNoaWxkIG5vZGUgZm9yIGFuIGVsZW1lbnQgPSBcIm9sZGVyXCIgY2hpbGQpXG4gIHZhciBpbmRleE9mQ29tbW9uQW5jZXN0b3I7XG4gIGZvciAodmFyIGk9MDsgaTxhcnIxLmxlbmd0aDsgaSsrKXtcbiAgICBpZiAoYXJyMVtpXSA9PSBjb21tb25BbmNlc3Rvcikge1xuICAgICAgaW5kZXhPZkNvbW1vbkFuY2VzdG9yID0gaTtcbiAgICAgIGJyZWFrO1xuICAgIH1cbiAgfVxuXG4gIGZvciAodmFyIGo9Y29tbW9uQW5jZXN0b3IuY2hpbGROb2Rlcy5sZW5ndGg7IGo+PTA7IGotLSkge1xuICAgIGlmIChhcnIxW2luZGV4T2ZDb21tb25BbmNlc3RvcisxXSA9PSBjb21tb25BbmNlc3Rvci5jaGlsZE5vZGVzW2pdKSByZXR1cm4gZWxlbWVudDE7XG4gICAgaWYgKGFycjJbaW5kZXhPZkNvbW1vbkFuY2VzdG9yKzFdID09IGNvbW1vbkFuY2VzdG9yLmNoaWxkTm9kZXNbal0pIHJldHVybiBlbGVtZW50MjtcbiAgfSAgIFxufVxubW9kdWxlLmV4cG9ydHMgPSBmaW5kSGlnaGVzdEFic29sdXRlSW5kZXg7Il19
