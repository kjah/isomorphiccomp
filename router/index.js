const Router = require('koa-router')
const designer = require('./designer')
const fs = require('fs')
// 子路由
let page = new Router()
page.get('/404', async ( ctx )=>{
  ctx.body = '404 page!'
}).get('/helloworld', async ( ctx )=>{
  ctx.body = 'helloworld page!' 
})




//路由组装
let router = new Router()
router.use('/page', page.routes(), page.allowedMethods())
router.redirect('/', 'index.html');
//router.use('/api', getTemplSrc.routes(), getTemplSrc.allowedMethods())
//router.use('/designer',designer.routes(),designer.allowedMethods())

module.exports=router;