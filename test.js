import { parseFile } from './server/services/parser.js';

const csv = `name,reports to
Hatim Maskawala,
Ali Bhuriwala,Hatim Maskawala
John Doe,"Hatim Maskawala, Ali Bhuriwala"`;

const buffer = Buffer.from(csv, 'utf8');

const employees = parseFile(buffer, 'csv');
console.log(JSON.stringify(employees, null, 2));
