const fs = require('fs')
module.exports=function(view){
	//读取视图配置文件
	let viewprop=JSON.parse(fs.readFileSync('./viewprops/'+view+'.json'));

	//组织视图相关数据
	let viewdata={
		title:viewprop.pagename,
		foo(){//示例固定输出方法，如处理url等
			return '<a href="www.baidu.com">test link</a>'
		}
	};
	viewprop.complist.forEach((comp)=>{
		let compId=comp.id;
		let compType=comp.props.comptype;
		let datasource=comp.props.datasource;
		if(!viewdata[compId]){
			viewdata[compId]={
				props:comp.props
			};
			if(datasource){
				viewdata[compId].data=require('./data/'+datasource).data;
			}
		}
	});
	//console.log(viewdata);
	return viewdata;
}