function deflate_shape(shape){
	var map = {
		"root":"r",
		"line":"l",
		"circle": "c"
	};
	if(shape.type == "root"){
		var newshape = [map[shape.type], shape.pos[0], shape.pos[1], shape.angle]
	}else{
		var newshape = [map[shape.type], shape.length, shape.width, shape.color, shape.angle]
	}
	for(var i = 0, newchildren = []; i < shape.children.length; i++){
		newchildren.push(deflate_shape(shape.children[i]))
	}
	newshape.push(newchildren)
	return newshape;
}



function compressed_save(){
	var future = []
	for(var i = 0; i < frame_el.length; i++){
		var f = framestore[i];
		future[i] = [];
		for(var s = 0; s < f.length; s++){
			future[i].push(deflate_shape(f[s]))
		}
	}
	return {
		generator: "Stick2 Engine 07C3JRJ7",
		fps: fps,
		stage: stage,
		data: future
	}
}

function expand_save(obj){
  if(typeof obj == 'string') obj = JSON.parse(obj);
	var fs = {};
	for(var i = 0; i < obj.data.length; i++){
		fs[i] = []
		console.log(obj.data[i])
		for(var s = 0; s < obj.data[i].length; s++){
			fs[i].push(inflate_shape(obj.data[i][s]));
		}
	}
	load_animation(fs)
}

function inflate_shape(obj){
	var map = {
		"r": "root",
		"l": "line",
		"c": "circle"
	};
	var shape = {};
	shape.type = map[obj[0]];
	if(obj[0] == "r"){
		shape.pos = [obj[1],obj[2]]
		shape.angle = obj[3]
		shape.children = obj[4]
	}else{
		shape.length = obj[1]
		shape.width = obj[2]
		shape.color = obj[3]
		shape.angle = obj[4]
		shape.children = obj[5]
  }
	for(var i = 0; i < shape.children.length; i++){
		shape.children[i] = inflate_shape(shape.children[i])
	}
	return shape;
}

function save_animation(){
	return JSON.stringify(framestore)
}

function load_animation(src){
	
	framestore = src;
	
	$(frame_el).parent().remove();
	frame_el = [];
	
	var c=0,i;for(i in src) c++; //freaking count the keys!
	for(;c--;){
		addFrame(true);
		update_thumb(frame_el.length-1);
	}
	selectFrame(0, true)
}


function download_animation(id){
	ds.first(id, function(data){
	  if(data.data.substr(0,3) == "UKG"){
      data.data = ZInflate(decode64(data.data.substr(3)));
	  }
	  var src = eval("("+data.data+")");
		
		expand_save(src);
	})
	
}

function upload_animation(){
	var xssds = (location.protocol=='file:'?'http:':location.protocol)+"//datastore-service.appspot.com/";
	//var data = JSON.stringify(compressed_save());
	
	var data = "UKG"+encode64(ZDeflate(JSON.stringify(compressed_save()))); //Gzip compresion ftw! gets compressed an average of around 5% (from 7KB to .5KB)
	//actually, the compression only gets BETTER the bigger the animation is. For a 31 frame animation with ~18 stickmen per frame, the raw size is 70KB
	//the compressed size is 22KB and the gzipped is 2KB or a 0.2% compression ratio
	var type = Math.floor(Math.random()*Math.pow(36,5)).toString(36)+Math.floor(Math.random()*Math.pow(36,5)).toString(36);
	autopost(xssds, {
		group: "stick2beta",
		type: type,
		data: data,
		act: "write"
	}, function(){
		//if(confirm('done saving animation '+type+'\n press OK to go to http://antimatter15.com/ajaxanimator/stick2/player.html?'+type)){
		//  window.open('http://antimatter15.com/ajaxanimator/stick2/player.html?'+type)
		//}
		
		var el = $('<div>Done saving animation <b>'+type+'</b>.<br><a target="_blank" href="http://antimatter15.com/ajaxanimator/stick2/player.html?'+type+'">http://antimatter15.com/ajaxanimator/stick2/player.html?'+type+'</a><br></div>').css({'z-index':99999,position:'absolute', top: '100px', left: '100px', 'background-color': 'white', padding: '40px'}).append($('<button>Close</button>').click(function(){
		  el.remove();
		})).appendTo('body')
		
		
	})
}

