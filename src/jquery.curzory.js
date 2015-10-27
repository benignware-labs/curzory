var
  curzory = require('./curzory'),
  $ = (function($) {
    try {
      return require('jquery');
    } catch (e) {
      return $; 
    }
  })(jQuery);

if ($) {
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
