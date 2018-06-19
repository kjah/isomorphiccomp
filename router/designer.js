const Router = require('koa-router')
const designer = require('../designer')
const page = require('../designer/page')

let router = new Router()

router.get('/',designer);

router.get('/api/page/:method',page);



module.exports=router;

