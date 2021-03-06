
# Isomorphic Component Model

基于EJS模板的,前后端同构的,页面及组件模型,其中包含该一个简易的设计器示例.

## 运行
```
npm i
npm run start
```

## 网站前台：<br>
http://localhost:3000/index.html


## 简易设计器：<br>
http://localhost:3000/designer/html/index.html

鼠标移动到对应组件选中，可编辑组件参数，并即时显示修改结果。<br>
可通过在URL中增加参数，如：?fileName=index 切换编辑页面<br>



## 此示例使用包清单：<br>
Koa2    ---示例用web服务器<br>
ejs     ---同构模板技术<br>
cheerio ---DOM解析<br>
mockjs  ---模拟数据<br>

## 结构简述

view目录中为前台展示页面，使用EJS模板。<br>
viewprops目录中为每个页面的配置文件，包含页面中组件的配置信息。<br>

组件配置示例：
```
{
	"id":"c_commonlist_1",//component id
	
	"props":{
		"title":"商品列表",
		"comptype":"commonlist",//组件的类型
		"datasource":"productList"//组件的数据源，实际应用对应数据库动态数据
		...//其他组件配置参数
	}
}

```

页面访问时，通过viewdata.js根据页面的配置文件组织页面渲染数据。<br>
render.js负责前端页面的渲染，并为模板提供一个tmpl方法，引入公用的html片段，如页面头部。<br>

data目录是用mockjs提供的模拟数据<br>

designer目录中为一个简易的页面设计器，通过iframe引入前台页面。<br>
目前仅做选中及编辑参数示例，在此基础上可增加，添加组件，保存页面等功能。<br>



