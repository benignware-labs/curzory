# curzory
> Advanced cursor control


[Demo](http://benignware-labs.github.io/curzory)

## Usage

Include the library

```html
<script src="curzory.js"></script>

```

The following example will create an icon cursor handle on the paragraph and toggle a class on click:

We'll be using Glyphicons in this example. So we need to include Bootstrap as well:

```html
<link rel="stylesheet" href="http://maxcdn.bootstrapcdn.com/bootstrap/3.3.5/css/bootstrap.min.css"></link>
```

#### Vanilla JS

```html
<p class="cursor-pane">Lorem ipsum dolor sit amet</p>
```

```css
.cursor-pane.colored,
.cursor-pane .cursor-symbol {
  color: red;
}
```

```js
var cursorPane = document.querySelector('.cursor-pane');
curzory(cursorPane, {
  symbol: '<i class="cursor-symbol glyphicon glyphicon-heart"></i>'
});
cursorPane.addEventListener('click', function() {
  this.classList.toggle('colored');
});
```

#### jQuery

Same example using jquery:

```html
<script src="http://code.jquery.com/jquery-1.11.3.min.js"></script>
<script src="jquery.curzory.min.js"></script>
```

```html
<p class="cursor-pane-jquery">Lorem ipsum dolor sit amet</p>
```

```css
.cursor-pane-jquery.colored,
.cursor-pane-jquery .cursor-symbol {
  color: red;
}
```

```js
$(".cursor-pane-jquery").curzory({
  symbol: '<i class="cursor-symbol glyphicon glyphicon-heart"></i>'
}).on('click', function() {
  $(this).toggleClass('colored');
});
```

### Enhance slider buttons with curzory

#### Swiper

```html
<link rel="stylesheet" href="http://cdnjs.cloudflare.com/ajax/libs/Swiper/3.0.7/css/swiper.min.css">
<script src="http://cdnjs.cloudflare.com/ajax/libs/Swiper/3.0.7/js/swiper.min.js"></script>
<script src="http://cdnjs.cloudflare.com/ajax/libs/Swiper/3.0.7/js/swiper.jquery.min.js"></script>
```


```html
<div class="swiper-container">
  <!-- Additional required wrapper -->
  <div class="swiper-wrapper">
    <!-- Slides -->
    <div class="swiper-slide">
      <div class="slide-content">
         Slide 1
      </div>
    </div>
    <div class="swiper-slide">
      <div class="slide-content">
         Slide 2
      </div>
    </div>
    <div class="swiper-slide">
      <div class="slide-content">
         Slide 3
      </div>
    </div>
  </div>
  <!-- If we need pagination -->
  <div class="swiper-pagination"></div>
  
  <!-- If we need navigation buttons -->
  <div class="swiper-button-prev"></div>
  <div class="swiper-button-next"></div>
</div>
```

```css
.swiper-container {
  height: 300px;
}
.swiper-slide .slide-content {
  text-align: center;
  padding: 30px;
}
```

```js
$(function() {
   $('.swiper-button-next').curzory({
     bounds: {
       x: "85%",
       y: "0",
       width: "15%",
       height: "100%"
     }
   });
   $('.swiper-button-prev').curzory({
     bounds: {
       x: "0",
       y: "0",
       width: "15%",
       height: "100%"
     }
   });
   $('.swiper-container').swiper({
     nextButton: '.swiper-button-next',
     prevButton: '.swiper-button-prev',
     pagination: '.swiper-pagination'
   });
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