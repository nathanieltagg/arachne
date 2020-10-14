//
// Code for the Arachne Event Display
// Author: Nathaniel Tagg ntagg@otterbein.edu
// 
// Licence: this code is free for non-commertial use. Note other licences may apply to 3rd-party code.
// Any use of this code must include attribution to Nathaniel Tagg at Otterbein University, but otherwise 
// you're free to modify and use it as you like.
//


///
/// Go from x,y,z,view to module,strip
///

var ksixty_degrees = 60*3.1415928/180;
var k45_degrees = 45*3.1415928/180;
var kcos_45 = Math.cos(k45_degrees);
var ksin_45 = Math.cos(k45_degrees);
var kcos_60 = Math.cos(ksixty_degrees);
var ksin_60 = Math.sin(ksixty_degrees);
var ktan_60 = Math.tan(ksixty_degrees);
var ksin_120 = Math.sin(ksixty_degrees*2);
var ktan_120 = Math.tan(ksixty_degrees*2);

var kStripPitch = 16.473; // mm
var kSlope60 = 1.0/ktan_60;

kMinosPlane1InMinervaZ = 12087; // mm
kEndOfMinervaZ = 10040; // mm
kMinosPlanePitch =  59.4; // mm per plane
kmmMinos_xshift = -1482.8 + 10390*2.54*0.01;    // mm 
kmmMinos_yshift = 114000*0.0254 - 129480*0.0254; // mm
  
var gNdOutlineSteel = [
 { x: -121.43, y:   0.47  }, 
 { x: -120.25, y:   0.47  }, 
 { x: -115.14, y:   3.42  }, 
 { x: -110.24, y:   3.42  }, 
 { x:  -95.24, y:  -1.48  }, 
 { x:  -95.24, y: -35.47  }, 
 { x:  -69.80, y: -60.91  }, 
 { x:  -69.80, y: -75.04  }, 
 { x:   69.80, y: -75.04  }, 
 { x:   69.80, y: -60.91  }, 
 { x:   95.24, y: -35.47  }, 
 { x:   95.24, y:  -1.48  }, 
 { x:  110.16, y:   3.42  }, 
 { x:  117.30, y:   3.42  }, 
 { x:  120.25, y:   0.47  }, 
 { x:  121.43, y:   0.47  }, 
 { x:  121.43, y:   9.28  }, 
 { x:   69.80, y:  60.91  }, 
 { x:   69.80, y:  75.04  }, 
 { x:  -69.80, y:  75.04  }, 
 { x:  -69.80, y:  60.91  }, 
 { x: -121.43, y:   9.28  }, 
 { x: -121.43, y:   0.47  } 
]

var gNdPartialActive = [
 { x: 139.00, y: -180.62 }, 
 { x: 253.91, y:  -65.09 }, 
 { x: 253.91, y:   65.08 }, 
 { x: 139.00, y:  180.59 }, 
 { x: 120.00, y:  180.59 },
 { x: -61.00, y:       0 },
 { x: -28.00, y:  -33.00 },
 { x:   5.00, y:       0 },  
 { x: -28.00, y:   33.00 }, 
 { x: -61.00, y:       0 },
 { x: 120.00, y: -180.62 }, 
 { x: 139.00, y: -180.62 }
]

var gNdFullActive = [
 { x:  141.48, y: -190.51 }, 
 { x:  241.91, y:  -90.09 }, 
 { x:  241.91, y:   90.08 }, 
 { x:  141.41, y:  190.59 }, 
 { x:  -43.64, y:  190.60 }, 
 { x: -234.25, y:    0.01 }, 
 { x: -234.25, y:    0.01 }, 
 { x:  -43.78, y: -190.49 }, 
 { x:  141.48, y: -190.51 }
]
 

function Geometry() 
{
  this.StripPitch = kStripPitch;
  this.FirstModule = -5;
  this.LastModule = 115;
  this.NumModules = this.LastModule-this.FirstModule+2;    
  
  this.FirstStrip = 1;
  this.LastStrip = 127;
  this.NumStrips = this.LastStrip-this.FirstStrip+2;

  this.MidStrip = 64;

  this.regions = [ 
    {name: "Target 1",      ustart:-1, uend: -1,   thin:true,   stroke: "rgba(0,0,0,0.1)", fill:"rgba(0,0,0,0.1)",   text:"rgb(255,255,255)"},
    {name: "Target 2",      ustart: 4, uend:  4,   thin:true,   stroke: "rgba(0,0,0,0.1)", fill:"rgba(0,0,0,0.1)",   text:"rgb(255,255,255)"},
    {name: "Target 3",      ustart: 9, uend: 10,   thin:true,   stroke: "rgba(0,0,0,0.1)", fill:"rgba(0,0,0,0.1)",   text:"rgb(255,255,255)"},
    {name: "Water",         ustart: 13.99, uend: 14,   thin:true,   stroke: 
"rgba(0,0,0,0.1)", fill:"rgba(0,0,0,0.1)",   text:"rgb(255,255,255)"},
    {name: "Target 4",      ustart:19, uend: 19,   thin:true,   stroke: "rgba(0,0,0,0.1)", fill:"rgba(0,0,0,0.1)",   text:"rgb(255,255,255)"},
    {name: "Target 5",      ustart:22, uend: 22,   thin:true,   stroke: "rgba(0,0,0,0.1)", fill:"rgba(0,0,0,0.1)",   text:"rgb(255,255,255)"},
    // Active target:
    // {name: "", ustart: 23, uend: 84,  thin: false, stroke: "rgba(0,0,0,0.5)", fill:"rgba(0,0,0,0.0)",    text:"rgb(200,200,200)"},
    {name: "ECAL",          ustart: 85, uend: 94,  thin: false, stroke: "rgba(0,0,0,0.5)", fill:"rgba(0,0,255,0.05)", text:"rgb(200,200,200)"},
    {name: "HCAL",          ustart: 95, uend: 114, thin: false, stroke: "rgba(0,0,0,0.5)", fill:"rgba(0,0,0,0.03)",   text:"rgb(200,200,200)"}                                          
   ];
};


Geometry.prototype.GetStripFromCoord = function(x,y,view)
{
  // Which is the transverse coordinates?
  var t = -99999;
  switch(view) {
    case 1: t = x; break;
    case 2: t = kcos_60 * x - ksin_60*y; break;
    case 3: t = kcos_60 * x + ksin_60*y; break;
  }
  return strip = t/kStripPitch + this.MidStrip;
}

Geometry.prototype.AdjustXY = function(x,y,view,strip) 
{
  var t = (strip - this.MidStrip)*kStripPitch;
  switch(view) {
    case 1: x = t; break;
    case 2: y = -(t-kcos_60*x)/ksin_60; break;
    case 3: y =  (t-kcos_60*x)/ksin_60; break;
  }
  return {x:x,y:y};
}

Geometry.prototype.GetIdStripCoords = function(view,strip,lpos1,lpos2)
{
  // Given a specific view and strip number, return the endpoint coordinates of the
  // strip in XY detector coordinates.  lpos1 and lpos2 are optional - if specified,
  // these provide the start and endpoints of the strip line in a coordinate along the strip.
  
  var pitch = 16.473; // mm
  var maxhalflen = 2457.8/2;
  var slope = 1.0/ktan_60;
  var max_ytop = maxhalflen - 76.2; // The little corner on the top is shaved off.
  var x = (strip-64)*pitch;
  var d = Math.abs(x)*slope;
  var l  = maxhalflen-d;
  if(typeof(lpos1)==='undefined') lpos1=-l;
  if(typeof(lpos2)==='undefined') lpos2= l;

  // if(lpos1 > max_ytop) lpos1 = max_ytop;
  //  if(lpos2 > max_ytop) lpos2 = max_ytop;
  //  
  if(view==1) return({rot:0, r: x, l:l, x1:x, y1:lpos1, x2:x, y2:lpos2});
  
  // If it's not the X-view... well, just rotate it until it is!
  var rot = 0;  // Number of clockwise 60 degree rotations required. If view is x, no rotation.
  if(view==2) { rot= -1;}  // U-view is rotated left 60 degrees, low strip numbers in -x, +y
  if(view==3) { rot=  1;}  // V-view is rotated right 60 degrees, low strip numbers in -x, -y
  return {
            rot : rot,
            r   : x, // distance from origin to center of the strip.
            l   : l, // halflength
            x1: x *kcos_60 - lpos1*rot*ksin_60,
            y1: lpos1*kcos_60 + x *rot*ksin_60,
            x2: x *kcos_60 - lpos2*rot*ksin_60,
            y2: lpos2*kcos_60 + x *rot*ksin_60,
  };
}



Geometry.prototype.GetOdStripCoords = function(tower,story, bar)
{  
  // These are the coordinates for (true) story 5, on the +x side.
  var x, l;
  switch(story) {
    case 1:  x=1229.1; l=1337.6; break; // mm. 
    case 2:  x=1310.9; l=1432.1; break;
    case 3:  x=1394.0; l=1528.1; break;
    case 4:  x=1533.5; l=1689.1; break;
    default:
      x=1600;
      l=1000;
      console.warn("story="+story+" is not a legal value");
  }
  if(bar==1) x += 30;
  y1 = l/2;
  y2 =-l/2;
  
  // Ok, now rotate to the correct tower number
  switch(tower) {
    case 1:  rot = 4;  break;
    case 2:  rot = 3;  break;
    case 3:  rot = 2;  break;
    case 4:  rot = 1;  break;
    case 5:  rot = 0;  break;
    case 6:  rot = 5;  break;
  }

  // var rot = -((tower+2)%6); // number of clockwise 60 degree rotations needed.
  // // Get it to align with u,v coords above.
  // if(rot<-1) rot +=6; // rot now from -1 to 4
  // if(rot>1) {
  //   rot = rot-3;  // rot now from -1 to 1
  //   x = -x;
  // }

  var ang = rot*3.1415928/3;
  var c = Math.cos(ang);
  var s = Math.sin(ang);
  var r = x;
  return {
    rot: rot,
    r:  x,  // distance from origin to center of line.
    x1: x *c- y1*s,
    y1: y1*c+ x *s,
    x2: x *c- y2*s,
    y2: y2*c+ x *s,
  };
  
}

Geometry.prototype.GetStripEndCoordinates = function(plane,view,strip)
{
  var pos = this.GetStripCenter(plane,view,strip);
  var hl  = this.GetStripHalfLength(plane,view,strip);
  var dx = -kcos_45; 
  var dy = kcos_45;
  if(view == 3) {
    dx = kcos_45; 
    dy = kcos_45;    
  }
  // console.warn(
  // pos.x + dx*hl,
  // pos.y + dy*hl,
  // pos.x - dx*hl,
  // pos.y - dy*hl
  // );
  return {
    x1: pos.x + dx*hl,
    y1: pos.y + dy*hl,
    x2: pos.x - dx*hl,
    y2: pos.y - dy*hl,
    z:  pos.z,
    z1: pos.z,
    z2: pos.z,
  }
}


// MINOS stuff.
Geometry.prototype.Z_of_Plane = function(p)
{
  return p*kMinosPlanePitch+kMinosPlane1InMinervaZ;
}

Geometry.prototype.GetStripCenter = function(plane,view,strip)
{
  // Returns the XYZ coordinates of the center of the strip.
  // Code taken from StupidGeometry.
  var full = ((plane-1)%5)==0; // Test for full plane or parial plane.
  var kkMinos_xshift = -1482.8 + 10390*0.0254;    //  
  var kkMinos_yshift = 114000*0.0254 - 129480*0.0254; //  
  if((plane%2) != (3-view) ) console.error("GetStripCenter: Requested plane ",plane," view ",view," which are not compatible!");
  if(!full) {
    // partial planes
    if(view==2) {
    	// Near Up
           if (strip < 11) return { x: 743.38+ 29.13*strip + kkMinos_xshift, y: -1076.01+ 29.13*strip + kkMinos_yshift, z: this.Z_of_Plane(plane) }
      else if (strip < 12) return { x: 2337.91- 130.32*strip + kkMinos_xshift, y: -2670.54+188.59*strip + kkMinos_yshift, z: this.Z_of_Plane(plane) }
      else if (strip < 40) return { x: 583.56+ 29.17*strip + kkMinos_xshift, y: -916.93+ 29.17*strip + kkMinos_yshift, z: this.Z_of_Plane(plane) }
      else if (strip < 41) return { x:-1163.44+ 73.96*strip + kkMinos_xshift, y:  728.07- 13.01*strip + kkMinos_yshift, z: this.Z_of_Plane(plane) }
      else                 return { x: 1209.51+ 14.64*strip + kkMinos_xshift, y: -1537.61+ 43.63*strip + kkMinos_yshift, z: this.Z_of_Plane(plane) }
    } else {
    	// Near Vp  
           if (strip < 28) return { x: 2189.86- 14.64*strip + kkMinos_xshift, y: -1385.17+ 43.63*strip + kkMinos_yshift, z: this.Z_of_Plane(plane) }
      else if (strip < 29) return { x: 3788.74- 73.85*strip + kkMinos_xshift, y:  147.02- 13.12*strip + kkMinos_yshift, z: this.Z_of_Plane(plane) }
      else if (strip < 57) return { x: 2537.38- 29.16*strip + kkMinos_xshift, y: -1036.90+ 29.16*strip + kkMinos_yshift, z: this.Z_of_Plane(plane) }
      else if (strip < 58) return { x:-6393.64+ 130.32*strip + kkMinos_xshift, y: -9964.53+ 188.59*strip + kkMinos_yshift, z: this.Z_of_Plane(plane) }
      else                 return { x: 2695.12- 29.13*strip + kkMinos_xshift, y: -875.73+ 29.13*strip + kkMinos_yshift, z: this.Z_of_Plane(plane) }  
    } 
  } else {
    // Full planes.
    if(view==2) {
      // Near Uf
           if (strip < 16) return { x: -842.51+ 43.63*strip + kkMinos_xshift, y:-991.71+ 14.64*strip + kkMinos_yshift, z:this.Z_of_Plane(plane) }
      else if (strip < 17) return { x: -491.97+ 20.26*strip + kkMinos_xshift, y:-1394.25+ 41.47*strip + kkMinos_yshift, z:this.Z_of_Plane(plane) }
      else if (strip < 33) return { x: -866.82+ 43.69*strip + kkMinos_xshift, y:-966.52+ 14.74*strip + kkMinos_yshift, z:this.Z_of_Plane(plane) }
      else                 return { x: -402.30+ 29.17*strip + kkMinos_xshift, y:-1428.32+ 29.17*strip + kkMinos_yshift, z:this.Z_of_Plane(plane) }
    } else {                                    
      // Near Vf        
           if (strip < 64) return { x: 2369.57- 29.18*strip + kkMinos_xshift, y: -1343.55+ 29.18*strip + kkMinos_yshift, z: this.Z_of_Plane(plane) }
      else if (strip < 80) return { x: 3284.87- 43.70*strip + kkMinos_xshift, y: -435.18+ 14.76*strip + kkMinos_yshift, z: this.Z_of_Plane(plane) }
      else if (strip < 81) return { x: 1457.55- 20.57*strip + kkMinos_xshift, y: -2570.53+ 41.79*strip + kkMinos_yshift, z: this.Z_of_Plane(plane) }
      else                 return { x: 3301.97- 43.63*strip + kkMinos_xshift, y: -398.59+ 14.64*strip + kkMinos_yshift, z: this.Z_of_Plane(plane) }
    }
  }
}

Geometry.prototype.GetStripHalfLength = function(plane,view,strip)
{
  var full = ((plane-1)%5)==0; // Test for full plane or parial plane.
  if(!full) {
    // partial planes
    if(view==2) {
    	// Near Up
    	if(strip<21)      return 998.78 + 20.5*strip;
    	else if(strip<38) return 1416;
    	else              return 2193.81 - 20.6525*strip;
    } else {
    	// Near Vp  
    	if (strip<32)     return 769 + 20.667*strip;
    	else if(strip<49) return 1416.;
    	else              return 2413 - 20.5*strip;      
    }
  } else {
    // Full planes.
    if(view==2) {
      // Near Uf
    	if(strip<32)      return 1339.61 + 20.58*strip;
    	else if(strip<66) return 2002;
    	else              return 4731.29 - 41.2069*strip;      
    } else {                                    
      // Near Vf   
    	if (strip<32)     return 693.01 + 41.2069*strip;
    	else if(strip<66) return 2002;
    	else              return 3356.9  - 20.5762*strip;                                   
    }
  }
}



//
// Full detector geometry
//

MVGeometry.prototype = new Geometry;           
MVGeometry.prototype.constructor = Geometry;
function MVGeometry() {
  this.FirstModule = -5;
  this.LastModule = 115;
  this.NumModules = this.LastModule-this.FirstModule+2;
  
};



MVGeometry.prototype.Z_of_Module = function(m,v)
{
  if(m<15) return m*44.22+4534.77+(v>1)*20.64;
  if(m<25) return m*44.22+4814.08+(v>1)*20.64;
  if(m<88) return m*45.23+4790.81+(v>1)*20.64;
  if(m<95) return m*44.80+4827.31+(v>1)*20.64;
  return 47.335*m+4591.255+(v>1)*20.64;
}

MVGeometry.prototype.Module_of_Z = function(z,v)
{
  if(z<5477.38) return (z-4534.77-(v>1)*20.64)/44.22;
  if(z<5921.56) return (z-4814.08-(v>1)*20.64)/44.22;
  if(z<8769.71) return (z-4790.81-(v>1)*20.64)/45.23;
  if(z<9088.08) return (z-4827.31-(v>1)*20.64)/44.80;
  return (z-4591.255-(v>1)*20.64)/47.335;
}




///
// Half-detector.
//

MNGeometry.prototype = new Geometry;           
MNGeometry.prototype.constructor = Geometry;
function MNGeometry() {
  this.FirstModule = 49;
  this.LastModule = 115;
  this.NumModules = this.LastModule-this.FirstModule+2;  
};


MNGeometry.prototype.Z_of_Module = function(m,v)
{
  if(m<51) return m*45.23+4491.55+(v>1)*20.64;
  if(m<88) return m*45.23+4790.78+(v>1)*20.64;
  if(m<95) return m*44.80+4827.31+(v>1)*20.64;
  return 47.335*m+4591.255+(v>1)*20.64;
}

MNGeometry.prototype.Module_of_Z = function(z,v)
{
  if(z<7097.51) return (z-4491.55-(v>1)*20.64)/45.23;
  if(z<8769.71) return (z-4790.78-(v>1)*20.64)/45.23;
  if(z<9088.08) return (z-4827.31-(v>1)*20.64)/44.80;
  return (z-4591.255-(v>1)*20.64)/47.335;
}

//
// Tracking Prototype
//

TPGeometry.prototype = new Geometry;           
TPGeometry.prototype.constructor = Geometry;
function TPGeometry() {
  this.FirstModule = 74;
  this.LastModule = 99;
  this.NumModules = this.LastModule-this.FirstModule+2;   
};


TPGeometry.prototype.Z_of_Module = function(m,v)
{
  if(m<95) return m*43.665-3463.224+(v>1)*20.64;
  return 50.805*m-4136.768+(v>1)*20.64;
}

TPGeometry.prototype.Module_of_Z = function(z,v)
{
  if(z<689.707) return (z+3463.224-(v>1)*20.64)/43.665;
  return (z+4136.768-(v>1)*20.64)/50.805;
}


// Starting default.
gGeo = new MVGeometry;

///
// test beam geometry. 
///
TBGeometry_20ECAL20HCAL.prototype = new Geometry;
TBGeometry_20ECAL20HCAL.prototype.constructor = Geometry;

function TBGeometry_20ECAL20HCAL() {
  this.FirstStrip = 1;
  this.LastStrip = 64;
  this.NumStrips = this.LastStrip-this.FirstStrip+2;
  this.MidStrip = 32;

  this.FirstModule = 1;
  this.LastModule = 40;
  this.NumModules = this.LastModule-this.FirstModule+2;
    this.regions = [ 
   {name: "ECAL",          ustart: 1, uend: 20,  thin: false, stroke: "rgba(0,0,0,0.5)", fill:"rgba(0,0,255,0.05)", text:"rgb(200,200,200)"},
   {name: "HCAL",          ustart: 21, uend: 40, thin: false, stroke: "rgba(0,0,0,0.5)", fill:"rgba(0,0,0,0.03)",   text:"rgb(200,200,200)"}                                          
  ];
};

TBGeometry_20ECAL20HCAL.prototype.GetStripFromCoord = function(x,y,view)
{
  // Which is the transverse coordinates?
  var t = -99999;
  switch(view) {
    case 1: t = x; break;
    case 2: t = kcos_60 * x - ksin_60*y; break;
    case 3: t = kcos_60 * x + ksin_60*y; break;
  }
  return strip = t/kStripPitch + this.MidStrip;
}

TBGeometry_20ECAL20HCAL.prototype.Z_of_Module = function(m,v)
{
 if(m<21.000000) return m*28.600000 - 13.285000;
 return 48.100000*m - 401.080000;
}


TBGeometry_20ECAL20HCAL.prototype.Module_of_Z = function(z,v)
{
 if(z<609.020000) return (z+13.285000)/28.600000;
 return (z+401.080000)/48.100000;
}

///
// test beam geometry. 
///
TBGeometry_20Tracker20ECAL.prototype = new Geometry;
TBGeometry_20Tracker20ECAL.prototype.constructor = Geometry;

function TBGeometry_20Tracker20ECAL() {
  this.FirstStrip = 1;
  this.LastStrip = 64;
  this.NumStrips = this.LastStrip-this.FirstStrip+2;
  this.MidStrip = 32;

  this.FirstModule = 1;
  this.LastModule = 40;
  this.NumModules = this.LastModule-this.FirstModule+2;


  this.regions = [ 
     {name: "ECAL",          ustart: 21, uend: 40,  thin: false, stroke: "rgba(0,0,0,0.5)", fill:"rgba(0,0,255,0.05)", text:"rgb(200,200,200)"},
    ];
};

TBGeometry_20Tracker20ECAL.prototype.GetStripFromCoord = function(x,y,view)
{
  // Which is the transverse coordinates?
  var t = -99999;
  switch(view) {
    case 1: t = x; break;
    case 2: t = kcos_60 * x - ksin_60*y; break;
    case 3: t = kcos_60 * x + ksin_60*y; break;
  }
  return strip = t/kStripPitch + this.MidStrip;
}

TBGeometry_20Tracker20ECAL.prototype.Z_of_Module = function(m,v)
{

 if(m<21.000000) return m*20.700000-10.350000;
 return 32.100000*m-243.035000;
}


TBGeometry_20Tracker20ECAL.prototype.Module_of_Z = function(z,v)
{
 if(z<431.065000) return (z+10.035000)/20.700000;
 return (z+243.035000)/32.100000;
}


///
// test beam geometry 2015
///
TBGeometry_TrackerSuperHCAL.prototype = new Geometry;
TBGeometry_TrackerSuperHCAL.prototype.constructor = Geometry;

function TBGeometry_TrackerSuperHCAL() {
  this.FirstStrip = 1;
  this.LastStrip = 64;
  this.NumStrips = this.LastStrip-this.FirstStrip+2;
  this.MidStrip = 32;

  this.FirstModule = 1;
  this.LastModule = 41;
  this.NumModules = this.LastModule-this.FirstModule+2;


  this.regions = [ 
     {name: "HCAL",               ustart: 21, uend: 24,  thin: false, stroke: "rgba(0,0,0,0.5)", fill:"rgba(0,0,255,0.05)", text:"rgb(200,200,200)"},
     {name: "Double HCAL",  ustart: 25, uend: 35,  thin: false, stroke: "rgba(0,0,0,0.5)", fill:"rgba(0,0,255,0.08)", text:"rgb(200,200,200)"},
     {name: "HCAL",               ustart: 36, uend: 41,  thin: false, stroke: "rgba(0,0,0,0.5)", fill:"rgba(0,0,255,0.05)", text:"rgb(200,200,200)"},
    ];
};

TBGeometry_TrackerSuperHCAL.prototype.GetStripFromCoord = function(x,y,view)
{
  // Which is the transverse coordinates?
  var t = -99999;
  switch(view) {
    case 1: t = x; break;
    case 2: t = kcos_60 * x - ksin_60*y; break;
    case 3: t = kcos_60 * x + ksin_60*y; break;
  }
  return strip = t/kStripPitch + this.MidStrip;
}

TBGeometry_TrackerSuperHCAL.prototype.Z_of_Module = function(m,v)
{
  var z = m*20.00050000-10.00025;
  if(m>=21) z+= (m-21)*(52.216-20.0005); // add hcal width
  if(m>=25) z+= (m-25)*(80.983-52.216); // add double hcal width
  if(m>=36) z-= (m-36)*(52.216-80.983); // take off double hcal width again.
}


TBGeometry_TrackerSuperHCAL.prototype.Module_of_Z = function(z,v)
{
  var z0 = z+10.00025
  if(z < 420.010) return (z/20.00050000);
  if(z < 661.090) return ((z-400.010)/52.216)+20;
  if(z < 1551.90) return ((z-661.090)/80.983)+24;
  return ((z - 1551.90)/52.216) + 35;
}
