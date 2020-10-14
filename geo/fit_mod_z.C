#include <fstream>
#include <iostream>
#include "TString.h"

// To get mapping of x-planes to module number from the ntuple:
// minerva->Draw("clus_z:clus_module>>h(120,-5,115)","clus_view==1","prof")
// for(i=0;i<120;i++) if(h->GetBinContent(i)>0) cout << h->GetBinLowEdge(i) << "\t" << h->GetBinContent(i) << endl;
using std::cout;

string s(double x)
{
  return string(Form("%lf",x));
}

double z(double m)
{
  if(m<15.000000) return m*44.220000+4525.450000;
  if(m<24.000000) return m*44.210000+4804.900000;
  if(m<89.000000) return m*45.220000+4781.720000;
  if(m<95.000000) return m*44.800000+4817.980000;
  return 47.330000*m+4579.030000;
}

double m(double z)
{
  if(z<5468.050000) return (z-4525.450000)/44.220000;
  if(z<5867.000000) return (z-4804.900000)/44.210000;
  if(z<8805.180000) return (z-4781.720000)/45.220000;
  if(z<9075.380000) return (z-4817.980000)/44.800000;
  return (z-4579.030000)/47.330000;  
}


void fit_mod_z()
{
  ifstream in("mod_z_tb2.txt");
  double m1, m2;
  double z1, z2;
  bool first = true;

  double slope=0;
  double offset=0;
  double tolerance = 0.1; // mm
  
  string forward_func;
  string backward_func;
  
  
  while(true) {
    in >> m2 >> z2;
    if(in.eof()) break;
    // cout << m << "\t|\t" << z << endl;
    
    if(!first) {
      // Try last solution.
      double trial_z = m1*slope + offset;
      if( fabs(trial_z - z1) > tolerance ) {
        if(slope!=0) {
          forward_func += string("if(m<") + s(m1) + ") return m*" + s(slope)  + "+" + s(offset) + "+(v>1)*20.64"+ ";\n";
          backward_func += string("if(z<") + s(z1) + ") return (z-" + s(offset) + "-(v>1)*20.64)/" + s(slope) + ";\n";
        }
        double dm = m2-m1;
        double dz = z2-z1;
        slope = dz/dm;
        offset = z1-(slope*m1);        
      }
//      cout << m1 << "\t" << z1 << "\t" << slope << "\t" << offset << "\t" << offset+slope*m1-z1 << endl;
      cout << m1 << "\t" << z1 << "\t" << m(z1)-m1 << "\t" << z(m1)-z1 << endl;      
    }
    
    first = false;
    m1 = m2;
    z1 = z2;
  }

  forward_func +=  "return " + s(slope) + "*m+" + s(offset) + "+(v>1)*20.64;\n";
  backward_func +=  "return (z-" + s(offset) + "-(v>1)*20.64)/" + s(slope) + ";\n";

  cout << endl << endl;
  
  cout << forward_func;
  cout << endl << endl;
  cout << backward_func;
}
