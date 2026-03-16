import fs from 'fs';
import FormData from 'form-data';
import fetch from 'node-fetch';

async function testUpload() {
  try {
    const fileStream = fs.createReadStream('dummy.pdf');
    const form = new FormData();
    form.append('pdf', fileStream);

    console.log('Invio richiesta al backend...');
    const response = await fetch('http://localhost:3000/api/summarize', {
      method: 'POST',
      body: form
    });
    
    const data = await response.json();
    console.log('Risposta dal server:');
    console.log(data);
  } catch (err) {
    console.error('Errore nel test:', err);
  }
}

testUpload();
