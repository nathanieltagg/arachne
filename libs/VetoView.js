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
/// Code for veto-wall view.
///


VetoView.prototype = new Pad;           
VetoView.prototype.constructor = VetoView;

function VetoView( element, options )
{
  // console.log('VetoView ctor');
  if(!element) {
    // console.log("VetoView: NULL element supplied.");
    return;
  }
  if($(element).length<1) { 
    // console.log()
    return;
  }
  
  var settings = {
      min_u : 0, 
      max_u : 10,
      num_u : 10,
      min_v : 0,
      max_v : 6,  
      num_v : 6, 
		  margin_bottom : 30,
		  margin_top    : 30,
		  margin_right  : 30,
		  margin_left   : 30,
			
      mag_radius: 50,     // size in pixels of magnifying glass
      magnification: 2.5  // How much to increase magnification.
  }
  $.extend(true,settings,options); // Change default settings by provided qualities.
  Pad.call(this, element, settings); // Give settings to Pad contructor.

  this.fMousing = false;
	this.fHits = [];
	this.fSelectedData = [];

  var self = this;
  $(this.element).bind('mousemove',function(ev) { return self.DoMouse(ev); });
  $(this.element).bind('click'    ,function(ev) { return self.DoMouse(ev); });
  $(this.element).bind('mouseout' ,function(ev) { return self.DoMouse(ev); });
  $(this.element).bind('resize' ,function(ev) { if(self.fHits.length==0) self.Select(); });
  
  gStateMachine.BindObj('gateChange',this,"Select");
  gStateMachine.BindObj('phCutChange',this,"ReSelect");
  gStateMachine.BindObj('timeCutChange',this,"ReSelect");
  gStateMachine.BindObj('sliceChange',this,"ReSelect");
  gStateMachine.BindObj('phColorChange',this,"Draw");
  // gStateMachine.BindObj('hoverHitChange',this,"Draw");  
  gStateMachine.BindObj('selectedHitChange',this,"Draw");  


}


VetoView.prototype.Select = function()
{
  console.debug("VetoView.Select() wall = ",this.wall);

	this.fHits=[]
  var n = gVetoHits.length;
  HitSatisfiesCutSetup();      
  for(var i=0;i<n;i++) {
    var h = gVetoHits[i];
    if(h.wall == this.wall) this.fHits.push(h);
  }

  this.fSelectedHits = [];
  if($(this.element).is(":hidden")) return;
  
  this.ReSelect();
} 

VetoView.prototype.ReSelect = function()
{
  // console.log("VetoView.ReSelect()");
  
  // Reselect hits based upon cuts.
  
  // Find a list of hits to draw.
  this.fSelectedData = [];

  var n = this.fHits.length;
  for(var i=0;i<n;i++) {
    var h = this.fHits[i];
    if(HitSatisfiesCut(h,true)) this.AddHit(h);
  }

  this.Draw();
}



VetoView.prototype.AddHit = function( hit )
{
  this.fSelectedData.push( {
    wall:    hit.wall,
    paddle:  hit.paddle,
    pmt:     hit.pmt,
    w:       hit.pe,
    hit: hit
  });
}

VetoView.prototype.GetBox = function( paddle )
{
	var y = 6-paddle;
	return {
		u1: 0,
		u2: 10,
		v1: y,
		v2: y+1,
		x1: this.GetX(0),
		x2: this.GetX(10),
		y1: this.GetY(y),
		y2: this.GetY(y+1),		
	}
}

VetoView.prototype.DrawFrame = function(min_u,max_u, min_v, max_v)
{
  if (!this.ctx) return;
  // Sanity.

  // console.log(this.fHits);
  // console.log(this.fSelectedData);
  this.ctx.fillStyle = "rgb(0,0,0)";
  this.ctx.strokeStyle = "rgba(0,0,0,0.75)";
	for(paddle=1;paddle<=6;paddle++){
		  var box = this.GetBox(paddle);
        this.ctx.beginPath();
	      this.ctx.moveTo(box.x1,box.y1);
	      this.ctx.lineTo(box.x2,box.y1);
	      this.ctx.lineTo(box.x2,box.y2);
	      this.ctx.lineTo(box.x1,box.y2);
	      this.ctx.lineTo(box.x1,box.y1);
	      this.ctx.stroke();
			  this.ctx.save();
			  this.ctx.font = "12px sans-serif";
			  this.ctx.textBaseline = 'middle';
			  this.ctx.textAlign = 'center';
			  this.ctx.translate( (box.x1+box.x2)/2, (box.y1+box.y2)/2 );
			  this.ctx.fillText('Paddle '+paddle, 0,0);
				this.ctx.restore();
  }
	
  this.ctx.save();
  this.ctx.font = "12px sans-serif";
  this.ctx.textBaseline = 'top';
  this.ctx.textAlign = 'left';
  this.ctx.translate( this.GetX(0), this.GetY(0) +2  );
  this.ctx.fillText('West', 0,0);
	this.ctx.restore();

  this.ctx.save();
  this.ctx.font = "12px sans-serif";
  this.ctx.textBaseline = 'top';
  this.ctx.textAlign = 'right';
  this.ctx.translate( this.GetX(10), this.GetY(0) +2  );
  this.ctx.fillText('East', 0,0);
	this.ctx.restore();
	
	
  // Pad.prototype.DrawFrame.call(this,min_u,max_u, min_v, max_v);  // Draw labels

  // this.ctx.font = "16px sans-serif";
  // this.ctx.textAlign = 'center';
  // this.ctx.save();
  // this.ctx.translate(this.GetX(5),this.GetY(0));
  // this.ctx.textBaseline = 'top';
  // this.ctx.textAlighn = 'center';	
  // this.ctx.fillText('Wall 1', 0,0);
  // this.ctx.restore();
}


VetoView.prototype.DrawHits = function(min_u,max_u, min_v, max_v)
{

	var westGradient = this.ctx.createLinearGradient(0,0,this.span_x,0);
	westGradient.addColorStop(0.0,'rgba(255,0,0,1.0)');
	westGradient.addColorStop(0.2,'rgba(255,0,0,1.0)');
	westGradient.addColorStop(0.7,'rgba(255,0,0,0)');
	var eastGradient = this.ctx.createLinearGradient(0,0,this.span_x,0);
	eastGradient.addColorStop(1.0,'rgba(0,0,255,1.0)');
	eastGradient.addColorStop(0.8,'rgba(0,0,255,1.0)');
	eastGradient.addColorStop(0.3,'rgba(0,0,255,0)');

	var n = this.fSelectedData.length;
	for(var i=0;i<n;i++) {
		var d = this.fSelectedData[i];
		var box = this.GetBox(d.paddle);
		this.ctx.fillStyle = 'black';
		if(d.pmt==1) this.ctx.fillStyle = westGradient;
		if(d.pmt==2) this.ctx.fillStyle = eastGradient;
		this.ctx.fillRect(box.x1,  box.y1,  box.x2-box.x1,  box.y2-box.y1);
		// console.log('VetoView.DrawHits()',d,d.paddle, box.x1,  box.y1,  box.x2-box.x1,  box.y2-box.y1);
	}
}

VetoView.prototype.DrawOne = function(min_u,max_u, min_v, max_v)
{
  this.Clear();
  this.DrawHits(min_u, max_u, min_v, max_v);
  this.DrawFrame(min_u, max_u, min_v, max_v);
}


VetoView.prototype.Draw = function()
{
  if($(this.element).is(":hidden")) return;

  if((this.fMousing) && ($('#ctl-magnifying-glass').is(':checked')) )
  {
    // Cleverness:
    var mag_radius = parseFloat($('#ctl-magnifier-size').val());
    var mag_scale  = parseFloat($('#ctl-magnifier-mag').val());
    
    this.DrawOne(this.min_u, this.max_u, this.min_v, this.max_v);
    this.ctx.strokeStyle = "rgba(0,0,0,0.75)";
    this.ctx.beginPath();
    this.ctx.arc(this.fMouseX,this.fMouseY, mag_radius+1, 0,Math.PI*2,true);
    this.ctx.stroke();
    
    this.ctx.save();
    this.ctx.beginPath();
    this.ctx.arc(this.fMouseX,this.fMouseY, mag_radius, 0,Math.PI*2,true);
    this.ctx.clip();
    
    this.ctx.translate((1-mag_scale)*this.fMouseX,(1-mag_scale)*this.fMouseY);
    this.ctx.scale(mag_scale,mag_scale);
    
    // Find new draw limits in u/v coords:
    var umin = this.GetU(this.fMouseX-mag_radius);
    var umax = this.GetU(this.fMouseX+mag_radius);
    var vmax = this.GetV(this.fMouseY-mag_radius);
    var vmin = this.GetV(this.fMouseY+mag_radius);
    
    this.DrawOne(umin,umax,vmin,vmax);
    this.ctx.restore();
  } else {
    this.DrawOne(this.min_u, this.max_u, this.min_v, this.max_v);
  }  
}

VetoView.prototype.DoMouse = function(ev)
{
  if(ev.type === 'mouseout') {
    this.fMousing = false;
    ChangeHoverHits([]);
    gHoverTrack = null;
  } else {
    this.fMousing = true;
    var offset = getAbsolutePosition(this.canvas);
    this.fMouseX = ev.pageX - offset.x;
    this.fMouseY = ev.pageY - offset.y;    
    this.fMouseU = this.GetU(this.fMouseX);
    this.fMouseV = this.GetV(this.fMouseY);

    var hits = this.FindMousedHits() || [];
    
    if(ev.type === 'click') {
      
      ChangeSelectedHits(hits);
    } else {
      ChangeHoverHits(hits);
    }
  }
  this.Draw();
  
}



VetoView.prototype.FindMousedHits = function() 
{
  // // Attempt to locate hit object corresponding to mouse position.
  // var rawu = this.fMouseU;
  // var rawv = this.fMouseV;
  // // Find the correct bin.
  // var uwidth = (this.max_u-this.min_u)/(this.num_u);
  // var vwidth = (this.max_v-this.min_v)/(this.num_v);
  // var u = Math.floor((rawu-this.min_u)/uwidth)*uwidth + this.min_u;
  // var v = Math.floor((rawv-this.min_v)/vwidth)*vwidth + this.min_v;
  // //console.log("HitMap: rawu=",rawu,"rawv=",rawv,"u=",u,"v=",v,this);  
  // return this.FindMousedHitsUV(u,v)
}

VetoView.prototype.FindMousedHitsUV = function(u,v) 
{
  // var hits = [];
  // var n = this.fSelectedData.length;
  // for(var i=0;i<n;i++) {
  //   var datum = this.fSelectedData[i];
  //   if(datum.u != u) continue;
  //   if(datum.v != v) continue;
  //   hits.push(datum.hit);    
  // }
  // return hits;
}

  




