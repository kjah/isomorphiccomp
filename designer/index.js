var cheerio = require('cheerio')
const fs = require('fs')

module.exports=function(ctx,next){
	console.log('designer entry')

	ctx.response.type = 'html';
	ctx.response.body=fs.readFileSync('designer/index.html',{encoding:'UTF8'});

}