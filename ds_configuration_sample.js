// ds_configuration.js -- configuration information
// Either fill in the data below or set the environment variables
//
exports.config = {
  dsClientId: process.env.DS_CLIENT_ID || '' // The app's DocuSign integration key
  , dsClientSecret: process.env.DS_CLIENT_SECRET || '' // The app's DocuSign integration key's secret
  , templateID: process.env.DS_TEMPLATEID || '' // Need the template id here
  , accountID: process.env.DS_ACCOUNTID || '' // Need account id here
  , accessToken: process.DS_ACCESS_TOKEN || '' // Need Access Token here
  , appUrl: process.env.DS_APP_URL || 'http://localhost:5000' // The url of the application. Eg http://localhost:5000
  // NOTE: You must add a Redirect URI of appUrl/ds/callback to your Integration Key.
  // Example: http://localhost:5000/ds/callback
  , production: false
  , debug: true // Send debugging statements to console
  , sessionSecret: '12345' // Secret for encrypting session cookie content
  , allowSilentAuthentication: true // a user can be silently authenticated if they have an
  // active login session on another tab of the same browser
  , targetAccountId: null // Set if you want a specific DocuSign AccountId, If null, the user's default account will be used.
  , demoDocPath: 'demo_documents'
  , docDocx: 'World_Wide_Corp_Battle_Plan_Trafalgar.docx'
  , docPdf: 'World_Wide_Corp_lorem.pdf'
  // Payment gateway information is optional
  , gatewayAccountId: process.env.DS_PAYMENT_GATEWAY_ID || '{DS_PAYMENT_GATEWAY_ID}'
  , gatewayName: "stripe"
  , gatewayDisplayName: "Stripe"
  , githubExampleUrl: 'https://github.com/docusign/eg-03-node-auth-code-grant/tree/master/lib/examples/'
  , documentation: null
  //, documentation: 'https://developers.docusign.com/esign-rest-api/code-examples/'
  // Should source files for different software languages be shown?
  , multiSourceChooser: false
  , docOptions: [
  {langCode: 'csharp', name: 'C#',
  githubExampleUrl: 'https://github.com/docusign/eg-03-csharp-auth-code-grant-core/tree/master/eg-03-csharp-auth-code-grant-core/Controllers/',
  owner: 'docusign', repo: 'eg-03-csharp-auth-code-grant-core', pathPrefix: 'eg-03-csharp-auth-code-grant-core/Controllers/'
  },
  {langCode: 'php', name: 'PHP',
  githubExampleUrl: 'https://github.com/docusign/eg-03-php-auth-code-grant/blob/master/src/',
  owner: 'docusign', repo: 'eg-03-php-auth-code-grant', pathPrefix: 'src/'
  },
  {langCode: 'java', name: 'Java',
  githubExampleUrl: 'https://github.com/docusign/eg-03-java-auth-code-grant/tree/master/src/main/java/com/docusign/controller/examples/',
  owner: 'docusign', repo: 'eg-03-java-auth-code-grant', pathPrefix: 'src/main/java/com/docusign/controller/examples/'
  },
  {langCode: 'node', name: 'Node.js',
  githubExampleUrl: 'https://github.com/docusign/eg-03-node-auth-code-grant/tree/master/lib/examples/',
  owner: 'docusign', repo: 'eg-03-node-auth-code-grant', pathPrefix: 'lib/examples/'
  },
  {langCode: 'curl', name: 'API / curl',
  githubExampleUrl: 'https://github.com/docusign/eg-03-curl/tree/master/examples/',
  owner: 'docusign', repo: 'eg-03-curl', pathPrefix: 'examples/'
  },
  {langCode: 'python', name: 'Python',
  githubExampleUrl: 'https://github.com/docusign/eg-03-python-auth-code-grant/tree/master/app/',
  owner: 'docusign', repo: 'eg-03-python-auth-code-grant', pathPrefix: 'app/'
  },
  ]
  , docNames: {
  }
  // The gitHub settings are for the lib/utilities software.
  // They are reserved for use by DocuSign.
  , ghUserAgent: 'Example Source Updater'
  , gitHubAppId: 0
  , gitHubInstallationId: 0
  , gitHubPrivateKey: ``
  }
  exports.config.dsOauthServer = exports.config.production ?
  'https://account.docusign.com' : 'https://account-d.docusign.com';
