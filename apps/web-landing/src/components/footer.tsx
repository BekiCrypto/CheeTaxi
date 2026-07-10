import Link from 'next/link';

export function Footer() {
  return (
    <footer id="download" className="border-t border-ink-100 bg-ink-50">
      <div className="container-px mx-auto max-w-7xl py-16">
        <div className="grid gap-12 md:grid-cols-4">
          <div className="md:col-span-1">
            <div className="flex items-center gap-2">
              <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-brand-500 text-white font-display text-lg font-bold">
                C
              </div>
              <span className="font-display text-xl font-bold text-ink-900">CheeTaxi</span>
            </div>
            <p className="mt-4 text-sm text-ink-600">
              Fast. Reliable. African. Modern.
              <br />
              The most modern mobility platform designed for Africa.
            </p>
          </div>

          <div>
            <div className="font-display text-sm font-bold text-ink-900">Product</div>
            <ul className="mt-3 space-y-2 text-sm text-ink-600">
              <li><Link href="#passengers" className="hover:text-brand-600">For Passengers</Link></li>
              <li><Link href="#drivers" className="hover:text-brand-600">For Drivers</Link></li>
              <li><Link href="#modes" className="hover:text-brand-600">Services</Link></li>
              <li><Link href="#plans" className="hover:text-brand-600">Pricing</Link></li>
              <li><Link href="#safety" className="hover:text-brand-600">Safety</Link></li>
            </ul>
          </div>

          <div>
            <div className="font-display text-sm font-bold text-ink-900">Company</div>
            <ul className="mt-3 space-y-2 text-sm text-ink-600">
              <li><a href="#" className="hover:text-brand-600">About us</a></li>
              <li><a href="#" className="hover:text-brand-600">Careers</a></li>
              <li><a href="#" className="hover:text-brand-600">Press</a></li>
              <li><a href="#" className="hover:text-brand-600">Blog</a></li>
              <li><a href="#" className="hover:text-brand-600">Contact</a></li>
            </ul>
          </div>

          <div>
            <div className="font-display text-sm font-bold text-ink-900">Get the app</div>
            <div className="mt-3 space-y-2">
              <a href="#" className="block rounded-lg bg-ink-900 px-4 py-2 text-sm font-semibold text-white hover:bg-ink-700">
                Download for iOS
              </a>
              <a href="#" className="block rounded-lg bg-ink-900 px-4 py-2 text-sm font-semibold text-white hover:bg-ink-700">
                Download for Android
              </a>
            </div>
            <div className="mt-4 flex gap-3 text-sm text-ink-500">
              <span>🌐 English</span>
              <span>·</span>
              <span>አማርኛ</span>
              <span>·</span>
              <span>Afaan Oromoo</span>
            </div>
          </div>
        </div>

        <div className="mt-12 flex flex-col items-start justify-between gap-4 border-t border-ink-200 pt-8 text-sm text-ink-500 md:flex-row md:items-center">
          <div>© {new Date().getFullYear()} CheeTaxi Technologies. All rights reserved.</div>
          <div className="flex gap-6">
            <a href="#" className="hover:text-brand-600">Privacy</a>
            <a href="#" className="hover:text-brand-600">Terms</a>
            <a href="#" className="hover:text-brand-600">Security</a>
            <a href="#" className="hover:text-brand-600">Compliance</a>
          </div>
        </div>
      </div>
    </footer>
  );
}
