void print_p(TProfile* p)
{
  for(UInt_t i=1;i<=p->GetNbinsX();i++) {
	float x = p->GetBinLowEdge(i);
        float y = p->GetBinContent(i);
        if(y>0) std::cout << x <<"\t" << y << std::endl;      
  }  
}

void get_plane_positions()
{
  minerva->Draw("clus_z:clus_module>>p2(150,0,150)","clus_view==2","prof");
  minerva->Draw("clus_z:clus_module>>p3(150,0,150)","clus_view==3","prof");
  minerva->Draw("clus_z:clus_module>>p1(150,0,150)","clus_view==1","prof");

  p1->SetMarkerStyle(20);
  p1->Fit("pol1");
  p1->Draw("p");

  print_p(p1);
}
