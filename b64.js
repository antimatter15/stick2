keystr = "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789+_=";

function encode64(input) {
  var output = new Array( Math.floor( (input.length + 2) / 3 ) * 4 );
  var chr1, chr2, chr3;
  var enc1, enc2, enc3, enc4;
  var i = 0, p = 0;

  do {
    chr1 = input.charCodeAt(i++);
    chr2 = input.charCodeAt(i++);
    chr3 = input.charCodeAt(i++);

    enc1 = chr1 >> 2;
    enc2 = ((chr1 & 3) << 4) | (chr2 >> 4);
    enc3 = ((chr2 & 15) << 2) | (chr3 >> 6);
    enc4 = chr3 & 63;

    if (isNaN(chr2)) {
      enc3 = enc4 = 64;
    } else if (isNaN(chr3)) {
      enc4 = 64;
    }

    output[p++] = this.keystr.charAt(enc1);
    output[p++] = this.keystr.charAt(enc2);
    output[p++] = this.keystr.charAt(enc3);
    output[p++] = this.keystr.charAt(enc4);
  } while (i < input.length);

  return output.join('');
}

function decode64(input) {
  input = input.replace(/\//g, "_");
  var output = "";
  var chr1, chr2, chr3 = "";
  var enc1, enc2, enc3, enc4 = "";
  var i = 0;
   do {
    enc1 = this.keystr.indexOf(input.charAt(i++));
    enc2 = this.keystr.indexOf(input.charAt(i++));
    enc3 = this.keystr.indexOf(input.charAt(i++));
    enc4 = this.keystr.indexOf(input.charAt(i++));

    chr1 = (enc1 << 2) | (enc2 >> 4);
    chr2 = ((enc2 & 15) << 4) | (enc3 >> 2);
    chr3 = ((enc3 & 3) << 6) | enc4;

    output = output + String.fromCharCode(chr1);

    if (enc3 != 64) {
     output = output + String.fromCharCode(chr2);
    }
    if (enc4 != 64) {
     output = output + String.fromCharCode(chr3);
    }

    chr1 = chr2 = chr3 = "";
    enc1 = enc2 = enc3 = enc4 = "";

   } while (i < input.length);
   return unescape(output);
}


