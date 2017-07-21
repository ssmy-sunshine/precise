/*查询交易凭证*/
function showPayImg(imgId,orderId){
	ajaxData(Host+"api/Order/CheckVoucher?ctId="+orderId,function(data) {
		if (data.Status==200) {
			var imgDom=document.getElementById(imgId);
			if(imgDom){
				imgDom.src=data.Data;
				//点击查看大图
				imgDom.addEventListener("tap",function () {
					showPayImgBig(this.src);
				});
			}
		} else{
			return data.Message
		}
	})
}

/*大图*/
function showPayImgBig(imgpath){
	var bigImgDom=document.getElementById("PayImgWarp");
	if (bigImgDom==null) {
		bigImgDom=document.createElement("div");
		bigImgDom.classList.add("bigimg-warp");
		bigImgDom.style.backgroundImage="url("+imgpath+")";
		bigImgDom.onclick=function() {
			bigImgDom.style.display="none";
		}
	}else{
		bigImgDom.style.display="block";
	}
}