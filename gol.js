Debugger.log("Start loading GOL script");
$(document).ready(function () {
/***********************************
 * Global Virables
 ***********************************/
var SYS_universe,
	SYS_scene,
	SYS_cur_rle,
	SYS_cur_state = 0, /* 0: paused, 1: running */
	SYS_interval_obj = 0,
/* Uncustomizable Configuration */
	CANVAS_WIDTH = 800,
	CANVAS_HEIGHT = 800,
	ORIGIN_X = 0, // position of the origin relative to the canvas - don't change it for now
	ORIGIN_Y = 0,
/* Customizable Configuration */
	SYS_golConfig = {
		gol_size_x: 200,
		gol_size_y: 200,
		target_fps: 5,
	},
	SYS_sceneConfig = {
		grid_size: 4,
		grid_color: "#aaa",
		dead_color: "#181C21",
		topleft_x: 0,
		topleft_y: 0
	};

/***********************************
 * Universe
 ***********************************/
var universe = function () {
	/* private vars */
	var attr_scene;
	//var cur_data = new Object(); // {x:{y:point,...},...}
	var cur_data = {
		//100:{100:0,101:0,102:0}
		//100:{100:0,102:0},
		//101:{101:0,102:0,104:0,105:0},
		//102:{101:0,103:0,104:0,105:0,106:0,107:0}
	};
	var next_data;
	var pattern_start_x = 0; // pattern start point relative to universe coordinate
	var pattern_start_y = 0;
	var generation = 0;
	var generation_of_last_sec = 0; // for counting fps
	var timer = 0;
	var generation_ele = $("#info_generation");
	var timer_ele = $("#info_timer");
	var fps_ele = $("#fpstext");
	var lives = 0;
	var lives_ele = $("#info_lives");

	/* public functions */
	var that = {
		/* step */
		step: function () {
			// the key algorithm goes here
			next_data = new Object();
			// First loop, count the points for every little life and his little friends
			for (var x_key in cur_data) {
				for (var y_key in cur_data[x_key]) {
					//Debugger.log("000x:"+x_key+" y:"+y_key+" p:"+point);
					var im_in_next_data = false;
					this.each_neibour(x_key, y_key, function (neib_x, neib_y) {
						if (neib_x in cur_data && neib_y in cur_data[neib_x]) {
							// neibour is alive, count for himself
							if (im_in_next_data) {
								next_data[x_key][y_key]++;
							} else {
								if (!(x_key in next_data)) {next_data[x_key] = new Object();}
								next_data[x_key][y_key] = 1;
								im_in_next_data = true;
							}
						} else {
							// neibour is dead, update the neibour's point
							if (!(neib_x in next_data)) {next_data[neib_x] = new Object();}
							if (!(neib_y in next_data[neib_x])) {
								next_data[neib_x][neib_y] = 1;
							} else {
								next_data[neib_x][neib_y]++;
							}
						}
					});// end of each_neibour
				}
			}

			// Second loop, kill the poor ones
			for (var x_key in next_data) {
				for (var y_key in next_data[x_key]) {
					// the GOD rule !!!
					var point = next_data[x_key][y_key];
//					Debugger.log("x:"+x_key+" y:"+y_key+" p:"+point);
					if (point < 2 || point > 3) {
						delete next_data[x_key][y_key];
						// check whether it is currently alive -- only for update lives count
						if (!(x_key in cur_data) || !(y_key in cur_data[x_key])) {
							// do nothing
						} else {
							//lives --;
						}
					} else if (point == 2) {
						// check whether it is currently alive
						if (!(x_key in cur_data) || !(y_key in cur_data[x_key])) {
							delete next_data[x_key][y_key];
						}
					} else {
						// check whether it is currently alive -- only for update lives count
						if (!(x_key in cur_data) || !(y_key in cur_data[x_key])) {
							//lives ++;
						}
					}
				}
			}

			delete cur_data;
			cur_data = next_data;
			generation ++;
			generation_ele.html(generation + "");
			//lives_ele.html(lives + "");
			attr_scene.refresh();
		},
		/* loop_living_ele */
		loop_living_ele: function (callback) {
			for (var x_key in cur_data) {
				for (var y_key in cur_data[x_key]) {
					callback({x:x_key,y:y_key});
				}
			}
		},
		/* (private) each_neibour */
		each_neibour: function(cur_x, cur_y, callback) {
			// be careful that "cur_x" & "cur_y" are strings !!!!!!
			var left_x  = (cur_x-1<0)?(SYS_golConfig.gol_size_x-1):(cur_x-1);
			var right_x = ((cur_x-1+2)>(SYS_golConfig.gol_size_x-1))?0:(cur_x-1+2);
//			Debugger.log("asdf: (cur_x+1):"+(cur_x-1+2)+" (SYS_golConfig.gol_size_x-1):"+(SYS_golConfig.gol_size_x-1));
			var up_y    = (cur_y-1<0)?(SYS_golConfig.gol_size_y-1):(cur_y-1);
			var down_y  = ((cur_y-1+2)>(SYS_golConfig.gol_size_y-1))?0:(cur_y-1+2);
			var x_list = [left_x, cur_x, right_x];
			var y_list = [up_y, cur_y, down_y];
			for (var i=0;i<x_list.length;i++) {
				for (var j=0;j<y_list.length;j++) {
					if (x_list[i] == cur_x && y_list[j] == cur_y) {continue;}
//					Debugger.log("neibour: x:"+x_list[i]+" y:"+y_list[j]);
					callback(x_list[i], y_list[j]);
				}
			}
		},
		
		apply_from_RLE: function (obj_pattern) {
			var x = obj_pattern.x - 0;
			var y = obj_pattern.y - 0;
			// change "n$" into multiple "$"s
			var str = ndol2multidol(obj_pattern.str);
			
			lives = 0;
			// First we determine the start point with x&y
			pattern_start_x = Math.floor((SYS_golConfig.gol_size_x - x)/2);
			pattern_start_y = Math.floor((SYS_golConfig.gol_size_y - y)/2);
			// Clear the cur_data
			delete cur_data;
			cur_data = new Object();
			var arr_pattern = str.split("$");
			var cur_x = pattern_start_x;
			var cur_y = pattern_start_y;
			for (var i in arr_pattern) {
				var each_line = arr_pattern[i];
				var cur_repeat = 1;
				var cur_repeat_str = "";
				for (var j=0;j<each_line.length;j++) {
					var each = each_line[j];
					if (each == '!') {
						break;
					} else if (ch_is_int(each)) {
						cur_repeat_str += each;
					} else if (each == 'o') {
						cur_repeat = parseInt(cur_repeat_str)?parseInt(cur_repeat_str):1;
						cur_repeat_str = "";
						for (var k=0;k<cur_repeat;k++) {
							if (!(cur_x in cur_data)) {cur_data[cur_x] = new Object();}
							cur_data[cur_x][cur_y] = 0;
							//alert("x: " + cur_x + " y: " + cur_y);
							cur_x ++;
							//lives ++;
						}
						cur_repeat = 1;
					} else if (each == 'b') {
						cur_repeat = parseInt(cur_repeat_str)?parseInt(cur_repeat_str):1;
						cur_repeat_str = "";
						for (var k=0;k<cur_repeat;k++) {
							cur_x ++;
						}
						cur_repeat = 1;
					} else {
						continue;
					}
				}
				cur_y ++;
				cur_x = pattern_start_x;
			}
			SYS_cur_rle = obj_pattern;
			//lives_ele.html(lives + "");
		},

		// load from universe into SYS_cur_rle
		load_into_RLE: function () {
			var longest_width = 0;
			var longest_height = 0;
			var tmp_width = 0;
			var result = "";
			var blank_count = 0;
			var live_count = 0;
			var first_life_met = 0;
			var dollar_stack = "";
			var smallest_x = SYS_golConfig.gol_size_x;
			for (var tmp_x in cur_data) {
				if (tmp_x - 0 < smallest_x) {
					smallest_x = tmp_x;
				}
			}
			for (var j=0;j<SYS_golConfig.gol_size_y;j++) {
				// each line
				tmp_width = 0;
				blank_count = 0;
				live_count = 0;
				if (first_life_met) {dollar_stack += "$";}
				for (var i=smallest_x;i<SYS_golConfig.gol_size_x;i++) {
					if (!(i in cur_data) || !(j in cur_data[i])) {
						// met with blank
						if (live_count > 0) {
							result += ((live_count>1?live_count:"") + "o");
							tmp_width += live_count;
							live_count = 0;
						}
						blank_count ++;
					} else {
						// met with life
						if (!first_life_met) {
							first_life_met = 1;
						}
						// print the $ stack
						result += dollar_stack;
						longest_height += dollar_stack.length;
						dollar_stack = "";
						if (blank_count > 0) {
							result += ((blank_count>1?blank_count:"") + "b");
							tmp_width += blank_count;
							blank_count = 0;
						}
						live_count ++;
					}
				}
				if (tmp_width > longest_width) {longest_width = tmp_width;}
			}
			// the final "!"
			result += "!";
			// change multiple "$"s into "n$"
			result = multidol2ndol(result);
			longest_height ++;
			SYS_cur_rle = {
				x: longest_width,
				y: longest_height,
				rule: "B3\/S23",
				str: result
			};
			return SYS_cur_rle;
		},

		timer_loop: function () { // this function will loop every second
			if (SYS_cur_state == 1) { // running
				timer ++;
				timer_ele.html(timer + "");
				fps_ele.html(generation - generation_of_last_sec + "");
				generation_of_last_sec = generation;
			} else {
				fps_ele.html(0 + "");
			}
		},

		reset_timer: function () { // reset the timer and generation
			generation = 0;
			generation_of_last_sec = 0;
			generation_ele.html(generation + "");
			timer = 0;
			timer_ele.html(timer + "");
		},
		
		// this function is used by recording functionality
		set_grid: function (x, y, born_or_kill) {
			if (born_or_kill == 1) { // born
				if (!(x in cur_data)) {cur_data[x] = new Object();}
				cur_data[x][y] = 0;
			} else if (born_or_kill == 2) { // kill
				if (x in cur_data && y in cur_data[x]) {
					delete cur_data[x][y];
				}
			} else { // reverse the status
				if (x in cur_data) {
					if (y in cur_data[x]) {
						delete cur_data[x][y];
						//lives --;
					} else {
						cur_data[x][y] = 0;
						//lives ++;
					}
				} else {
					cur_data[x] = new Object();
					cur_data[x][y] = 0;
					//lives ++;
				}
			}
			//lives_ele.html(lives + "");
			attr_scene.refresh();
		},

		/* init */
		init: function (obj_scene) {
			attr_scene = obj_scene;
			generation = 0;
			setInterval(function(){that.timer_loop();}, 1000);
		}
	};
	return that;
};// End of universe

/***********************************
 * Scene
 ***********************************/
var scene = function () {
	/* private vars */
	var attr_univ;
	var context;
	/* public functions */
	var that = {
		/* init */
		init: function (obj_univ, ele_canvas) {
			attr_univ = obj_univ;
			context = ele_canvas.getContext("2d");
			context.translate(ORIGIN_X, ORIGIN_Y);
		},
		/* refresh */
		refresh: function () {
			// clear the screen
			context.fillStyle = SYS_sceneConfig.dead_color;
			context.fillRect(0, 0, CANVAS_WIDTH, CANVAS_HEIGHT);
			attr_univ.loop_living_ele(function (obj) {
				context.fillStyle = SYS_sceneConfig.grid_color;
				var grid_size = SYS_sceneConfig.grid_size;
				var grid_topleft_x = (obj.x - SYS_sceneConfig.topleft_x) * grid_size;
				var grid_topleft_y = (obj.y - SYS_sceneConfig.topleft_y) * grid_size;
				context.fillRect(grid_topleft_x, grid_topleft_y, grid_size, grid_size);
			});
		}
	};
	return that;
};// End of scene

/***********************************
 * The pattern recording functionality
 ***********************************/
$("#go-canvas").bind("click", function (event) {
	if (SYS_cur_state) {return;}
	var that = $("#go-canvas");
	var mouseX = event.pageX - that.position().left;
	var mouseY = event.pageY - that.position().top;
	SYS_universe.set_grid(Math.floor(mouseX / SYS_sceneConfig.grid_size),
	                      Math.floor(mouseY / SYS_sceneConfig.grid_size),
	                      0); // 0 means reverse the status
	$("#pattern_pulldown").get(0).value = "go_custom";
});

/***********************************
 * Control Panels
 ***********************************/
var RLE_load_patterns = function () {
	var text = "";
	for (var i in SYS_patterns) {
		if (i == "Almosymmetric") {
			text += "<option value=\"" + i + "\" selected>" + i + "</option>";
		} else {
			text += "<option value=\"" + i + "\">" + i + "</option>";
		}
	}
	$("#pattern_pulldown").html(text);
	var newEle = $("<option id=\"go_custom\" value=\"go_custom\">Custom Pattern</option>");
	newEle.appendTo($("#pattern_pulldown"));
};

var RLE_switch_pattern = function (pattern) {
	SYS_cur_rle = SYS_patterns[pattern];
	var text = RLE_obj2str(SYS_cur_rle);
	$("#rle_textarea").attr("value", text);
};

var main_loop = function () {
	SYS_universe.step();
};
var start_running = function () {
	SYS_interval_obj = setInterval(function(){main_loop();}, Math.floor(1000/SYS_golConfig.target_fps));
	SYS_cur_state = 1;
};

var stop_running = function () {
	if (SYS_interval_obj) {
		clearInterval(SYS_interval_obj);
	}
	SYS_interval_obj = 0;
	SYS_cur_state = 0;
};

var reset_pattern = function () {
	// same as the "apply" button
	var obj_pattern = RLE_str2obj($("#rle_textarea").attr("value"));
	if (!obj_pattern) {alert("Error parsing RLE string !");}
	SYS_universe.apply_from_RLE(obj_pattern);
	SYS_scene.refresh();
	SYS_universe.reset_timer();
};

var init_control_panel = function () {
	RLE_load_patterns();
	$("#pattern_pulldown").bind("change", function (event) {
		//$("#go_custom").attr("selected", "");
		var str_pattern = $("#pattern_pulldown > option")[this.selectedIndex].value;
		if (str_pattern == "go_custom") {
		} else {
			RLE_switch_pattern(str_pattern);
			SYS_universe.apply_from_RLE(SYS_patterns[str_pattern]);
			SYS_scene.refresh();
		}
	});
	$("#rle_textarea").bind("change", function (event) {
		$("#pattern_pulldown").get(0).value = "go_custom";
	});
	$("#apply_btn").bind("click", function (event) {
		var obj_pattern = RLE_str2obj($("#rle_textarea").attr("value"));
		if (!obj_pattern) {alert("Error parsing RLE string !");}
		SYS_universe.apply_from_RLE(obj_pattern);
		SYS_scene.refresh();
		SYS_universe.reset_timer();
	});
	$("#load_btn").bind("click", function (event) {
		SYS_universe.load_into_RLE();// load from universe into SYS_cur_rle
		$("#pattern_pulldown").get(0).value = "go_custom";
		$("#rle_textarea").attr("value", RLE_obj2str(SYS_cur_rle));
	});
	$("#start_btn").bind("click", function (event) {
		start_running();
		this.disabled = "true";
		$("#pattern_pulldown").attr("disabled", "disabled");
		$("#rle_textarea").attr("disabled", "disabled");
		$("#apply_btn").attr("disabled", "disabled");
		$("#record_btn").attr("disabled", "disabled");
		$("#load_btn").attr("disabled", "disabled");
		$("#fps_pulldown").attr("disabled", "disabled");
		$("#dead_color_input").attr("disabled", "disabled");
		$("#alive_color_input").attr("disabled", "disabled");
		$("#reset_btn").attr("disabled", "diabled");
		$("#grid_size_pulldown").attr("disabled", "diabled");
		
		$("#pause_btn").attr("disabled", false);
		//$("#pause_btn").en = "";
	});
	$("#pause_btn").bind("click", function (event) {
		stop_running();
		this.disabled = "true";
		$("#pattern_pulldown").attr("disabled", false);
		$("#rle_textarea").attr("disabled", false);
		$("#apply_btn").attr("disabled", false);
		$("#record_btn").attr("disabled", false);
		$("#load_btn").attr("disabled", false);
		$("#fps_pulldown").attr("disabled", false);
		$("#dead_color_input").attr("disabled", false);
		$("#alive_color_input").attr("disabled", false);
		$("#reset_btn").attr("disabled", false);
		$("#grid_size_pulldown").attr("disabled", false);

		$("#start_btn").attr("disabled", false);
	});
	$("#reset_btn").bind("click", function (event) {
		reset_pattern();
	});
	$("#fps_pulldown").bind("change", function (event) {
		SYS_golConfig.target_fps = parseInt($("#fps_pulldown > option")[this.selectedIndex].value);
	});
	$("#dead_color_input").bind("change", function (event) {
		SYS_sceneConfig.dead_color = this.value;
	});
	$("#alive_color_input").bind("change", function (event) {
		SYS_sceneConfig.grid_color = this.value;
	});
	$("#grid_size_pulldown").bind("change", function (event) {
		var size_x = CANVAS_WIDTH / this.value;
		var size_y = CANVAS_HEIGHT / this. value;
		SYS_golConfig.gol_size_x = size_x;
		SYS_golConfig.gol_size_y = size_y;
		SYS_sceneConfig.grid_size = parseInt(this.value);
		reset_pattern();
		$("#scene_size_show").html(size_x + " X " + size_y);
	});
	
};// End of init_control_panel

/***********************************
 * Main function
 ***********************************/
var gol_main = function () {
	Debugger.log("Start GOL main function");
	SYS_scene = scene();
	SYS_universe = universe();
	SYS_scene.init(SYS_universe, document.getElementById("go-canvas"));
	SYS_universe.init(SYS_scene);
	init_control_panel();

	// set initial pattern
	RLE_switch_pattern("Almosymmetric");
	SYS_universe.apply_from_RLE(SYS_patterns["Almosymmetric"]);
	SYS_scene.refresh();

	//setInterval(function(){SYS_universe.step();}, 2000);
	//alert(multidol2ndol(ndol2multidol("a2$a3$a10$a")));
	var tmp = {100001:{100002:1}};

}();// End of gol_main
});// End of $(document).ready
Debugger.log("Finished loading GOL script");

