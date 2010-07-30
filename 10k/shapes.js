function Figure(src){
  //a figure is composed of lines or circles
  //each line/circle contains 2 points, one flexible, one anchored to another point
  //they all go down to a root point, which has no parent.
  var pos = [
    src.pos[0] + stage.x,
    src.pos[1] + stage.y
  ]
  this.root = new Root(src.angle, pos);
  (function(parent, children){
    for(var i = 0; i < children.length; i++){
      var child = children[i]
      if(child.type == "line"){
        var el = new Line(parent, child.angle, child.length, child.width, child.color)
      }else if(child.type == "circle"){
        var el = new Circle(parent, child.angle, child.length, child.width, child.color)
      }
      arguments.callee(el, child.children); //recurse
    }
  })(this.root, src.children);
  
  this.root.renderAll();
}

Figure.prototype.save = function(){
  var s = this.root.save();
  var nobj = {}
  for(var i in s){
    if(i == "pos"){
      nobj.pos = [s.pos[0] - stage.x, s.pos[1] - stage.y]
    }else{
      nobj[i] = s[i]
    }
  }
  return nobj;
}

function Root(angle, pos, noend, draw){
  //this is a root point.
  var point = this;
  var draw = this.draw = draw || window.draw;
  
  this.type = "root"
  if(!noend){
    this.shape = draw.ellipse(0,0,handle_size,handle_size)
    .attr("fill","#FFA500")
    .mousedown(function(e){
      if(e.button == 0 && !e.ctrlKey)
        current_shape = point;
      selected_shape = point;
    
    })

		$(this.shape.node).bind(MOUSEDOWN, function(e){
        current_shape = point;
      selected_shape = point;
    
    })
		
  }
  this.pos = pos||[500,500]
  this.render()
  this._angle = angle||0;
  this.children = [];
  
}


Root.prototype.all = function(){
  var all = [];
  (function(children){
    for(var i = 0; i < children.length; i++){
      all.push(children[i]);
      arguments.callee(children[i].children)
    }
  })(this.children);
  return all
}
Root.prototype.save = function(){
  for(var i = 0, children = []; i < this.children.length; i++){
    children.push(this.children[i].save())
  }
  return {
    type: this.type,
    pos: this.pos,
    angle: Math.floor(this._angle * (180/Math.PI)),
    children: children
  }
}

Root.prototype.render = function(){
  if(this.shape){
    this.shape.toFront();
    this.shape.attr("cx",this.pos[0]).attr("cy",this.pos[1])
  }
}
Root.prototype.move = Root.prototype.rotate = function(x,y){
  this.pos = [x,y]
}
Root.prototype.getPos = function(){
  return this.pos;
}
Root.prototype.angle = function(){
  return this._angle;
}
Root.prototype.renderAll = function(){
  this.render()
  for(var i = 0; i < this.children.length; i++){
    this.children[i].renderAll()
  }
}
Root.prototype.remove = function(){
  this.deleted = true;
  
  while(this.children.length > 0){
    this.children[0].remove();
  }
  
  if(this.shape)
    this.shape.remove();
}

function Shape(){} //empty object which is extended upon

Shape.prototype.angle = function(){
  return this.anchor.angle() + this._angle
}
Shape.prototype.rotate = function(x, y){
  var pos = this.anchor.getPos()
  var angle = Math.atan2(y - pos[1], x - pos[0]) - this.anchor.angle()
  this._angle = angle;
}
Shape.prototype.move = function(x, y){
  var pos = this.anchor.getPos()
  this.rotate(x, y);
  this.length = Math.sqrt(Math.pow(x-pos[0],2)+Math.pow(y-pos[1],2))
}
Shape.prototype.getPos = function(){
  //time for some trigonometry!
  var anchor = this.anchor.getPos()
  var dy = Math.sin(this.angle()) * this.length;
  var dx = Math.cos(this.angle()) * this.length;
  return [anchor[0] + dx, anchor[1] + dy];
}
Shape.prototype.renderAll = function(){
  this.render();
  for(var i = 0; i < this.children.length; i++){
    this.children[i].renderAll()
  }
}
Shape.prototype.remove = function(){
  this.deleted = true;

  while(this.children.length > 0){
    this.children[0].remove();
  }
  
  this.shape.remove();
  if(this.end) this.end.remove();
  
  //*
  for(var i = 0; i < this.anchor.children.length; i++){
    if(this.anchor.children[i] == this){
      this.anchor.children.splice(i,1);
    }
  }
  //*/
  
}
Shape.prototype.save = function(){
  for(var i = 0, children = []; i < this.children.length; i++){
    children.push(this.children[i].save())
  }
  return {
    type: this.type,
    length: Math.floor(this.length),
    width: this.width,
    color: this.color,
    angle: Math.floor(this._angle * (180/Math.PI)),
    children: children
  }
}

function Line(anchor, angle, length, width, color, noend){
  //a shape is a rendering of 2 arbitrary points
  var line = this;
  this.type = "line"
  this.anchor = anchor; //type = shape.
  var draw = this.draw = anchor.draw;
  
  this.children = [];
  this.length = length||50;
  this._angle = angle/(180/Math.PI);
  this.shape = draw.path("")
  this.width = width||6;
  this.color = color||"#000";
  if(!noend){
    this.end = draw.ellipse(0,0,handle_size,handle_size)
    .attr("fill","red")
    .mousedown(function(e){
      if(e.button == 0 && !e.ctrlKey)
        current_shape = line;
      selected_shape = line;
      e.preventDefault()
      e.stopPropagation()
    })

					$(this.end.node).bind(MOUSEDOWN, function(e){
	            current_shape = line;
	          selected_shape = line;
	          e.preventDefault()
	          e.stopPropagation()
	        })
  }
  this.anchor.children.push(this);
  
  this.render();
  
}
Line.prototype = new Shape();

Line.prototype.render = function(){
  var anchor = this.anchor.getPos()
  var end = this.getPos()
  this.shape
    .attr("path","M"+anchor[0]+","+anchor[1]+" L"+end[0]+","+end[1])
    .attr('stroke-width',this.width+"px")
    .attr('stroke', this.color)
    .attr('stroke-linecap', 'round');
  if(this.end)this.end.attr("cx",end[0]).attr("cy",end[1]).toFront();
}




function Circle(anchor, angle, length, width, color, noend){
  //a shape is a rendering of 2 arbitrary points
  var circle = this;
  this.anchor = anchor; //type = shape.
  this.children = [];
  this.type = "circle"
  this.length = length||50;
  var draw = this.draw = anchor.draw;
  this._angle = angle/(180/Math.PI);
  this.shape = draw.ellipse(0,0,0,0)
  this.width = width||6;
  this.color = color||"#000";
  if(!noend){
    this.end = draw.ellipse(0,0,handle_size,handle_size)
    .attr("fill","red")
    .mousedown(function(e){
      if(e.button == 0 && !e.ctrlKey)
        current_shape = circle;
      selected_shape = circle;
    })

		$(this.end.node).bind(MOUSEDOWN, function(){
			current_shape = circle;
			selected_shape = circle;
		})
  }

	
  this.anchor.children.push(this);
  
  this.render();
  
}
Circle.prototype = new Shape();

Circle.prototype.render = function(){
  var anchor = this.anchor.getPos()
  var end = this.getPos()
  this.shape
  .attr("rx", this.length/2)
  .attr("ry",this.length/2)
  .attr("cx",(anchor[0]+end[0])/2)
  .attr("cy",(anchor[1]+end[1])/2)
  .attr('stroke-width',this.width + "px")
  .attr('stroke', this.color)
  //this.end.translate(end[0], end[1], true);
  if(this.end)this.end.attr("cx",end[0]).attr("cy",end[1]).toFront();
}

