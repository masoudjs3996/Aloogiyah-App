export type TermsEnvelope = {
  hash: string;
  document: { version: string; title: string; publishedOn: string; introduction: string;
    sections: { id: string; audience: "All" | "Farmer" | "Shop"; title: string; paragraphs: string[] }[];
    sources: { title: string; url: string }[] };
  operator: { name?: string | null; address?: string | null; email?: string | null; phone?: string | null };
};
