const docusign = require('docusign-esign')
    , path = require('path')
    , process = require('process')
    , {promisify} = require('util') // http://2ality.com/2017/05/util-promisify.html
    , basePath = 'https://demo.docusign.net/restapi'
    , express = require('express')
    , envir = process.env
    , dsConfig = require('./ds_configuration.js').config
    , commonControllers = require('./lib/commonControllers')
    , signerClientId = 1000 // The id of the signer within this application.
    ;
// baseUrl is the url of the application's web server. Eg http://localhost:3000
// In some cases, this example can determine the baseUrl automatically.
// See the baseUrl statements at the end of this example.

const PORT = process.env.PORT || 5000
    , HOST = process.env.HOST || 'localhost'
    ;

let hostUrl = 'http://' + HOST + ':' + PORT

if (dsConfig.appUrl != '') {hostUrl = dsConfig.appUrl}

let baseUrl = envir.BASE_URL || hostUrl;

/**
 * Creates envelope
 * @function
 * @param {Object} args object
 * @returns {Envelope} An envelope definition
 * @private
 */
function makeEnvelope(args){
  // Data for this method
  // args.signerEmail
  // args.templateID
  // args.signerEmail
  // args.signerName
  // args.signerClientId
  // args.signerAddress1
  // args.signerAddress2
  // args.signerAddress3
  // args.signerPhone
  // args.ccEmail
  // args.ccName

  // The envelope request object uses Composite Template to
  // include in the envelope:
  // 1. A template stored on the DocuSign service
  // 2. An additional document which is a custom HTML source document

  // Create Recipients for server template. Note that Recipients object
  // is used, not TemplateRole
  //
  // Create a signer recipient for the signer role of the server template
  //

  let signer1 = docusign.Signer.constructFromObject({
          email: args.signerEmail,
          name: args.signerName,
          roleName: "signer",
          recipientId: "1",
          // Adding clientUserId transforms the template recipient
          // into an embedded recipient:
          clientUserId: args.signerClientId,
          "tabs": {
            "textTabs": [
              {
                "tabLabel": "Address1",
                "value": args.signerAddress1,
                "locked": "true"
              },
              {
                "tabLabel": "Address2",
                "value": args.signerAddress2,
                "locked": "true"
              },
              {
                "tabLabel": "Address3",
                "value": args.signerAddress3,
                "locked": "true"
              },
              {
                "tabLabel": "Phone",
                "value": args.signerPhone,
                "locked": "true"
              },
            ]
          },
      });
  // Create the cc recipient
  /*
  //let cc1 = docusign.CarbonCopy.constructFromObject({
      email: args.ccEmail,
      name: args.ccName,
      roleName: "cc",
      recipientId: "2"
  // });
  */
  // Recipients object:
  let recipientsServerTemplate = docusign.Recipients.constructFromObject({
      // carbonCopies: [cc1], signers: [signer1], });
      signers: [signer1], });

  // create a composite template for the Server Template
  let compTemplate1 = docusign.CompositeTemplate.constructFromObject({
        compositeTemplateId: "1",
        serverTemplates: [
            docusign.ServerTemplate.constructFromObject({
                sequence: "1",
                templateId: args.templateID
            })
        ],
        // Add the roles via an inlineTemplate
        inlineTemplates: [
            docusign.InlineTemplate.constructFromObject({
                sequence: "1",
                recipients: recipientsServerTemplate
            })
        ]
  })



  // create the envelope definition
  let env = docusign.EnvelopeDefinition.constructFromObject({
      status: "sent",
      compositeTemplates: [compTemplate1]
  })

  //Set the Email Subject line and email message
  env.emailSubject = 'Membership Application.';
  env.emailBlurb = 'Please sign this document to complete your membership application.'

  return env;
}


async function openSigningCeremonyController (req, res) {
  const qp =req.body;

  // Fill in these constants or use query parameters of ACCESS_TOKEN, ACCOUNT_ID, USER_FULLNAME, USER_EMAIL
  // or environment variables.

  const accessToken = envir.DS_ACCESS_TOKEN || dsConfig.accessToken;

    // Obtain your accountId from demo.docusign.com -- the account id is shown in the drop down on the
    // upper right corner of the screen by your picture or the default picture.
  const accountId = envir.DS_ACCOUNTID || dsConfig.accountID;

  const templateID = envir.DS_TEMPLATEID || dsConfig.templateID;

  // Recipient Information:

  const signerName = qp.firstName + ' ' + qp.lastName;
  const signerEmail = qp.signerEmail;

  // CC Information

  const ccName = envir.DS_CC_NAME || dsConfig.ccName;
  const ccEmail = envir.DS_CC_EMAIL || dsConfig.ccEmail;

  const authenticationMethod = 'None' // How is this application authenticating
                                      // the signer? See the `authenticationMethod' definition
                                      // https://developers.docusign.com/esign-rest-api/reference/Envelopes/EnvelopeViews/createRecipient

  const signerAddress1 = qp.address1;
  const signerAddress2 = qp.address2;
  const signerAddress3 = qp.address3;
  const signerPhone    = qp.signerPhone;

  const envelopeArgs = {
        templateID: templateID,
        signerEmail: signerEmail,
        signerName: signerName,
        signerClientId: signerClientId,
        signerAddress1: signerAddress1,
        signerAddress2: signerAddress2,
        signerAddress3: signerAddress3,
        signerPhone: signerPhone,
        ccEmail: ccEmail,
        ccName: ccName,
      };

  const args = {
    accessToken: accessToken,
    basePath: basePath,
    accountId: accountId,
    envelopeArgs: envelopeArgs
  };

  const apiClient = new docusign.ApiClient();
  apiClient.setBasePath(basePath);
  apiClient.addDefaultHeader('Authorization', 'Bearer ' + accessToken);
  // Set the DocuSign SDK components to use the apiClient object
  docusign.Configuration.default.setDefaultApiClient(apiClient);

  let envelopesApi = new docusign.EnvelopesApi()
  // createEnvelopePromise returns a promise with the results:
  , createEnvelopePromise = promisify(envelopesApi.createEnvelope).bind(envelopesApi)
  , results
  ;

      // Step 1. Make the envelope request body
  let envelope = makeEnvelope(args.envelopeArgs)


  try {
    results = await createEnvelopePromise(accountId, {'envelopeDefinition': envelope})
    /**
     * Step 3. The envelope has been created.
     *         Request a Recipient View URL (the Signing Ceremony URL)
     */
    const envelopeId = results.envelopeId
        , recipientViewRequest = docusign.RecipientViewRequest.constructFromObject({
            authenticationMethod: authenticationMethod, clientUserId: signerClientId,
            recipientId: '1', returnUrl: baseUrl + '/ds-return',
            userName: signerName, email: signerEmail
          })
        , createRecipientViewPromise = promisify(envelopesApi.createRecipientView).bind(envelopesApi)
        ;

    results = await createRecipientViewPromise(accountId, envelopeId,
                      {recipientViewRequest: recipientViewRequest});
    /**
     * Step 4. The Recipient View URL (the Signing Ceremony URL) has been received.
     *         Redirect the user's browser to it.
     */
    res.redirect (results.url)
  } catch  (e) {
    // Handle exceptions
    let body = e.response && e.response.body;
    if (body) {
      // DocuSign API exception
      res.send (`<html lang="en"><body>
                  <h3>API problem</h3><p>Status code ${e.response.status}</p>
                  <p>Error message:</p><p><pre><code>${JSON.stringify(body, null, 4)}</code></pre></p>`);
    } else {
      // Not a DocuSign exception
      throw e;
    }
  }
}

// The mainline
const port = process.env.PORT || 5000
    , host = process.env.HOST || 'localhost'
const app = express()

app.use(express.static(path.join(__dirname, 'public')))
app.use(express.json());
app.use(express.urlencoded({
  extended: true
}));
app.set('views', path.join(__dirname, 'views'))
app.set('view engine', 'ejs')
app.get('/', commonControllers.indexController)
app.get('/ds-return', commonControllers.returnController)
app.post('/sign', openSigningCeremonyController)
app.listen(port, host);
console.log(`Your server is running on ${host}:${port}`);
