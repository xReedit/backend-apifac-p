const express = require('express');
const bodyParser = require('body-parser');
const app = express();
const mysql = require('mysql');
// var cors=require('cors');
 
// parse application/json
app.use(bodyParser.json());
 
//create database connection
const conn = mysql.createConnection({
  host: 'localhost',
  user: 'usbackapifac',
  password: 'csjsm182182#Consult@#',
  database: 'apifacturalo',
  // multipleStatements: true, // acepta multimples consultas
});
 
//connect to database
conn.connect((err) =>{
  if(err) throw err;
  console.log('Base de datos mysql, online...');
});

//show all products
app.get('/api/documents',(req, res) => {
    const arr = req.body;

    let sql = `SELECT vd.id, d.id,DATE_FORMAT(d.date_of_issue, '%d/%m/%Y') as fecha, SUBSTRING_INDEX(dt.description, ' ', 1) as tipo_doc
            , concat(d.series,'-', LPAD(d.number,7, '0')) as num_doc, cast(d.customer->>'$.name' as char(250)) as nom_cliente, cast(d.customer->>'$.number' as char(11)) as ruc
            , format(d.total_value,2) as subtotal, format((d.total_value-total_exonerated),2) as igv, format(d.total,2) as total, (if (vd.id, 'ANULADO', 'ACEPTADO')) as estado
            , d.series
        from documents as d
            left join voided_details as vd on d.id=vd.document_id
            inner join document_types as dt on d.document_type_id=dt.id
        where (d.user_id=${arr.id} and SUBSTR(d.series,2)='${arr.s}') and (MONTH(d.date_of_issue)=${arr.m} and YEAR(d.date_of_issue)=${arr.y})
        order by d.id desc`;
    let query = conn.query(sql, (err, results) => {
        if(err) throw err;
        res.json({"status": 200, "error": null, "data": results});
    });
});

app.get('/api/companies',(req, res) => {
    const arr = req.body;

    let sql = `SELECT user_id, number as ruc, name as razonsocial, trade_name as razoncomercial, DATE_FORMAT(created_at, '%m/%Y') as mes_inicio from companies order by name`;
    let query = conn.query(sql, (err, results) => {
        if(err) throw err;
        res.json({"status": 200, "error": null, "data": results});
    });
});

//Server listening
app.listen(3719,() =>{
  console.log('Server started on port 3719...');
});
