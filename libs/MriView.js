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


// Some constants.
var ksixty_degrees = 60*3.1415928/180;
var kcos_60 = Math.cos(ksixty_degrees);
var ksin_60 = Math.sin(ksixty_degrees);
var ktan_60 = Math.tan(ksixty_degrees);
var ksin_120 = Math.sin(ksixty_degrees*2);
var ktan_120 = Math.tan(ksixty_degrees*2);
var kthirty_degrees = 30*3.1415928/180;
kmmMinos_xshift = -1482.8 + 10390*2.54*0.01;    // mm 
kmmMinos_yshift = 114000*0.0254 - 129480*0.0254; // mm



// Subclass of Pad.
MriView.prototype = new Pad;           
MriView.prototype.constructor = MriView;

function MriView( element, options )
{
  // console.log('MriView ctor');
  if(!element) {
    // console.log("MriView: NULL element supplied.");
    return;
  }
  if($(element).length<1) { 
    // console.log()
    return;
  }
  
  var settings = {
    u_selector : "module",
    v_selector : "strip",
    draw_axes : false,
    xlabel: null,
    ylabel: null,

    draw_tick_lables_x: false,
    draw_tick_lables_y: false,
    draw_ticks_x: false,
    draw_ticks_y: false,
    draw_grid_x:  false,
    draw_grid_y:  false,

    margin_left :   0,
    margin_bottom : 0,
    margin_top :    0,
    margin_right:   0,
    
    min_u : -2500, // mm
    max_u :  2500,
    min_v : -2500,
    max_v :  2500,
    min_z : gGeo.Z_of_Module(gGeo.FirstModule,1),
    max_z : 11355+8400,
    z: [gGeo.Z_of_Module(gGeo.FirstModule,1),gGeo.Z_of_Module(gGeo.FirstModule+10,1)],
    mag_radius: 50,     // size in pixels of magnifying glass
    magnification: 2.5  // How much to increase magnification.
  }
  $.extend(true,settings,options); // Change default settings by provided qualities.
  Pad.call(this, element, settings); // Give settings to Pad contructor.
  
  // Why do we have to do this here and it doesn't work in the settings?  I'm going insane.
  this.z = [gGeo.Z_of_Module(gGeo.FirstModule,1),gGeo.Z_of_Module(gGeo.FirstModule+10,1)];

  this.kU = [ kcos_60, ksin_60 ];
  this.kV = [ kcos_60, -ksin_60 ];
  
  // NB X and Y are screen coordinates
  // U and V are 'natural' coordinates, like plane/strip or x,z positions
  this.fMousing = false;
  this.hitlist=[];
  this.fTracks=[];
  
  var self = this;
  // $(this.element).bind('mousemove',function(ev) { return self.DoMouse(ev); });
  // $(this.element).bind('mouseout' ,function(ev) { return self.DoMouse(ev); });
  // gStateMachine.BindObj('gateChange',this,"Select");
  // gStateMachine.BindObj('phCutChange',this,"ReSelect");
  // gStateMachine.BindObj('timeCutChange',this,"ReSelect");
  // gStateMachine.BindObj('sliceChange',this,"ReSelect");
  // gStateMachine.BindObj('phColorChange',this,"Draw");  

  // Get the slider control and set it up
  
  // this slider has two adjustable endpoints matching the selection range for planes.
  this.slider_ends = $('#mri-slider-ends');
  this.slider_ends.slider({
    orientation: "horizontal",
    range: true,
    min: self.min_z,
    max: self.max_z,
    values: self.z,
  step: 45,
    slide: function(event, ui) {
      $(ui.handle).text(ui.value);
      self.ChangeZends(ui.values);
    }
  });
  
  // this slider has one adjuster, matching the first plane but sliding the window.
  
  this.slider_grip = $('#mri-slider-grip');
  this.slider_grip.slider({
    orientation: "horizontal",
    min: self.min_z,
    max: self.max_z,
    value: this.z[0],
  step: 45,
    slide: function(event, ui) {
      // $(ui.handle).text(ui.value);
      self.ChangeZgrip(ui.value);
    }
  });
  $(".ui-slider-handle",this.slider_grip).css("width","5em");
  
  this.fMousing = false;
  this.fSelectedData=[];
  this.fData=[];
  this.fSelectedTracks=[];
  this.fTracks=[];
  this.fSelectedMinosTracks=[];
  this.fSelectedMinosStrips=[];
  this.fMinosStrips=[];
    
  this.ChangeZends(this.z);
  var self = this;
  $(this.element).bind('mousemove',function(ev) { return self.DoMouse(ev); });
  $(this.element).bind('click'    ,function(ev) { return self.DoMouse(ev); });
  $(this.element).bind('mouseout' ,function(ev) { return self.DoMouse(ev); });
  $(this.element).bind('resize' ,function(ev) { if(self.fData.length==0) self.Index(); });
  
  gStateMachine.BindObj('gateChange',this,"NewGate");
  gStateMachine.BindObj('phCutChange',this,"Select");
  gStateMachine.BindObj('timeCutChange',this,"Select");
  gStateMachine.BindObj('sliceChange',this,"Select");
  gStateMachine.BindObj('phColorChange',this,"Draw"); 
  // gStateMachine.BindObj('hoverHitChange',this,"Draw");  
  
  gStateMachine.BindObj('selectedHitChange',this,"Draw");  
  
  
  
  var parent = $(this.element).parent();
  
  $(".mri-autoscan" ,parent)
    .button({icons: {primary: 'ui-icon-arrowrefresh-1-s'},text: false})
    .change(function(ev){self.autoScan($(this).is(':checked'));});

}


MriView.prototype.Resize = function()
{
  // This pad is a special case: we want to preseve x/y proportionality after a resize.

  // First, call the standard function.
  Pad.prototype.Resize.call(this)

  // Now insist that the smaller dimention conform. 
  var aspect_ratio = this.span_y/this.span_x;
  if(aspect_ratio > 1) {
    // More constrained in x  
    this.min_u = -2500;
    this.max_u =  2500;
    this.min_v = this.min_u*aspect_ratio; 
    this.max_v = this.max_u*aspect_ratio; 
  } else {
    // More constrained in y
    this.min_v = -2500;
    this.max_v =  2500;
    this.min_u = this.min_v/aspect_ratio; 
    this.max_u = this.max_v/aspect_ratio; 
  }
  // console.log("MriView::Resize",aspect_ratio,this.min_u,this.max_u,this.min_v,this.max_v)
}


MriView.prototype.ChangeZends = function( values )
{
  // One of the two endpoints have changed.

  // Write numbers into the slider
  this.z = values;
  var d = this.z[1] -this.z[0];
  // Change the grip slider.
  // this.slider_grip.slider('option','min',this.min_z-d/2);
  // this.slider_grip.slider('option','max',this.max_z-d/2);
  this.slider_grip.slider('value',this.z[0]); // Adjust so that upper bound of gripper hits top
  // adjust the width of the gripslider
  // var ends = $("a.ui-slider-handle",this.slider_ends)
  // var left = ends.first().position().left;
  // var right = ends.last().position().left;// + ends.last().width();
  // console.log("left,right:",left,right);
  //$(".ui-slider-handle",this.slider_grip).css("width",right-left);
  this.ChangeZ();
}

MriView.prototype.ChangeZgrip = function( value )
{
  // The grip bar has been moved.
  var d = this.z[1] -this.z[0];
  this.z = [value, value+d];
  // Change the endpoint slider.
  this.slider_ends.slider('values',0,this.z[0]);
  this.slider_ends.slider('values',1,this.z[1]);
  this.ChangeZ();
}

MriView.prototype.ChangeZ = function()
{
  // The Z range has changed.
  var self = this;
  // Write the legend into the slider bars.
  $("a.ui-slider-handle",this.slider_ends).each(function(i){
    $(this).text(
      Math.floor(gGeo.Module_of_Z(self.z[i],1))
    );
  });
  this.Select();
  this.Draw();
}



MriView.prototype.NewGate = function()
{
  // console.debug("MriView::NewGate()");
  // Change range of motion to match data.
  this.min_z = gGeo.Z_of_Module(gGeo.FirstModule,1);
  this.max_z = 11355+8400;
  var opts = {min: this.min_z, max: this.max_z};
  this.slider_ends.slider("option",opts);
  this.slider_grip.slider("option",opts);

  if(this.z[0]<this.min_z) this.ChangeZgrip(this.min_z);
  if(this.z[1]>this.max_z) this.ChangeZgrip(this.max_z-(this.z[1]-this.z[0]));  

  this.Index();

}


MriView.prototype.Index = function()
{
  this.fData = [];
  if($(this.element).is(":hidden")) return;
  w_selector = $('#ctl-ph-field').val();

  var i,hit;
  var n = gIdHits.length;
  for(i=0;i<n;i++) {
    hit = gIdHits[i];
    this.fData.push ({
                              z:     gGeo.Z_of_Module(hit.module,1),
                              line:  gGeo.GetIdStripCoords(hit.view, hit.strip),
                              hit:   hit
                            });
  }
  
  n=gOdHits.length;
  for(i=0;i<n;i++) {
    hit = gOdHits[i];
    this.fData.push( {
                              z:     gGeo.Z_of_Module(hit.frame,1),
                              line:  gGeo.GetOdStripCoords(hit.tower,hit.story,hit.bar),                                                           
                              w:     hit[w_selector],
                              hit:   hit
                            } );
  }
    
  

  // Sort them by z.
  this.fData.sort(function(a,b) { return a.z - b.z; });
  this.Select();
  
  this.fMinosStrips = [];
  if($(this.element).is(":hidden")) return;
  w_selector = $('#ctl-ph-field').val();
  var m = gMinosStrips.length;
  for (i=0;i<m;i++) {
      hit = gMinosStrips[i];
      this.fMinosStrips.push({
      z:         gGeo.Z_of_Plane(hit.plane),
      line:      gGeo.GetStripEndCoordinates(hit.plane,hit.view,hit.strip),
      hit:      hit,
      w:        hit.ph,
      slice:    hit.slice
      });
  }
  this.fMinosStrips.sort(function(a,b) { return a.z - b.z; });
  this.Select();
  
  //find coordinates for tracks in xml doc.
  this.fTracks = [];
  for(var i=0;i<gTracks.length;i++) {
    var trk = gTracks[i];
    var elem = {track: trk, nodes: []}
    var nodes = trk.nodes;
    for(var inode=0;inode<nodes.length;inode++){
        var node = nodes[inode];
        elem.nodes.push({
          x: node.x,
          y: node.y,
          z: node.z
        });
    };
    this.fTracks.push(elem);
  };
  
  
} 


MriView.prototype.Select = function()
{
  if(!gRecord) return;
  var w_selector = $('#ctl-ph-field').val();
  
  this.fSelectedMinosStrips=[];
  var n = this.fMinosStrips.length;
  for(var i=0;i<n;i++) {
    var e=this.fMinosStrips[i];    
    if(e.z < this.z[0]) continue; // Not yet deep enough
    if(e.z > this.z[1]) break; // We've gone too far
    // Ok, this is in our draw range. 
    // Does it satisfy cuts?
    if( (gCurrentSlice < 0) ||
        (e.slice == gCurrentSlice) ) {
          this.fSelectedMinosStrips.push(e);
        }
  }
  
  this.fSelectedMinosTracks=[];
  for(var i=0;i<gMinosTracks.length;i++) {
     var elem = gMinosTracks[i];
     if( (gCurrentSlice < 0) ||
         (elem.slice == gCurrentSlice) ) {
           this.fSelectedMinosTracks.push(elem);
    }
  }
  
  
  this.fSelectedData=[];
  HitSatisfiesCutSetup();    
  var n = this.fData.length;
  for(var i=0;i<n;i++) {
    var e=this.fData[i];
    if(e.z < this.z[0]) continue; // Not yet deep enough
    if(e.z > this.z[1]) break; // We've gone too far
    // Ok, this is in our draw range. 
    // Does it satisfy cuts?
    if(HitSatisfiesCut(e.hit))  {
      e.w = e.hit[w_selector];
      this.fSelectedData.push(e); // Yes, push it.
    }
  }  
  
  var track_mask = 0;
    switch( $("input[name='hitmap-track-radio']:checked").val() ) {
              case "flagged":  track_mask = 16; break;
              case "anchor":   track_mask = 1; break;
              case "primary-anchored":  track_mask = 2; break;
              case "secondary-anchored":track_mask = 4; break;
            }
  
  
        this.fSelectedTracks = [];
  
        for(var i=0;i<this.fTracks.length;i++) {
           var elem = this.fTracks[i];
           if( (gCurrentSlice < 0) ||
               (elem.track.slice == gCurrentSlice) ) {
                     if(gSuppressTracks && gSuppressTracks[ elem.track.index ] ==1) {
                   continue;
                 }
                 if(track_mask>0) {
                    var trk_bits = 0;
                    if(elem.track.flag>0) trk_bits += 16;
                    var usedFor=elem.track.usedFor;
                    if(usedFor>0) trk_bits += usedFor;
                    // console.log(elem.track,track_mask,trk_bits);
                    if((trk_bits & track_mask) == 0) continue;
                  }

                 // if(gShowFlaggedTracksOnly && parseInt($("flag",elem.track).text())<=0) continue;
                 this.fSelectedTracks.push(elem);
          }
        }
  
  
  this.Draw();
} 




MriView.prototype.DrawLine = function(c)
{
  this.ctx.beginPath();
  this.ctx.moveTo(this.GetX(c.x1),this.GetY(c.y1));
  this.ctx.lineTo(this.GetX(c.x2),this.GetY(c.y2));
  this.ctx.stroke();
}

MriView.prototype.AddLine = function(x1,y1,x2,y2)
{
  this.ctx.beginPath();
  this.ctx.moveTo(this.GetX(x1*10),this.GetY(y1*10));
  this.ctx.lineTo(this.GetX(x2*10),this.GetY(y2*10));
  this.ctx.stroke();
}


MriView.prototype.DrawArrow = function(label)
{
  this.ctx.beginPath();
  this.ctx.moveTo(0,0);
  this.ctx.lineTo(50,0);
  this.ctx.moveTo(50,0);
  this.ctx.lineTo(40,5);
  this.ctx.moveTo(50,0);
  this.ctx.lineTo(40,-5);
  this.ctx.stroke();
  if(label) {
    this.ctx.font = "12px sans-serif";
    this.ctx.textAlign = 'left';
    this.ctx.textBaseline = 'middle';
    this.ctx.fillText(label,52,0);
  }
}

MriView.prototype.DrawFrame = function()
{
    Pad.prototype.DrawFrame.call(this); // Draw standard Pad axes, if desired.
  
  //draw MINERvA frame
  if (this.z[0]<=10055.42) {
      // Draw outline.
      this.ctx.strokeStyle = "rgba(0,0,0,1)";
      this.DrawLine(gGeo.GetIdStripCoords(1,0  ));
      this.DrawLine(gGeo.GetIdStripCoords(1,128));
      this.DrawLine(gGeo.GetIdStripCoords(2,0  ));
      this.DrawLine(gGeo.GetIdStripCoords(2,128));
      this.DrawLine(gGeo.GetIdStripCoords(3,0  ));
      this.DrawLine(gGeo.GetIdStripCoords(3,128));  
  
  
      // Draw coordinate system.
      this.ctx.save();
        this.ctx.translate(this.GetX(1500),this.GetY(1500));
        this.DrawArrow("X");
  
        this.ctx.save();
          this.ctx.rotate(ksixty_degrees);
          this.DrawArrow("U");
        this.ctx.restore();
        this.ctx.save();
          this.ctx.rotate(-ksixty_degrees);
          this.DrawArrow("V");
        this.ctx.restore();
      this.ctx.restore();

      // Draw tower labels.
      this.ctx.font = "12px sans-serif";
      this.ctx.textAlign = 'center';
      this.ctx.textBaseline = 'bottom';

      this.ctx.save();
      this.ctx.translate(this.GetX(0),this.GetY(0)); // rotate about center of detector
      for(var tower=1;tower<=6;tower++){
        this.ctx.save();
        switch(tower) {
          case 1:  rot = 4;  break;
          case 2:  rot = 3;  break;
          case 3:  rot = 2;  break;
          case 4:  rot = 1;  break;
          case 5:  rot = 0;  break;
          case 6:  rot = 5;  break;
        }
 
        this.ctx.rotate(-ksixty_degrees*(rot)); 
        this.ctx.translate(1570*this.span_x/(this.max_u-this.min_u),0); // Go to outside of tower 2

        if(rot>3) {
          // flip label for towers on bottom
          this.ctx.rotate(4.712389); // 90 degrees to put label correct.
          this.ctx.textBaseline = 'top';
        } else {
          this.ctx.rotate(1.570796); // 90 degrees to put label correct.
          this.ctx.textBaseline = 'bottom';
        }    
        this.ctx.fillText("Tower "+tower,0,0);
        this.ctx.restore();
      }
      this.ctx.restore()
  }
    
  
  
  //draw MINOS frame
  if (this.z[1]>=11355){
    // Draw outline.
    
      for(var i=0; i< gNdOutlineSteel.length-1; i++) {
        var x  = gNdOutlineSteel[i].x;
        var y  = gNdOutlineSteel[i].y;
        var x2 = gNdOutlineSteel[i+1].x;
        var y2 = gNdOutlineSteel[i+1].y;
      
        this.ctx.save();
        this.ctx.lineWidth = 1.5;
        this.ctx.beginPath();
        this.ctx.moveTo(this.GetX( x*1000/39 + 450+kmmMinos_xshift),this.GetY( y*1000/39+kmmMinos_yshift)); // inches to m /39.37
        this.ctx.lineTo(this.GetX(x2*1000/39 + 450+kmmMinos_xshift),this.GetY(y2*1000/39+kmmMinos_yshift)); // inches to m
        this.ctx.stroke();
        this.ctx.restore();
        };
      for(var i=0; i< gNdPartialActive.length-1; i++) {
        var x  = gNdPartialActive[i].x;
        var y  = gNdPartialActive[i].y;
        var x2 = gNdPartialActive[i+1].x;
        var y2 = gNdPartialActive[i+1].y;
    
        this.ctx.save();
        this.ctx.lineWidth = 1;
        this.ctx.beginPath();
        this.ctx.moveTo(this.GetX(x*10  + 200+kmmMinos_xshift),this.GetY(y*10+kmmMinos_yshift)); // cm to m
        this.ctx.lineTo(this.GetX(x2*10 + 200+kmmMinos_xshift),this.GetY(y2*10+kmmMinos_yshift)); //cm to m
        this.ctx.stroke();
        this.ctx.restore();
        };
    for(var i=0; i< gNdFullActive.length-1; i++) {
      var x  = gNdFullActive[i].x;
      var y  = gNdFullActive[i].y;
      var x2 = gNdFullActive[i+1].x;
      var y2 = gNdFullActive[i+1].y;
  
      this.ctx.save();
      this.ctx.lineWidth = 1;
      this.ctx.beginPath();
      this.ctx.moveTo(this.GetX(x*10  + 450+kmmMinos_xshift),this.GetY(y*10+kmmMinos_yshift)); // cm to m
      this.ctx.lineTo(this.GetX(x2*10 + 450+kmmMinos_xshift),this.GetY(y2*10+kmmMinos_yshift)); //cm to m
      this.ctx.stroke();
      this.ctx.restore();
        };
    
    this.ctx.restore();
    // Draw coordinate system.
    this.ctx.save();
      this.ctx.translate(this.GetX(1500),this.GetY(-2000));  
      this.ctx.save();
        this.ctx.rotate(k45_degrees);
        this.DrawArrow("U");
      this.ctx.restore();
      this.ctx.save();
        this.ctx.rotate(-k45_degrees);
        this.DrawArrow("V");
      this.ctx.restore();
    this.ctx.restore();
  }
}

MriView.prototype.DrawOne = function()
{
  this.Clear();
  this.DrawFrame();
  if (!this.ctx) return;

  
  //   
  //   var rot = -((tower+2)%6); // number of clockwise 60 degree rotations needed from y.
  // }
  
  if ($('#ctl-show-hitmap-hits').is(':checked')) {
    var colorScaler  = new ColorScaler();
    colorScaler.min = 0;
    colorScaler.max = 100*10;
    var nhover = gHoverHits.length;
    var nsel   = gSelectedHits.length;
    var i,d,c;
    for(i=0;i<this.fSelectedMinosStrips.length;i++) {
        d = this.fSelectedMinosStrips[i];
        var c =  colorScaler.GetColor(d.w);
        for(ih=0;ih<nhover;ih++){
          if(gHoverHits[ih]===d.hit) c = this.colorScaler.GetSelectedColor();
        }        
        for(ih=0;ih<nsel;ih++){
          if(gSelectedHits[ih]===d.hit) c = this.colorScaler.GetSelectedColor();
        }        
        this.ctx.strokeStyle = "rgba(" + c + ",0.7)";
        this.DrawLine(d.line);
    }
  
    for(i=0;i<this.fSelectedData.length;i++) {
      d = this.fSelectedData[i];
      
      // testing
      // var tower = parseInt($("tower",d.hit).text());
      // if(tower!=4) continue;
    
      c = gPhColorScaler.GetColor(d.w);
      for(ih=0;ih<nhover;ih++){
        if(gHoverHits[ih]===d.hit) c = gPhColorScaler.GetSelectedColor();
      }        
      for(ih=0;ih<nsel;ih++){
        if(gSelectedHits[ih]===d.hit) c = gPhColorScaler.GetSelectedColor();
      }        
      this.ctx.strokeStyle = "rgba(" + c + ",0.7)";
      this.DrawLine(d.line);
    }
  }
  
  //draw tracks
  if ($('#ctl-show-hitmap-tracks').is(':checked')) {
    this.ctx.save();
    this.ctx.lineCap = 'round';
    for(var i=0;i<this.fSelectedTracks.length;i++){
      var elem = this.fSelectedTracks[i];
      var lastx, lasty;
      var x, y;
      for (var inode=0;inode<elem.nodes.length;inode++){
        var node = elem.nodes[inode];
            //console.warn(node.z,this.z[0],this.z[1],node,elem);
        // if(node.z > this.z[0]) continue; // Not yet deep enough
        //           if(node.z < this.z[1]) break; // We've gone too far
                 
        x = this.GetX(node.x);
        y = this.GetY(node.y);

          if((inode>0)&&(node.z>=this.z[0])&&(node.z<=this.z[1])) {        
           GeoUtils.draw_highlighted_line(
             this.ctx,
             lastx,lasty,
             x,y,2,
             "rgba(0,150,0,0.9)", // default style
             "rgba(250,0,0,0.9)", //highlight style
             "rgba(0,0,0,0)", //outline style
             ShouldIHighlightThisTrack(elem.track), // do_highight
             (elem.track == gSelectedTrack) // do_outline
          );
        }
      
        lastx = x;
        lasty = y;
      }
    }
    this.ctx.restore();
  
    //draw MINOS tracks
    this.ctx.save();
    this.ctx.lineCap = 'round';
    for(var i=0;i<this.fSelectedMinosTracks.length;i++){
      var elem = this.fSelectedMinosTracks[i];
      var lastx, lasty;
      var x, y;
      for (var itrk_strip=0;itrk_strip<elem.trk_strips.length;itrk_strip++){
        var trk_strip = elem.trk_strips[itrk_strip];
            //console.warn(trk_strip.z,this.z[0],this.z[1],trk_strip,elem);
        // if(trk_strip.z > this.z[0]) continue; // Not yet deep enough
        //           if(trk_strip.z < this.z[1]) break; // We've gone too far
                 
        x = this.GetX(trk_strip.x);
        y = this.GetY(trk_strip.y);

          if((itrk_strip>0)&&(trk_strip.z>=this.z[0])&&(trk_strip.z<=this.z[1])) {        
           GeoUtils.draw_highlighted_line(
             this.ctx,
             lastx,lasty,
             x,y,2,
             "rgba(0,150,150,0.8)", // default style
             "rgba(250,0,0,0.9)", //highlight style
             "rgba(0,0,0,0)", //outline style
             ShouldIHighlightThisTrack(elem.track), // do_highight
             (elem.track == gSelectedTrack) // do_outline
          );
        }
      
        lastx = x;
        lasty = y;
      }
    }
  }
  this.ctx.restore();
  
  
  
}




MriView.prototype.Draw = function()
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


MriView.prototype.DoMouse = function(ev)
{
  if(ev.type === 'mouseout') {
    this.fMousing = false;
  } else {
    this.fMousing = true;
    var offset = getAbsolutePosition(this.canvas);
    this.fMouseX = ev.pageX - offset.x;
    this.fMouseY = ev.pageY - offset.y;    

    var hits = this.FindMousedHits();
    if(ev.type === 'click') {
      ChangeSelectedHits(hits);
    } else {
      ChangeHoverHits(hits);
    }
  }
  this.Draw();
}


MriView.prototype.FindMousedHits = function(ev) 
{
  var hits = [];
  //console.time("MriView::FindMousedHits");
  // x,y in detector coords
  var x = this.GetU(this.fMouseX);
  var y = this.GetV(this.fMouseY);
  var n = this.fSelectedData.length;
  var tol_pix = 3; // tolerance, pixels
  var tol_mm_x = tol_pix * (this.max_u - this.min_u) / this.span_x ; // mm
  var tol_mm_y = tol_pix * (this.max_v - this.min_v) / this.span_y ; // mm
  var tol_mm = tol_mm_x; // Tolerance, mm
  if(tol_mm_y > tol_mm_x) tol_mm = tol_mm_y;

  // Code to find which strip best matches the given mouse coordinates.
  // This can use distance of point-to-line, but we actually have a better way
  // of paring the problem down: look at the distance from the center to the point along
  // one of the three cardinal projections. 
  
  // Update: although clever, this doesn't work.
  // r_x = x;
  // r_u = x*kcos_60 - y*ksin_60;
  // r_v = x*kcos_60 + y*ksin_60;
  
  
  var best_dist = 1e9;
  var best_datum = null;
  var n_cand = 0;
  for(var i=0;i<n;i++) {
    var l = this.fSelectedData[i].line;
    // var r = r_x;
    // if(l.rot == -1) r = r_u;
    // if(l.rot ==  1) r = r_v;
    // //console.debug(x,y,r,l.rot,l.r,Math.abs(r-l.r),tol_mm,this.fSelectedData[i]);
    // if( Math.abs(r-l.r) > tol_mm ) continue; // This one isn't even up for discussion.
    n_cand++;
    // Now find distance from point to line.
    var ax = l.x1;
    var ay = l.y1;
    var bx = l.x2;
    var by = l.y2;
    var mx = ax-bx; // m = a-b
    var my = ay-by;
    var mDotPB = (mx*(x-bx)) + (my*(y-by));
    var m2 = mx*mx + my*my;
    var t0 = mDotPB/m2;  // t0 is projection along line, from b to a.
    var dx,dy,d2;
    if(t0<0.0) { // case: closest point is B
      dx = (x-bx);
      dy = (y-by);
      d2 = dx*dx+dy*dy;
    } 
    else if(t0>1.0) {// case: closest point is A
      dx = (x-ax);
      dy = (y-ay);
      d2 = dx*dx+dy*dy;
    } 
    else 
    { // in the middle of the line: p-(b+t0m);
      dx = x-(bx+t0*mx);
      dy = y-(by+t0*my);
      d2 = dx*dx+dy*dy;
    }
    if(d2 <= best_dist) {
      best_dist = d2;
      best_datum = this.fSelectedData[i];
    }
  }
  //console.timeEnd("MriView::FindMousedHits");
  
  //console.log("MriView selection: "+n_cand+" candidates, best dist="+best_dist+" best=",best_datum);
  if(best_datum) return [ best_datum.hit ];
  else return [];
}

MriView.prototype.autoScan = function(on)
{
  if(on) {
    var self = this;
    var inc = 100;
    this.autoRotateTimer = setInterval(function(){
      self.z[0] += inc;
      self.z[1] += inc;
      
      if(self.z[0]> self.max_z) {
        var d= self.z[1]-self.z[0];
        self.z[0] = self.min_z;
        self.z[1] = self.min_z + d;
      }
      // Change the grip slider
      self.slider_grip.slider('value',self.z[0]);      
      // Change the endpoint slider.
      self.slider_ends.slider('values',0,self.z[0]);
      self.slider_ends.slider('values',1,self.z[1]);
      self.ChangeZ();
    },

    100 // ms
    )
  }
  if(!on) clearInterval(this.autoRotateTimer);  
} 
