C.module('Editor.Util',function(){
    var elemSelector='div[id^="c_"],div[id^="w_"]',baseBoxSltr='.'+C.config.baseBox;
    /**
        判断元素是否是容器
        @param elem 元素
    */
    function _isContainer(elem){
        return elem&&/^content_box-/.test(typeof(elem)=='string'?elem:elem.attr('id'));
    }

    /**
        判断是否部件
    */
    function _isWidget(elem){
        return elem&&/^w_/.test(typeof(elem)=='string'?elem:elem.attr('id'));
    }
    /**
        判断是否组件
    */
    function _isComponent(elem){
        return elem&&/^c_/.test(typeof(elem)=='string'?elem:elem.attr('id'));
    }
    /**
     * 判断是否图片设计元素
     * @param  {string|jqDom}  elem 设计元素或id
     * @return {Boolean}      
     */
    function _isImgWidget(elem){
        return elem&&/^w_(img-|fimg-)/.test(typeof(elem)=='string'?elem:elem.attr('id'));
    }
    /**
        是否富文本可编辑的控件
    */
    function _isEditableWidget(elem){
        return elem&&/^w_common_text-/.test(typeof(elem)=='string'?elem:elem.attr('id'));
    }

    /**
        是否基本容器
    */
    function _isBaseBox(elem){
        return elem&&elem.hasClass(C.config.baseBox);
    }
    /**
        判断是否固定
    */
    function _isFixed(elem){
        return elem.css('position')=='fixed';
    }
    /**
     * 是否栅格元素
     * @param  {[type]}  elem [description]
     * @return {Boolean}      [description]
     */
    function _isGridWidget(elem){
        return elem&&/^(w_grid-)/.test(typeof(elem)=='string'?elem:elem.attr('id'));
    }

    /**
     * 是否内容组
     * @param  {[type]}  elem [description]
     * @return {Boolean}      [description]
     */
    function _isContentGroup(elem){
        var id=elem.attr('id');
        return false;
    }
    /**
     * 内容组是否可见
     * @param  {[type]}  elem [description]
     * @return {Boolean}      [description]
     */
    function _isContentGroupVisible(elem){
        return elem.attr('data-cg-visible')=='true';
    }

    /**
     * 是否已删除
     * @param  {[type]} elem 元素
     * @return {Boolean}      
     */
    function _isDeleted(elem){
        return elem.attr('ND_deleted')||elem.parents('div[ND_deleted]').length>0;
    }

    /**
     * 是否视频设计元素
     * @return {Boolean} 
     */
    function _isVideoWidget(elem){
        return elem&&/^(w_video-)/.test(typeof(elem)=='string'?elem:elem.attr('id'));
    }

    /**
        获取原件的容器
    */
    function _getElemContainer(elem){
        return elem.closest('div[id^="content_box"],'+baseBoxSltr);
    }

    /**
        获取原件的容器控件
    */
    function _getElemContainerWidget(elem){
        return elem.parents('div[id^="w_grid-"],div[id^="w_fgrid-"],'+baseBoxSltr).eq(0);
    }

    /**
        获取原件的所有容器控件
    */
    function _getElemContainerWidgets(elem){
        return elem.parents('div[id^="w_grid-"]');
    }

    /**
        获取原件的所有兄弟控件
    */
    function _getElemSiblingsWidgets(elem, hasDeleted){
        if(hasDeleted){
            return elem.siblings(elemSelector);
        }else{
            return elem.siblings(elemSelector).not('ND_deleted');
        }
    }

    /**
        获取容器内原件的最大z-index
    */
    function _getMaxZIndex(containerElem){
        var zIdxAry=[],elems=containerElem.find('>div');
        elems.each(function(i){
            var zidx=elems.eq(i).css('z-index');
            zidx=zidx=='auto'?0:zidx;
            zIdxAry.push(zidx);
        });
        return zIdxAry.length?Math.max.apply(this,zIdxAry):0;
    }

    /**
        获取容器的html,主要逻辑剔除内部容器内容
    */
    function _getContainerWidgetHtml(elem,f$){
        if(_isContainerWidget(elem)){
            var tempDiv=f$?f$('<div>'):$('<div>'),tempActive=elem.find('>.w_relationbtntab>.p_box001>.e_link>.active'),resultHtml='';
            elem.find('>.w_relationbtntab>.p_box001>.e_link[data-default]').click();
            //不用jquery.html() 赋值,因此方法会运行js
            tempDiv[0].innerHTML=elem.html();
            tempDiv.find('div[id^="content_box-"]').empty().removeAttr('style').removeClass('ND_empty');
            resultHtml=tempDiv.html();
            tempActive.click();
            return resultHtml;
        }
    }

    /**
        获取容器类设计元素内部容器块
    */
    function _getContainerInsideBox(elem){
        return elem.find('div[id^="content_box-'+_getInstanceName(elem.attr('id'))+'"]');
    }
    /**
        获取容器类设计元素内部所有元件
    */
    function _getContainerInsideElems(elem,hasDeleted){
        if(hasDeleted){
            return elem.find(elemSelector);
        }else{
            return elem.find(elemSelector).not('div[ND_deleted]');
        }
    }

    /**
            为元素集合补充容器内元件
    */
    function _addContainerInsideElems(elems,hasDeleted){
        elems.each(function(i){//添加容器内组件
            var elem=elems.eq(i);
            if(_isContainerWidget(elem)){
                elems=elems.add(_getContainerInsideElems(elem,hasDeleted));
            }
        });
        return elems;
    }

    /**
        获取页面所有元件
    */
    function _getPageBoxInsideElems($pagebox){
        return _getContainerInsideElems($pagebox);
    }
    /**
     * 获取所有内容组
     * @param  {[type]} $pagebox [description]
     * @return {[type]}          [description]
     */
    function _getContentGroups($pagebox){
        return $pagebox.find('div[data-cg-visible]');
    }

    /**
        计算元素的区域
        @param elems 元素集合
        @param isPosition 是否相对位置
    */
    function _calculateElemsArea(elems,isPosition) {
        var top, left,right,bottom;
        var tt = [],tl = [],tr = [],tb = [];
        elems.each(function() {
            var el=$(this),os=isPosition?el.position():el.offset();
            tt.push(os.top);
            tl.push(os.left);
            tr.push(os.left + el.outerWidth());
            tb.push(os.top + el.outerHeight());
        });
        top = Math.min.apply(this,tt);
        left = Math.min.apply(this,tl);
        right=Math.max.apply(this,tr);
        bottom=Math.max.apply(this,tb);
        return {
            top: top,
            left: left,
            right: right,
            bottom: bottom,
            width: right-left,
            height: bottom-top
        };
    }


    /**
        获取元素父容器（网格元素 grid）
    */
    function _getElemParentGrid(elem){
        return elem.parents('[id^=w_grid-], ' + baseBoxSltr).eq(0);
    }

    /**
        获取容器类设计元素内部所有子元件
    */
    function _getGridChildrenElems(elem, hasDeleted){
        if(elem.hasClass(C.config.baseBox)){
            return elem.children(elemSelector);
        }

        var idTimestamp = elem.attr('id').match(/\d+/g)[0];

        var elems = elem.find('[id^=content_box-' + idTimestamp + ']').children(elemSelector);

        if(hasDeleted){
            return elems;
        }else{
            return elems.not('div[ND_deleted]');
        }
    }




    /**
        判断是否容器类控件
    */
    function _isContainerWidget(elem){
        return elem&&/^(w_rbox-|w_grid-|w_container-)/.test(typeof(elem)=='string'?elem:elem.attr('id'));
    }
    
    /**
        获得组件实例号
    */
    function _getInstanceName(instanceId){
        return instanceId.split('-')[1];
    }

    /**
        获得组件类型名
    */
    function _getTypeName(instanceId){
        return instanceId.split('-')[0];
    }

    /**
        获取组件名称（不包含前缀）
    */
    function _getCompTypeName(instanceId){
        // 截取“c_******-123456”之间的内容
        return _getTypeName(instanceId).substring(2);
    }

    /**
        获取组件类型实例名（不包含前缀，包含时间戳）
    */
    function _getCompTypeInstanceName(instanceId){
        return instanceId.substring(2);
    }


    /**
     * 获取css属性对象集合 
     * @param  {jqElem} elem      jquery结果集
     * @param  {string|Array} propNames propNames 属性字符串(多个用逗号分隔)或数组
     * @type  {string}        获取类型 'percentConver' 根据父节点计算百分比宽度 'noComputed'取非计算样式
     * @return {obj}           返回对象结果集
     */
    function _getCssProps(elem,propNames,type){
        var result={};
        if(typeof(propNames)=='string'){
            propNames=propNames.split(',');
        }
        if(type==='percentConver'){
            result=$(elem).css(propNames);
            for(var key in result){
                var val=result[key].replace(/[^\d.]/g,'');
                if(key=='left'){
                    var parentWidth=elem.parent().width();
                    result[key]=val/parentWidth*100+'%';
                }
            }
        }else if(type==='noComputed'){
            var body=elem.$('body');
            body.css('height',body.outerHeight());
            $(elem).parent().hide();
            var styles=elem[0].ownerDocument.defaultView.getComputedStyle(elem[0], null );
            propNames.forEach(function(v){
                result[v]=styles[v];
            });
            $(elem).parent().show();
            body.css('height','auto');
        }else{
            result=$(elem).css(propNames);
        }
        return result;
    }

    /**
     * css kv对象转属性字符串转对象
     * @param  {obj} cssObj css kv 对象
     * @param  {boolean} noSemicolon 是否有分号
     * @return {[type]}        [description]
     */
    function _getCssStrFromCssObj(cssObj,noSemicolon){
        //return $('<a>').css(cssObj).attr('style')||'';
        var cssStr='',scolon=';';
        if(noSemicolon)scolon='';
        for(var key in cssObj){
            if(key===''){//媒体查询内容
                cssStr='  '+cssObj[key]+'\n';
            }else{
                if(cssObj[key]!==null&&cssObj[key]!==''){
                    cssStr+='  '+key+':'+cssObj[key]+scolon+'\n';
                }
            }
            
        }
        return cssStr;
    }

    /**
     * 获取组件访问url
     * @param  {String} compId 组件id
     * @param  {String} params 组件请求参数
     * @return {[type]}        [description]
     */
    function _getCompUrl(compId,params){
        var match=compId.match(/c_((\w+)_(\w+).*)/),paramStr=params?$.param(params):'';
        return '/comp/'+match[2]+'/'+match[3]+'?compId='+match[1]+(paramStr?'&'+paramStr:'');
    }
    /**
     * 获取图片大小
     * @param  {[type]} imgSrc [description]
     * @return {[type]}        [description]
     */
    function _getImgSize(imgSrc){
        var dfd=$.Deferred();
        var img=new Image();
        img.onload=function(){
            dfd.resolve({height:img.height,width:img.width});
        };
        img.src=imgSrc;
        return dfd.promise();
    }

    /**
     * 获取空的容器
     * @param  {[type]} elem [description]
     * @return {[type]}      [description]
     */
    function _getEmptyContentBox(elem){
        return elem.find('div[id^="content_box-"]:not(:has(:visible))');
    }
    /**
     * 获取非空容器
     * @param  {[type]} elem [description]
     * @return {[type]}      [description]
     */
    function _getNoEmptyContentBox(elem){
        return elem.find('div[id^="content_box-"]:has(:visible)');
    }
    /**
     * 设置历史页面
     * @param {[type]} url [description]
     */
    function _setHistoryEditPage(url){
        var historyStr=window.localStorage.getItem('historyEditPage');
        try{
            JSON.parse(historyStr);
        }catch(e){
            window.localStorage.removeItem('historyEditPage');
            historyStr=null;
        }
        var hist=historyStr?JSON.parse(historyStr):{};
        var domain=url.match(/http:\/\/([^\/]+)\//i)[1];
        hist[domain]=url;
        window.localStorage.setItem('historyEditPage',JSON.stringify(hist));
    }
    /**
     * 获取历史页面
     * @param  {[type]} domain [description]
     * @return {[type]}        [description]
     */
    function _getHistoryEditPage(domain){
         var historyStr=window.localStorage.getItem('historyEditPage');
         try{
            JSON.parse(historyStr);
        }catch(e){
            window.localStorage.removeItem('historyEditPage');
            historyStr=null;
        }
         return historyStr?JSON.parse(historyStr)[domain]:historyStr;
    }
    /**
     * 从页面中提取页面部分 即去除域名部分
     * @param  {[type]} url [description]
     * @return {[type]}     [description]
     */
    function _getPageFromUrl(url){
        return url.replace(/http.*\//,'');
    }

    /**
     * 根据样式判断固定位置
     * @param  {obj} cssVal 样式obj
     * @return {str}     方位缩写
     */
    function _getFixedPos(cssVal){
        /*var result,cv=cssVal,code='',mArr=cv.transform.match(/matrix\([^)].*,\s*(.+),\s*(.+)\)/),
            codeMap={
                '100100':'lt',
                '100110':'tc',
                '110000':'rt',
                '100101':'lc',
                '100111':'cc',
                '110001':'rc',
                '001100':'lb',
                '001110':'bc',
                '011000':'rb'
            };
        code=[cv.top,cv.right,cv.bottom,cv.left].map(function(v){return (v!='auto')/1+'';}).join('');
        code+=mArr?((mArr[1]!=0)/1+''+(mArr[2]!=0)/1):'00';
        return codeMap[code];*/
        return (cssVal.content||'').replace(/['"]/g,'');
    }
    /**
     * 获取位置为居中时百分比设置
     * @param  {str} pos 方位缩写
     * @return {obj}     百分比样式
     */
    function _getFixedPercent(pos){
        var posMap={
            lt:{right:'auto',bottom:'auto'},
            tc:{left:'50%',transform:'translate(-50%, 0px)',right:'auto',bottom:'auto'},
            rt:{left:'auto',bottom:'auto'},
            lc:{top:'50%',transform:'translate(0px, -50%)',right:'auto',bottom:'auto'},
            cc:{top:'50%',left:'50%',right:'auto',bottom:'auto',transform:'translate(-50%,-50%)'},
            rc:{top:'50%',transform:'translate(0px, -50%)',left:'auto',bottom:'auto'},
            lb:{top:'auto',right:'auto'},
            bc:{top:'auto',right:'auto',left:'50%',transform:'translate(-50%, 0px)'},
            rb:{top:'auto',left:'auto'}
        };
        return posMap[pos];
    }
    /**
     * 获取表格中最后一个有组件的容器的索引
     * @param  {[type]} grid [description]
     * @return {[type]}      [description]
     */
    function _getGridLastCell(grid){
        return _getContainerInsideBox(grid).find('>div:not([nd_deleted])').last().parent().index()+1;
    }
    /**
     * 获取视频元素
     * @param  {[type]} elem [description]
     * @return {[type]}      [description]
     */
    function _getVideoWidget(elem){
        return elem.find('div[id^="w_video-"]');
    }
    /**
        css样式对象转换为css样式字符串，优先级id >
    */
    function _elemsCssToCssString(elemsCss){
        var cssStr='',noSemicolon;
        elemsCss.forEach(function(v,i){
            noSemicolon=false;
            if((v.elem+'').trim().indexOf('@')==0)noSemicolon=true;
            var cssVal=_getCssStrFromCssObj(v.css,noSemicolon);
            // if(cssVal){
                if(typeof v.elem=='string'){
                    cssStr+=v.elem;
                }else{
                    cssStr+=_getSelectorFromElem(v.elem);
                }
                cssStr+='{\n'+cssVal+'}\n';
            // }
        });
        return cssStr;
    }
    /**
        对elemsCss数组修整，替换匹配的选择器
    */
    function _elemsCssArrayElemReplace(ary,regExp,val){
        if(!ary)return;
        ary.forEach(function(v,i){
               v.elem=v.elem.replace(regExp,val);
               if(v.elem.startsWith('@')&&v.css){
                    v.css['']=v.css[''].replace(regExp,val);
               }
        });
        return ary;
    }
    /**
     * 视频自动播放
     * @param  {[type]} elem [description]
     * @return {[type]}      [description]
     */
    function _videoWidgetAutoplay(elem){
        if(_isVideoWidget(elem)){               
            var oElem=elem.find('video').on('pause',function(){
                //onsole.log('pause');
                if(this.readyState==4&&oElem.autoplay){
                    this.play();
                }
            }).one('canplay',function(){
                this.play();
            })[0];
            if(oElem.readyState==4&&oElem.autoplay){
                oElem.play();
            }
        }
    }
    /**
        修改元素class
    */
    function _elemEffectModifier(elem,elemList){
        elemList.forEach(function(elemInfo,i){
            var sltr=/^(\.|\>)/.test(elemInfo.selector)?elemInfo.selector:'.'+elemInfo.selector;
            elem.find(sltr).attr('class',function(i,v){
               return v.replace(/e_\w+-\d+/,elemInfo.style);
            });
        });
     }
    return {
        isContainer:_isContainer,
        isWidget:_isWidget,
        isComponent:_isComponent,
        isImgWidget:_isImgWidget,
        isEditableWidget:_isEditableWidget,
        isBaseBox:_isBaseBox,
        isFixed:_isFixed,
        isDeleted:_isDeleted,
        isGridWidget:_isGridWidget,
        isContentGroup:_isContentGroup,
        isContentGroupVisible:_isContentGroupVisible,
        isContainerWidget: _isContainerWidget,
        isVideoWidget:_isVideoWidget,

        getInstanceName:_getInstanceName,
        getElemContainer:_getElemContainer,
        getElemContainerWidget:_getElemContainerWidget,
        getElemContainerWidgets:_getElemContainerWidgets,
        getElemSiblingsWidgets: _getElemSiblingsWidgets,
        getContainerWidgetHtml:_getContainerWidgetHtml,
        getContainerInsideBox:_getContainerInsideBox,
        getContainerInsideElems:_getContainerInsideElems,
        getPageBoxInsideElems:_getPageBoxInsideElems,
        getContentGroups:_getContentGroups,
        getCssProps:_getCssProps,
        getCssStrFromCssObj:_getCssStrFromCssObj,
        getCompUrl:_getCompUrl,
        getImgSize:_getImgSize,
        getEmptyContentBox:_getEmptyContentBox,
        getNoEmptyContentBox:_getNoEmptyContentBox,
        setHistoryEditPage:_setHistoryEditPage,
        getHistoryEditPage:_getHistoryEditPage,
        getPageFromUrl:_getPageFromUrl,
        calculateElemsArea:_calculateElemsArea,
        getFixedPos:_getFixedPos,
        getFixedPercent:_getFixedPercent,
        getGridLastCell:_getGridLastCell,
        // 获取元素父容器（网格元素 grid）
        getElemParentGrid: _getElemParentGrid,
        // 获取容器类设计元素内部所有子元件
        getGridChildrenElems: _getGridChildrenElems,
        getTypeName: _getTypeName,
        // 获取组件类型名称（不包含前缀）
        getCompTypeName: _getCompTypeName,
        // 获取组件类型实例名（不包含前缀，包含时间戳）
        getCompTypeInstanceName: _getCompTypeInstanceName,
        getVideoWidget:_getVideoWidget,
        videoWidgetAutoplay:_videoWidgetAutoplay,
        elemsCssToCssString:_elemsCssToCssString,
        elemsCssArrayElemReplace:_elemsCssArrayElemReplace,
        elemEffectModifier:_elemEffectModifier,
        getMaxZIndex:_getMaxZIndex,
        
        addContainerInsideElems:_addContainerInsideElems
    };
}());