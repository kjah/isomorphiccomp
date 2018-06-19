C.module('Component.TypeOfLink',function(){

	var _init = function() {
		// C.loadTmpl('../tmpl/styleModifyImage').then(function(tmpl){

		// });
		return M.Component.ayncComponent('type-of-link', {
		  template: '\
		  			<div class="typeOfLink">\
						<div class="linkType s-15">\
						  	 <button type="button" v-on:click="speradTypeSelect">\
						  	 	<span>{{pageLink[\'type\']==\'page\'?\'页面\':\'外链\'}}</span><i class="bs icon-arrow-e rel"></i>\
						  	 </button>\
						     <div class="drop-down" v-show="typeSelectSeen">\
						       <ul class="select">\
						        <li data-addr-type="page" v-bind:class="pageLink[\'type\']==\'page\'?\'current\':\'\'" v-on:click="linkContentSelect">页面</li>\
						        <li ata-addr-type="outside" v-bind:class="pageLink[\'type\']==\'outside\'?\'current\':\'\'" v-on:click="linkContentSelect">外链</li>\
						       </ul>\
						     </div>\
						 </div>\
						 <div class="linkContent s-15">\
							<div class="drop-down" v-show="seen">\
								<ul class="select stopOutsideScroll">\
									<li v-for="item in cloneList" v-bind:data-pageurl="item.fileName" v-bind:data-id="item.id" v-on:click="linkToPage">{{item.name}}</li>\
								</ul>\
							</div>\
							<input type="text" class="js_linkinput" v-model="pageLink.url" v-on:input="modifyValue" v-bind:class="boolean?\'error\':\'\'" placeholder="请选择或者输入">\
							<span>请选择列表中页面名称</span>\
							<a class="js_page_list" v-show="pageLink[\'type\']==\'page\'?true:false" v-on:click="pageListSeen"><i class="bs"></i></a>\
						</div>\
						<div class="openWay">\
						  	<h2>打开方式</h2>\
						  	<select class="form-control" v-model="pageLink.target" v-on:change="modifyOpen">\
					     		<option value="_blank">新窗口打开</option>\
					     		<option value="_self">原窗口打开</option>\
					     	</select>\
						</div>\
					</div>\
					',
		  data: function() {
		  	return {
		  		typeSelectSeen:false,
		  		seen:false,
		  		pageList:[],
		  		cloneList:[],
		  		boolean:false,
		  		flag:''
		  	}
		  },
		  methods: {
		  	speradTypeSelect:function(){
		  		this.seen = false;
		  		if(!this.typeSelectSeen){
		  			this.typeSelectSeen = true;
		  		}
		  		else{
		  			this.typeSelectSeen = false;
		  		}
		  	},
		  	linkContentSelect:function(e){
		  		if($(e.target).hasClass('current')){
		  			this.typeSelectSeen = false;
		  			return;
		  		}
		  		else{
		  			$(e.target).addClass('current').siblings().removeClass('current');
		  			if($(e.target).data('addr-type') == 'page'){
		  				this.typeSelectSeen = false;
		  				this.pageLink = {type: "page", content: '', target: "_blank"};
		  			}
		  			else{
		  				this.typeSelectSeen = false;
		  				this.boolean = false;
		  				this.pageLink = {type: "outside", content: '', target: "_blank"};
		  				$('.linkContent .js_linkinput').val('');
		  				this.cloneList = this.pageList;
		  			}
		  		}
		  	},
		  	pageListSeen:function(e){
		  		if(!this.seen){
		  			this.seen = true;
		  		}
		  		else{
		  			this.seen = false;
		  		}
		  	},
		  	linkToPage:function(e){
		  		var id = $(e.target).data("id");
		  		var pageUrl = $(e.target).data("pageurl");
		  		this.pageLink.url = pageUrl;
		  		this.seen = false;
		  		if(this.pageLink.type == 'page'){
		  			this.pageLink = {};
		  			this.pageLink = {type: "page", content: {"id":id,"text":pageUrl}, target: "_blank"};
		  			// this.$set(this.pageLink.content,'id',id);
		  			// this.$set(this.pageLink.content,'text',pageUrl);
		  		}
		  		this.cloneList = this.pageList;
		  		this.flag = 'Sec';
		  		this.boolean = false;
		  	},
		  	modifyOpen:function(e){
		  		// this.pageLink = {type: "page", content: {"id":id,"text":pageUrl}, target: $(e.target).val()};
		  		this.globleData.data.target = $(e.target).val();
		  		var newObj = this.pageLink;
		  		newObj['target'] = $(e.target).val();
		  		this.pageLink = newObj;
		  	},
		  	modifyValue:function(e){
		  		if(this.pageLink.type == 'page'){
		  			this.flag = 'noSec';
			  		this.seen = true;
			  		this.cloneList = [];
			  		var that = this;
			  		$.each(this.pageList,function(i,ele){
						if(ele.name.indexOf($(e.target).val()) != -1){
							that.cloneList.push(ele);
						}
					});
		  		}
		  			
		  	}
		  },
		  mounted: function() {
		  	var that = this;
		  	$(document).on('click',function(e){
		  		if(!$(e.target).hasClass("js_linkinput")){
		  			if(that.pageLink.type == 'outside'){
			  			var newObj = that.pageLink;
		  				newObj['content'] = $('.linkContent .js_linkinput').val();
		  				that.pageLink = newObj;
		  				that.boolean = false;
			  		}
			  		else{
			  			if(that.flag == 'noSec'){
			  				that.boolean = true;
			  			}
			  		}
		  		}
		  		if(!$(e.target).closest('a').hasClass("js_page_list")){
		  			that.seen = false;
		  		}
		  	})
		  },
		  beforeCreate:function(){
			var that = this;
		  	$.ajax({
		  		url:'/page/list',
		  		type:'GET',
		  		dataType:'json',
		  		success:function(data){
		  			that.pageList = data;
		  			that.cloneList = that.pageList;
		  		},
		  		error:function(){

		  		}
		  	});
		  },
		  computed: {
		  	openWay:{
		  		get:function(){
		  			return '_' + this.globleData.data.target;
		  		},
		  		set:function(val){
		  			this.globleData.data.target = val.replace('_','');
		  		}
		  	},
		  	pageLink:{
		  		get:function(){
		  			var str = this.globleData.data.href;
		  			if(str){
		  				if(str.indexOf("$linkUtil.getLinkUrl") != -1){
		  					var firstIndex = str.indexOf('{');
		  					var lastIndex = str.lastIndexOf('}') + 1;
		  					var newStr = str.slice(firstIndex,lastIndex);
		  					var newJson = JSON.parse(newStr);
		  					if(newJson.content.hasOwnProperty('text')){
		  						$.each(this.pageList,function(i,ele){
		  							if(ele.fileName == newJson.content.text){
		  								newJson.url = ele.name;
		  							}
		  						});	
		  					}
		  					else{
		  						newJson.url = newJson.content;
		  					}
		  					return newJson;
		  				}
		  				else{
		  					return {type: "page", content: '', target: "_blank", url: str};
		  				}
		  			}
		  			else{
		  				return {type: "page", content: '', target: "_blank", url: str};
		  			}
		  		},
		  		set:function(obj){
		  			this.globleData.data.href = "$linkUtil.getLinkUrl('" + obj.type + "','" + JSON.stringify(obj) + "')";
		  		}
		  	}
		  },
		  props: {
		  	globleData: Object,
		  	onModify: Function,
		  	propsobj: Object
		  }
		})
	}

	return {
		init: _init
	};
}());