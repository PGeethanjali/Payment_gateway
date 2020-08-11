const express = require('express');
const app = express();
var pg = require('pg');
const path = require('path');
var crypto = require('crypto');
const bodyParser = require('body-parser');
const router = express.Router();
var cors = require('cors');
router.use(cors());

var db_connection = "postgres://postgres:Geetha@99@localhost:5432/postgres";
router.use(bodyParser.urlencoded({ extended: true })); 
router.use(express.static(__dirname + '/assets'));

router.get('/payment-debit',function(req,res){
  res.sendFile(path.join(__dirname+'/debit.html'));
  
});
router.get('/payment-credit',function(req,res){
    res.sendFile(path.join(__dirname+'/credit.html'));
    
  });
router.get('/choose',function(req,res){
  res.sendFile(path.join(__dirname+'/choose.html'));
});
router.get('/net_bank',function(req,res){
    res.sendFile(path.join(__dirname+'/net.html'));
  });
  router.get('/fail',function(req,res){
    res.sendFile(path.join(__dirname+'/fail.html'));
  });
  router.get('/success',function(req,res){
    var stat='false';
   // setTimeout(function(){
    //stat='true';
     // res.redirect('http://localhost:8080/validate_user');
    //}, 3000);
    //Console.log(stat)
    //if(stat=='true'){
     // res.redirect('http://localhost:8080/validate_user');
    //}
    res.sendFile(path.join(__dirname+'/success.html'));
    
  });
  router.get('/pwd',function(req,res){
    res.sendFile(path.join(__dirname+'/pwd.html'));
  });
  router.get('/pwdchange',function(req,res){
    res.sendFile(path.join(__dirname+'/forgot.html'));
  });
var client = new pg.Client(db_connection);
client.connect();
var data;
router.post('/call_bank', (req,res) => {
    
    try{
    
        const key="sha256";
        let str="";
        let pgid =crypto.randomBytes(Math.ceil(7 / 2)).toString('hex').slice(0,7);
        let data1 = str.concat(data,"|",req.body.bank,"|pgID",pgid);
        let x= data1.split("|");
        const hash= crypto.createHash('sha256',key).update(data1).digest('hex');

        client.query('INSERT INTO pgtable(name,rollno,amt,tid,mid,pgid,status) VALUES ($1,$2,$3,$4,$5,$6,$7)',
    [x[0],x[1],x[2],x[3],x[4],x[8],'false'], (err,res)=>{
        if(err){
            console.log(err)
        }
      });
      let output = data1.concat("|",hash)
      res.redirect('http://localhost:8888/net_bank?input='+output);
        
        }
        catch(e){
            console.log(e)
        }
   
});
router.post('/pay', (req, res) => {
  
    try{
    const key="sha256";
    let str="";
    console.log(req.body)
    let pgid =crypto.randomBytes(Math.ceil(7 / 2)).toString('hex').slice(0,7);
    let data2 = str.concat(data,"|",req.body.name,"|",req.body.cardNumber,"|",req.body.cvv,"|pgID",pgid);
    let x= data2.split("|");

    const hash= crypto.createHash('sha256',key).update(data2).digest('hex');
    client.query('INSERT INTO pgtable(name,rollno,amt,tid,mid,pgid,status) VALUES ($1,$2,$3,$4,$5,$6,$7)',
    [x[0],x[1],x[2],x[3],x[4],x[8],'fail'], (err,res)=>{
        if(err){
            console.log(err)
        }
      });
      let output = data2.concat("|",hash);
     // res.header('input', output);
      res.redirect('http://localhost:8888/verifyHash?input='+output);
   
    }
    catch(e){
        console.log(e)
    }
  });
router.get('/checksemshash',(req,res)=>{
    try{
    const key="sha256";
    let input = req.query.input;
   // let input = "geetha|2016242005|5000.00|tID1234|mID5678|2da5979b5ff8b44de4d6febad20e966cc63a6da7e76ff0fc01f13c8c6d62247f";
    let x= input.split("|");
    let iphash= x.pop();
    data= x.join("|")
    const hash= crypto.createHash('sha256',key).update(data).digest('hex');
    
    if(hash == iphash){
        res.sendFile(path.join(__dirname+'/choose.html'));
    }
    else{
        res.sendFile(path.join(__dirname+'/fail.html'));
    }}
    catch(e){
        console.log(e)
    }
    
});
router.get('/checkbankhash',(req,res)=>{
    try{
    const key="sha256";
    let input = req.query.input;
   // let input = "geetha|2016242005|5000.00|tID1234|mID5678|pgID5d0626e|bIDakeg7456|success|d74d1405f4de315c99b90a7dcd44cf93f3dbad1b18219767d389840bd4ed537a";
    let result;
    let str="";
    let x= input.split("|");
    let iphash= x.pop();
    let data= x.join("|");
    console.log(input);
    console.log(iphash);
    const hash= crypto.createHash('sha256',key).update(data).digest('hex');
    console.log(hash);
    if(hash == iphash){
        client.query('UPDATE pgtable SET status = $1 WHERE tid = $2 AND mid = $3',
    [x[5],x[3],x[4]], (err,res)=>{
        if(err){
            console.log(err)
        }
      });
        const hash= crypto.createHash('sha256',key).update(data).digest('hex');
        result= data.concat("|",hash);
    }
    else{
        let poping = x.pop();
        let datas=  x.join("|");
        let data_res = str.concat(datas,"|","Fail");
        client.query('UPDATE pgtable SET status = $1 WHERE tid = $2 AND mid = $3',
        ['Fail',x[3],x[4]], (err,res)=>{
            if(err){
                console.log(err)
            }
          });
        const hash= crypto.createHash('sha256',key).update(data_res).digest('hex');
        result= data_res.concat("|",hash);
    }
    res.redirect('http://localhost:8080/statuscheck?input='+result);

}
    catch(e){
        console.log(e)
    }
    
});


app.use('/', router);
app.listen(process.env.port || 3030);

console.log('Running at Port 3030');