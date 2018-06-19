const Mock = require('mockjs')

module.exports=(function(){
	return Mock.mock(
		{
			'data|10':[
				{
					"id":function(){return Mock.Random.increment()+''},
					"title":'@ctitle()'
				}
			]
		}
	);

})();