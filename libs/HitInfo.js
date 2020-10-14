//
// Code for the Arachne Event Display
// Author: Nathaniel Tagg ntagg@otterbein.edu
// 
// Licence: this code is free for non-commertial use. Note other licences may apply to 3rd-party code.
// Any use of this code must include attribution to Nathaniel Tagg at Otterbein University, but otherwise 
// you're free to modify and use it as you like.
//

///
/// For representing specific hit data.
///

function HitInfo(element, options)
{
  // console.log('HitInfo ctor');

  if(!element){ 
    // console.log()
    return;
  }
  if($(element).length<1) { 
    // console.log()
    return;
  }

  this.element = element;

  var settings = {
    // Put defaults here.
  };
  $.extend(true,settings,options); // Change defaults
  var self=this;
  gStateMachine.Bind("hoverHitChange",function(){self.Draw();});
}

HitInfo.prototype.Draw = function()
{
  if($(this.element).is(":hidden")) return;
  var i;
  var txt = "";
  
  if(gHoverCluster) {
    txt+="<b>Cluster</b><br/>";
    txt+="<table class='stripeytable'>";
    for(var att in gHoverCluster) {
      txt += "<tr><td>" + att + ":</td><td>" + gHoverCluster[att] +  "</td></tr>";
    };
    txt+="</table>";
    
  }
  
  
  for(i=0;i<gHoverHits.length;i++){
    txt += "<table><tr><td>";
    var hit = gHoverHits[i];
    if(i>0) txt+="<hr/>"
    
    txt+="<b>Hit</b><br/>";
    txt+="<table class='stripeytable'>";
    // Obsolete - I've moved all the data to attributes
    // $("*",hit).each(function(){
    //   if($("*",this).length>0) return;
    //   txt +=this.nodeName + ":"
    //       + $(this).text() + "<br/>";
    // });
    for(var att in hit) {
      txt += "<tr><td>" + att + ":</td><td>" + hit[att] +  "</td></tr>";
    };
    
    // Find associated track.
    var trk = gHitToTrack[hit.index];
    if(trk) {
      txt+= "<tr><td>On Track</td><td>" + 
      trk.index
          +"</td></tr>";
    }
    
    txt += ""
    var id = hit.channel_id;
    var chan = ParseChannelId(id);
    txt+="<tr><td><b>Channel:</b></td><td>" + "0x" + id.toString(16) + "</td></tr>";
    txt+="<tr><td>Hit:   </td><td>"  + chan.hit   + "</td></tr>";
    txt+="<tr><td>Pixel: </td><td>"  + chan.pixel + "</td></tr>";
    txt+="<tr><td>Board: </td><td>"  + chan.board + "</td></tr>";
    txt+="<tr><td>Chain: </td><td>"  + chan.chain + "</td></tr>";
    txt+="<tr><td>Croc:  </td><td>"  + chan.croc  + "</td></tr>";
    txt+="<tr><td>Crate: </td><td>"  + chan.crate + "</td></tr>";
    txt+="<tr><td>Link:  </td><td>"  + chan.link  + "</td></tr>";
    
    txt += "</table>";
    txt += "</td><td>";
    
    txt += "</td></tr></table>";
    
  }
  

  this.element.html(txt);
  $('table.stripeytable tr:even').addClass('rowstripe');
}

