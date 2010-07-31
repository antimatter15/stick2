document.write('<div id=canvas></div><div id=figcont><div style=overflow:hidden id=figures></div></div><div class=header><div id=playpause style="float: left;padding: 0 10px 0 10px;margin-top: -3px;;font-size: x-large">&#9654;</div><button id=share style=float:left>Share</button><div id=infobox>Attach<button id=line>Line</button><button id=circle>Circle</button></div><div id=info style="float:left;margin-top: 2px;font-size: large"><span id=type></span><span><b> Angle: </b><span id=angle></span>&deg;</span><span><b> Length: </b><span id=length></span></span><span><b> Width: </b><span id=width></span></span><span><b> Color: </b><span id=color></span></span></div><button id=makefig style=float:left>Add to Library</button><div style="float: right"><button id=delete>Delete</button><button id=lockswitch>Unlock</button><a href="http://antimatter15.com">antimatter15.com</a></div></div><div id=timecont><div id=timescroll><table><tr id=timeline><td id=next><div style="width: 120px"><span style="font-size: 90px;color: #507D2A;float:left">+</span><br><br><span>Add new frame</span></div></td></table></div></div>');
//(function(){
var deg2rad = (180/Math.PI);



function svg(el, parent){
  var attr = arguments[arguments.length-1];
  if(!parent || !el){
    console.log(parent, el);
    throw 'Error: Parent and type can not be null'
  }else if(parent.appendChild){
    el = document.createElementNS('http://www.w3.org/2000/svg', el);
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
  var allset = svg('g',this.root.draw)
  this.allset = allset;
  this.root.P = [this.root.P[0] * scale, this.root.P[1] * scale];
  //this.root.shape.scale(0.1,0.1,0,0)
  (function(parent, children){
    for(var i = 0; i < children.length; i++){
      var child = children[i]
      var el = new(child.type == 'line'?Line:Circle)(parent, child.angle, child.length * scale, child.width * scale, child.color, true)
      allset.appendChild(el.shape)
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
      var el = new(child.type == 'line'?Line:Circle)(parent, child.angle, child.length , child.width, child.color)
      arguments.callee(el, child.children); //recurse
    }
  })(this.root, src.children);
  
  this.root.renderAll();
}

Figure.prototype.save = function(){
  var s = this.root.save();
  var nobj = {}
  for(var i in s){
    if(i == 'pos'){
      nobj.pos = [s.pos[0] - stage.x, s.pos[1] - stage.y]
    }else{
      nobj[i] = s[i]
    }
  }
  return nobj;
}


function createShapeHandle(shape, color){
  (shape.end = svg('circle', shape.draw, {
    fill: color || 'red',
    r: 8
  })).on('mousedown',function(e){ //not very memsafe
    if(!e.button && !e.ctrlKey) current_shape = shape;
    selected_shape = shape;
  })
}


function Root(angle, pos, noend, draw){
  //this is a root point.
  var point = this;
  var draw = this.draw = draw;
  
  this.T = 'root'
  if(!noend) createShapeHandle(this, '#FFA500');
  this.P = pos||[500,500]
  this.render()
  this.R = angle||0;
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
    type: this.T,
    pos: this.P,
    angle: Math.floor(this.R * deg2rad),
    children: children
  }
}

rootproto.render = function(){
  if(this.end) svg(this.end, {cx: this.P[0], cy: this.P[1]}).toFront();
}
rootproto.move = rootproto.rotate = function(x,y){
  this.P = [x,y]
}
rootproto.pos = function(){
  return this.P;
}
rootproto.angle = function(){
  return this.R;
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
  return this.A.angle() + this.R
}
shapeproto.rotate = function(x, y){
  var pos = this.A.pos()
  var angle = Math.atan2(y - pos[1], x - pos[0]) - this.A.angle()
  this.R = angle;
}
shapeproto.move = function(x, y){
  var pos = this.A.pos()
  this.rotate(x, y);
  this.length = Math.sqrt(Math.pow(x-pos[0],2)+Math.pow(y-pos[1],2))
}
shapeproto.pos = function(){
  //time for some trigonometry!
  var anchor = this.A.pos()
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
  for(var i = 0; i < this.A.children.length; i++){
    if(this.A.children[i] == this){
      this.A.children.splice(i,1);
    }
  }
  //*/
  
}



shapeproto.save = function(){
  for(var i = 0, children = []; i < this.children.length; i++){
    children.push(this.children[i].save())
  }
  return {
    type: this.T,
    length: Math.floor(this.length),
    width: this.width,
    color: this.color,
    angle: Math.floor(this.R * deg2rad),
    children: children
  }
}


function deflate2(root){
  /*
    [x, y, ang, children...]
    [type, length, width, color, angle]
    type: 0 circle
          1 line
  */
  function deflate2_child(child){
    return [+(child.type=='line'), child.length, child.color, child.angle].concat(child.children.map(deflate2_child));
  }
  return root.pos.concat([root.angle],root.children.map(deflate2_child))
}


function inflate2(root){
  function inflate2_child(child){
    return {
      type: child[0]?'line':'circle',
      length: child[1],
      color: child[2],
      angle: child[3],
      children: child.slice(4).map(inflate2_child)
    }
  }
  return {
    type: 'root',
    pos: root.slice(0,2),
    angle: root[2],
    children: root.slice(3).map(inflate2_child)
  }
}

function compressed_save(){
	for(var future = [], i = frame_el.length; i--;)
		future[i] = framestore[i].map(deflate2);
	return {
		generator: "Stick2 10k v2",
		fps: fps,
		stage: stage,
		data: future
	}
}

function expand_save(obj){
  if(typeof obj == 'string') obj = JSON.parse(obj);
	var fs = {};
	stage = obj.stage;
	for(var i = obj.data.length; i--;)
	  fs[i] = obj.data[i].map(inflate2);
	framestore = fs;
	frame_el.map(function(e){e.parentNode.remove()})
	frame_el = [];
	var c=0,i;for(i in fs) c++; //freaking count the keys!
	for(;c--;){
		addFrame(true);
		update_thumb(frame_el.length-1);
	}
	selectFrame(0, true)
}





function Line(anchor, angle, length, width, color, noend){
  //a shape is a rendering of 2 arbitrary points
  var line = this;
  this.T = 'line'
  this.A = anchor; //type = shape.
  var draw = this.draw = anchor.draw;
  
  this.children = [];
  this.length = length||50;
  this.R = angle/deg2rad;
  this.shape = svg('line', draw);//draw.path('')
  this.width = width||6;
  this.color = color||'#000';
  if(!noend) createShapeHandle(this);
  this.A.children.push(this);
  
  this.render();
  
}
var lineproto = Line.prototype = new Shape();

lineproto.render = function(){
  var anchor = this.A.pos()
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
  this.A = anchor; //type = shape.
  this.children = [];
  this.T = 'circle'
  this.length = length||50;
  var draw = this.draw = anchor.draw;
  this.R = angle/deg2rad;
  this.shape = svg('circle', draw);
  this.width = width||6;
  this.color = color||'#000';
  if(!noend) createShapeHandle(this);

  this.A.children.push(this);
  
  this.render();
  
}
var circleproto = Circle.prototype = new Shape();

circleproto.render = function(){
  var anchor = this.A.pos()
  var end = this.pos();
  svg(this.shape, {r: this.length/2, cx: (anchor[0]+end[0])/2, cy: (anchor[1]+end[1])/2, 'stroke-width': this.width+'px', stroke: this.color, fill: 'none'});
  if(this.end) svg(this.end, {cx: end[0], cy: end[1]}).toFront();
}


var MOUSEUP = 'mouseup';
var MOUSEDOWN = 'mousedown';
var MOUSEMOVE = 'mousemove';

function $(id){return document.getElementById(id);}
function hide(ids){show(ids, true)}
function show(ids,hidden){
  ids.split(' ').map(function(x){$(x).style.display=hidden?'none':'inline'})
}


var length_locked = true;

String.prototype.on = function(event, handler){
  $(this+'').on(event, handler);
}

String.prototype.pc = function(handler){
  $(this+'').parentNode.on('click', handler);
}


Element.prototype.on = function(event, handler){
  this.addEventListener(event, handler, true);
}

Element.prototype.text = function(text){
  this.textContent = this.innerText = text;
}

var domstore = {};

Element.prototype.data = function(attr, obj){
  if(!this.__magicDataID) this.__magicDataID = Math.random().toString(36).substr(4);
  if(!domstore[this.__magicDataID]) domstore[this.__magicDataID] = {};
  if(obj){
    domstore[this.__magicDataID][attr] = obj;
  }
  return domstore[this.__magicDataID][attr];
}

var draw,current_shape, selected_shape, shadow_shape, resize_stage, onion_skins = [], playback, fps = 15, playback_items = [], stage = {
	x: 180,
	y: 100, //TODO: ste proportionally to size
	width: 400,
	height: 300,
	fill: '#fff', stroke: 'none'
}, fig_list = [], stage_rect, framestore = {}, current_frame = 0, frame_el = [];			


function render_info(){
  if(shadow_shape){
    svg(shadow_shape, {
      'stroke-width': 0,
      stroke: 'none'
    })
    shadow_shape = null;
  }
  if(selected_shape){
			show('delete infobox');
			$('type').text(selected_shape.T)

			if(selected_shape.T != 'root'){
        hide('makefig');
        show('info')
        $('angle').text(Math.floor(selected_shape.R*deg2rad))
        $('length').text(Math.floor(selected_shape.length))
        $('color').style.color = selected_shape.color
        $('color').text(selected_shape.color);
        $('width').text(selected_shape.width);
        
			}else{
        show('makefig')
        hide('info');
			}

			svg(shadow_shape = selected_shape.end || selected_shape.shape, {
			  stroke: '#c598ec',
			  'stroke-width': '5px'
			})
  }else hide('delete info makefig infobox');
  
}

setInterval(render_info, 100);




function addFrame(noselect){
  var td = document.createElement('td');
  var framenum = frame_el.length;
  td.className = 'border';
  td.id = 'frame'+framenum;
  var div = document.createElement('div');
  div.className = 'frame';
  //$(div).data('framenum', frame_el.length);
  frame_el.push(div);
  
  //td.innerHTML = 'frame ' + frame_el.length;
  
  td.appendChild(div);
  document.getElementById('timeline').insertBefore(td,document.getElementById('next'));
  
  td.on('click', function(e){
		if(playback) exit_playback();
    selectFrame(framenum);
  })
  
  
  onresize();
  
	if(!noselect) selectFrame(frame_el.length -1);

  $('next').scrollIntoView(true);
  
}


function clone(obj){ //recursive object cloning function
  if(obj.pop){
    var nobj = [];
    for(var i = 0, l = obj.length; i < l; i++) nobj.push(clone(obj[i]));
    return nobj;
  }else if(typeof obj == 'object'){
    var nobj = {};
    for(var i in obj) nobj[i] = clone(obj[i]);
    return nobj;
  }else return obj;
}

function addFigure(name, src, out){
  var div = document.createElement('div');
  var parent = document.createElement('div');
  parent.className = 'figcont'
  parent.innerHTML = ''+name+'';
  var magicness = out||src;
  parent.on('click', function(){
   var fg = clone(magicness);
    if(!playback){
      fg.pos[0] = (Math.floor(Math.random()*stage.width));
      fg.pos[1] = (Math.floor(Math.random()*stage.height));
      fig_list.push(new Figure(fg, draw));
    
      save_frame()
      update_thumb(current_frame);
		}
  })
  parent.appendChild(div)
  $('figures').appendChild(parent);
  var canvas = svg('svg', div, {width: 60, height: 60});
  
  //TODO: do it without generating the figure twice.
  var fig = new ScaledFigure(canvas, src, 1.0);
  var box = fig.allset.getBBox()
  fig.root.remove();
  
  var scale = Math.min(1,Math.min(50/box.width, 50/box.height));

  //console.log(scale,box.width, box.height)
  //scale = 1
  var fig = new ScaledFigure(canvas, src, scale)
  var nodes = fig.root.all(), set = svg('g',fig.root.draw);
  for(var i = 0; i < nodes.length; i++){
    set.appendChild(nodes[i].shape)
  }
  
  var box = set.getBBox()
  
  fig.root.move(50/2, 50/2 + 5);
  
  fig.root.renderAll()
}

this.onresize = function(){
  svg(draw, {width: innerWidth, height: innerHeight});
  $('figcont').style.height = innerHeight - 180 + 'px'
}


function update_thumb(num){
  frame_el[num].innerHTML = ''
  var canvas = svg('svg',frame_el[num], {width: 100, height: 100});
  var frame = framestore[num]
  var scale = Math.min(100/stage.width,100/stage.height)
  var canvas_figures = [];
  svg('text', canvas, {'font-size': '80px', fill: '#bbbbbb', stroke: '#bbbbbb', x: num>8?10:30, y: 75})
    .appendChild(document.createTextNode(num+1));
    
  for(var i = frame.length; i -- ;)
    canvas_figures.push(new ScaledFigure(canvas, frame[i], scale));


}

function save_frame(){
  for(var i = 0, frame = []; i < fig_list.length; i++){
    if(!fig_list[i].root.deleted){
      frame.push(fig_list[i].save());
    }
  }
  framestore[current_frame] = frame;
}
function selectFrame(num, nosave){
  selected_shape = null;
  
  $('frame'+current_frame).className = '';
  $('frame'+num).className = 'selected'
  
  if(playback) return current_frame = num;
  
  if(!nosave)save_frame();
  update_thumb(current_frame);
  
  
  for(var i = 0, frame = []; i < fig_list.length; i++){
    fig_list[i].root.remove()
  }
  fig_list = [];
  
  remove_onion_skin()
  onion_skin(num);
  
  
  current_frame = num;
  if(framestore[current_frame]){
    //load from framestore 
    var frame = framestore[current_frame]
  }else if(num == 0){
    //frame zero: do nothing
    var frame = []
  }else{
    //load from previous frame
    var frame = framestore[current_frame -1];
  }
  for(var i = 0; i < frame.length; i++){
    fig_list.push(new Figure(frame[i], draw));
  }
  
  
  save_frame()
  update_thumb(current_frame);
}

function onion_skin(frame){
  if(framestore[frame-1]){
    //load from framestore 
    var frame = framestore[frame-1]
    for(var i = 0; i < frame.length; i++){
      var fc = clone(frame[i]);//copy object
      fc.pos = [fc.pos[0] + stage.x, fc.pos[1] + stage.y]
      var skin = (new ScaledFigure(draw, fc))
      svg(skin.allset,{'opacity':0.3})
      onion_skins.push(skin)
    }
  }
}
function remove_onion_skin(){
  for(var i = 0; i < onion_skins.length; i++){
    onion_skins[i].root.remove();
  }
  onion_skins = [];
}



function initiate_playback(){
  hide('figcont next')
  remove_onion_skin()
  playback = true;
  current_shape = null;
  selected_shape = null;
  render_info();
  
  for(var i = 0, frame = []; i < fig_list.length; i++){
    fig_list[i].root.remove()
  }
  fig_list = [];

}



function play_frame(frame){
  selectFrame(frame, true); //just update the ui
  for(var i = 0; i < playback_items.length; i++){
    playback_items[i].root.remove();
  }
  playback_items = [];
  if(framestore[frame]){
    //load from framestore 
    var frame = framestore[frame]
    for(var i = 0; i < frame.length; i++){
      var fc = clone(frame[i]);//copy object
      fc.pos = [fc.pos[0] + stage.x, fc.pos[1] + stage.y]
      var skin = (new ScaledFigure(draw, fc));
      playback_items.push(skin)
    }
  }
}
function togglePlayback(){
  if(playback = !playback){
    initiate_playback();
    autoplay();
  }
}
function autoplay(){
  var num = current_frame;
  if(playback){
    if(++num >= frame_el.length){
      num = 0;
    }
    play_frame(num);
   
    setTimeout(arguments.callee, 1000/fps);
  }else{
    exit_playback()
  }
}


function exit_playback(){
  playback = false
  show('figcont')
  $('next').style.display = 'table-cell';
  for(var i = 0; i < playback_items.length; i++){
    playback_items[i].root.remove();
  }
  selectFrame(current_frame, true)
}

  draw = svg('svg', $('canvas'))

  stage_rect = svg('rect', draw, stage);

'lockswitch'.on('click',function(){

  $('lockswitch').innerHTML = (length_locked = !length_locked)?'Unlock':'Lock';
})

'playpause'.on('click',function(){
  togglePlayback()
  $('playpause').innerHTML = playback?'&#9632;':'&#9654;';
})


'next'.on('click',function(e){
    addFrame()
})


  

  addFigure('Blank',{'type':'root','pos':[200,200],'angle':0,'children':[{'type':'circle','length':20,'width':20,'color':'#FFA500','angle':0,'children':[]}]},{'type':'root','pos':[200,200],'angle':0,'children':[]}); //blank is a special case
  //for(var i = 0; i < 100; i++){
  addFigure('Stickman',{type:'root','pos':[200,200],angle:0,children:[{type:'line',length:50,'width':6,color:'#000',angle:110,children:[{type:'line',length:50,'width':6,color:'#000',angle:0,children:[]}]},{type:'line',length:50,'width':6,color:'#000',angle:70,children:[{type:'line',length:50,'width':6,color:'#000',angle:0,children:[]}]},{type:'line',length:60,'width':6,color:'#000',angle:-90,children:[{type:'circle',length:35,'width':6,color:'#000',angle:0,children:[]},{type:'line',length:40,'width':6,color:'#000',angle:140,children:[{type:'line',length:40,'width':6,color:'#000',angle:10,children:[]}]},{type:'line',length:40,'width':6,color:'#000',angle:-140,children:[{type:'line',length:40,'width':6,color:'#000',angle:-10,children:[]}]}]}]})
  

try{
  localStorage.test = 'works';
}catch(err){
  window.localStorage = {};
}

if(localStorage.figures){
  var lsf = JSON.parse(localStorage.figures)
  for(var i = 0; i < lsf.length; i++){
    var fig = lsf[i];
    addFigure(fig.name, fig.json)
  }
}

addFrame()


'canvas'.on('mousemove', function(event){
  event.preventDefault()

  if(current_shape){
    if(event.shiftKey || !length_locked){
			
      current_shape.move(event.clientX, event.clientY)
      //somewhat a misnomer, its more of resizing
    }else{
			current_shape.rotate(event.clientX, event.clientY)
    }
    current_shape.renderAll()
    render_info();
  }
  
});


'canvas'.on('contextmenu',function(e){
  e.preventDefault();
  return false;
})

'canvas'.on(MOUSEUP, function(event){
	event.preventDefault()
	current_shape = null;
  resize_stage = false;
  if(!playback){
		save_frame()
  	update_thumb(current_frame);
	}
})


if(location.search.substr(1).length > 5){
  //download_animation(location.search.substr(1));
}


'makefig'.on('click', function(){
  var json = selected_shape.save();
  if(json.children.length == 0 && !magic){
    return alert('You probably want to add more shapes to it first');
  }
  var name = prompt('Enter a name for the figure you want to add to the library.', 'Fig'+Math.floor(Math.random()*993588125));
  if(name){
    addFigure(name, json);   
    var existing = localStorage.figures?JSON.parse(localStorage.figures):[]; 
    localStorage.figures = JSON.stringify(existing.concat([{name: name, json: json}]))
  }
})

function update_selected(){
  if(selected_shape) selected_shape.renderAll();
}

'line'.on('click',function(){
  new Line(selected_shape,Math.floor(420*Math.random())%360);
  update_selected();
})
'circle'.on('click',function(){
  new Circle(selected_shape,Math.floor(420*Math.random())%360);
  update_selected();
})
'delete'.on('click',function(){
  if(confirm('Are you sure you want to delete this '+(selected_shape.T=='root'?'figure':selected_shape.T)+'?')){
    selected_shape.remove();
    selected_shape = null;
  }
})


'share'.on('click', function(){
 expand_save(localStorage.SAVED)
  //window.SAVED = compressed_save()
  //localStorage.SAVED = JSON.stringify(compressed_save());
//  alert('sharing is caring')
})

'angle'.pc(function(){
  var ang = prompt('Enter new angle',selected_shape.R*deg2rad)
  if(ang||ang===0) selected_shape.R = ang / deg2rad;
  update_selected();
})

'length'.pc(function(){
  var len = prompt('Enter new length',selected_shape.length)
  if(len) selected_shape.length = len;
  update_selected();
})

'width'.pc(function(){
  var len = prompt('Enter new width',selected_shape.width)
  if(len) selected_shape.width = len;
  update_selected();
})


//})()
