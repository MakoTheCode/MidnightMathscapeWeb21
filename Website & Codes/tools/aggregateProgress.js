/*
  Browser-console friendly aggregator for StudentsProgress.

  Usage:
    1) Open your browser and go to any page on your site (or a blank tab).
    2) Open DevTools -> Console.
    3) Paste the function below and run it.
    4) When prompted, enter your database base URL, e.g.:
         https://midnightmathscape-e8e70-default-rtdb.firebaseio.com/

  The script will fetch /StudentsProgress.json, aggregate timeSpentSeconds per student per chapter,
  print a table to the console and create a downloadable CSV link appended to the page.
*/

(async function aggregateStudentsProgressInBrowser(){
  function normalizeChapterKey(raw){
    if(!raw) return null;
    const m = String(raw).match(/(\d{1,2})/);
    if(!m) return null;
    const n = parseInt(m[1], 10);
    if(Number.isNaN(n)) return null;
    return 'chapter' + n;
  }

  function secondsToHMS(secs){
    secs = Number(secs) || 0;
    const h = Math.floor(secs / 3600); const m = Math.floor((secs % 3600)/60); const s = secs % 60;
    return [h.toString().padStart(2,'0'), m.toString().padStart(2,'0'), s.toString().padStart(2,'0')].join(':');
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

  try{
    const dbUrl = window.prompt('Enter your Firebase Realtime DB URL', 'https://midnightmathscape-e8e70-default-rtdb.firebaseio.com/');
    if(!dbUrl) { console.log('No DB URL provided, aborting.'); return; }
    const url = (dbUrl.endsWith('/')? dbUrl.slice(0,-1) : dbUrl) + '/StudentsProgress.json';
    console.log('Fetching', url);
    const resp = await fetch(url, { method: 'GET', cache: 'no-store' });
    if(!resp.ok){ console.error('Failed to fetch StudentsProgress:', resp.status, resp.statusText); return; }
    const sp = await resp.json();
    if(!sp){ console.error('StudentsProgress node is empty or inaccessible.'); return; }

    const agg = aggregateTimeSpent(sp);

    // Print a compact table with per-chapter seconds and total + human readable
    const chapters = Array.from({length:12}, (_,i)=>'chapter'+(i+1));
    const table = [];
    for(const sid of Object.keys(agg)){
      const row = { studentId: sid };
      for(const ch of chapters){ row[ch] = agg[sid][ch] || 0; }
      row.totalSeconds = agg[sid].__totalSeconds || 0;
      row.total_hms = secondsToHMS(row.totalSeconds);
      table.push(row);
    }
    console.table(table);

    // CSV + download link
    const csv = toCsv(agg);
    console.log('\nCSV output:\n');
    console.log(csv);
    try{
      const blob = new Blob([csv], { type: 'text/csv' });
      const href = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = href; a.download = 'students_time_by_chapter.csv'; a.textContent = 'Download students_time_by_chapter.csv';
      a.style.position = 'fixed'; a.style.right = '12px'; a.style.bottom = '12px'; a.style.padding='8px'; a.style.background='#111'; a.style.color='#fff'; a.style.zIndex=999999;
      document.body.appendChild(a);
      console.log('Download link appended to page (bottom-right).');
    }catch(err){ console.warn('Could not create download link:', err.message); }

  }catch(err){ console.error('Aggregator error:', err.message); }

})();
