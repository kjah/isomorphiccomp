C.module('Editor.RichEditor',function(){
	var editUtil=M.Editor.Util,box;
	var editor,editorDiv,elem,oValues;
		function _active(){
			if(editUtil.isEditableWidget(elem)){
				// M.Editor.CompToolbar.hide();
				editorDiv=$('<div id="richTextEditor" class="reset_style" contenteditable="true"></div>').appendTo(box);
				//editorDiv.height(box.height()).width(box.width());
				var elemId=elem.attr('id');
				var type=editUtil.getTypeName(elemId).replace(/^w_/,'');
				var catchVal=M.Cache.Page.getElemConfig(elem.attr('id'));
				var oVal=catchVal.data[type];
				editorDiv.html(oVal);
				oValues={};
				oValues.elemsCss=[{elem:elem,css:{height:box.height()}}];
				editorDiv.on('mousedown selectstart',function(e){e.stopPropagation()});
				elem.find('>*').css('visibility','hidden');
				//CKEDITOR.disableAutoInline = true;
				editor = CKEDITOR.inline( editorDiv[0] );
				editor.on('blur',_remove);
				editor.on('focus',function(){
					var range = editor.createRange();
					range.moveToElementEditEnd( range.root);
					editor.getSelection().selectRanges( [ range ] );

					// 隐藏组件选框拖拽手柄
					M.Editor.CompEditBox.hideDragHandle();
				});
				editor.on('change',function(){
					// 重置scrollTop为0，ckeditor内容变更时，修改了父级的父级scrollTop
					$('#editLayer').scrollTop(0);

					var editorH=editor.element.getSize('height'),boxH=box.height();
					box.height(editorH);
					elem.find('>div').height(editorH);
				});
			}
		}
		function _remove(){
			if(editor){
				var newVal=editor.getData(),values,id=elem.attr('id'),
					oValue=M.Cache.Page.getElemConfig(id),
					type=editUtil.getTypeName(id).replace(/^w_/,'');
					value=$.extend(true,{},oValue),
					oVal=value.data[type];
				if(oVal!=newVal){
					values={};
					value.data[type]=newVal;
					oValues.configData=oValue;
					values.configData=value;
					values.elemsCss=[{elem:elem,css:{height:box.height()}}];
					// C.undoStack.execute(new M.Cmd.EditCommand(elem,values,oValues));

					// 设置文本到子页面 DOM 上
					M.Editor.Operation.setTextWidget(id, newVal)
				}else{
					// 内容未发生变化，显示子页面文本内容
					elem.find('>*').css('visibility','');
				}
				editor.destroy();
				editor=null;
			}
			if(editorDiv)editorDiv.remove();

			// 显示组件选框拖拽手柄
			M.Editor.CompEditBox.showDragHandle();
		}
		return {
			create:function(editBox,sltElem){
				box=editBox;
				if(elem!=sltElem){_remove()};
				elem=sltElem;
				box.off('dblclick').one('dblclick',function(){
					_active();
				});
			},
			active:_active,
			remove:function(){
				_remove();
			},
			isEditing: function(){
				return editor != null;
			}
		}

}());
