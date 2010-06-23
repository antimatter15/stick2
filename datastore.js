function Datastore(group, service, proxy){
  this.group = group
  this.service = service?service:"http://datastore-service.appspot.com/?"
  this.proxy = proxy;
  this.cache = {};
}

Datastore.prototype.onmessage = function(data, callback){
  if(callback)callback(data);
  if(data.key) this.cache[data.key] = data; //if cachable then cache
}

Datastore.prototype.send = function(p, callback){
  var tc=this,param = "act="+encodeURIComponent(p.act)+
                            "&group="+encodeURIComponent(p.group)+
                            "&type="+encodeURIComponent(p.type)+
                            "&data="+encodeURIComponent(p.data)+
                            "&key="+encodeURIComponent(p.key)+
                            "&index="+encodeURIComponent(p.index)
  if(this.proxy){
    var x=this.ActiveXObject;x=new(x?x:XMLHttpRequest)('Microsoft.XMLHTTP');
    x.open('GET',this.service + param,1);
    x.onreadystatechange=function(){if(x.readyState>3){
      tc.onmessage(eval("("+x.responseText+")"), callback);
    }};x.send(d)
  }else{
    var s = document.createElement("script");
    var jsonp = "dsjp_"+Math.round(Math.random()*999999999);
    window[jsonp] = function(data){
      tc.onmessage(data,callback);
      document.body.removeChild(s);
    }
    s.type = "text/javascript"
    s.src = this.service + param + "&jsonp="+jsonp;
    document.body.appendChild(s);
  }
}

Datastore.prototype.setgroup = function(group){
  this.group = group;
}

Datastore.prototype.setservice = function(service){
  this.service = service;
}

Datastore.prototype.write = function(type, data, cbk){
  this.send({act: "write", group: this.group, type: type, data: data}, cbk)
}

Datastore.prototype.idx = function(type, index, cbk){ // get by index
  this.send({act: "idx", group: this.group, type: type, index: index}, cbk)
}


Datastore.prototype.ridx = function(type, index, cbk){ //get by reverse index
  this.send({act: "ridx", group: this.group, type: type, index: index}, cbk)
}

Datastore.prototype.first = function(type, cbk){
  this.ridx(type, 0, cbk);
}

Datastore.prototype.latest = function(type, cbk){
  this.idx(type, 0, cbk);
}

Datastore.prototype.listall = function(cbk){
  this.send({act: "all", group: this.group}, cbk)
}


Datastore.prototype.list = function(type, cbk){
  this.send({act: "list", group: this.group, type: type}, cbk)
}

Datastore.prototype.read = function(key, cbk){
  if(this.cache[key]) return this.onmessage(this.cache[key],cbk);
  this.send({act: "read", key: key}, cbk);
}
