(function(){
	
	String.prototype.capitalize = function() {
	    return this.charAt(0).toUpperCase() + this.slice(1);
	};

	
	if( Object.prototype.__defineGetter__ && !Object.defineProperty ){
	   Object.defineProperty = function( obj, prop, desc ){
	      if( "get" in desc ) obj.__defineGetter__(prop,desc.get);
	      if( "set" in desc ) obj.__defineSetter__(prop,desc.set);
	   };
	}
	
})();