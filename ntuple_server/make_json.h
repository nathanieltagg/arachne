#ifndef MAKE_XML_H
#define MAKE_XML_H



#include <string>
#include <TObject.h>
#include <TTime.h>

extern TTime  gTimeStart;
extern UInt_t gEventsServed;

class TTree;

std::string make_json( const char* inOptions,
                       const char* inDstFile,
                       const char* inSelection,
                       Long64_t entrystart=0,
                       Long64_t entryend=1000000000                       
                      );

std::string find_version_number(
    const char* inDstFile,
    TTree* inTree,
    Long64_t jentry,
    int &ver_major,
    int &ver_rev,
    int &ver_patch
  );



#endif /* MAKE_XML_H */

