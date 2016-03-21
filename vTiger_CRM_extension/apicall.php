<?php

	error_reporting(0);
	$endpointUrl = "http://174.136.15.141/forecast/webservice.php";
	$userName='admin';
	$userAccessKey = 'fHyn6Y7Y6LviuVH0';
	
	require_once 'Zend/Loader.php';
	require_once 'HTTP/Client.php';
	Zend_Loader::loadClass(Zend_Json);
	if(!function_exists('getBody'))
		{
			function getBody($response) {
						return Zend_Json::decode($response["body"]);
					}
		}
	//username of the user who is to logged in. 
	
	
	$httpc = new HTTP_CLIENT();
	//getchallenge request must be a GET request.
	$httpc->get("$endpointUrl?operation=getchallenge&username=$userName");
	$response = $httpc->currentResponse();
	//decode the json encode response from the server.
	$jsonResponse = Zend_JSON::decode($response['body']);

	//check for whether the requested operation was successful or not.
	if($jsonResponse['success']==false) 
		//handle the failure case.
		die('getchallenge failed:'.$jsonResponse['error']['errorMsg']);

	//operation was successful get the token from the reponse.
	$challengeToken = $jsonResponse['result']['token'];

	

	//create md5 string concatenating user accesskey from my preference page 
	//and the challenge token obtained from get challenge result. 
	$generatedKey = md5($challengeToken.$userAccessKey);
	//login request must be POST request.
	$httpc->post("$endpointUrl", 
		array('operation'=>'login', 'username'=>$userName, 
					'accessKey'=>$generatedKey), true);
	$response = $httpc->currentResponse();
	//decode the json encode response from the server.
	$jsonResponse = Zend_JSON::decode($response['body']);

	//print_r($jsonResponse);

	//operation was successful get the token from the reponse.
	if($jsonResponse['success']==false)
		//handle the failure case.
		die('login failed:'.$jsonResponse['error']['errorMsg']);

	//login successful extract sessionId and userId from LoginResult to it can used for further calls.
	$sessionId = $jsonResponse['result']['sessionName']; 
	$userId = $jsonResponse['result']['userId'];
		




$query = "select * from Contacts;";
//urlencode to as its sent over http.
$queryParam = urlencode($query);
//sessionId is obtained from login result.
$params = "sessionName=$sessionId&operation=query&query=$queryParam";
//query must be GET Request.
$httpc->get("$endpointUrl?$params");
$response = $httpc->currentResponse();
//decode the json encode response from the server.
$jsonResponse = Zend_JSON::decode($response['body']);		
	
		print_r($jsonResponse);


?> 