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
HitMap.prototype = new Pad;           
HitMap.prototype.constructor = HitMap;

function HitMap( element, options )
{
  // console.log('HitMap ctor');
  if(!element) {
    // console.log("HitMap: NULL element supplied.");
    return;
  }
  if($(element).length<1) { 
    // console.log("HitMap: Zero-length jquery selector provided."); 
    return;
  }
  
  var settings = {
    view: 1,              // ID hits in the X-view.
    u_selector : "module",
    v_selector : "strip",
    draw_axes : false,
    xlabel: null,
    ylabel: null,
    margin_left : 30,
    margin_bottom : 20,
    num_u: 10,          // Number of columns | Used only for finding the width and height of one box.
    num_v: 10,          // number of rows.   |
    tick_pixels_x: 20,
    tick_pixels_y: 30,
    can_do_triangles: true,
    paint_regions: true
    // ,margin_right: 50,
    // paint_colorscale: true
  }
  $.extend(true,settings,options);  // Change default settings by provided qualities.
  Pad.call(this, element, settings); // Give settings to Pad contructor.
  
  // NB X and Y are screen coordinates
  // U and V are 'natural' coordinates, like plane/strip or x,z positions
  this.fMousing = false;
  this.fData=[];
  this.fSelectedData=[];
  this.fTracks=[];
  this.fSelectedTracks = [];
  this.fVertices=[];
  this.fSelectedVertices=[];
  this.fClusters = [];
  this.fSelectedClusters = [];
    
  var self = this;
  $(this.element).bind('mousemove',function(ev) { return self.DoMouse(ev); });
  $(this.element).bind('click'    ,function(ev) { return self.DoMouse(ev); });
  $(this.element).bind('mousedown',function(ev) { return self.DoMouse(ev); });
  $(window      ).bind('mouseup',function(ev) { return self.DoMouse(ev); });
  $(this.element).bind('mouseout' ,function(ev) { return self.DoMouse(ev); });

  $(this.element).bind('touchstart' ,function(ev) { return self.DoMouse(ev); });
  $(this.element).bind('touchmove' ,function(ev) {  return self.DoMouse(ev); });
  $(this.element).bind('touchend' ,function(ev) { return self.DoMouse(ev); });

  
  $(this.element).bind('resize' ,function(ev) { if(self.fData.length==0) self.Select(); });
  
  gStateMachine.BindObj('gateChange',this,"Select");
  gStateMachine.BindObj('phCutChange',this,"ReSelect");
  gStateMachine.BindObj('timeCutChange',this,"ReSelect");
  gStateMachine.BindObj('sliceChange',this,"ReSelect");
  gStateMachine.BindObj('phColorChange',this,"Draw");
  // gStateMachine.BindObj('hoverHitChange',this,"Draw");  
  gStateMachine.BindObj('selectedHitChange',this,"Draw");  
  
  gStateMachine.BindObj('changeSelectedTrajectories',this,"Draw");  
  
  this.max_z = gGeo.Z_of_Module(this.max_u,this.view);
  this.min_z = gGeo.Z_of_Module(this.min_u,this.view);
  
  this.vertexGradientGreen = this.ctx.createRadialGradient(0,0,0, 0,0,10);
  this.vertexGradientGreen.addColorStop(0,   'rgba(0,255,0,1)'); // green
  this.vertexGradientGreen.addColorStop(1,   'rgba(0,0,255,0)'); // Transparent

  this.vertexGradientBlue = this.ctx.createRadialGradient(0,0,0, 0,0,10);
  this.vertexGradientBlue.addColorStop(0,   'rgba(0,0,255,1)'); // blue
  this.vertexGradientBlue.addColorStop(1,   'rgba(0,255,0,0)'); // Transparent

  this.vertexGradientBrown = this.ctx.createRadialGradient(0,0,0, 0,0,10);
  this.vertexGradientBrown.addColorStop(0,   'rgba(139,69,19,1)'); // brown
  this.vertexGradientBrown.addColorStop(1,   'rgba(0,0,0,0)'); // Transparent

  this.vertexGradientBlack = this.ctx.createRadialGradient(0,0,0, 0,0,10);
  this.vertexGradientBlack.addColorStop(0,   'rgba(0,0,0,1)'); // black
  this.vertexGradientBlack.addColorStop(1,   'rgba(0,0,0,0)'); // Transparent
	
  this.vertexGradientPurple = this.ctx.createRadialGradient(0,0,0, 0,0,10);
  this.vertexGradientPurple.addColorStop(0,   'rgba(85,26,139,1)'); // purple
  this.vertexGradientPurple.addColorStop(1,   'rgba(85,26,139,0)'); // Transparent

  this.vertexGradientOrange = this.ctx.createRadialGradient(0,0,0, 0,0,10);
  this.vertexGradientOrange.addColorStop(0,   'rgba(255,127,0,1)'); // orange
  this.vertexGradientOrange.addColorStop(1,   'rgba(255,0,0,0)'); // Transparent

  this.vertexGradientHighlight = this.ctx.createRadialGradient(0,0,0, 0,0,10);
  this.vertexGradientHighlight.addColorStop(0,   'rgba(255,0,0,1)'); // red
  this.vertexGradientHighlight.addColorStop(1,   'rgba(0,255,0,0)'); // Transparent
  
}

HitMap.prototype.Select = function()
{  
  // Called on new data available.
  
  // Reset layout.
  this.num_v = gGeo.NumStrips;
  this.min_v=  gGeo.FirstStrip-1;
  this.max_v=  gGeo.LastStrip+1;
  this.num_u = gGeo.NumModules;
  this.min_u=  gGeo.FirstModule-1;
  this.max_u=  gGeo.LastModule+1;
  this.max_z = gGeo.Z_of_Module(this.max_u,this.view);
  this.min_z = gGeo.Z_of_Module(this.min_u,this.view);

	gInteraction=0;
  
  this.SelectHits();
  this.SelectClusters();
  this.SelectTracks();
  this.SelectVertices();
  this.ReSelect();  
}

HitMap.prototype.SelectHits = function()
{
  // Select hits that are in our view.
  this.fData = [];
  this.fSelectedData = [];
  if($(this.element).is(":hidden")) return;

  // Find a list of candidate hits
  if(gIdHits.length<1) return;
  var view = this.view;
  
  var n = gIdHits.length;
  for(var i=0;i<n;i++) {
    if(view == gIdHits[i].view) {
      this.fData.push(gIdHits[i]);
    }
  }
}

HitMap.prototype.SelectClusters = function()
{
  // Find clusters
  this.fClusters = [];
  this.fSelectedClusters= [];
  
  var n = gIdClusters.length;
  for(var i=0;i<n;i++) {
    if(this.view == gIdClusters[i].view) {
      this.fClusters.push(gIdClusters[i]);
    }
  }
  // console.log(this,"selected ",this.fClusters.length," from ",n," total clusters");
}


HitMap.prototype.SelectTracks = function()
{
  // Find track nodes.
  this.fTracks = [];
  for(var i=0;i<gTracks.length;i++) {
         var trk = gTracks[i];

         var elem = { track: trk,
                      nodes: []
                     }; 

         // Find all the node/clusters
         for(var inode=0;inode<trk.nodes.length;inode++) {
           var node = trk.nodes[inode];

           // Get coordinate in module space by looking at the associated cluster.
           // This is inelegant, but allows for different z->module mappings used by different reconstructions/detectors.
           // Update: no longer needed!
           // var clus_idx = $('cluster_index',node).text();
           // var clus = $('clus[index='+clus_idx+']',clusters);    
           // if($('view',clus).text()!=this.view) continue;
           // var u = $('module',clus).text();

           // Get coordinate in strip space by converting the x,y coordinates
           var v = gGeo.GetStripFromCoord(node.x,node.y,this.view);
           elem.nodes.push({//u:u,
                            v:v,
                            z:node.z,
                            node:node
                            // ,clus:clus
                            });
        }
        this.fTracks.push(elem);
     
   }

} 

HitMap.prototype.SelectVertices = function()
{
  // vertices.
  this.fVertices=[];
  this.fSelectedVertices=[];
  for(var ivtx=0;ivtx<gVertices.length;ivtx++) {
    var vtx = gVertices[ivtx];
    //if($("track_idx",vtx).length ==0) continue; // Don't draw trackless vertices
    // 3d coords                        
    var vx = vtx.x;
    var vy = vtx.y;
    var vz = vtx.z;
    var elem = {
                // screen coords
                z: vz,
                v: gGeo.GetStripFromCoord(vx,vy,this.view),
                flag: vtx.flag,
                type: vtx.type,
                vtx: vtx,
                slice: vtx.slice
                };
    
    this.fVertices.push(elem);
  }
  
}



HitMap.prototype.ReSelect = function()
{
  // Reselect hits based upon cuts.
  var clus_mask = 0;
  switch( $("input[name='hitmap-clus-radio']:checked").val() ) {
            case "flagged":  clus_mask = 16; break;
            case "anchor":   clus_mask = 1; break;
            case "primary-anchored":  clus_mask = 2; break;
            case "secondary-anchored":clus_mask = 4; break;
          }
  // console.log("clus_mask:",clus_mask);
  
  
  var track_mask = 0;
  switch( $("input[name='hitmap-track-radio']:checked").val() ) {
            case "flagged":  track_mask = 16; break;
            case "anchor":   track_mask = 1; break;
            case "primary-anchored":  track_mask = 2; break;
            case "secondary-anchored":track_mask = 4; break;
          }
  // console.log("track_mask:",track_mask);
  
  // Find a list of hits to draw.
  this.fSelectedData = [];
  this.w_selector = $('#ctl-ph-field').val();

  var n = this.fData.length;
  HitSatisfiesCutSetup();
  for(var i=0;i<n;i++) {
    var h = this.fData[i];
    if(HitSatisfiesCut(h)) this.AddHit(h);
  }


  /// Clusters.
  // Create a list of custom objects:
  // 
  this.fSelectedClusters = [];
  var nc = this.fClusters.length;
  for(var i=0;i<nc;i++){
    var clus = this.fClusters[i];
    if( (gCurrentSlice <0 ) ||
        (clus.slice == gCurrentSlice) ) {

         if(clus_mask>0) {
           var clus_bits = 0;
           if(clus.flag>0) clus_bits += 16;
           if(clus.usedFor>0) clus_bits += usedFor;
           // console.log(clus,clus_mask,clus_bits);
           if((clus_bits & clus_mask) == 0) continue;
         }

         var clus_obj = {clus: clus};
         clus_obj.type=clus.type;
         clus_obj.coord=clus.coord;
         clus_obj.coorderr=clus.coorderr;
         clus_obj.u = clus.module;
         clus_obj.v = clus_obj.coord/kStripPitch + gGeo.MidStrip;
           
         this.fSelectedClusters.push(clus_obj);
        }
  }
  // console.log("Reslected ",this.fSelectedClusters.length," clusters from ",this.fClusters.length);

  // console.log("Reselecting tracks");
  this.fSelectedTracks = [];
  
  for(var i=0;i<this.fTracks.length;i++) {
     var elem = this.fTracks[i];
     if( (gCurrentSlice < 0) ||
         (elem.track.slice == gCurrentSlice) ) {
           // if(gSuppressTracks) console.log("Considering track ",i,"=",parseInt($(elem.track).attr('index')),':',gSuppressTracks,gSuppressTracks[ parseInt($(elem.track).attr('index')) ] )
           if(gSuppressTracks && gSuppressTracks[ elem.track.index ] ==1) {
             continue;
           }
           if(track_mask>0) {
              var trk_bits = 0;
              if(elem.track.flag>0) trk_bits += 16;
              var usedFor=elemn.track.usedFor;
              if(usedFor>0) trk_bits += usedFor;
              // console.log(elem.track,track_mask,trk_bits);
              if((trk_bits & track_mask) == 0) continue;
            }

           // if(gShowFlaggedTracksOnly && parseInt($("flag",elem.track).text())<=0) continue;
           this.fSelectedTracks.push(elem);
    }
  }
  
  
  // reselect vertices.
  this.fSelectedVertices=[];
  for(var ivtx=0;ivtx<this.fVertices.length;ivtx++) {
    var elem = this.fVertices[ivtx];
    // Is the vertex in the current slice? 
    if(gCurrentSlice>=0 && elem.slice) {
          if(elem.slice != gCurrentSlice) continue; // We have a valid slice and it's not this one. Give up.
    }    
    this.fSelectedVertices.push(elem);
  }
  
  this.Draw();
}

HitMap.prototype.AddHit = function(hit)
{
  this.fSelectedData.push({
     u:  hit[this.u_selector],
     v:  hit[this.v_selector],
     w:  hit[this.w_selector],
     hit: hit
   });  
}


HitMap.prototype.DrawOne = function(min_u,max_u, min_v, max_v)
{
  this.Clear();
  this.DrawFrame();
  if (this.paint_colorscale) {
    this.DrawColorScale();
  }
  
  if(this.paint_regions) {
    if( $('#ctl-show-hitmap-regions').is(':checked') ) this.DrawRegions(min_u,max_u, min_v, max_v);
  }
  
  if(!gRecord) return;
  
  if ($('#ctl-show-hitmap-hits').is(':checked')) {
    this.DrawHits(min_u,max_u, min_v, max_v);
  }
  if ($('#ctl-show-hitmap-clusters').is(':checked')) {
    this.DrawClusters(min_u,max_u, min_v, max_v);
  }
  if ($('#ctl-show-hitmap-blobs').is(':checked')) {
    this.DrawBlobs(min_u,max_u, min_v, max_v);
  }
  if ($('#ctl-show-hitmap-tracks').is(':checked')) {
    this.DrawTracks();
  }
  if ($('#ctl-show-hitmap-vertices').is(':checked')) {
    this.DrawVertices();
  }
  if ($('#ctl-show-hitmap-truth').is(':checked')) {
    this.DrawTrajectories();
    if ($('#ctl-show-hitmap-truth-nucleus').is(':checked')) {    
      this.DrawTruth();
    }
  }

  this.DrawUserTrack();
  
  this.DrawManReco();
}


HitMap.prototype.DrawColorScale = function()
{
  this.ctx.save();
  this.color_scale_grad = this.ctx.createLinearGradient(0,this.span_y,0,0);
  var n = 20;
  for(var i=0;i<=n;i++) {
    var w = gPhColorScaler.min + (i/n)*(gPhColorScaler.max-gPhColorScaler.min);
    this.color_scale_grad.addColorStop(i/n,
      "rgb(" + gPhColorScaler.GetColor(w) + ")");
  }
  var y1 = this.GetY(this.min_v);
  var y2 = this.GetY(this.max_v);

  var x_left =this.width-this.margin_right+3; 
  var colorbox_width = 15;
  this.ctx.fillStyle = this.color_scale_grad;
  this.ctx.fillRect(x_left,y1,colorbox_width,y2-y1);


  // Draw Y ticks
  var tickLen = 8;
  this.ctx.font = "12px sans-serif";
  this.ctx.textAlign = 'left';
  this.ctx.textBaseline = 'middle';
  var ticks = this.GetGoodTicks(gPhColorScaler.min, gPhColorScaler.max, Math.round(this.span_y/this.tick_pixels_y), false);
  var nt = ticks.length;
  for( var i=0;i<nt;i++) {
    var ftick = ticks[i];
    var v = (ftick-gPhColorScaler.min)/(gPhColorScaler.max-gPhColorScaler.min);
    var y = y1+v*(y2-y1);
    this.ctx.fillStyle = "rgba(0,0,0,1.0)";
    this.ctx.fillRect(x_left+colorbox_width,y,3,1);
    this.ctx.fillStyle = "rgba(20,20,20,1.0)";
    this.ctx.fillText(String(ftick), x_left+colorbox_width+3, y);
  }
  this.ctx.translate(x_left+colorbox_width+15,(y2+y1)/2)
  this.ctx.rotate(-Math.PI/2);
  this.ctx.fillText($('#ctl-ph-field option:selected').text(),0,0);


  this.ctx.restore();
}

HitMap.prototype.DrawRegions = function(min_u,max_u, min_v, max_v)
{
   
   for(var ir=0;ir<gGeo.regions.length;ir++)
   {
     var region = gGeo.regions[ir];

     // Fill in the region, clipped by the input range.
     var u1 = region.ustart;
     var u2 = region.uend +1 ;
     if (min_u > u1) u1 = min_u;
     if (max_u < u2) u2 = max_u;
     if(u2<u1) continue;
     
     
     this.ctx.save();
     // console.log(region,u1,u2,min_v,max_v);
     var x1 = this.GetX(u1);
     var x2 = this.GetX(u2);
     var y1 = this.GetY(this.min_v);
     var y2 = this.GetY(this.max_v);
     this.ctx.font = "14px Arial";
     this.ctx.fillStyle = region.fill;
     this.ctx.strokeStyle = region.stroke;
     this.ctx.fillRect(x1,y1,x2-x1,y2-y1);
     this.ctx.strokeRect(x1,y1,x2-x1,y2-y1);
     
     var textsize =  this.ctx.measureText(region.name);
     var textwidth = textsize.width;
     // console.log("Drawing region",region.name,textsize,x2-x1,y2-y1);
     // if(textwidth > (y2-y1)) continue; // no hope of drawing, just abort.
     if(textsize.width > (x2-x1)) {
       // console.log("Sideways!",x2,x1,textwidth);
       // Is there room sideways?
       if(14 < (x2-x1)) {
         // Draw the text sideways
         this.ctx.translate((x1+x2)/2,(y1+y2)/2);
         this.ctx.rotate(-1.570796);
       }
     } else {
       // draw the text normally.
       this.ctx.translate((x1+x2)/2,(y1+y2)/2);
     }

     this.ctx.fillStyle = region.text;
     this.ctx.textAlign = "center";
     this.ctx.textBaseline = "middle";
     this.ctx.fillText(region.name,0,0);
     this.ctx.restore();
   }
}


HitMap.prototype.DrawHits = function(min_u,max_u, min_v, max_v)
{
  this.cellWidth = this.span_x/this.num_u;
  this.cellHeight = this.span_y/this.num_v;
  var n = this.fSelectedData.length;
  var nhover = gHoverHits.length;
  var nsel   = gSelectedHits.length;
  var do_triangles = ($('#ctl-hitmap-triangles').is(':checked'));
  
  var user_color = ($('#ctl-show-hitmap-hits-user-color').is(':checked'));  

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

    if(user_color){
      var uc = d.hit.usercolor;
      if(uc) this.ctx.fillStyle = uc;
      else       this.ctx.fillStyle = "rgba("+c+",0.5)";
     } else {
       this.ctx.fillStyle = "rgb(" + c + ")";       
     }

    if(do_triangles && this.can_do_triangles) {
      // Draw triangles, which is much funkier!
      y1 = y-this.cellHeight*1.5;
      y2 = y+this.cellHeight*0.5;
      ym = y-this.cellHeight*0.5;
      x0 = x;
      x1 = x+this.cellWidth;
      if(v%2==1) { // odd strips point downstream |>
        this.ctx.beginPath();
        this.ctx.moveTo(x0,y1);
        this.ctx.lineTo(x0,y2);
        this.ctx.lineTo(x1,ym);
        this.ctx.lineTo(x0,y1);
      } else { // even strips point upstream <|
        this.ctx.beginPath();
        this.ctx.moveTo(x1,y1);
        this.ctx.lineTo(x1,y2);
        this.ctx.lineTo(x0,ym);
        this.ctx.lineTo(x1,y1);        
      }
      this.ctx.fill();
    } else {
      // rectangles
      this.ctx.fillRect(x,y-this.cellHeight,this.cellWidth,this.cellHeight);      
    }
  }
  // console.timeEnd("hitmap normal"); 
}

HitMap.prototype.DrawClusters = function(min_u,max_u, min_v, max_v)
{
   // console.log("Drawing clusters:",this.fSelectedClusters.length);
   var cfill_default      =  "rgba(200,200,200,1)";
   var cfill_trackable    =  "rgba(0,0,0,1)";
   var cfill_heavyIon     =  "rgba(255,0,0,1)";
   var cfill_superCluster =  "rgba(0,0,255,1)";

   var cfill_lowActivity  =  "rgba(200,200,200,1)";
   var cfill_xtalk        =  "rgba(230,200,200,1)";
   if(! ($('#ctl-show-hitmap-la-clusters').is(':checked')) ){
    cfill_lowActivity =  "rgba(0,0,0,0)";
    cfill_xtalk        = "rgba(0,0,0,0)";
   }

   var n = this.fSelectedClusters.length;
   for(var i=0;i<n;i++){
     var clus_obj = this.fSelectedClusters[i];
     clus_obj.x = this.GetX(clus_obj.u) + this.cellWidth/2;
     // var height = 2*coorderr/kStripPitch; // how much to vertically stretch our dot.
     //if(height<1) height = 1; // Kludge: coorderr is usually much too small!
     clus_obj.y  = this.GetY(clus_obj.v) - this.cellHeight/2;
     
     

     var cfill = cfill_default;
     switch(clus_obj.type) {
       case 1: cfill = cfill_trackable; break;
       case 2: cfill = cfill_lowActivity; break;
       case 3: cfill = cfill_superCluster; break;
       case 4: cfill = cfill_heavyIon; break;
       case 5: cfill = cfill_xtalk; break;
     }

     this.ctx.save();
     this.ctx.translate(clus_obj.x,clus_obj.y);
     this.ctx.scale(1,clus_obj.height);
     this.ctx.beginPath();
     this.ctx.arc(0,0,this.cellHeight*1,0,Math.PI*2,true);
     this.ctx.fillStyle = cfill;
     this.ctx.fill();
     if(clus_obj.clus == gHoverCluster) {
       this.ctx.strokeStyle = 'red';
       this.ctx.lineWidth = 2;
       this.ctx.stroke();
     }
     this.ctx.restore();

   } 
}

HitMap.prototype.DrawBlobs = function(min_u,max_u, min_v, max_v)
{
  //
  // Draw an overlay illustrating blob boundaries.
  //
  this.ctx.save();
  
  this.cellWidth = this.span_x/this.num_u;
  this.cellHeight = this.span_y/this.num_v;
  var n = this.fSelectedData.length;
  var i,d,u,v,x,y,c,ih;
  // console.time("hitmap normal"); 
  
  
  var sel_x = 0;
  var sel_y = 0;
  var sel_n = 0;
  
  var hoverBlobId = -999;  if(gHoverBlob)    hoverBlobId  =gHoverBlob.index;
  var selectBlobId = -999; if(gSelectedBlob) selectBlobId =gSelectedBlob.index;
  
  // Get opacity value
  var op = $('#ctl-blob-opacity').val();
  for(var i=0;i<n;i++) {
    d = this.fSelectedData[i];
    var blobs = d.hit.blob_id;
    if(blobs && blobs.length>0) {
      var blobid = blobs[0];

      // var s = new ColorScaleIndexed(blobid+2);      
      // this.ctx.fillStyle = "rgba(" + s.GetColor() + ","+ op*op + ")";        

      this.ctx.fillStyle = gBlobColors[blobid];

      if(blobid == gHoverBlob) {
        var s = new ColorScaleIndexed(1);              
        this.ctx.fillStyle = "rgba(" + s.GetColor() + ",0.4)";
      }
      if(blobid == selectBlobId) {
          var s = new ColorScaleIndexed(1);              
          this.ctx.fillStyle = "rgba(" + s.GetColor() + ",1.0)";        
      }
      
      
      u = d.u;
      v = d.v;         

      x = this.GetX(u);
      y = this.GetY(v);

      if(blobid == selectBlobId) {
        sel_n += 1.0;
        sel_y += y;
        if(x>sel_x) sel_x = x;
      }
 
      if(v<min_v) continue;
      if(v>max_v) continue;
      if(u<min_u) continue;
      if(u>max_u) continue;

      this.ctx.fillRect(x,y-this.cellHeight,this.cellWidth,this.cellHeight);
    
    }
  }
  this.ctx.restore();

  if(sel_n>0) {
    var offset = getAbsolutePosition(this.canvas);
    SetObjectInfoBubblePosition(offset.x + sel_x, offset.y + (sel_y/sel_n));  
  }
  
  // Draw crosshair at start coords.
  for(var i=0; i<gBlobs.length; i++) {
    var blob = gBlobs[i];
    var id = blob.index;
    if((id == hoverBlobId) || (id == selectBlobId)){
      var px = gBlobs[i].startpoint_x;
      var py = gBlobs[i].startpoint_y;
      var pz = gBlobs[i].startpoint_z;
      var x =  this.GetXofZ(pz) - this.cellHeight*0.5;
      var y =  this.GetY(gGeo.GetStripFromCoord(px,py,this.view)) + this.cellWidth*0.5;
      this.ctx.fillStyle = 'black';
      this.ctx.fillRect(x,y-this.cellHeight*2,1,this.cellHeight*4);
      this.ctx.fillRect(x-this.cellWidth,y,this.cellWidth*2,1);
      console.error(px,py,pz,x,y);
    }
  }
  
  
}
  
HitMap.prototype.DrawTracks = function()
{
  // Draw Tracks.
  this.ctx.save();
  this.ctx.strokeStyle = "rgba(0,50,0,0.8)";
  this.ctx.lineWidth = this.cellHeight*0.7;

  // Loop over tracks
  for(var i=0;i<this.fSelectedTracks.length;i++)
  {
    var elem = this.fSelectedTracks[i];
  
  
    if(elem.nodes.length<2) continue; 
    var lastx,lasty;
    // Loop over track nodes (as pre-fetched and stored)
    var x,y;
    for(var inode=0;inode<elem.nodes.length;inode++) {
      var node = elem.nodes[inode];
      x = this.GetXofZ(node.z) + this.cellWidth/2;
      y = this.GetY(node.v) - this.cellHeight/2;
      if(inode>0) {
        GeoUtils.draw_highlighted_line(
          this.ctx,
          lastx,lasty,
          x,y,
          // this.cellHeight*0.8, //linewidth
          1,
          "rgba(0,150,0,0.9)", // default style
          "rgba(250,0,0,0.9)", //highlight style
          "rgba(0,0,0,0.7)", //outline style
          ShouldIHighlightThisTrack(elem.track), // do_highight
          (elem.track == gSelectedTrack) // do_outline
        );
      }
      lastx = x;
      lasty = y;
    }  

    if(elem.track == gSelectedTrack) {
      var offset = getAbsolutePosition(this.canvas);
      SetObjectInfoBubblePosition(offset.x + x, offset.y + y);  
    } 


  } // End loop over tracks
  this.ctx.restore();

}

HitMap.prototype.DrawVertices = function()
{
  // console.log("DrawVertices");
  for(var ivtx=0;ivtx<this.fSelectedVertices.length;ivtx++) {
    var elem = this.fSelectedVertices[ivtx];
    if(gShowFlaggedVerticesOnly && elem.flag<=0) continue;
            
    this.ctx.save();
    elem.x = this.GetXofZ(elem.z);
    elem.y = this.GetY(elem.v);
    
    this.ctx.translate(elem.x + this.cellWidth/2,elem.y- this.cellHeight/2);
    this.ctx.beginPath();
    this.ctx.arc(0,0,this.cellHeight*2,0,Math.PI*2,true);
    if(elem.vtx == gSelectedVertex || elem.vtx == gHoverVertex) {
      this.ctx.fillStyle = this.vertexGradientHighlight;
    } else {
      if (elem.type==1) {this.ctx.fillStyle = this.vertexGradientGreen;}
      else if (elem.type==2) {this.ctx.fillStyle = this.vertexGradientOrange;}
      else if (elem.type==3) {this.ctx.fillStyle = this.vertexGradientBlue;}
      else if (elem.type==4) {this.ctx.fillStyle = this.vertexGradientPurple;}
      else { this.ctx.fillStyle = this.vertexGradientGreen;}
    }
    this.ctx.fill();
    this.ctx.restore();

    if(elem.vtx == gSelectedVertex) {
      var offset = getAbsolutePosition(this.canvas);
      SetObjectInfoBubblePosition(offset.x + elem.x, offset.y + elem.y);  
    } 
  }
}

HitMap.prototype.DrawTrajectories = function()
{

  var selection = gSelectedTrajectories;
  if(selection.length==0 && gRecord && gRecord.mc && gRecord.mc.trajectories) selection = gRecord.mc.trajectories;
  for(var i=0;i<selection.length;i++) {
    var traj = selection[i];
    if(traj === undefined) continue;
    if(traj.trajpoint.length<2) continue;

    this.ctx.beginPath();
    this.ctx.strokeStyle = "rgba(0,0,0,1.0)";
    
    for(var j=0;j<traj.trajpoint.length;j++) {
      var tp = traj.trajpoint[j];
      var x = this.GetXofZ(tp.z) + this.cellWidth/2;
      var y = this.GetY(gGeo.GetStripFromCoord(tp.x,tp.y,this.view)) - this.cellHeight/2.;
      if(j==0) this.ctx.moveTo(x,y);       
      else     this.ctx.lineTo(x,y);
            
    }
    this.ctx.stroke();
  }
}

HitMap.prototype.DrawTruth = function()
{
  if(!gRecord) return;
  if(!gRecord.mc) return;
  var ints = gRecord.mc.interactions;
  if(!ints) return;
  for(var whichint=0;whichint<ints.length;whichint++) {
    var inter = ints[whichint];
    if(inter.index != gInteraction) continue;
    var targname = ElementName[inter.targetZ];
    if(!targname) targname = "X";
    var vtx_x = inter.vtx[0];
    var vtx_y = inter.vtx[1];
    var vtx_z = inter.vtx[2];
    var x = this.GetXofZ(vtx_z) + this.cellWidth/2;
    var v = gGeo.GetStripFromCoord(vtx_x,vtx_y,this.view);
    var y = this.GetY(v) - this.cellHeight/2.;
    // console.log("Truth:",targname,vtx,x,y);

    this.ctx.save();

    // Draw a cute little icon for the interaction vertex.
    // White circle with black rim.
    this.ctx.translate(x,y);
    this.ctx.beginPath();
    this.ctx.strokeStyle = "rgba(0,0,0,1.0)";
    this.ctx.fillStyle = "rgb(255,255,255)";
    this.ctx.arc(0,0,5.5,0,Math.PI*1.99,false);
    this.ctx.stroke();
    this.ctx.fill();
    // Name of target nucleus
    this.ctx.font = "10px serif";
    this.ctx.textAlign = "center";
    this.ctx.textBaseline = "middle";
    this.ctx.fillStyle = "rgba(0,0,0,1.0)";
    this.ctx.fillText(targname,0,0);
    this.ctx.restore();
     
  }
}


HitMap.prototype.DrawUserTrack = function()
{
  // For chris marshal
  if(!$('#ctl-show-usertrack').prop('checked')) return;
  if(!gUserTrack) return;
  if(!gUserTrack.points.length) return;
  
  this.ctx.save();
  this.ctx.strokeStyle = "rgba(0,0,0,1.0)";
  this.ctx.fillStyle = "black";
  this.ctx.lineWidth = 2;
  this.usertrack=[];
 
  for(var i=0;i<gUserTrack.points.length; i++) {
    var pt = gUserTrack.points[i];
    this.ctx.fillStyle = "rgba(40,92,0,0.5)";
    this.ctx.strokeStyle = "rgb(40,92,0)";
    var r = 5; // 5 pixel radius handle

    // draw handles.
    if(gHoverUserTrack == pt) this.ctx.strokeStyle = "FF0000";
    var x = this.GetXofZ(pt.z) + this.cellWidth/2;
    var v = gGeo.GetStripFromCoord(pt.x,pt.y,this.view);
    var y = this.GetY(v);
    this.ctx.beginPath();
    this.ctx.arc(x,y,r,0,Math.PI*1.99,false);
    this.ctx.closePath();
    this.ctx.fill();
    this.ctx.stroke();
    this.usertrack.push({x:x,y:y,r:r});    
  }


  this.ctx.strokeStyle = "rgb(40,92,0)";

  for(var i=0;i<gUserTrack.points.length-1; i++) {
    var pt = gUserTrack.points[i];
    var pt2 = gUserTrack.points[i+1];
    this.ctx.beginPath();    
    var x1 = this.GetXofZ(pt.z) + this.cellWidth/2;
    var y1 = this.GetY(gGeo.GetStripFromCoord(pt.x,pt.y,this.view));

    var x2 = this.GetXofZ(pt2.z) + this.cellWidth/2;
    var y2 = this.GetY(gGeo.GetStripFromCoord(pt2.x,pt2.y,this.view));

    
    this.ctx.moveTo(x1,y1);
    this.ctx.lineTo(x2,y2);
    this.ctx.stroke();
  }
  this.ctx.restore();
  
}

HitMap.prototype.DrawManReco = function()
{
  
  // Manual reconstruction
  this.ctx.save();
  this.ctx.strokeStyle = "rgba(0,0,0,1.0)";
  this.ctx.fillStyle = "black";
  this.ctx.lineWidth = 2;

  var mantracks = gManReco.GetTracks(this.view,false);
  if(mantracks != null) {
    var ipath = 0;    
    for(ipath=0;ipath<mantracks.length;ipath++) {
      var p = mantracks[ipath];
      this.ctx.beginPath();
      var inode = 0;
      for(inode=0;inode<p.nodes.length;inode++) {
        var u = p.nodes[inode].z;
        var v = p.nodes[inode].t;
        var x  = this.GetX(u) + this.cellWidth/2;
        var y  = this.GetY(v) - this.cellHeight/2;
        if(inode==0) {
          this.ctx.moveTo(x,y);
        } else {
          this.ctx.lineTo(x,y);
        }
      }      
      // Finish this track.
      this.ctx.stroke();
    }
  } // end tracks
      
      
  // Draw manual vertices  
  var manverts = gManReco.GetVertices(false);
  if(manverts != null) {
    var ipath = 0;    
    for(ipath=0;ipath<manverts.length;ipath++) {
      var p = manverts[ipath];
      this.ctx.beginPath();
      var inode = 0;
      for(inode=0;inode<p.nodes.length;inode++) {
        if(p.nodes[inode].view == this.view) {
          var u = p.nodes[inode].z;
          var v = p.nodes[inode].t;
          var x  = this.GetX(u) + this.cellWidth/2;
          var y  = this.GetY(v) - this.cellHeight/2;
          // Draw a dot.
          this.ctx.beginPath();
          this.ctx.arc(x,y,this.cellHeight*0.6,0,1.99*(Math.PI),true);
          this.ctx.stroke();
        }
      }
    }
  }
  this.ctx.restore();
  
}

HitMap.prototype.Draw = function()
{
  if($(this.element).is(":hidden")) return;

  if((this.fMousing) && ($('#ctl-magnifying-glass').is(':checked')) )
  {
    this.magnifying = true;
    // Cleverness:
    var mag_radius = parseFloat($('#ctl-magnifier-size').val());
    var mag_scale  = parseFloat($('#ctl-magnifier-mag').val());
    
    this.DrawOne(this.min_u, this.max_u, this.min_v, this.max_v);
    this.ctx.lineWidth =1;
    this.ctx.strokeStyle = "rgba(0,0,0,0.75)";
    this.ctx.beginPath();
    this.ctx.arc(this.fMouseX,this.fMouseY, mag_radius+1, 0,Math.PI*1.999,false);
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

function CompareArrays(a,b) {
  var n=a.length;
  if(n!=b.length) return false;
  for(var i=0;i<n;i++) { if(a[i]!==b[i]) return false; }
  return true;
}

function ChangeHoverHits( hits, clusters )
{  
  var trigger = false;
  if(CompareArrays(hits,gHoverHits)) trigger=true;; // Nothing to do.
  if(gHoverCluster != clusters) trigger=true;
  gHoverHits = hits;
  gHoverCluster = clusters;
  if(trigger) gStateMachine.Trigger('hoverHitChange');  
}

function ChangeSelectedHits( hits )
{ 
  // Give 'null' to erase selection,
  // or hits to toggle into or out of selection.
  gSelectedHits = [];
  if(hits === null) {
    // We're selecting no hits.
    if(gSelectedHits.length!=0) {
      gSelectedTrack = null;
      gSelectedBlob = null;
      gStateMachine.Trigger('selectedHitChange');
    }
    return;
  }
  
  // // This code toggles selected hits.
  // if(hits.length==0) return; // No change.
  // for(var i=0;i<hits.length;i++) {
  //   var add = true;
  //   for(var j=0;j<gSelectedHits.length;j++) {
  //     if(hits[i]===gSelectedHits[j]) {add=false; gSelectedHits.splice(j,1); break;}
  //   }
  //   if(add) gSelectedHits.push(hits[i]);
  // }
  gStateMachine.Trigger('selectedHitChange');  
}



HitMap.prototype.DoMouse = function(ev)
{
  if(ev.type === 'mouseout' || ev.type == 'touchend') {
    this.fMousing = false;
    ChangeHoverHits([]);
    gHoverTrack = null;
    gHoverVertex = null;
    gHoverCluster = null;
    gHoverUserTrack = null;
  } else {
    this.fMousing = true;
    var offset = getAbsolutePosition(this.canvas);
    this.fMouseX = ev.pageX - offset.x;
    this.fMouseY = ev.pageY - offset.y; 
    this.fMouseU = this.GetU(this.fMouseX);
    this.fMouseV = this.GetV(this.fMouseY);

    var hits = hits = this.FindMousedHits();
    var clus = null;
    var trk = null;
    var blob = null;
    var vtx = null;

    if ($('#ctl-show-hitmap-clusters').is(':checked')) { clus = this.FindMousedClusters(); }
    if ($('#ctl-show-hitmap-blobs').is(':checked'))    { blob = this.FindMousedBlob(hits); };
    if ($('#ctl-show-hitmap-tracks').is(':checked'))   {  trk =  this.FindMousedTrack(); }
    if ($('#ctl-show-hitmap-vertices').is(':checked')) {  vtx = this.FindMousedVertex(); }
    gHoverUserTrack = this.FindMousedUserTrack();
    
    if(ev.type === 'click') {
      // Ignore selection mechanism - didn't find a use for this anyway. 
      gSelectedVertex = vtx;
      if(!vtx) gSelectedTrack = trk; // Don't select both a track and vertex.
      if(!vtx) gSelectedBlob = blob;
      
      ChangeSelectedHits(hits);
      for(var i=0;i<hits.length;i++) {
        var hit=hits[i];
        gManReco.Click(this.view, parseFloat($(this.v_selector,hit).text())
                                , parseFloat($(this.u_selector,hit).text())
                                , hit);
      }
    } else if(ev.type === 'mousedown' ){
      this.fMouseStartX = this.fMouseX;
      this.fMouseStartY = this.fMouseY;
      this.fMouseStartU = this.fMouseU;
      this.fMouseStartV = this.fMouseV;
      if(gHoverUserTrack) {
        this.dragging_usertrack = gHoverUserTrack;
        this.dragging_usertrack_index = gHoverUserTrack.index;
        
      }
    } else if(ev.type === 'mouseup' ) {
      this.dragging_usertrack = null;
    } else {

      // mousemove
      if(this.dragging_usertrack) {
        // Set drag to new coordinates.
        var z        = this.GetZofX(this.fMouseX);
        var v        = this.GetV(this.fMouseY);
        AdjustUserTrack(this.dragging_usertrack_index,this.view,v,z);
        console.log('Drag to',v,z);
      }

      gHoverVertex = vtx;
      gHoverTrack = trk;
      gHoverBlob = blob;
      ChangeHoverHits(hits,clus);
    }
  } 
  this.Draw();
  
}

HitMap.prototype.FindMousedUserTrack = function()
{
  if(!this.usertrack) return;
  for(var i=0;i<this.usertrack.length;i++) {
    var dx = this.fMouseX - this.usertrack[i].x;    
    var dy = this.fMouseY - this.usertrack[i].y;
    var r  = this.usertrack[i].r;
    if((dx*dx + dy*dy) < r*r) return gUserTrack.points[i];
  }
  return null;
}

HitMap.prototype.FindMousedTrack = function()
{
  this.trackDetectPix = 3;

  // Loop over tracks
  for(var i=0;i<this.fSelectedTracks.length;i++)
  {
    var elem = this.fSelectedTracks[i];
    if(elem.nodes.length<2) continue;
    var x1 = this.GetXofZ(elem.nodes[0].z) + this.cellWidth/2;
    var y1 = this.GetY(elem.nodes[0].v) - this.cellHeight/2;
    // Loop over track nodes (as pre-fetched and stored)
    for(var inode=1;inode<elem.nodes.length;inode++) {
      var node = elem.nodes[inode];
      var x2 = this.GetXofZ(node.z); + this.cellWidth/2 ;
      var y2 = this.GetY(node.v) - this.cellHeight/2;
      if(GeoUtils.line_is_close_to_point(this.fMouseX,this.fMouseY,
                                         x1,y1,x2,y2,this.trackDetectPix)) return elem.track;
    }


  } // End loop over tracks
  return null;
}

HitMap.prototype.FindMousedVertex = function()
{
  this.vtxDetectPix = 5;
  
  // Loop over vertices. find the closest.
  var closest = null
  var dist = 9999;
  for(var i=0;i<this.fSelectedVertices.length;i++) {
    var elem = this.fSelectedVertices[i];
    var dx = Math.abs(elem.x-this.fMouseX);
    var dy = Math.abs(elem.y-this.fMouseY);
    var d = dx*dx+dy*dy;
    if(d<dist) { closest = elem.vtx; dist = d;}
  }
  if(dist < this.vtxDetectPix*this.vtxDetectPix) return closest;
  return null;
}

HitMap.prototype.FindMousedClusters = function() 
{
  if (!($('#ctl-show-hitmap-clusters').is(':checked'))) return null;
  // Attempt to locate hit object corresponding to mouse position.
  var closest = null
  var dist = 9999;
  for(var i=0;i<this.fSelectedClusters.length;i++) {
    var elem = this.fSelectedClusters[i];
    var dx = (elem.x-this.fMouseX);
    var dy = (elem.y-this.fMouseY);
    var d = dx*dx+dy*dy;
    if(d<dist) { closest = elem.clus; dist = d;}
  }
  if(dist < 2*this.cellHeight*this.cellHeight) return closest;
  return null;
}


HitMap.prototype.FindMousedHits = function() 
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


HitMap.prototype.FindMousedHitsUV = function(u,v) 
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

HitMap.prototype.FindMousedBlob = function(hits) 
{
  // use the found moused hits to find the blob.
  for(var i=0;i<hits.length;i++)
  {
    var blobid = hits[i].blob_id;
    if(blobid){
       var blob = gBlobs[blobid]; // FIXME: is this right? are indexes good?
       console.log("Hovering over blob id",blobid," object ",blob);
       return blob;
     }
  }
}

HitMap.prototype.GetXofZ = function( z ) 
{
  return this.origin_x + this.span_x*(z-this.min_z)/(this.max_z-this.min_z);
}

HitMap.prototype.GetZofX = function( x ) 
{
  return( (x-this.origin_x)/this.span_x*(this.max_z-this.min_z) + this.min_z );
}

HitMap.prototype.GetX = function( u ) 
{
  var z = gGeo.Z_of_Module(u,this.view);
  // return this.origin_x + this.span_x*(u-this.min_u)/(this.max_u-this.min_u);
  return this.origin_x + this.span_x*(z-this.min_z)/(this.max_z-this.min_z);
}

HitMap.prototype.GetY = function( v ) 
{
  return this.origin_y - this.span_y*(v-this.min_v)/(this.max_v-this.min_v);
}

HitMap.prototype.GetU = function( x ) 
{
  return gGeo.Module_of_Z( (x-this.origin_x)/this.span_x*(this.max_z-this.min_z) + this.min_z ,this.view);
  // return (x-this.origin_x)/this.span_x*(this.max_u-this.min_u) + this.min_u;
}

HitMap.prototype.GetV = function( y ) 
{
  return (this.origin_y-y)/this.span_y*(this.max_v-this.min_v) + this.min_v;
}





// Subclass for towers.
TowerHitMap.prototype = new HitMap;           
TowerHitMap.prototype.constructor = TowerHitMap;

function TowerHitMap( element, options )
{
  // console.log('TowerHitMap ctor');
  if(!element) {
    console.log("TowerHitMap: NULL element supplied.");
    return;
  }

  var settings = {
    tower : 1,
    u_selector : "frame",
    flip_y : false,
    can_do_triangles: false
  };
  $.extend(true,settings,options); // Change default settings by provided qualities.
  HitMap.call(this, element, settings); // Give settings to superclass contructor.
}

TowerHitMap.prototype.Select = function()
{ 
  // Reset layout.
  this.num_u = gGeo.NumModules;
  this.min_u= gGeo.FirstModule-1;
  this.max_u= gGeo.LastModule+1;
  this.max_z = gGeo.Z_of_Module(this.max_u,1);
  this.min_z = gGeo.Z_of_Module(this.min_u,1);
  
  this.fData = [];
  this.fSelectedData = [];
  this.fClusters = [];
  this.fSelectedClusters = [];
  if($(this.element).is(":hidden")) return;
  // As above, but for OD hits.
  var sel = this.base_selector;
  // Find a list of candidate hits, using base_selector
  if(gOdHits.length<1) return;
  var tower = this.tower;
  this.fData = $(gOdHits).filter(function(index) {
    return this.tower == tower;
  });
  this.ReSelect();
} 


TowerHitMap.prototype.AddHit = function( hit )
{
  var story = hit.story;
  var bar   = hit.bar;
  var iy = 2*(story-1)+(bar-1);
  if(this.flip_y) iy = 7-iy;
  
  this.fSelectedData.push( {
    u: hit[this.u_selector],
    v: iy,
    w: hit[this.w_selector],
    hit: hit
  });
}

TowerHitMap.prototype.DrawVertices = function()
{}
TowerHitMap.prototype.DrawTracks = function()
{}
TowerHitMap.prototype.DrawTruth = function()
{}
TowerHitMap.prototype.DrawRegions = function(min_u,max_u, min_v, max_v)
{
  // Find 'HCAL' fill style
  var fillstyle = "rgba(0,0,0,0.03)";
  for(var ir=0;ir<gGeo.regions.length;ir++)
  {
    var rname = gGeo.regions[ir].name;
    if(rname=='HCAL') fillstyle = gGeo.regions[ir].fill;
  }

  this.ctx.save();
  var x1 = this.GetX(min_u);
  var x2 = this.GetX(max_u);
  var y1 = this.GetY(min_v);
  var y2 = this.GetY(max_v);
  this.ctx.fillStyle = fillstyle;
  this.ctx.fillRect(x1,y1,x2-x1,y2-y1);
  this.ctx.restore();  
}

TowerHitMap.prototype.DrawTrajectories = function()
{
}
