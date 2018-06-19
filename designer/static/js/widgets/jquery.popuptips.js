
(function($, window, document, undefined){

    var defaults = {
        delay: 2000,    // 气泡显示时长
        fadeOutDelay: 1000, // 气泡隐藏所需时长
        text: "操作成功。",  // 提示文字
        description: '',    // 描述文字，需要换行的时候添加br标签
        icon: "success",    // 提示图标
        callback: null,  // 气泡提示结束后，delay时间之后执行的回调
        mask: false // 是否显示遮罩
    };

    // 图标class映射
    var ICON_MAP = {
        success: "icon-success",
        warn: "icon-alert-yellow",
        error: "icon-alert-red",
        loading: "loading_animation"
    };

    // popup提示层的html结构
    var _popupHtml = '{{if mask}}<div class="popuptipsMask" style="background-color: rgba(45,46,49,.5); position: fixed; top: 0px; left: 0px; right: 0px; bottom: 0px; z-index: 999999999;">{{/if}}'+
                        '<div class="panel popuptips aui_state_lock aui_state_focus" style="width: auto; z-index: 999999999;">'+
                            '<div class="alert alert-succ">'+
                                '<div class="alert-title">'+
                                    '<i class="al ${icon}"></i>'+
                                    '<h1 {{if description}} class="has-description" {{/if}}>'+
                                        '${text}'+
                                        '{{if description}} <br> <span class="alert-description">{{html description}}</span> {{/if}}'+
                                    '</h1>'+
                                '</div>'+
                            '</div>'+
                        '</div>'+
                    '{{if mask}}</div>{{/if}}';

    // 添加到模板
    $.template('popuptipsTmpl', _popupHtml);

    $.extend({
        popuptips: function(params){
            var options = $.extend({}, defaults, params);
            // 获取图标class
            options.icon = ICON_MAP[options.icon] || ICON_MAP.success;

            var $popupMask = $.tmpl('popuptipsTmpl', options);
            // 有遮罩获取子级提示层，没有遮罩返回自己
            var $popup = $popupMask.is(".popuptipsMask") ? $popupMask.children(".popuptips") : $popupMask;

            // 将传递过来的参数，设置到气泡dom结构中
            // $popup.find(".alert-title>h1").text(options.text);

            $popupMask.appendTo("body");

            // 设置top和left在浏览器窗口最中间
            var top = ($(window).height() - $popup.height()) / 2;
            var left = ($(window).width() - $popup.width()) / 2;
            $popup.css({
                top: top,
                left: left
            });

            // 要return的对象
            var _popuptips = {
                $DOM: $popupMask,
                hidePopuptips: function(){
                    var that = this;

                    // 如果传递了回调，气泡隐藏开始时，执行回调
                    if(options.callback && typeof(options.callback) == "function")
                        options.callback();

                    // 显示两秒，之后隐藏，隐藏后删除
                    that.$DOM.animate({
                        opacity: 0
                    }, options.fadeOutDelay, function(){
                        that.$DOM.remove();
                    });
                }
            };

            // 如果设置成-1，表示永不自动清除
            if(options.delay !== -1){
                setTimeout(function(){
                    // 隐藏提示层
                    _popuptips.hidePopuptips();
                }, options.delay);
            }

            return _popuptips;
        }
    });

})(window.jQuery, window, document);
