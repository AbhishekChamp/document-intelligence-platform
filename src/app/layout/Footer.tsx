import React, { memo } from "react";
import { Heart, Package } from "lucide-react";
import { GitHubIcon, LinkedInIcon } from "../../shared/components/icons";
import { APP_VERSION } from "../../shared/constants";

const FooterComponent: React.FC = () => {
  return (
    <footer className="mt-auto pt-8 pb-6 border-t border-gray-200 dark:border-gray-700 bg-gray-50/50 dark:bg-gray-900">
      <div className="max-w-7xl mx-auto px-6 lg:px-8">
        <div className="flex flex-col md:flex-row items-center justify-between gap-4">
          {/* Left: Copyright */}
          <div className="text-sm text-gray-500 dark:text-gray-400 text-center md:text-left">
            <p>
              Built with{" "}
              <Heart className="w-3.5 h-3.5 inline text-rose-500 fill-rose-500" />{" "}
              using React, TypeScript, and modern web technologies.
            </p>
            <p className="mt-1">
              © {new Date().getFullYear()} DocuIntel. MIT License.
            </p>
          </div>

          {/* Right: Social Links */}
          <div className="flex items-center gap-3">
            <a
              href="https://github.com/AbhishekChamp"
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-2 px-4 py-2 text-sm font-medium text-gray-600 dark:text-gray-400 hover:text-violet-600 dark:hover:text-violet-400 hover:bg-violet-50 dark:hover:bg-violet-900/20 rounded-xl transition-all"
              aria-label="GitHub Profile"
            >
              <GitHubIcon className="w-4 h-4" />
              <span>GitHub</span>
            </a>

            <a
              href="https://www.linkedin.com/in/abhishek-versatile-dev/"
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-2 px-4 py-2 text-sm font-medium text-gray-600 dark:text-gray-400 hover:text-violet-600 dark:hover:text-violet-400 hover:bg-violet-50 dark:hover:bg-violet-900/20 rounded-xl transition-all"
              aria-label="LinkedIn Profile"
            >
              <LinkedInIcon className="w-4 h-4" />
              <span>LinkedIn</span>
            </a>
          </div>
        </div>

        {/* Additional Info */}
        <div className="mt-6 pt-6 border-t border-gray-200 dark:border-gray-800">
          <div className="flex flex-col sm:flex-row items-center justify-between gap-2 text-xs text-gray-400 dark:text-gray-500">
            <p>
              Privacy-first document analysis. All processing happens locally in
              your browser.
            </p>
            <div className="flex items-center gap-1">
              <Package className="w-3 h-3" />
              <span>v{APP_VERSION}</span>
            </div>
          </div>
        </div>
      </div>
    </footer>
  );
};

export const Footer = memo(FooterComponent);
