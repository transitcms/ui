(function($, undefined){
	
	var media_instances = 0;
	
	var MediaBridge = function( element, options ){
		var self			= this,
			media_type 		= options.type || element[0].tagName.toLowerCase(),
			is_video   		= media_type == 'video',
			is_audio   		= !is_video,
			source     		= options.src || element.attr('src'),
			conf 	   		= {},
			flashvars		= {},
			wrapper 		= $("<div class='media-wrapper'></div>"),
			swf_wrapper 	= $("<div class='media-swf-wrapper'></div>"),
			bridge			= element.get(0),
			embed_html, domid, events, media_api, controls = {}, control_pane, native_support;
			
		if( element.attr("id") == "" || typeof element.attr("id") == "undefined" ){
			domid = media_type + "_player_" + media_instances;
			element.attr("id", domid);
		}
		
		domid = element.attr("id");
		native_support = check_support( media_type, source );			
		media_instances++;
		
		element.wrap(wrapper);
		
		if( native_support === false ){
			
			element.before(swf_wrapper);
			element.hide();
			
			flashvars.element    = domid;
			flashvars.src 	     = source;
			flashvars.media_type = media_type;
			
			if( options.debug ) 
				flashvars.debug = options.debug;
				
			if( is_video ) flashvars.poster = options.poster || element.attr('poster') || false;
			
			if( jQuery.browser.msie ){
				embed_html = ''
				+ '<object classid="clsid:D27CDB6E-AE6D-11cf-96B8-444553540000" codebase="http://download.macromedia.com/pub/shockwave/cabs/flash/swflash.cab" '
				+ 'id="' + domid + '_fallback" width="100%" height="100%">'
				+ '<param name="movie" value="' + options.swf + '?x=' + (new Date()) + '" />'
				+ '<param name="flashvars" value="' + to_query(flashvars) + '" />'
				+ '<param name="quality" value="high" />'
				+ '<param name="bgcolor" value="#000000" />'
				+ '<param name="wmode" value="transparent" />'
				+ '<param name="allowScriptAccess" value="always" />'
				+ '<param name="allowFullScreen" value="true" />'
				+ '</object>';

			}else{
				embed_html = ''
				+ '<embed id="' + domid + '_fallback" name="' + domid + '_fallback" '
				+ 'quality="high" bgcolor="#000000" wmode="transparent" '
				+ 'allowScriptAccess="always" allowFullScreen="true" '
				+ 'type="application/x-shockwave-flash" pluginspage="http://www.macromedia.com/go/getflashplayer" '
				+ 'src="' + options.swf + '?x=' + (new Date().getTime()) + '" '
				+ 'flashvars="' + to_query(flashvars) + '" '
				+ 'width="100%" height="100%"></embed>';
			}
			
			swf_wrapper.append( transit(embed_html) );
			media_api = document.getElementById(domid + "_fallback");
			
			bridge.play = function(){ 
				media_api.playMedia();
				return true;
			};
			
			bridge.pause = function(){
				media_api.pauseMedia();
				return true;
			};
				
			bridge.load = function(){
				media_api.loadMedia();
				return true;
			};
		
			bridge.stop = function(){
				media_api.stopMedia();
				return true;
			};
			
			Object.defineProperty(bridge, 'paused', {
				get: function(){  return media_api.getPaused(); },
				set: function(value){ media_api.setPaused(value); }
			});
			
			Object.defineProperty(bridge, 'muted', {
				get: function(){  return media_api.getMuted(); },
				set: function(value){ media_api.setMuted(value); }
			});
			
			Object.defineProperty(bridge, 'currentTime', {
				get: function(){  return media_api.getCurrentTime(); },
				set: function(value){ media_api.setCurrentTime(value); }
			});
			
			Object.defineProperty(bridge, 'volume', {
				get: function(){  return media_api.getVolume(); },
				set: function(value){ media_api.setVolume(value); }
			});
			
			Object.defineProperty(bridge, 'seeking', {
				get: function(){  return media_api.getSeeking(); }
			});
			
			Object.defineProperty(bridge, 'duration', {
				get: function(){  return media_api.getDuration(); }
			});
			
			Object.defineProperty(bridge, 'played', {
				get: function(){  return media_api.getPlayed(); }
			});
			
			Object.defineProperty(bridge, 'src', {
				get: function(){  return media_api.getSrc(); },
				set: function(){  return media_api.setSrc(); }
			});
			
		}
		
		control_pane = transit('<div class="'+ media_type +'-player-controls"></div>');
		
		if( typeof options.controls == 'undefined' ){
			
			element.after(control_pane);
			controls = {};
			
			controls.play_button = $("<button>Play</button>");
			controls.play_button.addClass(media_type + "-play-button")
				.addClass('paused')
				.attr("title", 'Play ' + media_type.capitalize())
				.attr("aria-controls", domid);
				
			controls.seek_bar = $('<input type="range" min="0" value="0" step="0.1" />');
			controls.seek_bar.addClass(media_type + "-seek-bar")				
				.attr("title", "Seek Controls")
				.attr("aria-controls", domid);
				
			controls.buffer_bar = $('<div></div>');
			controls.buffer_bar.addClass(media_type + "-buffer-bar");
				
			controls.time_display = $('<span>00:00</span>');
			controls.time_display.addClass(media_type + "-play-timer");
				
			controls.volume_box = $("<div></div>")
				.addClass(media_type + "-volume-box");
				
			controls.mute_button = $("<button>Mute</button>");
			controls.mute_button.addClass(media_type + "-mute-button")
				.attr("title", 'Mute volume')
				.attr("aria-controls", domid);
				
			controls.volume_bar = $('<input type="range" value="0" min="0" max="1" step="0.1" />');
			controls.volume_bar.addClass(media_type + "-volume-bar")				
				.attr("title", "Adjust volume")
				.attr("aria-controls", domid);
				
		} else controls = transit(options.controls);

		control_pane.append(controls.play_button);
			
		if( controls.buffer_bar ){
			control_pane.append(controls.buffer_bar);
			if( controls.seek_bar) controls.buffer_bar.append(controls.seek_bar);
		}else{
			if( controls.seek_bar ) controls.buffer_bar.append(controls.seek_bar);
		}
				
		if( controls.time_display )
			control_pane.append(controls.time_display);
			
		if( controls.volume_box ){
			control_pane.append(controls.volume_box);
			controls.volume_box
				.append(controls.mute_button)
				.append(controls.volume_bar);
				
		} else{
			if( controls.mute_button )
				control_pane.append(controls.mute_button);
			if( controls.volume_bar )
				control_pane.append(controls.volume_bar);
		}
		
		controls.play_button.bind('click.media', function(event){
				if( bridge.paused ) bridge.play();
				else bridge.pause();
				control_pane.trigger('playing.media', [domid]);
				return true;
			});

		controls.seek_bar.bind('change.media', function(event){
			bridge.currentTime = $(this).val();
			return true;
		});
		
		controls.mute_button.bind('click.media', function(event){
			bridge.muted = !bridge.muted;
			if( bridge.muted === true ) $(this).html("UnMute").addClass('muted');
			else $(this).html("Mute").removeClass('muted');				
			return false;
		});
		
		controls.volume_bar.bind('change.media', function(event){
			bridge.volume = $(this).val();
			return false;
		});
		
		// Namespace events for the controlbar, and pass along a player id to support
		// multiple players
		events = ['loadeddata', 'progress', 'timeupdate', 'seeked', 'canplay', 'play', 'playing', 'pause', 'loadedmetadata', 'ended', 'volumechange'];
		
		control_pane
			.bind('playing.media play.media pause.media', media_state_changed)
			.bind('timeupdate.media', update_progress)
			.bind('loadedmetadata.media', 
				function(event, pid){
					if( pid != domid ) return true;					
					controls.seek_bar.attr('max', bridge.duration);
					return true;
				})
			.bind('timeupdate.media', 
				function(event){
					if( controls.time_display ){
						controls.time_display.text(
							seconds_to_time(bridge.currentTime) 
							+ ":" 
							+ seconds_to_time(bridge.duration)
						);
					}
				});
		
		
		function media_state_changed( event, pid ){
			if( pid != domid ) return true;
			if( bridge.paused ) controls.play_button.html("Play").addClass('paused');
			else controls.play_button.html("Pause").removeClass('paused');
			return true;
		}

		function update_progress( event, pid ){
			if( pid != domid ) return true;					
			controls.seek_bar.val(bridge.currentTime);
			return true;
		}

		$.each(events, function(i, name){
			element.bind(name, function(event){
				control_pane.trigger(event.type + ".media", [ domid ]);
			});
		});
		
		return bridge;	
			
	};
	
	// Converts a numeric number of seconds to a time string
	function seconds_to_time( seconds, use_hours ){
		seconds = Math.round(seconds);
		var hours, minutes   = Math.floor(seconds / 60);

		if( minutes >= 60 ){
		    hours = Math.floor(minutes / 60);
		    minutes = minutes % 60;
		}
		
		if( typeof use_hours == undefined ) use_hours = (seconds > 3600);
		
		hours   = hours === undefined ? "00" : (hours >= 10) ? hours : "0" + hours;
		minutes = (minutes >= 10) ? minutes : "0" + minutes;
		seconds = Math.floor(seconds % 60);
		seconds = (seconds >= 10) ? seconds : "0" + seconds;
		
		return ((hours > 0 || use_hours === true) ? hours + ":" :'') + minutes + ":" + seconds;
		
	};

	// Formats a time string to seconds
	function time_to_seconds( string ){
		var tab = string.split(':');
		return tab[0]*60*60 + tab[1]*60 + parseFloat(tab[2].replace(',','.'));
	}
	
	/*
	 * Checks support for media playback based on native mp4 or audio support	
	 * Fallback to flash player if not
 	 */
	function check_support( type, source ){	
		// IE8 or less, no native support at all		
		if( jQuery.support.video == false ) return false;

		// TODO: Support more media types. For now, only mp4's play natively
		if( (/(mp4)/i).test(source) && jQuery.browser.webkit ) return true;
		return false;
	}
	
 	function to_query(obj){
		var str_data = [], ind;		
		for( ind in obj ) str_data.push( ind.toString() + "=" + obj[ind] );
		return str_data.join("&");		
	}
	
	transit.fn.media = function( method_or_options ){
		this.each(function(i, element){
			var instance, options;
			instance = $(element).plugin('media');
			if( instance ){
				if( $.isFunction(instance[method_or_options]) )
					return instance[method_or_options].apply(instance, Array.prototype.slice.call( arguments, 1 ));
			}else instance = $(element).plugin('media', new MediaBridge( $(element), method_or_options ));
		});
	};
	
	transit.fn.video = function( method_or_options ){
		this.each(function(i, element){
			var instance;
			instance = $(element).plugin('media');		
			if( instance ){
				if( $.isFunction(instance[method_or_options]) )
					return instance[method_or_options].apply(instance, Array.prototype.slice.call( arguments, 1 ));
			}else{
				options      = method_or_options || {};
				options.type = "video";
				instance     = $(element).plugin('media', new MediaBridge( $(element), options ));
			}
		});
	};
	
	transit.fn.audio = function( method_or_options ){
		this.each(function(i, element){
			var instance;
			instance = $(element).plugin('media');
			if( instance ){
				if( $.isFunction(instance[method_or_options]) )
					return instance[method_or_options].apply(instance, Array.prototype.slice.call( arguments, 1 ));
			}else{
				options      = method_or_options || {};
				options.type = "audio";
				instance     = $(element).plugin('media', new MediaBridge( $(element), options ));
			}
		});
	};
	
})(transit);