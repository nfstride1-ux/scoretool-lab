# Shared helpers for league_indoor_test.py and casual_indoor_test.py (indoor 3-spot scoring must match Just me).
# Throwaway test profile only; the relay is mocked in memory, so nothing reaches the real public relay.
import json
# 30 arrow positions on the vertical 3-spot (global face coordinates), made on the page with the app's own plotScore: each one sits
# well away from a ring edge (its value does not change if nudged), so phones with different face sizes score the same arrows the same.
GEN=r"""(rn)=>{const FR=face3R(faceR(ROUNDS[rn],0),{face3:'vert'});let s=4242;const rnd=()=>(s=(s*1103515245+12345)%2147483648)/2147483648;const C=[[0,-0.62],[0,0],[0,0.62]],out=[];
 for(let n=0;n<30;n++){const c=C[n%3];for(let t=0;t<800;t++){const r=Math.sqrt(rnd())*0.31,a=rnd()*6.283,x=+(c[0]+r*Math.cos(a)).toFixed(3),y=+(c[1]+r*Math.sin(a)).toFixed(3),v=plotScore(x,y,FR);let ok=true;
  for(let k=0;k<8;k++)if(plotScore(x+0.007*Math.cos(k*.785),y+0.007*Math.sin(k*.785),FR)!=v)ok=false;if(ok){out.push([x,y,v]);break}}}return out}"""
def click_face(pg,fid,x,y):
  """tap the face at face coordinates (x,y), through the svg's own transform; the tap must land inside the phone screen"""
  pg.evaluate("id=>{const e=document.querySelector('#'+id);e&&e.scrollIntoView({block:'nearest'})}",fid)
  q=pg.evaluate("([id,x,y])=>{const sv=document.querySelector('#'+id),p=sv.createSVGPoint();p.x=x;p.y=y;const r=p.matrixTransform(sv.getScreenCTM());return[r.x,r.y,innerWidth,innerHeight]}",[fid,x,y])
  assert 0<q[0]<q[2] and 0<q[1]<q[3],('tap outside the screen',q)
  pg.mouse.click(q[0],q[1]);pg.wait_for_timeout(220)
def snap(pg):
  return pg.evaluate("()=>{const o={};for(let i=0;i<localStorage.length;i++){const k=localStorage.key(i);o[k]=localStorage.getItem(k)}return o}")
