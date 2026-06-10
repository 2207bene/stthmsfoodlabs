const BASE_URL = "https://api.campflow.de";

export type CampflowPerson = {
  id: string;
  name: {
    first_name: string;
    last_name: string;
  };
  birthdate: string | null;
  gender: string | null;
  diet: string[];
  intolerances: string[];
};

type ListPersonsResponse = {
  data: CampflowPerson[];
  meta: {
    next_cursor?: string | null;
  };
};

function authHeaders(): HeadersInit {
  return { Authorization: `Bearer ${process.env.CAMPFLOW_API_TOKEN}` };
}

export async function fetchAllPersons(
  listId: string,
): Promise<CampflowPerson[]> {
  const all: CampflowPerson[] = [];
  let cursor: string | null = null;

  do {
    const url = new URL(`/lists/${listId}/persons`, BASE_URL);
    if (cursor) url.searchParams.set("cursor", cursor);

    const res = await fetch(url.toString(), { headers: authHeaders() });
    if (!res.ok) {
      throw new Error(`Campflow API error ${res.status}: ${await res.text()}`);
    }

    const json: ListPersonsResponse = await res.json();
    all.push(...json.data);
    cursor = json.meta.next_cursor ?? null;
  } while (cursor !== null);

  return all;
}
