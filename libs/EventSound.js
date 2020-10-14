//
// Code for the Arachne Event Display
// Author: Nathaniel Tagg ntagg@otterbein.edu
// 
// Licence: this code is free for non-commertial use. Note other licences may apply to 3rd-party code.
// Any use of this code must include attribution to Nathaniel Tagg at Otterbein University, but otherwise 
// you're free to modify and use it as you like.
//

soundManager.url = 'js/';
gSoundNumber=0;

function EventSound( element, options ){
  // console.log('EventSound ctor',element);
  if(!element) {
    // console.log("EventSound: NULL element supplied.");
    return;
  }
  if($(element).length<1) { 
    // console.log("EventSound: Zero-length jquery selector provided."); 
    return;
  }
  this.element = element;   
  
  var settings = {
  }
  $.extend(true,settings,options);  // Change default settings by provided qualities.
  // Merge in options from element
  var element_settings = $(element).attr('settings');
  var element_settings_obj={};
  if(element_settings) {
    eval( "var element_settings_obj = { " + element_settings + '};');; // override from 'settings' attribute of html object.
    console.log(element_settings, element_settings_obj);
    $.extend(true,this,element_settings_obj); // Change default settings by provided overrides.
  
  }

  // Data model state.
  gStateMachine.BindObj('gateChange',this,"Clear");

  this.curSound = null;
  this.state = "ready";
  
  // Button styling.
  var self = this;
  $(element).button({icons: {primary: 'ui-icon-play'}})            
            .click(function(){self.ElemClicked(); return false;});

  // $(element).after("<div></div>");
  // this.progressbar = $(element).next('div');

  // $(this.progressbar).progressbar({value:0});
}

EventSound.prototype.Clear = function ()
{
  // console.log("EventSound::Clear");
  // Kill any existing sound
  if(this.curSound) {
    this.curSound.destruct();
    this.curSound = null;
  }
  this.state = "ready";
  $(this.element).button('option', {
       icons: { primary: 'ui-icon-play'}
   });
  hc_time.SetMarker(null);
  $(this.element).attr("href","#");
}


EventSound.prototype.Rebuild = function ()
{
  console.log("EventSound.Rebuild()");
  // FIXME: need to create this data.
  // var data = "dur=10&vtx=1,1,1,0.5&trk=1,1,1,0.5,4,200,-100,1000&trk=1,1,1,0.5,2,-800,0,2000"
  
  var start = 1;
  var dur   = 12;
  var samples = 120;
  
  var data = "dur="+dur  // duration 12 seconds
           + "&listener=0,0,7.0"// xyz position of listener
           + "&soundspeed=15" // m/s, for finding doppler shift and phase delays
           ; 
  var tracks = $("trk",xmlDoc);
  for(var itrk=0;itrk<tracks.length;itrk++) {
    // Is the track in the current slice? 
    if(gCurrentSlice>=0) {
      if(tracks[itrk].slice != gCurrentSlice) continue;
    }

    var r = GetTrackInfo(tracks[itrk]);
    console.log("EventSound - tracking",r);
    var vtx = "&vtx" + itrk + "="
         + (r.firstx/1000).toFixed(2) + ","
         + (r.firsty/1000).toFixed(2) + ","
         + (r.firstz/1000).toFixed(2) + ","
         + (r.firstt/1000 - start).toFixed(4); // 1 sec per us, starting at t=1000-ns
    console.log(vtx);
    data += vtx;
    var trk = "&trk" + itrk + "="
          + (r.firstx/1000).toFixed(2) + ","
          + (r.firsty/1000).toFixed(2) + ","
          + (r.firstz/1000).toFixed(2) + ","
          + (r.firstt/1000 -1).toFixed(4) + "," // time
          + (r.lastx/1000).toFixed(2) + ","
          + (r.lasty/1000).toFixed(2) + ","
          + (r.lastz/1000).toFixed(2) + ","
          + (r.range/9000).toFixed(4) + "," // duration in seconds
          + (r.p_minosmu/5+100).toFixed(1) + "," // Frequency in hz
          + 5.0;              // amplitude
    data += trk;
    console.log(trk);
    
  }

  // create white sound envelope.
  var hist = [];
  for(var i=0;i<samples;i++) hist[i]=0;

  var n = gIdHits.length;
  var max = 0;
  for (var j = 0; j < n; j++) {
      var hit = gIdHits[j];
      var w= parseFloat(hit.getAttribute('pe'));
      var t = Math.round( (parseFloat(hit.getAttribute('time'))/1000 - start)*samples/dur );
      if(t>0 && t<samples) {
        // console.log(t,w,hist[t]);
        hist[t] += w;
        if(hist[t]>max) max = hist[t];
      }
  }
  for(var i=0;i<120;i++) { hist[i] /= max; hist[i] = hist[i].toFixed(3); }
  
  
  data+="&noise="+hist.join(',');
  console.log("data",data);
  
  
  $(this.element).attr("href","sound/sound.cgi?"+data);  
}

EventSound.prototype.ElemClicked = function ()
{
  if( $(this.element).attr("href")=="#" ) {
    this.Rebuild();
  }
  
  if(this.state == "ready") {
    // Do we have a sound?
    if(this.curSound === null) {
      // Create the sound.
      var id = "sound-id-" + gSoundNumber++;
      var url = $(this.element).attr("href");
      this.curSound =  soundManager.createSound({id:id, url:url});
    }

    this.state = "playing";
    var self = this;
    console.log(this.curSound);
    this.curSound.whileplaying = function(){self.UpdateSoundPosition();}
    this.curSound.play({onfinish:function(){self.FinshedPlaying()},
                        whileplaying:function(){self.UpdateSoundPosition();}
    });
    
    // Change icon to 'pause'
    $(this.element).button('option', {
        icons: { primary: 'ui-icon-pause'}
    });
    
    return false; // eat the click
  }
  
  if(this.state == "playing") {
    this.state = "paused";
    this.curSound.pause();
    $(this.element).button('option', {
        icons: { primary: 'ui-icon-play'}
    });
    return false;
  }
  
  if(this.state == "paused") {
    this.state = "playing";
    this.curSound.resume();
    $(this.element).button('option', {
        icons: { primary: 'ui-icon-pause'}
    });
    return false;
  }
}

EventSound.prototype.FinshedPlaying = function ()
{
  this.state = "ready";
  $(this.element).button('option', {
       icons: { primary: 'ui-icon-play'}
   });
   hc_time.SetMarker(null);
   // $(this.progressbar).progressbar("value",0);
  
}

EventSound.prototype.UpdateSoundPosition = function ()
{
  // console.log("progress:",this.curSound.position,this.curSound.durationEstimate)
  // $(this.progressbar).progressbar("value",100*this.curSound.position/this.curSound.durationEstimate);
  hc_time.SetMarker(this.curSound.position+1000);
}

$(function(){
  new EventSound($(".soundlink"));  
});