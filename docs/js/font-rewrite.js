var mtx = {};

(function() {
	
		var stop = false,
				frm, lineDelay, charDelay,
				colorText, colorMatch, colorGhost, elapsedTime,
				lineIndex = 0,
				lineChar = [],
				animStack = [],
				colorStack = [];

		// rgb color

		function colorRGB(c) {
			
				return 'rgb(' + 
					Math.round(Math.min(255, Math.max(0, c[0]))) + ',' + 
					Math.round(Math.min(255, Math.max(0, c[1]))) + ',' + 
					Math.round(Math.min(255, Math.max(0, c[2]))) + ')';
			
		}

		// Easing functions

		function Ease() {};
	
		Ease.prototype = {
			
				ease: function() {
						this.m += this.s;
						this.x0 += (this.d * this.m * .0025);
						if (this.m == 20) this.s = -1;
						return this.x0;
				},
			
				init: function(x0, x1) {
						this.m = 0;
						this.s = 1;
						this.d = x1 - x0;
						this.x0 = x0;
				}
			
		}

		// loading lines

		function loadLines() {
			var fontNode = document.querySelector("#font-title");
            fontNode.style.fontSize=Math.floor(document.body.clientWidth*48/window.screen.width)+"px";
            // read text from HTML
			text = document.getElementById("font-text").innerHTML.split("\n");
				// loop through all lines
				for (var j = 0; j < text.length; j++) {
						var t = text[j];
						if (t) {
								var n = t.length;
								lineChar[j] = [];
								// first pass: create characters capture RELATIVE offset coordinates
								for (var i = 0; i < n; i++)
										lineChar[j][i] = new Character(t.charAt(i), j);
								// second pass: convert to absolute position
								for (var i = 0, o; o = lineChar[j][i]; i++) {
										if (o.c == "|") {
												// remove spaces
												lineChar[j].splice(i, 1);
												frm.removeChild(o.o);
												i--;
										} else {
												// convert to absolute position and render
												o.o.style.position = "absolute";
												o.o.style.color = colorRGB(colorText);
												o.moveHTML();
												// push first line to animation queue
												if (j == 0) pushAnim(o, charDelay * i);
										}
								}
						}
				}
			
		}

		// Character Constructor
		function Character(c, line) {
			
				if (c == " ") c = "|";
				this.c = c;
				// create HTML element and append
				this.o = document.createElement("span");
				this.o.innerHTML = c;
				this.o.style.zIndex = 2;
				frm.appendChild(this.o);
			
				// capture relative offset positions
				this.x0 = this.o.offsetLeft;
				this.y0 = -this.o.offsetHeight * 1.5;
				this.x1 = this.x0;
				this.x2 = this.x0;
				this.y1 = (line + 1) * this.o.offsetHeight;
				this.y2 = frm.offsetHeight;
				this.mx = new Ease();
				this.my = new Ease();
				this.c0 = [colorText[0], colorText[1], colorText[2]];
			
		}

		Character.prototype = {

				// character animation

				anim: function(i) {
					
						// tempo
						if (this.delay > 0) {
								if (elapsedTime)
										this.delay -= new Date().getTime() - elapsedTime;
						} else {
							
								// moving
								this.x0 = this.mx.ease();
								this.y0 = this.my.ease();
								this.moveHTML();
								if (!this.my.m && !this.mx.m) {
										// remove from queue
										animStack.splice(i, 1);
										// remove dead characters
										if (this.off) frm.removeChild(this.o);
								}
							
						}
					
				},

				//  color fading  

				color: function(i) {
					
						this.c0[0] += this.cr[0];
						this.c0[1] += this.cr[1];
						this.c0[2] += this.cr[2];
						this.ci++;
						this.o.style.color = colorRGB(this.c0);
						if (this.ci >= this.cs) {
								colorStack.splice(i, 1);
						}
					
				},

				// move

				moveHTML: function() {
					
						this.o.style.transform =
						this.o.style.webkitTransform = 'matrix(1,0,0,1,' + this.x0 + ',' + this.y0 + ')';
					
				},

				// init color

				colorFade: function(c1, steps) {
						this.cs = steps;
						this.cr = [(c1[0] - this.c0[0]) / steps, (c1[1] - this.c0[1]) / steps, (c1[2] - this.c0[2]) / steps];
						if (this.cr[0] != 0 || this.cr[1] != 0 || this.cr[2] != 0) {
								this.ci = 0;
								colorStack.push(this);
						}
				}
			
		}

		// push character to the animation queue 

		function pushAnim(o, delay) {
			
				o.mx.init(o.x0, o.x1);
				o.my.init(o.y0, o.y1);
				o.delay = delay;
				animStack.push(o);
			
		}

		// next line

		function nextLine() {
			
				if (lineIndex < lineChar.length - 1) {
						// display shadow text
						for (var i = 0, o; o = lineChar[lineIndex][i]; i++) {
								var s = o.o.cloneNode(true);
								s.style.zIndex = 1;
								s.style.color = colorRGB(colorGhost);
								frm.appendChild(s);
						}
					
						// matching next line characters
						for (var i = 0, t; t = lineChar[lineIndex + 1][i]; i++) {
								for (var j = 0, o; o = lineChar[lineIndex][j]; j++) {
										if (o.c == t.c) {
												// colors
												if (o.match) t.o.style.color = colorRGB(colorMatch);
												else t.colorFade(colorMatch, 40);
												t.match = true;
												// swap characters
												t.x0 = o.x0;
												t.y0 = o.y0;
												t.moveHTML();
												// remove redundant character
												frm.removeChild(o.o);
												lineChar[lineIndex].splice(j, 1);
												break;
										}
								}
						}
					
						// take off redundant characters
						for (var i = 0, o; o = lineChar[lineIndex][i]; i++) {
								// set target position (off frame)
								o.y1 = frm.offsetHeight;
								o.off = true;
								o.match = false;
								o.colorFade(colorText, 40);
								// push in animation stack
								pushAnim(o, (lineDelay * .8) + charDelay * i);
						}
				}
			
				// push next line in animation stack
				lineIndex++;
				if (lineIndex < lineChar.length) {
						for (var i = 0, o; o = lineChar[lineIndex][i]; i++)
								pushAnim(o, lineDelay + charDelay * i);
				}
			
		}

		//  main animation loop

		function main() {

				requestAnimationFrame(main);
			
				//  characters
				var n = animStack.length;
				if (n) {
						for (var i = 0; i < n; i++) {
								animStack[i].anim(i);
						}
				} else nextLine();
			
				// colors 
				n = colorStack.length;
				for (var i = 0; i < n; i++) {
						colorStack[i].color(i);
				}

				elapsedTime = new Date().getTime();
			
		}

		// public methods

		this.init = function(options) {

				frm = document.getElementById(options.elem);
				lineDelay = options.lineDelay;
				charDelay = options.charDelay;
				colorText = options.colorText;
				colorMatch = options.colorMatch;
				colorGhost = options.colorGhost;
				loadLines();
				main();

		};
	
		this.reset = function() {

			frm.innerHTML = "";
		}

		this.changeText = function() {

				lineChar = [];
				animStack = [];
				colorStack = [];
				frm.innerHTML = "";
				lineIndex = 0;
				elapsedTime = 0;
				loadLines();
				frm.focus();

		};

		this.show = function() {
				document.getElementById("font-text").focus();
		};

}).apply(mtx);

// init script

mtx.init({

		elem: "font-title",
		lineDelay: 1000,
		charDelay: 120,
		colorText: [0, 0, 0],
		colorMatch: [255, 64, 0],
		colorGhost: [144, 144, 144]

});