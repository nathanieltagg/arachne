//
// Code for the Arachne Event Display
// Author: Nathaniel Tagg ntagg@otterbein.edu
// 
// Licence: this code is free for non-commertial use. Note other licences may apply to 3rd-party code.
// Any use of this code must include attribution to Nathaniel Tagg at Otterbein University, but otherwise 
// you're free to modify and use it as you like.
//

//
// Objects and functions to build a 3-d display using custom Pad3d.
//


// Subclass of Pad.
TriDView.prototype = new Pad3d;           
TriDView.prototype.constructor = TriDView;

function TriDView( element, options ){
  // console.log('TriDView ctor');
  if(!element) {
    // console.log("TriDView: NULL element supplied.");
    return;
  }
  if($(element).length<1) { 
    // console.log()
    return;   
  }
  
  var settings = {
    default_look_at:    [0,0,700],
    default_camera_distance: 800,
    camera_distance_max: 8000,
    camera_distance_min: 50,
    default_theta: -0.1,
    default_phi: 0.5,
  }
  $.extend(true,settings,options);  // Change default settings by provided qualities.
  Pad3d.call(this, element, settings); // Give settings to Pad contructor.


  this.show_hits = $(".trid-ctl-show-hits").is(":checked");
  this.show_minos_hits = $(".trid-ctl-show-minos-hits").is(":checked");
  
  $(".trid-ctl-show-hits")  
      .change(function(ev){
        self.show_hits = $(this).is(":checked");
        self.Rebuild();
  });
  
  $(".trid-ctl-show-minos-hits")  
      .change(function(ev){
        self.show_minos_hits = $(this).is(":checked");
        self.Rebuild();
  });
  
  this.fSelectedMinosTracks=[];
  this.fMinosTracks=[];
  this.fSelectedMinosStrips=[];
  this.fMinosStrips=[];
  
  


  // Data model state.
  gStateMachine.BindObj('gateChange',this,"Rebuild");
  gStateMachine.BindObj('sliceChange',this,"Rebuild");  
  gStateMachine.BindObj('selectedHitChange',this,"Rebuild");
  gStateMachine.BindObj('phColorChange',this,"Rebuild");
  var self = this;
  $(this.element) .bind('click',  function(ev)     { return self.Click(); });
 
  this.ResetView();
}



TriDView.prototype.Rebuild = function ()
{
  // console.debug('TriD::Rebuild()');

  this.objects = [];
  
  this.CreateFrame();
  if ($('#ctl-show-hitmap-tracks').is(':checked')) {  this.CreateTracks(); }
  if (this.show_hits)                              {  this.CreateStrips(); }
  if (this.show_minos_hits)                        {  this.CreateMinosStrips(); }
  
  if ($('#ctl-show-hitmap-vertices').is(':checked')) { this.CreateVertices(); }
  if ($('#ctl-show-hitmap-clusters').is(':checked')) { this.CreateClusters(); }
  this.Draw();
}


TriDView.prototype.CreateFrame = function()
{
  // console.log("TriDView CreateFrame.");
  
  
  
  ///
  /// build hexagon frame.
  ///
  var l=122.6; // length of one side
  var w=106.2; // width of hexagon
  var h=l*(0.5+Math.sin(Math.PI/6));
  
  // All coords are in cm.
  var curColor = "rgba(50, 50, 255, 1)";

  var z = gGeo.Z_of_Module(gGeo.FirstModule,1)/10.
  this.AddLine( -w, -l/2, z,  -w, l/2,  z, 4, curColor);
  this.AddLine(  w, -l/2, z,   w, l/2,  z, 4, curColor);
  this.AddLine( -w,  l/2, z,   0, h,    z, 4, curColor);
  this.AddLine(  w,  l/2, z,   0, h,    z, 4, curColor);
  this.AddLine( -w, -l/2, z,   0, -h,   z, 4, curColor);
  this.AddLine(  w, -l/2, z,   0, -h,   z, 4, curColor);

  z = gGeo.Z_of_Module(gGeo.LastModule+1,1)/10.

  // one hexagon.
  this.AddLine( -w, -l/2, z,  -w, l/2,  z, 4, curColor);
  this.AddLine(  w, -l/2, z,   w, l/2,  z, 4, curColor);
  this.AddLine( -w,  l/2, z,   0, h,    z, 4, curColor);
  this.AddLine(  w,  l/2, z,   0, h,    z, 4, curColor);
  this.AddLine( -w, -l/2, z,   0, -h,   z, 4, curColor);
  this.AddLine(  w, -l/2, z,   0, -h,   z, 4, curColor);
  
  // The MINOS ND frame.
  z = 1135.5;
  
  for(z = 1135.5;  z < 1135.5+1680+1; z += 1680) {
    var xoff = 21.96*2.54 - 121.9;
    var yoff = -39.3;
    // Loop over lhs, rhs of detector
    for(var side=-1.; side<3. ; side+=2. ) {
      this.AddLine(          0+xoff, 190+yoff,  z,  side*170+xoff, 190+yoff,   z, 4, "rgb(0,0,0)"); 
      this.AddLine(   side*170+xoff, 190+yoff,  z,  side*170+xoff, 153+yoff,   z, 4, "rgb(0,0,0)"); 
      this.AddLine(   side*170+xoff, 153+yoff,  z,  side*310+xoff, 0  +yoff,   z, 4, "rgb(0,0,0)"); 
      this.AddLine(   side*310+xoff, 0  +yoff,  z,  side*310+xoff, -20+yoff,   z, 4, "rgb(0,0,0)"); 
      this.AddLine(   side*310+xoff, -20+yoff,  z,  side*240+xoff, -20+yoff,   z, 4, "rgb(0,0,0)"); 
      this.AddLine(   side*240+xoff, -20+yoff,  z,  side*240+xoff,-102+yoff,   z, 4, "rgb(0,0,0)"); 
      this.AddLine(   side*240+xoff,-102+yoff,  z,  side*170+xoff,-153+yoff,   z, 4, "rgb(0,0,0)"); 
      this.AddLine(   side*170+xoff,-153+yoff,  z,  side*170+xoff,-190+yoff,   z, 4, "rgb(0,0,0)"); 
      this.AddLine(   side*170+xoff,-190+yoff,  z,  0       +xoff,-190+yoff,   z, 4, "rgb(0,0,0)"); 
    }
  }
  
  z = 1155.5;
  // And now do the outline of an active plane.
  this.AddLine(            28.7,  134.6,  z,    28.7,   134.6,   z, 4, "rgb(50,50,50)"); 
  this.AddLine(           145.2,   16.2,  z,    28.7,   134.6,   z, 4, "rgb(50,50,50)"); 
  this.AddLine(           145.2,  -93.8,  z,   145.2,    16.2,   z, 4, "rgb(50,50,50)"); 
  this.AddLine(            28.0, -215.0,  z,   145.2,   -93.8,   z, 4, "rgb(50,50,50)"); 
  this.AddLine(          -114.7,  -75.0,  z,    28.0,  -215.0,   z, 4, "rgb(50,50,50)"); 
  this.AddLine(           -83.6,  -40.2,  z,  -114.7,   -75.0,   z, 4, "rgb(50,50,50)"); 
  this.AddLine(          -114.7,   -3.6,  z,   -83.6,   -40.2,   z, 4, "rgb(50,50,50)"); 
  this.AddLine(            28.7,  134.6,  z,  -114.7,    -3.6,   z, 4, "rgb(50,50,50)"); 
                                                        
  // Draw lines indicating where the coil is.
  var xcoil1 =  -83.6;
  var xcoil2 =  -114.7;
  var xcoil3 = -145.8;
  var ycoil1 = -75.0;
  var ycoil2 = -40.2;
  var ycoil3 = -3.6;
  var z1 = 1135.5;
  var z2 = z1 + 1680;
  this.AddLine(  xcoil1,  ycoil2,   z1, xcoil1,  ycoil2,  z2 , 4, "rgb(50,50,50)");
  this.AddLine(  xcoil2,  ycoil1,   z1, xcoil2,  ycoil1,  z2 , 4, "rgb(50,50,50)");
  this.AddLine(  xcoil2,  ycoil3,   z1, xcoil2,  ycoil3,  z2 , 4, "rgb(50,50,50)");
  this.AddLine(  xcoil3,  ycoil2,   z1, xcoil3,  ycoil2,  z2 , 4, "rgb(50,50,50)");

  this.AddLine(  xcoil1,  ycoil2,   z1, xcoil2,  ycoil3,  z1 , 4, "rgb(50,50,50)");
  this.AddLine(  xcoil2,  ycoil3,   z1, xcoil3,  ycoil2,  z1 , 4, "rgb(50,50,50)");
  this.AddLine(  xcoil3,  ycoil2,   z1, xcoil2,  ycoil1,  z1 , 4, "rgb(50,50,50)");
  this.AddLine(  xcoil2,  ycoil1,   z1, xcoil1,  ycoil2,  z1 , 4, "rgb(50,50,50)");

  this.AddLine(  xcoil1,  ycoil2,   z2, xcoil2,  ycoil3,  z2 , 4, "rgb(50,50,50)");
  this.AddLine(  xcoil2,  ycoil3,   z2, xcoil3,  ycoil2,  z2 , 4, "rgb(50,50,50)");
  this.AddLine(  xcoil3,  ycoil2,   z2, xcoil2,  ycoil1,  z2 , 4, "rgb(50,50,50)");
  this.AddLine(  xcoil2,  ycoil1,   z2, xcoil1,  ycoil2,  z2 , 4, "rgb(50,50,50)");
   
  

  
  // The cryotarget.
  // Email from Lingyan Zhu, Nov 22 2010
  // z0=2615.3 mm
  //   cylinder: x**2+y**2=750**2 && |z-z0|<500
  //   downsteam head shape: z-z0>500 && x**2+y**2+(z-z0-500)**2/0.04=750**2
  //   upsteam head shape: z-z0<-500 && x**2+y**2+(z-z0+500)**2/0.04=750**2
  var curColor = "rgba(50, 50, 255, 1)";
  var nsteps = 36;

  var z0 = 261.5;
  var r = 75;
  var which = -1;
  for(which = -1; which <2; which+=2) {
    var z = z0 + which*50;
    var dtheta = Math.PI*2/(nsteps);

    for(var i=0;i<nsteps;i++) {
      var x1 = r * Math.cos(i*dtheta);
      var x2 = r * Math.cos((i+1)*dtheta);
      var y1 = r * Math.sin(i*dtheta);
      var y2 = r * Math.sin((i+1)*dtheta);
      this.AddLine(   x1, y1, z,  x2, y2, z, 3, curColor); 
    }
    
    for(var i=0;i<nsteps/2;i++) {
      var x1 = r * Math.cos(i*dtheta);
      var x2 = r * Math.cos(i*dtheta+dtheta);
      var z1 = z0 + which*50 + which*r*0.2*Math.sin(i*dtheta);
      var z2 = z0 + which*50 + which*r*0.2*Math.sin(i*dtheta+dtheta);
      this.AddLine(   x1, 0, z1, x2, 0, z2, 3, curColor); 
      
    }
    

  }
  
  
}

TriDView.prototype.CreateTracks = function()
{
if ($('#ctl-show-hitmap-tracks').is(':checked') && gRecord) {
  var tracks = gRecord.tracks;
  var associated_minos_tracks = [];

  for(var itrk=0;itrk<tracks.length;itrk++) {
    // Is the track in the current slice? 
    if(gCurrentSlice>=0) {
      if(tracks[itrk].slice != gCurrentSlice) continue;
    }
    var nodes = tracks[itrk].nodes;


    var color = "rgba(0,150,0,1.0)";//"rgba(255, 50, 100, 1)";
    if(tracks[itrk] == gSelectedTrack) color =  "rgba(250,0,0,1.0)";

    var lastX = 0;
    var lastY = 0;
    var lastZ = 0;
    for(var inode=0;inode<nodes.length;inode++) {
      var varX = nodes[inode].x/10;
      var varY = nodes[inode].y/10;
      var varZ = nodes[inode].z/10;

      if(inode>0) {
        // Draw a connecting line.
        this.AddLine(lastX, lastY, lastZ, varX, varY, varZ, 3, color, tracks[itrk]);
      }
      
      lastX = varX;
      lastY = varY;
      lastZ = varZ;
    }

    // Line along starting trajectory
    //var dz = parseFloat($('endz',mtrk).text())/10 - parseFloat($('vtxz',mtrk).text())/10;
  }
  
  
  /////////////////////
  ////MINOS TRACKS/////
  /////////////////////
  
  for(var i=0;i<gMinosTracks.length;i++) {
    var trk = gMinosTracks[i];
    if(gCurrentSlice>=0) {
      if(trk.slice != gCurrentSlice) continue;
    }
    var lastX, lastY, lastZ;
    var x, y, z;
    color = "rgba(0,150,150,0.8)";
    
    for (var istp=0;istp<trk.trk_strips.length;istp++) {
      x = trk.trk_strips[istp].x/10.;
      y = trk.trk_strips[istp].y/10.;
      z = trk.trk_strips[istp].z/10.;
      
      if(istp>0)
        this.AddLine(x,y,z,lastX,lastY,lastZ,3,color,trk);        
      
      lastX = x;
      lastY = y;
      lastZ = z;
    }

  }
   
}
}

TriDView.prototype.CreateClusters = function()
{
  // console.log("TriDView::CreateClusters()");
  // Reselect hits based upon cuts.
  var clus_mask = 0;
  switch( $("input[name='hitmap-clus-radio']:checked").val() ) {
            case "flagged":  clus_mask = 16; break;
            case "anchor":   clus_mask = 1; break;
            case "primary-anchored":  clus_mask = 2; break;
            case "secondary-anchored":clus_mask = 4; break;
  };
  // console.log("Drawing clusters:",this.fSelectedClusters.length);
  var cfill_default      =  "rgba(200,200,200,1)";
  var cfill_trackable    =  "rgba(0,0,0,1)";
  var cfill_heavyIon     =  "rgba(255,0,0,1)";
  var cfill_superCluster =  "rgba(0,0,255,1)";

  var cfill_lowActivity;
  if($('#ctl-show-hitmap-la-clusters').is(':checked')) {
    cfill_lowActivity =  "rgba(200,200,200,1)";
  } else {
   cfill_lowActivity =  "rgba(0,0,0,0)";
  }
  
  var n = gIdClusters.length;
  for(var i=0;i<n;i++) {
    var clus = gIdClusters[i];
    if( (gCurrentSlice <0 ) || (clus.slice == gCurrentSlice) ) {
      if(clus_mask>0) {
        var clus_bits = 0;
        if(clus.flag>0) clus_bits += 16;
        if(clus.usedFor>0) clus_bits += clus.usedFor;
        // console.log(clus,clus_mask,clus_bits);
        if((clus_bits & clus_mask) == 0) continue;
      }

      // OK, if we made it to here then this cluster is selected.

      var lpos = clus.lpos;
      if(lpos==null) continue; // only show clusters with lpos defined.
      if(lpos<-9000) continue; // only show clusters with lpos defined.
      var type=clus.type;
      var view=clus.view;
      var coord=clus.coord;
      var module = clus.module;
 
      // Convert from u/v coord to floating-point strip number:
      var strip = coord/kStripPitch + gGeo.MidStrip;
      // Convert from strip number and view to get pseudo-strip end points.
      var cd = gGeo.GetIdStripCoords(view,strip,lpos-200,lpos+200);
  
      // Get z position: 
      var z = gGeo.Z_of_Module(module,view);

      var cfill = cfill_default;
      switch(type) {
        case 1: cfill = cfill_trackable; break;
        case 2: cfill = cfill_lowActivity; break;
        case 3: cfill = cfill_superCluster; break;
        case 4: cfill = cfill_heavyIon; break;
      }

      this.AddLine( 
            cd.x1/10, cd.y1/10, z/10,  // full line
            cd.x2/10, cd.y2/10, z/10,
            2, cfill, clus
          );    

    }
  }
}

TriDView.prototype.CreateStrips = function()
{
  // console.log("TriDView::CreateStrips()");
  if ($('#ctl-show-hitmap-hits').is(':checked')) {
  
  var n = gIdHits.length;
  phfield = $('#ctl-ph-field').val();
  HitSatisfiesCutSetup();
  for(var i=0;i<n;i++) {
    var hit = gIdHits[i];
    if(HitSatisfiesCut(hit)){
      var m = hit.module;
      var s = hit.strip;
      var v = hit.view;
      var z = gGeo.Z_of_Module(m);
      var cd = gGeo.GetIdStripCoords(v,s);
      var c =  gPhColorScaler.GetColor(hit[phfield]);
      // gPhColorScaler.min = 0;
      // gPhColorScaler.max = 10;
      this.AddLine( 
        cd.x1/10,
        cd.y1/10,
        z/10,
        cd.x2/10,
        cd.y2/10,
        z/10,
        1,
        "rgb("+c+")",
        hit
      );    
    }
  }
  
  n = gOdHits.length;
  for(var i=0;i<n;i++) {
    var hit = gOdHits[i];
    if(HitSatisfiesCut(hit)){
      var m = hit.frame;
      var z = gGeo.Z_of_Module(m);
      var cd = gGeo.GetOdStripCoords(hit.tower,hit.story,hit.bar);
      var c =  gPhColorScaler.GetColor(hit[phfield]);
      // gPhColorScaler.min = 0;
      // gPhColorScaler.max = 10;
      this.AddLine(
        cd.x1/10,
        cd.y1/10,
        z/10,
        cd.x2/10,
        cd.y2/10,
        z/10,
        1,
        "rgb("+c+")",
        hit
      );    
    }
  }
}
  
  //////////////////////
  /////MINOS STRIPS/////
  //////////////////////
  
TriDView.prototype.CreateMinosStrips = function()
{  
  this.fMinosStrips = [];
  if($(this.element).is(":hidden")) return;
  w_selector = $('#ctl-ph-field').val();
  var m = gMinosStrips.length;
  for (i=0;i<m;i++) {
      hit = gMinosStrips[i];
      this.fMinosStrips.push({
      z:         gGeo.Z_of_Plane(hit.plane)/10,
      line:      gGeo.GetStripEndCoordinates(hit.plane,hit.view,hit.strip),
      hit:      hit,
      w:        hit.ph,
      slice:    hit.slice
      });
  }
  this.fMinosStrips.sort(function(a,b) { return a.z - b.z; });
  
  this.fSelectedMinosStrips=[];
  var n = this.fMinosStrips.length;
  for(var i=0;i<n;i++) {
    var e=this.fMinosStrips[i];		
    if( (gCurrentSlice < 0) ||
        (e.slice == gCurrentSlice) ) {
			    this.fSelectedMinosStrips.push(e);
        }
	}
	
  var i,d,c;
  var colorScaler  = new ColorScaler();
  colorScaler.min = 0;
  colorScaler.max = 100*10;
  for(i=0;i<this.fSelectedMinosStrips.length;i++) {
	  	d = this.fSelectedMinosStrips[i];
      var c =  colorScaler.GetColor(d.w);
      this.AddLine(d.line.x1/10,d.line.y1/10,d.z,d.line.x2/10,d.line.y2/10,d.z,1,"rgba(" + c + ",0.7)",gMinosStrips[i]);
  }
}
  
  
}

TriDView.prototype.CreateVertices = function()
{
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
  this.vertexGradientHighlight.addColorStop(0,   'rgba(255,0,0,1)'); // blue
  this.vertexGradientHighlight.addColorStop(1,   'rgba(0,255,0,0)'); // Transparent
  
  for(var ivtx=0;ivtx<gVertices.length;ivtx++) {
    var vtx = gVertices[ivtx];
    if(vtx.track_idx.length ==0) continue; // Don't draw trackless vertices
    // Is the vertex in the current slice? 
    if(gCurrentSlice>=0) {
      if(vtx.slice != gCurrentSlice) continue;
    }
    var type = vtx.type;
    var vtxColor = this.vertexGradientGreen;
    if (type==2) {this.ctx.fillStyle = this.vertexGradientOrange;}
    else if (type==3) {this.ctx.fillStyle = this.vertexGradientBlue;}
    else if (type==4) {this.ctx.fillStyle = this.vertexGradientPurple;}

    this.AddPoint( vtx.x/10.,
                   vtx.y/10.,
                   vtx.z/10.,
                   10,
	                 vtxColor,
                   this.vertexGradientHighlight,
                   vtx);
  }  
  
  // Dummy point to check drawing code
  // this.AddPoint(0,0,800,10,this.vertexGradient,null,null,null);
}

TriDView.prototype.should_highlight = function(obj)
{
  if(!obj.source) return false;
  if(obj.source.nodeName == "trk") return ShouldIHighlightThisTrack(obj.source);
  if(obj.source.nodeName == "vtx") return (obj.source == gHoverVertex || obj.source == gSelectedVertex);
}

TriDView.prototype.should_outline = function(obj)
{
  if(!obj.source) return false;
  return (obj.source == gSelectedTrack);
}

TriDView.prototype.HoverObject = function(selected)
{
  gHoverTrack = null;
  gHoverVertex = null;
  if(selected) {
    if(selected.nodeName == "trk") gHoverTrack = selected;    
    if(selected.nodeName == "vtx") gHoverVertex = selected;    
  }
  this.Draw();
}



TriDView.prototype.Click = function()
{
  gSelectedVertex = gHoverVertex;
  gSelectedTrack = gHoverTrack; 
  gStateMachine.Trigger('selectedHitChange');
}

