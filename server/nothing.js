/*
 * SendPulse REST API Usage Example
 *
 * Documentation
 * https://sendpulse.com/api
 */

import sendpulse from "sendpulse-api";

/*
 * https://login.sendpulse.com/settings/#api
 */

var API_USER_ID = "880c5bfd398d984de6f65086d8e2e66a";
var API_SECRET = "ae9bf4ff1b71b778667cf809df1476ab";

var TOKEN_STORAGE = "/tmp/";

sendpulse.init(API_USER_ID, API_SECRET, TOKEN_STORAGE, function (token) {
  if (token && token.is_error) {
    // error handling
  }

  console.log("your token: " + token);

  /**
   * Function to process response data
   *
   * @param data
   */
  var answerGetter = function (data) {
    console.log(data);
  };

  var email = {
    token: token,
    html: "<h1>Example text</h1>",
    text: "Example text",
    subject: "Example subject",
    from: {
      name: "Alex",
      email: "some@domain.com",
    },
    to: [
      {
        name: "Piter",
        email: "godknowsegiboy00@gmail.com",
      },
    ],
  };
  sendpulse.smtpSendMail(answerGetter, email);
});
