const express = require('express');
const crypto = require('crypto');
var bodyParser = require('body-parser');
var cors = require('cors')
const path = require('path');
var pg = require('pg');
const app = express();
var urlencodedParser = bodyParser.urlencoded({extended: false});
var db_connection = "postgres://postgres:Geetha@99@localhost:5432/postgres";
app.set('view engine', 'ejs');
app.use(cors());
app.get('/', (req, res)=>{ 
  
    res.render('index'); 
    
    
}); 


var client = new pg.Client(db_connection);
client.connect();

app.post('/validate_user', urlencodedParser, (req,res) => {
    let username = req.body.username;
    let pwd = req.body.password;
    console.log(req.body);
    client.query('SELECT * from login where username=$1 and password=$2',[username,pwd],(err,results)=>{
        if(err)
          console.log(err)
        
    if(results.rows.length == 1){
        client.query('SELECT * from enrollment where rollno=$1',[username],(err,result)=>{
            if(err)
              console.log(err)
              
              if(result.rows.length == 1){
                var date1, date2,date3;
                date1 = new Date();
                var fine;
                var total;
                date1.setHours(0,0,0,0);
            
                date2 = new Date( "Mar 01, 2020" );
                date3 = new Date("Mar 04,2020");
                
                if (date1 > date2 && date3 > date1) {
                  fine='0';
                  total='700';
                } else {
                  fine='100';
                  total='800';
                }
            
                var data = {name:result.rows[0].name, rollno:result.rows[0].rollno, semester:result.rows[0].sem, p1:result.rows[0].p1, p2:result.rows[0].p2,  p3:result.rows[0].p3, p4:result.rows[0].p4,  p5:result.rows[0].p5, fine:fine, totalamount:total,status:result.rows[0].status};
                res.render('home1',{data:data});
              }

        });
    }
    else{
        res.redirect("http://localhost:3030/fail");
    }

    });
    
});
app.post('/update_user', urlencodedParser, (req,res) => {
    let username = req.body.username;
    let pwd = req.body.password;
    console.log(req.body);
    client.query('UPDATE login SET password = $1 WHERE email = $2',
    [pwd,username], (err,res)=>{
        if(err){
            console.log(err)
        }
      });
   res.redirect('http://localhost:8080');
    
});
 

var data,name,rollno,amount,tid,mid;

app.post('/createHash',urlencodedParser, (req,res) => {
   try{
    let str = ""
    let tid=crypto.randomBytes(Math.ceil(7/2)).toString('hex').slice(0,7);
    let mid="mid4939988";
    let data = str.concat(req.body.name,"|",req.body.regno,"|",req.body.totalamount,"|",tid,"|",mid);
    let x = data.split("|");
    const secret = 'sha256';
    const hash = crypto.createHash('sha256',secret)
                        .update(data)
                        .digest('hex');
    let final = str.concat(data+"|"+hash);
    console.log(final);
    client.query('INSERT INTO transaction(name,rollno,tid,mid,status) VALUES ($1,$2,$3,$4,$5)',
    [x[0],x[1],x[3],x[4],'Failure'], (err,res)=>{
        if(err){
            console.log(err)
        }
      
    });
        res.redirect('http://localhost:3030/checksemshash?input='+final)
   }
   catch(e){
       console.log(e)
   }
    
});

app.get('/statuscheck',(req,res) => {
    let input = req.query.input;
    const secret = 'sha256';
    let input_array = input.split("|");
    let hashed_data = input_array.pop();
    name = input_array[0];
    rollno = input_array[1];
    amount = input_array[2];
    tid = input_array[3];
    mid = input_array[4];
    status = input_array[5];
    let data = input_array.join("|");
    const hash = crypto.createHash('sha256',secret)
                        .update(data)
                        .digest('hex');
    if(hash==hashed_data){
        if(status=="success")
        {
            client.query('UPDATE transaction SET status = $1 WHERE tid = $2 AND mid = $3',
            [status,tid,mid], (err,res)=>{
                console.log("yes");
                if(err){
                    console.log(err)
                }
                client.query('UPDATE enrollment SET status = $1 WHERE rollno=$2',
                [status,rollno], (err,res)=>{
                    if(err){
                        console.log(err)
                    }
                  });
              });
             
              res.redirect("http://localhost:3030/success");
        }
        else
         {
            client.query('UPDATE transaction SET status = $1 WHERE tid = $2 AND mid = $3',
            [status,tid,mid], (err,res)=>{
                if(err){
                    console.log(err)
                }
              });
              client.query('UPDATE enrollment SET status = $1 WHERE rollno=$2',
              [status,rollno], (err,res)=>{
                  if(err){
                      console.log(err)
                  }
                });
              res.redirect("http://localhost:3030/fail");
         }
        
    }
    else{
        client.query('UPDATE transaction SET status = $1 WHERE tid = $2 AND mid = $3',
            ['Failure',tid,mid], (err,res)=>{
                if(err){
                    console.log(err)
                }
              });
              client.query('UPDATE enrollment SET status = $1 WHERE rollno=$2',
              ['Failure',rollno], (err,res)=>{
                  if(err){
                      console.log(err)
                  }
                });
        res.redirect("http://localhost:3030/fail");
    }
})

app.listen('8080',() => {
    console.log('Server started on port 8080...'); 
});