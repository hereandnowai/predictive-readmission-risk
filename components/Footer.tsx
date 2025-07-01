
import React from 'react';
import { ORGANIZATION_NAME_FULL, ORGANIZATION_SLOGAN, SOCIAL_LINKS, ORGANIZATION_EMAIL, ORGANIZATION_PHONE, ORGANIZATION_WEBSITE } from '../constants';

export const Footer: React.FC = () => {
  return (
    <footer className="bg-slate-200 dark:bg-dark-secondary text-slate-700 dark:text-text-secondary py-8">
      <div className="container mx-auto px-4">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8 mb-6">
          <div>
            <h5 className="font-semibold text-secondary dark:text-primary mb-2">{ORGANIZATION_NAME_FULL}</h5>
            <p className="text-sm italic">"{ORGANIZATION_SLOGAN}"</p>
          </div>
          <div>
            <h5 className="font-semibold text-secondary dark:text-primary mb-2">Contact Us</h5>
            <p className="text-sm">Email: <a href={`mailto:${ORGANIZATION_EMAIL}`} className="hover:text-primary">{ORGANIZATION_EMAIL}</a></p>
            <p className="text-sm">Phone: {ORGANIZATION_PHONE}</p>
            <p className="text-sm">Website: <a href={ORGANIZATION_WEBSITE} target="_blank" rel="noopener noreferrer" className="hover:text-primary">{ORGANIZATION_WEBSITE}</a></p>
          </div>
          <div>
            <h5 className="font-semibold text-secondary dark:text-primary mb-2">Follow Us</h5>
            <div className="flex space-x-4">
              {SOCIAL_LINKS.map((link) => (
                <a
                  key={link.name}
                  href={link.url}
                  target="_blank"
                  rel="noopener noreferrer"
                  aria-label={link.name}
                  className="text-slate-600 dark:text-text-secondary hover:text-primary transition-colors duration-150"
                >
                  {link.icon}
                </a>
              ))}
            </div>
          </div>
        </div>
        <div className="border-t border-slate-300 dark:border-gray-700 pt-6 text-center text-sm">
          <p>&copy; {new Date().getFullYear()} {ORGANIZATION_NAME_FULL}. All rights reserved.</p>
          <p>Developed by Arlin Robeiksha Britto [ AI Products Engineering Team]</p>
          <p className="mt-1">This tool is for demonstrative and research purposes only and should not be used for actual medical decisions without professional consultation.</p>
        </div>
      </div>
    </footer>
  );
};
