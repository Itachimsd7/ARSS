/**
 * gmailAuth.js
 *
 * ONE-TIME SETUP SCRIPT — run this once to get your Gmail refresh token.
 *
 * Usage:
 *   node services/gmailAuth.js
 *
 * Then copy the printed refresh token into your server/.env file.
 */

require('dotenv').config({ path: require('path').join(__dirname, '..', '.env') })
const { google } = require('googleapis')
const readline = require('readline')

const CLIENT_ID     = process.env.GMAIL_CLIENT_ID
const CLIENT_SECRET = process.env.GMAIL_CLIENT_SECRET

if (!CLIENT_ID || !CLIENT_SECRET) {
  console.error('\n❌  GMAIL_CLIENT_ID and GMAIL_CLIENT_SECRET must be set in server/.env first.\n')
  console.log('Steps:')
  console.log('  1. Go to https://console.cloud.google.com/')
  console.log('  2. Create a project → Enable Gmail API')
  console.log('  3. Create OAuth2 credentials (Desktop app type)')
  console.log('  4. Add GMAIL_CLIENT_ID and GMAIL_CLIENT_SECRET to server/.env')
  console.log('  5. Run this script again\n')
  process.exit(1)
}

const oauth2Client = new google.auth.OAuth2(
  CLIENT_ID,
  CLIENT_SECRET,
  'urn:ietf:wg:oauth:2.0:oob'
)

const SCOPES = [
  'https://www.googleapis.com/auth/gmail.readonly',
  'https://www.googleapis.com/auth/gmail.modify',
]

const authUrl = oauth2Client.generateAuthUrl({
  access_type: 'offline',
  scope: SCOPES,
  prompt: 'consent',
})

console.log('\n📧  Gmail OAuth2 Setup\n')
console.log('1. Open this URL in your browser (must be logged in as aibasedresumescreeningsystem@gmail.com):')
console.log('\n' + authUrl + '\n')
console.log('2. Authorize the app and copy the code shown.\n')

const rl = readline.createInterface({ input: process.stdin, output: process.stdout })

rl.question('3. Paste the authorization code here: ', async (code) => {
  rl.close()
  try {
    const { tokens } = await oauth2Client.getToken(code.trim())
    console.log('\n✅  Success! Add this to your server/.env:\n')
    console.log(`GMAIL_REFRESH_TOKEN=${tokens.refresh_token}\n`)
    console.log('Then restart the server — email polling will start automatically.')
  } catch (err) {
    console.error('\n❌  Failed to get token:', err.message)
  }
})
