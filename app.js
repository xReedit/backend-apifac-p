const express = require('express');
const bodyParser = require('body-parser');
const app = express();
const mysql = require('mysql');
var config = require('./config');
// var cors=require('cors');
 
// parse application/json
app.use(bodyParser.json());
 
//create database connection
const conn = mysql.createConnection({
  host: config.host,
  user: config.user,
  password: config.password,
  database: config.database,
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
    
    let sql = `SELECT svd.document_id, vd.id, (if (vd.id || svd.document_id, 'ANULADO', 'ACEPTADO')) as estado
            , d.id,DATE_FORMAT(d.date_of_issue, '%d/%m/%Y') as fecha, SUBSTRING_INDEX(dt.description, ' ', 1) as tipo_doc
            , concat(d.series,'-', LPAD(d.number,7, '0')) as num_doc, cast(d.customer->>'$.name' as char(250)) as nom_cliente, cast(d.customer->>'$.number' as char(11)) as ruc, d.customer->>'$.identity_document_type_id' as tipo_doc_id_cliente, d.customer->>'$.number' as num_doc_cliente
            , format(d.total_value,2) as subtotal, format(d.total_igv,2) as igv, format(d.total,2) as total
            , d.series, d.rpt_sunat, d.document_type_id as tipo_doc_id, d.series as serie_doc, d.number as numero_doc, d.currency_type_id as moneda_doc
            , format(d.total_prepayment,2) as total_prepago
            , format(d.total_discount,2) as total_descuento
            , format(d.total_charge,2) as total_cargo
            , format(d.total_exportation,2) as total_exportacion
            , format(d.total_free,2) as total_gratuito
            , format(d.total_taxed,2) as total_gravado
            , format(d.total_unaffected,2) as total_inafecto
            , format(d.total_exonerated,2) as total_exonerado
            , format(d.total_igv,2) as total_igv
            , format(d.total_base_isc,2)
            , format(d.total_isc,2) as total_isc
            , format(d.total_base_other_taxes,2) as total_otros_tributos
            , format(d.total_other_taxes,2) as total_otros_cargos
            , format(d.total_taxes,2) as total_otros_impuestos
            , format(d.total_value,2) as total_valor_venta            
        from documents as d
            left join voided_details as vd on d.id=vd.document_id
            left join (
                SELECT sdt.document_id
                from summaries as s
                    inner join summary_details as sdt on sdt.summary_id=s.id
                where s.process_type_id=3
            ) as svd on d.id = svd.document_id
            inner join document_types as dt on d.document_type_id=dt.id
            inner join companies as co on d.user_id = co.user_id 
        where d.user_id=${arr.id} and (co.number='${arr.ruc}' and SUBSTR(d.series,2)='${arr.s}') and (MONTH(d.date_of_issue)=${arr.m} and YEAR(d.date_of_issue)=${arr.y})
        order by d.date_of_issue desc, d.number desc`;

    let query = conn.query(sql, (err, results) => {
        if(err) throw err;
        res.json({"status": 200, "error": null, "data": results});
    });
});


// cambia voided_details por voided_documents | cat_document_types summary_documents
app.get('/api2/documents',(req, res) => {
    const arr = req.body;
    
    let sql = `SELECT d.user_id, svd.document_id, vd.id, (if (vd.id || svd.document_id, 'ANULADO', 'ACEPTADO')) as estado
            , d.id,DATE_FORMAT(d.date_of_issue, '%d/%m/%Y') as fecha, SUBSTRING_INDEX(dt.description, ' ', 1) as tipo_doc
            , concat(d.series,'-', LPAD(d.number,7, '0')) as num_doc, cast(d.customer->>'$.name' as char(250)) as nom_cliente, cast(d.customer->>'$.number' as char(11)) as ruc
            , format(d.total_value,2) as subtotal, format(d.total_igv,2) as igv, format(d.total,2) as total
            , d.series
        from documents as d
            left join voided_documents as vd on d.id=vd.document_id
            left join (
                SELECT sdt.document_id
                from summaries as s
                    inner join summary_documents as sdt on sdt.summary_id=s.id
                where s.summary_status_type_id=3
            ) as svd on d.id = svd.document_id
            inner join cat_document_types as dt on d.document_type_id=dt.id
            inner join companies as co on d.user_id = co.user_id 
        where (co.number='${arr.ruc}' and SUBSTR(d.series,2)='${arr.s}') and (MONTH(d.date_of_issue)=${arr.m} and YEAR(d.date_of_issue)=${arr.y})
        order by d.date_of_issue desc, d.number desc`;

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
app.listen(config.port,() =>{
  console.log('Server started on port 3719...');
});
