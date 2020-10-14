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
PhHistCanvas.prototype = new HistCanvas;           
PhHistCanvas.prototype.constructor = PhHistCanvas;

function PhHistCanvas( )
{
  // console.log('PhHistCanvas ctor');
  var settings =  {xlabel: $('#ctl-ph-field option:selected').text()
                  ,ylabel: 'Hits'
                  ,margin_left: 45                  
                  ,min_u: 0
                  ,max_u: 10
                  ,log_y: true
                  ,hmax: 300
                  };
  HistCanvas.call(this, $('#phhist-div'), settings); // Give settings to Pad contructor.
  this.SetRanges();
  gStateMachine.BindObj('gateChange',this,"ReBuild");
  gStateMachine.BindObj('sliceChange',this,"ReBuild");
  gStateMachine.BindObj('timeCutChange',this,"ReBuild");
  gStateMachine.BindObj('phColorChange',this,"Draw");
  
  var self = this;
  
  // One push-o buttons for Rik:
  function changephrange(field,min,max) {
    console.warn("changephrange",field,min,max);
    if( $('#ctl-ph-field').val() !== field ) {
     $("#ctl-ph-field").val(field);
     $("#ctl-ph-field").trigger("change");
    }
    if(max===null) {
      max = self.fHists[0].max;
    }
    self.ChangeRange(min,max);
    self.FinishRangeChange();
  }
  $('#one-push-o').buttonset()
  $('#ctl-all-pe')  .click(function(){ changephrange("pe",0,null);  });
  $('#ctl-all-mev') .click(function(){ changephrange("norm_energy",0,null);  });
  $('#ctl-2pe')  .click(function(){ changephrange("pe",2,30);  });
  $('#ctl-3pe')  .click(function(){ changephrange("pe",3,30);  });
  $('#ctl-5pe')  .click(function(){ changephrange("pe",5,30);  });
  $('#ctl-30pe') .click(function(){ changephrange("pe",0,30); });
  $('#ctl-100pe').click(function(){ changephrange("pe",2,100); });
  $('#ctl-10MeV').click(function(){ changephrange("norm_energy",0.5,10); });
  $('#ctl-20MeV').click(function(){ changephrange("norm_energy",0.5,20); });
  $('#ctl-30MeV').click(function(){ changephrange("norm_energy",0.5,50); });

  
}

PhHistCanvas.prototype.ResetDefaultRange = function()
{
  this.ChangeRange(0,10);
  this.FinishRangeChange();
}


PhHistCanvas.prototype.SetRanges = function()
{
  var field = $('#ctl-ph-field').val(); // Typically 'pe'
  this.xlabel = 'Hit Energy (' + $('#ctl-ph-field option:selected').text() + ')'; // Typically 'pe'

  this.hbinwidth = 1;
  switch(field) {
    case 'qlo':  this.hbinwidth=10; this.max_u=200; break;
    case 'qmed': this.hbinwidth=40; this.max_u=800; break;
    case 'qhigh':  this.hbinwidth=100; this.max_u=2000; break;
    case 'norm_energy':  this.hbinwidth=0.5; this.max_u=10;  break;
    case 'time':  this.hbinwidth=2; this.max_u=16000; break;
    case 'slice':  this.hbinwidth=1; this.max_u=8; break;
    default:
      this.hbinwidth=1;
      this.max_u=10;
  }
}

PhHistCanvas.prototype.ChangeField = function()
{
  this.SetRanges();
  this.ReBuild();
  this.ChangeRange(this.min_u,this.max_u);
  this.FinishRangeChange();
}

PhHistCanvas.prototype.ReBuild = function()
{
  // console.debug("PhHistCanvas::ReBuild()");
  
  var field = $('#ctl-ph-field').val(); // Typically 'pe'

  gPhCut = {min:null,max:null}; // We're the ones that decide this.
  var hph = new Histogram(1, 0, this.hbinwidth); 
  
  
  HitSatisfiesCutSetup();    
  if($('#ctl-ph-includeID').is(':checked')) {
    var n = gIdHits.length;
    for (var j = 0; j < n; j++) {
        var hit = gIdHits[j];
        var ph = hit[field];
        if(HitSatisfiesCut(hit)) hph.ExpandFill(ph);
    }
  }
  if($('#ctl-ph-includeOD').is(':checked')) {
    var n = gOdHits.length;    
    for (var j = 0; j < n; j++) {
        var hit = gOdHits[j];
        var ph = hit.getAttribute(field);
        if(HitSatisfiesCut(hit)) hph.ExpandFill(ph);
    }
  }
  
  this.SetHist(hph,gPhColorScaler);
  this.Draw();
}

PhHistCanvas.prototype.ChangeRange = function( minu,maxu, calltype)
{
  if(calltype == "mouse") $('#one-push-o input:radio').each(function(){this.checked=false;}).button("refresh");
  // if(maxu>this.fHists[0].max) maxu = this.fHists[0].max;
  // if(minu<this.fHists[0].min) minu = this.fHists[0].min;
  gPhColorScaler.min = minu;
  gPhColorScaler.max = maxu;  
  HistCanvas.prototype.ChangeRange.call(this,minu,maxu);
  $('#cutinfo-pe-range').text(minu.toPrecision(2)+":"+maxu.toPrecision(2));
}

PhHistCanvas.prototype.FinishRangeChange = function()
{
  // console.debug("PhHistCanvas::FinishRangeChange");
  var min = gPhCut.min;
  var max = gPhCut.max;
  if($('#ctl-cut-phunder').is(':checked')) {
    gPhCut.min = this.min_u;
  } else {
    gPhCut.min = null;
  }
  if($('#ctl-cut-phover').is(':checked')) {
    gPhCut.max = this.max_u;
  } else {
    gPhCut.max =  null;
  }
  $('#cutinfo-ph-range').text(this.min_u.toPrecision(2)+":"+this.max_u.toPrecision(2));
  // if((min!==gPhCut.min) || (max!== gPhCut.max)) gStateMachine.Trigger('phCutChange');
  
  gStateMachine.Trigger('phCutChange')
}
