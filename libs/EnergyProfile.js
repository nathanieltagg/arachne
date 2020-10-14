//
// Code for the Arachne Event Display
// Author: Nathaniel Tagg ntagg@otterbein.edu
// 
// Licence: this code is free for non-commertial use. Note other licences may apply to 3rd-party code.
// Any use of this code must include attribution to Nathaniel Tagg at Otterbein University, but otherwise 
// you're free to modify and use it as you like.
//

///
/// HistCanvas for drawing the Pulse height scale.
///

// Subclass of Pad.
EnergyProfile.prototype = new HistCanvas;           
EnergyProfile.prototype.constructor = EnergyProfile;

function EnergyProfile( )
{
  // console.log('EnergyProfile ctor');
  var settings =  {xlabel: "Module"
                  ,ylabel: 'Cluster Energy (MeV)'
                  ,margin_left: 45                  
                  ,min_u: 0
                  ,max_u: 10
                  ,log_y: false
                  ,label_font: '12px sans-serif'
                  };
  HistCanvas.call(this, $('#energy-profile-div'), settings); // Give settings to Pad contructor.
  this.ResetDefaultRange();
  gStateMachine.BindObj('gateChange',this,"ReBuild");
  gStateMachine.BindObj('sliceChange',this,"ReBuild");
  gStateMachine.BindObj('timeCutChange',this,"ReBuild");  
  gStateMachine.BindObj("selectedHitChange",this,"ReBuild"); 
  gStateMachine.BindObj('phColorChange',this,"Draw");
  
}

EnergyProfile.prototype.ResetDefaultRange = function()
{
  this.ChangeRange(gGeo.FirstModule,gGeo.LastModule+1);
  this.FinishRangeChange();
}

EnergyProfile.prototype.ReBuild = function()
{
  // console.debug("EnergyProfile::ReBuild()");
  
  var field = $('#ctl-ph-field').val(); // Typically 'pe'

  // First, find what object is selected.
  var drawvtx = false;
  var drawtrack = false;
  var drawblob = false;
  var slice = -1;
  if(gSelectedVertex) {
    drawvtx = true;
  } else if(gSelectedTrack) {
    drawtrack = true;    
    // but, only draw if slice matches.
    slice = gSelectedTrack.slice;
    if(gCurrentSlice>=0 && gCurrentSlice!=slice) drawtrack = false;    
  } else if(gSelectedBlob){
    drawblob = true;
    slice = gSelectedBlob.slice;
    if(gCurrentSlice>=0 && gCurrentSlice!=slice) drawblob = false;    
  }

  this.clusters = [];
  this.minosmu_profile = null;
  if(drawvtx) {
    this.GetClustersFromVertex(gSelectedVertex);
  } else if(drawtrack){
    this.GetClustersFromTrack(gSelectedTrack);
  } else if(drawblob){
    this.GetClustersFromBlob(gSelectedBlob);
  } else if(gCurrentSlice>=0){
    this.GetClustersFromSlice();
  } else {
    this.GetAllClusters();
  }

  // histogram the clusters.
  var hist = new Histogram(gGeo.NumModules,gGeo.FirstModule,gGeo.LastModule+1); 
  var n = this.clusters.length;
  var tot = 0;
  for(var i=0;i<n;i++) {
    var clus = this.clusters[i];
    if(! clus) console.warn(i);
    var mod = clus.module;
    var e   = clus.energy;
    tot += e;
    hist.Fill(mod,e);
  }
  // console.log("Energy Profile: total ",e," from ",n," clusters, hist:",hist);
  
  var cs = new ColorScaler();
  cs.colorScale = new ColorScaleRGB(252,182,76);
  this.SetHist(hist,cs);
  
  this.Draw();
}


EnergyProfile.prototype.GetAllClusters = function()
{
  this.which_string = "Entire gate";
  this.clusters = gIdClusters;
}

EnergyProfile.prototype.GetClustersFromSlice = function()
{
  this.which_string = "Slice " + gCurrentSlice;
  var n = gIdClusters.length;
  for(var i=0;i<n;i++) {
    var c=gIdClusters[i];
    if(gCurrentSlice==c.slice) { this.clusters.push(c); }
  }
}

EnergyProfile.prototype.GetClustersFromTrack = function(track)
{
  this.which_string = "Track " + track.index;
  var clusters = gRecord.clusters;
  
  var nodes = track.nodes;
  for(var i=0;i<nodes.length;i++) {
    var clus_idx = nodes[i].cluster_index;
    var clus = gClusters_by_index[clus_idx];
    if(!clus) console.warn("Bad cluster lookup:",clus_idx,clus);
    this.clusters.push(clus)
  };
  
  var trackinfo = GetTrackInfo(track);
  
  
  if(trackinfo) {
    this.minosmu_profile = new Histogram(gGeo.NumModules,gGeo.FirstModule,gGeo.LastModule+1);
    this.stopmu_profile = new Histogram(gGeo.NumModules,gGeo.FirstModule,gGeo.LastModule+1);
    this.proton_profile = new Histogram(gGeo.NumModules,gGeo.FirstModule,gGeo.LastModule+1);
    for(var i=0;i<trackinfo.track_history.length; i++) {
      var histon = trackinfo.track_history[i];
      this.minosmu_profile.Fill(histon.module,histon.step_minosmu.dE[0]);
      this.stopmu_profile.Fill(histon.module,histon.step_stopmu.dE[0]);
      this.proton_profile.Fill(histon.module,histon.step_proton.dE[0]);
    }
  }
  
}


EnergyProfile.prototype.GetClustersFromBlob = function(blob)
{
 
  
}

EnergyProfile.prototype.GetClustersFromVertex = function(vtx)
{
  
}


EnergyProfile.prototype.Draw = function()
{
  if (!this.ctx) return;
  
  HistCanvas.prototype.Draw.call(this);
  this.ctx.save();
  this.ctx.fillStyle = 'black';
  this.ctx.font = '16px sans-serif';  
  this.ctx.textBaseline = 'top';
  this.ctx.textAlign = 'right';

  this.ctx.fillText(this.which_string, this.width - this.margin_right,this.margin_top);
  this.ctx.restore();
  
   this.DrawFunction(this.minosmu_profile,'blue');
   this.DrawFunction(this.stopmu_profile,'blue');
   this.DrawFunction(this.proton_profile,'red');
}

EnergyProfile.prototype.DrawFunction = function(hist,linestyle)
{
  if(!hist) return;
  this.ctx.save();
  this.ctx.strokeStyle = linestyle;
  this.ctx.beginPath();
  this.ctx.moveTo(this.origin_x,this.origin_y);
  for (var i = 0; i < hist.n; i++) {
      var t = hist.GetX(i+0.5);
      var f = hist.data[i];
      var x = Math.floor(this.GetX(t));
      var y = Math.floor(this.GetY(f));
      if(x<this.origin_x) continue;
      if(x>this.origin_x+this.span_x) continue;
      this.ctx.lineTo(x,y);
  }
  this.ctx.stroke();
  this.ctx.restore();  
}
