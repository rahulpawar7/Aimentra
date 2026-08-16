const API = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000/api/v1';

export async function fetchCMS(): Promise<Record<string, any>> {
  try {
    const res = await fetch(`${API}/cms`, { next: { revalidate: 60 } });
    if (!res.ok) return {};
    const json = await res.json();
    return json.data || {};
  } catch {
    return {};
  }
}

/** Fetch a single CMS block — always falls back to merged defaults from /cms */
export async function fetchCMSBlock(key: string): Promise<any> {
  const all = await fetchCMS();
  if (all[key]) return all[key];

  try {
    const res = await fetch(`${API}/cms/${key}`, { next: { revalidate: 60 } });
    if (!res.ok) return null;
    const json = await res.json();
    return json.data?.jsonValue ?? json.data ?? null;
  } catch {
    return null;
  }
}
