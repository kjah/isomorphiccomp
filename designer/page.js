const cheerio = require('cheerio')
const fs = require('fs')
const viewdata = require('../viewdata')
//添加转义注释
function commont(str){
	return str.replace(/<%((.|\s)*?)%>/g, (match, subMatch)=>{ return "<!-- <%"+subMatch+"%> -->" });
}
//取消转义注释
function unCommonts(str){
	return str.replace(/<!-- <%((.|\s)*?)%> -->/g, (match, subMatch)=>{ return "<%"+subMatch+"%>"})
}
//获取url参数对象
function getAllUrlParam(url){
	let reg=/[\?&]+([^=&]+)=([^=&]+)/g,t,result={};
	while(t=reg.exec(url)){
		result[t[1]]=t[2];
	}
	return result;
}
//获取页面中模板列表
function getTmplListFromPage(htmlCode){
	let result=[],reg=/<%-tmpl\('(\w+)/g,t;
	while(t=reg.exec(htmlCode)){
		console.log(t);
		result.push(t[1]);
	}
	return result;
}
//读取页面中组件ejs模板
function loadCompTmplFromPage(pageId){
	let ejs=fs.readFileSync('view/'+pageId+'.ejs',{encoding:'UTF8'});
	let result={};
	ejs=commont(ejs);
	let $ = cheerio.load(ejs,{decodeEntities: false});
	$('div[id^="c_"]').each((i,e)=>{
		e=$(e);
		result[e.attr('id')]=unCommonts($(e).html());
	})
	return result;
}

//获取指定页面的组件模板列表
function getPageCompTmpl(ctx,next){
	let pageId=getAllUrlParam(ctx.url).page;
		let result=loadCompTmplFromPage(pageId);
	ctx.response.type = 'application/json';
	ctx.response.body=result;
}

function getTmplsDataFromPage(pageId){
	let tmpls=getTmplListFromPage(fs.readFileSync('view/'+pageId+'.ejs',{encoding:'UTF8'}));
	let result=[];
	tmpls.forEach((tmplId)=>{
		result.push({
			tmpls:loadCompTmplFromPage(tmplId),
			data:viewdata(tmplId)
		});
	});
	return Object.assign.apply({},result);
}
//获取页面配置
function getPageConfig(ctx,next){
	let pageId=getAllUrlParam(ctx.url).page;
	let result=viewdata(pageId);
	ctx.response.type = 'application/json';
	ctx.response.body=result;
}
//获取页面数据
function getPageData(ctx,next){
	let pageId=getAllUrlParam(ctx.url).page;
	let result={
		tmpls:loadCompTmplFromPage(pageId),
		data:viewdata(pageId)
	}
	let pageTmplData=getTmplsDataFromPage(pageId);
	Object.assign(result.tmpls,pageTmplData.tmpls);
	Object.assign(result.data,pageTmplData.data);
	ctx.response.type = 'application/json';
	ctx.response.body=result;
}

let methods={
	getPageCompTmpl,
	getPageConfig,
	getPageData
}

module.exports=function(ctx,next){
	console.log(ctx.params.method);
	methods[ctx.params.method](ctx,next);
}

