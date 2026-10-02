'use client'

import Script from 'next/script'

export function Banner300() {
  return (
    <div className="my-6 flex justify-center">
      <Script id="adsterra-banner-config">
        {`
          atOptions = {
            'key' : 'c99c79e9265646fd94b5c253f9db4966',
            'format' : 'iframe',
            'height' : 250,
            'width' : 300,
            'params' : {}
          };
        `}
      </Script>

      <Script
        id="adsterra-banner-script"
        async
        src="https://dcengg.org/22/c99c79e9265646fd94b5c253f9db4966"
        strategy="afterInteractive"
      />
    </div>
  )
}
