function autopost(posturl,params,cb) {
	// random id
	var conv = '0123456789ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz', len = conv.length, ucb = 'ucb_';
	for(var i = 0; i < 32; i++) ucb += conv.charAt(Math.floor(Math.random()*len));
	var div = document.createElement('div');
	// container div
	div.style.display = 'none';
	
  //div.style.position = "absolute"
  //div.style.zIndex = 9999999999999999999999999999;
  document.body.appendChild(div);
  
	var iframe;
  var form = document.createElement('form');
  
	// called after POST
	window['c'+ucb] = function() {
    try{
				if(iframe.contentWindow.location =='about:blank'){ //opera and safari load about:blank
          return;
				}
			}catch(e){}
		//setTimeout(function() { if(div.parentNode) div.parentNode.removeChild(div); },0);
		cb();
    
	}
	// iframe
	try { iframe = document.createElement('<iframe id="'+ucb+'" name="'+ucb+'" onload="window.c'+ucb+'()">'); }	// IE
	catch(ex) { iframe = document.createElement('iframe'); iframe.id = iframe.name = ucb; iframe.onload = window['c'+ucb]; }	// normal
	div.appendChild(iframe);
	// form
	
	form.target = ucb;
	form.action = posturl;
	form.method = 'POST';
	div.appendChild(form);
	// submit form
	for(var key in params) {
		var input = document.createElement('input');
		input.type = 'text';
		input.name = key;
		input.value = params[key];
		form.appendChild(input);
	}
	if(window.frames[ucb].name != ucb) {
		window.frames[ucb].name = ucb;
	}
	form.submit();
}