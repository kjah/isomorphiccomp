/**
 * @fileoverview 核心模块 提供模块创建方法 jQuery ajax设置 模板加载方法（缓存）
 * @author liuchen@300.cn
 */
/**
	@module Core
	@class C
	@namespace C
 */
var M,C=function(){
	"use strict";
	var namespaceObjMap={};
	var version=window.vd_version;
	var localStorage=window.localStorage;
	var sVersion=localStorage.getItem('version');
	if(version!=sVersion){//清除缓存
		localStorage.removeItem('templates');
		localStorage.setItem('version',version);
	}
	function _settingAjax(){
			$(document).ajaxComplete(function(event,XMLHttpRequest, settings){
				var sessionstatus=XMLHttpRequest.getResponseHeader("sessionExpire");
				if(sessionstatus=="true"){
			    		window.location.href="login.html";   
			    }
			    if(settings.dataType=='json'){
			    	try{
			    		var json=$.parseJSON(XMLHttpRequest.responseText);
			    		if(json.success==false){
			    			console.error(settings.url+' ajax 调用失败：'+json.message);
			    		}
			    	}catch(e){}
			    }
				//console.log('complete:'+settings.url);
			});
			$.ajaxSetup({   
				contentType:"application/x-www-form-urlencoded;charset=utf-8"
			});
		}
	function _heartbeat(){
		setInterval(function(){
			$.get('/login/getCurrentUser');
		},10*60*1000);
	}
	function _module(name,obj,baseNameObj){
			if(!baseNameObj)baseNameObj=_module.baseNameObj||window;
			if(obj){
				if(C.Util.NSUtil.getNameSpace(name,baseNameObj)){
					throw new Error('your namespace: ' + name + ' is not valid or already exists');
				}
				C.Util.NSUtil.setNameSpace(name,obj,baseNameObj);
				namespaceObjMap[name]=obj;
				return obj;
			}else{
				return namespaceObjMap[name];
			}
		}
		_module.baseNameObj='';

	function Callbacks(){
		this.fire=function(args){
			for(var i=0;i<this.length;i++){
				this[i](args);
			}
		};
	}
	Callbacks.prototype=Array.prototype;
	

	return {
		/**
			创建模块方法
			@method module
			@param	name {string} 命名空间的名称 如：aa.bb.cc 当只有此参数时，返回值为获取此命名空间对象
			@param	obj {object} 可选，为命名空间的值对象
			@param	baseNameObj {object} 可选，基础命名空间，创建的命名空间对象会在此对象之上
			@return 命名空间所引用的对象
	 	*/
		module:_module,
		/*
			控制台显示所有模块
		*/
		showModules:function(){
			sub('M',M);
			function sub(k,o){
				var keys=Object.keys(o),oKeys=keys.filter(function(v){var c=v.charCodeAt(0);return c>54&&c<91;});
				if(oKeys.length>0){
					console.group(k);
					oKeys.forEach(function(v){
						sub(v,o[v]);
					});
					console.groupEnd();
				}else{
					console.log(k);
				}
			}
		},
		Callbacks:function(){return new Callbacks();},
		/**
			@class	loadTmpl
		*/
		loadTmpl:function(){
			var tmplCache={};
			var tempStr=window.localStorage.getItem('templates');
			if(tempStr){
				tmplCache=JSON.parse(tempStr);
			}
			/**
					读取模板方法
					@method load
					@param tmplNmae	模板名称
			*/
			return 	function(tmplNmae){
					var dfd=$.Deferred();
					var tmpl=tmplCache[tmplNmae];
					// if(tmpl){
					// 	dfd.resolve(tmpl);
					// }else{
						$.get('/tmpl/'+tmplNmae+'.tmpl?v='+Date.now(),function(html){
							tmplCache[tmplNmae]=html;
							window.localStorage.setItem('templates',JSON.stringify(tmplCache));
							dfd.resolve(html);
						});
					// }
					return dfd.promise();
			};
		}(),
		config:{
			domain:'yun300.cn',
			baseBox:'pagebox'
		},
		init:function(){
			_settingAjax();
			_heartbeat();
		}
	};
}();
C.module.baseNameObj=M={};