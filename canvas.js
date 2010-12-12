function canvas_render_frame(frame, context){
	var shapes = framestore[frame]
	//context.clearRect(0,0,stage.width, stage.height)
  context.fillStyle = "rgb(255,255,255)";  
  context.fillRect(0,0,stage.width, stage.height) //GIF can't do transparent so do white

	for(var i = 0; i < shapes.length; i++){
		CanvasDrawFigure(shapes[i], context)
	}
}

function CanvasDrawFigure(src, context){
	var root = new CanvasRoot(context, src.angle, src.pos);
	(function(children, anchor){
		for(var i = 0; i < children.length; i++){
			var s = children[i]
			if(s.type == "line"){
				var n = new CanvasLine(anchor, s.angle, s.length, s.width, s.color)
			}else if(s.type == "circle"){
				var n = new CanvasCircle(anchor, s.angle, s.length, s.width, s.color)
			}
			arguments.callee(s.children, n)
		}
	})(src.children, root)
}


function CanvasRoot(ctx, angle, pos){
  //this is a root point.
  var point = this;
  this.pos = pos||[500,500];
  this._angle = angle||0;
  this.children = [];
  this.ctx = ctx;
}

CanvasRoot.prototype.getPos = function(){
  return this.pos;
}
CanvasRoot.prototype.angle = function(){
  return this._angle;
}
CanvasRoot.prototype.renderAll = function(){
  for(var i = 0; i < this.children.length; i++){
    this.children[i].renderAll()
  }
}

function CanvasShape(){} //empty object which is extended upon

CanvasShape.prototype.angle = function(){
  return this.anchor.angle() + this._angle
}

CanvasShape.prototype.getPos = function(){
  //time for some trigonometry!
  var anchor = this.anchor.getPos()
  var dy = Math.sin(this.angle()) * this.length;
  var dx = Math.cos(this.angle()) * this.length;
  return [anchor[0] + dx, anchor[1] + dy];
}
CanvasShape.prototype.renderAll = function(){
  this.render();
  for(var i = 0; i < this.children.length; i++){
    this.children[i].renderAll()
  }
}


function CanvasLine(anchor, angle, length, width, color, noend){
  //a shape is a rendering of 2 arbitrary points
  var line = this;
  this.type = "line"
  this.anchor = anchor;
  this.children = [];
  this.length = length||50;
  this._angle = angle/(180/Math.PI);
  this.width = width||6;
  this.color = color||"#000";
  this.anchor.children.push(this);
  this.ctx = this.anchor.ctx;
  
  this.render();

}
CanvasLine.prototype = new CanvasShape();

CanvasLine.prototype.render = function(){
  var anchor = this.anchor.getPos()
  var end = this.getPos();
  var ctx = this.ctx;
	ctx.strokeStyle = this.color;
	ctx.lineWidth = this.width;
	ctx.lineCap = "round"
	ctx.beginPath();
	ctx.moveTo(anchor[0], anchor[1]);
	ctx.lineTo(end[0], end[1]);
	ctx.stroke();
}




function CanvasCircle(anchor, angle, length, width, color, noend){
  //a shape is a rendering of 2 arbitrary points
  var circle = this;
  this.anchor = anchor; //type = shape.
  this.children = [];
  this.type = "circle"
  this.length = length||50;
  var draw = this.draw = anchor.draw;
  this._angle = angle/(180/Math.PI);
  this.width = width||6;
  this.color = color||"#000";
  this.anchor.children.push(this);
  this.ctx = this.anchor.ctx;
  this.render();

}
CanvasCircle.prototype = new CanvasShape();

CanvasCircle.prototype.render = function(){
  var anchor = this.anchor.getPos()
  var end = this.getPos();
  var ctx = this.ctx;
	ctx.beginPath();
	ctx.strokeStyle = this.color;
	ctx.lineWidth = this.width;
	ctx.arc((anchor[0]+end[0])/2, (anchor[1]+end[1])/2,
					this.length/2,
					0,
					2 *Math.PI)
	ctx.stroke();
}
