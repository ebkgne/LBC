
/*... here we are ! */

$(document).ready(function() {

/* UID MGMT */

$("#option").hide();
$("#option >input").after("<span>");
$("#option > span").css("float", "left").hide();
$('#option > input').on("change keyup focus", resizeInput);
$("#addopt").on("click", function() {  $("#option").clone(true).insertBefore("#addopt").show() });
$("#option > #remove").each(function(){ $(this).on("click", function() { $(this).parent().remove() }) });
$("#go").on("click", post); 
$(document).on('keypress',function(e) { if(e.which == 13) { post() } });
$("#option > select").one("focus", function() { $(this).children(".default").hide(); })
$("#option > select").on("change", function() { $(this).parent().children("input").val($(this).val()).focus() })
$("#ad").hide();
$("#save").on("click", save);


// G-Vars /////////////////////////////////////////////////////

key 		= window.location.href.split("?")[1];
maxdisplay 	= 1000
maxfetch 	= 10
autopost 	= false

form 		= false
adslist 	= []
flags 		= []

function init() {

	// HARDCORE INIT
	notlist = 	" NOT pick*up NOT subaru NOT punto NOT golf NOT alfa NOT 307 NOT 407 NOT meriva NOT audi NNOT laguna NOT matrix NOT voyager NOT 607 NOT DS3 NOT seat NOT tiguan NOT astra NOT insignia NOT 5008 NOT depan* NOT benne NOT plateau NOT nacelle NOT caisse NOT jumpy NOT twingo NOT polo NOT berlingo  NOT doblo NOT zoe NOT nv200 NOT megane NOT 308 NOT 208 NOT nemo NOT bipper NOT duster NOT scenic NOT 207 NOT vito NOT expert NOT scudo NOT clio NOT partner NOT kangoo NOT caddy NOT fiorino NOT C4 NOT C3 NOT fiesta"
	rgxlist = [
				"(r.gulat|r.de.vit.sse|to?u?tes?\\s+opt)--regulateur",
				"7.?pl--7places","(([LH]2.{0,4}[LH]2))--l2h2",
				"(1[2-9]\\d)\\s*(c[v(h(euvau)?)]|(dci))--CV",
				"chaine--chaine",
				"[^\\d](1[0-4]|\\d)\\d{4}\\skm--KM",
				"dci.?(1[2-9]\\d)--CV"]
	unrgxlist = [
				"[^\\d](\\d{2}|1[01]\\d)\\s*(c[v(h(euvau)?)]|(dci)) --CV",
				"dci.([6-9]\\d|1[01]\\d)--CV"
				,"(boi?tte|pour.pi.ce|accident|\\sHS[^\\w\\d])--HS",
				"([LH][134].{0,4}[LH][1234])--LH"]


	forms = [
	{"q":"f3500 OR Master OR movano"+notlist, "params":{"km":["0,250000"], "prix":["500,10000"], "titre":["oui"], "regex":rgxlist, "unrgx":unrgxlist}},
	{"q":"sprinter OR crafter"+notlist, "params":{ "titre":["oui"], "km":["0,250000"], "prix":["600,10000"], "regex":rgxlist, "unrgx":unrgxlist}},
	{"q":"boxer OR jumper OR ducato"+notlist, "params":{ "titre":["oui"], "annee":["2008,2020"], "km":["0,250000"], "prix":["600,8000"], "regex":rgxlist, "unrgx":unrgxlist}},
	{"q":"4x4 OR ambulance* OR edf OR dde OR service* OR militaire OR armee OR gendarme* OR pompier*"+notlist, "params":{"km":["0,250000"],"cat":["5"], "prix":["1000,10000"], "titre":["oui"], "regex":rgxlist, "unrgx":unrgxlist}}

	]

	// forms = [{"q":"coinceur* NOT kite* ","params":{"cat":["29"],"regex":["coin--di"]}}]
	// forms = [{"q":"master* ","params":{}}]

	nowform = 0
	form = forms[nowform]
	json2form()
	form = false
	post()

	return

	//------------------------------


	if (key) jsonpost({"key":[key]},function(data) { 

		if (data[0])  {
			
			console.log("loadedform: "+key)
			form = data[0]
			delete form.key
			json2form()
			if (autopost) post()
		}
	})

}

function post() {

	
	form2json()
	newform = {}
	newform.data = [form]
	if (key) newform.data[0].key = key

	
	jsonpost(newform,function(data) {

		key = data[0]
		window.history.pushState('', '', "?"+key)

		jsonpost({"link":key },function(list) { 

			if (list.links) jsonpost({"key":list.links },function(list) {
			
				if (list[0]) adslist = list
				
				console.log("old:"+adslist.length)

				lbcpost(100)
			
			}) 
			else lbcpost(100) 
		})

	})

}

// Fxs ///////////////////////////////////////////////////////

function jsonpost(phpinput,callback) {
	
	for (gname in phpinput) break

	$.post(

		"do.php?"+Math.round(Math.random()*9999)+"&"+gname,
		JSON.stringify(phpinput), 
		function(data) { if (callback) callback(data) }, 
		"json")

}

function rgx(str,pat) {

	pat = pat.split("--")

	if (!Array.isArray(pat)) pat = [pat, "$0"]

	ret = String(pat[1])
	if (ret == "") ret = "$0"
	pat = new RegExp(pat[0], "i")
	match = str.match(pat)
	
	if (match) {

		kret = ret.match(new RegExp("\\$\\d","g"))

		if (!Array.isArray(kret)) kret = [kret]
		if (!Array.isArray(match)) match = [match]
		$.each(kret, function(e) {

			ret = ret.replace(kret[e], match[String(kret[e]).substring(1)])

		})
		
		return ret
	}

}

function rangify(range) {

	range = String(range).match(new RegExp("(\\d+)(,(\\d+))?", "i"))
	return {"min":Number(range[1]),"max":Number(range[3]?range[3]:range[1])}

}

function unik(aa) {

	bb = []

	if (!Array.isArray(aa)) aa = []

	$.each(aa, function(a,a){

	    $.each(bb, function(b,b){

	    	if (String(a) == String(b)) {
	    		
	    		a = null
	    		return false
	    		
	    	}
		});

		if (a) bb.push(a)
	});

	return (bb)

}

function inarray(comp,arr) {

	ret = false
	arr.forEach(function(e) {
		if (JSON.stringify(comp) == JSON.stringify(e)) ret = true

	})

	return ret

}

function form2json() {

	was = (form == false ? false : true)

	form = {}

	form.q = $("#query > #q").val()
	
	form.params = {}

	$("#option > select").each(function() { 

		if ($(this).val() != null && $(this).parent().children("input").val() != null) {	
			
			type = $(this).children("option:selected").text().toLowerCase()
			val = $(this).parent().children("input").val()

			if (form.params[type] == null) form.params[type] = []
			form.params[type].push(val)
			
		}

	 })

	return was

}

function json2form() {
	
	$("#q").val(form["q"]) 
	
	$.each(form["params"], function(k,v) {

		$.each(v, function(v,v) { 

			param = $("#option").clone(true).insertBefore("#addopt")
			param.children("select").children("option").each(function(){
				
				if (k ==  $(this).text().toLowerCase()) 

					$(this).attr("selected","selected")
					return
				
			});

			param.show().children("input").val(v).each(resizeInput)

		})

	})

}

function lbcpost(limit=100,offset=0,lbc=false) {

	if (!lbc) lbc = lbcformencode(form)
	lbc.offset = offset
	lbc.limit = limit
	lbclist = []

	jsonpost({"lbc":lbc}, function(data) { 
		
		console.log("fetch: "+lbc.offset+"-"+(lbc.offset+lbc.limit)+"/"+data.total+" - "+form.q.substr(0,20))	

		if (data.ads) $.each(data.ads, function(ad,ad) { 

			ad["index_date"] = Number(ad["index_date"].split(/[^0-9]/).join(""))

			seek = true

			if (adslist) $.each(adslist, function(link,link) {

				if (link.key == "lbc"+ad["list_id"]) {

					if (link.date == ad["index_date"]){ 
						seek = false
						return 	
					}
					return 
				}
			}) 
			else console.log("noads")

			if (seek) { lbclist.push(lbcaddecode(ad)) }
			// else { console.log("found oldest"); return false; } // BUT NOT KILL 

		})

		// SAVE RESULTS

		if (lbclist[0]) {

			$.each(lbclist, function(lid) { 

				// flagslist = adslist.push(lbclist[lid].flags)

			})

			console.log("niou: "+lbclist.length)

			jsonpost({"data":lbclist, "link":key},function(list) {

				adslist = lbclist.concat(adslist)
				if (lbclist.length > 99 || (seek && data.total>(lbc.offset+lbc.limit) && maxfetch>(lbc.offset+lbc.limit))) lbcpost(100,lbc.offset+lbc.limit,lbc)
				else render()
			
			})

		}else{ render() }

	})

}

function lbcformencode(json) {

	lbc = {}
	lbc.ranges = {"price" : {"max":999999}}		
	lbc.keywords = {"text":json.q}
	lbc.enums = {"ad_type":["offer"]}
	lbc.location = {"locations":[]}

	param = json.params

	if (param.cat && $.isNumeric(param.cat[0])) lbc.category = {"id":param.cat[0]}
	if (param.titre) lbc.keywords.type = "subject"
	if (param.km) lbc.ranges.mileage = rangify(param.km)
	if (param.prix) lbc.ranges.price = rangify(param.prix)
	if (param.annee) lbc.ranges.regdate = rangify(param.annee)

	lbc = {"filters":lbc}
	lbc.limit = 10
	lbc.limit_alu = 3
	lbc.offset = 0

	return lbc

}

function lbcaddecode(ad) { 

	ad["flags"] = []
	ad["imgs"] = []
	
	txt = ad["subject"]+""+ad["body"]

	if (ad["attributes"]) $.each(ad["attributes"],function(attr) { if (ad["attributes"][attr]["key"] == "mileage") txt = txt+"|"+ad["attributes"][attr]["value"]+" km" })

	ttc = rgx(txt, "[^\\d](\\d[\\d\\s\\.]{2,7})[^\\d]{0,8}T\\.?T\\.?C\\.?--$1")
	if (!ttc) ttc = rgx(txt, "[^\\d]T\\.?T\\.?C\\.?[^\\d]{0,8}(\\d[\\d\\s\\.]{2,7})--$1")
	if (ttc) ad["price"] = Number(ttc.split(/[^0-9]/).join(""))
	else ad["price"] = ad["price"][0]

	// if (form["prix"] && ad["price"][0] > form["prix"].split(",")[1]) ad["flags"].push(["MONEY"])

	if (form.params["regex"]) $.each(form.params["regex"], function(reg,reg) {
	
		reg = rgx(txt, reg)
		if (reg) ad["flags"].push(["green",reg])

	})

	if (form.params["unrgx"]) $.each(form.params["unrgx"], function(reg,reg) {
	
		reg = rgx(txt, reg)
		if (reg) ad["flags"].push(["red",reg])
		
	})

	ad["flags"] = unik(ad["flags"])
	if (!Array.isArray(ad["images"]["urls"])) ad["images"]["urls"] = []
	else $.each(ad["images"]["urls"], function(ik) { if (ad["imgs"].length < 4) ad["imgs"][ik] = rgx(ad["images"]["urls"][ik], "/([\\w\\d]+)\\.lebo.+/([\\w\\d]+)\\.jpg--$1-$2") })

	ad["subject"] = ad["subject"].split(new RegExp("[^a-zA-Z-0-9 ]", "m")).join("")

	ad = {

		"key":"lbc"+ad["list_id"],
		"title":ad["subject"],
		"price":ad["price"],
		"flags":ad["flags"],
		"images":ad["imgs"],
		"location":ad["location"]["zipcode"],
		"date":ad["index_date"],
		"owner":ad["owner"]["user_id"]

	}

	return ad

}

function addflag(target,value) {

	$.each(adslist, function(cur) { 

		if(adslist[cur].key == target) {	
			console.log("addflag: ["+value[0]+","+value[1]+"] to: "+target)
			adslist[cur].flags.push(value)
			jsonpost({"data":[adslist[cur]]})
			return

		}
	})

}

function remflag(target,value) {

	$.each(adslist, function(cur) { 

		if(adslist[cur].key == target) {
			
			if (adslist[cur].flags) $.each(adslist[cur].flags, function(currem) { 
				
				if (String(adslist[cur].flags[currem][0]) == String(value[0]) && String(adslist[cur].flags[currem][1]) == String(value[1])) {
					console.log("removed: ["+String(value[0])+","+String(value[1])+"] to: "+target )
					adslist[cur].flags.splice(currem,1)
					return
				}

			})

			jsonpost({"data":[adslist[cur]]})
			return

		}
	})

}

function showbox(ad,ad) {

	// if ($("#results").children("#ad").length > maxdisplay) return false

	box = $("#ad").clone(true).appendTo("#results")
	box.hide()

	box.attr("class", ad["key"])
	box.children("#title").html(ad["title"])
	box.children("#price").html(ad["price"])
	box.children("#title").on("click", function() { 

		addflag($(this).parent().attr("class"), ["black","NO"]) 
		$(this).parent().hide().children("#infos").prepend("<a class='black'>NO</a>")

	})
	
	$.each(String(ad["images"]).split(","), function(kimg,img) {
				
		img = img.split("-")
		img = "https://"+img[0]+".leboncoin.fr/ad-small/"+img[1]+".jpg"
		if (kimg < 3) box.children("#images").append("<img>").children("img").last().attr("src", img);
		else delete ad["images"][kimg]
	})

	if (ad["flags"]) $.each(ad["flags"], function(flag,flag) {
	
		box.children("#infos").prepend("<a class='"+flag[0]+"'>"+flag[1]+"</a>") .children("a:eq(0)").on("click",function() {

			remflag($(this).parent().parent().attr("class"),[$(this).attr("class"),$(this).html()])
			$(this).remove()
		

		})
		if (!inarray(flag,flags))  flags.push(flag)
		

	}) 


	if (!ad["flags"] || (ad["flags"] && ad["flags"].length == 0)) box.children("#infos").html("<a class='white'>Y / N</a>")
	if (ad["date"] && ad["date"]  > 20190911000000) box.children("#infos").prepend("<a class='orange'>NEW</a>") 
	
	box.children("#images").on("click", function() { window.open("https://www.leboncoin.fr/annonce/"+ad["key"].substr(3,ad["key"].length-3)+".html", "_blank"); })

}

function render() {

	/// MULTI QUERY
	if (forms.length > 1 && nowform < forms.length-1) {

		nowform++
		form = forms[nowform]
		lbcpost()
		
		return 

	}

	adslist.sort(function(a, b) {  return b.date - a.date })

	console.log("total: "+adslist.length)

	box = $("#ad").clone(true).appendTo("#results")
	$("#results").html(box)

	currentdisplay = 0
	flags = []

	$.each(adslist, showbox);
	$("#results").prepend("<br /><br /><br />")  

	$.each(flags, function(kflag,flag) {

		$("#results").prepend("<b id='flags' class='"+flag[0]+"'>"+flag[1]+"</b> ")  

	})

	$("#results").children("b#flags").on("click", function() {     

		tarr = $("a."+$(this).attr("class")+":contains('"+$(this).html()+"')")
		if (tarr.not(":hidden").length > 0) tarr.parent().parent().hide()
		else tarr.parent().parent().show()

	})

}

// RUN ///////////////////////////////////////////////////////////////


function resizeInput() { 

	$(this).parent().children("span").html($(this).val())
	$(this).css("width", $(this).parent().children("span").css("width")	)

 } 

addEventListener('click', function (ev) { ev.preventDefault() })

String.prototype.jjj = function () { this }

init()

function dprice(displaypricemin,displaypricemax) { $("#results").children("#ad:visible").each(function() { if (Number($(this).children("#price").html()) > displaypricemax || Number($(this).children("#price").html()) < displaypricemin) $(this).hide() }) }
// $("#results").children("#ad:visible").each(function() { if $(this).children("#price").html() < 7500) $(this).hide() })

function commut(item) {

	if (item.css("display") == "none") item.show()
	else item.hide()}

$(document).on('keypress',function(e) { 
// console.log(e)
 if(e.which == 97) { 

 	$("a.green").parent().parent().hide()
 	$("a.white").parent().parent().hide()
 	$("a.black").parent().parent().hide()
 	$("a.red").parent().parent().show()

 }
 if(e.which == 122) { 

 	$("a.green").parent().parent().show()
 	$("a.white").parent().parent().hide()
 	$("a.black").parent().parent().hide()
 	$("a.red").parent().parent().hide()

 }
 if(e.which == 101) { 

  	$("a.green").parent().parent().hide()
 	$("a.black").parent().parent().hide()
 	$("a.red").parent().parent().hide()
 	$("a.white").parent().parent().show()
 }

  if(e.which == 114) { 

  	$("a.green").parent().parent().hide()
 	$("a.white").parent().parent().hide()
 	$("a.red").parent().parent().hide()
 	$("a.black").parent().parent().show()
 }

  if(e.which == 116) { 

  	$("a.green").parent().parent().hide()
 	$("a.white").parent().parent().hide()
 	$("a.red").parent().parent().hide()
 	$("a.orange").parent().parent().show()
 }


 });

$("html").prepend("<b style=\"position:absolute;bottom:0;background-color:#0F0;color:#000;\">JS</b>")

});