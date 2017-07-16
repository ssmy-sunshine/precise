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
		var Uid=localStorage.getItem("Uid")||0;
		if (Uid) Uid=Number(Uid);
		return Uid;
	},
	setUid : function(Uid){
		setLocalStorage("Uid",Uid);
	},
	/*获取本地缓存的用户手机号*/
	getTel : function() {
		return localStorage.getItem("Mnum");
	},
	setTel : function(tel){
		setLocalStorage("Mnum",tel);
	},
	/*获取用户头像,如果传imgpath则返回拼接的头像地址,如果不传则返回当前用户的头像地址*/
	getIcon : function(imgpath) {
		if(imgpath){
			return getImgpath(imgpath);
		}else{
			return localStorage.getItem("UserIcon")||"";
		}
	},
	setIcon : function(imgpath){
		setLocalStorage("UserIcon",UserObj.getIcon(imgpath));
	},
	/*获取用户昵称*/
	getNickname : function() {
		return localStorage.getItem("UNickName");
	},
	setNickname : function(nickname) {
		setLocalStorage("UNickName",nickname);
	},
	/*获取用户注册状态: 0完成微信注册; 1注册手机号; 2选择礼包; 3已付款成店主*/
	getRegisState : function() {
		return localStorage.getItem("RegisState");
	},
	setRegisState : function(regisState) {
		setLocalStorage("RegisState",regisState);
	},
	/*获取用户会员等级: 2店主,3主管,4经理*/
	getLevelTag : function() {
		return localStorage.getItem("UserTypTag");
	},
	setLevelTag : function(userTypTag) {
		setLocalStorage("UserTypTag",userTypTag);
	},
	getLevelName : function() {
		return localStorage.getItem("LevelName")||"Lv.0 普通用户";
	},
	setLevelName : function(levelName) {
		setLocalStorage("LevelName",levelName);
	},
	/*获取用户测试身份: 0普通用户,1测试人员;2开发人员;*/
	getTestTag : function() {
		return localStorage.getItem("USER_ISTEST");
	},
	setTestTag : function(type) {
		setLocalStorage("USER_ISTEST",type);
	},
	/*获取用户登录的token*/
	getTK : function() {
		return localStorage.getItem("TK");
	},
	setTK : function(token) {
		setLocalStorage("TK",token);
	},
	/*获取用户是否登录 isToLogin默认跳转登录*/
	isLogin : function(isToLogin) {
		if (UserObj.getUid()&&UserObj.getTK()) {
			return true;
		} else{
			if(isToLogin!=false) openWindow("../account/login.html");
			return false;
		}
	},
	/*刷新TK*/
	flushTK : function(success,err){
		var TK = UserObj.getTK();//TK
		if (TK) {
			ajaxData(Host+"token", function(data) {
				UserObj.setTK(data.access_token);//更新TK
				success&&success();//成功回调
			},{grant_type:"refresh_token", refresh_token:TK},function(e) {
				err&&err(e);//失败回调
			},true);
		}else{
			openWindow("../account/login.html");//如果没有TK,则去登录页
		}
	},
	/*获取用户信息*/
	getUserinfo : function(callback){
		if(!UserObj.isLogin(false)){
			callback&&callback();
			return;
		}
		ajaxJson(Host+"ExpServiceInterface/MemberRightsInterface/UserMessageByShopkeeper.ashx", function(user){
			//{"UNickName":"135**617","WBIMG":"/Images/WBimg/usericon-max.png","ShopName":"135**617的店铺","amount":"0.00","Ex1":"4","visited":"0","ShopImg":"/Images/WBimg/ShopHead.jpg","ShopID":"176278","RegisState":"3","IsTestUser":"2","UserTypeTag":"2","UserType":"Lv.1 店主","RegisTime":"2017/5/3 15:27:49","FatherUID":"1254","ShopCode":"193907"}
			//先缓存变量,其他界面公用
			UserObj.setIcon(user.WBIMG);//头像
			UserObj.setNickname(user.UNickName);//用户名
			UserObj.setShopId(user.ShopID);//店铺id
			UserObj.setShopCode(user.ShopCode);//店铺邀请码
			UserObj.setShopImg(user.ShopImg);//店铺背景
			UserObj.setShopName(user.ShopName);//店名
			UserObj.setRegisState(user.RegisState);//注册状态
			UserObj.setLevelTag(user.UserTypeTag);//会员级别id
			UserObj.setLevelName(user.UserType);//会员级别名称
			UserObj.setTestTag(user.IsTestUser);//是否为测试人员,在updateBiz.js用到
			UserObj.setFatherUID(user.FatherUID);//邀请注册的用户id
			//回调
			callback&&callback(true);
		},null,function(){
			callback&&callback();
		},true);
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
	param["Uid"]=UserObj.getUid();
	param["TK"]=UserObj.getTK();
	param["ajaxtype"]=param.ajaxtype||'post';
	param["device"]=plus.device.model+" "+plus.os.version;//设备信息:iPhone 10.0.2; HUAWEI MT7-TL00 4.4.2
	param["IMEI"]=plus.device.uuid;//设备号
	param["version"]=localStorage.getItem("version");//版本号,在updateBiz.js中赋值;
	
	/*封装请求,便于重试*/
	function sendAjax(){
		//重试次数,默认3次
		if(!param.tryNum) param.tryNum=0;
		if(param.tryNum>=3) {
			mui.toast("请求超时,请重试. v"+param.version);
			return;
		}
		param.tryNum++;
		//显示进度条 默认显示hideWait==null或false
		if(!hideWait) showWaiting();
		//联网请求
		mui.ajax(url,{
			data:param,
			type:param.ajaxtype,
			dataType:'json',
			timeout:10000,
			success:function(data){
				isConsole&&console.log("请求url--> " + url + " 参数--> " + JSON.stringify(param) + " 结果-->" + JSON.stringify(data));
				//关闭进度条
				if(!hideWait) plus.nativeUI.closeWaiting();
				//回调
				var errMsg=success&&success(data);//返回401,自动刷TK; 返回具体的信息,则直接提示; 不返回,则不提示
				if (errMsg==401){
					//token过期 自动刷token
					if(!window.isGetTK){
						//一个界面只许刷一次token,避免多个请求同时刷token导致死循环
						window.isGetTK=true;
						UserObj.flushTK(function() {
							param.TK=UserObj.getTK();;
							sendAjax();
						},function (){
							window.isGetTK=false;
						});
					}else{
						//延时3秒刷新TK后,重新请求
						setTimeout(function(){
							//isGetTK=true;其他请求已刷过TK;则更新TK,继续请求,重新请求3次
							param.TK=UserObj.getTK();;
							sendAjax();
						},3000);
					}
				} else if (errMsg){
					//其他信息直接提示
					mui.toast(errMsg+" v"+param.version);
				}
			},
			error:function (xhr) {
				isConsole&&console.log("请求url--> " + url + " 参数--> " + JSON.stringify(param)+" 异常--> status=" + xhr.status+";statusText="+xhr.statusText);
				//关闭进度条
				if(!hideWait) plus.nativeUI.closeWaiting();
				//请求失败 特殊状态重新请求3次
				if(param.tryNum<3 && (xhr.status==406||xhr.status==0)){
					//延时1秒
					setTimeout(function(){
						sendAjax();
					},1000)
				}else{
					//错误回调
					var errMsg=err&&err();//返回false,不提示; 返回具体信息,则提示具体信息; 否则提示默认信息
					if (errMsg!=false) {
						errMsg=errMsg||("网速繁忙,请重试."+xhr.status+" v"+param.version);
						mui.toast(errMsg);
					}
				}
			}
		});
	}
	//发送请求
	sendAjax();
}

/*获取json,参数param默认带TK和UID*/
function ajaxJson (url,success,param,err,hideWait) {
	//传参类型和返回数据类型都是json字符串
	ajaxData(url,success,param,err,hideWait,false,true,true);
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