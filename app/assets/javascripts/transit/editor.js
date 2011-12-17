//= require underscore
//= require sanitize
//= require hotkeys
//= require proper

(function($){
	var proper = new Proper(),		
		Editor = function( el, options ){
			var self   = this,
				target = $(el),
				otext  = target.val();
				editor = $("<div class='transit-editor'></div>");
			
			if( otext == "" ) otext = "<p>Click to edit content</p>";

			target.hide();
			editor.insertBefore(target);
			editor.html(otext);
			
			editor.bind('click', activate_instance);
			editor.bind('blur', deactivate_instance);
			editor.bind('focusout', deactivate_instance);
			
			function activate_instance(event) {
				var current = $(this);
				proper.activate(current, {
					placeholder: otext,
					markup: true, 
					multiline: true,
					keyCommands:{
						'strong': 'meta+b',
						'em': 'meta+i'
					}
				});
				
				proper.bind('changed', function(){
					target.val(proper.content());
				});
			}
			
			function deactivate_instance(event){
				var current = $(this);
				proper.deactivate(current);
			}
						
			return self;
	};
	
	$.fn.editable = function( method_or_options ){
		this.each(function(i, element){
			var instance;
			instance = $(element).plugin('editable');
			if( instance ){
				if( $.isFunction(instance[method_or_options]) )
					return instance[method_or_options].apply(instance, Array.prototype.slice.call( arguments, 1 ));
			}else $(element).plugin('editable', new Editor( $(element), method_or_options ));
		});
	};
	
})(transit);