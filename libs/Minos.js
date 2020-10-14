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

// Subclass of Pad.
MinosHitMap.prototype = new Pad;           
MinosHitMap.prototype.constructor = MinosHitMap;



///
/// Geometry.
///
kMinosStripWidth = 4.32e-2; // in cm
kMinosPlane1InMinervaZ = 12087; // mm
kEndOfMinervaZ = 10040; // mm
kMinosPlanePitch =  59.4; // mm per plane

// From MinosInterface. Add these to minos coord to get minerva coord.
kMinos_xshift = -1.4828 + 10.39*2.54*0.01;    // meters 
kMinos_yshift = 114.0*0.0254 - 129.48*0.0254; // meters 

kInvSqrt2 = 1./Math.sqrt(2.0);

kEndOfMinerva_minosPlane = (kEndOfMinervaZ - kMinosPlane1InMinervaZ)/kMinosPlanePitch;

function MinervaZtoMinosPlane( z )
{
  return (z-kMinosPlane1InMinervaZ)/kMinosPlanePitch;
}

function MinervaXYZtoMinosTpos( x,y )
{
  var xminos  = x/1000. -kMinos_xshift;
  var yminos  = y/1000. -kMinos_yshift;
  return { u:  kInvSqrt2*xminos + kInvSqrt2*yminos,
           v: -kInvSqrt2*xminos + kInvSqrt2*yminos
         };
}

function MinosHitMap( element, options )
{
  console.log('MinosHitMap ctor');
  if(!element) {
    // console.log("MinosHitMap: NULL element supplied.");
    return;
  }
  if($(element).length<1) { 
    console.log()
    return;
  }
  
  var settings = {
    view: 2,              // ID hits in the X-view.
    draw_axes : false,
    xlabel: null,
    ylabel: null,
    margin_left : 30,
    margin_bottom : 20,
    min_u: -60,
    max_u:  120,
    num_u: 180,          // Number of columns | Used only for finding the width and height of one box.
    num_v: 10,           // number of rows.   |
    draw_grid_x: false,
    tick_pixels_x: 20,
    tick_pixels_y: 30,
  }
  $.extend(true,settings,options);  // Change default settings by provided qualities.
  Pad.call(this, element, settings); // Give settings to Pad contructor.
  
  
  // NB X and Y are screen coordinates
  // U and V are 'natural' coordinates, like plane/strip or x,z positions
  this.fMousing = false;

  this.fMinosStrips=[];
  this.fSelectedMinosStrips=[];
  this.fTracks=[];
  this.fSelectedTracks=[];
  
  this.colorScaler = new ColorScaler();
  this.colorScaler.SetScale("BrownPurplePalette");
  this.colorScaler.min = 0;
  this.colorScaler.max = 1000;

  var self = this;
  $(this.element).bind('mousemove',function(ev) { return self.DoMouse(ev); });
  $(this.element).bind('click'    ,function(ev) { return self.DoMouse(ev); });
  $(this.element).bind('mouseout' ,function(ev) { return self.DoMouse(ev); });
  
  $(this.element).bind('resize' ,function(ev) { self.Retrieve(); });
  
  gStateMachine.BindObj('gateChange',this,"Retrieve");
  gStateMachine.BindObj('phCutChange',this,"ReSelect");
  gStateMachine.BindObj('timeCutChange',this,"ReSelect");
  gStateMachine.BindObj('sliceChange',this,"ReSelect");
  gStateMachine.BindObj('phColorChange',this,"Draw");
  // gStateMachine.BindObj('hoverHitChange',this,"Draw");  
  gStateMachine.BindObj('selectedHitChange',this,"Draw");  
      
      
  $("#ctl-show-minos-range").buttonset();
  $("#ctl-show-minos-range input:radio").click(function(){self.Draw();});
      
  console.log(this);
}

MinosHitMap.prototype.Retrieve = function()
{
  // console.debug("MinosHitMap::Retrieve() on",this.element);
  
  // Called on new data available.
  
  // Reset layout.
  // this.min_u=  -100;
  // this.max_u=  121;
  this.num_u = (this.max_u-this.min_u);

  if(this.view==2) {
    this.num_v = 97;
    this.min_v=  -1.35;
    this.max_v=  2.68;    
  } else {
    this.num_v = 97;
    this.min_v=  -2.68;
    this.max_v=  1.35;        
  }

  // this.max_z = gGeo.Z_of_Module(this.max_u,this.view);
  // this.min_z = gGeo.Z_of_Module(this.min_u,this.view);
  
  this.RetrieveMinosStrips();
  this.RetrieveTracks();
  
  this.ReSelect();  
}

MinosHitMap.prototype.RetrieveMinosStrips = function()
{
  // Select hits that are in our view.
  this.fMinosStrips=[];
  this.fSelectedMinosStrips=[];
  if($(this.element).is(":hidden")) return;

  // Find a list of candidates
  if(gMinosStrips.length<1) return;
  var n = gMinosStrips.length;
  for(var i=0;i<n;i++) {
    if(this.view == gMinosStrips[i].view){
      this.fMinosStrips.push(gMinosStrips[i]);
    }
  }
}

MinosHitMap.prototype.RetrieveTracks = function()
{
  // Find track nodes.
   this.fTracks=[];
   this.fSelectedTracks=[];
   var elem;
   var associated_minos_tracks = [];
   for(var i=0;i<gTracks.length;i++){
      var trk = gTracks[i];
      elem = null;
      elem = { minerva_track: trk,
               slice: trk.slice,
               nodes: []
             };

      // Find all the node/clusters
      for(var inode=0;inode<trk.nodes.length;inode++) {
            var node = trk.nodes[inode];

            // Get coordinate in strip space by converting the x,y coordinates
            var p = MinervaZtoMinosPlane( node.z );
            var uv = MinervaXYZtoMinosTpos(node.x,node.y);
            var tpos = uv.u;
            if(this.view==3) tpos = uv.v;

            elem.nodes.push({  type:  'minerva',
                               plane: p,
                               tpos:  tpos,
                               node:  node
                             });
      }
       
      // Add any minos track that's associated.
      // Find minos track index, if any.
      if ("minos_track_idx" in trk) {
        var idx = trk.minos_track_idx; 
        var mtrk = gMinosTracks[idx];
        console.warn("Associated minerva track ",trk," with minos track ",mtrk);
        if(mtrk.index != idx) console.warn("Minos.js: track lookup failure.");
        elem.minos_track = mtrk;
        associated_minos_tracks.push(mtrk);
        
        // Along track:
        var stps = mtrk.trk_strips;
        for(var istp=0;istp<stps.length;istp++) {
          var node_x =  stps[istp].x;
          var node_y =  stps[istp].y;
          var node_z =  stps[istp].z;
          var p = MinervaZtoMinosPlane( node_z );
          var uv = MinervaXYZtoMinosTpos(node_x,node_y);
          var tpos = uv.u;
          if(this.view==3) tpos = uv.v;
          
          elem.nodes.push({type: 'minos',
                           plane: p,
                           tpos:  tpos,
                           node:node
                           });
        }
      
     }
    
     this.fTracks.push(elem);
  }
    
    
  // Add any minos tracks not in the above list.
  for(var i=0;i<gMinosTracks.length;i++) {
    var mtrk = gMinosTracks[i];
    var got = false;
    for(var j=0;j<associated_minos_tracks.length;j++) {
      if (gMinosTracks[i] == associated_minos_tracks[j]) got = true;
    }
    if(!got) 
    {
      elem = null;      
      elem = { minerva_track: 'dummy', // keep it from matching 'null' selected track.
               minos_track: mtrk,
               slice: mtrk.slice,
               nodes: []
             }; 
 
      // Along track:
      var stps = mtrk.trk_strips;
      for(var istp=0;istp<stps.length;istp++) {
        var node_x =  stps[istp].x;
        var node_y =  stps[istp].y;
        var node_z =  stps[istp].z;
        var p = MinervaZtoMinosPlane( node_z );
        var uv = MinervaXYZtoMinosTpos(node_x,node_y);
        var tpos = uv.u;
        if(this.view==3) tpos = uv.v;

        elem.nodes.push({type: 'minos',
                         plane: p,
                         tpos:  tpos,
                         node:node
                        });
      }
      this.fTracks.push(elem);
    }
  }
      
}




MinosHitMap.prototype.ReSelect = function()
{
  // Reselect hits based upon cuts.
  this.fSelectedMinosStrips = [];
  var n = this.fMinosStrips.length;
  for(var i=0;i<n;i++) {
     var stp = this.fMinosStrips[i];
     if(gCurrentSlice>=0) {
        if(stp.slice != gCurrentSlice) continue;
      }
      if((gTimeCut.min !== null) ||(gTimeCut.max !== null)  ) {
        //t = $("time",hit).text();
        t = stp.time;
        if((gTimeCut.min !== null) && (t<gTimeCut.min)) continue;
        if((gTimeCut.max !== null) && (t>=gTimeCut.max)) continue;
      }
      this.fSelectedMinosStrips.push({
       u: stp.plane,
       v: stp.tpos,
       w: stp.ph,
       stp: stp
     });      
  }


  // Reselect tracks based on cuts.
  this.fSelectedTracks=[];
  for(var i=0;i<this.fTracks.length;i++) {
     var elem = this.fTracks[i];
     if( (gCurrentSlice < 0) ||
         (elem.slice == gCurrentSlice) ) {
           if(gSuppressTracks) console.log("Considering track ",i,"=",elem.minerva_track.index,':',gSuppressTracks,gSuppressTracks[ elem.minerva_track.index ] )
           if(gSuppressTracks && gSuppressTracks[ elem.minerva_track.index ] ==1) {
             continue;
           }           
           if(gShowFlaggedTracksOnly && elem.minerva_track.flag<=0) continue;
           this.fSelectedTracks.push(elem);
    }
  }
  
  
  this.Draw();
}



MinosHitMap.prototype.DrawOne = function(min_u,max_u, min_v, max_v)
{
  this.Clear();

  this.cellWidth = this.span_x/this.num_u;
  this.cellHeight = this.span_y/this.num_v;
  
  this.DrawFrame();
  this.DrawBlackout(min_u,max_u, min_v, max_v);
  
  if ($('#ctl-show-minos-strips').is(':checked')) {
    this.DrawMinosStrips(min_u,max_u, min_v, max_v);
  }
  this.DrawTracks(min_u,max_u, min_v, max_v);
  
}

MinosHitMap.prototype.DrawBlackout = function(min_u,max_u, min_v, max_v)
{
  this.ctx.fillStyle = "rgba(0,0,0,0.2)";

  // First, black out region between detectors.
  var x1 = this.GetX(kEndOfMinerva_minosPlane);
  var x2 = this.GetX(1); // plane 1
  var y1 = this.GetY(min_v);
  var y2 = this.GetY(max_v);
  this.ctx.fillRect( x1,
                     y2,
                     x2-x1,
                     y1-y2);
                     

  // Black out areas outside the minerva detector.
  var uvc = MinervaXYZtoMinosTpos(0,0);
  x1 = this.GetX(min_u);
  x2 = this.GetX(kEndOfMinerva_minosPlane);
  var tpos_top,tpos_bottom;
    
    if(this.view==2) {
      tpos_top    = uvc.u + 1.226; // 1.226 is the outermost radius of the ID.
      tpos_bottom = uvc.u - 1.226; // 1.226 is the outermost radius of the ID.
    } else {
      tpos_top    = uvc.v + 1.226; // 1.226 is the outermost radius of the ID.
      tpos_bottom = uvc.v - 1.226; // 1.226 is the outermost radius of the ID.      
    }
    
    var yt1=this.GetY(tpos_top);
    var yt2=this.GetY(max_v);
    var yb1=this.GetY(min_v);
    var yb2=this.GetY(tpos_bottom);
    this.ctx.beginPath();
    this.ctx.moveTo(x1,yt1);
    this.ctx.lineTo(x2,yt1);
    this.ctx.lineTo(x2,yt2);
    this.ctx.lineTo(x1,yt2);
    this.ctx.lineTo(x1,yt1);
    this.ctx.fill();

    this.ctx.beginPath();
    this.ctx.moveTo(x1,yb1);
    this.ctx.lineTo(x2,yb1);
    this.ctx.lineTo(x2,yb2);
    this.ctx.lineTo(x1,yb2);
    this.ctx.lineTo(x1,yb1);
    this.ctx.fill();
    
  

  // Black out parts of partially instrumented planes that we can't see
  if(this.view==2) {
    for(var p=1;p<max_u;p++) {
      vtop = 2.4;
      vbottom = -0.28;
      var yt1 = this.GetY(vtop);
      var yt2 = this.GetY(max_v);
      var yb1 = this.GetY(vbottom);
      var yb2 = this.GetY(min_v);

      if(p%5!=1) {
        var x = this.GetX(p);
        if(p<120) {
          // partial plane        
          this.ctx.fillRect(x,yt2,this.cellWidth,yt1-yt2);
          this.ctx.fillRect(x,yb2,this.cellWidth,yb1-yb2);        
        } else {
          // steel plane
          this.ctx.fillRect(x,yt2,this.cellWidth,yb2-yt2);        
        }
      }
    }
  } else {
    // u view
    for(var p=1;p<max_u;p++) {
      vbottom = -2.4;
      vtop = 0.28;
      var yt1 = this.GetY(vtop);
      var yt2 = this.GetY(max_v);
      var yb1 = this.GetY(vbottom);
      var yb2 = this.GetY(min_v);

      if(p%5!=1) {
        var x = this.GetX(p);
        if(p<120) {
          // partial plane        
          this.ctx.fillRect(x,yt2,this.cellWidth,yt1-yt2);
          this.ctx.fillRect(x,yb2,this.cellWidth,yb1-yb2);      
        } else {
          // steel plane
          this.ctx.fillRect(x,yt2,this.cellWidth,yb2-yt2);
        }
        
      }
    }
    
  }
}

MinosHitMap.prototype.DrawMinosStrips = function(min_u,max_u, min_v, max_v)
{
  var n = this.fSelectedMinosStrips.length;
  // console.log("DrawMinosStrips",n);
  
  var colorScaler  = new ColorScaler();
  colorScaler.min = 0;
  colorScaler.max = 100*10;
  
  for(var i=0;i<n;i++) {
      var d = this.fSelectedMinosStrips[i];
      if(d.u<min_u) continue;
      if(d.u>max_u) continue;
      if(d.v<min_v) continue;
      if(d.v>max_v) continue;
      var x = this.GetX(d.u);
      var y = this.GetY(d.v);

      c = colorScaler.GetColor(d.w);
      this.ctx.fillStyle = "rgb(" + c + ")";
      this.ctx.fillRect(x,y-this.cellHeight,this.cellWidth,this.cellHeight);
  }
  // // console.timeEnd("MinosHitMap normal"); 
}

MinosHitMap.prototype.DrawTracks = function(min_u,max_u, min_v, max_v)
{
  this.ctx.save();
  this.ctx.lineWidth = this.cellHeight*0.7;

  // Loop over tracks
  var ntracks= this.fSelectedTracks.length;
  // console.log("Minos::DrawTracks ntracks= ",ntracks,"/",this.fTracks.length);
  for(var i=0;i<ntracks;i++)
  {
    var elem = this.fSelectedTracks[i];
    var linestyle = "rgba(0,150,0,0.9)";
    if(elem.minerva_track=='dummy') linestyle = "rgba(0,100,150,0.9)";
    
    if(elem.nodes.length<2) continue; 
    var lastx,lasty;
    // Loop over track nodes (as pre-fetched and stored)
    var x,y;
    var nnodes = elem.nodes.length;
    for(var inode=0;inode<nnodes;inode++) {
      var node = elem.nodes[inode];
      x = this.GetX(node.plane) + this.cellWidth/2;
      y = this.GetY(node.tpos) - this.cellHeight/2;
      if(inode>0 && x>this.origin_x) {
        if(lastx<this.origin_x) lastx = this.origin_x;
        GeoUtils.draw_highlighted_line(
          this.ctx,
          lastx,lasty,
          x,y,
          // this.cellHeight*0.8, //linewidth
          1,
          linestyle, // default style
          "rgba(250,0,0,0.9)", //highlight style
          "rgba(0,0,0,0.7)", //outline style
          ShouldIHighlightThisTrack(elem.minerva_track), // do_highight
          (elem.minerva_track == gSelectedTrack) // do_outline
        );
      }
      lastx = x;
      lasty = y;
    }  

    if(elem.minerva_track == gSelectedTrack) {
      var offset = getAbsolutePosition(this.canvas);
      SetObjectInfoBubblePosition(offset.x + x, offset.y + y);  
    } 


  } // End loop over tracks
  this.ctx.restore();
  
}


MinosHitMap.prototype.Draw = function()
{
  if($(this.element).is(":hidden")) return;
  
  this.max_u = parseInt($("#ctl-show-minos-range input:radio:checked").val());
  this.num_u = this.max_u +60;

  if((this.fMousing) && ($('#ctl-magnifying-glass').is(':checked')) )
  {
    this.magnifying = true;
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
    this.magnifying = false;
    this.DrawOne(this.min_u, this.max_u, this.min_v, this.max_v);
  }  
}

// function CompareArrays(a,b) {
//   var n=a.length;
//   if(n!=b.length) return false;
//   for(var i=0;i<n;i++) { if(a[i]!==b[i]) return false; }
//   return true;
// }



MinosHitMap.prototype.DoMouse = function(ev)
{
  if(ev.type === 'mouseout') {
    this.fMousing = false;
    ChangeHoverHits([]);
    gHoverTrack = null;
    gHoverVertex = null;
  } else {
    this.fMousing = true;
    var offset = getAbsolutePosition(this.canvas);
    this.fMouseX = ev.pageX - offset.x;
    this.fMouseY = ev.pageY - offset.y;    
    this.fMouseU = this.GetU(this.fMouseX);
    this.fMouseV = this.GetV(this.fMouseY);
  }
  this.Draw();
}


$(function() {
  gMinosInfo = new MinosInfo($('#minos-info'));
});

function MinosInfo( element )
{
  // console.log('MinosInfo ctor');
  if(!element) {
    // console.log("MinosInfo: NULL element supplied.");
    return;
  }
  if($(element).length<1) { 
    // console.log()
    return;
  }
  this.element = element;

  gStateMachine.BindObj('gateChange',this,"NewGate");
}

MinosInfo.prototype.NewGate = function()
{
  var h = "<table id='minos-info-table'><tr>";
  h += "<td> Minos Run " + gRecord.minos.minos_run + "</td>" ;
  h += "<td> Subrun " + gRecord.minos.minos_subrun + "</td>" ;
  h += "<td> Snarl " + gRecord.minos.minos_snarl+ "</td>" ;
  h += "<td> "+ gMinosTracks.length + " tracks ("+ gRecord.n_minosMatch +" match)"+ "</td>" ;
  h += "</tr></table>";
  h += "<br/><center>";
  var lnk = "http://ariadne-minos.fnal.gov/?det=N"
           + "&snarl="+gRecord.minos.minos_snarl
           +"&&run=" + gRecord.minos.minos_run
           +"&&subrun=" + gRecord.minos.minos_subrun 
           +"&&datastream=spill"
           +"&&recoVer=dogwood5"; 
  h += "<a href='" + lnk + "'>Link</a> to MINOS Ariadne display"; 
  h +="</center>";
  $(this.element).html(h);
}



