<?php

$LBCurl = "https://api.leboncoin.fr/finder/search";

$LBCheaders = array( /* LOL HEADERS LBC 2019 */
	"Accept: */*",
    "User-Agent: meffiezvousdfesours",
	"Accept-Language: mangezdespommes",
	"Accept-Encoding: roulezvousparreterre",
	"api_key: ba0c2dad52b3ec"
);


$sqlbase = mysqli_connect("localhost", "lbc", "lbc", "");

if (mysqli_connect_errno()) {
    printf("Connect failed: %s\n", mysqli_connect_error());
    exit();
}
/////////2019/////////////////
//
//   Codé par eubé KC pour un mion mion
//
/////////////////////////////////////////// . . .

//////////////////
// Init
//////////////////

function secure($query) { return preg_replace("/[^\w\d\s\*\.@\-,]/","",$query); }

$get = [];
$post = [];
foreach ($_GET as $k => $v) { $get[secure($k)] = secure($v); }
foreach ($_POST as $k => $v) { $post[secure($k)] = secure($v); }

function shortkey($kl = 8) {

	$chars = "azertyuiopqsdfghjklmxcvbnAZERTYUIOPQSDFGHJKLMWXCVBN1234567890";
	// $chars = "azertyuiopqsdfghjklmxcvbn";
	$chars = str_split($chars);
	$chain = "";
	for ($i = 0; $i < $kl; $i++) { $chain .= $chars[rand(0,sizeof($chars)-1)]; }
	return ($chain);

}

function dbg ($xxx,$yyy=null) {  print_r($xxx); }

//////////////////
// Fx
//////////////////

function www($url, $data=false, $headers=false) {

	$ch = curl_init($url);

	if ($headers)

		curl_setopt($ch, CURLOPT_HTTPHEADER,  $headers);

	if ($data)

		curl_setopt($ch, CURLOPT_CUSTOMREQUEST, "POST");
		curl_setopt($ch, CURLOPT_POSTFIELDS, $data);

	curl_setopt($ch, CURLOPT_RETURNTRANSFER, true);

	$html = curl_exec($ch);
	curl_close($ch);

	return json_decode($html);
}

function sqli($q) {

	global $sqlbase;
	return mysqli_query($sqlbase, $q);

}

function getkey($key) {

	$key = "WHERE id = '".join("' OR id = '",$key)."'";

	$results = sqli("SELECT id,data FROM data $key");

	$output = [];

	while ($row = mysqli_fetch_assoc($results)) {

		$row["data"] = json_decode(str_replace('\\', '\\\\', $row["data"]), true);

		if (($row["data"]["key"] = $row["id"]) != TRUE) print_r($row);

		array_push($output, $row["data"]);
	}

	if ($output == []) $output = false;
	return $output;

}

function links($key,$list=false) {

	// echo $key."---";
	if ($list) {

		$newlist = $list;
		$oldlist = sqli("SELECT list FROM links WHERE id = '$key' ");
		$oldlist = mysqli_fetch_assoc($oldlist);
		$oldlist = json_decode($oldlist["list"]);
		if (!is_array($oldlist)) $oldlist = [];
		$list = json_encode(array_merge($oldlist,$list));
		sqli("DELETE FROM links WHERE id = '$key' ");
		sqli("INSERT INTO links VALUES('$key', '$list') ");
		return $newlist;

	}else{

		$oldlist = sqli("SELECT list FROM links WHERE id = '$key' ");
		$oldlist = mysqli_fetch_assoc($oldlist);
		$oldlist = ["links"=>json_decode($oldlist["list"])];
		return $oldlist;

	}

}

function data($data) {

	$newlinks = [];

	foreach ($data as $key => $val) {


		if (isset($val["key"])) {

			$key = $val["key"];
			unset($val["key"]);

			if (getkey([$key])) {

				$val = json_encode($val);

				sqli("UPDATE data SET data='$val' WHERE id='$key'");
				array_push($newlinks,$key);
				continue;
			}

		}else{

			$key = shortkey(12);
			while (getkey([$key])) $key = shortkey(12);

		}

		$val = json_encode($val);

		sqli("INSERT INTO data VALUES ('$key','$val')");
		array_push($newlinks,$key);

	}
	return $newlinks;

}

//////////////////
// Run
//////////////////

$data = json_decode(file_get_contents('php://input'), true);

// $data = json_decode('{"key":["WrVCOuI0d7YH"]}', true);

$output = [];



sqli("INSERT INTO data VALUES('aaa','bbb')");

echo mysqli_error($sqlbase);

exit();

if (isset($data["lbc"])) $output = www($LBCurl,json_encode($data["lbc"]),$LBCheaders);


if (isset($data["data"])) {

	$links = data($data["data"]);
	if (isset($data["link"])) $output = links($data["link"][0],$links);
	else $output = $links;

}elseif (isset($data["key"])) { $output = getkey($data["key"]);

}elseif (isset($data["link"])) { $output = links($data["link"][0],(isset($data["list"])?$data["list"]:false));

}else {}

exit(json_encode($output));

?>
