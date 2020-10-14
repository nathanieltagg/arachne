//
// Code for the Arachne Event Display
// Author: Nathaniel Tagg ntagg@otterbein.edu
// 
// Licence: this code is free for non-commertial use. Note other licences may apply to 3rd-party code.
// Any use of this code must include attribution to Nathaniel Tagg at Otterbein University, but otherwise 
// you're free to modify and use it as you like.
//

///
/// For representing track data.
///

gSelectedTrack = null;
gSelectedBlob = null;
/// Some actual physics!

var m_mu = 105.; // MeV/c2
var m_p  = 938.; // MeV/c2

// Muon dEdX table:
// Bloom et all polystyrene
// KE    dE/dx scint, lead, iron
var muon_table = [
[ 10.0 , 7.802 , 3.823 , 5.494 ],
[ 14.0 , 6.084 , 3.054 , 4.321 ],
[ 20.0 , 4.749 , 2.436 , 3.399 ],
[ 30.0 , 3.683 , 1.928 , 2.654 ],
[ 40.0 , 3.144 , 1.666 , 2.274 ],
[ 80.0 , 2.359 , 1.283 , 1.717 ],
[ 100. , 2.211 , 1.215 , 1.616 ],
[ 140. , 2.058 , 1.152 , 1.516 ],
[ 200. , 1.971 , 1.124 , 1.463 ],
[ 300. , 1.937 , 1.123 , 1.451 ],
[ 318. , 1.936 , 1.131 , 1.453 ],
[ 400. , 1.943 , 1.152 , 1.467 ],
[ 800. , 2.015 , 1.238 , 1.548 ],
[ 1000       , 2.049 , 1.272 , 1.582 ],
[ 1400       , 2.103 , 1.326 , 1.637 ],
[ 2000       , 2.163 , 1.386 , 1.697 ],
[ 3000       , 2.231 , 1.456 , 1.767 ],
[ 4000       , 2.279 , 1.508 , 1.816 ],
[ 8000       , 2.391 , 1.642 , 1.936 ],
[ 10000       , 2.427 , 1.692 , 1.975 ],
[ 14000       , 2.480 , 1.776 , 2.039 ],
[ 20000       , 2.538 , 1.887 , 2.113 ],
[ 30000       , 2.608 , 2.058 , 2.214 ],
[ 40000       , 2.662 , 2.223 , 2.303 ],
[ 80000       , 2.826 , 2.877 , 2.623 ],
[ 1e999      , 2.826 , 2.877 , 2.623 ],
];


function Muon_KE( energy, masses )
{
  var r = { energy: energy, dE: [0,0,0] }; // result
  for (im=0;im<3;im++){
    // Find the best energy bin.
    var ibin = 0;
    while(r.energy>muon_table[ibin][0]) ibin++;
    // Add dedxes
    r.dE[im] = masses[im] * muon_table[ibin][im+1];
    r.energy += r.dE[im]
  }
  return r;
}

// From pstar tables
var proton_table= [
// 60 MeV is the energy required to penetrate a single layer of acrylic, so start with that number.
// Starting from smaller values hugely distorts the proton energy, since the first step is extrapolated way too far.
[ 6.000E+01,1.057E+01,5.090E+00,7.348E+00 ], 
[ 6.500E+01,9.926E+00,4.806E+00,6.920E+00 ], 
[ 7.000E+01,9.369E+00,4.558E+00,6.548E+00 ], 
[ 7.500E+01,8.882E+00,4.340E+00,6.221E+00 ], 
[ 8.000E+01,8.452E+00,4.147E+00,5.932E+00 ], 
[ 8.500E+01,8.070E+00,3.974E+00,5.673E+00 ], 
[ 9.000E+01,7.728E+00,3.819E+00,5.442E+00 ], 
[ 9.500E+01,7.420E+00,3.679E+00,5.232E+00 ], 
[ 1.000E+02,7.140E+00,3.552E+00,5.043E+00 ], 
[ 1.250E+02,6.064E+00,3.057E+00,4.306E+00 ], 
[ 1.500E+02,5.331E+00,2.714E+00,3.801E+00 ], 
[ 1.750E+02,4.800E+00,2.463E+00,3.433E+00 ], 
[ 2.000E+02,4.397E+00,2.271E+00,3.153E+00 ], 
[ 2.250E+02,4.081E+00,2.119E+00,2.932E+00 ], 
[ 2.500E+02,3.827E+00,1.996E+00,2.754E+00 ], 
[ 2.750E+02,3.618E+00,1.895E+00,2.607E+00 ], 
[ 3.000E+02,3.444E+00,1.810E+00,2.485E+00 ], 
[ 3.500E+02,3.170E+00,1.677E+00,2.291E+00 ], 
[ 4.000E+02,2.966E+00,1.577E+00,2.147E+00 ], 
[ 4.500E+02,2.808E+00,1.499E+00,2.034E+00 ], 
[ 5.000E+02,2.683E+00,1.438E+00,1.945E+00 ], 
[ 5.500E+02,2.582E+00,1.388E+00,1.874E+00 ], 
[ 6.000E+02,2.499E+00,1.348E+00,1.814E+00 ], 
[ 6.500E+02,2.430E+00,1.314E+00,1.765E+00 ], 
[ 7.000E+02,2.372E+00,1.286E+00,1.724E+00 ], 
[ 7.500E+02,2.322E+00,1.262E+00,1.689E+00 ], 
[ 8.000E+02,2.278E+00,1.242E+00,1.659E+00 ], 
[ 8.500E+02,2.240E+00,1.224E+00,1.633E+00 ], 
[ 9.000E+02,2.207E+00,1.210E+00,1.610E+00 ], 
[ 9.500E+02,2.179E+00,1.197E+00,1.591E+00 ], 
[ 1.000E+03,2.153E+00,1.186E+00,1.574E+00 ], 
[ 1.500E+03,2.010E+00,1.130E+00,1.482E+00 ], 
[ 2.000E+03,1.960E+00,1.120E+00,1.456E+00 ], 
[ 2.500E+03,1.942E+00,1.124E+00,1.452E+00 ], 
[ 3.000E+03,1.939E+00,1.135E+00,1.457E+00 ], 
[ 4.000E+03,1.951E+00,1.161E+00,1.478E+00 ], 
[ 5.000E+03,1.970E+00,1.187E+00,1.501E+00 ], 
[ 6.000E+03,1.991E+00,1.211E+00,1.524E+00 ], 
[ 7.000E+03,2.011E+00,1.233E+00,1.546E+00 ], 
[ 8.000E+03,2.031E+00,1.253E+00,1.566E+00 ], 
[ 9.000E+03,2.049E+00,1.271E+00,1.584E+00 ], 
[ 1.000E+04,2.066E+00,1.288E+00,1.601E+00 ], 
[ 1.000E+99,2.066E+00,1.288E+00,1.601E+00 ], 
];

function Proton_KE( energy, masses )
{
  var r = { energy: energy, dE: [0,0,0] }; // result
  for (im=0;im<3;im++){
    // Find the best energy bin.
    var ibin = 0;
    while(r.energy>proton_table[ibin][0]) ibin++;
    // Add dedxes
    r.dE[im] = masses[im] * proton_table[ibin][im+1];
    r.energy += r.dE[im]
  }
  return r;
}


function KE_to_p( KE, mass )
{
  // (m+KE)^2 = p^2 + m^2 in appropriate units.
  return Math.sqrt(Math.pow(mass+KE,2)-mass*mass);
}

function p_to_KE( p, mass )
{
  // (m+KE)^2 = p^2 + m^2 in appropriate units.
  return Math.sqrt(p*p+mass*mass)-mass;
}


function KE_to_speed( KE, mass )
{
  // In units of 'c'
  return Math.sqrt(1.- 1./(Math.pow((KE/mass + 1.),2)) );
}

function GetTrackInfo(track)
{
  // Accept trk object, return info in an object.
  var r = {
    id: track.index
  };
  
  r.slice = track.slice;
  if(track.patrec){
    r.patrec = track.patrec;
    switch(r.patrec) {
      case 1: r.patrec_str = "Long 3D"; break;
      case 2: r.patrec_str = "Long 2D"; break;
      case 3: r.patrec_str = "Four-Hit"; break;
      case 4: r.patrec_str = "Elastic"; break;
      default: r.patrec_str = "Unknown"; break;
    }
    r.patrec_str += " (" + r.patrec + ")";
  }

  r.hits =  track.hits;
  r.vis_energy = track.vis_energy || 0; // MeV
  r.theta = track.theta;
  r.phi   = track.phi;
  r.vx = Math.sin(r.theta)*Math.cos(r.phi);
  r.vy = Math.sin(r.theta)*Math.sin(r.phi);
  r.vz = Math.cos(r.theta);

  // Rotate to beam-relative coords.
  var angle = 3.33*Math.PI/180; // 3 degrees down, i.e. rotate about x-axis
  r.bx = r.vx;
  r.by =  Math.cos(angle)*r.vy + Math.sin(angle)*r.vz;
  r.bz = -Math.sin(angle)*r.vy + Math.cos(angle)*r.vz;
  r.btheta= Math.acos(r.bz);
  r.bphi = Math.atan2(r.by,r.bx);

  r.range = 0;
  var nodes = track.nodes;
  r.firstx = nodes[0].x;
  r.firsty = nodes[0].y;
  r.firstz = nodes[0].z;
  r.firstt = 1e99;
  r.lastx = 0;
  r.lasty = 0;
  r.lastz = 0;
  
  r.mass_traversed =0;
  r.tavg = 0;
  r.end_module = -1;
  r.end_strip = [-1,-1,-1,-1];
  var x,y,z;
    
  r.track_history = [];
  var last_module =-2;
  var module=-1;
  
  for(var i=0;i<nodes.length;i++) {
    var clusters = $('clusters',xmlDoc);
    var clus_idx = $('cluster_index',nodes[i]).text();
    var clus = gClusters_by_index[nodes[i].cluster_index];
    if(!clus) console.warn(nodes[i],clus_idx,clus);
    module = clus.module;
    var view = clus.view;
    r.end_strip[view] = clus.strip;

    x = nodes[i].x;
    y = nodes[i].y;
    z = nodes[i].z;
    
    
    if(i>0) {
      var dx = x-r.lastx;
      var dy = y-r.lasty;
      var dz = z-r.lastz;
      var dr = Math.sqrt(dx*dx + dy*dy + dz*dz);
      r.range += dr;

      if(last_module !=module) {
        // We've gone through at least one module.
        // Estimate based on our current module.
        var depth = (module-last_module)*dr/dz;// Pathlength corrected by 1/cos(theta)
        var mass_scint = depth*2*1.7*1.0; // 2 layers of1.7 cm of plastic.
        var mass_pb = 0;
        if(module > 85 && module < 95) mass_pb = depth*0.2*11.34;// 0.2 cm at 11.34 g/cm3
        var mass_fe = 0;
        if(module > 94)  mass_fe = depth*2.54 *8.0; // Guess at steel density = 8
        // console.log("Track range calc: module:",module," scint:",mass_scint," pb:",mass_pb," fe:",mass_fe);
        r.mass_traversed += mass_scint+mass_pb+mass_fe;
        r.track_history.push({
          module: module,
          dz: dz,
          dr: dr,
          mass_scint: mass_scint,
          mass_pb: mass_pb,
          mass_fe: mass_fe
        });
      }
    } 

    var t = clus.time;
    if(t<r.firstt) r.firstt = t;
    r.tavg += t;
    r.lastx = x;
    r.lasty = y;
    r.lastz = z;
    last_module = module;
  }
  r.end_module = module;
  r.tavg= r.tavg/(nodes.length)

  r.minos_p    = track.minos_mom*1000;
  r.minos_qual = track.minos_qual;

  r.chi2perDof = track.chi2perDof || 0;
  r.dof        = track.dof;
  r.chi2       = r.chi2perDof * r.dof;
  
  r.E_minosmu = 0;
  if(r.minos_p > 0) r.E_minosmu = p_to_KE(r.minos_p,m_mu);

  r.minos_range    = 0;
  r.minos_p        = 0;
  r.minos_p_range  = 0;
  r.minos_p_curve  = 0;
  r.minos_qp       = 0;
  r.minos_eqp      = 0;
  
  // Find minos track index, if any.
  console.log("minos match:",track.minos_track_idx);
  var idx = track.minos_track_idx;
  if(idx>=0) {
    var mtrk = gMinosTracks[idx];
    console.log(idx,mtrk);
    if(mtrk) {
      r.minos_range    = mtrk.range;
      r.minos_p        = mtrk.p*1000;
      r.minos_p_range  = mtrk.prange*1000;
      r.minos_qp       = mtrk.qp*0.001;
      r.minos_eqp      = mtrk.eqp*0.001;

      r.minos_p_curve = 1/r.minos_qp;

      // FIXME hack: use momentum by range in all cases.
      // This will need fixing when ntuples get fixed.
      r.E_minosmu = p_to_KE(r.minos_p_range,m_mu);
      // console.log("Minos muon: p=",r.minos_p_range," m_mu:",m_mu," ke:",r.E_minosmu);
      
    }
  }
  
  // OK, now run backward through the track, computing dE/dX for each of particle ansatz
  r.E_stopmu = 0;
  r.E_proton = 0;
  
  for(var i=r.track_history.length-1; i>=0; i--) {
    var histon = r.track_history[i]; // An individual quantum of history
    
    histon.step_stopmu  = Muon_KE(  r.E_stopmu, [histon.mass_scint,histon.mass_pb,histon.mass_fe]);
    histon.step_minosmu = Muon_KE(  r.E_minosmu,[histon.mass_scint,histon.mass_pb,histon.mass_fe]);
    histon.step_proton  = Proton_KE(r.E_proton, [histon.mass_scint,histon.mass_pb,histon.mass_fe]);
    r.E_stopmu  = histon.step_stopmu.energy;
    r.E_minosmu = histon.step_minosmu.energy;
    r.E_proton  = histon.step_proton.energy;
     
    // console.log("Backtracking track history. i=",i," muon_ke:",r.E_stopmu," masses:",histon.mass_scint,histon.mass_pb,histon.mass_fe);
  }
  
  r.p_stopmu  = KE_to_p(r.E_stopmu,m_mu);
  r.p_minosmu = KE_to_p(r.E_minosmu,m_mu);
  r.p_proton  = KE_to_p(r.E_proton,m_p);
  
  return r;
}




function Converter(system)
{
  this.system = system;
  this.c = 3e8;
  this.MeV = 1.6e-19 * 1e6;
}

Converter.prototype.p = function(v)
{
  if(this.system=="SI") return (v*this.MeV/this.c*1e19).toFixed(3) + "x10<sup>-19</sup> kg m/s";
  return v.toFixed(1) + " MeV/c";
}

Converter.prototype.E = function(v)
{
  if(this.system=="SI") return (v*this.MeV*1e12).toFixed(2)+ "x10<sup>-12</sup> kg m<sup>2</sup>/s<sup>2</sup>";
  return v.toFixed(1) + " MeV";
}

// Converter.prototype.mass = function(v)
// {
//   if(this.system=="SI") return v*this.MeV/(this.c*this.c)+ " kg";
//   return v + " MeV/c<sup>2</sup>";
// }

Converter.prototype.dist = function(v)
{
  if(this.system=="SI") return (v/1000).toFixed(3)+ " m";
  return v.toFixed(0) + " mm";
}

Converter.prototype.time = function(v)
{
  if(this.system=="SI") return v.toFixed(0) + "x10<sup>-9</sup> s";
  return v.toFixed(0) + " ns";
}

Converter.prototype.speed = function(v)
{
  if(this.system=="SI") return (v*2.99792458).toFixed(5) + "x10<sup>8</sup> m/s";
  return v.toFixed(5) + " c";
}


var clip_muon = null;
var clip_proton = null;


function DrawObjectInfo() 
{
  var e = $('#track-info');
  
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
    // if(gCurrentSlice>=0 && gCurrentSlice!=slice) drawblob = false;
  }
  
  if(drawvtx) {
    console.log("New Object Info for vertex",gSelectedVertex);    
    DrawVertexInfo(e,slice);
  } else if(drawtrack){
    console.log("New Object Info for track",gSelectedTrack);    
    DrawTrackInfo(e,slice);
  } else if(drawblob){
    console.log("New Object Info for blob",gSelectedBlob);    
    DrawBlobInfo(e,slice);
  } else {
    // don't draw anything
    txt = "<span class='track_id'>No Object Selected</span><br/>";
    $("#track-info-pane",e).html(txt);
    $('#track-info.floating').stop(true,true).fadeOut();
  }
  
}

function DrawVertexInfo(e,slice)
{
  var system_of_units = $(".unit-ctl input:checked").val();
  C = new Converter(system_of_units);
  
  var txt = "<span class='track_id'>Vertex " + gSelectedVertex.id + " (Slice "+gSelectedVertex.slice+")</span><br/>";
  $("#track-info-pane",e).html(txt);
  $('#track-info.floating').stop(true,true).fadeIn();
  $('#track-info.dialog').each(function(){
    if(!$(this).dialog('isOpen')){
      $(this).dialog('option','width',250);
      $(this).dialog('option','position','right');
      $(this).dialog('open');
    }
  });
  
  
  var type = 0;
  var typename;
  if( gSelectedVertex.type ) type = gSelectedVertex.type;
  switch(type) {
    case 1: typename = "Primary"; break;
    case 2: typename = "Secondary"; break;
    case 3: typename = "Other"; break;
    default: typename = "Unknown"; break;
  }
  typename += " (" + type + ")";
  
  var c = "<tr><td class='track-info-caption'>";
  var d = "</td><td class='track-info-break'></td><td class='track-info-data'>";
  var el = "</td></tr>";
  txt += "<table border='0' class='track-info'>";

  txt += c +""+ d 
    + 'x = ' + C.dist( gSelectedVertex.x )+ ' &plusmn; ' + C.dist( gSelectedVertex.xerr ) + '<br/>' 
    + 'y = ' + C.dist( gSelectedVertex.y )+ ' &plusmn; ' + C.dist( gSelectedVertex.yerr ) + '<br/>' 
    + 'z = ' + C.dist( gSelectedVertex.z )+ ' &plusmn; ' + C.dist( gSelectedVertex.zerr ) 
    + el;
  txt += c + 'Type: ' + d + typename + el;
  txt += c + "Tracks" + d + gSelectedVertex.track_idx.length + el;
  txt += "</table>";
  
  $("#track-info-pane",e).html(txt);
  
}


function DrawBlobInfo(e,slice)
{
  // Start fade-in before we finish filling out substance.
  var txt = "<span class='track_id'>Blob " + $(gSelectedBlob).attr('index') + " (Slice "+slice+")</span><br/>";

  $("#track-info-pane",e).html(txt);
  $('#track-info.floating').stop(true,true).fadeIn();

  $('#track-info.dialog').each(function(){
    if(!$(this).dialog('isOpen')){
      $(this).dialog('option','width',250);
      $(this).dialog('option','position','right');
      $(this).dialog('open');
    }
  })

  var patrec;
  switch(gSelectedBlob.patrec){
    case 1:
      patrec = "Dispersed Blob"; break;
    case 2:
      patrec = "Vertex Blob"; break;
    case 3:
      patrec = "Isolated Blob"; break;
    case 4:
      patrec = "Cone/Peak Blob"; break;
    default:
      patrec = "Unknown"; break;
  }
  patrec = patrec + " (" + gSelectedBlob.patrec + ")";

  var history;
  switch(gSelectedBlob.history){
    case 0:
      history = "Unused"; break;
    case 1:
      history = "Used"; break;
    case 2:
      history = "Hidden"; break;
    case 3:
      history = "Discarded"; break;
    default:
      history = "Unknown"; break;
  }
  history = history + " (" + gSelectedBlob.history + ")";


  var c = "<tr><td class='track-info-caption'>";
  var d = "</td><td class='track-info-break'></td><td class='track-info-data'>";
  var el = "</td></tr>";
  txt += "<table border='0' class='track-info'>";
  txt += c + "SubDet" + d + gSelectedBlob.subdet + el;
  txt += c + "History" + d + history + el;
  txt += c + "PatRec" + d + patrec + el;
  txt += c + "Size" + d + gSelectedBlob.size + " hits"+ el;
  // txt += c + "Visible Energy" + d + $('visible_e',gSelectedBlob).text() + " MeV"+ el;
  txt += c + "Energy" + d + gSelectedBlob.e + " MeV"+ el;
  txt += c + "Start" + d  
  + 'x = ' + gSelectedBlob.startpoint_x +  '<br/>' 
  + 'y = ' + gSelectedBlob.startpoint_y +  '<br/>' 
  + 'z = ' + gSelectedBlob.startpoint_z  +  '<br/>' 
  + el;
  txt += c + "Time" + d  + gSelectedBlob.time.toFixed(1) + " ns" + el;
  
  txt += "</tr></table>";
  $("#track-info-pane",e).html(txt);
  
}

function DrawTrackInfo(e,slice)
{
  var system_of_units = $(".unit-ctl input:checked").val();
  C = new Converter(system_of_units);
  
  // Start fade-in before we finish filling out substance.
  txt = "<span class='track_id'>Track " + $(gSelectedTrack).attr('index') + " (Slice "+slice+")</span><br/>";

  $("#track-info-pane",e).html(txt);
  $('#track-info.floating').stop(true,true).fadeIn();

  $('#track-info.dialog').each(function(){
    if(!$(this).dialog('isOpen')){
      $(this).dialog('option','width',250);
      $(this).dialog('option','position','right');
      $(this).dialog('open');
    }
  })
  
  var r = GetTrackInfo(gSelectedTrack);
  console.log("GetTrackInfo",r);
  txt += "<table border='0' class='track-info'>";
  var c = "<tr><td class='track-info-caption'>";
  var d = "</td><td class='track-info-break'></td><td class='track-info-data'>";
  var el = "</td></tr>";

  txt += c + "Hits" + d + r.hits + el;
  txt += c + "Vis Energy" + d + C.E(r.vis_energy) + el;

  if(gPageName!='simple') {
    if(r.patrec!=undefined) {
      txt += c + "PatRec" + d + r.patrec_str + el;      
    }
    
    txt += c + "Direction" + d + "&theta;= " + (r.btheta*180/Math.PI).toFixed(2) + "&deg;<br/>"
                               + "&phi;= "   + (r.bphi  *180/Math.PI).toFixed(2) + "&deg;"
                               + el;
    txt += c + "Range" + d + C.dist(r.range) + "<br/>" 
                           + r.mass_traversed.toFixed(1) + " g/cm<sup>2</sup>"
                           + el;
    txt += c + "Vertex" + d + "x: " + C.dist(r.firstx)+ "<br/>"
                            + "y: " + C.dist(r.firsty)+ "<br/>"
                            + "z: " + C.dist(r.firstz)
                            + el;
    txt += c + "&Chi;<sup>2</sup>/dof" + d + r.chi2.toFixed(1) + '/' + r.dof + " = " + parseFloat(r.chi2perDof).toFixed(1) + "/dof" + el;
  }
  txt += c + "Time" + d + C.time(r.tavg) + el;
  txt += c + "Minos:" + d + "p<sub>range</sub>= " + C.p(r.minos_p_range) + "<br/>"
                          + "p<sub>curve</sub>= " + C.p(r.minos_p_curve) 
                          + el;
  txt += c + "If muon:<br/><button id='trackinfo_clip_muon'>Copy</button>" + d + "p= " + C.p(r.p_minosmu)+ "<br/>" 
                            + "KE= "+ C.E(r.E_minosmu)+ "<br/>"
                            + "v= "+C.speed(KE_to_speed(r.E_minosmu,m_mu))+"<br/>"
                            + "p<sub>x</sub>= " + C.p(r.bx * r.p_minosmu) + "<br/>"   //.toFixed(1) + " MeV/c <br/>"
                            + "p<sub>y</sub>= " + C.p(r.by * r.p_minosmu) + "<br/>"   //.toFixed(1) + " MeV/c <br/>"
                            + "p<sub>z</sub>= " + C.p(r.bz * r.p_minosmu) + "<br/>"   //.toFixed(1) + " MeV/c <br/>"
                            + el;
  txt += c + "If proton:<br/><button id='trackinfo_clip_proton'>Copy</button>" + d + "p= " + C.p(r.p_proton)+ "<br/>" 
                              + "KE= "+ C.E(r.E_proton)+ "<br/>"
                              + "v= "+C.speed(KE_to_speed(r.E_proton,m_p))+"<br/>"                                
                              + "p<sub>x</sub>= " + C.p(r.bx * r.p_proton) + "<br/>"   //.toFixed(1) + " MeV/c <br/>"
                              + "p<sub>y</sub>= " + C.p(r.by * r.p_proton) + "<br/>"   //.toFixed(1) + " MeV/c <br/>"
                              + "p<sub>z</sub>= " + C.p(r.bz * r.p_proton) + "<br/>"   //.toFixed(1) + " MeV/c <br/>"
                              + el;
  txt += "</tr></table>";
  console.log(txt);
  $("#track-info-pane",e).html(txt);
  // e.stop(true,true).fadeIn();

  // copy buttons.
  var muon_text =   r.E_minosmu +"\t"+  
                 KE_to_speed(r.E_minosmu,m_mu) + "\t"+
                 (r.bx * r.p_minosmu) +"\t"+
                 (r.by * r.p_minosmu) +"\t"+
                 (r.bz * r.p_minosmu);
  $('#trackinfo_clip_muon').on('click',function(){navigator.clipboard.writeText(muon_text).then(function() {
    console.log("Clipboard done");  /* clipboard successfully set */
  }, function() {
    console.log("Clipboard failed");
  });
  });

  var proton_text = r.E_proton +"\t"+  
             KE_to_speed(r.E_proton,m_p) + "\t"+
             (r.bx * r.p_proton) +"\t"+ 
             (r.by * r.p_proton) +"\t"+
             (r.bz * r.p_proton);
  $('#trackinfo_clip_proton').on('click',function(){navigator.clipboard.writeText(proton_text).then(function() {
    console.log("Clipboard done");  /* clipboard successfully set */
  }, function() {
    console.log("Clipboard failed");
  });  
  });
}


function SetObjectInfoBubblePosition(x,y)
{
  $('#track-info.floating').css({
    position: 'absolute',
    zIndex : 2000,
    left: x, top: y-60
  });
  if(clip_muon)   clip_muon.reposition();  // Fix floating copy boxes
  if(clip_proton) clip_proton.reposition();
}


////////// Initialization
$(function(){
  gStateMachine.Bind("selectedHitChange",DrawObjectInfo);
  gStateMachine.Bind("gateChange",DrawObjectInfo);
  gStateMachine.Bind("sliceChange",DrawObjectInfo);
  $('#track-info.floating').hide();
  $('#track-info .unit-ctl').buttonset();
  $('#track-info .unit-ctl input').click(DrawObjectInfo);

  $('#track-info.dialog').dialog({ 
      autoOpen: false, 
      position: 'right', 
      width: 200,
      dragStop: function(event,ui) {
        if(clip_muon)   clip_muon.reposition();  // Fix floating copy boxes
        if(clip_proton) clip_proton.reposition();
      },
      resizeStop: function(event,ui) {
        if(clip_muon)   clip_muon.reposition();  // Fix floating copy boxes
        if(clip_proton) clip_proton.reposition();
      }
  });
});
