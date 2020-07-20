#include <stdio.h>
#include <sndfile.h>
#include <math.h>
#include <stdlib.h>
#include <iostream>
#include <fstream>
#include <string>
#include <vector>
using namespace std;

class Sample
{
public:
  Sample(float duration, int rate=44100) 
    : fDuration(duration)
    , fRate(rate)
    , fPanScale(1.0)
    , fEarDistance(0.10) // 10 cm gap between ears
    , fSpeedSound(50) // m/s
    , fListenerX(0) // m
    , fListenerY(1) // m
    , fListenerZ(2) // m
    , fData(0)
    {
      Reset(duration);
    }
  
  void Reset(float dur)
  {
    fDuration = dur;
    fFrames = (int)(fDuration * (float)fRate);
    if(fData) delete [] fData;
    fData = new float[fFrames*2];
    for(int i=0;i<fFrames*2;i++) fData[i]=0;
  }
    
  ~Sample() {
    delete [] fData;
  }
  
  void WriteFile(const char* filename);
  void WriteStdOut();
  void CreateClick(float time, float freq, float mag , float x, float y, float z);
  void CreateZing(float timestart, float dur, float freq, float mag, float x1, float y1, float z1, float x2, float y2, float z2);
  void CreateWhiteNoise(const vector<float>& envelope);

  int    fFrames;
  float  fDuration;
  int    fRate;
  float  fPanScale;
  float  fEarDistance;
  float  fSpeedSound;
  float  fListenerX;
  float  fListenerY;
  float  fListenerZ;
  float* fData;
};

void Sample::CreateClick(float time, float freq, float mag , float x, float y, float z)
{
  float clickdur = 1/freq;
  int istart = (int)(time*fRate);
  int istop  = (int)((time+clickdur)*fRate);
  float d2 = (x-fListenerX)*(x-fListenerX)
           + (y-fListenerY)*(y-fListenerY)
           + (z-fListenerZ)*(z-fListenerZ);
  float d = sqrt(d2); // Distance to sound

  float angle = atan2(x-fListenerX,z-fListenerZ);
  float adjust = sin(angle);  // -1 = all to left. +1 = all to right. 0 = balanced

  // left ear.
  for(int i=istart; i<istop; i++) {
    double t = (float)i/float(fRate) - time;
    float f = sin(t*freq*2*M_PI)*mag/d2;
    fData[i*2]   += f*(1.0-adjust*fPanScale);   // Left ear
  }

  // Right ear is delayed or forshortened by a bit
  float phase_delay = -fEarDistance*adjust/fSpeedSound;  
  istart = (int)((time+phase_delay)*fRate);
  istop  = (int)((time+phase_delay+clickdur)*fRate);
  // right ear.
  for(int i=istart; i<istop; i++) {
    double t = (float)i/float(fRate) - time - phase_delay;
    float f = sin(t*freq*2*M_PI)*mag/d2;
    fData[i*2+1] += f*(1.0+adjust*fPanScale);   // Right ear
  } 
}

void Sample::CreateZing(float timestart, float dur, float freq, float mag, float x1, float y1, float z1, float x2, float y2, float z2)
{
  int framedur = (int)(dur*fRate);
  int istart = (int)(timestart*fRate);

  for(int i=0;i<framedur;i++) {
    // At this time,
    double t= i/(double)fRate;
    // This is where the particle is
    double x = x1 + t/dur*(x2-x1);
    double y = y1 + t/dur*(y2-y1);
    double z = z1 + t/dur*(z2-z1);
    float d2 = (x-fListenerX)*(x-fListenerX)
             + (y-fListenerY)*(y-fListenerY)
             + (z-fListenerZ)*(z-fListenerZ);
    double d = sqrt(d2);
    // Here's the position wrt the listener
    double angle = atan2(x,z);
    double adjust = sin(angle);  // -1 = all to left. +1 = all to right. 0 = balanced
    // This is how long it takes for the sound to get to the left ear.
    double delay_left = d/fSpeedSound;
    // To get to the right ear, there's a small delay (phase shift)
    double delay_right = delay_left;// -fEarDistance*adjust/fSpeedSound;
  
    // t-delay is the displacement of the sound wave at at a time a little while ago... this sound is only now arriving at the ear
    double y_l = sin((t-delay_left)*freq*2*M_PI)*mag/d2
                 * (1.0-adjust*fPanScale);
    double y_r = sin((t-delay_right)*freq*2*M_PI)*mag/d2
                * (1.0+adjust*fPanScale);
    // cerr << i << "\t"
    //       << t << "\t"
    //       << t-delay_left << "\t"
    //       << sin((t-delay_left)*freq*2*M_PI) << "\t"
    //       << sin((t-delay_left)*freq*2*M_PI)*mag/d2<< "\t"
    //       << y_l << endl;
     fData[(i+istart)*2]    += y_l;
    fData[(i+istart)*2+1]  += y_r;    
  }

}


double Rndm()
{
   static int fSeed = 65539;
   const double kCONS = 4.6566128730774E-10; // (1/pow(2,31))
   fSeed = (1103515245 * fSeed + 12345) & 0x7fffffffUL;

   if (fSeed) return  kCONS*fSeed;
   return Rndm();
}


void Sample::CreateWhiteNoise(const vector<float>& envelope)
{
   int nenv = envelope.size();
  for(int i=0;i<fFrames;i++) {
    double frac = double(i)/double(fFrames);
    int ienv = (int)(frac*nenv);
    double A = envelope[ienv];
    double f = A * Rndm();
    fData[i*2]    += f;
    fData[i*2+1]  += f;     
  }
}



void Sample::WriteFile(const char* filename)
{
  SF_INFO sfinfo;
  memset (&sfinfo, 0, sizeof (sfinfo)) ;
  sfinfo.samplerate=fRate;
  sfinfo.channels = 2;
  sfinfo.format = SF_FORMAT_WAV | SF_FORMAT_PCM_16;
  SNDFILE* outfile = sf_open(filename, SFM_WRITE, &sfinfo);
  sf_set_string (outfile, SF_STR_TITLE, "My Title") ;
  sf_set_string (outfile, SF_STR_COMMENT, "My Comment") ;
	sf_set_string (outfile, SF_STR_SOFTWARE, "sound.cc") ;
	sf_set_string (outfile, SF_STR_COPYRIGHT, "No copyright.") ;
  sf_write_float(outfile,fData,fFrames*2);
  sf_close(outfile);
}

void Sample::WriteStdOut()
{
  // This don't work for many reasons.
  // One being that wav format needs file length at start, so this doesn't work with streaming.
  // AU format is supposed to fix that, but it doesn't seem to work either.
  //
  // So, never mind.
  //
  // fprintf(stdout,"Content-Type: audio/x-wav\nContent-Transfer-Encoding: binary\n\n");
  // fflush(stdout);

  SF_INFO sfinfo;
  memset (&sfinfo, 0, sizeof (sfinfo)) ;
  sfinfo.samplerate=fRate;
  sfinfo.channels = 2;
  sfinfo.format = SF_ENDIAN_CPU | SF_FORMAT_AU | SF_FORMAT_FLOAT;
  sfinfo.frames = 0x7FFFFFFF;
  SNDFILE* outfile = sf_open_fd(1, SFM_WRITE, &sfinfo,true);
  //   sf_set_string (outfile, SF_STR_TITLE, "My Title") ;
  //   sf_set_string (outfile, SF_STR_COMMENT, "My Comment") ;
  // sf_set_string (outfile, SF_STR_SOFTWARE, "sound.cc") ;
  // sf_set_string (outfile, SF_STR_COPYRIGHT, "No copyright.") ;
  sf_write_float(outfile,fData,fFrames*2);
  sf_close(outfile);
}

vector<string> tokenize(const char* seperators, string s)
{
  string::size_type start = 0;
  string::size_type end = string::npos;

  vector<string> elements;
  while( start < s.length() ){
    end=s.find_first_of(seperators,start);
    // cerr << start << "\t" << end << "\t" << string(s,start,end) << "\n";
    if(end-start>0) {
      string elem(s,start,end-start);
      elements.push_back(elem);
    }
    start = end;
    if(end<string::npos) start=end+1;
  }
  return elements;
}

int main(int argc, char *argv[])
{
  // Useage:
  // command outfilename argumentstring
  const char* filename = "blah.wav";
  const char* data = getenv("QUERY_STRING");
  if(argc>1) {
    filename = argv[1];
  }
  if(argc>2) {
    data = argv[2];    
  }
  
  ofstream log("sound.cc.log");
  log << "Running with data=" << data << endl;
  
  // Parse data.
  if(!data) return 1;
  string d(data);
  string::size_type start = 0;
  string::size_type end = string::npos;
  
  vector<string> elements = tokenize("&?",d);
  
  vector<string> key;
  vector<string> valuestring;
  vector<vector<float> > values;
  for(unsigned int i=0;i<elements.size();i++) {
    end = elements[i].find_first_of('=');
    key.push_back(string(elements[i],0,end));
    valuestring.push_back(string(elements[i],end+1));
    // sepearate by commas or spaces.
    vector<string> vs = tokenize(" ,",valuestring[i]);
    vector<float> v(vs.size());
    for(unsigned int j=0;j<vs.size();j++) {
      float f=-9999;
      sscanf(vs[j].c_str(),"%f",&f);
      v[j]=f;
    }
    values.push_back(v);
    // cerr << elements[i] 
    //      << "\t" << key[i]
    //      << "\t" << valuestring[i] << "\t";
    // for(int j=0;j<v.size();j++) cerr << v[j] << " : ";
    // cerr << endl;    
  }
  
  Sample s(1.0);
  
  // Configurables.
  for(unsigned int i=0;i<key.size();i++) {
    if(key[i].compare("dur")==0) {
      float dur = values[i][0];
      s.Reset(dur);
      log << "Duration:" << dur << endl;
    }
    if(key[i].compare("listener")==0) {
      s.fListenerX = values[i][0];
      s.fListenerY = values[i][1];
      s.fListenerZ = values[i][2];
      log << "Listener:" << s.fListenerX << ","<< s.fListenerY << ","<< s.fListenerZ << "," << endl;
      
    }
    if(key[i].compare("soundspeed")==0) {
      s.fSpeedSound = values[i][0];
      log << "speed of sound:" << s.fSpeedSound << endl;
      
    }
  }
  
  

  // Loop through options.
  for(unsigned int i=0;i<key.size();i++) {
    if(key[i].compare(0,3,"vtx")==0) {
      // It's a vertex.
      float x = values[i][0];
      float y = values[i][1];
      float z = values[i][2];
      float t = values[i][3];
      float freq = 3000;
      float mag = 20;
      s.CreateClick(t,3000,mag,x,y,z);
      log << "Click t=" << t << " f=" << freq << " xyz:" << x << "," << y << "," << z  << endl;
    }
    if(key[i].compare(0,3,"trk")==0) {
      // It's a track.
      float x = values[i][0];
      float y = values[i][1];
      float z = values[i][2];
      float t = values[i][3];
      float x2 = values[i][4];  // mom'm in MeV/c
      float y2 = values[i][5];
      float z2 = values[i][6];
      float dur = values[i][7];
      float freq = values[i][8];
      float mag =  values[i][9];
      s.CreateZing(t,dur,  // time, duration
                   freq, mag,  // freq mag
                   x,y,z,   // start coords
                   x2,y2,z2 // end coords
                   );
      log << "Zing t=" << t << " duration=" << dur 
          << " freq=" << freq << " mag=" << mag
          << " xyz:" << x <<"," <<y <<"," <<z 
          << " xyz2: " << x2 <<"," <<y2 << "," <<z2 
          << endl;
      
    }
    if(key[i].compare(0,5,"noise")==0) {
      s.CreateWhiteNoise(values[i]);
    }
  }
  
  // s.CreateClick(0.5,2000,1.0,-1,0,0);
  // s.CreateZing(0.5,0.4,  // time, duration
  //             1000,0.2,   // freq mag
  //             -1,0,0,     // start coords
  //             2,0,4       // end coords
  //             );
  // s.CreateZing(0.5,0.1,  // time, duration
  //             5120,0.5,   // freq mag
  //             -1,0,4,     // start coords
  //             -2,0,2       // end coords
  //             );
  s.WriteFile(filename);
  // s.WriteStdOut();
}

