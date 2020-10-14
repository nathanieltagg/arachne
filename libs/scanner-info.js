//
// Code for the Arachne Event Display
// Author: Nathaniel Tagg ntagg@otterbein.edu
// 
// Licence: this code is free for non-commertial use. Note other licences may apply to 3rd-party code.
// Any use of this code must include attribution to Nathaniel Tagg at Otterbein University, but otherwise 
// you're free to modify and use it as you like.
//




// Global variables.
var gScanXml = null;
var gScanFlagNames = new Array(32);
// Default names.
for(var i=0;i<32;i++) gScanFlagNames[i] = "Type"+ i;
// More interesting names:
// gScanFlagNames[0]="Rock-&mu;";
// gScanFlagNames[1]="CC &nu;<sub>&mu;</sub>";
// gScanFlagNames[2]="CC &nu;<sub>e</sub>";
// gScanFlagNames[3]="NC";
// gScanFlagNames[4]="Readout problem";
// gScanFlagNames[5]="Bad slicing";
// gScanFlagNames[6]="Bad reconstruction";
// gScanFlagNames[7]="I found Waldo";
gScanFlagNames[0]="Fiducial event";
gScanFlagNames[1]="ECAL event";
gScanFlagNames[2]="Rock-muon";
gScanFlagNames[3]="Detector problem";
gScanFlagNames[4]="Unanalyzable";
gScanFlagNames[5]="Nuclear Target Hit";

var gInboxId = 0;
var gLastScannedEvent =null;

function mysqlTimeStampToDate(timestamp) {
   //function parses mysql datetime string and returns javascript Date object
   //input has to be in this format: 2007-06-05 15:26:02
   var regex=/^([0-9]{2,4})-([0-1][0-9])-([0-3][0-9]) (?:([0-2][0-9]):([0-5][0-9]):([0-5][0-9]))?$/;
   var parts=timestamp.replace(regex,"$1 $2 $3 $4 $5 $6").split(' ');
   return new Date(parts[0],parts[1]-1,parts[2],parts[3],parts[4],parts[5]);
 }


function RequestScannerInfo() {
  // console.debug("RequestScannerInfo");
  var subdata = {
    user_name       : $('#inScanUserName').val(), // Only check the current name in the menu.
    det             : gDet,
    recoVer         : gRecoVer,
    run             : gRun, 
    subrun          : gSubrun, 
    gate            : gGate, 
    slice           : gCurrentSlice,
    id              : gInboxId
  };
  
  $("#goScanSubmitAndAdvance,#goScanReverse,#goScanAdvance")
    .removeClass("ui-state-default")
    .addClass   ("ui-state-disabled");
  
  $.ajax({
    complete: ScannerInfoRetrieved,
    data: subdata,
    dataType: "xml",
    url:"scan_server/access_scan_info.cgi",
    async: true,
    type: 'GET'
  });
}

function ScannerInfoRetrieved(data, textStatus) {
  
  // Error checking...
  // ..
  
  if(data.status) {
    // console.log(data.status);
    if(data.status !== 200) {
      console.log("tried to get: "+data.url);
      return false;
    } else {
      // console.log("Scanner-DB Server returned data "+data.status+": \""+data.statusText+"\"");
    }
  }

  gScanXml = data.responseXML; // put it into a global variable.
  if (gScanXml === null || gScanXml === undefined) {
    // console.log("gScanXml was null");
    return false;
  }
  if (gScanXml.documentElement.nodeName === "parsererror")
  {
      errStr = gScanXml.documentElement.childNodes[0].nodeValue;
      errStr = errStr.replace(/</g, "&lt;");
      console.log(errStr);
      return false;
  }

  if( $('error',gScanXml).size() !== 0) {
    $('error',gScanXml).each(function(i) {
      var txt = String($(this).text()).replace(/\n/g,"<br/>");
      console.log("Error on load: <br/> <pre>" + txt + "</pre>");
    });
    return false;
  }
  ShowScannerInfo();
}

function ShowScannerInfo()
{
  if(gScanXml === null) return;
  function DecomposeFlags(flags) {
    if(flags===0) return "(none)";
    var retval = "";
    for(var i=0;i<32;i++) {
      if( (flags>>>i)&1 === 1) {
        retval += gScanFlagNames[i] + ", ";
      }
    }
    return retval;
  }
  
  function DoEntry(entry, classes) {
    var s = "<table border='0' class='"+ classes + "'>";
    s+="</tr><th class='"+ classes + "'>User: </th>";
    s+="<td"+classes+">"+$('user_name',entry).text()+"</td></tr>";

    s+="</tr><th class='"+ classes + "'>Date: </th>";
    var date = mysqlTimeStampToDate($('modification_date',entry).text());
    s+="<td"+classes+">"+date.toString()+"</td></tr>";
    
    s+="</tr><th class='"+ classes + "'>Flags: </th>";
    var text = DecomposeFlags( parseInt($('flags',entry).text()) );
    s+="<td"+classes+">"+text+"</td></tr>";
    
    var list = ['vertex_hits','shower_prongs','track_prongs'];
    for(var i=0; i<list.length; i++) {
      s+="</tr><th class='"+ classes + "'>" + list[i] +"</th>";
      s+="<td"+classes+">"+$(list[i],entry).text()+"</td></tr>";
    }
    
    for(var i=1;i<4;i++) {
      s+="</tr><th class='"+ classes + "'> Prong " + i +"</th>";
      var ch = parseInt($('prong'+i+'_character',entry).text());
      var text = "(unknown)";
      if(ch===0) { text = "N/A";}
      else if(ch==1) { text='Exit HCAL rear';} 
      else if(ch==2) { text='Exit HCAL side';} 
      else if(ch==3) { text='Scattered';} 
      else if(ch==4) { text='Shower prong';} 
      else if(ch==5) { text='Range to stop';} 
      s+="<td"+classes+">"+text+"</td></tr>";      
    }

    list = ['gamma_conversions','vee_vertices','neutrons'];
    for(var i=0; i<list.length; i++) {
      s+="</tr><th class='"+ classes + "'>" + list[i] +"</th>";
      s+="<td"+classes+">"+$(list[i],entry).text()+"</td></tr>";
    }

    s+="</tr><th class='"+ classes + "'>Notes: </th>";
    s+="<td"+classes+">"+$('notes',entry).text()+"</td></tr>";
    s += "</table>";
    return s;  
  }
    
  // Ok, ready to process.
  var s = "";
  s+= "<span>Inbox: </span>"+$('inbox_count',gScanXml).text()+"<br/>";
  s+= "<a id='agoScanAdvance' href='#advance'>Next in inbox:"
      +$('next_in_inbox run',gScanXml).text()+"/"
      +$('next_in_inbox subrun',gScanXml).text()+"/"
      +$('next_in_inbox gate',gScanXml).text()+"#"
      +$('next_in_inbox slice',gScanXml).text()+"</a><br />";
  $('#agoScanAdvance').click(AdvanceToInbox);

  if(gLastScannedEvent) {
    s+= "Last scanned event:";
    s+= "<a id='agoLastScanned' href='#lastscanned'>"
        +gLastScannedEvent.run+"/"
        +gLastScannedEvent.subrun+"/"
        +gLastScannedEvent.gate+"#"
        +gLastScannedEvent.slice
        +"</a><br />";
  }
  $("#agoLastScanned,").click(function(){
        DoJumpToEvent(null,null,gLastScannedEvent.run,gLastScannedEvent.subrun,gLastScannedEvent.gate,gLastScannedEvent.slice);
        });  

  // Enable now-active controls.
  $("#goScanSubmitAndAdvance,#goScanReverse,#goScanAdvance")
    .removeClass("ui-state-disabled")
    .addClass("ui-state-default");

  s+= "<span>This slice:</span><br/>";
  var slice = gCurrentSlice;
  var entries = $('entry',gScanXml);
  var ncur = 0;
  // Find good slice matches first.
  for(var i=0; i<entries.length; i++){
    if(parseInt($('slice',entries[i]).text())===slice) {
      ncur++;
      s+=DoEntry(entries[i],'scanner-info scanner-info-cur-slice');  
      s+="<hr />";       
    }
  }
  // console.log(entries.length);
  if(ncur===0){ s+="<span class='scanner-info scanner-info-cur-slice'>(None or N/A)</span><br/><hr />"; }
  
  
  
  // // Find bad slice matches last.
  // s+="<span>Entries on other slices:</span><br/>"
  // for(var i=0; i<entries.length; i++){
  //   if(parseInt($('slice',entries[i]).text())!==slice) {
  //     s+=DoEntry(entries[i],'scanner-info scanner-info-diff-slice');         
  //     s+="<hr />";        
  //   }
  // }

  $('#scan-info').html(s);
  
  
  
}

function ClearScannerInfo() {
  $('#scan-info').html("");
}

function ResetScannerForm()
{
  for(var i=0;i<32;i++) {
    $('#inScanCheckboxBit'+i).attr('checked',false);
  }   
  
   $('#inScan_ShowerProngs').val(0);
   $('#inScan_TrackProngs').val(0);
   $('#inScan_VertexHits').val(0);
   $('#inScan_GammaConversions').val(0);
   $('#inScan_VeeVertices').val(0);
   $('#inScan_neutrons').val(0);
   $("input[name='inScan_Prong1'][value='0']").attr('checked',true);
   $("input[name='inScan_Prong2'][value='0']").attr('checked',true);
   $("input[name='inScan_Prong3'][value='0']").attr('checked',true);
   $('#inScanNotes').val("");
  
}
 
function SubmitScannerInfo(clickevent) {
  if($('#inScanUserName').val() == "Anonymous Coward") {
    var answer = confirm("You are submitting a scan report as 'Anonymous Coward'. Are you sure you want to be so cowardly?");
    if(!answer) return false;
  }
  
  // Get form values of name, clicked elements, and notes
  var flags = 0;
  for(var i=0;i<32;i++) {
    if( $('#inScanCheckboxBit'+i).is(':checked')  ) {
      flags += (1<<i);
    }              
  }   

  var sliceinfo = GetSliceInfo();
  
  var mr = gManReco.GetXml();
  
  var subdata = {
    action           : 'insert',
    det              : gDet,
    recoVer          : gRecoVer,
    run              : gRun,
    subrun           : gSubrun,
    gate             : gGate,
    filename         : gFile,
    slice            : gCurrentSlice,
    user_name        : $('#inScanUserName').val(),
    shower_prongs    : parseInt($('#inScan_ShowerProngs').val()),
    track_prongs     : parseInt($('#inScan_TrackProngs').val()),
    vertex_hits      : parseInt($('#inScan_VertexHits').val()),
    gamma_conversions: parseInt($('#inScan_GammaConversions').val()),
    vee_vertices     : parseInt($('#inScan_VeeVertices').val()),
    neutrons         : parseInt($('#inScan_neutrons').val()),
    prong1_character : parseInt($("input[name='inScan_Prong1']:checked").val()),
    prong2_character : parseInt($("input[name='inScan_Prong2']:checked").val()),
    prong3_character : parseInt($("input[name='inScan_Prong3']:checked").val()),
    flags            : flags,
    notes            : $('#inScanNotes').val(),
    idhits           : sliceinfo.idhits,
    odhits           : sliceinfo.odhits,
    tmean            : sliceinfo.tmean,
    calpe            : sliceinfo.calpe,
    id               : gInboxId,
    manreco          : mr
  };

  // Check to see there's actually some kind of entry.
  if(    subdata.shower_prongs  == 0
      && subdata.track_prongs   == 0
      && subdata.vertex_hits    == 0
      && subdata.flags == 0
      && subdata.notes == ""
      && subdata.manreco == "" ) 
      {
        answer = confirm("You are submitting a scan report with no flags, prongs, vertex hits, notes, or manual reconstruction. Are you sure you want to submit this?");
        if(!answer) return false;
      }

  gLastScannedEvent = subdata;
  gLastScannedEventUrl = gUrlToThisEvent;

  $.ajax({
    complete: ScannerInfoRetrieved,
    data: subdata,
    dataType: "xml",
    url:"scan_server/access_scan_info.cgi",
    async: true,
    type: 'GET'
  });
  
  

  return true;
}

function AdvanceToInbox(ev)
{
  console.log('------Advance',gScanXml,ev);
  var next=[];
  if((ev.data != null) && (ev.data.reverse === true)) {
    next = $('prev_in_inbox',gScanXml);
  } else {
    next = $('next_in_inbox',gScanXml);
  }
  
  console.log('next',next);
  if(next.length<1) {
    $.growlUI('Inbox is Empty', 'You\'re either done, or your user id isn\t set correctly.'); 
    
    // $('#status').attr('class', 'status-error');
    // $("#status").text("No event in inbox. (Is your user name set correctly?)");
    return;
  }

  gInboxId = parseInt($('id',next).text()); // To be used when the next/prev event is loaded.
  var next_det    = $('det',next).text();
  var next_ver    = $('recoVer',next).text();
  var next_run    = parseInt($('run',next).text()         );
  var next_subrun = parseInt($('subrun',next).text()      );
  var next_gate   = parseInt($('gate',next).text()        );
  var next_slice  = parseInt($('slice',next).text()       );
  
  if(next_det.length == 0) {
    // null entry - at end of inbox.
    $('#status').attr('class', 'status-error');
    $("#status").text("No next event available. (Perhaps you're finished?)");
    return;
    
  }
  
  DoJumpToEvent(next_det, next_ver, next_run, next_subrun, next_gate, next_slice);
} 


function LoginAs(login)
{
  if(login != "" && login != null ) {
    $.cookie("arachne-scanner-login-name",login,{path: "/", expires: 3000});
    $('#scan-entry').unblock();
    $('#scan-logged-in-as').text(login);
    $('#scan-logged-in').show();
    RequestScannerInfo();
  }
}


$(function() {
  // Get correct flag names into DOM.
  for(var i=0;i<32;i++) {
    $('#inScanCheckboxBit'+i+' + span').html(gScanFlagNames[i]);
  }   
  
  // Callback on login.
  $('#inScanUserName').change(function() { 
    LoginAs($(this).val()); 
  });
  
  $('#inScanUserName').keydown(function(ev) { 
    if (ev.keyCode == '13') {
      LoginAs($(this).val()); 
    }
  });
  
  // Callback for scanner info submission.
  $('#goScanSubmit').click(SubmitScannerInfo);

  // Callback for scanner info submission and advance vent
  $('#goScanSubmitAndAdvance').click(function(ev){ if(SubmitScannerInfo()){AdvanceToInbox(ev);} });

  // Callback for scanner info submission and advance vent
  $('#goScanAdvance').click(AdvanceToInbox);
  $('#goScanReverse').bind("click",{reverse:true},AdvanceToInbox);
  
  
  // Callback for login change
  $('#scan-change-login').click(function() {
    $.cookie("arachne-scanner-login-name","",{path: "/", expires: 3000});
    if($(this).val() != "") {
      $.cookie("arachne-scanner-login-name",null,{path: "/", expires: 3000});
      $('#scan-entry').block({ message: $('#scan-login-form'), css: {width: '50%'} });
      $('#scan-logged-in').hide();
    }
  });
  
  // Set up scan entry form with cookied login.
  var login = $.cookie("arachne-scanner-login-name");
  if(login == null || login == "") {
    $('#scan-entry').block({ message: $('#scan-login-form'), css: {width: '50%'} });
    $('#scan-logged-in').hide();
  } else {
    $('#inScanUserName').val(login);
    $('#scan-logged-in-as').text(login)
    $('#scan-logged-in').show();
  }
  
  // buttonize the buttons.
  $('#scan-entry input[type="button"]').button();
});



