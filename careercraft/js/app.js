var $=function(s){return document.querySelector(s)};
function esc(s){return String(s==null?"":s).replace(/[&<>"]/g,function(c){return{"&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;"}[c]})}
var DB=null;try{DB=JSON.parse(localStorage.getItem("cc")||"null")}catch(e){}
DB=DB||{users:[],cur:null};
function persist(){try{localStorage.setItem("cc",JSON.stringify(DB))}catch(e){}}
function U(){return DB.users.filter(function(u){return u.email===DB.cur})[0]}
function uid(){return Math.random().toString(36).slice(2,9)}
function toast(t){var d=document.createElement("div");d.className="toast";d.textContent=t;document.body.appendChild(d);setTimeout(function(){d.remove()},1800)}
function blank(n,e){return{name:n,title:"",email:e,phone:"",loc:"",summary:"",skills:"",tpl:"classic",exp:[{role:"",org:"",dates:"",desc:""}],edu:[{deg:"",school:"",dates:""}],proj:[]}}
var P0=[["Rewrite my CV summary","Rewrite this CV summary in 3 sentences. Keep it factual, confident and specific to the role of [ROLE]: [SUMMARY]"],
["Turn duties into achievements","Rewrite these job duties as achievement bullets that start with strong verbs and include a measurable result where possible: [DUTIES]"],
["Cover letter from job ad","Write a 250-word cover letter for [ROLE] at [COMPANY] using my CV below and the job description. Mention 3 matching skills. CV: [CV] Job: [JD]"],
["Match my CV to a job","Compare my CV to this job description. List matched keywords, missing keywords, and 5 concrete edits to improve fit. CV: [CV] Job: [JD]"],
["Tailor skills section","Reorder and reword my skills so the ones most relevant to this job come first. Do not invent skills. Skills: [SKILLS] Job: [JD]"],
["Interview preparation","Give me 8 likely interview questions for [ROLE] and short answer outlines based on my CV: [CV]"]];
var page="dash",busy=null;
function render(){var u=U();document.documentElement.removeAttribute("data-theme");
 if(u&&u.theme&&u.theme!=="auto")document.documentElement.setAttribute("data-theme",u.theme);
 if(!u){authView("in");return}
 var T=[["dash","Dashboard"],["cv","CV builder"],["letter","Cover letter"],["match","Job match"],["prompts","Prompts"],["bot","Assistant"],["docs","Documents"],["set","Settings"]];
 $("#app").innerHTML='<nav><b>CareerCraft</b>'+T.map(function(t){return'<button data-a="go" data-p="'+t[0]+'" class="'+(t[0]===page?"on":"")+'">'+t[1]+'</button>'}).join("")+'<span class="sp"></span><button data-a="out">Log out</button></nav><main id="m"></main>';
 V[page](u)}
function authView(mode){var reg=mode==="up";
 $("#app").innerHTML='<div class="auth"><h2>CareerCraft</h2><p class="mu">'+(reg?"Create an account to build your CV.":"Log in to continue.")+' Demo: accounts are stored only in this browser.</p><div class="pn">'+(reg?'<label for="an">Name</label><input id="an">':'')+'<label for="ae">Email</label><input id="ae" type="email"><label for="ap">Password</label><input id="ap" type="password"><p class="err" id="er"></p><button class="b" data-a="auth" data-m="'+mode+'">'+(reg?"Create account":"Log in")+'</button><button class="b s" data-a="sw" data-m="'+(reg?"in":"up")+'">'+(reg?"I have an account":"Create account")+'</button></div></div>'}
var V={};
V.dash=function(u){var cvs=u.docs.filter(function(d){return d.type==="cv"}).length,ls=u.docs.length-cvs;
 $("#m").innerHTML='<h2>Welcome, '+esc(u.name||"there")+'</h2><div class="g3"><div class="pn"><div class="stat">'+cvs+'</div><div class="mu">Saved CVs</div></div><div class="pn"><div class="stat">'+ls+'</div><div class="mu">Cover letters</div></div><div class="pn"><div class="stat">'+(P0.length+u.prompts.length)+'</div><div class="mu">Prompts</div></div></div><div class="pn"><h3>Quick actions</h3><button class="b" data-a="go" data-p="cv">Edit CV</button><button class="b" data-a="go" data-p="letter">Write cover letter</button><button class="b" data-a="go" data-p="match">Match a job</button><button class="b" data-a="go" data-p="bot">Ask the assistant</button></div><div class="pn"><h3>Recent documents</h3>'+(u.docs.length?u.docs.slice().sort(function(a,b){return b.t-a.t}).slice(0,5).map(docRow).join(""):'<p class="mu">Nothing saved yet. Build a CV and select Save.</p>')+'</div>'};
function docRow(d){return'<div class="row"><div><b>'+esc(d.title)+'</b><div class="mu">'+(d.type==="cv"?"CV":"Cover letter")+' · '+new Date(d.t).toLocaleDateString()+'</div></div><div><button class="b s" data-a="open" data-id="'+d.id+'">Edit</button><button class="b d" data-a="del" data-id="'+d.id+'">Delete</button></div></div>'}
var chat=[],SMP=null,busyBot=false;
function getS(cb){if(SMP){cb(SMP);return}try{if(window.claude&&window.claude.use){window.claude.use("sample").then(function(x){SMP=x;cb(x)}).catch(function(){cb(null)})}else cb(null)}catch(e){cb(null)}}
function draw(){var b=$("#bl");if(!b)return;b.innerHTML=chat.length?chat.map(function(m){return'<div class="m '+(m.role==="user"?"u":"a")+'">'+(m.content?esc(m.content):"Thinking...")+'</div>'}).join(""):'<p class="mu">Ask me anything about your CV, cover letters, job ads or interviews. I use the details in your CV builder.</p>';b.scrollTop=b.scrollHeight}
function ask(t){var u=U();chat.push({role:"user",content:t});chat.push({role:"assistant",content:""});busyBot=true;draw();var last=chat[chat.length-1];
 getS(function(S){if(!S){last.content="The AI assistant is not available in this view. Open the page in claude.ai to use it.";busyBot=false;draw();return}
  var ctx="You are CareerCraft's career assistant. Help with CVs, cover letters, job matching and interview preparation. Rules: use only facts from the user's CV below, never invent employers, numbers, tools or qualifications; if details are missing, ask for them; be concise and practical; plain text without markdown headings.\n\nUSER CV:\n"+plain(u.cv)+"\n\nLAST JOB DESCRIPTION:\n"+(window._jd||(u.letter&&u.letter.jd)||"none");
  var turns=chat.slice(0,-1).map(function(m,i){return{role:m.role,content:i===0?ctx+"\n\nUSER MESSAGE: "+m.content:m.content}});
  S(turns,{cache:false,onText:function(r){last.content=r.text;draw()}}).then(function(r){last.content=r.text||"(no reply)";busyBot=false;draw()}).catch(function(e){last.content=(e&&e.text)||(e&&e.code==="rate_limited"?"Too many requests. Try again in a moment.":"Sorry, that did not work. Please try again.");busyBot=false;draw()})})}
V.bot=function(){$("#m").innerHTML='<h2>Career assistant</h2><div class="pn"><div class="msgs" id="bl"></div><div class="chips" style="margin:6px 0"><button class="b s" data-a="chip" data-t="Improve my CV summary.">Improve my summary</button><button class="b s" data-a="chip" data-t="Which skills should I add or reorder for the job description I last analysed?">Skills for my last job</button><button class="b s" data-a="chip" data-t="Give me 8 likely interview questions for my role with short answer outlines.">Interview questions</button><button class="b s" data-a="chip" data-t="Turn my experience into achievement bullets and ask me what numbers are missing.">Achievement bullets</button></div><textarea id="bi" style="min-height:64px" placeholder="Type your question. Enter to send, Shift+Enter for a new line."></textarea><button class="b" data-a="send">Send</button><button class="b s" data-a="clr">Clear chat</button></div>';draw()};
V.docs=function(u){$("#m").innerHTML='<h2>Documents</h2><div class="pn">'+(u.docs.length?u.docs.map(docRow).join(""):'<p class="mu">No saved documents yet.</p>')+'</div>'};
function inp(k,l,v,t){return'<label>'+l+'</label><input data-k="'+k+'" value="'+esc(v)+'"'+(t?' type="'+t+'"':'')+'>'}
function lst(c,key,fields){return c[key].map(function(x,i){return'<div class="blk">'+fields.map(function(f){return f[2]?'<label>'+f[1]+'</label><textarea data-l="'+key+'" data-i="'+i+'" data-f="'+f[0]+'">'+esc(x[f[0]])+'</textarea>':'<label>'+f[1]+'</label><input data-l="'+key+'" data-i="'+i+'" data-f="'+f[0]+'" value="'+esc(x[f[0]])+'">'}).join("")+'<button class="b d" data-a="rm" data-key="'+key+'" data-i="'+i+'">Remove</button></div>'}).join("")+'<button class="b s" data-a="add" data-key="'+key+'">Add</button>'}
V.cv=function(u){var c=u.cv;
 $("#m").innerHTML='<h2>CV builder</h2><div class="pn"><h3 style="margin-top:0">Choose a template</h3><p class="mu">Previews use your own details. Select one to apply it.</p><div class="tg">'+tplCards(c)+'</div></div><div class="g2"><div class="pn">'+inp("name","Full name",c.name)+inp("title","Job title",c.title)+inp("email","Email",c.email)+inp("phone","Phone",c.phone)+inp("loc","Location",c.loc)+'<label>Summary</label><textarea data-k="summary">'+esc(c.summary)+'</textarea><button class="b s" data-a="gsum">AI: generate summary</button><button class="b s" data-a="polish">AI: improve wording</button><h3>Experience</h3>'+lst(c,"exp",[["role","Role"],["org","Company"],["dates","Dates"],["desc","What you did",1]])+'<h3>Education</h3>'+lst(c,"edu",[["deg","Qualification"],["school","School"],["dates","Dates"]])+'<h3>Skills</h3><p class="mu">One category per line, like <i>Databases: SQL, Firebase</i>. Or list skills and use the button to group them.</p><textarea data-k="skills" style="min-height:140px" placeholder="Programming Languages: C#, Dart&#10;Databases &amp; Platforms: SQL, Firebase">'+esc(c.skills)+'</textarea><button class="b s" data-a="catsk">AI: organise into categories</button><h3>Projects</h3>'+lst(c,"proj",[["name","Project"],["desc","Description",1]])+'</div><div><div class="pn"><button class="b" data-a="savecv">Save CV</button><button class="b s" data-a="pdf">Export PDF</button></div><div class="pn" id="ats">'+atsHTML(c)+'</div><div id="pv" class="printable">'+cvHTML(c)+'</div></div></div>';
};
var SAMPLE={name:"Alex Morgan",title:"Software Developer",email:"alex@email.com",phone:"+27 82 000 0000",loc:"Johannesburg",summary:"Developer with hands-on experience in C#, Flutter and Firebase. Focused on clear results and dependable delivery.",skills:"Programming Languages: C#, Dart\nDatabases & Platforms: SQL, Firebase",exp:[{role:"Junior Developer",org:"Acme Ltd",dates:"2024 - Now",desc:"Built a mobile app used by 500 customers."}],edu:[{deg:"BSc Computer Science",school:"University",dates:"2023"}],proj:[]};
var TPL=[["classic","Classic","Centred header, traditional serif"],["modern","Modern","Coloured header band"],["minimal","Minimal","Clean sans-serif, light headings"]];
function tplCards(c){var d=(c.name||c.title||c.summary)?c:SAMPLE;return TPL.map(function(t){var x=JSON.parse(JSON.stringify(d));x.tpl=t[0];return'<button class="tc" data-a="tpl" data-t="'+t[0]+'" aria-pressed="'+(c.tpl===t[0])+'"><div class="th">'+cvHTML(x)+'</div><b>'+t[1]+'</b><div class="mu">'+t[2]+'</div></button>'}).join("")}
function cvHTML(c){var h='<div class="cv t-'+c.tpl+'"><header><h1>'+esc(c.name||"Your name")+'</h1><p class="ti">'+esc(c.title)+'</p><p class="ct">'+[c.email,c.phone,c.loc].filter(Boolean).map(esc).join(" | ")+'</p></header>';
 if(c.summary)h+='<h3>Profile</h3><p>'+esc(c.summary)+'</p>';
 var ex=c.exp.filter(function(x){return x.role||x.org});if(ex.length)h+='<h3>Experience</h3>'+ex.map(function(x){return'<div><b>'+esc(x.role)+'</b> '+esc(x.org)+'<i>'+esc(x.dates)+'</i><p>'+esc(x.desc)+'</p></div>'}).join("");
 var ed=c.edu.filter(function(x){return x.deg||x.school});if(ed.length)h+='<h3>Education</h3>'+ed.map(function(x){return'<p><b>'+esc(x.deg)+'</b> '+esc(x.school)+'<i>'+esc(x.dates)+'</i></p>'}).join("");
 var sl=(c.skills||"").split("\n").map(function(l){return l.trim()}).filter(Boolean);
 if(sl.length)h+='<h3>Skills</h3>'+sl.map(function(l){var i=l.indexOf(":"),cat=i>0?l.slice(0,i).trim():"",it=(i>0?l.slice(i+1):l).split(",").map(function(x){return x.trim()}).filter(Boolean);return'<p>'+(cat?'<b>'+esc(cat)+':</b> ':'')+it.map(function(x){return'<span class="chip">'+esc(x)+'</span>'}).join("")+'</p>'}).join("");
 if(c.proj.length)h+='<h3>Projects</h3>'+c.proj.map(function(x){return'<p><b>'+esc(x.name)+'</b><br>'+esc(x.desc)+'</p>'}).join("");
 return h+'</div>'}
var REP=[[/responsible for/gi,"Led"],[/worked on/gi,"Delivered"],[/helped/gi,"Supported"],[/in charge of/gi,"Managed"],[/\bdid\b/gi,"Completed"]];
function polish(s){if(!s)return s;REP.forEach(function(r){s=s.replace(r[0],r[1])});return s.replace(/\s+/g," ").trim().replace(/^./,function(x){return x.toUpperCase()}).replace(/([^.!?])$/,"$1.")}
var STOP="the and for with you your our are will have that this from they their about who all can such more has been into other than must able work team role job experience years including within across also".split(" ");
function kws(t){var m={};(t.toLowerCase().match(/[a-z][a-z+#.]{2,}/g)||[]).forEach(function(w){if(STOP.indexOf(w)<0)m[w]=(m[w]||0)+1});return Object.keys(m).sort(function(a,b){return m[b]-m[a]}).slice(0,25)}
function flat(t){return(t||"").replace(/^[^:\n]*:/gm,"").split(/[,\n]/).map(function(x){return x.trim()}).filter(Boolean)}
var CATS=[["Programming Languages",/^(c#|c\+\+|java|javascript|typescript|python|dart|php|go|kotlin|swift|ruby|rust|r)$/i],["Frameworks",/flutter|asp\.net|react|angular|vue|django|flask|spring|laravel|node|\.net/i],["Web Technologies",/^(html5?|css3?|sass|tailwind|bootstrap)$/i],["Databases & Platforms",/sql|firebase|mongo|postgres|oracle|aws|azure/i],["Development Tools",/visual studio|vs code|vscode|git|docker|postman|jira|figma|android studio/i],["Productivity Software",/word|excel|powerpoint|outlook|access|office|sheets/i]];
function atsHTML(c){var ck=[[c.name&&c.email,"Name and email added"],[c.phone.replace(/\D/g,"").length>=7,"Phone number added"],[c.summary.length>=80&&c.summary.length<=500,"Summary is 80 to 500 characters"],[flat(c.skills).length>=6,"At least 6 skills listed"],[/:/.test(c.skills),"Skills grouped in categories"],[c.exp.some(function(x){return x.role&&x.org&&x.dates}),"Experience has role, company and dates"],[c.exp.some(function(x){return/\d/.test(x.desc)}),"At least one result includes a number"],[c.edu.some(function(x){return x.deg}),"Education added"]];
 var n=ck.filter(function(x){return x[0]}).length;return'<h3 style="margin-top:0">ATS check: '+Math.round(n/ck.length*100)+'%</h3><p class="mu">Basics that applicant-tracking systems and recruiters look for.</p>'+ck.map(function(x){return'<span class="chip '+(x[0]?"ok":"no")+'">'+(x[0]?"Done: ":"Fix: ")+x[1]+'</span>'}).join("")}
function plain(c){var L=[c.name+(c.title?", "+c.title:""),c.summary];c.exp.forEach(function(x){if(x.role||x.org)L.push(x.role+" at "+x.org+" ("+x.dates+"): "+x.desc)});c.edu.forEach(function(x){if(x.deg)L.push(x.deg+", "+x.school)});if(c.skills)L.push("Skills: "+flat(c.skills).join(", "));return L.filter(Boolean).join("\n")}
function fillP(b,u){var c=u.cv,l=u.letter||{},m={"[ROLE]":l.role||c.title,"[COMPANY]":l.company,"[SUMMARY]":c.summary,"[SKILLS]":flat(c.skills).join(", "),"[CV]":plain(c),"[JD]":l.jd||window._jd,"[DUTIES]":c.exp.map(function(x){return x.desc}).filter(Boolean).join(" ")};Object.keys(m).forEach(function(k){if(m[k])b=b.split(k).join(m[k])});return b}
function cp(t){try{navigator.clipboard.writeText(t).then(function(){toast("Copied")})}catch(x){toast("Select the text to copy")}}
function cvText(c){return JSON.stringify(c).toLowerCase()}
V.letter=function(u){var l=u.letter=u.letter||{id:null,company:"",role:"",tone:"pro",jd:"",text:""};
 $("#m").innerHTML='<h2>Cover letter</h2><div class="g2"><div class="pn"><label>Company</label><input data-x="company" value="'+esc(l.company)+'"><label>Role</label><input data-x="role" value="'+esc(l.role)+'"><label>Tone</label><select data-x="tone"><option value="pro">Professional</option><option value="fri">Friendly</option><option value="bold">Bold</option></select><label>Job description (optional)</label><textarea data-x="jd">'+esc(l.jd)+'</textarea><button class="b" data-a="gl">AI: generate letter</button><button class="b s" data-a="lp">Copy as AI prompt</button></div><div><div class="pn"><button class="b" data-a="savel">Save letter</button><button class="b s" data-a="pdf">Export PDF</button></div><textarea id="lt" class="lt printable" data-x="text">'+esc(l.text)+'</textarea></div></div>';
 $('select[data-x="tone"]').value=l.tone};
function mkLetter(u,l){var c=u.cv,k=kws(l.jd).slice(0,3),r=l.role||"the role",co=l.company||"your company",e=c.exp[0]||{};
 var op={pro:"I am writing to apply for the "+r+" position at "+co+".",fri:"I was excited to see the "+r+" opening at "+co+" and would love to be considered.",bold:"You need a strong "+r+". I am ready to be that hire at "+co+"."}[l.tone];
 return"Dear Hiring Manager,\n\n"+op+" "+(c.summary||"")+"\n\n"+(e.role?"In my role as "+e.role+(e.org?" at "+e.org:"")+", "+(e.desc?polish(e.desc).replace(/^./,function(x){return x.toLowerCase()}):"I built the skills this position needs")+"\n\n":"")+(k.length?"Your description highlights "+k.join(", ")+", which match my background.\n\n":"")+"I would welcome the chance to discuss how I can contribute to "+co+".\n\nKind regards,\n"+(c.name||"")}
V.match=function(u){$("#m").innerHTML='<h2>Job match</h2><div class="pn"><label>Paste a job description</label><textarea id="jd" style="min-height:160px"></textarea><button class="b" data-a="mt">Analyze match</button></div><div id="mr"></div>'};
V.prompts=function(u){$("#m").innerHTML='<h2>Prompt library</h2><div class="pn" id="pf" style="display:none"><h3 style="margin-top:0">Your prompt, filled with your details</h3><p class="mu">Edit it if you like, then copy it into your AI chat tool. Placeholders with no matching detail stay in square brackets.</p><textarea id="pft" style="min-height:220px"></textarea><button class="b" data-a="cpf">Copy prompt</button></div><div class="pn"><h3>Add your own</h3><label>Title</label><input id="pt"><label>Prompt</label><textarea id="pb"></textarea><button class="b" data-a="addp">Save prompt</button></div>'+P0.map(function(p){return{t:p[0],b:p[1]}}).concat(u.prompts.map(function(p,i){return{t:p.t,b:p.b,i:i}})).map(function(p){return'<div class="pn"><b>'+esc(p.t)+'</b><p class="mu">'+esc(p.b)+'</p><button class="b" data-a="usep" data-b="'+esc(p.b)+'">Fill with my details</button><button class="b s" data-a="cpp" data-b="'+esc(p.b)+'">Copy as is</button>'+(p.i!=null?'<button class="b d" data-a="delp" data-i="'+p.i+'">Delete</button>':'')+'</div>'}).join("")};
V.set=function(u){$("#m").innerHTML='<h2>Settings</h2><div class="pn" style="max-width:520px"><label>Name</label><input data-u="name" value="'+esc(u.name)+'"><label>Email</label><input value="'+esc(u.email)+'" disabled><label>Theme</label><select data-u="theme"><option value="auto">Match device</option><option value="light">Light</option><option value="dark">Dark</option></select><label>Default template for new CVs</label><select data-u="tpl"><option value="classic">Classic</option><option value="modern">Modern</option><option value="minimal">Minimal</option></select><p><button class="b d" data-a="wipe">Delete my account</button></p></div>';
 $('[data-u="theme"]').value=u.theme||"auto";$('[data-u="tpl"]').value=u.tpl||"classic"};
function saveDoc(u,type,title,content){var id=type==="cv"?u.cvDoc:(u.letter||{}).id,d=u.docs.filter(function(x){return x.id===id})[0];
 if(d){d.title=title;d.content=JSON.parse(JSON.stringify(content));d.t=Date.now()}else{id=uid();u.docs.push({id:id,type:type,title:title,content:JSON.parse(JSON.stringify(content)),t:Date.now()});if(type==="cv")u.cvDoc=id;else u.letter.id=id}
 persist();toast("Saved")}

function newDoc(){var J=window.jspdf&&window.jspdf.jsPDF;return J?new J({unit:"pt",format:"a4"}):null}
function mkPdf(draw){var doc=newDoc();if(!doc)return null;var M=50,PW=doc.internal.pageSize.getWidth(),PH=doc.internal.pageSize.getHeight(),st={y:M};
 var h={doc:doc,M:M,PW:PW,CW:PW-2*M,st:st,chk:function(n){if(st.y+n>PH-M){doc.addPage();st.y=M}},
 para:function(t,size,style,col,x,w,al){doc.setFont("helvetica",style||"normal");doc.setFontSize(size);var c=col||[26,26,26];doc.setTextColor(c[0],c[1],c[2]);String(t==null?"":t).split("\n").forEach(function(p){doc.splitTextToSize(p||" ",w||h.CW).forEach(function(l){h.chk(size*1.4);if(al==="center")doc.text(l,PW/2,st.y+size,{align:"center"});else doc.text(l,x==null?M:x,st.y+size);st.y+=size*1.4})})}};
 draw(h);return doc}
function pdfCV(c){var tp=c.tpl,col=tp==="modern"?[91,107,42]:tp==="minimal"?[119,119,119]:[26,26,26];
 return mkPdf(function(h){var d=h.doc,st=h.st,M=h.M,PW=h.PW,ct=[c.email,c.phone,c.loc].filter(Boolean).join(" | ");
  if(tp==="modern"){d.setFillColor(63,74,28);d.rect(0,0,PW,100,"F");d.setFont("helvetica","bold");d.setFontSize(24);d.setTextColor(255,255,255);d.text(c.name||"Your name",M,48);d.setFont("helvetica","normal");d.setFontSize(12);d.text(c.title||"",M,68);d.setFontSize(10);d.text(ct,M,86);st.y=120}
  else if(tp==="minimal"){h.para(c.name||"Your name",24,"normal",[26,26,26]);h.para(c.title,12,"normal",[119,119,119]);h.para(ct,10,"normal",[119,119,119]);st.y+=6}
  else{h.para(c.name||"Your name",24,"bold",[17,17,17],0,h.CW,"center");h.para(c.title,12,"normal",[60,60,60],0,h.CW,"center");h.para(ct,10,"normal",[85,85,85],0,h.CW,"center");d.setDrawColor(17,17,17);d.setLineWidth(1.5);d.line(M,st.y+4,PW-M,st.y+4);st.y+=12}
  function sec(t){h.chk(40);st.y+=8;d.setFont("helvetica","bold");d.setFontSize(11);d.setTextColor(col[0],col[1],col[2]);d.text(tp==="minimal"?t.toLowerCase():t,M,st.y+11);if(tp!=="minimal"){d.setDrawColor(col[0],col[1],col[2]);d.setLineWidth(0.6);d.line(M,st.y+16,PW-M,st.y+16)}st.y+=24}
  if(c.summary){sec("Profile");h.para(c.summary,10.5)}
  var ex=c.exp.filter(function(x){return x.role||x.org});
  if(ex.length){sec("Experience");ex.forEach(function(x){h.chk(30);d.setFont("helvetica","normal");d.setFontSize(10);d.setTextColor(102,102,102);if(x.dates)d.text(x.dates,PW-M,st.y+11,{align:"right"});h.para([x.role,x.org].filter(Boolean).join(" | "),11,"bold",[17,17,17],M,h.CW-110);if(x.desc)h.para(x.desc,10.5);st.y+=4})}
  var ed=c.edu.filter(function(x){return x.deg||x.school});
  if(ed.length){sec("Education");ed.forEach(function(x){h.chk(20);d.setFont("helvetica","normal");d.setFontSize(10);d.setTextColor(102,102,102);if(x.dates)d.text(x.dates,PW-M,st.y+11,{align:"right"});h.para([x.deg,x.school].filter(Boolean).join(" | "),10.5,"bold",[17,17,17],M,h.CW-110)})}
  var sl=(c.skills||"").split("\n").map(function(l){return l.trim()}).filter(Boolean);
  if(sl.length){sec("Skills");sl.forEach(function(l){h.para(l,10.5)})}
  if(c.proj.length){sec("Projects");c.proj.forEach(function(x){h.para(x.name,10.5,"bold",[17,17,17]);if(x.desc)h.para(x.desc,10.5)})}})}
function pdfLetter(u){var l=u.letter||{};return mkPdf(function(h){h.para(u.cv.name||"",16,"bold",[17,17,17]);h.para([u.cv.email,u.cv.phone].filter(Boolean).join(" | "),10,"normal",[85,85,85]);h.st.y+=14;h.para(l.text||"",11)})}
function saveBlob(doc,fn){var blob=doc.output("blob");
 var go=function(){try{doc.save(fn);toast("PDF downloaded")}catch(x){try{window.print()}catch(y){toast("Use your browser's print menu, then Save as PDF")}}};
 try{if(window.claude&&window.claude.use){window.claude.use("downloads").then(function(d){if(!d){go();return}
  d.save({filename:fn,data:blob}).then(function(){toast("PDF saved")}).catch(function(e){if(e&&e.code==="declined")toast("Download cancelled");else go()})}).catch(go)}else go()}catch(x){go()}}
function exportPdf(){try{exportPdf2()}catch(e){try{window.print()}catch(x){toast("Use your browser's print menu, then Save as PDF")}}}
function exportPdf2(){var u=U();if(!u)return;var doc,fn;
 if(page==="letter"){if(!(u.letter&&u.letter.text)){toast("Generate or write a letter first");return}doc=pdfLetter(u);fn="Cover-letter.pdf"}
 else{var c=u.cv;if(!(c.name||c.summary||c.exp.some(function(x){return x.role||x.org}))){toast("Add your details first");return}doc=pdfCV(c);fn=(c.name||"CV").replace(/[^\w\- ]+/g,"").trim().replace(/\s+/g,"-")+"-CV.pdf"}
 if(!doc){try{window.print()}catch(x){toast("Use your browser's print menu, then Save as PDF")}return}
 saveBlob(doc,fn)}
var A={go:function(e){page=e.dataset.p;render()},out:function(){DB.cur=null;persist();render()},
sw:function(e){authView(e.dataset.m)},
auth:function(e){var em=$("#ae").value.trim().toLowerCase(),pw=$("#ap").value,er=$("#er");
 if(!/^\S+@\S+\.\S+$/.test(em)){er.textContent="Enter a valid email address.";return}
 if(pw.length<6){er.textContent="Password must be at least 6 characters.";return}
 var ex=DB.users.filter(function(u){return u.email===em})[0];
 if(e.dataset.m==="up"){if(ex){er.textContent="That email already has an account. Log in instead.";return}var n=$("#an").value.trim();if(!n){er.textContent="Enter your name.";return}
  DB.users.push({email:em,pw:pw,name:n,cv:blank(n,em),docs:[],prompts:[],theme:"auto",tpl:"classic"})}
 else if(!ex||ex.pw!==pw){er.textContent="Email or password is incorrect.";return}
 DB.cur=em;persist();page="dash";render()},
add:function(e){var u=U(),k=e.dataset.key;u.cv[k].push(k==="exp"?{role:"",org:"",dates:"",desc:""}:k==="edu"?{deg:"",school:"",dates:""}:{name:"",desc:""});persist();render()},
rm:function(e){var u=U();u.cv[e.dataset.key].splice(+e.dataset.i,1);persist();render()},
gsum:function(){var u=U(),c=u.cv,sk=flat(c.skills).map(function(s){return s.trim()}).filter(Boolean).slice(0,4);c.summary=(c.title||"Professional")+" with hands-on experience"+(sk.length?" in "+sk.join(", "):"")+". Focused on clear results, dependable delivery and continuous learning.";persist();render()},
catsk:function(){var c=U().cv,seen={},g={};flat(c.skills).forEach(function(x){var k=x.toLowerCase();if(seen[k])return;seen[k]=1;var cat="Other";for(var i=0;i<CATS.length;i++)if(CATS[i][1].test(x)){cat=CATS[i][0];break}(g[cat]=g[cat]||[]).push(x)});
 c.skills=CATS.map(function(x){return x[0]}).concat("Other").filter(function(k){return g[k]}).map(function(k){return k+": "+g[k].join(", ")}).join("\n");persist();render();toast("Skills organised")},
ordsk:function(){var c=U().cv,kw=window._kw||[],L=c.skills.split("\n").filter(function(l){return l.trim()});
 function sc(l){var t=l.toLowerCase();return kw.filter(function(w){return t.indexOf(w)>=0}).length}
 c.skills=L.map(function(l,i){return[l,sc(l),i]}).sort(function(a,b){return b[1]-a[1]||a[2]-b[2]}).map(function(x){return x[0]}).join("\n");persist();toast("Skills reordered")},
tpl:function(e){var c=U().cv;c.tpl=e.dataset.t;persist();document.querySelectorAll(".tc").forEach(function(b){b.setAttribute("aria-pressed",b.dataset.t===c.tpl)});$("#pv").innerHTML=cvHTML(c);toast("Template applied")},
usep:function(e){$("#pft").value=fillP(e.dataset.b,U());var p=$("#pf");p.style.display="block";p.scrollIntoView({behavior:"smooth"})},
cpf:function(){cp($("#pft").value)},
lp:function(){cp(fillP(P0[2][1],U()))},
send:function(){var i=$("#bi"),t=i.value.trim();if(!t||busyBot)return;i.value="";ask(t)},
chip:function(e){if(!busyBot)ask(e.dataset.t)},
clr:function(){chat=[];busyBot=false;draw()},
polish:function(){var c=U().cv;c.summary=polish(c.summary);c.exp.forEach(function(x){x.desc=polish(x.desc)});c.proj.forEach(function(x){x.desc=polish(x.desc)});persist();render();toast("Wording improved")},
savecv:function(){var u=U();saveDoc(u,"cv",(u.cv.name||"My")+" CV ("+u.cv.tpl+")",u.cv)},
savel:function(){var u=U(),l=u.letter;saveDoc(u,"letter","Letter: "+(l.role||"Role")+" at "+(l.company||"Company"),l)},
gl:function(){var u=U(),l=u.letter;l.text=mkLetter(u,l);persist();render()},
pdf:function(){exportPdf()},
open:function(e){var u=U(),d=u.docs.filter(function(x){return x.id===e.dataset.id})[0];if(d.type==="cv"){u.cv=JSON.parse(JSON.stringify(d.content));u.cvDoc=d.id;page="cv"}else{u.letter=JSON.parse(JSON.stringify(d.content));u.letter.id=d.id;page="letter"}persist();render()},
del:function(e){var u=U();u.docs=u.docs.filter(function(x){return x.id!==e.dataset.id});if(u.cvDoc===e.dataset.id)u.cvDoc=null;if(u.letter&&u.letter.id===e.dataset.id)u.letter.id=null;persist();render();toast("Deleted")},
mt:function(){var u=U(),jd=$("#jd").value;window._jd=jd;var k=kws(jd),t=cvText(u.cv);if(!k.length){toast("Paste a job description first");return}
 var ok=k.filter(function(w){return t.indexOf(w)>=0}),no=k.filter(function(w){return t.indexOf(w)<0}),s=Math.round(ok.length/k.length*100);
 window._miss=no;window._kw=k;$("#mr").innerHTML='<div class="pn"><div class="score">'+s+'%</div><p class="mu">Keyword match against your current CV.</p><h3>In your CV</h3>'+ok.map(function(w){return'<span class="chip ok">'+esc(w)+'</span>'}).join("")+'<h3>Missing</h3>'+no.map(function(w){return'<span class="chip no">'+esc(w)+'</span>'}).join("")+'<h3>Suggested edits</h3><ul>'+no.slice(0,5).map(function(w){return'<li>Mention "'+esc(w)+'" in a skill line or an experience bullet, if it is true for you.</li>'}).join("")+'</ul><p><button class="b" data-a="addsk">Add missing words to skills</button><button class="b s" data-a="ordsk">Put most relevant skill categories first</button></p></div>'},
addsk:function(){var c=U().cv;c.skills=(c.skills?c.skills+"\n":"")+"Job keywords: "+window._miss.join(", ");persist();toast("Added to skills")},
addp:function(){var u=U(),t=$("#pt").value.trim(),b=$("#pb").value.trim();if(!t||!b){toast("Add a title and a prompt");return}u.prompts.push({t:t,b:b});persist();render()},
delp:function(e){U().prompts.splice(+e.dataset.i,1);persist();render()},
cpp:function(e){try{navigator.clipboard.writeText(e.dataset.b).then(function(){toast("Copied")})}catch(x){toast("Select the text to copy")}},
wipe:function(){if(!confirm("Delete your account and all saved documents?"))return;DB.users=DB.users.filter(function(x){return x.email!==DB.cur});DB.cur=null;persist();render()}};
document.addEventListener("click",function(e){var t=e.target.closest("[data-a]");if(t&&A[t.dataset.a])A[t.dataset.a](t)});
document.addEventListener("keydown",function(e){if(e.target.id==="bi"&&e.key==="Enter"&&!e.shiftKey){e.preventDefault();A.send()}});
document.addEventListener("input",function(e){var t=e.target,u=U();if(!u)return;
 if(t.dataset.k){u.cv[t.dataset.k]=t.value;var p=$("#pv");if(p)p.innerHTML=cvHTML(u.cv);var a=$("#ats");if(a)a.innerHTML=atsHTML(u.cv)}
 else if(t.dataset.l){u.cv[t.dataset.l][+t.dataset.i][t.dataset.f]=t.value;var q=$("#pv");if(q)q.innerHTML=cvHTML(u.cv);var a=$("#ats");if(a)a.innerHTML=atsHTML(u.cv)}
 else if(t.dataset.x){u.letter[t.dataset.x]=t.value}
 else if(t.dataset.u){u[t.dataset.u]=t.value;if(t.dataset.u==="theme")render()}
 persist()});
render();
