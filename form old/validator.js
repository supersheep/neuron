KM.define(['util/class'], function(K, require){

/* 
function isInputable(element){
	return element.match('input') || element.match('textarea');
};
*/

/**
 * 'required max-length:10' -> ['required', 'maxlength:10']
 * function(){} -> [function(){}]
 */
function splitIfString(obj, splitter){
	return K.isString(obj) ? obj.trim().split(splitter || ',') : K.makeArray(obj);
};


/**
 * count how many elements has been checked
 */
function checkedCounter(elements, onlyCheckExists){
	var i = 0, len = elements.length,
		counter = 0;
	
	for(; i < len; i ++){
		if(elements[i].checked){
			++ counter; 
			if(onlyCheckExists){
				break;
			}
		}
	}
	return counter;
};


/**
 * 
 */
function smartSelector(id){	
	return K.isString(id) ? REGEX_IS_CSS_SELECTOR.test(id) ? $$(id) : $(id) : id;
};


function addValidator(name, module, branch){
	validators[branch || DEFAULT_VALIDATOR_TYPE][name] = module;
};


var undef,
	REGEX_IS_CSS_SELECTOR = /^(?:\.|#)/,
	REGEX_IS_EMAIL = /^(?:[a-z0-9!#$%&'*+\/=?^_`{|}~-]\.?){0,63}[a-z0-9!#$%&'*+\/=?^_`{|}~-]@(?:(?:[a-z0-9](?:[a-z0-9-]{0,61}[a-z0-9])?\.)*[a-z0-9](?:[a-z0-9-]{0,61}[a-z0-9])?|\[(?:(?:25[0-5]|2[0-4][0-9]|[01]?[0-9][0-9]?)\.){3}(?:25[0-5]|2[0-4][0-9]|[01]?[0-9][0-9]?)\])$/i,
	
	DEFAULT_VALIDATOR_TYPE = 'input',

	Form = K.Form, 
	Validator,
	Complex,

	// preset validators for input element
	validators = {
		input: {
			'max-length': {
				test: function(v, prop){
					return v.length <= prop;
				}
			},
			
			'min-length': {
				test: function(v, prop){
					return v.length >= prop;
				}
			},
			
			'required': {
				test: function(v){
					return !!v;
				}
			},
			
			'email': {
				test: function(v){
					return REGEX_IS_EMAIL.test(v);
				}
			},
			
			'regex': {
				test: function(v, prop){
					return ( K.isRegExp(prop) ? prop : new RegExp(prop) ).test(v);
				}
			},
			
			'capcha': {
				test: function(v){
					return !!v;
				}
			}
		},
		
		checkbox: {
			'required': {
				test: function(elements){
					return checkedCounter(elements, true);
				}
			}
		},
		
		radio: {
			'required': {
				test: function(elements){
					return checkedCounter(elements, true);
				}
			}
		}
	},
	
	validator_presets_get_checkbox = function(){
		var ret = [];
	
		this.element.each(function(i){
			if(i.checked){
				ret.push(i.value);
			}
		});
		
		return ret.join(this.options.splitter || '|');
	},
	
	validator_presets_getCheckObj_checkbox = function(){
		return this.element;
	},
		
	validator_presets = {
		checkOnBlur: true,
		showErrOnBlur: true,
		trim: true,
		errCls: 'err-input',
		
		// module is prior to element attribute
		testRuleAttr: 'data-validate-rule',
		errMsgAttr: 'data-err-msg',
		
		enableHTML5: true
	},
	
	validator_method_presets = {
		
		_get: {
			input: function(){
				var v = this.element.get('value');
			
				return this.options.trim ? v.trim() : v;
			},
			
			checkbox: validator_presets_get_checkbox,
			radio: validator_presets_get_checkbox
		},
		
		_set: {
			input: function(value){
				return (this.element.value = value, this);
			},
			
			/**
			 * @param sets
			 *		{Array} [0, 1, 0, 1, 0]
			 *		{}
			 * @param reverse {Boolean} 
			 */
			checkbox: function(sets){
				var self = this,
					checkboxes = self.element,
					setAll = K.isBoolean(sets) || sets === 1 || sets === 0,
					reverse = sets === 'reverse';
				
				checkboxes.each(function(c, i){
					c.checked = reverse ? !c.checked : setAll ? sets : sets[i];
				});
				
				return self;
			},
			
			radio: function(index){
				var el = this.element[index];
				
				if(el){
					el.checked = true;
				}
				
				return this;
			}
		},
		
		_getCheckObj: {
			input: function(){
				return this.val();
			},
			
			checkbox: validator_presets_getCheckObj_checkbox,
			radio: validator_presets_getCheckObj_checkbox
		},
	},
	
	complex_presets = {
		CSPrefix: '',
		errCSSuffix: '-err',
		showAllErr: false
	};
	
/**
 * @constructor
 * 
 */	
Validator = new Class({
	
	Implements: 'options',
	
	/**
	 
	 	new KM.Form.Validator('email', 'email-err', {
	 		test: ['required', function(v){}],
	 		errMsg: ['input is require', '{value} is xxx']
	 	});
	 	 
	 */
	 
	/**
	 * TODO:
	 * transfer the slice of lines into html5-enabler.js
	 * refraction
	 */
	_HTML5: function(){
		var self = this,
			placeholder = self.element.getAttribute('placeholder');
	
		if(placeholder){
			// new Form.Placeholder(element, {valSetter: self._getter});
		}
	},

	initialize: function(element, errHolder, module, options){
		element = smartSelector(element);
		errHolder = $(errHolder);
		
		if(element){
			var self = this,
				o = self.setOptions(options, validator_presets),
				tests, errMsg,
				bind = K.bind,
				
				check_type = module.type,
				is_normal_field = true;
				
			if(check_type === 'checkbox' || check_type === 'radio'){
				element = element.getElements('input[type=' + check_type + ']');
				is_normal_field = false;
			}
								
			self.element = element;
			self.errHolder = errHolder;
			
			if(is_normal_field && o.enableHTML5){
				self._HTML5();
			}	
				
			if(!check_type && K._type(element, true) === 'element'){
				check_type = DEFAULT_VALIDATOR_TYPE;
			}
				
			self._config(check_type);
			
			if(is_normal_field && !module && element){	
				tests = element.getAttribute(o.testRuleAttr).replace(/\\\\/g, '\\');
				errMsg = element.getAttribute(o.errMsgAttr);
			}else{
				tests = module.test;
				errMsg = module.errMsg;
			}
			
			// if no validate rules, always return true
			tests = splitIfString(tests || function(){return true});
			
			errMsg = splitIfString(errMsg || []);
			
			tests.each(function(test, index){
				self.add(test, errMsg[index]);
			});
			
			/**
			 * TODO:
			 * other types of elements
			 */
			if(o.checkOnBlur){
				element.addEvent('blur', function(){
					self.check(o.showErrOnBlur);
				});
			};
			
			// bind public methods
			bind('val', self);
			bind('check', self);
			bind('add', self);	
		}
	},
	
	/**
	 * @param type {String} check type of the current form fields. 
	 *	available for 'input', 'checkbox', 'radio' 
	 */
	_config: function(type){
		var self = this,
			o = self.options;
			
		if(!type){
			throw new TypeError('Form.Validator: invalid validate type');
		}
			
		self._type = type;
		self._getCheckObj = validator_method_presets._getCheckObj[type];
		self._getter( o.getter || validator_method_presets._get[type] );
		self._setter( o.setter || validator_method_presets._get[type] );
			
		delete o.getter;
		delete o.setter;
	},
	
	_errMsg: [],
	
	_tests: [],
	
	showErr: function(msg){
		var errHolder = this.errHolder;
		
		errHolder && errHolder.set('html', msg || '');
	},
	
	/**
	 * @getter
	 * @setter
	 */
	val: function(value){
		var self = this;
		
		return value === undef ? self._get()
			: self._set(value);
	},
	
	_getter: function(fn){
		if(K.isFunction(fn)){
			this._set = fn;
		}
	},
	
	_setter: function(fn){
		if(K.isFunction(fn)){
			this._get = fn;
		}
	},
	
	
	/**
	 * @param showErr {Boolean} default to true. whether deal with err message after checking
	 */
	check: function(showErr){
		var self = this,
			i = 0, 
			tests = self._tests,
			len = tests.length,
			test,
			pass = true,
			
			v = self._getCheckObj();
			
		for(; i < len; i ++){
			test = tests[i];
			
			// ajax check
			if(test.ajax === true){
				test(v, function(_pass, errMsg){
					if(!_pass){
						pass = false;
						self._fail(showErr, errMsg, v);
					}
				});
				
			// normal check
			
			/**
			 * TODO:
			 * store the lastest errMsg
			 * if current errMsg is undef use the last one
			 */
			}else if(!test(v)){
				pass = false;
				self._fail(showErr, self._errMsg[i], v);
			}
			
			if(!pass){
				break;
			}
		}
		
		if(pass){
			self.showErr();
		}
			
		return pass;
	},

	_fail: function(showErr, errMsg, v){
		var self = this;
		
		self.element.addClass(self.options.errCls);
		self.showErr( ( (showErr || showErr === undef) && errMsg ).substitute({value:v}) );
	},
	
	add: function(module, errMsg){
		var self = this, prop, test, rule_method;
		
		// module presets
		switch( K._type(module) ){
			case 'string':
				module = module.split(':');
				prop = (module[1] || '').trim();
				module = validators[self._type][ module[0].trim() ];
				
				break;
				
			case 'function':
				module = {
					test: module
				};
				
				break;
		}
		
		if(
			module &&
			module.test && 
			(!module.condition || module.condition(self.element) )
		){
			
			rule_method = function(v){
				return module.test(v, prop);
			};
			
			if(module.ajax || module.test.ajax){
				rule_method.ajax = true;
			}
			
			self._tests.push(rule_method);
			
			self._errMsg.push(errMsg);
		}
	}
});


/**
 * @constructor
 
 * TODO:
 * method to set err msg for all fields
 */	
Complex = new Class({

	_items: {},
	_checks: [],
	
	Implements: 'options',
	
	initialize: function(wrap, module, options){
		var self = this,
			o = self.setOptions(options, complex_presets), 
			modname,
			mod,
			modCS;
			
		wrap = $(wrap);
		
		if(wrap){		
			for(modname in module){
				mod = module[modname];
				modCS = mod.CS || modname;
			
				self.add(
					wrap.getElement( o.CSPrefix + modCS ), 
					wrap.getElement( o.CSPrefix + (mod.errCS || (modCS + o.errCSSuffix) ) ),
					modname, 
					mod,
					o
				);
			}
		}
	},
	
	add: function(selector, errHolder, modname, mod, options){
		element = $(selector);
		errHolder = $(errHolder);
		
		var self = this,
			validator;

		
		validator = new Validator(element, errHolder, mod, options);
		
		self._checks.push(validator.check);
		self._items[modname] = validator.val;
		
		return self;
	},
	
	check: function(){
		var self = this,
			show_all_err = self.options.showAllErr,
			i = 0,
			pass = true,
			len = self._checks.length,
			check;
			
		for(; i < len; i ++){
			check = self._checks[i];
			
			// check first
			pass = check() && pass;
			
			if(!pass && !show_all_err){
				break;
			}
		}
			
		return pass;
	},
	
	_get: function(isQueryString){
		var ret = {}, key, items = this._items;
		
		for(key in items){
			ret[key] = items[key].val();
		}
		
		return isQueryString ? K.toQueryString(ret) : ret;
	},
	
	_set: function(name, value){
		
	},
	
	
	val: function(name, value){
		
	}

});	
	

	
return {
	add			: addValidator,
	Validator	: Validator,
	Complex		: Complex
};

});


/**
 * TODO:
 *
 * 1. 事件支持，用于同其他组件的通信。
     注册表单事件

 * 2. 整理与配置相关的代码
 * 3. test the type of elements to be checked
 
 * @change-log:
 * 2011-05-04  Kael Zhang:
 * - change type-detecting method
 * 2011-04-14  Kael:
 * - 完成基本功能
 */