//= require_tree ./transit/utils

(function($, undefined){
	
	var transit = window.transit;
	
	if( typeof transit == 'undefined' ){
		transit        = jQuery.sub();
		window.transit = transit;
	}
	
	
	transit.fn.plugin = function(name, store){
		var plugin;
		
		if( store ){
			this.each(function(i, element){
				transit(element).data('transit-plugin-' + name, store);
			});
		}
		
		// if a single node was passed, return the plugin for
		// easier api access.
		plugin = transit(this).data('transit-plugin-' + name);
		
		if( plugin ) return plugin;		
		return undefined;
	};
	
})(jQuery);