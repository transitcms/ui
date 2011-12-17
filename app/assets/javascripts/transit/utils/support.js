/*
*	Extends jQuery.support to add additional features and methods
*
*/
(function($, undefined){
	
	//
	// Check an element for support of a particular attribute
	//
	function supports_attribute( attr, element, type ){
		element = document.createElement( element );
		exists  = ( attr in element );
		if( typeof type == 'undefined' || exists === false ){ return exists; }
		return jQuery.type( element[attr] ) === type;
	}

	//
	// Check to see if a particular event is supported (ie. oninvalid)
	//
	function supports_event( event_name, element ){
		element    = document.createElement( element || 'div');
		event_name = "on" + event_name;
		return ( event_name in element );
	}
	
	//
	// Check to see if a particular input type is available
	//
	function supports_input( type ){
		
		var element = jQuery('#__test_input_field').get(0);
			tester  = "(wee);";
			
		element.setAttribute('type', type);
		
		if( element.type !== 'text' ){
			
			//
			// If the element doesn't support checkValidity, 
			// its a pretty safe bet its not a HTML5 element.
			//
			if( !( 'checkValidity' in element ) ) return false;
			
			// Theres no way to double check these right now (?) so just assume we're good
			if( /^(search|tel)$/.test( type ) ) return true;
						
			element.value = tester;
			
			if( /^(url|email)$/.test(type) ){
				return (element.checkValidity && element.checkValidity() === false);
			}
			
			return element.value != tester;
			
		}
				
		return false;
	}
	//
	// Update jQuery.support to support details on html5 feature availability
	//
	function detect_support(){
		
		// Create an input for testing
		var tester = jQuery(document.createElement('input'));
		
		tester.css({ visibility:'hidden' })
			.attr('id', '__test_input_field')
			.appendTo(jQuery('body'));
			
		jQuery.support.input  = jQuery.support.input || {};
		jQuery.support.events = jQuery.support.events || {};
		jQuery.support.attrs  = jQuery.support.attrs || {};
		
		$.extend( jQuery.support.input, {
			email: 	supports_input( 'email', 'input' ),
			url: 	supports_input( 'url', 'input' ),
			number: supports_input( 'number', 'input' ),
			search: supports_input( 'search', 'input' ),
			range:  supports_input( 'range', 'input' )
		});
		
		$.extend( jQuery.support.attrs, {
			validity: 		supports_attribute( 'validity', 'input', 'object' ),
			pattern: 		supports_attribute( 'pattern', 'input' ),
			required: 		supports_attribute( 'required', 'input' ),
			placeholder:    supports_attribute( 'placeholder', 'input' )
		});
		
		$.extend( jQuery.support.events, {
			invalid: 	 supports_event( 'invalid', 'input' ),
			formchange:  supports_event( 'formchange', 'input' ),
			input: 		 supports_event( 'input', 'input' )
		});
		

		jQuery.support.video 			 = !(jQuery.browser.msie && Number( jQuery.browser.version) <= 8);
		jQuery.support.audio			 = jQuery.support.video;
		
		jQuery('#__test_input_field').remove();
	}	
	
	jQuery(function(){
		detect_support();
	});

})(jQuery);