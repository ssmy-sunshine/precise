/*弹窗对象*/
function Layer(options){
	var optionDef={
		title:"温馨提示", //标题, 字符串
		content:"", //内容,可为html,自行定义样式,字符串
		btn:["取消","确定"], //按钮文本, 数组
		click:null,  //按钮点击回调, 方法(按钮下标)
		onShow:null, //显示完毕的回调(warpDom,this)
		onClose:null, //关闭的回调(warpDom,this)
		style:{
			warp:"", //对话框样式
			title:"", //标题样式
			content:"", //内容样式
			btn:"" //按钮样式
		}
	}
	this.options=Layer.extend(options,optionDef);
}

Layer.prototype.show = function() {
	var me=this;
	var opt=me.options;
	var str='<div style="'+opt.style.warp+'">';
	//标题
	if(opt.title) str+='<p class="layer-title" style="'+opt.style.title+'">'+opt.title+'</p>';
	//内容
	str+='<div class="layer-content" style="'+opt.style.content+'">';
	if(opt.content) str+=opt.content;
	str+='</div>';
	//按钮
	var btnLen=opt.btn.length;
	if(btnLen>0){
		var btns='';
		for (var i = 0; i < btnLen; i++) {
			btns+='<p class="layer-btn" i="'+i+'">'+opt.btn[i]+'</p>';
		}
		str+='<div class="layer-btns" style="'+opt.style.btn+'">'+btns+'</div>';
	}
	//按钮-end
	str+='</div>';
	//添加到body
	me.warpDom=document.createElement("div");
	me.warpDom.className="layer-warp";
	me.warpDom.innerHTML=str;
	document.body.appendChild(me.warpDom);
	//点击事件
	if(btnLen>0){
		var btnObjs=me.warpDom.getElementsByClassName("layer-btn");
		for (var i = 0; i < btnLen; i++) {
			btnObjs[i].addEventListener("tap",function(e) {
				e.stopPropagation();
				var i=Number(this.getAttribute("i"));
				var isClose=me.options.click&&me.options.click(i);
				if(isClose!=true) me.close();
			})
		}
	}
	//初始化完毕的回调
	me.onShow&&me.onShow(warpDom,this);
}

/*关闭*/
Layer.prototype.close = function() {
	//移除
	document.body.removeChild(this.warpDom);
	//回调
	this.onClose&&this.onClose();
}

/*配置参数*/
Layer.extend = function(target, source) {
	if (target==null) {
		target=source;
	} else{
		for(key in source) {
			if(target[key] == null) {
				target[key] = source[key];
			} else if(typeof target[key] == "object") {
				Layer.extend(target[key], source[key]); //深度匹配
			}
		}
	}
	return target;
}