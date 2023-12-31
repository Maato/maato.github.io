function getWindowInnerWidth()
{if(typeof(window.innerWidth)=="number")
{return window.innerWidth;}
else if(document.documentElement&&(document.documentElement.clientWidth||document.documentElement.clientHeight))
{return document.documentElement.clientWidth;}
return 0;}
function getWindowInnerHeight()
{if(typeof(window.innerWidth)=="number")
{return window.innerHeight;}
else if(document.documentElement&&(document.documentElement.clientWidth||document.documentElement.clientHeight))
{return document.documentElement.clientHeight;}
return 0;}
var ImageViewer=function()
{this.container=null;this.currentImage=undefined;this.cache={};};ImageViewer.prototype.showImage=function(imageUrl,imageCaption,imageDescription)
{var _this=this;if(this.cache[imageUrl]===undefined){var date=new Date();this.currentImage=new Image();this.currentImage.onload=function(){_this.imageLoaded(imageUrl,imageCaption,imageDescription);};this.cache[imageUrl]=this.currentImage;this.currentImage.src=imageUrl+"?t="+date.getTime();}
else{this.currentImage=this.cache[imageUrl];this.imageLoaded(imageUrl,imageCaption,imageDescription);}};ImageViewer.prototype.imageLoaded=function(imageUrl,imageCaption,imageDescription)
{if(getWindowInnerWidth()<this.currentImage.width||getWindowInnerHeight()<this.currentImage.height){document.location.href=imageUrl;return;}
this.removePopup();var c=this.container=this.createImageContainer(imageCaption,imageDescription);c.style.visibility="hidden";document.body.appendChild(c);c.style.position="fixed";c.style.left=((getWindowInnerWidth()/2)-(c.offsetWidth/2))+"px";c.style.top=((getWindowInnerHeight()/2)-(c.offsetHeight/2))+"px";c.style.visibility="visible";};ImageViewer.prototype.createImageContainer=function(caption,description)
{var _this=this;var c=document.createElement("div");c.className="imgviewer";if(caption!==""||description!=="")
c.innerHTML="<div class='caption'>"+caption+"</div> ";c.appendChild(this.currentImage);this.currentImage.onclick=function(){_this.removePopup();};return c;};ImageViewer.prototype.removePopup=function()
{if(this.container===null){return;}
this.container.parentNode.removeChild(this.container);this.container=null;};var imageViewer=new ImageViewer();