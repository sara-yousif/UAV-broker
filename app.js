
/**
 * Module dependencies.
 */

var express = require('express')
  , routes = require('./routes')
  , user = require('./routes/user')
  , http = require('http')
  , path = require('path')
  ,	pg = require('pg')
  , request = require('request');


var app = express();
var router = express.Router();

// all environments
app.set('port', process.env.PORT || 3000);
app.set('views', __dirname + '/views');
app.set('view engine', 'jade');
app.use(express.favicon());
app.use(express.logger('dev'));
app.use(express.bodyParser());
app.use(express.methodOverride());
app.use(app.router);
app.use(express.static(path.join(__dirname, 'public')));
this.protocol = http;
// development only
if ('development' == app.get('env')) {
  app.use(express.errorHandler());
}
var uavs = [];
var address = [];
var providers = [];
var resources = [];

var uav = {
		id : '',
		name : '',
		status : '',
		power : '',
		address : ''
		};

var resource = {
		id : '',
		name : '',
		provider : '',
		method : '',
		uri : ''
			};

var client = new pg.Client({
user: "postgres",
password: "root",
database: "postgres",
port: 5432,
host: "localhost"
//ssl: true
}); 
client.connect();

app.get('/', routes.index);
app.get('/users', user.list);
///////////////////////////////////////////////////////begin POST service ///////////////////////////////////////
app.post('/service/:service', function(req, response){
	 console.log(req.params.service);
	 var requested = req.params.service;
	// response.send({'requested' : req.params.service});
	 
	 
		var query1 = client.query('SELECT r.id, u.name, r.provider, u.address, r.method, r.uri FROM resources r, uavs u where r.name = \''+ requested + '\' AND r.provider = u.id AND u.status = \'available\'');
	
		 query1.on('row', function(row) {
			// console.log('step 11 = ' + JSON.stringify(row));
		 	
		 resource.id = row.id;
		 resource.name = row.name;
		 resource.provider = row.provider;
		 resource.method = row.method;
		 resource.uri = row.uri;
		// providers.push(row.provider);
		//  console.log('step 1  = '+ parseInt(resource.provider));
			 uav.address = row.address;
			 uav.name = row.name;
		 
		 // response.send('ok2');
	
		 // console.log(providers.valueOf());
		 });
	
		 query1.on('end', function() {
			// console.log('2');
		 //var query2 = client.query('SELECT * FROM uavs where id IN (1,2,3) AND status = \'available\''); // '+ parseInt(resource.provider)+' AND power > 50 AND status = \'available\'');
		// var query2 = client.query('UPDATE uavs SET status = \'not available\' where id = ' + resource.provider);
		if (resource.provider!== '')
			{
			 console.log(resource.method+ '  ' + 'http://'+ uav.address +''+ resource.uri);
			request({
	        method: resource.method,
	        url: 'http://'+ uav.address +''+ resource.uri,
			 	json:true 
	        }, function (err,res,body){
	            console.log("response2 : ");
	             providers.push({'name': uav.name, 'resource': requested , 'message' : body});
	            console.log(JSON.stringify({'name': resource.name, 'resource':requested}));
	           //
	           // response.send(body);
	            var query2 = client.query('UPDATE uavs SET status = \'not available\' where id = ' + resource.provider);
				client.query("INSERT INTO operation (provider, status) values($1, $2)", [resource.provider, "not done"]);
				response.send(providers.valueOf());
				resource.provider= '';
				
				providers= [];
	        });  
			
			}else {
				response.send('no UAV available');
			}		 
			 
	 });
		 

});
////////////////////////////////////////////////////end POST service /////////////////////////////////////////////////////////////



///////////////////////////////////////////////////////begin GET service ///////////////////////////////////////
app.get('/service/:service', function(req, response){
	 console.log(req.params.service);
	 var requested = req.params.service;
	 var i =0;
	// response.send({'requested' : req.params.service});
	 
	 
		var query1 = client.query('SELECT u.name, o.provider, u.address, r.method, r.uri, o.message FROM resources r, uavs u, operation o where r.name = \''+ requested + '\' AND o.provider = u.id AND o.provider = r.provider AND o.status = \'not done\'');
	
		 query1.on('row', function(row) {
			 console.log('step 11 = ' + JSON.stringify(row));
		//providers.push(row);
		// providers[i++].message = i;
			
		// resource.id = row.id;
		 //resource.name = row.name;
		 resource.provider = row.provider;
		 resource.method = row.method;
		 resource.uri = row.uri;
		// providers.push(row.provider);
		//  console.log('step 1  = '+ parseInt(resource.provider));
			 uav.address = row.address;
			 uav.name = row.name;		

		 });
	
		 query1.on('end', function() {
			// console.log('2');
		 //var query2 = client.query('SELECT * FROM uavs where id IN (1,2,3) AND status = \'available\''); // '+ parseInt(resource.provider)+' AND power > 50 AND status = \'available\'');
		// var query2 = client.query('UPDATE uavs SET status = \'not available\' where id = ' + resource.provider);
		if (providers!== [])
			{
			// console.log(resource.method+ '  ' + 'http://'+ uav.address +''+ resource.uri);

			request({
		        method: resource.method,
		        url: 'http://'+ uav.address +''+ resource.uri,
		      json:true 
		        }, function (err,res,body){
		            console.log("response2 : ");
		            providers.push({'name': uav.name, 'resource': requested , 'message' : body});
		           // console.log(body);
		            //response.send(body);
		        });  
			 console.log(providers.valueOf());
			response.send(providers.valueOf());
			resource.provider= '';
			providers= [];
			}else {
				response.send('no UAV available');
			}		 
			 
	 });
		 

});
////////////////////////////////////////////////////end GET service /////////////////////////////////////////////////////////////


///////////////////////////////////////////////////////begin PUT service ///////////////////////////////////////
app.put('/:name/:service', function(req, response){
	 console.log(req.params.service);
	 var requested = req.params.service;
	 var name = req.params.name;
	// response.send({'requested' : req.params.service});
	 
	 
		var query1 = client.query('SELECT u.name, o.provider, u.address, r.method, r.uri, o.message FROM resources r, uavs u, operation o where r.name = \''+ requested + '\' AND u.name = \''+ name + '\'  AND o.provider = u.id AND o.provider = r.provider AND o.status = \'not done\'');
		 query1.on('row', function(row) {
			// console.log('step 11 = ' + JSON.stringify(row));
		 	
		 resource.id = row.id;
		 resource.name = row.name;
		 resource.provider = row.provider;
		 resource.method = row.method;
		 resource.uri = row.uri;
		// providers.push(row.provider);
		//  console.log('step 1  = '+ parseInt(resource.provider));
			 uav.address = row.address;
			 uav.name = row.name;
		 
		 // response.send('ok2');
	
		 // console.log(providers.valueOf());
		 });
	
		 query1.on('end', function() {
			// console.log('2');
		 //var query2 = client.query('SELECT * FROM uavs where id IN (1,2,3) AND status = \'available\''); // '+ parseInt(resource.provider)+' AND power > 50 AND status = \'available\'');
		// var query2 = client.query('UPDATE uavs SET status = \'not available\' where id = ' + resource.provider);
		if (resource.provider!== '')
			{
			 console.log(resource.method+ '  ' + 'http://'+ uav.address +''+ resource.uri);
			request({
	        method: resource.method,
	        url: 'http://'+ uav.address +''+ resource.uri,
	      json:true 
	        }, function (err,res,body){
//	            console.log("response2 : ");
			 providers.push({'name': uav.name, 'resource': requested , 'message' : body});
	            console.log(JSON.stringify({'name': resource.name, 'resource':requested}));
	           
//	            response.send(body);
	        	response.send(providers.valueOf());
				resource.provider= '';
				
				providers= [];
	        });  
		
			}else {
				response.send('no UAV available');
			}		 
			 
	 });
		 

});
////////////////////////////////////////////////////end PUT service /////////////////////////////////////////////////////////////


app.put('/:service/:id', function(req, response){
	 console.log(req.params.service);
	 console.log(req.params.id);
	 var myval= req.body.value;
	 var myid = req.params.id;
	//	var query = client.query('UPDATE operations SET value where name = \''+ requested + '\'');
		 client.query("UPDATE operation SET value=($1), status=($2) WHERE id=($3)", [myval, 'done', myid]);
		 response.send({message : 'ok'});
});

app.get('/on', function(req, response){
	request({
        method: "GET",
        url: "http://192.168.1.11/spray/1",
          
       
            json:true 
        }, function (err,res,body){
            console.log("response1 : ");
            
            console.log(body);
            response.send({'mymessage' : 'done'});
        });  
});
app.get('/streams', function(req, response){
//	req.getRemoteAddr() ;
	console.log("request : ");
	console.log(req);
	 response.send({'mymessage' : 'done'});
});
app.get('/off', function(req, response){
	request({
        method: "GET",
        url: "http://192.168.1.11/spray/0",
          
       
            json:true 
        }, function (err,res,body){
            console.log("response2 : ");
            
            console.log(body);
            response.send({'message' : 'done'});
        });  
});

app.get('/uavs', function(req, response){
	 var query = client.query('SELECT address FROM uavs where power > 50');
	 query.on('row', function(row) {
		 console.log(row.address);
		 address.push(row.address);
		// result.addRow(row);
		
	 });
	 query.on('end', function(result) { 
		 console.log('end');
		 console.log(address.valueOf());
		// console.log(JSON.stringify(result.rows, null, "    "));
		 response.writeHead(200, {'Content-Type': 'application/json'});
		// response.write(JSON.stringify(result.rows) + "\n");
		 response.end();
		//  client.end();
		});
});


http.createServer(app).listen(app.get('port'), function(){
  console.log('Express server listening on port ' + app.get('port'));
});
