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



var draw = svg('svg', document.getElementById(''), {
  width: 100,
  height: 100
})

var circle = svg('circle', draw);
