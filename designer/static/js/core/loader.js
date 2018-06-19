var url=window.location.href;
if(url.indexOf('?debug')!=-1){
	$LAB.setOptions({BasePath:'../js/build/'}).script('../js/build/libs.js')
		.script('./widgets.js')
		.script('./core.js').wait(function(){C.init();})
		.script('./modules.js').wait(modulesInit)
		.script('../libs/ckeditor/ckeditor.js');
}else{
	$LAB.setGlobalDefaults({Debug:true,CacheBust: vd_version});

	$LAB.setOptions({BasePath:'../js/libs/'})
		.script('ejs.min.js','jquery-1.11.1.js','jquery.tmpl.js','vue.js','jquery-ui-1.10.4.custom.js', 'jquery.dialog.js').wait();

	$LAB.setOptions({BasePath:'../js/core/'})
		.script('core.js','util.js').wait(function(){C.init();});

	$LAB.setOptions({BasePath:'../js/widgets/'})
		.script('jquery.popuptips.js','jquery.sliders.js').wait();

	$LAB.setOptions({BasePath:'../js/modules/'})
		.script('Editor.js','Cmd.EditCommand.js','Editor.Util.js','Cache.Page.js','Editor.Operation.js','Cache.Resource.js','Editor.RichEditor.js',
				'Editor.CompEditBox.js','Topbar.js').wait()
		.wait(modulesInit);
}

function modulesInit(){
	$(function(){
		M.Editor.init();
		// // 初始化顶部条模块
		M.Topbar.init();

		// // 初始化组件编辑框模块
		M.Editor.CompEditBox.init();
	});
}

