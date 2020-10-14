//
// Code for the Arachne Event Display
// Author: Nathaniel Tagg ntagg@otterbein.edu
// 
// Licence: this code is free for non-commertial use. Note other licences may apply to 3rd-party code.
// Any use of this code must include attribution to Nathaniel Tagg at Otterbein University, but otherwise 
// you're free to modify and use it as you like.
//

function GetSliceInfo()
{
  // Find some event quantities to make it easier to match up.
  var idhits = 0;
  var odhits = 0;
  var vetohits = 0;
  var tmean = 0;
  var calpe = 0;
  var vis = 0;
  var n = gHits.length;
  for(var i=0; i<n; i++){
    var hit = gHits[i];
    if((gCurrentSlice<0) || (hit.slice==gCurrentSlice)) {
      var pe = hit.pe;
      var norm = hit.norm_energy;
      var time = hit.time;
      var d = hit.det;
      if(d=='ID') idhits++;
      else if(d=='OD') odhits++;
      else if(d=='Veto') vetohits++;

      if(time>0&&time<15500)  tmean += time;
      if(pe>0)    calpe+=pe;
      if(norm>0)  vis+=norm;
    }
  }
  tmean = tmean/(idhits+odhits);

  var n_id_clus=0;
  n = gIdClusters.length;
  for(var i=0; i<n; i++) {
    var clus = gIdClusters[i];
    if((gCurrentSlice<0) || (clus.slice==gCurrentSlice)) {
      n_id_clus++;
    }
  }
  
  var ntrack=0;
  n = gTracks.length;
  for(var i=0; i<n; i++) {
    var t = gTracks[i];
    if((gCurrentSlice<0) || (t.slice==gCurrentSlice)) {
      ntrack++;
    }
  }
  
  var nvtx=0;
  n = gVertices.length;
  for(var i=0; i<n; i++) {
    var v = gVertices[i];
    if((gCurrentSlice<0) || (v.slice==gCurrentSlice)) {
      nvtx++;
    }
  }

  var nblob=0;
  n = gBlobs.length;
  for(var i=0; i<n; i++) {
    var v = gBlobs[i];
    if((gCurrentSlice<0) || (v.slice==gCurrentSlice)) {
      nblob++;
    }
  }


  return { idhits: idhits,
           odhits: odhits,
           vetohits: vetohits,
           tmean:  tmean,
           calpe:  calpe,
           mev:    vis,
           nidclus: n_id_clus,
           ntrack: ntrack,
           nvtx:   nvtx,
           nblob:  nblob
          };
}


function EventInfoDisplay( )
{
  gStateMachine.BindObj("sliceChange",this,"Build");
  gStateMachine.BindObj("gateChange",this,"Build");
}

  
EventInfoDisplay.prototype.Build = function() 
{
  
  var sliceinfo = GetSliceInfo();
  //console.log("EventInfoDisplay::Build", sliceinfo);
  var slice = gCurrentSlice;
  if(gCurrentSlice==0 ) slice = "Orphans";
  if(gCurrentSlice==-1) slice = "All Slices";
  $(".event-info-slice"     ).html( slice );
  $(".event-info-nslices"   ).html( gNumSlices );
  // $(".event-info-eventid"   ).html( gDet+"|"+gRun+"|"+gSubrun+"|"+gGate);
  $(".event-info-idhits"    ).html( sliceinfo.idhits );
  $(".event-info-odhits"    ).html( sliceinfo.odhits );
  $(".event-info-vetohits"    ).html( sliceinfo.vetohits );
  $(".event-info-reco  "    ).html( sliceinfo.nidclus + " clusters,  " 
                                  + sliceinfo.ntrack + " tracks, " 
                                  + sliceinfo.nvtx + " vertices, "
                                  + sliceinfo.nblob + " blobs" );
  $(".event-info-tmean"     ).html( Math.round(sliceinfo.tmean) + " ns" );
  $(".event-info-calpe"     ).html( Math.round(sliceinfo.calpe) + " pe");
  $(".event-info-mev"       ).html( sliceinfo.mev.toFixed(1) + " MeV");


  // Get a list of the relevant filter lists.
  var filters=[];
  if(gCurrentSlice>=0)
    filters.push(gRecord.slices[gCurrentSlice].filters);
  else {
    // All filters.
    for(var i=0;i<gNumSlices;i++) filters.push(gRecord.slices[i].filters)
  }

  // Go through the lists and look for passed and failed entries.
  var passed = {};
  var failed = {};
  for(var i=0;i<filters.length;i++) {
    for(var f in filters[i]) {
      if(filters[i][f] >0 )  passed[f] = 1;
      if(filters[i][f] ==0 ) failed[f] = 0;
    }
  }
    
  // Now build a list of unique filters, b
  // Decompose the list into text.
  ftxt = "";
  for(var i in passed) {
    ftxt += i + "<br/>";
  }
  if(ftxt == "") ftxt = "(none)"
  $(".event-info-filters"   ,this.fElement).html( ftxt );
  
  
  // Fill entries having to do with time.
  var ev = gRecord.ev;
  // GPS time.
  var gps_sec  = ev.gps_time_sec;
  var gps_usec = ev.gps_time_usec;
  var date = new Date(gps_sec *1000 + gps_usec/1000 )
  $('.event-info-gps-time'     ).html( date.toLocaleTimeString() );
  $('.event-info-gps-date'     ).html( date.toLocaleDateString() );


  // Time in local coordinates.
  if(ev.local_gmt_offset>0) {
    var locdate = new Date(gps_sec *1000 + ev.local_gmt_offset*1000+ gps_usec/1000 )

    $('.event-info-local-date'     ).html( (locdate.getUTCMonth()+1) + "/" + locdate.getUTCDate()+"/"+locdate.getUTCFullYear() 
);
    $('.event-info-local-time'     ).html( locdate.getUTCHours()+":"+locdate.getUTCMinutes()+":"+locdate.getUTCSeconds() );
    $('.event-info-local-tz'       ).html( $('local_timezone',ev).text() );

  }    
  var now = new Date;
  var dt = (now.getTime() - date.getTime())/1000.
  var age = dt;
  if(dt<60*2)             age = dt.toFixed(0) + " sec";
  else if(dt<3600*2)      age = (dt/60).toFixed(0) + " min";
  else if(dt<86400*2)     age = (dt/3600).toFixed(0) + " hours";
  else if(dt<24*3600*400) age = (dt/86400).toFixed(1) + " days";
  else                    age = (dt/31536000).toFixed(1) + " years";
  $('.event-info-age').html(age);

  var ver = gRecord.source.reco_version;
  if(gRecord.source.dev_version) ver += "_DEV";
  $(".event-info-reco-version"    ).html( ver );
  $(".event-info-converter"       ).html( gRecord.converter );
  $(".event-info-file"            ).html( gRecord.source.file );
  $(".event-info-det"             ).html( gDet );                                  
  $(".event-info-detector"        ).html( ev.detector  );
  $(".event-info-det-config"      ).html( ev.det_config );
  $(".event-info-run"             ).html( ev.run );
  $(".event-info-subrun"          ).html( ev.sub_run );
  $(".event-info-trigger-type"    ).html( ev.trigger_type );
  $(".event-info-cal-settings"    ).html( ev.cal_settings );
  $(".event-info-gl-gate"         ).html( ev.gl_gate );
  $(".event-info-gate"            ).html( ev.gate );
  $(".event-info-readout"         ).html( ev.readout );
  $(".event-info-errors"          ).html( ev.errors );
  $(".event-info-gate-idhits"     ).html( gRecord.n_idhits );
  $(".event-info-gate-odhits"     ).html( gRecord.n_odhits );
  $(".event-info-gate-vetohits"   ).html( gRecord.n_vetohits );
  $(".event-info-slices"          ).html( gRecord.n_slices );
  $(".event-info-id-hits-per-mod" ).html( gRecord.hits_id_per_mod );
  $(".event-info-od-hits-per-mod" ).html( gRecord.hits_od_per_mod);
  $(".event-info-num-clusters"    ).html( gRecord.clusters.length );
  $(".event-info-num-tracks"      ).html( gRecord.tracks.length );
  $(".event-info-num-vertices"    ).html( gRecord.vertices.length );
  $(".event-info-num-blobs"       ).html( gRecord.id_blobs.length);
  $(".event-info-total-pe"        ).html( gRecord.hits.length );
                                  
}

$(function() {
  gEventInfoDisplay = new EventInfoDisplay;
})
