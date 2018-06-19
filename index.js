const Koa = require('koa')
const views = require('koa-views')
const path = require('path')
const static = require('koa-static')
const fs = require('fs')
const {render}=require('./render')
const frontRouter=require('./router')
const designerRouter=require('./router/designer')
const mount = require('koa-mount');

const designerEnter=require('./designer')

const app = new Koa()
const frontApp = new Koa()
const designerApp = new Koa()

const staticPath = './static'



// 加载路由中间件
frontApp.use(frontRouter.routes()).use(frontRouter.allowedMethods())
// 加载模板引擎
frontApp.use(views(path.join(__dirname, './view'), {
  extension: 'ejs'
}))

frontApp.use(static(path.join( __dirname,  staticPath)))

frontApp.use(render)

//设计器应用
designerApp.use(static(path.join( __dirname,  './designer/static')));
designerApp.use(designerRouter.routes()).use(designerRouter.allowedMethods())


app.use(mount('/designer', designerApp));

app.use(mount('/', frontApp));


app.listen(3000)