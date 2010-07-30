function svg(el, parent){
  var attr = arguments[arguments.length-1];
  if(!parent || !type){
    throw "Error: Parent and type can not be null"
  }else if(parent.appendChild){
    el = document.createElementNS("http://www.w3.org/2000/svg", el);
    parent.appendChild(el);
  }
  if(!parent.appendChild || attr != parent){
    for(var key in attr)
      el.setAttribute(key, attr[key]+'');
  }
  return el;
}

Element.prototype.remove = function(){
  this.parentNode.removeChild(this);
}

Element.prototype.toFront = function(){
  this.parentNode.appendChild(this)
}

function ScaledFigure(draw, src, scale){
  //a figure is composed of lines or circles
  //each line/circle contains 2 points, one flexible, one anchored to another point
  //they all go down to a root point, which has no parent.
  this.root = new Root(src.angle, src.pos, true, draw);
  var scale = scale||1.0;
  var allset = this.root.draw.set()
  this.allset = allset;
  this.root.pos = [this.root.pos[0] * scale, this.root.pos[1] * scale];
  //this.root.shape.scale(0.1,0.1,0,0)
  (function(parent, children){
    for(var i = 0; i < children.length; i++){
      var child = children[i]
      if(child.type == "line"){
        var el = new Line(parent, child.angle, child.length * scale, child.width * scale, child.color, true)
      }else if(child.type == "circle"){
        var el = new Circle(parent, child.angle, child.length * scale, child.width * scale, child.color, true)
      }
      allset.push(el.shape)
      arguments.callee(el, child.children); //recurse
    }
  })(this.root, src.children);
  
  this.root.renderAll();
}


function Figure(src, draw){
  //a figure is composed of lines or circles
  //each line/circle contains 2 points, one flexible, one anchored to another point
  //they all go down to a root point, which has no parent.
  var pos = [
    src.pos[0] + stage.x,
    src.pos[1] + stage.y
  ]
  this.root = new Root(src.angle, pos, false, draw);
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


function createShapeHandle(shape, color){
  (shape.end = svg('circle', shape.draw, {
    fill: color || 'red'
  })).on('mousedown',function(e){ //not very memsafe
    if(!e.button && !e.ctrlKey) current_shape = point;
    selected_shape = point;
  })
}


function Root(angle, pos, noend, draw){
  //this is a root point.
  var point = this;
  var draw = this.draw = draw;
  
  this.type = "root"
  if(!noend) createShapeHandle(this, "#FFA500");
  this._pos = pos||[500,500]
  this.render()
  this._angle = angle||0;
  this.children = [];
  
}

var rootproto = Root.prototype;

rootproto.all = function(){
  var all = [];
  (function(children){
    for(var i = 0; i < children.length; i++){
      all.push(children[i]);
      arguments.callee(children[i].children)
    }
  })(this.children);
  return all
}
rootproto.save = function(){
  for(var i = 0, children = []; i < this.children.length; i++){
    children.push(this.children[i].save())
  }
  return {
    type: this.type,
    pos: this._pos,
    angle: Math.floor(this._angle * (180/Math.PI)),
    children: children
  }
}

rootproto.render = function(){
  if(this.end) svg(this.end, {cx: this._pos[0], cy: this._pos[1]}).toFront();
}
rootproto.move = rootproto.rotate = function(x,y){
  this._pos = [x,y]
}
rootproto.pos = function(){
  return this._pos;
}
rootproto.angle = function(){
  return this._angle;
}
rootproto.renderAll = function(){
  this.render()
  for(var l = this.children.length;l--;)
    this.children[l].renderAll();
}
rootproto.remove = function(){
  this.deleted = true;
  
  while(this.children.length > 0)
    this.children[0].remove();
  
  if(this.end)
    this.end.remove();
}

function Shape(){} //empty object which is extended upon

var shapeproto = Shape.prototype;

shapeproto.angle = function(){
  return this.anchor.angle() + this._angle
}
shapeproto.rotate = function(x, y){
  var pos = this.anchor.pos()
  var angle = Math.atan2(y - pos[1], x - pos[0]) - this.anchor.angle()
  this._angle = angle;
}
shapeproto.move = function(x, y){
  var pos = this.anchor.pos()
  this.rotate(x, y);
  this.length = Math.sqrt(Math.pow(x-pos[0],2)+Math.pow(y-pos[1],2))
}
shapeproto.pos = function(){
  //time for some trigonometry!
  var anchor = this.anchor.pos()
  var dy = Math.sin(this.angle()) * this.length;
  var dx = Math.cos(this.angle()) * this.length;
  return [anchor[0] + dx, anchor[1] + dy];
}
shapeproto.renderAll = function(){
  this.render();
  for(var i = 0; i < this.children.length; i++){
    this.children[i].renderAll()
  }
}
shapeproto.remove = function(){
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



shapeproto.save = function(){
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
  this.shape = svg('line', draw);//draw.path("")
  this.width = width||6;
  this.color = color||"#000";
  if(!noend) createShapeHandle(this);
  this.anchor.children.push(this);
  
  this.render();
  
}
var lineproto = Line.prototype = new Shape();

lineproto.render = function(){
  var anchor = this.anchor.pos()
  var end = this.pos()
  svg(this.shape, {
    x1: anchor[0], 
    y1: anchor[1], 
    x2: end[0], 
    y2: end[1], 
    'stroke-width': this.width+'px', 
    stroke: this.color, 
    'stroke-linecap': 'round'
  });
  if(this.end) svg(this.end, {cx: end[0], cy: end[1]}).toFront();
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
  this.shape = svg('circle', draw);
  this.width = width||6;
  this.color = color||"#000";
  if(!noend) createShapeHandle(this);

  this.anchor.children.push(this);
  
  this.render();
  
}
var circleproto = Circle.prototype = new Shape();

circleproto.render = function(){
  var anchor = this.anchor.pos()
  var end = this.pos();
  svg(this.shape, {r: this.length/2, cx: (anchor[0]+end[0])/2, cy: (anchor[1]+end[1])/2, 'stroke-width': this.width+'px', stroke: this.color});
  if(this.end) svg(this.end, {cx: end[0], cy: end[1]}).toFront();
}

