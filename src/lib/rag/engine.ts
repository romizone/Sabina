export interface RagDocument {
  id: string;
  kind:
    | "sop"
    | "cif"
    | "savings"
    | "loan"
    | "card"
    | "wealth"
    | "transaction"
    | "tx_month"
    | "location"
    | "service";
  title: string;
  category: string;
  cif?: string;
  keywords: string[];
  text: string;
  sla?: string;
}

export interface RetrievedChunk {
  id: string;
  kind: RagDocument["kind"];
  title: string;
  category: string;
  score: number;
  text: string;
  sla?: string;
}

export function tokenize(text: string): string[] {
  return text
    .toLowerCase()
    .replace(/[^a-z0-9\u00c0-\u024f\s]/gi, " ")
    .split(/\s+/)
    .filter((t) => t.length > 1);
}

export interface RagIndex {
  docs: RagDocument[];
  postings: Map<string, number[]>;
  df: Map<string, number>;
  avgLen: number;
}

export function buildIndex(docs: RagDocument[]): RagIndex {
  const postings = new Map<string, number[]>();
  const df = new Map<string, number>();
  let totalLen = 0;

  docs.forEach((doc, i) => {
    const bag = new Set(tokenize(`${doc.title} ${doc.category} ${doc.keywords.join(" ")} ${doc.text}`));
    totalLen += bag.size;
    for (const token of bag) {
      const list = postings.get(token);
      if (list) list.push(i);
      else postings.set(token, [i]);
      df.set(token, (df.get(token) ?? 0) + 1);
    }
  });

  return {
    docs,
    postings,
    df,
    avgLen: docs.length ? totalLen / docs.length : 1,
  };
}

export function searchIndex(
  index: RagIndex,
  query: string,
  opts?: { k?: number; kinds?: RagDocument["kind"][]; cif?: string; minScore?: number },
): RetrievedChunk[] {
  const k = opts?.k ?? 8;
  const qTokens = tokenize(query);
  if (!qTokens.length || !index.docs.length) return [];

  const N = index.docs.length;
  const scores = new Float64Array(N);
  const tf = new Map<string, number>();
  for (const t of qTokens) tf.set(t, (tf.get(t) ?? 0) + 1);

  for (const [token, qf] of tf) {
    const post = index.postings.get(token);
    if (!post) continue;
    const df = index.df.get(token) ?? 1;
    const idf = Math.log(1 + (N - df + 0.5) / (df + 0.5));
    const boost = qf;
    for (const i of post) {
      scores[i] += idf * boost;
    }
  }

  const qlow = query.toLowerCase();
  const wantKinds = opts?.kinds ? new Set(opts.kinds) : null;
  const ranked: { i: number; s: number }[] = [];

  for (let i = 0; i < N; i += 1) {
    const doc = index.docs[i]!;
    if (wantKinds && !wantKinds.has(doc.kind)) continue;
    let s = scores[i]!;
    if (opts?.cif && doc.cif === opts.cif) s += 1.8;
    for (const kw of doc.keywords) {
      if (kw.length > 2 && qlow.includes(kw.toLowerCase())) s += 2.4;
    }
    if (qlow.includes(doc.title.toLowerCase().slice(0, 18))) s += 1.2;
    if (s < (opts?.minScore ?? 0.35)) continue;
    ranked.push({ i, s });
  }

  ranked.sort((a, b) => b.s - a.s);
  return ranked.slice(0, k).map(({ i, s }) => {
    const doc = index.docs[i]!;
    return {
      id: doc.id,
      kind: doc.kind,
      title: doc.title,
      category: doc.category,
      score: Number(s.toFixed(2)),
      text: doc.text,
      sla: doc.sla,
    };
  });
}
