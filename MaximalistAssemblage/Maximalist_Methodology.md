---
title: "Maximalist Methods for a Maximalist Assemblage"
subtitle: "Search, Screening, Retrieval, Verification, and Document Production"
author: "Amy Traylor"
date: "October 14-22, 2026"
---

# Maximalist Methods for a Maximalist Assemblage

A Maximalist Assemblage needs a maximalist methodology and maximalist
methods.

A maximalist methodology grew from the creation of tools for maximalist methods to:

- search the existing literature
- examine the scope and breadth of the corpus
- place permeable breathable boundaries around texts to include and texts to exclude
- read with and through the texts word by word and phrase by phrase
- to work the texts like clay
- massage an amorphous non-linear body without organs into linear flow
- to chunk and rework, assemble and disassemble
- to root back to ground by ensuring provenance to source

## Collecting Materials

### Purpose and scope of this section

This section documents the guiding philosophy, methodology, and methods by
which the literature underlying this dissertation was located, screened,
retrieved, indexed, verified, and incorporated into text. The methodology for
a maximalist assemblage developed over numerous search rounds. This document
covers searches starting in spring 2025, but the end date is open until the
final christening of the submitted PhD thesis. Search terms and focus
expanded and contracted, as a Deleuzian (and
Guattari?) body without organs, along with the guiding research questions,
with a key narrowing in fall 2025 after the selection of three comprehensive
exam questions. After the submission of the comprehensive exam in April 2026,
the research began its rhythmic expanding and contracting again to fill the
new space created by conversations/ponderings with committee members and my
own living process of exploration.

Kikkok turned her candy laces in her hands. Richardson carried words in her
pockets, turning them over in her hands like stones. If my hands were code, I
would shape the texts in my hands like clay. Code is a thing "to hand" like
Bourdieu's habitus. Searches are things. Citations are things. Notions and
theorists and theories, all things. They shimmer and glow, pliable material.

- An exploratory round in spring 2025 (May, with a coda in August) swept the
  dissertation's social-theory and arts-based-research lineage.
- The comprehensive examination round in September 2025 swept the
  new-materialist and posthumanist literature and established the screening,
  retrieval, indexing, and verification machinery that produced the
  examination document in April 2026.
- A forward-citation round in May 2026 moved from keyword search to
  citation-cluster tracing.
- A conceptual-vocabulary round in August and September 2026 swept the
  dissertation's own emerging terms.
- A fifth body of searches focuses on art-and-quantum in April and May 2026
- Add more recent searches...

> **[STILL TO MONITOR. Round four is open: it ran on 24 August, 20 and 21
> September, and 21 October 2026, and the 21 October searches are not yet in
> the list above. The round numbers and dates here follow the order of the
> work as reconstructed from the files, so any further searching needs adding
> to both the list and its round.]**

## 1. Design of the search

### 1.1 Rationale

A maximalist tool was created to collect every return for every given query.
I wanted all the results so that I could search them myself for patterns. I
created tools that poked at the data from multiple angles, looking for stray
citations, never dependent on a research repository's opaque
non-deterministic ranking system, unstable result count, or undocumented
retrieval ceiling.

The primary literature search read through the comprehensive exam questions:

What are the theoretical and methodological distinctions between posthumanism
and new materialism? How have other posthumanist theorists conceptualized
diffractive practice? How have new materialist theorists conceptualized art
practice as research?

Google Scholar was chosen as the primary index because the theoretical
ground, new materialism and posthumanism, are transdisciplinary, distributed
across a multitude of research areas, which are published in a mix of
journals, edited collections, monographs, theses, and institutional
repositories that no single disciplinary database covers well.

## 1.2 Exploring the Corpus

### Instrument one: browser-driven keyword sweeps

A Processing sketch driving Chrome through Selenium issued keyword queries
directly against scholar.google.com, paginated through the result list in
increments of twenty, and appended each result row to a CSV stamped with the
run's start time. This instrument answers the question what does the
literature on this topic look like.

Six rounds of searching used this instrument thus far, from May 2025 to
October 2026.


<style>
.cal{display:grid;grid-template-columns:1fr 360px;grid-auto-rows:112px;gap:0 28px}
.cal .mo{border-top:1px solid #D3C2CD;padding-top:6px;position:relative;overflow:hidden}
.cal .mo .lbl{font-size:11px;letter-spacing:0.06em;color:#92A2A6}
.cal .tx{border-top:1px solid transparent;padding-top:6px;font-size:13.5px;position:relative;overflow:visible}
.cal .tx.has{border-top:1px solid #D3C2CD}
.cal .tx p{margin:0 0 8px}
.cal .quiet{font-size:12px;color:#92A2A6;font-style:italic}
.calcap{font-size:12px;color:#92A2A6;margin:14px 0 24px;max-width:760px;line-height:1.45}
</style>

<div class="cal" id="cal"></div>

<p class="calcap">Figure 1. The 56 keyword queries of instrument one placed on the
months they were run, May 2025 to October 2026. One bubble per query, area
proportional to the records that query returned. 27,260 records across 56
queries; 9 of the 18 months carried searches and 9 carried none. Hover a bubble
for its query. Counts are per query as issued, before deduplication, and a count
of exactly 1,000 is Google Scholar's retrieval ceiling rather than a true total.
The forward-citation sweeps of 16 and 17 May 2026 are not shown here. Colour
marks the round, not a value. Source: search_results_all_rounds.csv, built from
the sweep CSVs under K:\OneDrive\Processing\Web Scrapers.</p>

<script>

(function(){
  // keyword searches only. The forward-citation sweeps of May 2026 are held
  // out until that analysis is done.
  var MONTHS=[
    ["2025-05","May 2025",[
      ["positionality AND intersectionality",1968],["“arts based research” AND posthuman*",1917],
      ["evocative object*",1837],["“POST QUALITATIVE” HAS NO END ALWAYS becomings",1180],
      ["assemblage as methodology",1158],["Sherry Turkle",1195],["bourdieuANDhabitus",920],
      ["“post qualitative”",890],["Turkle AND Papert",794],["Braidotti AND apparat*",768],
      ["“Karen Barad”",760],["positionality",608],["arts based research*",542],
      ["Sherry Turkle AND “evocative object”",464],["Donna Haraway",462],
      ["Erving Goffmann*",384],["Turkle AND Braidotti",358],["Seymour Papert",235],
      ["M.Scott Peck AND “map”",195],["Papert AND Braidotti",162],["assemblage",128],
      ["beings AND exist AND phenomena AND Barad",113],["Barad AND apparat*",81],
      ["Rosa Braidotti",80],["“sitting betwixt”",59],["critical auto-ethnography",40],
      ["beings AND exist phenomena",22],["“sitting betwixt” AND Papert",20],
      ["beings exist phenomena",19],["“sitting betwixt” AND Turkle",3]],0],
    ["2025-06","June 2025",[],0],
    ["2025-07","July 2025",[],0],
    ["2025-08","August 2025",[["math education AND arts based research",60]],0],
    ["2025-09","September 2025",[
      ["new materialism art education",1245],["Rosi Braidotti AND diffracti*",1134],
      ["Barad AND diffracti*",1040],["new materialism art practice research",1011],
      ["Deleuze AND diffracti*",983],["bourdieu AND quantum AND field AND entanglement",958],
      ["Jane Bennett vibrant matter",860],["graeme sullivan",427],
      ["new materialism makerspaces",281],["bourdieu AND quantum",127]],1],
    ["2025-10","October 2025",[["recode AND computer AND art",535]],1],
    ["2025-11","November 2025",[],0],
    ["2025-12","December 2025",[],0],
    ["2026-01","January 2026",[],0],
    ["2026-02","February 2026",[],0],
    ["2026-03","March 2026",[],0],
    ["2026-04","April 2026",[
      ["'Marcel Duchamp' AND quantum",976],["'Robert Rauschenberg' AND quantum",575],
      ["Duchamp AND quantum",175]],2],
    ["2026-05","May 2026",[
      ["'Merce Cunningham' AND quantum",667],["'Leonard Shlain'",316]],2],
    ["2026-06","June 2026",[],0],
    ["2026-07","July 2026",[],0],
    ["2026-08","August 2026",[
      ["Braidotti AND Papert",194],
      ["Papert AND transposition AND diffraction AND Braidotti AND computation AND Barad AND transcorporeality",37]],3],
    ["2026-09","September 2026",[
      ["possibility space",2023],["possibility space” AND posthum",755],
      ["transcorporeal AND transposition",717],["nexus theory",310],
      ["possibility space” AND posthumanANDtransposition",74]],3],
    ["2026-10","October 2026",[
      ["feminist AND location AND body AND posthuman* AND “Adrienne Rich”",1074],
      ["“feminist location”",80]],3]
  ];

  var TEXT={
    "2025-05":"<p>This round featured theories/theorists and notions already present in my academic life before the PhD program, with a few new notions layered on top as old theorists and new began to congregate.</p><p>As the code converses with the website and collects the citations page by page, I watch and scroll through the results as the code politely waits before attempting a new page. Frequently phrases will glimmer and speak, later becoming their own search terms.</p>",
    "2025-08":"<p><strong>[TO WRITE: the single August search, math education and arts based research, three months after the May block.]</strong></p>",
    "2025-09":"<p><strong>[TO WRITE: Sullivan on the 1st, Bourdieu against quantum on the 2nd, then the examination sweeps from the 24th. The narrowing.]</strong></p>",
    "2025-10":"<p><strong>[TO WRITE: recode and computer and art, alone in October.]</strong></p>",
    "2026-04":"<p><strong>[TO WRITE: the examination submitted, and the opening to mid-century artists at the moment quantum physics entered general culture.]</strong></p>",
    "2026-05":"<p><strong>[TO WRITE: Cunningham and Shlain by keyword. The forward-citation sweeps of the 16th and 17th are held out of this calendar until that analysis is done.]</strong></p>",
    "2026-08":"<p><strong>[TO WRITE: Braidotti and Papert together, and the seven-term query.]</strong></p>",
    "2026-09":"<p><strong>[TO WRITE: searching my own vocabulary.]</strong></p>",
    "2026-10":"<p><strong>[TO WRITE: feminist location and Adrienne Rich.]</strong></p>"
  };

  var FILL=["#6777B6","#849E15","#D8560E","#B28622"];
  var cal=document.getElementById("cal");
  function E(s,a){var e=document.createElementNS("http://www.w3.org/2000/svg",s);
    for(var k in a)e.setAttribute(k,a[k]);return e;}

  var gmax=0,i,j;
  for(i=0;i<MONTHS.length;i++)for(j=0;j<MONTHS[i][2].length;j++)
    if(MONTHS[i][2][j][1]>gmax)gmax=MONTHS[i][2][j][1];
  var K=17/Math.sqrt(gmax);

  var W=352,BH=84;
  for(i=0;i<MONTHS.length;i++){
    var key=MONTHS[i][0],name=MONTHS[i][1],qs=MONTHS[i][2],band=MONTHS[i][3];

    var tx=document.createElement("div");
    tx.className="tx"+(TEXT[key]?" has":"");
    tx.innerHTML=TEXT[key]||"";
    cal.appendChild(tx);

    var mo=document.createElement("div");
    mo.className="mo";
    var lbl=document.createElement("div");
    lbl.className="lbl";lbl.textContent=name;mo.appendChild(lbl);

    if(!qs.length){
      var q=document.createElement("div");
      q.className="quiet";q.textContent="no searches";mo.appendChild(q);
    } else {
      var svg=E("svg",{viewBox:"0 0 "+W+" "+BH,role:"img",
        "aria-label":name+": "+qs.length+" search"+(qs.length>1?"es":"")+", sized by records returned."});
      svg.setAttribute("style","width:100%;height:auto;display:block");
      var n=qs.map(function(d,ix){
        var r=Math.max(3,K*Math.sqrt(d[1]));
        return {label:d[0],v:d[1],r:r,
                x:20+(ix*37)%(W-40),y:BH/2+((ix%3)-1)*16+(Math.random()-0.5)*6};
      });
      n.sort(function(a,b){return b.r-a.r;});
      for(var t=0;t<420;t++){
        for(var a1=0;a1<n.length;a1++){
          var a=n[a1];
          a.y+=(BH/2-a.y)*0.05;
          for(var b1=a1+1;b1<n.length;b1++){
            var b=n[b1],dx=b.x-a.x,dy=b.y-a.y,d=Math.sqrt(dx*dx+dy*dy)||0.01,m=a.r+b.r+2.2;
            if(d<m){var o=(m-d)/d*0.5;dx*=o;dy*=o;a.x-=dx;a.y-=dy;b.x+=dx;b.y+=dy;}
          }
          a.x=Math.max(a.r+1,Math.min(W-a.r-1,a.x));
          a.y=Math.max(a.r+1,Math.min(BH-a.r-1,a.y));
        }
      }
      n.forEach(function(d){
        var c=E("circle",{cx:d.x,cy:d.y,r:d.r,fill:FILL[band],
                          "fill-opacity":0.85,stroke:"#ffffff","stroke-width":1});
        var ti=E("title",{});ti.textContent=d.label;c.appendChild(ti);
        svg.appendChild(c);
      });
      mo.appendChild(svg);
    }
    cal.appendChild(mo);
  }
})();

</script>


#### Round one: 9 to 13 May 2025, with a coda on 21 August

<style>
.railfig{display:flex;flex-wrap:wrap;gap:28px;align-items:flex-start}
.railtext{flex:1 1 380px;min-width:300px}
.railviz{flex:0 1 340px;min-width:270px}
</style>

<div class="railfig">
<div class="railtext" markdown="1">

This round featured theories/theorists and notions already present in my
academic life before the PhD program, with a few new notions layered on top
as old theorists and new began to congregate. Old and new abstractions also
converse with new to me spaces like math education, the focus of my then
concurrent adjunct position and research project exploring "math as art
material."

I have carried Bourdieu in my head since 1997ish, compliments of Dr.
Richardson's social anthropology course at Lousiana State University. I had
already seen previous interest Sherry Turkle mentioned briefly in Jane
Bennett as another sort of theorist interested in things, so I wanted to
further explore whether Bourdieu showed up in posthumanism/quantum, so as to
connect more threads between time, space, and place.

Add Kerouac quote, and they danced down the road like dingledodies, and I
shambled after....

As the code converses with the website and collects the citations page by
page, I watch and scroll through the results as the code politely waits
before attempting a new page. Frequently phrases will glimmer and speak,
later becoming their own search terms. Thus begat the search for "sitting
betwixt" and "post qualitative has no end always becomings." Also note the
early rumblings of "assemblage as methodology."

var max=0,i;for(i=0;i<DATA.length;i++)if(DATA[i][1]>max)max=DATA[i][1];
  var K=50/Math.sqrt(max);
  var n=DATA.map(function(d,ix){
    var r=Math.max(5,K*Math.sqrt(d[1]));
    return {label:d[0],v:d[1],day:d[2],r:r,
            x:W/2+(ix%7-3)*70+(Math.random()-0.5)*30,
            y:120+Math.floor(ix/7)*70+(Math.random()-0.5)*30,
            ph:Math.random()*6.28};
  });
  n.sort(function(a,b){return b.r-a.r;});

for(var t=0;t<800;t++){
    for(i=0;i<n.length;i++){
      var a=n[i];
      a.x+=(W/2-a.x)*0.012; a.y+=(H/2+10-a.y)*0.016;
      for(var j=i+1;j<n.length;j++){
        var b=n[j],dx=b.x-a.x,dy=b.y-a.y,d=Math.sqrt(dx*dx+dy*dy)||0.01,m=a.r+b.r+9;
        if(d<m){var o=(m-d)/d*0.5;dx*=o;dy*=o;a.x-=dx;a.y-=dy;b.x+=dx;b.y+=dy;}
      }
      a.x=Math.max(a.r+2,Math.min(W-a.r-2,a.x));
      a.y=Math.max(a.r+26,Math.min(H-a.r-2,a.y));
    }
  }

var x0=1e9,x1=-1e9,y0=1e9,y1=-1e9;
  for(i=0;i<n.length;i++){var q=n[i];
    if(q.x-q.r<x0)x0=q.x-q.r; if(q.x+q.r>x1)x1=q.x+q.r;
    if(q.y-q.r<y0)y0=q.y-q.r; if(q.y+q.r>y1)y1=q.y+q.r;}
  var PAD=6,BAND=30;
  var vx=x0-PAD, vy=y0-BAND;
  svg.setAttribute("viewBox", vx+" "+vy+" "+((x1-x0)+PAD*2)+" "+((y1-y0)+BAND+PAD));
  var legendX=vx+8, legendY=vy+14;

for(i=0;i<DAYS.length;i++){
    svg.appendChild(E("circle",{cx:legendX+6+i*96,cy:legendY,r:5,fill:FILL[i]}));
    var lt=E("text",{x:legendX+16+i*96,y:legendY+4,"font-size":11,fill:"currentColor"});
    lt.textContent=DAYS[i];svg.appendChild(lt);
  }

var nodes=n.map(function(q){
    var c=E("circle",{cx:q.x,cy:q.y,r:q.r,fill:FILL[q.day],
                      "fill-opacity":0.82,stroke:"#ffffff","stroke-width":1.2});
    var ti=E("title",{});ti.textContent=q.label+": "+q.v.toLocaleString()+" records, "+DAYS[q.day];
    c.appendChild(ti);svg.appendChild(c);
    var tx=null;
    if(q.r>=26){
      tx=E("text",{x:q.x,y:q.y+4,"text-anchor":"middle","font-size":(q.r>=40?12:10),
                   fill:"#ffffff","pointer-events":"none"});
      tx.textContent=q.v.toLocaleString();svg.appendChild(tx);
    }
    return {q:q,c:c,tx:tx};
  });

var byDay=[[],[],[],[]];
  for(i=0;i<nodes.length;i++)byDay[nodes[i].q.day].push(nodes[i]);
  var h='<table style="border-collapse:collapse;width:100%">';
  h+='<caption style="text-align:left;font-size:11px;opacity:0.65;padding-bottom:6px">'
   + 'Records returned per query</caption>';
  for(var dd=0;dd<4;dd++){
    if(!byDay[dd].length)continue;
    byDay[dd].sort(function(p,r){return r.q.v-p.q.v;});
    h+='<tr><th colspan="2" style="text-align:left;padding:9px 0 3px;font-size:11px;'
     + 'border-bottom:1px solid #D3C2CD;font-weight:normal;letter-spacing:0.04em">'
     + '<span style="display:inline-block;width:8px;height:8px;border-radius:50%;background:'
     + FILL[dd]+';margin-right:6px"></span>'+DAYS[dd]+' 2025</th></tr>';
    for(i=0;i<byDay[dd].length;i++){
      var q=byDay[dd][i].q;
      h+='<tr data-q="'+q.label.replace(/"/g,"&quot;")+'">'
       + '<td style="padding:2px 8px 2px 14px">'+q.label.replace(/</g,"&lt;")+'</td>'
       + '<td style="padding:2px 0;text-align:right;white-space:nowrap">'
       + q.v.toLocaleString()+'</td></tr>';
    }
  }
  h+='</table>';
  var list=document.getElementById("r1list");
  list.innerHTML=h;

function mark(nd,row,on){
    nd.c.setAttribute("fill-opacity",on?1:0.82);
    nd.c.setAttribute("stroke",on?"#2B2B23":"#ffffff");
    nd.c.setAttribute("stroke-width",on?2:1.2);
    row.style.background=on?"#F8CABA":"";
  }
  var rows=list.querySelectorAll("tr[data-q]");
  for(i=0;i<rows.length;i++){
    (function(row){
      var nd=null,k;
      for(k=0;k<nodes.length;k++)if(nodes[k].q.label===row.getAttribute("data-q"))nd=nodes[k];
      if(!nd)return;
      row.addEventListener("mouseenter",function(){mark(nd,row,true);});
      row.addEventListener("mouseleave",function(){mark(nd,row,false);});
      nd.c.addEventListener("mouseenter",function(){mark(nd,row,true);});
      nd.c.addEventListener("mouseleave",function(){mark(nd,row,false);});
    })(rows[i]);
  }

Round one ran on three days in May 2025 with a coda in August. Thirty-one
queries returned 17,422 records. The calendar at the right carries every one
of them in the order it was run.

</div>
<div class="railviz">
<svg id="rail1" role="img"
     aria-label="The thirty-one queries of round one in the order they were run, 9 May to 21 August 2025, sized by records returned."
     style="width:100%;height:auto"></svg>
</div>
</div>

<script>
(function(){
  var DATA=[
   ["9 May 2025",[
     ["evocative object*",1837],["Sherry Turkle",1195],["Turkle AND Papert",794],
     ["Sherry Turkle AND “evocative object”",464],["Donna Haraway",462],
     ["Turkle AND Braidotti",358],["Seymour Papert",235],["M.Scott Peck AND “map”",195],
     ["Papert AND Braidotti",162],["Rosa Braidotti",80]]],
   ["12 May 2025",[
     ["bourdieuANDhabitus",920],["positionality",608],["arts based research*",542],
     ["Erving Goffmann*",384]]],
   ["13 May 2025",[
     ["positionality AND intersectionality",1968],["“arts based research” AND posthuman*",1917],
     ["“POST QUALITATIVE” HAS NO END ALWAYS becomings",1180],
     ["assemblage as methodology",1158],["“post qualitative”",890],
     ["Braidotti AND apparat*",768],["“Karen Barad”",760],["assemblage",128],
     ["beings AND exist AND phenomena AND Barad",113],["Barad AND apparat*",81],
     ["“sitting betwixt”",59],["critical auto-ethnography",40],
     ["beings AND exist phenomena",22],["“sitting betwixt” AND Papert",20],
     ["beings exist phenomena",19],["“sitting betwixt” AND Turkle",3]]],
   ["21 August 2025",[
     ["math education AND arts based research",60]]]
  ];
  var FILL=["#6777B6","#849E15","#D8560E","#B28622"];
  var W=330, SPINE=34, RMAX=22, GAP=7;
  var svg=document.getElementById("rail1");
  function E(s,a){var e=document.createElementNS("http://www.w3.org/2000/svg",s);
    for(var k in a)e.setAttribute(k,a[k]);return e;}

  var max=0,g,i;
  for(g=0;g<DATA.length;g++)for(i=0;i<DATA[g][1].length;i++)
    if(DATA[g][1][i][1]>max)max=DATA[g][1][i][1];
  var K=RMAX/Math.sqrt(max);

  // lay out downward, measuring as we go
  var items=[], y=0;
  for(g=0;g<DATA.length;g++){
    y+=(g?18:6);
    items.push({kind:"band",label:DATA[g][0],y:y,day:g});
    y+=14;
    for(i=0;i<DATA[g][1].length;i++){
      var v=DATA[g][1][i][1], r=Math.max(3.5,K*Math.sqrt(v));
      var slot=Math.max(2*r, 15)+GAP;
      y+=slot/2;
      items.push({kind:"dot",label:DATA[g][1][i][0],v:v,r:r,y:y,day:g});
      y+=slot/2;
    }
  }
  var H=y+10;
  svg.setAttribute("viewBox","0 0 "+W+" "+H);

  // the spine
  svg.appendChild(E("line",{x1:SPINE,y1:10,x2:SPINE,y2:H-6,
                            stroke:"#D3C2CD","stroke-width":1}));

  for(i=0;i<items.length;i++){
    var it=items[i];
    if(it.kind==="band"){
      svg.appendChild(E("line",{x1:SPINE-9,y1:it.y,x2:SPINE+9,y2:it.y,
                                stroke:"#92A2A6","stroke-width":1.5}));
      var bt=E("text",{x:SPINE+14,y:it.y+4,"font-size":11,fill:"currentColor",
                       "letter-spacing":"0.05em"});
      bt.textContent=it.label;svg.appendChild(bt);
    } else {
      var c=E("circle",{cx:SPINE,cy:it.y,r:it.r,fill:FILL[it.day],
                        "fill-opacity":0.85,stroke:"#ffffff","stroke-width":1});
      var ti=E("title",{});ti.textContent=it.label;c.appendChild(ti);
      svg.appendChild(c);
      var tx=E("text",{x:SPINE+Math.max(it.r,6)+8,y:it.y+3.5,"font-size":10.5,
                       fill:"currentColor"});
      tx.textContent=it.label;svg.appendChild(tx);
    }
  }

  // widen the frame if any label runs past it
  var right=W, ts=svg.querySelectorAll("text");
  for(i=0;i<ts.length;i++){
    var bb=ts[i].getBBox(); if(bb.x+bb.width>right) right=bb.x+bb.width;
  }
  svg.setAttribute("viewBox","0 0 "+Math.ceil(right+6)+" "+H);
})();
</script>

#### Round two: 1 September to 13 October 2025

##### Graeme Sullivan, 1 September

A single query on a single day. `graeme sullivan` returned 427 records. The
titles are his ground rather than his name: practice as research, arts-based
research, studio, visual arts.

> **[TO WRITE: what sent me to Sullivan on 1 September, and what Art
> Practice as Research opened that the spring round had not.]**

##### Bourdieu and quantum, 2 September

The day after Sullivan, two queries put Bourdieu directly against quantum.
`bourdieu AND quantum AND field AND entanglement` returned 958 records and
`bourdieu AND quantum` returned 127 across two runs, 1,085 together. What
came back reads as the collision itself: quantum anthropology, habitus
reconfigured through posthumanism, the entanglement of the social realm,
Bourdieu from epistemology to ontology.

> **[TO WRITE: this is the question from round one asked directly. Whether
> Bourdieu showed up in posthumanism and quantum, and what the answer was.]**

##### The examination sweeps, 24 September to 13 October

Eight queries returned 7,089 records across three consecutive days in
September, with a coda in October.

| Day | Queries | Records |
|---|---|---|
| 24 Sept 2025 | 4 | 4,017 |
| 25 Sept 2025 | 2 | 1,526 |
| 26 Sept 2025 | 1 | 1,011 |
| 13 Oct 2025 | 1 | 535 |
| **Total** | **8** | **7,089** |

**24 Sept.** `Rosi Braidotti AND diffracti*` 1,134. `Barad AND diffracti*`
1,040. `Deleuze AND diffracti*` 983. `Jane Bennett vibrant matter` 860.

**25 Sept.** `new materialism art education` 1,245. `new materialism
makerspaces` 281.

**26 Sept.** `new materialism art practice research` 1,011.

**13 Oct.** `recode AND computer AND art` 535.

The first three queries of 24 September share one wildcard, `diffracti*`,
and differ only in the theorist attached to it. Four of the eight queries
returned over a thousand records each.

> **[TO WRITE: the narrowing. Three exam questions becoming eight queries,
> and what the diffracti* wildcard was for.]**

#### A fifth body of searches: 27 April and 15 May 2026, art and quantum

Five queries returned 2,709 records on two days after the examination was
submitted.

**27 April.** `'Marcel Duchamp' AND quantum` 976. `'Robert Rauschenberg' AND
quantum` 575. `Duchamp AND quantum` 175.

**15 May.** `'Merce Cunningham' AND quantum` 667. `'Leonard Shlain'` 316.

A sixth query that day, `Mattox+BMC`, returned nothing.

> **[TO WRITE: the post-examination opening. Mid-century artists at the
> moment quantum physics entered general culture, and why Shlain.]**

## 1.3 Exploring Influence

Because Barad was a frequently recurring source for many of the texts I
retrieved, I decided to explore the entire field of her influence by
collecting all the works in Google Scholar that cited Meeting the Universe
Halfway. Leonard Shlain's Art and Physics was a seminal work cited by art
educator/historian Graeme Sullivan when discussing the history of science and
art. I wanted to see where these two sources might overlap.

### Instrument two: API-mediated forward-citation sweeps.

A Python client queried the Google Scholar engine through the SerpAPI
service, using the `cites=` parameter to retrieve the set of works citing a
specific source cluster, sliced by publication year. This instrument answers
a different question: who has taken up this specific text, and when.

#### Round three: 16 and 17 May 2026

Twenty sweep sets against two citation clusters returned 10,813 records.
Barad's Meeting the Universe Halfway accounts for 9,184 of them, resolving to
4,821 distinct citing works once the overlapping year slices are
deduplicated. Shlain's Art and Physics accounts for 679.

> **[TO WRITE: what the field of Barad's influence looked like once I had all
> of it, and where it overlapped with Shlain.]**

## 1.4 Round four: 24 August 2026 onward, conceptual-vocabulary sweeps

The dissertation-stage sweeps differ from the examination sweeps in what they
search for. Rounds one through three searched for mostly literature by its
authors and its field names. Round four searched for conceptual vocabulary
with which I continued to ruminate as foundational structure of my process:
possibility space, transposition, transcorporeality, nexus theory.

Nine queries returned 5,264 records. This round searches the dissertation's
own terms rather than a field or a theorist.

| Day | Queries | Records |
|---|---|---|
| 24 Aug 2026 | 2 | 231 |
| 20 Sept 2026 | 1 | 2,023 |
| 21 Sept 2026 | 4 | 1,856 |
| 21 Oct 2026 | 2 | 1,154 |
| **Total** | **9** | **5,264** |

**24 Aug.** `Braidotti AND Papert` 194. `Papert AND transposition AND
diffraction AND Braidotti AND computation AND Barad AND transcorporeality`
37.

**20 Sept.** `"possibility space"` 2,023, run as two slices, 1900 to 2016
and 2016 to 2026.

**21 Sept.** `"possibility space" AND posthuman` 755. `transcorporeal AND
transposition` 717. `"nexus theory"` 310. `"possibility space" AND posthuman
AND transposition` 74.

**21 Oct.** `feminist AND location AND body AND posthuman* AND "Adrienne
Rich"` 1,074 across five runs. `"feminist location"` 80.

The seven-term query of 24 August is the widest Boolean in the whole
archive. It returned 37 records.

> **[TO WRITE: searching my own vocabulary. Possibility space, transposition,
> transcorporeality, nexus theory, and what it means to find out who else
> uses them.]**

## 2. Exploring With the Text

### Instrument three: text analysis

A Processing sketch reads the extracted text of each source, normalizes it,
writes out its reference list as a separate file, and counts every word
against a minimum-occurrence threshold. `CleanText.pde` flattens smart quotes
and strips anything outside printable ASCII. `Word.pde` holds the word and
its count. A second mode, `Compare2Texts.pde`, counts a word across two texts
at once and surfaces only the words that appear in one and not the other.

Where instruments one and two ask what literature exists and who has taken it
up, this one asks what a text says and what it says that another does not.

#### Close reading, arts-based research, August 2025

Twelve articles pulled as EBSCO full text on 16 August 2025, OCRd, and
extracted to plain text: Jones and Leavy, Leavy's Oxford Handbook chapter,
Sullivan, Rolling, Sinner, Pentassuglia, Belluigi, Boulton-Funke, Arce-Nazario,
Lopez-Pelaez Casellas, Ying Wang, Harasym et al.

A companion sketch runs the same pass across the whole folder with parallel
output directories for the arts-based-research set and the examination
corpus, so the word lists of one can be set against the other.

> **[TO WRITE: reading twelve articles as a set rather than one at a time,
> and what the comparison between this vocabulary and the examination corpus
> showed.]**

### Instrument four: full-text concordance

Instruments one and two read what Scholar says about a text. This one reads
inside the text. A Processing sketch walks the retrieved corpus, opens every
PDF, text file and JSON it finds, and records each occurrence of a keyword
with a thousand characters of context on either side. Each hit is bracketed
between the printed page numbers found above and below it, so a phrase
arrives already carrying a page.

Keywords are given as stems and expanded before the pass runs, which is why
`femini` catches feminist and feminism in one sweep, `reflecti` catches
reflection, reflective and reflexive, `transpos` catches transpose and
transposition, and `diffract` catches diffraction and diffractive.

The sketch also reports on the corpus as it goes. It measures the mean and
spread of characters per page, and a PDF below that threshold is judged
image-only, skipped, and written to a `needs_ocr` log. Eighteen of those logs
survive. Every concordance pass was therefore also an audit of which sources
had no readable text layer.

Eighteen passes between September 2025 and September 2026 returned 111,107
hits across 58 keywords.

| Date | Hits | Documents | Keywords |
|---|---|---|---|
| 25 Sept 2025 | 133 | 3 | Braidotti |
| 25 Sept 2025 | 184 | 3 | Braidotti, diffract |
| 26 Sept 2025 | 70,099 | 477 | 24 keywords |
| 17 Apr 2026 | 8,919 | 431 | diffract |
| 17 Apr 2026 | 16,898 | 431 | diffract, diffraction, diffractive, diffractive practice |
| 17 Apr 2026 | 1,750 | 75 | physics |
| 17 Apr 2026 | 1,750 | 75 | physics, re-run |
| 17 Apr 2026 | 54 | 36 | particle physics |
| 17 Apr 2026 | 10 | 8 | jump right in |
| 18 Apr 2026 | 587 | 65 | bateson |
| 18 Apr 2026 | 586 | 135 | conceptual art |
| 19 Apr 2026 | 3,035 | 384 | Engel, Rheinberger, Truman, Massey, Smelik, de Assis, Srnicek, and 11 more |
| 22 Apr 2026 | 947 | 74 | Trinh, Minh-ha |
| 22 Apr 2026 | 11 | 7 | Cambridge Archaeological Journal |
| 22 Apr 2026 | 2 | 2 | inherent ontological identity |
| 20 Sept 2026 | 4,867 | 296 | transpos, transduc, possibility space |
| 20 Sept 2026 | 545 | 142 | transpose, transduce, possibility space |
| 21 Sept 2026 | 730 | 224 | nexus |
| **Total** | **111,107** | | **58** |

The pass of 26 September 2025 is the largest single artifact in the search
record: 70,099 hits across 477 documents, from twenty-four keywords run
together. `femini` 15,382. `Deleuze` 9,130. `posthuman` 8,639. `reflecti`
6,820. `Barad` 6,490. `new material` 5,358. `diffract` 4,212. `Braidotti`
3,003. `Bennett` 2,569. `quantum` 1,977. `art education` 1,693. `algorithm`
1,500. `art practice` 1,417. `computation` 842. `vibrant matter` 841. Then a
long tail searched once each: `holograph` 55, `epigenetic` 51, `multiverse`
37, `extended cognition` 21, `postdisciplinarity` 18, `hologram` 15,
`precognition` 13, `altergorithm` 11, `networked affect` 5.

Five further passes returned nothing: `barad`, `second_order`, `thecut` and
`zoe` on 17 April 2026, and `barad2012` on 22 April. They are searches that
happened and found nothing, which is only visible because the sketch writes a
file either way.

> **[TO WRITE: what changes when the search moves inside the texts I already
> hold. The stems, the thousand characters of context, and the page brackets
> that let a phrase become a citation.]**

### Instrument five: concept co-occurrence

The examination turned on whether posthumanism and new materialism are the
same project. Rather than settle that from the secondary literature, the
corpus was measured for it. Every occurrence of each concept was recorded in
context, 31,504 for posthumanism and 40,001 for new materialism, then reduced
to one row per source file carrying the count of each, whether both appear,
and the smallest character distance between them.

That distance is the measure. A source where the two terms come within a few
dozen characters of each other is holding them together; one where the
nearest approach is thousands of characters apart mentions both without
relating them. An earlier run makes the window explicit, testing
co-occurrence within 200 characters across 7,376 matches.

765 source files carry the measure. A further 3,372 are marked as less than
full text and excluded from it, because a proximity measure cannot be taken
on an abstract. Three successive runs survive, over 940, then 1,172, then
1,172 files, as duplicates were removed and partial texts identified.

> **[TO WRITE: asking the corpus a question instead of asking the literature
> about itself. What min_gap_chars showed about the two terms.]**

### Instrument six: lexical analysis

Word frequency run across the extracted texts, both to characterize a single
source and to set two corpora against each other. The comps corpus yields
32,212 word types. 6,315 of them were removed as common words, and the
removals are kept in their own list rather than deleted, so the exclusion can
be read and disagreed with.

The transpositions chapters got the same treatment: a 38,767-row word list
keyed by text, 13,503 unique words, 4,606 extracted reference lines, and 277
parsed reference entries expanded to 455 rows where a single entry held more
than one work.

One sheet infers a title and author for each extracted text and records the
line it inferred each from, so an attribution can be checked rather than
trusted.

> **[TO WRITE: what a word list is for, and why the removed words matter as
> much as the kept ones.]**

### Instrument seven: coded close reading

The instruments above locate and measure. None of them reads. Dense sources
were read aloud, transcribed, and coded line by line, with columns for the
code, the tag, the page, and the quotation.

Bennett's Vibrant Matter runs to 3,705 transcript rows, 2,013 of them
carrying a note and 947 a tag, across 222 distinct tags, with the book
partitioned into eleven sections. The most-used tags name arguments rather
than topics: introduction and anthropomorphizing 108, postulate 39, negative
dialectics 38, life is beyond material 32.

The same schema runs per examination question. Braidotti for question one, 48
coded lines. Artist case studies for question two, 27 rows with the artist,
the work, the page and the quotation. Question three carries an outstanding
list headed keep looking for text.

Every one of these sheets has a page column and a quoting column. A quotation
was never recorded without the page it came from.

> **[TO WRITE: reading as coding. What the tags are for and why they name
> arguments.]**

### Instrument eight: paragraph provenance

The join between the coded reading and the draft. 111 quotations are numbered
in a bank, each with its code, tag, page and text. 301 transcript chunks are
numbered separately. A paragraph is then declared before it is written: a
heading, a core claim, a summary of its sources, and two lists of
identifiers naming the chunks and the quotations that support it.

A later sheet states the same logic as a query rather than a list, holding
expressions like `Code contains: "Postulate-"` alongside page anchors for 63
paragraphs.

This runs the opposite way from an audit. An audit takes finished prose and
asks which paragraphs lack support. This specifies the support first and
writes the paragraph from it.

> **[TO WRITE: declaring a paragraph as a claim plus its sources before
> writing it.]**

### Instrument nine: knowledge-graph visualization

The examination document itself becomes the corpus. People, works, concepts,
movements, institutions, places, events and artworks are extracted from the
text and joined by typed relations, then published as an interactive map with
an index back into the source pages.

Ten raw extraction passes produced 975 node records and 923 edge records.
Merged and reconciled, these become 650 nodes, of which 212 are people, 134
works and 170 concepts, joined by 817 typed edges.

The index runs the other way, from graph back to page. 614 of 648 indexable
entities locate to a page in draft version 40, and 419 locate in the
submitted examination. 22 texts in the corpus match no graph entity at all.

The full procedure is documented separately in the Knowledge-Graph
Visualization Protocol.

> **[TO WRITE: turning my own document into a corpus, and what the entities
> that match nothing tell me.]**

## 3. Limitations

> **[TO WRITE]**

## 4. Reproducibility

> **[TO WRITE]**

## Appendix: records returned per query

### Round one

**9 May 2025.** `evocative object*` 1,837. `Sherry Turkle` 1,195. `Turkle AND
Papert` 794. `Sherry Turkle AND "evocative object"` 464. `Donna Haraway` 462.
`Turkle AND Braidotti` 358. `Seymour Papert` 235. `M.Scott Peck AND "map"`
195. `Papert AND Braidotti` 162. `Rosa Braidotti` 80. Ten queries, 5,782
records.

**12 May 2025.** `bourdieuANDhabitus` 920. `positionality` 608. `arts based
research*` 542. `Erving Goffmann*` 384. Four queries, 2,454 records.

**13 May 2025.** `positionality AND intersectionality` 1,968. `"arts based
research" AND posthuman*` 1,917. `"POST QUALITATIVE" HAS NO END ALWAYS
becomings` 1,180. `assemblage as methodology` 1,158. `"post qualitative"`
890. `Braidotti AND apparat*` 768. `"Karen Barad"` 760. `assemblage` 128.
`beings AND exist AND phenomena AND Barad` 113. `Barad AND apparat*` 81.
`"sitting betwixt"` 59. `critical auto-ethnography` 40. `beings AND exist
phenomena` 22. `"sitting betwixt" AND Papert` 20. `beings exist phenomena`
19. `"sitting betwixt" AND Turkle` 3. Sixteen queries, 9,126 records.

**21 August 2025.** `math education AND arts based research` 60. One query.

> **[TO WRITE: the remaining rounds, once their rails are built.]**

## To do later

- make more sophisticated visualizations, try a word network and other js
  libraries <https://districtdatalabs.silvrback.com/beyond-the-word-cloud>
