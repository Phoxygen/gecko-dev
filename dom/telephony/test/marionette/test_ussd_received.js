/* Any copyright is dedicated to the Public Domain.
 * http://creativecommons.org/publicdomain/zero/1.0/ */

MARIONETTE_TIMEOUT = 90000;
MARIONETTE_HEAD_JS = 'head.js';

function testUssdReceivedViaSystemMessage() {
  log("testUssdReceivedViaSystemMessage");
  let type = 0; // type could be from 0 ~ 5.
  let msg = "test result";
  let cmd = "ussd unsol " + type + " " + msg;

  let p1 = gWaitForSystemMessage("ussd-received")
    .then(message => {
      is(message.session, null, "no session with type " + type); // message.session varies with the value of type
      is(message.message, msg, "ussd message: " + msg); // message.message is what you specify for "msg."
    });

  let p2 = emulator.runCmd(cmd);
  return Promise.all([p1, p2]);
}

function testUssdReceivedViaPromise() {
  log("testUssdReceivedViaPromise");
  let promises = [];
  let aMessage = "testmessage";
  let cmd = "ussd unsol 0 " + aMessage;

  let p1 = gSendMMI("*#1234#")
    .then( message => {
      is(message.statusMessage, aMessage, "Check statusMessage");
    });

  let p2 = emulator.runCmd(cmd);

  return Promise.all([p1, p2]);
}

function testUssdSessionCancel() {
  log("testUssdSessionCancel");
  let aMessage1 = "testmessage1";
  let aMessage2 = "testmessage2";
  // First unsol message should be routed via promise
  let cmd1 = "ussd unsol 1 " + aMessage1;
  // 2nd message should be delivered via system message
  let cmd2 = "ussd unsol 2 " + aMessage2;

  let p1 = gWaitForSystemMessage("ussd-received")
    .then(message => {
      is(message.message, aMessage2, "Check 2nd statusMessage");
    });

  let p2 = gSendMMI("*#1234#")
    .then( message => {
      is(message.statusMessage, aMessage1, "Check 1st statusMessage");
      let session = message.additionalInformation;
      session.cancel().then (
        () => {
          emulator.runCmd(cmd2);
        });
    });

  let p3 = emulator.runCmd(cmd1);

  return Promise.all([p1, p2, p3]);
}

function testFilteringNullMessages() {
  log("testFilteringNullMessages");
  let aMessage = "valid";
  let p1 = gSendMMI("*#1234#");
  let p2 = gSendMMI("*#1234#").then( message => {
    is(message.message, "aMessage", "Check message is not null");
  });

  let p3 = emulator.runCmd("ussd unsol 0").then( () => {
    emulator.runCmd("ussd unsol 0");
  }).then ( () => {
    emulator.runCmd("ussd unsol 0 " + aMessage);
  })

  return Promise.all([p1, p2, p3]);
}

function testUssdTimeout() {
  log("testUssdTimeout");
  return gSendMMI("*#1234#").then( (message) => {
    log("great, got exepcted timeout error");
    is (message.statusMessage, "TimeoutError");
  });
}


function testUssdTimeoutOnReply() {
  log("testUssdTimeoutOnReply");

  let cmd = "ussd unsol 1 dummy";

  let p1 = gSendMMI("*#1234#")
    .then( message => {
      log("got answer sending reply: " + JSON.stringify(message));
      is(message.statusMessage, "dummy");

      message.additionalInformation.send("test").then ( request => {
        request.then( () => {
          ok(false, "Expected a timeout");
        }). catch ( (error) => {
          is (error, "TimeoutError");
        })
      })
    });

  let p2 = emulator.runCmd(cmd);

  return Promise.all([p1, p2]);
}

startTest(function() {
  return testUssdReceivedViaSystemMessage()
    .then(testUssdReceivedViaPromise)
    .then(testUssdSessionCancel)
    /* disabled: needs support for null message in emulator */
    /* .then(testFilteringNullMessages) */
      .then(testUssdTimeout)
    .then(testUssdTimeoutOnReply)

    .catch(error => ok(false, "Promise reject: " + error))
    .then(finish);
});
