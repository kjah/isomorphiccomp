const viewdata=require('./viewdata');
const ejs=require('ejs');
const suffixReg=/([^\/]*).html$/;
const fs = require('fs')

function tmpl(tmplid){
	let tmpldata=viewdata(tmplid);
	let ejsTmpl=fs.readFileSync('view/'+tmplid+'.ejs','UTF-8');
	console.log(ejsTmpl);
	return ejs.render(ejsTmpl,tmpldata);
}

module.exports = {	
	async render(ctx){
		console.log(ctx.url+'----------');
		//检查后缀
		if(suffixReg.test(ctx.url)){
			//视图名称
			let view=ctx.url.match(suffixReg)[1];
			console.log('view name:'+view)
			let data=viewdata(view);
			data.tmpl=tmpl;
			//渲染视图
			await ctx.render(view, data);

		}		
	}
}