import { Metadata } from 'next';
export const metadata: Metadata = { title: 'Blog', description: 'Stories, product updates, and thoughts from CheeTaxi.' };

const POSTS = [
  { title: 'Why we built CheeTaxi: a mobility platform for Africa, by Africans', date: '2026-07-10', excerpt: 'The story of why we started CheeTaxi and our mission to fix mobility across the continent.', tag: 'Company' },
  { title: 'No commission, ever: how the driver subscription model works', date: '2026-07-08', excerpt: 'A deep dive into our pricing model — why drivers pay one flat fee and keep 100% of every fare.', tag: 'Product' },
  { title: 'Behind the dispatch engine: how we match passengers with drivers in seconds', date: '2026-07-05', excerpt: 'Technical deep-dive into our Redis GEO-based dispatch system.', tag: 'Engineering' },
  { title: 'Safety first: inside our 24/7 SOS operations center', date: '2026-07-01', excerpt: 'How our safety team responds to SOS alerts in under 60 seconds, 24 hours a day.', tag: 'Safety' },
  { title: 'Scaling across Africa: our multi-region architecture', date: '2026-06-25', excerpt: 'How we designed CheeTaxi to scale from one city to 54 countries without rewriting code.', tag: 'Engineering' },
];

export default function BlogPage() {
  return (
    <main className="mx-auto max-w-4xl px-6 py-16">
      <h1 className="font-display text-4xl font-extrabold text-ink-900">CheeTaxi Blog</h1>
      <p className="mt-2 text-ink-600">Stories from the team building the most modern mobility platform for Africa.</p>

      <div className="mt-12 space-y-8">
        {POSTS.map((p) => (
          <article key={p.title} className="border-b border-ink-100 pb-8">
            <div className="flex items-center gap-3 text-xs">
              <span className="rounded-full bg-brand-100 px-2 py-0.5 font-semibold text-brand-700">{p.tag}</span>
              <span className="text-ink-500">{p.date}</span>
            </div>
            <h2 className="mt-3 font-display text-2xl font-bold text-ink-900 hover:text-brand-600 cursor-pointer">{p.title}</h2>
            <p className="mt-2 text-ink-600">{p.excerpt}</p>
            <div className="mt-3 text-sm font-semibold text-brand-600">Read more →</div>
          </article>
        ))}
      </div>
    </main>
  );
}
