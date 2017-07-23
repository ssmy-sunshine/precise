/*拍照或从相册获取照片*/
function getMobilePhoto(success){ 
	plus.nativeUI.actionSheet({
		title: "选择照片",
		cancel: "取消",
		buttons: [{title:"拍照"},{title: "从相册中选择"}]
	},function(e) {
		if (e.index==1) {
			takePicture(success);
		} else if (e.index==2){
			openGallery(success);
		}
	});
}

/*拍照*/
function takePicture(success){
	var cmr = plus.camera.getCamera();
	cmr.captureImage(function(p){
		plus.io.resolveLocalFileSystemURL(p,function(entry){
			var path = entry.toLocalURL();
			console.log("拍照=="+path);
			success&&success(path);
		},function(e){
			mui.toast("读取拍照文件错误：" + e.message);
		});
	},function(e){},{
		filename: "_doc/camera/",
		index: 1
	});
}

/*打开相册*/
function openGallery(success) {
	plus.gallery.pick(function(path){
		console.log("从相册选择照片=="+path);
		success&&success(path);
	},function(e){
		if (e.code==-3310||e.code==8) {
			mui.toast("您已禁止APP访问相册,请设置开启权限");
		}
	},{
		filter: "image",
		multiple:false,
		system:false
	});
}

/*图片压缩类
 imgpath 要压缩的图片,可以是本地 也可以是网络图
 width 压缩后的宽度
 callback(imgZip) 压缩回调; 成功返回压缩后的地址,异常返回null
 tag  当循环调用此方法时用来标识是哪张图片
 * */
function ZipBiz(imgpath,callback,width,tag){
	this.isLog=true;
	this.imgpath=imgpath;
	this.tag = tag;
	this.width=width||plus.screen.resolutionWidth;
	this.callback=callback;
	//压缩图
	this.imgZip="file://" + plus.io.convertLocalFileSystemURL("_doc/zip/" + new Date().getTime() + ".jpg");
}

/*开始压缩*/
ZipBiz.prototype.start=function(){
	var self=this;
	//如果是网络地址则先下载
	if (self.imgpath.indexOf("http") != -1) {
		self.loadImage(function(imgpath) {
			self.imgpath=imgpath;
			self.compressImage();
		});
	}else{
		self.compressImage();
	}
}

/*执行压缩*/
ZipBiz.prototype.compressImage=function(){
	showWaiting();
	var self=this;
	var zipParam={
		src: self.imgpath,
		dst: self.imgZip,
		width: self.width+"px",
		overwrite: true,
		quality: 50
	};
	plus.zip.compressImage(zipParam, function(d){
		plus.nativeUI.closeWaiting();
		self.isLog&&console.log("压缩后的路径="+d.target+",大小="+(d.size/1024)+"k,width="+d.width+",height="+d.height);
		self.callback(d.target,self.tag);
	}, function(e){
		plus.nativeUI.closeWaiting();
		self.callback();
		self.isLog&&mui.toast("压缩异常="+JSON.stringify(e));
	});
}

/*下载图片*/
ZipBiz.prototype.loadImage=function(callback){
	var self=this;
	showWaiting();
	var loadPath=this.imgpath;
	var savePath='_downloads/image/' + new Date().getTime() + '.jpg';
	self.isLog&&console.log("loadPath="+loadPath+",encode="+encodeURI(loadPath)+",savePath="+savePath);
	if(escape(loadPath).indexOf("%u")>=0){
		loadPath=encodeURI(loadPath);//中文地址需编码,否则400下载异常
	}
	var dtask = plus.downloader.createDownload(loadPath, {
			"filename": savePath,
			"timeout": 10,
			"retry": 1
		},
		function(d, status){
			plus.nativeUI.closeWaiting();
			if (status == 200) {
				self.isLog&&console.log("图片下载成功=="+d.filename);
				var imgPath="file://" +plus.io.convertLocalFileSystemURL(d.filename);
				callback&&callback(imgPath);
			}else{
				self.isLog&&mui.toast("图片下载失败"+status);
				self.callback();
			}
		});
	dtask.start();
}

/*上传--plus.uploader*/
function upLoadFileByPlus(path,success,param){
	var isLog=true;
	showWaiting("图片上传中...");
	isLog&&console.log("图片上传中: " + path);
	var task = plus.uploader.createUpload(Host + "api/Order/UploadFile", {
			method: "POST",
			timeout: 20,//超时20s
			retryInterval: 1 //重试间隔1s;默认重试次数retry=3
		},
		function(t, status) {
			plus.nativeUI.closeWaiting();
			if(status == 200) {
				var result = t.responseText;
				console.log("上传回调=="+result);
				success&&success(result);
			} else {
				mui.toast("上传失败: " + status);
				isLog&&console.log("上传失败: " + status)
			}
		}
	);
	task.addFile(path, {key: ""+(new Date().getTime()) });
	for(key in param){
		task.addData(key, param[key]);
	}
	task.start();
}

/*上传--js的base64*/
function upLoadFileByBase64(path,success,CashTransactionId){
	//转base64
	getBase64Image(path,function(base64,ext){
		//上传
		base64=base64.split(",")[1];//去掉前缀
		var param={ajaxtype:"post", CashTransactionId:CashTransactionId, FileType:ext.toUpperCase(), Base64File:base64};
		ajaxData(Host+"api/Order/UploadFile",function(data){
			if (data.Status==200) {
				success&&success(data);
			} else{
				return data.Message
			}
		},param)
	});
}

/*js把img转base64*/
function getBase64Image(imgpath,callback) {
	var img = new Image();
	img.src = imgpath;
	img.onload = function(){
		var canvas = document.createElement("canvas");
		canvas.width = img.width;
		canvas.height = img.height;
		var ctx = canvas.getContext("2d");
		ctx.drawImage(img, 0, 0, img.width, img.height);
		var ext = img.src.substring(img.src.lastIndexOf(".") + 1).toLowerCase();//后缀
		var base64 = canvas.toDataURL("image/" + ext);
		callback&&callback(base64,ext);
	} 
}  

/*打开相册或者拍照压缩上传*/
function uploadMobileBase64(success,CashTransactionId){
	//打开相册或者拍照
	getMobilePhoto(function(path) {
		//压缩
		new ZipBiz(path,function(zipPath){
			upLoadFileByBase64(zipPath,success,CashTransactionId)
		}).start();
	})
}