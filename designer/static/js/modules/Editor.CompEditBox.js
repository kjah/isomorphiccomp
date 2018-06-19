C.module('Editor.CompEditBox',function(){
	"use strict";

	// M.Editor.Util工具类
	var _utils = null;

	// 事件操作层
	var _$eventLayer = null;

	var _$tempCompEditBox = null;
	
	// 事件层组件选框
	var _$compEditBox = null;

	// 当前选中组件
	var _$currSelectComp = null;
	// 当前选中组件（真实选中，保存在.flowTemp的情况），只有调用 _setCompEditBox 方法才会记录
	var _$currSelectCompReal = null;

	// 拖拽前组件样式，包含坐标宽高等信息
	var _originalCompData = null;

	var _f$ = null;

	// 移动偏移，移动超过5px后，才计算移动操作
	var _allowMove = false;

	// 记录鼠标按下原始坐标点
	var _originalMouseDownOffset = {};

	// 拖拽移动鼠标偏移超过10px时，才算拖拽开始
	var _allowDraggingMoveOffset = 10;

	var _$allWidgets = null;

	var _DEBUGGER = false;
	
	// 记录页面是否加在完毕
	var _isLoaded = false;

	// 是否正在拖拽中
	var _isDragging = false;

	// 清除之前数据引用
	function _cleanData(){
		// 当前选中组件
		_$currSelectComp = null;
		_$currSelectCompReal = null;

		// 拖拽前组件样式，包含坐标宽高等信息
		_originalCompData = null;

		_f$ = null;

		// 移动偏移，移动超过5px后，才计算移动操作
		_allowMove = false;

		// 记录鼠标按下原始坐标点
		_originalMouseDownOffset = {};

		_$allWidgets = null;

		_isDragging = false;

		// 隐藏临时选框
		_resetTempCompEditBoxSize();
	}

	// 模块初始化
	function _init(param){
		// 隔离操作事件响应层
		_$eventLayer = $('#eventLayer');
		// 操作框
		_$compEditBox = $('#editBox');

		// 鼠标移动时临时选框
		_$tempCompEditBox = $('#tempEditBox');

		// 工具类
		_utils = M.Editor.Util;

		// 初始化事件层鼠标相关事件处理	
		__mouseHandle = _initMouseEvent();

		// 初始化组件操作框事件处理函数
		_initCompEditBoxEventHandle();

		// 初始化事件层相关
		_initEventLayer();

		// 页面加载完毕后，记录f$
		M.Editor.onPageLoad(function(param){
			// 清除之前数据引用
			_cleanData();

			// 记录子页面jquery对象
			_f$ = param.pageWindow.jQuery;

			// 记录页面已加载完毕
			_isLoaded = true;

			$(this).on('unload', function(){
				// 清除之前数据引用
				_cleanData();

				// 记录页面未加载完毕
				_isLoaded = false;
			});
		});

		// 窗口尺寸调整后，重新选中操作框
		M.Editor.onResize(function(args){
			if(_$currSelectComp){
				_setCompEditBox(_$currSelectComp);
				_resetTempCompEditBoxSize();
			}
		});
	}

	// 初始化事件层相关
	function _initEventLayer(){
		// 绑定操作框mousedown事件和双击事件
		_$eventLayer.on('mousemove', function(e){
			// 页面未加载完，不允许后续操作
			if(!_isLoaded){
				return;
			}

			// 如果正在拖拽中，不执行后续操作
			if(_isDragging){
				return;
			}

			// 如果富文本编辑器正在编辑状态下
			if(M.Editor.RichEditor.isEditing()){
				// 隐藏临时选框
				_resetTempCompEditBoxSize();
				return;
			}

			// 重置临时组件选框尺寸
			_resetTempCompEditBoxSize(_getTargetCompByAll(e));
		}).on('mouseleave', function(e){
			// 鼠标移出事件层时隐藏临时选框
			_resetTempCompEditBoxSize();
		}).on('click', function(e){
			// 如果点击的位置是文字编辑区，不执行后续操作 
			if($(e.target).closest('#richTextEditor').length > 0){
				return false;
			}

			// 选中组件
			_setCompEditBox(_getTargetCompByAll(e));
		});

		// 通过坐标获取指针下方组件
		function _getTargetCompByAll(e){
			// 获取页面所有组件元素
			var $allComps = _getAllWidgets();

			var targetComp = _getTargetComp(_getMousePointAtRelativeFrame(e.pageX, e.pageY));

			// 获取指针坐标下组件dom实例
			return _f$(targetComp);
		}
	}

	// 获取鼠标指针相对iframe相对坐标
	function _getMousePointAtRelativeFrame(x, y){
		// 获取iframe相对坐标
		var offset = $('#mainArea').offset();

		return {
			x: x - offset.left,
			y: y - offset.top
		};
	}

	// 初始化组件操作框事件处理函数
	function _initCompEditBoxEventHandle(){
		// 选中组件框面包屑点击事件
		_$compEditBox.find('.bread').on('click', 'ul>li', function(e){
			// 获取点击面包屑对应的组件对象
			var comp = $(this).data('target');

			// 重新设置组件选中框选中对应的组件
			_setCompEditBox(_f$(comp));

			// 阻止事件冒泡
			e.stopPropagation();
		}).on('click', '>li', function(e){
			e.stopPropagation();
		});

		// 点击组件选中框的按钮工具条阻止事件冒泡
		_$compEditBox.find('.operate-btns>:button').on('click', function(e){
			var operate = $(this).attr('data-operate');

			// 删除提醒
			if(operate == 'delete'){
				M.Dialog.create({
					data: {
						title: '提示',
						width: 490,
						height: 220,
						html: '<div class="alert alert-succ">' + 
									'<div class="alert-title">' + 
										'<i class="al icon-alert-yellow"></i>' + 
										'<h1>您确定删除该元素/组件吗？</h1>' + 
									'</div>' + 
									'<p class="succ-info add-alert">此元素/组件将被删除并不可恢复<br>请谨慎操作</p>' + 
									'<p></p>' + 
								'</div>'
					},
					methods: {
						ok: function(){
							// 删除选中组件
							M.Editor.Operation.deleteElems(_$currSelectComp);
						}
					}
				});
			}else if(operate == 'fixed'){
				// 设为固定浏览器
				M.Editor.Operation.openFixedDialog();
			}

			// 隐藏临时选框
			_resetTempCompEditBoxSize();

			// 阻止事件冒泡
			e.stopPropagation();
		}).on('mousedown', function(e){
			// 阻止事件冒泡（避免触发其他环节mousedown事件）
			e.stopPropagation();
		});

		// 取消固定定位按钮
		_$compEditBox.find('.fixedbrowser').on('click', function(e){
			M.Editor.Operation.cancelFixed();
			e.stopPropagation();
		});
	}

	var __mouseHandle = null;

	function _getCmdExecuteValues2(e){
		var newValues = {};

		var x = e.pageX - $('#mainFrame').offset().left;
		var y = e.pageY - $('#mainFrame').offset().top;

		// jquery包装集对象
		var $targetComp = $(_getTargetComp({x:x, y:y}));


					// 如果悬浮在组件上
					if($targetComp[0]){
						// 悬浮在grid上时，计算鼠标是否悬浮在某个空容器上
						if(_utils.isGridWidget($targetComp)){
							// 计算指针在grid网格组件中哪一个空容器中
							var gridContainer = _calcPointOnGridContainer($targetComp, e);
							$targetComp = gridContainer ? $(gridContainer) : $targetComp;
						}

						var dir = "";
						// 如果悬浮在空容器（content_box-）中，设置方向为middle
						if(_utils.isContainer($targetComp)){
							dir = "middle";
						}else{
							// 目标组件是没有子组件的grid，设为middle，否则计算正确方向
							if(_utils.isGridWidget($targetComp) && _utils.getContainerInsideElems($targetComp).length === 0){
								dir = 'middle';
							}else{
								// 计算鼠标指针在组件上距离最近的方向
								dir = _calcOperateDir($targetComp, x, y);
							}

							if(dir == 'middle'){
								// 重新计算鼠标指针在空容器上的方向（如果在指针在空容器边缘15px，不算拖拽在中间）
								var emptyGridDir = _calcEmptyGridAndContainerDir($targetComp, x, y);

								dir = emptyGridDir;
							}
						}

						if(dir == 'top' || dir == 'left'){
							// 获取鼠标下方的组件的父容器组件
							var $targetParentWidget = _utils.getElemContainerWidget($targetComp);

							// 判断最近的容器对象是否为grid网格，并且插入示意符是在某个组件左侧
							if(_utils.isGridWidget($targetParentWidget) && dir == 'left'){
								// 获取当前组件要插入的目标容器（#content_box）
								var $targetContainer = _utils.getElemContainer($targetComp);
								
								// 记录要插入的网格组件，和插入后网格容器索引（right右侧就是索引+1）
								newValues.insertToNewCell = {
							        targetGrid: $targetParentWidget,
							        targetContIdx: $targetContainer.index()
							    };
							}else{
								// 如果是.pagebox容器
								if(_utils.isBaseBox($targetComp)){
									var $childs = $targetComp.children(_utils.elemSelector);
									if($childs[0]){
										$targetComp = $childs.eq(0);

										// 记录拖拽后，应当插入到哪个组件旁边
										newValues.insert = {
											type: 'before',
											target: $targetComp
										};
									}else{
										newValues.parent = $targetComp;
									}
								}else{
									// 记录拖拽后，应当插入到哪个组件旁边
									newValues.insert = {
										type: 'before',
										target: $targetComp
									};
								}
							}
						}else if(dir == 'bottom' || dir == 'right'){
							// 获取鼠标下方的组件的父容器组件
							var $targetParentWidget = _utils.getElemContainerWidget($targetComp);


							// 判断最近的容器对象是否为grid网格，并且插入示意符是在某个组件右侧
							if(_utils.isGridWidget($targetParentWidget) && dir == 'right'){
								// 获取当前组件要插入的目标容器（#content_box）
								var $targetContainer = _utils.getElemContainer($targetComp);

								// 记录要插入的网格组件，和插入后网格容器索引（right右侧就是索引+1）
								newValues.insertToNewCell = {
							        targetGrid: $targetParentWidget,
							        targetContIdx: $targetContainer.index()+1
							    };
							}else{
								// 记录拖拽后，应当插入到哪个组件旁边
								/*newValues.insert = {
									type: 'after',
									target: $targetComp
								};*/
								// 如果是.pagebox容器
								if(_utils.isBaseBox($targetComp)){
									var $childs = $targetComp.children(_utils.elemSelector);
									if($childs[0]){
										$targetComp = $childs.eq($childs.length-1);
										
										// 记录拖拽后，应当插入到哪个组件旁边
										newValues.insert = {
											type: 'after',
											target: $targetComp
										};
									}else{
										newValues.parent = $targetComp;
									}
								}else{
									// 记录拖拽后，应当插入到哪个组件旁边
									newValues.insert = {
										type: 'after',
										target: $targetComp
									};
								}
							}
						}else if(dir == 'middle'){
							// 如果目标组件是grid网格，或者container容器
							if(_utils.isGridWidget($targetComp)){
								// 插入到目标网格第一个cell里
								newValues.parent = _utils.getContainerInsideBox($targetComp).eq(0);
							}else{
								newValues.parent = $targetComp;
							}
						}
					}else{
						if(_DEBUGGER)
						console.log('.........pagebox');

						// 计算鼠标指针在组件上距离最近的方向
						var dir = _calcOperateDir($targetComp, x, y);

						if(dir == 'left' || dir == 'top'){

						}else if(dir == 'bottom' || dir == 'right'){}

					}
				// }

		return {
			newValues: newValues
		};
	}

	function _getCmdExecuteValues(e){
				var newValues = {
				};

				var x = e.pageX - $('#mainFrame').offset().left;
				var y = e.pageY - $('#mainFrame').offset().top;

				// 移动才走此逻辑
				// if(_originalCompData.operateType == 'move'){
					// jquery包装集对象
					var $targetComp = $(_getTargetComp({x:x, y:y}));

					// 如果悬浮在组件上
					if($targetComp[0]){
						// 悬浮在grid上时，计算鼠标是否悬浮在某个空容器上
						if($targetComp[0] != _$currSelectComp[0] && _utils.isGridWidget($targetComp)){
							// 计算指针在grid网格组件中哪一个空容器中
							var gridContainer = _calcPointOnGridContainer($targetComp, e);
							$targetComp = gridContainer ? $(gridContainer) : $targetComp;
						}

						if($targetComp[0] == _$currSelectComp[0]){
							if(_DEBUGGER)
							console.warn('同一个东西：'+$targetComp.attr('id'));
							return false;
						}

						var dir = "";
						// 如果悬浮在空容器（content_box-）中，设置方向为middle
						if(_utils.isContainer($targetComp)){
							dir = "middle";
						}else{
							// 目标组件是没有子组件的grid，设为middle，否则计算正确方向
							if(_utils.isGridWidget($targetComp) && _utils.getContainerInsideElems($targetComp).length === 0){
								dir = 'middle';
							}else{
								// 计算鼠标指针在组件上距离最近的方向
								dir = _calcOperateDir($targetComp, x, y);
							}

							if(dir == 'middle'){
								// 重新计算鼠标指针在空容器上的方向（如果在指针在空容器边缘15px，不算拖拽在中间）
								var emptyGridDir = _calcEmptyGridAndContainerDir($targetComp, x, y);

								dir = emptyGridDir;
							}
						}

						// 判断是否移动到相邻组件旁边
						if((dir == 'top' || dir == 'left') && $targetComp.prev()[0] == _$currSelectComp[0]){
							if(_DEBUGGER)
							console.warn('移动后的位置无变化：', $targetComp);
							return false;
						}
						if((dir == 'bottom' || dir == 'right') && $targetComp.next()[0] == _$currSelectComp[0]){
							if(_DEBUGGER)
							console.warn('移动后的位置无变化：', $targetComp);
							return false;
						}


						if(dir == 'top' || dir == 'left'){
							// 获取鼠标下方的组件的父容器组件
							var $targetParentWidget = _utils.getElemContainerWidget($targetComp);
						    // 获取_$currSelectComp当前选中组件的父容器组件
						    var $currCompParentWidget = _utils.getElemContainerWidget(_$currSelectComp);

							// 判断最近的容器对象是否为grid网格，并且插入示意符是在某个组件左侧
							if(_utils.isGridWidget($targetParentWidget) && dir == 'left'){
								// 获取当前组件要插入的目标容器（#content_box）
								var $targetContainer = _utils.getElemContainer($targetComp);
								
								// 记录要插入的网格组件，和插入后网格容器索引（right右侧就是索引+1）
								newValues.insertToNewCell = {
							        targetGrid: $targetParentWidget,
							        targetContIdx: $targetContainer.index()
							    };
							}else{
								// 记录拖拽后，应当插入到哪个组件旁边
								/*newValues.insert = {
									type: 'before',
									target: $targetComp
								};*/
								// 如果是.pagebox容器
								if(_utils.isBaseBox($targetComp)){
									var $childs = $targetComp.children(_utils.elemSelector);
									if($childs[0]){
										$targetComp = $childs.eq(0);
										
										// 记录拖拽后，应当插入到哪个组件旁边
										newValues.insert = {
											type: 'before',
											target: $targetComp
										};
									}else{
										newValues.parent = $targetComp;
									}
								}else{
									// 记录拖拽后，应当插入到哪个组件旁边
									newValues.insert = {
										type: 'before',
										target: $targetComp
									};
								}
							}
						}else if(dir == 'bottom' || dir == 'right'){
							// 获取鼠标下方的组件的父容器组件
							var $targetParentWidget = _utils.getElemContainerWidget($targetComp);
						    // 获取_$currSelectComp当前选中组件的父容器组件
						    var $currCompParentWidget = _utils.getElemContainerWidget(_$currSelectComp);

							// 判断最近的容器对象是否为grid网格，并且插入示意符是在某个组件右侧
							if(_utils.isGridWidget($targetParentWidget) && dir == 'right'){
								// 获取当前组件要插入的目标容器（#content_box）
								var $targetContainer = _utils.getElemContainer($targetComp);

								// 记录要插入的网格组件，和插入后网格容器索引（right右侧就是索引+1）
								newValues.insertToNewCell = {
							        targetGrid: $targetParentWidget,
							        targetContIdx: $targetContainer.index()+1
							    };
							}else{
								// 记录拖拽后，应当插入到哪个组件旁边
								/*newValues.insert = {
									type: 'after',
									target: $targetComp
								};*/
								// 如果是.pagebox容器
								if(_utils.isBaseBox($targetComp)){
									var $childs = $targetComp.children(_utils.elemSelector);
									if($childs[0]){
										$targetComp = $childs.eq($childs.length-1);
										
										// 记录拖拽后，应当插入到哪个组件旁边
										newValues.insert = {
											type: 'after',
											target: $targetComp
										};
									}else{
										newValues.parent = $targetComp;
									}
								}else{
									// 记录拖拽后，应当插入到哪个组件旁边
									newValues.insert = {
										type: 'after',
										target: $targetComp
									};
								}
							}
						}else if(dir == 'middle'){
							// 如果目标组件是grid网格，或者container容器
							if(_utils.isGridWidget($targetComp)){
								// 插入到目标网格第一个cell里
								newValues.parent = $(_utils.getContainerInsideBox($targetComp)[0]);
							}else{
								newValues.parent = $targetComp;
							}
						}
					}else{
						if(_DEBUGGER)
						console.log('.........pagebox');

						// 计算鼠标指针在组件上距离最近的方向
						var dir = _calcOperateDir($targetComp, x, y);

						if(dir == 'left' || dir == 'top'){

						}else if(dir == 'bottom' || dir == 'right'){}

					}
				// }

		return {
			newValues: newValues
		};
	}

	// 初始化事件层鼠标相关事件处理
	function _initMouseEvent(){
		// 绑定操作框mousedown事件和双击事件
		_$compEditBox.on('mousedown', _mousedownEventHandle).on('mousemove', function(e){
			// 如果正在拖拽中，不执行后续操作
			if(_isDragging){
				return;
			}

			// 鼠标指针在操作按钮区时，阻止事件冒泡（避免拖拽时经过操作手柄事件不冒泡，卡顿现象）
			if($(e.target).closest('[data-operate]')[0]){
				e.stopPropagation();
			}
		});

		function initMouseMoveHandle(){
			$(document).off('mousemove', _mouseMove).on('mousemove', _mouseMove);
			$(document).off('mouseup', _mouseUp).on('mouseup', _mouseUp);

			function _mouseMove(e){
				operateAction[_originalCompData.operateType](e);

				// 如果不是拖拽操作
				if(_originalCompData.operateType != 'move'){
					// 回显样式信息到布局样式面板
					M.Panel.PropertySettings.changeTabItems();

					// 重置组件选框尺寸和位置
					_resetCompEditBoxSize();
				}
			}

			function _mouseUp(e){
				_isDragging = false;

				$(document).off('mousemove', _mouseMove);
				$(document).off('mouseup', _mouseUp);

				// 如果状态为false，不执行移动后的操作
				if(!_allowMove && _originalCompData.operateType == 'move'){
					return false;
				}

				// 记录不允许移动
				_allowMove = false;
				// 清除鼠标按下原始坐标点
				_originalMouseDownOffset = null;
				_$compEditBox.css({
					cursor: ''
				});

				$('#flowModeDraggingCursor').hide();

				// 隐藏拖拽示意层
				$('#editAreaFlowPlaceholder').hide();

				var newValues = {
					elemsCss: [_originalCompData.elemInfo]
				};

				// 移动才走此逻辑
				if(_originalCompData.operateType == 'move'){
					var cmdValues = _getCmdExecuteValues(e);
					if(!cmdValues){
						return false;
					}

					$.extend(true, newValues, cmdValues.newValues);
				}
				
				M.Cmd.EditCommand.action(_$currSelectComp, newValues);

				_$allWidgets = null;
			}

			var  operateAction = {
				left: function(e){
					action.left(e);
				},
				top: function(e){
					action.top(e);
				},
				bottom: function(e){
					action.bottom(e);
				},
				right: function(e){
					action.right(e);
				},
				topLeft: function(e){
					action.top(e);
					action.left(e);
				},
				bottomLeft: function(e){
					action.bottom(e);
					action.left(e);
				},
				bottomRight: function(e){
					action.bottom(e);
					action.right(e);
				},
				topRight: function(e){
					action.top(e);
					action.right(e);
				},
				move: function(e){
					var x = e.pageX;
					var y = e.pageY;

					// 鼠标拖拽移动10像素后才执行后续操作
					if(_allowMove){
						action.move(e);
					}else if(Math.abs(x - _originalMouseDownOffset.x) > _allowDraggingMoveOffset || Math.abs(y - _originalMouseDownOffset.y) > _allowDraggingMoveOffset){
						_allowMove = true;
						action.move(e);
					}
				}
			};
		}

		var action = {
			left: function(e){
				actionLeftRight(e);
			},
			top: function(e){
				// 坐标移动相对数值（往上移：负值，往下移：正值）
				var relativeY = e.pageY - _originalCompData.pageY;

				// 当前组件的父容器对象
				var $parentContainer = _utils.getElemContainer(_$currSelectComp);

				// 计算后的组件上边距 =（组件原上边距-偏移后的相对坐标）
				var compMarginTop = _originalCompData.m.t + relativeY;
				
				// 设置选中组件的上边距
				_$currSelectComp.css({
					marginTop: compMarginTop,
					height: '',	// 重置height属性
					minHeight: _originalCompData.h - relativeY
				});

				_originalCompData.elemInfo.css.marginTop = _$currSelectComp.css('marginTop');
				_originalCompData.elemInfo.css.minHeight = _$currSelectComp.css('minHeight');
			},
			right: function(e){
				actionLeftRight(e, true);
			},
			bottom: function(e){
				// 坐标移动相对数值（往上移：负值，往下移：正值）
				var relativeY = e.pageY - _originalCompData.pageY;

				// 当前组件的父容器对象
				var $parentContainer = _utils.getElemContainer(_$currSelectComp);

				// 计算后的组件高度 =（组件原高度-偏移后的相对坐标）
				var compHeight = _originalCompData.h + relativeY;
				
				// 设置选中组件的宽度
				_$currSelectComp.css({
					height: '',	// 重置height属性
					minHeight: compHeight
				});

				_originalCompData.elemInfo.css.minHeight = _$currSelectComp.css('minHeight');
			},
			move: function(e){
				var x = e.pageX - $('#mainFrame').offset().left;
				var y = e.pageY - $('#mainFrame').offset().top;

				if(_allowMove){
					// 鼠标指针效果
					$('#flowModeDraggingCursor').offset({
						top: e.pageY + 20,
						left: e.pageX + 10
					}).show();
					// 设置鼠标经过操作框显示默认鼠标指针
					_$compEditBox.css({
						cursor: 'default'
					});
				}
				
				var targetComp = _getTargetComp({x:x, y:y});

				if(_DEBUGGER)
				console.log(targetComp);

				// 如果悬浮在组件上
				if(targetComp){
					// 悬浮在grid上时，计算鼠标是否悬浮在某个空容器上
					if(targetComp != _$currSelectComp[0] && _utils.isGridWidget($(targetComp))){
						// 计算指针在grid网格组件中哪一个空容器中
						var gridContainer = _calcPointOnGridContainer(targetComp, e);
						targetComp = gridContainer || targetComp;

					}

					var dir = "";
					// 如果悬浮在空容器中，设置方向为middle
					if(targetComp.id && _utils.isContainer(targetComp.id)){
						dir = "middle";
					}else{
						// 计算鼠标指针在组件上距离最近的方向
						dir = _calcOperateDir($(targetComp), x, y);
					}

					// console.log(dir);

					_showPlaceholder(_f$(targetComp), dir, x, y);

					if(_DEBUGGER)
					console.log('拖放后目标组件：', targetComp, dir);
				}else{
					if(_DEBUGGER)
					console.log('.........pagebox');
					// 计算鼠标指针在组件上距离最近的方向
					var dir = _calcOperateDir(_f$('.pagebox'), x, y);

					// console.log('距离pagebox最近方向：', dir);

					_showPlaceholder(_f$('.pagebox'), dir);

					if(_DEBUGGER)
					console.log('拖放后目标组件：.pagebox', targetComp, dir);
				}
			}
		};

		// 左右回调函数
		function actionLeftRight(e, isRight){
			// 坐标移动相对数值（往左移：负值，往右移：正值）
			var relativeX = e.pageX - _originalCompData.pageX;

			// 当前组件的父容器对象
			var $parentContainer = _utils.getElemContainer(_$currSelectComp);

			var multi = 1;
			// 获取未计算的css：marginLeft和marginRight属性值
			var margin = _utils.getCssProps(_$currSelectComp, 'marginLeft,marginRight', 'noComputed');
			// 如果margin-left和margin-right都是auto，调整一侧，设置双倍宽度
			if(_utils.isFixed(_$currSelectComp) || margin.marginLeft == 'auto' && margin.marginRight == 'auto'){
				multi = 2;
			}

			// 计算后的组件宽度 =（组件原宽度-偏移后的相对坐标*2，调整一侧，两侧都响应）
			var compWidth = _originalCompData.w - relativeX * multi;
			// 如果是右侧
			if(isRight){
				compWidth = _originalCompData.w + relativeX * multi;
			}
			
			// 设置选中组件的宽度
			_$currSelectComp.css({
				maxWidth: compWidth
			});

			_originalCompData.elemInfo.css.maxWidth = compWidth+'px';
		}

		function _mousedownEventHandle(e){
			var $operateBtn = $(e.target).closest('[data-operate]');

			// 点击操作按钮阻止事件冒泡
			if($operateBtn[0]){
				e.stopPropagation();
			}

			// 拖拽操作时隐藏示意框
			_resetTempCompEditBoxSize();

			// 如果指针点击的不是操作手柄不执行后续操作（操作框空白区域）
			if(!$operateBtn[0]){
				return;
			}

			// 不允许移动，
			_allowMove = false;

			// 正在拖拽过程中
			_isDragging = true;

			// 记录鼠标按下原始坐标点
			_originalMouseDownOffset = {
				x: e.pageX,
				y: e.pageY
			};

			// 获取页面中所有组件
			_$allWidgets = _getAllWidgets();

			_originalCompData = {
				operateType: $operateBtn.data('operate'),
				pageX: e.pageX,
				pageY: e.pageY,
				w: _$currSelectComp.width(),
				h: _$currSelectComp.height(),
				maxW: parseFloat(_$currSelectComp.css('maxWidth')),
				minH: parseFloat(_$currSelectComp.css('minHeight')),
				m: {
					t: parseFloat(_$currSelectComp.css('marginTop')),
					l: parseFloat(_$currSelectComp.css('marginLeft')),
					r: parseFloat(_$currSelectComp.css('marginRight')),
					b: parseFloat(_$currSelectComp.css('marginBottom'))
				},
				p: {
					t: parseFloat(_$currSelectComp.css('paddingTop')),
					l: parseFloat(_$currSelectComp.css('paddingLeft')),
					r: parseFloat(_$currSelectComp.css('paddingRight')),
					b: parseFloat(_$currSelectComp.css('paddingBottom'))
				},
				elemInfo: {
					elem: _$currSelectComp,
					css: {}
				}
			};

			// 初始化拖拽相关事件
			initMouseMoveHandle();
		}

		return {
			mousedown: _mousedownEventHandle,
			mousemove: initMouseMoveHandle,
			dragMove: action.move
		};
	}

	// 重置临时组件选框尺寸
	function _resetTempCompEditBoxSize($comp){
		// 目标不能是pagebox
		if($comp && !_utils.isBaseBox($comp) && $comp[0]){
			// 计算组件位置，设置组件选框坐标
			_$tempCompEditBox.css(M.Editor.Util.calculateElemsArea($comp)).show();
		}else{
			_$tempCompEditBox.hide();
		}
	}

	// 显示占位符
	function _showPlaceholder($target, dir, x, y){
		var $placeholder = $('#editAreaFlowPlaceholder');

		$placeholder.css({
			top: $target.offset().top,
			left: $target.offset().left,
			width: '9px',
			height: '9px'
		}).removeClass('show');

		if(dir == 'top'){
			var width = 0;
			var top = 0;
			var left = 0;

			// 如果鼠标停留下的组件是拖拽的组件，获取该组件相邻的组件位置
			if($target[0] == _$currSelectComp[0]){
				// 获取该组件上一个组件的位置
				if($target.prev()[0]){
					width = $target.prev().width();
					top = $target.prev().offset().top + $target.prev().height();
					left = $target.prev().offset().left;
				}else{	// 如果没有兄弟组件（prev），获取父容器组件或者.pagebox
					var $parentWidget = $target/*.parents(_utils.elemSelector)*/;
					// $parentWidget = $parentWidget[0] ? $parentWidget : $target.closest('.'+C.config.baseBox);

					// 父容器组件
					if($parentWidget[0]){
						width = $parentWidget.width();
						top = $parentWidget.offset().top/* + $parentWidget.height()*/;
						left = $parentWidget.offset().left;
					}else{	// .pagebox
						$parentWidget = $target.closest('.'+C.config.baseBox);
						width = $parentWidget.width();
						top = $parentWidget.offset().top;
						left = $parentWidget.offset().left;
					}
				}
				// width = $target.prev()
			}else{
				width = $target.width();
				top = $target.offset().top;
				left = $target.offset().left;
			}

			$placeholder.css({
				width: width,
				// top: $target.offset().top - 5/* + C.config.topMargin*/
				top: top - 5,
				left: left
			});
		}else if(dir == 'bottom'){
			var width = 0;
			var top = 0;
			var left = 0;

			// 如果鼠标停留下的组件是拖拽的组件，获取该组件相邻的组件位置
			if($target[0] == _$currSelectComp[0]){
				// 获取该组件上一个组件的位置
				if($target.next()[0]){
					width = $target.next().width();
					top = $target.next().offset().top;
					left = $target.next().offset().left;
				}else{	// 如果兄弟组件（next），获取父容器组件或者.pagebox
					var $parentWidget = $target/*.parents(_utils.elemSelector)*/;
					// $parentWidget = $parentWidget[0] ? $parentWidget : $target.closest('.'+C.config.baseBox);

					// 找到父容器组件
					if($parentWidget[0]){
						width = $parentWidget.width();
						top = $parentWidget.offset().top + $parentWidget.height();
						left = $parentWidget.offset().left;
					}else{	// 找到.pagebox
						$parentWidget = $target.closest('.'+C.config.baseBox);
						width = $parentWidget.width();
						top = $parentWidget.offset().top + $parentWidget.height();
						left = $parentWidget.offset().left
					}
				}
			}else{
				width = $target.width();
				top = $target.offset().top + $target.height();
				left = $target.offset().left;
			}

			$placeholder.css({
				width: width,
				top: top,
				left: left
			});
		}else if(dir == 'left'){
			$placeholder.css({
				height: $target.height(),
				left: $target.offset().left - 5
			});
		}else if(dir == 'right'){
			$placeholder.css({
				height: $target.height(),
				left: $target.offset().left + $target.width()
			});
		}else if(dir == 'middle'){	// 此middle只有从grid中空content-box中进来
			// 显示容器遮罩，返回false标识不允许显示遮罩层
			var result = fillPlaceholder($placeholder, $target, dir, x, y);
			if(result === false){
				return false;
			}
		}

		// 拖拽的组件和鼠标经过的组件不是同一个 && 鼠标经过的组件是“网格”和“容器” && 鼠标经过的容器组件中没有包含其他组件
		if($target[0] != _$currSelectComp[0] && _utils.isContainerWidget($target) && !_utils.getContainerInsideElems($target)[0]){
			// 显示容器遮罩，返回false标识不允许显示遮罩层
			var result = fillPlaceholder($placeholder, $target, dir, x, y);
			if(result === false){
				return false;
			}
		}

		// 如果不允许显示占位符（示意符）返回false
		function fillPlaceholder($placeholder, $target, defaultDir, x, y){
			// 如果是grid和container组件
			if(_utils.isContainerWidget($target)){
				// 计算鼠标指针在空grid和空container上距离最近的方向
				var dir = _calcEmptyGridAndContainerDir($target, x, y);
				if(dir == 'middle'){
					defaultDir = dir;
				}
			}

			if(_DEBUGGER)
			console.warn(defaultDir, "fillPlaceholder");

			if(defaultDir == 'middle'){
				// 显示容器遮罩
				$placeholder.css({
					top: $target.offset().top,
					left: $target.offset().left,
					width: $target.width(),
					height: $target.height()
				}).addClass('show');
			}
		}

		$placeholder.show();
	}

	// 计算指针在grid网格组件中哪一个容器中
	function _calcPointOnGridContainer($grid, e){
		$grid = $($grid);

		// 如果grid中所有内容区都没有组件，不执行后续逻辑
		if(_utils.getContainerInsideElems($grid).length == 0){
			return $grid[0];
		}

		// var touchX = e.pageX;
		// var touchY = e.pageY - C.config.topMargin;

					var touchX = e.pageX - $('#mainFrame').offset().left;
					var touchY = e.pageY - $('#mainFrame').offset().top;

		// 获取grid网格中的没有内容的容器节点

		var $elems = _utils.getContainerInsideBox($grid).filter(function(){
			return _utils.getContainerInsideElems($(this)).length == 0;
		});

		var touchElem = [];

		// 遍历元素数据，计算点击到的元素对象
		$elems.each(function(i, elem){
			var rect = elem.getBoundingClientRect();
			var relativeRect = {
				left: rect.left/* - _$currSelectComp[0].getBoundingClientRect().left*/,
				right: rect.right/* - _$currSelectComp[0].getBoundingClientRect().left*/,
				top: rect.top/* - _$currSelectComp[0].getBoundingClientRect().top*/,
				bottom: rect.bottom/* - _$currSelectComp[0].getBoundingClientRect().top*/,
				width: rect.width,
				height: rect.height
			};

			// 判断鼠标指针是否在元素范围内
			if(touchX > relativeRect.left && touchX < relativeRect.right && touchY > relativeRect.top && touchY < relativeRect.bottom){
				// 跳过当前选中组件，如果拖拽的是容器组件，跳过此容器内的组件
				if(/*elem == _$currSelectComp[0] || */_$currSelectComp.has(elem)[0]){
					return;
				}

				touchElem.push(elem);
			}
		});

		if(_DEBUGGER)
		console.warn(touchElem);

		return touchElem[0];
	}

	// 计算鼠标指针在空grid和空container上距离最近的方向
	function _calcEmptyGridAndContainerDir($container, x, y){
		// y -= C.config.topMargin;
		// 获取组件4条边的
		var rect = $container[0].getBoundingClientRect();
		var dist = [rect.top, rect.right, rect.bottom, rect.left];

		var offsetPoint = 10;

		// 获取x坐标距离组件左右两侧的距离
		var horizontal = [Math.abs(x - rect.left), Math.abs(x - rect.right)];
		// 获取y坐标距离组件上下两侧的距离
		var vertical = [Math.abs(y - rect.top), Math.abs(y - rect.bottom)];

		// 记录水平和垂直方向最近的方向和距离数值
		var horizontalMinNum = -1;
		var verticalMinNum = -1;
		var horizontalDir = null;
		var verticalDir = null;

		// 水平距离最近的方向和距离
		if(horizontal[0] <= horizontal[1]){
			horizontalDir = 'left';
			horizontalMinNum = horizontal[0];
		}else{
			horizontalDir = 'right';
			horizontalMinNum = horizontal[1];
		}
		// 垂直距离最近的方向和距离
		if(vertical[0] <= vertical[1]){
			verticalDir = 'top';
			verticalMinNum = vertical[0];
		}else{
			verticalDir = 'bottom';
			verticalMinNum = vertical[1];
		}

		// 比较水平和垂直哪个距离边缘更近
		var closestDir = null;
		var minNum = -1;

		if(horizontalMinNum <= verticalMinNum){
			closestDir = horizontalDir;
			minNum = horizontalMinNum;
		}else{
			closestDir = verticalDir;
			minNum = verticalMinNum;
		}

		// 如果距离边距大于10px，
		if(minNum > 15){
			closestDir = "middle";
		}

		if(_DEBUGGER)
		console.log('计算后的4个值：', horizontal[0], vertical[0], horizontal[1], vertical[1]);
		if(_DEBUGGER)
		console.log('最近的方向：', closestDir, '，最近的距离：', minNum);

		// var minNum = Math.min(rect.top, rect.right, rect.bottom, rect.left);
		// var dir = _getDir(rect, minNum);

		return closestDir;
	}


	// 计算鼠标指针在组件上距离最近的方向
	function _calcOperateDir($target, x, y){
		// y -= C.config.topMargin;
		// x = x - $('#mainFrame').offset().left;
		// y = y - $('#mainFrame').offset().top;

		// 获取组件4条边的
		var rect = $target[0].getBoundingClientRect();
		var dist = [rect.top, rect.right, rect.bottom, rect.left];

		// 获取x坐标距离组件左右两侧的距离
		var horizontal = [Math.abs(x - rect.left), Math.abs(x - rect.right)];
		// 获取y坐标距离组件上下两侧的距离
		var vertical = [Math.abs(y - rect.top), Math.abs(y - rect.bottom)];

		// 记录水平和垂直方向最近的方向和距离数值
		var horizontalMinNum = -1;
		var verticalMinNum = -1;
		var horizontalDir = null;
		var verticalDir = null;

		// 水平距离最近的方向和距离
		if(horizontal[0] <= horizontal[1]){
			horizontalDir = 'left';
			horizontalMinNum = horizontal[0];
		}else{
			horizontalDir = 'right';
			horizontalMinNum = horizontal[1];
		}
		// 垂直距离最近的方向和距离
		if(vertical[0] <= vertical[1]){
			verticalDir = 'top';
			verticalMinNum = vertical[0];
		}else{
			verticalDir = 'bottom';
			verticalMinNum = vertical[1];
		}

		// 比较水平和垂直哪个距离边缘更近
		var closestDir = null;
		var minNum = -1;

		if(horizontalMinNum <= verticalMinNum){
			closestDir = horizontalDir;
			minNum = horizontalMinNum;
		}else{
			closestDir = verticalDir;
			minNum = verticalMinNum;
		}

		if(_DEBUGGER)
		console.log('计算后的4个值：', horizontal[0], vertical[0], horizontal[1], vertical[1]);
		if(_DEBUGGER)
		console.log('最近的方向：', closestDir, '，最近的距离：', minNum);

		// var minNum = Math.min(rect.top, rect.right, rect.bottom, rect.left);
		// var dir = _getDir(rect, minNum);

		return closestDir;
	}

	function _getDir(rect, num){
		if(rect.left == num){
			return 'left';
		}else if(rect.top == num){
			return 'top';
		}else if(rect.bottom == num){
			return 'bottom';
		}else if(rect.right == num){
			return 'right';
		}
	}

	function _getTargetComp(pos){
		var touchX = pos.x;
		var touchY = pos.y;

		var touchElem = [];

		var $elems = _getAllWidgets();

		// 遍历元素数据，计算点击到的元素对象
		$elems.each(function(i, elem){
			var rect = elem.getBoundingClientRect();
			var relativeRect = {
				left: rect.left,
				right: rect.right,
				top: rect.top,
				bottom: rect.bottom,
				width: rect.width,
				height: rect.height
			};

			// 判断鼠标指针是否在元素范围内
			if(touchX > relativeRect.left && touchX < relativeRect.right && touchY > relativeRect.top && touchY < relativeRect.bottom){
				// 跳过当前选中组件，如果拖拽的是容器组件，跳过此容器内的组件
				// if(/*elem == _$currSelectComp[0] || */_$currSelectComp && _$currSelectComp.has(elem)[0]){
				// 	return;
				// }

				touchElem.push(elem);
			}
		});

		// console.log(touchElem);

		var touchElem2 = null;

		// 遍历点击的元素列表
		touchElem.forEach(function(elem){
			// 元素是否包含元素列表中的元素
			var result = false;
			// 遍历列表中元素的子元素是否包含列表中的元素（列表中元素的子元素是否包含在本列表中，不包含的话，表示点击的就是此元素）
			touchElem.forEach(function(elem2){
				if($(elem).has(elem2)[0]){
					result = true;
					return false;
				}
			});

			if(result == false){
				touchElem2 = elem;
			}
		});

		if(_DEBUGGER)
		console.log(touchElem2);

		return touchElem2 || M.Editor.getBaseBox();
	}

	// 获取页面中所有组件和设计元素
	function _getAllWidgets(){
		return _$allWidgets || _utils.getPageBoxInsideElems(M.Editor.getBaseBox());
	}

	function _getWidgetsByCoord(offset){
		// 获取页面所有组件和设计元素，不包含已删除的
		_utils.getContainerInsideElems(M.Editor.getBaseBox() ,false).each(function(i, item){
			var widgetOffset = $(item).offset();

			if(_DEBUGGER)
			console.log(item, widgetOffset);
		});
	}


	// 设置显示组件框
	function _setCompEditBox($widget){
		if($widget && $widget[0]){
			// 禁止选中pagebox
			if(_utils.isBaseBox($widget)){
				_$compEditBox.hide();
				_$currSelectComp = null;

				// 更改设置面板-选项卡
				//M.Panel.PropertySettings.changeTabItems();

				return false;
			}

			// 记录当前选中的组件
			_$currSelectComp = $widget;
			M.Editor.selectComp(_$currSelectComp);
			// 设置组件选中框的样式和工具
			_setCompEditBoxToolbar();

			// 更改设置面板-选项卡
			//M.Panel.PropertySettings.changeTabItems();
		}else{
			// 移除ckeditor，之所以调用remove，避免保存文字修改闪烁延迟的问题。
			M.Editor.RichEditor.remove();
			_$compEditBox && _$compEditBox.hide();
		}
	}

	function _getCurrentOperateComp(){
		return _$currSelectCompReal;
	}

	// 重置组件选框尺寸
	function _resetCompEditBoxSize(){
		if(_$currSelectComp){
			// 计算组件位置，设置组件选框坐标
			_$compEditBox.css(_utils.calculateElemsArea(_$currSelectComp)).show();
		}
	}

	// 设置组件选中框的样式和工具
	function _setCompEditBoxToolbar(){
		// 重置组件选框尺寸
		_resetCompEditBoxSize();

		// 清空组件选中框边框颜色
		_$compEditBox.removeClass('components widgets container grid text cgHide isFixed ftmpl');
		// 隐藏组件选中框工具栏按钮

		// 设置组件编辑框颜色
		_$compEditBox.addClass(_getCompEditBoxColor(_$currSelectComp));

		// 判断内容组是否隐藏状态
		if(_utils.isContentGroup(_$currSelectComp) && !_utils.isContentGroupVisible(_$currSelectComp)){
			_$compEditBox.addClass('cgHide');
		}

		_$compEditBox.toggleClass('isFixed', _utils.isFixed(_$currSelectComp));	// 切换解除固定按钮

		// 给操作框注册双击事件
		_bindCompEditBoxDoubleClickHandle();
		
		// 文字元素双击打开编辑器
		if(_utils.isEditableWidget(_$currSelectComp) && _$currSelectComp.length===1){
			// 注册ckeditor编辑器
			M.Editor.RichEditor.create(_$compEditBox, _$currSelectComp);
		}else{
			// 移除ckeditor
			M.Editor.RichEditor.remove();
		}

		// 生成面包屑列表
		_fillBreadList();

		// 设置组件选中框按钮区最小宽
		_setToolbarOperationZoneMinWidth();
	}

	// 给操作框注册双击事件
	function _bindCompEditBoxDoubleClickHandle(){
		_$compEditBox.off('dblclick').on('dblclick', function(){
			// 打开组件设置面板
			if(_utils.isImgWidget(_$currSelectComp)){
				// 弹出选图image
				_showChooseImageDialog();
			}
		});
	}

	// 弹出选图image
	function _showChooseImageDialog(){
		M.Dialog.ChooseImage.open(function(path){
			// 设置图片路径
			M.Editor.Operation.setImageWidget(_$currSelectComp.attr('id'), path);
		});
	}

	// 设置组件选中框按钮区最小宽
	function _setToolbarOperationZoneMinWidth(){
		var breadWidth = _$compEditBox.find('.bread').width();

		// 先设置宽度过长，然后在设置成对应的宽度（避免宽度过短导致按钮样式被挤下去）
		var $operateBox = _$compEditBox.find('.operation').css('minWidth', '1000px');
		var operateBtnsWidth = $operateBox.find('.operate-btns').width();

		$operateBox.css('min-width', breadWidth + operateBtnsWidth);
	}

	// 通过组件或者组件id获取组件编辑框颜色
	function _getCompEditBoxColor(compId){
		var $comp = _f$(compId);

		if(_utils.isGridWidget($comp)){
			return 'grid';
		}else if(_utils.isEditableWidget($comp)){
			return 'text';
		}else if(_utils.isComponent($comp)){
			return 'components';
		}else if(_utils.isWidget($comp)){
			return 'widgets';
		}
	}

	// 通过组件id获取组件效果id
	function _getCompStyleId(compId){
		return 'test';
	}

	// 获取grid网格设置的列数
	function _getCompCellNums(id){
		return M.Cache.Page.getElemConfig(id).data.columnNums;
	}

	// 计算网格中最后一个有内容的单元格是否为行的第一个位置
	function _computeGridLastContentCellIsBegin($grid){
		// 获取grid中最后一个有内容的cell（单元格）位置（1开头，非索引）
		var lastNotEmptyCellLocation = _utils.getGridLastCell($grid);
		// 获取grid的列数
		var columnNum = _getCompCellNums($grid.attr('id'));

		// 如果cell数量大于列数 并且 cell数量在新行中为第一个位置
		if(lastNotEmptyCellLocation > columnNum && (lastNotEmptyCellLocation % columnNum == 1)){
			return true;
		}

		return false;
	}

	// 填充面包屑列表
	function _fillBreadList(){
		// 获取当前选中元素的父容器列表
		var $list = _utils.getElemContainerWidgets(_$currSelectComp);

		// 清空面包屑列表dom并重新生成
		var $bread = _$compEditBox.find('.bread').empty();

		// 添加顶级面包屑菜单
		var $li = $('<li data-operate="move">').addClass(_getCompEditBoxColor(_$currSelectComp));
		// 通过组件id获取组件效果id
		var styleId = _getCompStyleId(_$currSelectComp.attr('id'));
		$li.text(styleId);

		// 追加到面包屑列表中
		$bread.append($li);

		// 如果当前选中容器存在父容器中
		if($list.length > 0){
			// 创建二级面包屑列表并添加到面包屑dom中
			var $ul = $('<ul>');
			$bread.append($ul);

			// 遍历父容器列表,并追加到面包屑二级列表dom中
			$list.each(function(i, item){
				var $li = $('<li>').addClass(_getCompEditBoxColor($(item)));

				// 通过组件id获取组件效果id
				var styleId = _getCompStyleId(item.id);

				$li.text(styleId);
				$li.data('compId', item.id);
				$li.data('target', item);

				$ul.append($li);
			});
		}


		// 判断当前组件是否在页面顶部
		var breadHeight = $bread.children('li').height() + ($bread.children('ul').height() || 0);
		var editBoxTop = _$compEditBox.offset().top - $(window).scrollTop() - $('#mainFrame').offset().top;
		if(_DEBUGGER)
		console.log('组件操作框距离顶部距离：', editBoxTop - breadHeight);

		// 设置操作框的工具条是否超出页面顶部
		if(editBoxTop - breadHeight < 0){
			_$compEditBox.toggleClass('bottom', true);
		}else{
			_$compEditBox.toggleClass('bottom', false);

			// 翻转面包屑列表项（否则显示顺序错误）
			var $items = $bread.find('>ul>li');
			for(var i = 0; i < $items.length; i++){
				$items.eq($items.length - 1 - i).appendTo($bread.children('ul'));
			}
		}
	}

	// 获取选中组件父级容器
	function _getParentsContainerList(){
		return _$currSelectComp.parents(_utils.elemSelector);
	}

	// 通过坐标获取组件插入位置（废弃方法）
	function _getInsertCompLocation_discard(x, y){
		// 容错处理，创建空div
		_$currSelectComp = _f$('<div class="flowTemp">');
		return _getCmdExecuteValues2({pageX: x, pageY: y}).newValues;
	}

	// 通过坐标获取组件插入位置
	function _getInsertCompLocation(){
		if(_$currSelectComp){
			return {
				insert: {
					type: 'after',
					target: _$currSelectComp
				}
			};
		}else{
			return {
				parent: M.Editor.getBaseBox()
			};
		}
	}

	// 编辑文本内容
	function _editContent(){
		M.Editor.RichEditor.active();
	}

	// 显示选框拖拽手柄
	function _showDragHandle(){
		_$compEditBox && _$compEditBox.removeClass('editing');
		
	}
	// 隐藏选框拖拽手柄
	function _hideDragHandle(){
		// 如果文本编辑状态下，隐藏选中框拖拽手柄
		_$compEditBox && _$compEditBox.addClass('editing');
	}

	return {
		init: _init,

		// 设置显示组件框
		setCompEditBox: _setCompEditBox,

		hide: function(){
			_setCompEditBox();
		},

		// 当前操作组件
		getCurrentOperateComp: _getCurrentOperateComp,

		mouseMoveHandle: function(e){
			// 记录宽高
			_originalCompData = {
				operateType: 'move'
			};

			// 给当前选中的组件变量赋值，避免为空，后面逻辑报错
			_$currSelectComp = _f$('<div class="flowTemp">');
			__mouseHandle.mousemove.call(null, e);
		},
		readyMove: function(){
			_$allWidgets = _getAllWidgets();
		},
		// 通过event获取鼠标指针显示占位符
		showPlaceholder: function(e){
			// 容错处理，创建空div
			_$currSelectComp = _f$('<div class="flowTemp">');
			__mouseHandle.dragMove(e);
		},
		// 隐藏占位符
		endMove: function(){
			$('#editAreaFlowPlaceholder').hide();

			_$allWidgets = null;
		},
		// 通过坐标获取组件插入位置
		getInsertCompLocation: _getInsertCompLocation,
		// 重置组件选框尺寸和位置
		resize: _resetCompEditBoxSize,
		isAllowDrop: function(x, y){
			return !!_getInsertCompLocation(x, y);
		},

		getCurrentComp: function(){
			return _$currSelectComp;
		},
		// 固定接口名，后台组件维护页面调用
		getSelectedElems: function(){
			return _$currSelectComp;
		},

		showDragHandle: _showDragHandle,
		hideDragHandle: _hideDragHandle,
		debug: function(debug){
			_DEBUGGER = debug;
		}
	};
}());