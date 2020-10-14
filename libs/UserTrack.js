//
// Code for the Arachne Event Display
// Author: Nathaniel Tagg ntagg@otterbein.edu
// 
// Licence: this code is free for non-commertial use. Note other licences may apply to 3rd-party code.
// Any use of this code must include attribution to Nathaniel Tagg at Otterbein University, but otherwise 
// you're free to modify and use it as you like.
//

gHoverUserTrack = null;
gUserTrack = {
  points: [{index:0,x:0,y:0,z:4600}, 
           {index:1,x:0,y:0,z:5500}]
};

$(function(){
  $('#ctl-show-usertrack').click(function(){gStateMachine.Trigger("selectedHitChange")});
  $('#ctl-usertrack-snap-to-vertex').click(SnapUserTrackToVertex);
});


function SnapUserTrackToVertex()
{
  if(!gVertices) return;

  var verts = [];
  for(var ivtx=0;ivtx<gVertices.length;ivtx++) {
    var elem = gVertices[ivtx];
    // Is the vertex in the current slice? 
    if(gCurrentSlice>=0 && elem.slice) {
      if(elem.slice != gCurrentSlice) continue; // We have a valid slice and it's not this one. Give up.
    } 
    verts.push(elem);
  }
  console.error("found potential vertices:",verts);
  
  if(verts.length<1) return;
  
  // Find the best one: sort by type and then by z.
  verts.sort(function(a,b){
    if(a.type!=b.type) return a.type-b.type;
    return a.z-b.z;
  });
  
  var vert=verts[0];
  gUserTrack.points[0].x = vert.x;
  gUserTrack.points[0].y = vert.y;
  gUserTrack.points[0].z = vert.z;
  gStateMachine.Trigger("selectedHitChange");
}

function AdjustUserTrack(index,view,strip,z)
{
  // Easy: move Z position.
  gUserTrack.points[index].z = z;
  // harder:
  var newXY = gGeo.AdjustXY(gUserTrack.points[index].x,gUserTrack.points[index].y,view,strip);
  gUserTrack.points[index].x = newXY.x;
  gUserTrack.points[index].y = newXY.y;
  gStateMachine.Trigger("selectedHitChange");
  
  // Make a copy, sort it in Z, then loop.
  var points = gUserTrack.points.slice();
  points.sort(function(a,b){return a.z-b.z});
    
  // Update trackinfo
  var lastx = points[0].x;
  var lasty = points[0].y;
  var lastz = points[0].z;
  var last_module = gGeo.Module_of_Z(lastz);
  var range = 0;
  var mass_scint = 0;
  var mass_pb = 0;
  var mass_fe = 0;

  for(var i=1;i<points.length;i++) {
    var x = points[i].x;
    var y = points[i].y;
    var z = points[i].z;
  
    var dx = x-lastx;
    var dy = y-lasty;
    var dz = z-lastz;
    var dr = Math.sqrt(dx*dx + dy*dy + dz*dz);

    range += dr;
    var module = gGeo.Module_of_Z(z);
    
    var depth = (module-last_module)*dr/dz;// Pathlength corrected by 1/cos(theta)
    
    var dscint = depth;
    
    var start_pb = Math.max(86, last_module);
    var end_pb   = Math.min(94, module);
    var npb = 0;
    if(end_pb -start_pb > 0) npb = end_pb - start_pb;
    var dpb = npb*dr/dz; // pathlength
    
    var start_fe = Math.max(95, last_module);
    var end_fe   = Math.min(130, module);
    var nfe = 0;
    if(end_fe -start_fe > 0) nfe = end_fe - start_fe;
    var dfe = nfe*dr/dz; // pathlength
    
    mass_scint += dscint*2*1.7*1.0; // 2 layers of1.7 cm of plastic.
    mass_pb    += dpb*0.2*11.34;// 0.2 cm at 11.34 g/cm3
    mass_fe    += dfe*2.54 *8.0; // Guess at steel density = 8
    
  
    lastx = x;
    lasty = y;
    lastz = z;
    last_module = module;
  }
  
  var h = "";
  h += "Length: " + range.toFixed(2) + " cm<br/>";
  h += "Range:  " + (mass_scint+mass_pb+mass_fe).toFixed(2) + " g/cm2<br/>";
  h += "Range (scintillator):  " + mass_scint.toFixed(2)+ " g/cm2<br/>";
  h += "Range (lead):  " + mass_pb.toFixed(2)+ " g/cm2<br/>";
  h += "Range (iron):  " + mass_fe.toFixed(2)+ " g/cm2<br/>";
  
  $('#usertrack-info').html(h);
}


