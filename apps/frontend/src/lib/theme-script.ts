// Runs inline in <head> before first paint so a returning dark-mode user never
// sees a light flash. Mirrors the resolution rule in theme-context.tsx:
// an explicit stored choice wins, otherwise follow the OS. Plain ES5 string —
// it is not bundled, and storage may throw (private mode, blocked site data).
export const THEME_STORAGE_KEY = 'eduanalyze-theme';

export const THEME_INIT_SCRIPT = `(function(){try{var t=null;try{t=localStorage.getItem('${THEME_STORAGE_KEY}')}catch(e){}if(t!=='light'&&t!=='dark'){t=window.matchMedia&&window.matchMedia('(prefers-color-scheme: dark)').matches?'dark':'light'}var r=document.documentElement;if(t==='dark'){r.classList.add('dark')}else{r.classList.remove('dark')}r.style.colorScheme=t}catch(e){}})();`;
