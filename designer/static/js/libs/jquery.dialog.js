;(function() {

	var _box,
		_count = 0,
		okCallbacks = $.Callbacks(),
		_$window = $(window),
		_$document = $(document),
		_$html = $('html'),
		_isIE6 = window.VBArray && !window.XMLHttpRequest,
		_isMobile = /*'createTouch' in document && !('onmousemove' in _elem)
			|| /(iPhone|iPad|iPod)/i.test(navigator.userAgent)*/false,
		_expando = 'dialog' + + new Date;

	var dialog = function(config) {

		config = config || {};

		var api,
			defaults = dialog.defaults,
			elem = config.follow = this.nodeType === 1 && this || config.follow;

		// 合并默认配置
		for (var i in defaults) {
			if (config[i] === undefined) config[i] = defaults[i];		
		};

		// 返回跟随模式或重复定义的ID
		if (typeof elem === 'string') elem = $(elem)[0];
		config.id = config.id || _expando + _count;

		api = dialog.list[config.id];

		if (elem && api) return api.follow(elem).zIndex();
		if (api) {
			if(config.created) {
				config.created.call(api.DOM.wrap[0]);
			}
			return api;//.zIndex();
		}

		// zIndex全局配置
		dialog.defaults.zIndex = config.zIndex;
		
		_count ++;

		dialog.list[config.id] = new dialog.prototype._init(config);

		if(config.created) {
			config.created.call(dialog.list[config.id].DOM.wrap[0]);
		}

		return dialog.list[config.id];
	};

	dialog.prototype = {

		closed: true,
		_init: function(config) {

			var that = this;

			that.closed = false;
			that.config = config;
			that.cancelCallbacks = $.Callbacks();
			that.DOM = DOM = that.DOM || that._getDOM();
			var wrap = DOM.wrap;
			wrap.addClass('dialog ' + config.dialogClass);
			wrap.attr('id', config.id);
			wrap.find('.dialog-content ').addClass(config.dialogContentClass);
			if( config.draggable ) {
				wrap.draggable({
					cursor: 'move',
					handle: '.dialog-title',
					containment: config.containment || 'window'
				});

				that.dragStart()
					.drag()
					.dragStop();
			}





			that.title(config.title).
				//position(config.position).
				content(config.content).
				width(config.width).
				height(config.height).
				button(config.button).
				ajax(config.ajax).
				maxHeight(config.maxHeightObj).
				minHeight(config.minHeightObj).
				maxWidth(config.maxWidth).
				minWidth(config.minWidth).
				createTime();


			if( config.isShowHelp ) {
				that.DOM.wrap.find('.dialog-help').show();

				that.DOM.wrap.find('.dialog-help a').unbind('click').bind('click', function(e) {
					config.helpCallback && config.helpCallback.call(that.DOM.wrap[0]);
					e.preventDefault();
				});
			}

			if(config.hideTitle) {
				that.hideTitle();
			}

			if(config.hideFooter) {
				that.hideFooter();
			}

			if ( config.ok ) {
				okCallbacks.add( config.ok );
			}

			if ( config.cancel ) {
				that.cancelCallbacks.add( config.cancel );
			}

			if( $.isArray(config.titleButton) && config.titleButton.length ) {
				that.titleButton( config.titleButton );
			}

			config.follow
				? that.follow(config.follow)
				: that.position(config.position);
			that.zIndex();
			that[config.show ? 'show' : 'hide'](true);

			
			config.lock && that.lock();
			if(!config.show) {
				that._lockMaskWrap && that._lockMaskWrap.hide();
			}

			config.init && config.init.call(that, window);

			that._addEvent();
			_box = null;

			return that;
		},
		//添加内容
		content: function(msg) {
			var DOM = this.DOM,
			wrap = DOM.wrap;
			wrap.find('.dialog-content').html(msg);

			return this;
		},
		//添加标题
		title: function(text) {
			var DOM = this.DOM,
			wrap = DOM.wrap,
			title = wrap.find('.title h1').eq(0);

			if(text || text === "") {
				title.html(text);
			}

			return this;
		},
		createTime: function() {
			var DOM = this.DOM,
			wrap = DOM.wrap;

			wrap.attr('createTime', (new Date()).getTime());
		},
		titleButton: function(args) {
			var DOM = this.DOM,
			wrap = DOM.wrap,
			help = wrap.find('.dialog-help');

			if($.isArray(args) && args.length) {
				$.each(args, function(i, val) {
					var $dom = $(val.dom),
						event = val.event,
						fn = val.fn;

					$dom.on(event, fn);
					$dom.insertAfter(help);
				});
			}
		},
		hideTitle: function() {
			var DOM = this.DOM,
			wrap = DOM.wrap,
			title = wrap.find('.dialog-title');

			title.hide();

			return this;
		},
		hideFooter: function() {
			var DOM = this.DOM,
			wrap = DOM.wrap,
			footer = wrap.find('.panel-footer');

			footer.hide();
			wrap.find('.dialog-content.main')
			.css('border-bottom-left-radius', '8px')
			.css('border-bottom-right-radius', '8px');

			return this;
		},
		//设置位置
		position: function(position) {

			var config = this.config,
				DOM = this.DOM,
				wrap = DOM.wrap;
			this._autoPositionType();
			if(position) {
				wrap.position(position);
			} else {
				wrap.css({
					left: ( $(window).width() - wrap.outerWidth() )/2,
					top: ( $(window).height() - wrap.outerHeight() )/2
				})
			}

			

			return this;
		},
		//设置宽度
		width: function(width) {
			var DOM = this.DOM,
			wrap = DOM.wrap;
			wrap.width(width);

			return this;
		},
		//设置高度
		height: function(height) {
			var DOM = this.DOM,
			wrap = DOM.wrap;
			wrap.find('.dialog-content').height(parseFloat(height) - wrap.find('.title').outerHeight() - wrap.find('.panel-footer').outerHeight());

			return this;
		},
		// 添加确定回调
		ok: function ( cb ) {
			okCallbacks.add( cb );
		},
		// 添加取消回调
		cancel: function ( cb ) {
			this.cancelCallbacks.add( cb );
		},
		removeCallback: function( cb ) {
			this.cancelCallbacks.remove( cb );
		},
		//添加按钮
		button: function(buttons) {
			if(typeof buttons === 'undefined') {
				return;
			}
			var DOM = this.DOM,
			wrap = DOM.wrap,
			footer = wrap.find('.panel-footer'),
			config = this.config,
			that = this;
			footer.empty();
			$.each(buttons, function(i, dom) {
				$('<div class="'+ dom.wrapclass +'"'+ (dom.hide?'style="display:none;"':'') +'>'+(dom.html?dom.html:'<button class="btn normal shadow ' + (dom.colorclass || 'blue') + '">'+ dom.value +'</button>')+'</div>')
					.find(':button')
					.unbind('click')
					.bind('click', function(event) {

						var isNoClose;

						if(dom.click) {
							isNoClose = dom.click.call(that, event);
							if(isNoClose === false) return;
						}

						if(config.destroyClose) {
							if( !(dom.state == 'submit') ) {
								config.closeCallback && config.closeCallback.call(that.DOM.wrap);
								//cancelCallbacks.fire();
							} else {
								okCallbacks.fire();
							}
							that._click(config.cancelVal);
						} else {
							if( !(dom.state == 'submit') ) {
								config.hideCallback && config.hideCallback.call(that.DOM.wrap);
								//cancelCallbacks.fire();
							} else {
								okCallbacks.fire();
							}
							that.hide();
						}


					}).end().appendTo(footer);
			});

			return that;
		},
		//显示
		show: function() {
			this.closed = false;

			this.DOM.wrap.show();
			!arguments[0] && this._lockMaskWrap && this._lockMaskWrap.show();
			this.config.showCallback && this.config.showCallback.call(this.DOM.wrap[0]);
			if(this.config.created && dialog.list[this.config.id]) {
				this.config.created.call(this.DOM.wrap[0]);
			}

			return this;
		},
		//隐藏
		hide: function() {
			this.closed = true;

			this.DOM.wrap.hide();
			!arguments[0] && this._lockMaskWrap && this._lockMaskWrap.hide();

			return this;
		},
		//销毁
		close: function() {

			if (this.closed) return this;

			var that = this,
				DOM = that.DOM,
				wrap = DOM.wrap,
				list = dialog.list,
				fn = that.config.close,
				follow = that.config.follow;

			that.time();
			if (typeof fn === 'function' && fn.call(that, window) === false) {
				return that;
			};

			that.unlock();

			// 置空内容
			that._elemBack && that._elemBack();
			wrap[0].className = wrap[0].style.cssText = '';
			wrap.find('.title h1').eq(0).html('');
			wrap.find('.dialog-content').html('');
			wrap.find('.panel-footer').html('');
			
			


			if (dialog.focus === that) dialog.focus = null;
			//if (follow) follow.removeAttribute(_expando + 'follow');
			delete list[that.config.id];
			that._removeEvent();
			that.config.draggable && wrap.draggable('destroy');
			that.hide(true)._setAbsolute();

			// 清空除this.DOM之外临时对象，恢复到初始状态，以便使用单例模式
			for (var i in that) {
				if (that.hasOwnProperty(i) && i !== 'DOM') delete that[i];
			};

			// 移除HTMLElement或重用
			_box ? wrap.remove() : _box = that;
			wrap.remove();

			return that;
		},
		//添加遮罩
		lock: function() {

			if (this._lock) return this;

			var that = this,
			index = dialog.defaults.zIndex - 1,
			wrap = that.DOM.wrap,
			config = that.config,
			docWidth = _$document.width(),
			docHeight = _$document.height(),
			lockMaskWrap = that._lockMaskWrap || $(document.body.appendChild(document.createElement('div'))),
			lockMask = that._lockMask || $(lockMaskWrap[0].appendChild(document.createElement('div'))),
			domTxt = '(document).documentElement',
			sizeCss = _isMobile ? 'width:' + docWidth + 'px;height:' + docHeight
				+ 'px' : 'width:100%;height:100%',
			ie6Css = _isIE6 ?
				'position:absolute;left:expression(' + domTxt + '.scrollLeft);top:expression('
				+ domTxt + '.scrollTop);width:expression(' + domTxt
				+ '.clientWidth);height:expression(' + domTxt + '.clientHeight)'
			: '';

			that.zIndex();
			wrap.addClass('aui_state_lock');
			lockMaskWrap[0].style.cssText = sizeCss + ';position:fixed;z-index:'
			+ index + ';top:0;left:0;overflow:hidden;' + ie6Css;
			lockMaskWrap.addClass(config.maskClass);
			lockMask[0].style.cssText = 'height:100%;background:' + config.background
			+ ';filter:alpha(opacity=0);opacity:0';

			// 让IE6锁屏遮罩能够盖住下拉控件
			if (_isIE6) lockMask.html(
				'<iframe src="about:blank" style="width:100%;height:100%;position:absolute;' +
				'top:0;left:0;z-index:-1;filter:alpha(opacity=0)"></iframe>');

			lockMask.stop();
			lockMask.bind('click', function () {
				//that._reset();
				if(config.isCloseOnModal) {
					that.cancelCallbacks.fire();
					if(config.destroyClose) {
						that._click(that.config.cancelVal);
					} else {
						config.hideCallback && config.hideCallback.call(that.DOM.wrap);
						that.hide();
					}
				}
			}).bind('dblclick', function () {
				//that._click(that.config.cancelVal);
			});

			if (config.duration === 0) {
				lockMask.css({opacity: config.opacity});
			} else {
				lockMask.animate({opacity: config.opacity}, config.duration);
			};

			that._lockMaskWrap = lockMaskWrap;
			that._lockMask = lockMask;
			
			that._lock = true;
			return that;
		},
		//去除遮罩
		unlock: function() {

			var that = this,
				lockMaskWrap = that._lockMaskWrap,
				lockMask = that._lockMask;

			if (!that._lock) return that;
			var style = lockMaskWrap[0].style;
			var un = function () {
				if (_isIE6) {
					style.removeExpression('width');
					style.removeExpression('height');
					style.removeExpression('left');
					style.removeExpression('top');
				};
				style.cssText = 'display:none';
				
				lockMaskWrap.remove();
			};

			lockMask.stop().unbind();
			that.DOM.wrap.removeClass('aui_state_lock');
			if (!that.config.duration) {// 取消动画，快速关闭
				un();
			} else {
				lockMask.animate({opacity: 0}, that.config.duration, un);
			};

			that._lock = false;
			return that;
		},
		//获取对话框dom
		_getDOM: function() {

			var $wrap = $('<div>'),dom;

			$wrap.addClass('dialog panel');

			$wrap.css({position: 'absolute', left: 0, top: 0});
			$wrap.html(dialog._templates);
			$wrap.appendTo('body');
			dom = {wrap: $wrap};

			this.config.create && this.config.create.call($wrap[0]);

			return dom;
		},
		//设置z-index
		zIndex: function() {
			var that = this,
			DOM = that.DOM,
			wrap = DOM.wrap,
			top = dialog.focus,
			index = dialog.defaults.zIndex ++;

			// 设置叠加高度
			wrap.css('zIndex', index);
			that._lockMask && that._lockMask.css('zIndex', index - 1);

			// 设置最高层的样式
			top && top.DOM.wrap.removeClass('aui_state_focus');
			dialog.focus = that;
			wrap.addClass('aui_state_focus');
		
			return that;
		},
		setZIndex: function(index) {
			var that = this,
			DOM = that.DOM,
			wrap = DOM.wrap,
			top = dialog.focus,
			index = dialog.defaults.zIndex = index;

			// 设置叠加高度
			wrap.css('zIndex', index);
			that._lockMask && that._lockMask.css('zIndex', index - 1);
		
			return that;
		},
		//设置定时关闭
		time: function(second) {
			var that = this,
				cancel = that.config.cancelVal,
				timer = that._timer;
			timer && clearTimeout(timer);

			if (second) {
				that._timer = setTimeout(function(){
					that._click(cancel);
				}, 1000 * second);
			};
			
			return that;
		},
		//设置absolute
		_setAbsolute: function() {
			var style = this.DOM.wrap[0].style;

			if (_isIE6) {
				style.removeExpression('left');
				style.removeExpression('top');
			};

			style.position = 'absolute';
		},
		//添加点击销毁
		_click: function(name) {
			this.close();

			return this;
		},
		//重设位置
		_reset: function (test) {
			var newSize,
				that = this,
				oldSize = that._winSize || _$window.width() * _$window.height(),
				elem = that._follow,
				width = that._width,
				height = that._height,
				left = that._left,
				top = that._top;
			
			if (test) {
				// IE6~7 window.onresize bug
				newSize = that._winSize =  _$window.width() * _$window.height();
				if (oldSize === newSize) return;
			}
			
			if (width) {
				that.width(width);
			}

			if (height) {
				that.height(height);
			}
			
			if (elem) {
				that.follow(elem);
			} else if (left || top) {
				//that.position(left, top);
			}

			if( that.config.noResizePos ) {
				return;
			}

			if(that.config.centerPosition || !that.config.position) {
				that.DOM.wrap.css({
					left: ( $(window).width() - that.DOM.wrap.outerWidth() )/2,
					top: ( $(window).height() - that.DOM.wrap.outerHeight() )/2
				});
			}
		},
		//添加事件
		_addEvent: function() {
			var resizeTimer,
				that = this,
				config = that.config,
				isIE = 'CollectGarbage' in window,
				DOM = that.DOM;

			// 窗口调节事件
			that._winResize = function () {
				resizeTimer && clearTimeout(resizeTimer);
				resizeTimer = setTimeout(function () {
					that._reset(isIE);
				}, 40);

				if(config.autoResize) {
					that.maxHeight({
		              className: config.autoResize.className || 'items',
		              maxHeight: config.autoResize.maxHeight ? ($(window).height() - config.autoResize.maxHeight + 'px') : $(window).height()-190+'px'
		            });
		            that.DOM.wrap.find('.' + (config.autoResize.className || 'items')).css('height', config.autoResize.maxHeight ? ($(window).height() - config.autoResize.maxHeight + 'px') : $(window).height()-190+'px');
		            if(!config.draggable) return;
		            that.containment([0, document.body.scrollTop, ( $(window).width()-$('#' + config.id).outerWidth() ), ( $(window).height()-39+document.body.scrollTop )]);
				}
			};
			_$window.bind('resize', that._winResize);

			// 监听点击
			DOM.wrap
			.bind('click', function (event) {
				var target = event.target, callbackID;
				
				if (target.disabled) return false; // IE BUG

				if (target === DOM.wrap.find('.close .pa')[0]) {
					// 取消
					that.cancelCallbacks.fire();
					
					if(config.destroyClose) {
						config.closeCallback && config.closeCallback(that.DOM.wrap);
						that._click(config.cancelVal);
					} else {
						config.hideCallback && config.hideCallback.call(that.DOM.wrap);
						that.hide();
					}

					return false;
				} else {
					callbackID = target[_expando + 'callback'];
					callbackID && that._click(callbackID);
				};
				
			});

			//moveTotop
			if( config.isMoveToTop ) {
				DOM.wrap
					.bind('mousedown', function () {
						that.zIndex();
					});
			}
		},
		//移除事件
		_removeEvent: function () {
			var that = this,
				DOM = that.DOM;
			
			DOM.wrap.unbind();
			_$window.unbind('resize', that._winResize);
		},
		_autoPositionType: function () {
			this[this.config.fixed ? '_setFixed' : '_setAbsolute']();
		},
		_setAbsolute: function () {

			var style = this.DOM.wrap[0].style;

			style.position = 'absolute';
		},
		_setFixed: function() {
			var $elem = this.DOM.wrap,
				style = $elem[0].style;
				style.position = 'fixed';
		},
		follow: function(elem) {
			var $elem, that = this, config = that.config;
		
			if (typeof elem === 'string' || elem && elem.nodeType === 1) {
				$elem = $(elem);
				elem = $elem[0];
			};

			// 隐藏元素不可用
			if (!elem || !elem.offsetWidth && !elem.offsetHeight) {
				return that.position(that._left, that._top);
			};

			var expando = _expando + 'follow',
				winWidth = _$window.width(),
				winHeight = _$window.height(),
				docLeft =  _$document.scrollLeft(),
				docTop = _$document.scrollTop(),
				offset = $elem.offset(),
				width = elem.offsetWidth,
				height = elem.offsetHeight,
				isFixed = _isIE6 ? false : config.fixed,
				left = isFixed ? offset.left - docLeft : offset.left,
				top = isFixed ? offset.top - docTop : offset.top,
				wrap = that.DOM.wrap[0],
				style = wrap.style,
				wrapWidth = wrap.offsetWidth,
				wrapHeight = wrap.offsetHeight,
				setLeft = left - (wrapWidth - width) / 2,
				setTop = top + height,
				dl = isFixed ? 0 : docLeft,
				dt = isFixed ? 0 : docTop;

				setLeft = setLeft < dl ? left :
				(setLeft + wrapWidth > winWidth) && (left - wrapWidth > dl)
				? left - wrapWidth + width
				: setLeft;

			setTop = (setTop + wrapHeight > winHeight + dt)
			&& (top - wrapHeight > dt)
			? top - wrapHeight
			: setTop;
			
			style.left = setLeft + 'px';
			style.top = setTop + 'px';
			
			//that._follow && that._follow.removeAttribute(expando);
			that._follow = elem;
			elem[expando] = config.id;
			that._autoPositionType();

			return that;
		},
		//开始拖动
		dragStart: function() {
			var that = this;
			that.DOM.wrap.draggable('option', {start: function() {
				that.config.dragStart.call(that.DOM);
			}});

			return that;
		},
		//拖动
		drag: function() {
			var that = this;
			that.DOM.wrap.draggable('option', {drag: function() {
				that.config.drag.call(that.DOM);
			}});

			return that;
		},
		//拖动结束
		dragStop: function() {
			var that = this;
			that.DOM.wrap.draggable('option', {stop: function() {
				that.config.dragStop.call(that.DOM);
			}});

			return that;
		},
		//设置参数
		setOptions: function(options) {
			for(var i in options) {
				if(options.hasOwnProperty(i)) {
					this.config[i] || ( this.config[i] = options[i] );
					this[i] && this[i](options[i]);
				}
			}

			return this;
		},
		//发送ajax请求
		ajax: function(obj) {

			var that = this;

			if( typeof obj === 'undefined' ) {
				return that;
			}

			if(obj.url) {
				$.ajax({
					url: obj.url,
					type: obj.type || 'GET',
					dataType: obj.dataType || 'json',
					cache: false,
					beforeSend: function() {
						obj.beforeSend && obj.beforeSend.call( that.DOM.wrap[0] );
					},
					success: function(data) {
						obj.success && obj.success.call( that.DOM.wrap[0], data );
					},
					complete: function() {
						obj.complete && obj.complete.call( that.DOM.wrap[0]);
					}
				});
			}

			return that;
		},
		//设置拖动范围
		containment: function(_containment) {
			this.DOM.wrap.draggable('option', {containment: _containment});
		},
		maxHeight: function(maxHeightObj) {
			var _maxHeightObj = $.extend({
				className: 'dialog-content',
				maxHeight: null
			}, maxHeightObj);
			this.DOM.wrap.find('.'+_maxHeightObj.className).css('max-height', _maxHeightObj.maxHeight);

			return this;
		},
		minHeight: function(minHeightObj) {
			var _minHeightObj = $.extend({
				className: 'dialog-content',
				minHeight: null
			}, minHeightObj);
			this.DOM.wrap.find('.'+_minHeightObj.className).css('min-height', _minHeightObj.minHeight);

			return this;
		},
		maxWidth: function(width) {
			this.DOM.wrap.css('max-width', width);

			return this;
		},
		minWidth: function(width) {
			this.DOM.wrap.css('min-width', width);

			return this;
		},
		showHelp: function() {
			var that = this;
			that.DOM.wrap.find('.dialog-help').show();
			that.config.isShowHelp = true;

			that.DOM.wrap.find('.dialog-help a').unbind('click').bind('click', function(e) {
				that.config.helpCallback && that.config.helpCallback.call(that.DOM.wrap[0]);
				e.preventDefault();
			});
			
			return that;
		}
	}; 

	dialog.prototype._init.prototype = dialog.prototype;

	$.fn.dialog = $.fn.dialog = function () {
		var config = arguments;
		this[this.live ? 'live' : 'bind']('click', function () {
			dialog.apply(this, config);
			return false;
		});
		return this;
	};

	/** 最顶层的对话框API */
	dialog.focus = null;


	/** 获取某对话框API */
	dialog.get = function (id) {
		return id === undefined
		? dialog.list
		: dialog.list[id];
	};

	dialog.list = {};

	dialog._templates = 
	'<div class="con">'
	+'<div class="dialog-title title">'
	+	'<h1>模态框</h1>'
	+	'<span class="close"><a href=""><i class="pa icon-closepanle"></i></a></span>'
	+   '<span class="dialog-help help"><a href=""><i class="pa icon-help"></i></a></span>'
	+'</div>'
	+'<div class="dialog-content">'
	+	'内容'
	+'</div>'
	+'<div class="panel-footer">'
	+'</div>'
	+'</div>';

	/**
	 * 默认配置
	 */
	dialog.defaults = {
		button: [{wrapclass: 'right', colorclass: 'blue', value: '确定'}],		//添加按钮
		zIndex: 10000,															//设置z-index										 
		opacity: .3,															//遮罩层透明度											
		background: '#000',														//遮罩层背景颜色
		okVal: '\u786E\u5B9A',		// 确定按钮文本. 默认'确定'
		cancelVal: '\u53D6\u6D88',
		title: '\u6d88\u606f',													//对话框标题
		ok: null,					// 确定按钮回调函数
		cancel: null,
		content: '内容',														//内容
		show: true,																//自动显示
		dialogClass: 'panel',													//面板class
		dialogContentClass: 'main',												//面板内容class
		fixed: true,															//true为fixed，false为absolute						
		follow: null,	
		destroyClose: true,														//关闭销毁
		centerPosition: false,													//位置居中
		dragStart: function() {},												//开始拖动事件
		drag: function() {},													//拖动事件
		dragStop: function() {},												//拖动结束事件
		lock: true,																//添加遮罩
		isCloseOnModal: false,  													//点击遮罩关闭对话框
		showCallback: null,                                                     //打开对话框执行
		hideCallback: null,                                                     //关闭对话框执行
		maxHeightObj: null,                                                     //设置最大高度{className: 'main', maxHeight: 500} 
		minHeightObj: null,                                                     //设置最小高度{className: 'main', minHeight: 500}  
		maxWidth: null,                                                         //设置最大宽度 
		minWidth: null,                                                         //设置最小宽度      
		isShowHelp: false,                                                      //是否显示help按钮
		helpCallback: null,                                                     //点击帮助按钮回调
		isMoveToTop: false,
		draggable: true
	};

	window.dialog = dialog;
	$.dialog = dialog;
})();

