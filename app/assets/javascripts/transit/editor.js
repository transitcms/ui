//= require underscore
//= require sanitize
//= require hotkeys
//= require proper

(function($){
	var proper = new Proper(),		
		Editor = function( el, options ){
			var self   	 = this,
				target 	 = $(el),
				otext  	 = target.val(),
				editor 	 = $("<div class='transit-editor'></div>"),
				controls, shortcuts, toolbar, i, control, tools;
			
			controls = {
				bold:    { show: true, label: 'Bold' },
				italic:  { show: true, label: 'Italic' },
				link: 	 { show: true, label: 'Link' },
				image: 	 { show: true, label: 'Image' },
				code: 	 { show: false, label: 'Code' },
				ol: 	 { show: true, label: 'Numbered List' },
				ul: 	 { show: true, label: 'Bulleted List' },
				indent:  { show: true, label: 'Indent' },
				outdent: { show: true, label: 'Outdent' }
			};
			
			shortcuts = {
				bold:   'meta+b',
				italic: 'meta+i'
			};
			
			if( options.controls ) controls = $.extend({}, controls, options.controls);
			
			tools = $("<ul></ul>");
			
			for( i in controls ){
				if( controls[i].show == false ) continue;				
				control = $("<a href='#'></a>");
				control.attr("title", controls[i].label);
				control.text(controls[i].label);
				control.addClass('command');
				control.attr('command', i);
				tools.append(control);
				control.wrap('<li></li>');
			}
			
			if( options.toolbar ) toolbar = $(options.toolbar);
			else{
				toolbar = $('#transit_editor_toolbar');
				if( toolbar.length == 0 ) toolbar = $('<div id="transit_editor_toolbar"></div>');
				$('body').append(toolbar);
			}
			
			if( typeof toolbar.attr('id') == 'undefined' || toolbar.attr("id") == "" )
				toolbar.attr('id', 'transit_editor_toolbar');
			
			if( options.shortcuts )
				shortcuts = $.extend({}, shortcuts, options.shortcuts);

			
			if( otext == "" ) otext = "<p>Click to edit content</p>";

			target.hide();
			editor.insertBefore(target);
			editor.attr("id", _.uniqueId("editor_instance_"));
			editor.html(otext);
			
			editor.bind('click', activate_instance);
			
			function activate_instance(event) {
				var current = $(this), top_pos;
				proper.activate(current, {
					placeholder: otext,
					markup: true, 
					multiline: true,
					controls: {
						target: toolbar,
						html: $('<div>').append(tools.clone()).remove().html()
					},	
					shortcuts: shortcuts
				});
				
				top_pos = (parseInt(current.offset().top) - toolbar.outerHeight(true));
				top_pos = top_pos - $('body').get(0).scrollTop;
				toolbar.css({ 
					position:'fixed',
					top: top_pos,
					left: current.offset().left
				});
				
				proper.bind('inactive', function(){
					toolbar.hide();
				});
				
				proper.bind('changed', function(){
					target.val(proper.content());
				});
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
			}else $(element).plugin('editable', new Editor( $(element), method_or_options || {} ));
		});
	};
	
})(transit);