var Debugger = function(){};
Debugger.log = function(message){
	try {
		console.log(message);
	} catch (exception) {
		return;
	}
}

var RLE_str2obj = function (str) {
	// There should be two lines
	var arr_lines = str.split("\n");
	var obj = {};
	if (arr_lines.length != 2) {
		return false;	
	}
	// First line
	var reg = /^.*x = (\d+), y = (\d+), rule = (.*)$/;
	var result = arr_lines[0].match(reg);
	if (result != null) {
		obj.x = parseInt(result[1]);
		obj.y = parseInt(result[2]);
		obj.rule = result[3];
	} else {	
		return false;
	}
	// Second line
	obj.str = arr_lines[1];
	return obj;
};

var RLE_obj2str = function (obj) {
	var text = "x = " + obj.x + ", y = " + obj.y + ", rule = " + obj.rule + "\n";
	text += obj.str + "";
	return text;
};

var ch_is_int = function (ch) {
	return (ch >= "0" && ch <= "9");
};

// multiple $s into "n$"
var multidol2ndol = function (str) {	
	var rtn = "";
	var count = 0;
	for (var i=0;i<str.length;i++) {
		var ch = str[i];
		if (ch == "$") {
			count ++;
		} else {
			if (count == 1) {
				rtn += "$";
			} else if (count > 1) {
				rtn += (count + "$");
			}
			rtn += ch;
			count = 0;
		}
	}
	return rtn;
};

// "n$" into multiple $s
var ndol2multidol = function (str) {
	var rtn = "";
	var prefix = 0;
	for (var i=0;i<str.length;i++) {
		var ch = str[i];
		if (ch < "0" || ch > "9") {
			if (ch == "$") {
				if (prefix == 0) {
					rtn += "$";
				} else {
					for (var j=0;j<prefix;j++) {
						rtn += "$";
					}
				}
			} else {
				if (prefix > 0) {
					rtn += ("" + prefix);
				}
				rtn += ch;	
			}
			prefix = 0;
		} else {
			//alert(ch);
			prefix = prefix * 10 + parseInt(ch);
		}
	}
	return rtn;
};
