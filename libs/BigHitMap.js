//
// Code for the Arachne Event Display
// Author: Nathaniel Tagg ntagg@otterbein.edu
// 
// Licence: this code is free for non-commertial use. Note other licences may apply to 3rd-party code.
// Any use of this code must include attribution to Nathaniel Tagg at Otterbein University, but otherwise 
// you're free to modify and use it as you like.
//


$(function(){  
  $(".bighitmap-select")
       .buttonset();
  
  $(".bighitmap-select-button")
      // .button({text:true})
      .change(function(ev){
          var view = parseInt($(":checked",$(this).parent()).val());
          // console.log('change big view to ',view);
          hmBigXZ.view = view;
          hmBigXZ.Select();
        });

   $(".bighitmap-colorscale-button")
     .click(function(ev){
       console.log(this);
       if($(this).is(":checked")) {
         hmBigXZ.margin_right = 50;
         hmBigXZ.paint_colorscale = true;
       } else {
         hmBigXZ.margin_right = 5;
         hmBigXZ.paint_colorscale = false;       
       }
       hmBigXZ.Resize();
       hmBigXZ.Draw();
     });
  
})
