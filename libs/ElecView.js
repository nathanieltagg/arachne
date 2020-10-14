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
/// Code for electronics-space view.
///
/// Reminder from Mike:
// "For electronics layout, you might look at MinervaUtils/MinervaHistoTool (see attached). There are functions there which
// fill histograms by channelID. The intent was to enable the production of standard plots in electronics space (e.g., like
// the minos online monitoring). Essentially one CROC serves 4 chains. Chains have 9 or 10 PMTs on them, except in the HCAL,
// which has 11. Groups of 4 tracker modules are served by two chains. The chain on the east side of the detector has 9
// PMTs, the west side has 10. The HCAL is served by one chain (although this will change in the fall). "

// Utility: decode channel address
// Hopefully this is much faster than trasnsmitting all the verbiage via xml.
function ParseChannelId ( id )
{
  var r = {};
  var x = parseInt(id);
  r.hit   = (id & 0x1f        );
  r.pixel = (id & 0xfe0       ) >> 5;
  r.board = (id & 0x1f000     ) >> 12;
  r.chain = (id & 0xe0000     ) >> 17;
  r.croc  = (id & 0x1f00000   ) >> 20;
  r.crate = (id & 0x1e000000  ) >> 25;
  r.link  = (id & 0xe0000000  ) >> 29;
  return r;
}



// Subclass of HitMap.
ElecView.prototype = new Pad;           
ElecView.prototype.constructor = ElecView;

function ElecView( element, options )
{
  // console.log('ElecView ctor');
  if(!element) {
    // console.log("ElecView: NULL element supplied.");
    return;
  }
  if($(element).length<1) { 
    // console.log("ElecView: Zero-length jquery selector provided."); 
    return;
  }
  
  var settings = {
    link:  0,
    crate: 0,
    //show_pixels: true,
    draw_axes : true,
    
    margin_right: 5,
    margin_left : 35,
    margin_bottom : 35,

    draw_axes:    true,
    xlabel:       'Board',
    ylabel:       'Croc+Chain',
    draw_croc_labels: true,
    paint_regions: false,
    
    nchain: 4,
    ncroc:  9,
    min_u : 0.5, 
    max_u : 11.5,
    num_u : 11*8, // 11 boards * 8 pixel columns
    min_v : -0.5,
    max_v : (9*4)-0.5,   // 9 crocs * 4 chains/croc
    num_v : 9*4*8, // 9 crocs * 4 chains/croc * 8 pixel rows
    mag_radius: 50,     // size in pixels of magnifying glass
    magnification: 2.5  // How much to increase magnification.
  }
  $.extend(true,settings,options); // Change default settings by provided qualities.
  Pad.call(this, element, settings); // Give settings to Pad contructor.

  this.fMousing = false;
  this.fData=[];
  this.fSelectedData=[];
  this.fTracks=[];
  this.fSelectedTracks = [];

  var self = this;
  $(this.element).bind('mousemove',function(ev) { return self.DoMouse(ev); });
  $(this.element).bind('click'    ,function(ev) { return self.DoMouse(ev); });
  $(this.element).bind('mouseout' ,function(ev) { return self.DoMouse(ev); });
  $(this.element).bind('resize' ,function(ev) { if(self.fData.length==0) self.Select(); });
  
  gStateMachine.BindObj('gateChange',this,"Select");
  gStateMachine.BindObj('phCutChange',this,"ReSelect");
  gStateMachine.BindObj('timeCutChange',this,"ReSelect");
  gStateMachine.BindObj('sliceChange',this,"ReSelect");
  gStateMachine.BindObj('phColorChange',this,"Draw");
  // gStateMachine.BindObj('hoverHitChange',this,"Draw");  
  gStateMachine.BindObj('selectedHitChange',this,"Draw");  


}


ElecView.prototype.Select = function()
{
  console.debug("ElecView.Select()");
  this.fData = [];
  this.fSelectedData = [];
  if($(this.element).is(":hidden")) return;
  
  var sel = this.base_selector;
  // Find a list of candidate hits, using a selector.
  for(var i=0;i<gHits.length;i++) { 
    var hit=gHits[i];
    var id = hit.channel_id;
    var c = ParseChannelId(id);

    if(c.link !=this.link) continue;
    if(c.crate!=this.crate) continue;
    this.fData.push(hit);
  }
  this.ReSelect();
} 

ElecView.prototype.ReSelect = function()
{
  // console.log("ElecView.ReSelect()");
  
  // Reselect hits based upon cuts.
  
  // Find a list of hits to draw.
  this.fSelectedData = [];
  this.w_selector = $('#ctl-ph-field').val();

  var n = this.fData.length;
  HitSatisfiesCutSetup();
  for(var i=0;i<n;i++) {
    var h = this.fData[i];
    if(HitSatisfiesCut(h)) this.AddHit(h);
  }

  // console.log("Reselecting tracks");
  this.fSelectedTracks = [];
    
  for(var i=0;i<this.fTracks.length;i++) {
     var elem = this.fTracks[i];
     if( (gCurrentSlice < 0) ||
         elem.track.slice == gCurrentSlice ) {
      this.fSelectedTracks.push(elem);
    }
  }
  
  
  this.Draw();
}



ElecView.prototype.AddHit = function( hit )
{
  var id = hit.channel_id;
  var c = ParseChannelId(id);

  var px = (c.pixel%8)/8.;
  var py = (Math.floor(c.pixel/8))/8.;
  
  var u = c.board
        + px 
        - 0.5;
  var v = c.chain
        + c.croc*4 -4
        + py 
        - 0.5;
  
  this.fSelectedData.push( {
    u: u,
    v: v,
    w: hit[this.w_selector],
    hit: hit
  });
}

ElecView.prototype.DrawFrame = function()
{
  if (!this.ctx) return;
  // Sanity.
  if(this.log_y && this.min_v <=0) this.min_v = 0.5;
  
  if(this.draw_axes) {
  // Draw the axes.
  this.ctx.fillStyle = "rgb(0,0,0)";
  this.ctx.fillRect(this.origin_x-2,this.origin_y,this.canvas.width-this.margin_right-this.origin_x,2);
  //ctx.fillStyle = "rgb(0,200,0)";
  this.ctx.fillRect(this.origin_x-2,this.margin_top,2,this.origin_y-this.margin_top);
  }
  if(this.draw_box) {
    // Draw the box.
    this.ctx.strokeStyle = "rgba(0,0,0,0.75)";
    this.ctx.beginPath();
    this.ctx.moveTo(this.origin_x,             this.origin_y);
    this.ctx.lineTo(this.origin_x+this.span_x, this.origin_y);
    this.ctx.lineTo(this.origin_x+this.span_x, this.origin_y-this.span_y);
    this.ctx.lineTo(this.origin_x,             this.origin_y-this.span_y);
    this.ctx.lineTo(this.origin_x,             this.origin_y)
    this.ctx.stroke();      
  }
  
  // Draw labels

  if(this.draw_label_x) {
    this.ctx.font = "16px sans-serif";
    this.ctx.textAlign = 'center';
    this.ctx.save();
    this.ctx.translate(this.origin_x+this.span_x/2, this.canvas.height);
    this.ctx.textBaseline = 'bottom';
    this.ctx.fillText(this.xlabel, 0,0);
    this.ctx.restore();
  }

  

  if(this.draw_ticks_x || this.draw_grid_x){
    // Do the X-axis.
    var tickLen = 8;
    var ticks = [];
    var u = this.min_u;
    while(u<=this.max_u){ ticks.push(u); u+=1.0; }
    for( var i=0;i<ticks.length;i++) {
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
    }
  }

  if(this.draw_tick_labels_x){
    this.ctx.font = "12px sans-serif";
    this.ctx.textAlign = 'center';
    this.ctx.textBaseline = 'top';
    this.ctx.fillStyle = "rgba(20,20,20,1.0)";
    var u = Math.ceil(this.min_u);
    while(u < this.max_u) {
      //this.ctx.drawTextCenter(font,fontsize,x,this.origin_y+tickLen+asc,String(ttick));
      var x = this.GetX(u);
      this.ctx.fillText(String(u), x, this.origin_y+tickLen);
      u+=1;
    }
  }




  if(this.draw_ticks_y ||  this.draw_grid_y)
  {
    // Draw Y ticks
    var tickLen = 6;
    var ticks = [];
    var v = this.min_v;
    while(v<=this.max_v){ ticks.push(v); v+=1.0; }
    for( var i=0;i<ticks.length;i++) {
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
    }
  }
  if(this.draw_tick_labels_y) {
    this.ctx.font = "12px sans-serif";
    this.ctx.textAlign = 'right';
    this.ctx.textBaseline = 'middle';
    this.ctx.fillStyle = "rgba(20,20,20,1.0)";
    var v = Math.ceil(this.min_v);
    while(v < this.max_v) {
      var y = this.GetY(v);
      var chain = v%this.nchain;
      this.ctx.fillText(String(chain), this.origin_x-tickLen-1, y);
      v+=1;
    }
  }
  
  if(this.draw_croc_labels) {
    this.ctx.fillStyle = "rgba(20,20,20,1.0)";      
    this.ctx.font = "12px sans-serif";
    this.ctx.textAlign = 'center';
    this.ctx.textBaseline = 'bottom';
    var x = 12;
    var v = this.nchain/2+this.min_v;
    var croc = 0;
    while(v<this.max_v) {
      var v1 = v - this.nchain/2 + 0.3;
      var v2 = v + this.nchain/2 - 0.3;
      this.ctx.strokeStyle = "rgba(0,0,0,1.0)";      
      this.ctx.beginPath();
      this.ctx.moveTo(x,this.GetY(v1));
      this.ctx.lineTo(x,this.GetY(v2));
      this.ctx.stroke();      

      var s = "Croc "+(croc+1);
      this.ctx.save();
      this.ctx.translate(x,this.GetY(v));      
      this.ctx.rotate(-90*3.1416/180);
      this.ctx.fillText(s, 0, 0);    
      this.ctx.restore();

      v+= this.nchain;
      croc+=1;
    }
  }

}


ElecView.prototype.DrawHits = function(min_u,max_u, min_v, max_v)
{
  
  this.cellWidth = this.span_x/this.num_u;
  this.cellHeight = this.span_y/this.num_v;
  if(this.cellWidth<2)  this.cellWidth = 2;
  if(this.cellHeight<2) this.cellHeight = 2;
  var n = this.fSelectedData.length;
  var nhover = gHoverHits.length;
  var nsel   = gSelectedHits.length;
  var i,d,u,v,x,y,c,ih;
  // console.time("hitmap normal"); 
  
  for(var i=0;i<n;i++) {
    d = this.fSelectedData[i];
    u = d.u;
    if(u<min_u) continue;
    if(u>max_u) continue;
    v = d.v;         
    if(v<min_v) continue;
    if(v>max_v) continue;
    
    x = this.GetX(u);
    y = this.GetY(v);
    c = gPhColorScaler.GetColor(d.w);
    for(ih=0;ih<nhover;ih++){
      if(gHoverHits[ih]===d.hit) c = gPhColorScaler.GetSelectedColor();
    }        
    for(ih=0;ih<nsel;ih++){
      if(gSelectedHits[ih]===d.hit) c = gPhColorScaler.GetSelectedColor();
    }        

    this.ctx.fillStyle = "rgb(" + c + ")";
    this.ctx.fillRect(x,y-this.cellHeight,this.cellWidth,this.cellHeight);
  }
  // console.timeEnd("hitmap normal"); 
}

ElecView.prototype.DrawOne = function(min_u,max_u, min_v, max_v)
{
  this.Clear();
  this.DrawFrame(min_u, max_u, min_v, max_v);
  this.DrawHits(min_u, max_u, min_v, max_v);
}


ElecView.prototype.Draw = function()
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

ElecView.prototype.DoMouse = function(ev)
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

    var hits = this.FindMousedHits();
    
    if(ev.type === 'click') {
      
      ChangeSelectedHits(hits);
    } else {
      ChangeHoverHits(hits);
    }
  }
  this.Draw();
  
}



ElecView.prototype.FindMousedHits = function() 
{
  // Attempt to locate hit object corresponding to mouse position.
  var rawu = this.fMouseU;
  var rawv = this.fMouseV;
  // Find the correct bin.
  var uwidth = (this.max_u-this.min_u)/(this.num_u);
  var vwidth = (this.max_v-this.min_v)/(this.num_v);
  var u = Math.floor((rawu-this.min_u)/uwidth)*uwidth + this.min_u;
  var v = Math.floor((rawv-this.min_v)/vwidth)*vwidth + this.min_v;
  //console.log("HitMap: rawu=",rawu,"rawv=",rawv,"u=",u,"v=",v,this);  
  return this.FindMousedHitsUV(u,v)
}

ElecView.prototype.FindMousedHitsUV = function(u,v) 
{
  var hits = [];
  var n = this.fSelectedData.length;
  for(var i=0;i<n;i++) {
    var datum = this.fSelectedData[i];
    if(datum.u != u) continue;
    if(datum.v != v) continue;
    hits.push(datum.hit);    
  }
  return hits;
}

  
