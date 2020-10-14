//
// Code for the Arachne Event Display
// Author: Nathaniel Tagg ntagg@otterbein.edu
// 
// Licence: this code is free for non-commertial use. Note other licences may apply to 3rd-party code.
// Any use of this code must include attribution to Nathaniel Tagg at Otterbein University, but otherwise 
// you're free to modify and use it as you like.
//

/// TimeHist
/// HistCanvas for drawing the time scale.
///

// Subclass of Pad.
TimeHistCanvas.prototype = new HistCanvas;           
TimeHistCanvas.prototype.constructor = TimeHistCanvas;

function TimeHistCanvas( )
{
  // console.log('TimeHistCanvas ctor');
  var settings =  {xlabel: 'Time (ns)'
                  ,ylabel: 'Hits'
                  ,margin_left: 45
                  ,min_u: 0
                  ,max_u: 16100
                  ,log_y: true
				  ,adjunct_display: true
				  ,adjunct_height: 6
				  ,adjunct_label: "Veto"
                  };
  HistCanvas.call(this, $('#timehist-div'), settings); // Give settings to Pad contructor.

  gStateMachine.BindObj('gateChange',this,"ReBuild");
  gStateMachine.BindObj('sliceChange',this,"Draw");
}


TimeHistCanvas.prototype.ReBuild = function()
{
  // console.debug("TimeHistCanvas::ReBuild()");  
  
  var hAllTimes = new Histogram(900,  0, 18000);
  var htimes = new Array(gNumSlices);
  for(var s=0;s<=gNumSlices;s++) htimes[s] = new Histogram(900, 0,18000);

  // Fill the histogram.
  var n = gIdHits.length;
  for (var j = 0; j < n; j++) {
      var hit = gIdHits[j];
      //if(hit.disc_fired==0) continue;
      if(0<=hit.slice<=gNumSlices) 
        htimes[hit.slice].ExpandFill(hit.time); 
      hAllTimes.ExpandFill(hit.time);
  }
  this.min_u = hAllTimes.min;
  this.max_u = hAllTimes.max;

  this.SetHist(hAllTimes,new ColorScaleIndexed(0));

  for(var i=1;i<=gNumSlices;i++) {
      var cs = new ColorScaleIndexed(i);
      this.AddHist(htimes[i],cs);
  }
  
  // Adjuct data for the veto shield
  var n =gVetoHits.length;
  var vetodata = [];
	for (var j = 0; j<n ;j++){
	  var hit = gVetoHits[j];
    var time = hit.time;
    var wall = hit.wall;
		var c = "rgba(0,0,255,0.8)";
		if(wall>1) c = "rgba(255,0,0,0.8)";
		var d = {	
			ustart: (time),
			uend:   (time+30.0),
			wall:   wall,
			color:  c
			};
		// console.log(d);
		vetodata.push( d );
  }
    
	this.SetAdjunctData(vetodata);
  this.FinishRangeChange();
  this.Draw();
}

TimeHistCanvas.prototype.ChangeRange = function( minu,maxu )
{
  HistCanvas.prototype.ChangeRange.call(this,minu,maxu);
  $('#cutinfo-time-range').text(minu.toPrecision(2)+":"+maxu.toPrecision(2));
}


TimeHistCanvas.prototype.FinishRangeChange = function()
{
  // console.debug("TimeHistCanvas::FinishRangeChange");

  var min = gTimeCut.min;
  var max = gTimeCut.max;
  if($('#ctl-cut-timeunder').is(':checked')) {
    gTimeCut.min = this.min_u;
  } else {
    gTimeCut.min = null;
  }
  if($('#ctl-cut-timeover').is(':checked')) {
    gTimeCut.max = this.max_u;
  } else {
    gTimeCut.max =  null;
  }
  $('#cutinfo-time-range').text(this.min_u.toPrecision(2)+":"+this.max_u.toPrecision(2));
  if((min!==gTimeCut.min) || (max!== gTimeCut.max)) gStateMachine.Trigger('timeCutChange');
}


TimeHistCanvas.prototype.DrawRegions = function()
{
  if(gCurrentSlice>0) {
    var tmin = this.fHists[gCurrentSlice].min_x;
    var tmax = this.fHists[gCurrentSlice].max_x;
    this.ctx.save();
    this.ctx.fillStyle = "rgba(0,0,0,0.4)";//"rgba(0,0,0,0.03)";

    var x1 = this.GetX(tmin)-1;
    var dx = this.GetX(tmax) - x1 +2;
    var y1 = this.GetY(this.max_v);
    var dy = (this.origin_y) - y1;
    // console.log("TimeHistCanvas::DrawRegions",x1,dx,y1,dy);
    // console.log("TimeHistCanvas::DrawRegions",tmin,tmax,this.max_v);
    this.ctx.fillRect( x1, y1, dx, dy );
    this.ctx.restore();
  }
}
