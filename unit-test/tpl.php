<?php

function inc_unit($name, $integration = false, $use_simple = false){

	$root = __DIR__;

	if(!$integration){

?><!DOCTYPE html>
<html class="G_N">
<head>
<meta charset="UTF-8">
<script>document.documentElement.className=location.hash?'G_H':'';G_rtop=+new Date;</script>
<title>Unit-Test:<?php echo $name ?>.js</title>
<link rel="stylesheet" href="/unit-test/reset.css" type="text/css" />
<style>
.neuron{width:700px; margin:0 auto; padding-top:10px;}
.neuron .cate{display:block; font-family: Verdana; font-size: 20px; padding-top:15px; color:#666; text-transform: uppercase; margin-bottom:10px;}
.neuron p{padding:0 0 10px; margin:0;}
.neuron a, .neuron .title{line-height:20px; font-size: 18px; padding-bottom:1px; margin-left:20px; font-family: Verdana; color:#1376b6; text-decoration: none; border-bottom:1px solid #fff;}
.neuron a:hover{border-bottom:1px solid #80c0ea;}
.neuron a span, .neuron .title span{color:#80c0ea; font-size:12px;}
.neuron .module-name{margin-left:0;}
</style>
<script>
var r = + new Date,
	OLD_VALUE = 1E4,

	KM = {
		oldValue: OLD_VALUE
	};

</script>
</head>
<body><div class="neuron"><h1 class="title">Neuron: <a class="module-name" href="/unit-test/<?php echo $name; ?>-slice.php"><?php echo strtoupper($name); ?></a> <span>unit test cases</span></h1></div><?php

	}

	/*
preg_match('/[-a-z\d]+$/i', $name, $brief_name);
	
	if($brief_name){
		$brief_name = $brief_name[0];
	}
*/
	
	require( $root . '/js.php');
	
	if($use_simple){
		require( $root . '/jasmine-simple.php');
	}else{
		require( $root . '/jasmine.php');
	}
	
	
	require( $name . '-slice.php');
	
	
	if(!$integration){

		if(!$use_simple){
?><script>

jasmine.getEnv().addReporter(new jasmine.TrivialReporter());jasmine.getEnv().execute();

</script><?php
		}

?></body>
</html><?php

	}


};

?>
