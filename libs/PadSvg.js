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

///
/// Base class: PadSvg.
/// This forms a 2-d drawing canvas with support for axes and things.
/// The base inElement should be something simple, ideally a div
///


function PadSvg( element, options )
{
  ///
  /// Constructor.
  ///
  console.log('PadSvg ctor');
  if(!element) { 
    // console.log()
return; 
  }
  if($(element).length<1) { 
    // console.log()
return;
  }
  this.element = element; 
  this.width  = 1;
  this.height = 1;

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
  this.draw_label_x = true;
  this.draw_label_y = true;
  this.draw_ticks_x=true;
  this.draw_grid_x=true;
  this.draw_tick_labels_x=true;
  this.draw_ticks_y=true;
  this.draw_grid_y=true;
  this.draw_tick_labels_y=true;
  this.tick_pixels_x = 40;
  this.tick_pixels_y = 100;
  this.log_y=false;

  var self = this;

  // Merge in the options.
  $.extend(true,this,options);

  // Destroy existing svg if it exists.
  if($('svg',this.element).length>0) { $(this.element).svg('destroy');};

  // Build svg element.
  // FIXME: On IE, it needs to load a blank document. I should really stall here until this loading is complete
  $(this.element).svg({onLoad: function(){} });
  this.svg = $(this.element).svg('get'); 
  
  
  // Resize the canvas to the coordinates specified, either in html, the css, or options provided.
  this.Resize();
   
  // Bind resizing to a sensible closure.
  $(this.element).bind('resize',function(ev){
                                               self.Resize(); 
                                               self.Draw();
                                               });                                               
  this.Clear();
}


PadSvg.prototype.Resize = function()
{
  // Set this object and canvas properties.
  var width = this.width;
  var height = this.height;
  if(!$(this.element).is(":hidden")) {
    width = $(this.element).width();
    height = $(this.element).height(); 
  }
  console.log("Resize",$(this.element),width,height);
  if((this.width  == width) &&
     (this.height == height) ) return;
  
  this.width = width;
  this.height = height;
  
  this.origin_x = this.margin_left;
  this.origin_y = height - this.margin_bottom;

  this.span_x = width-this.margin_right-this.origin_x;
  this.span_y = this.origin_y-this.margin_top;
}

PadSvg.prototype.GetGoodTicks = function( min, max, maxticks, logscale ) 
{
  var dumbTickWidth = (max - min) / maxticks;
  var thelog = 0.4342944 * Math.log(dumbTickWidth);
  // log10(dumbTickWidth)
  var multiplier = Math.pow(10, Math.floor(thelog));
  var abcissa = Math.pow(10, thelog) / multiplier;
  // Gives a number between 1 and 9.999
  var sigfigs = 1;
  var goodTickWidth = dumbTickWidth;

  if (logscale === false)
   {
      if (abcissa < 3.0) {
          goodTickWidth = 2.5 * multiplier;
          sigfigs = 2;
      } else if (abcissa < 7.0) {
          goodTickWidth = 5.0 * multiplier;
      } else {
          goodTickWidth = 10.0 * multiplier;
      }

      var x = Math.ceil(min / goodTickWidth) * goodTickWidth;
      var retval = new Array(0);
      var i = 0;
      while (x < max) {
          //log("goodticks " + i + " " + x);
          retval[i] = x;
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
      var retval = new Array(0);
      var p = low10;
      var i = 0;
      while (p < high10) {
          retval[i++] = Math.pow(10, p);
          p += width;
      }
      return retval;
  }
}


PadSvg.prototype.Clear = function()
{
}

PadSvg.prototype.DrawFrame = function()
{
  console.log("PadSvg:DrawFrame()",this);
  if (!this.svg) return;
  console.log($("g[comp='frame']",this.svg.root())); 
  if($("g[comp='frame']",this.svg.root()).length>0) return; // Don't redraw frame.
    // Sanity.
    if(this.log_y && this.min_v <=0) this.min_v = 0.5;
    
    var frame = this.svg.group({comp: 'frame', stroke: 'black', strokeWidth: 2});
    
    if(this.draw_axes) {
    // Draw the axes.
    // this.ctx.fillStyle = "rgb(0,0,0)";
    // this.ctx.fillRect(this.origin_x-2,this.origin_y,this.canvas.width-this.margin_right-this.origin_x,2);
    // //ctx.fillStyle = "rgb(0,200,0)";
    // this.ctx.fillRect(this.origin_x-2,this.margin_top,2,this.origin_y-this.margin_top);
    console.log("Drawing axes");
    this.svg.line(frame,200,200,100,100);
    this.svg.line(frame,this.origin_x,this.origin_y,this.width-this.margin_right,this.origin_y);
    this.svg.line(frame,this.origin_x,this.origin_y,this.origin_x,this.margin_top);
    }
    if(this.draw_box) {
      // Draw the box.
      var g = this.svg.group(frame,{stroke:'gray', strokeWidth: 1});
      this.svg.line(g,this.origin_x,this.origin_y,
                      this.origin_x+this.span_x, this.origin_y);
                      
      this.svg.line(g,this.origin_x+this.span_x, this.origin_y,
                      this.origin_x+this.span_x, this.origin_y-this.span_y);

      this.svg.line(g,this.origin_x+this.span_x, this.origin_y-this.span_y,
                      this.origin_x,             this.origin_y-this.span_y);
                      
      this.svg.line(g,this.origin_x,             this.origin_y-this.span_y,
                      this.origin_x,             this.origin_y);
    }
    
    /*
    // Draw labels
    this.ctx.font = "16px sans-serif";
    this.ctx.textAlign = 'right';

    if(this.draw_label_x) {
      this.ctx.save();
      this.ctx.translate(this.canvas.width-this.margin_right, this.canvas.height);
      this.ctx.textBaseline = 'bottom';
      this.ctx.fillText(this.xlabel, 0,0);
      this.ctx.restore();
    }
    
    if(this.draw_label_y) {
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
        if(this.draw_ticks_x) {
          this.ctx.fillStyle = "rgba(0,0,0,1.0)";
          this.ctx.fillRect(x,this.origin_y,1,tickLen);
        }
        if(this.draw_grid_x) {
          this.ctx.fillStyle = "rgba(100,100,100,0.5)";
          this.ctx.fillRect(x,this.origin_y-this.span_y,0.5,this.span_y);          
        }
        if(this.draw_tick_labels_x){
          this.ctx.fillStyle = "rgba(20,20,20,1.0)";
          //this.ctx.drawTextCenter(font,fontsize,x,this.origin_y+tickLen+asc,String(ttick));
          this.ctx.fillText(String(ttick), x, this.origin_y+tickLen);
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
        if(this.draw_ticks_y) {
          this.ctx.fillStyle = "rgba(0,0,0,1.0)";
          this.ctx.fillRect(this.origin_x-tickLen,y,tickLen,1);
        }
        if(this.draw_grid_y) {
          this.ctx.fillStyle = "rgba(100,100,100,1.0)";         
          this.ctx.fillRect(this.origin_x,y,this.span_x,0.5); // Draw across fill area, too       
          this.ctx.fillStyle = "rgba(100,100,100,1.0)";         
          this.ctx.fillRect(this.origin_x,y,this.span_x,0.5); // Draw across fill area, too       
        }
        if(this.draw_tick_labels_y) {
          this.ctx.fillStyle = "rgba(20,20,20,1.0)";
          //this.ctx.drawTextRight(font,fontsize,this.origin_x-tickLen,y+asc/2,String(ftick));
          this.ctx.fillText(String(ftick), this.origin_x-tickLen-1, y);
        }
     }
    
  } 
   */ 
}

PadSvg.prototype.Draw = function()
{
  this.Clear();
  this.DrawFrame();
}


PadSvg.prototype.GetX = function( u ) 
{
  return this.origin_x + this.span_x*(u-this.min_u)/(this.max_u-this.min_u);
}

PadSvg.prototype.GetY = function( v ) 
{
  return this.origin_y - this.span_y*(v-this.min_v)/(this.max_v-this.min_v);
}

PadSvg.prototype.GetU = function( x ) 
{
  return (x-this.origin_x)/this.span_x*(this.max_u-this.min_u) + this.min_u;
}

PadSvg.prototype.GetV = function( y ) 
{
  return (this.origin_y-y)/this.span_y*(this.max_v-this.min_v) + this.min_v;
}


