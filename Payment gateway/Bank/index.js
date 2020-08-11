const express = require('express');
const crypto = require('crypto');
var bodyParser = require('body-parser');
var cors = require('cors')
const path = require('path');
var pg = require('pg');

const app = express();


var db_connection = "postgres://postgres:Geetha@99@localhost:5432/postgres";
var urlencodedParser = bodyParser.urlencoded({extended: false});
app.use(cors());
app.set('view engine', 'ejs');

var data,name,rollno,amount,tid,mid;
var client = new pg.Client(db_connection);
client.connect();
app.get('/debit',function(req,res){
    res.sendFile(path.join(__dirname+'/debit.html'));
    
  });
  app.get('/bank',function(req,res){
    res.sendFile(path.join(__dirname+'/netbanking.html'));
    
  });
app.get('/verifyHash', (req,res) => {
    try{
    const secret = 'sha256';
    let result;
    let input = req.query.input;
    console.log(req.query.input)
    //let input = "Nalini|2016242014|20665.00|tid2019443|mid4939988|2f482a7b81337393212f7a815fe8a71986517bc33ab88cc561ceb55e9745fe74";
    let input_array = input.split("|");
    let hashed_data = input_array.pop();
    console.log(hashed_data)
    name = input_array[0];
    rollno = input_array[1];
    amount = input_array[2];
    tid = input_array[3];
    mid = input_array[4];
    data = input_array.join("|");
    const hash = crypto.createHash('sha256',secret)
                        .update(data)
                        .digest('hex');
    console.log(hash)
    if(hash==hashed_data){
        result= "true";
    }
    else{
        result= "false";
    }
    res.send(result)
}
    catch(e){
        console.log(e)
    }
});

app.get('/net_bank', (req,res) => {
    try{
    const secret = 'sha256';
    let input = req.query.input;
    let result;
   // let input = "Nalini|2016242014|20665.00|tid2019443|mid4939988|2f482a7b81337393212f7a815fe8a71986517bc33ab88cc561ceb55e9745fe74";
    let input_array = input.split("|");
    name = input_array[0];
    rollno = input_array[1];
    amount = input_array[2];
    tid = input_array[3];
    mid = input_array[4];
    let hashed_data = input_array.pop();
  
    data = input_array.join("|");
    const hash = crypto.createHash('sha256',secret)
                        .update(data)
                        .digest('hex');
    if(hash==hashed_data){
        result= 'true';
    }
    else{
        result ='false';
    }
    res.send(result);
}
    catch(e){
        console.log(e)
    }
   
});

app.post('/validate_user', urlencodedParser, (req,res) => {
    let name = req.body.name;
    let pwd = req.body.password;
    var data=[];
    let result;

    client.query('SELECT * from  userlogin where username=$1 and password=$2',[name,pwd],(err,results)=>{
        if(err)
          throw err;
    console.log(results.rows.length)
    if(results.rows.length == 1){
        res.sendFile(__dirname + '/debit.html');
    }
    else{
        res.redirect("http://localhost:3030/fail");
    }

    });
    
    
});

app.post('/call_bank', urlencodedParser, (req,res) => {
   try{
    const secret = 'sha256';
    let str="";
    let result;
    let data2;
    
    let bank = req.body.otp;
    if(bank == '123456'){
        var data = str.concat(name,"|",rollno,"|",amount,"|",tid,"|",mid,"|","success")
        const hash = crypto.createHash('sha256',secret)
                        .update(data)
                        .digest('hex');
        data2 = str.concat(data,"|",hash)    ;
        result ='true';           
        
    }else{
        var data = str.concat(name,"|",rollno,"|",amount,"|",tid,"|",mid,"|","failure")
        const hash = crypto.createHash('sha256',secret)
                        .update(data)
                        .digest('hex');
        data2 = str.concat(data,"|",hash)  ;
        result='false';
       
    }
    res.redirect('http://localhost:3030/checkbankhash?input='+data2)
    //res.send(data2);
    console.log(bank);}
    catch(e){
        console.log(e)
    }
});

app.listen('8888',() => {
    console.log('Server started on port 8888...'); 
});