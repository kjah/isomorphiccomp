(function($) {
	$.fn.sliders = function(config) {
		$(this).each(function() {
			var that = this;
			var bindIpt;
			var range = $(this);

			do {
				bindIpt = $('[name="'+$( this ).attr("for")+'"]', range);
				range = range.parent();
			}
			while(bindIpt.length!=1)

			$(this).slider( {
				value:bindIpt.val(), min: bindIpt.attr("min")-0, 
				max:bindIpt.attr("max")-0 ,
				range:"min",
				step:bindIpt.attr("step")-0,
				slide:function( event, ui ) {
					bindIpt.val(ui.value).trigger("change");
				}
			});
			bindIpt.change(function() {
			
				$( that ).slider( {value: $(this).val()} );
			});
		});
	}
})(jQuery);