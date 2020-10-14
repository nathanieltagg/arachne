//
// Code for the Arachne Event Display
// Author: Nathaniel Tagg ntagg@otterbein.edu
// 
// Licence: this code is free for non-commertial use. Note other licences may apply to 3rd-party code.
// Any use of this code must include attribution to Nathaniel Tagg at Otterbein University, but otherwise 
// you're free to modify and use it as you like.
//

///
/// Boilerplate:  Javascript utilities for MINERvA event display, codenamed "Arachne"
/// Nathaniel Tagg  - NTagg@otterbein.edu - June 2009
///


// Utility functions
function isIOS()
{
    return (
        //Detect iPhone
        (navigator.platform.indexOf("iPhone") != -1) ||
        //Detect iPad
        (navigator.platform.indexOf("iPad") != -1) ||
        //Detect iPod
        (navigator.platform.indexOf("iPod") != -1)
    );
}

///
/// Base class: Pad.
/// This forms a 2-d drawing canvas with support for axes and things.
/// The base inElement should be something simple, ideally a div
///


function Pad( element, options )
{
  ///
  /// Constructor.
  ///
  // console.log('Pad ctor');
  if(!element) { 
    // console.log("Pad: NULL element provided."); 
    return; 
  }
  if($(element).length<1) { 
    // console.log("Pad: Zero-length jquery selector provided."); 
    return;
  }
  this.element = $(element).get(0); 
  this.width  = 10;
  this.height = 10;

  // Options - defaults. Sensible for a wide range of stuff.
  this.margin_bottom = 5;
  this.margin_top = 5;
  this.margin_right = 5;
  this.margin_left = 5;
  this.min_u = 0; // x-coordinate, natural units.
  this.max_u = 1;
  this.min_v = 0; // y-coordinate, natural units.
  this.max_v = 1;
  this.bg_color = "255,255,255";
  this.draw_box = true;
  this.draw_axes = true;
  this.draw_ticks_x=true;
  this.draw_grid_x=true;
  this.draw_tick_labels_x=true;
  this.draw_ticks_y=true;
  this.draw_grid_y=true;
  this.draw_tick_labels_y=true;
  this.tick_pixels_x = 40;
  this.tick_pixels_y = 40;
  this.log_y=false;
  
  this.xlabel = null;
  this.ylabel = null;
  this.label_font = "16px sans-serif";
  
  // Merge in the options.
  $.extend(true,this,options);

  // Merge in options from element
  var element_settings = $(element).attr('settings');
  var element_settings_obj={};
  if(element_settings) {
    eval( "var element_settings_obj = { " + element_settings + '};');; // override from 'settings' attribute of html object.
    // console.log(element_settings, element_settings_obj);
    $.extend(true,this,element_settings_obj); // Change default settings by provided overrides.
  
  }
  // Look for an existing canvas, and build one if it's not there.
  if($('canvas',this.element).length<1) {
    this.canvas = document.createElement("canvas");
    this.element.appendChild(this.canvas);

    if (typeof FlashCanvas != "undefined") {
        FlashCanvas.initElement(this.canvas);
    }

  } else {
    this.canvas = $('canvas',this.element).get(0);    
  }

  // Build the drawing context.
  this.ctx = this.canvas.getContext('2d');
  if(initCanvas) this.ctx = initCanvas(this.canvas).getContext('2d');
  if(!this.ctx) console.log("Problem getting context!");
  
  // Resize the canvas to the coordinates specified, either in html, the css, or options provided.
  this.Resize();
   
  // Bind resizing to a sensible closure.
  var self = this;
  $(this.element).resize(function(ev){
                         self.Resize(); 
                         self.Draw();
                         });                                               
   // Printing support. Make sure that our element has type 'pad'.
  $(this.element).addClass('pad');
  $(this.element).bind('PrintHQ',function(ev){
                        self.PrintHQ(); 
                        });                                               
  this.Clear();
}

Pad.prototype.Resize = function()
{
  // Set this object and canvas properties.
  var width = this.width;
  var height = this.height;
  if( !$(this.element).is(":hidden") ) {
    width = $(this.element).width();
    height = $(this.element).height(); 
  }
  // console.log("Resize",$(this.element),width,height);

  this.canvas.width = this.width = width;
  this.canvas.height = this.height = height;
  this.padPixelScaling = 1;
  
  if(window.devicePixelRatio > 1) {
    // Retina display! Cool!
    this.padPixelScaling = window.devicePixelRatio;
  }
    // this.canvas.width = width * window.devicePixelRatio;
    // this.canvas.height = height * window.devicePixelRatio;
    this.canvas.setAttribute('width', width *  this.padPixelScaling);
    this.canvas.setAttribute('height', height *  this.padPixelScaling);
    $(this.canvas).css('width', width );
    $(this.canvas).css('height', height );
    this.ctx.scale(this.padPixelScaling,this.padPixelScaling);
    
  this.origin_x = this.margin_left;
  this.origin_y = height - this.margin_bottom;

  this.span_x = width-this.margin_right -this.origin_x;
  this.span_y = this.origin_y-this.margin_top;
}

Pad.prototype.GetGoodTicks = function( min, max, maxticks, logscale ) 
{
  // console.warn("GetGoodTicks:",min,max,maxticks,logscale);
  var dumbTickWidth = (max - min) / maxticks;
  var thelog = 0.4342944 * Math.log(dumbTickWidth);  // ie. log10(dumbTickWidth)
  var multiplier = Math.pow(10, Math.floor(thelog));
  var abcissa = Math.pow(10, thelog) / multiplier;
  // Gives a number between 1 and 9.999
  var sigfigs = 1;
  var goodTickWidth = dumbTickWidth;

  if (logscale === false)
   {
      if (abcissa < 2.5) {
          goodTickWidth = 2 * multiplier;
          // sigfigs = 2;
      } else if (abcissa < 7.0) {
          goodTickWidth = 5.0 * multiplier;
      } else {
          goodTickWidth = 10.0 * multiplier;
      }

      var x = Math.ceil(min / goodTickWidth) * goodTickWidth;
      // console.warn("goodticks: goodTickWidth = ",goodTickWidth,multiplier);
      var retval = new Array(0);
      var i = 0;
      while (x < max) {
          retval[i] = ((x*10000).toFixed(0)/10000); // Limit to 4 decimal places, to keep from gettting things like 2.2000000001
          // console.log("goodticks " + i + " " + retval[i]);
          x += goodTickWidth;
          i++;
      }


      //cout << "Good width " << goodTickWidth << endl;
      return retval;
  } else {
      var low10 = Math.ceil(0.4342944 * Math.log(min));
      var high10 = Math.ceil(0.4342944 * Math.log(max));
      var width = 1;
      // console.log(low10,high10,width,maxticks,width);
      while (((high10 - low10) / width) > maxticks) width += 1;
      var retval = [];
      var p = low10;
      var i = 0;
      while (p < high10) {
          retval[i++] = Math.pow(10, p);
          p += width;
      }
      return retval;
  }
}


Pad.prototype.Clear = function()
{
  //console.log("Pad.Clear()");
  if (!this.ctx) return;
  this.ctx.fillStyle = "rgb("+this.bg_color+")";
  this.ctx.fillRect(0,0,this.canvas.width,this.canvas.height);
}

Pad.prototype.DrawFrame = function()
{
  if (!this.ctx) return;
    this.ctx.fillStyle = "rgb(0,0,0)";
    this.ctx.strokeStyle = "rgb(0,0,0)";

    // Sanity.
    if(this.log_y && this.min_v <=0) this.min_v = 0.5;
    
    if(this.draw_axes) {
    // Draw the axes.
    this.ctx.fillRect(this.origin_x-2,this.origin_y,this.canvas.width-this.margin_right-this.origin_x,2);
    //ctx.fillStyle = "rgb(0,200,0)";
    this.ctx.fillRect(this.origin_x-2,this.margin_top,2,this.origin_y-this.margin_top);
    }
    if(this.draw_box) {
      // Draw the box.
      this.ctx.strokeStyle = "rgba(0,0,0,0.75)";
      this.ctx.lineWidth = 1;
      this.ctx.beginPath();
      this.ctx.moveTo(this.origin_x,             this.origin_y);
      this.ctx.lineTo(this.origin_x+this.span_x, this.origin_y);
      this.ctx.lineTo(this.origin_x+this.span_x, this.origin_y-this.span_y);
      this.ctx.lineTo(this.origin_x,             this.origin_y-this.span_y);
      this.ctx.lineTo(this.origin_x,             this.origin_y)
      this.ctx.stroke();      
    }
    
    // Draw labels
    this.ctx.font = this.label_font;
    this.ctx.textAlign = 'right';

    if(this.xlabel && $('#ctl-show-labels').is(':checked')) {
      this.ctx.save();
      this.ctx.translate(this.canvas.width-this.margin_right, this.canvas.height);
      this.ctx.textBaseline = 'bottom';
      this.ctx.fillText(this.xlabel, 0,0);
      this.ctx.restore();
    }
    
    if(this.ylabel && $('#ctl-show-labels').is(':checked')) {
      this.ctx.save();
      this.ctx.translate(0,this.margin_top);      
      this.ctx.rotate(-90*3.1416/180);
      //this.ctx.drawTextRight(font,fontsize,0,+asc,this.ylabel);
      this.ctx.textBaseline = 'top';
      this.ctx.fillText(this.ylabel, 0, 0);    
      this.ctx.restore();
    }



    if(this.draw_ticks_x || this.draw_tick_labels_x || this.draw_grid_x)
    {
      // Do the X-axis.
      var tickLen = 8;
      this.ctx.font = "12px sans-serif";
      this.ctx.textAlign = 'center';
      this.ctx.textBaseline = 'top';
      var ticks = this.GetGoodTicks(this.min_u, this.max_u, Math.round(this.span_x/this.tick_pixels_x), false);
      //console.log(this.fName + " " + ticks + " " + this.min_u + " " + this.max_u);
      var nt = ticks.length;
      for( var i=0;i<nt;i++) {
        var ttick = ticks[i];
        var x = this.GetX(ttick);
        if(this.draw_grid_x) {
          this.ctx.fillStyle = "rgba(100,100,100,0.5)";
          this.ctx.fillRect(x,this.origin_y-this.span_y,0.5,this.span_y);          
        }
        if($('#ctl-show-tick-labels').is(':checked')) {
          if(this.draw_ticks_x) {
            this.ctx.fillStyle = "rgba(0,0,0,1.0)";
            this.ctx.fillRect(x,this.origin_y,1,tickLen);
          }
          if(this.draw_tick_labels_x){
            this.ctx.fillStyle = "rgba(20,20,20,1.0)";
            //this.ctx.drawTextCenter(font,fontsize,x,this.origin_y+tickLen+asc,String(ttick));
            this.ctx.fillText(String(ttick), x, this.origin_y+tickLen);
          }
        }
      }
    }
    
    if(this.draw_ticks_y || this.draw_tick_labels_y || this.draw_grid_y)
    {
      // Draw Y ticks
      var tickLen = 8;
      this.ctx.font = "12px sans-serif";
      this.ctx.textAlign = 'right';
      this.ctx.textBaseline = 'middle';
      var ticks = this.GetGoodTicks(this.min_v, this.max_v, Math.round(this.span_y/this.tick_pixels_y), this.log_y);
      var nt = ticks.length;
      for( var i=0;i<nt;i++) {
        var ftick = ticks[i];
        var y = this.GetY(ftick);
        if($('#ctl-show-tick-labels').is(':checked')) {
          if(this.draw_ticks_y) {
            this.ctx.fillStyle = "rgba(0,0,0,1.0)";
            this.ctx.fillRect(this.origin_x-tickLen,y,tickLen,1);
          }
          if(this.draw_tick_labels_y) {
            this.ctx.fillStyle = "rgba(20,20,20,1.0)";
            //this.ctx.drawTextRight(font,fontsize,this.origin_x-tickLen,y+asc/2,String(ftick));
            this.ctx.fillText(String(ftick), this.origin_x-tickLen-1, y);
          }
        }
        if(this.draw_grid_y) {
          this.ctx.fillStyle = "rgba(100,100,100,1.0)";         
          this.ctx.fillRect(this.origin_x,y,this.span_x,0.5); // Draw across fill area, too       
          this.ctx.fillStyle = "rgba(100,100,100,1.0)";         
          this.ctx.fillRect(this.origin_x,y,this.span_x,0.5); // Draw across fill area, too       
        }        
     }
  }  
}

Pad.prototype.Draw = function()
{
  this.Clear();
  this.DrawFrame();
}


Pad.prototype.GetX = function( u ) 
{
  return this.origin_x + this.span_x*(u-this.min_u)/(this.max_u-this.min_u);
}

Pad.prototype.GetY = function( v ) 
{
  return this.origin_y - this.span_y*(v-this.min_v)/(this.max_v-this.min_v);
}

Pad.prototype.GetU = function( x ) 
{
  return (x-this.origin_x)/this.span_x*(this.max_u-this.min_u) + this.min_u;
}

Pad.prototype.GetV = function( y ) 
{
  return (this.origin_y-y)/this.span_y*(this.max_v-this.min_v) + this.min_v;
}

Pad.prototype.PrintHQ = function()
{
  // First, save our current state.
  var saveCanvas = this.canvas;
  var saveCtx    = this.ctx;
  var saveWidth  = this.width;
  var saveHeight = this.height;
  
  // Second, create an offscreen drawing context.   
  var canvas = document.createElement("canvas");
  this.canvas = canvas;
  canvas.width = saveWidth * gPrintScale;
  canvas.height = saveHeight * gPrintScale;
  // this.width  = saveWidth * gPrintScale;
  // this.height = saveHeight * gPrintScale;
  this.ctx = this.canvas.getContext("2d");
  if(initCanvas) this.ctx = initCanvas(this.canvas).getContext('2d');

  // Now do the actual draw
  // this.Resize();
  this.ctx.scale(gPrintScale,gPrintScale);
  this.Draw();
  
  // Save the print result
  gPrintBuffer = this.canvas.toDataURL('image/png');

  
  // Restore defaults.
  this.canvas = saveCanvas;
  this.ctx    = saveCtx;  
  
  
  // nuke buffer.
  // document.removeChild(canvas); // Doesn't work. Is this thing a memory leak? I don't think so - I htink the canvas vanishes when it goes out of scope.
}
