const docusign = require('docusign-esign')
    , path = require('path')
    , fs = require('fs')
    , process = require('process')
    , {promisify} = require('util') // http://2ality.com/2017/05/util-promisify.html
    , basePath = 'https://demo.docusign.net/restapi'
    , express = require('express')
    , envir = process.env
    , validator = require('validator')
    , dsConfig = require('./ds_configuration.js').config
    , signerClientId = 1000 // The id of the signer within this application.
    , dsReturnUrl = dsConfig.appUrl + '/ds-return'
    , dsPingUrl = dsConfig.appUrl + '/' // Url that will be pinged by the DocuSign Signing Ceremony via Ajax
    ;
// baseUrl is the url of the application's web server. Eg http://localhost:3000
// In some cases, this example can determine the baseUrl automatically.
// See the baseUrl statements at the end of this example.
let baseUrl = envir.BASE_URL || '{BASE_URL}'

function document1(args) {
  // Data for this method
  // args.signerEmail
  // args.signerName
  // args.ccEmail
  // args.ccName
  // args.item
  // args.quantity

  return `
  <!DOCTYPE html>
  <html>
      <head>
        <meta charset="UTF-8">
      </head>
      <body style="font-family:sans-serif;margin-left:2em;">
      <h1 style="font-family: 'Trebuchet MS', Helvetica, sans-serif;
          color: darkblue;margin-bottom: 0;">World Wide Corp</h1>
      <h2 style="font-family: 'Trebuchet MS', Helvetica, sans-serif;
        margin-top: 0px;margin-bottom: 3.5em;font-size: 1em;
        color: darkblue;">Order Processing Division</h2>
      <h4>Ordered by ${args.signerName}</h4>
      <p style="margin-top:0em; margin-bottom:0em;">Email: ${args.signerEmail}</p>
      <p style="margin-top:0em; margin-bottom:0em;">Copy to: ${args.ccName}, ${args.ccEmail}</p>
      <p style="margin-top:3em; margin-bottom:0em;">Item: <b>${args.item}</b>, quantity: <b>${args.quantity}</b> at market price.</p>
      <p style="margin-top:3em;">
Candy bonbon pastry jujubes lollipop wafer biscuit biscuit. Topping brownie sesame snaps sweet roll pie. Croissant danish biscuit soufflé caramels jujubes jelly. Dragée danish caramels lemon drops dragée. Gummi bears cupcake biscuit tiramisu sugar plum pastry. Dragée gummies applicake pudding liquorice. Donut jujubes oat cake jelly-o. Dessert bear claw chocolate cake gummies lollipop sugar plum ice cream gummies cheesecake.
      </p>
      <!-- Note the anchor tag for the signature field is in white. -->
      <h3 style="margin-top:3em;">Agreed: <span style="color:white;">**signature_1**/</span></h3>
      </body>
  </html>
`
}


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
  // args.signerName
  // args.signerClientId
  // args.ccEmail
  // args.ccName
  // args.templateId

  // The envelope request object uses Composite Template to
  // include in the envelope:
  // 1. A template stored on the DocuSign service
  // 2. An additional document which is a custom HTML source document

  // Create Recipients for server template. Note that Recipients object
  // is used, not TemplateRole
  //
  // Create a signer recipient for the signer role of the server template
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
                "tabLabel": "Address",
                "value": "Test Address",
                "locked": "true"
              },
              {
                "tabLabel": "Phone",
                "value": "Test Phone",
                "locked": "true"
              },
            ]
          },
      });
  // Create the cc recipient
  let cc1 = docusign.CarbonCopy.constructFromObject({
      email: args.ccEmail,
      name: args.ccName,
      roleName: "cc",
      recipientId: "2"
  });
  // Recipients object:
  let recipientsServerTemplate = docusign.Recipients.constructFromObject({
      carbonCopies: [cc1], signers: [signer1], });

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

  // The signer recipient for the added document with
  // a tab definition:
  let signHere1 = docusign.SignHere.constructFromObject({
      anchorString: '**signature_1**',
      anchorYOffset: '10', anchorUnits: 'pixels',
      anchorXOffset: '20'})
  ;
  let signer1Tabs = docusign.Tabs.constructFromObject({
      signHereTabs: [signHere1]});

  // Signer definition for the added document
  let signer1AddedDoc = docusign.Signer.constructFromObject({
      email: args.signerEmail,
      name: args.signerName,
      clientId: args.signerClientId,
      roleName: "signer",
      recipientId: "1",
      tabs: signer1Tabs
  });
  // Recipients object for the added document:
  let recipientsAddedDoc = docusign.Recipients.constructFromObject({
      carbonCopies: [cc1], signers: [signer1AddedDoc]});
  // create the HTML document
  let doc1 = new docusign.Document()
    , doc1b64 = Buffer.from(document1(args)).toString('base64');
  doc1.documentBase64 = doc1b64;
  doc1.name = 'Appendix 1--Sales order'; // can be different from actual file name
  doc1.fileExtension = 'html';
  doc1.documentId = '1';

  // create a composite template for the added document
  let compTemplate2 = docusign.CompositeTemplate.constructFromObject({
      compositeTemplateId: "2",
      // Add the recipients via an inlineTemplate
      inlineTemplates: [
          docusign.InlineTemplate.constructFromObject({
              sequence: "2",
              recipients: recipientsAddedDoc
          })
      ],
      document: doc1
  })

  // create the envelope definition
  let env = docusign.EnvelopeDefinition.constructFromObject({
      status: "sent",
      compositeTemplates: [compTemplate1, compTemplate2]
  })

  //Set the Email Subject line and email message
  env.emailSubject = 'Please sign this document sent from the Node example';
  env.emailBlurb = 'Please sign this document sent from the Node example.'

  return env;
}


async function openSigningCeremonyController (req, res) {
  const qp =req.query;
  // Fill in these constants or use query parameters of ACCESS_TOKEN, ACCOUNT_ID, USER_FULLNAME, USER_EMAIL
  // or environment variables.

  const accessToken = envir.DS_ACCESS_TOKEN || qp.DS_ACCESS_TOKEN || dsConfig.accessToken;

    // Obtain your accountId from demo.docusign.com -- the account id is shown in the drop down on the
    // upper right corner of the screen by your picture or the default picture.
  const accountId = envir.DS_ACCOUNTID || qp.DS_ACCOUNTID || dsConfig.accountID;

  const templateID = envir.DS_TEMPLATEID || qp.DS_TEMPLATEID || dsConfig.templateID;

  // Recipient Information:
  const signerName = envir.DS_SIGNER_EMAIL || qp.DS_SIGNER_EMAIL || dsConfig.signerName;
  const signerEmail = envir.USER_EMAIL || qp.USER_EMAIL || dsConfig.signerEmail;

  // CC Information

  const ccName = envir.DS_CC_NAME || qp.DS_CC_NAME || dsConfig.ccName;
  const ccEmail = envir.DS_CC_EMAIL || qp.DS_CC_EMAIL || dsConfig.ccEmail;

  const authenticationMethod = 'None' // How is this application authenticating
                                      // the signer? See the `authenticationMethod' definition
                                      // https://developers.docusign.com/esign-rest-api/reference/Envelopes/EnvelopeViews/createRecipient

  const envelopeArgs = {
        templateID: templateID,
        signerEmail: signerEmail,
        signerName: signerName,
        signerClientId: signerClientId,
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
            recipientId: '1', returnUrl: baseUrl + '/dsreturn',
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
                  <p>Email : ${signerEmail}</p>
                  <p>Error message:</p><p><pre><code>${JSON.stringify(body, null, 4)}</code></pre></p>`);
    } else {
      // Not a DocuSign exception
      throw e;
    }
  }
}

// The mainline
const port = process.env.PORT || 3000
    , host = process.env.HOST || 'localhost'
const app = express()

app.set('views', path.join(__dirname, 'views'))
app.set('view engine', 'ejs')
app.get('/', openSigningCeremonyController)
app.listen(port, host);
console.log(`Your server is running on ${host}:${port}`);
