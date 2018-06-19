/**
 * @fileoverview 编辑器操作模块
 * 依赖 M.Editor模块
 * @author liuchen@300.cn 
 */

C.module('Editor.Operation',function(){
	var fwin,f$,mFrame,editBox,editUtil,baseBoxSltr='.'+C.config.baseBox,pageId,containerMap=null;
	var URL_savePage='/page/savePage';
	var URL_changeCompStyle='/comp/changeCompStyle';
	var URL_getCompInLib='/comp/getCompInLib?styleId=';

	var _savePageBuffer=C.Util.asyncBufferFactory(savePage);
	var _componentSettingBuffer=C.Util.asyncBufferFactory(_componentSetting);
	function _init(params){
		fwin=params.fwin;
		f$=params.f$;
		mFrame=params.mFrame;
		pageId=params.pageId;
		editUtil=M.Editor.Util;
		editBox=M.Editor.CompEditBox;
	}

	/**
	 * 获取内容组信息
	 * @return {[type]} [description]
	 */
	function _getContentGroupsInfo(){
		var cgs=editUtil.getContentGroups(f$(baseBoxSltr));
		var result=[];
		cgs.each(function(i){
			var elem=cgs.eq(i),id=elem.attr('id');
			var elemCfg=M.Cache.Page.getElemConfig(id);
			result.push({
				name:elemCfg.prop.ND_contentGroup.cName,
				id:id,
				visible:editUtil.isContentGroupVisible(elem)
			});
		});
		return result;
	}
	/**
	 * 设置内容组可见性
	 * @param {[type]} id      [description]
	 * @param {[type]} visible [description]
	 */
	function _setContentGroupsVisible(id,visible){
		f$('#'+id).attr('data-cg-visible',visible);
		_savePageBuffer();
	}

	/**
		保存页面
	*/
	function savePage(){
		var dfd=$.Deferred();
		M.Editor.Operation.allContentBoxEmptyTag();
		//组织提交数据
		var submitData={
			page:{
				name:pageId,
				structure:getAllCompSaveInfo()
			}
		};
		
		$.ajax({
			url:URL_savePage,
			type:"POST",
			dataType:'json',
			contentType:'application/json;charset=UTF-8',
			data:JSON.stringify(submitData)
		}).done(function(data){
			if(!data||data.success===false){
				dfd.reject();
				console.error('save status:'+data.message||data);
			}else{
				
				dfd.resolve(data);
				console.log('save status:'+data.message);
			}
		});
		return dfd.promise();
	}
	/**
	 * 获取页面保存时所有组件信息
	 * @return {[type]} [description]
	 */
	function getAllCompSaveInfo(){
		var result=[],elems=editUtil.getPageBoxInsideElems(f$(baseBoxSltr));
		elems.each(function(i){
			var elem=elems.eq(i);
			var elemData={},pId=elem.parent().attr('id'),pNode=pId?'#'+pId:baseBoxSltr,
				elemId=elem.attr('id'),
				config=M.Cache.Page.getElemConfig(elemId),
				isWidget=editUtil.isWidget(elem),
				styleId=editUtil.isEditableWidget(elemId)?'reset_style':config.prop.styleId;//文字元素类外框class为reset_style
				
			//fixed定位处理	
			if(editUtil.isFixed(elem)){
				posCss=editUtil.getCssProps(elem,'position,top,left,bottom,right,transform,width,height,z-index,content');
				//根据设定的位置 转成百分比值
				$.extend(posCss,editUtil.getFixedPercent(editUtil.getFixedPos(posCss)));
				posCss['-webkit-transform']=posCss.transform;
				elem.css(posCss);
			//流式位置信息
			}else{
				posCss=editUtil.getCssProps(elem,
					'width,max-width,min-width,height,max-height,min-height,margin-top,margin-left,margin-right,margin-bottom,'+
					'padding-top,padding-left,padding-right,padding-bottom',
					'noComputed'
				);
			}

			elemData={
				id:elemId,
				parentNode:pNode,
				positionCss:editUtil.getCssStrFromCssObj(posCss),
				styleId:styleId
			};
			//内容组标识
			if(editUtil.isContentGroup(elem)){
				elemData.attributes='data-cg-visible:'+editUtil.isContentGroupVisible(elem);
			}
			//获取设计元素 html结构
			if(isWidget){
				if(editUtil.isContainerWidget(elem)){
					elemData.widgetHtml=editUtil.getContainerWidgetHtml(elem,f$);
				}else{
					elemData.widgetHtml=elem.html();
				}
				if(config){
					elemData.config=config;
				}
			}			
			result.push(elemData);
		});
		return result;
	}

	/**
	 * 重新加载页面级css
	 * @return {[type]} [description]
	 */
	function _reloadPageLevelCss(){
		var elem=f$('head>style[id^="ND_page_"]');
		_loadCss(elem.attr('id').replace('ND_',''));
	}

	/**
	 * 重新加载所有css
	 * @return {[type]} [description]
	 */
	function _reloadAllCss(){
		f$('head>style[id^="ND"]').each(function(){
			_loadCss(this.id.replace('ND_',''));
		});
	}

	/**
	 * 加载css
	 * @param  {string} id      style id
	 * @return {dfd}         延迟对象
	 */
	function _loadCss(id){
		var dfd=$.Deferred();
		f$.get('/css/'+id+'.css?t='+new Date().getTime())
		  .then(function(cssStr){
		  		var styleElem=$('style#ND_'+id);
		  		if(styleElem.length===0){
		  			styleElem=f$('<style type="text/css" id="ND_'+id+'"></style>').appendTo('head');
		  		}
		  		styleElem.text(cssStr);
				dfd.resolve({id:id,css:cssStr});
			}
		);
		return dfd.promise();
	}

	/**
		刷新组件 取页面url中参数代入请求 URL中参数+扩展参数 扩展参数不会覆盖url参数
		compId 组件实例名
		param  扩展参数
	*/
	function _refreshComp(compId,param){
		var dfd=$.Deferred(),compUrl=editUtil.getCompUrl(compId),
			urlParam=$.extend({'ND_RefreshComp':true,'ND_pageId':pageId},M.Cache.Page.getCompDataParams(compId),param);
		f$.post(compUrl,urlParam).then(function(d){
			f$('#'+compId).html(d).trigger('ND_RefreshComp');
			dfd.resolve(d);
		}).fail(function(xhr){
			console.error('刷新组件失败:'+compId+' http status:'+xhr.status);
		});
		return dfd.promise();
	}
	/**
		临时改变样式
		参数 config 为控件配置格式
		id 实例id
	*/
	function _setTempStyle(config,id){
		var css,cssValue=$.extend(true,[],config.elemsCss),
			widgetTmpl,
			elem=f$('#'+id);
		//设计元素逻辑
		if(editUtil.isWidget(id)){

		}else{
			//组件效果修改
			elem.attr('class',config.prop.styleId);
			var i18nMap=config.i18n;
			//即时效果刷新 传入组件特殊参数 ND_TempShow
			config.prop.ND_TempShow=true;
			if(config.refresh){//刷新组件
				_refreshComp(id,config.prop)
				.then(function(){
					i18nMender(i18nMap);
					if(editUtil.isFlowPageLayout()){
						M.Editor.CompEditBoxFlow.resize();
					}
				});
			}else{//不刷新组件
				//应用词条
				i18nMender(i18nMap);
				//显示隐藏项
				showHideItems(config.showItems);
				//元素效果修改
				editUtil.elemEffectModifier(elem,config.elemList);
			}
		}
		//词条修改
		function i18nMender(i18n){
			for(var key in i18n){
				elem.find('.i_'+key).html(i18n[key]);
			}
		}
		//显示隐藏项
		function showHideItems(items){
			for(var item in items){
				var itemNode=elem.find('.p_'+item);
				if(items[item]){
					itemNode.removeClass('item_hide');
				}else{
					itemNode.addClass('item_hide');
				}
			}
		}

		//创建临时显示的效果和元素效果
		_addSiteLevelStyleToPage(config,id);


		styleClearer.clear('^#'+id+'.+');
		M.Editor.CompEditBox.resize();

	}
	/**
	 * 设置文本类型设计元素文本内容
	 * @param {String} id   设计元素id
	 * @param {String} text 文本内容
	 */
	function _setTextWidget(id,text){
		var elem =f$('#'+id);
		var widgetConfig=M.Cache.Page.getElemConfig(id);
		var type=editUtil.getTypeName(id).replace(/^w_/,'');
		widgetConfig.data[type]=text;
		_refreshWidget(elem);
		M.Editor.CompEditBox.resize();
		_savePageBuffer();
	}

	/**
	 * 设置图片设计元素src
	 * @param {[type]} id  [description]
	 * @param {[type]} src [description]
	 */
	function _setImageWidget(id,src){
		var elem =f$('#'+id);
		var widgetConfig=M.Cache.Page.getElemConfig(id);
		var elemId=elem.attr('id');
		var imgUrl='http://';
		if(M.Topbar.getBreakpoint()==='768px'){
			widgetConfig.data.small_img_path=src;
		}else{
			widgetConfig.data.img_path=src;
		}
		_refreshWidget(elem);
		if(/^https?:/.test(src)){
			imgUrl=src;
		}else{
			imgUrl+=M.Editor.getSiteDomain()+src;
		}
		editUtil.getImgSize(imgUrl).then(function(){
			M.Editor.CompEditBox.resize();
		});
		_savePageBuffer();
	}
	/**
	 * 替换组件
	 * @param {string} styleId 替换组件id
	 * @return {[type]}         [description]
	 */
	function replaceComponent(styleId){
		var dfd=$.Deferred();
		var elem=M.Editor.CompEditBox.getCurrentComp();
		var id=elem.attr('id');
		var config=M.Cache.Page.getElemConfig(id);
		$.post(URL_getCompInLib+styleId).then(function(result){
			var config=result.message[0];
			//可视化编辑 是否需要临时参数
			//M.Cache.Page.addCompDataParam(config.compId,config.compReqParameter);
			//更新缓存信息
			M.Cache.Page.getCompConfigMap()[config.compId] =config.config;
			//加载css
			_loadCss(styleId);
			//修改id 修改class
			elem.attr('class',styleId).attr('id',config.compId);
			//刷新组件
			_refreshComp(config.compId).then(function(){
				dfd.resolve();
			});
			_savePageBuffer();
		},function(fail){
			console.error(fail);
			dfd.reject(fail);
		});
		return dfd.promise();
	}

	/**
	 * 修改组件效果
	 * @param  {String} styleId 效果id
	 * @return {[type]}         [description]
	 */
	function changeComponentEffect(styleId){
		var dfd=$.Deferred();
		var elem=M.Editor.CompEditBox.getCurrentComp();
		var id=elem.attr('id');
		var config=M.Cache.Page.getElemConfig(id);
		_loadCss(styleId);
		$.post(URL_changeCompStyle,{compId: id,styleId: styleId}).then(function(result){
			// config.prop.styleId=styleId;
			M.Cache.Page.getCompConfigMap()[id] = result.message[0].config;
			elem.attr('class',styleId);
			_refreshComp(id).then(function(){
				dfd.resolve();
			});
		},function(fail){
			console.error(fail);
			dfd.reject(fail);
		});
		return dfd.promise();
	}
	/**
		根据配置信息刷新设计元素
	*/
	function _refreshWidget(elem,config){
		var id=elem.attr('id');
		if(!config)config=M.Cache.Page.getElemConfig(id);
		var borderTmpl=M.Cache.Resource.getResourceCacheMap().borderTmpl;
		var widgetTmpl=M.Cache.Resource.getWidgetTmplMap()[config.prop.styleId];
		
		//容器类特殊处理，容器内容不受影响
		if(editUtil.isContainerWidget(elem)){//容器类
			var contentMap=_fillContainerContentMap(elem);//取出内部组件及所属容器id
			//组件移入临时div 保持组件在dom树上，避免脱离dom树，再加回来重复执行js问题
			var tempDiv=f$('<div>').hide().appendTo('body');
			//容器内组件移入临时dom区域
			for(var id in contentMap){
				tempDiv.append(contentMap[id]);
			}
			elem.empty();
			if(config.prop.borderEnable){//有装饰器
				elem.append($.tmpl(borderTmpl,config.prop).find('.stylebox_content').append($.tmpl(widgetTmpl,config.data)).end());
			}else{
				elem.append($.tmpl(widgetTmpl,config.data));
			}
			//容器从新生成后 恢复内容
			for(var id in contentMap){
				if(elem.find('#'+id).length!=0){
					elem.find('#'+id).append(contentMap[id]).removeClass('ND_empty');
				}else{
					//删除内部容器时 被删除容器内容移入最末容器
					editUtil.getContainerInsideBox(elem).last().append(contentMap[id]);
				}
			}
			editUtil.getVideoWidget(elem).each(function(idx){
				editUtil.videoWidgetAutoplay(f$(this));
			});
			tempDiv.remove();//删除临时区域
		}else{
			elem.empty();
			if(config.prop.borderEnable){//有装饰器
				elem.append($.tmpl(borderTmpl,config.prop).find('.stylebox_content').append($.tmpl(widgetTmpl,config.data)).end());
			}else{
				elem.append($.tmpl(widgetTmpl,config.data));
			}
		}
		if(!editUtil.isEditableWidget(elem)){
			elem.attr('class',config.prop.styleId);
		}
		//元素效果修改
		editUtil.elemEffectModifier(elem,config.elemList);
		editUtil.videoWidgetAutoplay(elem);
	}

	/**
	 * 刷新表格
	 * @param  {[type]} grid     [description]
	 * @param  {[type]} cellNums [description]
	 * @return {[type]}          [description]
	 */
	function _refreshGrid(grid,cellNums){
		if(!editUtil.isGridWidget(grid))return;
		cellNums=cellNums||0;
		var config=M.Cache.Page.getWidgetConfigMap()[grid.attr('id')];
		config.data.cellNums=Math.max(cellNums,editUtil.getGridLastCell(grid));
		_refreshWidget(grid,config);
	}
	/**
	 * 添加元素到流式布局
	 * @param {[type]} elem [description]
	 * @param {[type]} oper [description]
	 */
	function _addElemToFlowPage(elem,oper){
		if(oper.parent){
			elem.appendTo(oper.parent);
			_refreshGrid(editUtil.getElemContainerWidget(oper.parent));
		}
		if(oper.insert){
			oper.insert.target[oper.insert.type](elem);
		}
		if(oper.insertToNewCell){
			var moveObj=oper.insertToNewCell;
			var tGrid=moveObj.targetGrid,tIdx=moveObj.targetContIdx;
			var targetCell=editUtil.getContainerInsideBox(tGrid).eq(tIdx);
			targetCell.before('<div>');
			_rebuildContentBoxId(tGrid);
			if(editUtil.isGridWidget(tGrid)){
				_refreshGrid(tGrid,tIdx+1);
				elem.appendTo(editUtil.getContainerInsideBox(tGrid).eq(tIdx));
			}
		}
	}
	/**
	 * 空contentBox处理
	 * @return {[type]} [description]
	 */
	function _allContentBoxEmptyTag(){
		var baseBox=f$(baseBoxSltr);
		editUtil.getEmptyContentBox(baseBox).addClass('ND_empty');
		editUtil.getNoEmptyContentBox(baseBox).removeClass('ND_empty');
	}
	/**
	 * 流式内容组
	 * @param {[type]} args [description]
	 */
	function _addGroupFlow(args){
		var pos=args.pos,mDataAry=args.mDataAry,targetContainer=args.targetContainer,
			finishCount=0,baseBox=f$(baseBoxSltr),tempDiv=f$('<div>');
		var warperId,dfd=$.Deferred();
		mDataAry.forEach(function(mData){
			var sArgs={mData:mData,left:pos.left+mData.offset.left,top:pos.top+mData.offset.top,parent:tempDiv};
			if(editUtil.isWidget(mData.id)){//设计元素
				_addWidget(sArgs,false)
				 .then(function(nId,elem){
				 	if(editUtil.isContainerWidget(nId)){//容器修改数据中容器id
				 		//容器不在其他容器内记录为最外层容器
				 		if(!mData.containerId||mData.containerId=='none')warperId=nId;
				 		var iName=editUtil.getInstanceName(nId);
				 		mDataAry.forEach(function(v){
				 			if(v.containerWidgetId==mData.id){
				 				v.containerWidgetId=nId;
				 				v.containerId=v.containerId.replace(/-\d+/,'-'+iName);
				 			}
				 		});
				 	}
				 	_setPosition(elem,mData);
				});
			}else{//组件
				_addComponent(sArgs,false)
				 .then(function(elem){
				 	_setPosition(elem,mData);
				});
			}
		});
		return dfd.promise();
		function _setPosition(elem,mData){
			var elems=f$(),contElemData=mDataAry[0];
			mData.elem=elem;
			if(++finishCount===mDataAry.length){
				_addElemToFlowPage(contElemData.elem,M.Editor.CompEditBox.getInsertCompLocation(pos.left+contElemData.offset.left,pos.top+contElemData.offset.top));
				mDataAry.forEach(function(data){
					if(editUtil.isGridWidget(data.elem)){
						_refreshGrid(data.elem,data.config.data.cellNums);
					}
					if(data.containerWidgetId){
						f$('#'+data.containerWidgetId+' #'+data.containerId).append(data.elem);
					}else{
						if(pos.center){
							data.elem.appendTo(baseBox);
						}
						elems=elems.add(data.elem);
					}
					data.elem.css(data.posCss);
				});
				dfd.resolve(warperId);
			}
		}
	}
	/**
	 * 添加常用部件
	 * @param {[type]} args [description]
	 */
	function _addParts(args,type){
		var partUrl='/part/getPart?styleId=';
		var contentGroupUrl='/group/getContentGroup?styleId=';
		var cgroupNmaeUrl='/group/getContentGroupName?styleId=';
		var url=type==='contentGroup'?contentGroupUrl:partUrl;
		var dfd=$.Deferred();
		$.get(url+args.id)
		 .then(function(result){
		 		_addGroupFlow({mDataAry:result.message,pos:args.pos}).then(function(warperId){
		 			$.get(cgroupNmaeUrl+args.id).then(function(result){//查询中文名
		 				result=result.message;
		 				if(warperId){
			 				var elem=f$('#'+warperId);
			 				M.Cache.Page.getElemConfig(warperId).prop.ND_contentGroup={
			 					cName:result.name||'',
			 					id:args.id
			 				};
			 				elem.attr('data-cg-visible','true');
			 				editBox.setCompEditBox(elem);
			 			}
			 			dfd.resolve();
		 			});
		 		});
		 });
		 return dfd.promise();
	}

	function _addContentGroup(args){
		return _addParts(args,'contentGroup');
	}

	/**
		写入样式块
	*/
	function _setStyles(id,elemsCss,notOverwrite){
		//if(!elemsCss||elemsCss.length===0)return;
		if(!elemsCss||elemsCss.length===0)elemsCss='';
		var styleElem=f$('style#ND_'+id),
			css=typeof(elemsCss)=='string'?elemsCss:editUtil.elemsCssToCssString(elemsCss);
		if(styleElem.length===0){
			styleElem=f$('<style type="text/css" id="ND_'+id+'"></style>').appendTo('head');
			styleElem.text(css);
		}else{
			if(!notOverwrite){//覆盖
				styleElem.text(css);
			}
		}
	}
	/**
	 * 设计元素设置
	 * @param  {String} widgetId 设计元素id
	 * @param  {configObj} values 配置信息
	 */
	function _widgetSetting(widgetId,values){
		// var oConfigData=M.Cache.Page.getWidgetConfigMap()[widgetId],
			configData=values,
			styleId=values.prop.styleId,
			typeName=editUtil.getTypeName(widgetId),
			elem=f$('#'+widgetId);
			//复制样式属性，用于即时应用效果
			values=$.extend(true,{},values);
			values.configData=configData;
		var borderTmpl=M.Cache.Resource.getResourceCacheMap().borderTmpl;
		if(editUtil.isContainerWidget(widgetId)){
			//values.configData.data.__timestamp=oConfigData.data.__timestamp;
			if(containerMap){
				values.containerMap=_fillContainerContentMap(elem);
			}
		}
		M.Cmd.EditCommand.action(elem,values);
		styleClearer.clear('^#'+widgetId+'.+');
	}
	/**
	 * 组件设置
	 * @param  {String} compId  组件id
	 * @param  {configObj} values  组件配置信息
	 */
	function _componentSetting(compId,values){
		var submitData={compId:compId,config:values};
		var elem=f$('#'+compId),dfd=$.Deferred();
		submitData.pageId=pageId;
		$.ajax({
			url:'/comp/saveComp',
			type:"POST",
			dataType:'json',
			contentType:'application/json;charset=UTF-8',
			data:JSON.stringify(submitData)
		})
		.then(function(result){
		 	_refreshComp(compId);
		 	_setTempStyle(values,compId);
		 	dfd.resolve();
		 });
		return dfd.promise();
	}
	/**
		获取容器内对象
	*/
	function _fillContainerContentMap(elem){
		var containerContentMap={};
		var boxElems=editUtil.getContainerInsideBox(elem);
		boxElems.each(function(i){
			var elem=boxElems.eq(i);
			containerContentMap[elem.attr('id')]=elem.find('>div');
		});
		return containerContentMap;
	}
	/**
		添加组件到页面中
		config 组件配置
		args   位置参数
	*/
	function _addCompToPage(config,args){
		var dfd=$.Deferred(),elem=_createComponent(config);
		M.Cache.Page.addCompDataParam(config.compId,config.compReqParameter);
		if(args.parent){
	 		args.parent.append(elem);				 		
	 	}else{
	 		_addElemToPage(args.left,args.top,elem);
	 	}
		$.when(_loadEftLvCss(config.config.prop.styleId),_refreshComp(config.compId)).then(function(){
			if(args.mData&&args.mData.size){
				elem.css(args.mData.size);
			}
			dfd.resolve(elem);
		});
		return dfd.promise();
	}
	/**
		创建组件
	*/
	function _createComponent(compData){
		var compId=compData.compId;
		M.Cache.Page.getCompConfigMap()[compId]=compData.config;
		_addSiteLevelStyleToPage(compData,compId);
		var elem=f$('<div id="'+compId+'" class="'+compData.config.prop.styleId+'"></div>');
		return elem;
	}
	/**
		添加组件
	*/
	function _addComponent(args){
		var dfd=$.Deferred();
		var loading=$('<i class="al loading_animation"></i>')
			.css({top:args.top,left:args.left,position:'absolute'})
			.appendTo('#mainEvent');
		var url,submitData;
		if(args.mData){//带数据的为复制组件 不带数据为新建
			url='/comp/copyComp';
			submitData={
						compId: args.mData.id,
						config:args.mData.config,
						pageId:pageId
					};
		}else if(args.isPrivate){
			url='/comp/getCompInMyLib?styleId='+args.styleId;
		}else{
			url='/comp/getCompInLib?styleId='+args.styleId;
		}
		//请求服务端创建组件实例
		$.ajax({
					url:url,
					type:"POST",
					dataType:'json',
					contentType:'application/json;charset=UTF-8',
					data:JSON.stringify(submitData)
				})
		 .then(function(results){
		 	_addCompToPage(results.message[0],args)
		 	 .then(function(elem){
				dfd.resolve(elem);
				loading.remove();
				editBox.setCompEditBox(elem);
		 	 });

		 });
		return dfd.promise();
	}
	/**
		添加设计元素,没有mData时从服务器获取对应类型创建
	*/
	function _addWidget(args){
		var dfd=$.Deferred();
		if(args.mData){
			/*$.when(_cacheElemEffect(args.mData))
			.then(createAdd);*/
			createAdd(args.mData);
		}else{
			_addWidgetInfo(args.styleId).then(function(result){
				createAdd(result);
			});
		}
		function createAdd(result){
			var data=result;
			var timestamp=new Date().getTime(),widgetId=data.config.prop.styleId.split('-')[0]+'-'+timestamp;
			editUtil.elemsCssArrayElemReplace(data.config.elemsCss,/(\#\S+-)\d+/g,'$1'+timestamp);
			var elem=_createWidget(widgetId,data);
			_loadEftLvCss(data.config.prop.styleId)
			 .then(function(){
			 	if(args.parent){
			 		args.parent.append(elem);				 		
			 	}else{
			 		_addElemToPage(args.left,args.top,elem);
			 	}
				if(data.posCss){
					elem.css(data.posCss);
				}
				editBox.setCompEditBox(elem);
				dfd.resolve(widgetId,elem);
			 });
		}
		return dfd.promise();
	}
	/**
		生成设计元素
	*/
	function _createWidget(id,widgetData){
		var wd=widgetData,typeName,styleId;
		if(editUtil.isEditableWidget(id)){
			styleId='reset_style';
		}else{
			styleId=wd.config.prop.styleId;
			//css引入 效果css加载完后设置宽高
			if(!wd.id){//没有id为新建，有id为粘贴
				wd.styleCss=wd.css;
				//清除实例样式，记录控件实例级配置数据
				wd.css='';
				//过滤效果级 保留id及媒体查询
				wd.config.elemsCss=wd.config.elemsCss?wd.config.elemsCss.filter(function(v){
					var isMedia=v.elem.startsWith('@');//效果级中媒体查询保留媒体查询语句
					if(isMedia){
						v.css={'':''};//清空效果级媒体查询
					}
					return v.elem.startsWith('#')||isMedia;
				}):[];
			}
			_addSiteLevelStyleToPage(wd,id);
			//特殊变量，__id 实例名 __timestamp 时间戳
			if(wd.config.data.__id!=null){
				wd.config.data.__id=id;
			}
			if(wd.config.data.__timestamp!=null){
				wd.config.data.__timestamp=editUtil.getInstanceName(id);
			}
		}
		M.Cache.Page.getWidgetConfigMap()[id]=$.extend(true,{},wd.config);
		//生成dom并插入页面
		var elem=f$('<div id="'+id+'" class="'+styleId+'"></div>');
		elem.css({position:'static'});
		_refreshWidget(elem,wd.config);
		return elem;
	}

	/**
		页面中加入效果级样式，及元素样式
	*/
	function _addSiteLevelStyleToPage(widgetData,id){
		var wd=widgetData,
			configData=widgetData.config?widgetData.config:widgetData,
			styleId=widgetData.styleId||configData.prop.styleId,
			styleCss=widgetData.styleCss||configData.styleCss,
			iStyleCss=configData.elemsCss;
			if(styleCss&&styleCss.length){
				_setStyles(styleId,styleCss);
			}else{//如果没有效果级样式string 加载对应效果css
				_loadEftLvCss(styleId);
			}
			if(configData.prop.borderEnable&&configData.prop.borderStyle){
				_loadEftLvCss(configData.prop.borderStyle);
			}
			if(id||iStyleCss)_setStyles(id,iStyleCss);

	}
	function _addWidgetInfo(styleId){
		return $.get('/widget/getWidget?styleId='+styleId)
			 .then(function(result){
			 	//return _cacheElemEffect(result.message);
			 	var wd=result.message;
			 	M.Cache.Resource.getWidgetTmplMap()[wd.config.prop.styleId]=wd.tmpl;
			 	return wd;
			 });
	}
	/**
		加载效果级css
	*/
	function _loadEftLvCss(styleId){
		var dfd=$.Deferred();
		if(f$('style#ND_'+styleId).length===0){
			_loadCss(styleId)
			.then(function(result){
			 	dfd.resolve();
			});
		}else{
			dfd.resolve();
		}
		return dfd.promise();
	}
	/**
		添加组/控件到页面，主要包括容器和位置计算
	*/
	function _addElemToPage(x,y,elem){
		_addElemToFlowPage(elem,M.Editor.CompEditBox.getInsertCompLocation(x,y));
	}
	/**
		删除元件
	*/
	function _deleteElems(elems){
		if(!elems||editUtil.isBaseBox(elems))return;
		var val1={delete:true};
		M.Cmd.EditCommand.action(elems,val1);
	}
	/**
	 * [description]
	 * @return {[type]} [description]
	 */
	function openFixedDialog(){
		var elem=editBox.getSelectedElems();
		var posCss=editUtil.getCssProps(elem,'top,left,bottom,right,transform,content');
		if(editUtil.isFixed(elem)){
			M.Dialog.FixedBroswer.open(posCss);
		}else{
			M.Dialog.FixedBroswer.open();
		}
	}
	/**
	 * 取消固定
	 * 
	 */
	function _cancelFixed(){
			var elem=editBox.getSelectedElems(),pos=elem.offset(),
				baseBox=f$(baseBoxSltr),baseBoxPos=baseBox.offset(),
				cancelCss={
					transform:'none',
					position:'static'
				},
				val1={elemsCss:[{elem:elem,css:cancelCss}]};
			M.Cmd.EditCommand.action(elem,val1);
			_elemLocation(elem);
	}
	/**
		定位元素
	*/
	function _elemLocation(elemId){
			var elem=typeof(elemId)=='string'?f$('#'+elemId):elemId,pos,win=$(window);
			if(elem.length===0)return false;
			pos=elem.offset();			
			if(pos.top>win.scrollTop()&&pos.top+elem.height()<win.height()+win.scrollTop()){
				editBox.setCompEditBox(elem);
			}else{
				$('html,body').animate({scrollTop:pos.top-100},300);
				editBox.setCompEditBox(elem);
			}
			return true;
	}
	/**
	 * 设置固定
	 * @param {[type]} opt [description]
	 */
	function _setFixed(opt){
		var baseBox=f$(baseBoxSltr),
			maxZIdx=editUtil.getMaxZIndex(baseBox);
		if(opt){
			opt.position='fixed';
			opt['z-index']=maxZIdx+1;
			var elem=editBox.getSelectedElems(),
				val1={parent:baseBox,elemsCss:[{elem:elem,css:opt}]};
			M.Cmd.EditCommand.action(elem,val1);
			_elemLocation(elem);
		}else{
			_cancelFixed();
		}
	}

	/**
	 * 重排栅格id索引
	 * @param  {[type]} grid [description]
	 * @return {[type]}      [description]
	 */
	function _rebuildContentBoxId(grid){
		var idPrefix = 'content_box-'+editUtil.getInstanceName(grid.attr('id'));
		// 将网格容器id重新排序
		grid.find('>.w_grid>.e_box').children('div').each(function(i, contentBox){
			$(contentBox).attr('id', idPrefix+'-'+i);
		});
	}
	/**
	 * 保存设置
	 * @param  {[type]} elemId 组件或设计元素id
	 * @param  {[type]} values [description]
	 * @return {[type]}        [description]
	 */
	function _saveSetting(elemId,values){
		if(editUtil.isWidget(elemId)){
			_widgetSetting(elemId,values);
		}else{
			_componentSettingBuffer(elemId,values);
		}
	}
	
	//css对象操作 清除和恢复样式
	var styleClearer=function(){
		var styleKey,sheetObj,clearing=false,styleElem,tempPageClearStyleList=[],tempTmplClearStyleList=[];
		function getSheetObj(){
			var sheetList=fwin.document.styleSheets,result={};
			var page=f$('style[id^="ND_page_"]'),tmpl=f$('style[id^="ND_tmpl_"]');
			if(page.length)result.page=page[0].sheet;
			if(tmpl.length)result.tmpl=tmpl[0].sheet;
			return result;
		}
		return {
			//临时清除掉
			tempClear:function(id){
				sheetObj=getSheetObj();
				styleElem=f$('#ND_'+id).remove();
				styleKey='^#'+id+'.+';
				var	regExp=new RegExp(styleKey);
				if(!clearing){
					tempPageClearStyleList=process(sheetObj.page);
					tempTmplClearStyleList=process(sheetObj.tmpl);
				}
				function process(sheetObj){
					var result=[],ruleList=sheetObj?sheetObj.cssRules:[];
					for(var i=0;i<ruleList.length;i++){
						var rule=ruleList[i];
						if(regExp.test(rule.selectorText)){
							result.push({css:rule.cssText,idx:i});
							sheetObj.deleteRule(i--);
						}
					}
					clearing=true;
					return result;
				}
			},
			//还原
			restore:function(){
				var regExp=new RegExp(styleKey),
					ruleList=sheetObj?sheetObj.cssRules:[];
				tempPageClearStyleList.reverse();
				tempPageClearStyleList.forEach(function(v,i){
					sheetObj.page.insertRule(v.css,v.idx);
				});
				tempTmplClearStyleList.reverse();
				tempTmplClearStyleList.forEach(function(v,i){
					sheetObj.tmpl.insertRule(v.css,v.idx);
				});
				if(styleElem&&styleElem.length!==0){
					styleElem.appendTo('head');
					styleElem=null;
				}
				clearing=false;
			},
			clear:function(selectorRegex){
				sheetObj=getSheetObj();
				styleKey=selectorRegex;
				var	regExp=new RegExp(styleKey);
				process(sheetObj.page);
				process(sheetObj.tmpl);
				function process(sheetObj){
					var ruleList=sheetObj?sheetObj.cssRules:[];
					for(var i=0;i<ruleList.length;i++){
						var rule=ruleList[i];
						if(regExp.test(rule.selectorText)){
							sheetObj.deleteRule(i--);
						}
					}
				}
			},
			getValue:function(selectorRegex,prop){
				sheetObj=getSheetObj();
				styleKey=selectorRegex;
				var	regExp=new RegExp(styleKey),result;
				result=process(sheetObj.page);
				if(result!=null){
					return result;
				}else{
					process(sheetObj.page);
					process(sheetObj.tmpl);
				}
				function process(sheetObj){
					var ruleList=sheetObj?sheetObj.cssRules:[];
					for(var i=0;i<ruleList.length;i++){
						var rule=ruleList[i];
						if(regExp.test(rule.selectorText)){
							if(rule.style[prop]!=null)return rule.style[prop];
						}
					}
				}
			},
			isClearing:function(){
				return clearing;
			}
		};
	}();
	return {
		init:_init,
		getContentGroupsInfo:_getContentGroupsInfo,
		setContentGroupsVisible:_setContentGroupsVisible,
		savePage:_savePageBuffer,
		reloadAllCss:_reloadAllCss,
		reloadPageLevelCss:_reloadPageLevelCss,
		refreshComp:_refreshComp,
		refreshWidget:_refreshWidget,
		setTextWidget:_setTextWidget,
		setImageWidget:_setImageWidget,
		allContentBoxEmptyTag:_allContentBoxEmptyTag,
		changeComponentEffect:C.Util.asyncBufferFactory(changeComponentEffect),
		replaceComponent:C.Util.asyncBufferFactory(replaceComponent),
		setStyles:_setStyles,
		//添加组件
		addComponent:function(args){
			_addComponent(args).then(_savePageBuffer);
		},
		//添加设计元素
		addWidget:function(args){
			_addWidget(args).then(_savePageBuffer);
		},
		//添加内容组
		addContentGroup:function(args){
			_addContentGroup(args).then(_savePageBuffer);
		},
		//组件设置
		componentSetting:_componentSettingBuffer,
		//设计元素设置
		widgetSetting:_widgetSetting,
		saveSetting:_saveSetting,
		//刷新栅格		 
		refreshGrid:_refreshGrid,
		deleteElems:_deleteElems,
		addElemToFlowPage:_addElemToFlowPage,
		openFixedDialog:openFixedDialog,
		cancelFixed:_cancelFixed,
		setFixed:_setFixed,
		rebuildContentBoxId:_rebuildContentBoxId
	};
}());
