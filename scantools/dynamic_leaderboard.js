///
/// Boilerplate:  Javascript utilities for MINERvA event display, codenamed "Arachne"
/// Nathaniel Tagg  - NTagg@otterbein.edu - June 2009
///

var xml = {};

$(function() {


  // Start by getting data.
  // Prepare ajax request.
  $.ajax({
          type: "GET",
          url: "leaderboard.xml",
          dataType: "xml",
          async: true,
          complete: RecievedUserData            
          });

  $.ajax({
          type: "GET",
          url: "fetch_leaderboard_data.cgi",
          dataType: "xml",
          async: true,
          complete: RecievedUserData            
          });

  $("#sort").bind("change",function(){DrawData();});
  var startdate = new Date();
  startdate.setFullYear(2009);
  startdate.setMonth(8);
  startdate.setDate(29);
  $("#datepicker").datepicker({ defaultDate: startdate,
                                onSelect:    function(a,b){DrawData();} 
                              });
});

function RecievedUserData( data )
{
  xml = data.responseXML;
  
  DrawData();
}

function bycomplete(a,b)
{
  return  -(parseFloat($('unique',a).text()) - parseFloat($('unique',b).text()));
}

function bydate(a,b)
{
  return  Date.parse($('latest',a).text()) - Date.parse($('latest',b).text());
}

function byinbox(a,b)
{
  return  -(parseFloat($('inbox',a).text()) - parseFloat($('inbox',b).text()));
}

function byname(a,b)
{
  if( $('username',a).text() < $('username',b).text() ) return -1;
  else return +1;
}


function DrawData()
{
  $(".mainbody *").remove();
  var users = [];
  var date = new Date();
  var cutoffDate = $("#datepicker").datepicker('getDate');

  $("user",xml).each(function(){
    // console.log(this,$('latest',this).text());
    date.setTime(Date.parse($('latest',this).text()));
    // console.log($('latest',this).text(),date,cutoffDate);
    if(date >= cutoffDate) users.push(this);
  });


  $('#status').text("Data current as of " + $('leaderboard',xml).attr('timestamp') + " GMT");
  // Sort data here.
  var sortval = $("#sort").val();
  users.sort(eval(sortval));
  
  

  var maxev = 0;
  for(var i=0; i<users.length; i++) {
    var user = users[i];
    var tot = parseFloat($('unique',user).text()) 
            + parseFloat($('inbox',user).text());
    if(tot>maxev) maxev = tot;
  }

  var tbody = $(".mainbody");
  // console.log("tbody",tbody);
  for(var i=0; i<users.length; i++) {
    var user = users[i];
    // console.log(user);
    var cp = parseFloat($('unique',user).text())/maxev * 100.0;
    var ip = parseFloat($('inbox',user).text())/maxev * 100.0;
    var ep = 100 - cp - ip;
    
    var title = $('username',user).text() + ": " 
              + "  Unique events scanned:" + $('unique',user).text()
              + "  Total scanned:" + $('completed',user).text()
              + "  Inbox:" + $('inbox',user).text()
              + "  Last completed:" + $('latest',user).text() + " GMT";
    var link = "scantool.cgi?" + jQuery.param({user_name:$('username',user).text()});

    var row = "<tr class='userrow' title='" + title + "'>"
            + "<td class='user'><a href='" + link +"'>"  + $('username',user).text() + "</a></td>"
            + "<td class='progress'><table class='progresstable' width='100%'><tr>"
            + "<td class='completed' width='" + cp + "%'>" + $('unique',user).text() + "</td>"
            + "<td class='assigned' width='" + ip + "%'>" + $('inbox',user).text() + "</td>"
            + "<td class='empty' width='" + ep + "%'></td>"
            + "</tr></table></td></tr>";
    // console.log(row);
    tbody.append(row);
  }
}

