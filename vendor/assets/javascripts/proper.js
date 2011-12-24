//     (c) 2011 Michael Aufreiter
//     Proper is freely distributable under the MIT license.
//     For all details and documentation:
//     http://github.com/michael/proper

// Goals:
//
// * Annotations (strong, em, code, link) are exclusive. No text can be both
//   emphasized and strong.
// * The output is semantic, valid HTML.
// * Cross-browser compatibility: Support the most recent versions of Chrome,
//   Safari, Firefox and Internet Explorer. Proper should behave the same on
//   all these platforms (if possible).
//
// Proper uses contenteditable to support these features. Unfortunately, every
// browser handles contenteditable differently, which is why many
// browser-specific workarounds are required.

(function(){
  
  // _.Events (borrowed from Backbone.js)
  // ------------------------------------
  
  // A module that can be mixed in to *any object* in order to provide it with
  // custom events. You may `bind` or `unbind` a callback function to an event;
  // `trigger`-ing an event fires all callbacks in succession.
  //
  //     var object = {};
  //     _.extend(object, Backbone.Events);
  //     object.bind('expand', function(){ alert('expanded'); });
  //     object.trigger('expand');
  //
  
  _.Events = window.Backbone ? Backbone.Events : {

    // Bind an event, specified by a string name, `ev`, to a `callback` function.
    // Passing `"all"` will bind the callback to all events fired.
    bind : function(ev, callback) {
      var calls = this._callbacks || (this._callbacks = {});
      var list  = this._callbacks[ev] || (this._callbacks[ev] = []);
      list.push(callback);
      return this;
    },

    // Remove one or many callbacks. If `callback` is null, removes all
    // callbacks for the event. If `ev` is null, removes all bound callbacks
    // for all events.
    unbind : function(ev, callback) {
      var calls;
      if (!ev) {
        this._callbacks = {};
      } else if (calls = this._callbacks) {
        if (!callback) {
          calls[ev] = [];
        } else {
          var list = calls[ev];
          if (!list) return this;
          for (var i = 0, l = list.length; i < l; i++) {
            if (callback === list[i]) {
              list.splice(i, 1);
              break;
            }
          }
        }
      }
      return this;
    },

    // Trigger an event, firing all bound callbacks. Callbacks are passed the
    // same arguments as `trigger` is, apart from the event name.
    // Listening for `"all"` passes the true event name as the first argument.
    trigger : function(ev) {
      var list, calls, i, l;
      if (!(calls = this._callbacks)) return this;
      if (list = calls[ev]) {
        for (i = 0, l = list.length; i < l; i++) {
          list[i].apply(this, Array.prototype.slice.call(arguments, 1));
        }
      }
      if (list = calls['all']) {
        for (i = 0, l = list.length; i < l; i++) {
          list[i].apply(this, arguments);
        }
      }
      return this;
    }
  };
  
  _.stripTags = function(input, allowed) {
  // Strips HTML and PHP tags from a string
  //
  // version: 1009.2513
  // discuss at: http://phpjs.org/functions/strip_tags
     allowed = (((allowed || "") + "")
        .toLowerCase()
        .match(/<[a-z][a-z0-9]*>/g) || [])
        .join(''); // making sure the allowed arg is a string containing only tags in lowercase (<a><b><c>)
     var tags = /<\/?([a-z][a-z0-9]*)\b[^>]*>/gi,
         commentsAndPhpTags = /<!--[\s\S]*?-->|<\?(?:php)?[\s\S]*?\?>/gi;
     return input.replace(commentsAndPhpTags, '').replace(tags, function($0, $1){
        return allowed.indexOf('<' + $1.toLowerCase() + '>') > -1 ? $0 : '';
     });
  };

  // Initial Setup
  // -------------

  controlsTpl = ' \
    <ul class="proper-commands"> \
	  <li><a href="#" title="Emphasis (CTRL+SHIFT+E)" class="command em" command="em">Emphasis</a></li> \
      <li><a href="#" title="Strong (CTRL+SHIFT+S)" class="command strong" command="strong">Strong</a></li> \
      <li><a href="#" title="Inline Code (CTRL+SHIFT+C)" class="command code" command="code">Code</a></li> \
      <li><a title="Link (CTRL+SHIFT+L)" href="#" class="command link" command="link">Link</a></li>\
      <li><a href="#" title="Bullet List (CTRL+SHIFT+B)" class="command ul" command="ul">Bulleted List</a></li>\
      <li><a href="#" title="Numbered List (CTRL+SHIFT+N)" class="command ol" command="ol">Numbered List</a></li>\
      <li><a href="#" title="Indent (TAB)" class="command indent" command="indent">Indent</a></li>\
      <li><a href="#" title="Outdent (SHIFT+TAB)" class="command outdent" command="outdent">Outdent</a></li>\
    </ul>';
  
  // Proper
  // ------
  
  this.Proper = function(options) {
    var activeElement = null, // element that's being edited
        $controls,
        events = _.extend({}, _.Events),
        pendingChange = false,
        options = {},
		toolbar_active = false,
        defaultOptions = { // default options
          multiline: true,
          markup: true,
		  controls:{
			html: controlsTpl,
			target:''
		  },
		  onFocus: function(){},
		  onBlur: function(){},
          placeholder: 'Enter Text',
          codeFontFamily: 'Monaco, Consolas, "Lucida Console", monospace',
		  keyCommands: {
			'em'      : 'ctrl+shift+e',
			'strong'  : 'ctrl+shift+s',
			'code'    : 'ctrl+shift+c',
			'link'    : 'ctrl+shift+l',
			'ul'      : 'ctrl+shift+b',
			'ol'      : 'ctrl+shift+n',
			'indent'  : 'tab',
			'outdent' : 'shift+tab'
		  }},
		
		sanitizer = new Sanitize({
			attributes: {
				'__ALL__': ['class'],
				a: ['href', 'title', 'target'],
				img: ['src','alt']
			},
			elements: [
			    'a', 'b', 'blockquote', 'br', 'cite', 'code', 'dd', 'dl', 'dt', 'em',
			    'i', 'li', 'ol', 'p', 'pre', 'q', 'small', 'strike', 'strong', 'sub',
			    'sup', 'u', 'ul'
			]
		});	
		
    
    // Commands
    // --------
    
    function exec(cmd) {
      var command = commands[cmd];
      if (command.exec) {
        command.exec();
      } else {
        if (command.isActive()) {
          command.toggleOff();
        } else {
          command.toggleOn();
        }
      }
    }

    function removeFormat() {
      document.execCommand('removeFormat', false, true);
      _.each(['em', 'strong', 'code'], function (cmd) {
        var command = commands[cmd];
        if (command.isActive()) {
          command.toggleOff();
        }
      });
    }

    // Give code elements (= monospace font) the class `proper-code`.
    function addCodeClasses() {
      $(activeElement).find('font').addClass('proper-code');
    }

    var nbsp = $('<span>&nbsp;</span>').text();

    var commands = {
      em: {
        isActive: function() {
          return document.queryCommandState('italic', false, true);
        },
        toggleOn: function() {
          removeFormat();
          document.execCommand('italic', false, true);
        },
        toggleOff: function() {
          document.execCommand('italic', false, true);
        }
      },

      strong: {
        isActive: function() {
          return document.queryCommandState('bold', false, true);
        },
        toggleOn: function() {
          removeFormat();
          document.execCommand('bold', false, true);
        },
        toggleOff: function () {
          document.execCommand('bold', false, true);
        }
      },

      code: {
        isActive: function() {
          return cmpFontFamily(document.queryCommandValue('fontName'), options.codeFontFamily);
        },
        toggleOn: function() {
          removeFormat();
          document.execCommand('fontName', false, options.codeFontFamily);
          addCodeClasses();
        },
        toggleOff: function () {
          var sel;
          if ($.browser.webkit && (sel = saveSelection()).collapsed) {
            // Workaround for Webkit. Without this, the user wouldn't be
            // able to disable <code> when there's no selection.
            var container = sel.endContainer
            ,   offset = sel.endOffset;
            container.data = container.data.slice(0, offset)
                           + nbsp
                           + container.data.slice(offset);
            var newSel = document.createRange();
            newSel.setStart(container, offset);
            newSel.setEnd(container, offset+1);
            restoreSelection(newSel);
            document.execCommand('removeFormat', false, true);
          } else {
            document.execCommand('removeFormat', false, true);
          }
        }
      },
	  	
      link: {
        exec: function() {
          removeFormat();
          document.execCommand('createLink', false, window.prompt('URL:', 'http://'));
        }
      },

      ul: {
        isActive: function() {
          return document.queryCommandState('insertUnorderedList', false, true);
        },
        exec: function() {
          document.execCommand('insertUnorderedList', false, true);
        }
      },

      ol: {
        isActive: function() {
          return document.queryCommandState('insertOrderedList', false, true);
        },
        exec: function() {
          document.execCommand('insertOrderedList', false, true);
        }
      },

      indent: {
        exec: function() {
          if (document.queryCommandState('insertOrderedList', false, true) ||
              document.queryCommandState('insertUnorderedList', false, true)) {
            document.execCommand('indent', false, true);
          }
        }
      },

      outdent: {
        exec: function() {
          if (document.queryCommandState('insertOrderedList', false, true) ||
              document.queryCommandState('insertUnorderedList', false, true)) {
            document.execCommand('outdent', false, true);
          }
        }
      },
      
      undo: {
		exec: function(){
			document.execCommand('undo', false, true);
		}
	  }
    };

	commands.bold   = commands.strong;
	commands.italic = commands.em;
    
    // Returns true if a and b is the same font family. This is used to check
    // if the current font family (`document.queryCommandValue('fontName')`)
    // is the font family that's used to style code.
    function cmpFontFamily(a, b) {
      function normalizeFontFamily(s) {
        return (''+s).replace(/\s*,\s*/g, ',').replace(/'/g, '"');
      }
      
      a = normalizeFontFamily(a);
      b = normalizeFontFamily(b);
      // Internet Explorer's `document.queryCommandValue('fontName')` returns
      // only the applied font family (e.g. `Consolas`), not the full font
      // stack (e.g. `Monaco, Consolas, "Lucida Console", monospace`).
      if ($.browser.msie) {
        if (a.split(',').length === 1) {
          return b.split(',').indexOf(a) > -1;
        } else if (b.split(',').length === 1) {
          return a.split(',').indexOf(b) > -1;
        } else {
          return a === b;
        }
      } else {
        return a === b;
      }
    }
    
    
    // Semantify/desemantify content
    // -----------------------------
    
    function escape(text) {
      return text.replace(/&/g, '&amp;')
                 .replace(/</g, '&lt;')
                 .replace(/>/g, '&gt;')
                 .replace(/"/g, '&quot;');
    }
    
    // Recursively walks the dom and returns the semantified contents. Replaces
    // presentational elements (e.g. `<b>`) with their semantic counterparts
    // (e.g. `<strong>`).
    function semantifyContents(node) {
		
	  node.html(sanitizer.clean_node(node.get(0)));
	
      function replace(presentational, semantic) {
        node.find(presentational).each(function () {
          $(this).replaceWith($(document.createElement(semantic)).html($(this).html()));
        });
      }
      replace('i', 'em');
      replace('b', 'strong');
      replace('.proper-code', 'code');
      replace('div', 'p');
      
      node.find('span').each(function () {
        if (this.firstChild) {
          $(this.firstChild).unwrap();
        }
      });
      
      node.find('p, ul, ol').each(function () {
        while ($(this).parent().is('p')) {
          $(this).unwrap();
        }
      });
      
      // Fix nested lists
      node.find('ul > ul, ul > ol, ol > ul, ol > ol').each(function () {
        if ($(this).prev()) {
          $(this).prev().append(this);
        } else {
          $(this).wrap($('<li />'));
        }
      });
      
      (function () {
        var currentP = [];
        function wrapInP() {
          if (currentP.length) {
            var p = $('<p />').insertBefore(currentP[0]);
            for (var i = 0, l = currentP.length; i < l; i++) {
              $(currentP[i]).remove().appendTo(p);
            }
            currentP = [];
          }
        }
        // _.clone is necessary because it turns the `childNodes` live
        // dom collection into a static array.
        var children = _.clone(node.get(0).childNodes);
        for (var i = 0, l = children.length; i < l; i++) {
          var child = children[i];
          if (!$(child).is('p, ul, ol') &&
              !(child.nodeType === Node.TEXT_NODE && (/^\s*$/).exec(child.data))) {
            currentP.push(child);
          } else {
            wrapInP();
          }
        }
        wrapInP();
      })();
      
      // Remove unnecessary br's
      node.find('br').each(function () {
        if (this.parentNode.lastChild === this) {
          $(this).remove();
        }
      });
      
      // Remove all spans
      node.find('span').each(function () {
        $(this).children().first().unwrap();
      });
    }
    
    // Replaces semantic elements with their presentational counterparts
    // (e.g. <em> with <i>).
    function desemantifyContents(node) {
      doWithSelection(function () {
        function replace(semantic, presentational) {
          node.find(semantic).each(function () {
            var presentationalEl = $(presentational).get(0);
            
            var child;
            while (child = this.firstChild) {
              presentationalEl.appendChild(child);
            }
            
            $(this).replaceWith(presentationalEl);
          });
        }
        replace('em', '<i />');
        replace('strong', '<b />');
        replace('code', '<font class="proper-code" face="'+escape(options.codeFontFamily)+'" />');
      });
    }
    
    // Update the control buttons' state.
    function updateCommandState() {
      if (!options.markup) return;
      
      $controls.find('.command').removeClass('active');
      _.each(commands, function(command, name) {
        if (command.isActive && command.isActive()) {
          $controls.find('.command.'+name).addClass('active');
        }
      });
    }
    
    
    // Placeholder
    // -----------
    
    // If the activeElement has no content, display the placeholder and give
    // the element the class `empty`.
    function maybeInsertPlaceholder() {
      if ($(activeElement).text().trim().length === 0) {
        $(activeElement).addClass('empty');
        if (options.markup) {
          $(activeElement).html('<p>&laquo; '+options.placeholder+' &raquo;</p>');
        } else {
          $(activeElement).html('&laquo; '+options.placeholder+' &raquo;');
        }
      }
    }
    
    // If the activeElement has the class `empty`, remove the placeholder and
    // the class.
    function maybeRemovePlaceholder() {
      if ($(activeElement).hasClass('empty')) {
        $(activeElement).removeClass('empty');
        selectAll();
        document.execCommand('delete', false, "");
      }
    }
    
    
    // DOM Selection
    // -------------
    
    // Returns the current selection as a dom range.
    function saveSelection() {
      if (window.getSelection) {
        var sel = window.getSelection();
        if (sel.rangeCount > 0) {
          return sel.getRangeAt(0);
        }
      } else if (document.selection && document.selection.createRange) { // IE
        return document.selection.createRange();
      }
      return null;
    }
    
    // Selects the given dom range.
    function restoreSelection(range) {
      if (range) {
        if (window.getSelection) {
          var sel = window.getSelection();
          sel.removeAllRanges();
          sel.addRange(range);
        } else if (document.selection && range.select) { // IE
          range.select();
        }
      }
    }
    
    // Selects the whole editing area.
    function selectAll() {
      var range = document.createRange();
      range.selectNodeContents($(activeElement)[0]);
      restoreSelection(range);
    }
    
    // Applies fn and tries to preserve the user's selection and cursor
    // position.
    function doWithSelection (fn) {
      // Before
      var sel = saveSelection()
      if (sel) {
        var startContainer = sel.startContainer
        ,   startOffset    = sel.startOffset
        ,   endContainer   = sel.endContainer
        ,   endOffset      = sel.endOffset;
      }
      
      fn();
      
      if (sel) {
        // After
        function isInDom(node) {
          if (node === document.body) return true;
          if (node.parentNode) return isInDom(node.parentNode);
          return false;
        }
        if (isInDom(startContainer)) {
          sel.setStart(startContainer, startOffset);
        }
        if (isInDom(endContainer)) {
          sel.setEnd(endContainer, endOffset);
        }
        restoreSelection(sel);
      }
    }
    
    
    // Handle events
    // -------------
    
    // Should be called during a paste event. Removes the focus from the
    // currently focused element. Expects a callback function that will be
    // called with a node containing the pasted content.
    function getPastedContent (callback) {
      // TODO: michael, explain why these css properties are needed -- timjb
      var tmpEl = $('<div id="proper_tmp_el" contenteditable="true" />')
        .css({ position: 'fixed', top: '20px', left: '20px', opacity: '0' })
        .appendTo(document.body)
        .focus();
      setTimeout(function () {
        tmpEl.remove();
        callback(tmpEl);
      }, 10);
    }
    
    function cleanPastedContent (node) {
      var allowedTags = {
        p: [], ul: [], ol: [], li: [],
        strong: [], code: [], em: [], b: [], i: [], a: ['href']
      };
      
      function traverse (node) {
        // Remove comments
        $(node).contents().filter(function () {
          return this.nodeType === Node.COMMENT_NODE
        }).remove();
        
        $(node).children().each(function () {
          var tag = this.tagName.toLowerCase();
          traverse(this);
          if (allowedTags[tag]) {
            var old  = $(this)
            ,   neww = $(document.createElement(tag));
            neww.html(old.html());
            _.each(allowedTags[tag], function (name) {
              neww.attr(name, old.attr(name));
            });
            old.replaceWith(neww);
          } else if (tag === 'font' && $(this).hasClass('proper-code')) {
            // do nothing
          } else {
            $(this).contents().first().unwrap();
          }
        });
      }
      
      $(node).find('script, style').remove();
      // Remove double annotations
      var annotations = 'strong, em, b, i, code, a';
      $(node).find(annotations).each(function () {
        $(this).find(annotations).each(function () {
          $(this).contents().first().unwrap();
        });
      });
      traverse(node);
    }
    
    // Removes <b>, <i> and <font> tags
    function removeAnnotations (node) {
      $(node).find('b, i, font').each(function () {
        $(this).contents().first().unwrap();
      });
    }
    
    function bindEvents(el) {
      $(el)
        .unbind('paste')
        .unbind('keydown')
        .unbind('keyup')
        .unbind('focus')
        .unbind('blur');
      
      $(el).bind('paste', function () {
        var isAnnotationActive = commands.strong.isActive()
                              || commands.em.isActive()
                              || commands.code.isActive();
        var selection = saveSelection();
        getPastedContent(function (node) {
          restoreSelection(selection);
          $(el).focus();
          cleanPastedContent($(node));
          //semantifyContents($(node));
          desemantifyContents($(node));
          if (isAnnotationActive) removeAnnotations($(node));
          // For some reason last </p> gets injected anyway
          document.execCommand('insertHTML', false, $(node).html());
        });
      });
      
      function isTag(node, tag) {
        if (!node || node === activeElement) return false;
        if (node.tagName && node.tagName.toLowerCase() === tag) return true;
        return isTag(node.parentNode, tag);
      }
      
      // Prevent multiline
      $(el).bind('keydown', function(e) {
        if (!options.multiline && e.keyCode === 13) {
          e.stopPropagation();
          e.preventDefault();
          return;
        }
        if (e.keyCode === 8 &&
            $(activeElement).text().trim() === '' &&
            $(activeElement).find('p, li').length === 1) {
          // backspace is pressed and the editor is empty
          // prevent the removal of the last paragraph
          e.preventDefault();
        }
        // By default, Firefox doesn't create paragraphs. Fix this.
        if ($.browser.mozilla) {
          var selectionStart = saveSelection().startContainer;
          if (options.multiline && !isTag(selectionStart, 'p') && !isTag(selectionStart, 'ul')) {
            document.execCommand('insertParagraph', false, true);
          }
          if (e.keyCode === 13 && !e.shiftKey) {
            window.setTimeout(function () {
              if (!isTag(selectionStart, 'ul')) {
                document.execCommand('insertParagraph', false, true);
              }
            }, 10);
          }
        }
      });
      
      $(el)
        .bind('focus', maybeRemovePlaceholder)
        .bind('click', updateCommandState)
		.bind('blur', function(event){
			if( toolbar_active == true ){
				event.preventDefault();
				return false;
			}
			
			maybeInsertPlaceholder();
			deactivate();
		});
      
      $(el).bind('keyup', function(e) {        
        updateCommandState();
        addCodeClasses();
        // Trigger change events, but consolidate them to 200ms time slices
        setTimeout(function() {
          // Skip if there's already a change pending
          if (!pendingChange) {
            pendingChange = true;
            setTimeout(function() {
              pendingChange = false;
              events.trigger('changed');
            }, 200);
          }
        }, 10);
        return true;
      });
    }
    
    // Instance methods
    // -----------

    function deactivate () {
		if( $(activeElement).length ){
			$(activeElement)
		        .attr('contenteditable', 'false')
		        .unbind('paste')
		        .unbind('keydown');
		  events.trigger('inactive');
	  	  events.unbind('changed');
		  events.unbind('inactive');
		 content();
		}	
    };
    
    // Activate editor for a given element
    function activate (el, opts) {
      options = {};
      // Deactivate previously active element
      deactivate();
      
	  _.extend(options, defaultOptions, opts);

      // Make editable
      $(el).attr('contenteditable', true);
      activeElement = el;
      bindEvents(el);
      
      // Setup controls
      if (options.markup) {
        $controls = $(options.controls.html); 
		if( $(options.controls.target).length ){
			$(options.controls.target).empty().append($controls).show();
		}
      }
      
      // Keyboard bindings
      if (options.markup) {
        function execLater(cmd) {
          return function(e) {
            e.preventDefault();
            exec(cmd);
          };
        }

		for( var i in options.keyCommands ){
			$(activeElement).keydown(options.keyCommands[i], execLater(i));
		}
     
	  }
    
      $(activeElement).focus();
      updateCommandState();
      desemantifyContents($(activeElement));

	  options.onFocus.apply($(activeElement), [this]);
      
      // Use <b>, <i> and <font face="monospace"> instead of style attributes.
      // This is convenient because these inline element can easily be replaced
      // by their more semantic counterparts (<strong>, <em> and <code>).
      try {
        document.execCommand('styleWithCSS', false, false);
      } catch (exc) {
        // This fails in Firefox.
      }

	  $(options.controls.target).bind('mouseenter', 
		function(event){
			toolbar_active = true;
		});
		
	  $(options.controls.target).bind('mouseleave', 
	    function(event){
			toolbar_active = false;
		});
      
      $('a.command', $(options.controls.target)).click(function(e) {
        e.preventDefault();
        $(activeElement).focus();
        exec($(e.currentTarget).attr('command'));
        updateCommandState();
        setTimeout(function() { events.trigger('changed'); }, 10);
      });
    };
    
    // Get current content
    function content () {
      if ($(activeElement).hasClass('empty')) return '';
      
      if (options.markup) {
        if (!activeElement) return '';
        var clone = $(activeElement).clone();
        semantifyContents(clone);
        return clone.html();
      } else {
        if (options.multiline) {
          return _.stripTags($(activeElement).html().replace(/<div>/g, '\n')
                                             .replace(/<\/div>/g, '')).trim();
        } else {
          return _.stripTags($(activeElement).html()).trim();
        }
      }
    };

	function sanitize(){
		sanitizeNode($(activeElement));
	}
	
	function sanitizeNode(node){
		$(node).html(sanitizer.clean_node($(node).get(0)));
	}
    
    // Expose public API
    // -----------------
    
    return {
      bind:    function () { events.bind.apply(events, arguments); },
      unbind:  function () { events.unbind.apply(events, arguments); },
      trigger: function () { events.trigger.apply(events, arguments); },
      sanitize: sanitize,
	  sanitizeNode: sanitizeNode,
      activate: activate,
      deactivate: deactivate,
      content: content,
      exec: exec,
      commands: commands
    };
  };
})();