C.Util={
	/*数组去重*/
	unqiueArray:function(ary){
		var map={};
		return ary.filter(function(v){
			return !!(map[v]?0:map[v]=1);
		});
	},
	/*获取url中参数map*/
	getAllUrlParam:function(url){
		var reg=/[\?&]+([^=&]+)=([^=&]+)/g,t,result={};
		while(t=reg.exec(url)){
			result[t[1]]=t[2];
		}
		return result;
	},
	/*延迟执行*/
	delayExcutor:function(){
    	var timer=0;
    	return function(fn,time) {
		    clearTimeout(timer);
		    timer=setTimeout(fn,time);
	    };
	}(),
	/**
	 * 加载css文件
	 * @param  {String} href url
	 * @return {Deferred}      promise
	 */
	loadCss:function(href){
		var dfd=$.Deferred(),link;
		var seek=$('link[href="'+href+'"]');
		if(seek.length>0){
			dfd.resolve();
		}else{
			link=$('<link rel="stylesheet"/>').attr('href',href).appendTo('head');
			link.on('load',function(){
				dfd.resolve();
			});
		}
		return dfd.promise();
	},

    /**
     * 读取文件对象，获取 base64 数据
     * @param {String}  file 要读取 base64 数据的 File 对象
     * @return {Deferred}   返回jQuery Deferred对象
     */
    getBase64DataByFile: function(file){
        var dfd = $.Deferred();

        var reader = new FileReader();

        // 文件读取完毕
        reader.onload = function(e){
            dfd.resolve(e.target.result);
        };

        // 文件读取发生错误，发生异常
        reader.onerror = function(){
            console.error("文件读取失败：", file);
            dfd.reject();
        };

        // 读取文件base64数据
        reader.readAsDataURL(file);

        return dfd.promise();
    },

    // 执行任务，并持续监听任务状态
    taskKeepAlive: function(options){
        var defaults = {
            taskUrl: "",    // 任务请求url
            taskData: null,   // 任务请求传递数据
            success: function(){},  // 任务轮询成功后的回调函数
            error: function(){},    // 任务轮询失败或者任务请求失败的回调函数

            keepaliveUrl: "/task/checkStatusAll",   // 任务状态轮询url
            delay: 2000,    // 轮询多久发一次（毫秒为单位）

            type: "post",   // 任务请求ajax type
            cache: false,    // 任务请求类型是否应用缓存
            processData: true, // (默认: true) 默认情况下，通过data选项传递进来的数据，如果是一个对象(技术上讲只要不是字符串)，都会处理转化成一个查询字符串，以配合默认内容类型 "application/x-www-form-urlencoded"。如果要发送 DOM 树信息或其它不希望转换的信息，请设置为 false。
            contentType: "application/x-www-form-urlencoded" // (默认: "application/x-www-form-urlencoded") 发送信息至服务器时内容编码类型。默认值适合大多数情况。如果你明确地传递了一个content-type给 $.ajax() 那么他必定会发送给服务器（即使没有数据要发送）
        };

        // 检查任务状态的interval对象
        var _setInterval = null;

        // 合并参数配置项
        var newOptions = $.extend(true, {}, defaults, options);

        // ajax提交向导数据
        $.when($.ajax({
                    url: newOptions.taskUrl,
                    type: newOptions.type,
                    cache: newOptions.cache,
                    data: newOptions.taskData,
                    processData: newOptions.processData,
                    contentType: newOptions.contentType,
                    error: function(error){
                        // 调用error回调
                        newOptions.error && newOptions.error(error);

                        console.error("任务请求调用失败：", error);
                    }
                }))
         .then(function(data, status, xhr){
            if(data.success){
                // 持续检查任务状态
                _setInterval = setInterval(function(){

                    // ajax检查提交向导数据的任务状态
                    $.get(newOptions.keepaliveUrl, {
                        tid: data.message,   // data.message为taskId
                        _rn: new Date().getTime()   // 随机数
                    }).then(function(taskData){
                        if(taskData.success){
                            if(taskData.message.status == "success" || taskData.message.status == "success"){
                                clearInterval(_setInterval);
                                _setInterval = null;

                                // 执行成功，调用回调
                                newOptions.success && newOptions.success(taskData.message.message);
                            }else if(taskData.message.status == "error"){
                                // 终止轮询（setInterval对象， popuptips对象， 是否成功）
                                stopKeepalive(_setInterval, newOptions.error, taskData);
                            }
                        }else{
                            // 终止轮询（setInterval对象， popuptips对象， 是否成功）
                            stopKeepalive(_setInterval, newOptions.error, taskData.message);
                        }

                        console.log("当前任务状态", taskData);
                    }).fail(function(error){
                        // 终止轮询（setInterval对象， popuptips对象， 是否成功）
                        stopKeepalive(_setInterval, newOptions.error, error);
                    });

                }, newOptions.delay);

            }else{
                // 终止轮询（setInterval对象， popuptips对象， 是否成功）
                stopKeepalive(_setInterval, newOptions.error, data.message);
            }
        }).fail(function(error){
            // 终止轮询（setInterval对象， popuptips对象， 是否成功）
            stopKeepalive(_setInterval, newOptions.error, error);
        });

        // 终止轮询（setInterval对象， popuptips对象， 是否成功）
        function stopKeepalive(interval, callback, error){
            clearInterval(interval);
            interval = null;

            // 调用error回调
            callback && callback(error);

            console.error("轮询接口调用异常", error);
        }
    },
    
    /**
     * 异步缓冲器构造工厂， 异步方法连续调用时，在异步过程中多次调用时，等待异步返回只执行最后一次调用
     * 适用于多次调用保存接口等异步动作
     * @param  {Function} fn 返回promise对象的异步方法
     * @return {[type]}      [description]
     */
    asyncBufferFactory:function(fn) {
        var slice = Array.prototype.slice;
        var keepfn=fn;
        var state='standby';
        var bufferParams,bufferDfd;
        function _asyncBuffer(){
            var params = slice.call(arguments);
            var dfd=$.Deferred();
            bufferParams=params;
            if(state==='standby'){//空闲时执行
                state='working';
                keepfn.apply(null,bufferParams).then(function(result){
                    state='standby';
                    dfd.resolve(result);
                    if(bufferParams!=null){
                        _asyncBuffer(bufferParams);
                    }else{
                        if(bufferDfd){
                            bufferDfd.resolve(result);
                            bufferDfd=null;
                        }
                    }
                },function(){
                    state='standby';
                    dfd.reject(arguments);
                    if(bufferDfd){
                        bufferDfd.reject(arguments);
                        bufferDfd=null;
                    }
                });
                bufferParams=null;
            }else{//当正在执行时取消上一异步方法，并放入新的异步方法
                if(bufferDfd){
                    bufferDfd.reject();
                }
                bufferDfd=dfd;
            }
            return dfd.promise();
        }
        return  _asyncBuffer;
    }
};
C.Util.NSUtil=function(){
	return {
		setNameSpace:function(names,obj,pObj){
			if(!pObj)pObj=window;
			var ns=(names||'').split('.');
			for(var i=0,n=ns.length-1;i<n;i++){
				var na=ns[i];
				pObj[na]=pObj[na]||{};
				pObj=pObj[na];
			}
			return pObj[ns[n]]=obj||{},pObj;
		},
		getNameSpace : function(names,pObj) {
		  	if(!pObj)pObj=window;
	     	var ns = (names||'').split(".");
	      	for(var i=0,n=ns.length;i<n;i++){
				var na=ns[i];
				if(!pObj[na])
					return void(0);
				pObj=pObj[na];
			}
	      return pObj;
	    },
	};
}();
//阻止滚轮冒泡
(function($){
    $.fn.preventScroll = function(){
        var _this = this.get(0);
        if(/firefox/i.test(navigator.userAgent)){
            _this.addEventListener('DOMMouseScroll',function(e){
                _this.scrollTop += e.detail > 0 ? 120 : -120;  
                e.preventDefault();
            },false);
        }else{
            _this.onmousewheel = function(e){  
                e = e || window.event;  
                _this.scrollTop += e.wheelDelta > 0 ? -120 : 120;  
                return false;
            };
        }
        return this;
    };
})(jQuery);