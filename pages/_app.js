import '../styles/globals.css'
import Script from 'next/script'
import { useState, useEffect } from 'react'
import 'prismjs/themes/prism-tomorrow.css';
import 'prismjs/plugins/line-numbers/prism-line-numbers.css';

function MyApp({ Component, pageProps }) {
  const [scriptsLoaded, setScriptsLoaded] = useState(false);

  useEffect(() => {
    if (typeof window !== 'undefined' && window.git && window.LightningFS) {
      setScriptsLoaded(true);
    }
  }, []);

  return (
    <>
      <Script 
        src="https://unpkg.com/isomorphic-git@1.26.4/index.umd.min.js" 
        strategy="beforeInteractive" 
        onLoad={() => console.log('isomorphic-git loaded')}
      />
      <Script 
        src="https://unpkg.com/@isomorphic-git/lightning-fs@4.6.0/dist/lightning-fs.min.js" 
        strategy="beforeInteractive"
        onLoad={() => console.log('lightning-fs loaded')}
      />
      {scriptsLoaded ? <Component {...pageProps} /> : <div>Loading scripts...</div>}
    </>
    
  )
}

export default MyApp