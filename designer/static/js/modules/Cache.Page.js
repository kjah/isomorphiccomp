C.module('Cache.Page',function(){
	/*按组件实例存储 组件请求所需参数 用于组件刷新方法*/
	var widgetConfigMap={},compConfigMap={},urlParams={},compParamMap={};
	function _init(){
		widgetConfigMap={};
		compConfigMap={};
		urlParam={};
		compParamMap={};
	}
	return {
		init:_init,
		setWidgetConfigMap:function(v){widgetConfigMap=v;},
		getWidgetConfigMap:function(){return widgetConfigMap;},
		setCompConfigMap:function(v){compConfigMap=v;},
		getCompConfigMap:function(){return compConfigMap;},
		getConfigMap:function(id){
			if(M.Editor.Util.isWidget(id)){
				return widgetConfigMap;
			}else{
				return compConfigMap;
			}
		},
		getElemConfig:function(id){
			if(M.Editor.Util.isWidget(id)){
				return widgetConfigMap[id];
			}else{
				return compConfigMap[id];
			}
		},
		setUrlParams:function(v){urlParams=v;},
		addCompDataParam:function(compId,v){compParamMap[compId]=typeof(v)=='string'?C.Util.getAllUrlParam('?'+v):v;},
		getCompDataParams:function(compId){//获取组件请求所需要的参数，页面url参数覆盖组件请求所需参数
			var result=$.extend({},urlParams);
			if(compParamMap[compId]){
				result=$.extend({},compParamMap[compId],urlParams);
			}
			return result;
		},
		clearAll:_init
	};
}());