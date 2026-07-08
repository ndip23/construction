import { Link } from 'react-router-dom';

export const PublicFooter = () => (
  <footer className="bg-background border-t border-border mt-20">
    <div className="max-w-7xl mx-auto px-6 py-16 grid grid-cols-1 md:grid-cols-4 gap-10">
      <div>
        <div className="flex items-center gap-2 mb-4">
          <img src="/cpromark-logo.png" alt="Cpromark Logo" className="w-8 h-8 object-contain rounded-lg" />
          <span className="font-black text-foreground text-base">Cpromark</span>
        </div>
        <p className="text-foreground/40 text-sm leading-relaxed">The all-in-one platform for Africa's construction industry.</p>
      </div>
      {[
        { title: 'Platform', links: [['Find Builders','/directory'],['Cost Estimator','/estimator'],['Buy Materials','/marketplace'],['Post a Job','/post-project']] },
        { title: 'Account',  links: [['Register','/register'],['Login','/login']] },
        { title: 'Company',  links: [['About Us','/about'],['Contact','/contact'],['Privacy','#'],['Terms','#']] },
      ].map(col => (
        <div key={col.title}>
          <p className="text-[10px] font-black uppercase tracking-[0.2em] text-primary mb-4">{col.title}</p>
          <ul className="space-y-2">
            {col.links.map(([label, to]) => (
              <li key={label}>
                <Link to={to} className="text-foreground/40 hover:text-foreground text-sm font-medium transition-colors">{label}</Link>
              </li>
            ))}
          </ul>
        </div>
      ))}
    </div>
    <div className="border-t border-border px-6 py-6 text-center text-foreground/20 text-xs font-medium">
      © {new Date().getFullYear()} Cpromark Africa. All rights reserved.
    </div>
  </footer>
);
