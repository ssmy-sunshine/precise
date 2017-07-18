/*接口域名*/
var isConsole=true;//TODO 是否输出,正式项目需改为false
var Host="http://123.207.55.23:60/";//测试项目服务器地址
//var Host="http://120.24.219.31:81/";//正式项目服务器地址

/*加载H5插件完成后的事件*/
document.addEventListener("plusready", function() {
	//返回按钮
	$(".wb-back").click(function(){ mui.back() });
	//跳转界面
	$(".tohref").click(function(){
		var needLogin=this.getAttribute("isLogin");
		if(needLogin&&!UserObj.isLogin()) return;//必须登录
		var href=this.getAttribute("href");
		openWindow(href);
	})
	//android禁止侧滑返回,因为无法执行回调
	if(mui.os.android) plus.webview.currentWebview().setStyle({'popGesture': 'none'});
});

/*用户信息对象*/
var UserObj={
	/*获取本地缓存的用户Uid*/
	getUid : function() {
		var Uid=localStorage.getItem("Uid");
		if (Uid) Uid=Number(Uid);
		return Uid;
	},
	setUid : function(Uid){
		setLocalStorage("Uid",Uid);
	},
	/*获取用户头像,如果传imgpath则返回拼接的头像地址,如果不传则返回当前用户的头像地址*/
	getIcon : function(imgpath) {
		if(imgpath){
			return getImgpath(imgpath);
		}else{
			return localStorage.getItem("UserIcon");
		}
	},
	setIcon : function(imgpath){
		setLocalStorage("UserIcon",UserObj.getIcon(imgpath));
	},
	/*获取用户名*/
	getUsername : function() {
		return localStorage.getItem("Username");
	},
	setUsername : function(username) {
		setLocalStorage("Username",username);
	},
	/*获取用户密码*/
	getPassword : function() {
		return localStorage.getItem("password");
	},
	setPassword : function(password) {
		setLocalStorage("password",password);
	},
	/*获取用户昵称*/
	getNickname : function() {
		return localStorage.getItem("UNickName");
	},
	setNickname : function(nickname) {
		setLocalStorage("UNickName",nickname);
	},
	/*获取用户会员等级*/
	getLevelTag : function() {
		return localStorage.getItem("UserTypTag");
	},
	setLevelTag : function(userTypTag) {
		setLocalStorage("UserTypTag",userTypTag);
	},
	getLevelName : function() {
		return localStorage.getItem("LevelName")+"会员";
	},
	setLevelName : function(levelName) {
		setLocalStorage("LevelName",levelName);
	},
	/*获取access_token*/
	getToken : function() {
		return localStorage.getItem("access_token");
	},
	setToken : function(access_token) {
		setLocalStorage("access_token",access_token);
	},
	getTokenType : function() {
		return localStorage.getItem("token_type");
	},
	setTokenType : function(token_type) {
		setLocalStorage("token_type",token_type);
	},
	/*登录*/
	login : function(username,password,success,err){
		if (username&&password) {
			var param={"username":username, "password":password, "grant_type":"password"};
			ajaxData(Host+"token", function(data) {
				//{"access_token":"xx","token_type":"bearer","refresh_token":"xxxx","as:client_id":"100024","userName":"文举"}
				UserObj.setToken(data.access_token);
				UserObj.setUsername(data.userName);
				UserObj.setTokenType(data.token_type);
				UserObj.setUid(data["as:client_id"]);
				return success&&success();//成功回调
			},param,function(e) {
				return err&&err(e);//失败回调
			});
		}else{
			openWindow("../account/login.html");//如果没有TK,则去登录页
		}
	},
	/*获取用户是否登录 isToLogin默认跳转登录*/
	isLogin : function(isToLogin) {
		if (UserObj.getUid()&&UserObj.getToken()) {
			return true;
		} else{
			if(isToLogin!=false) openWindow("../account/login.html");
			return false;
		}
	},
	/*获取用户信息*/
	getUserinfo : function(callback){
		if(UserObj.isLogin(false)){
			ajaxData(Host+"api/Account/GetMemberInfo", function(data){
				if (data.Status==200) {
					var user=data.Data;
					//缓存数据
					UserObj.setIcon(user.ImgUrl);//头像
					UserObj.setNickname(user.Name);//昵称
					UserObj.setLevelTag(user.ComboId);//会员级别id
					UserObj.setLevelName(user.Level);//会员级别名称
					UserObj.setTestTag(user.IsTestUser);//是否为测试人员,在updateBiz.js用到
					//回调
					callback&&callback(user);
				}else{
					//失败回调
					callback&&callback();
					return data.Message;
				}
			},{ajaxtype:"get"},function(){
				callback&&callback();//失败回调
			},true);
		}else{
			callback&&callback();//未登录
		}
	},
	/*获取用户测试身份: 0普通用户,1测试人员;2开发人员;*/
	getTestTag : function() {
		return localStorage.getItem("USER_ISTEST");
	},
	setTestTag : function(type) {
		setLocalStorage("USER_ISTEST",type);
	}
}

/*设置localStorage,如果value不存在则移除*/
function setLocalStorage(key,value){
	if(value){
		localStorage.setItem(key,value);
	}else{
		localStorage.removeItem(key);
	}
}

/*拼接图片地址*/
function getImgpath(imgpath,size){
	if (!imgpath||imgpath.indexOf("http://")!=-1) {
		return imgpath;
	}else if(size>0){
		var suffix=imgpath.substr(imgpath.lastIndexOf("."),4);
		imgpath=imgpath.replace(suffix,"_"+size+"x"+size+suffix);
	}
	return HostImg+imgpath;
}

/**
 * 联网
 * url 网络地址
 * success 成功回调function(data)
 * param JSON参数
 * err 错误回调
 * hideWait 不显示进度条(默认显示)
 */
function ajaxData(url,success,param,err,hideWait) {
	//统一带参
	param=param||{};
	param["ajaxtype"]=param.ajaxtype||'post';//默认post请求
	param["version"]=localStorage.getItem("version");//版本号,在updateBiz.js中赋值;
	param["tryNum"]=0;//重试第几次
	//如果get请求需拼接参数
	var sendData;
	if (param.ajaxtype=="get") {
		url += url.indexOf("?")==-1 ? "?" : "&" ;
		for(key in param){
			url += key + "=" + param[key] + "&";
		}
	}else{
		sendData = param;
	}
	
	/*封装请求,便于重试*/
	function sendAjax(){
		//重试次数,默认3次
		param.tryNum++;
		if(param.tryNum>3) {
			mui.toast("请求超时,请重试. v"+param.version);
			return;
		}
		//显示进度条 默认显示hideWait==null或false
		if(!hideWait) showWaiting();
	
		//联网请求
		mui.ajax(url,{
			data:sendData,
			type:param.ajaxtype,
			dataType:'json',
			headers:{'Authorization':UserObj.getTokenType()+" "+UserObj.getToken()},
			timeout:10000,
			success:function(data){
				isConsole&&console.log("请求url--> " + url + " 参数--> " + JSON.stringify(sendData) + " 结果-->" + JSON.stringify(data));
				if(!hideWait) plus.nativeUI.closeWaiting();//关闭进度条
				if (data.Status==401){
					//token过期 自动刷token
					if(!window.isGetTK){
						//一个界面只许刷一次token,避免多个请求同时刷token导致死循环
						window.isGetTK=true;
						UserObj.login(UserObj.getUsername(),UserObj.getPassword(),function() {
							sendAjax();
						},function (){
							window.isGetTK=false;
						});
					}else{
						//延时3秒刷新TK后,重新请求
						setTimeout(function(){ sendAjax(); },3000);
					}
				}else{
					var errMsg=success&&success(data);//回调返回具体的信息,则直接提示; 不返回,则不提示
					//其他信息直接提示
					errMsg&&mui.toast(errMsg+" v"+param.version);
				}
			},
			error:function (xhr) {
				isConsole&&console.log("请求url--> " + url + " 参数--> " + JSON.stringify(sendData)+" 异常--> " + xhr.responseText);
				//关闭进度条
				if(!hideWait) plus.nativeUI.closeWaiting();
				//请求失败 特殊状态重新请求3次
				if(param.tryNum<=3 && (xhr.status==406||xhr.status==0)){
					//延时1秒
					setTimeout(function(){ sendAjax(); },1000)
				}else{
					//错误回调
					var res = xhr.status==400 ? JSON.parse(xhr.response) : xhr ;
					var errMsg=err&&err(res);//返回false,不提示; 返回具体信息,则提示具体信息; 否则提示默认信息
					if (errMsg!=false) {
						if(!errMsg) errMsg=res.error_description||("网速繁忙,请重试."+xhr.status+" v"+param.version);
						mui.toast(errMsg);
					}
				}
			}
		});
	}
	//发送请求
	sendAjax();
}

/*显示进度条 modal是否禁止外部可按,默认true不可按*/
function showWaiting(hintText,modal) {
	modal = modal==null? true : false;
	plus.nativeUI.showWaiting(hintText||"请稍后...", {
		width: "50%",
		padding: "16px",
		modal:modal
	});
}

/*打开新界面
 *url: 界面路径;
 *param: 参数json格式
 *isClose: 是否关闭当前页;
 */
function openWindow(url,param,isClose){
	//关闭本界面
	if (isClose) {
		var self=plus.webview.currentWebview();
		setTimeout(function () {
			self.hide("none");
			self.close("none");
		},600)
	}
	//打开新界面
	mui.openWindow({
		url: url,
		id: url,
		extras: param||{},
		waiting:{
      		autoShow:false,
      		title:'正在加载...',
		    options:{
		        width:"50%"
		    }
    	},
		styles:{scrollIndicator:"none"},
		show: {aniShow: "pop-in",duration: 400}
	})
}

/*创建界面,预加载*/
function preloadWindow(url,param,styles) {
	styles=styles||{};
	styles.scrollIndicator="none";
	var page = mui.preload({
	    url:url,
	    id:url,
	    styles:styles,
	    extras:param
	});
	return page;
}

/*显示界面,预加载*/
function showWindow(id_obj,anim,delay) {
	var win= typeof id_obj=="object" ? id_obj : plus.webview.getWebviewById(id_obj);
	if (win) {
		if (delay>0) {
			setTimeout(function () {
				win.show(anim||"pop-in",400);
			},delay);
		} else{
			win.show(anim||"pop-in",400);
		}
	}
}

/*加载图片
 *imgObj_id 图片dom对象或者id
 * 代码拼接的需此格式:
 *<img src="../img/loading-rect.png" data-src="网络地址" onload="loadimg(this)"/>
 * 直接调用则为:loadimg(imgDom,src);
 */
function loadimg(imgObj_id,src,callback){
	var imgDom = (typeof imgObj_id == "object") ? imgObj_id : document.getElementById(imgObj_id);
	if (imgDom) {
		var temp = new Image();
		temp.onload = function() {
			imgDom.onload = null;
			if (callback) {
				callback(imgDom,src);
			} else{
				imgDom.src = temp.src;
				imgDom.classList.add("anim_opacity"); //渐变动画
			}
		};
		temp.src = src||imgDom.getAttribute("data-src");
	}
}

/*--------无任何数据的空布局--------*/
function EmptyBox(option) {
	this.optEmpty={
		warpId: null, //父布局的id
		icon: "../img/logo-gray.png",//图标路径
		tip: "暂无相关数据~", //提示
		btntext: "", //按钮
		btnClick: null
	}
	mui.extend(this.optEmpty,option);
}
EmptyBox.prototype.show = function() {
	var me = this;
	var optEmpty = me.optEmpty; //空布局的配置
	if(optEmpty.warpId == null) return;
	var emptyWarp = document.getElementById(optEmpty.warpId) //要显示空布局的位置
	if(emptyWarp) {
		me.remove(); //先移除,避免重复加入
		//初始化无任何数据的空布局
		var str = '';
		if(optEmpty.icon) str += '<img class="empty-icon" src="' + optEmpty.icon + '"/>'; //图标
		if(optEmpty.tip) str += '<p class="empty-tip">' + optEmpty.tip + '</p>'; //提示
		if(optEmpty.btntext) str += '<p class="empty-btn">' + optEmpty.btntext + '</p>'; //按钮
		me.emptyDom = document.createElement("div");
		me.emptyDom.className = 'empty-box';
		me.emptyDom.innerHTML = str;
		emptyWarp.appendChild(me.emptyDom);
		if(optEmpty.btnClick) { //点击按钮的回调
			var emptyBtn = me.emptyDom.getElementsByClassName("empty-btn")[0];
			emptyBtn.onclick = function() {
				optEmpty.btnClick();
			}
		}
	}
}
/*移除空布局*/
EmptyBox.prototype.remove = function() {
	if(this.emptyDom) {
		var parentDom = this.emptyDom.parentNode;
		if(parentDom) parentDom.removeChild(this.emptyDom);
		this.emptyDom = null;
	}
}

/*遮罩
*标题wb-head 9910
*底部wb-footer 9900
*遮罩wb-shadow 9920
new Shadow(function() {
	//点击遮罩的事件...
	//关闭遮罩
	this.hide();
},9905).show()
 */
function Shadow(click,zIndex) {
	this.zIndex=zIndex;
	this.click=click;
}
Shadow.prototype.show=function() {
	if (document.getElementsByClassName("wb-shadow").length == 0) {
		var shadow = document.createElement("div");
		shadow.setAttribute("class", "wb-shadow");
		document.body.appendChild(shadow);
		if (this.zIndex) shadow.style.zIndex = this.zIndex;
		var self=this;
		shadow.onclick=function() {
			self.click&&self.click();
		}
	}
}
Shadow.prototype.hide=function() {
	var shadow=document.getElementsByClassName("wb-shadow");
	for (var i = 0; i < shadow.length; i++) {
		document.body.removeChild(shadow[i]);
	}
}

/*时间转换
 *type=1; 2013年11月06日 16:05:50
 *type=2; 2013年11月06日
 *type=3; 2013-11-06
 *type=4; 2013.11.06
 *type不传; 2013-11-06 16:05:50
 */
Date.prototype.formats = function(type) {
	var year = this.getFullYear();
	var month = this.getMonth() + 1;
	var d = this.getDate();
	var h = this.getHours();
	var m = this.getMinutes();
	var s = this.getSeconds();
	var add0 = function(num) {
		if (num < 10) {
			num = "0" + num;
		}
		return num;
	}
	if (type == 1) {
		return year + "年" + add0(month) + "月" + add0(d) + "日 " + add0(h) + ":" + add0(m) + ":" + add0(s);
	} else if (type == 2) {
		return year + "年" + add0(month) + "月" + add0(d) + "日";
	} else if(type == 3){
		return year + "-" + add0(month) + "-" + add0(d);
	} else if(type == 4){
		return year + "." + add0(month) + "." + add0(d);
	} else {
		return year + "-" + add0(month) + "-" + add0(d) + " " + add0(h) + ":" + add0(m) + ":" + add0(s);
	}
}
/*字符串时间转毫秒*/
function dateToMsec(str) {
	if(!str){
		return new Date().getTime();
	}else if(str.indexOf("Date")!=-1){
		// "\/Date(1476082500000+0800)\/"---->毫秒1476082500800 //dateStr = Date(1476082500000+0800)
		str.replace(/Date\([\d+]+\)/, function(dateStr) { eval('dateObj = new '+dateStr) });
		return dateObj.getTime();
	}else{
		// "2014/07/10 10:21:13"---->毫秒1404958873000
		str=str.replace("-","/").replace("-","/");//IOS无法解析yyyy-mm-dd时间;需转成yyyy/mm/dd
		return new Date(str).getTime();
	}
}
/*计算两个时间字符串相差的毫秒 (date1,date2时间字符串:2014/07/10 10:21:13)*/
function getDateDiff(date1,date2) {
	return dateToMsec(date1)-dateToMsec(date2);
}

/*给指定元素添加拨打电话的功能*/
function addTelHref(domId,tel){
	var domTel=document.getElementById(domId);
	if(domTel){
		domTel.addEventListener("tap",function () {
			//弹窗提示
			tel = tel || "4008871881";
			mui.confirm('亲,您有任何疑问或建议,欢迎致电联系我们:'+tel, '温馨提示', ['取消', '立即拨打'], function(e){
				if(e.index == 1){
					//如果tel没值,则默认平台的客服电话
                	window.location.href="tel:"+tel;
				}
            });
		})
	}
}

/*复制文本*/
function copyText(text,tip) {
	if(mui.os.android){
		  var Context = plus.android.importClass("android.content.Context");
		  var main = plus.android.runtimeMainActivity();
		  var clip = main.getSystemService(Context.CLIPBOARD_SERVICE);
		  plus.android.invoke(clip,"setText",text);
	}else if(mui.os.ios){
		//获取剪切板
		var UIPasteboard = plus.ios.importClass("UIPasteboard");
		var generalPasteboard = UIPasteboard.generalPasteboard();
		// 设置文本内容:
//		generalPasteboard.setValueforPasteboardType(text, "public.utf8-plain-text");//IOS10异常,需替换为下面两行代码
		generalPasteboard.plusCallMethod({setValue:text, forPasteboardType:"public.utf8-plain-text"});
 		generalPasteboard.plusCallMethod({valueForPasteboardType:"public.utf8-plain-text"});
	}
	mui.toast(tip||'复制成功');//其他异常暂不考虑
}

/*导航切换,按钮变化
 *callback(i,dom)//点击导航按钮的回调,重复点击不回调,i当前点击的下标,this当前点击的dom元素
 *curTab 默认显示那个导航
 */
function initTabClick(parent,child,callback,curTab){
	var curTab=curTab||0;
	$(parent+" "+child).each(function(i,dom) {
		dom.setAttribute("i",i);
		//默认第一个变红
		if(i==curTab) dom.classList.add("tab-active");
	}).click(function() {
		//按钮变红
		var index=Number(this.getAttribute("i"));
		if (curTab!=index) {
			$(parent+" .tab-active").removeClass("tab-active");
			this.classList.add("tab-active");
			//执行回调
			callback&&callback(index,this,curTab);
			//标记
			curTab=index;
		}
	})
}

/*扩展数组方法：查找指定元素的下标*/
Array.prototype.indexOf = function(val) {
    for (var i = 0; i < this.length; i++) {
        if (this[i] == val) return i;
    }
    return -1;
}

/*扩展数组方法:删除指定元素*/
Array.prototype.remove = function(val) {
    var index = this.indexOf(val);
    while(index>-1){
        this.splice(index, 1);
        index = this.indexOf(val);
    }
}

/*安卓双击退出程序*/
function doubleTapQuit(){
	if(mui.os.ios) return;
	//android首页返回键处理,处理逻辑：1秒内,连续两次按返回键，则退出应用
	var first = null;
	mui.back = function() {
		if (!first) {//首次按键，提示‘再按一次退出应用’
			first = (new Date()).getTime();
			mui.toast('再按一次退出应用');
			setTimeout(function() {
				first = null;
			}, 1000);
		} else {
			if ((new Date()).getTime() - first < 1000) {
				plus.runtime.quit();
			}
		}
	};
}

/*前端显示用户输入的地方都需调此方法(用户昵称,评论等),防止html,js注入*/
function removeHtmlTab(str){
	//方法一: 删除所有HTML标签
	return str.replace(/<[^<>]+?>/g,'*');
	//方法二: 转义html标签
//	var  entry = { "'": "&apos;", '"': '&quot;', '<': '&lt;', '>': '&gt;' };
//  return str.replace(/(['")-><&\\\/\.])/g, function ($0) { return entry[$0] || $0; });
}