'use client'

import Script from 'next/script'

export function NativeBanner() {
  return (
    <div className="my-6 flex justify-center">
      <Script
        async
        data-cfasync="false"
        src="https://dcengg.org/21/a40cc5301d05333b76e7df82762da7f4"
      />

      <div id="container-a40cc5301d05333b76e7df82762da7f4" />
    </div>
  )
}
