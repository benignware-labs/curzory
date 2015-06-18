# curzory
> Advanced cursor control

## Usage

The following example will create an icon cursor handle on the paragraph and toggle a class on click:

```html
<p class="cursor-pane">Lorem ipsum dolor sit amet</p>  
```

#### Vanilla JS

```js
var cursorPane = document.querySelector('.cursor-pane');
curzory(cursorPane, {
  symbol: '<i class="cursor-symbol glyphicon glyphicon-heart"></i>'
});
cursorPane.addEventListener('click', function() {
  this.classList.toggle('red');
});
```

#### jQuery

```js
$(".cursor-pane").curzory({
  symbol: '<i class="cursor-symbol glyphicon glyphicon-heart"></i>'
}).on('click', function() {
  $(this).toggleClass('red');
});

```


## Options

<table>
  <thead>
    <tr>
      <th>Name</th>
      <th>Description</th>
    </tr>
  </thead>
  <tbody>
    <tr>
      <td>bounds</td>
      <td>Specify a selector, an element, a rect containing x-, y-, width- and height-properties relative to the offset-parent of the element or a function returning a rect used as a bounding box for cursor activity</td>
    </tr>
    <tr>
      <td>offset</td>
      <td>A point object containing x- and y-properties specifying the position of the cursor handle relative to the mouse pointer.</td>
    </tr>
    <tr>
      <td>symbol</td>
      <td>A selector, an element or a portion of markup specifying the cursor handle. Defaults to the element itself.</td> 
    </tr>
    <tr>
      <td>target</td>
      <td>The click target. Defaults to the element itself</td>
    </tr>
  </tbody>
</table>