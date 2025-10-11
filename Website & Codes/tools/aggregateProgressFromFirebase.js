'use strict';
// aggregateProgressFromFirebase.js
// Fetches StudentsProgress from a Firebase Realtime Database URL and aggregates timeSpentSeconds per student per chapter.
// Usage: node aggregateProgressFromFirebase.js <databaseUrl>
// Example:
//   node aggregateProgressFromFirebase.js https://midnightmathscape-e8e70-default-rtdb.firebaseio.com/

const https = require('https');
const url = require('url');
const fs = require('fs');
const path = require('path');

function fetchJson(dbUrl, nodePath){
  return new Promise((resolve, reject)=>{
    const parsed = new URL((dbUrl.endsWith('/')? dbUrl.slice(0,-1) : dbUrl) + '/' + nodePath + '.json');
    const opts = { method: 'GET' };
    https.get(parsed, opts, (res)=>{
      let raw = '';
      res.on('data', (chunk)=> raw += chunk);
      res.on('end', ()=>{
        try{ const obj = JSON.parse(raw); resolve(obj); }catch(err){ reject(new Error('Failed to parse JSON from DB: ' + err.message)); }
      });
    }).on('error', (e)=> reject(e));
  });
}

function normalizeChapterKey(raw){
  if(!raw) return null;
  const m = raw.match(/(\d{1,2})/);
  if(!m) return null;
  const n = parseInt(m[1], 10);
  if(Number.isNaN(n)) return null;
  return 'chapter' + n;
}

function aggregateTimeSpent(studentsProgress){
  const out = {};
  for(const studentId of Object.keys(studentsProgress||{})){
    const chapters = studentsProgress[studentId] || {};
    out[studentId] = {};
    let studentTotal = 0;
    for(const rawChap of Object.keys(chapters)){
      const norm = normalizeChapterKey(rawChap);
      if(!norm) continue;
      const attempts = chapters[rawChap] || {};
      let chapterTotal = 0;
      for(const attemptId of Object.keys(attempts)){
        const attempt = attempts[attemptId] || {};
        const t = attempt.timeSpentSeconds;
        const secs = (typeof t === 'number') ? t : (typeof t === 'string' && t.trim() !== '' ? Number(t) : 0);
        if(Number.isFinite(secs)) chapterTotal += secs;
      }
      out[studentId][norm] = (out[studentId][norm] || 0) + chapterTotal;
      studentTotal += chapterTotal;
    }
    out[studentId].__totalSeconds = studentTotal;
  }
  return out;
}

function toCsv(agg){
  const chapters = Array.from({length:12}, (_,i)=>'chapter'+(i+1));
  const lines = [];
  lines.push(['studentId', ...chapters, 'totalSeconds'].join(','));
  for(const sid of Object.keys(agg)){
    const row = [sid];
    for(const ch of chapters){ row.push(agg[sid][ch] || 0); }
    row.push(agg[sid].__totalSeconds || 0);
    lines.push(row.join(','));
  }
  return lines.join('\n');
}

async function main(){
  const dbUrl = process.argv[2] || 'https://midnightmathscape-e8e70-default-rtdb.firebaseio.com/';
  try{
    console.error('Fetching StudentsProgress from', dbUrl);
    const sp = await fetchJson(dbUrl, 'StudentsProgress');
    if(!sp){ console.error('No StudentsProgress node found at the provided URL.'); process.exit(1); }
    const agg = aggregateTimeSpent(sp);
    const csv = toCsv(agg);
    const outPath = path.join(__dirname, '..', 'students_time_by_chapter_live.csv');
    fs.writeFileSync(outPath, csv, 'utf8');
    console.log(csv);
    console.error('Wrote CSV to', outPath);
  }catch(err){ console.error('Error:', err.message); process.exit(1); }
}

if(require.main===module) main();
