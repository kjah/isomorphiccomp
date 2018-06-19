C.module('Editor',function(){
	"use strict";
	var pcBtn,pdBtn,mbBtn,mArea,mFrame,eventLayer,editLayer,topbar,editUtil,
		scrollTopRecord,scrollLeftRecord,siteDomainName,siteInfoLoaded,baseBoxSltr='.'+C.config.baseBox,pageLoadTips;
	var siteInfo={},
		siteInfoLoadedCAL=C.Callbacks(),
		windowResizeCAL=C.Callbacks(),
		pageLoadedCAL=C.Callbacks();
	var pageData;
	var fwin,f$,pageId,tmplId;
	var URL_getPageData='/designer/api/page/getPageData';


	var keepEditLayerSzie=function(){
		var intervalHandle=0;
		return function(){
			clearInterval(intervalHandle);
			intervalHandle=setInterval(function(){
				_editLayerResize();
			},300);
			return intervalHandle;
		};
	}();
	/**
	 * 初始化方法
	 * @return {[type]} [description]
	 */
	function _init(){
		//设置主域
		//setDomain();
		//初始化变量
		initVariable();
		//初始化事件
		initEvent();
		//加载用户信息
		// loadCurrentUserInfo()
		// .then(loadGlobeConfig)
		// .then(loadHomePage);
		editUtil=M.Editor.Util;
		var urlParams=C.Util.getAllUrlParam(window.location.href),url;
		if(urlParams.fileName){
			url=editUtil.getPageFromUrl('/'+urlParams.fileName+'.html');
		}else{
			url='/index.html';
		}
		editorLoadPage(url);
	}

	/**
	 * 设置主域
	 */
	function setDomain(){
		try{
			var domainArr=window.location.hostname.split(".");
			document.domain=domainArr[domainArr.length-2]+"."+domainArr[domainArr.length-1];
		}catch(e){console.error(e);}
	}

	/**
	 * 初始化变量
	 * @return {[type]} [description]
	 */
	function initVariable(){
		pcBtn=$('#pc');
		pdBtn=$('#pd');
		mbBtn=$('#mb');
		mArea=$('#mainArea');
		mFrame=$('#mainFrame');
        eventLayer=$('#eventLayer');
		editLayer=$('#editLayer');
		topbar=$('#topbar');
	}
	/**
	 * 初始化事件
	 * @return {[type]} [description]
	 */
	function initEvent(){
		$('#refreshBtn').on('click',_refreshComp);
		$('#compData').on('input',function(){
				pageData.data[$(this).attr("compid")]=JSON.parse(this.value);
				_refreshComp();
		});
		mainAreaInit();
	}
	/**
	 * 加载组件操作信息 **电商取消此功能**
	 * @return {[type]} [description]
	 */
	function loadComponentOperationInfo(){
		var dfd=$.Deferred();
		$.getJSON(URL_getCompPages)
		 .then(function(v){
		 	M.Cache.Resource.setCompContentOperationMap(v);
		 	dfd.resolve();
		 });
		return dfd.promise();
	}


	/**
		预加载全局配置级资源
	*/
	function loadGlobeConfig(){
		var dfd=$.Deferred();
		$.getJSON(URL_getGlobalConfig)
		 .then(function(data){
		 	if(data.success){
		 		M.Cache.Resource.setResourceCacheMap(data.message);
		 		M.Cache.Resource.setPanelConfigMap(data.message.panelConfig);
		 		dfd.resolve();
		 	}
		 });
		 return dfd.promise();
	}

	/**
	 * 初始化主编辑区
	 * @return {[type]} [description]
	 */
	function mainAreaInit(){
		
		$(document).on('mousewheel DOMMouseScroll',function(e){
			if(M.Editor.RichEditor.isEditing()){
				M.Editor.RichEditor.remove();
			}else{
				var content=mFrame.contents();
				
				var delta = (e.originalEvent.wheelDelta && (e.originalEvent.wheelDelta > 0 ? 1 : -1)) ||  // chrome & ie
                (e.originalEvent.detail && (e.originalEvent.detail > 0 ? -1 : 1));              // firefox
                var dist=delta>0?120:-120;
				var scrollTop=content.scrollTop()- dist ;
				if(e.originalEvent.detail)f$('html').scrollTop(scrollTop);
				content.scrollTop(scrollTop);
			}
		});
		
		$(window).on('resize',function(){
			if(f$){
				windowResizeCAL.fire({pageboxWidth:f$(baseBoxSltr).width()});
			}
		});

		mFrame.on('load',onPageLoad);
	}
	/**
	 * 页面加载时初始化
	 * @return {[type]} [description]
	 */
	function onPageLoad(){
		try{
			//初始化页面变量
			initPageVariable();
			//编辑层初始化
			initEditorLayer();
			//相关模块初始化
			initSubMoudles();
			//加载页面信息
			loadPageInfo().then(function(data){
				pageLoadedCAL.fire({
					pageWindow:fwin,
					pageId:pageId
				});				
			});
			pageLoadedCAL.fire({
					pageWindow:fwin,
					pageId:pageId
			});
			pageLoadTips.hidePopuptips();
		}catch(e){
			//去遮罩 提示异常
			pageLoadTips.hidePopuptips();
			$.popuptips({
				  text: "页面加载异常",
				  icon: "error",
				  delay: 2000,
				  mask:true
			});
			console.error(e);
		}

	}
	/**
	 * 初始化页面变量
	 * @return {[type]} [description]
	 */
	function initPageVariable(){
		fwin=mFrame[0].contentWindow;
		f$=fwin.jQuery;
		f$.fn.$=f$;
		pageId=f$('body').data('pageid');
		tmplId=f$('body').data('tmplid');
	}
	/**
	 * 初始化子模块
	 * @return {[type]} [description]
	 */
	function initSubMoudles(){
		M.Editor.Operation.init({fwin:fwin,f$:f$,mFrame:mFrame,pageId:pageId});
	}
	/**
	 * 注入制作期样式
	 * @return {[type]} [description]
	 */
	function injectMakingStyle(){
		_injectCss('http://'+window.location.hostname+'/css/empty_editing.css');
	}

	/**
	 * 加载页面信息，并进行缓存处理
	 * @return {[type]} [description]
	 */
	function loadPageInfo(){
		var dfd=$.Deferred();
		$.getJSON(URL_getPageData,{page:pageId})
		 .then(function(d){
		 	pageData=d;
		 	dfd.resolve();
		});
		return dfd.promise();
	}

	/**
	 * 页面加载后,编辑层初始化
	 * @return {[type]} [description]
	 */
	function initEditorLayer(){
        mFrame.contents().on('scroll',function(e){
            var content=mFrame.contents();
            var sTop=content.scrollTop();
            var sLeft=content.scrollLeft();
            var top=-sTop;
            var left=-sLeft;
            eventLayer.css({'top':top,'left':left});
        });
        keepEditLayerSzie();
        f$(mFrame[0].contentWindow).on('unload',function(){
			clearInterval(keepEditLayerSzie());
        });
	}

	/**
	 * 加载页面逻辑 提示等
	 * @param  {[type]} url [description]
	 * @return {[type]}     [description]
	 */
	function editorLoadPage(url){
		if(pageLoadTips)pageLoadTips.hidePopuptips();
		pageLoadTips=$.popuptips({
				  text: "页面加载中...",
				  icon: "loading",
				  delay: -1,
				  mask:true
			});
		mFrame[0].contentWindow.location.replace(url);
	}

	
	/**
	 * 页面大小改变时
	 * @return {[type]} [description]
	 */
	function _editLayerResize(){
        var h=mFrame.contents().height(),
            w=mFrame.contents().width();
        if(mFrame.height()>=h){
           editLayer.css('width','100%');
        }else{
            editLayer.css('width','calc(100% - 17px)');
        }
        if(mFrame.width()>=w){
             editLayer.css('height','100%');
        }else{
             editLayer.css('height','calc(100% - 17px)');
        }
        eventLayer.css({
            'height':h,
            'width':w
        });        
    }

    

    /**
	 * 根据页面坐标计算frame内页面坐标
	 * @param  {[type]} pos {pageX,pageY}
	 * @return {[type]}     {x,y}
	 */
	function converToPagePos(pos){
		var fdoc=mFrame[0].contentWindow.document,
			fpos=mFrame.offset(),
			scrollTop=Math.max(fdoc.documentElement.scrollTop,fdoc.body.scrollTop),
			scrollLeft=Math.max(fdoc.documentElement.scrollLeft,fdoc.body.scrollLeft);
		return {
			x:pos.pageX+scrollLeft-fpos.left,
			y:pos.pageY+scrollTop-fpos.top
		};
	}
	/**
	 * 页面加载事件注册
	 * @param  {Function} fn [description]
	 * @return {[type]}      [description]
	 */
	function _onPageLoad(fn){
		pageLoadedCAL.push(fn);
	}
	/**
	 * 改变编辑区宽度
	 * @param  {[type]} width [description]
	 * @return {[type]}       [description]
	 */
	function _changeEditAreaWidth(width){
		mArea.css('width',width);
		window.ND_viewportWidth=width=='480px'?'768px':width;
		_refreshAllGrid();
		_editLayerResize();
		M.Editor.CompEditBox.resize();
	}
	function _refreshAllGrid(){
		f$('div[id^="w_grid"]').each(function(){
			M.Editor.Operation.refreshGrid(f$(this));
		});
		M.Editor.Operation.allContentBoxEmptyTag();
	}
	function _refreshComp(){
		var comp=M.Editor.CompEditBox.getSelectedElems();
		if(!comp)return;
		var compId=comp.attr('id');
		comp.html(ejs.render(pageData.tmpls[compId],pageData.data));
	}
	return {
		init:_init,
		onPageLoad:_onPageLoad,
		changeEditAreaWidth:_changeEditAreaWidth,
		onResize:function(fn){
			windowResizeCAL.push(fn);
		},
		getBaseBox:function(){
			return f$(baseBoxSltr);
		},
		getSiteDomain:function(){
			return siteDomainName;
		},
		refreshComp:_refreshComp,
		getPageData:function(){return pageData;},
		selectComp:function(comp){
			$('#compData').val(JSON.stringify(pageData.data[comp.attr('id')],null,2)).attr('compid',comp.attr('id'));			
		}
	};
}());