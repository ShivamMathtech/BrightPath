"""Optional asset regeneration only. Needs Pillow and ffmpeg; neither is needed to run the app."""
from PIL import Image, ImageDraw, ImageFont
from pathlib import Path
import subprocess, math
ROOT=Path(__file__).resolve().parents[1]
OUT=ROOT/'client/public/media'
OUT.mkdir(parents=True,exist_ok=True)
font_path='/usr/share/fonts/truetype/dejavu/DejaVuSans.ttf'
def font(n):return ImageFont.truetype(font_path,n)
W,H,FPS,DURATION=960,540,24,24
process=subprocess.Popen(['ffmpeg','-y','-hide_banner','-loglevel','error','-f','rawvideo','-vcodec','rawvideo','-pix_fmt','rgb24','-s',f'{W}x{H}','-r',str(FPS),'-i','-','-an','-c:v','libx264','-preset','fast','-crf','23','-pix_fmt','yuv420p','-movflags','+faststart',str(OUT/'waves.mp4')],stdin=subprocess.PIPE)
for frame in range(FPS*DURATION):
 t=frame/FPS
 img=Image.new('RGB',(W,H),'#edf4ff');d=ImageDraw.Draw(img)
 d.text((58,36),'BRIGHTPATH  /  PHYSICS EVERYDAY',font=font(13),fill='#86a2c3')
 d.text((56,74),'Waves carry energy.',font=font(36),fill='#456b99')
 title,caption=('A pattern moves through the medium.','Watch the disturbance travel from left to right.') if t<8 else ('Particles oscillate around equilibrium.','The highlighted particle moves up and down.') if t<16 else ('Speed = frequency × wavelength','A wave transfers energy without carrying the medium along with it.')
 d.text((58,136),title,font=font(19),fill='#859fbd')
 for x in range(65,896,17):d.line((x,280,x+7,280),fill='#c6d7eb',width=2)
 points=[(x,280-68*math.sin((x-70)*2*math.pi/300-t*math.pi)) for x in range(70,891,2)]
 d.line(points,fill='#7eacf1',width=4)
 for x in range(70,891,20):
  y=280-68*math.sin((x-70)*2*math.pi/300-t*math.pi)
  d.ellipse((x-4,y-4,x+4,y+4),fill='#6298e8')
 x=450;y=280-68*math.sin((x-70)*2*math.pi/300-t*math.pi)
 if t>=8:
  d.line((x,202,x,358),fill='#e7c791',width=2)
  d.ellipse((x-9,y-9,x+9,y+9),fill='#edb46c',outline='#ffffff',width=3)
  d.text((395,372),'One particle',font=font(12),fill='#b1956b')
 d.line((665,193,828,193),fill='#9ab8dd',width=3);d.polygon([(828,193),(815,186),(815,200)],fill='#9ab8dd')
 d.text((664,168),'Energy travels right',font=font(12),fill='#8da8c9')
 d.rounded_rectangle((55,435,905,499),radius=12,fill='#ffffff')
 d.text((75,457),caption,font=font(15),fill='#8b9eb7')
 process.stdin.write(img.tobytes())
process.stdin.close()
if process.wait()!=0:raise SystemExit('ffmpeg could not encode the lesson')
(OUT/'waves.vtt').write_text('''WEBVTT

00:00.000 --> 00:08.000
A wave is a disturbance that carries energy through a medium.

00:08.000 --> 00:16.000
Particles move up and down while the transverse wave travels right.

00:16.000 --> 00:24.000
Wave speed = frequency × wavelength. The diagram is a simplified model.
''')
print('Created waves.mp4 and captions (24 seconds, 960 × 540).')
