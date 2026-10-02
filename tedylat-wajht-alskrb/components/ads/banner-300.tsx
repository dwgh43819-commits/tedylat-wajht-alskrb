'use client'

import Script from 'next/script'

export function Banner300() {
  return (
    <div className="flex justify-center py-4">
      <Script id="adsterra-300-config" strategy="afterInteractive">
        {`
          window.atOptions = {
            'key': 'c99c79e9265646fd94b5c253f9db4966',
            'format': 'iframe',
            'height': 250,
            'width': 300,
            'params': {}
          };
        `}
      </Script>

      <Script
        src="https://dcengg.org/22/c99c79e9265646fd94b5c253f9db4966"
        strategy="afterInteractive"
      />
    </div>
  )
}
