C.module('Topbar',function(){
	"use strict";

	function _init(){
		// 初始化画布尺寸设置按钮相关事件
		_initBreakpointsButtonsEventHandle();

		// 初始化垫底层的点击事件
		_initRebaseEventHandle();


		// 页面完成加载后，刚才前往列表中的选中项
		M.Editor.onPageLoad(function(props){
			// 初始化默认值
			$('#canvasBreakpoints .breakpoint-mobile').trigger('click');
		});
	}

	// 初始化垫底层的点击事件
	function _initRebaseEventHandle(){
		$('#rebase').on('click', function(e){
			M.Editor.CompEditBox.setCompEditBox(M.Editor.getBaseBox());
			console.log('点击rebase');
		});
	}
	
	// 初始化画布尺寸设置按钮相关事件
	function _initBreakpointsButtonsEventHandle(){
		$('#canvasBreakpoints .top_bar_breakpoints').on('click', function(){
			var val = $(this).data('value');

			// 更改画布尺寸
			M.Editor.changeEditAreaWidth(val);

			// css断点工具条，添加标识class
			$('#canvasBreakpoints').removeClass()
									.addClass($(this).data('title'))
									.attr('data-value', val);
		});
	}


	function _getBreakpoint(){
		return $('#canvasBreakpoints').attr('data-value');
	}

	return {
		init: _init,

		getBreakpoint: _getBreakpoint
	};
}());