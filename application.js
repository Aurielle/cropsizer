//=== Globals ==================================================================
var canvas, rectangle, ctx, ctx0;
var cropx0,cropx1,cropy0,cropy1;
var k;
var rect = {},
    action_selection = false,
    mouseX, 
    mouseY;
var sourceFilename;    
    
var ratio = 1;

var xoffset=yoffset= 0;
    
var rectangle_sizing = false;

//=== Clipboard ================================================================
document.onkeydown = function(e) {return on_keyboard_action(e); }
document.onkeyup = function(e) {return on_keyboardup_action(e); }

var ctrl_pressed;

function on_keyboard_action(e){
    k = (e.keyCode ? e.keyCode : e.which); 
    //ctrl
   	if(k==17){
			if(ctrl_pressed == false)
				ctrl_pressed = true;
			if (!window.Clipboard)
				pasteCatcher.focus();
			}
    }
function on_keyboardup_action(e){
	k = (e.keyCode ? e.keyCode : e.which);
	if(k==17) 
		ctrl_pressed = false;		
	}

window.addEventListener("paste", pasteHandler);
function pasteHandler(e){
	if(e.clipboardData) {
		var items = e.clipboardData.items;
		if (items){
			for (var i = 0; i < items.length; i++) {
				if (items[i].type.indexOf("image") !== -1) {
					var blob = items[i].getAsFile();
					var URLObj = window.URL || window.webkitURL;
					var source = URLObj.createObjectURL(blob);
					paste_createImage(source);
					}
				}
			}
		// If we can't handle clipboard data directly (Firefox),
		// we need to read what was pasted from the contenteditable element
		else{
			}
		}
	else{
		setTimeout(paste_check_Input, 1);
		}
	}
function paste_check_Input(){
	var child = pasteCatcher.childNodes[0];
	pasteCatcher.innerHTML = "";
	if (child){
		if (child.tagName === "IMG"){
			paste_createImage(child.src);
			}
		}
	}
function paste_createImage(source){
  console.log("Pasting from clipboard...");
	var pastedImage = new Image();
	$("#droptarget").hide();
	pastedImage.onload = function() {
        $("#canvas").show();
        $("#metrics").show();
        canvas.width = pastedImage.width;
        canvas.height = pastedImage.height;
        $("#metrics").css("width",canvas.width+"px");
        $("#metrics").css("height",canvas.height+"px");
        $("#sbDim").html(canvas.width+" × "+canvas.height);
        console.log("Canvas size: W="+canvas.width + ", H=" + canvas.height);
    	ctx.fillStyle="white";
		ctx.fillRect(0, 0, canvas.width, canvas.height);
	    
        ctx.drawImage(pastedImage, 0, 0);
		}
	pastedImage.src = source;	
	$("#frmAngle")[0].value=0;
    $("#slrotate").slider("value",0);

	}


////////////////////////////////////////////////////////////////////
// gamma engine source: http://jsfiddle.net/gamealchemist/yqvmC/
// Slider and output setup

// zkusit https://github.com/talentedmrjones/Javascript-Canvas-Tools
// end gamma engine
//
////////////////////////////////////////////////////////////////////////


//zdroj: http://stackoverflow.com/questions/2303690/resizing-an-image-in-an-html5-canvas
function resample_hermite(canvas, W, H, W2, H2){
	var time1 = Date.now();
	var img = canvas.getContext("2d").getImageData(0, 0, W, H);
	var img2 = canvas.getContext("2d").getImageData(0, 0, W2, H2);
	var data = img.data;
	var data2 = img2.data;
	var ratio_w = W / W2;
	var ratio_h = H / H2;
	var ratio_w_half = Math.ceil(ratio_w/2);
	var ratio_h_half = Math.ceil(ratio_h/2);
	for(var j = 0; j < H2; j++){
		for(var i = 0; i < W2; i++){
			var x2 = (i + j*W2) * 4;
			var weight = 0;
			var weights = 0;
			var gx_r = gx_g = gx_b = gx_a = 0;
			var center_y = (j + 0.5) * ratio_h;
			for(var yy = Math.floor(j * ratio_h); yy < (j + 1) * ratio_h; yy++){
				var dy = Math.abs(center_y - (yy + 0.5)) / ratio_h_half;
				var center_x = (i + 0.5) * ratio_w;
				var w0 = dy*dy //pre-calc part of w
				for(var xx = Math.floor(i * ratio_w); xx < (i + 1) * ratio_w; xx++){
					var dx = Math.abs(center_x - (xx + 0.5)) / ratio_w_half;
					var w = Math.sqrt(w0 + dx*dx);
					if(w >= -1 && w <= 1){
						//hermite filter
						weight = 2 * w*w*w - 3*w*w + 1;
						if(weight > 0){
							dx = 4*(xx + yy*W);
							gx_r += weight * data[dx];
							gx_g += weight * data[dx + 1];
							gx_b += weight * data[dx + 2];
							gx_a += weight * data[dx + 3];
							weights += weight;
							}
						}
					}		
				}
			data2[x2]     = gx_r / weights;
			data2[x2 + 1] = gx_g / weights;
			data2[x2 + 2] = gx_b / weights;
			data2[x2 + 3] = gx_a / weights;
			}
		}
	canvas.width=W2;
	canvas.height=H2;
    $("#sbDim").html(canvas.width+" × "+canvas.height);
	$("#metrics").css("width",canvas.width+"px");
	$("#metrics").css("height",canvas.height+"px");		 
	canvas.getContext("2d").fillStyle="white";
	canvas.getContext("2d").fillRect(0, 0, Math.max(W, W2), Math.max(H, H2));
	canvas.getContext("2d").putImageData(img2, 0, 0);
    	console.log("hermite = "+(Math.round(Date.now() - time1)/1000)+" s");
	}


//=== Toolbar ==================================================================
function generate(){
  console.log("Executed: generate()");
  $("#generated").remove();
  var generated = document.createElement("img");
  var filetype;
  if ($("#cbFiletype")[0].checked) {filetype="jpeg" } else {filetype="png"} ;
  generated.src = canvas.toDataURL("image/"+filetype);
  generated.alt = sourceFilename;
  generated.id="generated";
  $("#workarea").append(generated);
} 

//=== rectangle ================================================================
function getCoords(e){
  xoffset = $("#metrics")[0].offsetLeft;
  yoffset = $("#metrics")[0].offsetTop;
  mouseX = e.clientX - xoffset;
  mouseY = e.clientY - yoffset;
}

function mouseDown(e) {
  getCoords(e);
  $("#rectangle").hide();

  rect.Y1 = mouseY;
  rect.X1 = mouseX;
  rect.startY = mouseY;
  rect.startX = mouseX;  
  rect.endY = mouseY;
  rect.endX = mouseX;
  rect.w = 0;
  rect.h = 0;
}

function rectmouseDown(e) {
  getCoords(e);
  rect.rx = mouseX-rect.startX;
  rect.ry = mouseY-rect.startY;
}

function rectmouseMove(e) {
  getCoords(e);
   if(e.which == 1) {
  	
  	var newStartX=mouseX-rect.rx;
  	var newStartY=mouseY-rect.ry;
  	if (newStartX<0) {newStartX=0}
  	if (newStartY<0) {newStartY=0}
  	if (newStartX+rect.w>=canvas.width) {newStartX=rect.X1}
  	if (newStartY+rect.h>=canvas.height) {newStartY=rect.Y1}
  	
  	rect.X1=newStartX;
  	rect.Y1=newStartY;
  	rect.endX=rect.X1+rect.w;
  	rect.endY=rect.Y1+rect.h;
  	draw();
  }
}


function mouseMove(e) {
  getCoords(e);
  if(e.which == 1){
    if(rectangle_sizing == false){
      $("#rectangle").css("z-index","2");
      $("#rectangle").show();
      $("#metrics").css("cursor","crosshair");
      rectangle_sizing = true;
      //spocitani ratia ze selectu
      var frmRatio = $("#options_crop")[0];
      
      //var frmRatioVal = frmRatio.options[frmRatio.selectedIndex].value;
      var wRatio=Math.round($("#frmWratio")[0].value); 
      var hRatio=Math.round($("#frmHratio")[0].value); 
      console.log(wRatio+":"+hRatio);
      if (wRatio>0 && hRatio>0) {ratio = hRatio/wRatio;} else {ratio=0}
    }
    
    rect.endX=mouseX;
    
    if(ratio !== 0){
      if((mouseX>rect.X1 && mouseY>rect.Y1)	|| (mouseX<rect.X1 && mouseY<rect.Y1)) {
      	rect.endY = rect.Y1+(mouseX-rect.X1)*ratio;
      } else {
      	rect.endY = rect.Y1-(mouseX-rect.X1)*ratio;
      }
    }
    else{
  	  rect.endY=mouseY;
    }    
    draw();
  }
  else{
    rectangle_sizing = false;
    $("#rectangle").css("z-index","20");
    $("#metrics").css("cursor","crosshair");
  }
  var w,h;
  if(rect.w === undefined){w = 0; h = 0;} else{w = rect.w;h = rect.h;}
  if(w<0) w = 0; if(h<0) h = 0;
  h = Math.round(h);
  //$("#coords").html("Kurzor: "+mouseX+" × "+mouseY+" px<br />Výběr: "+ w + " × " + h + " px");
  $("#sbCoords").html(w + " × " + h + " px");
  //$("#sbCoords").html(rect.startX+ ":" +rect.startY+ " " +rect.endX+ ":" +rect.endY);
}

function draw() {
  rect.startX=Math.min(rect.X1,rect.endX);
  rect.startY=Math.min(rect.Y1,rect.endY);
  rect.w=Math.abs(rect.X1-rect.endX);
  rect.h=Math.abs(rect.Y1-rect.endY);
  $("#rectangle").css('left', (rect.startX+xoffset)+'px');
  $("#rectangle").css('top', (rect.startY+yoffset)+'px');
  $("#rectangle").css('height', rect.h+'px');
  $("#rectangle").css('width', rect.w+'px');
}


//== UI helpers ================================================================
function ui_set_resize_values(size){
  var sizeChops = size.split(";");
  $("#frmWidth").val(sizeChops[0]);
  $("#frmHeight").val(sizeChops[1]); 
}
function ui_set_ratio_values(size){
  var sizeChops = size.split(";");
  $("#frmWratio").val(sizeChops[0]);
  $("#frmHratio").val(sizeChops[1]); 
}


function donew() {
	console.log("Clicked: #btn_new");
	sourceFilename="";
    $("#generated").remove();
    ctx.clearRect(0,0,canvas.width,canvas.height);
    $("#canvas").hide();
    $("#droptarget").show();
    $("#metrics").hide();
    $("#modeswitch").html="canvas";
 	$("#modeswitch").dblclick(function() {
      	goimage();
  	}); 
  
    rect = {};
    $("#rectangle").hide();
    $("#frmAngle")[0].value=0;
    $("#slrotate").slider("value",0);

}


function docrop(){
    console.log("Clicked: #btn_crop");
    $("#rectangle").hide();
    
    var crop = ctx.getImageData(rect.startX, rect.startY, rect.w, rect.h);
    canvas.width = rect.w;
    canvas.height = rect.h;
    $("#sbDim").html(canvas.width+" × "+canvas.height);
    $("#metrics").css("width",canvas.width+"px");
    $("#metrics").css("height",canvas.height+"px");		 
		
    ctx.putImageData(crop,0,0);
    $("#canvas").show();
    $("#generated").remove();
    $("#frmAngle")[0].value=0;
    $("#slrotate").slider("value",0);
   // generate();
 }
function doresize() {
	   console.log("Clicked: #btn_resize");
	//když to není zadané, nové rozměry se dopočítají podle ratio
    var w = $("#frmWidth")[0].value || canvas.width*$("#frmHeight")[0].value/canvas.height;
    var h = $("#frmHeight")[0].value || canvas.height*$("#frmWidth")[0].value/canvas.width;		
    var w= Math.round(w);
    var h= Math.round(h);
    console.log("w × h:"+w+" × "+h);
    
	//když zmenšujeme přes 50%, tak se spustí kvalitnější zmenšovací rutina
	if (w/canvas.width<0.5) {
		 resample_hermite(canvas,canvas.width,canvas.height,w,h);
	} else  {
		var canvas_temp = document.createElement("canvas");
	    var ctx_temp = canvas_temp.getContext("2d");
	    canvas_temp.width = w;
	    canvas_temp.height = h;
	    ctx_temp.drawImage(canvas, 0, 0, w, h);
	    var sized = ctx_temp.getImageData(0, 0, w, h);
		canvas.width = w;
	    canvas.height = h;
	    $("#sbDim").html(canvas.width+" × "+canvas.height);
		$("#metrics").css("width",canvas.width+"px");
        $("#metrics").css("height",canvas.height+"px");		 
		
	    ctx.putImageData(sized,0,0);
	}   
	$("#frmAngle")[0].value=0;
	$("#slrotate").slider("value",0);
	$("#canvas").show();
	$("#generated").remove();
}
function dorotate(angle) {
	if (document.getElementById("generated")=== null) { 
	generate();
	}
  	var obrimage=document.getElementById("generated");
  	obrimage.style.display="none";
  	$("#canvas").show();
	var newWidth= Math.abs(obrimage.width*Math.cos(angle*Math.PI/180))+Math.abs(obrimage.height*Math.sin(angle*Math.PI/180)); 
	var newHeight=Math.abs(obrimage.width*Math.sin(angle*Math.PI/180))+Math.abs(obrimage.height*Math.cos(angle*Math.PI/180)); 
	canvas.width=newWidth;
	canvas.height=newHeight;
	$("#sbDim").html(canvas.width+" × "+canvas.height);

	$("#metrics").css("width",canvas.width+"px");
    $("#metrics").css("height",canvas.height+"px");		 
		
 	ctx.clearRect(0,0,canvas.width,canvas.height);

    // save the unrotated context of the canvas so we can restore it later
    // the alternative is to untranslate & unrotate after drawing
    ctx.save();
	
	
    // move to the center of the canvas
    ctx.translate(canvas.width/2,canvas.height/2);

    // rotate the canvas to the specified degrees
    ctx.rotate(angle*Math.PI/180);
		
	// draw the image
    // since the context is rotated, the image will be rotated also
	
    ctx.drawImage(obrimage,-obrimage.width/2,-obrimage.height/2);

    // we’re done with the rotating so restore the unrotated context
    ctx.restore();
}

function showHist() {
	var CanvasImg = new CanvasTools.Canvas('canvas');
	var CanvasHistogram = new CanvasTools.Canvas('cnvHist');
	//CanvasImg.getHistogram("rgb", CanvasHistogram);				
	CanvasImg.getHistogram("luminosity", CanvasHistogram);				
}

function checkZoom() {
	var screenCssPixelRatio = Math.round((window.outerWidth) / window.innerWidth*100)/100;
	if (screenCssPixelRatio>0) {
		var zoomLevel=Math.round(1/screenCssPixelRatio*100);
		console.log("zoom: "+zoomLevel+"%");
		$("#panel").css("zoom",zoomLevel+"%");
		$("#dlgLevels").css("zoom",zoomLevel+"%");	
		$("#statusbar").css("zoom",zoomLevel+"%");
		$("#sbZoom").html(Math.round(screenCssPixelRatio*100)+"%");
	}

}

//=== Init =====================================================================

function init(){
  canvas = document.getElementById("canvas");
  ctx = canvas.getContext("2d");
  ctrl_pressed = false;
  sourceFilename="";
  canvas.width=0;
  canvas.height=0;
  $("#slrotate").slider({
  	min: -90,
  	max: 90,
  	value: 0,
  	slide: function( event, ui ) {
  		$("#frmAngle")[0].value=ui.value;
  		dorotate(ui.value);
  	}
  });
  
  //dialog Adjust Levels
  $("#slinrange").slider({
  	min: 0,
  	max: 255,
  	range:true,
  	values: [0,255],
  	slide: function( event, ui ) {
  		$("#frminrangemin")[0].value=ui.values[0];
  		$("#frminrangemax")[0].value=ui.values[1];
  	}  
  });
  $("#sloutrange").slider({
  	min: 0,
  	max: 255,
	range:true,  	
  	values: [0,255],
  	slide: function( event, ui ) {
  		$("#frmoutrangemin")[0].value=ui.values[0];
  		$("#frmoutrangemax")[0].value=ui.values[1];
  	}  
  });
  $("#slgamma").slider({
  	min: 0.1,
  	max: 2,
  	step: 0.05,
  	value: 1,
  	slide: function( event, ui ) {
  		$("#frmgamma")[0].value=ui.value;
  	}    	
  });
  
  $("#frminrangemin")[0].value=0;
  $("#frminrangemin").on("change", function (e) {
  	var dolni=$("#frminrangemin")[0].value || 0;
  	var horni=$("#frminrangemax")[0].value || 0;
  	if (dolni<0) {dolni=0};
  	if (horni-dolni<0) {dolni=horni};
  	$("#frminrangemin")[0].value=dolni;
   	$("#slinrange").slider("values",[dolni,horni]);
  });	

  $("#frmoutrangemin")[0].value=0;
  $("#frmoutrangemin").on("change", function (e) {
  	var dolni=$("#frmoutrangemin")[0].value || 0;
  	var horni=$("#frmoutrangemax")[0].value;
  	if (dolni<0) {dolni=0};
  	if (horni-dolni<0) {dolni=horni};
  	$("#frmoutrangemin")[0].value=dolni;
   	$("#sloutrange").slider("values",[dolni,horni]);
  });	

  $("#frminrangemax")[0].value=255;
  $("#frminrangemax").on("change", function (e) {
  	var dolni=$("#frminrangemin")[0].value || 0;
  	var horni=$("#frminrangemax")[0].value || 0;
  	if (horni>255) {horni=255};
  	if (horni-dolni<0) {horni=dolni};
  	$("#frminrangemax")[0].value=horni;
   	$("#slinrange").slider("values",[dolni,horni]);
  });	

  $("#frmoutrangemax")[0].value=255;
   $("#frmoutrangemax").on("change", function (e) {
  	var dolni=$("#frmoutrangemin")[0].value || 0;
  	var horni=$("#frmoutrangemax")[0].value || 0;
  	if (horni>255) {horni=255};
  	if (horni-dolni<0) {horni=dolni};
  	$("#frmoutrangemax")[0].value=horni;
   	$("#sloutrange").slider("values",[dolni,horni]);
  });	

  $("#frmgamma")[0].value=1.0;
  $("#frmgamma").on("change", function (e) {
  	var dolni=$("#frmgamma")[0].value || 0;
  	if (dolni<0.1) {dolni=0.1}
  	$("#frmgamma")[0].value=dolni;
  	$("#slgamma").slider("value",dolni);
  });	

  $("#cnvHist").click(function() {
  	showHist();
  });
  $("#btLevelsApply").click(function() {
  	var time1 = Date.now();
	var Canvas = new CanvasTools.Canvas('canvas');
  	Canvas.adjust('levels',
				{
					gamma:$("#frmgamma")[0].value
					,input:{
						min:$("#frminrangemin")[0].value
						,max:$("#frminrangemax")[0].value
					}
					,output:{
						min:$("#frmoutrangemin")[0].value
						,max:$("#frmoutrangemax")[0].value
					}
				}, {pre:function(){
				this.context.drawImage(document.getElementById('generated'),0,0);	
				}});
  	console.log("levels = "+(Math.round(Date.now() - time1)/1000)+" s");

  });

  $("#btLevelsReset").click(function() {
	$("#waiter").css("display","block");
	$("#frminrangemin")[0].value=0;
  	$("#frmoutrangemin")[0].value=0;
  	$("#frminrangemax")[0].value=255;
  	$("#frmoutrangemax")[0].value=255;
  	$("#frmgamma")[0].value=1;
  	$("#slgamma").slider("value",1);
  	$("#slinrange").slider("values",[0,255]);
  	$("#sloutrange").slider("values",[0,255]);
	
  });  
 
  $("#btLevelsDone").click(function() {
	$("#dlgLevels").hide();
	$("#panel").show();
  });  
 
 
  $("#btn_dlglevels").click(function(){
	generate();
  	var obrimage=document.getElementById("generated");
  	obrimage.style.display="none";
  	$("#canvas").show();	  	
	$("#panel").hide();
	$("#dlgLevels").show();
	showHist();
  });
 
 
  
 //next startup 
  $("#frmAngle")[0].value=0;
  $("#canvas").hide();
  $("#aboutbox").hide();

  
  xoffset = $("#metrics")[0].offsetLeft;
  yoffset = $("#metrics")[0].offsetTop;
  $("#filetype input").switchButton({
	  on_label: 'JPG',
	  off_label: 'PNG'
   });
   
  
  // Button NEW onClick
  $("#btn_new").click(function(){
	donew();
  });
  
  // Button CROP onClick
  $("#btn_crop").click(function() {
   docrop();
  });
  
  
  
  //  Rotate onchange
  $("#frmAngle").on("change", function(e) {  	
 	if($("#frmAngle")[0].value!== null) {
 		dorotate($("#frmAngle")[0].value);
 		$("#slrotate").slider("value",$("#frmAngle")[0].value);
 	};
 	
    });


  // Options RESIZE onChange
  $("#options_size").on("change", function(e){
    var option = $("option:selected", this);
    var size = this.value;
    ui_set_resize_values(size);
  });
  var size = $("#options_size option:selected").val();
  ui_set_resize_values(size);
  
   
  $("#cbFiletype").on("change", function(e){
    if (canvas.width>0) {$("#canvas").show()};
    $("#generated").remove();
    $("#modeswitch").html("canvas");
  });
  	
  
  // Options CROP onChange
  $("#options_crop").on("change", function(e){
    var option = $("option:selected", this);
    var size = this.value;
    ui_set_ratio_values(size);
  });
  size = $("#options_crop option:selected").val();
  ui_set_ratio_values(size);
  
  
  //Button RESIZE onClick
  $("#btn_resize").click(function(){
   doresize();
  });
  
   
  // Layer METRICS mouse events
  $("#metrics").mousemove(mouseMove);
  $("#metrics").mousedown(mouseDown);
 
  $("#rectangle").mousemove(rectmouseMove);
  $("#rectangle").mousedown(rectmouseDown);
  $("#rectangle").dblclick(function() { docrop() });

  $("#btAbout").click(function() {
  	$("#aboutbox").toggle( "fast");
  });
  
  
  
  function gocanvas() {
       $("#modeswitch").html("canvas");
       $("#modeswitch").dblclick(function() {
      	goimage();
       }); 
      	$("#canvas").show();
      	$("#generated").hide(); 
  }
  function goimage() {
      generate();
      $("#modeswitch").html("image");
      $("#modeswitch").dblclick(function() {
      	gocanvas();
      });
      $("#canvas").hide();
      $("#generated").show(); 
      $("#generated").dblclick(function() {
      	gocanvas();
      });	
  }  
  
  $("#modeswitch").html("canvas");
  $("#modeswitch").dblclick(function() {
      	if (canvas.width>0) {goimage()};
  }); 
  
  $("#metrics").dblclick(function() {
      goimage();
    });
  
  
  // Layer METRICS onSelectAll
  $(document).keydown(function(e){
    if((e.which == 65) && e.ctrlKey){
      if($("#canvas").is(":visible")){
        getCoords(e);
        $("#rectangle").show();
        rect.startX = 0; rect.startY = 0;
        rect.w = parseInt($("#metrics").css("width")); 
        rect.h = parseInt($("#metrics").css("height"));
        console.log("CTRL+A clicked");
        console.log("rect: " + rect.w + " x " + rect.h);
        console.log("canvas: " + canvas.width + " x " + canvas.height);
        $("#rectangle").css('left', (rect.startX+xoffset)+'px');
        $("#rectangle").css('top', (rect.startY+yoffset)+'px');
        $("#rectangle").css('height', rect.h+'px');
        $("#rectangle").css('width', rect.w+'px');  
        $("#coords").html("Kurzor: 0 × 0 px<br />Výběr: "+ rect.w + " × " + rect.h + " px");
      }
    }
    // alt-C
    if((e.which == 67) && e.altKey){
    	docrop();
    }	
    // alt-S
    if((e.which == 83) && e.altKey){
    	doresize();
    }
    //alt-N
    if((e.which == 78) && e.altKey){
    	donew();
    }
    
  });


	function render(src){
		var image = new Image();
		image.onload = function(){
			canvas.width = image.width;
			canvas.height = image.height;
			$("#sbDim").html(canvas.width+" × "+canvas.height);
			$("#metrics").css("width",canvas.width+"px");
         	$("#metrics").css("height",canvas.height+"px");		 
			console.log(canvas.height);
			ctx.drawImage(image, 0, 0);
		};
		image.src = src;
	}

	function loadImage(src){
		//	Prevent any non-image file type from being read.
		if(!src.type.match(/image.*/)){
			console.log("The dropped file is not an image: ", src.type);
			return;
		}
		//	Create our FileReader and run the results through the render function.
		var reader = new FileReader();
		reader.onload = function(e){
			render(e.target.result);
		};
		sourceFilename=src.name;		
		reader.readAsDataURL(src);
	}

	var target = document.getElementById("droptarget");
	target.addEventListener("dragover", function(e){e.preventDefault();}, true);
	target.addEventListener("drop", function(e){
		$("#droptarget").hide();
		e.preventDefault(); 
		loadImage(e.dataTransfer.files[0]);
		 $("#canvas").show();
		 $("#metrics").show();
		 $("#frmAngle")[0].value=0;
	     $("#slrotate").slider("value",0);

	}, true);


  //show zoom on init and on window resize	
  checkZoom();  
  $(window).resize(function(){
	checkZoom();
  });
  
}
  
window.addEventListener("load", init);