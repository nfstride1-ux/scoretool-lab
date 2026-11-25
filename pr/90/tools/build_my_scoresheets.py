"""Build data/my_scoresheets.json from Archer's Diary pages saved on Nathe's PC (read-only GETs, no login):
MyEvents.aspx (archer = Nathaniel Stride, Discipline: View All) lists every event with its ViewScoresheet link;
each ViewScoresheet.aspx page is parsed end by end. Real data only: blank ends stay blank (round not finished)."""
import re,html,json,os,sys
SRC=sys.argv[1] if len(sys.argv)>1 else '/workspace/archersdiary/run3'
OUT=os.path.join(os.path.dirname(__file__),'..','data','my_scoresheets.json')
cells=lambda row:[html.unescape(re.sub(r'<[^>]+>','',c)).replace('\xa0',' ').strip() for c in re.findall(r'<td[^>]*>(.*?)</td>',row,re.S)]
g=open(f'{SRC}/myevents_member.html',encoding='utf-8',errors='replace').read()
tb=g[g.find('id="ctl00_mainContent_GridView1"'):];tb=tb[:tb.find('</table>')]
def iso(d):a=d.split('/');return f"{a[2]}-{a[1].zfill(2)}-{a[0].zfill(2)}"
val=lambda a:10 if a=='X' else 0 if a in('M','') else int(a) if a.isdigit() else None
out=[];nend=0
for tr in re.findall(r'<tr>(.*?)</tr>',tb,re.S):
    m=re.search(r'href="(ViewScoresheet\.aspx\?[^"]+)"',tr)
    if not m:continue
    c=cells(tr);u=html.unescape(m.group(1));q=dict(re.findall(r'(\w+)=([^&]+)',u))
    r=dict(d=iso(c[3]),ev=re.sub(r'\s+',' ',c[0]),club=c[1],disc=c[2],cls=c[6],div=c[7],rd=re.sub(r'\s+',' ',c[8]).strip(),sc=int(c[9]) if c[9].isdigit() else 0,rt=c[10],url='https://archersdiary.com/'+u,ds=[])
    fn=f"{SRC}/sheets/sheet_{q['fid']}_{q['eid']}.html"
    if os.path.exists(fn):
        s=open(fn,encoding='utf-8',errors='replace').read()
        for t in re.findall(r'<table id="[^"]*tblScoresheet".*?</table>',s,re.S):
            trs=re.findall(r'<tr>(.*?)</tr>',t,re.S);head=cells(trs[0]) if trs else []
            dist=next((h[9:].strip() for h in head if h.startswith('Distance:')),'')
            face=head[1] if len(head)>1 and not head[1].startswith('Start') else ('Field' if r['disc']=='Field' else '')
            ends=[]
            for x in trs[1:]:
                cc=cells(x)
                if len(cc)<6 or not cc[0].isdigit():continue
                if not re.match(r'^(\d+(\.\d+)?)?$',cc[-2]):continue
                ends.append([a.upper() for a in cc[1:-4]])
            r['ds'].append(dict(dist=dist,face=face,tg=[cells(x)[0] for x in trs[1:] if len(cells(x))>=6 and cells(x)[0].isdigit()] if r['disc']=='Field' else None,e=ends))
    shot=[e for d in r['ds'] for e in d['e'] if any(e)]
    tot=sum(val(a) or 0 for e in shot for a in e)
    blank=sum(1 for d in r['ds'] for e in d['e'] if not any(e))
    r['ok']=bool(shot) and tot==r['sc'] and all(val(a) is not None for e in shot for a in e)
    r['part']=blank>0 or not r['ok']
    for d in r['ds']:
        if d['tg'] is None:del d['tg']
    if r['ok']:nend+=1
    else:r['ds']=[]   # never show ends that don't add up to the published total
    out.append(r)
out.sort(key=lambda r:r['d'])
json.dump({'archer':'Nathaniel Stride','source':"Archer's Diary MyEvents + ViewScoresheet (public pages)",'fetched':'2026-10-17','sheets':out},open(OUT,'w'),separators=(',',':'))
print(len(out),'sheets,',nend,'with end detail,',sum(r['part'] for r in out),'partial')
