const Mock = require('mockjs')

module.exports=(function(){
	return Mock.mock(
		{
			'data|5':[
				{
					"id":function(){return Mock.Random.increment()+''},
					"name":'@cword(4)'
				}
			]
		}
	);

})();