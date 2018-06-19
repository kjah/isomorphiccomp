/**
	编辑命令对象

	初始化时传入选择的元素 设置值 和 原值

	值数据格式

	{	
		elemsCss:[			//样式设置--常规属性
				  {
					elem:,//应用样式的jq元素或选择器
				  	css:  //样式
				  },
				  {
					elem:,//应用样式的jq元素或选择器
				  	css:  //样式
				  }
				  ......
				  ],
		parent:  //选择的元素所属父节点改变
		firstSelectedElem: //多选时，首选元素，用于等宽高设置
		lock://设置locked的值
		glock://设置组锁定
		delete://true false 隐藏显示选择的元件，用作删除功能
		content://需要替换的dom内容
		prop://设计元素参数改变
		configData://全部配置数据 用于设计元素更新缓存内容
		containerMap://容器类内部容器和子元素关系
		cgVisable://内容组是否可见
		editable://设置是否可编辑区
	}
*/

C.module('Cmd.EditCommand',function(){
	function _action(selectedElems,values){
		var editUtil=M.Editor.Util;

		if(values.elemsCss){
			if(values.elemsCss.length>0){
				if(typeof(values.elemsCss[0].elem)=='string'){
					if(editUtil.isWidget(selectedElems)){
						M.Editor.Operation.setStyles(selectedElems.attr('id'),values.elemsCss);
					}
				}else{
					$.each(values.elemsCss,function(i){
						this.elem.css(this.css);
					});
				}
			}else{
				M.Editor.Operation.setStyles(selectedElems.attr('id'),values.elemsCss);
			}
		}
		if(values.positionCss){
			selectedElems.css(values.positionCss);
		}

		if(values.delete!=null){
			var tmpElems;
			if(values.delete){
				tmpElems=editUtil.addContainerInsideElems(selectedElems);
				tmpElems.hide();
				tmpElems.attr('ND_deleted','deleted');
				rebuildGridByRemoveComp.call(this,selectedElems);
				M.Editor.CompEditBox.setCompEditBox(selectedElems.parents('.'+C.config.baseBox));
			}else{
				tmpElems=selectedElems;
				tmpElems.show();
				tmpElems.removeAttr('ND_deleted');
			}
		}

		if(values.insertToNewCell){
			var moveObj=values.insertToNewCell;
			var tGrid=moveObj.targetGrid,tIdx=moveObj.targetContIdx;
			var oGrid=editUtil.getElemContainerWidget(selectedElems);
			var targetCell=editUtil.getContainerInsideBox(tGrid).eq(tIdx);
			if(targetCell.length===0){//反向操作时 不插入 通过修改cellNums创建
				M.Editor.Operation.refreshGrid(tGrid,tIdx);
			}else{
				targetCell.before('<div>');
			}
			
			M.Editor.Operation.rebuildContentBoxId(tGrid);
			compAppendToGrid(selectedElems,tGrid,tIdx);
			M.Editor.Operation.refreshGrid(oGrid);
		}
		

		if(values.parent){
			var oParent=selectedElems.parent();
			if(values.parent.parents('body').length===0){//判断父元素是否在dom树上
				selectedElems.parents('body').find('#'+values.parent.attr('id')).append(selectedElems);
			}else{
				selectedElems.appendTo(values.parent);
			}
			
			if(oParent.find('*').length===0)oParent.empty();
			//刷新父级表格容器
			var oParentWgt=editUtil.getElemContainerWidget(oParent);
			var tParentWgt=editUtil.getElemContainerWidget(values.parent);
			M.Editor.Operation.refreshGrid(oParentWgt);
			M.Editor.Operation.refreshGrid(tParentWgt);
			
		}

		if(values.insert){
			var oParent=selectedElems.parent();
			values.insert.target[values.insert.type](selectedElems);
			//刷新原父级表格容器

			var oParentWgt=editUtil.getElemContainerWidget(oParent);
			M.Editor.Operation.refreshGrid(oParentWgt);

		}

		if(values.content!=null){
			selectedElems.html(values.content);
		}
		if(values.elemList){
			editUtil.elemEffectModifier(selectedElems,values.elemList);
		}
				
		if(values.firstSelectedElem){
			M.Editor.CompEditBox.setFirstSelectedElem(values.firstSelectedElem);
		}
		if(values.prop){
			selectedElems.attr('class',values.prop.styleId);
			//动画标识
			if(values.prop.scrollAnimationMode){
				selectedElems.attr('data-animation',values.prop.scrollAnimationMode);
			}else{
				selectedElems.removeAttr('data-animation');
			}
		}

		//移除栅格单元格
		if(values.deleteCell){
			var delObj=values.deleteCell;
			var tGrid=delObj.targetGrid,tIdx=delObj.targetContIdx;
			editUtil.getContainerInsideBox(tGrid).eq(tIdx).remove();
			M.Editor.Operation.rebuildContentBoxId(tGrid);
			M.Editor.Operation.refreshGrid(tGrid);
		}
		if (values.configData) {
			M.Editor.Operation.refreshWidget(selectedElems,values.configData);
			//同步更新缓存，及时保存已改为直接更新，注释掉
			//M.Cache.Page.getWidgetConfigMap()[selectedElems.attr('id')]=values.configData;
		}

		if(values.containerMap){
			for(var cid in values.containerMap){
				selectedElems.find('#'+cid).append(values.containerMap[cid]);
			}
		}
		if(!values.delete&&selectedElems){
			setTimeout(function(){
				M.Editor.CompEditBox.setCompEditBox(selectedElems);
			},10);
			
		}
		M.Editor.Operation.allContentBoxEmptyTag();
		
		function _setElemToTmpl(elems,tmplVal){
			M.Cache.Page.setTmplModifyState(true);
			elems.attr('data-tmpl',tmplVal);
			//子原件同时设置
			elems.each(function(i){
					var elem=elems.eq(i);
					if(editUtil.isContainerWidget(elem)){
						elem.find(editUtil.elemSelector).attr('data-tmpl',tmplVal);
					}
			});
		}


		//移除元素时栅格处理
		function rebuildGridByRemoveComp(selectedElems){
			var parentWidget=editUtil.getElemContainerWidget(selectedElems);
			if(editUtil.isGridWidget(parentWidget)&&editUtil.getContainerInsideElems(editUtil.getElemContainer(selectedElems)).length==0){
				M.Editor.Operation.refreshGrid(parentWidget);
			}
		}
		/**
		 * 组件添加到栅格
		 * @param  {[type]} selectedElems [description]
		 * @param  {[type]} tGrid         [description]
		 * @param  {[type]} contIdx       [description]
		 * @return {[type]}               [description]
		 */
		function compAppendToGrid(selectedElems,tGrid,contIdx){
			if(editUtil.isGridWidget(tGrid)){
				M.Editor.Operation.refreshGrid(tGrid,contIdx+1);
				selectedElems.appendTo(editUtil.getContainerInsideBox(tGrid).eq(contIdx));
			}
		}

		M.Editor.Operation.savePage();
	}

	return {
		action:_action
	};
}());