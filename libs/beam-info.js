//
// Code for the Arachne Event Display
// Author: Nathaniel Tagg ntagg@otterbein.edu
// 
// Licence: this code is free for non-commertial use. Note other licences may apply to 3rd-party code.
// Any use of this code must include attribution to Nathaniel Tagg at Otterbein University, but otherwise 
// you're free to modify and use it as you like.
//


function BeamInfoDisplay( element )
{
  // console.debug("BeamInfoDisplay::ctor",element);
  this.fElement = element;

  // gStateMachine.BindObj("mcChange",this,"Build");
  gStateMachine.BindObj("gateChange",this,"Build");
}


  
BeamInfoDisplay.prototype.Build = function() 
{
  // console.debug("BeamInfoDisplay::Build");
  if(!gRecord) return;
  var mtest = gRecord.mtest;
  var beam  = gRecord.beam;
  
  if(beam) {
    $(this.fElement).parents(".portlet:first").find(".portlet-header .title").text("Beam Info");
  } else if (mtest) {
    $(this.fElement).parents(".portlet:first").find(".portlet-header .title").text("Test Beam Info");
    // console.log($(this.fElement).parents(".portlet:first").find(".portlet-header"),"Test Beam Info");
  }
  
  var BeamInfotxt ="";

  if(mtest) {

    BeamInfotxt += '<table border="0" class="beam-info" >';
    for(var i in mtest) {
      // console.log(this.nodeName,$(this).text());
      BeamInfotxt += '<tr><td width="100px" class="beam-info-caption">'  
          + i 
          + '</td><td class="beam-info-el">'
          + mtest[i]
          + "</td></tr>";
    };  
    
    BeamInfotxt += '</table>';
  };

  if(beam) {
    BeamInfotxt += '<table border="0" class="beam-info" >';
    for(var i in beam) {
      //console.log(this.nodeName,$(this).text());
      BeamInfotxt += '<tr><td width="100px" class="beam-info-caption">'  
          + i 
          + '</td><td class="beam-info-el">'
          + beam[i]
          + "</td></tr>";
    };  
    
    BeamInfotxt += '</table>';

  }


  $(this.fElement).html(BeamInfotxt);

}
