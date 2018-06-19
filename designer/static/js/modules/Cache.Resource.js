C.module('Cache.Resource',function(){
	var widgetTmplMap={},//设计元素模板缓存，由于会有不同dom模板，以效果为key，添加信息时机：添加设计元素 页面载入
						 //用于设计元素刷新相关功能 临时效果
		widgetEffectConfigMap={},//设计元素网站效果配置信息
		resourceCacheMap={};//其他资源缓存
		compContentOperationMap={};
		panelConfigMap={};
	/**
		获取没有被缓存的设计元素模板
	*/
	function _getNCWidgetTmplList(widgets){
		var result=[];
		for(var wId in widgets){
			var styleId=widgets[wId].prop.styleId;
			if(!widgetTmplMap[styleId])result.push(styleId);
		}
		return result;
	}
	return {
		setWidgetTmplMap:function(v){widgetTmplMap=v;},
		setWidgetEffectConfigMap:function(v){widgetEffectConfigMap=v;},
		setHtmlelemEffectConfigMap:function(v){htmlelemEffectConfigMap=v;},
		getWidgetTmplMap:function(){return widgetTmplMap;},
		getWidgetEffectConfigMap:function(){return widgetEffectConfigMap;},
		setResourceCacheMap:function(v){resourceCacheMap=v;},
		getResourceCacheMap:function(){return resourceCacheMap;},
		setCompContentOperationMap:function(v){compContentOperationMap=v;},
		getCompContentOperationMap:function(){return compContentOperationMap;},
		setPanelConfigMap:function(v){panelConfigMap=v;},
		getPanelConfigMap:function(){return panelConfigMap},
		getNCWidgetTmplList:_getNCWidgetTmplList,
		clearAll:function(){
			widgetTmplMap={};
			widgetEffectConfigMap={};
			resourceCacheMap={};
		}
	};
}());