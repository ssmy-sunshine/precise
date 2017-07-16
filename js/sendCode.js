/*初始化获取验证码的按钮
 sendCodeId 发送验证码按钮的id
 inputTelId 获取手机号输入框的id
 isBuyName 是否根据用户名获取 默认false
 */
function initSendCode(sendCodeId,inputTelId,isBuyName) {
	//获取验证码
	var codeTimer;
	$("#"+sendCodeId).click(function() {
		//如果在倒计时,则不执行
		if (codeTimer&&codeTimer.isRunning) {
			return;
		}
		//手机号
		var tel=document.getElementById(inputTelId).value;
		var url;
		if (isBuyName) {
			if(!tel.length){
				mui.toast("请输入用户名");
				return;
			}
			url=Host+"api/ValiCode/GetCodeByName?name="+tel;
		} else{
			if (!isTel(tel)) {
				mui.toast("手机号不正确");
				return;
			}
			url=Host+"api/ValiCode/GetCode?phone="+tel;
		}
		//发送验证码
		ajaxData(url, function(data) {
			if(isBuyName&&data.Status==200) {
				mui.confirm("验证码已发送至"+data.Data+", 请注意查收 ~");
			} else if(data.Status==1) {
				mui.toast("验证码发送成功");
			} else{
				return data.Message;
			}
		}, {ajaxtype:"get"},function(){
			codeTimer.isStop=true;
		});
		
		//倒计时
		if (!codeTimer) {
			var codeBtn=$(this);
			codeTimer=new downTimer(60,function(s) {
				codeBtn.html("重新发送(" + s + ")");
			}, function(){
				codeBtn.html("发送验证码");
			})
		}
		codeTimer.start();
	});
}

/*验证是否为手机号*/
function isTel(tel){
    return /^1[3|4|5|7|8]\d{9}$/.test(tel);
}
		
/*倒计时*/
function downTimer(duration,runningCB,stopCB) {
	this.isRunning=false;//是否正在倒计时
	this.isStop=false;//是否要中止
	this.duration = duration;//倒计时秒数
	this.runningCB=runningCB;//倒计时进行中的回调
	this.stopCB=stopCB;//倒计时结束回调
	//开始倒计时,如果已经启动则不再启动
	this.start=function() {
		if(!this.isRunning){
			this.isRunning=true;
			this.duration = duration;//倒计时秒数
			this.countdown();
		}
	}
	//倒计时进行中
	this.countdown=function() {
		var self=this;
	    if (self.duration == 0||self.isStop) {
	    	//停止的回调
	    	self.isRunning=false;
	    	self.stopCB&&self.stopCB()
	    } else {
	        self.duration--;
	        setTimeout(function() { 
	           self.countdown()//此处不能用this
	        }, 1000);
	        //倒计时中的回调
	        self.runningCB&&self.runningCB(self.duration)
	    }
	}
}