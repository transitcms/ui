//= require ../transit

(function($, undefined){
	
	var Deliverable = function( element, opts ){
		var self 	 = this,
			node 	 = $(element),
			options  = {},
			contexts = node.find(" > *");
		
		options = {
			editable: false,
			sortable: true
		};
		
		if( opts ) options = $.extend({}, options, opts);
		
		if( options.editable && options.sortable ){
			create_sort_handlers();
			contexts.delegate('a.move-context-up-link', 'click', move_context_up);
			contexts.delegate('a.move-context-down-link', 'click', move_context_down);
		}
		
		function create_sort_handlers(){
			contexts.each(function(){
				var context = $(this), uplink, downlink;
				uplink   = $('<a href="#" title="Move Up" class="move-context-link move-context-up-link">Move Up</a>');
				downlink = $('<a href="#" title="Move Down" class="move-context-link move-context-down-link">Move Down</a>');
							
				context.append(uplink)
					.append(downlink)
					.addClass("transit-editable-context");
				uplink.data('context', context);
				downlink.data("context", context);				
			});
		}
		
		function move_context_up(event){
			event.preventDefault();
			var self    = $(this),
				context = $(self.data('context')),
				prev    = context.prev('.transit-editable-context');
			if( prev.length == 0 ) return false;
			prev.insertAfter(context);
			sort_contexts();
		}
		
		function move_context_down(event){
			event.preventDefault();
			var self    = $(this),
				context = $(self.data('context')),
				next    = context.next('.transit-editable-context');
			if( next.length == 0 ) return false;
			context.insertAfter(next);
			sort_contexts();
		}
		
		function sort_contexts(){
			node.find(" > *").each(function(i, el){
				var context = $(el),
					field   = $('input:hidden[rel=position]', context);
				if( field.length ) field.val(i);
			});
		}
		
		return self;
	};
	
	$.fn.deliverable = function( method_or_options ){
		this.each(function(i, element){
			var instance;
			instance = $(element).plugin('deliverable');
			if( instance ){
				if( $.isFunction(instance[method_or_options]) )
					return instance[method_or_options].apply(instance, Array.prototype.slice.call( arguments, 1 ));
			}else instance = $(element).plugin('deliverable', new Deliverable( $(element), method_or_options ));
		});
	};
	
})(transit);