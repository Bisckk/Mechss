// Run once: node scripts/generate-vapid.mjs
// Copy the output into your .env.local

import webpush from 'web-push'

const { publicKey, privateKey } = webpush.generateVAPIDKeys()

console.log('\nAdd these to your .env.local:\n')
console.log(`NEXT_PUBLIC_VAPID_PUBLIC_KEY=${publicKey}`)
console.log(`VAPID_PRIVATE_KEY=${privateKey}`)
console.log(`VAPID_EMAIL=mailto:admin@motofix.co`)
console.log()
