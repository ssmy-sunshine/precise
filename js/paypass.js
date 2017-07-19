/*验证支付密码*/
function checkPayPass(success, err){
	var str='<div class="middle-content">';
	str+='<p class="paytitle">交易密码</p>';
	str+='<input class="payinput" type="password" placeholder="请输入交易密码"/>';
	str+='<p class="paybtn paycancle">取消</p><p class="paybtn payok">确定</p>';
	str+='</div>';
	
	var warpDom=document.createElement("div");
	warpDom.className="paypass middle-warp";
	warpDom.innerHTML=str;
	document.body.appendChild(warpDom);
	
	var payinputDom=warpDom.getElementsByClassName("payinput")[0];
	var paycancleDom=warpDom.getElementsByClassName("paycancle")[0];
	var payokDom=warpDom.getElementsByClassName("payok")[0];
	
	//取消
	paycancleDom.addEventListener("tap",function (e) {
		e.stopPropagation();
		document.body.removeChild(warpDom);
		err&&err();
	})
	
	//确定
	payokDom.addEventListener("tap",function (e) {
		e.stopPropagation();
		var paypass=payinputDom.value;
		if (paypass.length<5) {
			mui.toast("交易密码不正确")
		}else{
			//联网验证
			ajaxData(Host+"api/Account/TradingVerify?tPwd="+paypass, function(data) {
				if (data.Status==200){
					document.body.removeChild(warpDom);//关闭
					success&&success();//回调
				}else{
					return data.Message;
				}
			},{ajaxtype:"get"});
		}
	})
}