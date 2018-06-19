/**
 * @license Copyright (c) 2003-2013, CKSource - Frederico Knabben. All rights reserved.
 * For licensing, see LICENSE.html or http://ckeditor.com/license
 */

CKEDITOR.editorConfig = function( config ) {
	// Define changes to default configuration here. For example:
	// config.language = 'fr';
	// config.uiColor = '#AADC6E';
	config.startupFocus = true;
	/*config.toolbarGroups = [
	    //{ name: 'clipboard',   groups: [ 'clipboard', 'undo' ] },
	    //{ name: 'editing',     groups: [ 'find', 'selection', 'spellchecker' ] },
	    //{ name: 'links' },
	    //{ name: 'insert' },
	    //{ name: 'forms' },

	    
	    { name: 'styles' },
	    //{ name: 'tools' },
	    '/',
	    { name: 'basicstyles', groups: [ 'basicstyles' ] },
	    { name: 'colors' },
	    { name: 'paragraph',   groups: [ 'list', 'align' ] },
	    //{ name: 'document',    groups: [ 'mode', 'document', 'doctools' ] },
	    //{ name: 'others' },
	    
	   
	    //{ name: 'about' }
	];*/
	config.toolbar = [
	    { name: 'styles', items: [ 'Styles', 'Format', 'Font', 'FontSize','lineheight','letterspacing'] },
	    
	    '/',
	    { name: 'basicstyles',items : [ 'Bold','Italic','Underline','Strike']},
	    { name: 'colors', items: [ 'TextColor', 'BGColor' ] },
	    { name: 'paragraph1',items:  [ 'NumberedList', 'BulletedList']},
	    { name: 'paragraph2',items:  [ 'JustifyLeft', 'JustifyCenter', 'JustifyRight', 'JustifyBlock']},
	    { name: 'Link',items:  [ 'Link']},
	    { name: 'Smiley',items:  [ 'Smiley']}
	    
	];
	config.font_names='宋体/宋体;黑体/黑体;微软雅黑/微软雅黑;'+ config.font_names;
	config.fontSize_sizes='8/8px;9/9px;10/10px;12/12px;14/14px;16/16px;18/18px;20/20px;22/22px;24/24px;26/26px;28/28px;30/30px;32/32px;34/34px;36/36px;38/38px;40/40px;42/42px;44/44px;46/46px;48/48px;50/50px;52/52px;54/54px;56/56px;58/58px;60/60px;62/62px;64/64px;66/66px;68/68px;70/70px;72/72px';
	config.baseFloatZIndex=10010;
	config.extraPlugins = 'lineheight,letterspacing';
	config.line_height='0.5;0.6;0.7;0.8;0.9;1;1.1;1.2;1.3;1.4;1.5;1.6;1.7;1.8;1.9;2;2.1;2.2;2.3;2.4;2.5;2.6;2.7;2.8;2.9;3';
	config.forcePasteAsPlainText = true;//粘贴纯文本
};