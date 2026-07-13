import { Link } from 'react-router-dom';

export const PublicFooter = () => (
  <footer className="bg-background border-t border-border mt-20">
    <div className="max-w-7xl mx-auto px-6 py-12 flex flex-col gap-8">
      
      {/* Top part: Logo & Description / Tagline */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 border-b border-border pb-6">
        <div className="flex items-center gap-2">
          <img src="/cpromark-logo.png" alt="Cprohub Logo" className="w-8 h-8 object-contain rounded-lg" />
          <span className="font-black text-foreground text-base">Cprohub</span>
        </div>
        <p className="text-foreground/45 text-xs sm:text-sm font-semibold leading-relaxed max-w-md sm:text-right">
          The all-in-one platform for Africa's construction industry.
        </p>
      </div>

      {/* Three columns of links on ONE row */}
      <div className="grid grid-cols-3 gap-6">
        {[
          { title: 'Platform', links: [['Find Builders','/directory'],['Cost Estimator','/estimator'],['Buy Materials','/marketplace'],['Post a Job','/post-project']] },
          { title: 'Account',  links: [['Register','/register'],['Login','/login']] },
          { title: 'Company',  links: [['About Us','/about'],['Contact','/contact'],['Privacy','#'],['Terms','#']] },
        ].map(col => (
          <div key={col.title}>
            <p className="text-[10px] font-black uppercase tracking-[0.2em] text-primary mb-3">{col.title}</p>
            <ul className="space-y-2">
              {col.links.map(([label, to]) => (
                <li key={label}>
                  <Link to={to} className="text-foreground/45 hover:text-foreground text-xs font-semibold transition-colors block leading-tight">{label}</Link>
                </li>
              ))}
            </ul>
          </div>
        ))}
      </div>

      {/* Copyright */}
      <div className="border-t border-border pt-6 text-center text-foreground/20 text-[10px] font-semibold">
        © {new Date().getFullYear()} Cprohub Africa. All rights reserved.
      </div>
      
    </div>
  </footer>
);
