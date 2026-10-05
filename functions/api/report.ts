// @ts-nocheck
// functions/api/report.ts

// Document types we care about for buyers
const LIEN_TYPES = ['S/A', 'A/F', 'AM'];  // Security Agreement, Aircraft Financing Statement, Amendment
const RELEASE_TYPES = ['REL'];             // Release
const TRANSFER_TYPES = ['BS'];             // Bill of Sale

// Fetch and parse the FAA Document Index for an N-number.
// Returns an array of { document_id, document_type, received_date, parties }.
async function fetchFaaDocuments(nNumber: string) {
  try {
    const cleanN = nNumber.replace(/^N/i, '');
    const response = await fetch(
      'https://registry.faa.gov/aircraftinquiry/Search/DocIndexInquiryResult',
      {
        method: 'POST',
        headers: {
          'Content-Type': 'application/x-www-form-urlencoded',
          'User-Agent': 'Mozilla/5.0 (compatible; NNumberCheck/1.0)',
          'Accept': 'text/html,application/xhtml+xml,application/xml',
          'Referer': 'https://registry.faa.gov/aircraftinquiry/Search/DocIndexInquiry',
        },
        body: new URLSearchParams({
          'NNumber': cleanN,
          'SerialNumber': '',
          'Name': '',
          'Collateral': '',
          'DocumentType': 'All',
          'sortOption': 'NNumber',
          'searchType': 'NNumber',
        }).toString(),
      }
    );

    if (!response.ok) {
      console.error('FAA Document Index returned', response.status);
      return [];
    }

    const html = await response.text();
    return parseFaaHtml(html);
  } catch (err) {
    console.error('FAA scrape error:', err);
    return [];
  }
}

// Parse the FAA Document Index HTML table into structured records.
// The FAA uses ASP.NET and returns an HTML table with columns roughly:
// Document ID | Type | Received Date | Parties
function parseFaaHtml(html: string) {
  const docs = [];

  // Find all table rows
  const rowRegex = /<tr[^>]*>([\s\S]*?)<\/tr>/gi;
  let rowMatch;

  while ((rowMatch = rowRegex.exec(html)) !== null) {
    const rowHtml = rowMatch[1];

    // Extract text from each cell
    const cells = [];
    const cellRegex = /<td[^>]*>([\s\S]*?)<\/td>/gi;
    let cellMatch;

    while ((cellMatch = cellRegex.exec(rowHtml)) !== null) {
      const text = cellMatch[1]
        .replace(/<[^>]+>/g, '')
        .replace(/&nbsp;/g, ' ')
        .replace(/&amp;/g, '&')
        .replace(/\s+/g, ' ')
        .trim();
      cells.push(text);
    }

    // Valid data rows have 4+ cells and start with a numeric document ID
    if (cells.length >= 4 && /^\d{6,}$/.test(cells[0])) {
      docs.push({
        document_id: cells[0],
        document_type: cells[1] || '',
        received_date: cells[2] || '',
        parties: cells.slice(3).join(' | '),
      });
    }
  }

  return docs;
}

// Get documents for an N-number, using the D1 cache when available.
async function getDocuments(nNumber: string, env: any) {
  // 1. Check cache
  const cached = await env.DB.prepare(
    'SELECT document_id, document_type, received_date, parties FROM documents WHERE n_number = ? ORDER BY received_date DESC'
  )
    .bind(nNumber)
    .all();

  if (cached.results && cached.results.length > 0) {
    return cached.results;
  }

  // 2. Cache miss — fetch from FAA
  const fresh = await fetchFaaDocuments(nNumber);

  // 3. Store in cache
  if (fresh.length > 0) {
    try {
      const stmts = fresh.map((d) =>
        env.DB.prepare(
          'INSERT OR IGNORE INTO documents (n_number, document_id, document_type, received_date, parties) VALUES (?, ?, ?, ?, ?)'
        ).bind(nNumber, d.document_id, d.document_type, d.received_date, d.parties)
      );
      await env.DB.batch(stmts);
    } catch (err) {
      console.error('Failed to cache documents:', err);
    }
  }

  return fresh;
}

// Group documents into categories for the report
function categoriseDocuments(docs: any[]) {
  const liens = docs.filter((d) =>
    LIEN_TYPES.includes(d.document_type.toUpperCase().trim())
  );
  const releases = docs.filter((d) =>
    RELEASE_TYPES.includes(d.document_type.toUpperCase().trim())
  );
  const transfers = docs.filter((d) =>
    TRANSFER_TYPES.includes(d.document_type.toUpperCase().trim())
  );

  // Simple active detection: liens with no matching release (by document_id reference)
  // This is approximate — a proper match requires parsing the release text.
  const activeLiens = liens.filter((lien) => {
    const lienId = lien.document_id;
    return !releases.some(
      (rel) => rel.parties && rel.parties.includes(lienId)
    );
  });

  return {
    liens,
    releases,
    transfers,
    activeLiens,
    hasActiveLiens: activeLiens.length > 0,
  };
}

export const onRequestGet = async (context: any) => {
  const { request, env } = context;
  const url = new URL(request.url);
  const nNumber = (url.searchParams.get('n') || '').toUpperCase();
  const txnId = url.searchParams.get('txn') || '';

  if (!nNumber) {
    return new Response(
      JSON.stringify({ error: 'Missing n parameter' }),
      { status: 400, headers: { 'Content-Type': 'application/json' } }
    );
  }

  try {
    const purchase = await env.DB.prepare(
      `SELECT * FROM purchases
       WHERE n_number = ?
         AND status = 'completed'
       ORDER BY id DESC
       LIMIT 1`
    )
      .bind(nNumber)
      .first();

    if (!purchase) {
      return new Response(
        JSON.stringify({ error: 'No completed purchase found for this aircraft.' }),
        { status: 404, headers: { 'Content-Type': 'application/json' } }
      );
    }

    const aircraft = await env.DB.prepare(
      'SELECT * FROM aircraft WHERE n_number = ?'
    )
      .bind(nNumber)
      .first();

    const { results: accidents } = await env.DB.prepare(
      'SELECT * FROM accidents WHERE n_number = ? ORDER BY event_date DESC'
    )
      .bind(nNumber)
      .all();

    // Fetch matching ADs
    let directives = [];
    if (aircraft?.make || aircraft?.model) {
      const make = (aircraft.make || '').trim().split(' ')[0];
      const model = (aircraft.model || '').trim().split(' ')[0];

      const { results } = await env.DB.prepare(
        `SELECT * FROM directives
         WHERE (manufacturer LIKE ? OR manufacturer LIKE ?)
           AND (model LIKE ? OR title LIKE ?)
         ORDER BY effective_date DESC
         LIMIT 20`
      )
        .bind(`%${make}%`, `%${aircraft.make}%`, `%${model}%`, `%${model}%`)
        .all();
      directives = results || [];
    }

    // Fetch documents (liens, releases, transfers) — uses cache or scrapes FAA
    const rawDocuments = await getDocuments(nNumber, env);
    const documents = categoriseDocuments(rawDocuments);

    return new Response(
      JSON.stringify({
        purchase,
        aircraft: {
          ...(aircraft || {
            n_number: nNumber,
            make: null,
            model: null,
            year: null,
            serial_number: null,
            owner_name: null,
            owner_city: null,
            owner_state: null,
            registration_status: 'Deregistered',
            airworthiness_date: null,
          }),
          accidents: accidents || [],
          directives,
          documents,
        },
      }),
      { status: 200, headers: { 'Content-Type': 'application/json' } }
    );
  } catch (err) {
    return new Response(
      JSON.stringify({
        error: 'Database error',
        detail: String(err?.message || err),
      }),
      { status: 500, headers: { 'Content-Type': 'application/json' } }
    );
  }
};
